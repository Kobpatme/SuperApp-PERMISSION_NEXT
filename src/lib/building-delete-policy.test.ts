import { describe, expect, it } from "vitest";
import type { AccessContext } from "./access";
import { canDeleteBuilding } from "./building-delete-policy";

const access: AccessContext = { userId: "admin", email: "", displayName: "", role: "admin", allowed: true,
  passwordChangeRequired: false, isDevelopmentSession: false, permissions: [],
  subject: { userId: "admin", teamIds: ["t1"], grants: [{ permission: "building.record.read", scope: "ALL" }, { permission: "building.record.update", scope: "ALL" }] } };

describe("building deletion permission", () => {
  it("allows an authenticated platform administrator with row grants", () => expect(canDeleteBuilding(access, null)).toBe(true));
  it.each(["manager", "permission", "sale", "viewer", undefined] as const)("denies %s even with all building grants", (role) => expect(canDeleteBuilding({ ...access, role }, "t1")).toBe(false));
  it("denies missing sessions, module access and required password changes", () => {
    expect(canDeleteBuilding({ ...access, userId: "" }, null)).toBe(false);
    expect(canDeleteBuilding({ ...access, allowed: false }, null)).toBe(false);
    expect(canDeleteBuilding({ ...access, passwordChangeRequired: true }, null)).toBe(false);
  });
  it("enforces read and update grants and the building team scope", () => {
    expect(canDeleteBuilding({ ...access, subject: undefined }, null)).toBe(false);
    const scoped = { ...access, subject: { ...access.subject!, grants: access.subject!.grants.map((grant) => ({ ...grant, scope: "TEAM" as const })) } };
    expect(canDeleteBuilding(scoped, "t1")).toBe(true);
    expect(canDeleteBuilding(scoped, "t2")).toBe(false);
    expect(canDeleteBuilding({ ...access, subject: { ...access.subject!, grants: [access.subject!.grants[0]] } }, null)).toBe(false);
  });
});
