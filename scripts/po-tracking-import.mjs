import { config } from "dotenv";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";
import postgres from "postgres";
import { databaseSslOptions } from "../src/lib/database-ssl.mjs";
import {
  PO_ENTITY_TYPE, PO_SOURCE_SYSTEM, PO_STAGING_DATABASE, evaluateExistingImport,
  parsePoSource, reconcileSource, summarize,
} from "./po-tracking-import-core.mjs";

config({ path: ".env.local" });
config();

const { values } = parseArgs({ options: {
  file: { type: "string", default: "ข้อมูล/PO Pending Max.xlsx" },
  sheet: { type: "string", default: "PO 26-10-26" },
  "dry-run": { type: "boolean", default: false },
  report: { type: "string" },
} });

const fail = (message, code = 1) => { process.stderr.write(`${message}\n`); process.exit(code); };
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) fail("DATABASE_URL is required");

async function assertStagingTarget(sql) {
  const [identity] = await sql`select current_database() as database, current_user as "user"`;
  if (identity.database !== PO_STAGING_DATABASE) fail(`REFUSED: target database is ${identity.database}, expected ${PO_STAGING_DATABASE}`);
  if (!String(identity.user).startsWith("permission_")) fail(`REFUSED: unexpected runtime role ${identity.user}`);
  const [table] = await sql`select to_regclass('public.po_lines') as table`;
  if (!table?.table) fail("REFUSED: po_lines does not exist; apply migration 0063 to staging first");
  return identity;
}

const buffer = await readFile(resolve(values.file));
const source = parsePoSource(buffer, { sheetName: values.sheet });
const summary = summarize(source);
if (source.errors.length) {
  console.log(JSON.stringify({ ok: false, phase: "validation", errors: source.errors }, null, 2));
  fail(`Validation failed for ${source.errors.length} row(s); nothing was written.`);
}
if (values["dry-run"]) {
  const result = {
    ok: true, mode: "dry-run", database: PO_STAGING_DATABASE, ...summary,
    anomalies: {
      total: source.anomalies.length,
      byCode: countByCode(source.anomalies),
      duplicateGroups: source.anomalies.filter((item) => item.code === "DUPLICATE_PO_MATERIAL"),
      withoutQuantity: source.anomalies.filter((item) => item.code === "OUTSTANDING_WITHOUT_QUANTITY"),
    },
  };
  console.log(JSON.stringify(result, null, 2));
  if (values.report) { await mkdir(dirname(resolve(values.report)), { recursive: true }); await writeFile(values.report, JSON.stringify(result, null, 2)); }
  process.exit(0);
}

