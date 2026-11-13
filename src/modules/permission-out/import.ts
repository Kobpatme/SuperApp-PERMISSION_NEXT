import { createHash } from "node:crypto";
import { inflateRawSync } from "node:zlib";
import { DOMParser, type Document, type Element } from "@xmldom/xmldom";
import Decimal from "decimal.js";
import { routeSchema, siteSchema, stripSensitive } from "./domain";

export type DatasetKind = "pea" | "ufm" | "road" | "building" | "sites";
export type ImportedRow = { key: string; data: Record<string, unknown>; privateData: Record<string, unknown> };
const MAX_FILE = 100 * 1024 * 1024, MAX_EXPANDED = 160 * 1024 * 1024;
export function xmlDocument(text: string): Document {
  if (Buffer.byteLength(text) > 32 * 1024 * 1024 || /<!\s*(DOCTYPE|ENTITY)/i.test(text)) throw new Error("ไฟล์ XML มีขนาดหรือโครงสร้างที่ไม่รองรับ");
  let invalid = false;
  const document = new DOMParser({ onError: () => { invalid = true; } }).parseFromString(text, "application/xml");
  if (invalid || !document.documentElement) throw new Error("รูปแบบ XML ไม่ถูกต้อง");
  return document;
}
const nodes = (node: Document | Element, name: string) => Array.from(node.getElementsByTagNameNS("*", name));
const text = (node: Document | Element, name: string) => nodes(node, name)[0]?.textContent?.trim() ?? "";
const diameterTable: Record<string,Record<number,string>> = {
  ADSS: {4:"8.7",12:"8.7",24:"8.7",48:"8.7",60:"8.7",72:"10.5",96:"12",120:"13.5",144:"15"},
  ARSS: {12:"11",24:"11",48:"12",60:"12",120:"15",144:"17"}, FRP: {12:"11",24:"11",48:"12",96:"13.6",144:"16.4"}, FIG8: {4:"16",12:"16",24:"20",48:"18"}, DROPWIRE: {2:"6.5"},
};
function sourceDiameter(properties: Record<string,string>, name: string, source: string) {
  const explicit = Object.entries(properties).find(([key]) => /diam|ขนาด/i.test(key))?.[1]?.match(/[\d.]+/)?.[0];
  const combined = `${name} ${Object.values(properties).join(" ")}`.toUpperCase();
  const type = /FIG\.?\s*8/.test(combined) ? "FIG8" : /DROP\s*WIRE/.test(combined) ? "DROPWIRE" : ["ADSS","ARSS","FRP"].find(t => combined.includes(t));
  const rawCore = Object.entries(properties).find(([key]) => /core|แกน|count|size/i.test(key))?.[1];
  const table = type ? diameterTable[type] : undefined;
  const numbers = (combined.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  const core = rawCore ? Number.parseInt(rawCore.replace(/\D/g,""),10) : numbers.find(n => table?.[n] !== undefined) ?? numbers[0];
  const maxi = /maxi/i.test(source);
  const keys = Object.keys(table ?? {}).map(Number).sort((a,b) => a-b);
  const found = maxi && core === 2 ? "6.5" : table?.[core] ?? (!maxi && table ? table[keys.find(n => n >= core) ?? keys[keys.length-1]] : null);
  const value = (maxi ? found ?? explicit : explicit ?? found) ?? combined.match(/(?:DIAMETER|DIA\.?|ขนาด|เส้นผ่านศูนย์กลาง)[^0-9]{0,6}([\d.]+)/)?.[1];
  return value && /^\d+(?:\.\d+)?$/.test(value) ? value : null;
}

/** Validate ZIP directory before inflation. Reject traversal, encryption, ZIP64,
 * duplicate entries and expansion bombs; never follow embedded network links. */
export function unzipFiles(buffer: Buffer) {
  if (buffer.length < 22 || buffer.length > MAX_FILE) throw new Error("ขนาดไฟล์ไม่ถูกต้อง (สูงสุด 100 MB)");
  let end = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) if (buffer.readUInt32LE(i) === 0x06054b50) { end = i; break; }
  if (end < 0 || buffer.readUInt16LE(end + 4) || buffer.readUInt16LE(end + 6)) throw new Error("ไฟล์ ZIP ไม่สมบูรณ์");
  const count = buffer.readUInt16LE(end + 10), directory = buffer.readUInt32LE(end + 16);
  if (count > 2000 || count === 65535 || directory >= end) throw new Error("ไฟล์ ZIP มีรายการมากเกินกำหนด");
  const files = new Map<string, Buffer>();
  let offset = directory, expanded = 0;
  for (let i = 0; i < count; i++) {
    if (offset + 46 > end || buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error("โครงสร้าง ZIP ไม่ถูกต้อง");
    const flags = buffer.readUInt16LE(offset + 8), method = buffer.readUInt16LE(offset + 10), compressed = buffer.readUInt32LE(offset + 20), size = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28), extra = buffer.readUInt16LE(offset + 30), comment = buffer.readUInt16LE(offset + 32), local = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);
    if ((flags & 1) || ![0, 8].includes(method) || /(^\/|\\|(?:^|\/)\.\.(?:\/|$))/.test(name) || files.has(name) || size > 32 * 1024 * 1024 || expanded + size > MAX_EXPANDED || offset + 46 + nameLength + extra + comment > end) throw new Error("รายการใน ZIP ไม่ปลอดภัยหรือใหญ่เกินกำหนด");
    if (local + 30 > directory || buffer.readUInt32LE(local) !== 0x04034b50) throw new Error("รายการ ZIP เสียหาย");
    const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    if (start + compressed > directory) throw new Error("ข้อมูล ZIP ไม่ครบ");
    const content = method === 0 ? buffer.subarray(start, start + compressed) : inflateRawSync(buffer.subarray(start, start + compressed), { maxOutputLength: Math.max(1, size) });
    if (content.length !== size) throw new Error("ขนาดข้อมูล ZIP ไม่ตรงกับรายการ");
    files.set(name, content); expanded += size; offset += 46 + nameLength + extra + comment;
  }
  return files;
}
export function parseKml(source: string, filename: string, kind: Exclude<DatasetKind, "sites">): ImportedRow[] {
  const document = xmlDocument(source), rows: ImportedRow[] = [];
  for (const [index, placemark] of nodes(document, "Placemark").entries()) {
    const properties: Record<string, string> = {};
    for (const data of nodes(placemark, "Data")) properties[data.getAttribute("name") ?? ""] = text(data, "value");
    for (const data of nodes(placemark, "SimpleData")) properties[data.getAttribute("name") ?? ""] = data.textContent ?? "";
    const description = text(placemark,"description");
    const clean = (value: string) => value.replace(/<[^>]*>/g," ").replace(/&nbsp;/gi," ").replace(/\s+/g," ").trim();
    for (const match of description.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m => clean(m[1]));
      if (cells[0] && cells[1] && !(cells[0] in properties)) properties[cells[0]] = cells[1];
    }
    for (const row of description.split(/\r?\n|<br\s*\/?>/i)) { const match = clean(row).match(/^([\wก-๙ .\-/]+?)\s*[:=]\s*(.+)$/); if (match && !(match[1] in properties)) properties[match[1]] = match[2]; }
    const ownName = Array.from(placemark.childNodes).find(n => n.nodeType === 1 && n.localName === "name")?.textContent ?? "";
    const pick = (pattern: RegExp) => Object.entries(properties).find(([key]) => pattern.test(key))?.[1]?.trim() ?? "";
    const name = pick(/^(tag|code|route_code)$/i) || ownName || `เส้นทาง ${index + 1}`;
    const coordinateSets = nodes(placemark, "LineString").map(node => text(node, "coordinates").split(/\s+/).filter(Boolean).map(value => value.split(",").slice(0, 2).map(Number)));
    coordinateSets.push(...nodes(placemark, "Track").map(node => nodes(node, "coord").map(coord => (coord.textContent ?? "").trim().split(/\s+/).slice(0, 2).map(Number))));
    for (const [part, coords] of coordinateSets.entries()) {
      const diameter = sourceDiameter(properties,name,filename);
      const polesText = pick(/^(poles?|pole_count|จำนวนเสา)$/i).replaceAll(",", "");
      const categoryText = `${filename} ${name} ${description} ${Object.values(properties).join(" ")}`;
      const category = /ready[\s_-]*access|พร้อม\s*(?:เชื่อมต่อ|ให้บริการ|ใช้งาน)/i.test(categoryText) ? "ready-access" : /customer|subscriber|ลูกค้า|ผู้ใช้บริการ/i.test(categoryText) ? "customer" : "network";
      const line = routeSchema.parse({ key: `${filename}:${index}:${part}`, name, coords, diameter, poles: polesText === "" || !/^\d+(?:\.0+)?$/.test(polesText) ? null : Number(polesText), province: pick(/^(province|จังหวัด)$/i), cableStatus: pick(/^(status|cable_status)$/i), sourceFile: filename, metadata: stripSensitive(properties), category });
      rows.push({ key: line.key, data: line, privateData: properties });
    }
    for (const [part, polygon] of nodes(placemark, "Polygon").entries()) {
      const rings = nodes(polygon, "LinearRing").map(node => text(node, "coordinates").split(/\s+/).filter(Boolean).map(value => value.split(",").slice(0, 2).map(Number)));
      for (const ring of rings) if (ring.length < 4 || ring.some(p => p.length !== 2 || !Number.isFinite(p[0]) || !Number.isFinite(p[1]) || Math.abs(p[0]) > 180 || Math.abs(p[1]) > 90)) throw new Error("พิกัดพื้นที่ไม่ถูกต้อง");
      const key = `${filename}:${index}:polygon:${part}`;
      rows.push({ key, data: { key, name, kind, geometry: { type: "Polygon", coordinates: rings }, properties: stripSensitive(properties) }, privateData: properties });
    }
  }
  if (!rows.length || rows.length > 20000) throw new Error("ไม่พบเส้นทางหรือพื้นที่ หรือมีมากกว่า 20,000 รายการ");
  return rows;
}
export function parseSiteRows(headers: string[], rows: string[][]): ImportedRow[] {
  if (headers.length !== 70 || headers[0] !== "Site Code" || headers.some(h => !h.trim()) || new Set(headers).size !== 70) throw new Error("ต้องมีหัวตาราง 70 คอลัมน์ไม่ซ้ำ และคอลัมน์ A เป็น Site Code");
  const seen = new Set<string>();
  return rows.filter(row => row.some(cell => cell.trim())).map((row, index) => {
    const key = row[0]?.trim();
    if (!key || seen.has(key)) throw new Error(`แถว ${index + 2}: Site Code ว่างหรือซ้ำ`);
    seen.add(key);
    const properties = Object.fromEntries(headers.map((header, col) => [header, row[col] ?? ""]));
    const lat = row[11]?.trim(), lon = row[12]?.trim();
    const valid = Boolean(lat && lon && Number.isFinite(Number(lat)) && Number.isFinite(Number(lon)) && Math.abs(Number(lat)) <= 90 && Math.abs(Number(lon)) <= 180);
    const site = siteSchema.parse({ key,code:key, name: row[5] ?? "", regional: row[6] ?? "", area: row[7] ?? "", province: row[9] ?? "", grade: row[4] ?? "", type: row[3] ?? "",siteType:row[28]??"",district:row[8]??"",nodeEquipment:row[33]??"",customers:Math.max(0,Number.parseInt(row[13]||"0",10)||0),remark:Object.entries(properties).find(([k])=>/^(remark|หมายเหตุ)$/i.test(k))?.[1]??"", owner: row[27] ?? "", latitude: valid ? Number(lat) : null, longitude: valid ? Number(lon) : null, properties: stripSensitive(properties) });
    const rawOpex = (row[21] ?? "").replaceAll(",", "").trim();
    if (rawOpex && (!/^\d+(?:\.\d+)?$/.test(rawOpex) || new Decimal(rawOpex).gt("999999999999.99"))) throw new Error(`แถว ${index + 2}: OPEX ไม่ถูกต้อง`);
    return { key, data: site, privateData: { raw: properties, opex: rawOpex ? new Decimal(rawOpex).toFixed(2, Decimal.ROUND_HALF_UP) : null } };
  });
}
export function parseSiteWorkbook(files: Map<string, Buffer>): ImportedRow[] {
  const doc = (path: string) => { const file = files.get(path); if (!file) throw new Error("โครงสร้าง Excel ไม่ครบ"); return xmlDocument(file.toString("utf8")); };
  const workbook = doc("xl/workbook.xml");
  if (nodes(workbook, "workbookPr").some(n => /^(1|true)$/.test(n.getAttribute("date1904") ?? ""))) throw new Error("ไม่รองรับระบบวันที่ Excel 1904");
  const sheet = nodes(workbook, "sheet").find(n => n.getAttribute("name") === "Total Site");
  if (!sheet) throw new Error("ไม่พบชีต Total Site");
  const relation = nodes(doc("xl/_rels/workbook.xml.rels"), "Relationship").find(n => n.getAttribute("Id") === sheet.getAttribute("r:id"));
  if (!relation || relation.getAttribute("TargetMode") === "External") throw new Error("ตำแหน่งชีตไม่ถูกต้อง");
  const target = relation.getAttribute("Target")?.replace(/^\/?xl\//, "");
  if (!target || target.includes("..") || target.startsWith("/")) throw new Error("ตำแหน่งชีตไม่ถูกต้อง");
  const shared = files.has("xl/sharedStrings.xml") ? nodes(doc("xl/sharedStrings.xml"), "si").map(n => nodes(n, "t").map(t => t.textContent ?? "").join("")) : [];
  const rows = nodes(doc(`xl/${target}`), "row").map(row => {
    const cells = Array<string>(70).fill("");
    for (const cell of nodes(row, "c")) {
      const letters = /^[A-Z]+/.exec(cell.getAttribute("r") ?? "")?.[0] ?? "";
      const index = Array.from(letters).reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
      if (index < 0 || index >= 70) { if (text(cell, "v")) throw new Error("ข้อมูลมีเกิน 70 คอลัมน์"); continue; }
      const value = text(cell, "v"), type = cell.getAttribute("t");
      cells[index] = type === "s" ? shared[Number(value)] ?? "" : type === "inlineStr" ? nodes(cell, "t").map(n => n.textContent ?? "").join("") : value;
    } return cells;
  });
  if (rows.length < 2 || rows.length > 20001) throw new Error("ไฟล์ต้องมีข้อมูล 1–20,000 แถว");
  return parseSiteRows(rows[0].map(s => s.trim()), rows.slice(1));
}
export async function parseUpload(file: File, kind: DatasetKind) {
  if (!file.size || file.size > MAX_FILE || /[\/\\\x00-\x1f]/.test(file.name) || file.name.length > 200) throw new Error("ชื่อหรือขนาดไฟล์ไม่ถูกต้อง (สูงสุด 100 MB)");
  const buffer = Buffer.from(await file.arrayBuffer());
  let rows: ImportedRow[];
  if (kind === "sites") {
    if (!/\.xlsx$/i.test(file.name)) throw new Error("ข้อมูลไซต์ต้องเป็นไฟล์ .xlsx");
    rows = parseSiteWorkbook(unzipFiles(buffer));
  } else if (/\.kmz$/i.test(file.name)) {
    const kml = [...unzipFiles(buffer)].filter(([name]) => /\.kml$/i.test(name));
    if (!kml.length) throw new Error("ไม่พบ KML ใน KMZ");
    rows = kml.flatMap(([name, content]) => parseKml(content.toString("utf8"), `${file.name}:${name}`, kind));
  } else if (/\.kml$/i.test(file.name)) rows = parseKml(buffer.toString("utf8"), file.name, kind);
  else throw new Error("รองรับเฉพาะ KML/KMZ หรือ Excel สำหรับไซต์");
  if (!rows.length || rows.length > 20000 || new Set(rows.map(r => r.key)).size !== rows.length) throw new Error("จำนวนหรือรหัสรายการไม่ถูกต้อง");
  if(rows.reduce((n,r)=>n+(Array.isArray(r.data.coords)?r.data.coords.length:0),0)>500000)throw new Error("จำนวนพิกัดมากกว่า 500,000 จุด กรุณาแบ่งไฟล์");
  return { rows, buffer, checksum: createHash("sha256").update(buffer).digest("hex"), filename: file.name, kind };
}
