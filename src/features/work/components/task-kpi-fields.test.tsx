import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TaskKpiFields } from "./task-kpi-fields";

describe("TaskKpiFields", () => {
  it("keeps the stable payload names and rule-version field", () => {
    const html = renderToStaticMarkup(<TaskKpiFields rules={[{ id: "rule-1", mainKpi: "คุณภาพ", subKpi: "ตรวจสอบ" }]} />);
    expect(html).toContain('name="mainKpi"');
    expect(html).toContain('name="subKpi"');
    expect(html).toContain('name="ruleVersionId"');
    expect(html).toContain('name="workType"');
    expect(html).toContain('name="contractorName"');
  });

  it("only renders dependent fields for the selected dynamic KPI rule", () => {
    const html = renderToStaticMarkup(<TaskKpiFields rules={[{ id: "rule-1", mainKpi: "คุณภาพ", subKpi: "open job sap" }, { id: "rule-2", mainKpi: "คุณภาพ", subKpi: "ทั่วไป" }]} values={{ main: "คุณภาพ", sub: "open job sap" }} />);
    expect(html).toContain('name="ssrNumber"');
    expect(html).not.toContain('name="ospNumber"');
    expect(html).toContain('value="rule-1"');
  });
});
