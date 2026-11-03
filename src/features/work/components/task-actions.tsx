"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { addWorkTaskNoteAction, deleteWorkTaskAction, editWorkTaskAction, transitionWorkTaskAction, type WorkActionState } from "@/app/(platform)/work/actions";
import type { WorkTaskRecord } from "@/lib/work-read-model";
import type { taskCapabilities } from "@/lib/work-task-policy";
import { useWorkMutationSignal } from "@/lib/work-mutation-signal";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import styles from "@/features/work/screens/work-composition.module.css";
type Caps = ReturnType<typeof taskCapabilities>;
const initial: WorkActionState = { ok: false, message: "" };
const nextStatuses: Record<string, Array<{ status: string; label: string }>> = {
  queued: [{ status: "in_progress", label: "รับงาน" }, { status: "cancelled", label: "ยกเลิกงาน" }],
  in_progress: [{ status: "blocked", label: "พักงาน" }, { status: "completed", label: "เสร็จสิ้น" }, { status: "cancelled", label: "ยกเลิกงาน" }],
  blocked: [{ status: "in_progress", label: "ดำเนินการต่อ" }, { status: "cancelled", label: "ยกเลิกงาน" }],
};
function IdentityFields({ task, action }: { task: WorkTaskRecord; action: string }) {
  return <><input type="hidden" name="taskId" value={task.id}/><input type="hidden" name="version" value={task.version}/><input type="hidden" name="idempotencyKey" value={`${task.id}:${task.version}:${action}`}/></>;
}
export function TaskActionControls({ task, capabilities }: { task: WorkTaskRecord; capabilities: Caps }) {
  const [choice, setChoice] = useState<{ kind: "transition" | "edit" | "delete"; status?: string; label: string } | null>(null);
  async function runCommand(command: typeof transitionWorkTaskAction, previous: WorkActionState, data: FormData) {
    const result = await command(previous, data);
    if (result.ok) setChoice(null);
    return result;
  }
  const [transitionState, transitionAction, transitioning] = useActionState((previous: WorkActionState, data: FormData) => runCommand(transitionWorkTaskAction, previous, data), initial);
  const [editState, editAction, editing] = useActionState((previous: WorkActionState, data: FormData) => runCommand(editWorkTaskAction, previous, data), initial);
  const [deleteState, deleteAction, deleting] = useActionState((previous: WorkActionState, data: FormData) => runCommand(deleteWorkTaskAction, previous, data), initial);
  useWorkMutationSignal(transitionState);
  useWorkMutationSignal(editState);
  useWorkMutationSignal(deleteState);

  const opener = useRef<HTMLButtonElement | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submittedDraft = useRef<FormData | null>(null);
  const state = choice?.kind === "edit" ? editState : choice?.kind === "delete" ? deleteState : transitionState;
  const action = choice?.kind === "edit" ? editAction : choice?.kind === "delete" ? deleteAction : transitionAction;
  const pending = transitioning || editing || deleting;
  // React form actions reset uncontrolled fields even after a rejected command.
  // Keep the submitted draft available for correction, as the create forms do.
  useEffect(() => {
    if (state.ok || state === initial || !submittedDraft.current || !formRef.current) return;
    for (const control of Array.from(formRef.current.elements)) {
      if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement) || !control.name) continue;
      const value = submittedDraft.current.get(control.name);
      if (typeof value === "string") control.value = value;
    }
  }, [state]);
  function open(event: React.MouseEvent<HTMLButtonElement>, next: NonNullable<typeof choice>) { opener.current = event.currentTarget; submittedDraft.current = null; setChoice(next); }
  const choices = capabilities.update ? (nextStatuses[task.status] ?? []).filter(item => task.status !== "queued" || item.status !== "in_progress" || capabilities.accept) : [];
  return <div className="work-action-stack"><div className="work-action-row">
    {choices.map(item => <Button key={item.status} type="button" variant="secondary" onClick={event => open(event, { kind: "transition", status: item.status, label: item.label })}>{item.label}</Button>)}
    {capabilities.edit && <Button type="button" variant="secondary" onClick={event => open(event, { kind: "edit", label: "แก้ไขงาน" })}>แก้ไขงาน</Button>}
        {capabilities.delete && <Button type="button" variant="danger" onClick={event => open(event, { kind: "delete", label: "ลบงาน" })}>ลบงาน</Button>}
  </div><Dialog open={choice !== null} title={choice?.label ?? "คำสั่งงาน"} description={task.title} busy={pending} returnFocusRef={opener} onOpenChange={next => { if (!next) setChoice(null); }}>
    {choice && <form ref={formRef} action={action} onSubmit={event => { submittedDraft.current = new FormData(event.currentTarget); }} className={`${styles.commandForm} ui-form`} aria-busy={pending}><IdentityFields task={task} action={`${choice.kind}:${choice.status ?? ""}`}/>
      {choice.kind === "transition" && <><input type="hidden" name="toStatus" value={choice.status}/>{choice.status==="completed" && task.subKpi?.toLowerCase().includes("open pr") && <><label>Fund Number<input name="fundNumber" required maxLength={180}/></label><label>จำนวนเงิน<input name="amount" type="number" min={0} step="0.01" required/></label></>}<label>เหตุผล / ความคืบหน้า<textarea name="reason" maxLength={1000} required={choice.status === "blocked" || choice.status === "cancelled" || !capabilities.accept} autoFocus rows={3}/></label></>}
      {choice.kind === "delete" && <><p>ซ่อนงานนี้จากรายการและรายงาน ผู้ดูแลกู้คืนได้ ประวัติงานยังคงอยู่</p><label>เหตุผลที่ลบ<textarea name="reason" required maxLength={1000} autoFocus rows={3}/></label></>}
      {choice.kind === "edit" && <><label>ชื่องาน<input name="title" defaultValue={task.title} required minLength={3} maxLength={180} autoFocus/></label><label>รหัสงาน<input name="jobCode" defaultValue={task.jobCode ?? task.title} required maxLength={180}/></label><label>รายละเอียด<textarea name="description" defaultValue={task.description ?? ""} maxLength={4000}/></label><label>Main KPI<input name="mainKpi" defaultValue={task.mainKpi ?? ""} maxLength={180}/></label><label>Sub KPI<input name="subKpi" defaultValue={task.subKpi ?? ""} maxLength={180}/></label><label>ผู้รับผิดชอบ<select name="ownerId" defaultValue={task.ownerId} required><option value={task.ownerId}>{task.ownerName}</option>{capabilities.assign && task.ownerOptions?.filter(p=>p.id!==task.ownerId).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>กฎ KPI ใหม่<select name="ruleVersionId" defaultValue=""><option value="">คงกฎเดิม</option>{task.kpiOptions?.map(r=><option key={r.id} value={r.id}>{r.mainKpi} / {r.subKpi}</option>)}</select></label><label>SSR Number<input name="ssrNumber" maxLength={180} defaultValue={String(task.extraData?.ssrNumber??"")}/></label><label>OSP Number<input name="ospNumber" maxLength={180} defaultValue={String(task.extraData?.ospNumber??"")}/></label><label>กำหนดส่ง<input type="date" name="dueAt" defaultValue={task.dueAt ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date(task.dueAt)) : ""}/></label><label>ความสำคัญ<select name="priority" defaultValue={task.priority}><option value="low">ต่ำ</option><option value="normal">ปกติ</option><option value="high">สูง</option><option value="urgent">เร่งด่วน</option></select></label></>}
      <div className="ui-dialog-actions"><Button variant="secondary" disabled={pending} onClick={() => setChoice(null)}>ปิด</Button><Button type="submit" variant={choice.kind === "delete" ? "danger" : "primary"} pending={pending} pendingLabel="กำลังบันทึก…">{choice.kind === "delete" ? "ยืนยันลบงาน" : "ยืนยัน"}</Button></div>{state.message && <p role="status">{state.message}</p>}
    </form>}
  </Dialog>{!choice && (transitionState.message || editState.message || deleteState.message) && <span role="status">{transitionState.message || editState.message || deleteState.message}</span>}</div>;
}
export function TaskNoteForm({ task }: { task: WorkTaskRecord }) {
  const [state, action, pending] = useActionState(addWorkTaskNoteAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  useWorkMutationSignal(state, formRef);
  return <form ref={formRef} action={action} className="work-note-form" aria-busy={pending}><label htmlFor={`note-${task.id}`}>เพิ่มบันทึก<textarea id={`note-${task.id}`} name="note" rows={3} maxLength={4000} placeholder="เขียนความคืบหน้าเพิ่มเติม" required /></label><IdentityFields task={task} action="note"/><Button variant="secondary" disabled={pending} pending={pending} pendingLabel="กำลังบันทึก…">เพิ่มบันทึก</Button>{state.message && <span role="status">{state.message}</span>}</form>;
}
