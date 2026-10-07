# เฟส 2 — บริการและ API ระบบจองรถ

วันที่ 08/10/2569; baseline `47fb236`; branch `codex/car-booking-phase-2` เจ้าของอนุญาตให้ดำเนินการเฟสถัดไปหลังรายงานเฟส 1

## สิ่งที่เปลี่ยน

- บริการจองหลายช่วงแบบ atomic ตรวจชนกันเองและคน/รถ; เจ้าของมาจาก session, mileage snapshot จากรถที่ล็อกแล้ว, จองย้อนหลังได้, รถที่ปิดใช้งานรับจองใหม่ไม่ได้
- คืนรถล็อกรถก่อนการจอง ตรวจสถานะ/เจ้าของ/ลำดับผู้ใช้ก่อนหน้า/เวลาคืน/ไมล์ล่าสุด/ช่วงไมล์เติมน้ำมัน อัปเดต booking+car พร้อมกัน คืนซ้ำสำเร็จครั้งเดียว; ไม่เติมล้างค่า fuel; late return แสดงเวลาจริงโดยไม่ขยาย reservation ส่วน early return ปล่อยช่วง
- ยกเลิกเฉพาะ booked; log เฉพาะ booked ตรวจ mileage/fuel/GPS optional; เจ้าของอ่าน log ได้ ส่วน endpoint GPS เป็น admin-only
- ทุก mutation ผ่าน Zod และ `runMaterialChange` ใน transaction เดียวกับ audit/activity/outbox หาก audit ล้มเหลว booking และ mileage รถ rollback จริง
- API ตรวจ session/forced-password/สถานะโมดูล, origin ของ mutation, input/id/date range และข้อความผิดพลาดภาษาไทย ไม่ส่ง SQL/stack; response no-store ตรวจสิทธิ์จากฐานใหม่หลัง bind `app.user_id` แบบ transaction-local แม้ request access snapshot ยังมี grant เก่า
- เพิ่มบริการดูรถ/ผู้คืนล่าสุด/รถว่าง และแก้รถ/ปิดใช้งานโดย admin; อ่าน bookings/logs แบบเรียงลำดับคงที่และ offset ครั้งละไม่เกิน 1,000 รายการเพื่อไม่ตัดข้อมูลโดยไม่มีทางอ่านหน้าถัดไป
- `0025_car_booking_services.sql` เพิ่ม narrow lock/sync/projection functions เจ้าของเป็น `car_booking_service_worker` NOLOGIN/NOINHERIT/NOSUPERUSER/NOBYPASSRLS, runtime ไม่เป็นสมาชิก; ใช้ policies เฉพาะ role นี้แทนให้ runtime อ่านการจองคนอื่นหรือแก้รถของตนโดยตรง และเพิ่ม INSERT policies เฉพาะ car material events
- แยก availability projection ที่ใช้ capped reservation จาก calendar ที่แสดง actual return เพื่อรักษาการตัดสินใจของเจ้าของ
- CI เพิ่ม `test:car:services`; portable runner รองรับ `-ServiceTests` และ cluster ชื่อใหม่ที่จำกัดให้อยู่ใต้ .data โดยไม่ล้าง fixture เดิม

## API

ทุกทางเข้าอยู่ใต้ `/api/car-booking`:

| ทางเข้า | วิธี | หน้าที่ |
|---|---|---|
| `/bookings` | GET / POST | อ่านตาม scope / จองหลายช่วง |
| `/bookings/[id]/return` | POST | คืนรถ |
| `/bookings/[id]/cancel` | POST | ยกเลิก |
| `/bookings/[id]/logs` | GET / POST | อ่าน / เพิ่มบันทึก |
| `/bookings/[id]/gps` | GET | พิกัดเฉพาะ admin |
| `/calendar` | GET | ทะเบียนและช่วงเวลา ไม่มี owner/destination/GPS |
| `/cars` | GET / POST | รถ/รถว่าง / เพิ่มรถ admin |
| `/cars/[id]` | PATCH | แก้รถหรือปิดใช้งาน admin |

