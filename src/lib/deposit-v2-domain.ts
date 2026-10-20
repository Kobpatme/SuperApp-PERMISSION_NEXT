/** Business rules ported from ระบบขอคืนเงินประกัน_V2/domain-logic.js.
 * The source's Firebase access and client-side authorization are intentionally excluded. */
export type DepositItem = {
  id?: string; id_firestore?: string; status?: string; status_final?: string;
  workflowKey?: string; complete_tl?: string; inspected_by?: string;
  deposit?: number | string; demolish?: number | string; fee?: number | string;
  other?: number | string; other_desc?: string; depReturn?: string; demoReturn?: string;
  off_service_status?: string; off_service_requested?: string | boolean; off_service_completed_date?: string;
  service_cancel_date?: string; dateReq?: string; dateDue?: string;
  tl_due_date?: string; off_service_due_date?: string; date_return?: string;
  date_accounting?: string; dateAcc?: string; createdAt?: string; updatedAt?: string;
  pdf_payment?: string; pdf_layout?: string; pdf_additional?: string; pdf_tl_work?: string; pdf_tl_extra?: string; pdf_demo_off?: string;
  pdf_user_final?: string; place?: string; area?: string; customer?: string;
  cid?: string; pr?: string; owner?: string; tl_team?: string; contact?: string; tel?: string; mobile?: string;
  project?: string; deal?: string; no?: string; payTo?: string; payType?: string; detail?: string; note?: string;
  dateCheck?: string; install_date?: string;
  log?: Array<{ time?: string; createdAt?: string; timestamp?: string }>;
};

/** Personal dashboard selector for rows that have already passed server-side authorization. */
export function selectPersonalDepositItems<T extends DepositItem & { ownerId?: string; tlAssigneeId?: string | null }>(items: T[], userId: string): T[] {
  if (!userId) return [];
  return items.filter((item) => item.ownerId === userId || item.tlAssigneeId === userId);
}

export const normalize = (value: unknown) => String(value ?? "").trim().toLowerCase();
export function parseMoney(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : 0;
  if (value == null || value === "") return 0;
  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}
export const isReturnYes = (value: unknown) => normalize(value) === "yes";
export const isCancelled = (item: DepositItem) => normalize(item.status) === "cancel" || normalize(item.status_final) === "cancel";
export const hasRemovalDeposit = (item: DepositItem) => !isCancelled(item) && parseMoney(item.demolish) > 0;
export const isRemovalRefunded = (item: DepositItem) => hasRemovalDeposit(item) && isReturnYes(item.demoReturn);
export const isInstallationRefunded = (item: DepositItem) => !isCancelled(item) && parseMoney(item.deposit) > 0 &&
  (normalize(item.status) === "done" || normalize(item.status_final) === "done");
export function isInstallationClosed(item: DepositItem) {
  if (isCancelled(item)) return false;
  if (normalize(item.status) === "done" || normalize(item.status_final) === "done") return true;
  const closing = normalize(item.status) === "clo" || normalize(item.status_final) === "clo";
  return closing && (normalize(item.inspected_by) === "building dept" || Boolean(item.pdf_user_final));
}
export const isOffServicePendingItem = (item: DepositItem) => hasRemovalDeposit(item) && isInstallationClosed(item) &&
  !isRemovalRefunded(item) && (normalize(item.off_service_status) === "pending" || Boolean(item.off_service_requested || item.service_cancel_date));
export const isOnServiceItem = (item: DepositItem) => hasRemovalDeposit(item) && isInstallationClosed(item) &&
  !isRemovalRefunded(item) && !isOffServicePendingItem(item);
export const isPreServiceItem = (item: DepositItem) => hasRemovalDeposit(item) && !isRemovalRefunded(item) && !isInstallationClosed(item);
export const isFullyCompleted = (item: DepositItem) => normalize(item.status) === "done" && !isOnServiceItem(item) && !isOffServicePendingItem(item);
export function sortCompletedLast<T extends DepositItem>(items: T[], comparator?: (a: T, b: T) => number) {
  const priority = (item: T) => isFullyCompleted(item) ? 2 : isOnServiceItem(item) ? 1 : 0;
  return [...items].sort((a, b) => priority(a) - priority(b) || (comparator?.(a, b) ?? 0));
}
export function getWorkflowStatusKey(item: DepositItem) {
  const status = normalize(item.status);
  if (status === "cancel") return "cancel";
  if (isOffServicePendingItem(item)) return "off_service_pending";
  if (isOnServiceItem(item)) return "on_service";
  if (["done", "ret", "clo", "att", "fin"].includes(status)) return status;
  if (status === "tl") return normalize(item.complete_tl) === "on process" ? "tl_process" : "tl_wait";
  if (status === "on process") return normalize(item.complete_tl) === "on process" ? "tl_process" : "refund_process";
  if (normalize(item.complete_tl) === "on process") return "tl_process";
  return "new";
}
export const workflowLabels: Record<string, string> = {
  new: "ข้อมูลทั่วไป", fin: "การเงิน", att: "แนบหลักฐาน", tl_wait: "รอทีมติดตั้งรับงาน",
  tl_process: "ทีมติดตั้งดำเนินการ", ret: "ขอคืนเงิน", clo: "ปิดงาน",
  refund_process: "ดำเนินการคืนเงิน", on_service: "On Service",
  off_service_pending: "รอ Off Service", done: "เสร็จแล้ว", cancel: "ยกเลิก",
};

