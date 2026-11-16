import { describe, expect, it } from "vitest";
import { effectiveCapabilityGroups, ownRoleLockoutMessage, parseAssignmentScope, parseCapabilityScopeOverrides, parseCatalogCapabilities } from "@/lib/admin-access-contract";

describe("admin access contract", () => {
  it("accepts only capability codes declared by versioned manifests", () => {
    expect(parseCatalogCapabilities(["building.record.read", "building.record.read", "work.task.read"])).toEqual(["building.record.read", "work.task.read"]);
    expect(() => parseCatalogCapabilities(["custom.root.access"])).toThrow("UNKNOWN_CAPABILITY");
  });

  it("requires valid selected teams and removes them for other scopes", () => {
    const teamId = "11111111-1111-4111-8111-111111111111";
    expect(parseAssignmentScope("SELECTED_TEAMS", [teamId, teamId])).toEqual({ scopeType: "SELECTED_TEAMS", selectedTeamIds: [teamId] });
    expect(parseAssignmentScope("ALL", [teamId])).toEqual({ scopeType: "ALL", selectedTeamIds: [] });
    expect(() => parseAssignmentScope("SELECTED_TEAMS", [])).toThrow("SELECTED_TEAMS_REQUIRED");
  });

  it("builds human-readable effective access groups from catalog entries", () => {
    const groups = effectiveCapabilityGroups(["building.record.read", "guarantee.case.read", "unknown.code"]);
    expect(groups.buildings.capabilities[0].labelTh).toBe("ดูข้อมูลอาคาร");
    expect(groups.guarantees.capabilities[0].labelTh).toBe("ดูเงินประกัน");
    expect(Object.values(groups).flatMap((group) => group.capabilities).some((item) => item.code === "unknown.code")).toBe(false);
  });

  it("blocks removing role management only when it would lock the acting administrator out", () => {
    const base = { isPlatformAdmin: false, actingOnOwnActiveAssignment: true, otherActiveRoleGrantsRoleManage: false };
    expect(ownRoleLockoutMessage({ ...base, nextCapabilityCodes: ["core.user.manage"] })).toContain("ต้องให้ผู้ดูแลระบบอีกคนยืนยัน");
    expect(ownRoleLockoutMessage({ ...base, nextCapabilityCodes: ["core.role.manage"] })).toBeNull();
    expect(ownRoleLockoutMessage({ ...base, nextCapabilityCodes: [], otherActiveRoleGrantsRoleManage: true })).toBeNull();
    expect(ownRoleLockoutMessage({ ...base, isPlatformAdmin: true, nextCapabilityCodes: [] })).toBeNull();
    expect(ownRoleLockoutMessage({ ...base, actingOnOwnActiveAssignment: false, nextCapabilityCodes: [] })).toBeNull();
  });

  it("keeps every capability scope inside the scopes its manifest declares", () => {
    const granted = ["building.record.read", "car_booking.module.use"];
    expect(parseCapabilityScopeOverrides([{ code: "building.record.read", scope: "TEAM" }], granted)).toEqual([{ permissionCode: "building.record.read", scopeType: "TEAM" }]);
    expect(parseCapabilityScopeOverrides([{ code: "car_booking.module.use", scope: "OWN" }], granted)).toEqual([{ permissionCode: "car_booking.module.use", scopeType: "OWN" }]);
    expect(() => parseCapabilityScopeOverrides([{ code: "car_booking.module.use", scope: "ALL" }], granted)).toThrow("SCOPE_NOT_ALLOWED");
    expect(() => parseCapabilityScopeOverrides([{ code: "building.record.read", scope: "NOPE" }], granted)).toThrow("INVALID_SCOPE");
    expect(parseCapabilityScopeOverrides([{ code: "building.record.read", scope: "" }, { code: "building.record.read", scope: "DEFAULT" }, { code: "work.task.read", scope: "ALL" }], granted)).toEqual([]);
  });
});
