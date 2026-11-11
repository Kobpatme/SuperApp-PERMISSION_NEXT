import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readWorkbook } from "../../../scripts/po-tracking-xlsx.mjs";
import { excelHeaders, findExcelHeaders, parseExcelRows, planExcelRows, type ExistingExcelLine } from "./excel-domain";
import { excelTestRow, makePoWorkbook } from "../../../tests/fixtures/po-excel";

function parsed(overrides: Record<string, string> = {}) {
  return parseExcelRows(readWorkbook(makePoWorkbook([{ ...excelTestRow(), ...overrides }])).rows).rows[0];
}
function existing(): ExistingExcelLine {
  return { ...parsed(), id: "id-1", version: 1, status: "open", receiptQty: "0", note: "หมายเหตุจากผู้ใช้" };
}
describe("Excel PO parsing and duplicate planning", () => {
  it("reads the real reference workbook with binary-decimal precision normalized", () => {
    const source = parseExcelRows(readWorkbook(readFileSync("ข้อมูล/PO Pending Max.xlsx")).rows);
    expect(source.total).toBe(237);
    expect(source.errors).toEqual([]);
    expect(source.rows).toHaveLength(237);
    expect(source.rows.find(r => r.row === 7)?.unitPrice).toBe("35.9800");
  });
  it("maps shuffled headers, extra columns and an optional note without losing identifiers", () => {
    const headers = [...excelHeaders].reverse().concat() as string[];
    headers.push("Note", "extra");
    const result = parseExcelRows(readWorkbook(makePoWorkbook([{ ...excelTestRow(), Note: "ติดตามใหม่" }], headers)).rows);
    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toMatchObject({ vendorCode: "00112", note: "ติดตามใหม่", materialCode: "MAT-001" });
  });
  it("rejects missing or duplicate header names", () => {
    expect(() => findExcelHeaders([{ number: 1, cells: { 1: "Material" } }])).toThrow("หัวตาราง");
    const cells = Object.fromEntries([...excelHeaders, "Material"].map((h, i) => [i + 1, h]));
    expect(() => findExcelHeaders([{ number: 1, cells }])).toThrow("ซ้ำ");
  });
  it("reports invalid date, negative quantity and missing price without inventing zeros", () => {
    for (const override of [{ "PO Rel.Date": "31.02.2026" }, { "Order QTY": "-1" }, { "Unit Price": "-2" }] as Record<string, string>[]) {
      expect(parseExcelRows(readWorkbook(makePoWorkbook([{ ...excelTestRow(), ...override }])).rows).errors).toHaveLength(1);
    }
    expect(parsed({ "Order QTY": "" }).orderedQty).toBeNull();
    expect(parsed({ "Unit Price": "" }).unitPrice).toBeNull();
    expect(parsed({ "Unit Price": "0" }).unitPrice).toBe("0.0000");
    expect(parsed({ ETA: "46376" }).etaDate).toMatch(/^2026-/);
  });
  it("separates new, unchanged and explicit ETA/note updates", () => {
    expect(planExcelRows([parsed()], [])[0].kind).toBe("new");
    expect(planExcelRows([parsed()], [existing()])[0].kind).toBe("unchanged");
    const update = planExcelRows([{ ...parsed(), etaText: "รอยืนยัน", note: "ติดตามแล้ว" }], [existing()])[0];
    expect(update.kind).toBe("update");
    expect(update.changes.map(c => c.field)).toEqual(["etaText", "note"]);
  });
  it("blocks financial and identity conflicts and preserves leading-zero identifiers", () => {
    for (const override of [{ unitPrice: "36" }, { orderedQty: "20" }, { vendorCode: "112" }, { unit: "EA" as const }]) {
      expect(planExcelRows([{ ...parsed(), ...override }], [existing()])[0].kind).toBe("conflict");
    }
  });
  it("never chooses an arbitrary duplicate in the file or database", () => {
    expect(planExcelRows([parsed(), { ...parsed(), row: 3 }], [])[0].kind).toBe("duplicate");
    expect(planExcelRows([parsed()], [existing(), { ...existing(), id: "id-2" }])[0].kind).toBe("ambiguous");
  });
  it("compares Actual GR with cumulative receipts without overwriting the receipt baseline", () => {
    const current = { ...existing(), initialReceivedQty: "2", receiptQty: "3" };
    expect(planExcelRows([parsed({ "Actual GR": "5" })], [current])[0].kind).toBe("unchanged");
    expect(planExcelRows([parsed({ "Actual GR": "2" })], [current])[0].kind).toBe("conflict");
  });
  it("limits malformed uploads and compressed archive expansion", () => {
    expect(() => readWorkbook(Buffer.alloc(512 * 1024 + 1))).toThrow("TOO_LARGE");
    expect(() => readWorkbook(Buffer.from("invalid"))).toThrow();
  });
});
