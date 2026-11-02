import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ModuleNav } from "./module-nav";

const activeSection = vi.hoisted(() => ({ value: "/work" as string }));
const searchParamsMock = vi.hoisted(() => ({ value: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  usePathname: () => activeSection.value,
  useSearchParams: () => searchParamsMock.value,
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

  it("lists exactly two children: เช่าท่อร้อยสาย and พาดสายสื่อสาร", () => {
    const html = renderToStaticMarkup(<ModuleNav allowedModuleIds={["duct-rental"]} workNavigation={[]} />);
    expect(html).toContain("เช่าท่อร้อยสาย");
    expect(html).toContain("พาดสายสื่อสาร");
    expect(html).not.toContain("ต่อสัญญา");
    expect(html).not.toContain("ยกเลิกการใช้ท่อ");
    expect(html).not.toContain("ติดตามต่อสัญญาและยกเลิก");
  });

  it("activates the เช่าท่อร้อยสาย child for /duct-rental and sub-routes", () => {
    activeSection.value = "/duct-rental";
    let html = renderToStaticMarkup(<ModuleNav allowedModuleIds={["duct-rental"]} workNavigation={[]} />);
    expect(html).toContain('aria-current="page" href="/duct-rental"');

    activeSection.value = "/duct-rental/11111111-1111-1111-1111-111111111111";
    html = renderToStaticMarkup(<ModuleNav allowedModuleIds={["duct-rental"]} workNavigation={[]} />);
    expect(html).toContain('aria-current="page" href="/duct-rental"');
    expect(html).not.toContain('aria-current="page" href="/duct-rental/cancellation"');
  });

  it("activates the พาดสายสื่อสาร child for /duct-rental/communication-cable", () => {
    activeSection.value = "/duct-rental/communication-cable";
    const html = renderToStaticMarkup(<ModuleNav allowedModuleIds={["duct-rental"]} workNavigation={[]} />);
    expect(html).toContain('aria-current="page" href="/duct-rental/communication-cable"');
  });

  it("does not render renewal/cancellation/tracking as sidebar children", () => {
    const html = renderToStaticMarkup(<ModuleNav allowedModuleIds={["duct-rental"]} workNavigation={[]} />);
    expect(html).not.toContain("ต่อสัญญา");
    expect(html).not.toContain("ยกเลิกการใช้ท่อ");
    expect(html).not.toContain("ติดตามต่อสัญญาและยกเลิก");
  });
});

describe("guarantees sidebar section from registry metadata", () => {
  beforeEach(() => { activeSection.value = "/work"; });

  it("rendersภาพรวมเงินประกัน and ทีมติดตั้ง from registry navigationItems", () => {
    const html = renderToStaticMarkup(<ModuleNav allowedModuleIds={["guarantees"]} workNavigation={[]} />);
    expect(html).toContain("ภาพรวมเงินประกัน");
    expect(html).toContain("ทีมติดตั้ง");
  });

  it("activates /guarantees child on the overview route", () => {
    activeSection.value = "/guarantees";
    const html = renderToStaticMarkup(<ModuleNav allowedModuleIds={["guarantees"]} workNavigation={[]} />);
    expect(html).toContain('aria-current="page" href="/guarantees"');
    expect(html).not.toContain('aria-current="page" href="/guarantees?view=installation-team"');
  });

  it("activates ทีมติดตั้ง child when ?view=installation-team", () => {
    activeSection.value = "/guarantees";
    searchParamsMock.value = new URLSearchParams("view=installation-team");
    const html = renderToStaticMarkup(<ModuleNav allowedModuleIds={["guarantees"]} workNavigation={[]} />);
    expect(html).toContain('aria-current="page" href="/guarantees?view=installation-team"');
    expect(html).not.toContain('aria-current="page" href="/guarantees"');
  });
});

describe("buildings sidebar section from registry metadata", () => {
  beforeEach(() => { activeSection.value = "/work"; });

  it("renders ข้อมูลอาคาร and เพิ่มอาคาร from registry navigationItems", () => {
    const html = renderToStaticMarkup(<ModuleNav allowedModuleIds={["buildings"]} workNavigation={[]} />);
    expect(html).toContain("ข้อมูลอาคาร");
    expect(html).toContain("เพิ่มอาคาร");
  });

  it("keeps /buildings active for /buildings/new (parent prefix wins)", () => {
    activeSection.value = "/buildings/new";
    const html = renderToStaticMarkup(<ModuleNav allowedModuleIds={["buildings"]} workNavigation={[]} />);
    expect(html).toContain('aria-current="page" href="/buildings"');
    expect(html).not.toContain('aria-current="page" href="/buildings/new"');
  });
});

describe("car-booking sidebar section from registry metadata", () => {
  beforeEach(() => { activeSection.value = "/work"; });

  it("renders ระบบจองรถ from registry navigationItems", () => {
    const html = renderToStaticMarkup(<ModuleNav allowedModuleIds={["car-booking"]} workNavigation={[]} />);
    expect(html).toContain("ระบบจองรถ");
  });

  it("activates /car-booking child for /car-booking and sub-routes", () => {
    activeSection.value = "/car-booking";
    let html = renderToStaticMarkup(<ModuleNav allowedModuleIds={["car-booking"]} workNavigation={[]} />);
    expect(html).toContain('aria-current="page" href="/car-booking"');

    activeSection.value = "/car-booking/2025-01-01";
    html = renderToStaticMarkup(<ModuleNav allowedModuleIds={["car-booking"]} workNavigation={[]} />);
    expect(html).toContain('aria-current="page" href="/car-booking"');
  });
});

describe("collapsed and mobile accessibility", () => {
  beforeEach(() => { activeSection.value = "/work"; });

  it("hides subnav panels when collapsed (inert + aria-hidden)", () => {
    const html = renderToStaticMarkup(
      <ModuleNav allowedModuleIds={["buildings"]} collapsed={true} workNavigation={[]} />,
    );
    expect(html).toContain("aria-hidden=\"true\"");
    expect(html).toContain("inert");
  });

  it("shows subnav panels when expanded (not inert, not aria-hidden)", () => {
    activeSection.value = "/buildings";
    const html = renderToStaticMarkup(
      <ModuleNav allowedModuleIds={["buildings"]} collapsed={false} workNavigation={[]} />,
    );
    expect(html).toContain("aria-hidden=\"false\"");
    expect(html).not.toContain("inert");
  });

  it("uses mobile idPrefix in drawer rendering", () => {
    const html = renderToStaticMarkup(
      <ModuleNav idPrefix="mobile-sidebar-section" allowedModuleIds={["buildings"]} workNavigation={[]} />,
    );
    expect(html).toContain('id="mobile-sidebar-section-buildings"');
    expect(html).not.toContain('id="sidebar-section-buildings"');
  });

  it("removes the requested group captions while keeping /work/mine accessible", () => {
    const html = renderToStaticMarkup(
      <ModuleNav
        allowedModuleIds={["work", "car-booking", "buildings", "guarantees"]}
        workNavigation={[
          { href: "/work", label: "ภาพรวมงาน", icon: "work" },
          { href: "/work/mine", label: "งานของฉัน", icon: "check" },
        ]}
      />,
    );

    expect(html).not.toContain('class="sidebar-group-label">งานของฉัน</span>');
    expect(html).not.toContain('class="sidebar-group-label">การดำเนินงาน</span>');
    expect(html).not.toContain('<span class="sidebar-link-label">งานของฉัน</span>');
    expect(html).toContain('href="/work/mine"');
    expect(html).toContain('aria-label="งานของฉัน"');
    expect(html).toContain("ระบบจองรถ");
  });
});
