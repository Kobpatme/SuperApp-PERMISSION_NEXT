/* eslint-disable @next/next/no-css-tags -- Leaflet's self-hosted runtime CSS must be served alongside its JS assets. */
import { AccessDenied } from "@/components/access-denied";
import { getAccessContext } from "@/lib/access";
import { listPermissionBuildings } from "@/lib/permission-building-server";
import { buildingQueryParams, parseBuildingQuery } from "@/lib/building-query";
import Link from "next/link";
import { BuildingsWorkspace } from "./buildings-workspace";
import "./permission-buildings.css";

export default async function BuildingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const access = await getAccessContext("buildings");
  if (!access.allowed) return <AccessDenied moduleName="อาคารและค่าใช้จ่าย" />;
  const query = parseBuildingQuery(await searchParams);
  const data = await listPermissionBuildings(query);
  if (data.state !== "ready") return <main className="permission-buildings-state" role="status">
    {data.state === "not_configured" ? "ยังไม่ได้เชื่อมฐานข้อมูลกลาง" : "โหลดข้อมูลอาคารไม่สำเร็จ กรุณาลองอีกครั้ง"}
  </main>;
  return <>
    <link rel="stylesheet" href="/vendor/leaflet/leaflet.css" />
    <link rel="stylesheet" href="/vendor/leaflet-markercluster/MarkerCluster.css" />
    <link rel="stylesheet" href="/vendor/leaflet-markercluster/MarkerCluster.Default.css" />
    <BuildingsWorkspace key={buildingQueryParams(query).toString()} buildings={data.items} total={data.total} initialQuery={query.query} initialFilters={query} />
    <nav className="permission-pagination" aria-label="หน้าผลลัพธ์">
      {data.previousCursor ? <Link href={`/buildings?${buildingQueryParams(query, { page: Math.max(1, data.page - 1), before: data.previousCursor, after: "" })}`}>หน้าก่อนหน้า</Link> : <span/>}
      <span>หน้า {data.page.toLocaleString("th-TH")} · แสดงสูงสุด {data.pageSize.toLocaleString("th-TH")} จาก {data.total.toLocaleString("th-TH")} อาคาร</span>
      {data.nextCursor ? <Link href={`/buildings?${buildingQueryParams(query, { page: data.page + 1, after: data.nextCursor, before: "" })}`}>หน้าถัดไป</Link> : <span/>}
    </nav>
  </>;
}
