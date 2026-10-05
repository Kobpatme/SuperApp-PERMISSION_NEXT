"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getIdentityAccessContext } from "@/lib/access";
import { saveWorkAdmin } from "@/lib/work-admin-service";
import { confirmDeadlineRecalculation, previewWorkRecalculation, type RecalculationRow } from "@/lib/work-recalculation";
export type WorkAdminState = { ok:boolean;message:string;status?:number;code?:string;previewId?:string;rows?:RecalculationRow[];scanned?:number;skipped?:number };
async function context() {
  const access = await getIdentityAccessContext();
  if (!access.subject || access.passwordChangeRequired) return null;
  return { actor:access.subject,requestId:crypto.randomUUID() };
}
const failed = (error:unknown):WorkAdminState => ({ ok:false,status:error instanceof Error && error.name === "ConcurrentWorkUpdateError" ? 409 : 400,message:error instanceof z.ZodError ? error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" : error instanceof Error && error.name === "AuthorizationError" ? "บัญชีนี้ยังไม่มีสิทธิ์จัดการส่วนนี้" : error instanceof Error && error.name === "ConcurrentWorkUpdateError" ? "ข้อมูลเปลี่ยนแล้ว กรุณาโหลดใหม่และดูตัวอย่างอีกครั้ง" : "บันทึกไม่สำเร็จ กรุณาตรวจข้อมูลซ้ำ วันที่ซ้ำ และขอบเขตสิทธิ์" });
export async function saveWorkAdminAction(_previous:WorkAdminState,form:FormData):Promise<WorkAdminState> {
  const ctx = await context();
  if (!ctx) return { ok:false,message:"กรุณาเข้าสู่ระบบและเปลี่ยนรหัสผ่านก่อน",status:403,code:"PASSWORD_CHANGE_REQUIRED" };
  const kind = String(form.get("kind"));
  if (!["holiday","rule","personal","system","announcement"].includes(kind)) return failed(null);
  const input:Record<string,unknown> = Object.fromEntries(form);
  input.id = String(form.get("id") ?? "") || undefined;
  input.metricId = String(form.get("metricId") ?? "") || undefined;
  input.expectedVersion = Number(form.get("expectedVersion") ?? 0) || (kind === "personal" || kind === "rule" ? 0 : undefined);
  for (const key of ["isActive","active","visibleToAll"]) input[key] = form.get(key) === "on";
  input.roleIds = form.getAll("roleIds").map(String); input.teamIds = form.getAll("teamIds").map(String);
  if (kind === "personal") input.assignments = form.getAll("metricIds").map(String).map(metricId => ({ metricId,enabled:form.get(`enabled:${metricId}`)==="on",weight:String(form.get(`weight:${metricId}`) ?? "") }));
  try {
    await saveWorkAdmin(kind as "holiday"|"rule"|"personal"|"system"|"announcement",input,ctx);
    revalidatePath("/admin");revalidatePath("/work","layout");revalidatePath("/");
    return { ok:true,message:"บันทึกเรียบร้อยแล้ว" };
  } catch (error) { return failed(error); }
}
export async function previewWorkAdminAction(_previous:WorkAdminState,form:FormData):Promise<WorkAdminState> {
  const ctx=await context(); if (!ctx) return failed(null);
  const kind=String(form.get("kind")); if (!["deadlines","kpi_migration"].includes(kind)) return failed(null);
  try { const preview=await previewWorkRecalculation(kind as "deadlines"|"kpi_migration",ctx); return { ok:true,message:`ตรวจ ${preview.scanned} งาน กระทบ ${preview.rows.length} งาน ข้าม ${preview.skipped} งาน`,previewId:preview.id,rows:preview.rows,scanned:preview.scanned,skipped:preview.skipped }; } catch(error){ return failed(error); }
}
export async function confirmWorkAdminAction(_previous:WorkAdminState,form:FormData):Promise<WorkAdminState> {
  const ctx=await context(); if (!ctx || form.get("confirm")!=="on") return { ok:false,message:"กรุณายืนยันรายการผลกระทบก่อน" };
  const parsed=z.string().uuid().safeParse(form.get("previewId")); if (!parsed.success) return failed(null);
  try { const result=await confirmDeadlineRecalculation(parsed.data,ctx); revalidatePath("/work","layout");revalidatePath("/admin");return { ok:true,message:`คำนวณกำหนดใหม่แล้ว ${result.updated} งาน` }; } catch(error){return failed(error);}
}
