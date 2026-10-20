import { createHash } from "node:crypto";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { outboxMessages, profiles, tasks, userTeams } from "@/db/schema";
import { assertAuthorized, type AuthorizationSubject } from "@/lib/authorization";
import { runMaterialChange } from "@/lib/material-change";
import { resolveTaskKpi } from "@/lib/work-kpi-catalog";
import { ConcurrentWorkUpdateError } from "@/lib/work-task-service";
const inputSchema=z.object({ jobs:z.string().trim().min(1).max(4000),title:z.string().trim().max(180).default(""),teamId:z.string().uuid(),assigneeId:z.string().uuid(),ruleVersionId:z.string().uuid(),idempotencyKey:z.string().uuid(),notes:z.string().trim().max(4000).default(""),priority:z.enum(["low","normal","high","urgent"]).default("normal"),workType:z.enum(["","B1","C1","C2","E1"]).default(""),contractorName:z.string().trim().max(180).default(""),building:z.string().trim().max(180).default(""),client:z.string().trim().max(180).default(""),contractor:z.string().trim().max(180).default(""),ssrNumber:z.string().trim().max(180).default(""),ospNumber:z.string().trim().max(180).default("") });
export async function createWorkBatch(raw:unknown,kind:"personal"|"assigned",context:{ actor:AuthorizationSubject;requestId:string }) {
  const input=inputSchema.parse(raw);
  const jobs=input.jobs.split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
  if (!jobs.length || jobs.length>20 || new Set(jobs).size!==jobs.length || jobs.some(v=>v.length<3||v.length>180) || (kind==="assigned"&&input.title.length<3)) throw new Error("INVALID_JOBS");
  if (kind==="personal" && input.assigneeId!==context.actor.userId) throw new Error("INVALID_OWNER");
  assertAuthorized(context.actor,kind==="personal"?"work.task.create":"work.task.assign",{ ownerId:input.assigneeId,teamId:input.teamId });
  const fingerprint=createHash("sha256").update(JSON.stringify({kind,input})).digest("hex");
  const key=`work-create:${context.actor.userId}:${input.idempotencyKey}`;
  return getDb().transaction(async tx=>{
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${key}))`);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`work-create-scope:${input.teamId}:${input.assigneeId}`}))`);
    const [receipt]=await tx.select().from(outboxMessages).where(eq(outboxMessages.idempotencyKey,key));
    if (receipt) { if (receipt.payload.fingerprint!==fingerprint) throw new ConcurrentWorkUpdateError();return { id:receipt.aggregateId,count:jobs.length,replayed:true }; }
    const [person]=await tx.select().from(profiles).where(and(eq(profiles.id,input.assigneeId),eq(profiles.status,"active")));
    const [membership]=await tx.select().from(userTeams).where(and(eq(userTeams.userId,input.assigneeId),eq(userTeams.teamId,input.teamId)));
    if (!person||!membership) throw new Error("INVALID_OWNER");
    const kpi=await resolveTaskKpi({ teamId:input.teamId,userId:input.assigneeId,ruleVersionId:input.ruleVersionId },tx);
    const duplicate=await tx.select({id:tasks.id}).from(tasks).where(and(isNull(tasks.deletedAt),eq(tasks.teamId,input.teamId),eq(tasks.ownerId,input.assigneeId),eq(tasks.subKpi,kpi.subKpi),inArray(tasks.jobCode,jobs)));
    if (duplicate.length) throw new Error("DUPLICATE_JOB_KPI");
    if (kpi.subKpi.includes("แจ้ง Job ให้ผู้รับเหมา")&&!input.workType) throw new Error("TYPE_REQUIRED");
    const ids=jobs.map(()=>crypto.randomUUID()),id=crypto.randomUUID(),now=new Date();
    const extraData={contractorName:input.contractorName,building:input.building,client:input.client,contractor:input.contractor,ssrNumber:input.ssrNumber,ospNumber:input.ospNumber,personalKpiVersion:kpi.personalVersion};
    const topic=kind==="personal"?"work.task.created.v1":"work.task.assigned.v1";
    await runMaterialChange({
      audit:{ actorId:context.actor.userId,moduleId:"work",action:kind==="personal"?"task.create":"task.assign",entityType:"task_batch",entityId:id,requestId:context.requestId,after:{taskIds:ids,ownerId:input.assigneeId,teamId:input.teamId,ruleVersionId:kpi.slaRuleVersionId,kpiWeight:kpi.kpiWeight,dueAt:kpi.dueAt.toISOString(),extraData} },
      activity:{eventType:topic,eventVersion:1,actorId:context.actor.userId,ownerId:input.assigneeId,teamId:input.teamId,moduleId:"work",entityType:"task_batch",entityId:id,occurredAt:now,sourceSystem:"permission_next",sourceEventId:key,correlationId:id,kpiEligible:false,payload:{taskIds:ids} },
      outbox:{topic,idempotencyKey:key,aggregateType:"task_batch",aggregateId:id,payload:{ taskIds:ids,fingerprint,actorId:context.actor.userId }},
    },async inner=>inner.insert(tasks).values(jobs.map((job,i)=>({id:ids[i],ownerId:input.assigneeId,teamId:input.teamId,title:kind==="personal"?job:input.title,description:input.notes||null,note:input.notes||null,jobCode:job,...kpi,sourceKind:kind,priority:input.priority,workType:input.workType||null,extraData,status:kind==="personal"?"in_progress":"queued",version:1,createdAt:now,updatedAt:now}))),tx);
    return {id,count:jobs.length,replayed:false};
  });
}
