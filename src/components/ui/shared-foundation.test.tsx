import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button, ButtonLink } from "./button";
import { FilterBar, FormField } from "./form";
import { MetricGrid } from "./metric-grid";
import { Panel } from "./panel";
import { TableRegion } from "./table-region";

describe("shared UI foundation", () => {
  it("renders buttons and links with one canonical variant contract", () => {
    const html = renderToStaticMarkup(<><Button variant="primary">บันทึก</Button><ButtonLink href="/work" variant="secondary">เปิดงาน</ButtonLink></>);

    expect(html).toContain('type="button"');
    expect(html).toContain('class="ui-button ui-button-primary"');
    expect(html).toContain('href="/work"');
    expect(html).toContain('class="ui-button ui-button-secondary"');
  });

  it("renders an accessible panel heading and action region", () => {
    const html = renderToStaticMarkup(<Panel headingId="recent-work-title" title="งานล่าสุด" description="รายการที่ต้องติดตาม" actions={<Button>เพิ่มงาน</Button>}>เนื้อหา</Panel>);

    expect(html).toContain('class="ui-panel"');
    expect(html).toContain('aria-labelledby="recent-work-title"');
    expect(html).toContain('id="recent-work-title"');
    expect(html).toContain('class="ui-panel-actions"');
  });

  it("generates a unique heading id for panels with the same title", () => {
    const html = renderToStaticMarkup(<><Panel title="งานล่าสุด">รายการแรก</Panel><Panel title="งานล่าสุด">รายการที่สอง</Panel></>);
    const labelledBy = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map(match => match[1]);

    expect(labelledBy).toHaveLength(2);
    expect(new Set(labelledBy).size).toBe(2);
  });

  it("renders metrics with shared semantic tone classes", () => {
    const html = renderToStaticMarkup(<MetricGrid label="สรุปงาน" metrics={[{ label: "ทั้งหมด", value: 12, detail: "รายการ", tone: "info" }]} />);

    expect(html).toContain('class="ui-metric-grid"');
    expect(html).toContain('class="ui-metric ui-metric-info"');
    expect(html).toContain("12");
  });

  it("renders labeled filters and keyboard-scrollable tables", () => {
    const html = renderToStaticMarkup(<><FilterBar aria-label="ตัวกรอง"><FormField label="ค้นหา"><input name="q" /></FormField></FilterBar><TableRegion label="รายการ"><table><tbody><tr><td>ข้อมูล</td></tr></tbody></table></TableRegion></>);

    expect(html).toContain('class="ui-filter"');
    expect(html).toContain("ค้นหา");
    expect(html).toContain('class="ui-table-scroll"');
    expect(html).toContain('tabindex="0"');
  });
});
