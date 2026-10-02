import fs from 'node:fs/promises';
for (const [file,from,to] of [
 ['src/components/work-create-form.tsx','งานจะเริ่มต้นที่สถานะกำลังดำเนินการ และบันทึก audit/activity ให้โดยอัตโนมัติ','{copy.feedback.workCreated}'],
 ['src/features/work/screens/reports.tsx','สถานะในหน้าจอใช้คำที่อ่านเข้าใจได้ ส่วนค่าในฐานข้อมูลยังคงแยกชัดเจน','{copy.feedback.workStatusDescription}'],
 ['src/app/(platform)/work/new/page.tsx','description="เพิ่มงานของคุณในขอบเขตสิทธิ์ปัจจุบัน พร้อมบันทึก audit และ activity อัตโนมัติ"','description={copy.feedback.workCreateDescription}'],
]) {
 let s=await fs.readFile(file,'utf8'); s=s.replace(from,to);
 if(!s.includes('import { copy }')) s=s.startsWith('"use client";')?s.replace('"use client";','"use client";\nimport { copy } from "@/lib/copy";'):'import { copy } from "@/lib/copy";\n'+s;
 await fs.writeFile(file,s);
}
const admin='src/components/admin-workspace.tsx'; let s=await fs.readFile(admin,'utf8');
for(const [a,b] of Object.entries({'Module Access ·':'สิทธิ์การใช้งาน ·','capabilities':'สิทธิ์','Advanced details':'รายละเอียดเพิ่มเติม','ระบบจะตรวจ capability และ data scope ใหม่ในทุก server operation เมื่อบันทึกการเปลี่ยนแปลง':'สิทธิ์และขอบเขตข้อมูลจะมีผลเมื่อบันทึกการเปลี่ยนแปลง','System · Read only':'บทบาทมาตรฐาน · ดูได้อย่างเดียว','บันทึกบทบาทและ Permission':'บันทึกบทบาทและสิทธิ์','Scope เริ่มต้น':'ขอบเขตเริ่มต้น','ทีมเป็นขอบเขตงาน KPI และ selected-team access':'ใช้ทีมเพื่อกำหนดขอบเขตงานและติดตามผล','Roles, Permissions & Module Access':'บทบาทและสิทธิ์การใช้งาน','Capability มาจาก versioned module manifest เท่านั้น รหัสเทคนิคอยู่ใน Advanced details':'เลือกสิทธิ์ตามงานของแต่ละบทบาท ดูรหัสสิทธิ์ได้ในรายละเอียดเพิ่มเติม','Audit History':'ประวัติการเปลี่ยนแปลง','100 การเปลี่ยนแปลงล่าสุด ข้อมูล before/after ยังคงอยู่ฝั่ง server':'ดูการเปลี่ยนแปลงล่าสุดได้ที่นี่',' events':' รายการ','<th>Module</th>':'<th>ส่วนงาน</th>','<th>Action</th>':'<th>การเปลี่ยนแปลง</th>','<th>Entity</th>':'<th>รายการ</th>'})) {
 // Preserve identifiers: only replace capabilities in literal JSX text.
 if(a==='capabilities') s=s.replace(/ capabilities</g,' สิทธิ์<'); else s=s.replaceAll(a,b);
}
await fs.writeFile(admin,s);
