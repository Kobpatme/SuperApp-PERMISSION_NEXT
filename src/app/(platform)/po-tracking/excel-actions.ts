"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAccessContext } from "@/lib/access";
import { confirmPoExcel, previewPoExcel, type ExcelPreview } from "@/modules/po-tracking/excel-service";
import { PoDomainError } from "@/modules/po-tracking/service";

export type ExcelActionState = { ok: boolean; message: string; preview?: ExcelPreview; completed?: boolean };
async function actor() {
  const access = await getAccessContext("po-tracking");
  if (!access.allowed || access.isDevelopmentSession || !process.env.DATABASE_URL) throw new Error("กรุณาเข้าสู่ระบบด้วยบัญชีที่มีสิทธิ์นำเข้า PO");
  return { userId: access.userId, subject: access.subject };
}
function fileFrom(form: FormData) {
  const file = form.get("file");
  if (!(file instanceof File)) throw new Error("กรุณาเลือกไฟล์ Excel");
  return file;
}
function message(error: unknown) {
  if (error instanceof PoDomainError) return error.message;
  if (error instanceof Error && /[ก-๙]/.test(error.message) && !error.message.includes("query")) return error.message;
  return "นำเข้าไม่สำเร็จ กรุณาตรวจสอบไฟล์และลองใหม่";
}
export async function previewExcelAction(_state: ExcelActionState, form: FormData): Promise<ExcelActionState> {
  try {
    const identity = await actor();
    const preview = await previewPoExcel(identity, fileFrom(form));
    return { ok: true, message: "ตรวจสอบแล้ว กรุณาเลือกรายการและตรวจความแตกต่างก่อนบันทึก", preview };
  } catch (error) { return { ok: false, message: message(error) }; }
}
export async function confirmExcelAction(_state: ExcelActionState, form: FormData): Promise<ExcelActionState> {
  try {
    const identity = await actor();
    const input = z.object({ digest: z.string().regex(/^[a-f0-9]{64}$/), rows: z.array(z.coerce.number().int().positive()).min(1).max(1000), confirmed: z.literal("yes") }).parse({
      digest: form.get("digest"), rows: form.getAll("selectedRow"), confirmed: form.get("confirmed"),
    });
    const result = await confirmPoExcel(identity, fileFrom(form), input.digest, input.rows);
    revalidatePath("/po-tracking", "layout");
    return { ok: true, completed: true, message: `บันทึกแล้ว: เพิ่ม ${result.added} รายการ อัปเดต ${result.updated} รายการ` };
  } catch (error) { return { ok: false, message: message(error) }; }
}
