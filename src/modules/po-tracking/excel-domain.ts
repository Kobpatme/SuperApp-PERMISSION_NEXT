import Decimal from "decimal.js";
import { z } from "zod";

export const excelHeaders = ["Material", "Description", "BUn", "PO No.", "PO Rel.Date", "LastGRdate", "Stock", "Order QTY", "Actual GR", "Outstanding", "ETA", "Unit Price", "PO Amount", "Project code", "Vendor", "Name"] as const;
const normalizeHeader = (s: string) => {
  const name = s.trim().replace(/\s+/g, " ").toLowerCase();
  return name === "order" ? "project code" : name;
};
export type ExcelCells = Record<number, string>;
export function findExcelHeaders(rows: { number: number; cells: ExcelCells }[]) {
  for (const row of rows.slice(0, 20)) {
    const columns = new Map<string, number>();
    let duplicate = false;
    for (const [col, text] of Object.entries(row.cells)) {
      const name = normalizeHeader(text);
      if (columns.has(name) && excelHeaders.some(h => normalizeHeader(h) === name)) duplicate = true;
      columns.set(name, Number(col));
    }
    if (excelHeaders.every(h => columns.has(normalizeHeader(h)))) {
      if (duplicate) throw new Error("หัวตารางมีชื่อคอลัมน์ซ้ำ กรุณาแก้ไขไฟล์");
      return { row: row.number, columns };
    }
  }
  throw new Error(`ไม่พบหัวตารางที่ครบถ้วน ต้องมี: ${excelHeaders.join(", ")}`);
}
const optionalText = (max: number) => z.string().max(max).nullable();
const numeric = (scale: number) => z.string().regex(new RegExp(`^\\d{1,14}(?:\\.\\d{1,${scale}})?$`), "ตัวเลขไม่ถูกต้องหรือทศนิยมเกินกำหนด");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => { const d = new Date(`${s}T00:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s; }, "วันที่ไม่ถูกต้อง");
export const excelRowSchema = z.object({
  row: z.number().int().positive(), poNumber: z.string().min(1).max(40), materialCode: z.string().min(1).max(80),
  description: z.string().min(1).max(500), unit: z.enum(["M", "PC", "SET", "EA"]),
  orderedQty: numeric(4).nullable(), initialReceivedQty: numeric(4).nullable(), unitPrice: numeric(4).nullable(),
  poAmount: numeric(2).nullable(), stockQty: numeric(4).nullable(), sourceOutstandingQty: numeric(4).nullable(),
  poReleaseDate: date, lastGrDate: date.nullable(), etaDate: date.nullable(), etaText: optionalText(200),
  orderCode: optionalText(60), vendorCode: optionalText(60), vendorName: optionalText(300), note: optionalText(2000),
}).refine(r => r.orderedQty === null || r.initialReceivedQty === null || new Decimal(r.initialReceivedQty).lte(r.orderedQty), "ยอดรับในไฟล์เกินจำนวนสั่ง");
export type ExcelPoRow = z.infer<typeof excelRowSchema>;

function parseDate(text: string): string | null {
  if (!text) return null;
  if (/^\d{5}(?:\.0+)?$/.test(text)) {
    const d = new Date(Date.UTC(1899, 11, 30) + Number(text) * 86400000);
    return d.toISOString().slice(0, 10);
  }
  const m = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(text);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : text;
}
export function parseExcelRows(rows: { number: number; cells: ExcelCells }[]) {
  const header = findExcelHeaders(rows);
  const data = rows.filter(r => r.number > header.row && Object.values(r.cells).some(s => s.trim()));
  if (!data.length || data.length > 1000) throw new Error("ไฟล์ต้องมีข้อมูล 1–1,000 แถว");
  const errors: { row: number; message: string }[] = [];
  const parsed: ExcelPoRow[] = [];
  for (const row of data) {
    const get = (name: string) => (row.cells[header.columns.get(normalizeHeader(name))!] ?? "").trim();
    const num = (name: string) => {
      const text = get(name).replaceAll(",", "");
      if (!text) return null;
      // Excel stores numbers in binary; use the same persisted precision as
      // the existing importer (four decimals for quantity/price, two for amount).
      if (!/^\d+(?:\.\d+)?$/.test(text)) return text;
      return new Decimal(text).toFixed(name === "PO Amount" ? 2 : 4);
    };
    const eta = get("ETA");
    const etaDate = /^\d{5}(?:\.0+)?$|^\d{4}-\d{2}-\d{2}$|^\d{1,2}[./]\d{1,2}[./]\d{4}$/.test(eta) ? parseDate(eta) : null;
    const result = excelRowSchema.safeParse({ row: row.number, poNumber: get("PO No."), materialCode: get("Material"), description: get("Description"), unit: get("BUn").toUpperCase(),
      orderedQty: num("Order QTY"), initialReceivedQty: num("Actual GR"), unitPrice: num("Unit Price"), poAmount: num("PO Amount"), stockQty: num("Stock"), sourceOutstandingQty: num("Outstanding"),
      poReleaseDate: parseDate(get("PO Rel.Date")), lastGrDate: parseDate(get("LastGRdate")), etaDate, etaText: etaDate ? null : eta || null,
      orderCode: get("Project code") || null, vendorCode: get("Vendor") || null, vendorName: get("Name") || null,
      note: header.columns.has(normalizeHeader("หมายเหตุ")) ? get("หมายเหตุ") || null : header.columns.has("note") ? get("Note") || null : null,
    });
    if (result.success) parsed.push(result.data);
    else errors.push({ row: row.number, message: result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ") });
  }
  return { rows: parsed, errors, headerRow: header.row, total: data.length };
}

export type ExistingExcelLine = Omit<ExcelPoRow, "row" | "note"> & { id: string; version: number; note: string; status: string; receiptQty: string };
export type ExcelChange = { field: string; before: string | null; after: string | null };
export type ExcelDecision = { row: ExcelPoRow; kind: "new" | "update" | "unchanged" | "conflict" | "ambiguous" | "duplicate"; targetId?: string; version?: number; changes: ExcelChange[]; message: string };
export const excelFieldLabels: Record<string, string> = { description: "รายละเอียด", unit: "หน่วยนับ", orderedQty: "จำนวนสั่ง", initialReceivedQty: "ยอดรับ", unitPrice: "ราคาต่อหน่วย", poAmount: "มูลค่า PO", stockQty: "Stock", sourceOutstandingQty: "ยอดคงค้างจากไฟล์", poReleaseDate: "วันที่ออก PO", lastGrDate: "วันที่ GR ล่าสุด", orderCode: "Project code", vendorCode: "รหัสผู้ขาย", vendorName: "ชื่อผู้ขาย", etaDate: "วันที่ ETA", etaText: "ข้อความ ETA", note: "หมายเหตุ" };
const key = (r: { poNumber: string; materialCode: string }) => JSON.stringify([r.poNumber, r.materialCode]);
const numericFields = new Set(["orderedQty", "initialReceivedQty", "unitPrice", "poAmount", "stockQty", "sourceOutstandingQty"]);
function same(field: string, a: string | null, b: string | null) {
  return a === b || (a !== null && b !== null && numericFields.has(field) && new Decimal(a).eq(b));
}
export function planExcelRows(rows: ExcelPoRow[], existing: ExistingExcelLine[]): ExcelDecision[] {
  const fileKeys = new Map<string, number>();
  for (const row of rows) fileKeys.set(key(row), (fileKeys.get(key(row)) ?? 0) + 1);
  return rows.map(row => {
    const candidates = existing.filter(e => key(e) === key(row));
    const base = { row, changes: [] as ExcelChange[] };
    if (fileKeys.get(key(row))! > 1) return { ...base, kind: "duplicate", message: "เลข PO และวัสดุซ้ำในไฟล์ ต้องแยกรายการให้ชัดก่อนนำเข้า" };
    if (candidates.length > 1) return { ...base, kind: "ambiguous", message: "พบรายการเดิมหลายแถวที่มีเลข PO และวัสดุเดียวกัน กรุณาตรวจสอบเอง" };
    if (!candidates.length) return { ...base, kind: "new", message: "เพิ่มรายการใหม่" };
    const target = candidates[0];
    const changes = Object.keys(excelFieldLabels).flatMap(field => {
      if (field === "note" && row.note === null) return [];
      let before = target[field as keyof ExistingExcelLine] as string | null;
      if (field === "initialReceivedQty" && before !== null) before = new Decimal(before).plus(target.receiptQty).toFixed(4);
      return same(field, before, row[field as keyof ExcelPoRow] as string | null) ? [] : [{ field, before, after: row[field as keyof ExcelPoRow] as string | null }];
    });
    const fixed = changes.filter(c => !["etaDate", "etaText", "note"].includes(c.field));
    return { row, targetId: target.id, version: target.version, changes, kind: fixed.length ? "conflict" : changes.length ? "update" : "unchanged",
      message: fixed.length ? "ข้อมูลหลักต่างจากเดิม จะไม่ทับจำนวน ราคา หรือยอดรับ" : changes.length ? "อัปเดตเฉพาะ ETA / หมายเหตุ" : "ข้อมูลซ้ำ ไม่มีการเปลี่ยนแปลง" };
  });
}
