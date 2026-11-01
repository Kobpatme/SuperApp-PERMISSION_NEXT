"use client";
import { startTransition, useActionState, useEffect, useState, useRef } from "react";
import { useWorkMutationSignal } from "@/lib/work-mutation-signal";
import { createPersonalTaskAction, previewWorkDeadlineAction, type WorkActionState } from "@/app/(platform)/work/actions";
import { TaskKpiFields } from "@/features/work/components/task-kpi-fields";
import { Button } from "@/components/ui/button";
import type { WorkReadModel } from "@/lib/work-read-model";
const initial:WorkActionState={ok:false,message:""};
export type WorkCreateFormStatus = { pending: boolean; dirty: boolean };
type WorkCreateFormProps = { model: WorkReadModel; userId: string; onStatus?: (status: WorkCreateFormStatus) => void; onSuccess?: () => void };
export function WorkCreateForm({model,userId,onStatus,onSuccess}:WorkCreateFormProps){
 const [state,action,pending]=useActionState(createPersonalTaskAction,initial);
 const formRef=useRef<HTMLFormElement>(null);
 useWorkMutationSignal(state,formRef);
 const [preview,previewAction,previewPending]=useActionState(previewWorkDeadlineAction,initial);
 const teams=model.assignmentOptions.filter(p=>p.id===userId&&p.teamId);
 const initialTeamId=teams[0]?.teamId??"";
 const [teamId,setTeamId]=useState(initialTeamId);
 const [dirty,setDirty]=useState(false);
 const lastSuccessfulState = useRef<WorkActionState | null>(null);
 const submittedDraft = useRef<FormData | null>(null);
 const [resetEpoch,setResetEpoch]=useState(0);
 const busy=pending||previewPending;
 useEffect(() => { onStatus?.({ pending: busy, dirty }); }, [busy, dirty, onStatus]);
 useEffect(() => {
   if (state.ok || state === initial || !submittedDraft.current || !formRef.current) return;
   for (const control of Array.from(formRef.current.elements)) {
     if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement) || !control.name) continue;
     const value = submittedDraft.current.get(control.name);
     if (typeof value === "string") control.value = value;
   }
 }, [state]);
 useEffect(() => { if (!state.ok || lastSuccessfulState.current === state) return; lastSuccessfulState.current=state; setTeamId(initialTeamId); setResetEpoch(epoch=>epoch+1); setDirty(false); onSuccess?.(); }, [state, initialTeamId, onSuccess]);
 return (
  <form ref={formRef} className="work-panel work-create-form" action={action} aria-busy={busy || undefined} onChange={()=>setDirty(true)} onSubmit={event=>{submittedDraft.current=new FormData(event.currentTarget);}}>
    <div className="work-create-header">
      <h2>เพิ่มงานของฉัน</h2>
      <p className="work-create-guidance">เลือกทีมและ KPI แล้วระบุงานทีละบรรทัด ตรวจสอบกำหนดส่งก่อนเพิ่มงานได้ ข้อมูลที่กรอกจะถูกเก็บไว้แม้ปิดหน้าต่าง</p>
    </div>
    <input type="hidden" name="idempotencyKey" value={model.creationKey}/>
    <input type="hidden" name="assigneeId" value={userId}/>
    <fieldset disabled={busy} className="work-create-fieldset">
      <legend>ข้อมูลทีมและ KPI</legend>
      <div className="work-create-grid">
        <div className="work-create-col-2">
          <label>
            ทีม
            <select name="teamId" value={teamId} onChange={e=>{setTeamId(e.target.value);setDirty(true);}} required>
              <option value="">เลือกทีม</option>
              {teams.map(p=> <option key={p.teamId} value={p.teamId!}>{p.teamName}</option>)}
            </select>
          </label>
          <TaskKpiFields key={`${teamId}:${model.creationKey}:${resetEpoch}`} rules={model.kpiOptions.filter(r=>r.teamId===teamId)}/>
        </div>
      </div>
    </fieldset>
    <fieldset disabled={busy} className="work-create-fieldset work-create-details-fieldset">
      <legend>รายละเอียดงาน</legend>
      <div className="work-create-details-grid">
        <label>
          Job / รายละเอียดงาน (หนึ่งรายการต่อบรรทัด สูงสุด 20)
          <textarea name="jobs" required maxLength={4000} rows={5} placeholder="ตัวอย่าง: ตรวจสอบความเรียบร้อยของอาคาร A"/>
        </label>
        <label>
          หมายเหตุ
          <textarea name="notes" maxLength={4000} rows={3} placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"/>
        </label>
      </div>
    </fieldset>
    <div className="work-create-actions">
      <Button variant="secondary" type="button" onClick={event=>{const form=event.currentTarget.form;if(form)startTransition(()=>previewAction(new FormData(form)));}} pending={previewPending} pendingLabel="กำลังตรวจสอบ…" disabled={pending}>ดู deadline ล่วงหน้า</Button>
      <p role="status" className="work-create-preview-msg">{preview.message}</p>
      <Button variant="primary" type="submit" pending={pending} pendingLabel="กำลังเพิ่มงาน…" disabled={previewPending}>เพิ่มงาน</Button>
      <p role="status" className="work-create-status-msg">{state.message}</p>
    </div>
  </form>
);
}
