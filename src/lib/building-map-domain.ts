import Decimal from "decimal.js";

export type BuildingMapExpenseCategory = "CAPEX" | "OPEX_MONTHLY" | "OPEX_ANNUAL" | "DEPOSIT" | "UNCLASSIFIED";
export type BuildingMapFee = { source_field: string; cost_type: string; revenue_period: string | null; payable: boolean; amount: number | string | null };

export function matchesBuildingMapCategory(fee: BuildingMapFee, category: BuildingMapExpenseCategory) {
  if (category === "OPEX_ANNUAL") return fee.cost_type === "OPEX" && (fee.source_field === "annual_fee" || fee.revenue_period === "annual");
  if (category === "OPEX_MONTHLY") return fee.cost_type === "OPEX" && fee.source_field !== "annual_fee" && fee.revenue_period !== "annual";
  return fee.cost_type === category;
}

/** Aggregates only the current Building BOQ category and existing payable rows; it does not model payments. */
export function summarizeBuildingMapFees(fees: readonly BuildingMapFee[], category: BuildingMapExpenseCategory) {
  return fees.filter((fee) => fee.payable && matchesBuildingMapCategory(fee, category)).reduce((total, fee) => ({
    count: total.count + 1,
    amount: fee.amount === null ? total.amount : total.amount.plus(String(fee.amount)),
  }), { count: 0, amount: new Decimal(0) });
}
