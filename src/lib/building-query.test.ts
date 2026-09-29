import { describe, expect, it } from "vitest";
import { buildingQueryParams, decodeBuildingCursor, defaultBuildingPageSize, encodeBuildingCursor, parseBuildingQuery } from "@/lib/building-query";
describe("building query", () => {
  it("parses bounded URL filters", () => {
    const value = parseBuildingQuery({ q: "  อาคาร A ", page: "2", limit: "200", status: "MOU" });
    expect(value).toMatchObject({ query: "อาคาร A", page: 2, limit: 200, status: "MOU" });
    expect(buildingQueryParams(value).get("q")).toBe("อาคาร A");
  });
  it("loads the full operational building set by default", () => {
    expect(parseBuildingQuery({}).limit).toBe(defaultBuildingPageSize);
  });
  it("round-trips a stable composite keyset cursor", () => {
    const value = { nameTh: "อาคาร ก", id: "11111111-1111-4111-8111-111111111111" };
    expect(decodeBuildingCursor(encodeBuildingCursor(value))).toEqual(value);
    expect(decodeBuildingCursor("invalid")).toBeNull();
  });
  it("keeps only one cursor direction in generated links", () => {
    const query = parseBuildingQuery({ after: encodeBuildingCursor({ nameTh: "A", id: "11111111-1111-4111-8111-111111111111" }) });
    const previous = buildingQueryParams(query, { page: 1, before: "previous", after: "" });
    expect(previous.get("before")).toBe("previous");
    expect(previous.has("after")).toBe(false);
    expect(() => parseBuildingQuery({ after: "next", before: "previous" })).toThrow();
  });
  it("rejects oversized or invalid pagination", () => {
    expect(() => parseBuildingQuery({ page: "0" })).toThrow();
    expect(() => parseBuildingQuery({ q: "x".repeat(121) })).toThrow();
  });
});
