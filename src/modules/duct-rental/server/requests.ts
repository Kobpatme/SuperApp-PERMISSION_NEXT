import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { DatabaseTransaction } from "@/db";
import { DuctRentalDraftSchema, DuctRentalSchema, InstallDetailSchema, InstallDraftSchema } from "../schemas/design";
import { guaranteeInput, id as idSchema, listInput, rateInput, version as versionSchema } from "../schemas/operations";
import { hasIncompleteRequiredDocuments, requestPhases } from "../domain/source-policy";
import { assertPhaseAction, nextPhase, phasePermission } from "../domain/workflow";
import { documents, rates, requests } from "./schema";
import { DuctError, material, mutation, requirePermission, transaction, type DuctContext } from "./transaction";

export async function lockRequest(tx: DatabaseTransaction, id: string, version?: number) {
  idSchema.parse(id); if (version !== undefined) versionSchema.parse(version);
  const [row] = await tx.select().from(requests).where(eq(requests.id, id)).for("update");
  if (!row) throw new DuctError("NOT_FOUND", "ไม่พบรายการหรือคุณไม่มีสิทธิ์เข้าถึง", 404);
  if (version !== undefined && row.version !== version) throw new DuctError("STALE_VERSION", "ข้อมูลถูกแก้ไขแล้ว กรุณาโหลดข้อมูลใหม่", 409);
  return row;
}
export function snapshot(row: typeof requests.$inferSelect) {
  return { code: row.code, projectName: row.projectName, routeName: row.routeName, ownerDuct: row.ownerDuct, serviceCenter: row.serviceCenter, province: row.province, district: row.district };
}
export async function createRequest(raw: unknown, teamId: string | null, key: string, context: DuctContext, draft = false) {
  const design = draft ? DuctRentalDraftSchema.parse(raw) : DuctRentalSchema.parse(raw); if (teamId) idSchema.parse(teamId);
  // Source URL fields are historical hints only; private document IDs replace URL authority.
  delete design.memoUrl; delete design.ductDrawingUrl;
  return mutation(context, key, "request.created", { design, teamId, draft }, async tx => {
    await requirePermission(tx, "duct_rental.request.create", context.actorId, teamId);
    const year = new Intl.DateTimeFormat("en", { timeZone: "Asia/Bangkok", year: "numeric" }).format(new Date());
    const id = randomUUID(), code = `RQ-${year}-${id.slice(0, 8).toUpperCase()}`;
    await material(tx, context, "request.created", id, context.actorId, async () => {
      await tx.insert(requests).values({ id, code, ownerId: context.actorId, teamId, design, projectName: design.projectName ?? "", routeName: design.routeName ?? "", ownerDuct: design.ownerDuct ?? "", serviceCenter: design.serviceCenter ?? "", province: design.province ?? "", district: design.district ?? "", requestType: design.requestType ?? "NEW", phaseStatuses: Object.fromEntries(requestPhases.map(phase => [phase, "pending"])) as typeof requests.$inferInsert.phaseStatuses });
    }, undefined, { code, phase: "DESIGN" }, teamId);
    return { id, code, version: 1 };
  });
}
export async function changeRequest(id: string, action: "accept" | "submit" | "save" | "archive", version: number, raw: unknown, key: string, context: DuctContext) {
  return mutation(context, key, `request.${action}`, { id, version, raw }, async tx => {
    const row = await lockRequest(tx, id, version);
    if (action !== "archive" && (row.archivedAt || row.cancelledAt || row.phase === "COMPLETE")) throw new DuctError("CLOSED", "รายการนี้สิ้นสุดแล้ว", 409);
    const permission = action === "archive" ? "duct_rental.request.archive" : action === "save" && row.phase === "DESIGN" ? "duct_rental.request.update" : phasePermission(row.phase, action === "accept" ? "accept" : "submit");
    await requirePermission(tx, permission, row.ownerId, row.teamId);
    const change: Partial<typeof requests.$inferInsert> = { version: row.version + 1, updatedAt: new Date() };
    let beforeRate: typeof rates.$inferSelect | undefined;
    let afterRate: Record<string, unknown> | undefined;
    if (action === "archive") change.archivedAt = new Date();
    else if (action === "accept") {
      try { assertPhaseAction(row.phaseStatuses[row.phase], "accept"); } catch (e) { throw new DuctError("STATE", (e as Error).message, 409); }
      change.phaseStatuses = { ...row.phaseStatuses, [row.phase]: "accepted" };
    } else {
      const input = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
      if (row.phase === "DESIGN") {
        const design = action === "save" ? DuctRentalDraftSchema.parse(input.design ?? row.design) : DuctRentalSchema.parse(input.design ?? row.design); delete design.memoUrl; delete design.ductDrawingUrl;
        Object.assign(change, { design, projectName: design.projectName ?? "", routeName: design.routeName ?? "", ownerDuct: design.ownerDuct ?? "", serviceCenter: design.serviceCenter ?? "", province: design.province ?? "", district: design.district ?? "", requestType: design.requestType ?? "NEW" });
      }
      if (row.phase === "INSTALL") change.install = action === "save" ? InstallDraftSchema.parse(input.install ?? row.install) : InstallDetailSchema.parse(input.install ?? row.install);
      if (input.notes !== undefined) {
        if (typeof input.notes !== "string" || input.notes.length > 10000) throw new DuctError("VALIDATION", "หมายเหตุยาวเกินกำหนด");
        change.phaseNotes = { ...row.phaseNotes, [row.phase]: input.notes };
        if (row.phase === "DRAFTSMAN_2") change.asBuilt = { ...row.asBuilt, notes: input.notes };
      }
      if (input.missingDocs !== undefined) {
        if (typeof input.missingDocs !== "string" || input.missingDocs.length > 10000) throw new DuctError("VALIDATION", "ข้อความเอกสารค้างยาวเกินกำหนด");
        change.missingDocs = input.missingDocs;
      }
      if (row.phase === "3RD_PARTY_1" && input.rate) {
        await requirePermission(tx, "duct_rental.rate.read", row.ownerId, row.teamId);
        const rate = rateInput.parse(input.rate);
        [beforeRate] = await tx.select().from(rates).where(eq(rates.requestId, id)); afterRate = rate;
        // Rate mutation and request audit share this transaction; never client-computed totals.
        await tx.insert(rates).values({ requestId: id, ...rate }).onConflictDoUpdate({ target: rates.requestId, set: { ...rate, updatedAt: new Date() } });
      }
      if (row.phase === "3RD_PARTY_2" && input.guarantee) {
        await requirePermission(tx, "duct_rental.rate.read", row.ownerId, row.teamId);
        const guarantee = guaranteeInput.parse(input.guarantee);
        [beforeRate] = await tx.select().from(rates).where(eq(rates.requestId, id)); afterRate = { ...beforeRate, guaranteeAmount: guarantee.fullAmount };
        change.guarantee = { ...guarantee, fullAmount: guarantee.fullAmount };
        // Amount is available only via rates; redact it from universally visible request JSON.
        delete change.guarantee.fullAmount;
        await tx.insert(rates).values({ requestId: id, monthlyFee: "0.00", yearlyFee: "0.00", guaranteeAmount: guarantee.fullAmount })
          .onConflictDoUpdate({ target: rates.requestId, set: { guaranteeAmount: guarantee.fullAmount, updatedAt: new Date() } });
      }
      if (action === "submit") {
        // Source DESIGN creation submits directly; only later phases require acceptance.
        if (row.phase !== "DESIGN") try { assertPhaseAction(row.phaseStatuses[row.phase], "submit"); } catch (e) { throw new DuctError("STATE", (e as Error).message, 409); }
        await assertSubmission(tx, row, change);
        const phase = nextPhase(row.phase, row.ownerDuct);
        change.phase = phase; change.phaseStatuses = { ...row.phaseStatuses, [row.phase]: "done", [phase]: "pending" };
      }
    }
    await material(tx, context, `request.${action}`, id, row.ownerId, async () => { await tx.update(requests).set(change).where(eq(requests.id, id)); }, { version: row.version, phase: row.phase, design: change.design ? row.design : undefined, install: change.install ? row.install : undefined, missingDocs: row.missingDocs, guarantee: change.guarantee ? row.guarantee : undefined, rate: beforeRate }, { version: change.version, phase: change.phase ?? row.phase, design: change.design, install: change.install, missingDocs: change.missingDocs ?? row.missingDocs, guarantee: change.guarantee, rate: afterRate }, row.teamId);
    return { id, version: change.version!, phase: change.phase ?? row.phase };
  });
}
async function assertSubmission(tx: DatabaseTransaction, row: typeof requests.$inferSelect, change: Partial<typeof requests.$inferInsert>) {
  await requirePermission(tx, "duct_rental.document.read", row.ownerId, row.teamId);
  const files = await tx.select().from(documents).where(and(eq(documents.requestId, row.id), isNull(documents.archivedAt)));
  const has = (kind: string, phase?: string) => files.some(file => file.fileType === kind && (!phase || file.phase === phase));
  const need = (allowed: boolean, message: string) => { if (!allowed) throw new DuctError("DOCUMENT_REQUIRED", message); };
  if (row.phase === "DRAFTSMAN") need(has("drawing", "DRAFTSMAN"), "กรุณาแนบแบบท่อก่อนส่งงาน");
  if (row.phase === "DRAFTSMAN_2") need(has("drawing", "DRAFTSMAN_2"), "กรุณาแนบ PDF แบบหลังติดตั้ง");
  if (row.phase === "PERMISSION_1") {
    need(has("nt_form"), "กรุณาจัดทำ NT Form");
    const [signed] = await tx.execute<{ signed: boolean }>(sql`select public.duct_rental_request_signed(${row.id}::uuid) as signed`);
    need(Boolean(signed?.signed), "กรุณารอผู้รับมอบหมายลงนาม NT Form");
    need(has("permission_letter") && has("confirmation_form"), "กรุณาแนบหนังสืออนุญาตและแบบยืนยัน");
  }
  if (row.phase === "3RD_PARTY_1") need(has("rate_notice") && has("invoice"), "กรุณาแนบเอกสารแจ้งอัตราและใบแจ้งหนี้");
  if (row.phase === "3RD_PARTY_2") {
    need(has("contract") && has("receipt"), "กรุณาแนบสัญญาและใบเสร็จรับเงิน");
    const guarantee = change.guarantee ?? row.guarantee;
    need(Boolean(guarantee && ["contractNumber", "paymentType", "venderCode", "receiptNumber"].every(field => guarantee[field])), "กรุณากรอกข้อมูลหนังสือค้ำประกันให้ครบ");
    const [rate] = await tx.select().from(rates).where(eq(rates.requestId, row.id));
    need(rate?.guaranteeAmount != null, "กรุณาระบุเงินค้ำประกัน");
    need(!hasIncompleteRequiredDocuments({ currentPhase: row.phase, missingDocs: change.missingDocs ?? row.missingDocs, files: files.map(file => ({ name: file.name, fileType: file.fileType })) }), "ยังมีเอกสารค้าง กรุณาตรวจสอบก่อนจบงาน");
  }
}
export async function readRequest(id: string, context: DuctContext) {
  idSchema.parse(id);
  return transaction(context, async tx => {
    const [row] = await tx.select().from(requests).where(eq(requests.id, id));
    if (!row) throw new DuctError("NOT_FOUND", "ไม่พบรายการหรือคุณไม่มีสิทธิ์เข้าถึง", 404);
    const [rate, files] = await Promise.all([tx.select().from(rates).where(eq(rates.requestId, id)), tx.select({ id: documents.id, requestId: documents.requestId, phase: documents.phase, fileType: documents.fileType, name: documents.name, mediaType: documents.mediaType, sizeBytes: documents.sizeBytes, documentVersion: documents.documentVersion, supersedesId: documents.supersedesId, createdAt: documents.createdAt }).from(documents).where(and(eq(documents.requestId, id), isNull(documents.archivedAt)))]);
    const [capabilities] = await tx.execute<{ codes: string[] }>(sql`select public.duct_rental_request_capabilities(${id}::uuid) as codes`);
    const signers = await tx.execute<{ id: string; display_name: string }>(sql`select * from public.duct_rental_signers(${id}::uuid)`);
    return { ...row, rate: rate[0] ?? null, files, capabilities: capabilities?.codes ?? [], signers: Array.from(signers) };
  });
}
export async function listRequests(raw: unknown, context: DuctContext) {
  const input = listInput.parse(raw);
  return transaction(context, async tx => {
    const query = input.query.trim().toLowerCase();
    const incomplete = sql`(${requests.missingDocs}<>'' or (${requests.phase}<>'DESIGN' and not public.duct_rental_memo_present(${requests.id})))`;
    const workflow = sql`case when ${requests.cancelledAt} is not null then 'CANCELLED' when ${requests.phase}='COMPLETE' then 'ACTIVE' else upper(coalesce(${requests.phaseStatuses}->>${requests.phase},'pending')) end`;
    const where = and(isNull(requests.archivedAt), query ? sql`strpos(lower(concat_ws(' ',${requests.code},${requests.projectName},${requests.routeName},${requests.ownerDuct},${requests.province},${requests.serviceCenter})),${query})>0` : undefined,
      input.phase ? eq(requests.phase, input.phase as typeof requests.$inferSelect.phase) : undefined, input.serviceCenter ? eq(requests.serviceCenter, input.serviceCenter) : undefined, input.requestType ? eq(requests.requestType, input.requestType) : undefined,
      input.workflow ? sql`${workflow}=${input.workflow}` : undefined, input.documents ? input.documents === "incomplete" ? incomplete : sql`not ${incomplete}` : undefined);
    const rows = await tx.select({ id: requests.id, code: requests.code, projectName: requests.projectName, routeName: requests.routeName, phase: requests.phase, phaseStatuses: requests.phaseStatuses, ownerDuct: requests.ownerDuct, serviceCenter: requests.serviceCenter, province: requests.province, requestType: requests.requestType, missingDocs: requests.missingDocs, cancelledAt: requests.cancelledAt, version: requests.version, updatedAt: requests.updatedAt, documentsIncomplete: sql<boolean>`${incomplete}` }).from(requests).where(where).orderBy(desc(requests.updatedAt), desc(requests.id)).limit(input.limit).offset(input.offset);
    const [counts] = await tx.select({ total: sql<number>`count(*)::int`, pending: sql<number>`count(*) filter(where ${workflow}='PENDING')::int`, active: sql<number>`count(*) filter(where ${workflow}='ACTIVE')::int` }).from(requests).where(where);
    const [queues] = await tx.select({ waiting: sql<number>`count(*) filter(where ${workflow}='PENDING')::int`, missing: sql<number>`count(*) filter(where ${incomplete})::int` }).from(requests).where(isNull(requests.archivedAt));
    return { rows, counts, queues, offset: input.offset, limit: input.limit, nextOffset: input.offset + rows.length < counts.total ? input.offset + rows.length : null };
  });
}
