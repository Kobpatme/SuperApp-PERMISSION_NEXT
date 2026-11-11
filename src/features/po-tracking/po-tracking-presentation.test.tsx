import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { deriveLineTotals, type PoLineView, type PoListQuery } from "@/modules/po-tracking/domain";
import type { PoReport } from "@/modules/po-tracking/service";
import { PoTrackingList, PoTrackingReport } from "./po-tracking-list";
import { PoLineDetail } from "./po-line-detail";

vi.mock("./po-forms", () => ({
  ReceiptForm: () => <p>receipt-form</p>,
  ReceiptCorrectionForm: () => <p>correction-form</p>,
  LineControlForm: () => <p>line-control-form</p>,
  ManualLineForm: () => <p>manual-line-form</p>,
}));

function line(overrides: Partial<PoLineView> & { id: string; poNumber: string; materialCode: string }): PoLineView {
  const { id, poNumber, materialCode, ...rest } = overrides;
  const totals = deriveLineTotals({
    orderedQty: overrides.orderedQty !== undefined ? overrides.orderedQty : "10",
    initialReceivedQty: overrides.initialReceivedQty !== undefined ? overrides.initialReceivedQty : "4",
    receiptQty: overrides.receiptQty !== undefined ? overrides.receiptQty : "0",
  });
  return {
    id, origin: "import", poNumber, materialCode, description: "Test material", unit: "PC", orderedQty: "10",
    initialReceivedQty: "4", receiptQty: "0", receiptCount: 0, unitPrice: "100", poAmount: "1000",
    sourceOutstandingQty: "6", poReleaseDate: "2026-10-01", lastGrDate: null, etaDate: null, etaText: null,
    orderCode: "HAM026", vendorCode: "999", vendorName: "ทดสอบผู้ขาย", status: "open", note: "", version: 1,
    sourceId: "PO 26-10-26!3", ...rest, totals,
  };
}

const query: PoListQuery = { q: "", unit: "", status: "", delivery: "", order: "", page: 1 };
const rows = [
  line({ id: "line-1", poNumber: "4032500121", materialCode: "U02CFARSS-0012-BE0", etaDate: "2026-10-20" }),
  line({ id: "line-2", poNumber: "4032500179", materialCode: "U02LCULU-0003-DXS", orderedQty: null, initialReceivedQty: null, receiptQty: "0" }),
];

const report: PoReport = {
  priceVisible: true, canViewImport: true,
  counts: { lines: 237, incompleteLines: 125, pendingLines: 20, partialLines: 10, receivedLines: 82, overdueLines: 3, openLines: 230, onHoldLines: 5, closedLines: 2 },
  units: [
    { unit: "M", lines: 16, incompleteLines: 11, ordered: "1206000", initialReceived: "692000", receiptQty: "0", outstanding: "514000", amount: "15813300.00" },
    { unit: "PC", lines: 164, incompleteLines: 60, ordered: "1562", initialReceived: "744", receiptQty: "2", outstanding: "816", amount: "3829213.40" },
  ],
  importRun: { snapshot: "d4f9057e4ecbdbeaf7eb80fe8921c9f3", status: "reconciled", sourceCount: 237, importedCount: 237, anomalyCount: 208, finishedAt: "2026-11-10T05:00:00.000Z" },
};

