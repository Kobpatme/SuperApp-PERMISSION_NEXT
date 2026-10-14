import { randomUUID } from "node:crypto";
import { and, desc, eq, getTableColumns, isNull, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { PDFDocument } from "pdf-lib";
import { id as idSchema, signAssignmentInput, signaturePlacementInput } from "../schemas/operations";
import { lockRequest, snapshot } from "./requests";
import { documents, signTasks, signoffConfigs, signatureAssets } from "./schema";
import { stampSignature } from "./pdf";
import { checksum, putPrivateFile, readPrivateFile, removeOrphanFile } from "./storage";
import { DuctError, material, mutation, requirePermission, transaction, type DuctContext } from "./transaction";

export async function assignSignature(id: string, raw: unknown, key: string, context: DuctContext) {
  idSchema.parse(id); const input = signAssignmentInput.parse(raw);
  return mutation(context, key, "signoff.assigned", { id, input }, async tx => {
    const row = await lockRequest(tx, id, input.version);
    await requirePermission(tx, "duct_rental.signoff.assign", row.ownerId, row.teamId);
    if (row.phase !== "PERMISSION_1" || row.archivedAt || row.cancelledAt || row.ownerDuct.trim().toUpperCase() !== "NT") throw new DuctError("STATE", "มอบหมายลงนามได้ในขั้นตอนขออนุญาตครั้งที่ 1 ของ NT", 409);
    const tasks = await tx.select().from(signTasks).where(and(eq(signTasks.requestId, id), ne(signTasks.status, "revoked"))).orderBy(signTasks.id).for("update");
    const [latestDoc] = await tx.select().from(documents).where(and(input.documentId ? eq(documents.id, input.documentId) : undefined, eq(documents.requestId, id), eq(documents.fileType, "nt_form"), isNull(documents.archivedAt))).orderBy(desc(documents.documentVersion)).limit(1).for("update");
    const [current] = latestDoc ? await tx.execute<{ valid: boolean }>(sql`select public.duct_rental_nt_current(${latestDoc.id}::uuid) as valid`) : [];
    const doc = current?.valid ? latestDoc : undefined;
    if (input.documentId && latestDoc && !doc) throw new DuctError("STALE_DOCUMENT", "ข้อมูลออกแบบเปลี่ยนแล้ว กรุณาสร้าง NT Form ใหม่", 409);
    if (input.documentId && !doc) throw new DuctError("NOT_FOUND", "ไม่พบ NT Form รุ่นที่เลือก", 404);
    const [config] = await tx.select().from(signoffConfigs).where(eq(signoffConfigs.requestId, id));
    const taskId = randomUUID(), dueAt = input.dueAt ? new Date(input.dueAt) : new Date(Date.now() + 3 * 86400000);
    await material(tx, context, "signoff.assigned", taskId, row.ownerId, async () => {
      await tx.insert(signoffConfigs).values({ requestId: id, assigneeId: input.assigneeId, configuredBy: context.actorId }).onConflictDoUpdate({ target: signoffConfigs.requestId, set: { assigneeId: input.assigneeId, configuredBy: context.actorId, version: (config?.version ?? 0) + 1, updatedAt: new Date() } });
      for (const task of tasks) {
        await tx.update(signTasks).set({ status: "revoked", version: task.version + 1 }).where(eq(signTasks.id, task.id));
        await tx.execute(sql`select public.duct_rental_notify_task(${task.id}::uuid)`);
      }
      if (doc) { await tx.insert(signTasks).values({ id: taskId, requestId: id, documentId: doc.id, documentVersion: doc.documentVersion, assigneeId: input.assigneeId, assignedBy: context.actorId, dueAt, snapshot: snapshot(row) }); await tx.execute(sql`select public.duct_rental_notify_task(${taskId}::uuid)`); }
    }, { replacedTasks: tasks.map(task => task.id), assigneeId: config?.assigneeId }, { requestId: id, assigneeId: input.assigneeId, documentId: doc?.id, documentVersion: doc?.documentVersion, dueAt: dueAt.toISOString() }, row.teamId);
    return { id: doc ? taskId : id, version: 1, taskCreated: !!doc };
  });
}
export async function revokeSignature(id: string, version: number, key: string, context: DuctContext) {
  idSchema.parse(id); z.number().int().positive().parse(version);
  return mutation(context, key, "signoff.revoked", { id, version }, async tx => {
    const [reference] = await tx.select().from(signTasks).where(eq(signTasks.id, id));
    if (!reference) throw new DuctError("NOT_FOUND", "ไม่พบงานลงนาม", 404);
    const row = await lockRequest(tx, reference.requestId);
    if (row.phase !== "PERMISSION_1" || row.archivedAt || row.cancelledAt) throw new DuctError("STATE", "คำขอนี้ปิดขั้นลงนามแล้ว", 409);
    const [task] = await tx.select().from(signTasks).where(eq(signTasks.id, id)).for("update");
    await requirePermission(tx, "duct_rental.signoff.revoke", row.ownerId, row.teamId);
    if (task.version !== version || task.status === "revoked") throw new DuctError("STATE", "งานลงนามเปลี่ยนแปลงแล้ว", 409);
    await material(tx, context, "signoff.revoked", id, row.ownerId, async () => {
      await tx.update(signTasks).set({ status: "revoked", signedDocumentId: null, signedAt: null, version: task.version + 1 }).where(eq(signTasks.id, id));
      await tx.execute(sql`select public.duct_rental_notify_task(${id}::uuid)`);
    }, { status: task.status, documentId: task.documentId }, { status: "revoked" }, row.teamId);
    return { id, version: task.version + 1 };
  });
}
export async function signDocument(id: string, raw: unknown, key: string, context: DuctContext) {
  idSchema.parse(id); const input = signaturePlacementInput.parse(raw);
  let createdKey: string | undefined;
  try {
    return await mutation(context, key, "signoff.signed", { id, input }, async tx => {
      const [reference] = await tx.select().from(signTasks).where(eq(signTasks.id, id));
      if (!reference || reference.assigneeId !== context.actorId) throw new DuctError("FORBIDDEN", "ลงนามได้เฉพาะเอกสารที่มอบหมายให้คุณ", 403);
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${'duct-request:' + reference.requestId},0))`);
      const [task] = await tx.select().from(signTasks).where(eq(signTasks.id, id)).for("update");
      if (!task || task.assigneeId !== context.actorId) throw new DuctError("FORBIDDEN", "ลงนามได้เฉพาะเอกสารที่มอบหมายให้คุณ", 403);
      await requirePermission(tx, "duct_rental.signoff.sign", context.actorId);
      const [open] = await tx.execute<{ valid: boolean }>(sql`select public.duct_rental_task_actionable(${id}::uuid) as valid`);
      if (!open?.valid) throw new DuctError("STATE", "คำขอนี้ปิดขั้นลงนามแล้ว", 409);
      if (task.status !== "pending" || task.version !== input.version) throw new DuctError("STATE", "งานลงนามเปลี่ยนแปลงแล้ว กรุณาโหลดใหม่", 409);
      // Originals are immutable. Locking them FOR UPDATE would require document-upload rights.
      // The request advisory lock serializes regeneration, closure and revocation without request UPDATE rights.
      const [doc] = await tx.select().from(documents).where(eq(documents.id, task.documentId));
      const [current] = await tx.execute<{ valid: boolean }>(sql`select public.duct_rental_nt_current(${task.documentId}::uuid) as valid`);
      if (!current?.valid) throw new DuctError("STALE_DOCUMENT", "ข้อมูลออกแบบเปลี่ยนแล้ว กรุณาสร้าง NT Form ใหม่", 409);
      const [asset] = await tx.select().from(signatureAssets).where(and(eq(signatureAssets.id, input.assetId), eq(signatureAssets.ownerId, context.actorId), isNull(signatureAssets.archivedAt))).for("share");
      if (!doc || doc.documentVersion !== task.documentVersion || doc.archivedAt || !asset) throw new DuctError("STALE_DOCUMENT", "เอกสารหรือลายเซ็นเปลี่ยนแปลงแล้ว", 409);
      // Sign original assigned bytes. Never accept signed PDF, actor, name or audit time from client.
      // Source display date is editable; audit/signedAt remain server-generated.
      const [identity] = await tx.execute<{ display_name: string; active: boolean }>(sql`select * from public.duct_rental_signer_identity()`);
      if (!identity?.active) throw new DuctError("FORBIDDEN", "บัญชีนี้ไม่พร้อมลงนาม", 403);
      const at = new Date(), bytes = await stampSignature(await readPrivateFile(doc.storageKey, doc.checksumSha256), await readPrivateFile(asset.storageKey, asset.checksumSha256), input, identity.display_name, at, input.displayDate);
      const docId = randomUUID(), storageKey = `documents/${docId}.pdf`;
      await material(tx, context, "signoff.signed", id, context.actorId, async () => {
        await putPrivateFile(storageKey, bytes); createdKey = storageKey;
        await tx.insert(documents).values({ id: docId, requestId: task.requestId, phase: "PERMISSION_1", fileType: "signed_nt_form", designSnapshot: doc.designSnapshot, name: `NT-Form-Signed-${task.snapshot.code}.pdf`, mediaType: "application/pdf", sizeBytes: bytes.length, checksumSha256: checksum(bytes), storageKey, signedTaskId: id, createdBy: context.actorId });
        await tx.update(signTasks).set({ status: "signed", signedDocumentId: docId, signedAt: at, version: task.version + 1 }).where(eq(signTasks.id, id));
        await tx.execute(sql`select public.duct_rental_notify_task(${id}::uuid)`);
      }, { status: task.status, documentId: doc.id, documentVersion: doc.documentVersion, checksum: doc.checksumSha256 }, { status: "signed", signedDocumentId: docId, checksum: checksum(bytes), placement: input, signedAt: at.toISOString() });
      return { id, documentId: docId, version: task.version + 1 };
    });
  } catch (error) { if (createdKey) await removeOrphanFile(createdKey, context); throw error; }
}
export async function saveSignatureAsset(name: string, png: Uint8Array, setDefault: boolean, key: string, context: DuctContext) {
  z.string().trim().min(1).max(100).parse(name);
  const buffer = Buffer.from(png);
  if (buffer.length < 33 || buffer.length > 2 * 1024 * 1024 || !buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) || buffer.readUInt32BE(16) > 4096 || buffer.readUInt32BE(20) > 4096) throw new DuctError("SIGNATURE_IMAGE", "ลายเซ็นต้องเป็น PNG ไม่เกิน 2 MB และ 4096 พิกเซล");
  await (await PDFDocument.create()).embedPng(png);
  let createdKey: string | undefined;
  try {
    return await mutation(context, key, "signature.saved", { name, setDefault, checksum: checksum(png) }, async tx => {
      await requirePermission(tx, "duct_rental.signoff.sign", context.actorId);
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`signature:${context.actorId}`},0))`);
      const existing = await tx.select().from(signatureAssets).where(and(eq(signatureAssets.ownerId, context.actorId), isNull(signatureAssets.archivedAt)));
      const isDefault = setDefault || !existing.some(asset => asset.isDefault), id = randomUUID(), storageKey = `signatures/${id}.png`;
      await material(tx, context, "signature.saved", id, context.actorId, async () => {
        if (isDefault) await tx.update(signatureAssets).set({ isDefault: false }).where(eq(signatureAssets.ownerId, context.actorId));
        await putPrivateFile(storageKey, png); createdKey = storageKey;
        await tx.insert(signatureAssets).values({ id, ownerId: context.actorId, name: name.trim(), storageKey, sizeBytes: png.length, checksumSha256: checksum(png), isDefault });
      }, undefined, { name: name.trim(), isDefault, checksum: checksum(png) });
      return { id, isDefault };
    });
  } catch (error) { if (createdKey) await removeOrphanFile(createdKey, context); throw error; }
}
export async function changeSignatureAsset(id: string, action: "default" | "archive", key: string, context: DuctContext) {
  idSchema.parse(id);
  return mutation(context, key, `signature.${action}`, { id }, async tx => {
    await requirePermission(tx, "duct_rental.signoff.sign", context.actorId);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`signature:${context.actorId}`},0))`);
    const [asset] = await tx.select().from(signatureAssets).where(and(eq(signatureAssets.id, id), eq(signatureAssets.ownerId, context.actorId), isNull(signatureAssets.archivedAt))).for("update");
    if (!asset) throw new DuctError("NOT_FOUND", "ไม่พบลายเซ็นของคุณ", 404);
    await material(tx, context, `signature.${action}`, id, context.actorId, async () => {
      if (action === "default") await tx.update(signatureAssets).set({ isDefault: false }).where(eq(signatureAssets.ownerId, context.actorId));
      await tx.update(signatureAssets).set(action === "default" ? { isDefault: true } : { archivedAt: new Date(), isDefault: false }).where(eq(signatureAssets.id, id));
      if (action === "archive" && asset.isDefault) {
        const [next] = await tx.select().from(signatureAssets).where(and(eq(signatureAssets.ownerId, context.actorId), isNull(signatureAssets.archivedAt))).orderBy(desc(signatureAssets.createdAt)).limit(1);
        if (next) await tx.update(signatureAssets).set({ isDefault: true }).where(eq(signatureAssets.id, next.id));
      }
    }, { name: asset.name, isDefault: asset.isDefault }, { action });
    return { id };
  });
}
export async function readSigning(context: DuctContext, selected?: string, offset = 0, query = "") {
  if (selected) idSchema.parse(selected);
  z.number().int().min(0).max(1000000).parse(offset); z.string().max(200).parse(query);
  return transaction(context, async tx => {
    const [access] = await tx.execute<{ manage: boolean }>(sql`select public.duct_rental_may_manage_sign_tasks() as manage`);
    const filter = and(access.manage ? undefined : eq(signTasks.assigneeId, context.actorId), sql`(${query}='' or strpos(lower(concat_ws(' ',${signTasks.snapshot}->>'code',${signTasks.snapshot}->>'projectName')),lower(${query}))>0 or ${signTasks.id}=${selected ?? null}::uuid)`)!;
    const tasks = await tx.select({ ...getTableColumns(signTasks), canSignNow: sql<boolean>`case when ${signTasks.status}='pending' and ${signTasks.assigneeId}=${context.actorId}::uuid then public.duct_rental_task_actionable(${signTasks.id}) and public.duct_rental_nt_current(${signTasks.documentId}) else false end` }).from(signTasks).where(filter).orderBy(sql`case when ${signTasks.id}=${selected ?? null}::uuid then 0 else 1 end`, desc(signTasks.createdAt), signTasks.id).limit(100).offset(offset);
    const [count] = await tx.execute<{ total: number }>(sql`select count(*)::int as total from ${signTasks} where ${filter}`);
    const assets = await tx.select({ id: signatureAssets.id, name: signatureAssets.name, isDefault: signatureAssets.isDefault, createdAt: signatureAssets.createdAt }).from(signatureAssets).where(isNull(signatureAssets.archivedAt)).orderBy(desc(signatureAssets.isDefault), desc(signatureAssets.createdAt));
    return { tasks, assets, total: count.total, nextOffset: offset + tasks.length < count.total ? offset + tasks.length : null };
  });
}
export async function readSignatureAsset(id: string, context: DuctContext) {
  idSchema.parse(id);
  return transaction(context, async tx => {
    const [asset] = await tx.select().from(signatureAssets).where(and(eq(signatureAssets.id, id), eq(signatureAssets.ownerId, context.actorId), isNull(signatureAssets.archivedAt)));
    if (!asset) throw new DuctError("NOT_FOUND", "ไม่พบลายเซ็นของคุณ", 404);
    return { bytes: await readPrivateFile(asset.storageKey, asset.checksumSha256), name: `${asset.name}.png`, mediaType: "image/png" };
  });
}
export async function previewSignature(id: string, raw: unknown, context: DuctContext) {
  idSchema.parse(id); const input = signaturePlacementInput.parse(raw);
  return transaction(context, async tx => {
    const [task] = await tx.select().from(signTasks).where(and(eq(signTasks.id, id), eq(signTasks.assigneeId, context.actorId)));
    await requirePermission(tx, "duct_rental.signoff.sign", context.actorId);
    if (!task || task.status !== "pending" || task.version !== input.version) throw new DuctError("STATE", "งานลงนามเปลี่ยนแปลงแล้ว กรุณาโหลดใหม่", 409);
    const [open] = await tx.execute<{ valid: boolean }>(sql`select public.duct_rental_task_actionable(${id}::uuid) as valid`);
    if (!open?.valid) throw new DuctError("STATE", "คำขอนี้ปิดขั้นลงนามแล้ว", 409);
    const [doc] = await tx.select().from(documents).where(eq(documents.id, task.documentId));
    const [current] = await tx.execute<{ valid: boolean }>(sql`select public.duct_rental_nt_current(${task.documentId}::uuid) as valid`);
    if (!current?.valid) throw new DuctError("STALE_DOCUMENT", "ข้อมูลออกแบบเปลี่ยนแล้ว กรุณาสร้าง NT Form ใหม่", 409);
    const [asset] = await tx.select().from(signatureAssets).where(and(eq(signatureAssets.id, input.assetId), eq(signatureAssets.ownerId, context.actorId), isNull(signatureAssets.archivedAt)));
    const [identity] = await tx.execute<{ display_name: string; active: boolean }>(sql`select * from public.duct_rental_signer_identity()`);
    if (!doc || doc.archivedAt || doc.documentVersion !== task.documentVersion || !asset || !identity?.active) throw new DuctError("FORBIDDEN", "เอกสารหรือลายเซ็นไม่พร้อมใช้งาน", 403);
    return { bytes: await stampSignature(await readPrivateFile(doc.storageKey, doc.checksumSha256), await readPrivateFile(asset.storageKey, asset.checksumSha256), input, identity.display_name, new Date(), input.displayDate), name: `NT-Form-Preview-${task.snapshot.code}.pdf`, mediaType: "application/pdf" };
  });
}
