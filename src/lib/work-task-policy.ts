import { z } from "zod";
import { assertAuthorized, isAuthorized, type AuthorizationSubject } from "@/lib/authorization";
import { assertTaskTransition, taskStatuses, type TaskStatus } from "@/lib/work-domain";

const identity = { taskId: z.string().uuid(), expectedVersion: z.number().int().positive(), idempotencyKey: z.string().min(12).max(160) };
export const workCommandSchema = z.discriminatedUnion("kind", [
  z.object({ ...identity, kind: z.literal("transition"), toStatus: z.enum(taskStatuses), reason: z.string().trim().max(1000).default(""), fundNumber:z.string().trim().max(180).optional(),amount:z.string().regex(/^\d+(\.\d{1,2})?$/).optional() }),
  z.object({ ...identity, kind: z.literal("note"), body: z.string().trim().min(1).max(4000) }),
  z.object({ ...identity, kind: z.literal("edit"), title: z.string().trim().min(3).max(180), description: z.string().trim().max(4000), priority: z.enum(["low", "normal", "high", "urgent"]), dueAt: z.string().datetime({ offset: true }).nullable(), ownerId: z.string().uuid(), mainKpi: z.string().trim().max(180), subKpi: z.string().trim().max(180), jobCode: z.string().trim().min(1).max(180),ruleVersionId:z.string().uuid().optional(),ssrNumber:z.string().trim().max(180).optional(),ospNumber:z.string().trim().max(180).optional() }),
  z.object({ ...identity, kind: z.literal("delete"), reason: z.string().trim().min(1).max(1000) }),
  z.object({ ...identity, kind: z.literal("restore"), reason: z.string().trim().min(1).max(1000) }),
]);
export type WorkCommand = z.infer<typeof workCommandSchema>;
export type PolicyTask = { ownerId: string; teamId: string | null; status: string; deletedAt?: Date | null };
export function taskCapabilities(actor: AuthorizationSubject | undefined, task: PolicyTask) {
  const update = isAuthorized(actor, "work.task.update", task);
  const manage = isAuthorized(actor, "work.task.manage", task);
  const terminal = ["completed", "cancelled"].includes(task.status);
  return { update, assign:isAuthorized(actor,"work.task.assign",task), accept: update && task.ownerId === actor?.userId, edit: update && (!terminal || manage), note: update && task.status !== "cancelled" && isAuthorized(actor, "work.note.create", task) && (task.ownerId === actor?.userId || manage), delete: isAuthorized(actor, "work.task.delete", task) && manage };
}
export function assertWorkCommand(actor: AuthorizationSubject, task: PolicyTask, command: WorkCommand, replay = false) {
  const caps = taskCapabilities(actor, task);
  const permission = command.kind === "note" ? "work.note.create" : ["delete", "restore"].includes(command.kind) ? "work.task.delete" : "work.task.update";
  assertAuthorized(actor, permission, task);
  if (command.kind === "note") assertAuthorized(actor,"work.task.update",task);
  if (command.kind === "delete" || command.kind === "restore") assertAuthorized(actor, "work.task.manage", task);
  if (replay) return;
  if (task.deletedAt && command.kind !== "restore") throw new Error("TASK_DELETED");
  if (command.kind === "restore" && !task.deletedAt) throw new Error("TASK_NOT_DELETED");
  if (command.kind === "note" && !caps.note) throw new Error("NOTE_NOT_ALLOWED");
  if (command.kind === "edit" && !caps.edit) throw new Error("EDIT_NOT_ALLOWED");
  if (command.kind === "transition") {
    assertTaskTransition(task.status as TaskStatus, command.toStatus);
    if (task.status === "queued" && command.toStatus === "in_progress" && !caps.accept) throw new Error("ACCEPT_OWNER_ONLY");
    if ((task.ownerId !== actor.userId || ["blocked", "cancelled"].includes(command.toStatus)) && !command.reason) throw new Error("REASON_REQUIRED");
  }
}
