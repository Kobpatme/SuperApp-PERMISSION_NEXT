/** Promote a previously staged Permission_Next CSV into canonical building tables.
 * Local development only. Financially malformed rows retain their raw CSV in staging
 * and are explicitly marked for review rather than silently parsed as amounts. */
import { createHash } from "node:crypto";
import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local" });

export const legacyColumns = [
  "id", "name_th", "name_eng", "status", "group", "type", "install_type", "survey_type",
  "area", "province", "location", "lat", "lng", "wm_point", "enclosure", "max_horizontal",
  "damage_deposit", "contract_deposit", "insurance_fee", "main_fee", "annual_fee", "coordination_fee",
  "shaft_fee_per_floor", "horizontal_fee", "installation_profile", "other_fees", "duration", "update_date",
  "address", "contact", "phone", "mobile", "email", "remark",
];
export const feeFields = ["damage_deposit", "contract_deposit", "insurance_fee", "main_fee", "annual_fee",
  "coordination_fee", "shaft_fee_per_floor", "horizontal_fee"];
const feeDefinitions = [
  ["damage_deposit", "เงินประกันติดตั้ง", "deposit", "DEPOSIT", false, "ครั้ง"],
  ["contract_deposit", "ค่ามัดจำสัญญา", "deposit", "DEPOSIT", true, "ครั้ง"],
  ["insurance_fee", "ค่าประกัน", "insurance", "OPEX", false, "ครั้ง"],
  ["main_fee", "ค่าธรรมเนียม", "building_fee", "CAPEX", true, "ครั้ง"],
  ["annual_fee", "ค่าบริการรายปี", "building_fee", "OPEX", true, "ครั้ง"],
  ["coordination_fee", "ค่าธรรมเนียมประสานงาน", "building_fee", "CAPEX", true, "ครั้ง"],
  ["shaft_fee_per_floor", "ค่า Shaft ต่อชั้น", "variable_fee", "CAPEX", true, "ชั้น"],
  ["horizontal_fee", "ค่าวางสายทั้งเส้น", "variable_fee", "CAPEX", true, "เมตร"],
];
const numeric = /^\d+(?:,\d{3})*(?:\.\d+)?$|^\d+(?:\.\d+)?$/;

export function mapStagedBuilding(row) {
  const raw = Object.fromEntries(legacyColumns.map((key, index) => [key, String(row[`c${String(index + 1).padStart(2, "0")}`] ?? "").trim()]));
  if (!raw.id || !raw.name_th) throw new Error("Staged row needs ID and Thai building name");
  const feeReviewFields = feeFields.filter((key) => raw[key] && !numeric.test(raw[key]));
  const conditions = Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== ""));
  for (const field of feeFields) {
    if (feeReviewFields.length || !raw[field]) delete conditions[field];
    else conditions[field] = Number(raw[field].replaceAll(",", ""));
  }
  for (const field of ["installation_profile", "other_fees"]) {
    if (!raw[field]) continue;
    try { conditions[field] = JSON.parse(raw[field]); }
    catch { throw new Error(`Invalid ${field} JSON for source ID ${raw.id}`); }
  }
  conditions._migration = { source: "permission_next_csv", fee_review_required: feeReviewFields.length > 0, fee_review_fields: feeReviewFields };
  const fees = feeReviewFields.length ? [] : feeDefinitions.flatMap(([sourceKey, label, category, costType, payable, unit]) =>
    raw[sourceKey] ? [{ sourceKey, label, category, costType, payable, unit, calculationType: "fixed", amount: raw[sourceKey].replaceAll(",", ""), rate: null, revenuePeriod: null, note: null }] : []);
  if (!feeReviewFields.length && conditions.other_fees) {
    const other = Array.isArray(conditions.other_fees) ? conditions.other_fees : typeof conditions.other_fees === "object" ? Object.entries(conditions.other_fees).map(([label, amount]) => ({ label, amount })) : [];
    other.forEach((entry, index) => {
      const fee = entry && typeof entry === "object" ? entry : {};
      const calculationType = fee.calculation_type === "revenue_share" ? "revenue_share" : "fixed";
      const value = calculationType === "revenue_share" ? fee.rate ?? fee.percentage ?? fee.amount : fee.amount ?? fee.value ?? fee.fee;
      if (value == null || value === "" || !numeric.test(String(value))) return;
      fees.push({ sourceKey: `other_fee_${index + 1}`, label: String(fee.label ?? fee.name ?? "ค่าใช้จ่ายเพิ่มเติม"),
        category: calculationType === "revenue_share" ? "revenue_share" : "other_fee",
        costType: calculationType === "revenue_share" ? "OPEX" : "UNCLASSIFIED", payable: true,
        unit: calculationType === "revenue_share" ? "%" : "ครั้ง", calculationType,
        amount: calculationType === "fixed" ? String(value).replaceAll(",", "") : null,
        rate: calculationType === "revenue_share" ? String(value).replaceAll(",", "") : null,
        revenuePeriod: calculationType === "revenue_share" ? fee.revenue_period === "annual" ? "annual" : "monthly" : null,
        note: String(fee.note ?? "") || null });
    });
  }
  const code = `PN-${createHash("sha256").update(raw.id).digest("hex").slice(0, 16).toUpperCase()}`;
  const searchText = [code, raw.name_th, raw.name_eng, raw.location].filter(Boolean).join(" ").normalize("NFC").toLocaleLowerCase("th-TH");
  return { sourceId: raw.id, code, nameTh: raw.name_th, nameEn: raw.name_eng || null,
    status: raw.status === "อาคารปิดถาวร" ? "inactive" : "active", searchText, conditions, feeReviewFields, fees };
}

