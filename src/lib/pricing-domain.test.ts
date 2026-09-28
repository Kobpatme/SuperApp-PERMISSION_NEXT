import { describe, expect, it } from "vitest";
import { assertEstimateTransition, assertIndependentApproval, calculateEstimate } from "@/lib/pricing-domain";

describe("pricing domain", () => {
  it("calculates exact version totals with explicit rounding", () => {
    expect(calculateEstimate({ taxRate: "0.07", items: [
      { description: "Cable", quantity: "0.1", unit: "m", unitPrice: "0.2" },
      { description: "Permit", quantity: "1", unit: "job", unitPrice: "100.00" },
    ] })).toMatchObject({ subtotal: "100.02", tax: "7.00", total: "107.02" });
  });
  it("requires revision rather than editing an approved version", () => {
    expect(() => assertEstimateTransition("revision_requested", "submitted")).not.toThrow();
    expect(() => assertEstimateTransition("approved", "draft")).toThrow();
  });
  it("prevents self approval", () => expect(() => assertIndependentApproval("u1", "u1")).toThrow("Self-approval"));
});
