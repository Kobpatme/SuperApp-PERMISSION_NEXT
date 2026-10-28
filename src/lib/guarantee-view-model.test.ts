import { describe, expect, it } from "vitest";
import { buildGuaranteeExecutiveView, buildGuaranteeManagementReport, buildGuaranteeReportCsv } from "@/lib/guarantee-view-model";
import { getSidebarFinancialMetrics } from "@/lib/deposit-v2-domain";
import type { DepositItem } from "@/lib/deposit-v2-domain";

const items: DepositItem[] = [
  { id: "active", status: "fin", deposit: 100, demolish: 20, fee: 5, other: 2, area: "เหนือ", dateReq: "2026-09-10", place: "อาคาร ก" },
  { id: "done", status: "done", deposit: 50, demolish: 10, fee: 3, area: "ใต้", dateReq: "2025-10-10", place: "อาคาร ข", demoReturn: "yes" },
  { id: "cancel", status: "cancel", deposit: 200, demolish: 0, area: "ตะวันออก", dateReq: "2024-01-01", place: "อาคาร ค" },
];

describe("buildGuaranteeExecutiveView", () => {
  it("preserves financial totals and builds a deterministic 12-month window", () => {
    const result = buildGuaranteeExecutiveView(items, "2026-09-29T00:00:00.000Z");
    expect(result.totalInstall).toBe(350);
    expect(result.installRefunded).toBe(50);
    expect(result.installPending).toBe(300);
    expect(result.totalDemo).toBe(30);
    expect(result.demoRefunded).toBe(10);
    expect(result.totalInsurance).toBe(380);
    expect(result.successPct).toBeCloseTo(60 / 380 * 100);
    expect(result.months).toHaveLength(12);
    expect(result.months[0]).toMatchObject({ year: 2025, month: 9, deposit: 60, fee: 3 });
    expect(result.months[11]).toMatchObject({ year: 2026, month: 8, deposit: 120, fee: 7 });
  });

  it("excludes completed and cancelled cases from active area and top-outstanding views", () => {
    const result = buildGuaranteeExecutiveView(items, "2026-09-29T00:00:00.000Z");
    expect(result.areas).toEqual([{ label: "เหนือ", amount: 100 }]);
    expect(result.topOutstanding.map((entry) => entry.item.id)).toEqual(["active"]);
    expect(result.pendingByStatus.reduce((sum, entry) => sum + entry.amount, 0)).toBe(300);
  });

  it("rejects an invalid reference timestamp", () => {
    expect(() => buildGuaranteeExecutiveView([], "not-a-date")).toThrow("generatedAt must be an ISO date");
  });
});

describe("management report source-of-truth parity", () => {
  const timestamp = "2026-09-29T00:00:00.000Z";
  it("matches register totals and excludes cancelled money", () => {
    const report = buildGuaranteeManagementReport(items, timestamp);
    expect(report.finance).toEqual(getSidebarFinancialMetrics(items));
    expect(report.total).toBe(180);
    expect(report.refunded).toBe(60);
    expect(report.excludedCount).toBe(1);
    expect(report.areas.reduce((sum, row) => sum + row.amount, 0)).toBe(report.finance.totalOutstandingAmount);
    expect(report.statuses.reduce((sum, row) => sum + row.amount, 0)).toBe(report.finance.totalOutstandingAmount);
  });
  it("retains On Service removal deposits and respects the removal return flag", () => {
    const rows: DepositItem[] = [{ id: "on-service", status: "done", deposit: 100, demolish: 80, demoReturn: "no", area: "A" },
      { id: "returned", status: "fin", deposit: 10, demolish: 20, demoReturn: "yes", area: "B" }];
    const report = buildGuaranteeManagementReport(rows, timestamp);
    expect(report.removal.onServiceAmount).toBe(80);
    expect(report.removal.refundedAmount).toBe(20);
    expect(report.refunded).toBe(120);
    expect(report.finance.totalOutstandingAmount).toBe(90);
    expect(report.topOutstanding[0]).toMatchObject({ item: { id: "on-service" }, amount: 80 });
  });
  it("uses an explicit unknown-area bucket and avoids a fabricated rate for no deposits", () => {
    const empty = buildGuaranteeManagementReport([], timestamp);
    expect(empty.refundPct).toBeNull();
    expect(empty.topOutstanding).toEqual([]);
    const report = buildGuaranteeManagementReport([{ deposit: 25, status: "fin" }], timestamp);
    expect(report.areas).toEqual([{ key: "ไม่ระบุพื้นที่", label: "ไม่ระบุพื้นที่", count: 1, amount: 25 }]);
  });

  it("keeps exact contributor records and actionable evidence/due-date findings", () => {
    const report = buildGuaranteeManagementReport([
      { id: "bottleneck", status: "tl", complete_tl: "on process", deposit: "10.10", dateDue: "2026-01-01", pdf_payment: "" },
      { id: "missing-due", status: "fin", deposit: "20.20", dateDue: "", pdf_payment: "" },
      { id: "cancelled", status: "cancel", deposit: "999.99" },
    ], "2026-01-20T00:00:00.000Z");
    expect(report.statuses.find((row) => row.key === "tl_process")?.contributorIds).toEqual(["bottleneck"]);
    expect(report.areas.find((row) => row.key === "ไม่ระบุพื้นที่")?.contributorIds).toEqual(["bottleneck", "missing-due"]);
    expect(report.actionItems.map((entry) => entry.item.id)).toEqual(["bottleneck", "missing-due"]);
    expect(report.actionItems.find((entry) => entry.item.id === "missing-due")?.reasons).toContain("ไม่มีข้อมูลวันครบกำหนด");
    expect(report.actionItems.find((entry) => entry.item.id === "bottleneck")?.missingDocuments).toContain("หลักฐานการจ่าย");
  });

  it("exports filtered Thai UTF-8 CSV with exact totals and formula-safe quoting", () => {
    const csv = buildGuaranteeReportCsv([{ id: "csv-1", status: "fin", place: '=สูตร,"ไทย"', deposit: "10.10", demolish: "2.20", fee: "1.00", other: "0.30" }], "2026-01-20T00:00:00.000Z", { area: "เหนือ", owner: "เจ้าของ" });
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"พื้นที่","เหนือ"');
    expect(csv).toContain('"รายงานสร้างเมื่อ","2026-01-20T00:00:00.000Z"');
    expect(csv).toContain('"ข้อมูลรายการอัปเดตล่าสุด",""');
    expect(csv).toContain('"ยอดเงินประกัน","12.30"');
    expect(csv).toContain('"ค่าใช้จ่าย","1.30"');
    expect(csv).toContain('"\'=สูตร,""ไทย"""');
  });
});
