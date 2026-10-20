import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { activityEvents, attachments, buildingConditionVersions, buildings, guaranteeCases, priceEstimates, tasks } from "@/db/schema";
import { getAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { canDeleteBuilding } from "@/lib/building-delete-policy";

export async function getBuilding360(buildingId: string) {
  const access = await getAccessContext("buildings");
  if (!access.allowed || !process.env.DATABASE_URL) return null;
  const [building] = await getDb().select().from(buildings).where(eq(buildings.id, buildingId)).limit(1);
  if (!building || !isAuthorized(access.subject, "building.record.read", { teamId: building.ownerTeamId })) return null;
  const [taskRows, guaranteeRows, estimateRows, activityRows, attachmentRows, conditionRows] = await Promise.all([
    getDb().select().from(tasks).where(and(eq(tasks.buildingId, buildingId), isNull(tasks.deletedAt))).orderBy(desc(tasks.updatedAt)).limit(50),
    getDb().select().from(guaranteeCases).where(eq(guaranteeCases.buildingId, buildingId)).orderBy(desc(guaranteeCases.updatedAt)).limit(50),
    getDb().select().from(priceEstimates).where(eq(priceEstimates.buildingId, buildingId)).orderBy(desc(priceEstimates.updatedAt)).limit(50),
    getDb().select().from(activityEvents).where(eq(activityEvents.buildingId, buildingId)).orderBy(desc(activityEvents.occurredAt)).limit(100),
    getDb().select({ id: attachments.id, fileName: attachments.fileName, mediaType: attachments.mediaType, provider: attachments.provider,
      status: attachments.status, createdAt: attachments.createdAt }).from(attachments)
      .where(eq(attachments.entityId, buildingId)).orderBy(desc(attachments.createdAt)).limit(50),
    getDb().select().from(buildingConditionVersions).where(eq(buildingConditionVersions.buildingId, buildingId)).orderBy(desc(buildingConditionVersions.version)).limit(1),
  ]);
  const imported = conditionRows[0]?.conditions && typeof conditionRows[0].conditions === "object" ? conditionRows[0].conditions as Record<string, unknown> : {};
  const importedLat = Number(imported.lat), importedLng = Number(imported.lng);
  const legacyLat = Number.isFinite(importedLat) && importedLat >= -90 && importedLat <= 90 ? importedLat : null;
  const legacyLng = Number.isFinite(importedLng) && importedLng >= -180 && importedLng <= 180 ? importedLng : null;
  const latitude = building.latitude === null ? legacyLat : Number(building.latitude);
  const longitude = building.longitude === null ? legacyLng : Number(building.longitude);
  return {
    building,
    canDelete: canDeleteBuilding(access, building.ownerTeamId),
    location: { latitude, longitude, accuracy: building.locationAccuracy === null ? null : Number(building.locationAccuracy),
      source: building.locationSource ?? (latitude !== null && longitude !== null ? "import" : null), verified: building.locationVerified,
      address: building.address ?? String(imported.address ?? ""), subdistrict: building.subdistrict ?? String(imported.subdistrict ?? ""),
      district: building.district ?? String(imported.district ?? ""), province: building.province ?? String(imported.province ?? ""),
      postcode: building.postcode ?? String(imported.postcode ?? ""), placeId: building.longdoPlaceId,
      canUpdate: isAuthorized(access.subject, "building.record.update", { teamId: building.ownerTeamId }) },
    tasks: taskRows.filter(row => isAuthorized(access.subject, "work.task.read", { ownerId: row.ownerId, teamId: row.teamId })),
    guarantees: guaranteeRows.filter(row => isAuthorized(access.subject, "guarantee.case.read", { ownerId: row.ownerId, teamId: row.teamId })),
    estimates: estimateRows.filter(row => isAuthorized(access.subject, "pricing.estimate.read", { ownerId: row.ownerId, teamId: row.teamId })),
    activities: activityRows.filter(row => isAuthorized(access.subject, "activity.event.read", { ownerId: row.ownerId, teamId: row.teamId })),
    attachments: isAuthorized(access.subject, "building.attachment.read", { teamId: building.ownerTeamId }) ? attachmentRows : [],
  };
}

