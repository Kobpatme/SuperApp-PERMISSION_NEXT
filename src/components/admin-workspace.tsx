"use client";

import { useActionState, useRef, useState } from "react";
import { createPositionAction, createTeamAction, createUserAction, deleteTeamAction, resetPasswordAction, updateUserAccessAction, type AdminActionState } from "@/app/(platform)/admin/actions";

type AdminUser = { id: string; email: string; displayName: string | null; employeeCode: string | null; status: string; positionId: string | null; positionName: string | null; teamId: string | null };
type AdminPosition = { id: string; code: string; name: string; scopeType: string; roleId: string; roleName: string | null };
type AdminRole = { id: string; code: string; name: string };
type AdminTeam = { id: string; code: string; name: string };
type AdminPermission = { roleId: string; code: string; description: string | null };
const initial: AdminActionState = { ok: false, message: "" };

function Result({ state }: { state: AdminActionState }) {
  return state.message ? <p className={state.ok ? "admin-success" : "admin-error"} role="status">{state.message}</p> : null;
}

function scopeLabel(scopeType: string) {
  if (scopeType === "ALL") return "ทุกข้อมูลในระบบ";
  if (scopeType === "TEAM") return "ข้อมูลของทีมที่กำหนด";
  return "เฉพาะงานของผู้ใช้";
}

