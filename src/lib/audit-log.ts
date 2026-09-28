import { getDb } from "@/db";
import { auditLogs } from "@/db/schema";

type AuditEvent = {
  actorId?: string;
  moduleId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(event: AuditEvent) {
  if (!process.env.DATABASE_URL || event.actorId === "development-session") return;
  await getDb().insert(auditLogs).values({
    actorId: event.actorId || null,
    moduleId: event.moduleId,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId || null,
    requestId: crypto.randomUUID(),
    metadata: event.metadata || {},
  });
}
