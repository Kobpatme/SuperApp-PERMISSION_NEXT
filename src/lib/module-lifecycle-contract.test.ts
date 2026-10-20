import { describe, expect, it } from "vitest";
import { modules } from "./module-registry";
import { effectiveModuleEnabled, moduleLifecycleCapability } from "./module-lifecycle-contract";
describe("owner-approved Core lifecycle contract",()=>{
  it("keeps defaults and active order for existing modules",()=>{
    expect(modules.filter(module=>effectiveModuleEnabled(module)).map(module=>module.id)).toEqual(["work","buildings","guarantees","car-booking"]);
    expect(moduleLifecycleCapability.allowedScopes).toEqual(["ALL"]);
  });
  it("denies disabled overrides and cannot enable a development module",()=>{
    const work=modules.find(module=>module.id==="work")!;
    expect(effectiveModuleEnabled(work,false)).toBe(false);
    expect(effectiveModuleEnabled({...work,enabledByDefault:false},true)).toBe(true);
    expect(effectiveModuleEnabled({...work,lifecycle:"development"},true)).toBe(false);
  });
});
