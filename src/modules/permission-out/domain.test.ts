import { describe, expect, it } from "vitest";
import { analyzeRoutes, calculateFees, deduplicate, distance, filterSegments, formulaSchema, routeSchema, stripSensitive, summarizeDiff, type Segment } from "./domain";
import { csvCell, routeKml } from "./export";

const line = (key: string, coords: [number, number][] = [[100, 13], [100.001, 13]]) => routeSchema.parse({ key, name: key, coords });
const options = { threshold: 5, interval: 5, dedupe: false };
const policy = formulaSchema.parse({ name: "Synthetic source v2", polesPerKm: "29", rate: "2.8", surchargePercent: "5", effectiveFrom: "2026-01-01T00:00:00Z", rounding: "summary_half_up_2" });
describe("Permission Out frozen source geometry contract", () => {
  it("emits base-only New and compare-only Remove without resampling coordinates", () => {
    const route = line("a");
    expect(analyzeRoutes([route], [], options)[0]).toMatchObject({ status: "new", overlapType: "none", coords: route.coords });
    expect(analyzeRoutes([], [route], options)[0].status).toBe("remove");
  });
  it("emits Same once for coincident and reversed lines", () => {
    for (const coords of [[[100,13],[100.001,13]], [[100.001,13],[100,13]]] as [number,number][][]) {
      const result = analyzeRoutes([line("a")], [line("b", coords)], options);
      expect(result).toHaveLength(1); expect(result[0]).toMatchObject({ status: "same", overlapType: "full" });
      expect(result[0].length).toBeCloseTo(distance([100,13],[100.001,13]), 5);
    }
  });
  it("preserves separated New/Remove and partial parent overlap classifications", () => {
    const separate = analyzeRoutes([line("a")], [line("b", [[101,13],[101.001,13]])], options);
    expect(separate.map(s => s.status)).toEqual(["new","remove"]);
    const partial = analyzeRoutes([line("a")], [line("b", [[100.0005,13],[100.0015,13]])], options);
    expect(new Set(partial.map(s => s.status))).toEqual(new Set(["new","same","remove"]));
    expect(partial.every(s => s.overlapType === "partial")).toBe(true);
  });
  it("removes 90%-covered self duplicates only when selected and leaves source unchanged", () => {
    const input = [line("a"), line("b")], before = JSON.stringify(input);
    expect(deduplicate(input, 5, 5)).toHaveLength(1);
    expect(analyzeRoutes(input, [], options)).toHaveLength(2);
    expect(analyzeRoutes(input, [], { ...options, dedupe: true })).toHaveLength(1);
    expect(JSON.stringify(input)).toBe(before);
  });
  it("rejects zero intervals and pathological geographic extents before allocating huge grids", () => {
    expect(() => analyzeRoutes([line("a")], [line("b")], { ...options, interval: 0 })).toThrow();
    expect(() => analyzeRoutes([line("a", [[-170,-80],[170,80]])], [line("b")], options)).toThrow();
  });
});
describe("versioned exact fees, source v2", () => {
  const segment = { ...line("a"), length: 1000, status: "new", overlapType: "none", diameter: "10" } as Segment;
  it("uses supplied zero before distance and reports the pole source", () => {
    expect(calculateFees([{ ...segment, poles: 0 }], policy)).toMatchObject({ total: "0.00", items: [{ poles: 0, poleSource: "provided" }] });
    expect(calculateFees([segment], policy)).toMatchObject({ subtotal: "812.00", surcharge: "40.60", total: "852.60" });
  });
  it("sums unrounded costs before half-up summary rounding and flags missing diameters", () => {
    const formula = { ...policy, rate: "0.005", surchargePercent: "0" };
    expect(calculateFees([{ ...segment, diameter: "1", poles: 1 }, { ...segment, diameter: "1", poles: 1 }], formula).total).toBe("0.01");
    expect(calculateFees([{ ...segment, diameter: null }], policy).incomplete).toBe(true);
  });
});
describe("filters and exports", () => {
  it("uses the same selection for every export, escapes XML and spreadsheet formula prefixes", () => {
    const result = analyzeRoutes([line("<unsafe>")], [line("b", [[101,13],[101.001,13]])], options);
    const filtered = filterSegments(result, { status: "new" });
    expect(filtered).toHaveLength(1); expect(routeKml(filtered)).toContain("&lt;unsafe&gt;"); expect(routeKml(filtered)).not.toContain("<name>b</name>");
    expect(csvCell(" =HYPERLINK(1)")).toContain("' =HYPERLINK(1)");
  });
  it("strips sensitive raw keys and distinguishes removed, unchanged and new rows", () => {
    expect(stripSensitive({ "Total OPEX (Yearly)": "10", OPEX: "20", api_key:"secret", password:"secret", Name: "site" })).toEqual({ Name: "site" });
    expect(summarizeDiff([{ key: "a", data: 1 }, { key: "b", data: 2 }], [{ key: "a", data: 1 }, { key: "c", data: 3 }])).toEqual({ added: 1, removed: 1, updated: 0, unchanged: 1, total: 2 });
  });
  it("combines multiple status/province selections without filtering RD03 by Maxi-only rules",()=>{
    const base=analyzeRoutes([line("a")],[line("b",[[101,13],[101.001,13]])],options).map(s=>({...s,province:"กรุงเทพมหานคร"}));
    expect(filterSegments(base,{status:"new|remove",province:"กรุงเทพมหานคร|นนทบุรี",category:"customer"})).toHaveLength(2);
    expect(filterSegments(base,{status:["new"],province:["นนทบุรี"]})).toHaveLength(0);
  });
});
