"use client";
import { copy } from "@/lib/copy";

import { useActionState, useRef, useState } from "react";
import {
  createPositionAction, createRoleAction, createTeamAction, createUserAction, deleteTeamAction,
  deleteRoleAction, resetPasswordAction, revokeUserSessionsAction, updatePositionAction, updateRolePermissionsAction,
  updateTeamAction, updateUserAccessAction, type AdminActionState,
} from "@/app/(platform)/admin/actions";
import { effectiveCapabilityGroups } from "@/lib/admin-access-contract";
import type { ModuleCapability } from "@/lib/module-contract";

type AdminUser = { id: string; email: string; displayName: string | null; employeeCode: string | null; status: string; positionId: string | null; positionName: string | null; teamId: string | null };
type AdminPosition = { id: string; code: string; name: string; scopeType: string; roleId: string; roleName: string | null };
type AdminRole = { id: string; code: string; name: string; description: string | null; isSystem: boolean };
type AdminTeam = { id: string; code: string; name: string };
type AdminPermission = { roleId: string; code: string; description: string | null };
type AdminCapability = ModuleCapability & { moduleId: string; moduleName: string };
type UserScope = { userId: string; scopeType: string; selectedTeamId: string | null };
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

function EditUserDialog({ user, positions, teams, rolePermissions, userScopes, sessionCount }: {
  user: AdminUser; positions: AdminPosition[]; teams: AdminTeam[]; rolePermissions: AdminPermission[]; userScopes: UserScope[]; sessionCount: number;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [positionId, setPositionId] = useState(user.positionId || "");
  const initialScope = userScopes[0]?.scopeType || positions.find((item) => item.id === user.positionId)?.scopeType || "OWN";
  const [scopeType, setScopeType] = useState(initialScope);
  const [teamId, setTeamId] = useState(user.teamId || "");
  const [selectedTeams, setSelectedTeams] = useState(() => userScopes.map((scope) => scope.selectedTeamId).filter(Boolean) as string[]);
  const [profileState, updateProfile, profilePending] = useActionState(updateUserAccessAction, initial);
  const [passwordState, resetPassword, passwordPending] = useActionState(resetPasswordAction, initial);
  const [sessionState, revokeSessions, sessionPending] = useActionState(revokeUserSessionsAction, initial);
  const position = positions.find((item) => item.id === positionId);
  const permissionCodes = position ? rolePermissions.filter((permission) => permission.roleId === position.roleId).map((permission) => permission.code) : [];
  const groups = effectiveCapabilityGroups(permissionCodes);
  const selectedTeamNames = teams.filter((team) => selectedTeams.includes(team.id)).map((team) => team.name);

  return <>
    <button type="button" className="secondary-action admin-edit-trigger" onClick={() => dialogRef.current?.showModal()}>จัดการการเข้าถึง</button>
    <dialog ref={dialogRef} className="admin-user-dialog" aria-labelledby={`edit-user-${user.id}`}>
      <div className="admin-dialog-head"><div><p>บัญชีผู้ใช้และสิทธิ์ที่จะได้รับ</p><h2 id={`edit-user-${user.id}`}>{user.displayName || user.email}</h2><span>{user.email}</span></div><button type="button" onClick={() => dialogRef.current?.close()} aria-label="ปิดหน้าต่างแก้ไข">×</button></div>
      <form action={updateProfile} className="admin-user-edit-form"><input type="hidden" name="userId" value={user.id}/>
        <section className="admin-dialog-fields" aria-label="ข้อมูลบัญชี"><h3>ข้อมูลผู้ใช้</h3>
          <label>ชื่อที่แสดง<input name="displayName" defaultValue={user.displayName || ""} minLength={2} maxLength={120} required/></label>
          <label>อีเมลสำหรับเข้าสู่ระบบ<input name="email" type="email" defaultValue={user.email} maxLength={254} required/></label>
          <label>รหัสพนักงาน<input name="employeeCode" defaultValue={user.employeeCode || ""} maxLength={64}/></label>
          <label>สถานะบัญชี<select name="status" defaultValue={user.status}><option value="active">เปิดใช้งาน</option><option value="inactive">ระงับการใช้งาน</option></select></label>
          <h3>ตำแหน่ง ทีม และขอบเขตข้อมูล</h3>
          <label>ตำแหน่ง<select name="positionId" value={positionId} onChange={(event) => { const next = event.target.value; setPositionId(next); setScopeType(positions.find((item) => item.id === next)?.scopeType || "OWN"); }} required><option value="">เลือกตำแหน่ง</option>{positions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>ทีมหลัก<select name="teamId" value={teamId} onChange={(event) => setTeamId(event.target.value)} required={scopeType === "TEAM"}><option value="">ไม่กำหนดทีม</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
          <label className="admin-span">ขอบเขตข้อมูล<select name="scopeType" value={scopeType} onChange={(event) => setScopeType(event.target.value)}><option value="OWN">OWN · เฉพาะงานตนเอง</option><option value="TEAM">TEAM · ทีมหลัก</option><option value="SELECTED_TEAMS">SELECTED_TEAMS · เลือกหลายทีม</option><option value="ALL">ALL · ทุกข้อมูล</option></select></label>
          {scopeType === "SELECTED_TEAMS" && <fieldset className="admin-team-picker admin-span"><legend>ทีมที่เข้าถึงได้</legend>{teams.map((team) => <label key={team.id}><input type="checkbox" name="selectedTeamId" value={team.id} checked={selectedTeams.includes(team.id)} onChange={(event) => setSelectedTeams((current) => event.target.checked ? [...current, team.id] : current.filter((id) => id !== team.id))}/>{team.name}</label>)}</fieldset>}
        </section>
        <aside className="admin-access-preview" aria-live="polite"><div><span>ตัวอย่างสิทธิ์ที่จะได้รับ</span><strong>{position?.roleName || "ยังไม่เลือกตำแหน่ง"}</strong></div><div><span>ขอบเขตข้อมูล</span><strong>{scopeLabel(scopeType)}</strong>{scopeType === "TEAM" && <small className={!teamId ? "warning" : ""}>{teams.find((team) => team.id === teamId)?.name || "ต้องเลือกทีมหลัก"}</small>}{scopeType === "SELECTED_TEAMS" && <small className={!selectedTeamNames.length ? "warning" : ""}>{selectedTeamNames.join(", ") || "ต้องเลือกอย่างน้อยหนึ่งทีม"}</small>}</div>
          <div className="admin-permission-list"><span>สิทธิ์การใช้งาน · {permissionCodes.length} สิทธิ์</span>{Object.entries(groups).length ? Object.entries(groups).map(([moduleId, group]) => <section key={moduleId}><strong>{group.moduleName}</strong><ul>{group.capabilities.map((capability) => <li key={capability.code}><span>✓ {capability.labelTh}</span><details><summary>รายละเอียดเพิ่มเติม</summary><code>{capability.code}</code></details></li>)}</ul></section>) : <p>ยังไม่มีสิทธิ์จากตำแหน่งนี้</p>}</div><p className="admin-access-note">สิทธิ์และขอบเขตข้อมูลจะมีผลเมื่อบันทึกการเปลี่ยนแปลง</p>
        </aside><div className="admin-dialog-result"><Result state={profileState}/></div><footer><button type="button" className="secondary-action" onClick={() => dialogRef.current?.close()}>ยกเลิก</button><button className="primary" disabled={profilePending}>{profilePending ? "กำลังบันทึก…" : "บันทึกข้อมูลและสิทธิ์"}</button></footer>
      </form>
      <section className="admin-security-actions"><div className="admin-password-section"><div><strong>รีเซ็ตรหัสผ่าน</strong><p>บังคับตั้งรหัสใหม่และยกเลิกทุกเซสชัน</p></div><form action={resetPassword}><input type="hidden" name="userId" value={user.id}/><input name="password" type="password" minLength={12} placeholder="รหัสผ่านชั่วคราว" autoComplete="new-password" required/><button className="secondary-action" disabled={passwordPending}>{passwordPending ? "กำลังรีเซ็ต…" : "รีเซ็ต"}</button></form><Result state={passwordState}/></div>
        <div className="admin-session-section"><div><strong>เซสชันที่ใช้งาน {sessionCount}</strong><p>ตัดการเชื่อมต่อทุกอุปกรณ์โดยไม่เปลี่ยนรหัสผ่าน</p></div><form action={revokeSessions}><input type="hidden" name="userId" value={user.id}/><button className="secondary-action" disabled={sessionPending || sessionCount === 0}>{sessionPending ? "กำลังยกเลิก…" : "ยกเลิกทุกเซสชัน"}</button></form><Result state={sessionState}/></div></section>
    </dialog>
  </>;
}

function RoleEditor({ role, permissions, capabilities }: { role: AdminRole; permissions: AdminPermission[]; capabilities: AdminCapability[] }) {
  const [state, action, pending] = useActionState(updateRolePermissionsAction, initial);
  const [deleteState, deleteRole, deletePending] = useActionState(deleteRoleAction, initial);
  const granted = new Set(permissions.filter((permission) => permission.roleId === role.id).map((permission) => permission.code));
  const modules = [...new Set(capabilities.map((item) => item.moduleId))];
  return <details className="admin-role-editor"><summary><span><strong>{role.name}</strong><small>{role.code} · {granted.size} สิทธิ์</small></span><em>{role.isSystem ? "บทบาทมาตรฐาน · ดูได้อย่างเดียว" : "แก้ไข / ลบ"}</em></summary><div className="admin-role-editor-body"><form action={action}><input type="hidden" name="roleId" value={role.id}/><div className="admin-role-meta"><label>รหัสบทบาท<input name="code" defaultValue={role.code} disabled={role.isSystem} required/></label><label>ชื่อบทบาท<input name="name" defaultValue={role.name} disabled={role.isSystem} required/></label><label className="admin-role-description">คำอธิบาย<input name="description" defaultValue={role.description || ""} disabled={role.isSystem}/></label></div>
    <div className="admin-capability-matrix">{modules.map((moduleId) => <fieldset key={moduleId}><legend>{capabilities.find((item) => item.moduleId === moduleId)?.moduleName}</legend>{capabilities.filter((item) => item.moduleId === moduleId).map((capability) => <label key={capability.code}><input type="checkbox" name="permissionCode" value={capability.code} defaultChecked={granted.has(capability.code)} disabled={role.isSystem}/><span><strong>{capability.labelTh}</strong>{capability.risk !== "normal" && <small>{capability.risk}</small>}<details><summary>รายละเอียดเพิ่มเติม</summary><code>{capability.code}</code></details></span></label>)}</fieldset>)}</div>{!role.isSystem && <button className="primary" disabled={pending}>{pending ? "กำลังบันทึก…" : "บันทึกบทบาทและสิทธิ์"}</button>}<Result state={state}/></form>{!role.isSystem && <form action={deleteRole} className="admin-role-delete-form" onSubmit={(event) => { if (!window.confirm(`ยืนยันลบบทบาท ${role.name}? การลบจะลบสิทธิ์ที่ผูกกับบทบาทด้วย`)) event.preventDefault(); }}><input type="hidden" name="roleId" value={role.id}/><button type="submit" className="danger-action" disabled={deletePending}>{deletePending ? "กำลังลบ…" : "ลบบทบาทที่สร้าง"}</button><Result state={deleteState}/></form>}</div></details>;
}

export function AdminWorkspace({ section, users, positions, roles, teams, rolePermissions, userScopes, sessions, auditRows, capabilities, permissionsGranted }: {
  section: string;
  users: AdminUser[]; positions: AdminPosition[]; roles: AdminRole[]; teams: AdminTeam[]; rolePermissions: AdminPermission[]; userScopes: UserScope[];
  sessions: { userId: string; count: number }[]; auditRows: AuditRow[]; capabilities: AdminCapability[]; permissionsGranted: PermissionsGranted;
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
    {section==="users" && (permissionsGranted.users || permissionsGranted.profiles) && <section id="users" className="admin-panel admin-users"><header><div><h2>ผู้ใช้และทบทวนสิทธิ์</h2><p>ตรวจสิทธิ์ที่จะได้รับจากบทบาทและขอบเขตข้อมูลก่อนบันทึก</p></div><strong>{users.length} บัญชี</strong></header>
      <div className="admin-list-toolbar"><label>ค้นหาผู้ใช้<input type="search" value={userQuery} onChange={event=>setUserQuery(event.target.value)} placeholder="ชื่อ อีเมล รหัสพนักงาน หรือทีม"/></label><span role="status">แสดง {visibleUsers.length} จาก {users.length} บัญชี</span></div>
      {permissionsGranted.users && <details className="admin-create-disclosure"><summary>เพิ่มผู้ใช้</summary><form action={createUser} className="admin-form admin-create-row"><label>ชื่อที่แสดง<input name="displayName" required minLength={2}/></label><label>อีเมล<input name="email" type="email" required/></label><label>รหัสพนักงาน<input name="employeeCode"/></label><label>ตำแหน่ง<select name="positionId" required><option value="">เลือกตำแหน่ง</option>{positions.map((position) => <option key={position.id} value={position.id}>{position.name} · {position.roleName}</option>)}</select></label><label>ทีมหลัก<select name="teamId"><option value="">ไม่กำหนดทีม</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label><label>รหัสผ่านชั่วคราว<input name="password" type="password" minLength={12} autoComplete="new-password" required/></label><button className="primary" disabled={userPending || !positions.length}>{userPending ? "กำลังเพิ่ม…" : "เพิ่มผู้ใช้"}</button><Result state={userState}/></form></details>}
      <div className="admin-table-wrap" role="region" aria-label={copy.feedback.usersTable} tabIndex={0}><table><thead><tr><th>ผู้ใช้</th><th>รหัสพนักงาน</th><th>ตำแหน่ง / ทีม</th><th>ขอบเขตข้อมูล</th><th>สถานะ</th>{permissionsGranted.users && <th>จัดการ</th>}</tr></thead><tbody>{visibleUsers.map((user) => { const scopes = userScopes.filter((scope) => scope.userId === user.id); return <tr key={user.id}><td><strong title={user.displayName || undefined}>{user.displayName || "ไม่ระบุชื่อ"}</strong><small>{user.email}</small></td><td>{user.employeeCode || "—"}</td><td><strong>{user.positionName || "ยังไม่กำหนด"}</strong><small>{teams.find((team) => team.id === user.teamId)?.name || "ไม่กำหนดทีม"}</small></td><td>{scopeLabel(scopes[0]?.scopeType || "OWN")}</td><td><span className={`admin-status ${user.status}`}>{user.status === "active" ? "ใช้งาน" : "ระงับ"}</span></td>{permissionsGranted.users && <td><EditUserDialog user={user} positions={positions} teams={teams} rolePermissions={rolePermissions} userScopes={scopes} sessionCount={sessions.find((item) => item.userId === user.id)?.count || 0}/></td>}</tr>; })}</tbody></table></div>
    </section>}
    <div className="admin-grid">
      {section==="positions" && permissionsGranted.positions && <section id="positions" className="admin-panel"><h2>ตำแหน่ง</h2><form action={createPosition} className="admin-form"><label>รหัสตำแหน่ง<input name="code" placeholder="building_officer" required/></label><label>ชื่อตำแหน่ง<input name="name" required/></label><label>บทบาท<select name="roleId" required>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label><label>ขอบเขตเริ่มต้น<select name="scopeType" defaultValue="OWN"><option value="OWN">OWN</option><option value="TEAM">TEAM</option><option value="ALL">ALL</option></select></label><button className="secondary-action" disabled={positionPending}>เพิ่มตำแหน่ง</button><Result state={positionState}/></form><div className="admin-inline-list">{positions.map((position) => <form action={updatePosition} key={position.id}><input type="hidden" name="positionId" value={position.id}/><strong>{position.code}</strong><input name="name" defaultValue={position.name} aria-label={`ชื่อตำแหน่ง ${position.code}`}/><select name="roleId" defaultValue={position.roleId} aria-label={`บทบาทของตำแหน่ง ${position.code}`}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><select name="scopeType" defaultValue={position.scopeType} aria-label={`ขอบเขตเริ่มต้นของตำแหน่ง ${position.code}`}><option value="OWN">OWN</option><option value="TEAM">TEAM</option><option value="ALL">ALL</option></select><button disabled={positionEditPending}>บันทึก</button></form>)}</div><Result state={positionEditState}/></section>}
      {section==="teams" && permissionsGranted.teams && <section id="teams" className="admin-panel admin-team-panel"><header><div><h2>ทีม</h2><p>ใช้ทีมเพื่อกำหนดขอบเขตงานและติดตามผล</p></div><strong>{teams.length} ทีม</strong></header><form action={createTeam} className="admin-team-form"><label>รหัสทีม<input name="code" placeholder="permission_ops" minLength={2} maxLength={64} required/></label><label>ชื่อทีม<input name="name" minLength={2} maxLength={120} required/></label><button className="secondary-action" disabled={teamPending}>เพิ่มทีม</button><Result state={teamState}/></form><div className="admin-team-list">{teams.map((team) => { const memberCount = users.filter((user) => user.teamId === team.id).length; return <div key={team.id} className="admin-team-item"><form action={updateTeam}><input type="hidden" name="teamId" value={team.id}/><span><strong>{team.code}</strong><small>{memberCount} ผู้ใช้</small></span><input name="name" defaultValue={team.name} aria-label={`ชื่อทีม ${team.code}`}/><button disabled={teamEditPending}>บันทึก</button></form><form action={deleteTeam} onSubmit={(event) => { if (!window.confirm(`ยืนยันลบทีม ${team.name}?`)) event.preventDefault(); }}><input type="hidden" name="teamId" value={team.id}/><button type="submit" disabled={deleteTeamPending || memberCount > 0} aria-label={memberCount > 0 ? `ย้ายผู้ใช้ออกจากทีม ${team.name} ก่อนลบ` : `ลบทีม ${team.name}`}>{memberCount > 0 ? "ย้ายผู้ใช้ก่อน" : "ลบ"}</button></form></div>; })}</div><Result state={teamEditState}/><Result state={deleteTeamState}/></section>}
    </div>
    {section==="roles" && permissionsGranted.roles && <section id="roles" className="admin-panel admin-roles"><header><div><h2>บทบาทและสิทธิ์การใช้งาน</h2><p>เลือกสิทธิ์ตามงานที่แต่ละบทบาทต้องรับผิดชอบ</p></div><strong>{roles.length} บทบาท</strong></header><form action={createRole} className="admin-form admin-role-create"><label>รหัสบทบาท<input name="code" required/></label><label>ชื่อบทบาท<input name="name" required/></label><label>คำอธิบาย<input name="description"/></label><label>สร้างจาก<select name="sourceRoleId"><option value="">บทบาทว่าง</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label><button className="secondary-action" disabled={rolePending}>{rolePending ? "กำลังสร้าง…" : "สร้างบทบาท"}</button><Result state={roleState}/></form><div className="admin-role-list">{roles.map((role) => <RoleEditor key={role.id} role={role} permissions={rolePermissions} capabilities={capabilities}/>)}</div></section>}
    {section==="audit" && permissionsGranted.audit && <section id="audit" className="admin-panel admin-audit"><header><div><h2>ประวัติการเปลี่ยนแปลง</h2><p>ดูการเปลี่ยนแปลงล่าสุดได้ที่นี่</p></div><strong>{auditRows.length} รายการ</strong></header><div className="admin-table-wrap" role="region" aria-label={copy.feedback.auditTable} tabIndex={0}><table><thead><tr><th>เวลา</th><th>ผู้ดำเนินการ</th><th>ส่วนงาน</th><th>การเปลี่ยนแปลง</th><th>รายการ</th></tr></thead><tbody>{auditRows.map((row) => <tr key={row.id}><td>{new Date(row.createdAt).toLocaleString("th-TH")}</td><td>{users.find((user) => user.id === row.actorId)?.displayName || row.actorId || "ระบบ"}</td><td>{row.moduleId}</td><td><code>{row.action}</code></td><td>{row.entityType}<small>{row.entityId || "—"}</small></td></tr>)}</tbody></table></div></section>}
  </div>;
}
