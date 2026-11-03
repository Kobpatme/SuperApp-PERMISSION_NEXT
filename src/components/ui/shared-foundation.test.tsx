import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button, ButtonLink } from "./button";
import { FilterBar, FormActions, FormField, FormGrid, FormSection } from "./form";
import { MetricGrid } from "./metric-grid";
import { Panel } from "./panel";
import { TableRegion } from "./table-region";
import { ConfirmDialog, Dialog } from "./dialog";

describe("shared UI foundation", () => {
  it("renders buttons and links with one canonical variant contract", () => {
    const html = renderToStaticMarkup(<><Button variant="primary">บันทึก</Button><ButtonLink href="/work" variant="secondary">เปิดงาน</ButtonLink></>);

    expect(html).toContain('type="button"');
    expect(html).toContain('class="ui-button ui-button-primary"');
    expect(html).toContain('href="/work"');
    expect(html).toContain('class="ui-button ui-button-secondary"');
  });

  it("renders a pending button with stable busy semantics", () => {
    const html = renderToStaticMarkup(<Button variant="primary" pending pendingLabel="กำลังบันทึก…">บันทึก</Button>);

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('disabled=""');
    expect(html).toContain("กำลังบันทึก…");
  });

  it("preserves an explicit aria-busy value when the button is idle", () => {
    const html = renderToStaticMarkup(<Button aria-busy="false">พร้อม</Button>);

    expect(html).toContain('aria-busy="false"');
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

  it("renders the additive field contract without changing legacy wrapping", () => {
    const html = renderToStaticMarkup(<><FormField label="เดิม"><input name="legacy" /></FormField><FormField label="ชื่อ" required controlId="name" describedBy="external" hint="คำแนะนำ" error="ไม่ถูกต้อง"><input id="name" aria-describedby="external name-hint name-error" /></FormField></>);
    expect(html).toContain('class="ui-field"');
    expect(html).toContain('name="legacy"');
    expect(html).toContain('for="name"');
    expect(html).toContain('class="ui-field-required"');
    expect(html).toContain('id="name-hint"');
    expect(html).toContain('id="name-error"');
    expect(html).toContain('role="alert"');
  });

  it("wires a rendered hint id onto a native child", () => {
    const html = renderToStaticMarkup(<FormField label="ชื่อ" controlId="name" hint="คำแนะนำ"><input id="name" /></FormField>);

    expect(html).toContain('aria-describedby="name-hint"');
  });

  it("adds an external describedBy id to a native child", () => {
    const html = renderToStaticMarkup(<FormField label="ชื่อ" controlId="name" describedBy="external-help"><input id="name" /></FormField>);

    expect(html).toContain('aria-describedby="external-help"');
  });

  it("de-duplicates merged describedBy ids", () => {
    const html = renderToStaticMarkup(<FormField label="ชื่อ" controlId="name" describedBy="external name-hint external" hint="คำแนะนำ"><input id="name" aria-describedby="name-hint" /></FormField>);

    expect(html).toContain('aria-describedby="external name-hint"');
  });

  it("does not emit aria-describedby when no description ids exist", () => {
    const html = renderToStaticMarkup(<FormField label="ชื่อ" controlId="name"><input id="name" /></FormField>);

    expect(html).not.toContain("aria-describedby");
  });

  it("keeps custom children un-cloned and exposes description ids as data", () => {
    const CustomControl = () => <input />;
    const html = renderToStaticMarkup(<FormField label="ชื่อ" controlId="name" describedBy="external" hint="คำแนะนำ" error="ไม่ถูกต้อง"><CustomControl /></FormField>);

    expect(html).toContain('data-described-by="external name-hint name-error"');
    expect(html).not.toContain('aria-describedby="external name-hint name-error"');
  });

  it("composes the building-style section, responsive grid, and action variants", () => {
    const html = renderToStaticMarkup(<FormSection legend="ข้อมูล"><FormGrid><FormField label="หนึ่ง"><input /></FormField><FormField label="เต็ม" className="ui-field-full"><input /></FormField></FormGrid></FormSection>);
    const actions = renderToStaticMarkup(<><FormActions variant="page">หน้า</FormActions><FormActions variant="inline">แถว</FormActions><FormActions variant="dialog">กล่อง</FormActions></>);
    expect(html).toContain('<fieldset');
    expect(html).toContain('<legend>ข้อมูล</legend>');
    expect(html).toContain('class="ui-form-grid"');
    expect(html).toContain('ui-field-full');
    expect(actions).toContain('ui-form-actions-page');
    expect(actions).toContain('ui-form-actions-inline');
    expect(actions).toContain('ui-form-actions-dialog');
  });

  it("renders labeled filters and keyboard-scrollable tables", () => {
    const html = renderToStaticMarkup(<><FilterBar aria-label="ตัวกรอง"><FormField label="ค้นหา"><input name="q" /></FormField></FilterBar><TableRegion label="รายการ"><table><tbody><tr><td>ข้อมูล</td></tr></tbody></table></TableRegion></>);

    expect(html).toContain('class="ui-filter"');
    expect(html).toContain("ค้นหา");
    expect(html).toContain('class="ui-table-scroll"');
    expect(html).toContain('tabindex="0"');
  });

  it("renders shared native dialog anatomy with a labelled close action", () => {
    const html = renderToStaticMarkup(<Dialog open title="ยืนยันรายการ" onOpenChange={() => undefined}>รายละเอียด</Dialog>);

    expect(html).toContain("<dialog");
    expect(html).toContain("aria-labelledby=");
    expect(html).toContain("ยืนยันรายการ");
    expect(html).toContain("ปิดหน้าต่าง");
  });

  it("uses a compact canonical surface for confirmations", () => {
    const html = renderToStaticMarkup(<ConfirmDialog open title="ทิ้งข้อมูลหรือไม่" consequence="ข้อมูลจะไม่ถูกบันทึก" onCancel={() => undefined} onConfirm={() => undefined} />);

    expect(html).toContain('class="ui-dialog ui-dialog-confirm"');
    expect(html).toContain('data-dialog-size="compact"');
  });

  it("exposes token-backed width variants without changing dialog anatomy", () => {
    const html = renderToStaticMarkup(<><Dialog open title="รายละเอียด" size="wide" onOpenChange={() => undefined}>เนื้อหา</Dialog><Dialog open title="ยืนยัน" size="compact" onOpenChange={() => undefined}>เนื้อหา</Dialog></>);

    expect(html).toContain('data-dialog-size="wide"');
    expect(html).toContain('data-dialog-size="compact"');
    expect(html.match(/<dialog/g)).toHaveLength(2);
  });
});
