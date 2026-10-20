import { describe, expect, it } from "vitest";
import { isWorkView } from "@/lib/work-view";

describe("work view routing contract", () => {
  it("recognizes every explicit Work screen", () => {
    expect(["mine", "mine-list", "team", "assign", "people", "tracker", "kpi", "reports", "activity", "due"].every(isWorkView)).toBe(true);
  });

  it("rejects unknown views instead of falling back to my work", () => {
    expect(isWorkView("queue")).toBe(false);
    expect(isWorkView("debug")).toBe(false);
  });
});
