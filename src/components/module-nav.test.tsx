import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ModuleNav } from "./module-nav";

const activeSection = vi.hoisted(() => ({ value: "/work" as string }));
vi.mock("next/navigation", () => ({
  usePathname: () => activeSection.value,
  useSearchParams: () => new URLSearchParams(),
}));

describe("ModuleNav accordion", () => {
  it("uses the module row as the disclosure control without a separate arrow button", () => {
    const html = renderToStaticMarkup(
      <ModuleNav
        allowedModuleIds={["work", "guarantees"]}
        workNavigation={[{ href: "/work", label: "ภาพรวมงาน", icon: "work" }]}
      />,
    );

    expect(html).not.toContain("sidebar-section-toggle");
    expect(html).toContain('aria-controls="sidebar-section-work"');
    expect(html).toContain('aria-expanded="true"');
  });

  it("opens only the module for the current route", () => {
    const html = renderToStaticMarkup(
      <ModuleNav
        allowedModuleIds={["work", "guarantees"]}
        workNavigation={[{ href: "/work", label: "ภาพรวมงาน", icon: "work" }]}
      />,
    );

    expect(html.match(/aria-expanded="true"/g)).toHaveLength(1);
    expect(html).toContain('id="sidebar-section-guarantees"');
    expect(html).toContain('id="sidebar-section-guarantees" aria-hidden="true"');
  });

  it("uses a distinct id namespace when rendered in the mobile drawer", () => {
    const html = renderToStaticMarkup(
      <ModuleNav
        idPrefix="mobile-sidebar-section"
        allowedModuleIds={["work"]}
        workNavigation={[{ href: "/work", label: "ภาพรวมงาน", icon: "work" }]}
      />,
    );

    expect(html).toContain('aria-controls="mobile-sidebar-section-work"');
    expect(html).toContain('id="mobile-sidebar-section-work"');
    expect(html).not.toContain('id="sidebar-section-work"');
  });
});

describe("duct-rental sidebar section", () => {
  beforeEach(() => { activeSection.value = "/work"; });

  it("lists cancellation and tracking alongside renewal and cable", () => {
    const html = renderToStaticMarkup(<ModuleNav allowedModuleIds={["duct-rental"]} workNavigation={[]} />);
    expect(html).toContain("เช่าท่อร้อยสาย");
    expect(html).toContain("ต่อสัญญา");
    expect(html).toContain("ยกเลิกการใช้ท่อ");
    expect(html).toContain("ติดตามต่อสัญญาและยกเลิก");
    expect(html).toContain("พาดสายสื่อสาร");
  });

  it("activates the cancellation child for cancellation/new and cancellation/[id]", () => {
    activeSection.value = "/duct-rental/cancellation/new";
    let html = renderToStaticMarkup(<ModuleNav allowedModuleIds={["duct-rental"]} workNavigation={[]} />);
    expect(html).toContain('aria-current="page" href="/duct-rental/cancellation"');
    activeSection.value = "/duct-rental/cancellation/cancel-123";
    html = renderToStaticMarkup(<ModuleNav allowedModuleIds={["duct-rental"]} workNavigation={[]} />);
    expect(html).toContain('aria-current="page" href="/duct-rental/cancellation"');
  });

  it("activates the tracking child for /duct-rental/tracking with query params", () => {
    activeSection.value = "/duct-rental/tracking";
    const html = renderToStaticMarkup(<ModuleNav allowedModuleIds={["duct-rental"]} workNavigation={[]} />);
    expect(html).toContain('aria-current="page" href="/duct-rental/tracking"');
  });

  it("keeps the renewal child active for renewal detail", () => {
    activeSection.value = "/duct-rental/renewal/renewal-1";
    const html = renderToStaticMarkup(<ModuleNav allowedModuleIds={["duct-rental"]} workNavigation={[]} />);
    expect(html).toContain('aria-current="page" href="/duct-rental/renewal"');
  });

  it("keeps the request list active and cancellation inactive on the request detail side path", () => {
    activeSection.value = "/duct-rental/11111111-1111-1111-1111-111111111111";
    const html = renderToStaticMarkup(<ModuleNav allowedModuleIds={["duct-rental"]} workNavigation={[]} />);
    expect(html).toContain('aria-current="page" href="/duct-rental"');
    expect(html).not.toContain('aria-current="page" href="/duct-rental/cancellation"');
  });
});
