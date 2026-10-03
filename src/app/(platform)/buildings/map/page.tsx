import type { Metadata } from "next";
export const metadata: Metadata = { title: copy.pages.buildings_map };

import { copy } from "@/lib/copy";
import { AccessDenied } from "@/components/access-denied";
import { getAccessContext } from "@/lib/access";
import { parseBuildingQuery } from "@/lib/building-query";
import { listPermissionBuildings } from "@/lib/permission-building-server";
import { MapWorkspace, type MapBuilding } from "@/features/buildings/map/map-workspace";
import "@/features/buildings/map/building-map.css";

type SearchParams = Record<string, string | string[] | undefined>;
const scalar = (params: SearchParams, key: string) => typeof params[key] === "string" ? params[key] as string : "";

export default async function BuildingMapPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, access] = await Promise.all([searchParams, getAccessContext("buildings")]);
  if (!access.allowed) return <AccessDenied moduleName="อาคารและค่าใช้จ่าย" />;
  const rawBuildingId = scalar(params, "buildingId");
  const selectedBuildingId = /^[0-9a-f-]{36}$/i.test(rawBuildingId) ? rawBuildingId : "";
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
  const buildings: MapBuilding[] = allItems.map((item) => ({ id: item.id, code: item.code, nameTh: item.nameTh, nameEn: item.nameEn,
    status: item.status, area: item.area, province: item.province, subdistrict: item.subdistrict, district: item.district, address: item.address, location: item.location, lat: item.lat, lng: item.lng,
    locationVerified: item.locationVerified, locationSource: item.locationSource, conditionEffectiveAt: item.conditionEffectiveAt,
    canUpdateLocation: item.canUpdateLocation, boq: item.boq ? { fees: item.boq.fees.map((fee) => ({ source_field: fee.source_field, cost_type: fee.cost_type,
      revenue_period: fee.revenue_period, payable: fee.payable, amount: fee.amount })) } : null }));
  return <MapWorkspace buildings={buildings} apiKey={process.env.LONGDO_MAP_API_KEY ?? ""} selectedBuildingId={selectedBuildingId}
    initialQuery={scalar(params, "q")} initialProvince={scalar(params, "province")} initialStatus={scalar(params, "status")}
    initialMode={scalar(params, "mode")} initialCategory={scalar(params, "category")} initialHeatMetric={scalar(params, "heatMetric")}
    initialFromDate={scalar(params, "from")} initialToDate={scalar(params, "to")} truncated={truncated} />;
}
