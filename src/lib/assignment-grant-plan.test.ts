import { describe, expect, it } from "vitest";
import { adminCapabilityCatalog } from "@/lib/admin-access-contract";
import { buildGrantValues, unsupportedFallbackScope } from "@/lib/assignment-grant-plan";

describe("assignment grant plan", () => {
  it("keeps one default row when no capability is narrowed", () => {
    expect(buildGrantValues({ capabilityCodes: ["core.user.manage"], defaultScope: { scopeType: "ALL", selectedTeamIds: [] }, overrides: [] }))
      .toEqual([{ permissionCode: null, scopeType: "ALL" }]);
  });

  it("expands a selected-team default into one row per team", () => {
    expect(buildGrantValues({ capabilityCodes: ["core.user.manage"], defaultScope: { scopeType: "SELECTED_TEAMS", selectedTeamIds: ["t1", "t2"] }, overrides: [] }))
      .toEqual([
        { permissionCode: null, scopeType: "SELECTED_TEAMS", selectedTeamId: "t1" },
        { permissionCode: null, scopeType: "SELECTED_TEAMS", selectedTeamId: "t2" },
      ]);
  });

  it("writes one row per capability as soon as one of them is narrowed", () => {
    expect(buildGrantValues({
      capabilityCodes: ["core.user.manage", "core.role.manage"],
      defaultScope: { scopeType: "ALL", selectedTeamIds: [] },
      overrides: [{ permissionCode: "core.role.manage", scopeType: "OWN" }],
    })).toEqual([
      { permissionCode: "core.user.manage", scopeType: "ALL" },
      { permissionCode: "core.role.manage", scopeType: "OWN" },
    ]);
  });

  it("expands a narrowed SELECTED_TEAMS capability per team", () => {
    expect(buildGrantValues({
      capabilityCodes: ["core.user.manage"],
      defaultScope: { scopeType: "ALL", selectedTeamIds: ["t1"] },
      overrides: [{ permissionCode: "core.user.manage", scopeType: "SELECTED_TEAMS" }],
    })).toEqual([{ permissionCode: "core.user.manage", scopeType: "SELECTED_TEAMS", selectedTeamId: "t1" }]);
  });

  it("flags a capability that cannot take the fallback scope", () => {
    const restricted = adminCapabilityCatalog.find((item) => !item.allowedScopes.includes("ALL"));
    expect(restricted).toBeTruthy();
    const other = adminCapabilityCatalog.find((item) => item.code !== restricted!.code)!;
    expect(unsupportedFallbackScope([restricted!.code], "ALL", [{ permissionCode: other.code, scopeType: "OWN" }]))
      .toEqual({ code: restricted!.code, label: restricted!.labelTh });
    expect(unsupportedFallbackScope([restricted!.code], restricted!.allowedScopes[0], [])).toBeNull();
    expect(unsupportedFallbackScope([restricted!.code], "ALL", [{ permissionCode: restricted!.code, scopeType: restricted!.allowedScopes[0] }])).toBeNull();
  });
});
