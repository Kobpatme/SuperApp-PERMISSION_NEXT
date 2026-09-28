import type { ModuleId } from "@/lib/module-registry";

export const roles = ["admin", "manager", "permission", "sale", "viewer"] as const;
export type Role = (typeof roles)[number];

export const dataScopeTypes = ["OWN", "TEAM", "SELECTED_TEAMS", "ALL"] as const;
export type DataScopeType = (typeof dataScopeTypes)[number];

export type PermissionGrant = {
  permission: string;
  scope: DataScopeType;
  selectedTeamId?: string;
};

export type ResourceScope = {
  ownerId?: string | null;
  teamId?: string | null;
};

export type AuthorizationSubject = {
  userId: string;
  teamIds: readonly string[];
  grants: readonly PermissionGrant[];
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.includes(value as Role);
}

export function canAccessModule(role: Role | undefined, moduleId: ModuleId) {
  if (!role) return false;
  if (role === "admin") return true;
  if (moduleId === "work") return ["manager", "sale", "viewer"].includes(role);
  if (moduleId === "buildings") return ["manager", "permission", "viewer"].includes(role);
  return ["manager", "permission", "viewer"].includes(role);
}

export function canUploadBuildingDocuments(role: Role | undefined) {
  return role === "admin" || role === "permission";
}

export function canManageModule(role: Role | undefined) {
  return role === "admin" || role === "manager" || role === "permission";
}

function grantCoversResource(grant: PermissionGrant, subject: AuthorizationSubject, resource: ResourceScope) {
  if (grant.scope === "ALL") return true;
  if (grant.scope === "OWN") return Boolean(resource.ownerId && resource.ownerId === subject.userId);
  if (grant.scope === "TEAM") return Boolean(resource.teamId && subject.teamIds.includes(resource.teamId));
  return Boolean(resource.teamId && grant.selectedTeamId === resource.teamId);
}

/** Deny-by-default action and row-scope policy used by server mutations and queries. */
export function isAuthorized(
  subject: AuthorizationSubject | null | undefined,
  permission: string,
  resource: ResourceScope = {},
) {
  if (!subject || !permission) return false;
  return subject.grants.some((grant) => grant.permission === permission && grantCoversResource(grant, subject, resource));
}

/** TL grants never confer access to another assignee's deposit item. */
export function isAssignedGuaranteeTl(subject: AuthorizationSubject | null | undefined, assigneeId: string | null | undefined) {
  return Boolean(subject && assigneeId && assigneeId === subject.userId &&
    isAuthorized(subject, "guarantee.tl.work", { ownerId: subject.userId }));
}

export function assertAuthorized(
  subject: AuthorizationSubject | null | undefined,
  permission: string,
  resource: ResourceScope = {},
) {
  if (!isAuthorized(subject, permission, resource)) {
    throw new AuthorizationError(permission);
  }
}

export class AuthorizationError extends Error {
  readonly status = 403;
  constructor(readonly permission: string) {
    super(`Permission denied: ${permission}`);
    this.name = "AuthorizationError";
  }
}
