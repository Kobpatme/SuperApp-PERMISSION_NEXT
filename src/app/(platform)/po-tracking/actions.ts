"use server";

import { revalidatePath } from "next/cache";
import { getAccessContext } from "@/lib/access";
import { AuthorizationError } from "@/lib/authorization";
import { correctPoReceipt, createManualPo, PoDomainError, recordPoReceipt, updateManualPoLine, updatePoLine } from "@/modules/po-tracking/service";
import {
  correctReceiptSchema, createManualPoSchema, recordReceiptSchema, updateLineSchema, updateManualLineSchema,
} from "@/modules/po-tracking/domain";

export type PoActionState = { ok: boolean; message: string; fieldErrors?: Record<string, string[]>; redirectTo?: string };

const invalid: PoActionState = { ok: false, message: "บันทึกไม่สำเร็จ กรุณาลองใหม่" };

async function context() {
  const access = await getAccessContext("po-tracking");
  if (!access.allowed || access.isDevelopmentSession || !process.env.DATABASE_URL) return null;
  return { userId: access.userId, subject: access.subject };
}

function failure(error: unknown): PoActionState {
  if (error instanceof PoDomainError) return { ok: false, message: error.message };
  if (error instanceof AuthorizationError) return { ok: false, message: "ไม่มีสิทธิ์ดำเนินการนี้" };
  console.error("PO tracking action failed", error instanceof Error ? error.name : "unknown");
  return invalid;
}

export async function recordReceiptAction(_previous: PoActionState, form: FormData): Promise<PoActionState> {
  const actor = await context();
  if (!actor) return { ...invalid, message: "ต้องเข้าสู่ระบบด้วยบัญชีที่ได้รับสิทธิ์ก่อนบันทึก" };
  const raw = {
    lineId: String(form.get("lineId") ?? ""),
    receivedOn: String(form.get("receivedOn") ?? ""),
    quantity: String(form.get("quantity") ?? ""),
    reference: String(form.get("reference") ?? "").trim(),
    note: String(form.get("note") ?? "").trim(),
  };
  const parsed = recordReceiptSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? invalid.message, fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await recordPoReceipt(actor, parsed.data);
    revalidatePath("/po-tracking");
    revalidatePath(`/po-tracking/${raw.lineId}`);
    return { ok: true, message: "บันทึกการรับของแล้ว" };
  } catch (error) {
    return failure(error);
  }
}

export async function correctReceiptAction(_previous: PoActionState, form: FormData): Promise<PoActionState> {
  const actor = await context();
  if (!actor) return { ...invalid, message: "ต้องเข้าสู่ระบบด้วยบัญชีที่ได้รับสิทธิ์ก่อนแก้ไข" };
  const withReplacement = form.get("withReplacement") === "1";
  const raw = {
    receiptId: String(form.get("receiptId") ?? ""),
    reason: String(form.get("reason") ?? "").trim(),
    ...(withReplacement ? {
      replacement: {
        receivedOn: String(form.get("replacementDate") ?? ""),
        quantity: String(form.get("replacementQuantity") ?? ""),
        reference: String(form.get("replacementReference") ?? "").trim(),
        note: String(form.get("replacementNote") ?? "").trim(),
      },
    } : {}),
  };
  const parsed = correctReceiptSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? invalid.message, fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await correctPoReceipt(actor, parsed.data);
    revalidatePath("/po-tracking");
    revalidatePath(`/po-tracking/${String(form.get("lineId") ?? "")}`);
    return { ok: true, message: withReplacement ? "ยกเลิกและบันทึกใบรับของใหม่แล้ว" : "ยกเลิกใบรับของแล้ว โดยยังเก็บประวัติไว้" };
  } catch (error) {
    return failure(error);
  }
}

