import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WorkEmpty, WorkMetricStrip, WorkScreenShell } from "./work-screen-shell";

describe("Work shared presentation", () => {
  it("uses the canonical screen, empty-state, and metric primitives", () => {
    const html = renderToStaticMarkup(
      <WorkScreenShell title="งานของฉัน" description="รายการงาน">
        <WorkMetricStrip metrics={[{ label: "ทั้งหมด", value: 3, detail: "รายการ", tone: "info" }]} />
        <WorkEmpty title="ไม่มีงาน" detail="ยังไม่มีรายการ" />
      </WorkScreenShell>,
    );

    expect(html).toContain("data-ui-screen");
    expect(html).toContain('class="ui-metric-grid work-metric-strip"');
    expect(html).toContain('class="ui-empty work-state work-state-empty"');
  });
});
