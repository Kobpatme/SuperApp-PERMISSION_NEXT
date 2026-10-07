import { z } from "zod";
import { getAccessContext } from "@/lib/access";
import { logEvent } from "@/lib/logger";
import { CarBookingError } from "@/lib/car-booking-input";
import { addCarBookingLog, cancelCarBooking, createCarBookings, readCarBookingLogs, readCarBookings, readCarCalendar, readCars, returnCarBooking, saveCar } from "@/lib/car-booking-service";

const headers={"Cache-Control":"no-store"};
type Operation="bookings"|"return"|"cancel"|"logs"|"gps"|"cars"|"calendar";
export async function handleCarBookingRequest(request:Request,operation:Operation,id?:string) {
  const requestId=crypto.randomUUID();
  try {
    const access=await getAccessContext("car-booking");
    if(!access.userId)return Response.json({error:"AUTHENTICATION_REQUIRED",message:"กรุณาเข้าสู่ระบบ"},{status:401,headers});
    if(!access.allowed || access.passwordChangeRequired)return Response.json({error:"FORBIDDEN",message:"คุณไม่มีสิทธิ์ใช้งานระบบจองรถ"},{status:403,headers});
    const write=request.method!=="GET";
    if(write && request.headers.get("origin")!==new URL(request.url).origin)throw new CarBookingError("FORBIDDEN","คำขอไม่ถูกต้อง",403);
    if(id)z.string().uuid().parse(id);
    const context={actorId:access.userId,displayName:access.displayName,requestId};
    const url=new URL(request.url),range={startTime:url.searchParams.get("start"),endTime:url.searchParams.get("end")};
    if(!write) {
      const offset=z.coerce.number().int().min(0).max(1000000).parse(url.searchParams.get("offset") || "0");
      const data=operation==="bookings"?await readCarBookings(range,context,offset)
        :operation==="calendar"?await readCarCalendar(range,context)
        :operation==="cars"?await readCars(context,url.searchParams.has("start") || url.searchParams.has("end")?range:undefined)
        :operation==="logs" || operation==="gps"?await readCarBookingLogs(id!,context,operation==="gps",offset):undefined;
      if(data===undefined)throw new CarBookingError("METHOD","คำขอไม่ถูกต้อง",405);
      const page=["bookings","logs","gps"].includes(operation)?{offset,limit:1000,nextOffset:data.length===1000?offset+1000:null}:undefined;
      return Response.json({data,page},{headers});
    }
    let raw:unknown={};
    if(operation!=="cancel") {
      if(!request.headers.get("content-type")?.startsWith("application/json"))throw new CarBookingError("PAYLOAD","คำขอไม่ถูกต้อง");
      const text=await request.text();if(text.length>65536)throw new CarBookingError("PAYLOAD","ข้อมูลมีขนาดใหญ่เกินกำหนด",413);
      try { raw=JSON.parse(text); }catch{throw new CarBookingError("PAYLOAD","คำขอไม่ถูกต้อง");}
    }
    const result=operation==="bookings"?await createCarBookings(raw,context)
      :operation==="return"?await returnCarBooking(id!,raw,context)
      :operation==="cancel"?await cancelCarBooking(id!,context)
      :operation==="logs"?await addCarBookingLog(id!,raw,context)
      :operation==="cars"?await saveCar(raw,context,id):undefined;
    if(result===undefined)throw new CarBookingError("METHOD","คำขอไม่ถูกต้อง",405);
    return Response.json({data:result},{status:operation==="bookings" || operation==="logs" || operation==="cars"&&!id?201:200,headers});
  } catch(error) {
    if(error instanceof CarBookingError)return Response.json({error:error.code,message:error.message},{status:error.status,headers});
    if(error instanceof z.ZodError) {
      const message=error.issues[0]?.message;
      return Response.json({error:"VALIDATION",message:message && /[\u0e00-\u0e7f]/.test(message)?message:"กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง"},{status:400,headers});
    }
    logEvent("error","car-booking.request.failed",{requestId,errorType:error instanceof Error?error.name:"UnknownError"});
    return Response.json({error:"SAVE_FAILED",message:"ไม่สามารถดำเนินการได้ กรุณาลองใหม่"},{status:500,headers});
  }
}
