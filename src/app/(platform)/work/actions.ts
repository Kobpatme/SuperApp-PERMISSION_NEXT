"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { profiles, tasks, userTeams } from "@/db/schema";
import { getAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { runMaterialChange } from "@/lib/material-change";
import { transitionTask } from "@/lib/work-service";
import { taskStatuses, type TaskStatus } from "@/lib/work-domain";

export type WorkActionState = { ok: boolean; message: string; id?: string };
const invalid: WorkActionState = { ok: false, message: "ไม่สามารถบันทึกงานได้" };

const personalTaskSchema = z.object({
  jobs: z.string().trim().min(1, "ต้องระบุอย่างน้อยหนึ่งงาน").max(4000),
  mainKpi: z.string().trim().max(180, "Main KPI ยาวเกินกำหนด").optional().default(""),
  subKpi: z.string().trim().max(180, "Sub KPI ยาวเกินกำหนด").optional().default(""),
  dueAt: z.string().trim().optional().default(""),
  note: z.string().trim().max(4000, "หมายเหตุยาวเกินกำหนด").optional().default(""),
});

const assignmentSchema = z.object({
  assigneeId: z.string().uuid("ผู้รับผิดชอบไม่ถูกต้อง"),
  teamId: z.string().uuid("ทีมไม่ถูกต้อง"),
  jobs: z.string().trim().min(1, "ต้องระบุอย่างน้อยหนึ่งงาน").max(4000),
  title: z.string().trim().min(3, "ชื่องานต้องมีอย่างน้อย 3 ตัวอักษร").max(180),
  mainKpi: z.string().trim().max(180).optional().default(""),
  subKpi: z.string().trim().max(180).optional().default(""),
  dueAt: z.string().trim().optional().default(""),
  notes: z.string().trim().max(4000).optional().default(""),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

function humanWorkError(error: unknown) {
  if (error instanceof Error && error.name === "AuthorizationError") return "บัญชีนี้ยังไม่มีสิทธิ์ดำเนินการกับงานรายการนี้";
  if (error instanceof Error && error.name === "InvalidTaskTransitionError") return "สถานะงานนี้เปลี่ยนต่อจากสถานะปัจจุบันไม่ได้";
  if (error instanceof Error && error.name === "ConcurrentWorkUpdateError") return "งานถูกอัปเดตแล้ว กรุณาโหลดข้อมูลล่าสุดก่อนลองอีกครั้ง";
  return invalid.message;
}

export async function createPersonalTaskAction(_previous: WorkActionState, form: FormData): Promise<WorkActionState> {
  const access = await getAccessContext("work");
  if (!access.allowed || access.isDevelopmentSession || !process.env.DATABASE_URL || !access.subject) return { ...invalid, message: "ต้องเชื่อมบัญชีและฐานข้อมูลกลางก่อนเพิ่มงาน" };
  const parsed = personalTaskSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { ...invalid, message: parsed.error.issues[0]?.message ?? invalid.message };
  const input = parsed.data;
  const jobs = input.jobs.split(/\r?\n/).map((job) => job.trim()).filter(Boolean).slice(0, 20);
  if (!jobs.length) return { ...invalid, message: "ต้องระบุงานอย่างน้อยหนึ่งรายการ" };
  if (jobs.some((job) => job.length < 3)) return { ...invalid, message: "รายละเอียดงานแต่ละรายการต้องมีอย่างน้อย 3 ตัวอักษร" };
  const dueAt = input.dueAt ? new Date(`${input.dueAt}T17:00:00+07:00`) : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) return { ...invalid, message: "วันครบกำหนดไม่ถูกต้อง" };
  const teamId = access.subject.teamIds[0] ?? null;
  if (!isAuthorized(access.subject, "work.task.create", { ownerId: access.userId, teamId })) return { ...invalid, message: "คุณไม่มีสิทธิ์เพิ่มงานส่วนตัว" };
  const ids = jobs.map(() => crypto.randomUUID());
  const batchId = crypto.randomUUID();
  const now = new Date();
  try {
    await runMaterialChange({
      audit: { actorId: access.userId, moduleId: "work", action: "task.create", entityType: "task_batch", entityId: batchId, requestId: crypto.randomUUID(), after: { taskIds: ids, ownerId: access.userId, teamId, jobCount: jobs.length, mainKpi: input.mainKpi || null, subKpi: input.subKpi || null, dueAt: dueAt?.toISOString() ?? null } },
      activity: { eventType: "work.task.created.v1", eventVersion: 1, actorId: access.userId, ownerId: access.userId, teamId: teamId ?? undefined, moduleId: "work", entityType: "task_batch", entityId: batchId, occurredAt: now, sourceSystem: "permission_next", sourceEventId: batchId, correlationId: batchId, kpiEligible: false, payload: { taskIds: ids, jobs, mainKpi: input.mainKpi || null, subKpi: input.subKpi || null, dueAt: dueAt?.toISOString() ?? null } },
      outbox: { topic: "work.task.created.v1", idempotencyKey: `work-task-create:${batchId}`, aggregateType: "task_batch", aggregateId: batchId, payload: { taskIds: ids, ownerId: access.userId } },
    }, async (tx) => tx.insert(tasks).values(jobs.map((job, index) => ({ id: ids[index], ownerId: access.userId, teamId, title: job, description: input.note || null, jobCode: job, mainKpi: input.mainKpi || null, subKpi: input.subKpi || null, note: input.note || null, status: "in_progress" as const, dueAt, version: 1, createdAt: now, updatedAt: now }))));
    revalidatePath("/work");
    return { ok: true, message: `เพิ่มงานแล้ว ${jobs.length} รายการ`, id: batchId };
  } catch (error) {
    console.error("Unable to add personal work task", error);
    return invalid;
  }
}

export async function assignWorkTasksAction(_previous: WorkActionState, form: FormData): Promise<WorkActionState> {
  const access = await getAccessContext("work");
  if (!access.allowed || access.isDevelopmentSession || !process.env.DATABASE_URL || !access.subject) return { ...invalid, message: "ยังไม่พร้อมสำหรับการมอบหมายงาน" };
  const parsed = assignmentSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { ...invalid, message: parsed.error.issues[0]?.message ?? invalid.message };
  const input = parsed.data;
  const jobs = input.jobs.split(/\r?\n/).map((job) => job.trim()).filter(Boolean).slice(0, 20);
  if (!jobs.length) return { ...invalid, message: "ต้องระบุงานอย่างน้อยหนึ่งรายการ" };
  const normalizedJobs = jobs.map((job) => job.toLocaleLowerCase("th-TH"));
  if (new Set(normalizedJobs).size !== normalizedJobs.length) return { ...invalid, message: "มีรหัสงานซ้ำกันในรายการที่เลือก" };
  if (!access.subject.teamIds.includes(input.teamId) && !isAuthorized(access.subject, "work.task.manage", { ownerId: input.assigneeId, teamId: input.teamId })) return { ...invalid, message: "ไม่สามารถมอบหมายงานข้ามขอบเขตทีมได้" };
  const dueAt = input.dueAt ? new Date(`${input.dueAt}T17:00:00+07:00`) : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) return { ...invalid, message: "วันครบกำหนดไม่ถูกต้อง" };
  try {
    const targetRows = await getDb().select({ id: profiles.id, status: profiles.status, teamId: userTeams.teamId }).from(profiles).leftJoin(userTeams, eq(userTeams.userId, profiles.id)).where(eq(profiles.id, input.assigneeId));
    const target = targetRows.find((row) => row.teamId === input.teamId);
    if (!target || target.status !== "active") return { ...invalid, message: "ไม่พบผู้รับผิดชอบในทีมที่เลือก" };
    if (!isAuthorized(access.subject, "work.task.manage", { ownerId: target.id, teamId: target.teamId })) return { ...invalid, message: "บัญชีนี้ไม่มีสิทธิ์มอบหมายงานให้ผู้รับผิดชอบรายนี้" };
    const existing = await getDb().select({ jobCode: tasks.jobCode }).from(tasks).where(and(eq(tasks.teamId, input.teamId), inArray(tasks.jobCode, jobs)));
    if (existing.some((row) => row.jobCode && normalizedJobs.includes(row.jobCode.toLocaleLowerCase("th-TH")))) return { ...invalid, message: "มีรหัสงานนี้อยู่แล้วในทีม กรุณาตรวจสอบก่อนมอบหมายซ้ำ" };
    const now = new Date();
    const ids = jobs.map(() => crypto.randomUUID());
    const batchId = crypto.randomUUID();
    await runMaterialChange({
      audit: { actorId: access.userId, moduleId: "work", action: "task.assign", entityType: "task_batch", entityId: batchId, requestId: crypto.randomUUID(), after: { taskIds: ids, assigneeId: target.id, teamId: input.teamId, jobCount: jobs.length } },
      activity: { eventType: "work.task.assigned.v1", eventVersion: 1, actorId: access.userId, ownerId: target.id, teamId: input.teamId, moduleId: "work", entityType: "task", entityId: ids[0], occurredAt: now, sourceSystem: "permission_next", sourceEventId: batchId, correlationId: batchId, kpiEligible: false, payload: { taskIds: ids, jobs, mainKpi: input.mainKpi || null, subKpi: input.subKpi || null } },
      outbox: { topic: "work.task.assigned.v1", idempotencyKey: `work-task-assign:${batchId}`, aggregateType: "task_batch", aggregateId: ids[0], payload: { taskIds: ids, ownerId: target.id, teamId: input.teamId } },
    }, async (tx) => tx.insert(tasks).values(jobs.map((job, index) => ({ id: ids[index], ownerId: target.id, teamId: input.teamId, title: input.title, description: input.notes || null, jobCode: job, mainKpi: input.mainKpi || null, subKpi: input.subKpi || null, note: input.notes || null, priority: input.priority, status: "queued" as const, dueAt, version: 1, createdAt: now, updatedAt: now }))));
    revalidatePath("/work");
    return { ok: true, message: `มอบหมายงานแล้ว ${jobs.length} รายการ`, id: batchId };
  } catch (error) {
    console.error("Unable to assign work tasks", error);
    return { ...invalid, message: humanWorkError(error) };
  }
}

export async function addWorkTaskNoteAction(_previous: WorkActionState, form: FormData): Promise<WorkActionState> {
  const access = await getAccessContext("work");
  const taskId = String(form.get("taskId") ?? "");
  const note = String(form.get("note") ?? "").trim();
  const expectedVersion = Number(form.get("version"));
  if (!access.allowed || access.isDevelopmentSession || !process.env.DATABASE_URL || !access.subject || !/^[0-9a-f-]{36}$/i.test(taskId) || note.length < 1 || note.length > 4000 || !Number.isInteger(expectedVersion)) return invalid;
  try {
    const current = await getDb().query.tasks.findFirst({ where: eq(tasks.id, taskId) });
    if (!current) return { ...invalid, message: "ไม่พบงานนี้ในขอบเขตที่เข้าถึงได้" };
    if (!isAuthorized(access.subject, "work.task.update", { ownerId: current.ownerId, teamId: current.teamId })) return { ...invalid, message: "บัญชีนี้ยังไม่มีสิทธิ์เพิ่มบันทึกในงานนี้" };
    await runMaterialChange({
      audit: { actorId: access.userId, moduleId: "work", action: "task.note.add", entityType: "task", entityId: taskId, requestId: crypto.randomUUID(), before: { note: current.note, version: current.version }, after: { note, version: expectedVersion + 1 } },
      activity: { eventType: "work.task.note_added.v1", eventVersion: 1, actorId: access.userId, ownerId: current.ownerId, teamId: current.teamId ?? undefined, moduleId: "work", entityType: "task", entityId: taskId, occurredAt: new Date(), sourceSystem: "permission_next", sourceEventId: crypto.randomUUID(), correlationId: crypto.randomUUID(), kpiEligible: false, payload: { note } },
      outbox: { topic: "work.task.note_added.v1", idempotencyKey: `work-task-note:${taskId}:${expectedVersion}`, aggregateType: "task", aggregateId: taskId, payload: { taskId, ownerId: current.ownerId } },
    }, async (tx) => {
      const [updated] = await tx.update(tasks).set({ note, version: expectedVersion + 1, updatedAt: new Date() }).where(and(eq(tasks.id, taskId), eq(tasks.version, expectedVersion))).returning({ id: tasks.id });
      if (!updated) throw new Error("ConcurrentWorkUpdateError");
      return updated;
    });
    revalidatePath("/work");
    return { ok: true, message: "บันทึกหมายเหตุแล้ว", id: taskId };
  } catch (error) {
    console.error("Unable to add work task note", error);
    return { ...invalid, message: error instanceof Error && error.message === "ConcurrentWorkUpdateError" ? "งานถูกอัปเดตแล้ว กรุณาโหลดข้อมูลล่าสุดก่อนลองอีกครั้ง" : humanWorkError(error) };
  }
}

export async function transitionWorkTaskAction(_previous: WorkActionState, form: FormData): Promise<WorkActionState> {
  const access = await getAccessContext("work");
  const taskId = String(form.get("taskId") ?? "");
  const toStatus = String(form.get("toStatus") ?? "") as TaskStatus;
  const expectedVersion = Number(form.get("version"));
  const reason = String(form.get("reason") ?? "").trim().slice(0, 1000);
  if (!access.allowed || access.isDevelopmentSession || !process.env.DATABASE_URL || !access.subject || !/^[0-9a-f-]{36}$/i.test(taskId) || !taskStatuses.includes(toStatus) || !Number.isInteger(expectedVersion)) return invalid;
  try {
    await transitionTask({ taskId, toStatus, expectedVersion, reason, idempotencyKey: `work-transition:${taskId}:${expectedVersion}:${toStatus}`, actor: access.subject, requestId: crypto.randomUUID(), correlationId: crypto.randomUUID() });
    revalidatePath("/work");
    return { ok: true, message: "อัปเดตสถานะงานแล้ว", id: taskId };
  } catch (error) {
    return { ...invalid, message: humanWorkError(error) };
  }
}
