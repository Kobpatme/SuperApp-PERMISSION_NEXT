import "server-only";
import { z } from "zod";
import { getAccessContext } from "./access";
import { isAuthorized } from "./authorization";
import { getProject } from "@/modules/permission-out/service";
import { cableInput, type CableInput } from "@/modules/duct-rental/domain/cable-workflow";
// Application composition consumes published module services, never private tables.
export async function loadCableAnalysisHandoff(id:string):Promise<CableInput|null> {
  if(!z.string().uuid().safeParse(id).success)return null;
  const [source,target]=await Promise.all([getAccessContext("permission-out"),getAccessContext("duct-rental")]);
  if(!source.allowed||!target.allowed||source.userId!==target.userId||!isAuthorized(target.subject,"duct_rental.request.create",{ownerId:target.userId}))return null;
  try {
    const project=await getProject({userId:source.userId},id),first=project.snapshot.segments[0],last=project.snapshot.segments.at(-1);
    const format=(p:number[]|undefined)=>p?`${p[1].toFixed(6)}, ${p[0].toFixed(6)}`:"";
    return cableInput.parse({authority:"PEA",projectName:project.title,routeName:first?.name.slice(0,200)??"",startPoint:format(first?.coords[0]),endPoint:format(last?.coords.at(-1)),cableType:"",contact:"",submissionNumber:"",permitNumber:"",notes:`อ้างอิงผลวิเคราะห์เส้นทาง ${id}\n/permission-out?project=${id}\nข้อมูลอ้างอิงสำหรับตรวจสอบก่อนสร้างคำขอ ไม่ใช่ใบอนุญาตหรือผลรับรองค่าใช้จ่าย`});
  }catch{return null;}
}
