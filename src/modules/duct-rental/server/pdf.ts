import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFTextField, PDFName, degrees, rgb } from "pdf-lib";
import type { DuctRentalFormData } from "../schemas/design";
import { ntFieldValues } from "../domain/pdf-fields";
import { DuctError } from "./transaction";

async function thaiFont(pdf: PDFDocument) {
  pdf.registerFontkit(fontkit);
  const font = await readFile(join(process.cwd(), "src/modules/duct-rental/assets/Sarabun-Regular.ttf"));
  return pdf.embedFont(font, { subset: true });
}
export async function generateNtPdf(design: DuctRentalFormData) {
  const pdf = await PDFDocument.load(await readFile(join(process.cwd(), "src/modules/duct-rental/assets/nt-duct-rental.pdf")));
  const form = pdf.getForm(), font = await thaiFont(pdf), values = ntFieldValues(design);
  const fields = new Map(form.getFields().map(field => [field.getName(), field]));
  const missing = Object.keys(values).filter(name => !fields.has(name));
  if (missing.length) throw new DuctError("TEMPLATE_FIELDS", "แบบฟอร์ม NT ไม่ตรงกับรุ่นที่รองรับ", 503);
  for (const [name, value] of Object.entries(values)) {
    const field = fields.get(name);
    if (!(field instanceof PDFTextField)) throw new DuctError("TEMPLATE_FIELDS", "ชนิดฟิลด์ในแบบฟอร์มไม่ถูกต้อง", 503);
    // Source canvas ignores the template's erroneous MaxLen=0. Remove that
    // restriction only on generated copies, then fit text into the same widget.
    const rect = field.acroField.getWidgets()[0].getRectangle();
    const sourceSize = Math.min(rect.height * 0.62, 13);
    const fittedSize = value ? Math.min(sourceSize, Math.max(1, rect.width - 4) / Math.max(font.widthOfTextAtSize(value, 1), 1)) : sourceSize;
    field.removeMaxLength(); field.setText(value); field.setFontSize(fittedSize); field.updateAppearances(font);
  }
  for (const field of form.getFields()) {
    if (field.getName().startsWith("Image Field") && !field.acroField.dict.get(PDFName.of("V"))) form.removeField(field);
  }
  // Flattened output follows source submitted-document workflow. Source template stays editable.
  form.updateFieldAppearances(font); form.flatten();
  // This source template contains orphan widget references outside the field
  // tree. Source rasterized output has no annotations; remove all on the copy.
  for (const page of pdf.getPages()) page.node.delete(PDFName.of("Annots"));
  // Source flattened pages have no form widgets/tags. Old template structure
  // references deleted widgets; discard those stale references on this copy.
  pdf.catalog.delete(PDFName.of("AcroForm")); pdf.catalog.delete(PDFName.of("StructTreeRoot")); pdf.catalog.delete(PDFName.of("MarkInfo"));
  return pdf.save();
}
export type Stamp = { page: number; x: number; y: number; width: number; height: number; rotation: number; scale: number; nameOffsetX?: number; nameOffsetY?: number; dateOffsetX?: number; dateOffsetY?: number };
export async function stampSignature(base: Uint8Array, png: Uint8Array, placement: Stamp, signerName: string, signedAt: Date) {
  const pdf = await PDFDocument.load(base), page = pdf.getPages()[placement.page - 1], font = await thaiFont(pdf);
  if (!page || placement.page !== 4) throw new DuctError("SIGN_PAGE", "NT Form ต้องลงนามในหน้าที่ 4");
  const image = await pdf.embedPng(png), width = placement.width * placement.scale, height = placement.height * placement.scale;
  // Rotated bounding box must remain entirely inside the page, including name/date.
  const angle = placement.rotation * Math.PI / 180;
  const corners = [[0, 0], [width, 0], [0, height], [width, height]].map(([x, y]) => ({ x: placement.x + x * Math.cos(angle) - y * Math.sin(angle), y: placement.y + x * Math.sin(angle) + y * Math.cos(angle) }));
  if (corners.some(point => point.x < 0 || point.y < 0 || point.x > page.getWidth() || point.y > page.getHeight()) || placement.y < 28) throw new DuctError("SIGN_BOUNDS", "ตำแหน่งลายเซ็นเกินขอบเอกสาร");
  page.drawImage(image, { x: placement.x, y: placement.y, width, height, rotate: degrees(placement.rotation) });
  const date = signedAt.toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", day: "2-digit", month: "2-digit", year: "numeric" }).split("/");
  const nameSize = Math.min(9.5, Math.max(6, width / Math.max(font.widthOfTextAtSize(signerName, 1), 1)));
  const nameX = placement.x + (placement.nameOffsetX ?? 0), nameY = placement.y - 12 + (placement.nameOffsetY ?? 0);
  const dateBox = { x: page.getWidth() * 0.552 + placement.x - 255 + (placement.dateOffsetX ?? 0), y: placement.y - 28 + (placement.dateOffsetY ?? 0), width: page.getWidth() * 0.14 };
  if (nameX < 0 || nameY < 0 || nameX + font.widthOfTextAtSize(signerName, nameSize) > page.getWidth() || nameY + nameSize > page.getHeight() || dateBox.x - 6 < 0 || dateBox.x + dateBox.width > page.getWidth() || dateBox.y < 0 || dateBox.y + 10 > page.getHeight()) throw new DuctError("SIGN_BOUNDS", "ตำแหน่งชื่อหรือวันที่เกินขอบเอกสาร");
  page.drawText(signerName, { x: nameX, y: nameY, size: nameSize, font, color: rgb(0.1, 0.14, 0.21) });
  // Source prints day/month/Gregorian year in the three template blanks, without another slash.
  const boxes = [{ start: -0.07, width: 0.34 }, { start: 0.31, width: 0.30 }, { start: 0.68, width: 0.32 }];
  date.forEach((part, index) => page.drawText(part, { x: dateBox.x + dateBox.width * (boxes[index].start + boxes[index].width / 2) - font.widthOfTextAtSize(part, 7.5) / 2, y: dateBox.y, size: 7.5, font }));
  return pdf.save();
}
export async function generateSummaryPdf(design: DuctRentalFormData, code: string) {
  const pdf = await PDFDocument.create(), font = await thaiFont(pdf);
  let page = pdf.addPage([595.28, 841.89]);
  const type = { NEW: "ขอเช่าท่อใหม่", EXTENSION: "ต่อสัญญา", CANCELLATION: "ขอยกเลิกใช้งาน" }[design.requestType];
  const values = [`ใบคำขอเช่าท่อร้อยสายสื่อสาร ${code}`, "วันที่: ___________________", `ประเภทคำขอ: ${type}`, `ชื่อโครงการ: ${design.projectName}`, `เส้นทาง / ถนน: ${design.routeName}`, `เจ้าของท่อ: ${design.ownerDuct}`, `รายละเอียดเส้นทาง: ${design.routeDetail}`, `ศูนย์บริการ: ${design.serviceCenter}`, `ประเภทงาน: ${design.jobType}`, `รองรับ: ${design.supportInfo || "-"}`, `จังหวัด: ${design.province}  อำเภอ/เขต: ${design.district}`, `ชนิดสาย: ${design.cableType} ${design.fiberType}`, `จำนวนสาย: ${design.cableCount ?? 1} เส้น`, `ไดมิตเตอร์: ${design.diameter} mm`, `ระยะทาง: ${design.distance.toFixed(2)} m`, `UIH Area / Contract: ${design.uihArea || "-"}`, `พิกัดต้นทาง: ${design.startCoords}`, `พิกัดปลายทาง: ${design.endCoords}`, `ผู้ประสานงานออกแบบ: ${design.designContactName || "-"}`, `โทรศัพท์: ${design.designContactPhone || "-"}`, `อีเมล: ${design.designContactEmail || "-"}`, `ผู้ประสานหน้างาน: ${design.installContactName || "-"}`, `โทรศัพท์: ${design.installContactPhone || "-"}`, `อีเมล: ${design.installContactEmail || "-"}`];
  let y = 790;
  const print = (line: string) => {
    if (y < 70) { page = pdf.addPage([595.28, 841.89]); y = 790; }
    page.drawText(line, { x: 50, y, font, size: 12 }); y -= 20;
  };
  for (const text of values) {
    let line = "";
    for (const { segment: char } of new Intl.Segmenter("th", { granularity: "grapheme" }).segment(text)) {
      if (font.widthOfTextAtSize(line + char, 12) > 490) { print(line); line = ""; }
      line += char;
    }
    print(line); y -= 8;
  }
  pdf.getPages().forEach((item, index) => item.drawText(`หน้า ${index + 1} / ${pdf.getPageCount()}`, { x: 480, y: 40, font, size: 9 }));
  return pdf.save();
}
