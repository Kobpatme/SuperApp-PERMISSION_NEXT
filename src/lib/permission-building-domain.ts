/** Building normalization and BOQ classification adapted from Permission_Next/app.js.
 * Date-based status is computed for display; this module never writes a record. */
export type LegacyBuilding = Record<string, unknown> & {
  id?: string | number; name_th?: string; name_eng?: string; status?: string; group?: string;
  type?: string; install_type?: string; area?: string; province?: string; update_date?: unknown;
  survey_type?: unknown; location?: unknown; duration?: unknown; wm_point?: unknown; enclosure?: unknown;
  max_horizontal?: unknown; address?: unknown; remark?: unknown; contact?: unknown;
  phone?: unknown; mobile?: unknown; email?: unknown; lat?: unknown; lng?: unknown;
  boq_profile?: { fees?: unknown[] } & Record<string, unknown>; other_fees?: unknown;
};
export type BoqFee = { key: string; source_field: string; label: string; calculation_type: "fixed" | "revenue_share";
  amount: number | null; rate: number | null; revenue_period: "monthly" | "annual" | null; unit: string; note: string;
  payable: boolean; category: string; cost_type: "CAPEX" | "OPEX" | "DEPOSIT" | "UNCLASSIFIED" };

function makeValidatedLocalDate(year: number, month: number, day: number) {
  if (![year, month, day].every(Number.isInteger)) return null;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function parseBuildingUpdateDate(value: unknown): Date | null {
  if (!value) return null;
  if (typeof value === "object" && value !== null && "toDate" in value && typeof value.toDate === "function") return parseBuildingUpdateDate(value.toDate());
  if (typeof value === "object" && value !== null) {
    const seconds = (value as Record<string, unknown>).seconds ?? (value as Record<string, unknown>)._seconds;
    if (typeof seconds === "number" && Number.isFinite(seconds)) return new Date(seconds * 1000);
  }
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return makeValidatedLocalDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const slash = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slash) {
    let year = Number(slash[3]);
    if (year < 100) year += 2000;
    if (year > 2400) year -= 543;
    return makeValidatedLocalDate(year, Number(slash[2]), Number(slash[1]));
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isBuildingUpdateStale(updateDate: unknown, today = new Date()) {
  const date = parseBuildingUpdateDate(updateDate);
  if (!date) return false;
  const before = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  before.setDate(before.getDate() - 365);
  return date < before;
}

export function effectivePermissionStatus(item: LegacyBuilding, today = new Date()) {
  const current = String(item.status || "").trim();
  if (["Check Permission", "MOU", "อาคารปิดถาวร"].includes(current)) return current;
  return isBuildingUpdateStale(item.update_date, today) ? "Check Permission" : current;
}

export function normalizePermissionBuilding(item: LegacyBuilding, today = new Date()) {
  const install = String(item.install_type || "").trim().toLowerCase();
  const installTypes: Record<string, string> = { building: "Building", "shopping mall": "Shopping Mall", "shopping mall (mou)": "Shopping Mall", mall: "Shopping Mall",
    nikom: "Nikom", "nikom (mou)": "Nikom", "data center": "Data center", market: "Market", airport: "Airport", port: "Port" };
  return { ...item, install_type: installTypes[install] || item.install_type || "", area: String(item.area || "").trim().toUpperCase().replace("ฺ", ""),
    status: effectivePermissionStatus(item, today) };
}

function nullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const number = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  return Number.isFinite(number) && number >= 0 ? number : null;
}

export function normalizeOtherFees(value: unknown) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((raw) => {
    const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const calculationType = item.calculation_type === "revenue_share" ? "revenue_share" as const : "fixed" as const;
    return { label: String(item.label || item.name || "").trim(), calculation_type: calculationType,
      amount: calculationType === "fixed" ? nullableNumber(item.amount ?? item.value ?? item.fee) : null,
      rate: calculationType === "revenue_share" ? nullableNumber(item.rate ?? item.percentage ?? item.amount) : null,
      revenue_period: calculationType === "revenue_share" ? item.revenue_period === "annual" ? "annual" as const : "monthly" as const : null,
      note: String(item.note || item.remark || "").trim() };
  }).filter((item) => item.label || item.amount !== null || item.rate !== null || item.note);
  if (typeof value === "object") return Object.entries(value).map(([label, amount]) => ({ label: label.trim(), calculation_type: "fixed" as const,
    amount: nullableNumber(amount), rate: null, revenue_period: null, note: "" })).filter((item) => item.label || item.amount !== null);
  return [];
}

