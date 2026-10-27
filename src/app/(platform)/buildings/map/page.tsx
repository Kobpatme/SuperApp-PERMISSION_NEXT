import type { Metadata } from "next";
export const metadata: Metadata = { title: copy.pages.buildings_map };

import { copy } from "@/lib/copy";
import { AccessDenied } from "@/components/access-denied";
import { getAccessContext } from "@/lib/access";
import { parseBuildingQuery } from "@/lib/building-query";
import { listPermissionBuildings } from "@/lib/permission-building-server";
import { BuildingsWorkspace } from "../buildings-workspace";
import "../permission-buildings.css";
import "@/features/buildings/map/building-map.css";

type SearchParams = Record<string, string | string[] | undefined>;
const scalar = (params: SearchParams, key: string) => typeof params[key] === "string" ? params[key] as string : "";

export default async function BuildingMapPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, access] = await Promise.all([searchParams, getAccessContext("buildings")]);
  if (!access.allowed) return <AccessDenied moduleName="ข้อมูลอาคาร" />;
  const createGrants = access.subject?.grants.filter((grant) => grant.permission === "building.record.create") ?? [];
  const canCreate = createGrants.some((grant) => grant.scope === "ALL" || grant.scope === "TEAM" && Boolean(access.subject?.teamIds.length) || grant.scope === "SELECTED_TEAMS" && Boolean(grant.selectedTeamId));
  const rawBuildingId = scalar(params, "buildingId");
  const selectedBuildingId = /^[0-9a-f-]{36}$/i.test(rawBuildingId) ? rawBuildingId : "";
  const scopeCap = 10_000;
  let query = parseBuildingQuery({ limit: "2000" });
  const firstPage = await listPermissionBuildings(query);
  const items = [...firstPage.items];
  let nextCursor = firstPage.nextCursor;
  let pageNumber = firstPage.page;
  let state = firstPage.state;
  for (let page = 1; nextCursor && page < 5; page += 1) {
    query = parseBuildingQuery({ limit: "2000", after: nextCursor, page: String(pageNumber + 1) });
    const result = await listPermissionBuildings(query);
    if (result.state !== "ready") { state = result.state; break; }
    items.push(...result.items);
    pageNumber = result.page;
    nextCursor = result.nextCursor;
  }
  const truncated = Boolean(nextCursor);
  if (state !== "ready") return <main className="building-map-state" role="status">{state === "not_configured" ? copy.feedback.unavailable : "โหลดข้อมูลแผนที่อาคารไม่สำเร็จ กรุณาลองอีกครั้ง"}</main>;
  const [focusData] = await Promise.all([selectedBuildingId
    ? listPermissionBuildings(parseBuildingQuery({ buildingId: selectedBuildingId, limit: "20" })) : Promise.resolve(null)]);
  const allItems = focusData?.items.length ? [...focusData.items, ...items.filter((item) => !focusData.items.some((focus) => focus.id === item.id))] : items;
  const filters = { status: scalar(params, "status"), group: scalar(params, "group"), type: scalar(params, "type"), installType: scalar(params, "installType"), surveyType: scalar(params, "surveyType"), area: scalar(params, "area") };
  return <main data-ui-screen="buildings"><BuildingsWorkspace buildings={allItems} total={firstPage.total} canCreate={canCreate} initialQuery={scalar(params, "q")} initialFilters={filters} apiKey={process.env.LONGDO_MAP_API_KEY ?? ""} initialView={scalar(params, "view") === "list" ? "list" : "map"} initialSelectedId={selectedBuildingId} initialProvince={scalar(params, "province")} initialMode={scalar(params, "mode")} initialCategory={scalar(params, "category")} initialHeatMetric={scalar(params, "heatMetric")} initialFromDate={scalar(params, "from")} initialToDate={scalar(params, "to")} truncated={truncated} loadedCount={items.length} scopeCap={scopeCap} /></main>;
}
