"use client";
import { startTransition, useActionState, useEffect, useId, useState, useRef } from "react";
import { FormActions, FormField, FormGrid, FormSection } from "@/components/ui/form";
import { useWorkMutationSignal } from "@/lib/work-mutation-signal";
import { createPersonalTaskAction, previewWorkDeadlineAction, type WorkActionState } from "@/app/(platform)/work/actions";
import { TaskKpiFields } from "@/features/work/components/task-kpi-fields";
import { Button, ButtonLink } from "@/components/ui/button";
import type { WorkReadModel } from "@/lib/work-read-model";

const initial: WorkActionState = { ok: false, message: "" };
export type WorkCreateFormStatus = { pending: boolean; dirty: boolean };
type WorkCreateFormProps = { model: WorkReadModel; userId: string; inDialog?: boolean; onStatus?: (status: WorkCreateFormStatus) => void; onSuccess?: () => void };
export function WorkCreateForm({ model, userId, inDialog = false, onStatus, onSuccess }: WorkCreateFormProps) {
  const helpId = useId(); const jobsHelpId = useId(); const errorId = useId();
  const [state, action, pending] = useActionState(createPersonalTaskAction, initial);
  const formRef = useRef<HTMLFormElement>(null); const errorSummary = useRef<HTMLDivElement>(null);
  useWorkMutationSignal(state, formRef);
  const [preview, previewAction, previewPending] = useActionState(previewWorkDeadlineAction, initial);
  const teams = model.assignmentOptions.filter(p => p.id === userId && p.teamId); const initialTeamId = teams[0]?.teamId ?? "";
  const [teamId, setTeamId] = useState(initialTeamId); const [dirty, setDirty] = useState(false);
  const lastSuccessfulState = useRef<WorkActionState | null>(null); const submittedDraft = useRef<FormData | null>(null); const [resetEpoch, setResetEpoch] = useState(0);
  const busy = pending || previewPending;
  const fieldControlClass = "ui-building-field";
  useEffect(() => { onStatus?.({ pending: busy, dirty }); }, [busy, dirty, onStatus]);
  useEffect(() => { if (state.ok || state === initial || !submittedDraft.current || !formRef.current) return; for (const control of Array.from(formRef.current.elements)) { if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement) || !control.name) continue; const value = submittedDraft.current.get(control.name); if (typeof value === "string") control.value = value; } }, [state]);
  useEffect(() => { if (state.ok && lastSuccessfulState.current !== state) { lastSuccessfulState.current = state; setTeamId(initialTeamId); setResetEpoch(epoch => epoch + 1); setDirty(false); onSuccess?.(); } if (!state.ok && state.message && !pending) { errorSummary.current?.focus(); formRef.current?.querySelector<HTMLElement>(":invalid")?.focus(); } }, [state, initialTeamId, onSuccess, pending]);
  return <form ref={formRef} className={`work-panel work-create-form ui-form${inDialog ? "" : " work-create-page-form"}`} action={action} aria-describedby={helpId} aria-busy={busy || undefined} onChange={() => setDirty(true)} onSubmit={event => { submittedDraft.current = new FormData(event.currentTarget); }}>
    <div className="work-create-header">{!inDialog && <h2>เพิ่มงานของฉัน</h2>}<p id={helpId} className="work-create-guidance">เลือกทีมและ KPI แล้วระบุงานทีละบรรทัด ตรวจสอบกำหนดส่งก่อนเพิ่มงานได้</p></div>
    {state.message && !state.ok && <div ref={errorSummary} tabIndex={-1} id={errorId} className="work-form-error" role="alert">{state.message}</div>}
    <input type="hidden" name="idempotencyKey" value={model.creationKey}/><input type="hidden" name="assigneeId" value={userId}/>
    <FormSection disabled={busy} legend="ข้อมูลทีมและ KPI"><FormGrid><FormField label="ทีม" required controlId="work-team"><select id="work-team" name="teamId" value={teamId} onChange={e => { setTeamId(e.target.value); setDirty(true); }} required className={fieldControlClass}><option value="">เลือกทีม</option>{teams.map(p => <option key={p.teamId} value={p.teamId!}>{p.teamName}</option>)}</select></FormField><TaskKpiFields key={`${teamId}:${model.creationKey}:${resetEpoch}`} rules={model.kpiOptions.filter(r => r.teamId === teamId)} fieldErrors={state.fieldErrors} controlClassName={fieldControlClass}/></FormGrid></FormSection>
    <FormSection disabled={busy} legend="รายละเอียดงาน"><FormGrid><FormField label="Job / รายละเอียดงาน (จำเป็น)" required controlId="work-jobs" describedBy={jobsHelpId} hint="หนึ่งรายการต่อบรรทัด สูงสุด 20 รายการ"><textarea id="work-jobs" name="jobs" required maxLength={4000} rows={5} aria-describedby={jobsHelpId} placeholder="ตัวอย่าง: ตรวจสอบความเรียบร้อยของอาคาร A" className={fieldControlClass}/></FormField><FormField label="หมายเหตุ (ถ้ามี)" controlId="work-notes"><textarea id="work-notes" name="notes" maxLength={4000} rows={3} placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)" className={fieldControlClass}/></FormField></FormGrid></FormSection>
    <FormActions variant={inDialog ? "dialog" : "page"} className="work-create-actions"><div className="work-create-action-row"><Button variant="secondary" type="button" onClick={event => { const form = event.currentTarget.form; if (form) startTransition(() => previewAction(new FormData(form))); }} pending={previewPending} pendingLabel="กำลังตรวจสอบ…" disabled={pending}>ตรวจสอบกำหนดส่ง</Button>{!inDialog && <ButtonLink variant="ghost" href="/work" aria-disabled={busy || undefined} onClick={event => { if (busy) event.preventDefault(); }}>ยกเลิก</ButtonLink>}<Button variant="primary" type="submit" pending={pending} pendingLabel="กำลังเพิ่มงาน…" disabled={previewPending}>เพิ่มงาน</Button></div><p role="status" aria-atomic="true" className="work-create-preview-msg" data-tone={preview.ok ? "success" : "error"}>{preview.message}</p><p role="status" aria-atomic="true" className="work-create-status-msg" data-tone={state.ok ? "success" : "error"}>{state.message}</p></FormActions>
  </form>;
}