const feeDefinitions = [
  { field: "damage_deposit", label: "เงินประกันติดตั้ง (Deposit)", payable: false, unit: "ครั้ง", category: "deposit", cost_type: "DEPOSIT" },
  { field: "contract_deposit", label: "ค่ามัดจำสัญญา", payable: true, unit: "ครั้ง", category: "deposit", cost_type: "DEPOSIT" },
  { field: "insurance_fee", label: "ค่าประกัน (Insurance)", payable: false, unit: "ครั้ง", category: "insurance", cost_type: "OPEX" },
  { field: "main_fee", label: "ค่าธรรมเนียม (Main Fee)", payable: true, unit: "ครั้ง", category: "building_fee", cost_type: "CAPEX" },
  { field: "annual_fee", label: "ค่าบริการรายปี (Annual Fee)", payable: true, unit: "ครั้ง", category: "building_fee", cost_type: "OPEX" },
  { field: "coordination_fee", label: "ค่าธรรมเนียมประสานงาน", payable: true, unit: "ครั้ง", category: "building_fee", cost_type: "CAPEX" },
  { field: "shaft_fee_per_floor", label: "ค่า Shaft ต่อชั้น", payable: true, unit: "ชั้น", category: "variable_fee", cost_type: "CAPEX" },
  { field: "horizontal_fee", label: "ค่าวางสายทั้งเส้น /ม.", payable: true, unit: "เมตร", category: "variable_fee", cost_type: "CAPEX" },
] as const;

export function resolveBuildingBoqCostType(item: Record<string, unknown>): BoqFee["cost_type"] {
  const explicit = String(item.cost_type || "").trim().toUpperCase();
  if (["CAPEX", "OPEX", "DEPOSIT", "UNCLASSIFIED"].includes(explicit)) return explicit as BoqFee["cost_type"];
  const key = String(item.source_field || item.key || "").trim(), category = String(item.category || "").trim();
  if (category === "deposit" || ["damage_deposit", "contract_deposit"].includes(key)) return "DEPOSIT";
  if (category === "insurance" || ["annual_fee", "insurance_fee"].includes(key)) return "OPEX";
  if (category === "other_fee") return "UNCLASSIFIED";
  if (["building_fee", "variable_fee"].includes(category)) return "CAPEX";
  return "UNCLASSIFIED";
}

export function normalizeBuildingBoqFee(raw: unknown, index = 0): BoqFee | null {
  const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const calculationType = item.calculation_type === "revenue_share" || item.category === "revenue_share" ? "revenue_share" as const : "fixed" as const;
  const amount = nullableNumber(item.amount);
  const rate = calculationType === "revenue_share" ? nullableNumber(item.rate ?? item.percentage ?? item.amount) : null;
  if (calculationType === "fixed" && amount === null || calculationType === "revenue_share" && rate === null) return null;
  return { key: String(item.key || item.source_field || `fee_${index + 1}`), source_field: String(item.source_field || item.key || ""),
    label: String(item.label || "ค่าใช้จ่ายอาคาร").trim(), calculation_type: calculationType,
    amount: calculationType === "fixed" ? amount : null, rate,
    revenue_period: calculationType === "revenue_share" ? item.revenue_period === "annual" ? "annual" : "monthly" : null,
    unit: calculationType === "revenue_share" ? "%" : String(item.unit || "ครั้ง").trim(), note: String(item.note || "").trim(),
    payable: item.payable !== false, category: calculationType === "revenue_share" ? "revenue_share" : String(item.category || "building_fee").trim(),
    cost_type: calculationType === "revenue_share" ? "OPEX" : resolveBuildingBoqCostType(item) };
}

