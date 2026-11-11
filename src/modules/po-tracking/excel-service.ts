import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb, type DatabaseTransaction } from "@/db";
import { poLines } from "@/db/schema";
import { isAuthorized } from "@/lib/authorization";
import { runMaterialChange } from "@/lib/material-change";
import { readWorkbook } from "../../../scripts/po-tracking-xlsx.mjs";
import { parseExcelRows, planExcelRows, type ExistingExcelLine, type ExcelPoRow } from "./excel-domain";
import { PoDomainError, poPermissions, type PoActor } from "./service";
import { lockPoNumbers } from "./locking";

function authorize(actor: PoActor) {
  for (const permission of [poPermissions.importManage, poPermissions.manage, poPermissions.priceRead]) {
    if (!isAuthorized(actor.subject, permission)) throw new PoDomainError("FORBIDDEN", "ต้องมีสิทธิ์นำเข้า จัดการ PO และดูราคา");
  }
}
export async function readPoExcel(file: File) {
  if (!file.name.toLowerCase().endsWith(".xlsx") || !file.size || file.size > 512 * 1024) throw new Error("เลือกไฟล์ .xlsx ขนาดไม่เกิน 512 KB");
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.readUInt32LE(0) !== 0x04034b50) throw new Error("รูปแบบไฟล์ไม่ใช่ Excel .xlsx");
  try {
    const workbook = readWorkbook(buffer);
    return { ...parseExcelRows(workbook.rows), sheet: workbook.name, checksum: createHash("sha256").update(buffer).digest("hex") };
  } catch (error) {
    // Only parser/domain messages are returned; never expose ZIP internals.
    if (error instanceof Error && /[ก-๙]/.test(error.message)) throw error;
    throw new Error("อ่านไฟล์ Excel ไม่สำเร็จ กรุณาตรวจสอบว่าไฟล์ไม่เสียหาย ไม่มีการเข้ารหัส และข้อมูลไม่ใหญ่เกินกำหนด");
  }
}
type ParsedExcel = Awaited<ReturnType<typeof readPoExcel>>;
async function buildPreview(parsed: ParsedExcel, db: ReturnType<typeof getDb> | DatabaseTransaction) {
  const poNumbers = [...new Set(parsed.rows.map(r => r.poNumber))];
  const existing = poNumbers.length ? await db.select().from(poLines).where(inArray(poLines.poNumber, poNumbers)) : [];
  const receipts = existing.length ? await db.execute<{ lineId: string; qty: string }>(sql`
    select line_id as "lineId", coalesce(sum(quantity),0)::text as qty from public.po_receipts
    where line_id in (${sql.join(existing.map(e => sql`${e.id}::uuid`), sql`, `)}) and voided_at is null group by line_id`) : [];
  const sums = new Map([...receipts].map(r => [r.lineId, r.qty]));
  const candidates: ExistingExcelLine[] = existing.map(e => ({ ...e, unit: e.unit as ExcelPoRow["unit"], receiptQty: sums.get(e.id) ?? "0" }));
  const decisions = planExcelRows(parsed.rows, candidates);
  const digest = createHash("sha256").update(JSON.stringify({ checksum: parsed.checksum, decisions })).digest("hex");
  return { sheet: parsed.sheet, total: parsed.total, errors: parsed.errors, decisions, digest };
}
export type ExcelPreview = Awaited<ReturnType<typeof buildPreview>>;
export async function previewPoExcel(actor: PoActor, file: File) {
  authorize(actor);
  return buildPreview(await readPoExcel(file), getDb());
}
export async function confirmPoExcel(actor: PoActor, file: File, digest: string, selectedRows: number[]) {
  authorize(actor);
  const parsed = await readPoExcel(file);
  if (!selectedRows.length || new Set(selectedRows).size !== selectedRows.length || selectedRows.some(n => !Number.isSafeInteger(n) || n < 1)) throw new Error("เลือกรายการที่ต้องการบันทึก");
  return getDb().transaction(async tx => {
    const numbers = [...new Set(parsed.rows.map(row => row.poNumber))];
    await lockPoNumbers(tx, numbers);
    // Receipt writers lock the same parent rows. Lock in stable order before
    // checking the preview, so quantities and versions cannot change mid-save.
    if (numbers.length) await tx.select({ id: poLines.id }).from(poLines).where(inArray(poLines.poNumber, numbers)).orderBy(poLines.id).for("update");
    const preview = await buildPreview(parsed, tx);
    if (preview.digest !== digest) throw new Error("ข้อมูลเปลี่ยนหลังตรวจไฟล์ กรุณาตรวจสอบไฟล์อีกครั้งก่อนยืนยัน");
    const selected = preview.decisions.filter(d => selectedRows.includes(d.row.row));
    if (selected.length !== selectedRows.length || selected.some(d => !["new", "update"].includes(d.kind))) throw new Error("รายการที่เลือกมีข้อมูลซ้ำหรือขัดแย้ง กรุณาตรวจสอบใหม่");
    const added = selected.filter(d => d.kind === "new");
    const runId = randomUUID();
    const operationId = randomUUID();
    if (added.length) {
      await tx.execute(sql`insert into public.source_import_runs
        (id,source_system,entity_type,source_snapshot,status,source_count,imported_count,anomaly_count,checksum,started_at)
        values (${runId},'po-excel-ui','po_line',${operationId},'running',${added.length},0,0,${parsed.checksum},now())`);
    }
    for (const decision of selected) {
      const { row } = decision;
      const id = decision.targetId ?? randomUUID();
      await runMaterialChange({ audit: {
        actorId: actor.userId, moduleId: "po-tracking", action: decision.kind === "new" ? "po.excel.create" : "po.excel.update",
        entityType: "po_line", entityId: id, requestId: operationId,
        before: decision.kind === "update" ? Object.fromEntries(decision.changes.map(c => [c.field, c.before])) : null,
        after: decision.kind === "new" ? { ...row } : Object.fromEntries(decision.changes.map(c => [c.field, c.after])),
        metadata: { checksum: parsed.checksum, sheet: parsed.sheet, row: row.row },
      } }, async inner => {
        if (decision.kind === "new") {
          const sourceId = `xlsx:${parsed.checksum}:${row.row}`;
          const { row: sourceRowNumber, note, ...values } = row;
          await inner.insert(poLines).values({ ...values, id, origin: "import", importRunId: runId, sourceId, sourceRowNumber });
          if (note) await inner.update(poLines).set({ note, version: 2, updatedAt: new Date() }).where(eq(poLines.id, id));
          await inner.execute(sql`insert into public.source_import_rows
            (run_id,source_id,source_checksum,status,target_entity_type,target_entity_id,raw_payload)
            values (${runId},${sourceId},${createHash("sha256").update(JSON.stringify(row)).digest("hex")},'imported','po_line',${id},${JSON.stringify(row)}::jsonb)`);
        } else {
          const changes = { etaDate: row.etaDate, etaText: row.etaText, ...(row.note !== null ? { note: row.note } : {}), version: decision.version! + 1, updatedAt: new Date() };
          const updated = await inner.update(poLines).set(changes).where(and(eq(poLines.id, id), eq(poLines.version, decision.version!))).returning({ id: poLines.id });
          if (!updated.length) throw new Error("ข้อมูลเปลี่ยน กรุณาตรวจสอบใหม่");
        }
      }, tx);
    }
    if (added.length) await tx.execute(sql`update public.source_import_runs set status='reconciled',imported_count=${added.length},finished_at=now() where id=${runId}`);
    return { added: added.length, updated: selected.length - added.length };
  });
}
