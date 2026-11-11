import type { Metadata } from "next";
export const metadata: Metadata = { title: copy.pages.buildings };

import { copy } from "@/lib/copy";
import { AccessDenied } from "@/components/access-denied";
import { getAccessContext } from "@/lib/access";
import { listPermissionBuildings } from "@/lib/permission-building-server";
import { buildingQueryParams, parseBuildingQuery } from "@/lib/building-query";
import { BuildingsProgressiveWorkspace } from "./buildings-progressive-workspace";
import Link from "next/link";

import "./permission-buildings.css";
import "@/features/buildings/map/building-map.css";

type SearchParams = Record<string, string | string[] | undefined>;
const scalar = (params: SearchParams, key: string) => typeof params[key] === "string" ? params[key] as string : "";

export default async function BuildingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const access = await getAccessContext("buildings");
  if (!access.allowed) return <AccessDenied moduleName="ข้อมูลอาคาร" />;
  const createGrants = access.subject?.grants.filter((grant) => grant.permission === "building.record.create") ?? [];
  const canCreate = createGrants.some((grant) => grant.scope === "ALL" || grant.scope === "TEAM" && Boolean(access.subject?.teamIds.length) || grant.scope === "SELECTED_TEAMS" && Boolean(grant.selectedTeamId));
  const params = await searchParams;
  const query = parseBuildingQuery(params);
  const mapFirst = scalar(params, "view") !== "list";
  const scopeCap = 10_000;
  const data = await listPermissionBuildings(mapFirst ? { ...query, limit: 200, page: 1, after: "", before: "" } : { ...query, limit: Math.min(query.limit, 100) });
  const truncated = mapFirst && Boolean(data.nextCursor);
  if (data.state !== "ready") return <main className="permission-buildings-state" role="status">
    {data.state === "not_configured" ? copy.feedback.unavailable : "โหลดข้อมูลอาคารไม่สำเร็จ กรุณาลองอีกครั้ง"}
  </main>;
  return <main data-ui-screen="buildings">
    <BuildingsProgressiveWorkspace key={buildingQueryParams(query).toString() + String(mapFirst)} nextCursor={mapFirst ? data.nextCursor : null} queryParams={buildingQueryParams(query).toString()} buildings={data.items} total={data.total} canCreate={canCreate} initialQuery={query.query} initialFilters={query} apiKey={process.env.LONGDO_MAP_API_KEY ?? ""} initialView={mapFirst ? "map" : "list"} initialSelectedId={scalar(params, "buildingId")} initialProvince={scalar(params, "province")} initialMode={scalar(params, "mode")} initialCategory={scalar(params, "category")} initialHeatMetric={scalar(params, "heatMetric")} initialFromDate={scalar(params, "from")} initialToDate={scalar(params, "to")} truncated={truncated} loadedCount={data.items.length} scopeCap={scopeCap} />
    {!mapFirst && <nav className="permission-pagination" aria-label="หน้าผลลัพธ์">
      {data.previousCursor ? <Link href={`/buildings?${buildingQueryParams(query, { page: Math.max(1, data.page - 1), before: data.previousCursor, after: "" })}`}>หน้าก่อนหน้า</Link> : <span/>}
      <span>{data.items.length === data.total && !data.previousCursor && !data.nextCursor
        ? `แสดง ${data.total.toLocaleString("th-TH")} จาก ${data.total.toLocaleString("th-TH")} อาคาร`
        : `หน้า ${data.page.toLocaleString("th-TH")} · แสดงสูงสุด ${data.pageSize.toLocaleString("th-TH")} จาก ${data.total.toLocaleString("th-TH")} อาคาร`}</span>
      {data.nextCursor ? <Link href={`/buildings?${buildingQueryParams(query, { page: data.page + 1, after: data.nextCursor, before: "" })}`}>หน้าถัดไป</Link> : <span/>}
    </nav>}
  </main>;
  }
