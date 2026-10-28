import {
  getInstallationDepositMetrics, getRemovalDepositMetrics, getSidebarFinancialMetrics, getNonRefundableCostMetrics, getOperationalAnalytics, isCancelled,
  getSmartWorkQueue, isFullyCompleted, isOnServiceItem,
  getWorkflowStatusKey,
  parseDateValue,
  parseMoney,
  workflowLabels,
  type DepositItem,
} from "@/lib/deposit-v2-domain";
import Decimal from "decimal.js";

const normalized = (value: unknown) => String(value ?? "").trim().toLocaleLowerCase("th-TH");
const csvCell = (value: unknown) => {
  let text = String(value ?? "");
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

/** Executive presentation uses the same refund and On Service rules as the register. */
export function buildGuaranteeManagementReport(items: DepositItem[], generatedAt: string) {
  const installation = getInstallationDepositMetrics(items), removal = getRemovalDepositMetrics(items);
  const finance = getSidebarFinancialMetrics(items), costs = getNonRefundableCostMetrics(items);
  const operational = getOperationalAnalytics(items, new Date(generatedAt));
  const active = items.filter((item) => !isCancelled(item));
  const total = new Decimal(installation.totalAmount).plus(removal.totalAmount).toNumber();
  const refunded = new Decimal(installation.refundedAmount).plus(removal.refundedAmount).toNumber();
  const outstanding = active.map((item) => ({ item, amount: getSidebarFinancialMetrics([item]).totalOutstandingAmount })).filter((row) => row.amount > 0);
  const queue = getSmartWorkQueue(active, new Date(generatedAt));
  const open = active.filter((item) => !isFullyCompleted(item) && !isOnServiceItem(item));
  const queueIds = new Set(queue.map((entry) => entry.item.id || entry.item.id_firestore));
  const missingDue = open.filter((item) => {
    const key = getWorkflowStatusKey(item);
    const due = key === "tl_wait" || key === "tl_process" ? item.tl_due_date || item.dateDue : key === "off_service_pending" ? item.off_service_due_date || item.dateDue : item.dateDue;
    return !parseDateValue(due);
  }).filter((item) => !queueIds.has(item.id || item.id_firestore)).map((item) => ({
    item, workflowKey: getWorkflowStatusKey(item), reasons: ["ไม่มีข้อมูลวันครบกำหนด"], missingDocuments: [], outstandingAmount: getSidebarFinancialMetrics([item]).totalOutstandingAmount,
  }));
  const actionItems = [...queue, ...missingDue].sort((a, b) => (("score" in b ? b.score : 0) || 0) - (("score" in a ? a.score : 0) || 0) || (b.outstandingAmount || 0) - (a.outstandingAmount || 0));
  function groupBy(field: "area" | "status") {
    const groups = new Map<string, DepositItem[]>();
    for (const row of outstanding) {
      const key = field === "area" ? row.item.area?.trim() || "ไม่ระบุพื้นที่" : getWorkflowStatusKey(row.item);
      groups.set(key, [...(groups.get(key) ?? []), row.item]);
    }
    return [...groups].map(([key, rows]) => ({ key, label: field === "status" ? workflowLabels[key] || "รอตรวจสอบสถานะ" : key,
      count: rows.length, amount: getSidebarFinancialMetrics(rows).totalOutstandingAmount,
      ...(rows.map((item) => item.id || item.id_firestore).filter((id): id is string => Boolean(id)).length ? { contributorIds: rows.map((item) => item.id || item.id_firestore).filter((id): id is string => Boolean(id)) } : {}) })).sort((a, b) => b.amount - a.amount);
  }
  return { installation, removal, finance, costs, operational, total, refunded,
    refundPct: total ? new Decimal(refunded).div(total).times(100).toNumber() : null,
    outstandingCount: outstanding.length, excludedCount: items.length - active.length,
    areas: groupBy("area"), statuses: groupBy("status"),
    topOutstanding: [...outstanding].sort((a, b) => b.amount - a.amount).slice(0, 5), actionItems,
    months: buildGuaranteeExecutiveView(active, generatedAt).months };
}

function csvMoney(value: unknown) { return new Decimal(parseMoney(value)).toFixed(2); }

/** Export only the already-authorized, currently filtered rows supplied by the dashboard. */
export function buildGuaranteeReportCsv(items: DepositItem[], generatedAt: string, filters: { area?: string; owner?: string; preview?: boolean } = {}) {
  const report = buildGuaranteeManagementReport(items, generatedAt);
  const latestRecordUpdate = items.map((item) => item.updatedAt ? new Date(item.updatedAt) : null).filter((date): date is Date => date instanceof Date && !Number.isNaN(date.getTime())).sort((a, b) => b.getTime() - a.getTime())[0];
  const latestRecordUpdateValue = latestRecordUpdate?.toISOString() || "";
  const lines = [
    ["ขอบเขต", "เงินประกันอาคาร"], ["สิทธิ์", "ข้อมูลที่ผ่านการอนุญาตของหน้ารายงาน"], ["จำนวนรายการ", String(items.length)],
    ["รายงานสร้างเมื่อ", generatedAt], ["ข้อมูลรายการอัปเดตล่าสุด", latestRecordUpdateValue], ["ข้อมูลตัวอย่าง", filters.preview ? "ใช่" : "ไม่"], ["พื้นที่", filters.area || "ทุกพื้นที่"], ["เจ้าของงาน", filters.owner || "เจ้าของงานทั้งหมด"],
    ["ยอดเงินประกัน", new Decimal(report.total).toFixed(2)], ["ยอดคืนแล้ว", new Decimal(report.refunded).toFixed(2)],
    ["ยอดคงค้าง", new Decimal(report.finance.totalOutstandingAmount).toFixed(2)], ["ค่าใช้จ่าย", new Decimal(report.costs.totalAmount).toFixed(2)], [],
    ["รหัสรายการ", "อาคาร / รายการ", "พื้นที่", "เจ้าของงาน", "สถานะ", "เงินประกัน", "ประกันรื้อถอน", "ค่าธรรมเนียม", "อื่น ๆ", "ยอดคงค้าง"],
    ...items.map((item) => [item.id || item.id_firestore || "", item.place || "", item.area || "", item.owner || "", workflowLabels[getWorkflowStatusKey(item)] || getWorkflowStatusKey(item), csvMoney(item.deposit), csvMoney(item.demolish), csvMoney(item.fee), csvMoney(item.other), csvMoney(getSidebarFinancialMetrics([item]).totalOutstandingAmount)]),
  ];
  return `\uFEFF${lines.map((line) => line.map(csvCell).join(",")).join(String.fromCharCode(13, 10))}`;
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
