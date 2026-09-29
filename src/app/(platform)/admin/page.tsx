import { and, asc, count, desc, eq, gt, isNull, lte, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { auditLogs, authSessions, dataScopeGrants, permissions, positions, profiles, rolePermissions, roles, teams, userRoleAssignments, userTeams } from "@/db/schema";
import { AdminWorkspace } from "@/components/admin-workspace";
import { getIdentityAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { adminCapabilityCatalog } from "@/lib/admin-access-contract";
import "./admin.css";

export default async function AdminPage() {
  const access = await getIdentityAccessContext();
  const permissionsGranted = {
    users: isAuthorized(access.subject, "core.user.manage"), profiles: isAuthorized(access.subject, "core.profile.read"),
    positions: isAuthorized(access.subject, "core.position.manage"), teams: isAuthorized(access.subject, "core.team.manage"),
    roles: isAuthorized(access.subject, "core.role.manage"), audit: isAuthorized(access.subject, "core.audit.read"),
  };
  if (!Object.values(permissionsGranted).some(Boolean)) redirect("/");
  const canReadUsers = permissionsGranted.users || permissionsGranted.profiles;
  const needsAccessReferences = permissionsGranted.users || permissionsGranted.positions || permissionsGranted.roles;
  const now = new Date();
  const [userRows, positionRows, roleRows, teamRows, rolePermissionRows, userScopeRows, sessionRows, auditRows] = await Promise.all([
    canReadUsers ? getDb().select({ id: profiles.id, email: profiles.email, displayName: profiles.displayName, employeeCode: profiles.employeeCode,
      status: profiles.status, positionId: profiles.positionId, positionName: positions.name, teamId: userTeams.teamId }).from(profiles)
      .leftJoin(positions, eq(positions.id, profiles.positionId)).leftJoin(userTeams, and(eq(userTeams.userId, profiles.id), eq(userTeams.isPrimary, true))).orderBy(asc(profiles.displayName)) : Promise.resolve([]),
    needsAccessReferences ? getDb().select({ id: positions.id, code: positions.code, name: positions.name, scopeType: positions.scopeType, roleId: positions.roleId, roleName: roles.name })
      .from(positions).leftJoin(roles, eq(roles.id, positions.roleId)).where(eq(positions.isActive, true)).orderBy(asc(positions.name)) : Promise.resolve([]),
    needsAccessReferences ? getDb().select({ id: roles.id, code: roles.code, name: roles.name, description: roles.description, isSystem: roles.isSystem }).from(roles).orderBy(asc(roles.name)) : Promise.resolve([]),
    (permissionsGranted.users || permissionsGranted.teams || permissionsGranted.positions) ? getDb().select({ id: teams.id, code: teams.code, name: teams.name }).from(teams).where(eq(teams.isActive, true)).orderBy(asc(teams.name)) : Promise.resolve([]),
    needsAccessReferences ? getDb().select({ roleId: rolePermissions.roleId, code: permissions.code, description: permissions.description })
      .from(rolePermissions).innerJoin(permissions, eq(permissions.code, rolePermissions.permissionCode)).orderBy(asc(permissions.code)) : Promise.resolve([]),
    canReadUsers ? getDb().select({ userId: userRoleAssignments.userId, scopeType: dataScopeGrants.scopeType, selectedTeamId: dataScopeGrants.selectedTeamId })
      .from(userRoleAssignments).innerJoin(dataScopeGrants, and(eq(dataScopeGrants.assignmentId, userRoleAssignments.id), isNull(dataScopeGrants.permissionCode)))
      .where(and(lte(userRoleAssignments.validFrom, now), or(isNull(userRoleAssignments.validUntil), gt(userRoleAssignments.validUntil, now)))) : Promise.resolve([]),
    permissionsGranted.users ? getDb().select({ userId: authSessions.userId, count: count() }).from(authSessions).where(gt(authSessions.expiresAt, now)).groupBy(authSessions.userId) : Promise.resolve([]),
    permissionsGranted.audit ? getDb().select({ id: auditLogs.id, actorId: auditLogs.actorId, moduleId: auditLogs.moduleId, action: auditLogs.action,
      entityType: auditLogs.entityType, entityId: auditLogs.entityId, createdAt: auditLogs.createdAt }).from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(100) : Promise.resolve([]),
  ]);
  return <AdminWorkspace users={userRows} positions={positionRows} roles={roleRows} teams={teamRows} rolePermissions={rolePermissionRows}
    userScopes={userScopeRows} sessions={sessionRows} auditRows={auditRows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))}
    capabilities={adminCapabilityCatalog} permissionsGranted={permissionsGranted}/>;
}
