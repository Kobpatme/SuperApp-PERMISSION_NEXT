"use client";
import { AdminActionForm } from "@/components/admin-action-form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { copy } from "@/lib/copy";

import { useActionState, useState } from "react";
import {
  createPositionAction, createRoleAction, createTeamAction, createUserAction, deleteTeamAction,
  deleteRoleAction, resetPasswordAction, revokeUserSessionsAction, updatePositionAction, updateRolePermissionsAction,
  updateTeamAction, updateUserAccessAction, type AdminActionState,
} from "@/app/(platform)/admin/actions";
import { AdminSearchFeedback, ResetPasswordInput } from "./admin-workspace-ux";
import { effectiveCapabilityGroups } from "@/lib/admin-access-contract";
import type { ModuleCapability } from "@/lib/module-contract";
import { modules } from "@/lib/module-registry";

type AdminUser = { id: string; email: string; displayName: string | null; employeeCode: string | null; status: string; positionId: string | null; positionName: string | null; teamId: string | null };
type AdminPosition = { id: string; code: string; name: string; scopeType: string; roleId: string; roleName: string | null };
type AdminRole = { id: string; code: string; name: string; description: string | null; isSystem: boolean };
type AdminTeam = { id: string; code: string; name: string };
type AdminPermission = { roleId: string; code: string; description: string | null };
type AdminCapability = ModuleCapability & { moduleId: string; moduleName: string };
type UserScope = { userId: string; permissionCode: string | null; scopeType: string; selectedTeamId: string | null };
type PositionTeam = { positionId: string; teamId: string };
type AuditRow = { id: string; actorId: string | null; moduleId: string; action: string; entityType: string; entityId: string | null; createdAt: string };
type PermissionsGranted = { users: boolean; profiles: boolean; positions: boolean; teams: boolean; roles: boolean; audit: boolean };
const initial: AdminActionState = { ok: false, message: "" };

function Result({ state }: { state: AdminActionState }) {
  return state.message ? <p className={state.ok ? "admin-success" : "admin-error"} role="status">{state.message}</p> : null;
}

function scopeLabel(scopeType: string) {
  if (scopeType === "ALL") return "ทุกข้อมูลในระบบ";
  if (scopeType === "TEAM") return "ทีมหลักของผู้ใช้";
  if (scopeType === "SELECTED_TEAMS") return "เฉพาะทีมที่เลือก";
  return "เฉพาะงานของผู้ใช้";
}

