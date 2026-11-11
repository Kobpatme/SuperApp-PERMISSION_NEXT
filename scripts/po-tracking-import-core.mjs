// Pure parsing, validation and reconciliation for the PO Pending import.
// The CLI stays thin so tests can exercise every rule without a database.
import { createHash } from "node:crypto";
import Decimal from "decimal.js";
import { readWorkbook } from "./po-tracking-xlsx.mjs";

export const PO_SOURCE_SYSTEM = "po-pending-max";
export const PO_ENTITY_TYPE = "po_line";
export const PO_STAGING_DATABASE = "permission_superapp_staging_20261104_1157";
export const PO_HEADERS = [
  "Material", "Description", "BUn", "PO No.", "PO Rel.Date", "LastGRdate", "Stock", "Order QTY",
  "Actual GR", "Outstanding", "ETA", "Unit Price", "PO Amount", "Order", "Vendor", "Name",
];
export const PO_VALID_UNITS = ["M", "PC", "SET", "EA"];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const clean = (value) => String(value ?? "").replace(/\u00a0/g, " ").trim();

function parseDate(value, field, rowNumber) {
  const text = clean(value);
  if (!text) return null;
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(text);
  if (!match) throw new Error(`INVALID_DATE:${field}:row ${rowNumber}`);
  const [, day, month, year] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error(`INVALID_DATE:${field}:row ${rowNumber}`);
  }
  return date.toISOString().slice(0, 10);
}

function parseQuantity(value, field, rowNumber, { required = false, scale = 4 } = {}) {
  const text = clean(value).replaceAll(",", "");
  if (!text) {
    if (required) throw new Error(`MISSING_NUMBER:${field}:row ${rowNumber}`);
    return null;
  }
  if (!/^\d+(?:\.\d+)?$/.test(text)) throw new Error(`INVALID_NUMBER:${field}:row ${rowNumber}`);
  return new Decimal(text).toDecimalPlaces(scale, Decimal.ROUND_HALF_UP).toFixed(scale).replace(/\.?0+$/, "") || "0";
}

function parseEta(value, rowNumber) {
  const text = clean(value);
  if (!text) return { etaDate: null, etaText: null };
  if (/^\d{5}$/.test(text)) {
    const serial = Number(text);
    if (serial < 20000 || serial > 80000) throw new Error(`INVALID_ETA:row ${rowNumber}`);
    const date = new Date(Date.UTC(1899, 11, 30) + serial * 86_400_000);
    return { etaDate: date.toISOString().slice(0, 10), etaText: null };
  }
  return { etaDate: null, etaText: text };
}

