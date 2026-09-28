import { describe, expect, it } from "vitest";
import { assertAuthorized, AuthorizationError, canAccessModule, canManageModule, canUploadBuildingDocuments, isAssignedGuaranteeTl, isAuthorized, isRole } from "@/lib/authorization";

describe("server authorization policy", () => {
  it("rejects missing and unrecognized roles", () => {
    expect(isRole("owner")).toBe(false);
    expect(canAccessModule(undefined, "buildings")).toBe(false);
  });

  it("limits building document uploads", () => {
    expect(canUploadBuildingDocuments("admin")).toBe(true);
    expect(canUploadBuildingDocuments("permission")).toBe(true);
    expect(canUploadBuildingDocuments("manager")).toBe(false);
    expect(canUploadBuildingDocuments("viewer")).toBe(false);
  });

  it("allows only operational roles to manage modules", () => {
    expect(canManageModule("manager")).toBe(true);
    expect(canManageModule("sale")).toBe(false);
  });

  it("denies missing grants and enforces own scope", () => {
    const subject = { userId: "u-1", teamIds: ["t-1"], grants: [{ permission: "work.task.read", scope: "OWN" as const }] };
    expect(isAuthorized(subject, "work.task.update", { ownerId: "u-1" })).toBe(false);
    expect(isAuthorized(subject, "work.task.read", { ownerId: "u-2" })).toBe(false);
    expect(isAuthorized(subject, "work.task.read", { ownerId: "u-1" })).toBe(true);
  });

  it("supports current-team, selected-team and all scopes", () => {
    const subject = {
      userId: "u-1",
      teamIds: ["t-1"],
      grants: [
        { permission: "building.record.read", scope: "TEAM" as const },
        { permission: "guarantee.case.read", scope: "SELECTED_TEAMS" as const, selectedTeamId: "t-2" },
        { permission: "core.audit.read", scope: "ALL" as const },
      ],
    };
    expect(isAuthorized(subject, "building.record.read", { teamId: "t-1" })).toBe(true);
    expect(isAuthorized(subject, "building.record.read", { teamId: "t-2" })).toBe(false);
    expect(isAuthorized(subject, "guarantee.case.read", { teamId: "t-2" })).toBe(true);
    expect(isAuthorized(subject, "core.audit.read", { ownerId: "another-user" })).toBe(true);
  });

  it("throws a typed error when a server guard rejects access", () => {
    expect(() => assertAuthorized(null, "core.role.manage")).toThrow(AuthorizationError);
  });

  it("restricts TL actions to the explicitly assigned user", () => {
    const subject = { userId: "tl-1", teamIds: [], grants: [{ permission: "guarantee.tl.work", scope: "OWN" as const }] };
    expect(isAssignedGuaranteeTl(subject, "tl-1")).toBe(true);
    expect(isAssignedGuaranteeTl(subject, "tl-2")).toBe(false);
    expect(isAssignedGuaranteeTl({ ...subject, grants: [] }, "tl-1")).toBe(false);
  });
});
