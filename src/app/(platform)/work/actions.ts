"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { tasks } from "@/db/schema";
import { getAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { runMaterialChange } from "@/lib/material-change";
import { transitionTask } from "@/lib/work-service";
import { taskStatuses, type TaskStatus } from "@/lib/work-domain";

export type WorkActionState = { ok: boolean; message: string; id?: string };
const invalid: WorkActionState = { ok: false, message: "ไม่สามารถบันทึกงานได้" };

export async function createPersonalTaskAction(_previous: WorkActionState, form: FormData): Promise<WorkActionState> {
  const access = await getAccessContext("work");
  if (!access.allowed || access.isDevelopmentSession || !process.env.DATABASE_URL || !access.subject) return { ...invalid, message: "ต้องเชื่อมบัญชีและฐานข้อมูลกลางก่อนสร้างงาน" };
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const dueValue = String(form.get("dueAt") ?? "").trim();
  if (title.length < 3 || title.length > 180) return { ...invalid, message: "หัวข้องานต้องมี 3–180 ตัวอักษร" };
  if (description.length > 4000) return { ...invalid, message: "รายละเอียดงานยาวเกินกำหนด" };
  const dueAt = dueValue ? new Date(`${dueValue}T17:00:00+07:00`) : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) return { ...invalid, message: "วันครบกำหนดไม่ถูกต้อง" };
  const teamId = access.subject.teamIds[0] ?? null;
  if (!isAuthorized(access.subject, "work.task.create", { ownerId: access.userId, teamId })) return { ...invalid, message: "คุณไม่มีสิทธิ์สร้างงานส่วนตัว" };
  const id = crypto.randomUUID();
  const now = new Date();
  try {
    await runMaterialChange({
      audit: { actorId: access.userId, moduleId: "work", action: "task.create", entityType: "task", entityId: id, requestId: crypto.randomUUID(), after: { title, ownerId: access.userId, teamId, dueAt: dueAt?.toISOString() ?? null } },
      activity: { eventType: "work.task.created.v1", eventVersion: 1, actorId: access.userId, ownerId: access.userId, teamId: teamId ?? undefined, moduleId: "work", entityType: "task", entityId: id, occurredAt: now, sourceSystem: "permission_next", sourceEventId: id, correlationId: id, kpiEligible: false, payload: { title, dueAt: dueAt?.toISOString() ?? null } },
      outbox: { topic: "work.task.created.v1", idempotencyKey: `work-task-create:${id}`, aggregateType: "task", aggregateId: id, payload: { taskId: id, ownerId: access.userId } },
    }, async (tx) => tx.insert(tasks).values({ id, ownerId: access.userId, teamId, title, description: description || null, status: "in_progress", dueAt, version: 1, createdAt: now, updatedAt: now }).returning({ id: tasks.id }));
    revalidatePath("/work");
    return { ok: true, message: "สร้างงานส่วนตัวแล้ว", id };
  } catch (error) {
    console.error("Unable to create personal work task", error);
    return invalid;
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
    return { ...invalid, message: error instanceof Error ? error.message : invalid.message };
  }
}
