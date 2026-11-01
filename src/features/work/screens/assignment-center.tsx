"use client";
import { startTransition, useActionState, useEffect, useState, useRef, type ReactNode } from "react";
import { useWorkMutationSignal } from "@/lib/work-mutation-signal";
import type { WorkReadModel } from "@/lib/work-read-model";
import { assignWorkTasksAction, previewWorkDeadlineAction, type WorkActionState } from "@/app/(platform)/work/actions";
import { WorkEmpty, WorkScreenShell, WorkUnavailable } from "@/features/work/components/work-screen-shell";
import { TaskKpiFields } from "@/features/work/components/task-kpi-fields";
const initial:WorkActionState={ok:false,message:""};
export function AssignmentCenterScreen({model,filters}:{model:WorkReadModel;filters?:ReactNode}){
 const appearance="workspace";
 const [state,action,pending]=useActionState(assignWorkTasksAction,initial);
 const formRef=useRef<HTMLFormElement>(null);
 useWorkMutationSignal(state,formRef);
 const [preview,previewAction,previewPending]=useActionState(previewWorkDeadlineAction,initial);
 const [teamId,setTeamId]=useState("");
 const [kpiValues,setKpiValues]=useState({main:"",sub:""});
 const submittedDraft=useRef<FormData|null>(null);
 const [resetEpoch,setResetEpoch]=useState(0);
 const lastSuccessfulState=useRef<WorkActionState|null>(null);
 useEffect(() => {
  if (!state.ok || lastSuccessfulState.current === state) return;
  lastSuccessfulState.current = state;
  setTeamId("");
  setKpiValues({main:"",sub:""});
  setResetEpoch(epoch => epoch + 1);
 }, [state]);
 useEffect(() => {
  if (state.ok || state === initial || !submittedDraft.current || !formRef.current) return;
  for (const control of Array.from(formRef.current.elements)) {
   if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement) || !control.name) continue;
   const value = submittedDraft.current.get(control.name);
   if (typeof value === "string") control.value = value;
  }
 }, [state]);
 const teams=[...new Map(model.assignmentOptions.filter(p=>p.teamId).map(p=>[p.teamId!,p.teamName])).entries()];
 return <WorkScreenShell title="ศูนย์มอบหมายงาน" description="เลือกทีม ผู้รับผิดชอบ และ KPI แล้วตรวจ deadline ก่อนมอบหมาย" parent={{label:"ภาพรวมทีม",href:"/work/team"}} appearance={appearance}>
 {filters?<section className="work-rollout-filter-panel">{filters}</section>:null}
 {model.source.status!=="ready"?<WorkUnavailable message="ยังโหลดข้อมูลสำหรับมอบหมายไม่ได้" detail={model.source.message}/>:model.assignmentOptions.length?<form ref={formRef} action={action} onSubmit={event=>{submittedDraft.current=new FormData(event.currentTarget);}} className="work-panel work-assignment-form work-rollout-assignment ui-form" aria-busy={pending}><div className="work-form-intro"><div><h2>รายละเอียดการมอบหมาย</h2><p>กำหนดผู้รับผิดชอบ KPI และรายการงานก่อนตรวจ deadline</p></div></div><input type="hidden" name="idempotencyKey" value={model.creationKey}/><fieldset disabled={pending||previewPending} className="work-form-grid"><legend>ผู้รับผิดชอบและขอบเขตงาน</legend><label>ทีม<select name="teamId" value={teamId} onChange={e=>{setTeamId(e.target.value);setKpiValues({main:"",sub:""});}} required><option value="">เลือกทีม</option>{teams.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><label>ผู้รับผิดชอบ<select name="assigneeId" key={teamId} defaultValue="" required><option value="">เลือกผู้รับผิดชอบ</option>{model.assignmentOptions.filter(p=>p.teamId===teamId).map(p=><option key={`${p.id}:${p.teamId}`} value={p.id}>{p.name}</option>)}</select></label><TaskKpiFields key={teamId+model.creationKey+resetEpoch} values={kpiValues} onValuesChange={setKpiValues} rules={model.kpiOptions.filter(r=>r.teamId===teamId)}/><label>ชื่อชุดงาน<input name="title" required minLength={3} maxLength={180}/></label><label>ความสำคัญ<select name="priority" defaultValue="normal"><option value="low">ต่ำ</option><option value="normal">ปกติ</option><option value="high">สูง</option><option value="urgent">เร่งด่วน</option></select></label><label className="work-form-span-2">Job / งานย่อย (สูงสุด 20 รายการ)<textarea name="jobs" required maxLength={4000} rows={5}/></label><label className="work-form-span-2">หมายเหตุ<textarea name="notes" maxLength={4000}/></label></fieldset><div className="work-form-actions work-rollout-form-actions"><button className="btn-secondary" type="button" onClick={event=>{const form=event.currentTarget.form;if(form)startTransition(()=>previewAction(new FormData(form)));}} disabled={pending||previewPending}>ดู deadline ล่วงหน้า</button><p role="status">{preview.message}</p><button className="btn-primary" disabled={pending||previewPending}>{pending?"กำลังมอบหมาย…":"มอบหมายงาน"}</button><p role="status">{state.message}</p></div></form>:<WorkEmpty title="ยังไม่มีผู้รับผิดชอบในขอบเขต" detail="ให้ผู้ดูแลกำหนดทีมและสิทธิ์การมอบหมาย"/>}</WorkScreenShell>;
}
