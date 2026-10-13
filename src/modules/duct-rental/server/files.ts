import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { PDFDocument } from "pdf-lib";
import { id as idSchema } from "../schemas/operations";
import { DuctRentalSchema } from "../schemas/design";
import { documents, requests, signTasks } from "./schema";
import { lockRequest } from "./requests";
import { generateNtPdf, generateSummaryPdf } from "./pdf";
import { checksum, putPrivateFile, readPrivateFile, removeOrphanFile } from "./storage";
import { DuctError, material, mutation, requirePermission, transaction, type DuctContext } from "./transaction";

export const fileKinds = ["memo", "drawing", "permission_letter", "confirmation_form", "rate_notice", "invoice", "contract", "receipt", "renewal_contract", "cad", "kmz", "other"] as const;
export type UploadedFile = { name: string; bytes: Uint8Array };
async function detectFile(file: UploadedFile) {
  z.string().min(1).max(255).refine(name => !/[\\/\x00-\x1f]/.test(name)).parse(file.name);
  if (!file.bytes.length || file.bytes.length > 25 * 1024 * 1024) throw new DuctError("FILE_SIZE", "ไฟล์ต้องมีขนาดไม่เกิน 25 MB", 413);
  const ext = file.name.split(".").at(-1)?.toLowerCase(), buffer = Buffer.from(file.bytes);
  if (ext === "pdf" && buffer.subarray(0, 5).toString() === "%PDF-") { const pdf = await PDFDocument.load(file.bytes); if (pdf.getPageCount() > 200) throw new DuctError("FILE_PAGES", "PDF มีจำนวนหน้าเกินกำหนด"); return { ext, mediaType: "application/pdf" }; }
  if (ext === "png" && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { ext, mediaType: "image/png" };
  if (["jpg", "jpeg"].includes(ext || "") && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return { ext: "jpg", mediaType: "image/jpeg" };
  if (ext === "kmz" && buffer.subarray(0, 4).equals(Buffer.from([80, 75, 3, 4]))) return { ext, mediaType: "application/vnd.google-earth.kmz" };
  if (ext === "kml" && buffer.subarray(0, 2048).toString().includes("<kml")) return { ext, mediaType: "application/vnd.google-earth.kml+xml" };
  if (ext === "dwg" && /^AC10\d\d/.test(buffer.subarray(0, 6).toString())) return { ext, mediaType: "application/octet-stream" };
  if (ext === "dxf" && /SECTION|AutoCAD Binary DXF/.test(buffer.subarray(0, 128).toString())) return { ext, mediaType: "application/octet-stream" };
  throw new DuctError("FILE_TYPE", "ชนิดไฟล์หรือเนื้อหาไม่ตรงกัน กรุณาเลือก PDF, รูปภาพ, CAD หรือ KML/KMZ");
}
export async function uploadDocument(id: string, raw: unknown, file: UploadedFile, key: string, context: DuctContext) {
  idSchema.parse(id);
  const input = z.object({ version: z.coerce.number().int().positive(), fileType: z.enum(fileKinds), supersedesId: idSchema.optional() }).strict().parse(raw);
  const detected = await detectFile(file), digest = checksum(file.bytes);
  let createdKey: string | undefined;
  try {
    return await mutation(context, key, "document.uploaded", { id, input, name: file.name, checksum: digest }, async tx => {
      const row = await lockRequest(tx, id, input.version);
      await requirePermission(tx, "duct_rental.document.upload", row.ownerId, row.teamId);
      if (row.archivedAt || row.cancelledAt) throw new DuctError("CLOSED", "รายการนี้สิ้นสุดแล้ว", 409);
      if (["drawing", "permission_letter", "confirmation_form", "rate_notice", "invoice", "contract", "receipt", "renewal_contract"].includes(input.fileType) && detected.ext !== "pdf") throw new DuctError("PDF_REQUIRED", "เอกสารประเภทนี้ต้องเป็น PDF");
      const docId = randomUUID(), storageKey = `documents/${docId}.${detected.ext}`;
      const [previous] = input.supersedesId ? await tx.select().from(documents).where(and(eq(documents.id, input.supersedesId), eq(documents.requestId, id))).for("update") : [];
      if (input.supersedesId && (!previous || previous.fileType !== input.fileType)) throw new DuctError("DOCUMENT_VERSION", "เอกสารที่จะแทนที่ไม่ตรงกับคำขอ", 409);
      await material(tx, context, "document.uploaded", docId, row.ownerId, async () => {
        await putPrivateFile(storageKey, file.bytes); createdKey = storageKey;
        await tx.insert(documents).values({ id: docId, requestId: id, phase: row.phase, fileType: input.fileType, name: file.name, ...detected, mediaType: detected.mediaType, sizeBytes: file.bytes.length, checksumSha256: digest, storageKey, documentVersion: previous ? previous.documentVersion + 1 : 1, supersedesId: previous?.id, createdBy: context.actorId });
        if (input.fileType === "memo" && row.phase !== "COMPLETE") await tx.update(requests).set({ missingDocs: "", version: row.version + 1, updatedAt: new Date() }).where(eq(requests.id, id));
      }, undefined, { requestId: id, fileType: input.fileType, checksumSha256: digest, sizeBytes: file.bytes.length }, row.teamId);
      return { id: docId, requestId: id, version: input.fileType === "memo" && row.phase !== "COMPLETE" ? row.version + 1 : row.version };
    });
  } catch (error) { if (createdKey) await removeOrphanFile(createdKey, context); throw error; }
}
export async function generateNtDocument(id: string, version: number, key: string, context: DuctContext, reference?: string) {
  if (reference !== undefined) z.string().trim().min(1).max(200).parse(reference);
  let createdKey: string | undefined;
  try {
    return await mutation(context, key, "document.nt.generated", { id, version, reference }, async tx => {
      const row = await lockRequest(tx, id, version);
      await requirePermission(tx, "duct_rental.document.upload", row.ownerId, row.teamId);
      if (!["DESIGN", "DRAFTSMAN", "PERMISSION_1"].includes(row.phase) || row.archivedAt || row.cancelledAt) throw new DuctError("STATE", "คำขอนี้ผ่านขั้นตอนจัดทำ NT Form แล้ว", 409);
      if (reference !== undefined) {
        await requirePermission(tx, row.phase === "DESIGN" ? "duct_rental.request.update" : "duct_rental.permission1.submit", row.ownerId, row.teamId);
        if (row.phase !== "DESIGN" && row.phase !== "PERMISSION_1") throw new DuctError("STATE", "แก้เลขอ้างอิงได้ในขั้นออกแบบหรือขออนุญาตครั้งที่ 1", 409);
        row.design = { ...row.design, permissionRequestNumber: reference };
      }
      const [previous] = await tx.select().from(documents).where(and(eq(documents.requestId, id), eq(documents.fileType, "nt_form"))).orderBy(desc(documents.documentVersion)).limit(1).for("update");
      if (previous) await requirePermission(tx, "duct_rental.signoff.revoke", row.ownerId, row.teamId);
      const bytes = await generateNtPdf(DuctRentalSchema.parse(row.design)), docId = randomUUID(), storageKey = `documents/${docId}.pdf`;
      await material(tx, context, "document.nt.generated", docId, row.ownerId, async () => {
        if (reference !== undefined) await tx.update(requests).set({ design: row.design, version: row.version + 1, updatedAt: new Date() }).where(eq(requests.id, id));
        const tasks = await tx.select().from(signTasks).where(and(eq(signTasks.requestId, id), previous ? eq(signTasks.documentId, previous.id) : undefined)).for("update");
        for (const task of tasks.filter(task => task.status !== "revoked")) {
          await tx.update(signTasks).set({ status: "revoked", signedDocumentId: null, signedAt: null, version: task.version + 1 }).where(eq(signTasks.id, task.id));
          await tx.execute(sql`select public.duct_rental_notify_task(${task.id}::uuid)`);
        }
        await putPrivateFile(storageKey, bytes); createdKey = storageKey;
        await tx.insert(documents).values({ id: docId, requestId: id, phase: "PERMISSION_1", fileType: "nt_form", name: `NT-Form-${row.code}.pdf`, mediaType: "application/pdf", sizeBytes: bytes.length, checksumSha256: checksum(bytes), storageKey, supersedesId: previous?.id, documentVersion: previous ? previous.documentVersion + 1 : 1, createdBy: context.actorId });
      }, { previousDocumentId: previous?.id ?? null }, { requestId: id, documentVersion: previous ? previous.documentVersion + 1 : 1, permissionRequestNumber: reference }, row.teamId);
      return { id: docId, version: reference !== undefined ? row.version + 1 : row.version };
    });
  } catch (error) { if (createdKey) await removeOrphanFile(createdKey, context); throw error; }
}
export async function previewNtDocument(id: string, context: DuctContext, reference?: string, download = false) {
  idSchema.parse(id); if (reference !== undefined) z.string().max(200).parse(reference);
  return transaction(context, async tx => {
    const [row] = await tx.select().from(requests).where(eq(requests.id, id));
    if (!row) throw new DuctError("NOT_FOUND", "ไม่พบคำขอ", 404);
    await requirePermission(tx, download ? "duct_rental.document.export" : "duct_rental.document.read", row.ownerId, row.teamId);
    const design = DuctRentalSchema.parse({ ...row.design, ...(reference !== undefined ? { permissionRequestNumber: reference } : {}) });
    return { bytes: await generateNtPdf(design), name: `NT-Form-${row.code}.pdf`, mediaType: "application/pdf" };
  });
}
export async function downloadDocument(id: string, context: DuctContext, exportFile = false) {
  idSchema.parse(id);
  return transaction(context, async tx => {
    const [file] = await tx.select().from(documents).where(and(eq(documents.id, id), isNull(documents.archivedAt)));
    if (!file) throw new DuctError("NOT_FOUND", "ไม่พบเอกสารหรือคุณไม่มีสิทธิ์", 404);
    if (exportFile) {
      const [request] = await tx.select().from(requests).where(eq(requests.id, file.requestId));
      if (!request) throw new DuctError("FORBIDDEN", "ไม่มีสิทธิ์ส่งออกเอกสาร", 403);
      await requirePermission(tx, "duct_rental.document.export", request.ownerId, request.teamId);
    }
    return { bytes: await readPrivateFile(file.storageKey, file.checksumSha256), name: file.name, mediaType: file.mediaType };
  });
}
export async function summaryDocument(id: string, context: DuctContext) {
  idSchema.parse(id);
  return transaction(context, async tx => {
    const [row] = await tx.select().from(requests).where(eq(requests.id, id));
    if (!row) throw new DuctError("NOT_FOUND", "ไม่พบรายการ", 404);
    await requirePermission(tx, "duct_rental.document.export", row.ownerId, row.teamId);
    return { bytes: await generateSummaryPdf(DuctRentalSchema.parse(row.design), row.code), name: `Duct-Rental-${row.code}.pdf`, mediaType: "application/pdf" };
  });
}
