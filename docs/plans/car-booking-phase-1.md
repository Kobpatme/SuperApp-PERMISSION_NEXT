# เฟส 1 — Schema, catalog และ RLS ระบบจองรถ

วันที่ 08/10/2569; baseline ก่อนเริ่ม `16611dd`; branch `codex/car-booking-phase-1`

เจ้าของให้เริ่มเฟส 1 แล้ว และยืนยันระหว่างทำงาน: ชื่อ “ระบบจองรถ”/icon รถ/`/car-booking`, calendar เห็นเพียงทะเบียนและเวลาว่าง, late return ไม่ขยายช่วง reservation เกินเวลานัด, ปิดใช้งานรถแทนลบ, จองย้อนหลังได้, admin แก้รายการชั้นจอดได้, start mileage=0 ใช้คำนวณระยะทางได้

## สิ่งที่ทำ

- `0024_car_booking.sql`: 3 ตารางและ indexes, numeric checks, foreign keys แบบคงประวัติ, exclusion ทั้งรถและคนแบบ [), early-return release/late-return cap, FORCE RLS ทั้งสามตาราง, ไม่มี normal DELETE policy/การแก้ log
- ตารางจับคู่ Drizzle อยู่ schema.ts; ส่วน SQL exclusion/RLS/functions/view เป็นสัญญา migration ที่ต้องตรวจด้วย PostgreSQL จริง ไม่อ้างว่า ORM generate ครอบคลุมทุกส่วน
- เพิ่ม capability use/admin ใน registry และ Admin catalog; module ยัง development/disabled เพื่อไม่ให้เมนูนำไปหน้าที่ยังไม่มี ไม่มี grant ให้ real user/system role อัตโนมัติ
- เพิ่ม icon รถใน manifest contract และ WorkspaceIcon ใช้สี token เดิม
- Calendar function คืนเฉพาะรถ/เวลา ช่วงสูงสุด 93 วัน ใช้ NOLOGIN/NOINHERIT/NOBYPASSRLS projection owner ที่อ่านเพียง cars/bookings; runtime ไม่เป็นสมาชิก role นี้ ไม่ให้ raw bookings ของคนอื่นผ่าน RLS
- Helper RLS ตรวจ active/must-change-password และ canonical RBAC; use ที่ถูกกำหนด ALL ผิดก็ยังอ่านข้ามเจ้าของไม่ได้
- OSP view เป็น security_invoker/admin-only numeric projection รวม log fuel กับ return fuel; format/export 19 คอลัมน์และ dashboard เป็นเฟส 4
- เพิ่ม test runner ที่บังคับ loopback และฐาน `permission_next_car_booking_test`; ตั้ง CI ใช้ฐานชื่อนี้แยกจาก fixture UX
- เพิ่ม portable Windows runner ที่เปิดเฉพาะ 127.0.0.1:55439 ใช้ SCRAM/random password local ignored และหยุด cluster ใน finally; ไม่เปลี่ยน .env.local/PATH/Windows service

## ขอบเขตที่ยังไม่ได้ทำ

ยังไม่มี endpoints/services/UI ของโมดูลใหม่, transaction binding จาก verified session จะต่อในเฟส 2; การจัด grant รายบุคคลโดยไม่ revoke session ใน UI เป็นเฟส 3 ไม่อ้างว่า Admin actions เดิมเปลี่ยนพฤติกรรมแล้ว; parking config/UI เป็นเฟส 3; import/OSP exporter/SAP/Sheets/benchmark/UAT เป็นเฟสถัดไป ไม่มีข้อมูลจริงหรือ production mutation

รายละเอียด runtime privilege และ rollback: [คู่มือฐานข้อมูล](../operations/car-booking-database.md)

## หลักฐาน

Quality baseline ใน `docs/quality/car-booking-phase-1/`: lint/typecheck/unit/documents/build/audit exit 0; unit 207 ผ่าน/12 skipped (51 files ผ่าน/2 skipped), document 1 ผ่าน, Next 16.3.6, audit 0 vulnerabilities

ตอนเริ่ม local DB เดิมไม่ตอบ ECONNREFUSED จึงไม่ใช้หรือแก้ฐานเดิม ใช้ portable PostgreSQL 16.15 จาก [EDB](https://www.enterprisedb.com/download-postgresql-binaries) ภายใน .data แยก cluster/ฐาน fixture: migration 24 ไฟล์ผ่าน รันซ้ำ applied=0; integration 10 ผ่าน/0 ล้มเหลว และหยุด server แล้ว หลักฐานอยู่ `database.log` ใช้ role ที่ไม่ใช่ owner/superuser และไม่มี BYPASSRLS

รอบแรกพบ trigger เดิมแจก permission ใหม่ให้ platform_admin อัตโนมัติ จึงเพิ่มข้อยกเว้นเฉพาะ car-booking โดยคงพฤติกรรมของโมดูลอื่น แล้วทดสอบใหม่จาก cluster สะอาดโดยเก็บ fixture เดิมไว้ ผลยืนยัน system roles ไม่มี car grant อัตโนมัติ; RLS OWN/admin, grant/revoke บน transaction ถัดไปและ session เดิม, calendar redaction, concurrent exclusion, early/late return และยอดน้ำมัน 40 ลิตร/1,600 บาทผ่าน การเริ่ม portable server ใช้ process ที่แยก output เพื่อหลีกเลี่ยง Windows native pipeline ค้าง

ผลนี้ยืนยันเฉพาะฐาน/schema/catalog ในเฟส 1 ไม่ใช่ service/UI หรือ production readiness; CI เพิ่มขั้นตอนแล้วแต่ยังไม่ได้รันบน remote

## JEV

health local/network OK ใช้ metadata_only; risk request ของ additive fixture schema ไม่ได้เรียกโมเดล (jev_called=false) เพราะ deterministic hard gate ตรงคำเกี่ยวกับ role grants จึงไม่มีคะแนน risk จาก JEV ไม่ใช้ JEV อนุมัติ operation ใช้ขอบเขตฐาน local ที่เจ้าของอนุญาตและ deterministic tests; ไม่มีการเปลี่ยน production grants

evidence_check หลัง SQL tests: supported=0.66, needs_more_evidence=0.89, gather_more_evidence (advisory) จึงจำกัดข้อสรุปตาม deterministic evidence ของเฟส 1 เท่านั้น งาน service/UI/CI/UAT ยังไม่ครบและไม่อ้าง parity/deployment readiness

## ผลกระทบและ rollback

Catalog เพิ่มสองรายการแต่ไม่มีสิทธิ์ใหม่ให้ผู้ใช้เดิม โมดูลยังปิดอยู่ ตารางใหม่เป็น additive ไม่มี UPDATE/DELETE ตารางธุรกิจเดิม; revert application/catalog ได้โดยคงข้อมูลใหม่ไว้ ไม่ทำ destructive down migration ห้ามล้าง fixture/base DB เดิมเพื่อให้ test ผ่าน
