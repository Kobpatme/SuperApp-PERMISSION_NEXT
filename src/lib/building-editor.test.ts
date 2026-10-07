import { describe, expect, it } from "vitest";
import { buildingEditorSchema, composeBuildingConditions, composeBuildingFees, normalizeDuplicateName } from "./building-editor";

const identity = { nameTh: "อาคารทดสอบ", nameEn: "Test building", ownerTeamId: null };
describe("source building editor parity", () => {
  it("accepts a source-style new record without requiring a manually assigned code", () => {
    expect(buildingEditorSchema.parse(identity).code).toBe("");
  });
  it("retains exact decimal cents, source BOQ categories, null fields and external fee metadata", () => {
    const input = buildingEditorSchema.parse({ ...identity, fees: { damage_deposit: "9999999999999999.99", annual_fee: "1200.10" },
      otherFees: [{ key: "other_fee_1", label: "ส่วนแบ่งรายได้", calculationType: "revenue_share", value: "12.3456", revenuePeriod: "annual", note: "เงื่อนไขทดสอบ" }] });
    const fees = composeBuildingFees(input, [{ sourceKey: "external_contract", label: "external", category: "contract", costType: "CAPEX", calculationType: "fixed", amount: "5.00", rate: null, unit: "ครั้ง", revenuePeriod: null, payable: false, note: "preserve" }]);
    expect(fees.find(fee => fee.sourceKey === "damage_deposit")).toMatchObject({ amount: "9999999999999999.99", costType: "DEPOSIT", payable: false });
    expect(fees.find(fee => fee.sourceKey === "annual_fee")).toMatchObject({ amount: "1200.10", costType: "OPEX" });
    expect(fees.find(fee => fee.sourceKey === "other_fee_1")).toMatchObject({ rate: "12.3456", revenuePeriod: "annual", amount: null });
    expect(fees[0]).toMatchObject({ sourceKey: "external_contract", payable: false, note: "preserve" });
  });
  it("preserves unedited imported formulas and review metadata while versioning explicit overrides", () => {
    const old = { permission_calculation: { custom: "keep" }, _migration: { fee_review_required: true }, installation_profile: { special: "keep", equipment_cost: "100" } };
    const input = buildingEditorSchema.parse({ ...identity, installation: { meters_per_floor: "4.5", cable_rate_per_meter: "158.36", equipment_cost: "", odf_cost: "200", splice_cost: "400" } });
    expect(composeBuildingConditions(input, old, new Date("2026-10-03T00:00:00Z"))).toMatchObject({ ...old, installation_profile: { special: "keep", meters_per_floor: "4.5000" }, update_date: "2026-10-03" });
    expect(composeBuildingConditions(input, old, new Date()).installation_profile).not.toHaveProperty("equipment_cost");
  });
  it.each(["-1", "NaN", "Infinity", "1e3", "1.001", "12345678901234567.00"])("rejects invalid fixed monetary input %s", value => {
    expect(buildingEditorSchema.safeParse({ ...identity, fees: { main_fee: value } }).success).toBe(false);
  });
  it("rejects unpaired/out-of-range coordinates, unknown fields and rates above 100 percent", () => {
    expect(buildingEditorSchema.safeParse({ ...identity, conditions: { lat: "13", lng: "" } }).success).toBe(false);
    expect(buildingEditorSchema.safeParse({ ...identity, conditions: { lat: "91", lng: "100" } }).success).toBe(false);
    expect(buildingEditorSchema.safeParse({ ...identity, extra: true }).success).toBe(false);
    expect(buildingEditorSchema.safeParse({ ...identity, otherFees: [{ key: "other_fee_1", label: "test", calculationType: "revenue_share", value: "100.0001", revenuePeriod: "monthly", note: "" }] }).success).toBe(false);
  });
  it("uses the source whitespace/case-insensitive duplicate name rule", () => {
    expect(normalizeDuplicateName("  TEST อาคาร  ")).toBe(normalizeDuplicateName("testอาคาร"));
  });
  it("copies retained fees into a new version without reusing database row identity", () => {
    const stored = { id: "old-fee-id", conditionVersionId: "old-version-id", createdAt: new Date(),
      sourceKey: "external_contract", label: "external", category: "contract", costType: "CAPEX",
      calculationType: "fixed", amount: "123.45", rate: null, unit: "ครั้ง", revenuePeriod: null,
      payable: false, note: "preserve" };
    const [copied] = composeBuildingFees(buildingEditorSchema.parse(identity), [stored]);
    expect(copied).toMatchObject({ sourceKey: stored.sourceKey, amount: "123.45", note: "preserve" });
    expect(copied).not.toHaveProperty("id");
    expect(copied).not.toHaveProperty("conditionVersionId");
    expect(copied).not.toHaveProperty("createdAt");
  });
});