export function parsePoSource(buffer, { sheetName = "PO 26-10-26" } = {}) {
  const workbook = readWorkbook(buffer, sheetName);
  const headerRow = workbook.rows.find((row) => row.number === 2);
  if (!headerRow) throw new Error("XLSX_HEADER_ROW_MISSING");
  const headers = PO_HEADERS.map((_, index) => clean(headerRow.cells[index + 1]));
  if (headers.length !== PO_HEADERS.length || headers.some((header, index) => header !== PO_HEADERS[index])) {
    throw new Error(`XLSX_HEADERS_UNEXPECTED:${headers.join("|")}`);
  }
  const dataRows = workbook.rows.filter((row) => row.number >= 3 && Object.values(row.cells).some((value) => clean(value) !== ""));
  const rows = [];
  const errors = [];
  const anomalies = [];
  const duplicateGroups = new Map();

  for (const row of dataRows) {
    const at = (index) => clean(row.cells[index + 1]);
    try {
      const materialCode = at(0);
      const description = at(1);
      const unit = at(2);
      const poNumber = at(3);
      if (!materialCode) throw new Error(`MISSING_VALUE:Material:row ${row.number}`);
      if (!description) throw new Error(`MISSING_VALUE:Description:row ${row.number}`);
      if (!poNumber) throw new Error(`MISSING_VALUE:PO No.:row ${row.number}`);
      if (!PO_VALID_UNITS.includes(unit)) throw new Error(`INVALID_UNIT:${unit}:row ${row.number}`);
      const orderedQty = parseQuantity(at(7), "Order QTY", row.number);
      const initialReceivedQty = parseQuantity(at(8), "Actual GR", row.number);
      const poAmount = parseQuantity(at(12), "PO Amount", row.number, { scale: 2 });
      const stockQty = parseQuantity(at(6), "Stock", row.number);
      const sourceOutstandingQty = parseQuantity(at(9), "Outstanding", row.number);
      const unitPrice = parseQuantity(at(11), "Unit Price", row.number);
      const { etaDate, etaText } = parseEta(at(10), row.number);
      const poReleaseDate = parseDate(at(4), "PO Rel.Date", row.number);
      if (!poReleaseDate) throw new Error(`MISSING_DATE:PO Rel.Date:row ${row.number}`);
      const lastGrDate = parseDate(at(5), "LastGRdate", row.number);
      const parsed = {
        sourceId: `${workbook.name}!${row.number}`,
        sourceRowNumber: row.number,
        materialCode, description, unit, poNumber,
        orderedQty, initialReceivedQty, unitPrice, poAmount, stockQty, sourceOutstandingQty,
        poReleaseDate, lastGrDate, etaDate, etaText,
        orderCode: at(13) || null, vendorCode: at(14) || null, vendorName: at(15) || null,
        raw: {
          sheet: workbook.name, rowNumber: row.number,
          cells: Object.fromEntries(PO_HEADERS.map((header, index) => [header, row.cells[index + 1] ?? ""])),
        },
      };
      parsed.sourceChecksum = sha256(JSON.stringify(parsed.raw.cells));
      rows.push(parsed);

      if (parsed.orderedQty === null || parsed.initialReceivedQty === null) {
        anomalies.push({ code: "INCOMPLETE_QUANTITY", row: row.number, sourceId: parsed.sourceId });
      }
      if (parsed.sourceOutstandingQty !== null && (parsed.orderedQty === null || parsed.initialReceivedQty === null)) {
        anomalies.push({ code: "OUTSTANDING_WITHOUT_QUANTITY", row: row.number, sourceId: parsed.sourceId, value: parsed.sourceOutstandingQty });
      }
      if (parsed.etaText) anomalies.push({ code: "ETA_STATUS_TEXT", row: row.number, sourceId: parsed.sourceId, value: parsed.etaText });
      if (parsed.orderedQty !== null && parsed.initialReceivedQty !== null && parsed.poAmount !== null && parsed.unitPrice !== null) {
        const expected = new Decimal(parsed.orderedQty).times(parsed.unitPrice);
        if (expected.minus(parsed.poAmount).abs().gt("0.01")) {
          anomalies.push({ code: "AMOUNT_MISMATCH", row: row.number, sourceId: parsed.sourceId, expected: expected.toFixed(2), source: parsed.poAmount });
        }
      }
      const groupKey = `${poNumber}|${materialCode}`;
      duplicateGroups.set(groupKey, [...(duplicateGroups.get(groupKey) ?? []), row.number]);
      if (parsed.orderedQty !== null && parsed.sourceOutstandingQty !== null && parsed.initialReceivedQty !== null) {
        const derived = new Decimal(parsed.orderedQty).minus(parsed.initialReceivedQty);
        if (!derived.eq(parsed.sourceOutstandingQty)) {
          anomalies.push({ code: "OUTSTANDING_MISMATCH", row: row.number, sourceId: parsed.sourceId, derived: derived.toFixed(4), source: parsed.sourceOutstandingQty });
        }
      }
    } catch (error) {
      errors.push({ row: row.number, error: error instanceof Error ? error.message : String(error) });
    }
  }

  for (const [groupKey, rowNumbers] of duplicateGroups) {
    if (rowNumbers.length > 1) anomalies.push({ code: "DUPLICATE_PO_MATERIAL", group: groupKey, rows: rowNumbers });
  }
  if (rows.length !== dataRows.length) {
    errors.push({ row: 0, error: `ROW_COUNT_MISMATCH:expected ${dataRows.length}, parsed ${rows.length}` });
  }
  return {
    sheet: workbook.name,
    fileChecksum: sha256(buffer),
    sourceRowCount: dataRows.length,
    rows, errors, anomalies,
  };
}