const client = postgres(databaseUrl, { ...databaseSslOptions(), max: 1, prepare: false });
let runId;
let outcome = "imported";
try {
  const identity = await assertStagingTarget(client);
  const [existing] = await client`select id, status, imported_count as "importedCount" from public.source_import_runs
    where source_system = ${PO_SOURCE_SYSTEM} and entity_type = ${PO_ENTITY_TYPE} and source_snapshot = ${source.fileChecksum}`;
  if (existing) {
    // A matching checksum is not proof of a good import: verify counters, the
    // immutable lineage and the stored rows before reusing this run.
    const [storedRows, lineageRows] = await Promise.all([
      loadStoredRows(client, existing.id),
      loadLineageRows(client, existing.id),
    ]);
    const reconciliation = reconcileSource(source, storedRows, { lineageRows });
    const decision = evaluateExistingImport({ status: existing.status, importedCount: existing.importedCount }, source, reconciliation);
    if (!decision.ok) {
      fail(`REFUSED: an import run for this exact file exists (${existing.id}, status ${existing.status}) but does not reconcile.\n${JSON.stringify(decision.problems.slice(0, 10), null, 2)}`, 2);
    }
    runId = existing.id;
    outcome = "already-imported";
  } else {
    runId = randomUUID();
    await client.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(hashtext('po-tracking-import'))`;
      await tx`insert into public.source_import_runs
        (id, source_system, entity_type, source_snapshot, status, source_count, imported_count, anomaly_count, checksum, started_at)
        values (${runId}, ${PO_SOURCE_SYSTEM}, ${PO_ENTITY_TYPE}, ${source.fileChecksum}, 'running', ${source.sourceRowCount}, 0, ${source.anomalies.length}, ${source.fileChecksum}, now())`;
      for (const row of source.rows) {
        const lineId = randomUUID();
        await tx`insert into public.po_lines
          (id, import_run_id, source_id, source_row_number, po_number, material_code, description, unit,
           ordered_qty, initial_received_qty, unit_price, po_amount, stock_qty, source_outstanding_qty,
           po_release_date, last_gr_date, eta_date, eta_text, order_code, vendor_code, vendor_name)
          values (${lineId}, ${runId}, ${row.sourceId}, ${row.sourceRowNumber}, ${row.poNumber}, ${row.materialCode}, ${row.description}, ${row.unit},
           ${row.orderedQty}, ${row.initialReceivedQty}, ${row.unitPrice}, ${row.poAmount}, ${row.stockQty}, ${row.sourceOutstandingQty},
           ${row.poReleaseDate}, ${row.lastGrDate}, ${row.etaDate}, ${row.etaText}, ${row.orderCode}, ${row.vendorCode}, ${row.vendorName})`;
        await tx`insert into public.source_import_rows
          (run_id, source_id, source_checksum, status, target_entity_type, target_entity_id, raw_payload)
          values (${runId}, ${row.sourceId}, ${row.sourceChecksum}, 'imported', 'po_line', ${lineId}, ${tx.json(row.raw)})`;
      }
      const stored = await loadStoredRows(tx, runId);
      const reconciliation = reconcileSource(source, stored);
      if (!reconciliation.ok) {
        throw new Error(`RECONCILIATION_FAILED:${JSON.stringify(reconciliation.problems.slice(0, 5))}`);
      }
      await tx`update public.source_import_runs set status = 'reconciled', imported_count = ${source.rows.length}, finished_at = now() where id = ${runId}`;
    });
  }

  const verification = await verify(client, runId, source);
  const report = {
    ok: verification.ok, mode: outcome, database: identity.database, runId,
    sheet: source.sheet, fileChecksum: source.fileChecksum,
    sourceRows: source.sourceRowCount, importedRows: verification.storedRows,
    milestones: summary.milestones,
    anomalies: { total: source.anomalies.length, byCode: countByCode(source.anomalies), rows: source.anomalies },
    units: summary.units,
    userEdits: verification.edits,
    verification,
  };
  console.log(JSON.stringify({ ...report, anomalies: { ...report.anomalies, rows: undefined } }, null, 2));
  if (values.report) {
    await mkdir(dirname(resolve(values.report)), { recursive: true });
    await writeFile(values.report, JSON.stringify(report, null, 2));
    console.log(`Report written: ${resolve(values.report)}`);
  }
  if (!verification.ok) fail("Post-import verification failed", 2);
} catch (error) {
  process.stderr.write(`Import failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
} finally {
  await client.end();
}

function countByCode(anomalies) {
  return anomalies.reduce((counts, item) => ({ ...counts, [item.code]: (counts[item.code] ?? 0) + 1 }), {});
}

async function verify(sql, id, parsed) {
  const [storedRows, lineageRows] = await Promise.all([loadStoredRows(sql, id), loadLineageRows(sql, id)]);
  const reconciliation = reconcileSource(parsed, storedRows, { lineageRows });
  const [counts] = await sql`select
    (select count(*)::int from public.source_import_rows where run_id = ${id} and target_entity_id is null) as "orphanRows",
    (select count(*)::int from public.po_lines l where import_run_id = ${id}
      and not exists (select 1 from public.source_import_rows r where r.run_id = l.import_run_id and r.target_entity_id = l.id)) as "linesWithoutRaw"`;
  const [run] = await sql`select status, source_count as "sourceCount", imported_count as "importedCount", anomaly_count as "anomalyCount"
    from public.source_import_runs where id = ${id}`;
  return {
    ok: reconciliation.ok && counts.orphanRows === 0 && counts.linesWithoutRaw === 0
      && run.status === "reconciled" && Number(run.sourceCount) === parsed.sourceRowCount && Number(run.importedCount) === parsed.rows.length,
    storedRows: storedRows.length, rawRows: lineageRows.length, orphanRows: counts.orphanRows,
    linesWithoutRaw: counts.linesWithoutRaw, runStatus: run.status,
    lineageChecked: reconciliation.lineageChecked, problems: reconciliation.problems, edits: reconciliation.edits,
    units: reconciliation.expected,
  };
}

async function loadStoredRows(sql, runId) {
  return sql`select source_id as "sourceId", source_row_number as "sourceRowNumber", material_code as "materialCode", description, unit,
    po_number as "poNumber", ordered_qty as "orderedQty", initial_received_qty as "initialReceivedQty",
    unit_price as "unitPrice", po_amount as "poAmount", stock_qty as "stockQty", source_outstanding_qty as "sourceOutstandingQty",
    po_release_date::text as "poReleaseDate", last_gr_date::text as "lastGrDate", eta_date::text as "etaDate",
    eta_text as "etaText", order_code as "orderCode", vendor_code as "vendorCode", vendor_name as "vendorName"
    from public.po_lines where import_run_id = ${runId} order by source_row_number`;
}

/** Immutable import lineage: the workbook payload digest captured at import time. */
async function loadLineageRows(sql, runId) {
  return sql`select source_id as "sourceId", source_checksum as "sourceChecksum"
    from public.source_import_rows where run_id = ${runId} order by source_id`;
}
