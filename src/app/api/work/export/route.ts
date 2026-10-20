import { and, asc, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { tasks } from "@/db/schema";
import { getAccessContext } from "@/lib/access";
import { requireApiIdentity } from "@/lib/request-context";
import { csvCell, parseWorkFilters, taskQueryCondition } from "@/lib/work-query";
import { presentWorkStatus } from "@/lib/work-presentation";
export async function GET(request: Request) {
  const identity = await requireApiIdentity();
  if (!identity.ok) return identity.response;
  const access = await getAccessContext("work");
  let filters;
  try { filters = parseWorkFilters(Object.fromEntries(new URL(request.url).searchParams)); } catch { return Response.json({ code: "INVALID_FILTER" }, { status: 400 }); }
  const read = taskQueryCondition(access.subject, filters);
  const report = taskQueryCondition(access.subject, filters, "work.report.read");
  if (!access.allowed || !read || !report) return Response.json({ code: "FORBIDDEN" }, { status: 403 });
  const lines = [["รหัสงาน", "งาน", "ผู้รับผิดชอบ", "ทีม", "สถานะ", "กำหนด", "Main KPI", "Sub KPI"].map(csvCell).join(",")];
  try {
    let cursor: string | undefined;
    await getDb().transaction(async tx => {
      for (;;) {
        const rows = await tx.select().from(tasks).where(and(read, report, cursor ? gt(tasks.id, cursor) : undefined)).orderBy(asc(tasks.id)).limit(500);
        for (const row of rows) lines.push([row.jobCode, row.title, row.ownerId, row.teamId, presentWorkStatus(row.status).label, row.dueAt?.toISOString(), row.mainKpi, row.subKpi].map(csvCell).join(","));
        if (rows.length < 500) break;
        cursor = rows.at(-1)!.id;
      }
    }, { isolationLevel: "repeatable read", accessMode: "read only" });
    return new Response(`\uFEFF${lines.join("\r\n")}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="work-report.csv"', "Cache-Control": "no-store" } });
  } catch { return Response.json({ code: "EXPORT_UNAVAILABLE", message: "ยังส่งออกรายงานไม่ได้ กรุณาลองอีกครั้ง" }, { status: 503 }); }
}
