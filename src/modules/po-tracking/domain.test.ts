import { describe, expect, it } from "vitest";
import {
  correctReceiptSchema, createManualPoSchema, deriveLineTotals, formatAmount, formatQty, poListQuerySchema,
  recordReceiptSchema, updateLineSchema, updateManualLineSchema,
} from "./domain";

describe("PO line totals", () => {
  it("derives outstanding from the imported aggregate plus receipt events", () => {
    const totals = deriveLineTotals({ orderedQty: "410000", initialReceivedQty: "300000", receiptQty: "10000" });
    expect(totals.delivery).toBe("partial");
    expect(totals.received?.toString()).toBe("310000");
    expect(totals.outstanding?.toString()).toBe("100000");
  });

  it("marks a fully received line and an over-received line distinctly", () => {
    const received = deriveLineTotals({ orderedQty: "10", initialReceivedQty: "4", receiptQty: "6" });
    expect(received.delivery).toBe("received");
    expect(received.outstanding?.toString()).toBe("0");
    const over = deriveLineTotals({ orderedQty: "10", initialReceivedQty: "4", receiptQty: "7" });
    expect(over.overReceived).toBe(true);
    expect(over.outstanding?.toString()).toBe("-1");
  });

  it("never interprets a missing quantity as zero", () => {
    const totals = deriveLineTotals({ orderedQty: null, initialReceivedQty: "0", receiptQty: "5" });
    expect(totals.delivery).toBe("incomplete");
    expect(totals.received).toBeNull();
    expect(totals.outstanding).toBeNull();
    const initialMissing = deriveLineTotals({ orderedQty: "20", initialReceivedQty: null });
    expect(initialMissing.delivery).toBe("incomplete");
    expect(initialMissing.outstanding).toBeNull();
  });

  it("formats quantities and amounts without locale-dependent drift", () => {
    expect(formatQty("1207744.0000")).toBe("1,207,744");
    expect(formatQty("100.5000")).toBe("100.5");
    expect(formatQty(null)).toBe("—");
    expect(formatAmount("19981313.4")).toBe("19,981,313.40");
    expect(formatAmount(null)).toBe("—");
  });
});

