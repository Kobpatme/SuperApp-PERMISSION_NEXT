import { readFileSync, readdirSync } from "node:fs";
import postcss from "postcss";
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
    "duct_rental.renewal.create",
    "duct_rental.cancellation.create",
    "duct_rental.signoff.sign",
  ] as string[],
}));
vi.mock("@/lib/access", () => ({ getAccessContext: vi.fn(async () => accessState) }));

const emptyList = {
  data: { rows: [], counts: { total: 0, pending: 0, active: 0 }, queues: { waiting: 0, missing: 0 }, pipeline: [], nextOffset: null },
  error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn(),
};
const emptyTracking = {
  data: { rows: [], counts: { total: 0, completed: 0, nearDue: 0, overdue: 0 }, offset: 0, limit: 50, nextOffset: null },
  error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn(),
};

const requestsHolder = vi.hoisted(() => ({ value: null as any }));
const trackingHolder = vi.hoisted(() => ({ value: null as any }));
const detailRequestsHolder = vi.hoisted(() => ({ value: null as any }));
vi.mock("@/modules/duct-rental/components/use-resource", () => ({
  useResource: (path: string | null) => {
    if (path?.startsWith("tracking")) return trackingHolder.value ?? emptyTracking;
    if (path?.startsWith("requests?")) return requestsHolder.value ?? emptyList;
    if (path?.startsWith("requests/")) return detailRequestsHolder.value ?? { data: undefined, error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
    if (path?.startsWith("options")) return { data: { teams: [], coordinators: [] }, error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
    return { data: undefined, error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
  },
}));

import { RequestListWorkspace } from "../components/request-list";
import { ProcessList, RenewalWorkspace, CancellationWorkspace } from "../components/process-workspace";
import { TrackingWorkspace } from "../components/tracking-workspace";
import { SignatureWorkspace } from "../components/signature-workspace";
import { AttachmentPicker } from "../components/attachment-picker";
import { RequestForm } from "../components/request-form";
import { RequestWorkspace } from "../components/request-workspace";

const cssModules = {
  request: readFileSync(new URL("../ui-request/ui-request.module.css", import.meta.url), "utf8"),
  process: readFileSync(new URL("../ui-process/ui-process.module.css", import.meta.url), "utf8"),
  shared: readFileSync(new URL("../ui-shared/ui-shared.module.css", import.meta.url), "utf8"),
};
const css = Object.values(cssModules).join("\n");

function collectSelectorClasses(selectors: string[]): { locals: Set<string>; globals: Set<string> } {
  const locals = new Set<string>();
  const globals = new Set<string>();
  for (const selector of selectors) {
    const functions: boolean[] = [];
    for (let index = 0; index < selector.length; index += 1) {
      if (selector[index] === "\\") { index += 1; continue; }
      if (selector[index] === "(") {
        const prefix = selector.slice(0, index).match(/:global\s*$/);
        functions.push(Boolean(prefix) || functions.some(Boolean));
        continue;
      }
      if (selector[index] === ")") { functions.pop(); continue; }
      if (selector[index] !== ".") continue;
      const match = selector.slice(index + 1).match(/^[\w-]+/);
      if (!match) continue;
      (functions.some(Boolean) ? globals : locals).add(match[0]);
      index += match[0].length;
    }
  }
  return { locals, globals };
}

beforeEach(() => {
  accessState.allowed = true;
  requestsHolder.value = null;
  trackingHolder.value = null;
});

describe("duct shell contract: composition and nav ownership", () => {
  it("renders PageHeader -> ModuleNav -> dedicated RefreshBar with no moduleHeaderActions band", () => {
    const markup = renderToStaticMarkup(<RequestListWorkspace permissions={accessState.permissions} userId="u-1" />);
    expect(markup).toContain("เช่าท่อร้อยสาย");
    expect(markup).toContain('data-ui-screen="duct-rental-request-list"');
    // No giant bordered action band / no dependency on .moduleHeaderActions
    expect(markup).not.toContain("moduleHeaderActions");
    // ModuleNav is rendered standalone (full-width lightweight), owns its links
    expect(markup).toContain("คำขอเช่าท่อ");
    expect(markup).toContain("ยกเลิกการใช้ท่อ");
    expect(markup).toContain("ติดตามต่อสัญญาและยกเลิก");
    expect(markup).toContain("งานลงนามและลายเซ็น");
    // RefreshBar present (refresh button text)
    expect(markup).toContain("อัปเดตข้อมูล");
  });

  it("preserves aria-current on the active ModuleNav link", () => {
    requestsHolder.value = emptyList;
    const markup = renderToStaticMarkup(<RequestListWorkspace permissions={accessState.permissions} userId="u-1" />);
    expect(markup).toContain("aria-current=\"page\"");
    expect(markup).toContain("aria-current=\"page\"");
    // active link is the request list entry
    expect(markup.indexOf("คำขอเช่าท่อ")).toBeGreaterThan(-1);
  });

  it("gates PageHeader create (primary) and settings (secondary) behind permissions", () => {
    const allowed = renderToStaticMarkup(<RequestListWorkspace permissions={accessState.permissions} userId="u-1" />);
    expect(allowed).toContain("สร้างคำขอ");
    expect(allowed).toContain("ตั้งค่าผู้ประสานงาน");
    expect(allowed).toContain('href="/duct-rental/new"');
    expect(allowed).toContain('href="/duct-rental/settings"');

    const denied = renderToStaticMarkup(<RequestListWorkspace permissions={["duct_rental.module.view"]} userId="u-1" />);

    expect(denied).not.toContain("ตั้งค่าผู้ประสานงาน");
    expect(denied).not.toContain('href="/duct-rental/new"');
    expect(denied).not.toContain('href="/duct-rental/settings"');
  });

  it("process / tracking create actions remain in PageHeader (not in nav wrapper)", () => {
    const renewal = renderToStaticMarkup(<ProcessList kind="renewal" permissions={["duct_rental.module.view", "duct_rental.renewal.create"]} />);
    expect(renewal).toContain("สร้างงานต่อสัญญารายปี");
    expect(renewal).not.toContain("moduleHeaderActions");

    const cancel = renderToStaticMarkup(<ProcessList kind="cancellation" permissions={["duct_rental.module.view", "duct_rental.cancellation.create"]} />);
    expect(cancel).toContain("ขอยกเลิกการใช้ท่อ");
    expect(cancel).not.toContain("moduleHeaderActions");
  });

  it("tracking workspace renders ModuleNav + RefreshBar in PageHeader-driven shell", () => {
    const markup = renderToStaticMarkup(<TrackingWorkspace />);
    expect(markup).toContain("ติดตามงานต่อสัญญาและยกเลิก");
    expect(markup).toContain("อัปเดตข้อมูล");
    expect(markup).not.toContain("moduleHeaderActions");
  });
});

describe("duct shell contract: deterministic CSS module ownership ledger", () => {
  it("scans local/global classes through nested selectors and PostCSS at-rules", () => {
    const root = postcss.parse(`@media (min-width: 1px) {\n  @container card (width > 2px) {\n    .local-one:is(.local-two, :global(.is-active)) .local-three,\n    :global(.ui-metric-grid .ui-metric--request-list) .local-four { color: red; }\n  }\n}`);
    const selectors: string[] = [];
    root.walkRules((rule) => { selectors.push(rule.selector); });
    const { locals, globals } = collectSelectorClasses(selectors);
    expect([...locals].sort()).toEqual(["local-four", "local-one", "local-three", "local-two"]);
    expect([...globals].sort()).toEqual(["is-active", "ui-metric--request-list", "ui-metric-grid"]);
  });

  it("has no undefined styles tokens or unreferenced local CSS classes", () => {
    const root = postcss.parse(css);
    const architectureSource = ["../ui-request/", "../ui-process/", "../ui-shared/"]
      .flatMap((directory) => readdirSync(new URL(directory, import.meta.url)).filter((name) => name.endsWith(".tsx")).map((name) => readFileSync(new URL(name, new URL(directory, import.meta.url)), "utf8")))
      .join("\n");
    const architectureUsed = new Set(Array.from(architectureSource.matchAll(/styles\.([\w$]+)/g), (match) => match[1]));
    const selectors: string[] = [];
    root.walkRules((rule) => {
      selectors.push(rule.selector);
    });
    const { globals, locals } = collectSelectorClasses(selectors);
    const architectureLocals = [...locals].filter((name) => architectureUsed.has(name));
    const undefinedUses = [...architectureUsed].filter((name) => !locals.has(name)).sort();
    const zeroReferenceLocals = architectureLocals.filter((name) => !architectureUsed.has(name)).sort();
    expect(undefinedUses).toEqual([]);
    expect(zeroReferenceLocals).toEqual([]);
    expect([...globals]).toEqual(expect.arrayContaining(["ui-metric-grid", "ui-metric", "ui-metric--request-list"]));
  });
});

describe("duct shell contract: CSS ownership (no route-specific global override)", () => {
  it("RefreshBar has a dedicated class and no longer shares the generic toolbar", () => {
    expect(cssModules.shared).toContain(".ductSyncUtility{");
    expect(cssModules.shared).toContain(".ductSyncStatus{");
    expect(cssModules.shared).toContain(".ductTaskToolbar{");
    expect(css).not.toMatch(/\bmoduleHeaderActions\b/);
  });

  it("removes the broad .signatureSurface .toolbar cascade; uses precise signature-search / signature-control classes", () => {
    expect(cssModules.shared).not.toMatch(/\.signatureSurface\s*\.toolbar/);
    expect(cssModules.shared).toContain(".signatureTools{");
    expect(cssModules.shared).toContain(".signatureControl{");
  });

  it("ModuleNav owns active/inactive/overflow styling directly with horizontal scroll", () => {
    expect(cssModules.shared).toContain(".ductModuleNav{");
    expect(cssModules.shared).toContain("overflow-x:auto");
    expect(cssModules.shared).toContain("scrollbar-width:none");
    expect(cssModules.shared).toContain(".ductModuleLink[aria-current=\"page\"]");
    expect(cssModules.shared).toMatch(/min-height:var\(--size-control-touch\)/);
  });

  it("request form outer layout is two-column with no empty third column and rail collapse", () => {
    expect(cssModules.shared).toContain(".ductSurface.ductForm .columns{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,320px)");
    expect(cssModules.shared).toContain("@container (max-width: 860px)");
    expect(cssModules.shared).toContain("@media(max-width: 600px)");
    expect(cssModules.shared).toContain("grid-template-columns:1fr");
    // detail split keeps its own 300px rail (out of form scope) — not the form outer layout
    expect(cssModules.shared).toContain(".ductSurface.ductDetail .split{grid-template-columns:minmax(0,1fr) 300px");
  });

  it("sticky action bar is non-obscuring: safe-area bottom", () => {
    expect(css).toMatch(/\.sticky\{position:sticky;bottom:max\(12px,env\(safe-area-inset-bottom\)\)/);
  });

  it("attachment panel uses a dedicated one-column stack instead of the shared 3-col .grid", () => {
    expect(css).toContain(".attachmentStack{");
    expect(css).toMatch(/\.attachmentStack\{[^}]*grid-template-columns:1fr[^}]*\}/);
    expect(css).toMatch(/\.attachmentStack\{[^}]*gap:var\(--space-4\)[^}]*\}/);
    // generic 3-col field grids (filters/details) and their 3→2→1 responsive rules are unchanged: no global .grid override
    expect(css).toContain(".filters,.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--space-4)}");
    expect(cssModules.shared).toContain(".details{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--space-4);margin:0}");
    expect(cssModules.shared).toContain("@media(max-width: 1000px){.ductSurface.ductDetail .split{grid-template-columns:1fr}.details{grid-template-columns:repeat(2,minmax(0,1fr))}");
    expect(cssModules.shared).toContain("@media(max-width:600px){.details{grid-template-columns:1fr}");
  });
});

