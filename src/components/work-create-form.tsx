"use client";

import { useActionState } from "react";
import { createPersonalTaskAction, type WorkActionState } from "@/app/(platform)/work/actions";

const initial: WorkActionState = { ok: false, message: "" };

export function WorkCreateForm() {
  const [state, action, pending] = useActionState(createPersonalTaskAction, initial);
  return <form className="work-panel work-assignment-form work-create-form" action={action}>
    <div className="work-form-intro"><div><span className="work-eyebrow">เพิ่มงาน</span><h2>เพิ่มงานของฉัน</h2><p>เพิ่มงานได้หลายรายการในครั้งเดียว โดยแยกหนึ่งรายการต่อหนึ่งบรรทัดเหมือนต้นฉบับ</p></div><span className="work-form-count">สูงสุด 20 งาน</span></div>
    <div className="work-form-grid">
      <label className="work-form-span-2">Job / รายละเอียดงาน<textarea name="jobs" rows={6} required maxLength={4000} placeholder="เช่น ตรวจสอบเอกสารอาคาร\nติดตามเอกสารผู้รับเหมา" /></label>
      <label>Main KPI<input name="mainKpi" maxLength={180} placeholder="ระบุ Main KPI (ถ้ามี)" /></label>
      <label>Sub KPI<input name="subKpi" maxLength={180} placeholder="ระบุ Sub KPI (ถ้ามี)" /></label>
      <label>กำหนดส่ง<input name="dueAt" type="date" /></label>
      <label className="work-form-span-2">หมายเหตุ<textarea name="note" rows={4} maxLength={4000} placeholder="ข้อมูลเพิ่มเติมที่ช่วยให้ทำงานต่อได้ทันที" /></label>
    </div>
    {state.message && <p role="status" className={state.ok ? "work-action-success" : "work-action-error"}>{state.message}</p>}
    <div className="work-form-actions"><button className="primary" disabled={pending}>{pending ? "กำลังเพิ่มงาน…" : "เพิ่มงาน"}</button><p>งานจะเริ่มต้นที่สถานะกำลังดำเนินการ และบันทึก audit/activity ให้โดยอัตโนมัติ</p></div>
  </form>;
}
