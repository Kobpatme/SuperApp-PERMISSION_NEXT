import {
  getInstallationDepositMetrics, getRemovalDepositMetrics, getSidebarFinancialMetrics, getNonRefundableCostMetrics, getOperationalAnalytics, isCancelled,
  getWorkflowStatusKey,
  parseDateValue,
  parseMoney,
  workflowLabels,
  type DepositItem,
} from "@/lib/deposit-v2-domain";
import Decimal from "decimal.js";

const normalized = (value: unknown) => String(value ?? "").trim().toLocaleLowerCase("th-TH");

/** Executive presentation uses the same refund and On Service rules as the register. */
export function buildGuaranteeManagementReport(items: DepositItem[], generatedAt: string) {
  const installation = getInstallationDepositMetrics(items), removal = getRemovalDepositMetrics(items);
  const finance = getSidebarFinancialMetrics(items), costs = getNonRefundableCostMetrics(items);
  const operational = getOperationalAnalytics(items, new Date(generatedAt));
  const active = items.filter((item) => !isCancelled(item));
  const total = new Decimal(installation.totalAmount).plus(removal.totalAmount).toNumber();
  const refunded = new Decimal(installation.refundedAmount).plus(removal.refundedAmount).toNumber();
  const outstanding = active.map((item) => ({ item, amount: getSidebarFinancialMetrics([item]).totalOutstandingAmount })).filter((row) => row.amount > 0);
  function groupBy(field: "area" | "status") {
    const groups = new Map<string, DepositItem[]>();
    for (const row of outstanding) {
      const key = field === "area" ? row.item.area?.trim() || "ไม่ระบุพื้นที่" : getWorkflowStatusKey(row.item);
      groups.set(key, [...(groups.get(key) ?? []), row.item]);
    }
    return [...groups].map(([key, rows]) => ({ key, label: field === "status" ? workflowLabels[key] || "รอตรวจสอบสถานะ" : key,
      count: rows.length, amount: getSidebarFinancialMetrics(rows).totalOutstandingAmount })).sort((a, b) => b.amount - a.amount);
  }
  return { installation, removal, finance, costs, operational, total, refunded,
    refundPct: total ? new Decimal(refunded).div(total).times(100).toNumber() : null,
    outstandingCount: outstanding.length, excludedCount: items.length - active.length,
    areas: groupBy("area"), statuses: groupBy("status"),
    topOutstanding: [...outstanding].sort((a, b) => b.amount - a.amount).slice(0, 5),
    months: buildGuaranteeExecutiveView(active, generatedAt).months };
}

export function buildGuaranteeExecutiveView(items: DepositItem[], generatedAt: string) {
  const reference = new Date(generatedAt);
  if (Number.isNaN(reference.getTime())) throw new Error("generatedAt must be an ISO date");

  const done = items.filter((item) => normalized(item.status) === "done");
  const active = items.filter((item) => !["done", "cancel"].includes(normalized(item.status)));
  const totalInstall = items.reduce((sum, item) => sum + parseMoney(item.deposit), 0);
  const installRefunded = done.reduce((sum, item) => sum + parseMoney(item.deposit), 0);
  const totalDemo = items.reduce((sum, item) => sum + parseMoney(item.demolish), 0);
  const demoRefunded = done.reduce((sum, item) => sum + parseMoney(item.demolish), 0);
  const installPendingItems = items.filter((item) => parseMoney(item.deposit) > 0 && normalized(item.status) !== "done");
  const pendingMap = new Map<string, { key: string; label: string; count: number; amount: number }>();

  for (const item of installPendingItems) {
    const key = getWorkflowStatusKey(item);
    const row = pendingMap.get(key) ?? { key, label: workflowLabels[key] || key, count: 0, amount: 0 };
    row.count += 1;
    row.amount += parseMoney(item.deposit);
    pendingMap.set(key, row);
  }

  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(reference.getFullYear(), reference.getMonth() - 11 + index, 1);
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      label: date.toLocaleDateString("th-TH", { month: "short", year: "2-digit" }),
      fee: 0,
      deposit: 0,
    };
  });
  for (const item of items) {
    const date = parseDateValue(item.dateReq);
    const month = date && months.find((entry) => entry.year === date.getFullYear() && entry.month === date.getMonth());
    if (month) {
      month.fee += parseMoney(item.fee) + parseMoney(item.other);
      month.deposit += parseMoney(item.deposit) + parseMoney(item.demolish);
    }
  }

  const areaMap = new Map<string, number>();
  for (const item of active) {
    if (item.area) areaMap.set(item.area, (areaMap.get(item.area) || 0) + parseMoney(item.deposit));
  }
  const topOutstanding = active
    .map((item) => ({ item, amount: parseMoney(item.deposit) + parseMoney(item.demolish) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  const totalInsurance = totalInstall + totalDemo;
  const refunded = installRefunded + demoRefunded;

  return {
    totalInstall,
    installRefunded,
    installPending: totalInstall - installRefunded,
    installPendingCount: installPendingItems.length,
    totalDemo,
    demoRefunded,
    demoPending: totalDemo - demoRefunded,
    demoPendingCount: items.filter((item) => parseMoney(item.demolish) > 0 && normalized(item.demoReturn) !== "yes").length,
    totalInsurance,
    successPct: totalInsurance ? (refunded / totalInsurance) * 100 : 0,
    pendingByStatus: [...pendingMap.values()].sort((a, b) => b.amount - a.amount),
    months,
    areas: [...areaMap].map(([label, amount]) => ({ label, amount })).sort((a, b) => b.amount - a.amount),
    topOutstanding,
  };
}
