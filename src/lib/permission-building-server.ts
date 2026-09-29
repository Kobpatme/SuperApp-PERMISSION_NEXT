import "server-only";
import { and, count, desc, eq, ilike, inArray, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { buildingConditionFees, buildingConditionVersions, buildings } from "@/db/schema";
import { getAccessContext, type AccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { getBuildingBoqProfile, normalizePermissionBuilding, type LegacyBuilding } from "@/lib/permission-building-domain";
import type { BuildingQuery } from "@/lib/building-query";

export type PermissionBuildingRow = {
  id: string; code: string; nameTh: string; nameEn: string | null; ownerTeamId: string | null;
  status: string; group: string; type: string; surveyType: string; area: string; province: string;
  installType: string; updateDate: string; location: string; duration: string; wmPoint: string;
  enclosure: string; maxHorizontal: string; address: string; remark: string; contact: string;
  phone: string; mobile: string; email: string; lat: number | null; lng: number | null;
  conditionVersion: number | null; boq: ReturnType<typeof getBuildingBoqProfile> | null; feeReviewRequired: boolean;
};

const stringValue = (value: unknown) => String(value ?? "").trim();
function coordinate(value: unknown, minimum: number, maximum: number): number | null {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum ? number : null;
}

function readScope(access: AccessContext): SQL | undefined {
  const grants = access.subject?.grants.filter((grant) => grant.permission === "building.record.read") ?? [];
  if (grants.some((grant) => grant.scope === "ALL")) return eq(buildings.id, buildings.id);
  const teams = new Set<string>();
  if (grants.some((grant) => grant.scope === "TEAM")) access.subject?.teamIds.forEach((id) => teams.add(id));
  grants.filter((grant) => grant.scope === "SELECTED_TEAMS" && grant.selectedTeamId).forEach((grant) => teams.add(grant.selectedTeamId!));
  return teams.size ? inArray(buildings.ownerTeamId, [...teams]) : undefined;
}

export async function listPermissionBuildings(input: BuildingQuery): Promise<{
  items: PermissionBuildingRow[]; state: "ready" | "not_configured" | "unavailable"; total: number; page: number; pageSize: number;
}> {
  const { query, page: safePage, limit } = input;
  const empty = (state: "ready" | "not_configured" | "unavailable") => ({ items: [], state, total: 0, page: safePage, pageSize: limit });
  const access = await getAccessContext("buildings");
  if (!access.allowed) return empty("unavailable");
  if (!process.env.DATABASE_URL) return empty("not_configured");
  const scope = readScope(access);
  if (!scope) return empty("ready");
  try {
    const search = query.trim().slice(0, 120).replace(/[\\%_]/g, "\\$&");
    const jsonKeys = { status: "status", group: "group", type: "type", installType: "install_type", surveyType: "survey_type", area: "area" } as const;
    const filters = Object.entries(jsonKeys).flatMap(([key, jsonKey]) => {
      const value = input[key as keyof typeof jsonKeys];
      return value ? [sql`exists (select 1 from ${buildingConditionVersions} bcv where bcv.building_id = ${buildings.id} and bcv.version = (select max(latest.version) from ${buildingConditionVersions} latest where latest.building_id = ${buildings.id}) and bcv.conditions ->> ${jsonKey} = ${value})`] : [];
    });
    const predicate = and(scope, ...(search ? [ilike(buildings.searchText, `%${search}%`)] : []), ...filters);
    const db = getDb();
    const [tally] = await db.select({ value: count() }).from(buildings).where(predicate);
    const total = tally?.value ?? 0;
    const currentPage = Math.min(safePage, Math.max(1, Math.ceil(total / limit)));
    const rows = await db.select().from(buildings).where(predicate).orderBy(buildings.nameTh, buildings.id).limit(limit).offset((currentPage - 1) * limit);
    const visible = rows.filter((row) => isAuthorized(access.subject, "building.record.read", { teamId: row.ownerTeamId }));
    const versions = visible.length ? await db.select().from(buildingConditionVersions)
      .where(inArray(buildingConditionVersions.buildingId, visible.map((row) => row.id)))
      .orderBy(desc(buildingConditionVersions.version)) : [];
    const latest = new Map<string, (typeof versions)[number]>();
    versions.forEach((version) => { if (!latest.has(version.buildingId)) latest.set(version.buildingId, version); });
    const fees = latest.size ? await db.select().from(buildingConditionFees)
      .where(inArray(buildingConditionFees.conditionVersionId, [...latest.values()].map((version) => version.id))) : [];
    const feesByVersion = new Map<string, typeof fees>();
    fees.forEach((fee) => feesByVersion.set(fee.conditionVersionId, [...(feesByVersion.get(fee.conditionVersionId) ?? []), fee]));
    const items = visible.map((row) => {
      const condition = latest.get(row.id);
      const legacy = (condition?.conditions ?? {}) as LegacyBuilding;
      const normalized = normalizePermissionBuilding({ ...legacy, id: row.code, name_th: row.nameTh, name_eng: row.nameEn ?? "" });
      const feeReviewRequired = Boolean((legacy._migration as { fee_review_required?: boolean } | undefined)?.fee_review_required);
      const normalizedFees = condition ? (feesByVersion.get(condition.id) ?? []).map((fee) => ({
        key: fee.sourceKey, source_field: fee.sourceKey, label: fee.label, category: fee.category,
        cost_type: fee.costType, calculation_type: fee.calculationType, amount: fee.amount,
        rate: fee.rate, unit: fee.unit, revenue_period: fee.revenuePeriod, payable: fee.payable, note: fee.note,
      })) : [];
      return { id: row.id, code: row.code, nameTh: row.nameTh, nameEn: row.nameEn, ownerTeamId: row.ownerTeamId,
        status: stringValue(normalized.status), group: stringValue(normalized.group), type: stringValue(normalized.type),
        surveyType: stringValue(normalized.survey_type), area: stringValue(normalized.area), province: stringValue(normalized.province),
        installType: stringValue(normalized.install_type), updateDate: stringValue(normalized.update_date),
        location: stringValue(normalized.location), duration: stringValue(normalized.duration), wmPoint: stringValue(normalized.wm_point),
        enclosure: stringValue(normalized.enclosure), maxHorizontal: stringValue(normalized.max_horizontal),
        address: stringValue(normalized.address), remark: stringValue(normalized.remark), contact: stringValue(normalized.contact),
        phone: stringValue(normalized.phone), mobile: stringValue(normalized.mobile), email: stringValue(normalized.email),
        lat: coordinate(normalized.lat, -90, 90), lng: coordinate(normalized.lng, -180, 180),
        conditionVersion: condition?.version ?? null,
        boq: condition && !feeReviewRequired ? getBuildingBoqProfile({ ...normalized, boq_profile: { fees: normalizedFees } }) : null,
        feeReviewRequired } satisfies PermissionBuildingRow;
    });
    return { items, state: "ready", total, page: currentPage, pageSize: limit };
  } catch (error) {
    console.error("Unable to load central building records", error);
    return empty("unavailable");
  }
}
