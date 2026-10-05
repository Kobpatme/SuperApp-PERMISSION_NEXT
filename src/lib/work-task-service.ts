import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, tasks, taskNotes, taskTransitions, userTeams, workMutationReceipts } from "@/db/schema";
import { assertAuthorized, type AuthorizationSubject } from "@/lib/authorization";
import { runMaterialChange } from "@/lib/material-change";
import { assertWorkCommand, workCommandSchema } from "@/lib/work-task-policy";
import { activeWorkHolidays, readWorkKpiCatalog, resolveTaskKpi } from "@/lib/work-kpi-catalog";
import { applyHoldStatusUpdate, toSourceWorkStatus } from "@/lib/work-sla";

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
    if (command.kind === "transition") {
      const hold=applyHoldStatusUpdate({ status:toSourceWorkStatus(current.status),deadline:current.dueAt?.toISOString(),extraData:current.holdData },toSourceWorkStatus(command.toStatus),await activeWorkHolidays(tx),now,context.actor.userId);
      if (hold.extraData) patch.holdData=hold.extraData;
      if (hold.deadline) { const date=hold.deadline.slice(0,10);patch.dueAt=new Date(`${date}T17:00:00+07:00`); }
      if(command.toStatus==="completed"&&current.subKpi?.toLowerCase().includes("open pr")) {
        if(!command.fundNumber||!command.amount)throw new Error("PR_DETAILS_REQUIRED");
        patch.extraData={...current.extraData,fundNumber:command.fundNumber,amount:command.amount};
      }
    }
    if (command.kind === "edit") Object.assign(patch, { title: command.title, description: command.description || null, priority: command.priority, dueAt: command.dueAt ? new Date(command.dueAt) : null, ownerId: command.ownerId, mainKpi: command.mainKpi || null, subKpi: command.subKpi || null, jobCode: command.jobCode });
    if(command.kind==="edit") {
      patch.extraData={...current.extraData,...(command.ssrNumber!==undefined?{ssrNumber:command.ssrNumber}:{}),...(command.ospNumber!==undefined?{ospNumber:command.ospNumber}:{})};
      if(current.teamId&&(command.ownerId!==current.ownerId||command.mainKpi!==(current.mainKpi??"")||command.subKpi!==(current.subKpi??"")||(command.ruleVersionId&&command.ruleVersionId!==current.slaRuleVersionId))) {
        const selected=(await readWorkKpiCatalog(tx)).find(r=>r.status==="active"&&r.config.teamId===current.teamId&&(command.ruleVersionId ? r.id===command.ruleVersionId : r.config.mainKpi===command.mainKpi&&r.config.subKpi===command.subKpi));
        if(!selected)throw new Error("KPI_RULE_NOT_AVAILABLE");
        const kpi=await resolveTaskKpi({teamId:current.teamId,userId:command.ownerId,ruleVersionId:selected.id,startDate:current.createdAt},tx);
        Object.assign(patch,{mainKpi:kpi.mainKpi,subKpi:kpi.subKpi,kpiWeight:kpi.kpiWeight,slaRuleVersionId:kpi.slaRuleVersionId,dueAt:kpi.dueAt});
      }
    }
    if (command.kind === "delete") Object.assign(patch, { deletedAt: now, deletedBy: context.actor.userId });
    if (command.kind === "restore") Object.assign(patch, { deletedAt: null, deletedBy: null });
    const eventType = command.kind === "transition" ? command.toStatus === "completed" ? "work.task.completed.v1" : "work.task.status_changed.v1" : `work.task.${command.kind === "note" ? "note_added" : command.kind === "edit" ? "edited" : command.kind === "delete" ? "deleted" : "restored"}.v1`;
    return runMaterialChange({
      audit: { actorId: context.actor.userId, moduleId: "work", action: `task.${command.kind}`, entityType: "task", entityId: current.id, requestId: context.requestId, before: { ...current }, after: { ...patch }, metadata: { command } },
      activity: { eventType, eventVersion: 1, actorId: context.actor.userId, ownerId: command.kind === "edit" ? command.ownerId : current.ownerId, teamId: current.teamId ?? undefined, moduleId: "work", entityType: "task", entityId: current.id, occurredAt: now, sourceSystem: "permission_next", sourceEventId: key, correlationId: context.correlationId, kpiEligible: eventType === "work.task.completed.v1", payload: { kind: command.kind, fromStatus: current.status, mainKpi:current.mainKpi,subKpi:current.subKpi,teamId:current.teamId,kpiWeight:current.kpiWeight,ruleVersionId:current.slaRuleVersionId, ...patch, ...(command.kind === "note" ? { body: command.body } : {}), ...(command.kind === "transition" ? { toStatus: command.toStatus, reason: command.reason } : {}) } },
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
