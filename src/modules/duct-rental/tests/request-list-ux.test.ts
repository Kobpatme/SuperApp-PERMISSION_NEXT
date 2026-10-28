import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/modules/duct-rental/components/use-resource", () => ({ useResource: () => ({ data: { rows: [], counts: { total: 0, pending: 0, active: 0 }, queues: { waiting: 0, missing: 0 }, pipeline: [], nextOffset: null }, error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() }) }));
import { RequestListWorkspace } from "../components/request-list";

describe("Duct Rental request-list production composition", () => {
  it("renders the real workspace surface, filters, table, tracking summary, and allowed actions", () => {
    const html = renderToStaticMarkup(createElement(RequestListWorkspace, { permissions: ["duct_rental.request.create", "duct_rental.settings.manage"], userId: "user-1" }));
    expect(html.match(/<h1/g)?.length).toBe(1);
    expect(html).toContain("เช่าท่อร้อยสาย");
    expect(html).toContain('role="search"');
    expect(html).toContain("คำขอเช่าท่อร้อยสาย");
    expect(html).toContain("สร้างคำขอ");
    expect(html).toContain("ตั้งค่าผู้ประสานงาน");
    expect(html).toContain("ติดตามกระบวนการ");
    expect(html).toContain("ไม่พบคำขอที่ตรงเงื่อนไข");
  });

  it("preserves the denied-role control surface in the real production component", () => {
    const html = renderToStaticMarkup(createElement(RequestListWorkspace, { permissions: [], userId: "user-1" }));
    expect(html).toContain("เช่าท่อร้อยสาย");
    expect(html).not.toContain("สร้างคำขอ</a>");
    expect(html).not.toContain("ตั้งค่าผู้ประสานงาน");
  });
});