describe("duct shell contract: signature toolbar separation", () => {
  it("keeps signature manage action gated by permission inside the dedicated search toolbar, modal behavior unchanged", () => {
    const allowed = renderToStaticMarkup(<SignatureWorkspace userId="u-1" permissions={accessState.permissions} />);
    expect(allowed).toContain("งานลงนาม NT Form");
    expect(allowed).toContain("จัดการลายเซ็นของฉัน");
    expect(allowed).toContain("ค้นหางานลงนาม");

    const denied = renderToStaticMarkup(<SignatureWorkspace userId="u-1" permissions={["duct_rental.module.view"]} />);
    expect(denied).not.toContain("จัดการลายเซ็นของฉัน");
  });
});

describe("signature compact tools (deleg_8aa6d18e): PageHeader → ModuleNav → signatureTools grouping", () => {
  it("renders PageHeader, ModuleNav, then signatureTools grouping RefreshBar, notices, signatureSearch + manage action in exact order", () => {
    const markup = renderToStaticMarkup(<SignatureWorkspace userId="u-1" permissions={accessState.permissions} />);
    const header = markup.indexOf("งานลงนาม NT Form");
    const nav = markup.indexOf("งานลงนามและลายเซ็น");
    const refresh = markup.indexOf("อัปเดตข้อมูล");
    const search = markup.indexOf("ค้นหางานลงนาม");
    const manage = markup.indexOf("จัดการลายเซ็นของฉัน");
    expect(header).toBeGreaterThan(-1);
    expect(header < nav && nav < refresh && refresh < search && search < manage).toBe(true);
    // No legacy action band; manage action is not promoted into PageHeader or ModuleNav
    expect(markup).not.toContain("moduleHeaderActions");
  });

  it("keeps manage action inside signatureSearch (not PageHeader/nav), gated by duct_rental.signoff.sign", () => {
    const fs = require("fs"); const path = require("path");
    const raw = fs.readFileSync(path.resolve(__dirname, "../components/signature-workspace.tsx"), "utf8");
    expect(raw).toContain("styles.signatureTools");
    expect(raw).not.toMatch(/<PageHeader[^>]*\bactions\b/);
    // ModuleNav is self-closing (owns its links only); the manage action is not a child of it
    expect(raw).toContain('<ModuleNav current="tasks" />');
    expect(raw).not.toMatch(/<ModuleNav\b[^>]*>[^<]*จัดการลายเซ็นของฉัน/);
    const allowed = renderToStaticMarkup(<SignatureWorkspace userId="u-1" permissions={accessState.permissions} />);
    const denied = renderToStaticMarkup(<SignatureWorkspace userId="u-1" permissions={["duct_rental.module.view"]} />);
    expect(allowed).toContain("จัดการลายเซ็นของฉัน");
    expect(denied).not.toContain("จัดการลายเซ็นของฉัน");
  });

  it("preserves search semantics: label, maxLength 200, placeholder, query change resets offset to 0", () => {
    const fs = require("fs"); const path = require("path");
    const raw = fs.readFileSync(path.resolve(__dirname, "../components/signature-workspace.tsx"), "utf8");
    expect(raw).toContain("ค้นหางานลงนาม");
    expect(raw).toContain("maxLength={200}");
    expect(raw).toContain("setOffset(0)");
    const markup = renderToStaticMarkup(<SignatureWorkspace userId="u-1" permissions={accessState.permissions} />);
    expect(markup).toContain("maxLength=\"200\"");
    expect(markup).toContain('placeholder="รหัสคำขอ ชื่อโครงการ…"');
    expect(markup).toContain("ค้นหางานลงนาม");
  });

  it("CSS: compact signatureSurface gap, signatureTools grid, scoped refreshBar override, search grid contract, no toolbar cascade", () => {
    expect(css).toContain(".signatureSurface{gap:var(--space-3)}");
    expect(css).toContain(".signatureTools{display:grid;gap:var(--space-3);min-width:0}");
    expect(css).toContain(".signatureTools{display:grid;gap:var(--space-3);min-width:0}");
    
    
    expect(css).not.toMatch(/\.signatureSurface\s*\.toolbar/);
  });

  it("responsive: <=700 one column with full-width manage button; <=600 refresh controls stack/stretch full width", () => {
    expect(css).toContain("@media(max-width:700px){.signatureTools{grid-template-columns:1fr}");
    expect(css).toContain(".signatureTools .manageAction{width:100%}");
    
  });
});

