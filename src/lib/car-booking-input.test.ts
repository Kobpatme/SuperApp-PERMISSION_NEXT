import { describe, expect, it } from "vitest";
import { assertBatchIntervals, bookingInputSchema, logInputSchema, returnInputSchema } from "./car-booking-input";
const startTime="2030-01-01T01:00:00+07:00",endTime="2030-01-01T02:00:00+07:00";
describe("car booking server validation",()=>{
  it("requires explicit timezone, increasing dates, and rejects forged identity fields",()=>{
    const valid={carId:crypto.randomUUID(),destination:"ทดสอบ",intervals:[{startTime,endTime}]};
    expect(bookingInputSchema.safeParse(valid).success).toBe(true);
    expect(bookingInputSchema.safeParse({...valid,userId:crypto.randomUUID()}).success).toBe(false);
    for(const interval of [{startTime:endTime,endTime:startTime},{startTime:startTime.slice(0,19),endTime}])expect(bookingInputSchema.safeParse({...valid,intervals:[interval]}).success).toBe(false);
  });
  it("allows touching intervals but rejects internal batch overlap",()=>{
    const a={startTime:new Date(startTime),endTime:new Date(endTime)},b={startTime:a.endTime,endTime:new Date(a.endTime.getTime()+1000)};
    expect(()=>assertBatchIntervals([b,a])).not.toThrow();
    expect(()=>assertBatchIntervals([a,a])).toThrow("คุณมีการจองรถ");
  });
  it("preserves zero and decimal amounts and requires all return fuel fields",()=>{
    const raw={actualReturnTime:endTime,parkingFloor:"2A",mileage:"0",refueled:false};
    expect(returnInputSchema.parse(raw).mileage).toBe("0");
    expect(returnInputSchema.safeParse({...raw,mileage:"NaN"}).success).toBe(false);
    const invalid=returnInputSchema.safeParse({...raw,mileage:"abc"});
    expect(invalid.success?"":invalid.error.issues[0].message).toBe("เลขไมล์ต้องเป็นตัวเลขเท่านั้น");
    expect(returnInputSchema.safeParse({...raw,refueled:true}).success).toBe(false);
    expect(returnInputSchema.parse({...raw,refueled:true,fuelMileage:"0",fuelLiters:"10.25",fuelAmount:"400.05"}).fuelAmount).toBe("400.05");
  });
  it("allows no GPS and zero coordinates; rejects partial/invalid GPS and incomplete fuel",()=>{
    const raw={logTime:startTime,logType:"other",location:"ทดสอบ",mileage:"0"};
    expect(logInputSchema.safeParse(raw).success).toBe(true);
    expect(logInputSchema.safeParse({...raw,gpsLatitude:0,gpsLongitude:0}).success).toBe(true);
    expect(logInputSchema.safeParse({...raw,gpsLatitude:0}).success).toBe(false);
    expect(logInputSchema.safeParse({...raw,gpsLatitude:91,gpsLongitude:0}).success).toBe(false);
    expect(logInputSchema.safeParse({...raw,logType:"fuel"}).success).toBe(false);
  });
});
