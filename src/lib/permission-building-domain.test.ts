import { describe, expect, it } from "vitest";
import { buildBuildingBoqProfile, effectivePermissionStatus, getBuildingBoqProfile, normalizeOtherFees, normalizePermissionBuilding, parseBuildingUpdateDate } from "./permission-building-domain";

describe("Permission_Next building rules", () => {
  it("parses Gregorian and Buddhist update dates and rejects invalid dates", () => {
    expect(parseBuildingUpdateDate("25/09/2568")?.getFullYear()).toBe(2025);
    expect(parseBuildingUpdateDate("2025-09-25")?.getMonth()).toBe(8);
    expect(parseBuildingUpdateDate("31/02/2568")).toBeNull();
    expect(parseBuildingUpdateDate({ _seconds: 0 })?.getTime()).toBe(0);
  });

  it("marks stale buildings for permission review but preserves excluded statuses", () => {
    const today = new Date(2026, 8, 25);
    expect(effectivePermissionStatus({ status: "Active", update_date: "2024-09-25" }, today)).toBe("Check Permission");
    expect(effectivePermissionStatus({ status: "MOU", update_date: "2024-09-25" }, today)).toBe("MOU");
    expect(normalizePermissionBuilding({ install_type: "mall", area: "bkk" }, today)).toMatchObject({ install_type: "Shopping Mall", area: "BKK" });
  });

  it("classifies fixed fees without treating variable rates or revenue share as a lump sum", () => {
    const profile = buildBuildingBoqProfile({ id: "12", name_th: "อาคารทดสอบ", main_fee: 1000, annual_fee: 200,
      damage_deposit: 300, shaft_fee_per_floor: 50, other_fees: [
        { label: "ส่วนแบ่งรายเดือน", calculation_type: "revenue_share", rate: 10, revenue_period: "monthly" },
        { label: "ส่วนแบ่งรายปี", calculation_type: "revenue_share", rate: 2.5, revenue_period: "annual" },
      ] });
    expect(profile.capex_total).toBe(1000);
    expect(profile.opex_total).toBe(200);
    expect(profile.deposit_total).toBe(300);
    expect(profile.variable_rate_count).toBe(3);
    expect(profile.payable_total).toBe(1200);
    expect(profile.non_payable_total).toBe(300);
    expect(profile.opex_total).toBe(200);
    expect(profile.fees.filter((fee) => fee.calculation_type === "revenue_share")).toMatchObject([
      { rate: 10, revenue_period: "monthly", unit: "%", amount: null, cost_type: "OPEX" },
      { rate: 2.5, revenue_period: "annual", unit: "%", amount: null, cost_type: "OPEX" },
    ]);
  });

  it("normalizes legacy other-fee shapes", () => {
    expect(normalizeOtherFees({ "ค่าบัตร": "1,200" })).toMatchObject([{ label: "ค่าบัตร", amount: 1200 }]);
    expect(normalizeOtherFees([{ name: "ส่วนแบ่ง", calculation_type: "revenue_share", percentage: 5 }]))
      .toMatchObject([{ label: "ส่วนแบ่ง", rate: 5, revenue_period: "monthly" }]);
  });

  it("prefers an existing BOQ profile when raw fees are absent", () => {
    const profile = getBuildingBoqProfile({ boq_profile: { fees: [{ source_field: "main_fee", amount: 250, cost_type: "CAPEX" }] } });
    expect(profile.capex_total).toBe(250);
  });
});
