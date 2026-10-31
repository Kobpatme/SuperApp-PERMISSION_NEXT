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
    "duct_rental.module.view", "duct_rental.request.create", "duct_rental.request.update",
    "duct_rental.document.read", "duct_rental.document.export", "duct_rental.document.upload",
    "duct_rental.settings.manage", "duct_rental.renewal.create", "duct_rental.cancellation.create",
    "duct_rental.signoff.sign",
  ] as string[],
}));
vi.mock("@/lib/access", () => ({ getAccessContext: vi.fn(async () => accessState) }));

const emptyProcesses = {
  data: { renewals: [], cancellations: [], renewalCount: 0, cancellationCount: 0 },
  error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn(),
};
const emptyTracking = {
  data: { rows: [], counts: { total: 0, completed: 0, nearDue: 0, overdue: 0 }, offset: 0, limit: 50, nextOffset: null },
  error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn(),
};
const trackingRows = [
  { id: "t-1", kind: "Renew", routeId: "YEAR-2026", reference: "C-001", title: "ต่อสัญญาปี 2569 (2026)", status: "contracted", owner: "Completed", start: "2026-10-01T00:00:00.000Z", due: "2026-10-08T00:00:00.000Z", completed: null, sla: "Completed" },
  { id: "t-2", kind: "Cancel", routeId: "CR-001", reference: "-", title: "ยกเลิกการใช้ท่อ ทดสอบ", status: "in_progress", owner: "Team Permission", start: "2026-09-20T00:00:00.000Z", due: "2026-09-25T00:00:00.000Z", completed: null, sla: "Overdue" },
  { id: "t-3", kind: "Renew", routeId: "YEAR-2025", reference: "C-002", title: "ต่อสัญญาปี 2568 (2025)", status: "sent_to_3rdparty", owner: "3rd Party", start: "2026-11-01T00:00:00.000Z", due: "2026-12-01T00:00:00.000Z", completed: null, sla: "On Track" },
];
const trackingData = {
  data: { rows: trackingRows, counts: { total: 3, completed: 1, nearDue: 0, overdue: 1 }, offset: 0, limit: 50, nextOffset: null },
  error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn(),
};

const trackingHolder = vi.hoisted(() => ({ value: null as any }));
const processesHolder = vi.hoisted(() => ({ value: null as any }));
const requestsHolder = vi.hoisted(() => ({ value: null as any }));