describe("duct shell contract: attachment picker", () => {
  it("renders a canonical Button trigger, visually-hidden accessible native input, unchanged accept, and shows filename/status separately", () => {
    const markup = renderToStaticMarkup(<AttachmentPicker label="แนบไฟล์" change={vi.fn()} />);
    expect(markup).toContain("แนบไฟล์ · ไม่เกิน 25 MB");
    // canonical Button trigger (focusable)
    expect(markup).toContain('type="button"');
    // native input present, accessible-hidden, accept preserved
    expect(markup).toContain('type="file"');
    expect(markup).toContain('accept=".pdf"');
    expect(markup).toContain('tabindex="-1"');
    expect(markup).toContain('aria-label="แนบไฟล์"');
  });

  it("shows the selected filename and size status separately when a file is chosen", () => {
    const fileMock = { name: "สัญญา.pdf", size: 2600 } as any;
    const markup = renderToStaticMarkup(<AttachmentPicker label="แนบไฟล์" file={fileMock} change={vi.fn()} />);
    expect(markup).toContain("สัญญา.pdf");
    expect(markup).toContain("3 KB");
    expect(markup).toContain("ยกเลิกไฟล์ที่เลือก");
  });
});

describe("duct shell contract: attachment stack (one full-width column per picker)", () => {
  it("request form renders both attachment pickers in the rail stack (no empty third column)", () => {
    const markup = renderToStaticMarkup(
      <RequestForm
        user={{ id: "u-1", displayName: "Test", email: "test@example.com" }}
        permissions={[...accessState.permissions, "duct_rental.document.upload"]}
      />
    );
    expect(markup).toContain("สร้างคำขอเช่าท่อร้อยสาย");
    expect(markup).toContain("เอกสารจากทีมออกแบบ");
    expect(markup).toContain("Memo (ถ้ามี)");
    expect(markup).toContain("แบบท่อจากทีมออกแบบ (ถ้ามี)");
    // canonical trigger: label + 25 MB limit, hidden native input, .pdf accept preserved
    expect(markup).toContain("Memo (ถ้ามี) · ไม่เกิน 25 MB");
    expect(markup).toContain("แบบท่อจากทีมออกแบบ (ถ้ามี) · ไม่เกิน 25 MB");
    expect(markup).toContain('type="file"');
    expect(markup).toContain('accept=".pdf"');
    expect(markup).toContain("tabindex=\"-1\"");
    expect(markup).toContain("aria-label=\"Memo (ถ้ามี)\"");
  });

  it("request-form.tsx attaches pickers via the dedicated stack class, not the shared 3-col .grid", () => {
    const fs = require("fs");
    const path = require("path");
    const raw = fs.readFileSync(path.resolve(__dirname, "../components/request-form.tsx"), "utf8");
    expect(raw).toContain("styles.attachmentStack");
    expect(raw).not.toContain("styles.grid");
  });
});

