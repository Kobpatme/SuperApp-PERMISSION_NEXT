import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach } from "vitest";

const activePathname = vi.hoisted(() => ({ value: "/work" as string }));
vi.mock("next/navigation", () => ({
  usePathname: () => activePathname.value,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const accessState = vi.hoisted(() => ({ allowed: true, permissions: ["duct_rental.module.view", "duct_rental.cancellation.create", "duct_rental.renewal.create"] as string[] }));
vi.mock("@/lib/access", () => ({ getAccessContext: vi.fn(async () => accessState) }));

const trackingRows = [
  { id: "t-1", kind: "Renew", routeId: "YEAR-2026", reference: "C-001", title: "ต่อสัญญาปี 2569 (2026)", status: "contracted", owner: "Completed", start: "2026-10-01T00:00:00.000Z", due: "2026-10-08T00:00:00.000Z", completed: null, sla: "Completed" },
  { id: "t-2", kind: "Cancel", routeId: "CR-001", reference: "-", title: "ยกเลิกการใช้ท่อ ทดสอบ", status: "in_progress", owner: "Team Permission", start: "2026-09-20T00:00:00.000Z", due: "2026-09-25T00:00:00.000Z", completed: null, sla: "Overdue" },
  { id: "t-3", kind: "Renew", routeId: "YEAR-2025", reference: "C-002", title: "ต่อสัญญาปี 2568 (2025)", status: "sent_to_3rdparty", owner: "3rd Party", start: "2026-11-01T00:00:00.000Z", due: "2026-11-08T00:00:00.000Z", completed: null, sla: "On Track" },
];
const trackingData = { data: { rows: trackingRows, counts: { total: 3, completed: 1, nearDue: 1, overdue: 1 }, offset: 0, limit: 50, nextOffset: null }, loading: false, error: "", online: true, changed: false, realtime: "connected", refresh: vi.fn() };
const emptyData = { data: { rows: [], counts: { total: 0, completed: 0, nearDue: 0, overdue: 0 }, offset: 0, limit: 50, nextOffset: null }, loading: false, error: "", online: true, changed: false, realtime: "connected", refresh: vi.fn() };

const trackingDataHolder = vi.hoisted(() => ({ value: null as any }));
vi.mock("@/modules/duct-rental/components/use-resource", () => ({
  useResource: (path: string | null) => {
    const d = trackingDataHolder.value;
    if (path?.startsWith("tracking")) return d;
    if (path?.startsWith("processes")) return { data: { renewals: [], cancellations: [], renewalCount: 0, cancellationCount: 0 }, error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
    return { data: undefined, error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
  },
}));

import TrackingPage from "@/app/(platform)/duct-rental/tracking/page";
import { TrackingWorkspace } from "@/modules/duct-rental/components/tracking-workspace";
import { ProcessList } from "@/modules/duct-rental/components/process-workspace";

async function html(el: Parameters<typeof renderToStaticMarkup>[0]) {
  return renderToStaticMarkup(await el);
}

describe("tracking Completed deep-link (page contract)", () => {
  beforeEach(() => { accessState.allowed = true; trackingDataHolder.value = trackingData; });

  it("accepts ?sla=Completed from TrackingSummary without crashing and renders the tracking workspace", async () => {
    const markup = await html(TrackingPage({ searchParams: Promise.resolve({ sla: "Completed" }) }));
    expect(markup.match(/<h1/g)?.length).toBe(1);
    expect(markup).toContain("ติดตามงานต่อสัญญาและยกเลิก");
    expect(markup).toContain("ทดสอบ");
  });

  it("retains unknown SLA handling: anything outside the whitelist renders with no initial filter", async () => {
    const markup = await html(TrackingPage({ searchParams: Promise.resolve({ sla: "Bogus" }) }));
    expect(markup.match(/<h1/g)?.length).toBe(1);
    expect(markup).toContain("ติดตามงานต่อสัญญาและยกเลิก");
  });

  it("renders the Completed filter option on the workspace select", async () => {
    const markup = await html(<TrackingWorkspace />);
    expect(markup).toContain('<option value="Completed">เสร็จแล้ว</option>');
    expect(markup).toContain('<option value="Overdue">เกินกำหนด</option>');
  });
});

describe("tracking workspace surface", () => {
  beforeEach(() => { trackingDataHolder.value = trackingData; });
  it("renders one heading, a scrollable table region, SLA badges with tones, and capability-preserving back links", async () => {
    const markup = await html(<TrackingWorkspace />);
    expect(markup.match(/<h1/g)?.length).toBe(1);
    expect(markup).toContain('role="region"');
    expect(markup).toContain('aria-label="ตารางติดตามงานต่อสัญญาและยกเลิก เลื่อนแนวนอนได้"');
    expect(markup).toContain('ui-status ui-status-success');
    expect(markup).toContain('ui-status ui-status-warning');
    expect(markup).toContain('ui-status ui-status-neutral');
    expect(markup).toContain('เสร็จแล้ว');
    expect(markup).toContain('เกินกำหนด');
    expect(markup).toContain('อยู่ในกำหนด');
    expect(markup).toContain('href="/duct-rental/renewal/t-1">เปิดงาน</a>');
    expect(markup).toContain('href="/duct-rental/cancellation/t-2">เปิดงาน</a>');
    expect(markup).toContain('<strong>3</strong>');
    expect(markup).toContain('เสร็จแล้ว</span><strong>1</strong>');
    expect(markup).toContain('ใกล้ครบกำหนด</span><strong>1</strong>');
    expect(markup).toContain('เกินกำหนด</span><strong>1</strong>');
  });

  it("shows empty state when no rows match the filters", async () => {
    trackingDataHolder.value = emptyData;
    const markup = await html(<TrackingWorkspace />);
    trackingDataHolder.value = trackingData;
    expect(markup).toContain("ไม่พบรายการตามเงื่อนไข");
    expect(markup).not.toContain("เปิดงาน");
  });

  it("renders the loading shell when data is loading", async () => {
    trackingDataHolder.value = { data: undefined, error: "", loading: true, online: true, changed: false, realtime: "connecting", refresh: vi.fn() };
    const markup = await html(<TrackingWorkspace />);
    trackingDataHolder.value = trackingData;
    expect(markup).toContain("loading-workspace");
    expect(markup).toContain("skeleton-table");
  });
});

describe("process list actions are permission-gated", () => {
  it("shows the create action only when the create permission exists", async () => {
    const allowed = await html(<ProcessList kind="renewal" permissions={["duct_rental.module.view", "duct_rental.renewal.create"]} />);
    expect(allowed).toContain("สร้างงานต่อสัญญารายปี");
    const denied = await html(<ProcessList kind="renewal" permissions={["duct_rental.module.view"]} />);
    expect(denied).not.toContain("สร้างงานต่อสัญญารายปี");
    expect(denied).toContain('role="region"');
  });

  it("shows the cancellation create link only with the cancellation permission", async () => {
    const allowed = await html(<ProcessList kind="cancellation" permissions={["duct_rental.module.view", "duct_rental.cancellation.create"]} />);
    expect(allowed).toContain("ขอยกเลิกการใช้ท่อ");
    const denied = await html(<ProcessList kind="cancellation" permissions={["duct_rental.module.view"]} />);
    expect(denied).not.toContain("ขอยกเลิกการใช้ท่อ");
  });
});
