import fs from 'node:fs';
const substitutions={
 'src/app/(platform)/layout.tsx':[['label: "Job Tracker"','label: copy.feedback.tracker']],
 'src/components/workspace-queue.tsx':[['"ยังไม่มีรายละเอียดเพิ่มเติมจากระบบต้นทาง"','copy.feedback.detailsEmpty'],['>เปิดรายการต้นทาง<','>{copy.feedback.openRecord}<']],
 'src/app/(platform)/buildings/buildings-workspace.tsx':[['>ข้อมูลจาก PostgreSQL กลาง · อ่านอย่างเดียว<','>{copy.feedback.readOnly}<'],['>ค่าใช้จ่ายจาก CSV รอตรวจสอบ<','>{copy.feedback.feeReview}<']],
 'src/features/buildings/delete-building.tsx':[['>การลบจะนำอาคารและข้อมูลเฉพาะอาคารออกจากฐานข้อมูลอย่างถาวร ไม่สามารถย้อนกลับจากหน้านี้ได้ ระบบจะเก็บประวัติการลบไว้สำหรับตรวจสอบ<','>{copy.feedback.deleteBuildingWarning}<']],
};
for(const [file,pairs]of Object.entries(substitutions)){let s=fs.readFileSync(file,'utf8');for(const[from,to]of pairs){if(!s.includes(from))throw Error(`Expected display text missing: ${file}`);s=s.replaceAll(from,to);}if(!s.includes('import { copy }'))s='import { copy } from "@/lib/copy";\n'+s.replace('"use client";','');if(file.includes('delete-building'))s='"use client";\n'+s;fs.writeFileSync(file,s);}