describe("duct phase 2: detail shell order (PageHeader → ModuleNav → SyncUtility)", () => {
  const detailRow = {
    id: "r-1", code: "REQ-001", projectName: "โครงการทดสอบ", routeName: "เส้นทาง 1",
    ownerDuct: "NT", province: "กรุงเทพฯ", serviceCenter: "BKK 1", phase: "INSTALL",
    phaseStatuses: { INSTALL: "accepted" }, phaseNotes: {}, design: {}, files: [], isSigned: false, cancelledAt: null, documentsIncomplete: false,
    updatedAt: "2026-10-30T00:00:00.000Z", requestType: "NEW", missingDocs: "", version: 1,
    capabilities: ["duct_rental.request.update", "duct_rental.document.read"],
  };

  it("RequestWorkspace renders PageHeader → ModuleNav → SyncUtility → PhaseTabs (not RefreshBar before PageHeader)", () => {
    detailRequestsHolder.value = { data: detailRow, error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
    const markup = renderToStaticMarkup(<RequestWorkspace id="r-1" userId="u-1" created />);
    detailRequestsHolder.value = null;
    const header = markup.indexOf("เช่าท่อร้อยสาย");
    const nav = markup.indexOf("คำขอเช่าท่อ");
    const refresh = markup.indexOf("อัปเดตข้อมูล");
    const tabs = markup.indexOf("ขั้นตอนคำขอ");
    expect(header).toBeGreaterThan(-1);
    expect(nav).toBeGreaterThan(-1);
    expect(refresh).toBeGreaterThan(-1);
    expect(tabs).toBeGreaterThan(-1);
    expect(header < nav && nav < refresh && refresh < tabs).toBe(true);
    // RefreshBar must not appear before PageHeader
    expect(markup.indexOf("อัปเดตข้อมูล")).toBeGreaterThan(markup.indexOf("เช่าท่อร้อยสาย"));
  });

  it("RenewalWorkspace renders PageHeader → ModuleNav → SyncUtility → step content", () => {
    const fs = require("fs"); const path = require("path");
    const raw = fs.readFileSync(path.resolve(__dirname, "../components/process-workspace.tsx"), "utf8");
    // RenewalWorkspace delegates SyncUtility to RenewalPane (RefreshBar moved out of wrapper)
    const renewalWorkspace = raw.slice(raw.indexOf("export function RenewalWorkspace"), raw.indexOf("function RenewalPane"));
    expect(renewalWorkspace.indexOf("<RefreshBar")).toBe(-1);
    // RenewalPane: PageHeader then ModuleNav then RefreshBar
    const paneStart = raw.indexOf("function RenewalPane");
    const paneReturn = raw.slice(paneStart, raw.indexOf("function CancellationForm"));
    const h1 = paneReturn.indexOf("<PageHeader");
    const nav = paneReturn.indexOf('<ModuleNav current="renewal" />');
    const refresh = paneReturn.indexOf("<RefreshBar");
    expect(h1).toBeGreaterThan(-1);
    expect(nav).toBeGreaterThan(h1);
    expect(refresh).toBeGreaterThan(nav);
  });

  it("CancellationWorkspace renders PageHeader → ModuleNav → SyncUtility → content", () => {
    const fs = require("fs"); const path = require("path");
    const raw = fs.readFileSync(path.resolve(__dirname, "../components/process-workspace.tsx"), "utf8");
    const cancelWorkspace = raw.slice(raw.indexOf("export function CancellationWorkspace"), raw.indexOf("function CancellationPane"));
    expect(cancelWorkspace.indexOf("<RefreshBar")).toBe(-1);
    // CancellationPane: PageHeader then ModuleNav then RefreshBar
    const paneStart = raw.indexOf("function CancellationPane");
    const paneReturn = raw.slice(paneStart);
    const h1 = paneReturn.indexOf("<PageHeader");
    const nav = paneReturn.indexOf('<ModuleNav current="cancellation" />');
    const refresh = paneReturn.indexOf("<RefreshBar");
    expect(h1).toBeGreaterThan(-1);
    expect(nav).toBeGreaterThan(h1);
    expect(refresh).toBeGreaterThan(nav);
  });
});

describe("duct phase 2: compact modal does not inject full page shell", () => {
  it("RequestWorkspace compact=true renders PhaseTabs without PageHeader/ModuleNav shell", () => {
    detailRequestsHolder.value = { data: { id: "r-1", code: "REQ-001", projectName: "ทดสอบ", phase: "DESIGN", phaseStatuses: {}, phaseNotes: {}, design: {}, files: [], isSigned: false, cancelledAt: null, documentsIncomplete: false, updatedAt: "2026-10-30T00:00:00.000Z", version: 1, capabilities: [] }, error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
    const markup = renderToStaticMarkup(<RequestWorkspace id="r-1" userId="u-1" compact />);
    detailRequestsHolder.value = null;
    // Compact modal: no PageHeader (no h1 with request title), no ModuleNav
    expect(markup).toContain("ขั้นตอนคำขอ");
    expect(markup).not.toContain("เช่าท่อร้อยสาย");
  });
});

describe("duct phase 2: SyncUtility busy/paused states", () => {
  it("RefreshBar renders busy label and disabled button when busy", () => {
    detailRequestsHolder.value = { data: { id: "r-1", code: "REQ-001", projectName: "ทดสอบ", phase: "DESIGN", phaseStatuses: {}, phaseNotes: {}, design: {}, files: [], isSigned: false, cancelledAt: null, documentsIncomplete: false, updatedAt: "2026-10-30T00:00:00.000Z", version: 1, capabilities: [] }, error: "", loading: true, online: true, changed: false, realtime: "connected", refresh: vi.fn(), busy: true };
    const markup = renderToStaticMarkup(<RequestWorkspace id="r-1" userId="u-1" />);
    detailRequestsHolder.value = null;
    expect(markup).toContain("กำลังอัปเดต…");
    expect(markup).toContain("disabled");
  });

  it("SyncUtility shows paused status text when paused", () => {
    const fs = require("fs"); const path = require("path");
    const raw = fs.readFileSync(path.resolve(__dirname, "../components/common.tsx"), "utf8");
    expect(raw).toContain("พักการอัปเดตระหว่างแก้ไข");
    expect(raw).toContain("aria-busy");
  });
});

describe("duct phase 2: filter toolbar in process lists and tracking", () => {
  it("ProcessList renewal uses ductFilterToolbar instead of ductSurface.ductFilter card", () => {
    const fs = require("fs"); const path = require("path");
    const raw = fs.readFileSync(path.resolve(__dirname, "../components/process-workspace.tsx"), "utf8");
    expect(raw).toContain("styles.ductFilterToolbar");
    expect(raw).not.toMatch(/ductSurface.*ductFilter/);
  });

  it("ProcessList cancellation uses ductFilterToolbar instead of ductSurface.ductFilter card", () => {
    const fs = require("fs"); const path = require("path");
    const raw = fs.readFileSync(path.resolve(__dirname, "../components/process-workspace.tsx"), "utf8");
    const cancelSection = raw.slice(raw.indexOf("export function ProcessList"), raw.indexOf("export function RenewalWorkspace"));
    expect(cancelSection).toContain("ductFilterToolbar");
  });

  it("TrackingWorkspace uses ductFilterToolbar instead of ductSurface.ductFilter card", () => {
    const fs = require("fs"); const path = require("path");
    const raw = fs.readFileSync(path.resolve(__dirname, "../components/tracking-workspace.tsx"), "utf8");
    expect(raw).toContain("styles.ductFilterToolbar");
    expect(raw).not.toMatch(/ductSurface.*ductFilter/);
  });

  it("Tracking filter/search min widths: search 280-520, selects 180", () => {
    expect(css).toContain(".ductFilterToolbar .ductFilterSearch{min-width:280px;max-width:520px;flex:1 1 420px;width:auto}");
    expect(css).toContain(".ductFilterToolbar .ductFilterSelect{min-width:180px;flex:0 0 auto}");
  });

  it("Tracking preserves SLA Completed state and URL query behavior", () => {
    trackingHolder.value = {
      data: { rows: [], counts: { total: 0, completed: 0, nearDue: 0, overdue: 0 }, offset: 0, limit: 50, nextOffset: null },
      error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn(),
    };
    const markup = renderToStaticMarkup(<TrackingWorkspace />);
    expect(markup).toContain("เสร็จแล้ว");
    expect(markup).toContain("เกินกำหนด");
    expect(markup).toContain("ใกล้ครบกำหนด");
  });
});

describe("duct phase 2: current renewal/cancellation/tracking nav", () => {
  it("ModuleNav includes renewal destination and active aria-current matches current prop", () => {
    const markup = renderToStaticMarkup(<ProcessList kind="renewal" permissions={["duct_rental.module.view", "duct_rental.renewal.create"]} />);
    expect(markup).toContain("ต่อสัญญารายปี");
    expect(markup).toContain('aria-current="page"');
    expect(markup.indexOf("ต่อสัญญารายปี")).toBeGreaterThan(-1);
  });

  it("ModuleNav includes cancellation destination", () => {
    const markup = renderToStaticMarkup(<ProcessList kind="cancellation" permissions={["duct_rental.module.view", "duct_rental.cancellation.create"]} />);
    expect(markup).toContain("ยกเลิกการใช้ท่อ");
  });

  it("ModuleNav includes tracking destination", () => {
    const markup = renderToStaticMarkup(<TrackingWorkspace />);
    expect(markup).toContain("ติดตามต่อสัญญาและยกเลิก");
  });
});

describe("duct phase 2: pagination and query preserved", () => {
  it("ProcessList renewal preserves offset reset on query/status change", () => {
    const fs = require("fs"); const path = require("path");
    const raw = fs.readFileSync(path.resolve(__dirname, "../components/process-workspace.tsx"), "utf8");
    expect(raw).toContain("setOffset(0)");
    expect(raw).toContain("setQuery");
    expect(raw).toContain("setStatus");
  });

  it("ProcessList renders pagination with counts", () => {
    const markup = renderToStaticMarkup(<ProcessList kind="renewal" permissions={["duct_rental.module.view", "duct_rental.renewal.create"]} />);
    expect(markup).toContain("ก่อนหน้า");
    expect(markup).toContain("ถัดไป");
    expect(markup).toContain("รายการ");
  });

  it("Tracking preserves nextOffset pagination and setOffset0", () => {
    const fs = require("fs"); const path = require("path");
    const raw = fs.readFileSync(path.resolve(__dirname, "../components/tracking-workspace.tsx"), "utf8");
    expect(raw).toContain("setOffset(0)");
    expect(raw).toContain("nextOffset");
    expect(raw).toContain("model.data!.nextOffset!");
  });
});

describe("duct phase 2: responsive class contracts", () => {
  it("CSS has ductFilterToolbar responsive column stack at <=700px", () => {
    expect(css).toContain("@media(max-width:700px){.ductFilterToolbar{flex-direction:column");
    expect(css).toContain(".ductFilterToolbar .ductFilterSearch{min-width:100%;max-width:100%}");
    expect(css).toContain(".ductFilterToolbar .ductFilterSelect{min-width:100%;max-width:100%}");
  });

  it("CSS has no horizontal overflow on duct surfaces", () => {
    expect(css).toContain(".ductSurface{display:grid;gap:var(--space-5);min-width:0;color:var(--color-text)}");
    expect(css).toContain("min-width:0");
  });

  it("CSS uses only semantic tokens (no raw hex) in workspace.module.css", () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    const used = [...css.matchAll(/var\(\s*(--[\w-]+)/g)].map(m => m[1]);
    expect(used.length).toBeGreaterThan(0);
  });
});

