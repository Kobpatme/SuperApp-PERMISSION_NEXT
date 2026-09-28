import { describe, expect, it } from "vitest";
import { assertGuaranteeTransition, validateRefundTotals } from "@/lib/guarantee-domain";

describe("guarantee workflow and finance", () => {
  it("allows explicit progress and prevents reopening final cases", () => {
    expect(() => assertGuaranteeTransition("submitted", "finance_review")).not.toThrow();
    expect(() => assertGuaranteeTransition("refunded", "submitted")).toThrow();
    expect(() => assertGuaranteeTransition("draft", "refunded")).toThrow();
  });
  it("calculates exact partial refunds without floating point drift", () => {
    expect(validateRefundTotals({ depositTotal: "0.30", existingRefundTotal: "0.10", requestedAmount: "0.20" })).toEqual({ remaining: "0.00", fullyRefunded: true });
  });
  it("rejects refunds above recorded deposits", () => {
    expect(() => validateRefundTotals({ depositTotal: "1000.00", existingRefundTotal: "800.00", requestedAmount: "200.01" })).toThrow("Refund exceeds recorded deposits");
  });
});
