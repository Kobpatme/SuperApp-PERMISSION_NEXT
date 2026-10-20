# ทดสอบพาดสาย PEA / MEA ด้วยบัญชีเดิม

เปิด `http://localhost:3000/duct-rental/communication-cable` และเข้าสู่ระบบด้วยบัญชีเดิม ใช้ hostname เดิมทุกครั้ง บัญชีหนึ่งมี session ที่ active ได้ครั้งเดียว การเข้าสู่ระบบจากหน้าต่างหรือ hostname อื่นอาจแทนที่ session ก่อนหน้า

เจ้าของอนุญาตทดสอบในแอปหลัก local `permission_superapp_dev` บนพอร์ต5432 มี backup ก่อน migration0058 ใน `.data/cable-local-backup/before-cable-0058.dump` ตารางคำขอพาดสายแยกจากเช่าท่อเดิม ไม่มีการเพิ่มสิทธิ์ให้บัญชีจริงผ่าน SQL โมดูลตั้ง active/default false เพื่อเปิดผ่าน Core Admin ได้ตาม environment; local เดิมมี flag enabled อยู่แล้ว

## สิ่งที่ทดสอบได้

1. เลือกเมนูพาดสายสื่อสาร → สร้างคำขอพาดสาย → เลือก PEA/MEA และกรอกชื่อโครงการ → บันทึกร่าง
2. รีโหลดหน้า เปิดรายการเดิม และแก้ข้อมูลได้ ก่อนส่งตรวจต้องกรอกเส้นทาง จุดต้นทาง จุดปลายทาง และประเภทสาย
3. ส่งตรวจเอกสาร แล้วกรอกเลขรับเรื่องก่อนยืนยันยื่นขออนุญาต
4. ทดลองส่งกลับแก้ไขพร้อมเหตุผล กลับมาตรวจเอกสารฉบับแก้ไขก่อนยื่นใหม่
5. กรอกเลขใบอนุญาต → ยืนยันได้รับใบอนุญาต → ส่งให้ทีมออกแบบยืนยัน → ส่งติดตั้ง
6. บันทึกผลติดตั้งและตรวจรับในหมายเหตุ แล้วปิดงาน เปิดดูประวัติได้ งานปิดแล้วแก้ไขไม่ได้
7. เก็บเข้าประวัติจะนำออกจากรายการทำงานโดยรักษาข้อมูลและ audit ไว้

รอบนี้ใช้ข้อมูลทดสอบเท่านั้น เช่นชื่อขึ้นต้น “ทดสอบระบบ” ไม่มีการส่งข้อมูลให้หน่วยงานภายนอก ไม่มีแนบไฟล์/ลายเซ็น/คำนวณเงิน/กำหนด SLA/ต่อสัญญาพาดสาย เงื่อนไขข้างต้นเป็น provisional UAT gates ที่เจ้าของปรับภายหลังได้

## สิทธิ์

ใช้ catalog เดิม: `duct_rental.module.view` เพื่อเข้าและดูตาม scope; `request.create/update/archive` สำหรับสร้าง/บันทึก/เก็บประวัติ; `design.submit` สำหรับออกแบบ/แก้ไข/ยืนยันแบบ; `permission1.submit` สำหรับตรวจเอกสาร/ยื่น/ใบอนุญาต; `install.submit` สำหรับปิดงาน Scope คำขอทดลองเป็น owner-only ไม่มี team assignment จึงใช้ OWN หรือ ALL ให้ผู้ดูแลจัดสิทธิ์ผ่าน Core Admin ตามหน้าที่

## ตรวจซ้ำด้วยข้อมูลจำลอง

รันทดสอบกับฐาน loopback ชื่อ `permission_next_duct_rental_test` ซึ่ง scripts เปลี่ยน target ให้เอง ไม่ใช้ข้อมูลแอปหลัก:

```powershell
node scripts/duct-rental-catalog-test.mjs
node scripts/duct-rental-service-test.mjs
node scripts/duct-rental-browser-fixture.mjs
# ตั้ง DUCT_RENTAL_TEST_PYTHON เป็น Python3.12+ ที่ติดตั้ง หากไม่มี python ใน PATH
node scripts/duct-rental-browser-projects.mjs
node node_modules/next/dist/bin/next build .data/duct-rental-browser/current
node node_modules/@playwright/test/cli.js test --config playwright.cable-trial.config.ts
```

Browser fixture ใช้บัญชีจำลองและ constrained runtime บนพอร์ต3118 หลักฐานอยู่ `.data/cable-trial-evidence` หลังจบทดสอบ ปิดเฉพาะ module flag ของฐาน fixture ไม่มีการล็อกอินหรือแก้ session บัญชีหลัก

Rollback: ปิดโมดูลผ่าน Core Admin และย้อน source change โดยเก็บตาราง0058กับ audit ไว้เพื่อรักษาข้อมูลที่สร้างระหว่าง UAT ห้ามลบตารางที่มีคำขอหรือกู้ backup ทับฐานหลักโดยไม่ตรวจรายการเปลี่ยนแปลงหลัง backup
