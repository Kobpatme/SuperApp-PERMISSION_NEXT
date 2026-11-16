"use client";

import { useActionState } from "react";
import { AdminActionForm } from "@/components/admin-action-form";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { decideAccessRequestAction } from "@/app/(platform)/admin/access-request-actions";
import { accessRequestStatusLabel } from "@/lib/access-request-domain";

type Option = { id: string; name: string };
type PendingRequest = { id: string; requesterName: string; requesterEmail: string; moduleName: string; reason: string; createdAt: string };
type HistoryRow = { id: string; requesterName: string; moduleName: string; status: string; note: string | null; decidedAt: string | null };
const initial = { ok: false, message: "" };

function DecideRow({ request, roles, teams }: { request: PendingRequest; roles: Option[]; teams: Option[] }) {
  const [state, action, pending] = useActionState(decideAccessRequestAction, initial);
  return <tr>
    <td><strong>{request.requesterName}</strong><small>{request.requesterEmail}</small></td>
    <td>{request.moduleName}<small>{new Date(request.createdAt).toLocaleString("th-TH")}</small></td>
    <td>{request.reason}</td>
    <td>
      <AdminActionForm action={action} className="admin-request-form" resetOnSuccess={state.ok}>
        <input type="hidden" name="requestId" value={request.id}/>
        <label>การตัดสินใจ<select className="ui-building-field" name="decision" defaultValue="approve"><option value="approve">อนุมัติและให้สิทธิ์</option><option value="reject">ปฏิเสธ</option></select></label>
        <label>บทบาทที่จะให้<select className="ui-building-field" name="roleId" defaultValue=""><option value="">เลือกเมื่ออนุมัติ</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
        <label>ขอบเขตข้อมูล<select className="ui-building-field" name="scopeType" defaultValue="OWN"><option value="OWN">OWN · เฉพาะงานตนเอง</option><option value="TEAM">TEAM · ทีมหลัก</option><option value="ALL">ALL · ทุกข้อมูล</option></select></label>
        <label>ทีม (เมื่อเลือก TEAM)<select className="ui-building-field" name="teamId" defaultValue=""><option value="">ไม่กำหนด</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
        <label>หมายเหตุ<textarea className="ui-building-field" name="note" maxLength={300} rows={2} placeholder="บังคับเมื่อปฏิเสธ"/></label>
        <Button type="submit" variant="primary" disabled={pending}>{pending ? "กำลังบันทึก…" : "บันทึกการตัดสินใจ"}</Button>
        {state.message && <p className={state.ok ? "admin-success" : "admin-error"} role="status">{state.message}</p>}
      </AdminActionForm>
    </td>
  </tr>;
}

export function AdminAccessRequests({ requests, history, roles, teams }: { requests: PendingRequest[]; history: HistoryRow[]; roles: Option[]; teams: Option[] }) {
  return <Panel className="admin-access-requests" title="คำขอสิทธิ์" description="อนุมัติพร้อมมอบบทบาทและขอบเขตข้อมูลในครั้งเดียว ระบบจะให้ผู้ขอเข้าสู่ระบบใหม่">
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
