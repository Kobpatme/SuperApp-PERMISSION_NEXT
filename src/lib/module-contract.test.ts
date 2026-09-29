import { describe, expect, it } from "vitest";
import { capabilityCatalog, defineModuleRegistry, visibleModules } from "@/lib/module-contract";
import { modules } from "@/lib/module-registry";

const fourth = { ...modules[0], id: "module-four", number: 4, href: "/module-four", order: 40,
  name: "Module 4 fixture", enabledByDefault: false, lifecycle: "disabled", dashboardProvider: undefined, searchProvider: undefined,
  entryPermissions: ["sample.record.read"], capabilities: [{ code: "sample.record.read", labelTh: "ดูตัวอย่าง", descriptionTh: "", allowedScopes: ["OWN"], risk: "normal" }] };
describe("future module contract", () => {
  it("accepts a fourth manifest and exposes its catalog without enabling it", () => {
    const registry = defineModuleRegistry([...modules, fourth]);
    expect(capabilityCatalog(registry).some(cap => cap.code === "sample.record.read")).toBe(true);
    expect(visibleModules(registry, ["sample.record.read"])).toEqual([]);
  });
  it("requires an entry grant even for an enabled new module", () => {
    const registry = defineModuleRegistry([...modules, { ...fourth, enabledByDefault: true, lifecycle: "active" }]);
    expect(visibleModules(registry, [])).toEqual([]);
    expect(visibleModules(registry, ["sample.record.read"]).map(module => module.id)).toEqual(["module-four"]);
  });
  it("rejects duplicate IDs routes capabilities and undeclared entry permissions", () => {
    expect(() => defineModuleRegistry([...modules, modules[0]])).toThrow();
    expect(() => defineModuleRegistry([...modules, { ...fourth, href: modules[0].href }])).toThrow();
    expect(() => defineModuleRegistry([...modules, { ...fourth, capabilities: modules[0].capabilities }])).toThrow();
    expect(() => defineModuleRegistry([{ ...fourth, entryPermissions: ["unknown.entry.read"] }])).toThrow();
  });
});
