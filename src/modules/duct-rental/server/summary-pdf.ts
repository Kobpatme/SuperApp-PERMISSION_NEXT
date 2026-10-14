import { PDFDocument, rgb as documentRgb, type PDFFont } from "pdf-lib";
import type { DuctRentalFormData } from "../schemas/design";

// Document colours/layout come from the frozen METRIX PDF, independent of Core UI tokens.
export function drawSummary(pdf: PDFDocument, font: PDFFont, data: Partial<DuctRentalFormData>, code: string) {
  const colour = { primary: documentRgb(8 / 255, 145 / 255, 178 / 255), secondary: documentRgb(99 / 255, 102 / 255, 241 / 255), text: documentRgb(31 / 255, 41 / 255, 55 / 255), muted: documentRgb(107 / 255, 114 / 255, 128 / 255), border: documentRgb(229 / 255, 231 / 255, 235 / 255), bg: documentRgb(249 / 255, 250 / 255, 251 / 255) };
  const width = 595.28, height = 841.89, margin = 40, content = width - margin * 2;
  let page = pdf.addPage([width, height]), y = height - margin;
  const text = (value: string, x: number, top: number, size = 10, ink = colour.text) => page.drawText(value, { x, y: top - size, size, font, color: ink });
  const wrap = (value: string, max: number, size: number) => {
    const lines: string[] = []; let line = "";
    for (const { segment } of new Intl.Segmenter("th", { granularity: "grapheme" }).segment(value)) {
      if (segment === "\n" || font.widthOfTextAtSize(line + segment, size) > max) { lines.push(line); line = segment === "\n" ? "" : segment; } else line += segment;
    }
    lines.push(line); return lines;
  };
  const room = (amount: number) => { if (y - amount < 65) { page = pdf.addPage([width, height]); y = height - margin; } };
  const header = "แบบฟอร์มขอเช่าท่อ";
  text(header, width - margin - font.widthOfTextAtSize(header, 14), y, 14); y -= 20;
  for (const line of [`เลขที่: ${code}`, "วันที่: ___________________"]) { text(line, width - margin - font.widthOfTextAtSize(line, 10), y, 10, colour.muted); y -= 14; }
  y -= 15; page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 2, color: colour.primary }); y -= 20;
  for (const line of ["ใบคำขอเช่าท่อร้อยสายสื่อสาร", "Duct Rental Request Form"]) { text(line, (width - font.widthOfTextAtSize(line, 18)) / 2, y, 18); y -= 23; }
  y -= 15;
  const section = (title: string) => { room(70); page.drawRectangle({ x: margin, y: y - 30, width: content, height: 30, color: colour.bg }); page.drawRectangle({ x: margin, y: y - 30, width: 4, height: 30, color: colour.primary }); text(title, margin + 12, y - 8, 12, colour.primary); y -= 40; };
  const fields = (pairs: [string, unknown][], full = false) => {
    for (let at = 0; at < pairs.length; at += full ? 1 : 2) {
      const row = pairs.slice(at, at + (full ? 1 : 2)), boxWidth = full ? content : content / 2 - 5;
      const lines = row.map(([, value]) => wrap(value == null || value === "" ? "—" : String(value), boxWidth - 12, 10));
      const boxHeight = Math.max(24, ...lines.map(item => item.length * 13 + 12)); room(boxHeight + 22);
      row.forEach(([label], index) => {
        const x = margin + index * (content / 2 + 5); text(label, x, y, 9, colour.muted);
        page.drawRectangle({ x, y: y - 14 - boxHeight, width: boxWidth, height: boxHeight, color: colour.bg, borderColor: colour.border, borderWidth: 1 });
        lines[index].forEach((line, lineIndex) => text(line, x + 6, y - 20 - lineIndex * 13));
      }); y -= boxHeight + 22;
    }
  };
  section("01. ประเภทคำขอ / Request Type");
  fields([["ประเภทคำขอ", { NEW: "ขอเช่าท่อใหม่", EXTENSION: "ต่อสัญญา", CANCELLATION: "ขอยกเลิกใช้งาน" }[data.requestType ?? "NEW"]]], true);
  section("02. ข้อมูลโครงการ / Project Information");
  fields([["ชื่อโครงการ / Project Name", data.projectName], ["ชื่อเส้นทาง / Route Name", data.routeName], ["Owner Duct", data.ownerDuct], ["Service Center", data.serviceCenter], ["ประเภทงาน / Job Type", data.jobType]]);
  fields([["รายละเอียดเส้นทาง / Route Detail", data.routeDetail]], true);
  if (data.supportInfo) fields([["รองรับ / Support Info", data.supportInfo]], true);
  section("03. รายละเอียดสายและพิกัด / Cable Details & Coordinates");
  fields([["ชนิดสาย / Cable Type", data.cableType], ["Fiber Type", data.fiberType], ["ไดมิตเตอร์ (mm) / Diameter", data.diameter != null ? `${data.diameter} mm` : "—"], ["ระยะทาง (m) / Distance", data.distance != null ? `${data.distance.toFixed(2)} m` : "—"], ["UIH Area / Contract", data.uihArea], ["จำนวนสาย (เส้น)", data.cableCount ?? 1], ["พิกัดต้นทาง / Start Coordinates", data.startCoords], ["พิกัดปลายทาง / End Coordinates", data.endCoords], ["อำเภอ/เขต / District", data.district], ["จังหวัด / Province", data.province]]);
  section("04. ผู้ประสานงาน / Contact Persons");
  room(130); text("DESIGN — ผู้ประสานงาน", margin + 10, y, 11, colour.primary); y -= 20;
  fields([["ชื่อ-สกุล / Name", data.designContactName], ["โทรศัพท์ / Phone", data.designContactPhone]]);
  fields([["อีเมล / Email", data.designContactEmail]], true);
  room(130); text("INSTALL — ผู้ประสานหน้างาน", margin + 10, y, 11, colour.secondary); y -= 20;
  fields([["ชื่อ-สกุล / Name", data.installContactName], ["โทรศัพท์ / Phone", data.installContactPhone]]);
  fields([["อีเมล / Email", data.installContactEmail]], true);
  pdf.getPages().forEach((item, index) => {
    item.drawLine({ start: { x: margin, y: 50 }, end: { x: width - margin, y: 50 }, thickness: 1, color: colour.border });
    const footer = `หน้า ${index + 1} / ${pdf.getPageCount()}`;
    item.drawText(footer, { x: width - margin - font.widthOfTextAtSize(footer, 8), y: 30, size: 8, font, color: colour.muted });
  });
}
