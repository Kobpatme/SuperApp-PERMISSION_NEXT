import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFTextField, PDFName, TextAlignment, defaultTextFieldAppearanceProvider, degrees, rgb as documentRgb, StandardFonts } from "pdf-lib";
import type { DuctRentalFormData } from "../schemas/design";
import { ntFieldValues } from "../domain/pdf-fields";
import { signatureLayout, type SignatureOffsets } from "../domain/signature-layout";
import { drawSummary } from "./summary-pdf";
import { DuctError } from "./transaction";

async function thaiFont(pdf: PDFDocument) {
  pdf.registerFontkit(fontkit);
  const font = await readFile(join(process.cwd(), "src/modules/duct-rental/assets/Sarabun-Regular.ttf"));
  return pdf.embedFont(font, { subset: true });
}
export async function generateNtPdf(design: Partial<DuctRentalFormData>) {
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
    field.removeMaxLength(); field.setText(value); field.setAlignment(TextAlignment.Center);
    field.updateAppearances(font, (textField, widget, widgetFont) => {
      const rect = widget.getRectangle(), sourceSize = Math.min(rect.height * 0.62, 13);
      const fittedSize = value ? Math.min(sourceSize, Math.max(1, rect.width - 4) / Math.max(widgetFont.widthOfTextAtSize(value, 1), 1)) : sourceSize;
      // Widget DA can override the field size. Source sizes each annotation independently.
      widget.dict.delete(PDFName.of("DA")); textField.acroField.setDefaultAppearance(`0 g /${widgetFont.name} ${fittedSize} Tf`);
      return defaultTextFieldAppearanceProvider(textField, widget, widgetFont);
    });
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
export type Stamp = SignatureOffsets & { page: number; width: number; height: number; rotation: number };
export async function stampSignature(base: Uint8Array, png: Uint8Array, placement: Stamp, signerName: string, signedAt: Date, displayDate?: string) {
  const pdf = await PDFDocument.load(base), page = pdf.getPages()[placement.page - 1], font = await thaiFont(pdf), dateFont = await pdf.embedFont(StandardFonts.Helvetica);
  if (!page || placement.page !== 4) throw new DuctError("SIGN_PAGE", "NT Form ต้องลงนามในหน้าที่ 4");
  const layout = signatureLayout(page.getWidth(), page.getHeight(), placement), image = await pdf.embedPng(png);
  const fit = Math.min((layout.image.width - 14) / image.width, (layout.image.height - 10) / image.height), width = image.width * fit, height = image.height * fit;
  const x = layout.image.x + (layout.image.width - width) / 2, y = layout.image.y + (layout.image.height - height) / 2, angle = placement.rotation * Math.PI / 180;
  const corners = [[0, 0], [width, 0], [0, height], [width, height]].map(([dx, dy]) => ({ x: x + dx * Math.cos(angle) - dy * Math.sin(angle), y: y + dx * Math.sin(angle) + dy * Math.cos(angle) }));
  const inside = (box: { x: number; y: number; width: number; height: number }) => box.x >= 0 && box.y >= 0 && box.x + box.width <= page.getWidth() && box.y + box.height <= page.getHeight();
  if (corners.some(point => point.x < 0 || point.y < 0 || point.x > page.getWidth() || point.y > page.getHeight()) || !inside(layout.name) || !inside({ ...layout.date, x: layout.date.x - layout.date.width * 0.07, width: layout.date.width * 1.07 })) throw new DuctError("SIGN_BOUNDS", "ตำแหน่งลายเซ็น ชื่อหรือวันที่เกินขอบเอกสาร");
  page.drawImage(image, { x, y, width, height, rotate: degrees(placement.rotation) });
  const fitted = (value: string, maxWidth: number, max: number, min: number, selectedFont: typeof font) => { let size = max; while (size > min && selectedFont.widthOfTextAtSize(value, size) > maxWidth) size -= 0.5; return Math.max(size, min); };
  const name = signerName.trim(), nameSize = fitted(name, layout.name.width - 14, 9.5, 7, font);
  page.drawText(name, { x: layout.name.x + (layout.name.width - font.widthOfTextAtSize(name, nameSize)) / 2, y: layout.name.y + (layout.name.height - nameSize) / 2, size: nameSize, font, color: documentRgb(0.1, 0.14, 0.21) });
  const dateOnDocument = displayDate ? new Date(`${displayDate}T12:00:00+07:00`) : signedAt;
  const parts = displayDate === "" ? [] : dateOnDocument.toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok", day: "2-digit", month: "2-digit", year: "numeric" }).split("/");
  const boxes = [{ start: -0.07, width: 0.34 }, { start: 0.31, width: 0.30 }, { start: 0.68, width: 0.32 }];
  parts.forEach((part, index) => {
    const boxWidth = layout.date.width * boxes[index].width, size = fitted(part, boxWidth - 3, 7.5, 6, dateFont);
    page.drawText(part, { x: layout.date.x + layout.date.width * boxes[index].start + (boxWidth - dateFont.widthOfTextAtSize(part, size)) / 2, y: layout.date.y + (layout.date.height - size) / 2, size, font: dateFont, color: documentRgb(0.16, 0.19, 0.24) });
  });
  return pdf.save();
}
export async function generateSummaryPdf(design: Partial<DuctRentalFormData>, code: string) {
  const pdf = await PDFDocument.create(), font = await thaiFont(pdf);
  drawSummary(pdf, font, design, code);
  return pdf.save();
}
