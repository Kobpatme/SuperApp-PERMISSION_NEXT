# ระบบจองรถ — ติดตั้งและเปิด UAT บนฐานหลัก local

วันที่ 08/10/2569; baseline `ee54378`; branch `codex/car-booking-uat-activation`

เจ้าของอนุญาตให้เริ่มปฏิบัติและจัดการจนจบเฟส รวมสิทธิ์เข้าถึงที่จำเป็นเฉพาะเฟสนี้ จึงติดตั้งบน PostgreSQL Windows ฐาน `permission_superapp_dev` ที่เครื่องนี้ ไม่ถือเป็นอนุญาตตัดสลับ legacy หรือย้าย CSV ซึ่งเจ้าของเลื่อนไว้แล้ว

## ผลส่งมอบ

- สำรองฐานด้วย pg_dump custom format ภายใต้ repeatable-read exported snapshot และซ้อม pg_restore บนฐานสำเนาใหม่ ตรวจ fingerprint ทั้ง53ตารางตรงกันก่อนติดตั้ง ใช้ PostgreSQL17 บนเครื่องเดิม เก็บ dump/config/operator state ใน `.data/car-booking-uat/` ที่ ignored ใช้ ACL ของพื้นที่งานเดิม ตรวจอ่าน state/เชื่อม runtime แล้วโดยไม่เปลี่ยนรหัสผ่าน ไม่มี backup/config/secret ใน Git
- ซ้อม migrations/role grants/การให้สิทธิ์ผู้ดูแลบน clone ก่อน apply ฐานหลัก ติดตั้งเฉพาะ `0024`–`0027` ใน transaction เดียว ไม่มี migration ใหม่ ไม่ apply `0019`–`0023` ของโมดูลอื่นในเฟสนี้
- แยก `CAR_BOOKING_DATABASE_URL` ออกจาก Core `DATABASE_URL` โมดูลรถทั้งหมด รวม access editor/report/OSP ใช้ pool ใหม่ที่เป็น LOGIN/NOINHERIT/NOSUPERUSER/NOCREATEDB/NOCREATEROLE/NOREPLICATION/NOBYPASSRLS ไม่เป็นเจ้าของตารางหรือสมาชิก helper roles ให้สิทธิ์ตาม [runtime grants](../../scripts/car-booking-runtime-grants.sql) ห้าม DELETE domain หรือ UPDATE logs
- เว็บ fail closed หากไม่มี car URL นอก test environment ไม่ fallback ไปบัญชี Core ผู้ดูแล ชุดทดสอบ service ล้าง car URL และ browser ตั้ง URL จาก guarded fixture เพื่อไม่ใช้ฐานหลักที่อยู่ใน `.env.local`
- ให้ use/admin แก่ platform admin เดิมที่ active และเปลี่ยนรหัสผ่านแล้วเพียง1บัญชี ผ่าน `car_booking_set_user_access` พร้อม audit/activity/outbox ใน transaction เดียว ไม่เพิ่มสิทธิ์ให้ผู้ใช้อื่นอัตโนมัติ ไม่ reset password ไม่ล้าง session เดิม ตรวจ fingerprints ของ profiles/credentials/ข้อมูลธุรกิจเดิมคงเดิม
- ตั้งค่า car pool เฉพาะเครื่องและเปิด intake สำหรับ local UAT เปิดเว็บหลักที่3000 และ PostgreSQL5432 บัญชีผู้ดูแลเดิมเข้า [ระบบจองรถ](http://localhost:3000/car-booking) และ [จัดสิทธิ์](http://localhost:3000/admin/car-booking) ได้ ตารางรถ/การจองยังไม่มีข้อมูลจริง เพราะยังไม่ย้าย CSV

## หลักฐาน

Fresh baseline lint/typecheck/unit230ผ่าน28skipped/documents1/buildผ่านบน Next16.3.8 รอบสุดท้าย lint/typecheck/build/documents ผ่าน; unit233ผ่าน28skipped (57filesผ่าน/3skipped); schema10/services16/preflight6 และ Chromium8ผ่านหลังแยก pool

Main read-only preflight ใช้ connection ของ runtime จริงรายงาน `readyForUat=true`, `readyForCutover=false` ดู [main-readiness](../quality/car-booking-uat/main-readiness.json) ไม่ใช้ role ที่เว็บไม่ได้ใช้แทนเพื่อให้ผลผ่าน

Main service smoke ใช้ login จำกัดสิทธิ์จริง ทดสอบเพิ่มรถ → จองย้อนหลังไมล์เริ่ม0 → logน้ำมัน10/400 → คืนช้า30/1200 → OSPระยะ20km/40ลิตร/1600บาท → จองต่อที่ขอบเดิม → ยกเลิก → ตรวจสถานะรถและ queue โดย rollback ธุรกรรมทั้งหมด รวม audit/activity/outbox/OSP job ตรวจไม่มีรถ/การจองทดสอบคงอยู่ ดู [main-service](../quality/car-booking-uat/main-service.json) ไม่มีการผ่อน RLS หรือให้ SELECT audit เพิ่มเพื่ออำนวยความสะดวกให้ test

Main browser/API smoke ตรวจ7 endpoints200, anonymous401, invalid origin403, หน้าจัดการรถ/ชั้นจอด/รายงาน/dashboard/access editor และมือถือหน้าไม่ล้น pageerror0 ใช้ session ของผู้ดูแลที่ operator สร้างสำหรับตรวจ local ตามการอนุญาต อายุ10นาที ไม่ใช่การพิสูจน์ password login; audit การสร้างและเพิกถอน แล้วตรวจไม่มี sessionนั้นเหลือ บัญชี/รหัสผ่าน/sessionของผู้ใช้เดิมคงเดิม ดู [main-browser](../quality/car-booking-uat/main-browser.json)

คำสั่งตรวจซ้ำเฉพาะ local environment ที่เจ้าของอนุญาต:

```powershell
$env:CAR_BOOKING_LOCAL_UAT_TEST='1'
node node_modules/vitest/vitest.mjs run --config vitest.car-booking-local-uat.config.mts
node scripts/car-booking-local-smoke.mjs --allow-local-main
```

สองคำสั่งนี้ไม่อยู่ใน npm test ปกติ ต้องมี `.data/car-booking-uat/state.json` ของ installation นี้และ `.env.local` ไม่ใช้ fixture state กับฐานจริงอื่น ตัว service smoke rollback test data; browser smoke เขียนเพียง temporary auth session และ audit แล้ว revoke ไม่สร้างรถ/การจอง/log คงอยู่ Screenshots หน้าจัดสิทธิ์/ข้อมูลผู้ใช้เก็บเฉพาะเครื่อง; ภาพหลักที่ส่งมอบไม่มีข้อมูลธุรกรรม

## ขอบเขตที่ยังไม่เกิดขึ้น

งานติดตั้ง/automated verification สำหรับ local UAT เสร็จ การลงนาม UAT ของพนักงานจริงยังต้องให้ผู้ใช้ลองเอง ไม่ถือ browser smoke เป็น human sign-off ยังไม่มี CSV import, legacy freeze/cutover, remote hosting/deploy หรือ Google Sheets writes เครื่องนี้ไม่มี Google service-account credentials จึงตรวจเชื่อมจริงและ scheduler ภายนอกไม่ได้ คง worker/Sheets ปิดและรายงาน `readyForCutover=false` ตามจริง

ระหว่าง restart เว็บพบ PostgreSQLเดิมหยุดกับ terminal จึงเปิดกลับแบบ hidden และตรวจ runtime ใหม่; build กับ dev manifest ต้องตรวจทีละขั้นแล้ว restart หลัง build ไม่ถือ 404 ระหว่างนั้นเป็นผลผ่าน Main browser รอบสุดท้ายรอ workspace hydration/โหลดข้อมูลก่อนกด controls แล้วผ่านจริง

รอบส่งมอบพบ generated `.next/dev/types/routes.d.ts` มี declarationซ้ำ เก็บ dev cacheเดิมไว้ใน `.data/car-booking-uat/dev-cache-before-types` แล้วให้ Nextสร้างใหม่โดยไม่แก้ source generatedด้วยมือ จากนั้น typecheck/documents/main browserผ่านจริง ไฟล์ next-env.d.tsใน commitเป็น dev type pathsที่ Nextสร้าง ชุด SQL/service/browserรอบสุดท้ายใช้ clusterใหม่เพื่อไม่รวมข้อมูล fixtureจากรอบก่อน

พบข้อจำกัด Core/Work ที่มีอยู่ก่อนเฟสนี้: main migration ledger ถึง0018แต่ read model ยังขาด `tasks.sla_rule_version_id` และตาราง system links ไม่ใช่ regression ของรถ และไม่ได้แก้ schema/ข้อมูลโมดูลอื่นในเฟสนี้ หน้า/APIรถที่ตรวจผ่านไม่ใช่การรับรองทั้ง Super App พร้อม production

Jev health local/networkผ่าน; risk score.91/confidence.48/review advisory.81 และ final evidence supported.68/needs_more_evidence.90/gather_more_evidence เป็นคำแนะนำ ไม่ใช่สิทธิ์ทำงานหรือ proof ใช้การอนุญาตเจ้าของและ backup/clone/SQL/browser เป็นหลัก คง human UAT/Google/CSV/cutover claims ไว้ตามหลักฐานที่ยังไม่มี ไม่ส่งข้อมูลผู้ใช้ credentials หรือ source bodies ให้ Jev

## ถอยกลับ

หากพัก UAT ให้ตั้ง `CAR_BOOKING_ACCEPT_NEW_BOOKINGS=false` แล้ว restart เว็บ คืน/log/cancelยังทำได้ คง schema/historyไว้ ห้าม drop ตารางหรือ restore dumpเก่าทับข้อมูลใหม่ backupก่อนactivationเป็น recovery checkpoint ไม่ใช่ใบอนุญาต overwrite ข้อมูล หากถอย code ให้ตรวจ schema compatibility และคง car URL/grantsที่จำเป็นก่อนเปิดเว็บ

ขั้นต่อไปคือผู้ใช้ทำ UAT ตาม [checklist](../operations/car-booking-cutover.md) แล้วเตรียม Google credentials/การทดสอบสำเนา Sheets เมื่อพร้อม หลังระบบผ่านจึงกำหนดวันย้าย CSVครั้งเดียวและตัดสลับตามคำสั่งเจ้าของ
