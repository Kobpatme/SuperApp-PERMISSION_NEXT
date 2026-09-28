import { and, asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { permissions, positions, profiles, rolePermissions, roles, teams, userTeams } from "@/db/schema";
import { AdminWorkspace } from "@/components/admin-workspace";
import { getIdentityAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import "./admin.css";

export default async function AdminPage() {
  const access = await getIdentityAccessContext();
  if (!isAuthorized(access.subject, "core.profile.read") && !isAuthorized(access.subject, "core.user.manage")) redirect("/");
  const [userRows, positionRows, roleRows, teamRows, rolePermissionRows] = await Promise.all([
    getDb().select({ id: profiles.id, email: profiles.email, displayName: profiles.displayName, employeeCode: profiles.employeeCode,
      status: profiles.status, positionId: profiles.positionId, positionName: positions.name, teamId: userTeams.teamId }).from(profiles)
      .leftJoin(positions, eq(positions.id, profiles.positionId)).leftJoin(userTeams, and(eq(userTeams.userId, profiles.id), eq(userTeams.isPrimary, true))).orderBy(asc(profiles.displayName)),
    getDb().select({ id: positions.id, code: positions.code, name: positions.name, scopeType: positions.scopeType, roleId: positions.roleId, roleName: roles.name })
      .from(positions).leftJoin(roles, eq(roles.id, positions.roleId)).where(eq(positions.isActive, true)).orderBy(asc(positions.name)),
    getDb().select({ id: roles.id, code: roles.code, name: roles.name }).from(roles).orderBy(asc(roles.name)),
    getDb().select({ id: teams.id, code: teams.code, name: teams.name }).from(teams).where(eq(teams.isActive, true)).orderBy(asc(teams.name)),
    getDb().select({ roleId: rolePermissions.roleId, code: permissions.code, description: permissions.description })
      .from(rolePermissions).innerJoin(permissions, eq(permissions.code, rolePermissions.permissionCode)).orderBy(asc(permissions.code)),
  ]);
  return <AdminWorkspace users={userRows} positions={positionRows} roles={roleRows} teams={teamRows} rolePermissions={rolePermissionRows}/>;
}
