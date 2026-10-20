import { z } from "zod";
import Decimal from "decimal.js";
import { buildingInputSchema } from "./buildings";
import { normalizePermissionBuilding } from "./permission-building-domain";

// Field inventory: Permission_Next@afaee997, building-editor-form and saveBuildingFromForm.
const text = (max = 240) => z.string().trim().max(max).default("");
const decimal = (scale = 2, positive = false) => z.preprocess(value => value === "" || value == null ? null : value,
  z.string().trim().regex(new RegExp(`^\\d{1,16}(?:\\.\\d{1,${scale}})?$`)).refine(value => !positive || new Decimal(value).gt(0)).transform(value => new Decimal(value).toFixed(scale)).nullable());
const coordinate = (min: number, max: number) => z.preprocess(value => value === "" || value == null ? null : value,
  z.union([z.string().trim().regex(/^-?\d+(?:\.\d+)?$/), z.number()]).transform(Number).refine(value => Number.isFinite(value) && value >= min && value <= max).nullable());
export const buildingFeeDefinitions = [
  { key: "damage_deposit", label: "เงินประกันติดตั้ง", category: "deposit", costType: "DEPOSIT", payable: false, unit: "ครั้ง" },
  { key: "contract_deposit", label: "ค่ามัดจำสัญญา", category: "deposit", costType: "DEPOSIT", payable: true, unit: "ครั้ง" },
  { key: "insurance_fee", label: "ค่าประกัน", category: "insurance", costType: "OPEX", payable: false, unit: "ครั้ง" },
  { key: "main_fee", label: "ค่าธรรมเนียม", category: "building_fee", costType: "CAPEX", payable: true, unit: "ครั้ง" },
  { key: "annual_fee", label: "ค่าบริการรายปี", category: "building_fee", costType: "OPEX", payable: true, unit: "ครั้ง" },
  { key: "coordination_fee", label: "ค่าธรรมเนียมประสานงาน", category: "building_fee", costType: "CAPEX", payable: true, unit: "ครั้ง" },
  { key: "shaft_fee_per_floor", label: "ค่า Shaft ต่อชั้น", category: "variable_fee", costType: "CAPEX", payable: true, unit: "ชั้น" },
  { key: "horizontal_fee", label: "ค่าวางสายทั้งเส้นต่อเมตร", category: "variable_fee", costType: "CAPEX", payable: true, unit: "เมตร" },
] as const;
export type BuildingFeeKey = (typeof buildingFeeDefinitions)[number]["key"];
export const installationKeys = ["meters_per_floor", "cable_rate_per_meter", "equipment_cost", "odf_cost", "splice_cost"] as const;
export const buildingConditionsSchema = z.object({
  status: text(80), group: text(80), type: text(80), install_type: text(80), survey_type: text(80),
  duration: text(40).refine(value => !value || /^\d+$/.test(value)), area: text(80), province: text(100), location: text(500),
  lat: coordinate(-90, 90), lng: coordinate(-180, 180), wm_point: text(), enclosure: text(40),
  max_horizontal: decimal(), address: text(1000), contact: text(), phone: text(100), mobile: text(100),
  email: text().refine(value => !value || z.string().email().safeParse(value).success), remark: text(5000),
}).strict().refine(value => (value.lat === null) === (value.lng === null), { path: ["lat"], message: "coordinate_pair_required" });
const otherFeeSchema = z.object({
  key: z.string().regex(/^other_fee_[A-Za-z0-9_-]+$/).max(100), label: z.string().trim().min(1).max(240),
  calculationType: z.enum(["fixed", "revenue_share"]), value: decimal(4), revenuePeriod: z.enum(["monthly", "annual"]), note: text(500),
}).strict().superRefine((fee, context) => {
  if (fee.value === null || fee.calculationType === "revenue_share" && new Decimal(fee.value).gt(100) ||
    fee.calculationType === "fixed" && new Decimal(fee.value).decimalPlaces() > 2) context.addIssue({ code: "custom", path: ["value"], message: "invalid_fee_value" });
});
const feeValue = decimal().optional();
export const buildingEditorSchema = buildingInputSchema.extend({
  code: z.string().trim().max(40).regex(/^[A-Za-z0-9._-]*$/).refine(value => !value || value.length >= 2).default(""),
  conditions: buildingConditionsSchema.optional(),
  fees: z.object({ damage_deposit: feeValue, contract_deposit: feeValue, insurance_fee: feeValue, main_fee: feeValue, annual_fee: feeValue, coordination_fee: feeValue, shaft_fee_per_floor: feeValue, horizontal_fee: feeValue }).strict().optional(),
  installation: z.object({ meters_per_floor: decimal(4, true), cable_rate_per_meter: decimal(), equipment_cost: decimal(), odf_cost: decimal(), splice_cost: decimal() }).strict().optional(),
  otherFees: z.array(otherFeeSchema).max(50).refine(fees => new Set(fees.map(fee => fee.key)).size === fees.length).optional(),
  version: z.number().int().positive().optional(), reason: z.string().trim().min(1).max(500).optional(),
}).strict();
export type BuildingEditorInput = z.infer<typeof buildingEditorSchema>;
export type BuildingConditions = z.infer<typeof buildingConditionsSchema>;
export type EditorOtherFee = z.infer<typeof otherFeeSchema>;
export type StoredEditorFee = { sourceKey: string; label: string; category: string; costType: string; calculationType: string;
  amount: string | null; rate: string | null; unit: string; revenuePeriod: string | null; payable: boolean; note: string | null };