function EditUserDialog({ user, positions, teams, rolePermissions, userScopes, sessionCount, positionTeams, capabilities }: {
  user: AdminUser; positions: AdminPosition[]; teams: AdminTeam[]; rolePermissions: AdminPermission[]; userScopes: UserScope[]; sessionCount: number; positionTeams: PositionTeam[]; capabilities: AdminCapability[];
}) {
  const [open, setOpen] = useState(false);
  const [positionId, setPositionId] = useState(user.positionId || "");
  const positionTeamIds = (id: string) => positionTeams.filter((row) => row.positionId === id).map((row) => row.teamId);
  const initialScope = userScopes[0]?.scopeType || positions.find((item) => item.id === user.positionId)?.scopeType || "OWN";
  const [scopeType, setScopeType] = useState(initialScope);
  const [teamId, setTeamId] = useState(user.teamId || "");
  const [selectedTeams, setSelectedTeams] = useState(() => {
    const fromUser = userScopes.map((scope) => scope.selectedTeamId).filter(Boolean) as string[];
    return fromUser.length ? fromUser : positionTeamIds(user.positionId || "");
  });
  const [profileState, updateProfile, profilePending] = useActionState(updateUserAccessAction, initial);
  const [passwordState, resetPassword, passwordPending] = useActionState(resetPasswordAction, initial);
  const [sessionState, revokeSessions, sessionPending] = useActionState(revokeUserSessionsAction, initial);
  const position = positions.find((item) => item.id === positionId);
  const permissionCodes = position ? rolePermissions.filter((permission) => permission.roleId === position.roleId).map((permission) => permission.code) : [];
  const groups = effectiveCapabilityGroups(permissionCodes);
  const selectedTeamNames = teams.filter((team) => selectedTeams.includes(team.id)).map((team) => team.name);
  const capabilityOverrides = new Map(userScopes.filter((scope) => scope.permissionCode).map((scope) => [scope.permissionCode as string, scope.scopeType]));

  return <>
    <Button type="button" className="secondary-action admin-edit-trigger" onClick={() => setOpen(true)}>จัดการการเข้าถึง</Button>
    <Dialog open={open} onOpenChange={setOpen} busy={profilePending || passwordPending || sessionPending} title={user.displayName || user.email} description={user.email} className="admin-user-dialog shell-nested-popup">
      <AdminActionForm action={updateProfile} className="admin-user-edit-form"><input type="hidden" name="userId" value={user.id}/>
        <section className="admin-dialog-fields" aria-label="ข้อมูลบัญชี"><h3>ข้อมูลผู้ใช้</h3>
          <label>ชื่อที่แสดง<input className="ui-building-field" name="displayName" defaultValue={user.displayName || ""} minLength={2} maxLength={120} required/></label>
          <label>อีเมลสำหรับเข้าสู่ระบบ<input className="ui-building-field" name="email" type="email" defaultValue={user.email} maxLength={254} required/></label>
          <label>รหัสพนักงาน<input className="ui-building-field" name="employeeCode" defaultValue={user.employeeCode || ""} maxLength={64}/></label>
          <label>สถานะบัญชี<select className="ui-building-field" name="status" defaultValue={user.status}><option value="active">เปิดใช้งาน</option><option value="inactive">ระงับการใช้งาน</option></select></label>
          <h3>ตำแหน่ง ทีม และขอบเขตข้อมูล</h3>
          <label>ตำแหน่ง<select className="ui-building-field" name="positionId" value={positionId} onChange={(event) => { const next = event.target.value; const nextScope = positions.find((item) => item.id === next)?.scopeType || "OWN"; setPositionId(next); setScopeType(nextScope); if (nextScope === "SELECTED_TEAMS") setSelectedTeams(positionTeamIds(next)); }} required><option value="">เลือกตำแหน่ง</option>{positions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>ทีมหลัก<select className="ui-building-field" name="teamId" value={teamId} onChange={(event) => setTeamId(event.target.value)} required={scopeType === "TEAM"}><option value="">ไม่กำหนดทีม</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
          <label className="admin-span">ขอบเขตข้อมูล<select className="ui-building-field" name="scopeType" value={scopeType} onChange={(event) => setScopeType(event.target.value)}><option value="OWN">OWN · เฉพาะงานตนเอง</option><option value="TEAM">TEAM · ทีมหลัก</option><option value="SELECTED_TEAMS">SELECTED_TEAMS · เลือกหลายทีม</option><option value="ALL">ALL · ทุกข้อมูล</option></select></label>
          {scopeType === "SELECTED_TEAMS" && <fieldset className="admin-team-picker admin-span"><legend>ทีมที่เข้าถึงได้</legend>{teams.map((team) => <label key={team.id}><input type="checkbox" name="selectedTeamId" value={team.id} checked={selectedTeams.includes(team.id)} onChange={(event) => setSelectedTeams((current) => event.target.checked ? [...current, team.id] : current.filter((id) => id !== team.id))}/>{team.name}</label>)}</fieldset>}
          {permissionCodes.length > 0 && <details className="admin-capability-scopes admin-span" open={capabilityOverrides.size > 0}>
            <summary>กำหนดขอบเขตเฉพาะสิทธิ์ ({capabilityOverrides.size} รายการ)</summary>
            <p className="admin-access-note">เว้นเป็น “ใช้ขอบเขตด้านบน” เมื่อไม่ต้องการแยก ระบบจะใช้ขอบเขตที่สิทธิ์นั้นประกาศไว้เท่านั้น</p>
            <div className="admin-scope-list">{permissionCodes.map((code) => {
              const capability = capabilities.find((item) => item.code === code);
              return <label key={code}><span>{capability?.labelTh ?? code}</span>
                <select className="ui-building-field" name={`capScope.${code}`} defaultValue={capabilityOverrides.get(code) ?? "DEFAULT"}>
                  <option value="DEFAULT">ใช้ขอบเขตด้านบน</option>
                  {(capability?.allowedScopes ?? ["OWN", "TEAM", "SELECTED_TEAMS", "ALL"]).map((scope) => <option key={scope} value={scope}>{scope}</option>)}
                </select>
              </label>;
            })}</div>
          </details>}
        </section>
        <aside className="admin-access-preview" aria-live="polite"><div><span>ตัวอย่างสิทธิ์ที่จะได้รับ</span><strong>{position?.roleName || "ยังไม่เลือกตำแหน่ง"}</strong></div><div><span>ขอบเขตข้อมูล</span><strong>{scopeLabel(scopeType)}</strong>{scopeType === "TEAM" && <small className={!teamId ? "warning" : ""}>{teams.find((team) => team.id === teamId)?.name || "ต้องเลือกทีมหลัก"}</small>}{scopeType === "SELECTED_TEAMS" && <small className={!selectedTeamNames.length ? "warning" : ""}>{selectedTeamNames.join(", ") || "ต้องเลือกอย่างน้อยหนึ่งทีม"}</small>}</div>
          <div className="admin-permission-list"><span>สิทธิ์การใช้งาน · {permissionCodes.length} สิทธิ์</span>{Object.entries(groups).length ? Object.entries(groups).map(([moduleId, group]) => <section key={moduleId}><strong>{group.moduleName}</strong><ul>{group.capabilities.map((capability) => <li key={capability.code}><span>✓ {capability.labelTh}</span><details><summary>รายละเอียดเพิ่มเติม</summary><code>{capability.code}</code></details></li>)}</ul></section>) : <p>ยังไม่มีสิทธิ์จากตำแหน่งนี้</p>}</div><p className="admin-access-note">สิทธิ์และขอบเขตข้อมูลจะมีผลเมื่อบันทึกการเปลี่ยนแปลง</p>
        </aside><div className="admin-dialog-result"><Result state={profileState}/></div><footer><Button type="button" variant="secondary" onClick={() => setOpen(false)}>ยกเลิก</Button><Button type="submit" variant="primary" disabled={profilePending}>{profilePending ? "กำลังบันทึก…" : "บันทึกข้อมูลและสิทธิ์"}</Button></footer>
      </AdminActionForm>
      <section className="admin-security-actions"><div className="admin-password-section"><div><strong>รีเซ็ตรหัสผ่าน</strong><p>บังคับตั้งรหัสใหม่และยกเลิกทุกเซสชัน</p></div><AdminActionForm action={resetPassword} resetOnSuccess={passwordState.ok} confirmation={{ title: "รีเซ็ตรหัสผ่าน", consequence: `${user.displayName || user.email} (${user.email}) · ผู้ใช้ต้องตั้งรหัสผ่านใหม่และทุกเซสชันจะถูกยกเลิก`, label: "รีเซ็ตรหัสผ่าน" }}><input type="hidden" name="userId" value={user.id}/><ResetPasswordInput userId={user.id}/><Button type="submit" variant="secondary" disabled={passwordPending}>{passwordPending ? "กำลังรีเซ็ต…" : "รีเซ็ต"}</Button></AdminActionForm><Result state={passwordState}/></div>
        <div className="admin-session-section"><div><strong>เซสชันที่ใช้งาน {sessionCount}</strong><p>ตัดการเชื่อมต่อทุกอุปกรณ์โดยไม่เปลี่ยนรหัสผ่าน</p></div><AdminActionForm action={revokeSessions} confirmation={{ title: "ยกเลิกทุกเซสชัน", consequence: `${user.displayName || user.email} (${user.email}) · ทุกอุปกรณ์จะถูกตัดการเชื่อมต่อ โดยไม่เปลี่ยนรหัสผ่าน`, label: "ยกเลิกทุกเซสชัน" }}><input type="hidden" name="userId" value={user.id}/><Button type="submit" variant="secondary" disabled={sessionPending || sessionCount === 0}>{sessionPending ? "กำลังยกเลิก…" : "ยกเลิกทุกเซสชัน"}</Button></AdminActionForm><Result state={sessionState}/></div></section>
    </Dialog>
  </>;
}

/** Module visibility follows the same rule as the server: a role sees a module when it holds one of the module's entry permissions. */
function roleModuleVisibility(granted: ReadonlySet<string>) {
  return modules.map((module) => ({
    id: module.id,
    name: module.name,
    visible: module.entryPermissions.some((code) => granted.has(code)),
  }));
}

function RoleEditor({ role, permissions, capabilities }: { role: AdminRole; permissions: AdminPermission[]; capabilities: AdminCapability[] }) {
  const [state, action, pending] = useActionState(updateRolePermissionsAction, initial);
  const [deleteState, deleteRole, deletePending] = useActionState(deleteRoleAction, initial);
  const granted = new Set(permissions.filter((permission) => permission.roleId === role.id).map((permission) => permission.code));
  const visibility = roleModuleVisibility(granted);
  const visibleCount = visibility.filter((item) => item.visible).length;
  const moduleIds = [...new Set(capabilities.map((item) => item.moduleId))];
  const entryByModule = new Map<string, string[]>();
  for (const moduleId of moduleIds) {
    const manifest = modules.find((mod) => mod.id === moduleId);
    if (manifest) entryByModule.set(moduleId, manifest.entryPermissions);
  }
  return <details className="admin-role-editor"><summary><span><strong>{role.name}</strong><small>{role.code} · {granted.size} สิทธิ์</small></span><em>{role.isSystem ? "บทบาทมาตรฐาน · ดูได้อย่างเดียว" : "แก้ไข / ลบ"}</em></summary><div className="admin-role-editor-body"><AdminActionForm action={action}><input type="hidden" name="roleId" value={role.id}/><div className="admin-role-meta"><label>รหัสบทบาท<input className="ui-building-field" name="code" defaultValue={role.code} disabled={role.isSystem} required/></label><label>ชื่อบทบาท<input className="ui-building-field" name="name" defaultValue={role.name} disabled={role.isSystem} required/></label><label className="admin-role-description">คำอธิบาย<input className="ui-building-field" name="description" defaultValue={role.description || ""} disabled={role.isSystem}/></label></div>
    <div className="admin-role-visibility" role="group" aria-label={`โมดูลที่บทบาท ${role.name} มองเห็นได้`}>
      <p className="admin-role-visibility-count">มองเห็น <b>{visibleCount}</b> จาก {visibility.length} โมดูล {role.isSystem ? "· บทบาทมาตรฐาน" : "· บันทึกแล้วมีผลทันที"}</p>
      <ul>{visibility.map((item) => <li key={item.id} className={item.visible ? "is-visible" : "is-hidden"}><span aria-hidden="true">{item.visible ? "✓" : "—"}</span>{item.name}<span className="sr-only">{item.visible ? " มองเห็น" : " ไม่มองเห็น"}</span></li>)}</ul>
    </div>
    <div className="admin-capability-matrix">{moduleIds.map((moduleId) => <fieldset key={moduleId}><legend>{capabilities.find((item) => item.moduleId === moduleId)?.moduleName}</legend>{capabilities.filter((item) => item.moduleId === moduleId).map((capability) => <label key={capability.code}><input type="checkbox" name="permissionCode" value={capability.code} defaultChecked={granted.has(capability.code)} disabled={role.isSystem}/><span><strong>{capability.labelTh}</strong>{entryByModule.get(moduleId)?.includes(capability.code) && <small className="admin-cap-entry">ทางเข้าสู่โมดูล</small>}{capability.risk !== "normal" && <small>{capability.risk}</small>}<details><summary>รายละเอียดเพิ่มเติม</summary><code>{capability.code}</code></details></span></label>)}</fieldset>)}</div>{!role.isSystem && <Button type="submit" variant="primary" disabled={pending}>{pending ? "กำลังบันทึก…" : "บันทึกบทบาทและสิทธิ์"}</Button>}<Result state={state}/></AdminActionForm>{!role.isSystem && <AdminActionForm action={deleteRole} className="admin-role-delete-form" confirmation={{ title: "ลบบทบาทที่สร้าง", consequence: `${role.name} · การลบจะลบสิทธิ์ที่ผูกกับบทบาทด้วย`, label: "ลบบทบาท" }}><input type="hidden" name="roleId" value={role.id}/><Button type="submit" variant="danger" disabled={deletePending}>{deletePending ? "กำลังลบ…" : "ลบบทบาทที่สร้าง"}</Button><Result state={deleteState}/></AdminActionForm>}</div></details>;
}

export function AdminWorkspace({ section, users, positions, roles, teams, rolePermissions, userScopes, sessions, auditRows, capabilities, permissionsGranted, positionTeams }: {
  section: string;
  users: AdminUser[]; positions: AdminPosition[]; roles: AdminRole[]; teams: AdminTeam[]; rolePermissions: AdminPermission[]; userScopes: UserScope[];
  sessions: { userId: string; count: number }[]; auditRows: AuditRow[]; capabilities: AdminCapability[]; permissionsGranted: PermissionsGranted; positionTeams: PositionTeam[];
}) {
  const [userState, createUser, userPending] = useActionState(createUserAction, initial);
  const [positionState, createPosition, positionPending] = useActionState(createPositionAction, initial);
  const [teamState, createTeam, teamPending] = useActionState(createTeamAction, initial);
  const [deleteTeamState, deleteTeam, deleteTeamPending] = useActionState(deleteTeamAction, initial);
  const [roleState, createRole, rolePending] = useActionState(createRoleAction, initial);
  const [positionEditState, updatePosition, positionEditPending] = useActionState(updatePositionAction, initial);
  const [teamEditState, updateTeam, teamEditPending] = useActionState(updateTeamAction, initial);
  const [userQuery,setUserQuery] = useState("");
  const visibleUsers = users.filter(user=>[user.displayName,user.email,user.employeeCode,user.positionName,teams.find(team=>team.id===user.teamId)?.name].some(value=>value?.toLocaleLowerCase("th-TH").includes(userQuery.trim().toLocaleLowerCase("th-TH"))));
  return <div className="admin-workspace">
    {section==="users" && (permissionsGranted.users || permissionsGranted.profiles) && <section id="users" data-admin-surface="users" className="admin-panel admin-users"><header><div className="admin-panel-title"><h2>ผู้ใช้และทบทวนสิทธิ์</h2><span className="admin-status-badge admin-status-neutral">บัญชีและองค์กร</span><p>ตรวจสิทธิ์ที่จะได้รับจากบทบาทและขอบเขตข้อมูลก่อนบันทึก</p></div><strong>{users.length} บัญชี</strong></header>
      <div className="admin-list-toolbar"><label>ค้นหาผู้ใช้<input className="ui-building-field" type="search" value={userQuery} onChange={event=>setUserQuery(event.target.value)} placeholder="ชื่อ อีเมล รหัสพนักงาน หรือทีม"/></label><span role="status">แสดง {visibleUsers.length} จาก {users.length} บัญชี</span></div>
      {permissionsGranted.users && <details className="admin-create-disclosure"><summary>เพิ่มผู้ใช้</summary><AdminActionForm action={createUser} resetOnSuccess={userState.ok} className="admin-form admin-create-row"><label>ชื่อที่แสดง<input className="ui-building-field" name="displayName" required minLength={2}/></label><label>อีเมล<input className="ui-building-field" name="email" type="email" required/></label><label>รหัสพนักงาน<input className="ui-building-field" name="employeeCode"/></label><label>ตำแหน่ง<select className="ui-building-field" name="positionId" required><option value="">เลือกตำแหน่ง</option>{positions.map((position) => <option key={position.id} value={position.id}>{position.name} · {position.roleName}</option>)}</select></label><label>ทีมหลัก<select className="ui-building-field" name="teamId"><option value="">ไม่กำหนดทีม</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label><label>รหัสผ่านชั่วคราว<input className="ui-building-field" name="password" type="password" minLength={12} autoComplete="new-password" required/></label><Button type="submit" variant="primary" disabled={userPending || !positions.length}>{userPending ? "กำลังเพิ่ม…" : "เพิ่มผู้ใช้"}</Button><Result state={userState}/></AdminActionForm></details>}
      <AdminSearchFeedback total={users.length} visible={visibleUsers.length} onClear={() => setUserQuery("")}/>
      <div className="admin-table-wrap" role="region" aria-label={copy.feedback.usersTable} tabIndex={0}><table><thead><tr><th>ผู้ใช้</th><th>รหัสพนักงาน</th><th>ตำแหน่ง / ทีม</th><th>ขอบเขตข้อมูล</th><th>สถานะ</th>{permissionsGranted.users && <th>จัดการ</th>}</tr></thead><tbody>{visibleUsers.map((user) => { const scopes = userScopes.filter((scope) => scope.userId === user.id); return <tr key={user.id}><td><strong title={user.displayName || undefined}>{user.displayName || "ไม่ระบุชื่อ"}</strong><small>{user.email}</small></td><td>{user.employeeCode || "—"}</td><td><strong>{user.positionName || "ยังไม่กำหนด"}</strong><small>{teams.find((team) => team.id === user.teamId)?.name || "ไม่กำหนดทีม"}</small></td><td>{scopeLabel((scopes.find((scope) => !scope.permissionCode) ?? scopes[0])?.scopeType || "OWN")}</td><td><span className={`admin-status ${user.status}`}>{user.status === "active" ? "ใช้งาน" : "ระงับ"}</span></td>{permissionsGranted.users && <td><EditUserDialog user={user} positions={positions} teams={teams} rolePermissions={rolePermissions} userScopes={scopes} sessionCount={sessions.find((item) => item.userId === user.id)?.count || 0} positionTeams={positionTeams} capabilities={capabilities}/></td>}</tr>; })}</tbody></table></div>
    </section>}
    <div className="admin-grid">
      {section==="positions" && permissionsGranted.positions && <section id="positions" data-admin-surface="positions" className="admin-panel"><div className="admin-panel-title"><h2>ตำแหน่ง</h2><span className="admin-status-badge admin-status-neutral">ตั้งค่าองค์กร</span></div><AdminActionForm action={createPosition} className="admin-form"><label>รหัสตำแหน่ง<input className="ui-building-field" name="code" placeholder="building_officer" required/></label><label>ชื่อตำแหน่ง<input className="ui-building-field" name="name" required/></label><label>บทบาท<select className="ui-building-field" name="roleId" required>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label><label>ขอบเขตเริ่มต้น<select className="ui-building-field" name="scopeType" defaultValue="OWN"><option value="OWN">OWN · เฉพาะงานตนเอง</option><option value="TEAM">TEAM · ทีมหลัก</option><option value="SELECTED_TEAMS">SELECTED_TEAMS · เลือกหลายทีม</option><option value="ALL">ALL · ทุกข้อมูล</option></select></label><fieldset className="admin-team-picker admin-span"><legend>ทีมที่เลือก (ใช้เมื่อขอบเขต SELECTED_TEAMS)</legend>{teams.map((team) => <label key={team.id}><input type="checkbox" name="selectedTeamId" value={team.id}/>{team.name}</label>)}</fieldset><Button type="submit" variant="secondary" disabled={positionPending}>เพิ่มตำแหน่ง</Button><Result state={positionState}/></AdminActionForm><div className="admin-inline-list">{positions.map((position) => <AdminActionForm action={updatePosition} key={position.id}><input type="hidden" name="positionId" value={position.id}/><strong>{position.code}</strong><input className="ui-building-field" name="name" defaultValue={position.name} aria-label={`ชื่อตำแหน่ง ${position.code}`}/><select className="ui-building-field" name="roleId" defaultValue={position.roleId} aria-label={`บทบาทของตำแหน่ง ${position.code}`}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><select className="ui-building-field" name="scopeType" defaultValue={position.scopeType} aria-label={`ขอบเขตเริ่มต้นของตำแหน่ง ${position.code}`}><option value="OWN">OWN</option><option value="TEAM">TEAM</option><option value="SELECTED_TEAMS">SELECTED_TEAMS</option><option value="ALL">ALL</option></select><fieldset className="admin-team-picker admin-span"><legend>ทีมที่เลือกของ {position.code}</legend>{teams.map((team) => <label key={team.id}><input type="checkbox" name="selectedTeamId" value={team.id} defaultChecked={positionTeams.some((row) => row.positionId === position.id && row.teamId === team.id)}/>{team.name}</label>)}</fieldset><Button type="submit" disabled={positionEditPending}>บันทึก</Button></AdminActionForm>)}</div><Result state={positionEditState}/></section>}
      {section==="teams" && permissionsGranted.teams && <section id="teams" data-admin-surface="teams" className="admin-panel admin-team-panel"><header><div className="admin-panel-title"><h2>ทีม</h2><span className="admin-status-badge admin-status-neutral">ตั้งค่าองค์กร</span><p>ใช้ทีมเพื่อกำหนดขอบเขตงานและติดตามผล</p></div><strong>{teams.length} ทีม</strong></header><AdminActionForm action={createTeam} className="admin-team-form"><label>รหัสทีม<input className="ui-building-field" name="code" placeholder="permission_ops" minLength={2} maxLength={64} required/></label><label>ชื่อทีม<input className="ui-building-field" name="name" minLength={2} maxLength={120} required/></label><Button type="submit" variant="secondary" disabled={teamPending}>เพิ่มทีม</Button><Result state={teamState}/></AdminActionForm><div className="admin-team-list">{teams.map((team) => { const memberCount = users.filter((user) => user.teamId === team.id).length; return <div key={team.id} className="admin-team-item"><AdminActionForm action={updateTeam}><input type="hidden" name="teamId" value={team.id}/><span><strong>{team.code}</strong><small>{memberCount} ผู้ใช้</small></span><input className="ui-building-field" name="name" defaultValue={team.name} aria-label={`ชื่อทีม ${team.code}`}/><Button type="submit" disabled={teamEditPending}>บันทึก</Button></AdminActionForm><AdminActionForm action={deleteTeam} confirmation={{ title: "ลบทีม", consequence: `ยืนยันลบทีม ${team.name}?`, label: "ลบทีม" }}><input type="hidden" name="teamId" value={team.id}/><Button type="submit" variant="danger" disabled={deleteTeamPending || memberCount > 0} aria-label={memberCount > 0 ? `ย้ายผู้ใช้ออกจากทีม ${team.name} ก่อนลบ` : `ลบทีม ${team.name}`}>{memberCount > 0 ? "ย้ายผู้ใช้ก่อน" : "ลบ"}</Button></AdminActionForm></div>; })}</div><Result state={teamEditState}/><Result state={deleteTeamState}/></section>}
    </div>
    {section==="roles" && permissionsGranted.roles && <section id="roles" data-admin-surface="roles" className="admin-panel admin-roles"><header><div className="admin-panel-title"><h2>บทบาทและสิทธิ์การใช้งาน</h2><span className="admin-status-badge admin-status-neutral">สิทธิ์และการเข้าถึง</span><p>เลือกสิทธิ์ตามงานที่แต่ละบทบาทต้องรับผิดชอบ</p></div><strong>{roles.length} บทบาท</strong></header><AdminActionForm action={createRole} className="admin-form admin-role-create"><label>รหัสบทบาท<input className="ui-building-field" name="code" required/></label><label>ชื่อบทบาท<input className="ui-building-field" name="name" required/></label><label>คำอธิบาย<input className="ui-building-field" name="description"/></label><label>สร้างจาก<select className="ui-building-field" name="sourceRoleId"><option value="">บทบาทว่าง</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label><Button type="submit" variant="secondary" disabled={rolePending}>{rolePending ? "กำลังสร้าง…" : "สร้างบทบาท"}</Button><Result state={roleState}/></AdminActionForm><div className="admin-role-list">{roles.map((role) => <RoleEditor key={role.id} role={role} permissions={rolePermissions} capabilities={capabilities}/>)}</div></section>}
    {section==="audit" && permissionsGranted.audit && <section id="audit" data-admin-surface="audit" className="admin-panel admin-audit"><header><div className="admin-panel-title"><h2>ประวัติการเปลี่ยนแปลง</h2><span className="admin-status-badge admin-status-neutral">ตรวจสอบย้อนหลัง</span><p>ดูการเปลี่ยนแปลงล่าสุดได้ที่นี่</p></div><strong>{auditRows.length} รายการ</strong></header><div className="admin-table-wrap" role="region" aria-label={copy.feedback.auditTable} tabIndex={0}><table><thead><tr><th>เวลา</th><th>ผู้ดำเนินการ</th><th>ส่วนงาน</th><th>การเปลี่ยนแปลง</th><th>รายการ</th></tr></thead><tbody>{auditRows.length ? auditRows.map((row) => <tr key={row.id}><td>{new Date(row.createdAt).toLocaleString("th-TH")}</td><td>{users.find((user) => user.id === row.actorId)?.displayName || row.actorId || "ระบบ"}</td><td>{row.moduleId}</td><td><code>{row.action}</code></td><td>{row.entityType}<small>{row.entityId || "—"}</small></td></tr>) : <tr><td colSpan={5}><p className="admin-empty">ยังไม่มีประวัติการเปลี่ยนแปลง</p></td></tr>}</tbody></table></div></section>}
  </div>;
}
