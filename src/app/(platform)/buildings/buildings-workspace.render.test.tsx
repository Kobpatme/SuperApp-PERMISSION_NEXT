import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { PermissionBuildingRow } from "@/lib/permission-building-server";
import { BuildingsWorkspace } from "./buildings-workspace";

vi.mock("next/navigation", () => ({
  usePathname: () => "/buildings",
  useRouter: () => ({ replace: vi.fn() }),
}));

const building = {
  id: "building-1", code: "B-001", nameTh: "อาคารทดสอบ", nameEn: "Test Building", ownerTeamId: null,
  status: "Permission Confirmed", group: "สำนักงาน", type: "อาคารสำนักงาน", surveyType: "สำรวจแล้ว", area: "กรุงเทพฯ", province: "กรุงเทพฯ",
  installType: "ภายในอาคาร", updateDate: "2026-10-01", location: "ชั้น 1", duration: "7", wmPoint: "WM-1", enclosure: "ตู้ 1",
  maxHorizontal: "10", address: "ถนนทดสอบ", remark: "", contact: "", phone: "", mobile: "", email: "", lat: null, lng: null,
  locationAccuracy: null, locationSource: null, locationVerified: false, locationUpdatedAt: null, subdistrict: "", district: "", postcode: "", longdoPlaceId: null,
  canUpdateLocation: true, conditionVersion: null, boq: null, feeReviewRequired: false, conditionEffectiveAt: null, feeReviewValues: [],
} satisfies PermissionBuildingRow;

const css = readFileSync(new URL("./permission-buildings.css", import.meta.url), "utf8");
const mapCss = readFileSync(new URL("../../../features/buildings/map/building-map.css", import.meta.url), "utf8");
const buildingsPage = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

function render(canCreate: boolean, scope?: { truncated: boolean; loadedCount: number; scopeCap: number; total: number }) {
  return renderToStaticMarkup(<BuildingsWorkspace buildings={[building]} total={scope?.total ?? 1} canCreate={canCreate} initialView={scope ? "map" : "list"} truncated={scope?.truncated} loadedCount={scope?.loadedCount} scopeCap={scope?.scopeCap} />);
}