function EditUserDialog({ user, positions, teams, rolePermissions }: { user: AdminUser; positions: AdminPosition[]; teams: AdminTeam[]; rolePermissions: AdminPermission[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [positionId, setPositionId] = useState(user.positionId || "");
  const [teamId, setTeamId] = useState(user.teamId || "");
  const [profileState, updateProfile, profilePending] = useActionState(updateUserAccessAction, initial);
  const [passwordState, resetPassword, passwordPending] = useActionState(resetPasswordAction, initial);
  const position = positions.find((item) => item.id === positionId);
  const permissions = position ? rolePermissions.filter((permission) => permission.roleId === position.roleId) : [];
  const selectedTeam = teams.find((team) => team.id === teamId);
  const label = user.displayName || user.email;

  return <>
    <button type="button" className="secondary-action admin-edit-trigger" onClick={() => dialogRef.current?.showModal()}>แก้ไขข้อมูล</button>
    <dialog ref={dialogRef} className="admin-user-dialog" aria-labelledby={`edit-user-${user.id}`}>
      <div className="admin-dialog-head"><div><p>บัญชีผู้ใช้และขอบเขตสิทธิ์</p><h2 id={`edit-user-${user.id}`}>{label}</h2><span>{user.email}</span></div><button type="button" onClick={() => dialogRef.current?.close()} aria-label="ปิดหน้าต่างแก้ไข">×</button></div>
      <form action={updateProfile} className="admin-user-edit-form">
        <input type="hidden" name="userId" value={user.id}/>
        <section className="admin-dialog-fields" aria-label="ข้อมูลบัญชี">
          <h3>ข้อมูลผู้ใช้</h3>
          <label>ชื่อที่แสดง<input name="displayName" defaultValue={user.displayName || ""} minLength={2} maxLength={120} required/></label>
          <label>อีเมลสำหรับเข้าสู่ระบบ<input name="email" type="email" defaultValue={user.email} maxLength={254} required/></label>
          <label>รหัสพนักงาน<input name="employeeCode" defaultValue={user.employeeCode || ""} maxLength={64}/></label>
          <label>สถานะบัญชี<select name="status" defaultValue={user.status}><option value="active">เปิดใช้งาน</option><option value="inactive">ระงับการใช้งาน</option></select></label>
          <h3>ตำแหน่งและทีม</h3>
          <label>ตำแหน่ง<select name="positionId" value={positionId} onChange={(event) => setPositionId(event.target.value)} required><option value="">เลือกตำแหน่ง</option>{positions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>ทีมหลัก<select name="teamId" value={teamId} onChange={(event) => setTeamId(event.target.value)} required={position?.scopeType === "TEAM"}><option value="">ไม่กำหนดทีม</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
        </section>
        <aside className="admin-access-preview" aria-live="polite">
          <div><span>ชุดสิทธิ์จากตำแหน่ง</span><strong>{position?.roleName || "ยังไม่เลือกตำแหน่ง"}</strong></div>
          <div><span>ขอบเขตข้อมูลที่บังคับใช้</span><strong>{position ? scopeLabel(position.scopeType) : "—"}</strong>{position?.scopeType === "TEAM" && <small className={!selectedTeam ? "warning" : ""}>{selectedTeam ? `ทีม: ${selectedTeam.name}` : "ต้องเลือกทีมก่อนบันทึก"}</small>}</div>
          <div className="admin-permission-list"><span>สิทธิ์ที่ได้รับ · {permissions.length} รายการ</span>{permissions.length ? <ul>{permissions.map((permission) => <li key={permission.code}><code>{permission.code}</code><small>{permission.description}</small></li>)}</ul> : <p>ยังไม่มีสิทธิ์จากตำแหน่งนี้</p>}</div>
          <p className="admin-access-note">เมื่อเปลี่ยนตำแหน่งหรือทีม ระบบจะปิด Role assignment เดิมและสร้างขอบเขตสิทธิ์ใหม่โดยอัตโนมัติ</p>
        </aside>
        <div className="admin-dialog-result"><Result state={profileState}/></div>
        <footer><button type="button" className="secondary-action" onClick={() => dialogRef.current?.close()}>ยกเลิก</button><button className="primary" disabled={profilePending}>{profilePending ? "กำลังบันทึก…" : "บันทึกข้อมูลและสิทธิ์"}</button></footer>
      </form>
      <section className="admin-password-section"><div><strong>รีเซ็ตรหัสผ่าน</strong><p>ผู้ใช้จะต้องตั้งรหัสผ่านใหม่ และเซสชันเดิมจะถูกยกเลิกทั้งหมด</p></div><form action={resetPassword}><input type="hidden" name="userId" value={user.id}/><input name="password" type="password" minLength={12} placeholder="รหัสผ่านชั่วคราว" autoComplete="new-password" required/><button className="secondary-action" disabled={passwordPending}>{passwordPending ? "กำลังรีเซ็ต…" : "รีเซ็ต"}</button></form><Result state={passwordState}/></section>
    </dialog>
  </>;
}

export function AdminWorkspace({ users, positions, roles, teams, rolePermissions }: { users: AdminUser[]; positions: AdminPosition[]; roles: AdminRole[]; teams: AdminTeam[]; rolePermissions: AdminPermission[] }) {
  const [userState, createUser, userPending] = useActionState(createUserAction, initial);
  const [positionState, createPosition, positionPending] = useActionState(createPositionAction, initial);
  const [teamState, createTeam, teamPending] = useActionState(createTeamAction, initial);
  const [deleteTeamState, deleteTeam, deleteTeamPending] = useActionState(deleteTeamAction, initial);
  return <div className="admin-workspace">
    <header className="admin-head"><div><p className="eyebrow">Core Identity / RBAC</p><h1>ผู้ดูแลระบบ</h1><p>จัดการบัญชี ตำแหน่ง และสิทธิ์ได้จากระบบ โดยไม่ต้องแก้ฐานข้อมูลโดยตรง</p></div><span>{users.filter((user) => user.status === "active").length} ผู้ใช้ที่เปิดใช้งาน</span></header>
    <div className="admin-grid">
      <section className="admin-panel"><h2>เพิ่มผู้ใช้</h2><form action={createUser} className="admin-form">
        <label>ชื่อที่แสดง<input name="displayName" required minLength={2}/></label><label>อีเมล<input name="email" type="email" required/></label>
        <label>รหัสพนักงาน<input name="employeeCode"/></label><label>ตำแหน่ง<select name="positionId" required><option value="">เลือกตำแหน่ง</option>{positions.map((position) => <option key={position.id} value={position.id}>{position.name} · {position.roleName}</option>)}</select></label>
        <label>ทีมหลัก<select name="teamId"><option value="">ไม่กำหนดทีม</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
        <label className="admin-span">รหัสผ่านชั่วคราว<input name="password" type="password" minLength={12} autoComplete="new-password" required/><small>อย่างน้อย 12 ตัว มีตัวอักษร ตัวเลข และสัญลักษณ์</small></label>
        <button className="primary" disabled={userPending || !positions.length}>{userPending ? "กำลังเพิ่ม…" : "เพิ่มผู้ใช้"}</button><Result state={userState}/>
      </form></section>
      <section className="admin-panel"><h2>สร้างตำแหน่ง</h2><form action={createPosition} className="admin-form">
        <label>รหัสตำแหน่ง<input name="code" placeholder="building_officer" required/></label><label>ชื่อตำแหน่ง<input name="name" required/></label>
        <label>ชุดสิทธิ์<select name="roleId" required>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
        <label>ขอบเขตข้อมูล<select name="scopeType" defaultValue="OWN"><option value="OWN">เฉพาะงานตนเอง</option><option value="TEAM">เฉพาะทีม</option><option value="ALL">ทุกข้อมูล</option></select></label>
        <button className="secondary-action" disabled={positionPending}>{positionPending ? "กำลังบันทึก…" : "เพิ่มตำแหน่ง"}</button><Result state={positionState}/>
      </form></section>
      <section className="admin-panel admin-team-panel"><header><div><h2>จัดการทีม</h2><p>ใช้ทีมเป็นขอบเขตการมอบหมายงานและการสรุป KPI</p></div><strong>{teams.length} ทีม</strong></header>
        <form action={createTeam} className="admin-team-form"><label>รหัสทีม<input name="code" placeholder="permission_ops" minLength={2} maxLength={64} pattern="[A-Za-z0-9_-]+" required/><small>ใช้เป็นรหัสอ้างอิงถาวรในระบบ</small></label><label>ชื่อทีม<input name="name" placeholder="ทีมงาน Permission" minLength={2} maxLength={120} required/></label><button className="secondary-action" disabled={teamPending}>{teamPending ? "กำลังเพิ่ม…" : "เพิ่มทีม"}</button><Result state={teamState}/></form>
        <div className="admin-team-list" aria-label="ทีมที่เปิดใช้งาน">{teams.map((team) => { const memberCount = users.filter((user) => user.teamId === team.id).length; return <div key={team.id} className="admin-team-item"><span><strong>{team.name}</strong><small>{team.code} · {memberCount} ผู้ใช้</small></span><form action={deleteTeam} onSubmit={(event) => { if (!window.confirm(`ยืนยันลบทีม ${team.name}? ประวัติงานและ KPI เดิมจะยังถูกเก็บไว้`)) event.preventDefault(); }}><input type="hidden" name="teamId" value={team.id}/><button type="submit" disabled={deleteTeamPending || memberCount > 0} title={memberCount > 0 ? "ย้ายผู้ใช้ออกจากทีมก่อน" : `ลบทีม ${team.name}`}>{memberCount > 0 ? "ย้ายผู้ใช้ก่อน" : "ลบทีม"}</button></form></div>; })}</div><Result state={deleteTeamState}/>
      </section>
    </div>
    <section className="admin-panel admin-users"><header><div><h2>ผู้ใช้ทั้งหมด</h2><p>การนำผู้ใช้ออกจะเป็นการระงับบัญชีเพื่อรักษาประวัติและ audit log</p></div><strong>{users.length} บัญชี</strong></header>
      <div className="admin-table-wrap"><table><thead><tr><th>ผู้ใช้</th><th>รหัสพนักงาน</th><th>ตำแหน่ง</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}>
        <td><strong>{user.displayName || "ไม่ระบุชื่อ"}</strong><small>{user.email}</small></td><td>{user.employeeCode || "—"}</td><td><strong>{user.positionName || "ยังไม่กำหนด"}</strong><small>{teams.find((team) => team.id === user.teamId)?.name || "ไม่กำหนดทีม"}</small></td><td><span className={`admin-status ${user.status}`}>{user.status === "active" ? "ใช้งาน" : "ระงับ"}</span></td>
        <td><div className="admin-row-actions"><EditUserDialog user={user} positions={positions} teams={teams} rolePermissions={rolePermissions}/></div></td>
      </tr>)}</tbody></table></div>
    </section>
  </div>;
}
