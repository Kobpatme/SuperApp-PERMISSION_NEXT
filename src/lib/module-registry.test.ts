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
});