vi.mock("@/modules/duct-rental/components/use-resource", () => ({
  useResource: (path: string | null) => {
    if (path?.startsWith("tracking")) return trackingHolder.value;
    if (path?.startsWith("processes")) return processesHolder.value ?? emptyProcesses;
    if (path?.startsWith("renewals/") || path?.startsWith("cancellations/")) {
      return { data: undefined, error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
    }
    if (path?.startsWith("requests?")) {
      return requestsHolder.value ?? { data: { rows: [], counts: { total: 0, pending: 0, active: 0 }, queues: { waiting: 0, missing: 0 }, pipeline: [], nextOffset: null }, error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
    }
    if (path?.startsWith("requests/")) {
      return { data: requestsHolder.value ?? undefined, error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
    }
    return { data: undefined, error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
  },
}));

import { ProcessList, CancellationForm, CancellationWorkspace, RenewalWorkspace } from "../components/process-workspace";
import { TrackingWorkspace } from "../components/tracking-workspace";
import { RequestListWorkspace } from "../components/request-list";
import { MetricGrid } from "@/components/ui/metric-grid";

const css = [
  readFileSync(new URL("../ui-request/ui-request.module.css", import.meta.url), "utf8"),
  readFileSync(new URL("../ui-process/ui-process.module.css", import.meta.url), "utf8"),
  readFileSync(new URL("../ui-shared/ui-shared.module.css", import.meta.url), "utf8"),
].join("\n");

beforeEach(() => {
  accessState.allowed = true;
  trackingHolder.value = emptyTracking;
  processesHolder.value = emptyProcesses;
  requestsHolder.value = undefined;
});

describe("approved six duct-rental surfaces: shared CSS owner (ductSurface)", () => {
  it("declares one shared container owner for the six surfaces", () => {
    expect(css).toContain(".ductSurface{");

    expect(css).toContain(".requestPanel{");
    expect(css).toContain(".ductTableWrap{overflow:auto;max-width:100%;border:0;border-radius:0");
    expect(css).not.toContain(".ductSurface .ductTableWrap{");
  });

  it("process filter: scoped ductFilter layout contract (single aligned row desktop, gap tokens)", () => {
    expect(css).not.toContain(".ductSurface .ductFilter{");
    expect(css).not.toContain(".ductSurface .ductFilter .ductFilterSearch");
    // advanced panel opens below a single divider inside the scoped filter surface
    expect(css).not.toContain(".ductSurface .ductFilter #duct-advanced-filters");
  });

  it("page header: create action right-edge on desktop, stacked under heading on narrow screens — real scoped rules", () => {
    expect(css).toContain('[data-ui-screen="duct-rental-request-list"] :global(.page-heading-row),');
    expect(css).toContain('[data-ui-screen="duct-rental-renewal-list"] :global(.page-heading-row),');
    expect(css).toContain('[data-ui-screen="duct-rental-cancellation-list"] :global(.page-heading-row),');
    expect(css).toContain('[data-ui-screen="duct-rental-tracking"] :global(.page-heading-row){width:100%;flex-wrap:nowrap;justify-content:space-between}');
    expect(css).toContain('@media(max-width:650px)');
    expect(css).toContain('[data-ui-screen="duct-rental-tracking"] :global(.page-heading-row){align-items:stretch;flex-direction:column;gap:var(--space-3)}');
    expect(css).toContain('[data-ui-screen="duct-rental-tracking"] :global(.page-heading-actions){width:100%;margin-left:0;justify-content:flex-start}');
  });

  it("removes conflicting legacy surface shells (no stacking classes)", () => {
    expect(css).not.toMatch(/\.processListSurface\b/);
    expect(css).not.toMatch(/\.trackingSurface\b/);
    expect(css).not.toMatch(/\.processDetailSurface\b/);
  });

  it("removes legacy request surface shells; preserves other out-of-scope surface owners", () => {
    // request form/detail/list now live on the shared ductSurface (ductForm/ductDetail/ductList)
    expect(css).not.toMatch(/\.formSurface\b/);
    expect(css).not.toMatch(/\.detailSurface\b/);
    expect(css).not.toMatch(/\.listSurface\b/);
    expect(css).toMatch(/\.cableSurface\b/);       // communication cable (out of scope, still used)
    expect(css).toMatch(/\.settingsSurface\b/);    // settings (out of scope, still used)
    expect(css).toMatch(/\.signatureSurface\b/);   // signing tasks (out of scope, still used)
  });
});

describe("cancellation list (/duct-rental/cancellation)", () => {
  it("renders one heading, scrollable table region, empty state, and reset button on shared surface", () => {
    const markup = renderToStaticMarkup(<ProcessList kind="cancellation" permissions={["duct_rental.module.view"]} />);
    expect(markup.match(/<h1/g)?.length).toBe(1);
    expect(markup).toContain("ยกเลิกการใช้ท่อ");
    expect(markup).toContain('data-ui-screen="duct-rental-cancellation-list"');
    expect(markup).toContain('role="region"');
    expect(markup).toContain('aria-label="ตารางรายการ ยกเลิกการใช้ท่อ เลื่อนแนวนอนได้"');
    expect(markup).toContain("ยังไม่มีงานยกเลิกการใช้ท่อ");
    expect(markup).toContain("รีเซ็ต");
  });

  it("renders the create link only with cancellation create permission", () => {
    const allowed = renderToStaticMarkup(<ProcessList kind="cancellation" permissions={["duct_rental.module.view", "duct_rental.cancellation.create"]} />);
    expect(allowed).toContain("ขอยกเลิกการใช้ท่อ");
    const denied = renderToStaticMarkup(<ProcessList kind="cancellation" permissions={["duct_rental.module.view"]} />);
    expect(denied).not.toContain("ขอยกเลิกการใช้ท่อ");
  });
});

describe("renewal list (/duct-rental/renewal)", () => {
  it("renders one heading, scrollable table region, empty state, and create button on shared surface", () => {
    const markup = renderToStaticMarkup(<ProcessList kind="renewal" permissions={["duct_rental.module.view", "duct_rental.renewal.create"]} />);
    expect(markup.match(/<h1/g)?.length).toBe(1);
    expect(markup).toContain("ต่อสัญญาเช่าท่อรายปี");
    expect(markup).toContain('data-ui-screen="duct-rental-renewal-list"');
    expect(markup).toContain('role="region"');
    expect(markup).toContain("สร้างงานต่อสัญญารายปี");
    expect(markup).toContain("ยังไม่มีงานต่อสัญญา");
  });
});

describe("tracking (/duct-rental/tracking)", () => {
  it("renders one heading, canonical metric strip, search/filter/reset toolbar, and empty state", () => {
    const markup = renderToStaticMarkup(<TrackingWorkspace />);
    expect(markup.match(/<h1/g)?.length).toBe(1);
    expect(markup).toContain("ติดตามงานต่อสัญญาและยกเลิก");
    expect(markup).toContain('data-ui-screen="duct-rental-tracking"');
    expect(markup).toContain('class="ui-metric-grid"');
    expect(markup).toContain('class="ui-filter"');
    expect(markup).toContain("ค้นหา");
    expect(markup).toContain("รีเซ็ต");
    expect(markup).toContain("ไม่พบรายการตามเงื่อนไข");
  });

  it("renders metric values, SLA badges with tones, and capability-preserving back links", () => {
    trackingHolder.value = trackingData;
    const markup = renderToStaticMarkup(<TrackingWorkspace />);
    expect(markup).toContain("<strong>3</strong>");
    expect(markup).toContain("<strong>1</strong>");
    expect(markup).toContain("ui-status ui-status-success");
    expect(markup).toContain("ui-status ui-status-warning");
    expect(markup).toContain("ui-status ui-status-neutral");
    expect(markup).toContain('href="/duct-rental/renewal/t-1">เปิดงาน</a>');
    expect(markup).toContain('href="/duct-rental/cancellation/t-2">เปิดงาน</a>');
    expect(markup).toContain('class="ui-metric ui-metric-neutral"');
  });
});

describe("cancellation new (/duct-rental/cancellation/new)", () => {
  it("renders form page on shared surface without crashing", () => {
    const markup = renderToStaticMarkup(<CancellationForm />);
    expect(markup.match(/<h1/g)?.length).toBe(1);
    expect(markup).toContain("ขอยกเลิกการใช้ท่อ");
    expect(markup).toContain('data-ui-screen="duct-rental-cancellation-new"');
    expect(markup).toContain("ขอยกเลิกการใช้ท่อ");
  });
});

describe("cancellation / renewal detail (shared detail surface)", () => {
  it("renders cancellation detail skeleton on shared surface", () => {
    const markup = renderToStaticMarkup(<CancellationWorkspace id="cancellation-1" />);
    expect(markup).toContain('data-ui-screen="duct-rental-cancellation-detail"');
    expect(markup).toContain("loading-workspace");
  });

  it("renders renewal detail skeleton on shared surface", () => {
    const markup = renderToStaticMarkup(<RenewalWorkspace id="renewal-1" />);
    expect(markup).toContain('data-ui-screen="duct-rental-renewal-detail"');
    expect(markup).toContain("loading-workspace");
  });
});

describe("process list filter rendered semantics (cancellation list = /duct-rental/cancellation)", () => {
  it("renders canonical scoped filter composition: labelled controls, ค้นหา submit, contiguous รีเซ็ต", () => {
    const markup = renderToStaticMarkup(<ProcessList kind="cancellation" permissions={["duct_rental.module.view", "duct_rental.cancellation.create"]} />);
    expect(markup).toContain("data-ui-screen=\"duct-rental-cancellation-list\"");
    expect(markup).toContain("ui-filter");
    expect(markup).toContain("ค้นหาคำขอ / โครงการ / เส้นทาง");
    expect(markup).toContain("สถานะ");
    expect(markup).toContain(">ค้นหา<");
    expect(markup).toContain(">รีเซ็ต<");
    expect(markup.indexOf(">ค้นหา<") < markup.indexOf(">รีเซ็ต<")).toBe(true);
  });
});

const requestRow = {
  id: "r-1", code: "REQ-001", projectName: "โครงการทดสอบเช่าท่อ", routeName: "เส้นทางทดสอบ 1",
  ownerDuct: "NT", province: "กรุงเทพมหานคร", serviceCenter: "BKK 1", phase: "INSTALL",
  phaseStatuses: { INSTALL: "accepted" }, cancelledAt: null, documentsIncomplete: false,
  updatedAt: "2026-10-30T00:00:00.000Z", requestType: "NEW", missingDocs: "", version: 1,
};
const requestData = {
  data: { rows: [requestRow], counts: { total: 1, pending: 0, active: 1 }, queues: { waiting: 1, missing: 0 }, pipeline: [], nextOffset: null },
  error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn(),
};
const emptyRequestData = {
  data: { rows: [], counts: { total: 0, pending: 0, active: 0 }, queues: { waiting: 0, missing: 0 }, pipeline: [], nextOffset: null },
  error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn(),
};
const loadingRequestData = { ...emptyRequestData, loading: true };
const errorRequestData = { ...emptyRequestData, loading: false, error: "เชื่อมต่อไม่สำเร็จ" };
const listPermissions = [
  "duct_rental.module.view", "duct_rental.request.create", "duct_rental.request.update",
  "duct_rental.document.read", "duct_rental.settings.manage",
];

describe("request list (/duct-rental)", () => {
  beforeEach(() => { requestsHolder.value = requestData; });

  it("renders one heading on the shared duct list surface with active module nav", () => {
    const markup = renderToStaticMarkup(<RequestListWorkspace permissions={listPermissions} userId="u-1" />);
    expect(markup.match(/<h1/g)?.length).toBe(1);
    expect(markup).toContain("เช่าท่อร้อยสาย");
    expect(markup).toContain('data-ui-screen="duct-rental-request-list"');
    expect(markup).toContain("aria-current=\"page\"");
    expect(markup).toContain("คำขอเช่าท่อ");
    expect(markup).toContain("สร้างคำขอ");
    expect(markup).toContain("ตั้งค่าผู้ประสานงาน");
  });

  it("gates create and settings links behind permissions", () => {
    const denied = renderToStaticMarkup(<RequestListWorkspace permissions={["duct_rental.module.view"]} userId="u-1" />);
    expect(denied).not.toContain('href="/duct-rental/new"');
    expect(denied).not.toContain("ตั้งค่าผู้ประสานงาน");
    const allowed = renderToStaticMarkup(<RequestListWorkspace permissions={listPermissions} userId="u-1" />);
    expect(allowed).toContain('href="/duct-rental/new"');
    expect(allowed).toContain("สร้างคำขอ");
    expect(allowed).toContain("ตั้งค่าผู้ประสานงาน");
  });

  it("renders metric strip with queue/action buttons", () => {
      const markup = renderToStaticMarkup(<RequestListWorkspace permissions={listPermissions} userId="u-1" />);
      expect(markup).toContain("metricStrip");
      expect(markup).toContain("metricGrid");
      expect(markup).toContain("รายการที่ตรงตัวกรอง");
      expect(markup).toContain("คิวรอรับงาน");
      expect(markup).toContain("เอกสารค้าง");
      expect(markup).toContain("ใช้งานอยู่ในตัวกรอง");
    });

  it("renders scoped filter toolbar: ui-filter, ductFilterSearch, submit ค้นหา before contiguous ล้างตัวกรองทั้งหมด", () => {
    const markup = renderToStaticMarkup(<RequestListWorkspace permissions={listPermissions} userId="u-1" />);
    expect(markup).toContain("ui-filter");
    expect(markup).toContain("ductFilterSearch");
    expect(markup).toContain(">ค้นหา<");
    expect(markup).toContain(">ล้างตัวกรองทั้งหมด<");
    expect(markup.indexOf(">ค้นหา<") < markup.indexOf(">ล้างตัวกรองทั้งหมด<")).toBe(true);
    expect(markup).toContain("ตัวกรองขั้นสูง");
  });

  it("renders table with scope headers, status badges with tones, and open-work links", () => {
    const markup = renderToStaticMarkup(<RequestListWorkspace permissions={listPermissions} userId="u-1" />);
    expect(markup.match(/scope="col"/g)?.length).toBe(7);
    expect(markup).toContain("REQ-001");
    expect(markup).toContain("โครงการทดสอบเช่าท่อ");
    expect(markup).toContain("ui-status ui-status-neutral");
    expect(markup).toContain("ui-status ui-status-success");
    expect(markup).toContain('href="/duct-rental/r-1">เปิดงาน</a>');
    expect(markup).toContain("1–1 จาก 1 รายการ");
    expect(markup).toContain("ก่อนหน้า");
    expect(markup).toContain("ถัดไป");
  });

  it("renders loading shell when data is loading", () => {
    requestsHolder.value = loadingRequestData;
    const markup = renderToStaticMarkup(<RequestListWorkspace permissions={listPermissions} userId="u-1" />);
    requestsHolder.value = requestData;
    expect(markup).toContain("loading-workspace");
    expect(markup).toContain("skeleton-table");
  });

  it("renders empty state with reset and create actions when no rows match", () => {
    requestsHolder.value = emptyRequestData;
    const markup = renderToStaticMarkup(<RequestListWorkspace permissions={listPermissions} userId="u-1" />);
    requestsHolder.value = requestData;
    expect(markup).toContain("embeddedEmpty");
    expect(markup).toContain("ยังไม่มีคำขอเช่าท่อ");
    expect(markup).toContain("<svg");
    expect(markup).toContain("emptyActions");
    expect(markup).toContain("สร้างคำขอ");
  });

  it("renders error surface when load fails", () => {
    requestsHolder.value = errorRequestData;
    const markup = renderToStaticMarkup(<RequestListWorkspace permissions={listPermissions} userId="u-1" />);
    requestsHolder.value = requestData;
    expect(markup).toContain("ยังโหลดคำขอไม่ได้");
    expect(markup).not.toContain("เปิดงาน");
  });

  it("renders queue/doc metrics as interactive buttons with aria-pressed and offset reset", () => {
      const markup = renderToStaticMarkup(<RequestListWorkspace permissions={listPermissions} userId="u-1" />);
      expect(markup).toContain("metricStrip");
      expect(markup).toContain("metricGrid");
      expect(markup).toContain("คิวรอรับงาน");
      expect(markup).toContain("เอกสารค้าง");
      expect(markup).toContain("aria-pressed=\"false\"");
      expect(markup).not.toContain("is-active");
    });

  it("keeps interactive metrics as buttons with aria-pressed, no nested interactive HTML", () => {
      const markup = renderToStaticMarkup(<RequestListWorkspace permissions={listPermissions} userId="u-1" />);
      expect(markup).toContain("metricStrip");
      expect(markup).toContain("metricGrid");
      expect(markup).toContain("aria-pressed=\"false\"");
      expect(markup).not.toContain("is-active");
      expect(markup).not.toContain("<button><button");
      expect(markup).not.toContain('<button><span><button');
    });
});

describe("MetricGrid interactive metrics (shared button pattern mirrored from workspace-queue)", () => {
  it("renders an interactive metric as one button root with aria-pressed and no nested interactive HTML", () => {
    const markup = renderToStaticMarkup(
      <MetricGrid label="ตัวชี้วัดตัวกรอง" metrics={[{ label: "คิวรอรับงาน", value: 3, tone: "neutral", onClick: vi.fn(), pressed: true }]} />
    );
    expect(markup).toContain('<button type="button" aria-pressed="true" class="ui-metric ui-metric-neutral is-active"><span>คิวรอรับงาน</span><strong>3</strong></button>');
    expect(markup).not.toContain("<article");
  });

  it("renders an unpressed interactive metric without active styling", () => {
    const markup = renderToStaticMarkup(
      <MetricGrid label="ตัวชี้วัดตัวกรอง" metrics={[{ label: "เอกสารค้าง", value: 0, tone: "neutral", onClick: vi.fn() }]} />
    );
    expect(markup).toContain('aria-pressed="false"');
    expect(markup).not.toContain("is-active");
    expect(markup).not.toContain("<article");
  });

  it("adds request-list variant only when explicitly requested", () => {
    const markup = renderToStaticMarkup(<MetricGrid label="คำขอ" metrics={[{ label: "คิวรอรับงาน", value: 3, tone: "neutral", onClick: vi.fn(), pressed: true, variant: "request-list" }]} />);
    expect(markup).toContain('<button type="button" aria-pressed="true" class="ui-metric ui-metric-neutral ui-metric--request-list is-active"><span>คิวรอรับงาน</span><strong>3</strong></button>');
    const css = [
  readFileSync(new URL("../ui-request/ui-request.module.css", import.meta.url), "utf8"),
  readFileSync(new URL("../ui-process/ui-process.module.css", import.meta.url), "utf8"),
  readFileSync(new URL("../ui-shared/ui-shared.module.css", import.meta.url), "utf8"),
].join("\n");
    expect(css).toContain("height:66px;min-height:66px");
    expect(css).toContain("transform:none");
    expect(css).toContain(".requestTabs{display:block;min-width:0}");
    expect(css).toContain(".requestTabPanel{display:block;min-width:0");
  });

  it("keeps plain metrics as cards with the same numeric hierarchy", () => {
    const markup = renderToStaticMarkup(
      <MetricGrid label="สรุป" metrics={[{ label: "รายการที่ตรงตัวกรอง", value: 3, tone: "neutral" }]} />
    );
    expect(markup).toContain('<article class="ui-metric ui-metric-neutral"><span>รายการที่ตรงตัวกรอง</span><strong>3</strong></article>');
    expect(markup).not.toContain("<button");
  });

  it("keeps interactive metrics as full button roots with stacked label→value hierarchy matching plain metrics", () => {
    const css = readFileSync(new URL("../../../styles/ui.css", import.meta.url), "utf8");
    expect(css).toContain(".ui-metric-grid > .ui-metric:is(button) { display:grid; grid-template-columns:1fr;");
    expect(css).toContain(".ui-metric-grid > .ui-metric:is(button) strong { grid-column:1; }");
    const markup = renderToStaticMarkup(
      <MetricGrid label="ตัวชี้วัดตัวกรอง" metrics={[{ label: "คิวรอรับงาน", value: 3, tone: "neutral", onClick: vi.fn(), pressed: true }]} />
    );
    // Full button root (the metric card itself), no nested interactive HTML, no nested button
    expect(markup).toContain('<button type="button" aria-pressed="true" class="ui-metric ui-metric-neutral is-active"><span>คิวรอรับงาน</span><strong>3</strong></button>');
    expect(markup).not.toContain("<article");
    expect(markup).not.toContain("<button><button");
    expect(markup).not.toContain('<button><span><button');
  });
});

