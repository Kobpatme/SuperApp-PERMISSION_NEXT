import { describe, expect, it } from "vitest";
import { matchesBuildingMapCategory, summarizeBuildingMapFees, type BuildingMapFee } from "@/lib/building-map-domain";

const fees: BuildingMapFee[] = [
  { source_field: "main_fee", cost_type: "CAPEX", revenue_period: null, payable: true, amount: "1000.25" },
  { source_field: "annual_fee", cost_type: "OPEX", revenue_period: "annual", payable: true, amount: "12000" },
  { source_field: "insurance_fee", cost_type: "OPEX", revenue_period: "monthly", payable: true, amount: "250.50" },
  { source_field: "contract_deposit", cost_type: "DEPOSIT", revenue_period: null, payable: false, amount: "5000" },
  { source_field: "other_fee", cost_type: "UNCLASSIFIED", revenue_period: null, payable: true, amount: null },
];

describe("building map BOQ aggregation", () => {
  it("uses existing fee classifications and keeps recurring periods separate", () => {
    expect(summarizeBuildingMapFees(fees, "CAPEX").count).toBe(1);
    expect(summarizeBuildingMapFees(fees, "CAPEX").amount.toFixed(2)).toBe("1000.25");
    expect(summarizeBuildingMapFees(fees, "OPEX_ANNUAL").amount.toFixed(2)).toBe("12000.00");
    expect(summarizeBuildingMapFees(fees, "OPEX_MONTHLY").amount.toFixed(2)).toBe("250.50");
    expect(summarizeBuildingMapFees(fees, "OPEX_ANNUAL").amount.plus(summarizeBuildingMapFees(fees, "OPEX_MONTHLY").amount).toFixed(2)).toBe("12250.50");
  });

  it("excludes non-payable deposits and counts unclassified fee rows without inventing an amount", () => {
    expect(summarizeBuildingMapFees(fees, "DEPOSIT").count).toBe(0);
    expect(summarizeBuildingMapFees(fees, "DEPOSIT").amount.isZero()).toBe(true);
    expect(summarizeBuildingMapFees(fees, "UNCLASSIFIED").count).toBe(1);
    expect(summarizeBuildingMapFees(fees, "UNCLASSIFIED").amount.isZero()).toBe(true);
  });

  it("classifies annual and monthly recurring rows using the Building BOQ fields", () => {
    expect(matchesBuildingMapCategory(fees[1], "OPEX_ANNUAL")).toBe(true);
    expect(matchesBuildingMapCategory(fees[2], "OPEX_MONTHLY")).toBe(true);
    expect(matchesBuildingMapCategory(fees[2], "OPEX_ANNUAL")).toBe(false);
  });
});