GET bookings/calendar ต้องมี `start`/`end` ISO ที่มี timezone; cars ส่งช่วงดังกล่าวเมื่อต้องการรถว่าง bookings/calendar/availability ไม่เกิน 93 วัน GET bookings/logs/GPS รองรับ `offset` และคืน `page` (`limit=1000`, `nextOffset` เมื่อได้เต็มหน้า; หน้าสุดท้ายอาจเป็นหน้าว่าง) ส่วน POST booking รับ `carId`, `destination`, `intervals[{startTime,endTime}]` ไม่รับ userId/employeeName/startMileage จาก client

## หลักฐาน

Baseline ใหม่ก่อนแก้: lint/typecheck/test/documents/build ผ่าน; unit 207 ผ่าน/12 skipped (51 files ผ่าน/2 skipped)

หลังแก้: lint/typecheck/test/documents/build/audit ผ่าน; unit 215 ผ่าน/22 skipped (53 files ผ่าน/3 skipped), document 1 ผ่าน, Next 16.3.6, audit 0 ช่องโหว่ Integration 10 ที่ skipped ใน normal unit ถูกเรียกแยกบน PostgreSQL จริง ไม่ใช้ skipped เป็นหลักฐานผ่าน

PostgreSQL 16.15 isolated fixture: schema/RLS 10/10 และ service 10/10 ผ่านด้วย non-owner/non-superuser/NOBYPASSRLS role; migrations ทั้ง 25 ไฟล์ผ่านบน cluster สะอาดและรันซ้ำ applied=0 (`database-fresh.log`); `database.log` เป็นรอบบริการล่าสุด ฐานทดสอบหยุดแล้ว ไม่ใช้หรือแก้ฐานแอปเดิม

กรณีสำคัญที่ทดสอบจริง: historical booking/zero mileage, overlap/containment/boundary/cancelled, internal batch overlap และ atomic rollback, independent concurrent car/person bookings, double return, latest mileage/previous return order/fuel bounds, early/late availability/calendar, GPS optional/admin-only, cross-owner denial, revoke/forced password/inactive/no grant, rollback เมื่อ audit INSERT ไม่ได้, ปิดรถคง FK และ fuel รวม 40 ลิตร/1,600 บาท

รอบแรกพบ raw SQL ส่ง Date ให้ postgres-js โดยไม่มี column encoder จึงแก้เป็น ISO string + timestamptz รอบต่อมาพบ test อ่าน admin-only report โดยไม่ bind admin context จึงแก้ fixture ให้ใช้ runtime role และ admin context ไม่ลด report authorization

หลักฐานอยู่ `docs/quality/car-booking-phase-2/`; code/doc diff ตรวจ whitespace แยกจาก raw logs ที่เก็บตาม output เดิม

## JEV

ใช้ skill jev-orchestrator แบบ metadata_only: health local/network OK; risk deterministic hard gate ตรงคำเกี่ยวกับ permission/production จึง jev_called=false และไม่มี risk score ไม่ถือเป็นคำอนุมัติ operation ขอบเขตนี้เป็น local implementation/fixture ที่เจ้าของอนุญาตแล้ว

evidence_check: supported=0.75, needs_more_evidence=0.80, gather_more_evidence (advisory) จำกัดคำอ้างตาม deterministic service/schema tests เท่านั้น ไม่อ้าง source parity หรือ production readiness

## งานเฟสถัดไปและข้อจำกัด

โมดูลยัง development/disabled API จึง deny ตาม activation gate ใน deployment ปัจจุบัน ต้องเปิดเมื่อ UI พร้อมในเฟส 3 การทดสอบ API boundary ใช้ mocked verified access; ยังไม่ได้ทดสอบ browser/session จริงครบ workflow หรือ remote CI ไม่เรียกสิ่งนี้ UAT

ยังไม่มี UI/mobile/map/parking configuration/หน้าจัดสิทธิ์รายบุคคล; services ไม่เปลี่ยนพฤติกรรม revoke-session ของ Admin เดิม สิทธิ์ live ที่ยืนยันเป็น database evaluator บนคำขอใหม่ รายงาน OSP 19 คอลัมน์/ดาวน์โหลด/dashboard อยู่เฟส 4; import/production provisioning/activation/UAT ยังไม่ทำ

Runtime provisioning และ rollback ดู [คู่มือ](../operations/car-booking-database.md); ไม่มี production mutation/push/deploy ไม่มี destructive down migration จบเฟส 2 และรอไฟเขียวเฟส 3 ตามเอกสารโมดูล §10
