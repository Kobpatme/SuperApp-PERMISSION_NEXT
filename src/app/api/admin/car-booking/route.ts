import { z } from "zod";
import { getIdentityAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { readCarAccessUsers,saveCarUserAccess } from "@/lib/car-booking-access";
import { CarBookingError } from "@/lib/car-booking-input";
const headers={"Cache-Control":"no-store"};
async function handle(request:Request){
 try {
  const access=await getIdentityAccessContext();
  if(!access.userId)return Response.json({message:"กรุณาเข้าสู่ระบบ"},{status:401,headers});
  if(access.passwordChangeRequired || !isAuthorized(access.subject,"core.user.manage"))return Response.json({message:"คุณไม่มีสิทธิ์จัดการผู้ใช้"},{status:403,headers});
  const context={actorId:access.userId,displayName:access.displayName,requestId:crypto.randomUUID()};
  if(request.method==="GET")return Response.json({data:await readCarAccessUsers(context)},{headers});
  if(request.headers.get("origin")!==new URL(request.url).origin)return Response.json({message:"คำขอไม่ถูกต้อง"},{status:403,headers});
  const text=await request.text();if(text.length>8192)return Response.json({message:"ข้อมูลใหญ่เกินกำหนด"},{status:413,headers});
  let raw:unknown;try{raw=JSON.parse(text);}catch{return Response.json({message:"ข้อมูลไม่ถูกต้อง"},{status:400,headers});}
  return Response.json({data:await saveCarUserAccess(raw,context)},{headers});
 }catch(error){
  if(error instanceof CarBookingError)return Response.json({message:error.message},{status:error.status,headers});
  if(error instanceof z.ZodError)return Response.json({message:"ข้อมูลไม่ถูกต้อง"},{status:400,headers});
  return Response.json({message:"บันทึกสิทธิ์ไม่สำเร็จ กรุณาลองใหม่"},{status:500,headers});
 }
}
export const GET=handle;
export const PATCH=handle;
