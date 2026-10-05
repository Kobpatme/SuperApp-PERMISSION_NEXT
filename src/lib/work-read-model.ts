
import { taskQueryCondition, workScope, type WorkFilters } from "@/lib/work-query";
import { copy } from "@/lib/copy";
import "server-only";

import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { getDb } from "@/db";
import { activityEvents, auditLogs, taskNotes, taskTransitions, buildings, kpiFacts, kpiMetrics, kpiScoreSnapshots, kpiTargets, positions, profiles, tasks, teams, userTeams } from "@/db/schema";
import type { AccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import type { DashboardItem, DashboardSource } from "@/lib/dashboard";
import { calculateWeightedWorkReport } from "@/lib/work-report";
import { groupTasksByJob } from "@/lib/work-sla";
import { presentWorkActivity, presentWorkStatus } from "@/lib/work-presentation";

export type WorkTaskRecord = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  statusLabel: string;
  priority: string;
  dueAt: string | null;
  completedAt: string | null;
  updatedAt: string;
  ownerId: string;
  ownerName: string;
  teamId: string | null;
  teamName: string;
  jobCode: string | null;
  mainKpi: string | null;
  subKpi: string | null;
  note: string | null;
  kpiWeight: string | null;
  version: number;
  notes?: Array<{ id: string; body: string; authorId: string; createdAt: string }>;
  timeline?: Array<{ id: string; label: string; reason: string | null; occurredAt: string }>;
};

export type WorkPersonSummary = {
  id: string;
  name: string;
  teamName: string;
  positionName: string;
  total: number;
  pending: number;
  inProgress: number;
  onHold: number;
  completed: number;
  overdue: number;
  weightedPerformance: number | null;
};

export type WorkKpiCard = {
  id: string;
  metric: string;
  unit: string;
  weight: string | null;
  target: string | null;
  actual: string;
  progress: number | null;
  periodStart: string;
  periodEnd: string;
  calculatedAt: string;
  factCount: number;
};

export type WorkReadModel = {
  generatedAt: string;
  items: DashboardItem[];
  tasks: WorkTaskRecord[];
  activities: Array<{ id: string; eventType: string; eventLabel: string; occurredAt: string; entityId: string; ownerName: string }>;
  weightedReport: ReturnType<typeof calculateWeightedWorkReport>;
  statusCounts: Record<string, number>;
  people: WorkPersonSummary[];
  jobGroups: Array<{ key: string; label: string; hasJobCode: boolean; tasks: WorkTaskRecord[] }>;
  assignmentOptions: Array<{ id: string; name: string; teamId: string | null; teamName: string; positionName: string }>;
  kpiCards: WorkKpiCard[];
  scores: Array<{ id: string; metric: string; unit: string; score: string; factCount: number; calculatedAt: string }>;
  facts: Array<{ id: string; metric: string; value: string; status: string; occurredAt: string; calculationVersion: number; activityEventId: string; ruleVersionId: string }>;
  report: { taskCount: number; overdue: number; dueSoon: number; completion: number | null; sla: number | null };
  source: DashboardSource;
};

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function isOverdue(task: WorkTaskRecord, now: number) {
  return Boolean(task.dueAt && Date.parse(task.dueAt) < now && !["completed", "cancelled"].includes(task.status));
}

function buildEmptyModel(message: string, status: DashboardSource["status"] = "ready"): WorkReadModel {
  return {
    generatedAt: new Date().toISOString(), items: [], tasks: [], activities: [], weightedReport: calculateWeightedWorkReport([]), statusCounts: {}, people: [], jobGroups: [], assignmentOptions: [], kpiCards: [], scores: [], facts: [],
    report: { taskCount: 0, overdue: 0, dueSoon: 0, completion: null, sla: null },
    source: { moduleId: "work", status, itemCount: 0, message },
  };
}

