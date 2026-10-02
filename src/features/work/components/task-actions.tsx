"use client";

import { useActionState } from "react";
import { addWorkTaskNoteAction, transitionWorkTaskAction, type WorkActionState } from "@/app/(platform)/work/actions";
import type { WorkTaskRecord } from "@/lib/work-read-model";

const initial: WorkActionState = { ok: false, message: "" };
const nextStatuses: Record<string, Array<{ status: string; label: string }>> = {
  queued: [{ status: "in_progress", label: "รับงาน" }, { status: "cancelled", label: "ยกเลิก" }],
  in_progress: [{ status: "blocked", label: "พักงาน" }, { status: "completed", label: "ปิดงาน" }, { status: "cancelled", label: "ยกเลิก" }],
  blocked: [{ status: "in_progress", label: "ทำงานต่อ" }, { status: "cancelled", label: "ยกเลิก" }],
};

export function TaskActionControls({ task }: { task: WorkTaskRecord }) {
  const [state, action, pending] = useActionState(transitionWorkTaskAction, initial);
  const actions = nextStatuses[task.status] ?? [];
  if (!actions.length) return <span className="work-action-muted">ไม่มีคำสั่งถัดไป</span>;
  return <div className="work-action-stack"><form action={action} className="work-action-row">{actions.map((item) => <button key={item.status} type="submit" name="toStatus" value={item.status} className={item.status === "cancelled" ? "text-btn work-danger-action" : "secondary-action"} disabled={pending}>{item.label}</button>)}<input type="hidden" name="taskId" value={task.id}/><input type="hidden" name="version" value={task.version}/></form>{state.message && <span className={state.ok ? "work-action-success" : "work-action-error"} role="status">{state.message}</span>}</div>;
}

export function TaskNoteForm({ task }: { task: WorkTaskRecord }) {
  const [state, action, pending] = useActionState(addWorkTaskNoteAction, initial);
  return <form action={action} className="work-note-form"><label htmlFor={`note-${task.id}`}>บันทึกความคืบหน้า<textarea id={`note-${task.id}`} name="note" defaultValue={task.note ?? ""} rows={3} maxLength={4000} placeholder="เขียนสิ่งที่ผู้รับผิดชอบคนถัดไปควรรู้" required /></label><input type="hidden" name="taskId" value={task.id}/><input type="hidden" name="version" value={task.version}/><button className="secondary-action" disabled={pending}>{pending ? "กำลังบันทึก…" : "บันทึกหมายเหตุ"}</button>{state.message && <span className={state.ok ? "work-action-success" : "work-action-error"} role="status">{state.message}</span>}</form>;
}
