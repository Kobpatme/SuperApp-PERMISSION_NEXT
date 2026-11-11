import { requireApiIdentity } from "@/lib/request-context";
import { depositListQuery } from "@/lib/deposit-list-query";
import { readDepositList } from "@/lib/deposit-list-server";
import { csvCell } from "@/lib/work-query";
import Decimal from "decimal.js";
import { getWorkflowStatusKey, parseDateValue, parseMoney, workflowLabels } from "@/lib/deposit-v2-domain";
export async function GET(request: Request) {
  const identity = await requireApiIdentity(); if (!identity.ok) return identity.response;
  const parsed = depositListQuery.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return Response.json({ message: "ตัวกรองไม่ถูกต้อง" }, { status: 400 });
  try {
    const query = parsed.data, { filtered } = await readDepositList(query);
    const rows = filtered.filter(item => { const date = parseDateValue(item.dateReq); return (!query.year || date?.getFullYear() === Number(query.year)) && (!query.month || date?.getMonth() === Number(query.month)); });
    const headers = ["CID", "NO.", "สถานะ", "อาคาร", "ลูกค้า", "เจ้าของงาน", "PR No.", "วันตั้งเบิก", "ยอดรวม", "ประกันติดตั้ง", "ประกันรื้อถอน", "ค่าธรรมเนียม", "ค่าใช้จ่ายอื่น", "พื้นที่"];
    const lines = [headers, ...rows.map(item => [item.cid, item.no, workflowLabels[getWorkflowStatusKey(item)], item.place, item.customer, item.owner, item.pr, item.dateReq, [item.deposit, item.demolish, item.fee, item.other].reduce<Decimal>((sum, value) => sum.plus(parseMoney(value)), new Decimal(0)).toString(), item.deposit, item.demolish, item.fee, item.other, item.area])];
    return new Response(`\uFEFF${lines.map(row => row.map(csvCell).join(",")).join("\r\n")}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="deposit-report.csv"', "Cache-Control": "private, no-store" } });
  } catch { return Response.json({ message: "ส่งออกไม่สำเร็จ กรุณาลองใหม่" }, { status: 503 }); }
}
