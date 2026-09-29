"use client";

import { useActionState } from "react";
import { createPersonalTaskAction, type WorkActionState } from "@/app/(platform)/work/actions";

const initial: WorkActionState = { ok: false, message: "" };

export function WorkCreateForm() {
  const [state, action, pending] = useActionState(createPersonalTaskAction, initial);
  return <form className="ui-panel form-grid" action={action}>
    <label>หัวข้องาน<input name="title" required minLength={3} maxLength={180} placeholder="เช่น ตรวจสอบเอกสารอาคาร" /></label>
    <label>รายละเอียด<textarea name="description" rows={5} maxLength={4000} placeholder="รายละเอียดที่ช่วยให้ทำงานต่อได้ทันที" /></label>
    <label>วันครบกำหนด<input name="dueAt" type="date" /></label>
    {state.message && <p role="status" className={state.ok ? "form-success" : "form-error"}>{state.message}</p>}
    <div className="heading-actions"><button className="primary" disabled={pending}>{pending ? "กำลังสร้าง…" : "สร้างงานส่วนตัว"}</button></div>
  </form>;
}
