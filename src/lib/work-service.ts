import { and, eq } from "drizzle-orm";
import { manualWorkEntries, tasks, taskTransitions } from "@/db/schema";
import { assertAuthorized, type AuthorizationSubject } from "@/lib/authorization";
import { runMaterialChange } from "@/lib/material-change";
import { assertTaskTransition, parseManualWorkEntry, type TaskStatus } from "@/lib/work-domain";

export class ConcurrentWorkUpdateError extends Error {
  readonly status = 409;
  constructor() {
    super("The work item changed before this request completed");
    this.name = "ConcurrentWorkUpdateError";
  }
}

export async function transitionTask(input: {
  taskId: string; toStatus: TaskStatus; expectedVersion: number; reason?: string; idempotencyKey: string;
  actor: AuthorizationSubject; requestId: string; correlationId: string; occurredAt?: Date;
}) {
  const occurredAt = input.occurredAt ?? new Date();
  const current = await import("@/db").then(({ getDb }) => getDb().query.tasks.findFirst({ where: eq(tasks.id, input.taskId) }));
  if (!current) throw new ConcurrentWorkUpdateError();
  assertAuthorized(input.actor, "work.task.update", { ownerId: current.ownerId, teamId: current.teamId });
  assertTaskTransition(current.status as TaskStatus, input.toStatus);
  const nextVersion = input.expectedVersion + 1;
  const eventType = input.toStatus === "completed" ? "work.task.completed.v1" : "work.task.status_changed.v1";

  return runMaterialChange({
    audit: { actorId: input.actor.userId, moduleId: "work", action: "task.transition", entityType: "task", entityId: input.taskId, requestId: input.requestId, before: { status: current.status, version: current.version }, after: { status: input.toStatus, version: nextVersion }, metadata: { reason: input.reason ?? null } },
    activity: { eventType, eventVersion: 1, actorId: input.actor.userId, ownerId: current.ownerId, teamId: current.teamId ?? undefined, moduleId: "work", entityType: "task", entityId: input.taskId, buildingId: current.buildingId ?? undefined, projectId: current.projectId ?? undefined, occurredAt, sourceSystem: "permission_next", sourceEventId: input.idempotencyKey, correlationId: input.correlationId, kpiEligible: input.toStatus === "completed", payload: { fromStatus: current.status, toStatus: input.toStatus, reason: input.reason ?? null } },
    outbox: { topic: eventType, idempotencyKey: `outbox:${input.idempotencyKey}`, aggregateType: "task", aggregateId: input.taskId, payload: { taskId: input.taskId, ownerId: current.ownerId, fromStatus: current.status, toStatus: input.toStatus, occurredAt: occurredAt.toISOString() } },
  }, async (tx) => {
    const [updated] = await tx.update(tasks).set({ status: input.toStatus, completedAt: input.toStatus === "completed" ? occurredAt : null, version: nextVersion, updatedAt: occurredAt })
      .where(and(eq(tasks.id, input.taskId), eq(tasks.version, input.expectedVersion), eq(tasks.status, current.status))).returning();
    if (!updated) throw new ConcurrentWorkUpdateError();
    await tx.insert(taskTransitions).values({ taskId: input.taskId, fromStatus: current.status, toStatus: input.toStatus, reason: input.reason, actorId: input.actor.userId, idempotencyKey: input.idempotencyKey, occurredAt });
    return updated;
  });
}

export async function recordManualWork(raw: unknown, context: { actor: AuthorizationSubject; requestId: string; correlationId: string }) {
  const input = parseManualWorkEntry(raw);
  assertAuthorized(context.actor, "work.manual_entry.create", { ownerId: input.ownerId, teamId: input.teamId });
  const id = crypto.randomUUID();
  return runMaterialChange({
    audit: { actorId: context.actor.userId, moduleId: "work", action: "manual_entry.create", entityType: "manual_work_entry", entityId: id, requestId: context.requestId, after: { title: input.title, ownerId: input.ownerId, occurredAt: input.occurredAt.toISOString() }, metadata: { reason: input.reason } },
    activity: { eventType: "work.manual_entry.recorded.v1", eventVersion: 1, actorId: context.actor.userId, ownerId: input.ownerId, teamId: input.teamId ?? undefined, moduleId: "work", entityType: "manual_work_entry", entityId: id, buildingId: input.buildingId ?? undefined, projectId: input.projectId ?? undefined, occurredAt: input.occurredAt, sourceSystem: "permission_next", sourceEventId: input.idempotencyKey, correlationId: context.correlationId, kpiEligible: false, payload: { title: input.title, reason: input.reason } },
    outbox: { topic: "work.manual_entry.recorded.v1", idempotencyKey: `outbox:${input.idempotencyKey}`, aggregateType: "manual_work_entry", aggregateId: id, payload: { id, ownerId: input.ownerId, occurredAt: input.occurredAt.toISOString() } },
  }, async (tx) => {
    const [created] = await tx.insert(manualWorkEntries).values({ id, ...input, teamId: input.teamId ?? null, buildingId: input.buildingId ?? null, projectId: input.projectId ?? null, createdBy: context.actor.userId }).returning();
    return created;
  });
}
