import "server-only";
import { and, asc, desc, eq, ne, or, sql } from "drizzle-orm";
import { getDb, type DatabaseTransaction } from "@/db";
import { buildingConditionFees, buildingConditionVersions, buildings } from "@/db/schema";
import { type AccessContext, getAccessContext } from "./access";
import { isAuthorized } from "./authorization";
import { buildingEditorSchema, buildingFeeDefinitions, composeBuildingConditions, composeBuildingFees, installationKeys,
  normalizeDuplicateName } from "./building-editor";
import { prepareBuildingInput } from "./buildings";
import { locationUpdateSchema } from "./building-location";
import { runMaterialChange, type MaterialChange } from "./material-change";
import type { z } from "zod";

export const buildingRecordSchema = buildingEditorSchema.extend({ location: locationUpdateSchema.optional() });
export class BuildingEditorError extends Error {
  constructor(readonly code: "forbidden" | "not_found" | "building_changed" | "building_duplicate" | "invalid_building") { super(code); }
}

async function latestCondition(tx: DatabaseTransaction, id: string) {
  const [condition] = await tx.select().from(buildingConditionVersions).where(eq(buildingConditionVersions.buildingId, id)).orderBy(desc(buildingConditionVersions.version)).limit(1);
  const fees = condition ? await tx.select().from(buildingConditionFees).where(eq(buildingConditionFees.conditionVersionId, condition.id)).orderBy(asc(buildingConditionFees.sourceKey)) : [];
  return { condition, fees };
}