describe("BuildingsWorkspace rendered contract", () => {
  it("renders one heading, search/filter controls, map action, and record fallback", () => {
    const html = render(false);
    expect((html.match(/<h1/g) ?? []).length).toBe(1);
    expect(html).toContain('role="search"');
    expect(html).toContain('aria-label="ค้นหาอาคาร"');
    expect(html).toContain('aria-controls="permission-filters"');
    expect(html).toContain('aria-pressed="false">แผนที่');
    expect(html).toContain("รายการอาคาร");
    expect(html).toContain('href="/buildings/building-1"');
    expect(html).toContain('href="/buildings/building-1/edit"');
    expect(html).not.toContain('href="/buildings/new"');
  });

  it("renders the create action only when permission is granted", () => {
    expect(render(false)).not.toContain("เพิ่มอาคาร");
    expect(render(true)).toContain('href="/buildings/new"');
    expect(render(true)).toContain("เพิ่มอาคาร");
  });

  it("keeps the six summary cards while moving map controls into the closed filter panel", () => {
    const html = renderToStaticMarkup(<BuildingsWorkspace
      buildings={[building]}
      total={925}
      initialView="map"
      initialProvince="กรุงเทพฯ"
      initialMode="heatmap"
      initialCategory="OPEX_MONTHLY"
      initialHeatMetric="amount"
      initialFromDate="2026-01-01"
      initialToDate="2026-12-31"
      initialFiltersOpen
    />);
    const closedHtml = renderToStaticMarkup(<BuildingsWorkspace buildings={[building]} total={925} initialView="map" />);
    expect(closedHtml).toContain('aria-expanded="false"');
    expect(closedHtml).not.toContain('class="permission-filterbar"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('aria-controls="permission-filters"');
    expect(html).toContain('class="permission-overview-summary"');
    expect((html.match(/class="permission-overview-summary/g) ?? []).length).toBe(1);
    expect(html).toContain("อาคารทั้งหมด");
    expect(html).toContain("มีพิกัด");
    expect(html).not.toContain('class="permission-toolbar-metrics"');
    expect(html).not.toContain('class="permission-unified-map-tools"');
    expect(html).not.toContain('class="permission-unified-map-summary"');
    expect(html).toContain('aria-label="กรองตามจังหวัด"');
    expect(html).toContain('aria-label="เลือกมุมมองแผนที่"');
    expect(html).toContain('aria-label="กรองตามหมวดค่าใช้จ่าย"');
    expect(html).toContain('aria-label="เลือกตัวชี้วัดความหนาแน่น"');
    expect(html).toContain('aria-label="กรองวันที่เริ่มต้น"');
    expect(html).toContain('aria-label="กรองวันที่สิ้นสุด"');
    expect(html).toContain('value="2026-01-01"');
    expect(html).toContain('value="2026-12-31"');
  });

  it("states the actual loaded scope and cap instead of a hard-coded page size", () => {
    const html = render(false, { truncated: true, loadedCount: 8765, scopeCap: 10000, total: 12000 });
    expect(html).toContain("โหลดแล้ว 8,765 จาก 12,000 อาคารในขอบเขต");
    expect(html).toContain("สูงสุด 10,000 อาคารต่อการโหลดแผนที่");
    expect(html).not.toContain("สูงสุด 2,000 อาคาร");
  });


  it("uses shared depth only on outer surfaces and keeps data rows flat", () => {
    const presentation = readFileSync(new URL("./buildings-presentation.css", import.meta.url), "utf8");
    expect(presentation).toContain("box-shadow:var(--shadow-raised)");
    expect(presentation).toContain("box-shadow:var(--shadow-inset)");
    expect(presentation).toMatch(/\.permission-workspace \.permission-overview-card \{[^}]*box-shadow:none/);
    expect(presentation).toContain("height:auto; overflow:visible");
    expect(presentation).not.toContain(":root");
  });

  it("leaves canonical shell geometry to the shared shell and allows content scrolling", () => {
    const presentation = readFileSync(new URL("./buildings-presentation.css", import.meta.url), "utf8");
    expect(css).not.toContain("[data-app-shell]:has(.permission-workspace) [data-shell-header]");
    expect(presentation).toContain("height:auto; overflow:visible");
    expect(presentation).toContain(".permission-workspace[data-ui-screen]");
    expect(css).toContain("position:relative;z-index:0;isolation:isolate");
  });

  it("loads the map component stylesheet and styles the real fullscreen control", () => {
    expect(buildingsPage).toContain('import "@/features/buildings/map/building-map.css";');
    expect(mapCss).toContain(".building-longdo-map-canvas{position:absolute;inset:0;width:100%;height:100%;min-height:280px}");
    expect(mapCss).toContain(".building-longdo-fullscreen{position:absolute");
    expect(mapCss).toContain("background:var(--color-surface)!important");
  });

  it("keeps map view full-width while list view remains the all-record fallback", () => {
    const mapHtml = render(false, { truncated: false, loadedCount: 1, scopeCap: 10000, total: 1 });
    expect(mapHtml).toContain('class="permission-unified-map-grid"');
    expect(mapHtml).not.toContain('class="permission-unified-map-list"');
    expect(mapHtml).toContain('aria-pressed="true">แผนที่');
    expect(mapHtml).toContain('aria-pressed="false">รายการ');
  });

  it("keeps the initial map fit contract in the Longdo canvas", () => {
    const canvas = readFileSync(new URL("../../../features/buildings/map/longdo-map-canvas.tsx", import.meta.url), "utf8");
    expect(canvas).toContain("initialFitDoneRef");
    expect(canvas).toContain("map.bound(bounds, undefined, true)");
    expect(canvas).toContain("map.zoom(Math.max(map.zoom(), 15))");
    expect(canvas).toContain("onFallbackToList");
  });
});
