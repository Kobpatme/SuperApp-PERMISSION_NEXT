import Decimal from "decimal.js";

// DQ02 approved: match PostgreSQL numeric(*,2), including ties away from zero.
export function money(value: string | number | null | undefined = "0", precision = 12): string {
  const amount = new Decimal(value === "" || value == null ? "0" : value);
  if (!amount.isFinite()) throw new Error("จำนวนเงินต้องเป็นตัวเลขที่มีค่าจำกัด");
  const rounded = amount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  if (rounded.abs().gte(new Decimal(10).pow(precision - 2))) throw new Error("จำนวนเงินเกินความละเอียดฐานข้อมูล");
  return rounded.toFixed(2);
}

export function renewalTotal(routes: readonly { reviewStatus: string; yearlyFee: string | number | null }[]): string {
  return money(routes.filter(route => route.reviewStatus === "keep")
    .reduce((total, route) => total.plus(money(route.yearlyFee)), new Decimal(0)).toString(), 14);
}