export async function saveBuildingRecord(access: AccessContext, raw: z.infer<typeof buildingRecordSchema>, requestId: string, id?: string) {
  if (!access.userId || !access.allowed || access.passwordChangeRequired) throw new BuildingEditorError("forbidden");
  const input = buildingRecordSchema.parse(raw);
  const buildingId = id ?? crypto.randomUUID();
  const now = new Date();
  const change: MaterialChange = { audit: { actorId: access.userId, moduleId: "buildings", action: id ? "building.update" : "building.create",
    entityType: "building", entityId: buildingId, requestId } };
  await runMaterialChange(change, async tx => {
    // Serialize duplicate-sensitive writes across this service without introducing a schema migration.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('building-editor-duplicates'))`);
    const [before] = id ? await tx.select().from(buildings).where(eq(buildings.id, id)).for("update").limit(1) : [];
    if (id && (!before || !isAuthorized(access.subject, "building.record.read", { teamId: before.ownerTeamId }))) throw new BuildingEditorError("not_found");
    const identity = prepareBuildingInput({ code: input.code || before?.code || `BLD-${buildingId.slice(0, 12)}`, nameTh: input.nameTh.normalize("NFC"),
      nameEn: input.nameEn === undefined ? before?.nameEn ?? undefined : input.nameEn.normalize("NFC"), ownerTeamId: input.ownerTeamId === undefined ? before?.ownerTeamId : input.ownerTeamId });
    if (!isAuthorized(access.subject, id ? "building.record.update" : "building.record.create", { teamId: identity.ownerTeamId, ownerId: access.userId }) ||
      before && !isAuthorized(access.subject, "building.record.update", { teamId: before.ownerTeamId })) throw new BuildingEditorError("forbidden");
    if (before && (!input.version || before.version !== input.version)) throw new BuildingEditorError("building_changed");
    const { condition, fees } = id ? await latestCondition(tx, buildingId) : { condition: undefined, fees: [] };
    const oldConditions = condition?.conditions ?? {};
    const conditions = composeBuildingConditions(input, oldConditions, now);
    const oldLatitude = before?.latitude ?? oldConditions.lat;
    const oldLongitude = before?.longitude ?? oldConditions.lng;
    const latitude = input.location?.latitude ?? (input.conditions ? input.conditions.lat : oldLatitude == null || oldLatitude === "" ? null : Number(oldLatitude));
    const longitude = input.location?.longitude ?? (input.conditions ? input.conditions.lng : oldLongitude == null || oldLongitude === "" ? null : Number(oldLongitude));
    const nameChanged = !before || normalizeDuplicateName(identity.nameTh) !== normalizeDuplicateName(before.nameTh) || normalizeDuplicateName(identity.nameEn || "") !== normalizeDuplicateName(before.nameEn || "");
    const coordinateChanged = !before || latitude !== (before.latitude == null ? null : Number(before.latitude)) || longitude !== (before.longitude == null ? null : Number(before.longitude));
    if (nameChanged || coordinateChanged || identity.code !== before?.code) {
      const normalized = (column: typeof buildings.nameTh | typeof buildings.nameEn) => sql`regexp_replace(lower(normalize(coalesce(${column}, ''), NFC)), '[[:space:]]', '', 'g')`;
      const coordinate = (column: typeof buildings.latitude | typeof buildings.longitude, key: "lat" | "lng") => sql`coalesce(${column}, (select case when bc.conditions ->> ${key} ~ '^-?[0-9]+([.][0-9]+)?$' then (bc.conditions ->> ${key})::numeric else null end from ${buildingConditionVersions} bc where bc.building_id = ${buildings.id} order by bc.version desc limit 1))`;
      const [duplicate] = await tx.select({ id: buildings.id }).from(buildings).where(and(ne(buildings.id, buildingId), or(
        eq(buildings.code, identity.code), sql`${normalized(buildings.nameTh)} = ${normalizeDuplicateName(identity.nameTh)}`,
        identity.nameEn ? sql`${normalized(buildings.nameEn)} = ${normalizeDuplicateName(identity.nameEn)}` : undefined,
        latitude !== null && longitude !== null ? sql`round(${coordinate(buildings.latitude, "lat")},6) = round(${String(latitude)}::numeric,6) and round(${coordinate(buildings.longitude, "lng")},6) = round(${String(longitude)}::numeric,6)` : undefined,
      ))).limit(1);
      if (duplicate) throw new BuildingEditorError("building_duplicate");
    }
    const locationChanged = coordinateChanged || Boolean(input.location);
    const hasCoordinates = latitude !== null && longitude !== null;
    const location = input.location;
    const values = { code: identity.code, nameTh: identity.nameTh, nameEn: identity.nameEn, ownerTeamId: identity.ownerTeamId,
      searchText: `${identity.searchText} ${String(conditions.location ?? "").normalize("NFC").toLocaleLowerCase("th-TH")}`.trim(),
      status: before?.status === "merged" ? "merged" : conditions.status === "อาคารปิดถาวร" ? "inactive" : "active",
      version: (before?.version ?? 0) + 1, updatedAt: now,
      latitude: latitude === null ? null : String(latitude), longitude: longitude === null ? null : String(longitude),
      address: location?.address ?? (input.conditions ? input.conditions.address || null : before?.address),
      province: location?.province ?? (input.conditions ? input.conditions.province || null : before?.province),
      ...(locationChanged ? { locationSource: hasCoordinates ? location?.source ?? "manual_pin" : null, locationVerified: hasCoordinates,
        locationVerifiedAt: hasCoordinates ? now : null, locationVerifiedBy: hasCoordinates ? access.userId : null, locationUpdatedAt: now,
        locationAccuracy: location?.accuracy == null ? null : String(location.accuracy), longdoPlaceId: location?.placeId ?? null } : {}),
      ...(location ? { subdistrict: location.subdistrict ?? null, district: location.district ?? null, postcode: location.postcode ?? null } : {}),
    };
    if (before) {
      const changed = await tx.update(buildings).set(values).where(and(eq(buildings.id, buildingId), eq(buildings.version, input.version!))).returning({ id: buildings.id });
      if (!changed.length) throw new BuildingEditorError("building_changed");
    } else await tx.insert(buildings).values({ id: buildingId, ...values });
    Object.assign(conditions, { lat: latitude, lng: longitude, address: values.address ?? "", province: values.province ?? "" });
    const conditionVersion = (condition?.version ?? 0) + 1;
    if (condition) await tx.update(buildingConditionVersions).set({ effectiveUntil: now }).where(eq(buildingConditionVersions.id, condition.id));
    const [created] = await tx.insert(buildingConditionVersions).values({ buildingId, version: conditionVersion, effectiveFrom: now,
      conditions, reason: input.reason ?? (id ? "ปรับปรุงข้อมูลอาคาร" : "เริ่มต้นข้อมูลอาคาร"), createdBy: access.userId }).returning({ id: buildingConditionVersions.id });
    const nextFees = composeBuildingFees(input, fees);
    if (nextFees.length) await tx.insert(buildingConditionFees).values(nextFees.map(fee => ({ ...fee, conditionVersionId: created.id })));
    change.audit.before = before ? { building: before, conditions: oldConditions, fees } : null;
    change.audit.after = { id: buildingId, ...values, conditions, fees: nextFees, conditionVersion };
    change.activity = { eventType: id ? "building.updated" : "building.created", eventVersion: 1, actorId: access.userId, teamId: identity.ownerTeamId ?? undefined,
      moduleId: "buildings", entityType: "building", entityId: buildingId, buildingId, occurredAt: now, sourceSystem: "permission-next", sourceEventId: requestId,
      correlationId: requestId, payload: { conditionVersion, version: values.version } };
    change.outbox = { topic: id ? "building.updated" : "building.created", idempotencyKey: `building-editor:${requestId}`, aggregateType: "building", aggregateId: buildingId,
      payload: { buildingId, conditionVersion, version: values.version } };
  });
  return buildingId;
}

