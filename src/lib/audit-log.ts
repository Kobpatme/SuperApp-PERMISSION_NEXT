import { getDb } from "@/db";
import { auditLogs, pendingAuditLogs } from "@/db/schema";

export type AuditEvent = {
  actorId?: string;
  moduleId: string;
  action: string;
  entityType: string;
  entityId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(event: AuditEvent) {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for audit logging");
  const isDevelopmentActor = event.actorId === "development-session";
  await getDb().insert(auditLogs).values({
    actorId: isDevelopmentActor ? null : event.actorId || null,
    moduleId: event.moduleId,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId || null,
    requestId: event.requestId || crypto.randomUUID(),
    metadata: isDevelopmentActor ? { ...event.metadata, actorType: "development-session" } : event.metadata || {},
  });
}

/** Persist an external-side-effect audit intent when the primary audit insert cannot complete. */
export async function queuePendingAuditLog(event: AuditEvent, error: unknown) {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for pending audit logging");
  const isDevelopmentActor = event.actorId === "development-session";
  await getDb().insert(pendingAuditLogs).values({
    actorId: isDevelopmentActor ? null : event.actorId || null,
    moduleId: event.moduleId,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId || null,
    requestId: event.requestId || crypto.randomUUID(),
    before: null,
    after: null,
    metadata: isDevelopmentActor ? { ...event.metadata, actorType: "development-session" } : event.metadata || {},
    lastError: error instanceof Error ? error.message.slice(0, 1000) : String(error).slice(0, 1000),
  });
}
