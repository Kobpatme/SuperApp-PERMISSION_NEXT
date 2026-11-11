import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { aggregateSource, evaluateExistingImport, parsePoSource, reconcileSource, summarize } from "./po-tracking-import-core.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workbook = readFileSync(resolve(root, "ข้อมูล", "PO Pending Max.xlsx"));
const source = parsePoSource(workbook);
const storedRows = source.rows.map((row) => ({ ...row }));
/** Immutable lineage exactly as stored in public.source_import_rows. */
const lineageRows = source.rows.map((row) => ({ sourceId: row.sourceId, sourceChecksum: row.sourceChecksum }));

test("reads every source row from sheet PO 26-10-26 without dropping any", () => {
  assert.equal(source.sheet, "PO 26-10-26");
  assert.equal(source.sourceRowCount, 237);
  assert.equal(source.rows.length, 237);
  assert.deepEqual(source.errors, []);
  assert.equal(source.rows[0].sourceId, "PO 26-10-26!3");
  assert.equal(source.rows.at(-1).sourceId, "PO 26-10-26!239");
  assert.equal(new Set(source.rows.map((row) => row.sourceId)).size, 237);
  assert.equal(summarize(source).milestones.incompleteQuantityRows, 125);
  assert.equal(summarize(source).milestones.completeQuantityRows, 112);
});

test("keeps duplicate PO/material lines distinct instead of deduplicating", () => {
  const summary = summarize(source);
  assert.equal(summary.milestones.duplicateGroups, 24);
  assert.equal(summary.milestones.duplicateRows, 77);
  const group = source.rows.filter((row) => row.poNumber === "4032500121" && row.materialCode === "U02CFARSS-0012-BE0");
  assert.equal(group.length, 2);
  assert.deepEqual(group.map((row) => row.orderedQty), ["410000", "608000"]);
});

test("preserves raw values and never reads a missing quantity as zero", () => {
  const incomplete = source.rows.find((row) => row.sourceRowNumber === 115);
  assert.equal(incomplete.orderedQty, null);
  assert.equal(incomplete.initialReceivedQty, null);
  assert.equal(incomplete.sourceOutstandingQty, "0");
  const raw = source.rows.find((row) => row.sourceRowNumber === 7);
  assert.equal(raw.raw.cells["Unit Price"], "35.979999999999997");
  assert.equal(raw.unitPrice, "35.98");
  assert.equal(raw.poAmount, "1439200");
  const ea = aggregateSource(source.rows).find((unit) => unit.unit === "EA");
  assert.equal(ea.rows, 15);
  assert.equal(ea.completeRows, 0);
  assert.equal(ea.ordered, "0");
});

test("parses ETA dates and keeps ETA status text verbatim", () => {
  const serialRow = source.rows.find((row) => row.sourceRowNumber === 5);
  assert.equal(serialRow.etaDate, "2026-12-20");
  assert.equal(serialRow.etaText, null);
  const textRow = source.rows.find((row) => row.sourceRowNumber === 3);
  assert.equal(textRow.etaText, "พร้อมส่ง");
  assert.equal(textRow.etaDate, null);
  assert.equal(summarize(source).milestones.etaDatedRows, 5);
});

test("keeps dates and order codes verbatim in normalized form", () => {
  const first = source.rows[0];
  assert.equal(first.poReleaseDate, "2026-03-11");
  assert.equal(first.lastGrDate, "2026-08-07");
  assert.equal(first.orderCode, "HAM026");
  assert.equal(first.vendorCode, "1128119");
});