export async function getBuildingEditor(id: string) {
  const access = await getAccessContext("buildings");
  if (!access.allowed || access.passwordChangeRequired) return null;
  const db = getDb();
  const [building] = await db.select().from(buildings).where(eq(buildings.id, id)).limit(1);
  if (!building || !isAuthorized(access.subject, "building.record.read", { teamId: building.ownerTeamId }) || !isAuthorized(access.subject, "building.record.update", { teamId: building.ownerTeamId })) return null;
  const [condition] = await db.select().from(buildingConditionVersions).where(eq(buildingConditionVersions.buildingId, id)).orderBy(desc(buildingConditionVersions.version)).limit(1);
  const fees = condition ? await db.select().from(buildingConditionFees).where(eq(buildingConditionFees.conditionVersionId, condition.id)).orderBy(asc(buildingConditionFees.sourceKey)) : [];
  return { building, conditions: condition?.conditions ?? {}, fees };
}

// Preserve source inputs as text; never round money via a JavaScript number when prefilling.
export function buildingEditorInitial(data: NonNullable<Awaited<ReturnType<typeof getBuildingEditor>>>) {
  const legacy = data.conditions;
  const amount = (key: string) => data.fees.find(fee => fee.sourceKey === key)?.amount ?? legacy[key] ?? "";
  const profile = legacy.installation_profile ?? legacy.calculation_profile;
  const installation = profile && typeof profile === "object" ? profile as Record<string, unknown> : {};
  const storedOther = data.fees.filter(fee => /^other_fee_/.test(fee.sourceKey));
  const other = Array.isArray(legacy.other_fees) ? legacy.other_fees : legacy.other_fees && typeof legacy.other_fees === "object" ? Object.entries(legacy.other_fees).map(([label, value]) => ({ label, amount: value })) : [];
  return { code: data.building.code, nameTh: data.building.nameTh, nameEn: data.building.nameEn ?? "", ownerTeamId: data.building.ownerTeamId ?? "", version: data.building.version,
    conditions: { ...Object.fromEntries(Object.entries(legacy).filter(([, value]) => value === null || ["string", "number"].includes(typeof value)).map(([key, value]) => [key, String(value ?? "")])),
      lat: String(data.building.latitude ?? legacy.lat ?? ""), lng: String(data.building.longitude ?? legacy.lng ?? ""), address: data.building.address ?? String(legacy.address ?? ""), province: data.building.province ?? String(legacy.province ?? "") },
    fees: Object.fromEntries(buildingFeeDefinitions.map(fee => [fee.key, String(amount(fee.key))])), installation: Object.fromEntries(installationKeys.map(key => [key, String(installation[key] ?? "")])),
    otherFees: storedOther.length ? storedOther.map(fee => ({ key: fee.sourceKey, label: fee.label, calculationType: fee.calculationType as "fixed" | "revenue_share", value: String(fee.calculationType === "revenue_share" ? fee.rate ?? "" : fee.amount ?? ""), revenuePeriod: fee.revenuePeriod === "annual" ? "annual" as const : "monthly" as const, note: fee.note ?? "" })) : other.map((value, index) => {
      const fee = value as Record<string, unknown>; const share = fee.calculation_type === "revenue_share";
      return { key: `other_fee_${index + 1}`, label: String(fee.label ?? fee.name ?? ""), calculationType: share ? "revenue_share" as const : "fixed" as const, value: String(share ? fee.rate ?? fee.percentage ?? "" : fee.amount ?? fee.value ?? ""), revenuePeriod: fee.revenue_period === "annual" ? "annual" as const : "monthly" as const, note: String(fee.note ?? fee.remark ?? "") };
    }) };
}
