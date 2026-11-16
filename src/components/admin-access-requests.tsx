"use client";

import { useActionState, useState } from "react";
import { AdminActionForm } from "@/components/admin-action-form";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { decideAccessRequestAction } from "@/app/(platform)/admin/access-request-actions";
import { accessRequestStatusLabel, dataScopeLabel } from "@/lib/access-request-domain";

type Option = { id: string; name: string };
type CapabilityOption = { code: string; labelTh: string; allowedScopes: string[] };
type RoleOption = Option & { capabilities: CapabilityOption[] };
type PendingRequest = { id: string; requesterName: string; requesterEmail: string; moduleName: string; reason: string; createdAt: string };
type HistoryRow = { id: string; requesterName: string; moduleName: string; status: string; note: string | null; decidedAt: string | null };
const initial = { ok: false, message: "" };
const scopeOptions = ["OWN", "TEAM", "SELECTED_TEAMS", "ALL"] as const;

function ScopeOverrideFields({ role }: { role: RoleOption }) {
  if (role.capabilities.length === 0) return null;
  return <details className="admin-capability-scopes">
    <summary>ขอบเขตเฉพาะสิทธิ์ ({role.capabilities.length} สิทธิ์)</summary>
    <p className="sub">เว้นเป็น “ตามค่าเริ่มต้น” เพื่อใช้ขอบเขตข้อมูลด้านบนกับทุกสิทธิ์</p>
    <div className="admin-capability-scope-list">
      {role.capabilities.map((capability) => <label key={capability.code}>
        <span>{capability.labelTh}</span>
        <select className="ui-building-field" name={`capScope.${capability.code}`} defaultValue="DEFAULT">
          <option value="DEFAULT">ตามค่าเริ่มต้น</option>
          {capability.allowedScopes.map((scope) => <option key={scope} value={scope}>{dataScopeLabel(scope)}</option>)}
        </select>
      </label>)}
    </div>
  </details>;
}

function DecideRow({ request, roles, teams }: { request: PendingRequest; roles: RoleOption[]; teams: Option[] }) {
  const [state, action, pending] = useActionState(decideAccessRequestAction, initial);
  const [decision, setDecision] = useState("approve");
  const [roleId, setRoleId] = useState("");
  const [scopeType, setScopeType] = useState("OWN");
  const selectedRole = roles.find((role) => role.id === roleId);
  return <tr>
    <td><strong>{request.requesterName}</strong><small>{request.requesterEmail}</small></td>
    <td>{request.moduleName}<small>{new Date(request.createdAt).toLocaleString("th-TH")}</small></td>
    <td>{request.reason}</td>
    <td>
      <AdminActionForm action={action} className="admin-request-form" resetOnSuccess={state.ok}>
        <input type="hidden" name="requestId" value={request.id}/>
        <label>การตัดสินใจ<select className="ui-building-field" name="decision" value={decision} onChange={(event) => setDecision(event.target.value)}><option value="approve">อนุมัติและให้สิทธิ์</option><option value="reject">ปฏิเสธ</option></select></label>
        {decision === "approve" && <>
          <label>บทบาทที่จะให้<select className="ui-building-field" name="roleId" value={roleId} onChange={(event) => setRoleId(event.target.value)}><option value="">เลือกบทบาท</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
          <label>ขอบเขตข้อมูล<select className="ui-building-field" name="scopeType" value={scopeType} onChange={(event) => setScopeType(event.target.value)}>
            {scopeOptions.map((scope) => <option key={scope} value={scope}>{dataScopeLabel(scope)}</option>)}
          </select></label>
          {scopeType === "TEAM" && <label>ทีม<select className="ui-building-field" name="teamId" defaultValue=""><option value="">เลือกทีม</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>}
          {scopeType === "SELECTED_TEAMS" && <fieldset className="admin-team-picker">
            <legend>ทีมที่ให้เข้าถึง</legend>
            {teams.map((team) => <label key={team.id}><input type="checkbox" name="teamIds" value={team.id}/>{team.name}</label>)}
          </fieldset>}
          {selectedRole && <ScopeOverrideFields role={selectedRole}/>}
        </>}
        <label>หมายเหตุ<textarea className="ui-building-field" name="note" maxLength={300} rows={2} placeholder="บังคับเมื่อปฏิเสธ"/></label>
        <Button type="submit" variant="primary" disabled={pending}>{pending ? "กำลังบันทึก…" : "บันทึกการตัดสินใจ"}</Button>
        {state.message && <p className={state.ok ? "admin-success" : "admin-error"} role="status">{state.message}</p>}
      </AdminActionForm>
    </td>
  </tr>;
}

export function AdminAccessRequests({ requests, history, roles, teams }: { requests: PendingRequest[]; history: HistoryRow[]; roles: RoleOption[]; teams: Option[] }) {
  return <Panel className="admin-access-requests" title="คำขอสิทธิ์" description="อนุมัติพร้อมมอบบทบาท ขอบเขตข้อมูล และขอบเขตเฉพาะสิทธิ์ในครั้งเดียว ระบบจะแจ้งผู้ขอและให้เข้าสู่ระบบใหม่">
    {requests.length === 0
      ? <p className="admin-empty">ไม่มีคำขอที่รอดำเนินการ</p>
      : <div className="admin-table-wrap" role="region" aria-label="คำขอสิทธิ์ที่รอดำเนินการ"><table>
          <thead><tr><th>ผู้ขอ</th><th>โมดูล</th><th>เหตุผล</th><th>พิจารณา</th></tr></thead>
          <tbody>{requests.map((request) => <DecideRow key={request.id} request={request} roles={roles} teams={teams}/>)}</tbody>
        </table></div>}
    {history.length > 0 && <details className="admin-request-history"><summary>คำขอล่าสุดที่พิจารณาแล้ว ({history.length})</summary>
      <ul>{history.map((row) => <li key={row.id}><strong>{row.requesterName}</strong> · {row.moduleName} · {accessRequestStatusLabel(row.status)}
        {row.decidedAt && <small> · {new Date(row.decidedAt).toLocaleString("th-TH")}</small>}
        {row.note && <small> · {row.note}</small>}</li>)}</ul>
    </details>}
  </Panel>;
}
