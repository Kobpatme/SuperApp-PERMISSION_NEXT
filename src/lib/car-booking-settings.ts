import { sql } from "drizzle-orm";
import { z } from "zod";
import { CarBookingError } from "./car-booking-input";
import { materialCarChange, withCarBookingTransaction, type CarBookingContext } from "./car-booking-service";
const settingsSchema=z.object({floors:z.array(z.string().trim().min(1).max(80)).min(1).max(80),version:z.number().int().positive()}).strict().refine(value=>new Set(value.floors).size===value.floors.length,"รายการชั้นจอดต้องไม่ซ้ำกัน");
export async function readCarSettings(context:CarBookingContext) {
  return withCarBookingTransaction(context,async tx=>{
    const [row]=await tx.execute<{parking_floors:string[];version:number}>(sql`select parking_floors,version from public.car_booking_settings where id=1`);
    return {floors:row.parking_floors,version:row.version};
  });
}
export async function saveCarSettings(raw:unknown,context:CarBookingContext) {
  const input=settingsSchema.parse(raw);
  return withCarBookingTransaction(context,async(tx,admin)=>{
    if(!admin)throw new CarBookingError("FORBIDDEN","คุณไม่มีสิทธิ์จัดการชั้นจอด",403);
    const [before]=await tx.execute<{parking_floors:string[];version:number}>(sql`select parking_floors,version from public.car_booking_settings where id=1`);
    return materialCarChange(tx,context,"settings.updated",context.actorId,context.actorId,async()=>{
      const [saved]=await tx.execute<{version:number}>(sql`update public.car_booking_settings set parking_floors=array[${sql.join(input.floors.map(floor=>sql`${floor}`),sql`, `)}]::text[],version=version+1,updated_at=now() where id=1 and version=${input.version} returning version`);
      if(!saved)throw new CarBookingError("CONFLICT","รายการชั้นจอดเปลี่ยนแล้ว กรุณาโหลดใหม่",409);
      return {floors:input.floors,version:saved.version};
    },before,input);
  });
}