export function buildBuildingBoqProfile(record: LegacyBuilding, existingProfile?: LegacyBuilding["boq_profile"]) {
  const managedSources = new Set([...feeDefinitions.map((item) => item.field), "other_fees"]);
  const external = (Array.isArray(existingProfile?.fees) ? existingProfile.fees : []).map(normalizeBuildingBoqFee).filter((fee): fee is BoqFee => Boolean(fee && !managedSources.has(fee.source_field)));
  const fees: BoqFee[] = feeDefinitions.map((definition) => normalizeBuildingBoqFee({ key: definition.field, source_field: definition.field,
    label: definition.label, amount: nullableNumber(record[definition.field]), unit: definition.unit, payable: definition.payable,
    category: definition.category, cost_type: definition.cost_type })).filter((fee): fee is BoqFee => Boolean(fee));
  normalizeOtherFees(record.other_fees).forEach((fee, index) => {
    const share = fee.calculation_type === "revenue_share";
    const normalized = normalizeBuildingBoqFee({ key: `other_fee_${index + 1}`, source_field: "other_fees", label: fee.label || "ค่าใช้จ่ายเพิ่มเติม",
      calculation_type: fee.calculation_type, amount: fee.amount, rate: fee.rate, revenue_period: fee.revenue_period,
      unit: share ? "%" : fee.note || "ครั้ง", note: fee.note, payable: true,
      category: share ? "revenue_share" : "other_fee", cost_type: share ? "OPEX" : "UNCLASSIFIED" }, index);
    if (normalized) fees.push(normalized);
  });
  fees.push(...external);
  const fixed = fees.filter((fee) => !["variable_fee", "revenue_share"].includes(fee.category));
  const total = (predicate: (fee: BoqFee) => boolean) => fixed.filter(predicate).reduce((sum, fee) => sum + (fee.amount || 0), 0);
  return { ...existingProfile, building_id: record.id ?? "", building_name_th: record.name_th || "", building_name_eng: record.name_eng || "",
    status: record.status || "", group: record.group || "", type: record.type || "", install_type: record.install_type || "",
    area: record.area || "", province: record.province || "", update_date: record.update_date || null, fees,
    payable_total: total((fee) => fee.payable), non_payable_total: total((fee) => !fee.payable),
    capex_total: total((fee) => fee.cost_type === "CAPEX"), opex_total: total((fee) => fee.cost_type === "OPEX"),
    deposit_total: total((fee) => fee.cost_type === "DEPOSIT"), unclassified_total: total((fee) => fee.cost_type === "UNCLASSIFIED"),
    variable_rate_count: fees.length - fixed.length, cost_classification_version: 1 };
}

/** Mirrors getBuildingBoqProfile: stored BOQ takes precedence over regenerated legacy fields. */
export function getBuildingBoqProfile(record: LegacyBuilding) {
  if (!Array.isArray(record.boq_profile?.fees)) return buildBuildingBoqProfile(record);
  const fees = record.boq_profile.fees.map(normalizeBuildingBoqFee).filter((fee): fee is BoqFee => Boolean(fee));
  const fixed = fees.filter((fee) => !["variable_fee", "revenue_share"].includes(fee.category));
  const total = (predicate: (fee: BoqFee) => boolean) => fixed.filter(predicate).reduce((sum, fee) => sum + (fee.amount || 0), 0);
  return { ...record.boq_profile, fees, payable_total: total((fee) => fee.payable), non_payable_total: total((fee) => !fee.payable),
    capex_total: total((fee) => fee.cost_type === "CAPEX"), opex_total: total((fee) => fee.cost_type === "OPEX"),
    deposit_total: total((fee) => fee.cost_type === "DEPOSIT"), unclassified_total: total((fee) => fee.cost_type === "UNCLASSIFIED"),
    variable_rate_count: fees.length - fixed.length, cost_classification_version: 1 };
}