async function main() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is required in .env.local");
  const url = new URL(value);
  if (!["127.0.0.1", "localhost"].includes(url.hostname) || url.pathname !== "/permission_superapp_dev")
    throw new Error("This importer only runs against the local permission_superapp_dev database");
  const sql = postgres(value, { max: 1, prepare: false });
  try {
    const rows = await sql`select * from migration_staging.staging_permission_buildings_csv order by c01`;
    const records = rows.map(mapStagedBuilding);
    const ids = new Set(records.map((item) => item.sourceId));
    if (ids.size !== records.length) throw new Error("Duplicate source IDs in staging");
    const review = records.filter((item) => item.feeReviewFields.length).length;
    console.log(`Validated ${records.length} buildings; ${review} need financial review. Mode: ${process.argv.includes("--apply") ? "APPLY" : "DRY RUN"}.`);
    if (!process.argv.includes("--apply")) return;
    const counts = await sql.begin(async (tx) => {
      const [team] = await tx`insert into teams (code, name) values ('permission', 'Permission')
        on conflict (code) do update set name = excluded.name returning id`;
      let inserted = 0, skipped = 0;
      for (const item of records) {
        const existing = await tx`select building_id from building_source_mappings
          where source_system = 'permission_next' and source_id = ${item.sourceId}`;
        if (existing.length) { skipped++; continue; }
        const [building] = await tx`insert into buildings (code, name_th, name_en, status, search_text, owner_team_id)
          values (${item.code}, ${item.nameTh}, ${item.nameEn}, ${item.status}, ${item.searchText}, ${team.id}) returning id`;
        await tx`insert into building_source_mappings (building_id, source_system, source_id, raw_name)
          values (${building.id}, 'permission_next', ${item.sourceId}, ${item.nameTh})`;
        const [version] = await tx`insert into building_condition_versions (building_id, version, effective_from, conditions, reason)
          values (${building.id}, 1, now(), ${tx.json(item.conditions)}, 'Initial Permission_Next CSV import') returning id`;
        for (const fee of item.fees) {
          await tx`insert into building_condition_fees (condition_version_id, source_key, label, category, cost_type, calculation_type,
            amount, rate, unit, revenue_period, payable, note)
            values (${version.id}, ${fee.sourceKey}, ${fee.label}, ${fee.category}, ${fee.costType}, ${fee.calculationType},
              ${fee.amount}, ${fee.rate}, ${fee.unit}, ${fee.revenuePeriod}, ${fee.payable}, ${fee.note})`;
        }
        inserted++;
      }
      return { inserted, skipped };
    });
    console.log(`Imported ${counts.inserted}; already mapped ${counts.skipped}; fee-review rows ${review}.`);
  } finally { await sql.end(); }
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("/import-permission-csv-staging.mjs"))
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