export function normalizeDuplicateName(name: string) { return name.normalize("NFC").trim().toLocaleLowerCase("th-TH").replace(/\s+/g, ""); }

export function composeBuildingConditions(input: BuildingEditorInput, previous: Record<string, unknown>, now: Date) {
  const result: Record<string, unknown> = normalizePermissionBuilding({ ...previous, ...input.conditions, update_date: now.toISOString().slice(0, 10) }, now);
  if (input.fees) Object.assign(result, input.fees);
  if (input.installation) {
    const old = previous.installation_profile ?? previous.calculation_profile;
    const profile = { ...(old && typeof old === "object" ? old : {}), version: 1, floor_count_mode: "inclusive", cable_route_basis: "total_distance", updated_at: now.toISOString() } as Record<string, unknown>;
    installationKeys.forEach(key => { delete profile[key]; if (input.installation![key] !== null) profile[key] = input.installation![key]; });
    result.installation_profile = profile;
    delete result.calculation_profile;
  }
  if (input.otherFees) result.other_fees = input.otherFees.map(fee => ({ label: fee.label, calculation_type: fee.calculationType,
    amount: fee.calculationType === "fixed" ? new Decimal(fee.value!).toFixed(2) : null, rate: fee.calculationType === "revenue_share" ? fee.value : null,
    revenue_period: fee.calculationType === "revenue_share" ? fee.revenuePeriod : null, note: fee.note }));
  // Imported review flags remain until an explicit reconciliation; editing contact data cannot clear them.
  return result;
}

export function composeBuildingFees(input: BuildingEditorInput, previous: StoredEditorFee[]) {
  const managed = new Set<string>(buildingFeeDefinitions.map(fee => fee.key));
  const result = previous.filter(fee => !(input.fees && managed.has(fee.sourceKey) && Object.hasOwn(input.fees, fee.sourceKey)) && !(input.otherFees && /^other_fee_/.test(fee.sourceKey))).map(fee => ({
    sourceKey: fee.sourceKey, label: fee.label, category: fee.category, costType: fee.costType,
    calculationType: fee.calculationType, amount: fee.amount, rate: fee.rate, unit: fee.unit,
    revenuePeriod: fee.revenuePeriod, payable: fee.payable, note: fee.note,
  }));
  if (input.fees) for (const fee of buildingFeeDefinitions) {
    const amount = input.fees[fee.key];
    if (amount != null) result.push({ sourceKey: fee.key, label: fee.label, category: fee.category, costType: fee.costType, payable: fee.payable,
      calculationType: "fixed", amount, rate: null, unit: fee.unit, revenuePeriod: null, note: previous.find(old => old.sourceKey === fee.key)?.note ?? null });
  }
  if (input.otherFees) for (const fee of input.otherFees) {
    const share = fee.calculationType === "revenue_share";
    result.push({ sourceKey: fee.key, label: fee.label, category: share ? "revenue_share" : "other_fee", costType: share ? "OPEX" : "UNCLASSIFIED",
      calculationType: fee.calculationType, amount: share ? null : new Decimal(fee.value!).toFixed(2), rate: share ? fee.value : null,
      revenuePeriod: share ? fee.revenuePeriod : null, payable: true, unit: share ? "%" : "ครั้ง", note: fee.note });
  }
  return result;
}
