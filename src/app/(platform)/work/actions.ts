"use server";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { profiles, tasks, userTeams } from "@/db/schema";
import { getAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { runMaterialChange } from "@/lib/material-change";
import { mutateWorkTask } from "@/lib/work-task-service";
import { taskStatuses, type TaskStatus } from "@/lib/work-domain";

export type WorkActionState = { ok: boolean; message: string; id?: string; status?: number; code?: string };
const invalid: WorkActionState = { ok: false, message: "ไม่สามารถบันทึกงานได้" };

async function runTaskCommand(form: FormData, kind: "transition" | "note" | "edit" | "delete" | "restore"): Promise<WorkActionState> {
  const access = await getAccessContext("work");
  if (access.passwordChangeRequired) return { ...invalid, status: 403, code: "PASSWORD_CHANGE_REQUIRED", message: "กรุณาเปลี่ยนรหัสผ่านก่อนดำเนินการ" };
  if (!access.allowed || !access.subject || access.isDevelopmentSession) return { ...invalid, status: 403 };
  const taskId = String(form.get("taskId") ?? "");
  const expectedVersion = Number(form.get("version"));
  const idempotencyKey = String(form.get("idempotencyKey") ?? "");
  let command: Record<string, unknown> = { kind, taskId, expectedVersion, idempotencyKey };
  if (kind === "transition") command = { ...command, toStatus: String(form.get("toStatus")), reason: String(form.get("reason") ?? "") };
  if (kind === "note") command.body = String(form.get("note") ?? "");
  if (kind === "delete" || kind === "restore") command.reason = String(form.get("reason") ?? "");
  if (kind === "edit") {
    const due = String(form.get("dueAt") ?? "");
    const date = due ? new Date(`${due}T17:00:00+07:00`) : null;
    if (date && Number.isNaN(date.getTime())) return { ...invalid, message: "วันครบกำหนดไม่ถูกต้อง" };
    command = { ...command, title: String(form.get("title") ?? ""), description: String(form.get("description") ?? ""), priority: String(form.get("priority") ?? "normal"), ownerId: String(form.get("ownerId") ?? ""), dueAt: date?.toISOString() ?? null, mainKpi: String(form.get("mainKpi") ?? ""), subKpi: String(form.get("subKpi") ?? ""), jobCode: String(form.get("jobCode") ?? "") };
  }
  try {
    const result = await mutateWorkTask(command, { actor: access.subject, requestId: crypto.randomUUID(), correlationId: crypto.randomUUID() });
    revalidatePath("/work", "layout");
    revalidatePath("/");
    return { ok: true, message: "บันทึกเรียบร้อยแล้ว", id: result.id };
  } catch (error) {
    if (error instanceof z.ZodError) return { ...invalid, status: 400, message: "กรุณาตรวจสอบข้อมูลและระบุเหตุผลให้ครบ" };
    return { ...invalid, status: error instanceof Error && error.name === "ConcurrentWorkUpdateError" ? 409 : 403, message: humanWorkError(error) };
  }
}

export async function addWorkTaskNoteAction(_previous: WorkActionState, form: FormData) { return runTaskCommand(form, "note"); }
export async function transitionWorkTaskAction(_previous: WorkActionState, form: FormData) { return runTaskCommand(form, "transition"); }
export async function editWorkTaskAction(_previous: WorkActionState, form: FormData) { return runTaskCommand(form, "edit"); }
export async function deleteWorkTaskAction(_previous: WorkActionState, form: FormData) { return runTaskCommand(form, "delete"); }
export async function restoreWorkTaskAction(_previous: WorkActionState, form: FormData) { return runTaskCommand(form, "restore"); }

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
  if (error instanceof Error && error.message === "REASON_REQUIRED") return "กรุณาระบุเหตุผลก่อนเปลี่ยนสถานะ";
  if (error instanceof Error && ["ACCEPT_OWNER_ONLY", "EDIT_NOT_ALLOWED", "NOTE_NOT_ALLOWED"].includes(error.message)) return "คำสั่งนี้ใช้ไม่ได้กับผู้รับผิดชอบหรือสถานะปัจจุบัน";
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
    revalidatePath("/work", "layout");
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
  if (!isAuthorized(access.subject, "work.task.assign", { ownerId: input.assigneeId, teamId: input.teamId })) return { ...invalid, message: "ไม่สามารถมอบหมายงานข้ามขอบเขตสิทธิ์ได้" };
  const dueAt = input.dueAt ? new Date(`${input.dueAt}T17:00:00+07:00`) : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) return { ...invalid, message: "วันครบกำหนดไม่ถูกต้อง" };
  try {
    const targetRows = await getDb().select({ id: profiles.id, status: profiles.status, teamId: userTeams.teamId }).from(profiles).leftJoin(userTeams, eq(userTeams.userId, profiles.id)).where(eq(profiles.id, input.assigneeId));
    const target = targetRows.find((row) => row.teamId === input.teamId);
    if (!target || target.status !== "active") return { ...invalid, message: "ไม่พบผู้รับผิดชอบในทีมที่เลือก" };
    if (!isAuthorized(access.subject, "work.task.assign", { ownerId: target.id, teamId: target.teamId })) return { ...invalid, message: "บัญชีนี้ไม่มีสิทธิ์มอบหมายงานให้ผู้รับผิดชอบรายนี้" };
    const existing = await getDb().select({ jobCode: tasks.jobCode }).from(tasks).where(and(isNull(tasks.deletedAt), eq(tasks.teamId, input.teamId), inArray(tasks.jobCode, jobs)));
    if (existing.some((row) => row.jobCode && normalizedJobs.includes(row.jobCode.toLocaleLowerCase("th-TH")))) return { ...invalid, message: "มีรหัสงานนี้อยู่แล้วในทีม กรุณาตรวจสอบก่อนมอบหมายซ้ำ" };
    const now = new Date();
    const ids = jobs.map(() => crypto.randomUUID());
    const batchId = crypto.randomUUID();
    await runMaterialChange({
      audit: { actorId: access.userId, moduleId: "work", action: "task.assign", entityType: "task_batch", entityId: batchId, requestId: crypto.randomUUID(), after: { taskIds: ids, assigneeId: target.id, teamId: input.teamId, jobCount: jobs.length } },
      activity: { eventType: "work.task.assigned.v1", eventVersion: 1, actorId: access.userId, ownerId: target.id, teamId: input.teamId, moduleId: "work", entityType: "task", entityId: ids[0], occurredAt: now, sourceSystem: "permission_next", sourceEventId: batchId, correlationId: batchId, kpiEligible: false, payload: { taskIds: ids, jobs, mainKpi: input.mainKpi || null, subKpi: input.subKpi || null } },
      outbox: { topic: "work.task.assigned.v1", idempotencyKey: `work-task-assign:${batchId}`, aggregateType: "task_batch", aggregateId: ids[0], payload: { taskIds: ids, ownerId: target.id, teamId: input.teamId } },
    }, async (tx) => tx.insert(tasks).values(jobs.map((job, index) => ({ id: ids[index], ownerId: target.id, teamId: input.teamId, title: input.title, description: input.notes || null, jobCode: job, mainKpi: input.mainKpi || null, subKpi: input.subKpi || null, note: input.notes || null, priority: input.priority, status: "queued" as const, dueAt, version: 1, createdAt: now, updatedAt: now }))));
    revalidatePath("/work", "layout");
    return { ok: true, message: `มอบหมายงานแล้ว ${jobs.length} รายการ`, id: batchId };
  } catch (error) {
    console.error("Unable to assign work tasks", error);
    return { ...invalid, message: humanWorkError(error) };
  }
}


