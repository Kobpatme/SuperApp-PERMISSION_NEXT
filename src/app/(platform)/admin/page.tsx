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
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

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
  const sections = [
    { id:"overview", label:"ภาพรวม", group:"ภาพรวม", allowed:true, description:"เลือกส่วนที่ต้องการจัดการ หรือตรวจสถานะข้อมูล", count:null },
    { id:"users", label:"ผู้ใช้", group:"บัญชีและองค์กร", allowed:canReadUsers, description:"จัดการบัญชีและทบทวนสิทธิ์ของผู้ใช้", count:userRows.length },
    { id:"positions", label:"ตำแหน่ง", group:"บัญชีและองค์กร", allowed:permissionsGranted.positions, description:"กำหนดตำแหน่ง บทบาท และขอบเขตข้อมูลเริ่มต้น", count:positionRows.length },
    { id:"teams", label:"ทีม", group:"บัญชีและองค์กร", allowed:permissionsGranted.teams, description:"จัดทีมสำหรับมอบหมายงานและกำหนดขอบเขตข้อมูล", count:teamRows.length },
    { id:"roles", label:"บทบาทและสิทธิ์", group:"บัญชีและองค์กร", allowed:permissionsGranted.roles, description:"กำหนดสิทธิ์การใช้งานให้เหมาะกับแต่ละบทบาท", count:roleRows.length },
    { id:"kpi", label:"KPI / SLA", group:"งานและ KPI", allowed:workAdmin.granted.kpi, description:"จัดการ Main KPI, Sub KPI และจำนวนวัน SLA", count:workAdmin.catalog.length },
    { id:"personal-kpi", label:"KPI รายบุคคล", group:"งานและ KPI", allowed:workAdmin.granted.kpi, description:"กำหนด KPI และน้ำหนักของผู้รับผิดชอบแต่ละคน", count:null },
    { id:"calendar", label:"วันหยุด", group:"งานและ KPI", allowed:workAdmin.granted.calendar, description:"จัดการวันหยุดที่ใช้คำนวณกำหนดส่งงาน", count:workAdmin.calendar.length },
    { id:"recalculate", label:"คำนวณงานใหม่", group:"งานและ KPI", allowed:workAdmin.granted.kpi, description:"ตรวจผลกระทบก่อนคำนวณกำหนดส่ง หรือดูตัวอย่าง KPI งานเก่า", count:null },
    { id:"systems", label:"ลิงก์ระบบ", group:"พื้นที่ทำงาน", allowed:workAdmin.granted.systems, description:"จัดการทางลัดและผู้ที่มองเห็นแต่ละระบบ", count:workAdmin.links.length },
    { id:"announcement", label:"ประกาศ", group:"พื้นที่ทำงาน", allowed:workAdmin.granted.announcement, description:"จัดการข้อความประกาศบนหน้าแรก", count:workAdmin.announcements.length },
    { id:"audit", label:"ประวัติการเปลี่ยนแปลง", group:"ตรวจสอบ", allowed:permissionsGranted.audit, description:"ค้นหาและตรวจการเปลี่ยนแปลงในระบบ", count:null },
    { id:"restore", label:"กู้คืนงาน", group:"ตรวจสอบ", allowed:access.permissions.includes("work.task.delete") && access.permissions.includes("work.task.manage"), description:"ตรวจและกู้คืนงานที่ถูกซ่อนจากรายการ", count:workAdmin.deleted.length },
  ].filter(item=>item.allowed);
  const current = sections.find(item=>item.id===params.section) ?? sections[0];
  return <div className="admin-page"><PageHeader title="ผู้ดูแลระบบ" description="จัดการบัญชี สิทธิ์ และการตั้งค่าของพื้นที่ทำงาน" parent={{label:"ภาพรวม",href:"/"}}/>
    <div className="admin-layout"><nav className="admin-navigation" aria-label="ส่วนจัดการระบบ">{[...new Set(sections.map(item=>item.group))].map(group=><div className="admin-navigation-group" key={group}><span>{group}</span>{sections.filter(item=>item.group===group).map(item=><Link key={item.id} href={`/admin?section=${item.id}`} aria-current={current.id===item.id?"page":undefined}>{item.label}</Link>)}</div>)}</nav>
    <div className="admin-content" key={current.id}>
    {current.id==="overview" ? <><section className="admin-overview"><h2>ภาพรวมผู้ดูแล</h2><p>เลือกส่วนที่ต้องการจัดการ</p><div className="admin-overview-grid">{sections.filter(item=>item.id!=="overview").map(item=><Link key={item.id} href={`/admin?section=${item.id}`} className="admin-overview-link"><span><strong>{item.label}</strong><small>{item.description}</small></span>{item.count!==null&&<b>{item.count}<span className="sr-only"> รายการ</span></b>}<span aria-hidden="true">→</span></Link>)}</div></section>{permissionsGranted.audit&&<details className="admin-panel"><summary>สถานะการเชื่อมต่อข้อมูล</summary><ul>{diagnostics.map(source=><li key={source.moduleId}><code>{source.moduleId}</code> · {source.status==="ready"?"พร้อมใช้งาน":"ยังไม่พร้อมใช้งาน"}</li>)}</ul></details>}</> : <>
    <div className="admin-section-heading"><h2>{current.label}</h2><p>{current.description}</p></div>
    {current.id==="audit"&&permissionsGranted.audit&&<form method="get" className="admin-filter-form" aria-label="ตัวกรองประวัติ"><input type="hidden" name="section" value="audit"/><label>ส่วนงาน<input name="auditModule" defaultValue={typeof params.auditModule==="string"?params.auditModule:""}/></label><label>ค้นหาการเปลี่ยนแปลง<input name="auditAction" defaultValue={typeof params.auditAction==="string"?params.auditAction:""}/></label><label>ผู้ดำเนินการ<select name="auditActor" defaultValue={typeof params.auditActor==="string"?params.auditActor:""}><option value="">ทั้งหมด</option>{userRows.map(user=><option key={user.id} value={user.id}>{user.displayName}</option>)}</select></label><label>ตั้งแต่<input type="date" name="auditFrom" defaultValue={typeof params.auditFrom==="string"?params.auditFrom:""}/></label><label>ถึง<input type="date" name="auditTo" defaultValue={typeof params.auditTo==="string"?params.auditTo:""}/></label><div className="admin-filter-actions"><button className="secondary-action">ใช้ตัวกรอง</button><Link href="/admin?section=audit">ล้างตัวกรอง</Link></div></form>}
    <AdminWorkspace section={current.id} users={userRows} positions={positionRows} roles={roleRows} teams={teamRows} rolePermissions={rolePermissionRows}
    userScopes={userScopeRows} sessions={sessionRows} auditRows={auditRows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))}
    capabilities={adminCapabilityCatalog} permissionsGranted={permissionsGranted}/><WorkAdminPanels section={current.id} data={workAdmin}/></>}
    </div></div></div>;
}
