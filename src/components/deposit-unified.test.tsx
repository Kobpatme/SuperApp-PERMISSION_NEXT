import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { DepositEditor } from "./deposit-editor";
import { DepositTlWorkspace } from "./deposit-tl-workspace";
import { availableDepositTransitions, depositStatuses } from "@/lib/deposit-v2-workflow";
import { workflowLabels } from "@/lib/deposit-v2-domain";
vi.mock("next/link", () => ({ default: ({ children, ...props }: { children: ReactNode }) => <a {...props}>{children}</a> }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/app/(platform)/guarantees/actions", () => ({ saveDepositWorkItem: vi.fn(), transitionDepositWorkItem: vi.fn() }));
const item = { id: "TEST-item", version: 7, status: "new", place: "TEST อาคาร", area: "CMI", deposit: "1234.50", demolish: "2000.25", fee: "10.75", other: "0", tlAssigneeId: "TEST-user", depReturn: "No", demoReturn: "No" };
describe("Guarantees unified presentation contracts", () => {
  it("retains exact monetary strings, identity, version, and named server inputs", () => {
    const html = renderToStaticMarkup(<DepositEditor item={item} />);
    for (const value of ["1234.50", "2000.25", "10.75"]) expect(html).toContain(`value="${value}"`);
    for (const name of ["id", "version", "area", "tl_team", "tlAssigneeId", "inspected_by", "depReturn", "demoReturn", "dateReq", "dateDue", "service_cancel_date", "other_desc"]) expect(html).toContain(`name="${name}"`);
    expect(html).toContain('name="version" value="7"');
    expect(html).toContain("ui-button"); expect(html).toContain("ข้อมูลรายการเงินประกัน");
  });
  for (const status of depositStatuses) it(`${status}: keeps exactly the existing policy's offered transition labels`, () => {
    const html = renderToStaticMarkup(<DepositEditor item={{ ...item, status }} />);
    const expected = availableDepositTransitions(status);
    for (const target of expected) expect(html).toContain(target === "Cancel" ? "ยกเลิกรายการ" : `ไปขั้นตอน ${workflowLabels[target] || target}`);
    if (!expected.length) expect(html).toContain("ไม่มีขั้นตอนที่ต้องดำเนินการ");
    expect(html).toContain("ยืนยันขั้นตอนเงินประกัน");
  });
  it("keeps assigned-TL composition limited to its two evidence kinds", () => {
    const html = renderToStaticMarkup(<DepositTlWorkspace item={{ ...item, status: "tl" }} />);
    expect(html).toContain("เลือกหลักฐานงานทีมติดตั้ง"); expect(html).toContain("เลือกเอกสารทีมติดตั้งเพิ่มเติม");
    expect(html).not.toContain('name="deposit"'); expect(html).not.toContain("เลือกหลักฐานการจ่าย");
    expect(html).toContain("รับงาน"); expect(html).toContain("ส่งกลับก่อนรับ");
  });
});
