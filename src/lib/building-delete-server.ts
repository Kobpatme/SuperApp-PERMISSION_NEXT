import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { attachments, buildingAliases, buildingConditionFees, buildingConditionVersions, buildingContacts, buildingSourceMappings, buildings, guaranteeCases, manualWorkEntries, priceEstimates, projects, tasks } from "@/db/schema";
import type { AccessContext } from "./access";
import { canDeleteBuilding } from "./building-delete-policy";
import { runMaterialChange, type MaterialChange } from "./material-change";

export class BuildingDeleteError extends Error {
  constructor(readonly code: "forbidden" | "not_found" | "confirmation_mismatch" | "building_changed" | "building_has_dependencies") { super(code); }
}

export async function deleteBuildingRecord(access: AccessContext, id: string, input: { confirmationName: string; version: number }, requestId: string) {
  if (!access.allowed || access.role !== "admin" || access.passwordChangeRequired || !access.userId) throw new BuildingDeleteError("forbidden");
  const change: MaterialChange = { audit: { actorId: access.userId, moduleId: "buildings", action: "building.delete", entityType: "building", entityId: id, requestId, after: null } };
  await runMaterialChange(change, async (tx) => {
    const [building] = await tx.select().from(buildings).where(eq(buildings.id, id)).for("update");
    if (!building) throw new BuildingDeleteError("not_found");
    if (!canDeleteBuilding(access, building.ownerTeamId)) throw new BuildingDeleteError("forbidden");
    if (building.version !== input.version) throw new BuildingDeleteError("building_changed");
    if (building.nameTh !== input.confirmationName.trim()) throw new BuildingDeleteError("confirmation_mismatch");
    // Preserve operational and financial relationships rather than detaching them.
    const dependencies = await Promise.all([
      tx.select({ id: tasks.id }).from(tasks).where(eq(tasks.buildingId, id)).limit(1),
      tx.select({ id: projects.id }).from(projects).where(eq(projects.buildingId, id)).limit(1),
      tx.select({ id: manualWorkEntries.id }).from(manualWorkEntries).where(eq(manualWorkEntries.buildingId, id)).limit(1),
      tx.select({ id: guaranteeCases.id }).from(guaranteeCases).where(eq(guaranteeCases.buildingId, id)).limit(1),
      tx.select({ id: priceEstimates.id }).from(priceEstimates).where(eq(priceEstimates.buildingId, id)).limit(1),
      tx.select({ id: attachments.id }).from(attachments).where(and(eq(attachments.entityId, id), eq(attachments.entityType, "building"))).limit(1),
    ]);
    if (dependencies.some((rows) => rows.length)) throw new BuildingDeleteError("building_has_dependencies");
    const [conditions, aliases, contacts, mappings] = await Promise.all([
      tx.select().from(buildingConditionVersions).where(eq(buildingConditionVersions.buildingId, id)),
      tx.select().from(buildingAliases).where(eq(buildingAliases.buildingId, id)),
      tx.select().from(buildingContacts).where(eq(buildingContacts.buildingId, id)),
      tx.select().from(buildingSourceMappings).where(eq(buildingSourceMappings.buildingId, id)),
    ]);
    const fees = conditions.length ? await tx.select().from(buildingConditionFees).where(inArray(buildingConditionFees.conditionVersionId, conditions.map((row) => row.id))) : [];
    change.audit.before = { building, conditions, fees, aliases, contacts, mappings };
    await tx.delete(buildingSourceMappings).where(eq(buildingSourceMappings.buildingId, id));
    await tx.delete(buildingConditionVersions).where(eq(buildingConditionVersions.buildingId, id));
    await tx.delete(buildings).where(eq(buildings.id, id));
  });
}
