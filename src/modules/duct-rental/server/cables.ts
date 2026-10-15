import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { cableChange, cableInput, cableNext, cablePermission } from "../domain/cable-workflow";
import { cableRequests } from "./schema";
import { DuctError, material, mutation, requirePermission, transaction, type DuctContext } from "./transaction";

export async function listCables(raw: unknown, context: DuctContext) {
  const input = z.object({ offset: z.coerce.number().int().min(0).max(1000000).default(0), query: z.string().trim().max(200).default("") }).parse(raw);
  return transaction(context, async tx => {
    const rows = await tx.select().from(cableRequests).where(and(isNull(cableRequests.archivedAt), sql`strpos(lower(${cableRequests.data}->>'projectName' || ' ' || ${cableRequests.code}),lower(${input.query}))>0`)).orderBy(desc(cableRequests.updatedAt),desc(cableRequests.id)).limit(51).offset(input.offset);
    return { rows: rows.slice(0,50), nextOffset: rows.length > 50 ? input.offset+50 : null };
  });
}
export async function createCable(raw: unknown, key: string, context: DuctContext) {
  const data = cableInput.parse(raw);
  return mutation(context,key,"cable.created",data,async tx => {
    await requirePermission(tx,"duct_rental.request.create",context.actorId);
    const id=randomUUID(),code=`CB-${id.slice(0,8).toUpperCase()}`;
    await material(tx,context,"cable.created",id,context.actorId,async()=>{await tx.insert(cableRequests).values({id,code,ownerId:context.actorId,data});await tx.execute(sql`select pg_notify('duct_rental_changed','')`);},undefined,{code,data});
    return {id,version:1};
  });
}
export async function changeCable(id: string, raw: unknown, key: string, context: DuctContext) {
  z.string().uuid().parse(id); const input=cableChange.parse(raw);
  return mutation(context,key,`cable.${input.action}`,{id,...input},async tx=>{
    const [row]=await tx.select().from(cableRequests).where(eq(cableRequests.id,id)).for("update");
    if(!row)throw new DuctError("NOT_FOUND","ไม่พบรายการหรือไม่มีสิทธิ์เข้าถึง",404);
    if(row.version!==input.version)throw new DuctError("STALE_VERSION","ข้อมูลเปลี่ยนแล้ว กรุณาโหลดใหม่ก่อนบันทึก",409);
    if(row.archivedAt || row.stage==="COMPLETE" && input.action!=="archive")throw new DuctError("CLOSED","งานนี้สิ้นสุดแล้ว",409);
    await requirePermission(tx,input.action==="archive"?"duct_rental.request.archive":input.action==="save"?"duct_rental.request.update":cablePermission(row.stage),row.ownerId);
    let stage=row.stage;
    if(input.action==="advance"||input.action==="revise")try{stage=cableNext(row.stage,input.data,input.action==="revise",input.reason);}catch(error){throw new DuctError("STATE",(error as Error).message);}
    const data=input.action==="archive"?row.data:input.data,version=row.version+1;
    const history=[...row.history,{at:new Date().toISOString(),actorId:context.actorId,action:input.action,from:row.stage,to:stage,reason:input.reason}];
    await material(tx,context,`cable.${input.action}`,id,row.ownerId,async()=>{await tx.update(cableRequests).set({data,stage,history,version,updatedAt:new Date(),archivedAt:input.action==="archive"?new Date():null}).where(eq(cableRequests.id,id));await tx.execute(sql`select pg_notify('duct_rental_changed','')`);},{data:row.data,stage:row.stage,version:row.version},{data,stage,version,reason:input.reason});
    return {id,version};
  });
}
