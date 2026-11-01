import { describe, expect, it } from "vitest";
import { getModule, isModuleId, modules } from "@/lib/module-registry";

describe("module registry", () => {
  it("keeps identifiers and routes unique", () => {
    expect(new Set(modules.map((module) => module.id)).size).toBe(modules.length);
    expect(new Set(modules.map((module) => module.href)).size).toBe(modules.length);
  });

  it("resolves only registered modules", () => {
    expect(isModuleId("buildings")).toBe(true);
    expect(isModuleId("unknown")).toBe(false);
    expect(getModule("guarantees")?.href).toBe("/guarantees");
  });

  it("sorts modules by order field", () => {
    const orders = modules.map((module) => module.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(modules.map((module) => module.id)).toEqual([
      "work", "buildings", "guarantees", "car-booking", "duct-rental",
    ]);
  });

  it("exposes navigation metadata for guarantees, buildings, car-booking", () => {
    const guarantees = getModule("guarantees")!;
    expect(guarantees.navigationItems).toBeDefined();
    expect(guarantees.navigationItems?.some((item) => item.href === "/guarantees")).toBe(true);
    expect(guarantees.navigationItems?.some((item) => item.href === "/guarantees?view=installation-team")).toBe(true);
    expect(guarantees.navigationItems?.some((item) => item.activeMatch === "query")).toBe(true);

    const buildings = getModule("buildings")!;
    expect(buildings.navigationItems).toBeDefined();
    expect(buildings.navigationItems?.some((item) => item.href === "/buildings/new")).toBe(true);

    const carBooking = getModule("car-booking")!;
    expect(carBooking.navigationItems).toBeDefined();
    expect(carBooking.navigationItems?.some((item) => item.href === "/car-booking")).toBe(true);
  });
});
