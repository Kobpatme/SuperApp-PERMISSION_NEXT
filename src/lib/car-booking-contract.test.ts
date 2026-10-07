import { describe, expect, it } from "vitest";
import { carBookingCapabilities } from "@/lib/capabilities";
import { getModule, modules } from "@/lib/module-registry";
import { defineModuleRegistry, visibleModules } from "@/lib/module-contract";
import { parseCatalogCapabilities } from "@/lib/admin-access-contract";

describe("car booking catalog and activation boundary", () => {
  it("makes both capabilities assignable through the existing admin catalog", () => {
    expect(parseCatalogCapabilities(carBookingCapabilities.map(c => c.code))).toEqual([
      "car_booking.module.use", "car_booking.module.admin",
    ]);
    expect(carBookingCapabilities.map(c => c.allowedScopes)).toEqual([["OWN"], ["ALL"]]);
  });
  it("keeps the incomplete module out of production navigation even when granted", () => {
    const car = getModule("car-booking");
    expect(car).toMatchObject({ href: "/car-booking", icon: "car", lifecycle: "development", enabledByDefault: false });
    expect(visibleModules(modules, ["car_booking.module.use", "car_booking.module.admin"])).toEqual([]);
  });
  it("admin alone can enter after explicit activation and no grant remains hidden", () => {
    const active = defineModuleRegistry([{ ...getModule("car-booking"), lifecycle: "active", enabledByDefault: true }]);
    expect(visibleModules(active, ["car_booking.module.admin"])).toHaveLength(1);
    expect(visibleModules(active, ["car_booking.module.use"])).toHaveLength(1);
    expect(visibleModules(active, [])).toEqual([]);
  });
});
