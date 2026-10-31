import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sources = [
  readFileSync(new URL("./page.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("./buildings-workspace.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("./map/page.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("./[id]/page.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("./new/page.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("./[id]/edit/page.tsx", import.meta.url), "utf8"),
];

describe("Buildings specialized workspace contract", () => {
  it("keeps canonical screen markers on list and map entry points", () => {
    expect(sources[0]).toContain('data-ui-screen="buildings"');
    expect(sources[1]).toContain('data-ui-screen="buildings"');
    expect(sources[2]).toContain('initialView={scalar(params, "view") === "list" ? "list" : "map"}');
    expect(sources[1]).toContain('aria-pressed={view === "map"}');
    expect(sources[1]).toContain("เพิ่มอาคาร");
    expect(sources[1]).toContain('data-view={view}');
    expect(sources[1]).toContain("LongdoMapCanvas");
    expect(sources[2]).toContain("BuildingsWorkspace");
    expect(sources[3]).toContain('data-ui-screen="building-detail"');
    expect(sources[3]).toContain("building-detail-page");
    expect(sources[4]).toContain('data-ui-screen="building-create"');
    expect(sources[4]).toContain("building-form-page");
    expect(sources[5]).toContain('data-ui-screen="building-edit"');
    expect(sources[5]).toContain("building-form-page");
  });

  it("renders one list heading while retaining scoped actions and controls", () => {
    expect(sources[0]).not.toContain("<PageHeader");
    expect(sources[1]).toContain("<PageHeader");
    expect(sources[1]).toContain('parent={{ label: "ภาพรวม", href: "/" }}');
    expect(sources[1]).toContain("ค้นหาอาคาร ตรวจสอบตำแหน่ง ค่าใช้จ่าย");
    expect(sources[1]).toContain('data-view={view}');
    expect(sources[1]).toContain('canCreate &&');
    expect(sources[1]).toContain('role="search"');
    expect(sources[1]).toContain('aria-label="ค้นหาอาคาร"');
    expect(sources[1]).toContain('aria-controls="permission-filters"');
    expect(sources[1]).toContain('role="status"');
  });

  it("keeps access denied before any buildings header or workspace is rendered", () => {
    expect(sources[0].indexOf("if (!access.allowed)")).toBeGreaterThan(-1);
    expect(sources[0].indexOf("if (!access.allowed)")).toBeLessThan(sources[0].indexOf("<BuildingsWorkspace"));
    expect(sources[0]).toContain("<AccessDenied moduleName=\"ข้อมูลอาคาร\" />");
  });

  it("reports real map scope inputs on both entry routes", () => {
    expect(sources[0]).toContain("loadedCount={data.items.length}");
    expect(sources[0]).toContain("scopeCap={scopeCap}");
    expect(sources[2]).toContain("loadedCount={items.length}");
    expect(sources[2]).toContain("const scopeCap = 10_000");
    expect(sources[1]).toContain("loadedCount");
    expect(sources[1]).toContain("scopeCap");
  });

  it("keeps search-only reset separate from selection dismissal", () => {
    expect(sources[1]).toContain("function reset() { setQuery(\"\"); setFilters(emptyFilters)");
    expect(sources[1]).not.toMatch(/function reset\(\)[^}]*setSelectedId/);
    expect(sources[1]).toContain('onClose={() => setSelectedId(null)}');
  });

});
