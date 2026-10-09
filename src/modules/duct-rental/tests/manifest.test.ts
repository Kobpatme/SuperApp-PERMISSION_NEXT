import { describe, expect, it } from "vitest";
import { capabilities, getModule, modules } from "@/lib/module-registry";
import { isModuleEnabled, visibleModules } from "@/lib/module-contract";
import { parseCatalogCapabilities } from "@/lib/admin-access-contract";
import { ductRentalCapabilities, ductPhaseResources } from "../capabilities";

describe("duct rental registration", () => {
  it("stays closed even when a user has every duct grant", () => {
    const manifest = getModule("duct-rental")!;
    expect(isModuleEnabled(manifest)).toBe(false);
    expect(visibleModules(modules, ductRentalCapabilities.map(c => c.code)).some(m => m.id === manifest.id)).toBe(false);
  });
  it("exposes separate phase actions in the existing administrator catalog", () => {
    for (const [resource] of ductPhaseResources) {
      for (const action of ["accept", "submit"]) {
        const code = `duct_rental.${resource}.${action}`;
        expect(capabilities.find(c => c.code === code)?.moduleName).toBe("เช่าท่อร้อยสาย");
        expect(parseCatalogCapabilities([code])).toContain(code);
      }
    }
  });
  it("preserves the existing active navigation order", () => {
    expect(modules.filter(isModuleEnabled).map(m => m.id)).toEqual(["work", "buildings", "guarantees", "car-booking"]);
  });
});