/** Aggregate only rows with a complete quantity; never treat blanks as zero. */
export function aggregateSource(rows) {
  const byUnit = {};
  for (const unit of PO_VALID_UNITS) byUnit[unit] = { unit, rows: 0, completeRows: 0, ordered: "0", initialReceived: "0", outstanding: "0", amount: "0" };
  for (const row of rows) {
    const bucket = byUnit[row.unit];
    bucket.rows += 1;
    if (row.orderedQty === null || row.initialReceivedQty === null) continue;
    bucket.completeRows += 1;
    bucket.ordered = new Decimal(bucket.ordered).plus(row.orderedQty).toFixed(4);
    bucket.initialReceived = new Decimal(bucket.initialReceived).plus(row.initialReceivedQty).toFixed(4);
    bucket.outstanding = new Decimal(bucket.outstanding).plus(new Decimal(row.orderedQty).minus(row.initialReceivedQty)).toFixed(4);
    if (row.poAmount !== null) bucket.amount = new Decimal(bucket.amount).plus(row.poAmount).toFixed(2);
  }
  return Object.values(byUnit);
}

// Columns copied from the workbook at import time and never editable in place.
// Requirement: reconciliation compares only these against the live line.
export const immutableCompareFields = [
  "sourceRowNumber", "materialCode", "description", "unit", "poNumber", "orderedQty", "initialReceivedQty", "unitPrice",
  "poAmount", "stockQty", "sourceOutstandingQty", "poReleaseDate", "lastGrDate",
  "orderCode", "vendorCode", "vendorName",
];
// ETA is deliberately mutable (users correct it as the vendor updates). It must
// be compared with the immutable import lineage, never with the live row.
export const mutableCompareFields = ["etaDate", "etaText"];

// Only measured quantities and money are compared numerically. Identifiers
// (PO number, material, order and vendor codes) are exact strings: normalizing
// them as numbers silently equates "01128119" with "1128119" and loses the
// leading zero that distinguishes a real vendor/material code.
export const numericCompareFields = new Set([
  "orderedQty", "initialReceivedQty", "unitPrice", "poAmount", "stockQty", "sourceOutstandingQty",
]);

function normalized(field, value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (text === "") return null;
  if (numericCompareFields.has(field) && /^-?\d+(?:\.\d+)?$/.test(text)) {
    return new Decimal(text).toFixed(4).replace(/\.?0+$/, "") || "0";
  }
  return text;
}

/**
 * Compare every parsed row with the stored line, including per-unit totals.
 *
 * `lineageRows` (from `source_import_rows`) carries the immutable import
 * lineage: `{ sourceId, sourceChecksum }`. When supplied, the ETA lineage is
 * verified against the workbook and any difference between the lineage ETA and
 * the live `po_lines` ETA is reported as a user edit instead of a failure.
 * Without lineage, mutable fields are never treated as corruption because the
 * database allows users to change them.
 */
export function reconcileSource(source, storedRows, { lineageRows = null } = {}) {
  const storedById = new Map(storedRows.map((row) => [row.sourceId, row]));
  const lineageById = lineageRows ? new Map(lineageRows.map((row) => [row.sourceId, row])) : null;
  const problems = [];
  const edits = [];
  const lineageReported = new Set();
  const reportMissingLineage = (sourceId) => {
    if (lineageReported.has(sourceId)) return;
    lineageReported.add(sourceId);
    problems.push({ code: "LINEAGE_ROW_MISSING", sourceId });
  };
  for (const row of source.rows) {
    const stored = storedById.get(row.sourceId);
    if (!stored) { problems.push({ code: "ROW_MISSING", sourceId: row.sourceId }); continue; }
    for (const field of immutableCompareFields) {
      if (normalized(field, row[field]) !== normalized(field, stored[field])) {
        problems.push({ code: "FIELD_MISMATCH", sourceId: row.sourceId, field, source: row[field], stored: stored[field] });
      }
    }
    for (const field of mutableCompareFields) {
      if (normalized(field, row[field]) === normalized(field, stored[field])) continue;
      if (lineageById) {
        const lineage = lineageById.get(row.sourceId);
        if (!lineage) { reportMissingLineage(row.sourceId); continue; }
        if (lineage[field] !== undefined && normalized(field, lineage[field]) !== normalized(field, row[field])) {
          problems.push({ code: "LINEAGE_MISMATCH", sourceId: row.sourceId, field, source: row[field], lineage: lineage[field] ?? null });
          continue;
        }
      }
      edits.push({ code: "USER_EDIT", sourceId: row.sourceId, field, source: row[field], stored: stored[field] });
    }
  }
  if (lineageById) {
    for (const row of source.rows) {
      const lineage = lineageById.get(row.sourceId);
      if (!lineage) { reportMissingLineage(row.sourceId); continue; }
      if (lineage.sourceChecksum !== row.sourceChecksum) {
        problems.push({ code: "LINEAGE_CHECKSUM_MISMATCH", sourceId: row.sourceId, source: row.sourceChecksum, lineage: lineage.sourceChecksum });
      }
    }
    if (lineageRows.length !== source.rows.length) {
      problems.push({ code: "LINEAGE_ROW_COUNT", source: source.rows.length, lineage: lineageRows.length });
    }
  }
  const expected = aggregateSource(source.rows);
  const actual = aggregateStored(storedRows);
  for (const unit of expected) {
    const stored = actual[unit.unit];
    for (const key of ["rows", "ordered", "initialReceived", "outstanding", "amount"]) {
      if (key === "rows") { if (unit.rows !== stored.rows) problems.push({ code: "UNIT_ROW_COUNT", unit: unit.unit, source: unit.rows, stored: stored.rows }); continue; }
      if (!new Decimal(unit[key]).eq(stored[key])) problems.push({ code: "UNIT_TOTAL", unit: unit.unit, field: key, source: unit[key], stored: stored[key] });
    }
  }
  return {
    ok: problems.length === 0 && storedRows.length === source.rows.length,
    sourceRows: source.rows.length,
    storedRows: storedRows.length,
    lineageChecked: Boolean(lineageById),
    problems,
    edits,
    expected, actual,
  };
}

