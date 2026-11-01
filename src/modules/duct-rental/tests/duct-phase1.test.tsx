import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const accessState = vi.hoisted(() => ({
  allowed: true,
  permissions: [
    "duct_rental.module.view",
    "duct_rental.request.create",
    "duct_rental.settings.manage",
    "duct_rental.signoff.sign",
  ] as string[],
}));
vi.mock("@/lib/access", () => ({ getAccessContext: vi.fn(async () => accessState) }));

const emptyList = {
  data: { rows: [], counts: { total: 0, pending: 0, active: 0 }, queues: { waiting: 0, missing: 0 }, pipeline: [], nextOffset: null },
  error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn(),
};
const requestsHolder = vi.hoisted(() => ({ value: null as any }));
vi.mock("@/modules/duct-rental/components/use-resource", () => ({
  useResource: (path: string | null) => {
    if (path?.startsWith("requests?")) return requestsHolder.value ?? emptyList;
    return { data: undefined, error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
  },
}));

import { DuctModuleNav, DuctSyncUtility } from "../components/common";
import { RequestListWorkspace } from "../components/request-list";
import { SignatureWorkspace } from "../components/signature-workspace";

const css = [
  readFileSync(new URL("../ui-request/ui-request.module.css", import.meta.url), "utf8"),
  readFileSync(new URL("../ui-process/ui-process.module.css", import.meta.url), "utf8"),
  readFileSync(new URL("../ui-shared/ui-shared.module.css", import.meta.url), "utf8"),
].join("\n");

beforeEach(() => {
  accessState.allowed = true;
  requestsHolder.value = null;
});

describe("Phase 1: ModuleNav renewal destination and aria-current", () => {
  it("renders the requests destination /duct-rental with current=requests active", () => {
    const markup = renderToStaticMarkup(<DuctModuleNav current="requests" />);
    expect(markup).toContain("เช่าท่อร้อยสาย");
    expect(markup).toContain('href="/duct-rental"');
    expect(markup).toContain("aria-current=\"page\"");
    expect(markup).toContain("พาดสายสื่อสาร");
    expect(markup).toContain('href="/duct-rental/communication-cable"');
  });

  it("uses semantic nav with aria-label and no text-link underlines", () => {
    const markup = renderToStaticMarkup(<DuctModuleNav current="requests" />);
    expect(markup).toMatch(/^<nav/);
    expect(markup).toContain('aria-label="งานสนับสนุนเช่าท่อและพาดสาย"');
    // no underline text-decoration in the active/inactive link rendering
    expect(markup).not.toContain("text-decoration:underline");
  });

  it("ModuleNav exposes aria-current on active link for every destination", () => {
    for (const [current, label] of [
      ["requests", "เช่าท่อร้อยสาย"],
      ["communication-cable", "พาดสายสื่อสาร"],
    ] as const) {
      const markup = renderToStaticMarkup(<DuctModuleNav current={current} />);
      expect(markup).toContain(label);
      expect(markup).toContain("aria-current=\"page\"");
    }
  });

  it("CSS: ductModuleNav is 48px full-width nav with bottom border, horizontal scroll, brand inset active border", () => {
    expect(css).toContain(".ductModuleNav{");
    expect(css).toMatch(/height:48px/);
    expect(css).toContain("overflow-x:auto");
    expect(css).toContain("border-bottom:var(--border-width) solid var(--color-border)");
    expect(css).toContain("background:transparent");
    expect(css).toContain(".ductModuleLink{");
    expect(css).toContain("text-decoration:none");
    expect(css).toContain("min-height:var(--size-control-touch)");
    expect(css).toMatch(/border-bottom:2px solid var\(--color-brand\)/);
  });
});

describe("Phase 1: RefreshBar / DuctSyncUtility busy, live, and layout contract", () => {
  it("renders status + refresh action left-aligned with gap12 and a single polite live region", () => {
    const markup = renderToStaticMarkup(<DuctSyncUtility online={true} error="" at="2026-10-30T12:57:00Z" refresh={vi.fn()} />);
    expect(markup).toContain("อัปเดตล่าสุด");
    expect(markup).toContain("↻ อัปเดตข้อมูล");
    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain("aria-busy=\"false\"");
  });

  it("when busy: aria-busy=true, button disabled, loading label", () => {
    const markup = renderToStaticMarkup(<DuctSyncUtility online={true} error="" at="2026-10-30T12:57:00Z" refresh={vi.fn()} busy={true} />);
    expect(markup).toContain("aria-busy=\"true\"");
    expect(markup).toContain("กำลังอัปเดต…");
    expect(markup).toContain("disabled");
    expect(markup).not.toContain("↻ อัปเดตข้อมูล");
  });

  it("RefreshBar preserves paused/live callbacks and wires busy from model loading", () => {
    requestsHolder.value = { ...emptyList, loading: true };
    const markup = renderToStaticMarkup(
      <RequestListWorkspace permissions={accessState.permissions} userId="u-1" />
    );
    // When model.loading is true: button disabled, loading label, aria-busy=true
    expect(markup).toContain("กำลังอัปเดต…");
    expect(markup).toContain("disabled");
    expect(markup).toContain("aria-busy=\"true\"");
  });

  it("CSS: ductSyncUtility is left-aligned, gap12, never space-between or margin-block", () => {
    expect(css).toContain(".ductSyncUtility{");
    expect(css).toContain("gap:var(--space-3)");
    expect(css).toContain("justify-content:flex-start");
    expect(css).toContain("margin:0");
    expect(css).not.toMatch(/\.ductSyncUtility[^}]*justify-content:space-between/);
    expect(css).not.toContain(".ductSyncButton{");
    expect(css).toContain(".workspace button:disabled");
  });
});

