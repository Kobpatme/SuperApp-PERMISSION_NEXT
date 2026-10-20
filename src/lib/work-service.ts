import { manualWorkEntries } from "@/db/schema";
import { assertAuthorized, type AuthorizationSubject } from "@/lib/authorization";
import { runMaterialChange } from "@/lib/material-change";
import { parseManualWorkEntry, type TaskStatus } from "@/lib/work-domain";
import { mutateWorkTask } from "@/lib/work-task-service";
export { ConcurrentWorkUpdateError } from "@/lib/work-task-service";

export async function transitionTask(input: {
  taskId: string; toStatus: TaskStatus; expectedVersion: number; reason?: string; idempotencyKey: string;
  actor: AuthorizationSubject; requestId: string; correlationId: string; occurredAt?: Date;
}) {
  return mutateWorkTask({ kind: "transition", taskId: input.taskId, toStatus: input.toStatus, expectedVersion: input.expectedVersion, reason: input.reason ?? "", idempotencyKey: input.idempotencyKey }, input);
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

