import fs from 'node:fs';
for(const file of ['src/components/dashboard-overview.tsx','src/components/workspace-queue.tsx']){
 let s=fs.readFileSync(file,'utf8');if(!s.includes('import { copy }'))s=s.replace('"use client";','"use client";\nimport { copy } from "@/lib/copy";');
 s=s.replaceAll('"รอเชื่อมข้อมูลจากระบบต้นทาง"','copy.feedback.dataPreparing').replaceAll('"รอเชื่อมข้อมูล"','copy.feedback.queueWaiting');
 s=s.replaceAll('"ยังไม่มีรายการติดตามส่งมาจากระบบต้นทาง"','copy.feedback.queueEmpty').replaceAll('"รายการจะแสดงที่นี่เมื่อเชื่อมต่อระบบต้นทางแล้ว หากต้องใช้งาน กรุณาติดต่อผู้ดูแลระบบ"','copy.feedback.queuePreparingHint');
 s=s.replace('>แสดงรายการติดตามสูงสุด 500 รายการต่อระบบ ตรวจสอบรายการทั้งหมดในระบบต้นทาง<','>{copy.feedback.queueLimit}<');fs.writeFileSync(file,s);
}
