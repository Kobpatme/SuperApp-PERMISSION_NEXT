// Read-only reconciliation: source workbook vs the stored import run.
// Safe to run repeatedly; writes nothing.
import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import postgres from "postgres";
import { databaseSslOptions } from "../src/lib/database-ssl.mjs";
import { PO_ENTITY_TYPE, PO_SOURCE_SYSTEM, PO_STAGING_DATABASE, parsePoSource, reconcileSource, summarize } from "./po-tracking-import-core.mjs";

config({ path: ".env.local" });
const file = process.argv[2] ?? "ข้อมูล/PO Pending Max.xlsx";
const source = parsePoSource(await readFile(resolve(file)));
const sql = postgres(process.env.DATABASE_URL, { ...databaseSslOptions(), max: 1, prepare: false });
try {
  const [identity] = await sql`select current_database() as database`;
  if (identity.database !== PO_STAGING_DATABASE) {
    console.error(JSON.stringify({ ok: false, error: "WRONG_DATABASE", database: identity.database }, null, 2));
    process.exit(1);
  }
  const [run] = await sql`select id, status, source_count as "sourceCount", imported_count as "importedCount", anomaly_count as "anomalyCount"
    from public.source_import_runs where source_system = ${PO_SOURCE_SYSTEM} and entity_type = ${PO_ENTITY_TYPE} and source_snapshot = ${source.fileChecksum}`;
  if (!run) {
    console.error(JSON.stringify({ ok: false, error: "IMPORT_RUN_NOT_FOUND", checksum: source.fileChecksum }, null, 2));
    process.exit(1);
  }
  const stored = await sql`select source_id as "sourceId", source_row_number as "sourceRowNumber", material_code as "materialCode",
    description, unit, po_number as "poNumber", ordered_qty as "orderedQty", initial_received_qty as "initialReceivedQty",
    unit_price as "unitPrice", po_amount as "poAmount", stock_qty as "stockQty", source_outstanding_qty as "sourceOutstandingQty",
    po_release_date::text as "poReleaseDate", last_gr_date::text as "lastGrDate", eta_date::text as "etaDate", eta_text as "etaText",
    order_code as "orderCode", vendor_code as "vendorCode", vendor_name as "vendorName"
    from public.po_lines where import_run_id = ${run.id} order by source_row_number`;
  const lineage = await sql`select source_id as "sourceId", source_checksum as "sourceChecksum"
    from public.source_import_rows where run_id = ${run.id} order by source_id`;
  const reconciliation = reconcileSource(source, stored, { lineageRows: lineage });
  const summary = summarize(source);
  const [extra] = await sql`select
    (select count(*)::int from public.po_lines where import_run_id = ${run.id} and ordered_qty is null) as "incompleteStored",
    (select count(*)::int from public.source_import_rows where run_id = ${run.id}) as "rawRows",
    (select count(*)::int from public.po_receipts r join public.po_lines l on l.id = r.line_id where l.import_run_id = ${run.id} and r.voided_at is null) as "activeReceipts"`;
  const result = {
    ok: reconciliation.ok && run.status === "reconciled" && Number(run.sourceCount) === source.sourceRowCount
      && Number(run.importedCount) === source.rows.length && extra.rawRows === source.rows.length
      && reconciliation.problems.length === 0,
    database: identity.database, runId: run.id, status: run.status,
    sheet: source.sheet, fileChecksum: source.fileChecksum,
    counts: {
      sourceRows: source.sourceRowCount, parsedRows: source.rows.length, storedRows: stored.length,
      rawRows: extra.rawRows, incompleteStored: extra.incompleteStored,
      anomalyRecords: source.anomalies.length, activeReceipts: extra.activeReceipts,
    },
    milestones: summary.milestones,
    units: reconciliation.expected,
    lineageChecked: reconciliation.lineageChecked,
    problems: reconciliation.problems,
    userEdits: reconciliation.edits,
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
} finally {
  await sql.end();
}
