import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ManualPoForm } from "./po-forms";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {}, refresh: () => {} }) }));
vi.mock("@/app/(platform)/po-tracking/actions", () => ({
  createManualPoAction: async () => ({ ok: false, message: "" }),
  updateManualLineAction: async () => ({ ok: false, message: "" }),
  correctReceiptAction: async () => ({ ok: false, message: "" }),
  recordReceiptAction: async () => ({ ok: false, message: "" }),
  updateLineAction: async () => ({ ok: false, message: "" }),
}));

describe("manual PO form", () => {
  it("renders editable multi-line inputs without leaving the app", () => {
    const html = renderToStaticMarkup(<ManualPoForm />);
    expect(html).toContain("เลขที่ PO");
    expect(html).toContain("รายการที่ 1");
    expect(html).toContain('name="line-0-materialCode"');
    expect(html).toContain('name="line-0-orderedQty"');
    expect(html).toContain('name="line-0-unitPrice"');
    expect(html).toContain("เพิ่มอีกรายการ");
    expect(html).toContain("สร้าง PO");
    expect(html).toContain("ไม่รวมข้ามหน่วย");
  });
});
