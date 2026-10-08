import { and, eq, gt, isNull, lte, or } from "drizzle-orm";
import { getDb } from "@/db";
import { dataScopeGrants, profiles, rolePermissions, roles as rolesTable, userRoleAssignments, userTeams } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { dataScopeTypes, type AuthorizationSubject, type DataScopeType, type Role } from "@/lib/authorization";
import { getModule, type ModuleId } from "@/lib/module-registry";
import { isModuleEnabled } from "@/lib/module-contract";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionFailureReason } from "@/lib/auth";

export type AccessContext = {
  userId: string;
  email: string;
  displayName: string;
  role?: Role;
  permissions: string[];
  subject?: AuthorizationSubject;
  allowed: boolean;
  passwordChangeRequired: boolean;
  isDevelopmentSession: boolean;
};

function isDataScope(value: string): value is DataScopeType {
  return dataScopeTypes.includes(value as DataScopeType);
}

function legacyUiRole(roleCodes: readonly string[]): Role | undefined {
  if (roleCodes.includes("platform_admin")) return "admin";
  if (roleCodes.includes("operations_manager")) return "manager";
  if (roleCodes.includes("permission_specialist")) return "permission";
  if (roleCodes.includes("sales_operator")) return "sale";
  if (roleCodes.includes("viewer")) return "viewer";
}

async function loadSubject(userId: string) {
  if (!process.env.DATABASE_URL) return undefined;
  try {
    const now = new Date();
    const [grantRows, teamRows] = await Promise.all([
      getDb().select({ permission: rolePermissions.permissionCode, scope: dataScopeGrants.scopeType, selectedTeamId: dataScopeGrants.selectedTeamId, roleCode: rolesTable.code })
        .from(userRoleAssignments)
        .innerJoin(profiles, and(eq(profiles.id, userRoleAssignments.userId), eq(profiles.status, "active")))
        .innerJoin(rolesTable, eq(rolesTable.id, userRoleAssignments.roleId))
        .innerJoin(rolePermissions, eq(rolePermissions.roleId, userRoleAssignments.roleId))
        .innerJoin(dataScopeGrants, and(eq(dataScopeGrants.assignmentId, userRoleAssignments.id), or(isNull(dataScopeGrants.permissionCode), eq(dataScopeGrants.permissionCode, rolePermissions.permissionCode))))
        .where(and(eq(userRoleAssignments.userId, userId), lte(userRoleAssignments.validFrom, now), or(isNull(userRoleAssignments.validUntil), gt(userRoleAssignments.validUntil, now)))),
      getDb().select({ teamId: userTeams.teamId }).from(userTeams).where(eq(userTeams.userId, userId)),
    ]);
    const grants = grantRows.flatMap((row) => isDataScope(row.scope) ? [{ permission: row.permission, scope: row.scope, selectedTeamId: row.selectedTeamId ?? undefined }] : []);
    return {
      subject: { userId, teamIds: teamRows.map((row) => row.teamId), grants } satisfies AuthorizationSubject,
      role: legacyUiRole(grantRows.map((row) => row.roleCode)),
    };
  } catch (error) {
    console.error("Unable to load server-side authorization grants", error);
    return undefined;
  }
}

export const getIdentityAccessContext = cache(async function getIdentityAccessContext() {
  const user = await getCurrentUser();
  if (!user && (await headers()).has("next-action")) redirect(`/login?reason=${await getSessionFailureReason()}`);
  if (!user) return { userId: "", email: "", displayName: "", permissions: [] as string[], subject: undefined, role: undefined, passwordChangeRequired: false, isDevelopmentSession: false };
  const authorization = await loadSubject(user.id);
  const email = user.email || "";
  return { userId: user.id, email, displayName: String(user.user_metadata?.display_name || email.split("@")[0] || "ผู้ใช้งาน"),
    role: authorization?.role, permissions: authorization ? [...new Set(authorization.subject.grants.map((grant) => grant.permission))] : [],
    subject: authorization?.subject, passwordChangeRequired: Boolean(user.mustChangePassword), isDevelopmentSession: false };
});

export const getAccessContext = cache(async function getAccessContext(moduleId: ModuleId): Promise<AccessContext> {
  const identity = await getIdentityAccessContext();
  const manifest = getModule(moduleId);
  if (!identity.userId || identity.passwordChangeRequired) return { ...identity, allowed: false };
  return {
    ...identity,
    // Module visibility requires the action grant; row queries still enforce its data scope.
    allowed: Boolean(manifest && isModuleEnabled(manifest) && identity.subject?.grants.some((grant) => manifest.entryPermissions.includes(grant.permission))),
  };
});