test("reconciles source counts and per-unit quantities against stored rows", () => {
  const reconciliation = reconcileSource(source, storedRows);
  assert.equal(reconciliation.ok, true, JSON.stringify(reconciliation.problems.slice(0, 3)));
  assert.deepEqual(reconciliation.problems, []);
  const units = Object.fromEntries(Object.values(reconciliation.actual).map((unit) => [unit.unit, unit]));
  assert.equal(units.M.ordered, "1206000.0000");
  assert.equal(units.PC.outstanding, "818.0000");
  assert.equal(units.SET.amount, "338800.00");

  const corrupted = storedRows.map((row) => row.sourceRowNumber === 3 ? { ...row, orderedQty: "1" } : row);
  const mismatch = reconcileSource(source, corrupted);
  assert.equal(mismatch.ok, false);
  assert.ok(mismatch.problems.some((problem) => problem.code === "FIELD_MISMATCH" && problem.field === "orderedQty"));

  const missing = reconcileSource(source, storedRows.slice(1));
  assert.equal(missing.ok, false);
  assert.ok(missing.problems.some((problem) => problem.code === "ROW_MISSING"));
});

test("rejects a changed source row number even when source ID is unchanged", () => {
  const tampered = storedRows.map((row, index) => index === 0 ? { ...row, sourceRowNumber: row.sourceRowNumber + 1 } : row);
  const result = reconcileSource(source, tampered, { lineageRows });
  assert.equal(result.ok, false);
  assert.ok(result.problems.some((problem) => problem.code === "FIELD_MISMATCH" && problem.field === "sourceRowNumber"));
});

test("treats identifiers as exact strings and never strips leading zeros", () => {
  const identifiers = ["vendorCode", "orderCode", "materialCode", "poNumber"];
  const target = storedRows.findIndex((row) => row.sourceRowNumber === 3);
  for (const field of identifiers) {
    const original = source.rows[target][field];
    const padded = `0${original}`;
    const tampered = storedRows.map((row, index) => index === target ? { ...row, [field]: padded } : row);
    const reconciliation = reconcileSource(source, tampered);
    assert.equal(reconciliation.ok, false, `${field} "0${original}" must not equal "${original}"`);
    assert.ok(reconciliation.problems.some((problem) => problem.code === "FIELD_MISMATCH" && problem.field === field),
      `${field} mismatch must be reported`);
  }
});

test("still reconciles numeric totals with different decimal scale", () => {
  const target = storedRows.findIndex((row) => row.sourceRowNumber === 3);
  const scaled = storedRows.map((row, index) => index === target
    ? { ...row, orderedQty: Number(row.orderedQty).toFixed(4), unitPrice: Number(row.unitPrice).toFixed(4) }
    : row);
  const reconciliation = reconcileSource(source, scaled);
  assert.equal(reconciliation.problems.filter((problem) => problem.code === "FIELD_MISMATCH").length, 0,
    JSON.stringify(reconciliation.problems.slice(0, 3)));
});

test("rejects a workbook whose sheet name does not exist", () => {
  assert.throws(() => parsePoSource(workbook, { sheetName: "missing-sheet" }), /XLSX_SHEET_NOT_FOUND/);
});

test("treats a user-corrected ETA as an edit, not as lineage corruption", () => {
  const edited = storedRows.map((row) => row.sourceRowNumber === 5
    ? { ...row, etaDate: "2027-01-15", etaText: null }
    : row.sourceRowNumber === 3 ? { ...row, etaDate: null, etaText: "เลื่อนส่ง" } : row);
  const reconciliation = reconcileSource(source, edited, { lineageRows });
  assert.equal(reconciliation.ok, true, JSON.stringify(reconciliation.problems.slice(0, 3)));
  assert.equal(reconciliation.lineageChecked, true);
  assert.deepEqual(reconciliation.problems, []);
  assert.deepEqual(reconciliation.edits.map((edit) => [edit.sourceId, edit.field, edit.stored]), [
    ["PO 26-10-26!3", "etaText", "เลื่อนส่ง"],
    ["PO 26-10-26!5", "etaDate", "2027-01-15"],
  ]);
});

