import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, tasks, taskNotes, taskTransitions, userTeams, workMutationReceipts } from "@/db/schema";
import { assertAuthorized, type AuthorizationSubject } from "@/lib/authorization";
import { runMaterialChange } from "@/lib/material-change";
import { assertWorkCommand, workCommandSchema } from "@/lib/work-task-policy";

export class ConcurrentWorkUpdateError extends Error {
  readonly status = 409;
  constructor() { super("The work item changed before this request completed"); this.name = "ConcurrentWorkUpdateError"; }
}

/** Row lock serializes scope/version/replay checks with the mutation and evidence. */
export async function mutateWorkTask(raw: unknown, context: { actor: AuthorizationSubject; requestId: string; correlationId: string; occurredAt?: Date }) {
  const command = workCommandSchema.parse(raw);
  const now = context.occurredAt ?? new Date();
  const fingerprint = createHash("sha256").update(JSON.stringify(command)).digest("hex");
  return getDb().transaction(async (tx) => {
    const [current] = await tx.select().from(tasks).where(eq(tasks.id, command.taskId)).for("update");
    if (!current) throw new ConcurrentWorkUpdateError();
    const key = `${context.actor.userId}:${command.idempotencyKey}`;
    const [receipt] = await tx.select().from(workMutationReceipts).where(eq(workMutationReceipts.idempotencyKey, key));
    assertWorkCommand(context.actor, current, command, true);
    if (receipt) {
      if (receipt.taskId !== current.id || receipt.actorId !== context.actor.userId || receipt.fingerprint !== fingerprint) throw new ConcurrentWorkUpdateError();
      return { id: current.id, version: receipt.resultVersion, replayed: true };
    }
    if (current.version !== command.expectedVersion) throw new ConcurrentWorkUpdateError();
    assertWorkCommand(context.actor, current, command);
    if (command.kind === "edit" && command.ownerId !== current.ownerId) {
      assertAuthorized(context.actor, "work.task.assign", current);
      assertAuthorized(context.actor, "work.task.update", { ownerId: command.ownerId, teamId: current.teamId });
      const [target] = await tx.select({ id: profiles.id }).from(profiles).where(and(eq(profiles.id, command.ownerId), eq(profiles.status, "active")));
      const [membership] = current.teamId ? await tx.select().from(userTeams).where(and(eq(userTeams.userId, command.ownerId), eq(userTeams.teamId, current.teamId))) : [];
      if (!target || (current.teamId && !membership)) throw new Error("INVALID_OWNER");
    }
    const version = current.version + 1;
    const patch: Partial<typeof tasks.$inferInsert> = { version, updatedAt: now };
    if (command.kind === "transition") Object.assign(patch, { status: command.toStatus, completedAt: command.toStatus === "completed" ? now : null });
    if (command.kind === "edit") Object.assign(patch, { title: command.title, description: command.description || null, priority: command.priority, dueAt: command.dueAt ? new Date(command.dueAt) : null, ownerId: command.ownerId, mainKpi: command.mainKpi || null, subKpi: command.subKpi || null, jobCode: command.jobCode });
    if (command.kind === "delete") Object.assign(patch, { deletedAt: now, deletedBy: context.actor.userId });
    if (command.kind === "restore") Object.assign(patch, { deletedAt: null, deletedBy: null });
    const eventType = command.kind === "transition" ? command.toStatus === "completed" ? "work.task.completed.v1" : "work.task.status_changed.v1" : `work.task.${command.kind === "note" ? "note_added" : command.kind === "edit" ? "edited" : command.kind === "delete" ? "deleted" : "restored"}.v1`;
    return runMaterialChange({
      audit: { actorId: context.actor.userId, moduleId: "work", action: `task.${command.kind}`, entityType: "task", entityId: current.id, requestId: context.requestId, before: { ...current }, after: { ...patch }, metadata: { command } },
      activity: { eventType, eventVersion: 1, actorId: context.actor.userId, ownerId: command.kind === "edit" ? command.ownerId : current.ownerId, teamId: current.teamId ?? undefined, moduleId: "work", entityType: "task", entityId: current.id, occurredAt: now, sourceSystem: "permission_next", sourceEventId: key, correlationId: context.correlationId, kpiEligible: eventType === "work.task.completed.v1", payload: { kind: command.kind, fromStatus: current.status, ...patch, ...(command.kind === "note" ? { body: command.body } : {}), ...(command.kind === "transition" ? { toStatus: command.toStatus, reason: command.reason } : {}) } },
      outbox: { topic: eventType, idempotencyKey: `outbox:${key}`, aggregateType: "task", aggregateId: current.id, payload: { taskId: current.id, version } },
    }, async (inner) => {
      const [updated] = await inner.update(tasks).set(patch).where(and(eq(tasks.id, current.id), eq(tasks.version, command.expectedVersion))).returning({ id: tasks.id });
      if (!updated) throw new ConcurrentWorkUpdateError();
      if (command.kind === "note") await inner.insert(taskNotes).values({ taskId: current.id, authorId: context.actor.userId, body: command.body, createdBy: context.actor.userId, updatedBy: context.actor.userId });
      if (command.kind === "transition") await inner.insert(taskTransitions).values({ taskId: current.id, fromStatus: current.status, toStatus: command.toStatus, reason: command.reason, actorId: context.actor.userId, idempotencyKey: key, occurredAt: now });
      await inner.insert(workMutationReceipts).values({ idempotencyKey: key, taskId: current.id, actorId: context.actor.userId, fingerprint, resultVersion: version, createdBy: context.actor.userId, updatedBy: context.actor.userId });
      return { id: current.id, version, replayed: false };
    }, tx);
  });
}
