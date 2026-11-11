import { requireApiIdentity } from "@/lib/request-context";
import { depositListQuery } from "@/lib/deposit-list-query";
import { readDepositListPage } from "@/lib/deposit-list-server";
export async function GET(request: Request) {
  const identity = await requireApiIdentity(); if (!identity.ok) return identity.response;
  const query = depositListQuery.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return Response.json({ message: "ตัวกรองไม่ถูกต้อง" }, { status: 400 });
  try { return Response.json(await readDepositListPage(query.data), { headers: { "Cache-Control": "private, no-store" } }); }
  catch { return Response.json({ message: "โหลดรายการไม่สำเร็จ กรุณาลองใหม่" }, { status: 503 }); }
}
