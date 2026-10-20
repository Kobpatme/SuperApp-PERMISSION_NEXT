import { randomUUID,timingSafeEqual } from "node:crypto";
import { processOspJobs } from "@/lib/car-booking-osp-jobs";
const headers={"Cache-Control":"no-store"};
export async function POST(request:Request){
 const secret=process.env.CAR_BOOKING_OSP_WORKER_SECRET,principal=process.env.CAR_BOOKING_OSP_WORKER_USER_ID;
 if(!secret||secret.length<32||!principal)return Response.json({message:"งานส่งรายงานยังไม่พร้อม"},{status:503,headers});
 const token=request.headers.get("authorization")?.replace(/^Bearer /,"") || "";
 if(Buffer.byteLength(token)!==Buffer.byteLength(secret)||!timingSafeEqual(Buffer.from(token),Buffer.from(secret)))return Response.json({message:"คำขอไม่ถูกต้อง"},{status:403,headers});
 try{return Response.json(await processOspJobs({actorId:principal,displayName:"งานส่งรายงาน OSP",requestId:randomUUID()}),{headers});}
 catch{return Response.json({message:"งานส่งรายงานไม่สำเร็จ"},{status:503,headers});}
}
