import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const accessState = vi.hoisted(() => ({ allowed: true, admin: false, canManageAccess: false }));

vi.mock("@/lib/access", () => ({
  getAccessContext: vi.fn(async () => ({
    allowed: accessState.allowed,
    userId: accessState.admin ? "admin-1" : "user-1",
    subject: { grants: [] },
  })),
}));
vi.mock("@/lib/authorization", () => ({
  isAuthorized: vi.fn((_subject: unknown, permission: string) =>
    permission === "car_booking.module.admin" ? accessState.admin : accessState.canManageAccess,
  ),
}));
vi.mock("@/features/car-booking/car-booking.css", () => ({}));

describe("car booking route and workspace composition", () => {
  beforeEach(() => {
    accessState.allowed = true;
    accessState.admin = false;
    accessState.canManageAccess = false;
  });

  it.each([
    ["regular user", false, false, "จัดการรายการของตนเอง", false],
    ["access manager", false, true, "จัดการรายการของตนเอง", true],
    ["admin", true, true, "ผู้ดูแลระบบจองรถ", true],
  ])("renders one canonical header with preserved %s controls", async (_role, admin, canManageAccess, scope, hasAccessLink) => {
    accessState.admin = admin;
    accessState.canManageAccess = canManageAccess;
    const { default: CarBookingPage } = await import("./page");
    const html = renderToStaticMarkup(await CarBookingPage());

    expect((html.match(/<h1/g) ?? []).length).toBe(1);
    expect((html.match(/<header/g) ?? []).length).toBe(1);
    expect((html.match(/aria-label=\"เส้นทางนำทาง\"/g) ?? []).length).toBe(1);
    expect(html).toContain("จองและคืนรถ บันทึกการเดินทาง และรายงานการใช้รถ OSP");
    expect(html).toContain(scope);
    expect(html).toContain("เดือนที่แสดง");
    expect(html).toContain("โหลดใหม่");
    if (hasAccessLink) {
      expect(html).toContain("จัดสิทธิ์จองรถ");
    } else {
      expect(html).not.toContain("จัดสิทธิ์จองรถ");
    }
  });

  it("denies a user without car-booking access before composing the workspace", async () => {
    accessState.allowed = false;
    const { default: CarBookingPage } = await import("./page");
    const html = renderToStaticMarkup(await CarBookingPage());

    expect(html).toContain("สิทธิ์การใช้งาน");
    expect(html).not.toContain("เส้นทางนำทาง");
    expect(html).not.toContain("จัดการสิทธิ์จองรถ");
  });
});
