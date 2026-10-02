import { AccessDenied } from "@/components/access-denied";
import { getAccessContext } from "@/lib/access";
import { listPermissionBuildings } from "@/lib/permission-building-server";
import { buildingQueryParams, parseBuildingQuery } from "@/lib/building-query";
import { BuildingsWorkspace } from "./buildings-workspace";
import Link from "next/link";
import "./permission-buildings.css";
import "@/features/buildings/map/building-map.css";

export default async function BuildingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const access = await getAccessContext("buildings");
  if (!access.allowed) return <AccessDenied moduleName="อาคารและค่าใช้จ่าย" />;
  const createGrants = access.subject?.grants.filter((grant) => grant.permission === "building.record.create") ?? [];
  const canCreate = createGrants.some((grant) => grant.scope === "ALL" || grant.scope === "TEAM" && Boolean(access.subject?.teamIds.length) || grant.scope === "SELECTED_TEAMS" && Boolean(grant.selectedTeamId));
  const query = parseBuildingQuery(await searchParams);
  const data = await listPermissionBuildings(query);
  if (data.state !== "ready") return <main className="permission-buildings-state" role="status">
    {data.state === "not_configured" ? "ยังไม่ได้เชื่อมฐานข้อมูลกลาง" : "โหลดข้อมูลอาคารไม่สำเร็จ กรุณาลองอีกครั้ง"}
  </main>;
  return <>
    <BuildingsWorkspace buildings={data.items} total={data.total} canCreate={canCreate} mapApiKey={process.env.LONGDO_MAP_API_KEY ?? ""} initialQuery={query.query} initialFilters={query} />
    <nav className="permission-pagination" aria-label="หน้าผลลัพธ์">
      {data.previousCursor ? <Link href={`/buildings?${buildingQueryParams(query, { page: Math.max(1, data.page - 1), before: data.previousCursor, after: "" })}`}>หน้าก่อนหน้า</Link> : <span/>}
      <span>{data.items.length === data.total && !data.previousCursor && !data.nextCursor
        ? `แสดง ${data.total.toLocaleString("th-TH")} จาก ${data.total.toLocaleString("th-TH")} อาคาร`
        : `หน้า ${data.page.toLocaleString("th-TH")} · แสดงสูงสุด ${data.pageSize.toLocaleString("th-TH")} จาก ${data.total.toLocaleString("th-TH")} อาคาร`}</span>
      {data.nextCursor ? <Link href={`/buildings?${buildingQueryParams(query, { page: data.page + 1, after: data.nextCursor, before: "" })}`}>หน้าถัดไป</Link> : <span/>}
    </nav>
  </>;
}
