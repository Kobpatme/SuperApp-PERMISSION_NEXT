# ฐานทดสอบและสิทธิ์ runtime ของระบบจองรถ

โมดูลเฟส 1 ยัง development/disabled ไม่เปิดให้ผู้ใช้ทำรายการ ไม่มีการ apply ลง production

## แยกฐานทดสอบ

`npm run test:car:schema` ใช้ `CAR_BOOKING_TEST_DATABASE_URL` ที่ตั้งใน environment หรืออ่าน DATABASE_URL เพื่อใช้ host/operator ของ local เท่านั้น สคริปต์บังคับ host เป็น localhost/127.0.0.1/::1 และเปลี่ยน database เป็น `permission_next_car_booking_test` เสมอ หากกำหนด CAR_BOOKING_TEST_DATABASE_URL เองต้องระบุชื่อฐานนี้ตรงกัน ไม่พิมพ์ URL/credential

สคริปต์สร้างฐานใหม่ถ้ายังไม่มี ใช้ schema_migrations รัน migration ตามลำดับและ transaction รายไฟล์ รันซ้ำต้อง applied=0 ไม่มีการลบ/รีเซ็ตฐานเดิม Fixture เป็น UUID ใหม่และข้อมูลสมมติในฐานแยกเท่านั้น ไม่ใช้ข้อมูลพนักงานจริง

การทดสอบสลับ current role เป็น `car_booking_test_runtime` ที่ไม่มี superuser/BYPASSRLS และไม่ใช่เจ้าของตาราง ตรวจ FORCE RLS ด้วย pg_class ไม่ถือว่าทดสอบ RLS จาก superuser SELECT โดยตรง ตรวจ membership ว่า runtime ไม่ได้เป็นสมาชิก calendar reader ทั้งนี้ operator connection ของ test ยังมีสิทธิ์ setup fixture ไม่ใช่รูปแบบ connection ของเว็บ

## Portable PostgreSQL บน Windows

หากไม่มี PostgreSQL local ใช้ binary archive จาก [EDB](https://www.enterprisedb.com/download-postgresql-binaries) ภายใน `.data/car-booking-postgres/` (ignored) ไม่ติดตั้ง service หรือปรับ PATH แล้วเรียก:

```powershell
./scripts/car-booking-portable-test.ps1
```

สคริปต์สร้าง cluster ของ fixture ภายใน .data, random password เก็บ local ignored, เปิดเฉพาะ 127.0.0.1:55439 ด้วย SCRAM, ปฏิเสธ port ที่มีผู้ใช้อยู่, รัน migrations สองรอบและ tests แล้ว stop cluster ใน finally ไม่เปลี่ยน .env.local cluster/credentials ห้ามนำไปใช้เป็น production infrastructure

## Provisioning runtime (ต้องทำในฐานที่เจ้าของอนุมัติก่อนเปิดใช้จริง)

migration `0024_car_booking.sql` เพิ่มตารางและสอง capabilities โดยไม่เพิ่ม role_permissions/user assignments ขององค์กร ยกเว้น car-booking จาก trigger แจกสิทธิ์ platform_admin เดิม โดยคงพฤติกรรม permission อื่น ต้องใช้ migration operator ที่สร้าง role/โอนเจ้าของ function ได้ แยกจาก runtime role

- Runtime DB role ห้าม superuser/BYPASSRLS และห้ามเป็นสมาชิก `car_booking_calendar_reader`
- ให้ USAGE public schema; SELECT/INSERT/UPDATE บน cars/bookings, SELECT/INSERT บน logs; SELECT บน osp_report; EXECUTE บน car_booking_has_access(text,uuid) และ car_booking_calendar(timestamptz,timestamptz) โดย DBA ระบุ role จริงอย่างชัดเจน ไม่มี GRANT TO PUBLIC ใน migration
- ทุกคำขอใช้ server session ที่ตรวจแล้วและ `set_config('app.user_id', verifiedUserId, true)` ภายใน transaction ก่อน query; connection pool ห้ามใช้ session-wide SET เนื่องจากอาจรั่วตัวตนระหว่างคำขอ จะต่อเข้ากับ services ในเฟส 2
- `car_booking_calendar_reader` เป็น NOLOGIN/NOINHERIT/NOBYPASSRLS มี SELECT เพียง cars/bookings ไม่มี logs/เขียนข้อมูล มี policies เฉพาะ projection; function ตรวจ grant+active+mustChangePassword ก่อน SELECT และคืนเพียง car_id/license_plate/start_time/end_time ภายในช่วงไม่เกิน 93 วัน ห้ามเพิ่ม raw owner/destination/GPS fields
- Tables ใช้ FORCE RLS และไม่มี delete policy; log ไม่มี update policy เจ้าของการจองหรือ admin อ่านได้; use แม้ถูกกำหนด ALL ผิดพลาดก็ไม่อ่านข้ามเจ้าของ; admin ต้องเป็น ALL
- OSP view เป็น security_invoker และ admin-only numeric projection; 19-column display/export และ dashboard ยังเป็นงานเฟส 4

การมี SQL policy ไม่เท่ากับการรับรอง deployment: ต้องตรวจ runtime grants, verified-context binding, endpoints และ concurrent revocation จริงก่อนเปิดโมดูล

## กฎที่เจ้าของยืนยัน 08/10/2569

ชื่อ “ระบบจองรถ”, icon รถ, `/car-booking`; ปิดใช้งานรถแทนลบ; calendar ผู้ใช้ทั่วไปเห็นเพียงทะเบียน/ช่วงไม่ว่าง; late return ไม่ขยาย reservation range เกิน end_time แต่แสดง actual return จริง; early return ปล่อยช่วงด้วย LEAST(end_time,actual_return_time); interval เป็น [) ทั้งรถและคน cancelled ไม่ล็อกช่วง

เจ้าของตอบเพิ่มเติม: อนุญาตจองย้อนหลังตามต้นทาง; แอดมินแก้รายการชั้นจอดได้ (ตาราง cars/bookings จึงเก็บข้อความ ไม่ hard-code enum; จะทำ configuration/UI ในเฟส 3); เลขไมล์เริ่มต้น 0 เป็นค่าจริงสำหรับคำนวณระยะทาง ไม่ย้ายบั๊กช่องว่างของ source OSP ตามมา

## Rollback

ก่อน activation ใช้ revert code/catalog commits โดยคง SQL/data fixture ไว้ ไม่มี down migration ที่ลบประวัติจริง หาก apply ลง environment ที่เจ้าของอนุมัติในอนาคต ให้ปิดโมดูลและ forward-fix; ห้าม drop ตาราง/role หรือปิด constraints เพื่อให้ข้อมูลเก่าที่ชนกันผ่านโดยไม่อนุมัติ