export async function getWorkReadModel(access: AccessContext, filters: WorkFilters = {}, requiredPermission?: string): Promise<WorkReadModel> {
  if (!process.env.DATABASE_URL) return buildEmptyModel(copy.feedback.unavailable, "not_configured");
  const scope = taskQueryCondition(access.subject, filters);
  if (!scope) return buildEmptyModel("ยังไม่มีรายการงานในขอบเขตสิทธิ์ของคุณ");
  const extraScope = requiredPermission ? workScope(access.subject, requiredPermission) : undefined;
  if (requiredPermission && !extraScope) return buildEmptyModel("ยังไม่มีรายการงานในขอบเขตสิทธิ์ของคุณ");

  try {
    const rows = await getDb().select({
      id: tasks.id, title: tasks.title, description: tasks.description, status: tasks.status, priority: tasks.priority,
      dueAt: tasks.dueAt, completedAt: tasks.completedAt, updatedAt: tasks.updatedAt, ownerId: tasks.ownerId, teamId: tasks.teamId,
      ownerName: profiles.displayName, teamName: teams.name, jobCode: tasks.jobCode, mainKpi: tasks.mainKpi, subKpi: tasks.subKpi,
      note: tasks.note, kpiWeight: tasks.kpiWeight, version: tasks.version, buildingName: buildings.nameTh,
    }).from(tasks)
      .leftJoin(profiles, eq(profiles.id, tasks.ownerId))
      .leftJoin(teams, eq(teams.id, tasks.teamId))
      .leftJoin(buildings, eq(buildings.id, tasks.buildingId))
      .where(and(scope, extraScope, isNull(tasks.deletedAt)))
      .orderBy(desc(tasks.updatedAt), desc(tasks.id))
      .limit(500);

    const taskRecords: WorkTaskRecord[] = rows.filter((row) => isAuthorized(access.subject, "work.task.read", { ownerId: row.ownerId, teamId: row.teamId })).map((row) => ({
      id: row.id, title: row.title, description: row.description, status: row.status, statusLabel: presentWorkStatus(row.status).label,
      priority: row.priority, dueAt: toIso(row.dueAt), completedAt: toIso(row.completedAt), updatedAt: row.updatedAt.toISOString(), ownerId: row.ownerId,
      ownerName: row.ownerName ?? "ยังไม่ระบุชื่อ", teamId: row.teamId, teamName: row.teamName ?? "ยังไม่ระบุทีม", jobCode: row.jobCode,
      mainKpi: row.mainKpi, subKpi: row.subKpi, note: row.note, kpiWeight: row.kpiWeight, version: row.version,
    }));

    const taskIds = taskRecords.map(task => task.id);
    if (taskIds.length) {
      const [notes, transitions, edits] = await Promise.all([
        getDb().select().from(taskNotes).where(inArray(taskNotes.taskId, taskIds)).orderBy(desc(taskNotes.createdAt)).limit(2000),
        getDb().select().from(taskTransitions).where(inArray(taskTransitions.taskId, taskIds)).orderBy(desc(taskTransitions.occurredAt)).limit(2000),
        getDb().select({ id: auditLogs.id, entityId: auditLogs.entityId, action: auditLogs.action, createdAt: auditLogs.createdAt }).from(auditLogs).where(and(eq(auditLogs.moduleId, "work"), eq(auditLogs.entityType, "task"), inArray(auditLogs.entityId, taskIds))).orderBy(desc(auditLogs.createdAt)).limit(2000),
      ]);
      for (const task of taskRecords) {
        task.notes = notes.filter(row => row.taskId === task.id).map(row => ({ id: row.id, body: row.body, authorId: row.authorId, createdAt: row.createdAt.toISOString() }));
        task.timeline = [
          ...transitions.filter(row => row.taskId === task.id).map(row => ({ id: row.id, label: `${presentWorkStatus(row.fromStatus).label} → ${presentWorkStatus(row.toStatus).label}`, reason: row.reason, occurredAt: row.occurredAt.toISOString() })),
          ...edits.filter(row => row.entityId === task.id && row.action !== "task.transition").map(row => ({ id: row.id, label: row.action === "task.note" ? "เพิ่มบันทึก" : row.action === "task.edit" ? "แก้ไขงาน" : "ปรับปรุงงาน", reason: null, occurredAt: row.createdAt.toISOString() })),
        ].sort((a,b) => b.occurredAt.localeCompare(a.occurredAt));
      }
    }
    const now = Date.now();
    const statusCounts = taskRecords.reduce<Record<string, number>>((result, task) => {
      result[task.statusLabel] = (result[task.statusLabel] ?? 0) + 1;
      return result;
    }, {});
    const weightedReport = calculateWeightedWorkReport(taskRecords.map((task) => ({ status: task.status, deadline: task.dueAt, completedAt: task.completedAt, weight: task.kpiWeight })));
    const dashboardItems: DashboardItem[] = taskRecords.map((task) => {
      const presentation = presentWorkStatus(task.status);
      return {
        id: task.id, moduleId: "work", kind: "task", title: task.title, description: task.description ?? undefined, href: `/work?record=${task.id}`,
        statusLabel: task.statusLabel, priority: task.priority === "urgent" ? "urgent" : task.priority === "high" || task.status === "blocked" ? "attention" : "normal",
        dueAt: task.dueAt ?? undefined, updatedAt: task.updatedAt, ownerId: task.ownerId, ownerName: task.ownerName, buildingName: undefined, nextAction: presentation.nextAction,
        code: task.jobCode ?? undefined,
      };
    });

    const canReadActivity = isAuthorized(access.subject, "activity.event.read", { ownerId: access.userId });
    const activityRows = canReadActivity ? await getDb().select({ id: activityEvents.id, eventType: activityEvents.eventType, occurredAt: activityEvents.occurredAt, entityId: activityEvents.entityId, ownerId: activityEvents.ownerId, teamId: activityEvents.teamId, ownerName: profiles.displayName })
      .from(activityEvents).leftJoin(profiles, eq(profiles.id, activityEvents.ownerId)).where(eq(activityEvents.moduleId, "work"))
      .orderBy(desc(activityEvents.occurredAt), desc(activityEvents.id)).limit(120) : [];
    const activities = activityRows.filter((row) => isAuthorized(access.subject, "activity.event.read", { ownerId: row.ownerId, teamId: row.teamId })).map((row) => ({
      id: row.id, eventType: row.eventType, eventLabel: presentWorkActivity(row.eventType), entityId: row.entityId, occurredAt: row.occurredAt.toISOString(), ownerName: row.ownerName ?? "ผู้ใช้งาน",
    }));

    const canReadKpi = isAuthorized(access.subject, "kpi.score.read", { ownerId: access.userId });
    const scoreRows = canReadKpi ? await getDb().select({ id: kpiScoreSnapshots.id, metricId: kpiScoreSnapshots.metricId, metric: kpiMetrics.name, unit: kpiMetrics.unit, score: kpiScoreSnapshots.score, factCount: kpiScoreSnapshots.factCount, calculatedAt: kpiScoreSnapshots.calculatedAt, periodStart: kpiScoreSnapshots.periodStart, periodEnd: kpiScoreSnapshots.periodEnd, teamId: kpiScoreSnapshots.teamId })
      .from(kpiScoreSnapshots).innerJoin(kpiMetrics, eq(kpiMetrics.id, kpiScoreSnapshots.metricId)).where(eq(kpiScoreSnapshots.ownerId, access.userId)).orderBy(desc(kpiScoreSnapshots.calculatedAt)).limit(24) : [];
    const targetRows = canReadKpi ? await getDb().select({ metricId: kpiTargets.metricId, targetValue: kpiTargets.targetValue, periodStart: kpiTargets.periodStart, periodEnd: kpiTargets.periodEnd, userId: kpiTargets.userId, teamId: kpiTargets.teamId })
      .from(kpiTargets).where(or(eq(kpiTargets.userId, access.userId), and(isNull(kpiTargets.userId), inArray(kpiTargets.teamId, access.subject?.teamIds ?? [])))).limit(100) : [];
    const targets = targetRows.filter((row) => isAuthorized(access.subject, "kpi.score.read", { ownerId: row.userId ?? access.userId, teamId: row.teamId }));
    const kpiCards: WorkKpiCard[] = scoreRows.map((row) => {
      const target = targets.find((candidate) => candidate.metricId === row.metricId && candidate.periodStart <= row.periodEnd && candidate.periodEnd >= row.periodStart);
      const targetValue = target?.targetValue ?? null;
      const progress = targetValue && Number(targetValue) !== 0 ? Math.round((Number(row.score) / Number(targetValue)) * 100) : null;
      return { id: row.id, metric: row.metric, unit: row.unit, weight: null, target: targetValue, actual: row.score, progress, periodStart: row.periodStart.toISOString(), periodEnd: row.periodEnd.toISOString(), calculatedAt: row.calculatedAt.toISOString(), factCount: row.factCount };
    });
    const factRows = canReadKpi ? await getDb().select({ id: kpiFacts.id, metric: kpiMetrics.name, value: kpiFacts.value, status: kpiFacts.status, occurredAt: kpiFacts.occurredAt, calculationVersion: kpiFacts.calculationVersion, activityEventId: kpiFacts.activityEventId, ruleVersionId: kpiFacts.ruleVersionId })
      .from(kpiFacts).innerJoin(kpiMetrics, eq(kpiMetrics.id, kpiFacts.metricId)).where(eq(kpiFacts.ownerId, access.userId)).orderBy(desc(kpiFacts.occurredAt), desc(kpiFacts.id)).limit(80) : [];
    const facts = factRows.map((row) => ({ ...row, occurredAt: row.occurredAt.toISOString() }));

    const assignmentRows = await getDb().select({ id: profiles.id, name: profiles.displayName, teamId: userTeams.teamId, teamName: teams.name, positionName: positions.name })
      .from(profiles).leftJoin(userTeams, eq(userTeams.userId, profiles.id)).leftJoin(teams, eq(teams.id, userTeams.teamId)).leftJoin(positions, eq(positions.id, profiles.positionId))
      .where(eq(profiles.status, "active")).limit(500);
    const assignmentOptions = assignmentRows.filter((row) => Boolean(row.name) && (isAuthorized(access.subject, "work.task.assign", { ownerId: row.id, teamId: row.teamId }) || (row.id === access.userId && isAuthorized(access.subject, "work.task.create", { ownerId: row.id, teamId: row.teamId })))).map((row) => ({ id: row.id, name: row.name ?? "ผู้ใช้งาน", teamId: row.teamId, teamName: row.teamName ?? "ไม่ระบุทีม", positionName: row.positionName ?? "สมาชิกทีม" }));

    const personMap = new Map<string, WorkPersonSummary>();
    for (const task of taskRecords) {
      const person = personMap.get(task.ownerId) ?? { id: task.ownerId, name: task.ownerName, teamName: task.teamName, positionName: "สมาชิกทีม", total: 0, pending: 0, inProgress: 0, onHold: 0, completed: 0, overdue: 0, weightedPerformance: null };
      person.total += 1;
      if (task.status === "queued") person.pending += 1;
      if (task.status === "in_progress") person.inProgress += 1;
      if (task.status === "blocked") person.onHold += 1;
      if (task.status === "completed") person.completed += 1;
      if (isOverdue(task, now)) person.overdue += 1;
      person.weightedPerformance = calculateWeightedWorkReport(taskRecords.filter(row => row.ownerId === person.id).map(row => ({ status: row.status, weight: row.kpiWeight, deadline: row.dueAt, completedAt: row.completedAt }))).completion;
      personMap.set(task.ownerId, person);
    }
    for (const option of assignmentOptions) if (!personMap.has(option.id)) personMap.set(option.id, { id: option.id, name: option.name, teamName: option.teamName, positionName: option.positionName, total: 0, pending: 0, inProgress: 0, onHold: 0, completed: 0, overdue: 0, weightedPerformance: null });

    const jobGroups = groupTasksByJob(taskRecords.map((task) => ({ ...task, job: task.jobCode ?? task.title }))).map((group) => ({ key: group.key, label: group.tasks[0]?.jobCode || group.label, hasJobCode: group.tasks.some((task) => Boolean(task.jobCode)), tasks: group.tasks }));
    const dueSoon = taskRecords.filter((task) => task.dueAt && Date.parse(task.dueAt) >= now && Date.parse(task.dueAt) <= now + 3 * 86_400_000 && !["completed", "cancelled"].includes(task.status)).length;
    return {
      generatedAt: new Date().toISOString(), items: dashboardItems, tasks: taskRecords, activities, weightedReport, statusCounts, people: [...personMap.values()], jobGroups, assignmentOptions, kpiCards,
      scores: scoreRows.map((row) => ({ id: row.id, metric: row.metric, unit: row.unit, score: row.score, factCount: row.factCount, calculatedAt: row.calculatedAt.toISOString() })), facts,
      report: { taskCount: taskRecords.length, overdue: taskRecords.filter((task) => isOverdue(task, now)).length, dueSoon, completion: weightedReport.completion, sla: weightedReport.sla },
      source: { moduleId: "work", status: "ready", itemCount: taskRecords.length, message: taskRecords.length ? "ข้อมูลพร้อมใช้งาน" : "ยังไม่มีงานในขอบเขตสิทธิ์" },
    };
  } catch (error) {
    console.error("Unable to load native work read model", error);
    return buildEmptyModel("ไม่สามารถโหลดข้อมูลงานได้ในขณะนี้", "unavailable");
  }
}



