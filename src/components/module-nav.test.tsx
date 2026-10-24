import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ModuleNav } from "./module-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/work",
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