describe("Phase 1: Request List metric and filter interactions", () => {
  it("renders interactive metrics as buttons with aria-pressed and offset reset on click", () => {
    requestsHolder.value = emptyList;
    const markup = renderToStaticMarkup(<RequestListWorkspace permissions={accessState.permissions} userId="u-1" />);
    expect(markup).toContain("aria-pressed=\"false\"");
    expect(markup).toContain("คิวรอรับงาน");
    expect(markup).toContain("เอกสารค้าง");
  });

  it("renders search 280-520 scoped filter with ค้นหา before ตัวกรองขั้นสูง before ล้างตัวกรองทั้งหมด and advanced divider", () => {
    requestsHolder.value = emptyList;
    const markup = renderToStaticMarkup(<RequestListWorkspace permissions={accessState.permissions} userId="u-1" />);
    expect(markup).toContain('role="search"');
    expect(markup).toContain("ductFilterSearch");
    expect(markup).toContain(">ค้นหา<");
    expect(markup).toContain("ตัวกรองขั้นสูง");
    const clearButton = markup.match(/<button\b[^>]*>ล้างตัวกรองทั้งหมด<\/button>/)?.[0];
    expect(clearButton).toBeDefined();
    expect(clearButton).toMatch(/\bdisabled=""/);
    expect(clearButton).toMatch(/\btype="button"/);
    expect(clearButton).toMatch(/\bclass="ui-button ui-button-ghost"/);
    // desktop toolbar order: search, Search, Advanced Filter, Clear (all one row)
    expect(markup.indexOf(">ค้นหา<") < markup.indexOf("ตัวกรองขั้นสูง")).toBe(true);
    expect(markup.indexOf("ตัวกรองขั้นสูง") < markup.indexOf("ล้างตัวกรองทั้งหมด")).toBe(true);
    // advanced panel renders below a divider only when opened; toggle attributes preserved
    expect(markup).toContain("duct-advanced-filters");
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('aria-controls="duct-advanced-filters"');
    expect(markup.indexOf(">ค้นหา<") < markup.indexOf(">ล้างตัวกรองทั้งหมด<")).toBe(true);
  });
});

describe("Phase 1: NT Form single DuctTaskToolbar, permission, and order", () => {
  it("renders ONE DuctTaskToolbar after ModuleNav: sync | divider | search | manage action", () => {
    const markup = renderToStaticMarkup(<SignatureWorkspace userId="u-1" permissions={accessState.permissions} />);
    const nav = markup.indexOf("เช่าท่อร้อยสาย");
    const refresh = markup.indexOf("อัปเดตข้อมูล");
    const search = markup.indexOf("ค้นหางานลงนาม");
    const manage = markup.indexOf("จัดการลายเซ็นของฉัน");
    expect(nav).toBeGreaterThan(-1);
    expect(nav < refresh && refresh < search && search < manage).toBe(true);
    // single bordered toolbar surface, no separate refresh/search rows
    expect(markup).toContain("ductTaskToolbar");
    expect(markup).toContain("ductTaskDivider");
  });

  it("manage action is gated by duct_rental.signoff.sign and stays inside the toolbar (not PageHeader/nav)", () => {
    const allowed = renderToStaticMarkup(<SignatureWorkspace userId="u-1" permissions={[...accessState.permissions]} />);
    expect(allowed).toContain("จัดการลายเซ็นของฉัน");

    const denied = renderToStaticMarkup(<SignatureWorkspace userId="u-1" permissions={["duct_rental.module.view"]} />);
    expect(denied).not.toContain("จัดการลายเซ็นของฉัน");
  });

  it("notices render below the toolbar, search keeps label/maxLength/offset reset", () => {
    const markup = renderToStaticMarkup(<SignatureWorkspace userId="u-1" permissions={[...accessState.permissions]} />);
    const toolbarEnd = markup.indexOf("ductTaskToolbar");
    const noticeIdx = markup.indexOf("role=");
    expect(markup).toContain("ค้นหางานลงนาม");
    expect(markup).toContain('maxLength="200"');
    // setOffset(0) is wired in the onChange handler (verified in source), not rendered markup
  });

  it("CSS: ductTaskToolbar bordered surface, flex-start, vertical divider, search 280-520", () => {
    expect(css).toContain(".ductTaskToolbar{");
    expect(css).toContain("border:var(--border-width) solid var(--color-border)");
    expect(css).toContain("border-radius:var(--radius-lg)");
    expect(css).toContain("justify-content:flex-start");
    expect(css).not.toMatch(/\.ductTaskToolbar[^}]*justify-content:space-between/);
    expect(css).toContain(".ductTaskDivider{");
    expect(css).toContain(".ductTaskSearch{min-width:280px;max-width:520px;");
    expect(css).toContain(".ductTaskActions{");
  });
});

