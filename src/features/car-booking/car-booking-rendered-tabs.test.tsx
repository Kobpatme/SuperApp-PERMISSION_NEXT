import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { CarCalendarEvent } from "./car-calendar";

const tabControl = globalThis as typeof globalThis & {
  __carBookingForcedTab?: string;
  __carBookingFirstState?: boolean;
  __carBookingStateIndex?: number;
  __carBookingStateOverrides?: Map<number, unknown>;
};
tabControl.__carBookingForcedTab = "book";
tabControl.__carBookingFirstState = true;
tabControl.__carBookingStateIndex = 0;
tabControl.__carBookingStateOverrides = new Map();

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useState: (initial: unknown) => {
      const index = tabControl.__carBookingStateIndex ?? 0;
      tabControl.__carBookingStateIndex = index + 1;
      if (tabControl.__carBookingFirstState) {
        tabControl.__carBookingFirstState = false;
        return [tabControl.__carBookingForcedTab, () => undefined];
      }
      if (tabControl.__carBookingStateOverrides?.has(index)) {
        return [tabControl.__carBookingStateOverrides.get(index), () => undefined];
      }
      return actual.useState(initial);
    },
  };
});

const sampleEvents: CarCalendarEvent[] = [
  {
    car_id: "car-1",
    license_plate: "กข-1234",
    start_time: "2026-10-28T02:00:00.000Z",
    end_time: "2026-10-28T04:00:00.000Z",
  },
];

async function renderWorkspaceTab(
  tab: string,
  admin = true,
  overrides: Map<number, unknown> = new Map(),
) {
  tabControl.__carBookingForcedTab = tab;
  tabControl.__carBookingFirstState = true;
  tabControl.__carBookingStateIndex = 0;
  tabControl.__carBookingStateOverrides = overrides;
  const { CarBookingWorkspace } = await import("./car-booking-workspace");
  return renderToStaticMarkup(
    <CarBookingWorkspace userId="user-1" admin={admin} canManageAccess={admin} />,
  );
}

describe("car booking rendered workspace branches", () => {
  it.each([
    ["book", "จองรถ"],
    ["mine", "รายการของฉัน"],
    ["return", "รายการที่เริ่มแล้วและยังไม่คืน"],
    ["calendar", "ปฏิทินช่วงไม่ว่าง"],
    ["vehicles", "ข้อมูลรถ"],
    ["admin", "จัดการรถ"],
    ["all", "การจองทั้งหมด"],
    ["parking", "รายการชั้นจอด"],
    ["reports", "รายงาน OSP"],
    ["dashboard", "แดชบอร์ดการใช้รถ"],
  ])("renders the %s tab branch with its real heading", async (tab, heading) => {
    const html = await renderWorkspaceTab(tab);
    expect(html).toContain(`<h2>${heading}</h2>`);
    expect(html).toContain(`aria-current="page"`);
  });

  it("keeps regular users from rendering admin-only tab branches", async () => {
    const html = await renderWorkspaceTab("vehicles", false);
    expect(html).toContain("ข้อมูลรถ");
    expect(html).not.toContain("จัดการรถ");
    expect(html).not.toContain("จัดสิทธิ์จองรถ");
  });
});

const sampleBooking = {
  id: "booking-1",
  userId: "user-1",
  employeeName: "ผู้ใช้ทดสอบ",
  carId: "car-1",
  destination: "สำนักงานใหญ่",
  startTime: "2026-10-27T02:00:00.000Z",
  endTime: "2026-10-29T04:00:00.000Z",
  status: "booked",
  startMileage: "100",
  actualReturnTime: null,
};
const sampleVehicle = {
  car_id: "car-1",
  license_plate: "กข-1234",
  parking_floor: "ชั้น 1",
  latest_mileage: "100",
  is_active: true,
  last_user: "ผู้ใช้ทดสอบ",
  using_now: true,
};

function workspaceState(dialog: Record<string, unknown> | null) {
  return new Map<number, unknown>([
    [1, [sampleVehicle]],
    [2, [sampleBooking]],
    [4, ["ชั้น 1"]],
    [17, false],
    [20, dialog],
  ]);
}

describe("car booking rendered dialog and feedback states", () => {
  it.each([
    ["cancel", "ยืนยันยกเลิก", "ยืนยันยกเลิกการจอง"],
    ["return", "คืนรถ", "ยืนยันคืนรถ"],
    ["log", "เพิ่มบันทึกระหว่างทาง", "บันทึกการเดินทาง"],
  ])("renders the %s workflow form in its dialog", async (kind, title, action) => {
    const html = await renderWorkspaceTab("mine", true, workspaceState({ kind, booking: sampleBooking }));
    expect(html).toContain(title);
    expect(html).toContain(action);
  });

  it("renders car administration and journey detail dialog variants", async () => {
    const carHtml = await renderWorkspaceTab("admin", true, workspaceState({ kind: "car", car: sampleVehicle }));
    expect(carHtml).toContain("บันทึกรถ");
    expect(carHtml).toContain("ทะเบียนรถ");

    const logsHtml = await renderWorkspaceTab("mine", true, workspaceState({ kind: "logs", booking: sampleBooking }));
    expect(logsHtml).toContain("กำลังโหลดบันทึก…");

    const gpsHtml = await renderWorkspaceTab("mine", true, workspaceState({ kind: "gps", booking: sampleBooking }));
    expect(gpsHtml).toContain("กำลังโหลดบันทึก…");
  });

  it("renders loading and empty feedback as distinct accessible states", async () => {
    const loadingHtml = await renderWorkspaceTab("book");
    expect(loadingHtml).toContain("กำลังโหลดข้อมูล…");

    const emptyHtml = await renderWorkspaceTab("mine", true, new Map<number, unknown>([
      [1, []],
      [2, []],
      [17, false],
    ]));
    expect(emptyHtml).toContain("ไม่มีรายการในเดือนและตัวกรองที่เลือก");
  });
});

describe("car booking presentational states", () => {
  it("renders calendar events with an accessible event affordance", async () => {
    const { CarCalendar } = await import("./car-calendar");
    const html = renderToStaticMarkup(
      <CarCalendar
        events={sampleEvents}
        anchor="2026-10-28"
        view="day"
        loading={false}
        onDate={() => undefined}
        onView={() => undefined}
      />,
    );
    expect(html).toContain("cb-calendar-event");
    expect(html).toContain("กข-1234");
    expect(html).toContain("aria-label=");
  });

  it("renders the access page affordances without depending on an API response", async () => {
    const { CarAccessWorkspace } = await import("./car-access-workspace");
    const html = renderToStaticMarkup(<CarAccessWorkspace />);
    expect(html).toContain("สิทธิ์ระบบจองรถ");
    expect(html).toContain("ค้นหาผู้ใช้");
    expect(html).toContain("ใช้งาน: จองและจัดการรายการของตนเอง");
  });

  it("renders dialog semantics and a non-mutating close affordance", async () => {
    const { CarBookingDialog } = await import("./car-booking-dialog");
    const onClose = vi.fn();
    const html = renderToStaticMarkup(
      <CarBookingDialog title="ยืนยันยกเลิกการจอง" busy={false} onClose={onClose}>
        <p>ทดสอบการยืนยัน</p>
      </CarBookingDialog>,
    );
    expect(html).toContain("<dialog");
    expect(html).toContain("aria-labelledby");
    expect(html).toContain("ปิดหน้าต่าง");
    expect(html).toContain("ทดสอบการยืนยัน");
    expect(onClose).not.toHaveBeenCalled();
  });
});
