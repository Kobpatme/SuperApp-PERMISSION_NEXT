import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { activityEvents, attachments, buildings, guaranteeCases, priceEstimates, tasks } from "@/db/schema";
import { getAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";

export async function getBuilding360(buildingId: string) {
  const access = await getAccessContext("buildings");
  if (!access.allowed || !process.env.DATABASE_URL) return null;
  const [building] = await getDb().select().from(buildings).where(eq(buildings.id, buildingId)).limit(1);
  if (!building || !isAuthorized(access.subject, "building.record.read", { teamId: building.ownerTeamId })) return null;
  const [taskRows, guaranteeRows, estimateRows, activityRows, attachmentRows] = await Promise.all([
    getDb().select().from(tasks).where(eq(tasks.buildingId, buildingId)).orderBy(desc(tasks.updatedAt)).limit(50),
    getDb().select().from(guaranteeCases).where(eq(guaranteeCases.buildingId, buildingId)).orderBy(desc(guaranteeCases.updatedAt)).limit(50),
    getDb().select().from(priceEstimates).where(eq(priceEstimates.buildingId, buildingId)).orderBy(desc(priceEstimates.updatedAt)).limit(50),
    getDb().select().from(activityEvents).where(eq(activityEvents.buildingId, buildingId)).orderBy(desc(activityEvents.occurredAt)).limit(100),
    getDb().select({ id: attachments.id, fileName: attachments.fileName, mediaType: attachments.mediaType, provider: attachments.provider,
      status: attachments.status, createdAt: attachments.createdAt }).from(attachments)
      .where(eq(attachments.entityId, buildingId)).orderBy(desc(attachments.createdAt)).limit(50),
  ]);
  return {
    building,
    tasks: taskRows.filter(row => isAuthorized(access.subject, "work.task.read", { ownerId: row.ownerId, teamId: row.teamId })),
    guarantees: guaranteeRows.filter(row => isAuthorized(access.subject, "guarantee.case.read", { ownerId: row.ownerId, teamId: row.teamId })),
    estimates: estimateRows.filter(row => isAuthorized(access.subject, "pricing.estimate.read", { ownerId: row.ownerId, teamId: row.teamId })),
    activities: activityRows.filter(row => isAuthorized(access.subject, "activity.event.read", { ownerId: row.ownerId, teamId: row.teamId })),
    attachments: isAuthorized(access.subject, "building.attachment.read", { teamId: building.ownerTeamId }) ? attachmentRows : [],
  };
}
