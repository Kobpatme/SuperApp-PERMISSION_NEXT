import { copy } from "@/lib/copy";
import type { Metadata } from "next";
export const metadata: Metadata = { title: copy.pages.admin };
import { and, asc, count, desc, eq, gt, gte, ilike, isNull, lte, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { auditLogs, authSessions, dataScopeGrants, permissions, positions, profiles, rolePermissions, roles, teams, userRoleAssignments, userTeams } from "@/db/schema";
import { AdminWorkspace } from "@/components/admin-workspace";
import { getIdentityAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { adminCapabilityCatalog } from "@/lib/admin-access-contract";
import "./admin.css";
import { getWorkspaceData } from "@/lib/workspace-server";
import { getWorkAdminData } from "@/lib/work-admin-read";
import { WorkAdminPanels } from "@/features/work/components/admin-panels";
import { businessDateSchema } from "@/lib/work-admin-domain";

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const access = await getIdentityAccessContext();
  const params=await searchParams;
  const workAdmin=await getWorkAdminData();
  const permissionsGranted = {
    users: isAuthorized(access.subject, "core.user.manage"), profiles: isAuthorized(access.subject, "core.profile.read"),
    positions: isAuthorized(access.subject, "core.position.manage"), teams: isAuthorized(access.subject, "core.team.manage"),
    roles: isAuthorized(access.subject, "core.role.manage"), audit: isAuthorized(access.subject, "core.audit.read"),
  };
  if (access.passwordChangeRequired || (!Object.values(permissionsGranted).some(Boolean) && !Object.values(workAdmin.granted).some(Boolean))) redirect("/");
  const auditFilter=and(
    typeof params.auditModule==="string"&&params.auditModule ? eq(auditLogs.moduleId,params.auditModule):undefined,
    typeof params.auditAction==="string"&&params.auditAction ? ilike(auditLogs.action,`%${params.auditAction.slice(0,100).replace(/[\\%_]/g,"\\$&")}%`):undefined,
    typeof params.auditActor==="string"&&/^[0-9a-f-]{36}$/i.test(params.auditActor) ? eq(auditLogs.actorId,params.auditActor):undefined,
    typeof params.auditFrom==="string"&&businessDateSchema.safeParse(params.auditFrom).success ? gte(auditLogs.createdAt,new Date(`${params.auditFrom}T00:00:00+07:00`)):undefined,
    typeof params.auditTo==="string"&&businessDateSchema.safeParse(params.auditTo).success ? lte(auditLogs.createdAt,new Date(`${params.auditTo}T23:59:59.999+07:00`)):undefined,
  );
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
      entityType: auditLogs.entityType, entityId: auditLogs.entityId, createdAt: auditLogs.createdAt }).from(auditLogs).where(auditFilter).orderBy(desc(auditLogs.createdAt)).limit(100) : Promise.resolve([]),
  ]);
  const diagnostics = permissionsGranted.audit ? (await getWorkspaceData()).snapshot.sources : [];
  return <><section className="admin-panel"><h2>ภาพรวมผู้ดูแล</h2><nav className="admin-section-nav" aria-label="ภาพรวมส่วนจัดการ">{canReadUsers && <a href="#users">ผู้ใช้ {userRows.length}</a>}{permissionsGranted.teams && <a href="#teams">ทีม {teamRows.length}</a>}{workAdmin.granted.kpi && <a href="#kpi">KPI {workAdmin.catalog.length}</a>}{workAdmin.granted.calendar && <a href="#calendar">วันหยุด {workAdmin.calendar.length}</a>}{workAdmin.granted.systems && <a href="#systems">ลิงก์ระบบ {workAdmin.links.length}</a>}{workAdmin.granted.announcement && <a href="#announcement">ประกาศ {workAdmin.announcements.length}</a>}{permissionsGranted.audit && <a href="#audit">ประวัติ</a>}</nav></section>{permissionsGranted.audit && <form method="get" className="admin-panel work-form-grid"><label>ส่วนงาน<input name="auditModule" defaultValue={typeof params.auditModule === "string" ? params.auditModule : ""}/></label><label>ค้นหาการเปลี่ยนแปลง<input name="auditAction" defaultValue={typeof params.auditAction === "string" ? params.auditAction : ""}/></label><label>ผู้ดำเนินการ<select name="auditActor" defaultValue={typeof params.auditActor === "string" ? params.auditActor : ""}><option value="">ทั้งหมด</option>{userRows.map(user => <option key={user.id} value={user.id}>{user.displayName}</option>)}</select></label><label>ตั้งแต่<input type="date" name="auditFrom"/></label><label>ถึง<input type="date" name="auditTo"/></label><button className="secondary-action">กรองประวัติ</button></form>}<AdminWorkspace users={userRows} positions={positionRows} roles={roleRows} teams={teamRows} rolePermissions={rolePermissionRows}
    userScopes={userScopeRows} sessions={sessionRows} auditRows={auditRows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))}
    capabilities={adminCapabilityCatalog} permissionsGranted={permissionsGranted}/><WorkAdminPanels data={workAdmin}/>{permissionsGranted.audit && <details className="admin-panel"><summary>สถานะการเชื่อมต่อข้อมูลสำหรับผู้ดูแล</summary><ul>{diagnostics.map(source => <li key={source.moduleId}><code>{source.moduleId}</code> · {source.status === "ready" ? "พร้อมใช้งาน" : "ยังไม่พร้อมใช้งาน"}</li>)}</ul></details>}</>;
}
