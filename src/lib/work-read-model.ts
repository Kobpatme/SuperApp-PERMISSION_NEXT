import "server-only";
import { and, desc, eq, inArray, or, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { activityEvents, buildings, kpiFacts, kpiMetrics, kpiScoreSnapshots, profiles, tasks } from "@/db/schema";
import type { AccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import type { DashboardItem, DashboardSource } from "@/lib/dashboard";
import { presentWorkStatus } from "@/lib/work-presentation";

function scopedCondition(access: AccessContext, permission: string, owner: typeof tasks.ownerId, team: typeof tasks.teamId): SQL | undefined {
  const grants = access.subject?.grants.filter(grant => grant.permission === permission) ?? [];
  if (grants.some(grant => grant.scope === "ALL")) return eq(owner, owner);
  const conditions: SQL[] = [];
  if (grants.some(grant => grant.scope === "OWN")) conditions.push(eq(owner, access.userId));
  const teamIds = new Set<string>();
  if (grants.some(grant => grant.scope === "TEAM")) access.subject?.teamIds.forEach(id => teamIds.add(id));
  grants.filter(grant => grant.scope === "SELECTED_TEAMS" && grant.selectedTeamId).forEach(grant => teamIds.add(grant.selectedTeamId!));
  if (teamIds.size) conditions.push(inArray(team, [...teamIds]));
  return conditions.length ? or(...conditions) : undefined;
}

export async function getWorkReadModel(access: AccessContext) {
  const empty = { generatedAt: new Date().toISOString(), items: [] as DashboardItem[], activities: [] as Array<{ id: string; eventType: string; occurredAt: string; entityId: string }>,
    scores: [] as Array<{ id: string; metric: string; unit: string; score: string; factCount: number; calculatedAt: string }>,
    facts: [] as Array<{ id: string; metric: string; value: string; status: string; occurredAt: string; calculationVersion: number; activityEventId: string; ruleVersionId: string }>,
    source: { moduleId: "work", status: "ready", itemCount: 0, message: "ไม่มีรายการในขอบเขตสิทธิ์" } satisfies DashboardSource };
  if (!process.env.DATABASE_URL) return { ...empty, source: { ...empty.source, status: "not_configured", message: "ยังไม่ได้เชื่อมฐานข้อมูล" } as DashboardSource };
  const scope = scopedCondition(access, "work.task.read", tasks.ownerId, tasks.teamId);
  if (!scope) return empty;
  try {
    const rows = await getDb().select({ id: tasks.id, title: tasks.title, description: tasks.description, status: tasks.status,
      priority: tasks.priority, dueAt: tasks.dueAt, updatedAt: tasks.updatedAt, ownerId: tasks.ownerId, teamId: tasks.teamId,
      ownerName: profiles.displayName, buildingName: buildings.nameTh })
      .from(tasks).leftJoin(profiles, eq(profiles.id, tasks.ownerId)).leftJoin(buildings, eq(buildings.id, tasks.buildingId))
      .where(scope).orderBy(desc(tasks.updatedAt), desc(tasks.id)).limit(250);
    const visible = rows.filter(row => isAuthorized(access.subject, "work.task.read", { ownerId: row.ownerId, teamId: row.teamId }));
    const items: DashboardItem[] = visible.map(row => { const presentation = presentWorkStatus(row.status); return ({ id: row.id, moduleId: "work", kind: "task", title: row.title,
      description: row.description ?? undefined, href: `/work?record=${row.id}`, statusLabel: presentation.label,
      priority: row.priority === "urgent" ? "urgent" : row.priority === "high" || row.status === "blocked" ? "attention" : "normal",
      dueAt: row.dueAt?.toISOString(), updatedAt: row.updatedAt.toISOString(), ownerId: row.ownerId,
      ownerName: row.ownerName ?? undefined, buildingName: row.buildingName ?? undefined, nextAction: presentation.nextAction }); });
    const canActivity = isAuthorized(access.subject, "activity.event.read", { ownerId: access.userId });
    const activities = canActivity ? await getDb().select({ id: activityEvents.id, eventType: activityEvents.eventType,
      occurredAt: activityEvents.occurredAt, entityId: activityEvents.entityId, ownerId: activityEvents.ownerId, teamId: activityEvents.teamId })
      .from(activityEvents).where(eq(activityEvents.moduleId, "work")).orderBy(desc(activityEvents.occurredAt), desc(activityEvents.id)).limit(80) : [];
    const allowedActivities = activities.filter(row => isAuthorized(access.subject, "activity.event.read", { ownerId: row.ownerId, teamId: row.teamId }))
      .map(row => ({ id: row.id, eventType: row.eventType, entityId: row.entityId, occurredAt: row.occurredAt.toISOString() }));
    const canKpi = isAuthorized(access.subject, "kpi.score.read", { ownerId: access.userId });
    const scoreRows = canKpi ? await getDb().select({ id: kpiScoreSnapshots.id, metric: kpiMetrics.name, unit: kpiMetrics.unit,
      score: kpiScoreSnapshots.score, factCount: kpiScoreSnapshots.factCount, calculatedAt: kpiScoreSnapshots.calculatedAt })
      .from(kpiScoreSnapshots).innerJoin(kpiMetrics, eq(kpiMetrics.id, kpiScoreSnapshots.metricId))
      .where(eq(kpiScoreSnapshots.ownerId, access.userId)).orderBy(desc(kpiScoreSnapshots.calculatedAt)).limit(24) : [];
    const factRows = canKpi ? await getDb().select({ id: kpiFacts.id, metric: kpiMetrics.name, value: kpiFacts.value,
      status: kpiFacts.status, occurredAt: kpiFacts.occurredAt, calculationVersion: kpiFacts.calculationVersion,
      activityEventId: kpiFacts.activityEventId, ruleVersionId: kpiFacts.ruleVersionId })
      .from(kpiFacts).innerJoin(kpiMetrics, eq(kpiMetrics.id, kpiFacts.metricId)).where(eq(kpiFacts.ownerId, access.userId))
      .orderBy(desc(kpiFacts.occurredAt), desc(kpiFacts.id)).limit(50) : [];
    return { generatedAt: empty.generatedAt, items, activities: allowedActivities, scores: scoreRows.map(row => ({ ...row, calculatedAt: row.calculatedAt.toISOString() })),
      facts: factRows.map(row => ({ ...row, occurredAt: row.occurredAt.toISOString() })),
      source: { moduleId: "work", status: "ready", itemCount: items.length, message: items.length ? "ข้อมูลภายในพร้อมใช้งาน" : "ไม่มีรายการในขอบเขตสิทธิ์" } satisfies DashboardSource };
  } catch (error) {
    console.error("Unable to load native work read model", error);
    return { ...empty, source: { ...empty.source, status: "unavailable", message: "โหลดข้อมูลงานไม่สำเร็จ" } as DashboardSource };
  }
}