export const installationTeamPendingWorkflowKeys = ["tl_wait", "tl_process", "off_service_pending"] as const;

export function isInstallationTeamPending(item: DepositItem) {
  return installationTeamPendingWorkflowKeys.includes(getWorkflowStatusKey(item) as (typeof installationTeamPendingWorkflowKeys)[number]);
}

export function getRemovalDepositMetrics(items: DepositItem[]) {
  const metrics = { totalAmount: 0, totalCount: 0, refundedAmount: 0, refundedCount: 0,
    outstandingAmount: 0, outstandingCount: 0, onServiceAmount: 0, onServiceCount: 0,
    offServicePendingAmount: 0, offServicePendingCount: 0, preServiceAmount: 0, preServiceCount: 0 };
  for (const item of items) {
    if (!hasRemovalDeposit(item)) continue;
    const amount = parseMoney(item.demolish);
    metrics.totalAmount += amount; metrics.totalCount++;
    if (isRemovalRefunded(item)) { metrics.refundedAmount += amount; metrics.refundedCount++; }
    else { metrics.outstandingAmount += amount; metrics.outstandingCount++; }
    if (isOffServicePendingItem(item)) { metrics.offServicePendingAmount += amount; metrics.offServicePendingCount++; }
    else if (isOnServiceItem(item)) { metrics.onServiceAmount += amount; metrics.onServiceCount++; }
    else if (isPreServiceItem(item)) { metrics.preServiceAmount += amount; metrics.preServiceCount++; }
  }
  return metrics;
}
export function getInstallationDepositMetrics(items: DepositItem[]) {
  const metrics = { totalAmount: 0, totalCount: 0, refundedAmount: 0, refundedCount: 0, outstandingAmount: 0, outstandingCount: 0 };
  for (const item of items) {
    if (isCancelled(item)) continue;
    const amount = parseMoney(item.deposit);
    if (!amount) continue;
    metrics.totalAmount += amount; metrics.totalCount++;
    if (isInstallationRefunded(item)) { metrics.refundedAmount += amount; metrics.refundedCount++; }
    else { metrics.outstandingAmount += amount; metrics.outstandingCount++; }
  }
  return metrics;
}
export function getNonRefundableCostMetrics(items: DepositItem[]) {
  const metrics = { feeAmount: 0, otherAmount: 0, totalAmount: 0, affectedCount: 0, missingOtherDescriptionCount: 0 };
  for (const item of items) {
    if (isCancelled(item)) continue;
    const fee = parseMoney(item.fee), other = parseMoney(item.other);
    if (!fee && !other) continue;
    metrics.feeAmount += fee; metrics.otherAmount += other; metrics.totalAmount += fee + other; metrics.affectedCount++;
    if (other && !item.other_desc?.trim()) metrics.missingOtherDescriptionCount++;
  }
  return metrics;
}
export function getSidebarFinancialMetrics(items: DepositItem[]) {
  const active = items.filter((item) => !isCancelled(item));
  const installation = getInstallationDepositMetrics(active);
  const removal = getRemovalDepositMetrics(active);
  return { totalPaymentAmount: active.reduce((sum, item) => sum + parseMoney(item.deposit) + parseMoney(item.demolish) + parseMoney(item.fee) + parseMoney(item.other), 0),
    installationOutstandingAmount: installation.outstandingAmount, removalOutstandingAmount: removal.outstandingAmount,
    totalOutstandingAmount: installation.outstandingAmount + removal.outstandingAmount };
}
export function getListPageKpiMetrics(items: DepositItem[]) {
  const installation = getInstallationDepositMetrics(items), removal = getRemovalDepositMetrics(items), cost = getNonRefundableCostMetrics(items);
  return { totalCount: items.length,
    activeWorkCount: items.filter((item) => !["done", "on_service", "cancel"].includes(getWorkflowStatusKey(item))).length,
    completedCount: items.filter((item) => ["done", "on_service"].includes(getWorkflowStatusKey(item))).length,
    nonRefundableCostAmount: cost.totalAmount, feeAmount: cost.feeAmount, otherAmount: cost.otherAmount,
    installationDepositAmount: installation.totalAmount, onServiceRemovalAmount: removal.onServiceAmount };
}
export function parseDateValue(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value);
  if (typeof value === "object") {
    const dated = value as { toDate?: () => Date; seconds?: number };
    if (typeof dated.toDate === "function") return parseDateValue(dated.toDate());
    if (typeof dated.seconds === "number") return parseDateValue(new Date(dated.seconds * 1000));
  }
  const text = String(value).trim();
  const thai = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (thai) {
    const year = Number(thai[3]) > 2400 ? Number(thai[3]) - 543 : Number(thai[3]);
    const date = new Date(year, Number(thai[2]) - 1, Number(thai[1]), Number(thai[4] || 0), Number(thai[5] || 0), Number(thai[6] || 0));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}
