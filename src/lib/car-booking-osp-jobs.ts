import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { withCarBookingTransaction,materialCarChange,type CarBookingContext } from "./car-booking-service";
import { CarBookingError } from "./car-booking-input";
import { ospSourceRows } from "./car-booking-report-service";
import { buildOspRow } from "./car-booking-osp";
import { ospSheetsConfig,synchronizeOspSheet } from "./car-booking-google-sheets";
import { OspSyncError } from "./car-booking-sheets-plan";
export async function readOspSync(context:CarBookingContext){
 return withCarBookingTransaction(context,async(tx,admin)=>{
  if(!admin)throw new CarBookingError("FORBIDDEN","เฉพาะผู้ดูแลระบบจองรถเท่านั้น",403);
  const counts=await tx.execute<{status:string;count:number}>(sql`select status,count(*)::int as count from car_booking_osp_jobs group by status`);
  const jobs=await tx.execute<{id:string;kind:string;status:string;attempts:number;error_code:string|null;created_at:Date;sent_at:Date|null}>(sql`select id,kind,status,attempts,error_code,created_at,sent_at from car_booking_osp_jobs order by created_at desc,id desc limit 20`);
  return {configured:Boolean(ospSheetsConfig()),counts,jobs};
 });
}
export async function requestOspSync(raw:unknown,context:CarBookingContext){
 const {action}=z.object({action:z.enum(["rebuild","retry"])}).strict().parse(raw);
 return withCarBookingTransaction(context,async(tx,admin)=>{
  if(!admin)throw new CarBookingError("FORBIDDEN","เฉพาะผู้ดูแลระบบจองรถเท่านั้น",403);
  const id=randomUUID();
  await materialCarChange(tx,context,`osp.${action}.requested`,id,context.actorId,async()=>{
   if(action==="rebuild")await tx.execute(sql`insert into car_booking_osp_jobs(id,kind) values(${id}::uuid,'rebuild')`);
   else await tx.execute(sql`update car_booking_osp_jobs set status='queued',next_attempt_at=now(),error_code=null where status='failed'`);
  });
  return {queued:true};
 });
}
export async function processOspJobs(context:CarBookingContext,request:typeof fetch=fetch){
 const config=ospSheetsConfig();if(!config)return {status:"not_configured",processed:0};
 const token=randomUUID();
 const batch=await withCarBookingTransaction(context,async(tx,admin)=>{
  if(!admin)throw new CarBookingError("FORBIDDEN","ผู้ทำงานส่งรายงานไม่มีสิทธิ์",403);
  const lease=await tx.execute(sql`update car_booking_osp_state set lease_token=${token}::uuid,lease_expires_at=now()+interval '15 minutes' where id=1 and (lease_expires_at is null or lease_expires_at<now()) returning id`);
  if(!lease.length)return null;
  const jobs=await tx.execute<{id:string;attempts:number}>(sql`select id,attempts from car_booking_osp_jobs where (status in ('queued','failed') and next_attempt_at<=now()) or (status='running' and lease_expires_at<now()) order by created_at,id limit 100 for update skip locked`);
  if(!jobs.length){await tx.execute(sql`update car_booking_osp_state set lease_token=null,lease_expires_at=null where id=1 and lease_token=${token}::uuid`);return null;}
  const ids=jobs.map(job=>job.id);
  await tx.execute(sql`update car_booking_osp_jobs set status='running',attempts=attempts+1,lease_expires_at=now()+interval '15 minutes' where id in (${sql.join(ids.map(id=>sql`${id}::uuid`),sql`,`)})`);
  const sources=await ospSourceRows(tx);
  return {jobs,rows:sources.map((row,index)=>buildOspRow(row,index+1))};
 });
 if(!batch)return {status:"idle_or_busy",processed:0};
 let errorCode:string|null=null;
 try{await synchronizeOspSheet(config,batch.rows,batch.jobs[0].id,request);}catch(error){errorCode=error instanceof OspSyncError?error.code:"SYNC_FAILED";}
 await withCarBookingTransaction(context,async(tx,admin)=>{
  if(!admin)throw new CarBookingError("FORBIDDEN","ผู้ทำงานส่งรายงานไม่มีสิทธิ์",403);
  const owned=await tx.execute(sql`select id from car_booking_osp_state where id=1 and lease_token=${token}::uuid and lease_expires_at>now() for update`);
  if(!owned.length)throw new CarBookingError("LEASE_EXPIRED","ช่วงเวลาส่งรายงานหมดอายุ",409);
  await materialCarChange(tx,context,`osp.sync.${errorCode?"failed":"sent"}`,batch.jobs[0].id,context.actorId,async()=>{
  for(const job of batch.jobs){
   const delay=Math.min(86400,60*2**Math.min(job.attempts,10));
   await tx.execute(sql`update car_booking_osp_jobs set status=${errorCode?"failed":"sent"},error_code=${errorCode},sent_at=${errorCode?sql`null`:sql`now()`},lease_expires_at=null,next_attempt_at=now()+${delay}*interval '1 second' where id=${job.id}::uuid`);
  }
  await tx.execute(sql`update car_booking_osp_state set lease_token=null,lease_expires_at=null,last_sent_at=${errorCode?sql`last_sent_at`:sql`now()`} where id=1 and lease_token=${token}::uuid`);
  });
 });
 return {status:errorCode?"failed":"sent",processed:batch.jobs.length,errorCode};
}
