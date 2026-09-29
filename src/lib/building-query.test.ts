import { describe, expect, it } from "vitest";
import { buildingQueryParams, parseBuildingQuery } from "@/lib/building-query";
describe("building query", () => {
  it("parses bounded URL filters", () => {
    const value = parseBuildingQuery({ q: "  อาคาร A ", page: "2", limit: "200", status: "MOU" });
    expect(value).toMatchObject({ query: "อาคาร A", page: 2, limit: 200, status: "MOU" });
    expect(buildingQueryParams(value).get("q")).toBe("อาคาร A");
  });
  it("rejects oversized or invalid pagination", () => {
    expect(() => parseBuildingQuery({ page: "0" })).toThrow();
    expect(() => parseBuildingQuery({ q: "x".repeat(121) })).toThrow();
  });
});
