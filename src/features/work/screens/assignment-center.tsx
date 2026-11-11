"use client";
import { startTransition, useActionState, useEffect, useState, useRef, type ReactNode } from "react";
import { FormActions, FormField, FormGrid, FormSection } from "@/components/ui/form";
import { useWorkMutationSignal } from "@/lib/work-mutation-signal";
import { Button, ButtonLink } from "@/components/ui/button";
import type { WorkReadModel } from "@/lib/work-read-model";
import { assignWorkTasksAction, previewWorkDeadlineAction, type WorkActionState } from "@/app/(platform)/work/actions";
import { WorkEmpty, WorkScreenShell, WorkUnavailable } from "@/features/work/components/work-screen-shell";
import { TaskKpiFields } from "@/features/work/components/task-kpi-fields";
const initial: WorkActionState = { ok: false, message: "" };
export function AssignmentCenterScreen({ model, filters }: { model: WorkReadModel; filters?: ReactNode }) {
  const appearance = "workspace";
  const [state, action, pending] = useActionState(assignWorkTasksAction, initial);
  const formRef = useRef<HTMLFormElement>(null); const errorSummary = useRef<HTMLDivElement>(null);
  useWorkMutationSignal(state, formRef);
  const [preview, previewAction, previewPending] = useActionState(previewWorkDeadlineAction, initial);
  const [teamId, setTeamId] = useState(""); const [kpiValues, setKpiValues] = useState({ main: "", sub: "" });
  const submittedDraft = useRef<FormData | null>(null); const [resetEpoch, setResetEpoch] = useState(0); const lastSuccessfulState = useRef<WorkActionState | null>(null);
  useEffect(() => { if (!state.ok || lastSuccessfulState.current === state) return; lastSuccessfulState.current = state; setTeamId(""); setKpiValues({ main: "", sub: "" }); setResetEpoch(epoch => epoch + 1); }, [state]);
  useEffect(() => { if (state.ok || state === initial || !submittedDraft.current || !formRef.current) return; for (const control of Array.from(formRef.current.elements)) { if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement) || !control.name) continue; const value = submittedDraft.current.get(control.name); if (typeof value === "string") control.value = value; } }, [state]);
  useEffect(() => { if (!state.ok && state.message && !pending) { errorSummary.current?.focus(); formRef.current?.querySelector<HTMLElement>(":invalid")?.focus(); } }, [state, pending]);
  const teams = [...new Map(model.assignmentOptions.filter(p => p.teamId).map(p => [p.teamId!, p.teamName])).entries()];
  return <WorkScreenShell title="ศูนย์มอบหมายงาน" description="เลือกทีม ผู้รับผิดชอบ และ KPI แล้วตรวจ deadline ก่อนมอบหมาย" parent={{ label: "ภาพรวมทีม", href: "/work/team" }} appearance={appearance}>
    {filters ? <section className="work-rollout-filter-panel">{filters}</section> : null}
    {model.source.status !== "ready" ? <WorkUnavailable message="ยังโหลดข้อมูลสำหรับมอบหมายไม่ได้" detail={model.source.message} /> : model.assignmentOptions.length ? <form ref={formRef} action={action} onSubmit={event => { submittedDraft.current = new FormData(event.currentTarget); }} className="work-panel work-assignment-form work-rollout-assignment ui-form" aria-busy={pending || previewPending}>
      {state.message && !state.ok && <div ref={errorSummary} tabIndex={-1} className="work-form-error" role="alert">{state.message}</div>}
      <div className="work-form-intro"><div><h2>รายละเอียดการมอบหมาย</h2><p>กำหนดผู้รับผิดชอบ KPI และรายการงานก่อนตรวจ deadline</p></div></div>
      <input type="hidden" name="idempotencyKey" value={model.creationKey}/>
      <FormSection disabled={pending || previewPending} legend="ผู้รับผิดชอบและขอบเขตงาน"><FormGrid>
        <FormField label="ทีม" required controlId="assignment-team"><select className="ui-building-field" id="assignment-team" name="teamId" value={teamId} onChange={e => { setTeamId(e.target.value); setKpiValues({ main: "", sub: "" }); }} required><option value="">เลือกทีม</option>{teams.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></FormField>
        <FormField label="ผู้รับผิดชอบ" required controlId="assignment-assignee"><select className="ui-building-field" id="assignment-assignee" name="assigneeId" key={teamId} defaultValue="" required><option value="">เลือกผู้รับผิดชอบ</option>{model.assignmentOptions.filter(p => p.teamId === teamId).map(p => <option key={`${p.id}:${p.teamId}`} value={p.id}>{p.name}</option>)}</select></FormField>
        <TaskKpiFields controlClassName="ui-building-field" key={teamId + model.creationKey + resetEpoch} values={kpiValues} onValuesChange={setKpiValues} rules={model.kpiOptions.filter(r => r.teamId === teamId)} />
        <FormField label="ชื่อชุดงาน" required controlId="assignment-title"><input className="ui-building-field" id="assignment-title" name="title" required minLength={3} maxLength={180}/></FormField>
        <FormField label="ความสำคัญ" controlId="assignment-priority"><select className="ui-building-field" id="assignment-priority" name="priority" defaultValue="normal"><option value="low">ต่ำ</option><option value="normal">ปกติ</option><option value="high">สูง</option><option value="urgent">เร่งด่วน</option></select></FormField>
        <FormField label="Job / งานย่อย (สูงสุด 20 รายการ)" required controlId="assignment-jobs" className="ui-field-full work-form-span-2"><textarea className="ui-building-field" id="assignment-jobs" name="jobs" required maxLength={4000} rows={5}/></FormField>
        <FormField label="หมายเหตุ" controlId="assignment-notes" className="ui-field-full work-form-span-2"><textarea className="ui-building-field" id="assignment-notes" name="notes" maxLength={4000}/></FormField>
      </FormGrid></FormSection>
      <FormActions variant="page" className="work-form-actions work-rollout-form-actions"><Button variant="secondary" type="button" onClick={event => { const form = event.currentTarget.form; if (form) startTransition(() => previewAction(new FormData(form))); }} disabled={pending || previewPending}>ดู deadline ล่วงหน้า</Button><p role="status" aria-atomic="true">{preview.message}</p><ButtonLink variant="ghost" href="/work/team" aria-disabled={pending || previewPending || undefined} onClick={event => { if (pending || previewPending) event.preventDefault(); }}>ยกเลิก</ButtonLink><Button variant="primary" type="submit" pending={pending} pendingLabel="กำลังมอบหมาย…" disabled={previewPending}>มอบหมายงาน</Button><p role="status" aria-atomic="true">{state.message}</p></FormActions>
    </form> : <WorkEmpty title="ยังไม่มีผู้รับผิดชอบในขอบเขต" detail="ให้ผู้ดูแลกำหนดทีมและสิทธิ์การมอบหมาย" />}
  </WorkScreenShell>;
}