describe("PO tracking presentation", () => {
  it("renders the PO list with outstanding, incomplete labels and no price column without the price grant", () => {
    const html = renderToStaticMarkup(<PoTrackingList data={{ rows, total: 237, page: 1, pageSize: 50, priceVisible: false, query, orders: ["HAM026"] }} report={report} today="2026-11-10" />);
    expect(html).toContain("4032500121");
    expect(html).toContain("U02CFARSS-0012-BE0");
    expect(html).toContain("ข้อมูลจำนวนไม่ครบ");
    expect(html).toContain("ไม่ทราบ");
    expect(html).not.toContain('<th scope="col" class="po-num">มูลค่า PO</th>');
    expect(html).not.toContain("1,000.00");
    expect(html).toContain("ถัดไป");
    expect(html).toContain("เลย ETA");
    expect(html).toContain("HAM026");
  });

  it("shows amounts only when price is visible", () => {
    const html = renderToStaticMarkup(<PoTrackingList data={{ rows, total: 2, page: 1, pageSize: 50, priceVisible: true, query, orders: [] }} report={null} today="2026-11-10" />);
    expect(html).toContain('<th scope="col" class="po-num">มูลค่า PO</th>');
    expect(html).toContain("1,000.00");
  });

  it("offers manual PO creation only when the manager has the price grant", () => {
    const withCreate = renderToStaticMarkup(<PoTrackingList data={{ rows, total: 2, page: 1, pageSize: 50, priceVisible: true, query, orders: [] }} report={null} today="2026-11-10" canManage />);
    expect(withCreate).toContain("สร้าง PO ใหม่");
    expect(withCreate).toContain('href="/po-tracking/new"');
    const withoutCreate = renderToStaticMarkup(<PoTrackingList data={{ rows, total: 2, page: 1, pageSize: 50, priceVisible: true, query, orders: [] }} report={null} today="2026-11-10" canManage={false} />);
    expect(withoutCreate).not.toContain("สร้าง PO ใหม่");
    const manual = line({ id: "line-3", poNumber: "PO-MANUAL-1", materialCode: "MANUAL-1", origin: "manual", sourceId: null });
    const manualHtml = renderToStaticMarkup(<PoTrackingList data={{ rows: [manual], total: 1, page: 1, pageSize: 50, priceVisible: true, query, orders: [] }} report={null} today="2026-11-10" />);
    expect(manualHtml).toContain("สร้างใหม่ในระบบ");
  });

  it("renders the report per unit and the reconciliation import summary", () => {
    const html = renderToStaticMarkup(<PoTrackingReport report={report} />);
    expect(html).toContain("ยอดตามหน่วยนับ");
    expect(html).toContain("1,206,000");
    expect(html).toContain("reconciled");
    expect(html).toContain("237");
    expect(html).toContain("แยกยอดตามหน่วย");
    const withoutImport = renderToStaticMarkup(<PoTrackingReport report={{ ...report, canViewImport: false, importRun: null }} />);
    expect(withoutImport).not.toContain("สถานะการนำเข้า");
    expect(withoutImport).toContain("ยอดตามหน่วยนับ");
  });

  it("renders detail facts and receipt history including voided corrections", () => {
    const html = renderToStaticMarkup(<PoLineDetail
      line={{ ...rows[0], importSnapshot: "d4f9057e4ecbdbeaf7eb80fe8921c9f3" }}
      importRun={{ snapshot: "d4f9057e4ecbdbeaf7eb80fe8921c9f3", finishedAt: "2026-11-10T05:00:00.000Z", sourceCount: 237, importedCount: 237 }}
      priceVisible={false} canRecord canCorrect canManage
      receipts={[
        { id: "r1", receivedOn: "2026-11-01", quantity: "3", reference: "GR-1", note: "", recordedByName: "ผู้บันทึก", replacesReceiptId: null, voidedAt: "2026-11-02T00:00:00.000Z", voidedByName: "ผู้ตรวจ", voidReason: "นับผิด" },
        { id: "r2", receivedOn: "2026-11-01", quantity: "2", reference: "GR-1FIX", note: "แก้ยอด", recordedByName: "ผู้บันทึก", replacesReceiptId: "r1", voidedAt: null, voidedByName: null, voidReason: null },
      ]} />);
    expect(html).toContain("ประวัติการรับของ");
    expect(html).toContain("ยกเลิกแล้ว");
    expect(html).toContain("นับผิด");
    expect(html).toContain("แทนรายการก่อนหน้า");
    expect(html).not.toContain("ราคาต่อหน่วย");
    expect(html).toContain("คงค้าง");
  });
});
