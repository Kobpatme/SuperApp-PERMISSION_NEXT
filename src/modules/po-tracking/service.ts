import "server-only";

import { and, eq, sql } from "drizzle-orm";
import Decimal from "decimal.js";
import { getDb } from "@/db";
import { poLines, poReceipts } from "@/db/schema";
import { runMaterialChange } from "@/lib/material-change";
import { isAuthorized, type AuthorizationSubject } from "@/lib/authorization";
import { lockPoNumbers } from "./locking";
import {
  correctReceiptSchema, createManualPoSchema, deriveLineTotals, poListQuerySchema, recordReceiptSchema,
  updateLineSchema, updateManualLineSchema,
  type CorrectReceiptInput, type CreateManualPoInput, type PoLineTotals, type PoLineView, type PoListQuery,
  type PoOrigin, type PoReceiptView, type PoStatus, type PoSummary, type PoUnit, type RecordReceiptInput,
  type UpdateLineInput, type UpdateManualLineInput,
} from "./domain";

export const poModuleId = "po-tracking";
export const poPermissions = {
  read: "po_tracking.po.read",
  manage: "po_tracking.po.manage",
  receiptRecord: "po_tracking.receipt.record",
  receiptCorrect: "po_tracking.receipt.correct",
  priceRead: "po_tracking.price.read",
  reportRead: "po_tracking.report.read",
  importManage: "po_tracking.import.manage",
} as const;

export type PoActor = { userId: string; subject: AuthorizationSubject | null | undefined };

export type PoErrorCode =
  | "FORBIDDEN" | "NOT_FOUND" | "OVER_RECEIPT" | "LINE_INCOMPLETE" | "STALE_VERSION"
  | "RECEIPT_ALREADY_VOID" | "DUPLICATE_REFERENCE" | "DUPLICATE_LINE" | "FUTURE_DATE" | "INVALID_INPUT"
  | "IMPORTED_IMMUTABLE" | "UNIT_LOCKED";

export class PoDomainError extends Error {
  constructor(readonly code: PoErrorCode, message: string) { super(message); this.name = "PoDomainError"; }
}

const messages: Record<PoErrorCode, string> = {
  FORBIDDEN: "ไม่มีสิทธิ์ดำเนินการในรายการนี้",
  NOT_FOUND: "ไม่พบรายการที่ต้องการ",
  OVER_RECEIPT: "จำนวนรับรวมจะเกินจำนวนที่สั่งซื้อ",
  LINE_INCOMPLETE: "รายการนี้ไม่มีจำนวนสั่งที่สมบูรณ์ จึงยังบันทึกการรับของไม่ได้",
  STALE_VERSION: "ข้อมูลถูกแก้ไขแล้ว กรุณาโหลดหน้าใหม่",
  RECEIPT_ALREADY_VOID: "รายการรับของนี้ถูกยกเลิกแล้ว",
  DUPLICATE_REFERENCE: "เลขอ้างอิงนี้ถูกใช้กับการรับของที่ยังไม่ถูกยกเลิก",
  DUPLICATE_LINE: "เลข PO และรหัสวัสดุซ้ำกับรายการเดิม กรุณาเปิดรายการเดิมเพื่อตรวจสอบ",
  FUTURE_DATE: "วันที่รับของต้องไม่เป็นวันในอนาคต",
  INVALID_INPUT: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
  IMPORTED_IMMUTABLE: "รายการที่นำเข้าจากไฟล์แก้ไขข้อมูลต้นทางไม่ได้ แก้ได้เฉพาะ ETA สถานะ และหมายเหตุ",
  UNIT_LOCKED: "เปลี่ยนหน่วยนับไม่ได้เมื่อมีรายการรับของแล้ว",
};

function fail(code: PoErrorCode): never { throw new PoDomainError(code, messages[code]); }

function requirePermission(actor: PoActor, permission: string) {
  if (!isAuthorized(actor.subject, permission)) fail("FORBIDDEN");
}

function errorChainMessage(error: unknown) {
  const messages: string[] = [];
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && !seen.has(current)) {
    seen.add(current);
    messages.push(current instanceof Error ? current.message : String(current));
    current = typeof current === "object" && current !== null && "cause" in current
      ? (current as { cause?: unknown }).cause
      : null;
  }
  return messages.join(" | ");
}

