import { randomUUID } from "node:crypto";
import Decimal from "decimal.js";
import { and, eq, gte, lt, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, type DatabaseTransaction } from "@/db";
import { carBookingBookings as bookings, carBookingCars as cars, carBookingLogs as logs } from "@/db/schema";
import { runMaterialChange } from "@/lib/material-change";
import { assertBatchIntervals, bookingInputSchema, CarBookingError, carInputSchema, intervalSchema, logInputSchema, returnInputSchema } from "@/lib/car-booking-input";

// Constructed only from a verified server session; never deserialize this from request data.
export type CarBookingContext = { actorId: string; displayName: string; requestId: string };
type Booking = typeof bookings.$inferSelect;
type Car = typeof cars.$inferSelect;
const idSchema = z.string().uuid();
function databaseError(error: unknown): {code?: string;constraint_name?: string} {
  if (!error || typeof error !== "object") return {};
  const value = error as {code?:string;constraint_name?:string;cause?:unknown};
  return value.code ? value : databaseError(value.cause);
}
async function transaction<T>(context: CarBookingContext, run: (tx: DatabaseTransaction, admin: boolean) => Promise<T>) {
  idSchema.parse(context.actorId); idSchema.parse(context.requestId);
  try {
    return await getDb().transaction(async tx => {
      await tx.execute(sql`select set_config('app.user_id',${context.actorId},true)`);
      const [access] = await tx.execute<{allowed:boolean;admin:boolean}>(sql`select
        public.car_booking_has_access('car_booking.module.use',${context.actorId}::uuid) as allowed,
        public.car_booking_has_access('car_booking.module.admin') as admin`);
      if (!access?.allowed && !access?.admin) throw new CarBookingError("FORBIDDEN","คุณไม่มีสิทธิ์ใช้งานระบบจองรถ",403);
      return run(tx,access.admin);
    });
  } catch(error) {
    if (error instanceof CarBookingError || error instanceof z.ZodError) throw error;
    const dbError=databaseError(error);
    if (dbError.code === "23P01") throw new CarBookingError(dbError.constraint_name === "car_booking_user_overlap" ? "PERSON_CONFLICT" : "CAR_CONFLICT",dbError.constraint_name === "car_booking_user_overlap" ? "คุณมีการจองรถในช่วงเวลานี้แล้ว ไม่สามารถจองซ้อนได้" : "รถไม่ว่างในช่วงเวลาที่เลือก",409);
    if (dbError.code === "42501") throw new CarBookingError("FORBIDDEN","คุณไม่มีสิทธิ์ดำเนินการรายการนี้",403);
    if (["23514","23505","40001","40P01"].includes(dbError.code || "")) throw new CarBookingError("CONFLICT","ข้อมูลเปลี่ยนแปลงหรือไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่",409);
    throw error;
  }
}
function ownFilter(context:CarBookingContext,admin:boolean) { return admin ? undefined : eq(bookings.userId,context.actorId); }
async function lockCar(tx:DatabaseTransaction,id:string):Promise<Car> {
  const [row]=await tx.execute<{id:string;license_plate:string;parking_floor:string|null;latest_mileage:string;is_active:boolean}>(sql`select * from public.car_booking_lock_car(${id}::uuid)`);
  if (!row) throw new CarBookingError("CAR_NOT_FOUND","ไม่พบรถที่เลือก",404);
  return {id:row.id,licensePlate:row.license_plate,parkingFloor:row.parking_floor,latestMileage:row.latest_mileage,isActive:row.is_active} as Car;
}
async function lockBooking(tx:DatabaseTransaction,id:string,context:CarBookingContext,admin:boolean,deniedMessage="ไม่มีสิทธิ์ดำเนินการรายการนี้"):Promise<Booking> {
  const where=and(eq(bookings.id,id),ownFilter(context,admin));
  const [found]=await tx.select().from(bookings).where(where);
  if (!found) throw new CarBookingError("BOOKING_FORBIDDEN",deniedMessage,403);
  await lockCar(tx,found.carId);
  const [locked]=await tx.select().from(bookings).where(where).for("update");
  if (!locked) throw new CarBookingError("BOOKING_FORBIDDEN",deniedMessage,403);
  return locked;
}
async function material<T>(tx:DatabaseTransaction,context:CarBookingContext,action:string,id:string,ownerId:string,run:()=>Promise<T>,before?:Record<string,unknown>,after?:Record<string,unknown>) {
  const eventId=randomUUID();
  return runMaterialChange({
    audit:{actorId:context.actorId,moduleId:"car-booking",action,entityType:"car_booking",entityId:id,requestId:context.requestId,before,after},
    activity:{eventType:`car-booking.${action}.v1`,eventVersion:1,actorId:context.actorId,ownerId,moduleId:"car-booking",entityType:"car_booking",entityId:id,occurredAt:new Date(),sourceSystem:"permission_next",sourceEventId:eventId,correlationId:context.requestId,kpiEligible:false,payload:{action}},
    outbox:{topic:`car-booking.${action}.v1`,idempotencyKey:eventId,aggregateType:"car_booking",aggregateId:id,payload:{actorId:context.actorId,action}},
  },run,tx);
}
export async function createCarBookings(raw:unknown,context:CarBookingContext) {
  const input=bookingInputSchema.parse(raw); assertBatchIntervals(input.intervals);
  let plate="ที่เลือก";
  return transaction(context,async tx=>{
    const car=await lockCar(tx,input.carId);
    plate=car.licensePlate;
    if (!car.isActive) throw new CarBookingError("CAR_INACTIVE","รถคันนี้ถูกปิดใช้งาน",409);
    const ids:string[]=[];
    for (const interval of input.intervals) {
      // Check own conflict explicitly for a useful message; GiST protects every race.
      const own=await tx.select({id:bookings.id}).from(bookings).where(and(eq(bookings.userId,context.actorId),ne(bookings.status,"cancelled"),lt(bookings.startTime,interval.endTime),sql`least(${bookings.endTime},coalesce(${bookings.actualReturnTime},${bookings.endTime})) > ${interval.startTime.toISOString()}::timestamptz`)).limit(1);
      if (own.length) throw new CarBookingError("PERSON_CONFLICT","คุณมีการจองรถในช่วงเวลานี้แล้ว ไม่สามารถจองซ้อนได้",409);
      const id=randomUUID();
      await material(tx,context,"booking.created",id,context.actorId,async()=>{
        await tx.insert(bookings).values({id,userId:context.actorId,employeeName:context.displayName,carId:car.id,destination:input.destination,...interval,startMileage:car.latestMileage});
      },undefined,{carId:car.id,startTime:interval.startTime.toISOString(),endTime:interval.endTime.toISOString(),startMileage:car.latestMileage});
      ids.push(id);
    }
    return {ids};
  }).catch(error=>{
    if(error instanceof CarBookingError && error.code==="CAR_CONFLICT") throw new CarBookingError("CAR_CONFLICT",`รถทะเบียน ${plate} ไม่ว่างในช่วงเวลาที่เลือก`,409);
    throw error;
  });
}
export async function returnCarBooking(id:string,raw:unknown,context:CarBookingContext) {
  idSchema.parse(id);const input=returnInputSchema.parse(raw);
  return transaction(context,async(tx,admin)=>{
    const booking=await lockBooking(tx,id,context,admin,"ไม่มีสิทธิ์คืนรถรายการนี้"),car=await lockCar(tx,booking.carId);
    if(booking.status!=="booked") throw new CarBookingError("INVALID_STATUS","รายการนี้ไม่ได้อยู่ในสถานะที่คืนรถได้",409);
    const [previous]=await tx.execute<{name:string|null}>(sql`select public.car_booking_previous_unreturned(${id}::uuid) as name`);
    if(previous.name!==null) throw new CarBookingError("PREVIOUS_UNRETURNED",`ไม่สามารถคืนรถได้ เนื่องจากผู้ใช้งานก่อนหน้า (${previous.name}) ยังไม่ได้คืนรถ กรุณาติดต่อให้ผู้ใช้งานก่อนหน้าคืนรถก่อน`,409);
    if(input.actualReturnTime<booking.startTime) throw new CarBookingError("RETURN_TIME","เวลาคืนรถต้องหลังเวลาเริ่มต้น");
    const [settings]=await tx.execute<{parking_floors:string[]}>(sql`select parking_floors from public.car_booking_settings where id=1`);
    if(!settings?.parking_floors.includes(input.parkingFloor))throw new CarBookingError("PARKING_FLOOR","กรุณาเลือกชั้นที่จอดที่เปิดใช้งาน");
    if(new Decimal(input.mileage).lte(car.latestMileage) || new Decimal(input.mileage).lte(booking.startMileage)) throw new CarBookingError("RETURN_MILEAGE",`เลขไมล์ต้องมากกว่าเลขไมล์ล่าสุด (${car.latestMileage})`);
    if(input.refueled && (new Decimal(input.fuelMileage!).lt(car.latestMileage) || new Decimal(input.fuelMileage!).gt(input.mileage))) throw new CarBookingError("FUEL_MILEAGE","เลขไมล์ตอนเติมน้ำมันต้องอยู่ระหว่างเลขไมล์ล่าสุดและเลขไมล์ตอนคืน");
    const change={status:"completed",actualReturnTime:input.actualReturnTime,mileageOnReturn:input.mileage,parkingFloor:input.parkingFloor,refueled:input.refueled,fuelMileage:input.refueled?input.fuelMileage:null,fuelLiters:input.refueled?input.fuelLiters:null,fuelAmount:input.refueled?input.fuelAmount:null,updatedAt:new Date()};
    await material(tx,context,"booking.returned",id,booking.userId,async()=>{
      await tx.update(bookings).set(change).where(eq(bookings.id,id));
      await tx.execute(sql`select public.car_booking_sync_return(${id}::uuid)`);
    },{status:booking.status,latestMileage:car.latestMileage},{...change,actualReturnTime:input.actualReturnTime.toISOString()});
    return {id,message:"คืนรถเรียบร้อยแล้ว"};
  });
}
export async function cancelCarBooking(id:string,context:CarBookingContext) {
  idSchema.parse(id);
  return transaction(context,async(tx,admin)=>{
    const booking=await lockBooking(tx,id,context,admin,"ไม่มีสิทธิ์ยกเลิกรายการนี้");
    if(booking.status!=="booked") throw new CarBookingError("INVALID_STATUS","รายการนี้ไม่สามารถยกเลิกได้",409);
    await material(tx,context,"booking.cancelled",id,booking.userId,async()=>{await tx.update(bookings).set({status:"cancelled",cancelledAt:new Date(),cancelledBy:context.actorId,updatedAt:new Date()}).where(eq(bookings.id,id));},{status:booking.status},{status:"cancelled"});
    return {id,message:"ยกเลิกการจองเรียบร้อยแล้ว"};
  });
}
export async function addCarBookingLog(id:string,raw:unknown,context:CarBookingContext) {
  idSchema.parse(id);const input=logInputSchema.parse(raw);
  return transaction(context,async(tx,admin)=>{
    const booking=await lockBooking(tx,id,context,admin);
    if(booking.status!=="booked") throw new CarBookingError("INVALID_STATUS","บันทึกระหว่างทางได้เฉพาะรายการที่กำลังใช้งานอยู่",409);
    if(new Decimal(input.mileage).lt(booking.startMileage)) throw new CarBookingError("LOG_MILEAGE",`เลขไมล์ต้องไม่น้อยกว่าเลขไมล์เริ่มต้น (${booking.startMileage})`);
    const logId=randomUUID(),fuel=input.logType==="fuel" || input.refueled;
    await material(tx,context,"log.created",id,booking.userId,async()=>{await tx.insert(logs).values({...input,id:logId,bookingId:id,createdBy:context.actorId,fuelLiters:fuel?input.fuelLiters:null,fuelAmount:fuel?input.fuelAmount:null,gpsLatitude:input.gpsLatitude?.toString(),gpsLongitude:input.gpsLongitude?.toString(),gpsAccuracyMeters:input.gpsAccuracyMeters?.toString()});},undefined,{logId,logType:input.logType,mileage:input.mileage});
    return {id:logId};
  });
}
export async function saveCar(raw:unknown,context:CarBookingContext,id?:string) {
  const input=carInputSchema.parse(raw);if(id)idSchema.parse(id);
  return transaction(context,async(tx,admin)=>{
    if(!admin)throw new CarBookingError("FORBIDDEN","คุณไม่มีสิทธิ์จัดการรถ",403);
    if(input.parkingFloor!==null) {
      const [settings]=await tx.execute<{parking_floors:string[]}>(sql`select parking_floors from public.car_booking_settings where id=1`);
      if(!settings?.parking_floors.includes(input.parkingFloor))throw new CarBookingError("PARKING_FLOOR","กรุณาเลือกชั้นที่จอดที่เปิดใช้งาน");
    }
    const target=id || randomUUID();const previous=id?await lockCar(tx,id):undefined;
    await material(tx,context,id?"car.updated":"car.created",target,context.actorId,async()=>{
      if(id)await tx.update(cars).set({...input,updatedAt:new Date()}).where(eq(cars.id,id));
      else await tx.insert(cars).values({id:target,...input});
    },previous?{licensePlate:previous.licensePlate,latestMileage:previous.latestMileage,isActive:previous.isActive}:undefined,input);
    return {id:target};
  });
}
export async function readCarBookings(raw:unknown,context:CarBookingContext,offset=0) {
  z.number().int().min(0).max(1000000).parse(offset);
  const range=intervalSchema.parse(raw);
  if(range.endTime.getTime()-range.startTime.getTime()>93*86400000)throw new CarBookingError("RANGE","เลือกช่วงเวลาไม่เกิน 93 วัน");
  return transaction(context,async(tx,admin)=>tx.select().from(bookings).where(and(ownFilter(context,admin),lt(bookings.startTime,range.endTime),gte(bookings.endTime,range.startTime))).orderBy(bookings.startTime,bookings.id).limit(1000).offset(offset));
}
export async function readCarOpenBookings(context:CarBookingContext,offset=0) {
  z.number().int().min(0).max(1000000).parse(offset);
  return transaction(context,async(tx,admin)=>tx.select().from(bookings).where(and(ownFilter(context,admin),eq(bookings.status,"booked"))).orderBy(bookings.startTime,bookings.id).limit(1000).offset(offset));
}
export async function readCarBookingLogs(id:string,context:CarBookingContext,gpsOnly=false,offset=0) {
  z.number().int().min(0).max(1000000).parse(offset);
  idSchema.parse(id);
  return transaction(context,async(tx,admin)=>{
    if(gpsOnly&&!admin)throw new CarBookingError("FORBIDDEN","เฉพาะแอดมินเท่านั้นที่ดูแผนที่พิกัดได้",403);
    const [booking]=await tx.select({id:bookings.id}).from(bookings).where(and(eq(bookings.id,id),ownFilter(context,admin)));
    if(!booking)throw new CarBookingError("FORBIDDEN","ไม่มีสิทธิ์ดูบันทึกรายการนี้",403);
    return tx.select().from(logs).where(and(eq(logs.bookingId,id),gpsOnly?sql`${logs.gpsLatitude} is not null and ${logs.gpsLongitude} is not null`:undefined)).orderBy(logs.logTime,logs.id).limit(1000).offset(offset);
  });
}
export async function readCarCalendar(raw:unknown,context:CarBookingContext) {
  const range=intervalSchema.parse(raw);
  if(range.endTime.getTime()-range.startTime.getTime()>93*86400000)throw new CarBookingError("RANGE","เลือกช่วงเวลาไม่เกิน 93 วัน");
  return transaction(context,tx=>tx.execute(sql`select * from public.car_booking_calendar(${range.startTime.toISOString()}::timestamptz,${range.endTime.toISOString()}::timestamptz)`));
}
export async function readCars(context:CarBookingContext,range?:unknown) {
  const interval=range?intervalSchema.parse(range):undefined;
  return transaction(context,async(tx,admin)=>{
    const rows=await tx.execute<{car_id:string;license_plate:string;parking_floor:string|null;latest_mileage:string;is_active:boolean;last_user:string|null;using_now:boolean}>(sql`select * from public.car_booking_vehicle_state()`);
    const busy=interval?await tx.execute<{car_id:string}>(sql`select * from public.car_booking_busy_cars(${interval.startTime.toISOString()}::timestamptz,${interval.endTime.toISOString()}::timestamptz)`):[];
    const ids=new Set(busy.map(row=>row.car_id));
    return rows.filter(row=>(admin || row.is_active)&&!ids.has(row.car_id)).map(row=>({...row,last_user:row.last_user || (row.using_now?"กำลังใช้งานครั้งแรก":"ยังไม่เคยมีผู้ใช้งาน")}));
  });
}
export { transaction as withCarBookingTransaction, material as materialCarChange };
