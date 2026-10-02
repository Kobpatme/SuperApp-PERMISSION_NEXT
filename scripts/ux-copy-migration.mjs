import fs from 'node:fs';
const replacements = {
  'src/components/deposit-workspace.tsx': [['"ต้องเชื่อมฐานข้อมูลกลางก่อนสร้างรายการ"','copy.feedback.unavailable'],['"ฐานข้อมูลไม่พร้อม กรุณาลองใหม่"','copy.feedback.unavailable'],['"บัญชี Developer เป็นโหมดอ่านอย่างเดียว"','copy.feedback.readOnly'],['"ยังไม่ได้ตั้งค่าฐานข้อมูลกลาง"','copy.feedback.unavailable']],
  'src/app/(platform)/guarantees/new/page.tsx': [['>ยังไม่ได้เชื่อมฐานข้อมูลกลาง<','>{copy.feedback.unavailable}<']],
  'src/app/(platform)/buildings/page.tsx': [['"ยังไม่ได้เชื่อมฐานข้อมูลกลาง"','copy.feedback.unavailable']],
  'src/app/(platform)/buildings/new/page.tsx': [['>ยังไม่ได้เชื่อมฐานข้อมูลกลาง<','>{copy.feedback.unavailable}<']],
  'src/app/(platform)/buildings/map/page.tsx': [['"ยังไม่ได้เชื่อมฐานข้อมูลกลาง"','copy.feedback.unavailable']],
  'src/app/(platform)/buildings/buildings-workspace.tsx': [['"ไม่พบโฟลเดอร์เอกสารของอาคารนี้ใน NAS"','copy.feedback.documentsEmpty'],['"ยังเชื่อมคลังเอกสาร NAS ไม่ได้"','copy.feedback.documentsUnavailable'],['"กำลังค้นหาเอกสารใน NAS…"','copy.feedback.documentLoading'],['>เอกสารอาคารจาก NAS<','>{copy.feedback.documentTitle}<']],
  'src/components/deposit-editor.tsx': [['>การเปลี่ยนสถานะถูกตรวจสิทธิ์ บันทึกประวัติ และตรวจเลขเวอร์ชันที่เซิร์ฟเวอร์<','>บันทึกการเปลี่ยนแปลงและประวัติให้คุณทุกครั้ง<']],
  'src/lib/work-read-model.ts': [['"ยังไม่ได้เชื่อมต่อฐานข้อมูลงาน"','copy.feedback.unavailable']],
  'src/features/buildings/map/longdo-map-canvas.tsx': [['>ยังไม่ได้ตั้งค่า Longdo Map API key<','>{copy.feedback.mapUnavailable}<'],['>รายการและข้อมูลอาคารยังใช้งานได้ตามปกติ<','>{copy.feedback.mapFallback}<'],['>ตรวจเครือข่ายหรือการตั้งค่า key แล้วลองอีกครั้ง<','>{copy.feedback.mapRetry}<']],
};
for (const [file, pairs] of Object.entries(replacements)) {
  let text=fs.readFileSync(file,'utf8'); for (const [before,after] of pairs) { if (!text.includes(before)) throw new Error(`Missing expected copy in ${file}`); text=text.replaceAll(before,after); }
  if (text.includes('copy.feedback.')) { const index=text.startsWith('"use client";')? text.indexOf('\n')+1:0; text=text.slice(0,index)+'\nimport { copy } from "@/lib/copy";\n'+text.slice(index); }
  fs.writeFileSync(file,text);
}
const admin='src/components/admin-workspace.tsx';
let text=fs.readFileSync(admin,'utf8');
for (const [before,after] of [['บัญชีผู้ใช้และ Effective Access','บัญชีผู้ใช้และสิทธิ์ที่จะได้รับ'],['ตำแหน่ง ทีม และ Data Scope','ตำแหน่ง ทีม และขอบเขตข้อมูล'],['Effective Access Preview','ตัวอย่างสิทธิ์ที่จะได้รับ'],['Data Scope','ขอบเขตข้อมูล'],['Users & Access Review','ผู้ใช้และทบทวนสิทธิ์'],['Effective Access แสดงสิทธิ์จริงจากบทบาทและ data scope ก่อนบันทึก','ตรวจสิทธิ์ที่จะได้รับจากบทบาทและขอบเขตข้อมูลก่อนบันทึก'],['ระบบกลาง / Access Control Plane','จัดการสิทธิ์และบัญชี'],['>Users<','>ผู้ใช้<'],['>Positions<','>ตำแหน่ง<'],['>Teams<','>ทีม<'],['>Roles & Permissions<','>บทบาทและสิทธิ์<'],['>Audit<','>ประวัติ<']]) text=text.replaceAll(before,after);
fs.writeFileSync(admin,text);
