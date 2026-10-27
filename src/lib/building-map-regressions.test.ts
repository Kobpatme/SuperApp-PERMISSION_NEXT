import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import { buildingMapHeatWeight, type BuildingMapFee } from "@/lib/building-map-domain";
import { applyBuildingMapUrlState, parseBuildingMapUrl } from "@/lib/building-map-url";
import { getInitialMapFit } from "@/features/buildings/map/longdo-map-canvas";

const fees: BuildingMapFee[] = [
  { source_field: "one", cost_type: "CAPEX", revenue_period: null, payable: true, amount: "100" },
  { source_field: "two", cost_type: "CAPEX", revenue_period: null, payable: true, amount: "300" },
];

describe("Buildings map regressions", () => {
  it("waits for valid points, prioritizes the selected point, and chooses single or multi fit", () => {
    const empty = getInitialMapFit([], "selected");
    expect(empty).toBeNull();

    const point = { id: "one", name: "One", code: "1", latitude: 13.75, longitude: 100.5 };
    expect(getInitialMapFit([{ ...point, latitude: 0, longitude: 0 }], null)).toBeNull();
    expect(getInitialMapFit([point], null)).toEqual({ kind: "point", point });
    expect(getInitialMapFit([point, { ...point, id: "two", latitude: 14, longitude: 101 }], "two")).toEqual({
      kind: "point", point: { ...point, id: "two", latitude: 14, longitude: 101 },
    });
    expect(getInitialMapFit([point, { ...point, id: "two", latitude: 14, longitude: 101 }], null)).toEqual({
      kind: "bounds", bounds: { minLon: 100.5, minLat: 13.75, maxLon: 101, maxLat: 14 },
    });
  });

  it("keeps heat metrics materially different while using payable category semantics", () => {
    expect(buildingMapHeatWeight(fees, "CAPEX", "building_count", 2, new Decimal(400))).toBe(1);
    expect(buildingMapHeatWeight(fees, "CAPEX", "fee_count", 2, new Decimal(400))).toBe(1);
    expect(buildingMapHeatWeight(fees.slice(0, 1), "CAPEX", "fee_count", 2, new Decimal(400))).toBe(0.5);
    expect(buildingMapHeatWeight(fees.slice(0, 1), "CAPEX", "amount", 2, new Decimal(400))).toBe(0.25);
  });

  it("parses map state consistently and preserves unknown, pagination, reset, and heat metric params", () => {
    const state = parseBuildingMapUrl("?view=list&q=alpha&mode=heatmap&heatMetric=amount&buildingId=b1&page=3&after=cursor&reset=1&unknown=x");
    expect(state).toMatchObject({ view: "list", query: "alpha", mode: "heatmap", heatMetric: "amount", selectedId: "b1" });
    const params = applyBuildingMapUrlState(new URLSearchParams("page=3&after=cursor&reset=1&unknown=x"), state);
    expect(params.get("page")).toBe("3"); expect(params.get("after")).toBe("cursor"); expect(params.get("reset")).toBe("1"); expect(params.get("unknown")).toBe("x");
    expect(params.get("heatMetric")).toBe("amount");
    expect(parseBuildingMapUrl(params).selectedId).toBe("b1");
  });

  it.each(["amount", "fee_count"] as const)("preserves %s across every map-mode URL transition", (heatMetric) => {
    let state = parseBuildingMapUrl(`?mode=heatmap&heatMetric=${heatMetric}&buildingId=b1&page=3&after=cursor`);
    for (const mode of ["buildings", "status", "expense", "heatmap"] as const) {
      state = { ...state, mode };
      const params = applyBuildingMapUrlState(new URLSearchParams("page=3&after=cursor"), state);
      expect(params.get("heatMetric")).toBe(heatMetric);
      expect(params.get("page")).toBe("3");
      expect(params.get("after")).toBe("cursor");
      state = parseBuildingMapUrl(params);
      expect(state.heatMetric).toBe(heatMetric);
    }
  });

  it("canonicalizes invalid enum values to safe defaults without dropping unrelated URL state", () => {
    const state = parseBuildingMapUrl("?mode=bad&category=bad&heatMetric=bad&view=bad&foo=bar");
    expect(state).toMatchObject({ view: "map", mode: "buildings", category: "CAPEX", heatMetric: "building_count" });
    const params = applyBuildingMapUrlState(new URLSearchParams("foo=bar"), state);
    expect(params.get("foo")).toBe("bar"); expect(params.get("mode")).toBe("buildings"); expect(params.has("view")).toBe(false);
  });
});
