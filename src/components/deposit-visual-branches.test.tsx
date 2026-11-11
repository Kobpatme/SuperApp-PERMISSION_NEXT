import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { GuaranteeExecutiveDashboard } from "@/components/guarantee-executive-dashboard";
import { DepositEditor } from "@/components/deposit-editor";
import { DepositTlWorkspace } from "@/components/deposit-tl-workspace";
import DepositDetailPage from "@/app/(platform)/guarantees/[id]/page";
import type { DepositItem } from "@/lib/deposit-v2-domain";

vi.mock("next/link", () => ({ default: ({ href, children, ...props }: { href: string; children: ReactNode }) => <a href={href} {...props}>{children}</a> }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }), notFound: vi.fn() }));
vi.mock("@/lib/access", () => ({ getAccessContext: vi.fn(async () => ({ allowed: true, subject: { id: "viewer" } })) }));
vi.mock("@/lib/authorization", () => ({ isAuthorized: vi.fn(() => false) }));
vi.mock("@/lib/deposit-v2-server", () => ({
  getDepositWorkItem: vi.fn(async () => ({ id: "00000000-0000-4000-8000-000000000001", version: 3, status: "new", place: "อาคารทดสอบ", area: "BKK 1", cid: "CID-1", deposit: "1000", demolish: "500", fee: "50", other: "0" })),
  getDepositWorkEvents: vi.fn(async () => []),
  canWorkAsAssignedTl: vi.fn(() => false),
  listTlAssignees: vi.fn(async () => []),
}));
vi.mock("@/app/(platform)/guarantees/actions", () => ({
  saveDepositWorkItem: vi.fn(),
  transitionDepositWorkItem: vi.fn(),
}));
vi.mock("@/components/deposit-evidence-upload", () => ({
  DepositEvidenceUpload: ({ kind }: { kind: string }) => <div className="deposit-evidence" data-kind={kind}>หลักฐาน</div>,
}));

const item = {
  id: "00000000-0000-4000-8000-000000000001", version: 3, status: "tl", place: "อาคารทดสอบ", area: "BKK 1", cid: "CID-1", tl_team: "ทีมติดตั้ง BKK 1",
  deposit: "1000", demolish: "500", fee: "50", other: "0",
} as DepositItem & { id: string; version: number };

const reportItem = { id: item.id, status: "new", place: "อาคารทดสอบ", area: "BKK 1", owner: "ผู้รับผิดชอบ", deposit: "1000", demolish: "500", fee: "50", other: "0", dateReq: "2026-01-15" } as DepositItem;

