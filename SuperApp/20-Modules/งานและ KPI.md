---
type: module
module: work
status: needs-current-code-verification
---
# งานและ KPI
[[00 - SuperApp Home|หน้าเริ่มต้น]] · [[30-Planning/แผนงานและรายการตรวจสอบ|แผนงาน]]

## แนวคิดเดิม
[[20-Modules/Originals/โมดูล KPI|โน้ตทดลองต้นฉบับ]] ระบุ: “จัดเก็บงานของทุกคน”

## ขอบเขตตาม audit เดิม
- My/Team Work, การสร้างและมอบหมายงาน, การรับงาน
- สถานะงาน, hold/cancel/complete, บันทึกความคืบหน้า
- Job Tracker และ audit timeline
- KPI หลัก/ย่อย, weights, SLA, วันหยุดและการคำนวณ deadline
- มุมมองตามบทบาทและขอบเขตข้อมูล

## สิ่งที่เอกสารระบุ ณ 29 กันยายน 2026
Audit ให้ความสำคัญกับการตรวจและเติม operational workspace ของ Work/KPI ก่อน เพราะพบช่องว่าง UI/workflow มากใน baseline ตอนนั้น ยังไม่ได้ตรวจว่าปัจจุบันแก้แล้วเท่าใด

## งานตรวจรอบถัดไป
- [ ] ยืนยัน repository/branch/commit ปัจจุบัน
- [ ] เทียบ source feature ทีละรายการ: KEEP / PORT / ADAPT / REPLACE / RETIRE
- [ ] ตรวจ role/capability/data scope และการใช้งานจริง
- [ ] ตรวจ tests สำหรับ acceptance, hold, holidays, SLA และ weighted KPI
- [ ] บันทึกหลักฐานและผลทดสอบก่อนสรุป parity

## คำถามค้าง
- KPI ใช้เกณฑ์ใดในรอบพัฒนาปัจจุบัน?
- Workflow ใดที่เจ้าของระบบต้องใช้ก่อนเป็นอันดับแรก?

อ้างอิง: [[PERMISSION_NEXT/PERMISSION_NEXT_FRESH_SOURCE_PARITY_AUDIT]] ส่วน 1, SP-2 และ Golden-master tests
