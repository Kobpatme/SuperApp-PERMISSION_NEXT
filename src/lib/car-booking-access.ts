import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { z } from "zod";
import type { DatabaseTransaction } from "@/db";
import { getCarBookingDb as getDb } from "./car-booking-db";
import { runMaterialChange } from "./material-change";
import { CarBookingError } from "./car-booking-input";
import type { CarBookingContext } from "./car-booking-service";
export type CarAccessUser={id:string;display_name:string|null;email:string;employee_code:string|null;status:string;can_use:boolean;can_admin:boolean};
async function accessTransaction<T>(context:CarBookingContext,run:(tx:DatabaseTransaction)=>Promise<T>) {
  z.string().uuid().parse(context.actorId);
  return getDb().transaction(async tx=>{
    await tx.execute(sql`select set_config('app.user_id',${context.actorId},true)`);
    const [access]=await tx.execute<{allowed:boolean}>(sql`select public.car_booking_can_manage_access() as allowed`);
    if(!access.allowed)throw new CarBookingError("FORBIDDEN","เฉพาะผู้ดูแลสิทธิ์ผู้ใช้เท่านั้น",403);
    return run(tx);
  });
}
export async function readCarAccessUsers(context:CarBookingContext) {
  return accessTransaction(context,tx=>tx.execute<CarAccessUser>(sql`select * from public.car_booking_access_users()`));
}
export async function saveCarUserAccess(raw:unknown,context:CarBookingContext) {
  const input=z.object({userId:z.string().uuid(),canUse:z.boolean(),canAdmin:z.boolean(),expectedUse:z.boolean(),expectedAdmin:z.boolean()}).strict().parse(raw);
  return accessTransaction(context,async tx=>{
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`car-access:${input.userId}`}))`);
    const rows=await tx.execute<CarAccessUser>(sql`select * from public.car_booking_access_users()`);
    const before=rows.find(row=>row.id===input.userId);
    if(!before)throw new CarBookingError("NOT_FOUND","ไม่พบผู้ใช้ที่เลือก",404);
    if(before.can_use!==input.expectedUse || before.can_admin!==input.expectedAdmin)throw new CarBookingError("CONFLICT","สิทธิ์เปลี่ยนแล้ว กรุณาโหลดใหม่",409);
    const eventId=randomUUID();
    await runMaterialChange({
      audit:{actorId:context.actorId,moduleId:"car-booking",action:"access.changed",entityType:"profile",entityId:input.userId,requestId:context.requestId,before:{canUse:before.can_use,canAdmin:before.can_admin},after:{canUse:input.canUse,canAdmin:input.canAdmin},metadata:{sessionsRevoked:false,otherCapabilitiesPreserved:true}},
      activity:{eventType:"car-booking.access.changed.v1",eventVersion:1,actorId:context.actorId,ownerId:input.userId,moduleId:"car-booking",entityType:"profile",entityId:input.userId,occurredAt:new Date(),sourceSystem:"permission_next",sourceEventId:eventId,correlationId:context.requestId,kpiEligible:false,payload:{canUse:input.canUse,canAdmin:input.canAdmin}},
      outbox:{topic:"car-booking.access.changed.v1",idempotencyKey:eventId,aggregateType:"profile",aggregateId:input.userId,payload:{actorId:context.actorId}},
    },async()=>{await tx.execute(sql`select public.car_booking_set_user_access(${input.userId}::uuid,${input.canUse},${input.canAdmin})`);},tx);
    return {message:"บันทึกสิทธิ์จองรถแล้ว มีผลในคำขอถัดไป"};
  });
}
