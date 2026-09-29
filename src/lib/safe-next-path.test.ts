import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("keeps internal paths and query strings", () => {
    expect(safeNextPath("/buildings?status=active")).toBe("/buildings?status=active");
  });

  it("rejects external and malformed paths", () => {
    expect(safeNextPath("https://example.com")).toBe("/");
    expect(safeNextPath("//example.com")).toBe("/");
    expect(safeNextPath("/\\example.com")).toBe("/");
  });
});