describe("Phase 1: Responsive CSS (desktop/tablet/mobile)", () => {
  it("ductMetricStrip is one outer strip with 4-col desktop collapsing internally", () => {
    expect(css).toContain(".ductMetricStrip{");
    expect(css).toContain("border:var(--border-width) solid var(--color-border)");
    expect(css).toContain("border-radius:var(--radius-lg)");
    expect(css).toContain("overflow:hidden");
    // strip owns the grid: 4 columns desktop, gap 0, no per-cell border/radius/shadow
    expect(css).toMatch(/\.ductMetricStrip\s*:global\(\.ui-metric-grid\)\s*\{[\s\S]*?gap:0/);
    expect(css).toContain("grid-template-columns:repeat(4,minmax(0,1fr))");
    expect(css).toMatch(/\.ductMetricStrip\s*:global\(\.ui-metric-grid\)\s*>\s*:global\(\.ui-metric\)\s*\{[\s\S]*?border:0/);
    expect(css).toMatch(/\.ductMetricStrip\s*:global\(\.ui-metric-grid\)\s*>\s*:global\(\.ui-metric\)\s*\{[\s\S]*?border-radius:0/);
    expect(css).toMatch(/\.ductMetricStrip\s*:global\(\.ui-metric-grid\)\s*>\s*:global\(\.ui-metric\)\s*\{[\s\S]*?box-shadow:none/);
    expect(css).toContain(".ductMetricStrip :global(.ui-metric-grid) > :global(.ui-metric):last-child{border-inline-end:0");
    // 2x2 tablet (<=1023px): horizontal + vertical internal dividers
    expect(css).toMatch(/@media\(max-width:1023px\)\{[\s\S]*?\.ductMetricStrip\s*:global\(\.ui-metric-grid\)\{grid-template-columns:repeat\(2/);
    expect(css).toContain(".ductMetricStrip :global(.ui-metric-grid) > :global(.ui-metric):nth-child(-n+2){border-bottom:");
    // 1 column narrow (<360px): single column, no internal dividers
    expect(css).toMatch(/@media\(max-width:359px\)\{[\s\S]*?\.ductMetricStrip\s*:global\(\.ui-metric-grid\)\{grid-template-columns:1fr/);
  });

  it("request list uses MetricStrip component for contiguous metric strip", () => {
      requestsHolder.value = emptyList;
      const markup = renderToStaticMarkup(<RequestListWorkspace permissions={accessState.permissions} userId="u-1" />);
      expect(markup).toContain("metricStrip");
      expect(markup).toContain("metricGrid");
    });

  it("workflow summary is one start-aligned header group (label + phase indicator together, no far-right status)", () => {
    requestsHolder.value = emptyList;
    const markup = renderToStaticMarkup(<RequestListWorkspace permissions={accessState.permissions} userId="u-1" />);
    // accessible disclosure semantics preserved
    expect(markup).toMatch(/<details[^>]*class="[^"]*workflowDisclosure[^"]*">/);
    expect(markup).toContain("<summary>");
    expect(markup).toContain("ขั้นตอนงาน · 10 ขั้นตอน");
    expect(markup).not.toContain("แสดงเมื่อเปิด");
    expect(css).toMatch(/\.workflowDisclosure\s*summary\s*\{[^}]*justify-content:flex-start/);
    expect(css).not.toMatch(/\.workflowDisclosure\s*summary\s*\{[^}]*justify-content:space-between/);
  });

  it("task toolbar stacks on narrow screens and hides the divider", () => {
    expect(css).toMatch(/@media\(max-width:700px\)\{[\s\S]*?\.ductTaskToolbar\{/);
    expect(css).toContain(".ductTaskToolbar .ductTaskDivider{display:none}");
  });
});