test("does not compare mutable ETA with the live row when no lineage is supplied", () => {
  const edited = storedRows.map((row) => row.sourceRowNumber === 5 ? { ...row, etaDate: "2027-01-15" } : row);
  const reconciliation = reconcileSource(source, edited);
  assert.equal(reconciliation.ok, true, JSON.stringify(reconciliation.problems.slice(0, 3)));
  assert.equal(reconciliation.lineageChecked, false);
  assert.equal(reconciliation.edits.length, 1);
  assert.equal(reconciliation.edits[0].field, "etaDate");
});

test("fails when the stored import lineage no longer matches the workbook", () => {
  const tamperedLineage = lineageRows.map((row) => row.sourceId === "PO 26-10-26!7"
    ? { ...row, sourceChecksum: "0".repeat(64) } : row);
  const reconciliation = reconcileSource(source, storedRows, { lineageRows: tamperedLineage });
  assert.equal(reconciliation.ok, false);
  assert.ok(reconciliation.problems.some((problem) => problem.code === "LINEAGE_CHECKSUM_MISMATCH" && problem.sourceId === "PO 26-10-26!7"));
});

test("fails once per row when a lineage record is missing", () => {
  const reconciliation = reconcileSource(source, storedRows, { lineageRows: lineageRows.filter((row) => row.sourceId !== "PO 26-10-26!9") });
  assert.equal(reconciliation.ok, false);
  const missing = reconciliation.problems.filter((problem) => problem.code === "LINEAGE_ROW_MISSING");
  assert.deepEqual(missing.map((problem) => problem.sourceId), ["PO 26-10-26!9"]);
  assert.ok(reconciliation.problems.some((problem) => problem.code === "LINEAGE_ROW_COUNT"));
});

test("keeps immutable field corruption fatal even after a legitimate ETA edit", () => {
  const corrupted = storedRows.map((row) => row.sourceRowNumber === 5
    ? { ...row, etaDate: "2027-01-15", orderedQty: "1" } : row);
  const reconciliation = reconcileSource(source, corrupted, { lineageRows });
  assert.equal(reconciliation.ok, false);
  assert.ok(reconciliation.problems.some((problem) => problem.code === "FIELD_MISMATCH" && problem.field === "orderedQty"));
  assert.equal(reconciliation.edits.length, 1);
});

test("reuses an existing run only when counters, status and lineage agree", () => {
  const healthy = reconcileSource(source, storedRows, { lineageRows });
  assert.equal(evaluateExistingImport({ status: "reconciled", importedCount: 237 }, source, healthy).ok, true);

  const corrupted = storedRows.map((row) => row.sourceRowNumber === 5 ? { ...row, orderedQty: "1" } : row);
  const broken = reconcileSource(source, corrupted, { lineageRows });
  const refused = evaluateExistingImport({ status: "reconciled", importedCount: 237 }, source, broken);
  assert.equal(refused.ok, false);
  assert.ok(refused.problems.some((problem) => problem.code === "FIELD_MISMATCH"));

  const wrongCount = evaluateExistingImport({ status: "reconciled", importedCount: 236 }, source, healthy);
  assert.equal(wrongCount.ok, false);
  assert.ok(wrongCount.problems.some((problem) => problem.code === "RUN_COUNT_MISMATCH"));

  const wrongStatus = evaluateExistingImport({ status: "running", importedCount: 237 }, source, healthy);
  assert.equal(wrongStatus.ok, false);
  assert.ok(wrongStatus.problems.some((problem) => problem.code === "RUN_NOT_RECONCILED"));
});

test("refuses the already-imported path when lineage integrity fails", () => {
  const tamperedLineage = lineageRows.map((row) => row.sourceId === "PO 26-10-26!11"
    ? { ...row, sourceChecksum: "f".repeat(64) } : row);
  const broken = reconcileSource(source, storedRows, { lineageRows: tamperedLineage });
  const decision = evaluateExistingImport({ status: "reconciled", importedCount: 237 }, source, broken);
  assert.equal(decision.ok, false);
  assert.ok(decision.problems.some((problem) => problem.code === "LINEAGE_CHECKSUM_MISMATCH"));
});
