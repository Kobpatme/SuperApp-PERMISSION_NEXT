export type BuildingMapMode = "buildings" | "status" | "expense" | "heatmap";
export type BuildingMapHeatMetric = "building_count" | "fee_count" | "amount";

export type BuildingMapUrlState = {
  view: "map" | "list";
  query: string;
  filters: Record<"status" | "group" | "type" | "installType" | "surveyType" | "area", string>;
  province: string;
  mode: BuildingMapMode;
  category: "CAPEX" | "OPEX_MONTHLY" | "OPEX_ANNUAL" | "DEPOSIT" | "UNCLASSIFIED";
  heatMetric: BuildingMapHeatMetric;
  fromDate: string;
  toDate: string;
  selectedId: string;
};

const modes: BuildingMapMode[] = ["buildings", "status", "expense", "heatmap"];
const categories: BuildingMapUrlState["category"][] = ["CAPEX", "OPEX_MONTHLY", "OPEX_ANNUAL", "DEPOSIT", "UNCLASSIFIED"];
const heatMetrics: BuildingMapHeatMetric[] = ["building_count", "fee_count", "amount"];
const filterKeys = ["status", "group", "type", "installType", "surveyType", "area"] as const;

export const emptyBuildingMapUrlState = (): BuildingMapUrlState => ({
  view: "map", query: "", filters: { status: "", group: "", type: "", installType: "", surveyType: "", area: "" },
  province: "", mode: "buildings", category: "CAPEX", heatMetric: "building_count", fromDate: "", toDate: "", selectedId: "",
});

export function parseBuildingMapUrl(search: string | URLSearchParams): BuildingMapUrlState {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const state = emptyBuildingMapUrlState();
  state.view = params.get("view") === "list" ? "list" : "map";
  state.query = params.get("q") ?? "";
  for (const key of filterKeys) state.filters[key] = params.get(key) ?? "";
  state.province = params.get("province") ?? "";
  const mode = params.get("mode"); if (mode && modes.includes(mode as BuildingMapMode)) state.mode = mode as BuildingMapMode;
  const category = params.get("category"); if (category && categories.includes(category as BuildingMapUrlState["category"])) state.category = category as BuildingMapUrlState["category"];
  const heatMetric = params.get("heatMetric"); if (heatMetric && heatMetrics.includes(heatMetric as BuildingMapHeatMetric)) state.heatMetric = heatMetric as BuildingMapHeatMetric;
  state.fromDate = params.get("from") ?? ""; state.toDate = params.get("to") ?? ""; state.selectedId = params.get("buildingId") ?? "";
  return state;
}

/** Updates only canonical Buildings controls; pagination, reset, and unknown params remain untouched. */
export function applyBuildingMapUrlState(params: URLSearchParams, state: BuildingMapUrlState) {
  const values: Record<string, string> = { view: state.view === "list" ? "list" : "", q: state.query.trim(), ...state.filters,
    province: state.province, mode: state.mode, category: state.category, heatMetric: state.heatMetric,
    from: state.fromDate, to: state.toDate, buildingId: state.selectedId };
  for (const [key, value] of Object.entries(values)) { if (value) params.set(key, value); else params.delete(key); }
  return params;
}

export function buildingMapStateSignature(state: BuildingMapUrlState) {
  return JSON.stringify(state);
}
