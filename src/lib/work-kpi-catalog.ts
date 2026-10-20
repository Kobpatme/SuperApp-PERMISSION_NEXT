import { and, desc, eq } from "drizzle-orm";
import { getDb, type DatabaseTransaction } from "@/db";
import { kpiMetrics, kpiRuleVersions } from "@/db/schema";
import { holidays, personalKpiVersions } from "@/db/work-admin-schema";
import { addWorkingDays } from "@/lib/work-sla";
import { workKpiConfigSchema } from "@/lib/work-admin-domain";
export async function readWorkKpiCatalog(db: DatabaseTransaction | ReturnType<typeof getDb> = getDb()) {
  const rows = await db.select({ id: kpiRuleVersions.id, metricId: kpiRuleVersions.metricId, version: kpiRuleVersions.version, status: kpiRuleVersions.status, rule: kpiRuleVersions.rule, name: kpiMetrics.name }).from(kpiRuleVersions).innerJoin(kpiMetrics, eq(kpiMetrics.id, kpiRuleVersions.metricId)).orderBy(desc(kpiRuleVersions.version));
  const seen = new Set<string>();
  return rows.flatMap(row => { if (seen.has(row.metricId)) return []; seen.add(row.metricId); const config = workKpiConfigSchema.safeParse(row.rule.work); return config.success ? [{ ...row, config: config.data }] : []; });
}
export async function activeWorkHolidays(db: DatabaseTransaction | ReturnType<typeof getDb> = getDb()) {
  return db.select({ holidayDate: holidays.holidayDate, isActive: holidays.isActive }).from(holidays).where(eq(holidays.isActive,true));
}
export async function resolveTaskKpi(input: { teamId: string; userId: string; ruleVersionId: string; startDate?: Date }, db: DatabaseTransaction | ReturnType<typeof getDb> = getDb()) {
  const catalog = await readWorkKpiCatalog(db);
  const rule = catalog.find(r => r.id === input.ruleVersionId && r.status === "active" && r.config.teamId === input.teamId);
  if (!rule) throw new Error("KPI_RULE_NOT_AVAILABLE");
  const [personal] = await db.select().from(personalKpiVersions).where(and(eq(personalKpiVersions.userId,input.userId),eq(personalKpiVersions.teamId,input.teamId))).orderBy(desc(personalKpiVersions.version));
  const assignment = personal?.teamId === input.teamId ? personal.assignments.find(a => a.metricId === rule.metricId) : undefined;
  if (personal?.teamId === input.teamId && !assignment?.enabled) throw new Error("KPI_NOT_ASSIGNED");
  const weight = assignment?.weight ?? rule.config.mainWeight;
  const dueKey = addWorkingDays(input.startDate ?? new Date(), rule.config.slaDays, await activeWorkHolidays(db));
  return { mainKpi: rule.config.mainKpi, subKpi: rule.config.subKpi, kpiWeight: weight, slaRuleVersionId: rule.id, dueAt: new Date(`${dueKey}T17:00:00+07:00`), ruleVersion: rule.version, personalVersion: personal?.version ?? null };
}
