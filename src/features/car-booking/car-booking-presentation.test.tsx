import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CarBookingWorkspace, getCarBookingTabs } from "./car-booking-workspace";

const labels = (admin: boolean) => getCarBookingTabs(admin).map((tab) => tab.id);

describe("car booking presentation contract", () => {
  it("keeps the ten approved workspace tabs while hiding admin tabs for regular users", () => {
    expect(labels(false)).toEqual(["book", "mine", "return", "calendar", "vehicles"]);
    expect(labels(true)).toEqual([
      "book", "mine", "return", "calendar", "vehicles", "admin", "all", "parking", "reports", "dashboard",
    ]);
  });

  it("keeps the workspace headerless so the route owns the canonical page header", () => {
    const user = renderToStaticMarkup(
      <CarBookingWorkspace userId="user-1" admin={false} canManageAccess={false} />,
    );
    const admin = renderToStaticMarkup(
      <CarBookingWorkspace userId="admin-1" admin={true} canManageAccess={true} />,
    );

    expect((user.match(/<header/g) ?? []).length).toBe(0);
    expect(user).not.toContain("ผู้ดูแลระบบจองรถ");
    expect(user).not.toContain("จัดการสิทธิ์จองรถ");
    expect(admin).toContain("จัดการรถ");
    expect(admin).toContain("จัดสิทธิ์จองรถ");
    expect(admin).toContain("รายงาน OSP");
    expect(admin).toContain("แดชบอร์ด");
  });

  it("defines contained table scrolling, responsive reflow, and visible focus in module CSS", async () => {
    const css = await import("node:fs/promises").then((fs) => fs.readFile(new URL("./car-booking.css", import.meta.url), "utf8"));
    expect(css).toContain("overflow-x:auto");
    expect(css).toContain("@media(max-width:700px)");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("prefers-reduced-motion");
  });
});
