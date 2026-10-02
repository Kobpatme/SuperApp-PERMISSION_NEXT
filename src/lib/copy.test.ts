import { describe, expect, it } from "vitest";
import { copy, loginReason } from "./copy";
describe("auth feedback", () => {
  it("maps only approved reasons", () => {
    expect(loginReason("expired")).toBe(copy.auth.expired); expect(loginReason("signed-out")).toBe(copy.auth.signedOut);
    for (const value of [undefined, "database-error", "<script>", "unknown"]) expect(loginReason(value)).toBeUndefined();
  });
  it("rounds wait time up without displaying counters", () => { expect(copy.auth.rateLimited(1)).toContain("1 นาที"); expect(copy.auth.rateLimited(61)).toContain("2 นาที"); });
});
