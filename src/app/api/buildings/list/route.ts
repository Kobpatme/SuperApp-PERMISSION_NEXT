import { requireApiIdentity } from "@/lib/request-context";
import { parseBuildingQuery } from "@/lib/building-query";
import { listPermissionBuildings } from "@/lib/permission-building-server";
export async function GET(request: Request) {
  const identity = await requireApiIdentity(); if (!identity.ok) return identity.response;
  try {
    const query = parseBuildingQuery(Object.fromEntries(new URL(request.url).searchParams));
    const page = await listPermissionBuildings({ ...query, limit: Math.min(query.limit, 500) });
    return Response.json(page, { status: page.state === "ready" ? 200 : 503, headers: { "Cache-Control": "private, no-store" } });
  } catch { return Response.json({ message: "ตัวกรองไม่ถูกต้องหรือโหลดอาคารไม่สำเร็จ" }, { status: 400 }); }
}
