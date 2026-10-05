"use client";
import { useActionState, useState } from "react";
import { createPersonalTaskAction, previewWorkDeadlineAction, type WorkActionState } from "@/app/(platform)/work/actions";
import { TaskKpiFields } from "@/features/work/components/task-kpi-fields";
import type { WorkReadModel } from "@/lib/work-read-model";
const initial:WorkActionState={ok:false,message:""};
export function WorkCreateForm({model,userId}:{model:WorkReadModel;userId:string}){
 const [state,action,pending]=useActionState(createPersonalTaskAction,initial);
 const [preview,previewAction,previewPending]=useActionState(previewWorkDeadlineAction,initial);
 const teams=model.assignmentOptions.filter(p=>p.id===userId&&p.teamId);
 const [teamId,setTeamId]=useState(teams[0]?.teamId??"");
 return <form className="work-panel work-assignment-form" action={action}><h2>เพิ่มงานของฉัน</h2><input type="hidden" name="idempotencyKey" value={model.creationKey}/><input type="hidden" name="assigneeId" value={userId}/><fieldset disabled={pending||previewPending} className="work-form-grid"><label>ทีม<select name="teamId" value={teamId} onChange={e=>setTeamId(e.target.value)} required><option value="">เลือกทีม</option>{teams.map(p=><option key={p.teamId} value={p.teamId!}>{p.teamName}</option>)}</select></label><TaskKpiFields key={teamId+model.creationKey} rules={model.kpiOptions.filter(r=>r.teamId===teamId)}/><label className="work-form-span-2">Job / รายละเอียดงาน (หนึ่งรายการต่อบรรทัด สูงสุด 20)<textarea name="jobs" required maxLength={4000} rows={6}/></label><label>หมายเหตุ<textarea name="notes" maxLength={4000}/></label></fieldset><button className="secondary-action" formAction={previewAction} formNoValidate disabled={pending||previewPending}>ดู deadline ล่วงหน้า</button><p role="status">{preview.message}</p><button className="primary" disabled={pending||previewPending}>{pending?"กำลังเพิ่มงาน…":"เพิ่มงาน"}</button><p role="status">{state.message}</p></form>;
}
