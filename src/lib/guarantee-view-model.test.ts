import { describe, expect, it } from "vitest";
import { buildGuaranteeExecutiveView } from "@/lib/guarantee-view-model";
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
