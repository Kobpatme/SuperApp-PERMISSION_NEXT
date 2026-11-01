import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CarBookingDialog } from "./car-booking-dialog";
import { CarCalendar } from "./car-calendar";
import { CarReports } from "./car-reports";
import { CarBookingWorkspace } from "./car-booking-workspace";

// Browser suite exercises effects/native modality; these assert the production markup contract.
describe("unified Car Booking composition", () => {
  it.each([false, true])("keeps shared dialog and pending field ownership, busy=%s", busy => {
    const html = renderToStaticMarkup(<CarBookingDialog title="คืนรถ" busy={busy} protectDraft onClose={() => {}}><form><label>เลขไมล์<input name="mileage" type="number" step="any" /></label></form></CarBookingDialog>);
    expect(html).toContain('class="ui-dialog cb-dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('class="cb-pending-fields"');
    expect(html).toContain('step="any"');
    expect(html.includes('disabled=""')).toBe(busy);
    expect(html.includes('aria-busy="true"')).toBe(busy);
  });
  it("reuses Panel, Button and FormField while leaving the route header authoritative", () => {
    const html = renderToStaticMarkup(<CarBookingWorkspace userId="TEST-user" admin={false} canManageAccess={false} />);
    expect(html).toContain('ui-panel cb-panel');
    expect(html).toContain('ui-button ui-button-primary');
    expect(html).toContain('ui-field-label');
    expect(html).not.toContain('<h1');
    expect(html).toContain('disabled=""');
  });
  it.each(["month", "week", "day"] as const)("keeps calendar %s privacy projection", view => {
    const html = renderToStaticMarkup(<CarCalendar events={[{ car_id: "TEST-car", license_plate: "TEST ทะเบียน", start_time: "2026-11-01T01:00:00Z", end_time: "2026-11-01T03:00:00Z" }]} anchor="2026-11-01" view={view} loading={false} onDate={() => {}} onView={() => {}} />);
    expect(html).toContain('ui-panel cb-panel');
    expect(html).toContain('cb-calendar-' + view);
    expect(html).toContain('TEST ทะเบียน');
    expect(html).not.toContain('employeeName');
    expect(html).not.toContain('destination');
  });
  it("keeps report loading feedback separate from empty, with the original authorized CSV URL", () => {
    const html = renderToStaticMarkup(<CarReports />);
    expect(html).toContain('กำลังโหลดรายงาน…');
    expect(html).not.toContain('ไม่มีรายการคืนรถในช่วงรายงานนี้');
    expect(html).toContain('format=csv');
    expect(html).toContain('ui-panel cb-panel cb-report');
  });
});
