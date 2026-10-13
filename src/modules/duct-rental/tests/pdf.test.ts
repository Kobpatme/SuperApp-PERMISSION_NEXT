import { readFile, mkdir, writeFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { PDFDocument, PDFName } from "pdf-lib";
import golden from "../../../../tests/fixtures/metrix-golden/validation.json";
import { DuctRentalSchema } from "../schemas/design";
import { ntFieldValues } from "../domain/pdf-fields";
import { generateNtPdf, generateSummaryPdf, stampSignature } from "../server/pdf";

describe("RULE017 NT template and owner-approved DQ03", () => {
  const data = DuctRentalSchema.parse(golden.fixtures[0].input);
  it.each([1, 2, 12])("uses actual cable count %s and preserves source contact/coordinate mappings", count => {
    const values = ntFieldValues({ ...data, cableCount: count, designContactName: "ผู้ประสานงานทดสอบ" });
    expect(values["จำนวนเส้น (3)"]).toBe(String(count));
    expect(values["Latitude (3)"]).toBe(data.startCoords); expect(values["Longitude (3)"]).toBe(data.endCoords);
    expect(values["ชื่อ/นามสกุลผู้ประสานงาน (5)"]).toBe("ผู้ประสานงานทดสอบ");
    expect(values).not.toHaveProperty("วันที่สมัคร");
  });
  it("preserves undefined-design and omitted-count source fallback", () => {
    expect(ntFieldValues()).toEqual({}); expect(ntFieldValues(data)["จำนวนเส้น (3)"]).toBe("1");
  });
  it("creates a five-page flattened NT form with Thai and valid assigned stamp", async () => {
    const input = { ...data, cableCount: 3, designContactName: "ผู้ประสานงานทดสอบ", routeDetail: "ถนนทดสอบในกรุงเทพมหานคร" };
    const base = await generateNtPdf(input), pdf = await PDFDocument.load(base);
    expect(pdf.getPageCount()).toBe(5); expect(pdf.catalog.has(PDFName.of("AcroForm"))).toBe(false);
    expect(pdf.getPages().every(page => !page.node.Annots())).toBe(true);
    const png = await readFile("tests/fixtures/metrix-golden/signature.png");
    const placement = { page: 4, x: 255, y: 640, width: 85, height: 32, rotation: 0, scale: 1 };
    const signed = await stampSignature(base, png, placement, "ผู้ลงนามทดสอบ", new Date("2031-01-01T01:00:00Z"));
    expect((await PDFDocument.load(signed)).getPageCount()).toBe(5);
    await expect(stampSignature(base, png, { ...placement, x: 99999 }, "ทดสอบ", new Date())).rejects.toMatchObject({ code: "SIGN_BOUNDS" });
    await expect(stampSignature(base, png, { ...placement, page: 1 }, "ทดสอบ", new Date())).rejects.toMatchObject({ code: "SIGN_PAGE" });
    if (process.env.DUCT_RENTAL_PDF_QA === "1") {
      const path = "docs/quality/duct-rental"; await mkdir(path, { recursive: true });
      await writeFile(`${path}/nt-form.pdf`, base); await writeFile(`${path}/nt-form-signed.pdf`, signed);
      await writeFile(`${path}/summary.pdf`, await generateSummaryPdf(input, "RQ-TEST"));
    }
  }, 30000);
  it("has all mapped canonical fields in the original unmodified template", async () => {
    const pdf = await PDFDocument.load(await readFile("src/modules/duct-rental/assets/nt-duct-rental.pdf"));
    const names = pdf.getForm().getFields().map(field => field.getName());
    // 195 named nodes includes parents; 164 terminal fields/widgets are fillable.
    expect(names).toHaveLength(164); expect(Object.keys(ntFieldValues(data)).every(name => names.includes(name))).toBe(true);
  });
});
