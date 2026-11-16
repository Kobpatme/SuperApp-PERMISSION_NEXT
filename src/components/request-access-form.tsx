"use client";

import { useActionState } from "react";
import { AdminActionForm } from "@/components/admin-action-form";
import { Button } from "@/components/ui/button";
import { requestModuleAccessAction } from "@/app/(platform)/admin/access-request-actions";
import { modules } from "@/lib/module-registry";

const initial = { ok: false, message: "" };

/** Rendered on a denied screen so the requester can ask without leaving the app. */
export function RequestAccessForm() {
  const [state, action, pending] = useActionState(requestModuleAccessAction, initial);
  return <details className="access-request-form">
    <summary>ขอสิทธิ์ใช้งานโมดูล</summary>
    <AdminActionForm action={action} resetOnSuccess={state.ok} className="admin-form">
      <label>โมดูลที่ต้องการ<select className="ui-building-field" name="moduleId" required>
        <option value="">เลือกโมดูล</option>
        {modules.map((module) => <option key={module.id} value={module.id}>{module.name}</option>)}
      </select></label>
      <label className="admin-span">เหตุผล<textarea className="ui-building-field" name="reason" minLength={10} maxLength={500} rows={3} required placeholder="อธิบายงานที่ต้องใช้โมดูลนี้"/></label>
      <Button type="submit" variant="primary" disabled={pending}>{pending ? "กำลังส่งคำขอ…" : "ส่งคำขอ"}</Button>
      {state.message && <p className={state.ok ? "admin-success" : "admin-error"} role="status">{state.message}</p>}
    </AdminActionForm>
  </details>;
}