function mapDbError(error: unknown): never {
  const message = errorChainMessage(error);
  if (message.includes("UNIT_LOCKED")) fail("UNIT_LOCKED");
  if (message.includes("OVER_RECEIPT")) fail("OVER_RECEIPT");
  if (message.includes("LINE_QUANTITY_INCOMPLETE")) fail("LINE_INCOMPLETE");
  if (message.includes("Receipt date cannot be in the future")) fail("FUTURE_DATE");
  if (message.includes("Imported PO source fields are immutable")) fail("IMPORTED_IMMUTABLE");
  if (message.includes("po_receipts_active_reference_idx") || (message.includes("duplicate key") && message.includes("reference"))) fail("DUPLICATE_REFERENCE");
  throw error;
}

type RawLine = {
  id: string; origin: PoOrigin; poNumber: string; materialCode: string; description: string; unit: PoUnit;
  orderedQty: string | null; initialReceivedQty: string | null; unitPrice: string | null; poAmount: string | null;
  stockQty: string | null; sourceOutstandingQty: string | null; poReleaseDate: string; lastGrDate: string | null;
  etaDate: string | null; etaText: string | null; orderCode: string | null; vendorCode: string | null; vendorName: string | null;
  status: PoStatus; note: string; version: number; sourceId: string | null; sourceRowNumber: number | null;
  receiptQty: string; receiptCount: number; importSnapshot: string | null; importFinishedAt: string | null;
  runSourceCount: number | null; runImportedCount: number | null;
};

function toLineView(row: RawLine, priceVisible: boolean): PoLineView & { importSnapshot: string | null } {
  const totals: PoLineTotals = deriveLineTotals({
    orderedQty: row.orderedQty, initialReceivedQty: row.initialReceivedQty, receiptQty: row.receiptQty,
  });
  return {
    id: row.id, origin: row.origin, poNumber: row.poNumber, materialCode: row.materialCode, description: row.description,
    unit: row.unit, orderedQty: row.orderedQty, initialReceivedQty: row.initialReceivedQty,
    receiptQty: row.receiptQty, receiptCount: Number(row.receiptCount),
    unitPrice: priceVisible ? row.unitPrice : null, poAmount: priceVisible ? row.poAmount : null,
    sourceOutstandingQty: row.sourceOutstandingQty, poReleaseDate: row.poReleaseDate, lastGrDate: row.lastGrDate,
    etaDate: row.etaDate, etaText: row.etaText, orderCode: row.orderCode, vendorCode: row.vendorCode,
    vendorName: row.vendorName, status: row.status, note: row.note, version: row.version,
    sourceId: row.sourceId, totals, importSnapshot: row.importSnapshot,
  };
}

const lineSelect = (priceVisible: boolean) => sql`
  select l.id, l.origin, l.po_number as "poNumber", l.material_code as "materialCode", l.description, l.unit,
    l.ordered_qty as "orderedQty", l.initial_received_qty as "initialReceivedQty",
    ${priceVisible ? sql`l.unit_price as "unitPrice", l.po_amount as "poAmount"` : sql`null::text as "unitPrice", null::text as "poAmount"`},
    l.stock_qty as "stockQty", l.source_outstanding_qty as "sourceOutstandingQty",
    l.po_release_date::text as "poReleaseDate", l.last_gr_date::text as "lastGrDate",
    l.eta_date::text as "etaDate", l.eta_text as "etaText", l.order_code as "orderCode",
    l.vendor_code as "vendorCode", l.vendor_name as "vendorName", l.status, l.note, l.version,
    l.source_id as "sourceId", l.source_row_number as "sourceRowNumber",
    coalesce(r.qty, 0)::text as "receiptQty", coalesce(r.cnt, 0)::int as "receiptCount",
    run.source_snapshot as "importSnapshot", run.finished_at::text as "importFinishedAt",
    run.source_count as "runSourceCount", run.imported_count as "runImportedCount"
  from public.po_lines l
  left join public.source_import_runs run on run.id = l.import_run_id
  left join (
    select line_id, sum(quantity) as qty, count(*) as cnt from public.po_receipts where voided_at is null group by line_id
  ) r on r.line_id = l.id`;

