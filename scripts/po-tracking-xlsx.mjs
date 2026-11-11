// Minimal XLSX reader (ZIP central directory + SpreadsheetML) so the import
// has no duplicated spreadsheet dependency and can run from a clean checkout.
import { inflateRawSync } from "node:zlib";

const EOCD = 0x06054b50, CENTRAL = 0x02014b50, LOCAL = 0x04034b50;

function decodeXml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function unzip(buffer) {
  let eocd = -1;
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 66_000); offset -= 1) {
    if (buffer.readUInt32LE(offset) === EOCD) { eocd = offset; break; }
  }
  if (eocd < 0) throw new Error("XLSX_EOCD_NOT_FOUND");
  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let index = 0; index < count; index += 1) {
    if (buffer.readUInt32LE(offset) !== CENTRAL) throw new Error("XLSX_CENTRAL_DIRECTORY_INVALID");
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);
    if (buffer.readUInt32LE(localOffset) !== LOCAL) throw new Error("XLSX_LOCAL_HEADER_INVALID");
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const data = buffer.subarray(dataStart, dataStart + compressedSize);
    entries.set(name, method === 0 ? data : inflateRawSync(data));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function textNodes(xml) {
  return [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((match) => decodeXml(match[1])).join("");
}

function attribute(attributes, name) {
  const quoted = new RegExp(`${name}\\s*=\\s*"([^"]*)"`).exec(attributes);
  if (quoted) return decodeXml(quoted[1]);
  const single = new RegExp(`${name}\\s*=\\s*'([^']*)'`).exec(attributes);
  return single ? decodeXml(single[1]) : "";
}

function columnNumber(reference) {
  const letters = /^[A-Z]+/.exec(reference)?.[0] ?? "";
  let value = 0;
  for (const letter of letters) value = value * 26 + letter.charCodeAt(0) - 64;
  return value;
}

/** Read the first worksheet as `{name, rows: [{number, cells: {1: text, ...}}]}`. */
export function readWorkbook(buffer, sheetName) {
  const entries = unzip(buffer);
  const workbook = entries.get("xl/workbook.xml");
  if (!workbook) throw new Error("XLSX_WORKBOOK_MISSING");
  const sheetTags = [...workbook.toString("utf8").matchAll(/<sheet\b([^>]*?)\/?>/g)].map((match) => ({
    name: attribute(match[1], "name"),
    relationshipId: attribute(match[1], "r:id"),
  }));
  const selected = sheetName ? sheetTags.find((sheet) => sheet.name === sheetName) : sheetTags[0];
  if (!selected) throw new Error("XLSX_SHEET_NOT_FOUND");
  const relationships = entries.get("xl/_rels/workbook.xml.rels")?.toString("utf8") ?? "";
  const target = [...relationships.matchAll(/<Relationship\b([^>]*?)\/?>/g)]
    .map((match) => ({ id: attribute(match[1], "Id"), target: attribute(match[1], "Target") }))
    .find((relationship) => relationship.id === selected.relationshipId)?.target;
  if (!target) throw new Error("XLSX_SHEET_TARGET_MISSING");
  const sheetPath = target.startsWith("/") ? target.slice(1) : `xl/${target}`;
  const sheetXml = entries.get(sheetPath);
  if (!sheetXml) throw new Error("XLSX_SHEET_MISSING");

  const sharedXml = entries.get("xl/sharedStrings.xml")?.toString("utf8");
  const shared = sharedXml
    ? [...sharedXml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map((match) => textNodes(match[1]))
    : [];

  const rows = [];
  for (const rowMatch of sheetXml.toString("utf8").matchAll(/<row\b([^>]*?)>([\s\S]*?)<\/row>/g)) {
    const number = Number(attribute(rowMatch[1], "r"));
    const cells = {};
    for (const cellMatch of rowMatch[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attributes = cellMatch[1];
      const body = cellMatch[2] ?? "";
      const reference = attribute(attributes, "r");
      if (!reference) continue;
      const type = attribute(attributes, "t");
      const rawValue = /<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/.exec(body)?.[1];
      let value = "";
      if (type === "s" && rawValue !== undefined) value = shared[Number(rawValue)] ?? "";
      else if (type === "inlineStr") value = textNodes(body);
      else if (rawValue !== undefined) value = decodeXml(rawValue);
      cells[columnNumber(reference)] = value;
    }
    rows.push({ number, cells });
  }
  return { name: selected.name, rows };
}
