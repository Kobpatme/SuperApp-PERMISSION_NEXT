import "server-only";
import { and, asc, count, desc, eq, gt, ilike, inArray, lt, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { buildingConditionFees, buildingConditionVersions, buildings } from "@/db/schema";
import { getAccessContext, type AccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { getBuildingBoqProfile, normalizePermissionBuilding, type LegacyBuilding } from "@/lib/permission-building-domain";
import { decodeBuildingCursor, encodeBuildingCursor, type BuildingQuery } from "@/lib/building-query";
import { normalizeBuildingAlias } from "@/lib/buildings";

export type PermissionBuildingRow = {
  id: string; code: string; nameTh: string; nameEn: string | null; ownerTeamId: string | null;
  status: string; group: string; type: string; surveyType: string; area: string; province: string;
  installType: string; updateDate: string; location: string; duration: string; wmPoint: string;
  enclosure: string; maxHorizontal: string; address: string; remark: string; contact: string;
  phone: string; mobile: string; email: string; lat: number | null; lng: number | null;
  locationAccuracy: number | null; locationSource: string | null; locationVerified: boolean; locationUpdatedAt: string | null;
  subdistrict: string; district: string; postcode: string; longdoPlaceId: string | null; canUpdateLocation: boolean;
  conditionVersion: number | null; boq: ReturnType<typeof getBuildingBoqProfile> | null; feeReviewRequired: boolean;
  conditionEffectiveAt: string | null;
  feeReviewValues: Array<{ sourceField: string; label: string; rawValue: string }>;
};

const stringValue = (value: unknown) => String(value ?? "").trim();
const feeReviewLabels: Record<string, string> = {
  damage_deposit: "เงินประกันติดตั้ง",
  contract_deposit: "ค่ามัดจำสัญญา",
  insurance_fee: "ค่าประกัน",
  main_fee: "ค่าธรรมเนียม",
  annual_fee: "ค่าบริการรายปี",
  coordination_fee: "ค่าธรรมเนียมประสานงาน",
  shaft_fee_per_floor: "ค่า Shaft ต่อชั้น",
  horizontal_fee: "ค่าวางสายทั้งเส้น",
};
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
  previousCursor: string | null; nextCursor: string | null;
}> {
  const { query, page: safePage, limit } = input;
  const empty = (state: "ready" | "not_configured" | "unavailable") => ({ items: [], state, total: 0, page: safePage, pageSize: limit, previousCursor: null, nextCursor: null });
  const access = await getAccessContext("buildings");
  if (!access.allowed) return empty("unavailable");
  if (!process.env.DATABASE_URL) return empty("not_configured");
  const scope = readScope(access);
  if (!scope) return empty("ready");
  try {
    const searchTokens = normalizeBuildingAlias(query.slice(0, 120)).split(/\s+/).filter(Boolean)
      .map((token) => token.replace(/[\\%_]/g, "\\$&"));
    const jsonKeys = { status: "status", group: "group", type: "type", installType: "install_type", surveyType: "survey_type", area: "area" } as const;
    const filters = Object.entries(jsonKeys).flatMap(([key, jsonKey]) => {
      const value = input[key as keyof typeof jsonKeys];
      return value ? [sql`exists (select 1 from ${buildingConditionVersions} bcv where bcv.building_id = ${buildings.id} and bcv.version = (select max(latest.version) from ${buildingConditionVersions} latest where latest.building_id = ${buildings.id}) and bcv.conditions ->> ${jsonKey} = ${value})`] : [];
    });
    const after = decodeBuildingCursor(input.after);
    const before = decodeBuildingCursor(input.before);
    if ((input.after && !after) || (input.before && !before)) return empty("ready");
    const cursorPredicate = after ? or(gt(buildings.nameTh, after.nameTh), and(eq(buildings.nameTh, after.nameTh), gt(buildings.id, after.id)))
      : before ? or(lt(buildings.nameTh, before.nameTh), and(eq(buildings.nameTh, before.nameTh), lt(buildings.id, before.id))) : undefined;
    const predicate = and(scope, input.buildingId ? eq(buildings.id, input.buildingId) : undefined,
      ...searchTokens.map((token) => ilike(buildings.searchText, `%${token}%`)), ...filters);
    const db = getDb();
    const [tally] = await db.select({ value: count() }).from(buildings).where(predicate);
    const total = tally?.value ?? 0;
    const currentPage = input.after || input.before ? Math.min(safePage, Math.max(1, Math.ceil(total / limit))) : 1;
    const rowsInQueryOrder = await db.select().from(buildings).where(and(predicate, cursorPredicate))
      .orderBy(before ? desc(buildings.nameTh) : asc(buildings.nameTh), before ? desc(buildings.id) : asc(buildings.id)).limit(limit + 1);
    const hasMore = rowsInQueryOrder.length > limit;
    const boundedRows = rowsInQueryOrder.slice(0, limit);
    const rows = before ? boundedRows.reverse() : boundedRows;
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
      const migration = legacy._migration && typeof legacy._migration === "object" ? legacy._migration as Record<string, unknown> : {};
      const feeReviewRequired = Boolean(migration.fee_review_required);
      const reviewFields = Array.isArray(migration.fee_review_fields) ? migration.fee_review_fields.map(String) : [];
      const reviewValues = migration.fee_review_values && typeof migration.fee_review_values === "object" ? migration.fee_review_values as Record<string, unknown> : {};
      const feeReviewValues = reviewFields.map((sourceField) => ({
        sourceField,
        label: feeReviewLabels[sourceField] ?? sourceField,
        rawValue: stringValue(reviewValues[sourceField] ?? legacy[sourceField]),
      })).filter((item) => item.rawValue);
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
        address: stringValue(row.address ?? normalized.address), remark: stringValue(normalized.remark), contact: stringValue(normalized.contact),
        phone: stringValue(normalized.phone), mobile: stringValue(normalized.mobile), email: stringValue(normalized.email),
        lat: coordinate(row.latitude ?? normalized.lat, -90, 90), lng: coordinate(row.longitude ?? normalized.lng, -180, 180),
        locationAccuracy: coordinate(row.locationAccuracy, 0, 10_000_000), locationSource: row.locationSource,
        locationVerified: row.locationVerified, locationUpdatedAt: row.locationUpdatedAt?.toISOString() ?? null,
        subdistrict: row.subdistrict ?? "", district: row.district ?? "", postcode: row.postcode ?? "", longdoPlaceId: row.longdoPlaceId,
        canUpdateLocation: isAuthorized(access.subject, "building.record.update", { teamId: row.ownerTeamId }),
        conditionVersion: condition?.version ?? null,
        boq: condition ? getBuildingBoqProfile({ ...normalized, boq_profile: { fees: normalizedFees } }) : null,
        conditionEffectiveAt: condition?.effectiveFrom.toISOString() ?? null,
        feeReviewRequired, feeReviewValues } satisfies PermissionBuildingRow;
    });
    const first = rows[0], last = rows.at(-1);
    const previousCursor = first && (Boolean(input.after) || (Boolean(input.before) && hasMore)) ? encodeBuildingCursor({ nameTh: first.nameTh, id: first.id }) : null;
    const nextCursor = last && (Boolean(input.before) || hasMore) ? encodeBuildingCursor({ nameTh: last.nameTh, id: last.id }) : null;
    return { items, state: "ready", total, page: currentPage, pageSize: limit, previousCursor, nextCursor };
  } catch (error) {
    console.error("Unable to load central building records", error);
    return empty("unavailable");
  }
}
