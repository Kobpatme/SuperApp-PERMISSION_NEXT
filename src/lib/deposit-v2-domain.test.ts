import { describe, expect, it } from "vitest";
import { depositPreviewItems } from "@/lib/deposit-v2-preview";
import { getActionNotifications, getInstallationDepositMetrics, getListPageKpiMetrics, getOperationalAnalytics,
  getRemovalDepositMetrics, getSidebarFinancialMetrics, getSmartWorkQueue, getWorkflowStatusKey, isOnServiceItem, parseDateValue } from "@/lib/deposit-v2-domain";
import { depositItemInputSchema, validateDepositTransition } from "@/lib/deposit-v2-workflow";

describe("V2 building deposit rules", () => {
  it("separates installation, removal, On Service and cancellation", () => {
    const installation = getInstallationDepositMetrics(depositPreviewItems);
    const removal = getRemovalDepositMetrics(depositPreviewItems);
    const finance = getSidebarFinancialMetrics(depositPreviewItems);
    expect(installation.totalAmount).toBe(88000);
    expect(installation.outstandingAmount).toBe(71000);
    expect(removal.onServiceAmount).toBe(6000);
    expect(removal.offServicePendingAmount).toBe(2500);
    expect(finance.totalOutstandingAmount).toBe(96500);
    expect(isOnServiceItem(depositPreviewItems[7])).toBe(true);
    expect(getWorkflowStatusKey(depositPreviewItems[8])).toBe("off_service_pending");
    expect(getListPageKpiMetrics(depositPreviewItems).completedCount).toBe(3);
  });
  it("prioritizes overdue and missing evidence while excluding normal On Service", () => {
    const now = new Date("2026-09-25T12:00:00+07:00");
    const queue = getSmartWorkQueue(depositPreviewItems, now);
    expect(queue.some((entry) => entry.item.id === "example-on-service")).toBe(false);
    expect(queue[0].priority).toBe("high");
    expect(queue.find((entry) => entry.item.id === "example-off-service")?.missingDocuments).toContain("หลักฐาน Off Service");
    expect(getActionNotifications(depositPreviewItems, now).length).toBeGreaterThan(0);
    expect(getOperationalAnalytics(depositPreviewItems, now).overdueCount).toBeGreaterThan(0);
  });
  it("handles Buddhist calendar dates", () => {
    expect(parseDateValue("09/09/2569 09:00:00")?.getFullYear()).toBe(2026);
  });
});

describe("server-side workflow validation", () => {
  it("requires evidence before sending to TL", () => {
    expect(() => validateDepositTransition({ status: "att", place: "A" }, "tl")).toThrow("หลักฐาน");
    expect(() => validateDepositTransition({ status: "att", place: "A", tl_team: "BKK", pdf_payment: "https://example.invalid", pdf_layout: "https://example.invalid/drawing.pdf" }, "tl")).not.toThrow();
  });
  it("requires reasons for cancellation and rejects invalid jumps", () => {
    expect(() => validateDepositTransition({ status: "fin" }, "Cancel")).toThrow("เหตุผล");
    expect(() => validateDepositTransition({ status: "new" }, "done")).toThrow();
  });
  it("requires details for other costs and HTTPS evidence", () => {
    const input = { place: "A", area: "", customer: "", cid: "", pr: "", tl_team: "", inspected_by: "", deposit: 0, demolish: 0, fee: 0, other: 20,
      other_desc: "", dateReq: "", dateDue: "", tl_due_date: "", date_return: "", service_cancel_date: "", depReturn: "No", demoReturn: "No",
      pdf_payment: "http://unsafe.invalid", pdf_tl_work: "", pdf_user_final: "", pdf_demo_off: "" };
    expect(depositItemInputSchema.safeParse(input).success).toBe(false);
    expect(depositItemInputSchema.safeParse({ ...input, other_desc: "ค่าสำรวจ", pdf_payment: "https://example.invalid" }).success).toBe(true);
  });
});