const dayStart = (value: unknown) => { const date = parseDateValue(value); return date && new Date(date.getFullYear(), date.getMonth(), date.getDate()); };
export function daysBetween(from: unknown, to: unknown) {
  const start = dayStart(from), end = dayStart(to);
  return start && end ? Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000)) : null;
}
export function getLastActivityDate(item: DepositItem) {
  return [item.updatedAt, item.createdAt, item.dateReq, ...(item.log ?? []).map((entry) => entry.time || entry.createdAt || entry.timestamp)]
    .map(parseDateValue).filter((date): date is Date => Boolean(date)).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
}
export function getOutstandingAmount(item: DepositItem) {
  if (isCancelled(item)) return 0;
  return (isInstallationRefunded(item) ? 0 : parseMoney(item.deposit)) + (isReturnYes(item.demoReturn) ? 0 : parseMoney(item.demolish));
}
export function getMissingDocumentLabels(item: DepositItem, workflowKey: string) {
  const missing: string[] = [];
  if (["att", "tl_wait", "tl_process", "ret", "clo", "refund_process", "done", "on_service"].includes(workflowKey) && !item.pdf_payment) missing.push("หลักฐานการจ่าย");
  if (["ret", "clo", "refund_process", "done", "on_service"].includes(workflowKey) && normalize(item.inspected_by) !== "building dept" && !item.pdf_tl_work) missing.push("หลักฐานงานทีมติดตั้ง");
  if (workflowKey === "off_service_pending" && !item.pdf_demo_off) missing.push("หลักฐาน Off Service");
  if (workflowKey === "clo" && !item.pdf_user_final) missing.push("หลักฐานปิดงาน");
  return missing;
}
export function getConsistencyIssues(item: DepositItem, workflowKey: string) {
  const issues: string[] = [];
  if (parseMoney(item.deposit) > 0 && isReturnYes(item.depReturn) && ["new", "fin", "att", "tl_wait", "tl_process"].includes(workflowKey)) issues.push("ระบุว่าคืนประกันติดตั้งแล้ว แต่ขั้นตอนงานยังไม่ถึงการคืนเงิน");
  if (parseMoney(item.deposit) > 0 && !isReturnYes(item.depReturn) && workflowKey === "done") issues.push("ปิดงานแล้ว แต่ยังไม่ระบุการคืนประกันติดตั้ง");
  if (!parseMoney(item.demolish) && isReturnYes(item.demoReturn)) issues.push("ระบุคืนประกันรื้อถอน แต่ไม่มียอดประกันรื้อถอน");
  return issues;
}
export type WorkQueueEntry = { item: DepositItem; score: number; priority: "high" | "medium" | "low"; workflowKey: string;
  ageDays: number; overdueDays: number; dueInDays: number | null; dueDate: Date | null; lastActivityDate: Date | null;
  outstandingAmount: number; missingDocuments: string[]; consistencyIssues: string[]; reasons: string[] };
