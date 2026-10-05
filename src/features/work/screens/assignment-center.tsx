"use client";
import { useActionState, useState } from "react";
import type { WorkReadModel } from "@/lib/work-read-model";
import { assignWorkTasksAction, previewWorkDeadlineAction, type WorkActionState } from "@/app/(platform)/work/actions";
import { WorkEmpty, WorkScreenShell, WorkUnavailable } from "@/features/work/components/work-screen-shell";
import { TaskKpiFields } from "@/features/work/components/task-kpi-fields";
const initial:WorkActionState={ok:false,message:""};
export function AssignmentCenterScreen({model}:{model:WorkReadModel}){
 const [state,action,pending]=useActionState(assignWorkTasksAction,initial);
 const [preview,previewAction,previewPending]=useActionState(previewWorkDeadlineAction,initial);
 const [teamId,setTeamId]=useState("");
 const teams=[...new Map(model.assignmentOptions.filter(p=>p.teamId).map(p=>[p.teamId!,p.teamName])).entries()];
 return <WorkScreenShell title="ศูนย์มอบหมายงาน" description="เลือกทีม ผู้รับผิดชอบ และ KPI แล้วตรวจ deadline ก่อนมอบหมาย" parent={{label:"ภาพรวมทีม",href:"/work/team"}}>
 {model.source.status!=="ready"?<WorkUnavailable message="ยังโหลดข้อมูลสำหรับมอบหมายไม่ได้" detail={model.source.message}/>:model.assignmentOptions.length?<form action={action} className="work-panel work-assignment-form"><input type="hidden" name="idempotencyKey" value={model.creationKey}/><fieldset disabled={pending||previewPending} className="work-form-grid"><label>ทีม<select name="teamId" value={teamId} onChange={e=>setTeamId(e.target.value)} required><option value="">เลือกทีม</option>{teams.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><label>ผู้รับผิดชอบ<select name="assigneeId" key={teamId} defaultValue="" required><option value="">เลือกผู้รับผิดชอบ</option>{model.assignmentOptions.filter(p=>p.teamId===teamId).map(p=><option key={`${p.id}:${p.teamId}`} value={p.id}>{p.name}</option>)}</select></label><TaskKpiFields key={teamId+model.creationKey} rules={model.kpiOptions.filter(r=>r.teamId===teamId)}/><label>ชื่อชุดงาน<input name="title" required minLength={3} maxLength={180}/></label><label>ความสำคัญ<select name="priority" defaultValue="normal"><option value="low">ต่ำ</option><option value="normal">ปกติ</option><option value="high">สูง</option><option value="urgent">เร่งด่วน</option></select></label><label className="work-form-span-2">Job / งานย่อย (สูงสุด 20 รายการ)<textarea name="jobs" required maxLength={4000} rows={5}/></label><label className="work-form-span-2">หมายเหตุ<textarea name="notes" maxLength={4000}/></label></fieldset><button className="secondary-action" formAction={previewAction} formNoValidate disabled={pending||previewPending}>ดู deadline ล่วงหน้า</button><p role="status">{preview.message}</p><button className="primary" disabled={pending||previewPending}>{pending?"กำลังมอบหมาย…":"มอบหมายงาน"}</button><p role="status">{state.message}</p></form>:<WorkEmpty title="ยังไม่มีผู้รับผิดชอบในขอบเขต" detail="ให้ผู้ดูแลกำหนดทีมและสิทธิ์การมอบหมาย"/>}</WorkScreenShell>;
}
