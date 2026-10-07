import { z } from "zod";
import Decimal from "decimal.js";

export class CarBookingError extends Error {
  constructor(readonly code: string, message: string, readonly status = 400) { super(message); }
}
const decimal = z.union([z.string().trim().regex(/^\d+(\.\d+)?$/, "เลขไมล์ต้องเป็นตัวเลขเท่านั้น"), z.number().finite().nonnegative()], {errorMap:(_issue,context)=>({message:context.data == null || context.data === ""?"กรุณากรอกข้อมูลให้ครบถ้วน":"เลขไมล์ต้องเป็นตัวเลขเท่านั้น"})})
  .transform(value => new Decimal(value).toFixed()).refine(value => value.length <= 40, "ตัวเลขยาวเกินกำหนด");
const positive = decimal.refine(value => new Decimal(value).gt(0), "จำนวนลิตรและจำนวนเงินต้องมากกว่า 0");
const time = z.string({required_error:"กรุณากรอกวันและเวลาให้ครบ",invalid_type_error:"กรุณากรอกวันและเวลาให้ครบ"}).datetime({ offset: true, message: "กรุณากรอกวันและเวลาให้ครบ" }).transform(value => new Date(value));
export const intervalSchema = z.object({ startTime: time, endTime: time }).strict().refine(value => value.endTime > value.startTime, "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น");
export const bookingInputSchema = z.object({ carId: z.string().uuid("กรุณาเลือกทะเบียนรถ"), destination: z.string().trim().min(1, "กรุณากรอกสถานที่ที่จะไป").max(2000), intervals: z.array(intervalSchema).min(1).max(50) }).strict();
export const returnInputSchema = z.object({ actualReturnTime: time, parkingFloor: z.string().trim().min(1,"กรุณากรอกข้อมูลให้ครบถ้วน").max(80), mileage: decimal, refueled: z.boolean(), fuelMileage: decimal.nullish(), fuelLiters: positive.nullish(), fuelAmount: positive.nullish() }).strict()
  .superRefine((value, ctx) => { if (value.refueled && [value.fuelMileage,value.fuelLiters,value.fuelAmount].some(v => v == null)) ctx.addIssue({code:"custom",message:"กรุณากรอกข้อมูลการเติมน้ำมันให้ครบ"}); });
export const logInputSchema = z.object({ logTime: time, logType: z.enum(["overnight_stop","fuel","checkpoint","other"]), location: z.string().trim().min(1,"กรุณากรอกวันเวลา สถานที่ และเลขไมล์ให้ครบ").max(2000), mileage: decimal, refueled: z.boolean().default(false), fuelLiters: positive.nullish(), fuelAmount: positive.nullish(), note: z.string().trim().max(4000).default(""), gpsLatitude: z.number().finite().min(-90).max(90).nullish(), gpsLongitude: z.number().finite().min(-180).max(180).nullish(), gpsAccuracyMeters: z.number().finite().nonnegative().nullish() }).strict()
  .superRefine((value, ctx) => {
    if ((value.refueled || value.logType === "fuel") && (value.fuelLiters == null || value.fuelAmount == null)) ctx.addIssue({code:"custom",message:"กรุณาระบุจำนวนลิตรและจำนวนเงินสำหรับการเติมน้ำมัน"});
    if ((value.gpsLatitude == null) !== (value.gpsLongitude == null) || value.gpsLatitude == null && value.gpsAccuracyMeters != null) ctx.addIssue({code:"custom",message:"พิกัดไม่ครบถ้วน"});
  });
export const carInputSchema = z.object({ licensePlate: z.string().trim().min(1).max(80), parkingFloor: z.string().trim().max(80).nullable(), latestMileage: decimal, isActive: z.boolean().default(true) }).strict();
export function assertBatchIntervals(intervals: {startTime: Date;endTime:Date}[]) {
  const sorted = [...intervals].sort((a,b) => a.startTime.getTime()-b.startTime.getTime());
  if (sorted.some((value,index) => index > 0 && value.startTime < sorted[index-1].endTime)) throw new CarBookingError("PERSON_CONFLICT","คุณมีการจองรถในช่วงเวลานี้แล้ว ไม่สามารถจองซ้อนได้",409);
}