export function getSmartWorkQueue(items: DepositItem[], now: Date = new Date()): WorkQueueEntry[] {
  return items.filter((item) => !isCancelled(item) && !isOnServiceItem(item)).map((item): WorkQueueEntry | null => {
    const workflowKey = getWorkflowStatusKey(item), lastActivityDate = getLastActivityDate(item);
    const ageDays = daysBetween(lastActivityDate || item.dateReq || item.createdAt, now) || 0;
    const dueSource = ["tl_wait", "tl_process"].includes(workflowKey) ? item.tl_due_date || item.dateDue : workflowKey === "off_service_pending" ? item.off_service_due_date || item.dateDue : item.dateDue;
    const dueDate = parseDateValue(dueSource);
    const overdueDays = dueDate && dayStart(dueDate)! < dayStart(now)! ? daysBetween(dueDate, now) || 0 : 0;
    const dueInDays = dueDate && dayStart(dueDate)! >= dayStart(now)! ? daysBetween(now, dueDate) : null;
    const outstandingAmount = getOutstandingAmount(item), missingDocuments = getMissingDocumentLabels(item, workflowKey), consistencyIssues = getConsistencyIssues(item, workflowKey);
    if (isFullyCompleted(item) && !outstandingAmount && !consistencyIssues.length) return null;
    const reasons: string[] = []; let score = 0;
    if (overdueDays) { score += 35 + Math.min(15, overdueDays); reasons.push(`เกินกำหนด ${overdueDays} วัน`); }
    else if (dueInDays != null && dueInDays <= 3) { score += dueInDays === 0 ? 30 : 20 - dueInDays * 3; reasons.push(dueInDays === 0 ? "ครบกำหนดวันนี้" : `ครบกำหนดใน ${dueInDays} วัน`); }
    if (ageDays >= 3) { score += ageDays >= 14 ? 25 : ageDays >= 7 ? 15 : 8; reasons.push(`ค้าง${workflowLabels[workflowKey] || workflowKey}ประมาณ ${ageDays} วัน`); }
    if (ageDays >= 7) { score += ageDays >= 14 ? 20 : 12; reasons.push(`ไม่มีความเคลื่อนไหว ${ageDays} วัน`); }
    score += outstandingAmount >= 100000 ? 15 : outstandingAmount >= 50000 ? 10 : outstandingAmount >= 10000 ? 5 : 0;
    if (outstandingAmount) reasons.push(`ยอดประกันคงค้าง ฿${outstandingAmount.toLocaleString("th-TH")}`);
    if (missingDocuments.length) { score += Math.min(30, missingDocuments.length * 12); reasons.push(`ขาด ${missingDocuments.join(", ")}`); }
    if (consistencyIssues.length) { score += Math.min(40, consistencyIssues.length * 25); reasons.push(...consistencyIssues); }
    if (!dueDate) reasons.push("ไม่มีข้อมูลวันครบกำหนด");
    return { item, score, priority: score >= 50 ? "high" as const : score >= 25 ? "medium" as const : "low" as const,
      workflowKey, ageDays, overdueDays, dueInDays, dueDate, lastActivityDate, outstandingAmount, missingDocuments, consistencyIssues, reasons };
  }).filter((entry): entry is WorkQueueEntry => Boolean(entry && entry.score > 0)).sort((a, b) => b.score - a.score || b.outstandingAmount - a.outstandingAmount || b.ageDays - a.ageDays);
}
export function getActionNotifications(items: DepositItem[], now = new Date(), recipientRole = "") {
  return getSmartWorkQueue(items, now).map((entry) => {
    const dueSoonDays = entry.dueDate && !entry.overdueDays ? daysBetween(now, entry.dueDate) : null;
    const dueSoon = dueSoonDays != null && dueSoonDays <= 3;
    const roleAction = normalize(recipientRole) === "tl" ? ["tl_wait", "off_service_pending"].includes(entry.workflowKey) : normalize(recipientRole) === "user" && ["ret", "clo", "off_service_pending"].includes(entry.workflowKey);
    if (entry.priority === "low" && !dueSoon && entry.workflowKey !== "off_service_pending" && !roleAction) return null;
    const role = normalize(recipientRole);
    const type = entry.overdueDays ? "overdue" : dueSoon ? "due-soon" : entry.workflowKey === "off_service_pending" ? "off-service"
      : role === "tl" && entry.workflowKey === "tl_wait" ? "tl-assigned"
      : role === "user" && entry.workflowKey === "ret" ? "user-review"
      : role === "user" && entry.workflowKey === "clo" ? "user-close" : entry.priority;
    const prefix = entry.overdueDays ? `เกินกำหนด ${entry.overdueDays} วัน` : dueSoon ? dueSoonDays === 0 ? "ครบกำหนดวันนี้" : `ครบกำหนดใน ${dueSoonDays} วัน`
      : type === "off-service" ? "รอดำเนินการ Off Service" : type === "tl-assigned" ? "มีงานใหม่รอทีมติดตั้งรับงาน"
      : type === "user-review" ? "งานรอ User ตรวจรับ" : type === "user-close" ? "งานรอแนบหลักฐานปิดงาน" : "ควรติดตาม";
    const taskId = String(entry.item.id_firestore || entry.item.id || "unknown");
    return { id: `work:${taskId}:${entry.workflowKey}:${type}:${entry.lastActivityDate?.toISOString().slice(0, 10) || "no-activity"}`,
      taskId, type, severity: entry.overdueDays || type === "off-service" || entry.priority === "high" ? 3 : 2,
      title: `${prefix}: ${entry.item.place || "ไม่ระบุอาคาร"}`, detail: entry.reasons.filter((reason) => reason !== "ไม่มีข้อมูลวันครบกำหนด").slice(0, 2).join(" · ") || workflowLabels[entry.workflowKey],
      workflowKey: entry.workflowKey, dueDate: entry.dueDate, createdAt: entry.lastActivityDate || now, score: entry.score };
  }).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)).sort((a, b) => b.severity - a.severity || b.score - a.score || b.createdAt.getTime() - a.createdAt.getTime());
}
export function getOperationalAnalytics(items: DepositItem[], now = new Date()) {
  const active = items.filter((item) => !isCancelled(item));
  const open = active.filter((item) => !isFullyCompleted(item) && !isOnServiceItem(item));
  const queue = getSmartWorkQueue(active, now);
  const stageMap = new Map<string, { key: string; label: string; count: number; totalAgeDays: number }>();
  for (const item of open) {
    const key = getWorkflowStatusKey(item), stage = stageMap.get(key) || { key, label: workflowLabels[key] || key, count: 0, totalAgeDays: 0 };
    stage.count++; stage.totalAgeDays += daysBetween(getLastActivityDate(item) || item.dateReq || item.createdAt, now) || 0; stageMap.set(key, stage);
  }
  const stageAges = [...stageMap.values()].map((stage) => ({ ...stage, averageAgeDays: stage.totalAgeDays / stage.count })).sort((a, b) => b.averageAgeDays - a.averageAgeDays || b.count - a.count);
  const refunds = active.flatMap((item) => {
    if (!isInstallationRefunded(item)) return [];
    const end = [item.date_return, item.date_accounting, item.dateAcc].map(parseDateValue).filter((date): date is Date => Boolean(date)).sort((a, b) => b.getTime() - a.getTime())[0] || getLastActivityDate(item);
    const durationDays = daysBetween(item.dateReq || item.createdAt, end);
    return durationDays == null ? [] : [{ item, durationDays }];
  });
  const group = (field: "area" | "place") => {
    const map = new Map<string, { label: string; count: number; totalDays: number }>();
    for (const entry of refunds) {
      const label = entry.item[field]?.trim() || "ไม่ระบุ", row = map.get(label) || { label, count: 0, totalDays: 0 };
      row.count++; row.totalDays += entry.durationDays; map.set(label, row);
    }
    return [...map.values()].map((row) => ({ ...row, averageDays: row.totalDays / row.count })).sort((a, b) => b.averageDays - a.averageDays || b.count - a.count);
  };
  const month = (date: Date) => active.filter((item) => { const value = parseDateValue(item.dateReq || item.createdAt); return value && value.getFullYear() === date.getFullYear() && value.getMonth() === date.getMonth(); });
  const current = month(now), previous = month(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const amount = (rows: DepositItem[]) => rows.reduce((sum, item) => sum + parseMoney(item.deposit) + parseMoney(item.demolish), 0);
  const currentAmount = amount(current), previousAmount = amount(previous);
  const overdue = queue.filter((entry) => entry.overdueDays > 0);
  return { queue, stageAges, bottleneck: stageAges[0] || null, refundByArea: group("area"), refundByBuilding: group("place"),
    overdueRiskAmount: overdue.reduce((sum, entry) => sum + entry.outstandingAmount, 0), overdueCount: overdue.length,
    monthComparison: { currentAmount, previousAmount, currentCount: current.length, previousCount: previous.length, percentChange: previousAmount > 0 ? (currentAmount - previousAmount) / previousAmount * 100 : null },
    accuracy: { dueDateCoveragePct: open.length ? open.filter((item) => parseDateValue(item.dateDue)).length / open.length * 100 : 100,
      dueDateCount: open.filter((item) => parseDateValue(item.dateDue)).length, openCount: open.length,
      refundDurationCoveragePct: active.length ? refunds.length / active.length * 100 : 100,
      refundDurationCount: refunds.length, totalCount: active.length, stageAgeIsEstimated: true } };
}