/**
 * Decide whether an existing run may be reused as "already imported".
 * A matching checksum alone is not enough: counters, run status and the stored
 * lineage must all agree, otherwise a corrupted run would look successful.
 */
export function evaluateExistingImport({ status, importedCount }, source, reconciliation) {
  const problems = [...reconciliation.problems];
  if (status !== "reconciled") problems.push({ code: "RUN_NOT_RECONCILED", status });
  if (Number(importedCount) !== source.rows.length) {
    problems.push({ code: "RUN_COUNT_MISMATCH", importedCount: Number(importedCount), expected: source.rows.length });
  }
  if (reconciliation.storedRows !== source.rows.length) {
    problems.push({ code: "STORED_COUNT_MISMATCH", storedRows: reconciliation.storedRows, expected: source.rows.length });
  }
  return { ok: reconciliation.ok && problems.length === 0, problems, edits: reconciliation.edits };
}

function aggregateStored(rows) {
  const byUnit = {};
  for (const unit of PO_VALID_UNITS) byUnit[unit] = { unit, rows: 0, ordered: "0", initialReceived: "0", outstanding: "0", amount: "0" };
  for (const row of rows) {
    const bucket = byUnit[row.unit];
    bucket.rows += 1;
    if (row.orderedQty === null || row.initialReceivedQty === null) continue;
    bucket.ordered = new Decimal(bucket.ordered).plus(row.orderedQty).toFixed(4);
    bucket.initialReceived = new Decimal(bucket.initialReceived).plus(row.initialReceivedQty).toFixed(4);
    bucket.outstanding = new Decimal(bucket.outstanding).plus(new Decimal(row.orderedQty).minus(row.initialReceivedQty)).toFixed(4);
    if (row.poAmount !== null) bucket.amount = new Decimal(bucket.amount).plus(row.poAmount).toFixed(2);
  }
  return byUnit;
}

export function summarize(source) {
  return {
    sheet: source.sheet,
    fileChecksum: source.fileChecksum,
    sourceRows: source.sourceRowCount,
    parsedRows: source.rows.length,
    errors: source.errors,
    anomalies: source.anomalies,
    anomalousRows: new Set(source.anomalies.filter((item) => item.row).map((item) => item.row)).size,
    units: aggregateSource(source.rows),
    milestones: {
      completeQuantityRows: source.rows.filter((row) => row.orderedQty !== null && row.initialReceivedQty !== null).length,
      incompleteQuantityRows: source.rows.filter((row) => row.orderedQty === null || row.initialReceivedQty === null).length,
      duplicateGroups: source.anomalies.filter((item) => item.code === "DUPLICATE_PO_MATERIAL").length,
      duplicateRows: source.anomalies.filter((item) => item.code === "DUPLICATE_PO_MATERIAL").reduce((total, item) => total + item.rows.length, 0),
      etaDatedRows: source.rows.filter((row) => row.etaDate).length,
      etaTextRows: source.rows.filter((row) => row.etaText).length,
      distinctPurchaseOrders: new Set(source.rows.map((row) => row.poNumber)).size,
    },
  };
}
