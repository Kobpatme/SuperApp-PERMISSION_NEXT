import { money } from "./money";
export type SourceFinancialJson = Record<string, unknown>;
// Preserve Source JSON keys, notes and extensions. DQ02 alone normalizes money to 2dp.
// File locator strings are review metadata/private document IDs, never authorization or fetch URLs.
export function sourceFinancialPayload(rate: SourceFinancialJson, guarantee: SourceFinancialJson) {
  const rateNoticeData = { ...rate }, guaranteeData = { ...guarantee };
  for (const key of ["monthlyFee", "yearlyFee"]) if (Object.hasOwn(rateNoticeData, key)) rateNoticeData[key] = money(rateNoticeData[key] as string | number | null);
  if (Object.hasOwn(guaranteeData, "fullAmount") && guaranteeData.fullAmount != null && guaranteeData.fullAmount !== "") guaranteeData.fullAmount = money(guaranteeData.fullAmount as string | number);
  return { rateNoticeData, guaranteeData };
}
