import { activityEvents, auditLogs, outboxMessages } from "@/db/schema";
import { getDb, type DatabaseTransaction } from "@/db";

type JsonObject = Record<string, unknown>;

export type MaterialChange = {
  audit: {
    actorId?: string;
    moduleId: string;
    action: string;
    entityType: string;
    entityId?: string;
    requestId: string;
    before?: JsonObject | null;
    after?: JsonObject | null;
    metadata?: JsonObject;
  };
  activity?: {
    eventType: string;
    eventVersion: number;
    actorId?: string;
    ownerId?: string;
    teamId?: string;
    moduleId: string;
    entityType: string;
    entityId: string;
    buildingId?: string;
    projectId?: string;
    correctionOfEventId?: string;
    kpiEligible?: boolean;
    occurredAt: Date;
    sourceSystem: string;
    sourceEventId: string;
    correlationId: string;
    payload: JsonObject;
  };
  outbox?: {
    topic: string;
    idempotencyKey: string;
    aggregateType: string;
    aggregateId: string;
    payload: JsonObject;
  };
};

/** A material mutation, audit record, business event and outbox row commit or roll back together. */
export async function runMaterialChange<T>(change: MaterialChange, mutate: (tx: DatabaseTransaction) => Promise<T>) {
  return getDb().transaction(async (tx) => {
    const result = await mutate(tx);
    await tx.insert(auditLogs).values({
      ...change.audit,
      actorId: change.audit.actorId ?? null,
      entityId: change.audit.entityId ?? null,
      before: change.audit.before ?? null,
      after: change.audit.after ?? null,
      metadata: change.audit.metadata ?? {},
    });
    if (change.activity) {
      await tx.insert(activityEvents).values({
        ...change.activity,
        actorId: change.activity.actorId ?? null,
        ownerId: change.activity.ownerId ?? null,
        teamId: change.activity.teamId ?? null,
        buildingId: change.activity.buildingId ?? null,
        projectId: change.activity.projectId ?? null,
        correctionOfEventId: change.activity.correctionOfEventId ?? null,
        kpiEligible: change.activity.kpiEligible ?? false,
      });
    }
    if (change.outbox) await tx.insert(outboxMessages).values(change.outbox);
    return result;
  });
}
