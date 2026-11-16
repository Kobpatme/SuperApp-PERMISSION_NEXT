import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { capabilities } from "@/lib/module-registry";

/** One canonical module id per capability code prefix, matching the module registry. */
const moduleIdByPrefix: Record<string, string> = {
  work: "work", kpi: "work",
  building: "buildings", guarantee: "guarantees", pricing: "buildings",
  core: "core", activity: "core", notification: "core",
  car_booking: "car-booking", duct_rental: "duct-rental", po_tracking: "po-tracking",
  permission_out: "permission-out", site_facility: "site-facility",
};

describe("permission catalog module ids", () => {
  it("maps every capability to its registry module id", () => {
    for (const capability of capabilities) {
      const prefix = capability.code.split(".")[0];
      expect({ code: capability.code, moduleId: capability.moduleId }).toEqual({ code: capability.code, moduleId: moduleIdByPrefix[prefix] });
    }
  });

  it("keeps the normalization migration aligned with that map", () => {
    const sql = readFileSync("supabase/migrations/0071_permission_module_ids.sql", "utf8");
    for (const moduleId of new Set(Object.values(moduleIdByPrefix))) {
      expect(sql).toContain(`'${moduleId}'`);
    }
  });
});