describe("PO input validation", () => {
  it("accepts a well-formed receipt", () => {
    const parsed = recordReceiptSchema.safeParse({ lineId: "8b6f2b1c-5d7e-4a1b-9c3d-2f1a0e9d8c7b", receivedOn: "2026-11-10", quantity: "12.5", reference: "GR-1", note: "" });
    expect(parsed.success).toBe(true);
  });

  it("rejects zero, negative, over-precision and invalid dates", () => {
    const base = { lineId: "8b6f2b1c-5d7e-4a1b-9c3d-2f1a0e9d8c7b", receivedOn: "2026-11-10", quantity: "1", reference: "GR-1" };
    expect(recordReceiptSchema.safeParse({ ...base, quantity: "0" }).success).toBe(false);
    expect(recordReceiptSchema.safeParse({ ...base, quantity: "-1" }).success).toBe(false);
    expect(recordReceiptSchema.safeParse({ ...base, quantity: "1.23456" }).success).toBe(false);
    expect(recordReceiptSchema.safeParse({ ...base, receivedOn: "2026-02-30" }).success).toBe(false);
    expect(recordReceiptSchema.safeParse({ ...base, reference: "  " }).success).toBe(false);
  });

  it("requires a reason and a complete replacement when correcting", () => {
    const receiptId = "8b6f2b1c-5d7e-4a1b-9c3d-2f1a0e9d8c7b";
    expect(correctReceiptSchema.safeParse({ receiptId, reason: "x" }).success).toBe(false);
    expect(correctReceiptSchema.safeParse({ receiptId, reason: "นับผิด", replacement: { receivedOn: "2026-11-09", quantity: "1", reference: "GR-2" } }).success).toBe(true);
  });

  it("forbids setting both ETA date and ETA text", () => {
    const lineId = "8b6f2b1c-5d7e-4a1b-9c3d-2f1a0e9d8c7b";
    expect(updateLineSchema.safeParse({ lineId, version: "1", status: "open", etaDate: "2026-11-20", etaText: "พร้อมส่ง", note: "" }).success).toBe(false);
    expect(updateLineSchema.safeParse({ lineId, version: "1", status: "on_hold", etaDate: "", etaText: "พร้อมส่ง", note: "โทรตามแล้ว" }).success).toBe(true);
  });

  it("defaults list paging without trusting arbitrary values", () => {
    expect(poListQuerySchema.safeParse({ page: "999999999" }).success).toBe(false);
    const parsed = poListQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.q).toBe("");
  });

  it("accepts a multi-line manual PO and validates each master field", () => {
    const base = {
      poNumber: "PO-2026-001", vendorCode: "01128119", vendorName: "ผู้ขาย", orderCode: "HAM026", note: "",
      lines: [
        { materialCode: "MAT-1", description: "ท่อ", unit: "M", orderedQty: "100", unitPrice: "35.98", poReleaseDate: "2026-11-10" },
        { materialCode: "MAT-2", description: "ข้องอ", unit: "PC", orderedQty: "20", unitPrice: "12.5", poReleaseDate: "2026-11-10" },
      ],
    };
    const parsed = createManualPoSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.lines.map((line) => line.unit)).toEqual(["M", "PC"]);
    expect(createManualPoSchema.safeParse({ ...base, lines: [] }).success).toBe(false);
    const unknown = createManualPoSchema.parse({ ...base, lines: [{ ...base.lines[0], unitPrice: "" }] });
    expect(unknown.lines[0].unitPrice).toBe("");
    expect(createManualPoSchema.parse({ ...base, lines: [{ ...base.lines[0], unitPrice: "0" }] }).lines[0].unitPrice).toBe("0");
    expect(createManualPoSchema.safeParse({ ...base, lines: [{ ...base.lines[0], unitPrice: "-1" }] }).success).toBe(false);
    expect(createManualPoSchema.safeParse({ ...base, lines: [{ ...base.lines[0], orderedQty: "0" }] }).success).toBe(false);
    expect(createManualPoSchema.safeParse({ ...base, lines: [{ ...base.lines[0], unit: "KG" }] }).success).toBe(false);
  });

  it("never combines the same material across different units in one manual PO", () => {
    const result = createManualPoSchema.safeParse({
      poNumber: "PO-2026-002",
      lines: [
        { materialCode: "MAT-1", description: "ท่อ", unit: "M", orderedQty: "10", unitPrice: "1", poReleaseDate: "2026-11-10" },
        { materialCode: "MAT-1", description: "ท่อ", unit: "PC", orderedQty: "10", unitPrice: "1", poReleaseDate: "2026-11-10" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("validates the manual master-data editor and its ETA exclusivity", () => {
    const base = {
      lineId: "8b6f2b1c-5d7e-4a1b-9c3d-2f1a0e9d8c7b", version: "1", poNumber: "PO-1",
      materialCode: "MAT-1", description: "ท่อ", unit: "M", orderedQty: "100", initialReceivedQty: "0",
      unitPrice: "35.98", poReleaseDate: "2026-11-10", lastGrDate: "", etaDate: "", etaText: "",
      orderCode: "HAM026", vendorCode: "01128119", vendorName: "ผู้ขาย", status: "open", note: "",
    };
    expect(updateManualLineSchema.safeParse(base).success).toBe(true);
    expect(updateManualLineSchema.safeParse({ ...base, etaDate: "2026-12-01", etaText: "พร้อมส่ง" }).success).toBe(false);
    expect(updateManualLineSchema.safeParse({ ...base, initialReceivedQty: "-1" }).success).toBe(false);
  });
});
