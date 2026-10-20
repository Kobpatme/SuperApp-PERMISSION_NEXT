import { createHash } from "node:crypto";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { getDb, type DatabaseTransaction } from "@/db";
import { tasks } from "@/db/schema";
import { holidays, personalKpiVersions, workAdminPreviews } from "@/db/work-admin-schema";
import { assertAuthorized, isAuthorized } from "@/lib/authorization";
import { runMaterialChange } from "@/lib/material-change";
import { readWorkKpiCatalog } from "@/lib/work-kpi-catalog";
import { addWorkingDays, businessDaysBetween } from "@/lib/work-sla";
import { ConcurrentWorkUpdateError } from "@/lib/work-task-service";
import { workAdminLock, type WorkAdminContext } from "@/lib/work-admin-service";
export type RecalculationRow = { taskId:string; title:string; expectedVersion:number; beforeDueAt:string|null; afterDueAt:string|null; ruleVersionId:string; beforeWeight:string|null; afterWeight:string };
export type RecalculationPlan = { rows:RecalculationRow[]; scanned:number; skipped:number; catalogFingerprint:string };
const digest = (input: unknown) => createHash("sha256").update(JSON.stringify(input)).digest("hex");
async function plan(tx:DatabaseTransaction, kind:"deadlines"|"kpi_migration", context:WorkAdminContext): Promise<RecalculationPlan> {
  const catalog = await readWorkKpiCatalog(tx);
  const calendar = await tx.select().from(holidays).orderBy(asc(holidays.id));
  const personals = await tx.select().from(personalKpiVersions).orderBy(desc(personalKpiVersions.version),asc(personalKpiVersions.id));
  const current = await tx.select().from(tasks).where(isNull(tasks.deletedAt)).orderBy(asc(tasks.id)).limit(5001);
  if (current.length > 5000) throw new Error("PREVIEW_TOO_LARGE");
  const rows:RecalculationRow[] = []; let skipped = 0; let scanned = 0;
  for (const task of current) {
    if (!isAuthorized(context.actor,"kpi.rule.manage",{ ownerId:task.ownerId,teamId:task.teamId }) || !isAuthorized(context.actor,"work.task.update",task)) continue;
    scanned++;
    if (kind === "deadlines" && ["completed","cancelled"].includes(task.status)) { skipped++; continue; }
    const rule = catalog.find(r => r.status === "active" && r.config.teamId === task.teamId && r.config.mainKpi === task.mainKpi && r.config.subKpi === task.subKpi);
    if (!rule) { skipped++; continue; }
    const personal = personals.find(p => p.userId === task.ownerId && p.teamId === task.teamId);
    const assignment = personal?.assignments.find(a => a.metricId === rule.metricId && a.enabled);
    if (personal && !assignment) { skipped++; continue; }
    const weight = assignment?.weight ?? rule.config.mainWeight;
    const activeDays = task.status === "blocked" && typeof task.holdData.hold_started_at === "string" ? Math.max(0,businessDaysBetween(task.holdData.hold_started_at,new Date(),calendar)) : 0;
    const holdDays = Number(task.holdData.hold_days_total ?? 0) + activeDays;
    const date = addWorkingDays(task.createdAt,rule.config.slaDays + holdDays,calendar);
    const afterDueAt = kind === "deadlines" ? new Date(`${date}T17:00:00+07:00`).toISOString() : task.dueAt?.toISOString() ?? null;
    if ((kind === "deadlines" && afterDueAt !== task.dueAt?.toISOString()) || (kind === "kpi_migration" && weight !== task.kpiWeight)) rows.push({ taskId:task.id,title:task.title,expectedVersion:task.version,beforeDueAt:task.dueAt?.toISOString() ?? null,afterDueAt,ruleVersionId:rule.id,beforeWeight:task.kpiWeight,afterWeight:weight });
  }
  return { rows,scanned,skipped,catalogFingerprint:digest({ catalog,calendar,personals }) };
}
export async function previewWorkRecalculation(kind:"deadlines"|"kpi_migration", context:WorkAdminContext) {
  if (!context.actor.grants.some(g => g.permission === "kpi.rule.manage")) assertAuthorized(context.actor,"kpi.rule.manage");
  return getDb().transaction(async tx => {
    await workAdminLock(tx);
    const payload = await plan(tx,kind,context); const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now()+15*60*1000);
    await runMaterialChange({ audit:{ actorId:context.actor.userId,moduleId:"work",action:`admin.${kind}.preview`,entityType:"work_preview",entityId:id,requestId:context.requestId,after:{ affected:payload.rows.length,scanned:payload.scanned,skipped:payload.skipped } } }, async inner => inner.insert(workAdminPreviews).values({ id,actorId:context.actor.userId,kind,digest:digest(payload),payload:payload as unknown as Record<string,unknown>,expiresAt,createdBy:context.actor.userId,updatedBy:context.actor.userId }),tx);
    return { id,...payload,expiresAt:expiresAt.toISOString() };
  });
}
export async function confirmDeadlineRecalculation(previewId:string, context:WorkAdminContext) {
  return getDb().transaction(async tx => {
    await workAdminLock(tx);
    const [preview] = await tx.select().from(workAdminPreviews).where(eq(workAdminPreviews.id,previewId)).for("update");
    if (!preview || preview.actorId !== context.actor.userId || preview.kind !== "deadlines" || preview.expiresAt <= new Date()) throw new Error("PREVIEW_INVALID");
    if (!context.actor.grants.some(g => g.permission === "kpi.rule.manage")) assertAuthorized(context.actor,"kpi.rule.manage");
    if (preview.appliedAt) return { updated:(preview.payload as unknown as RecalculationPlan).rows.length,replayed:true };
    const currentPlan = await plan(tx,"deadlines",context);
    if (digest(currentPlan) !== preview.digest) throw new ConcurrentWorkUpdateError();
    for (const row of currentPlan.rows) {
      const [current] = await tx.select().from(tasks).where(eq(tasks.id,row.taskId)).for("update");
      if (!current || current.deletedAt || current.version !== row.expectedVersion) throw new ConcurrentWorkUpdateError();
      assertAuthorized(context.actor,"work.task.update",current); assertAuthorized(context.actor,"kpi.rule.manage",current);
      const key = `deadline-preview:${previewId}:${row.taskId}`;
      await runMaterialChange({
        audit:{ actorId:context.actor.userId,moduleId:"work",action:"task.deadline.recalculate",entityType:"task",entityId:row.taskId,requestId:context.requestId,before:{ dueAt:row.beforeDueAt,version:row.expectedVersion },after:{ dueAt:row.afterDueAt,version:row.expectedVersion+1 },metadata:{ previewId } },
        activity:{ eventType:"work.task.deadline_recalculated.v1",eventVersion:1,actorId:context.actor.userId,ownerId:current.ownerId,teamId:current.teamId ?? undefined,moduleId:"work",entityType:"task",entityId:row.taskId,occurredAt:new Date(),sourceSystem:"permission_next",sourceEventId:key,correlationId:previewId,kpiEligible:false,payload:{ before:row.beforeDueAt,after:row.afterDueAt } },
        outbox:{ topic:"work.task.deadline_recalculated.v1",idempotencyKey:key,aggregateType:"task",aggregateId:row.taskId,payload:{ taskId:row.taskId,previewId } },
      },async inner => inner.update(tasks).set({ dueAt:row.afterDueAt ? new Date(row.afterDueAt):null,slaRuleVersionId:row.ruleVersionId,version:row.expectedVersion+1,updatedAt:new Date() }).where(eq(tasks.id,row.taskId)),tx);
    }
    await tx.update(workAdminPreviews).set({ appliedAt:new Date(),updatedBy:context.actor.userId,updatedAt:new Date() }).where(eq(workAdminPreviews.id,previewId));
    return { updated:currentPlan.rows.length,replayed:false };
  });
}