export async function createManualPoAction(_previous: PoActionState, form: FormData): Promise<PoActionState> {
  const actor = await context();
  if (!actor) return { ...invalid, message: "ต้องเข้าสู่ระบบด้วยบัญชีที่ได้รับสิทธิ์ก่อนสร้าง PO" };
  const lineCount = Math.min(Math.max(Number(form.get("lineCount") ?? 0) || 0, 1), 50);
  const lines = Array.from({ length: lineCount }, (_, index) => ({
    materialCode: String(form.get(`line-${index}-materialCode`) ?? "").trim(),
    description: String(form.get(`line-${index}-description`) ?? "").trim(),
    unit: String(form.get(`line-${index}-unit`) ?? ""),
    orderedQty: String(form.get(`line-${index}-orderedQty`) ?? "").trim(),
    unitPrice: String(form.get(`line-${index}-unitPrice`) ?? "").trim(),
    poReleaseDate: String(form.get(`line-${index}-poReleaseDate`) ?? ""),
    etaDate: String(form.get(`line-${index}-etaDate`) ?? ""),
    etaText: String(form.get(`line-${index}-etaText`) ?? "").trim(),
    note: String(form.get(`line-${index}-note`) ?? "").trim(),
  }));
  const raw = {
    poNumber: String(form.get("poNumber") ?? "").trim(),
    vendorCode: String(form.get("vendorCode") ?? "").trim(),
    vendorName: String(form.get("vendorName") ?? "").trim(),
    orderCode: String(form.get("orderCode") ?? "").trim(),
    note: String(form.get("note") ?? "").trim(),
    lines,
  };
  const parsed = createManualPoSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? invalid.message, fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    const result = await createManualPo(actor, parsed.data);
    revalidatePath("/po-tracking");
    return {
      ok: true, message: `สร้าง PO ${result.poNumber} จำนวน ${result.lineIds.length} รายการแล้ว`,
      redirectTo: `/po-tracking?q=${encodeURIComponent(result.poNumber)}`,
    };
  } catch (error) {
    return failure(error);
  }
}

export async function updateManualLineAction(_previous: PoActionState, form: FormData): Promise<PoActionState> {
  const actor = await context();
  if (!actor) return { ...invalid, message: "ต้องเข้าสู่ระบบด้วยบัญชีที่ได้รับสิทธิ์ก่อนบันทึก" };
  const lineId = String(form.get("lineId") ?? "");
  const raw = {
    lineId,
    version: String(form.get("version") ?? ""),
    poNumber: String(form.get("poNumber") ?? "").trim(),
    materialCode: String(form.get("materialCode") ?? "").trim(),
    description: String(form.get("description") ?? "").trim(),
    unit: String(form.get("unit") ?? ""),
    orderedQty: String(form.get("orderedQty") ?? "").trim(),
    initialReceivedQty: String(form.get("initialReceivedQty") ?? "0").trim() || "0",
    unitPrice: String(form.get("unitPrice") ?? "").trim(),
    poReleaseDate: String(form.get("poReleaseDate") ?? ""),
    lastGrDate: String(form.get("lastGrDate") ?? ""),
    etaDate: String(form.get("etaDate") ?? ""),
    etaText: String(form.get("etaText") ?? "").trim(),
    orderCode: String(form.get("orderCode") ?? "").trim(),
    vendorCode: String(form.get("vendorCode") ?? "").trim(),
    vendorName: String(form.get("vendorName") ?? "").trim(),
    status: String(form.get("status") ?? ""),
    note: String(form.get("note") ?? "").trim(),
  };
  const parsed = updateManualLineSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? invalid.message, fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await updateManualPoLine(actor, parsed.data);
    revalidatePath("/po-tracking");
    revalidatePath(`/po-tracking/${lineId}`);
    return { ok: true, message: "บันทึกข้อมูล PO แล้ว" };
  } catch (error) {
    return failure(error);
  }
}

export async function updateLineAction(_previous: PoActionState, form: FormData): Promise<PoActionState> {
  const actor = await context();
  if (!actor) return { ...invalid, message: "ต้องเข้าสู่ระบบด้วยบัญชีที่ได้รับสิทธิ์ก่อนบันทึก" };
  const raw = {
    lineId: String(form.get("lineId") ?? ""),
    version: String(form.get("version") ?? ""),
    status: String(form.get("status") ?? ""),
    etaDate: String(form.get("etaDate") ?? ""),
    etaText: String(form.get("etaText") ?? "").trim(),
    note: String(form.get("note") ?? "").trim(),
  };
  const parsed = updateLineSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? invalid.message, fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await updatePoLine(actor, parsed.data);
    revalidatePath("/po-tracking");
    revalidatePath(`/po-tracking/${raw.lineId}`);
    return { ok: true, message: "บันทึกสถานะ ETA และหมายเหตุแล้ว" };
  } catch (error) {
    return failure(error);
  }
}
