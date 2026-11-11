import { excelHeaders } from "../../src/modules/po-tracking/excel-domain";

function crc32(data: Buffer) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
const escapeXml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const column = (index: number): string => index >= 26 ? column(Math.floor(index / 26) - 1) + column(index % 26) : String.fromCharCode(65 + index);
export function makePoWorkbook(data: Record<string, string>[], headers: readonly string[] = excelHeaders) {
  const rows: Record<string, string>[] = [Object.fromEntries(headers.map(h => [h, h])), ...data.map(r => ({ ...r, "Project code": r["Project code"] ?? r.Order ?? "" }))];
  const sheet = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((row, i) => `<row r="${i + 1}">${headers.map((h, j) => `<c r="${column(j)}${i + 1}" t="inlineStr"><is><t>${escapeXml(row[h] ?? "")}</t></is></c>`).join("")}</row>`).join("")}</sheetData></worksheet>`;
  const entries = {
    "xl/workbook.xml": '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="PO upload" sheetId="1" r:id="rId1"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels": '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/worksheets/sheet1.xml": sheet,
  };
  const local: Buffer[] = [], central: Buffer[] = [];
  let offset = 0;
  for (const [name, content] of Object.entries(entries)) {
    const bytes = Buffer.from(content), filename = Buffer.from(name), crc = crc32(bytes);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4); header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(bytes.length, 18); header.writeUInt32LE(bytes.length, 22); header.writeUInt16LE(filename.length, 26);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50); entry.writeUInt16LE(20, 4); entry.writeUInt16LE(20, 6); entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(bytes.length, 20); entry.writeUInt32LE(bytes.length, 24); entry.writeUInt16LE(filename.length, 28); entry.writeUInt32LE(offset, 42);
    local.push(header, filename, bytes); central.push(entry, filename); offset += header.length + filename.length + bytes.length;
  }
  const end = Buffer.alloc(22), directory = Buffer.concat(central);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(3, 8); end.writeUInt16LE(3, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}
export function excelTestRow(poNumber = "PO-TEST-001"): Record<string, string> {
  return { Material: "MAT-001", Description: "วัสดุทดสอบ", BUn: "PC", "PO No.": poNumber, "PO Rel.Date": "11.11.2026", LastGRdate: "", Stock: "0", "Order QTY": "10", "Actual GR": "0", Outstanding: "10", ETA: "พร้อมส่ง", "Unit Price": "35.98", "PO Amount": "359.80", Order: "ORDER-01", Vendor: "00112", Name: "ผู้ขายทดสอบ" };
}