function likeTerm(value: string) {
  return `%${value.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

function listWhere(query: PoListQuery) {
  const parts = [sql`true`];
  if (query.q) {
    const term = likeTerm(query.q);
    parts.push(sql`(l.po_number ilike ${term} or l.material_code ilike ${term} or l.description ilike ${term}
      or coalesce(l.order_code, '') ilike ${term} or coalesce(l.vendor_name, '') ilike ${term}
      or coalesce(l.vendor_code, '') ilike ${term} or coalesce(l.eta_text, '') ilike ${term} or l.source_id ilike ${term})`);
  }
  if (query.unit) parts.push(sql`l.unit = ${query.unit}`);
  if (query.status) parts.push(sql`l.status = ${query.status}`);
  if (query.order) parts.push(sql`l.order_code = ${query.order}`);
  if (query.delivery === "incomplete") parts.push(sql`(l.ordered_qty is null or l.initial_received_qty is null)`);
  if (query.delivery === "pending") parts.push(sql`l.ordered_qty is not null and l.initial_received_qty is not null and l.initial_received_qty + coalesce(r.qty, 0) = 0`);
  if (query.delivery === "partial") parts.push(sql`l.ordered_qty is not null and l.initial_received_qty is not null and l.initial_received_qty + coalesce(r.qty, 0) > 0 and l.initial_received_qty + coalesce(r.qty, 0) < l.ordered_qty`);
  if (query.delivery === "received") parts.push(sql`l.ordered_qty is not null and l.initial_received_qty is not null and l.initial_received_qty + coalesce(r.qty, 0) >= l.ordered_qty`);
  return sql.join(parts, sql` and `);
}

export async function listPoLines(actor: PoActor, rawQuery: Partial<PoListQuery> & { pageSize?: number }) {
  requirePermission(actor, poPermissions.read);
  const query = poListQuerySchema.parse(rawQuery);
  const priceVisible = isAuthorized(actor.subject, poPermissions.priceRead);
  const pageSize = Math.min(Math.max(rawQuery.pageSize ?? 50, 1), 200);
  const where = listWhere(query);
  const db = getDb();
  const rows = await db.execute<RawLine>(sql`
    ${lineSelect(priceVisible)}
    where ${where}
    order by l.po_number asc, l.source_row_number asc, l.id asc
    limit ${pageSize} offset ${(query.page - 1) * pageSize}`);
  const [{ total }] = await db.execute<{ total: number }>(sql`
    select count(*)::int as total from public.po_lines l
    left join (select line_id, sum(quantity) as qty from public.po_receipts where voided_at is null group by line_id) r on r.line_id = l.id
    where ${where}`);
  const orders = await db.execute<{ orderCode: string }>(sql`
    select distinct order_code as "orderCode" from public.po_lines where order_code is not null order by order_code`);
  return { rows: [...rows].map((row) => toLineView(row, priceVisible)), total: Number(total), page: query.page, pageSize, priceVisible, query, orders: [...orders].map((row) => row.orderCode) };
}

export type PoLineDetail = {
  line: PoLineView & { importSnapshot: string | null };
  receipts: PoReceiptView[];
  importRun: { snapshot: string; finishedAt: string | null; sourceCount: number; importedCount: number } | null;
};

export async function getPoLine(actor: PoActor, id: string): Promise<PoLineDetail | null> {
  requirePermission(actor, poPermissions.read);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const priceVisible = isAuthorized(actor.subject, poPermissions.priceRead);
  const db = getDb();
  const rows = await db.execute<RawLine>(sql`
    ${lineSelect(priceVisible)}
    where l.id = ${id}::uuid limit 1`);
  const row = [...rows][0];
  if (!row) return null;
  const receiptRows = await db.execute<{
    id: string; receivedOn: string; quantity: string; reference: string; note: string;
    recordedByName: string; replacesReceiptId: string | null; voidedAt: string | null;
    voidedByName: string | null; voidReason: string | null;
  }>(sql`
    select r.id, r.received_on::text as "receivedOn", r.quantity::text as quantity, r.reference, r.note,
      coalesce(rec.display_name, rec.email, 'ไม่ทราบผู้บันทึก') as "recordedByName",
      r.replaces_receipt_id as "replacesReceiptId", r.voided_at::text as "voidedAt",
      coalesce(voided.display_name, voided.email) as "voidedByName", r.void_reason as "voidReason"
    from public.po_receipts r
    join public.profiles rec on rec.id = r.recorded_by
    left join public.profiles voided on voided.id = r.voided_by
    where r.line_id = ${id}::uuid
    order by r.received_on asc, r.created_at asc, r.id asc`);
  return {
    line: toLineView(row, priceVisible),
    receipts: [...receiptRows].map((receipt) => ({ ...receipt, quantity: receipt.quantity })),
    importRun: row.importSnapshot !== null && row.runSourceCount !== null && row.runImportedCount !== null
      ? { snapshot: row.importSnapshot, finishedAt: row.importFinishedAt, sourceCount: row.runSourceCount, importedCount: row.runImportedCount }
      : null,
  };
}

export async function recordPoReceipt(actor: PoActor, rawInput: RecordReceiptInput) {
  requirePermission(actor, poPermissions.receiptRecord);
  const parsed = recordReceiptSchema.safeParse(rawInput);
  if (!parsed.success) fail("INVALID_INPUT");
  const input = parsed.data;
  const receiptId = crypto.randomUUID();
  try {
    await runMaterialChange({
      audit: {
        actorId: actor.userId, moduleId: poModuleId, action: "po.receipt.record", entityType: "po_receipt",
        entityId: receiptId, requestId: crypto.randomUUID(),
        after: { lineId: input.lineId, receivedOn: input.receivedOn, quantity: input.quantity, reference: input.reference },
      },
    }, async (tx) => {
      const [line] = await tx.execute<{ orderedQty: string | null; initialReceivedQty: string | null; poNumber: string; materialCode: string }>(sql`
        select ordered_qty as "orderedQty", initial_received_qty as "initialReceivedQty", po_number as "poNumber", material_code as "materialCode"
        from public.po_lines where id = ${input.lineId}::uuid for update`);
      if (!line) fail("NOT_FOUND");
      if (line.orderedQty === null || line.initialReceivedQty === null) fail("LINE_INCOMPLETE");
      const [{ received }] = await tx.execute<{ received: string }>(sql`
        select coalesce(sum(quantity), 0)::text as received from public.po_receipts
        where line_id = ${input.lineId}::uuid and voided_at is null`);
      const total = new Decimal(line.initialReceivedQty).plus(received).plus(input.quantity);
      if (total.gt(line.orderedQty)) fail("OVER_RECEIPT");
      await tx.insert(poReceipts).values({
        id: receiptId, lineId: input.lineId, receivedOn: input.receivedOn, quantity: input.quantity,
        reference: input.reference, note: input.note, recordedBy: actor.userId,
      });
    });
  } catch (error) {
    if (error instanceof PoDomainError) throw error;
    mapDbError(error);
  }
  return { receiptId };
}

export async function correctPoReceipt(actor: PoActor, rawInput: CorrectReceiptInput) {
  requirePermission(actor, poPermissions.receiptCorrect);
  const parsed = correctReceiptSchema.safeParse(rawInput);
  if (!parsed.success) fail("INVALID_INPUT");
  const input = parsed.data;
  const replacementId = input.replacement ? crypto.randomUUID() : null;
  try {
    await runMaterialChange({
      audit: {
        actorId: actor.userId, moduleId: poModuleId, action: "po.receipt.correct", entityType: "po_receipt",
        entityId: input.receiptId, requestId: crypto.randomUUID(),
        after: { voidReason: input.reason, replacementReceiptId: replacementId, ...(input.replacement ?? {}) },
      },
    }, async (tx) => {
      const [receipt] = await tx.execute<{ id: string; lineId: string; voidedAt: string | null; quantity: string; reference: string }>(sql`
        select id, line_id as "lineId", voided_at::text as "voidedAt", quantity::text as quantity, reference
        from public.po_receipts where id = ${input.receiptId}::uuid for update`);
      if (!receipt) fail("NOT_FOUND");
      if (receipt.voidedAt) fail("RECEIPT_ALREADY_VOID");
      await tx.execute(sql`select id from public.po_lines where id = ${receipt.lineId}::uuid for update`);
      const [updated] = await tx.execute<{ id: string }>(sql`
        update public.po_receipts set voided_at = now(), voided_by = ${actor.userId}::uuid, void_reason = ${input.reason}
        where id = ${input.receiptId}::uuid and voided_at is null returning id`);
      if (!updated) fail("RECEIPT_ALREADY_VOID");
      if (input.replacement && replacementId) {
        await tx.insert(poReceipts).values({
          id: replacementId, lineId: receipt.lineId, receivedOn: input.replacement.receivedOn,
          quantity: input.replacement.quantity, reference: input.replacement.reference,
          note: input.replacement.note, recordedBy: actor.userId, replacesReceiptId: input.receiptId,
        });
      }
    });
  } catch (error) {
    if (error instanceof PoDomainError) throw error;
    mapDbError(error);
  }
  return { receiptId: input.receiptId, replacementId };
}

export async function updatePoLine(actor: PoActor, rawInput: UpdateLineInput) {
  requirePermission(actor, poPermissions.manage);
  const parsed = updateLineSchema.safeParse(rawInput);
  if (!parsed.success) fail("INVALID_INPUT");
  const input = parsed.data;
  try {
    await runMaterialChange({
      audit: {
        actorId: actor.userId, moduleId: poModuleId, action: "po.line.update", entityType: "po_line",
        entityId: input.lineId, requestId: crypto.randomUUID(),
        after: { status: input.status, etaDate: input.etaDate || null, etaText: input.etaText || null, note: input.note, version: input.version + 1 },
      },
    }, async (tx) => {
      const [current] = await tx.execute<{ version: number; status: string; etaDate: string | null; etaText: string | null; note: string }>(sql`
        select version, status, eta_date::text as "etaDate", eta_text as "etaText", note
        from public.po_lines where id = ${input.lineId}::uuid for update`);
      if (!current) fail("NOT_FOUND");
      if (Number(current.version) !== input.version) fail("STALE_VERSION");
      const [updated] = await tx.execute<{ id: string }>(sql`
        update public.po_lines set status = ${input.status}, eta_date = ${input.etaDate || null}::date,
          eta_text = ${input.etaText || null}, note = ${input.note}, version = version + 1, updated_at = now()
        where id = ${input.lineId}::uuid and version = ${input.version} returning id`);
      if (!updated) fail("STALE_VERSION");
    });
  } catch (error) {
    if (error instanceof PoDomainError) throw error;
    throw error;
  }
  return { lineId: input.lineId };
}

function poAmountFor(orderedQty: string, unitPrice: string) {
  if (!unitPrice) return null;
  return new Decimal(orderedQty).times(unitPrice).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

/**
 * Create a PO directly in the app with every line in one transaction and one
 * audit record. Manual lines carry no import run/source row, so the imported
 * source lineage cannot be overwritten by manual editing.
 */
export async function createManualPo(actor: PoActor, rawInput: CreateManualPoInput) {
  requirePermission(actor, poPermissions.manage);
  // Prices are part of the manual entry form; never let an actor create values
  // they are not allowed to read back.
  requirePermission(actor, poPermissions.priceRead);
  const parsed = createManualPoSchema.safeParse(rawInput);
  if (!parsed.success) fail("INVALID_INPUT");
  const input = parsed.data;
  const lineIds = input.lines.map(() => crypto.randomUUID());
  if (new Set(input.lines.map(line => line.materialCode)).size !== input.lines.length) fail("DUPLICATE_LINE");
  try {
    await runMaterialChange({
      audit: {
        actorId: actor.userId, moduleId: poModuleId, action: "po.line.create", entityType: "po_line",
        entityId: lineIds[0], requestId: crypto.randomUUID(),
        after: { origin: "manual", poNumber: input.poNumber, lineIds, lineCount: lineIds.length },
      },
    }, async (tx) => {
      await lockPoNumbers(tx, [input.poNumber]);
      const existing = await tx.select({ materialCode: poLines.materialCode }).from(poLines).where(eq(poLines.poNumber, input.poNumber));
      if (existing.some(row => input.lines.some(line => line.materialCode === row.materialCode))) fail("DUPLICATE_LINE");
      await tx.insert(poLines).values(input.lines.map((line, index) => ({
        id: lineIds[index], origin: "manual", importRunId: null, sourceId: null, sourceRowNumber: null,
        poNumber: input.poNumber, materialCode: line.materialCode, description: line.description, unit: line.unit,
        orderedQty: line.orderedQty, initialReceivedQty: "0", unitPrice: line.unitPrice || null,
        poAmount: poAmountFor(line.orderedQty, line.unitPrice), stockQty: null, sourceOutstandingQty: null,
        poReleaseDate: line.poReleaseDate, lastGrDate: null,
        etaDate: line.etaDate || null, etaText: line.etaText || null,
        orderCode: input.orderCode || null, vendorCode: input.vendorCode || null, vendorName: input.vendorName || null,
        status: "open", note: line.note || input.note, version: 1,
      })));
    });
  } catch (error) {
    if (error instanceof PoDomainError) throw error;
    mapDbError(error);
  }
  return { poNumber: input.poNumber, lineIds };
}

/** Edit master data on a manual line only; imported lines stay source-locked. */
export async function updateManualPoLine(actor: PoActor, rawInput: UpdateManualLineInput) {
  requirePermission(actor, poPermissions.manage);
  requirePermission(actor, poPermissions.priceRead);
  const parsed = updateManualLineSchema.safeParse(rawInput);
  if (!parsed.success) fail("INVALID_INPUT");
  const input = parsed.data;
  try {
    await runMaterialChange({
      audit: {
        actorId: actor.userId, moduleId: poModuleId, action: "po.line.update", entityType: "po_line",
        entityId: input.lineId, requestId: crypto.randomUUID(),
        after: {
          origin: "manual", poNumber: input.poNumber, materialCode: input.materialCode, unit: input.unit,
          orderedQty: input.orderedQty, unitPrice: input.unitPrice, status: input.status, version: input.version + 1,
        },
      },
    }, async (tx) => {
      const [original] = await tx.select({ poNumber: poLines.poNumber, materialCode: poLines.materialCode }).from(poLines).where(eq(poLines.id, input.lineId));
      if (!original) fail("NOT_FOUND");
      await lockPoNumbers(tx, [original.poNumber, input.poNumber]);
      const [current] = await tx.execute<{ origin: PoOrigin; version: number }>(sql`
        select origin, version from public.po_lines where id = ${input.lineId}::uuid for update`);
      if (!current) fail("NOT_FOUND");
      if (current.origin !== "manual") fail("IMPORTED_IMMUTABLE");
      if (Number(current.version) !== input.version) fail("STALE_VERSION");
      if (original.poNumber !== input.poNumber || original.materialCode !== input.materialCode) {
        const duplicate = await tx.select({ id: poLines.id }).from(poLines).where(and(eq(poLines.poNumber, input.poNumber), eq(poLines.materialCode, input.materialCode), sql`${poLines.id} <> ${input.lineId}::uuid`)).limit(1);
        if (duplicate.length) fail("DUPLICATE_LINE");
      }
      const [updated] = await tx.update(poLines).set({
        poNumber: input.poNumber, materialCode: input.materialCode, description: input.description, unit: input.unit,
        orderedQty: input.orderedQty, initialReceivedQty: input.initialReceivedQty, unitPrice: input.unitPrice || null,
        poAmount: poAmountFor(input.orderedQty, input.unitPrice),
        poReleaseDate: input.poReleaseDate, lastGrDate: input.lastGrDate || null,
        etaDate: input.etaDate || null, etaText: input.etaText || null,
        orderCode: input.orderCode || null, vendorCode: input.vendorCode || null, vendorName: input.vendorName || null,
        status: input.status, note: input.note, version: input.version + 1, updatedAt: new Date(),
      }).where(and(eq(poLines.id, input.lineId), eq(poLines.version, input.version))).returning({ id: poLines.id });
      if (!updated) fail("STALE_VERSION");
    });
  } catch (error) {
    if (error instanceof PoDomainError) throw error;
    mapDbError(error);
  }
  return { lineId: input.lineId };
}

export type PoReport = {
  units: PoSummary[];
  counts: {
    lines: number; incompleteLines: number; pendingLines: number; partialLines: number; receivedLines: number;
    overdueLines: number; openLines: number; onHoldLines: number; closedLines: number;
  };
  priceVisible: boolean;
  canViewImport: boolean;
  importRun: { snapshot: string; status: string; sourceCount: number; importedCount: number; anomalyCount: number; finishedAt: string | null } | null;
};

export async function getPoReport(actor: PoActor): Promise<PoReport> {
  requirePermission(actor, poPermissions.reportRead);
  const priceVisible = isAuthorized(actor.subject, poPermissions.priceRead);
  const canViewImport = isAuthorized(actor.subject, poPermissions.importManage);
  const db = getDb();
  const unitRows = await db.execute<{
    unit: PoUnit; lines: number; incompleteLines: number; ordered: string; initialReceived: string;
    receiptQty: string; outstanding: string; amount: string | null; unknownAmountLines: number;
  }>(sql`
    with receipts as (
      select line_id, sum(quantity) as qty from public.po_receipts where voided_at is null group by line_id
    )
    select l.unit,
      count(*)::int as lines,
      count(*) filter (where l.ordered_qty is null or l.initial_received_qty is null)::int as "incompleteLines",
      coalesce(sum(l.ordered_qty), 0)::text as ordered,
      coalesce(sum(l.initial_received_qty), 0)::text as "initialReceived",
      coalesce(sum(r.qty), 0)::text as "receiptQty",
      coalesce(sum(l.ordered_qty - l.initial_received_qty - coalesce(r.qty, 0)), 0)::text as outstanding,
      ${priceVisible ? sql`sum(l.po_amount)::text` : sql`null::text`} as amount,
      ${priceVisible ? sql`count(*) filter (where l.po_amount is null)::int` : sql`0::int`} as "unknownAmountLines"
    from public.po_lines l left join receipts r on r.line_id = l.id
    group by l.unit order by l.unit`);
  const [counts] = await db.execute<{
    lines: number; incompleteLines: number; pendingLines: number; partialLines: number; receivedLines: number;
    overdueLines: number; openLines: number; onHoldLines: number; closedLines: number;
  }>(sql`
    with receipts as (
      select line_id, sum(quantity) as qty from public.po_receipts where voided_at is null group by line_id
    )
    select count(*)::int as lines,
      count(*) filter (where l.ordered_qty is null or l.initial_received_qty is null)::int as "incompleteLines",
      count(*) filter (where l.ordered_qty is not null and l.initial_received_qty is not null and l.initial_received_qty + coalesce(r.qty, 0) = 0)::int as "pendingLines",
      count(*) filter (where l.ordered_qty is not null and l.initial_received_qty is not null and l.initial_received_qty + coalesce(r.qty, 0) > 0 and l.initial_received_qty + coalesce(r.qty, 0) < l.ordered_qty)::int as "partialLines",
      count(*) filter (where l.ordered_qty is not null and l.initial_received_qty is not null and l.initial_received_qty + coalesce(r.qty, 0) >= l.ordered_qty)::int as "receivedLines",
      count(*) filter (where l.eta_date < current_date and l.ordered_qty is not null and l.initial_received_qty is not null
        and l.ordered_qty - l.initial_received_qty - coalesce(r.qty, 0) > 0)::int as "overdueLines",
      count(*) filter (where l.status = 'open')::int as "openLines",
      count(*) filter (where l.status = 'on_hold')::int as "onHoldLines",
      count(*) filter (where l.status = 'closed')::int as "closedLines"
    from public.po_lines l left join receipts r on r.line_id = l.id`);
  const [run] = await db.execute<{ snapshot: string; status: string; sourceCount: number; importedCount: number; anomalyCount: number; finishedAt: string | null }>(sql`
    select source_snapshot as snapshot, status, source_count as "sourceCount", imported_count as "importedCount",
      anomaly_count as "anomalyCount", finished_at::text as "finishedAt"
    from public.source_import_runs
    where source_system = 'po-pending-max' and entity_type = 'po_line'
    order by created_at desc limit 1`);
  return {
    units: [...unitRows].map((row) => ({ ...row, amount: priceVisible ? row.amount : null })),
    counts, priceVisible, canViewImport,
    importRun: canViewImport && run ? { ...run, sourceCount: Number(run.sourceCount), importedCount: Number(run.importedCount), anomalyCount: Number(run.anomalyCount) } : null,
  };
}
