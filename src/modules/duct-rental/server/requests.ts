import { sourceFinancialPayload } from "../domain/source-financial";
import { submissionDocumentsReady } from "../domain/submission-gates";
import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { DatabaseTransaction } from "@/db";
import { DuctRentalDraftSchema, DuctRentalSchema, InstallDetailSchema, InstallDraftSchema } from "../schemas/design";
import { guaranteeDraftInput, guaranteeInput, id as idSchema, listInput, rateInput, version as versionSchema } from "../schemas/operations";
import { hasIncompleteRequiredDocuments, requestPhases } from "../domain/source-policy";
import { assertPhaseAction, nextPhase, phasePermission } from "../domain/workflow";
import { documents, rates, requests } from "./schema";
import { DuctError, material, mutation, requirePermission, transaction, type DuctContext } from "./transaction";

export async function lockRequest(tx: DatabaseTransaction, id: string, version?: number) {
  idSchema.parse(id); if (version !== undefined) versionSchema.parse(version);
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${'duct-request:' + id},0))`);
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
    if(action === "save" && raw && typeof raw === "object" && "design" in raw) {
      await requirePermission(tx,"duct_rental.request.update",row.ownerId,row.teamId);
      const [access] = await tx.execute<{allowed:boolean}>(sql`select public.duct_rental_can_edit_design(${id}::uuid) as allowed`);
      if(!access?.allowed)throw new DuctError("FORBIDDEN","ไม่มีสิทธิ์แก้ข้อมูลออกแบบคำขอนี้",403);
      const design = (row.phase === "DESIGN" ? DuctRentalDraftSchema : DuctRentalSchema).parse((raw as {design:unknown}).design); delete design.memoUrl;delete design.ductDrawingUrl;
      const after={design,projectName:design.projectName??"",routeName:design.routeName??"",ownerDuct:design.ownerDuct??"",serviceCenter:design.serviceCenter??"",province:design.province??"",district:design.district??"",requestType:design.requestType??"NEW",version:row.version+1,updatedAt:new Date()};
      await material(tx,context,"request.save",id,row.ownerId,async()=>{await tx.update(requests).set(after).where(eq(requests.id,id));},{design:row.design,version:row.version},{design,version:after.version},row.teamId);
      return {id,version:after.version,phase:row.phase};
    }
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
        [beforeRate] = await tx.select().from(rates).where(eq(rates.requestId, id));
        const sourceDocuments = await tx.select({ id: documents.id, fileType: documents.fileType }).from(documents).where(and(eq(documents.requestId,id),eq(documents.phase,"3RD_PARTY_1"),isNull(documents.archivedAt))).orderBy(desc(documents.createdAt));
        const pointers: Record<string,string> = {}; const pointerFields: Record<string,string> = {rate_notice:"rateNoticeFile",invoice:"serviceInvoiceFile",signed_copy:"signedFile"};
        for (const doc of sourceDocuments) if (pointerFields[doc.fileType] && !pointers[pointerFields[doc.fileType]]) pointers[pointerFields[doc.fileType]]=doc.id;
        const sourceJson = sourceFinancialPayload({ ...beforeRate?.rateNoticeData, ...pointers, monthlyFee: rate.monthlyFee, yearlyFee: rate.yearlyFee, ...(rate.contractStart !== undefined ? {contractStartDate:rate.contractStart} : {}), ...(rate.contractEnd !== undefined ? {contractEndDate:rate.contractEnd} : {}), notes: input.notes ?? row.phaseNotes[row.phase] ?? "" }, beforeRate?.guaranteeData ?? {}); afterRate = { ...rate, ...sourceJson };
        // Rate mutation and request audit share this transaction; never client-computed totals.
        await tx.insert(rates).values({ requestId: id, ...rate, ...sourceJson }).onConflictDoUpdate({ target: rates.requestId, set: { ...rate, ...sourceJson, updatedAt: new Date() } });
      }
      if (row.phase === "3RD_PARTY_2" && input.guarantee) {
        await requirePermission(tx, "duct_rental.rate.read", row.ownerId, row.teamId);
        const guarantee = action === "save" ? guaranteeDraftInput.parse(input.guarantee) : guaranteeInput.parse(input.guarantee);
        [beforeRate] = await tx.select().from(rates).where(eq(rates.requestId, id)); const guaranteeAmount = guarantee.fullAmount === undefined ? beforeRate?.guaranteeAmount ?? null : guarantee.fullAmount; const sourceJson = sourceFinancialPayload(beforeRate?.rateNoticeData ?? {}, { ...beforeRate?.guaranteeData, ...guarantee, notes: input.notes ?? row.phaseNotes[row.phase] ?? "" }); afterRate = { ...beforeRate, guaranteeAmount, ...sourceJson };
        change.guarantee = { ...row.guarantee, ...Object.fromEntries(Object.entries(guarantee).filter(([name, value]) => name !== "fullAmount" && typeof value === "string")) } as Record<string, string>;
        // Amount is available only via rates; redact it from universally visible request JSON.
        delete change.guarantee.fullAmount;
        await tx.insert(rates).values({ requestId: id, monthlyFee: beforeRate?.monthlyFee ?? "0.00", yearlyFee: beforeRate?.yearlyFee ?? "0.00", guaranteeAmount, ...sourceJson })
          .onConflictDoUpdate({ target: rates.requestId, set: { guaranteeAmount, ...sourceJson, updatedAt: new Date() } });
      }
      if (input.notes !== undefined && ["3RD_PARTY_1","3RD_PARTY_2"].includes(row.phase) && !input.rate && !input.guarantee) {
        await requirePermission(tx,"duct_rental.rate.read",row.ownerId,row.teamId);
        [beforeRate] = await tx.select().from(rates).where(eq(rates.requestId,id));
        const sourceJson = sourceFinancialPayload({ ...beforeRate?.rateNoticeData, ...(row.phase === "3RD_PARTY_1" ? {notes:input.notes} : {}) }, { ...beforeRate?.guaranteeData, ...(row.phase === "3RD_PARTY_2" ? {notes:input.notes} : {}) });
        afterRate = { ...beforeRate, ...sourceJson };
        await tx.insert(rates).values({requestId:id,monthlyFee:beforeRate?.monthlyFee ?? "0.00",yearlyFee:beforeRate?.yearlyFee ?? "0.00",guaranteeAmount:beforeRate?.guaranteeAmount ?? null,...sourceJson}).onConflictDoUpdate({target:rates.requestId,set:{...sourceJson,updatedAt:new Date()}});
      }
      if (action === "submit") {
        // Source DESIGN creation submits directly; only later phases require acceptance.
        try { assertPhaseAction(row.phaseStatuses[row.phase], "submit", row.phase); } catch (e) { throw new DuctError("STATE", (e as Error).message, 409); }
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
  const need = (allowed: boolean, message: string) => { if (!allowed) throw new DuctError("DOCUMENT_REQUIRED", message); };
  let signed = false;
  if (row.phase === "PERMISSION_1") { const [result] = await tx.execute<{ signed: boolean }>(sql`select public.duct_rental_request_signed(${row.id}::uuid) as signed`); signed = Boolean(result?.signed); }
  need(submissionDocumentsReady(row.phase,files,signed), "กรุณาตรวจเอกสารที่จำเป็นและสถานะลงนามก่อนส่งงาน");
  if (row.phase === "3RD_PARTY_2") {
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
    const [signoff] = await tx.execute<{ id: string; status: string; assignee_id: string; assignee_name: string; document_id: string; version: number }>(sql`select * from public.duct_rental_request_signoff(${id}::uuid)`);
    const [signed] = await tx.execute<{ signed: boolean }>(sql`select public.duct_rental_request_signed(${id}::uuid) as signed`);
    const [config] = await tx.execute<{ assignee_id: string }>(sql`select assignee_id from public.duct_rental_signoff_configs where request_id=${id}::uuid`);
    const [edit] = await tx.execute<{allowed:boolean}>(sql`select public.duct_rental_can_edit_design(${id}::uuid) as allowed`);
    return { ...row, rate: rate[0] ?? null, files, capabilities: (capabilities?.codes ?? []).filter(code=>code!=="duct_rental.request.update" || edit.allowed), signers: Array.from(signers), assignedSignerId: config?.assignee_id ?? null, signoff: signoff ?? null, isSigned: signed?.signed ?? false };
  });
}
export async function listRequests(raw: unknown, context: DuctContext) {
  const input = listInput.parse(raw);
  return transaction(context, async tx => {
    const query = input.query.trim().toLowerCase();
    type Row = Pick<typeof requests.$inferSelect, "id" | "code" | "projectName" | "routeName" | "phase" | "phaseStatuses" | "ownerDuct" | "serviceCenter" | "province" | "requestType" | "missingDocs" | "cancelledAt" | "version"> & { updatedAt: string; documentsIncomplete: boolean };
    // RLS runs on the base table once. Materialized rows stay inside PostgreSQL;
    // only the requested page and aggregates leave the database, at one snapshot.
    const [result] = await tx.execute<{ rows: Row[]; counts: { total: number; pending: number; active: number }; queues: { waiting: number; missing: number }; pipeline: { phase: typeof requests.$inferSelect.phase; count: number }[] }>(sql`
      with visible as materialized (
        select id,code,owner_id,team_id,project_name as "projectName",route_name as "routeName",phase,phase_statuses as "phaseStatuses",
          owner_duct as "ownerDuct",service_center as "serviceCenter",province,request_type as "requestType",missing_docs as "missingDocs",
          cancelled_at as "cancelledAt",version,updated_at as "updatedAt",
          (missing_docs<>'' or (phase<>'DESIGN' and not public.duct_rental_memo_present(id))) as "documentsIncomplete",
          case when cancelled_at is not null then 'CANCELLED' when phase='COMPLETE' then 'ACTIVE' else upper(coalesce(phase_statuses->>phase,'pending')) end as workflow
        from public.duct_rental_requests where archived_at is null
      ), filtered as materialized (
        select * from visible where (${query}='' or strpos(lower(concat_ws(' ',code,"projectName","routeName","ownerDuct",province,"serviceCenter")),${query})>0)
          and (${input.phase}='' or phase=${input.phase}) and (${input.serviceCenter}='' or "serviceCenter"=${input.serviceCenter})
          and (${input.requestType}='' or "requestType"=${input.requestType}) and (${input.workflow}='' or workflow=${input.workflow})
          and (${input.documents}='' or "documentsIncomplete"=(${input.documents}='incomplete'))
      ), queue_access as materialized (
        select owner_id,team_id,phase,public.duct_rental_has_access(public.duct_rental_phase_permission(phase,'accept'),owner_id,team_id) as allowed
        from (select distinct owner_id,team_id,phase from visible where workflow='PENDING' and phase<>'COMPLETE' and "cancelledAt" is null) pairs
      )
      select coalesce((select jsonb_agg(to_jsonb(page)-'workflow'-'owner_id'-'team_id') from (select * from filtered order by "updatedAt" desc,id desc limit ${input.limit} offset ${input.offset}) page),'[]'::jsonb) as rows,
        (select jsonb_build_object('total',count(*),'pending',count(*) filter(where workflow='PENDING'),'active',count(*) filter(where workflow='ACTIVE')) from filtered) as counts,
        (select jsonb_build_object('waiting',count(*) filter(where v.workflow='PENDING' and v.phase<>'COMPLETE' and v."cancelledAt" is null and exists(select 1 from queue_access q where q.owner_id=v.owner_id and q.team_id is not distinct from v.team_id and q.phase=v.phase and q.allowed)),
          'missing',count(*) filter(where v."documentsIncomplete" and v."cancelledAt" is null)) from visible v) as queues,
        coalesce((select jsonb_agg(jsonb_build_object('phase',phase,'count',n)) from (select phase,count(*) n from visible where "cancelledAt" is null group by phase) phases),'[]'::jsonb) as pipeline
    `);
    const rows = result.rows.map(row => ({ ...row, updatedAt: new Date(row.updatedAt) }));
    return { ...result, rows, offset: input.offset, limit: input.limit, nextOffset: input.offset + rows.length < result.counts.total ? input.offset + rows.length : null };
  });
}
