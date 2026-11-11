import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { tasks, teams } from "@/db/schema";
import type { AccessContext } from "./access";
import { taskQueryCondition, type WorkFilters } from "./work-query";
import { presentWorkStatus } from "./work-presentation";
import { weightedReportFromTotals } from "./work-report";

/** Aggregate the entire authorized filter, never a paginated UI result. */
export async function readWorkReportSummary(access: AccessContext, filters: WorkFilters) {
  const read = taskQueryCondition(access.subject, filters);
  const report = taskQueryCondition(access.subject, filters, "work.report.read");
  if (!access.allowed || !read || !report) throw new Error("REPORT_FORBIDDEN");
  const weight = sql`case when ${tasks.kpiWeight} > 0 then ${tasks.kpiWeight} else 1 end`;
  const now = new Date();
  const rows = await getDb().select({
    status: tasks.status,
    count: sql<number>`count(*)::int`,
    weight: sql<string>`sum(${weight})::text`,
    onTimeWeight: sql<string>`coalesce(sum(${weight}) filter (where ${tasks.completedAt} <= ${tasks.dueAt}),0)::text`,
    overdue: sql<number>`count(*) filter (where ${tasks.status} not in ('completed','cancelled') and ${tasks.dueAt} < ${now.toISOString()}::timestamptz)::int`,
    dueSoon: sql<number>`count(*) filter (where ${tasks.status} not in ('completed','cancelled') and ${tasks.dueAt} >= ${now.toISOString()}::timestamptz and ${tasks.dueAt} <= ${new Date(now.getTime() + 3 * 86400000).toISOString()}::timestamptz)::int`,
  }).from(tasks).where(and(read, report)).groupBy(tasks.status);
  const weightedReport = weightedReportFromTotals(rows);
  const filterTeams = await getDb().select({ id: teams.id, name: teams.name }).from(tasks).innerJoin(teams, eq(teams.id, tasks.teamId)).where(and(read, report)).groupBy(teams.id, teams.name);
  return {
    filterTeams,
    weightedReport,
    statusCounts: Object.fromEntries(rows.map(row => [presentWorkStatus(row.status).label, row.count])),
    report: { taskCount: rows.reduce((sum, row) => sum + row.count, 0), overdue: rows.reduce((sum, row) => sum + row.overdue, 0), dueSoon: rows.reduce((sum, row) => sum + row.dueSoon, 0), completion: weightedReport.completion, sla: weightedReport.sla },
  };
}
