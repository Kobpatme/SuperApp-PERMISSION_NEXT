"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { profiles, userTeams } from "@/db/schema";
import { getAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { createWorkBatch } from "@/lib/work-create-service";
import { resolveTaskKpi } from "@/lib/work-kpi-catalog";
import { mutateWorkTask } from "@/lib/work-task-service";


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
  if (kind === "transition") command = { ...command, toStatus: String(form.get("toStatus")), reason: String(form.get("reason") ?? ""), fundNumber:String(form.get("fundNumber") ?? "") || undefined, amount:String(form.get("amount") ?? "") || undefined };
  if (kind === "note") command.body = String(form.get("note") ?? "");
  if (kind === "delete" || kind === "restore") command.reason = String(form.get("reason") ?? "");
  if (kind === "edit") {
    const due = String(form.get("dueAt") ?? "");
    const date = due ? new Date(`${due}T17:00:00+07:00`) : null;
    if (date && Number.isNaN(date.getTime())) return { ...invalid, message: "วันครบกำหนดไม่ถูกต้อง" };
    command = { ...command, title: String(form.get("title") ?? ""), description: String(form.get("description") ?? ""), priority: String(form.get("priority") ?? "normal"), ownerId: String(form.get("ownerId") ?? ""), dueAt: date?.toISOString() ?? null, mainKpi: String(form.get("mainKpi") ?? ""), subKpi: String(form.get("subKpi") ?? ""), jobCode: String(form.get("jobCode") ?? ""), ruleVersionId:String(form.get("ruleVersionId") ?? "") || undefined, ssrNumber:form.has("ssrNumber") ? String(form.get("ssrNumber")) : undefined,ospNumber:form.has("ospNumber") ? String(form.get("ospNumber")) : undefined };
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

function humanWorkError(error: unknown) {
  if (error instanceof Error && error.name === "AuthorizationError") return "บัญชีนี้ยังไม่มีสิทธิ์ดำเนินการกับงานรายการนี้";
  if (error instanceof Error && error.name === "InvalidTaskTransitionError") return "สถานะงานนี้เปลี่ยนต่อจากสถานะปัจจุบันไม่ได้";
  if (error instanceof Error && error.name === "ConcurrentWorkUpdateError") return "งานถูกอัปเดตแล้ว กรุณาโหลดข้อมูลล่าสุดก่อนลองอีกครั้ง";
  if (error instanceof Error && error.message === "REASON_REQUIRED") return "กรุณาระบุเหตุผลก่อนเปลี่ยนสถานะ";
  if (error instanceof Error && error.message === "DUPLICATE_JOB_KPI") return "มี Job และ Sub KPI นี้ของผู้รับผิดชอบอยู่แล้ว";
  if (error instanceof Error && error.message === "TYPE_REQUIRED") return "กรุณาเลือก TYPE ผู้รับเหมา";
  if (error instanceof Error && ["KPI_RULE_NOT_AVAILABLE","KPI_NOT_ASSIGNED"].includes(error.message)) return "กฎ KPI นี้ยังไม่พร้อมใช้กับผู้รับผิดชอบ กรุณาตรวจการตั้งค่า";
  if (error instanceof Error && ["ACCEPT_OWNER_ONLY", "EDIT_NOT_ALLOWED", "NOTE_NOT_ALLOWED"].includes(error.message)) return "คำสั่งนี้ใช้ไม่ได้กับผู้รับผิดชอบหรือสถานะปัจจุบัน";
  return invalid.message;
}
async function createBatchAction(form:FormData,kind:"personal"|"assigned"):Promise<WorkActionState> {
  const access=await getAccessContext("work");
  if(access.passwordChangeRequired) return {...invalid,status:403,code:"PASSWORD_CHANGE_REQUIRED",message:"กรุณาเปลี่ยนรหัสผ่านก่อน"};
  if(!access.allowed||!access.subject) return {...invalid,status:403};
  const input=Object.fromEntries(form);
  if(kind==="personal") input.assigneeId=access.userId;
  try {const result=await createWorkBatch(input,kind,{actor:access.subject,requestId:crypto.randomUUID()});revalidatePath("/work","layout");revalidatePath("/");return {ok:true,message:`บันทึกเรียบร้อยแล้ว ${result.count} งาน`,id:result.id};}
  catch(error){return {...invalid,message:humanWorkError(error)};}
}
export async function createPersonalTaskAction(_previous:WorkActionState,form:FormData){return createBatchAction(form,"personal");}
export async function assignWorkTasksAction(_previous:WorkActionState,form:FormData){return createBatchAction(form,"assigned");}
export async function previewWorkDeadlineAction(_previous:WorkActionState,form:FormData):Promise<WorkActionState>{
  const access=await getAccessContext("work");
  if(!access.allowed||!access.subject||access.passwordChangeRequired)return {...invalid,status:403};
  const parsed=z.object({teamId:z.string().uuid(),assigneeId:z.string().uuid(),ruleVersionId:z.string().uuid()}).safeParse(Object.fromEntries(form));
  if(!parsed.success)return {...invalid,message:"เลือกทีม ผู้รับผิดชอบ และ KPI ก่อนดูตัวอย่าง"};
  const input=parsed.data;
  if(!isAuthorized(access.subject,input.assigneeId===access.userId?"work.task.create":"work.task.assign",{ownerId:input.assigneeId,teamId:input.teamId}))return {...invalid,status:403};
  try{
    const [member]=await getDb().select({id:profiles.id}).from(profiles).innerJoin(userTeams,eq(userTeams.userId,profiles.id)).where(and(eq(profiles.id,input.assigneeId),eq(profiles.status,"active"),eq(userTeams.teamId,input.teamId)));
    if(!member)return {...invalid,message:"ไม่พบผู้รับผิดชอบในทีมนี้"};
    const result=await resolveTaskKpi({teamId:input.teamId,userId:input.assigneeId,ruleVersionId:input.ruleVersionId});
    return {ok:true,message:`กำหนดส่ง ${result.dueAt.toLocaleDateString("th-TH",{timeZone:"Asia/Bangkok"})} · น้ำหนัก ${result.kpiWeight} · กฎรุ่น ${result.ruleVersion}`};
  }catch(error){return {...invalid,message:humanWorkError(error)};}
}