describe("guarantees visual branches", () => {
  it("renders the real detail editor branch with module-scoped panels and form", () => {
    const html = renderToStaticMarkup(<DepositEditor item={item} />);
    expect(html).toContain("deposit-detail deposit-module-page");
    expect(html).toContain("ข้อมูลรายการ");
    expect(html).toContain("deposit-form");
    expect(html).toContain("deposit-evidence");
    expect(html).toContain("ประวัติการทำงาน");
  });

  it("renders the new-item branch without introducing a second navigation heading", () => {
    const html = renderToStaticMarkup(<DepositEditor />);
    expect(html).toContain("deposit-module-page");
    expect(html).toContain("สร้างรายการเงินประกัน");
    expect(html).toContain("สร้างรายการ");
    expect((html.match(/<h1/g) || []).length).toBe(1);
  });

  it("create page drops the visible duplicate section heading but keeps its accessible name, help text, and form legend", () => {
    const html = renderToStaticMarkup(<DepositEditor />);
    expect(html).not.toContain('<h2>ข้อมูลรายการ</h2>');
    expect(html).toContain("ข้อมูลรายการ"); // visually-hidden heading remains for assistive technology
    expect(html).toContain("ข้อมูลอาคารและผู้ประสานงาน · ช่อง * จำเป็นต้องระบุ");
    expect(html).toContain("ข้อมูลรายการเงินประกัน"); // fieldset legend unchanged
    expect(html).toContain("สร้างรายการเงินประกัน"); // page title from PageHeader
    expect((html.match(/<h1/g) || []).length).toBe(1);
  });

  it("edit page keeps the visible section heading and unchanged create/edit payload inputs", () => {
    const html = renderToStaticMarkup(<DepositEditor item={item} />);
    expect(html).toMatch(/<h2\b[^>]*>ข้อมูลรายการ<\/h2>/); // heading ยังคงแสดงในหน้าแก้ไข (มี id ผูกกับ aria-labelledby แล้ว)
    expect(html).toContain("ข้อมูลอาคารและผู้ประสานงาน · ช่อง * จำเป็นต้องระบุ");
    expect(html).toContain('name="id"');
    expect(html).toContain('name="version"');
  });

  it("ถามเชิงถดถอย: section deposit-panel ต้องเชื่อม heading ข้อมูลรายการ ด้วย id เสถียร + aria-labelledby ทั้ง create (ซ่อน) และ edit (แสดง)", () => {
    const linkOf = (html: string) => {
      const section = html.match(/<section\b([^>]*\bclass="deposit-panel"[^>]*)>([\s\S]*?)<\/section>/);
      expect(section, "ต้องมี <section class='deposit-panel'>").not.toBeNull();
      const openAttrs = section![1];
      const inner = section![2];
      const aria = openAttrs.match(/\baria-labelledby="([^"]+)"/);
      const h2 = inner.match(/<h2\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/);
      const h2Full = h2?.[0] ?? "";
      return {
        ariaId: aria?.[1] ?? null,
        headingId: h2?.[1] ?? null,
        headingText: h2?.[2] ?? "",
        headingClass: h2Full.match(/class="([^"]*)"/)?.[1] ?? null,
      };
    };

    const create = linkOf(renderToStaticMarkup(<DepositEditor />));
    expect(create.ariaId).not.toBeNull();
    expect(create.headingId).not.toBeNull();
    expect(create.headingId).toBe(create.ariaId); // id ตรงกับ aria-labelledby จริง ไม่ใช่แค่มีข้อความ
    expect(create.headingText).toContain("ข้อมูลรายการ");
    expect(create.headingClass).toContain("sr-only"); // create: ซ่อนทางสายตา แต่อ่านได้โดยเทคโนโลยีช่วยเหลือ

    const edit = linkOf(renderToStaticMarkup(<DepositEditor item={item} />));
    expect(edit.ariaId).not.toBeNull();
    expect(edit.headingId).not.toBeNull();
    expect(edit.headingId).toBe(edit.ariaId);
    expect(edit.headingText).toContain("ข้อมูลรายการ");
    expect(edit.headingClass ?? "").not.toContain("sr-only"); // edit: แสดงหัวข้อตามปกติ ไม่มี sr-only ปกปิด
  });

  it("renders the server readonly detail branch with finance, evidence and history", async () => {
    const element = await DepositDetailPage({ params: Promise.resolve({ id: item.id }) });
    const html = renderToStaticMarkup(element);
    expect(html).toContain("deposit-module-page legacy-detail");
    expect(html).toContain("ข้อมูลหลัก");
    expect(html).toContain("ข้อมูลสรุปค่าใช้จ่าย");
    expect(html).toContain("ไฟล์แนบทั้งหมดของงาน");
    expect(html).toContain("ยังไม่มีประวัติ");
  });

  it("renders the assigned TL branch with evidence and workflow actions", () => {
    const html = renderToStaticMarkup(<DepositTlWorkspace item={item} />);
    expect(html).toContain("deposit-tl-page");
    expect(html).toContain("หลักฐานงานทีมติดตั้ง");
    expect(html).toContain("รับงาน");
    expect(html).toContain("data-kind=\"pdf_tl_work\"");
  });

  it("renders executive data, including empty and not-ready contracts", () => {
    const html = renderToStaticMarkup(<GuaranteeExecutiveDashboard items={[reportItem]} generatedAt="2026-01-20T12:00:00.000Z" truncated={false} ready preview={false} />);
    expect(html).toContain("guarantee-report");
    expect(html).toContain("รายงานเพื่อการบริหาร");
    expect(html).not.toContain("<h2>ภาพรวมเงินประกันอาคาร</h2>");
    expect(html).toContain("เงินประกันคงค้าง");
    expect(html).toContain("สูงสุด 500 รายการล่าสุดที่ผ่านสิทธิ์");
    expect(html).toContain("ส่งออก CSV รายงานปัจจุบัน");
    expect(html).toContain("เงิน On Service ตามปกติ");
    expect(html).toContain("คิวที่ต้องดำเนินการ");
    const empty = renderToStaticMarkup(<GuaranteeExecutiveDashboard items={[]} generatedAt="2026-01-20T12:00:00.000Z" truncated={false} ready preview={false} />);
    expect(empty).toContain("ไม่มีข้อมูลในขอบเขตที่เลือก");
    const unavailable = renderToStaticMarkup(<GuaranteeExecutiveDashboard items={[]} generatedAt="2026-01-20T12:00:00.000Z" truncated={false} ready={false} preview={false} />);
    expect(unavailable).toContain("ข้อมูลยังไม่พร้อม");
  });

  it("labels report generation and source-record timestamps separately", () => {
    const html = renderToStaticMarkup(<GuaranteeExecutiveDashboard items={[{
      ...reportItem, updatedAt: "2026-09-28T10:27:00.000Z",
    }]} generatedAt="2026-10-28T02:34:00.000Z" truncated={false} ready preview={false} />);
    expect(html).toContain("รายงานสร้างเมื่อ");
    expect(html).toContain("ข้อมูลรายการอัปเดตล่าสุด");
    expect(html).toContain("พิมพ์ / บันทึก PDF");
    expect(html).toContain("ส่งออก CSV รายงานปัจจุบัน");
  });

  it("renders table and detail loading contracts with the guarantees scope", () => {
    const table = renderToStaticMarkup(<PageSkeleton shape="table" className="deposit-loading" />);
    const detail = renderToStaticMarkup(<PageSkeleton shape="detail" className="deposit-loading" />);
    expect(table).toContain("skeleton-table deposit-loading");
    expect(detail).toContain("skeleton-detail deposit-loading");
    expect(table).toContain("role=\"status\"");
  });
});
