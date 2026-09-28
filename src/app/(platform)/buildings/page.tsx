/* eslint-disable @next/next/no-css-tags -- Leaflet's self-hosted runtime CSS must be served alongside its JS assets. */
import { AccessDenied } from "@/components/access-denied";
import { getAccessContext } from "@/lib/access";
import { listPermissionBuildings } from "@/lib/permission-building-server";
import { BuildingsWorkspace } from "./buildings-workspace";
import "./permission-buildings.css";

export default async function BuildingsPage() {
  const access = await getAccessContext("buildings");
  if (!access.allowed) return <AccessDenied moduleName="อาคารและค่าใช้จ่าย" />;
  const data = await listPermissionBuildings("", 1, 2000);
  if (data.state !== "ready") return <main className="permission-buildings-state" role="status">
    {data.state === "not_configured" ? "ยังไม่ได้เชื่อมฐานข้อมูลกลาง" : "โหลดข้อมูลอาคารไม่สำเร็จ กรุณาลองอีกครั้ง"}
  </main>;
  return <>
    <link rel="stylesheet" href="/vendor/leaflet/leaflet.css" />
    <link rel="stylesheet" href="/vendor/leaflet-markercluster/MarkerCluster.css" />
    <link rel="stylesheet" href="/vendor/leaflet-markercluster/MarkerCluster.Default.css" />
    <BuildingsWorkspace buildings={data.items} total={data.total} />
  </>;
}
