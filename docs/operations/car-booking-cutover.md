# UAT และตัดสลับระบบจองรถ

เจ้าของสั่งวันที่ 08/10/2569 ให้เลื่อน CSV จริงไปย้ายครั้งเดียวหลังระบบเสร็จ งานเตรียม/ทดสอบเฟส 6 ใช้ fixture เท่านั้น เอกสารนี้เป็นขั้นตอนสำหรับวันที่เจ้าของกำหนด ไม่ใช่หลักฐานว่า UAT โดยผู้ใช้จริงหรือ cutover เกิดขึ้นแล้ว

## ทดสอบกับผู้ใช้จริงกลุ่มเล็ก

เลือกตัวแทนพนักงานและผู้ดูแลตามที่เจ้าของกำหนด ใช้ environment ทดสอบที่ติดตั้ง migrations ครบและบัญชี Core ที่อนุมัติ ห้ามเอา fixture credentials ไปใช้จริง บันทึก release SHA, environment, ผู้ทดสอบ, วันที่, ผลและรายการแก้ไขก่อนลงนาม

| กรณี | ขั้นตอน/ผลที่ผู้ใช้ตรวจ | ผล/ผู้ตรวจ |
|---|---|---|
| จองปกติ | เลือกเวลา/รถ/ปลายทาง ข้อมูลคงอยู่เมื่อโหลดใหม่ | □ |
| จองซ้อน | สองคนจองคันเดียวกันพร้อมกัน; สำเร็จคนเดียว การจองจบตรงเวลาเริ่มถัดไปไม่ชน | □ |
| คนเดียวหลายรถ | ช่วงซ้อนถูกปฏิเสธทั้ง UI และ API | □ |
| คืนรถ | ไมล์ต้องมากกว่าไมล์เริ่ม/ล่าสุด ที่จอดและไมล์รถอัปเดต คืนซ้ำไม่สำเร็จอีกครั้ง | □ |
| คืนเร็ว/ช้า | คืนเร็วปล่อยช่วงว่าง คืนช้าบันทึกสำเร็จ; calendar แสดงคืนจริงและ reservation ไม่ยืดเกินเวลานัด | □ |
| ยกเลิก | ยืนยันก่อนยกเลิก; ปลดช่วงที่จองและไม่อยู่ใน OSP | □ |
| บันทึก/GPS | ไม่อนุญาต GPS ก็ยังบันทึกได้; staff ไม่อ่าน GPS คนอื่น แอดมินดูได้ | □ |
| น้ำมัน | log10ลิตร400บาท + คืน30ลิตร1200บาท = OSP40ลิตร1600บาท และ dashboard ตรงกัน | □ |
| รายงาน | 19คอลัมน์ วันไทย/พ.ศ. ไมล์0ใช้คำนวณได้ ดาวน์โหลด CSV เปิดในเครื่องมือที่เจ้าหน้าที่ใช้ได้ | □ |
| สิทธิ์ | ให้/ถอน use/admin ผ่านหน้าจัดสิทธิ์ มีผลกับ session เดิม; สิทธิ์โมดูลอื่นคงเดิม | □ |
| Calendar privacy | staff เห็นเพียงทะเบียน/ช่วงไม่ว่าง ไม่มีชื่อ ปลายทาง GPS คนอื่น | □ |
| มือถือ/คีย์บอร์ด | จอง/คืน/รายงาน Light/Dark; Escape คืน focus; หน้าไม่ล้นแนวนอน (ตารางเลื่อนภายในได้) | □ |
| พักรับจอง | ปิด intake แล้วจองใหม่ไม่ได้ แม้เรียก API; คืน/ยกเลิก/log ของรายการเดิมได้ | □ |
| Sheets สำเนา | บัญชีบริการ/backup/SAP/manual rows/ส่งซ้ำ/retry และ scheduler ผ่านจริง | □ |

ข้อบกพร่องที่กระทบข้อมูล สิทธิ์ ยอดรายงาน หรือการจองซ้อนต้องแก้และทดสอบก่อนตัดสลับ การทดสอบอัตโนมัติเป็นหลักฐานประกอบ ไม่แทนการลงนามของผู้ใช้จริง

## ตรวจความพร้อมแบบ read-only

ตั้ง `CAR_BOOKING_READINESS_DATABASE_URL` ของ environment ที่ตรวจอย่างชัดเจน ไม่มี fallback ไปฐานหลัก เครื่องมือไม่ migrate/grant/seed และไม่เรียก Google:

```powershell
npm run check:car:readiness -- --runtime-role "APP_RUNTIME_ROLE" --actor "CORE-CAR-ADMIN-UUID" --output ".data/car-booking/readiness.json"
npm run check:car:readiness -- --mode release --runtime-role "APP_RUNTIME_ROLE" --actor "CORE-CAR-ADMIN-UUID" --review ".data/car-booking/release-review.json" --output ".data/car-booking/release-readiness.json"
```

ตรวจครบ6ตาราง/FORCE RLS/4 car migrations, car+user exclusion, invoker OSP view, role/grants/functions ไม่มี PUBLIC EXECUTE/helper membership, ไม่ใช่ superuser/BYPASSRLS/table owner และไม่มี DELETE หรือ UPDATE logs นอกสิทธิ์ที่ต้องใช้ runtime role สำหรับตรวจควรตรงกับ connection ของเว็บ (หรือ role ที่เว็บ SET LOCAL ROLE จริง) ไม่เลือก role ที่ปลอดภัยแต่เว็บไม่ได้ใช้เพื่อให้ผลผ่าน

`readyForUat` ครอบคลุมฐานโมดูล/build/actor; `readyForCutover` เพิ่มการตั้งค่า Sheets/worker และรายการที่เจ้าของรับรองใน release review:

```json
{
  "humanUatApproved": false,
  "latestMigrationReconciled": false,
  "backupRestoreVerified": false,
  "hostingRegionVerified": false,
  "legacyFreezeApproved": false,
  "sheetsIntegrationVerified": false,
  "schedulerVerified": false
}
```

เปลี่ยนเป็น true เฉพาะข้อที่ผู้รับผิดชอบตรวจจริงและเก็บหลักฐานไว้ readiness tool ไม่ลงนามแทนคน และรายงาน externalConnection เป็น owner_attested/not_verified; externalRequestsMade=0 เสมอ ตั้งค่า secret ตาม [คู่มือ OSP](car-booking-osp.md) ไม่ส่ง key/password ผ่าน chat

## พักรับการจองใหม่

ตั้ง server environment `CAR_BOOKING_ACCEPT_NEW_BOOKINGS=false` แล้ว restart/redeploy instance ตามวิธีของ environment นั้น รอ request เดิมจบและตรวจ `GET /api/car-booking/settings` ส่ง acceptNewBookings=false; UI แสดงข้อความพักรับจองและปิดปุ่ม API/service ปฏิเสธการจองใหม่ด้วย503 BOOKING_PAUSED โดยยังคืนรถ/ยกเลิก/log/อ่านรายการได้

ตั้ง true หรือเอาค่า false ออกแล้ว restart เพื่อเปิดรับอีกครั้ง flag ไม่เปลี่ยนข้อมูลเดิมหรือสิทธิ์ผู้ใช้ ควรบันทึกผู้เปลี่ยน เวลาและ deployment revision ในบันทึกปฏิบัติการ การเปลี่ยน flag บน instance เดียวไม่ครอบคลุม instance อื่น ต้องตรวจทุก instance ก่อน freeze

## เช็กลิสต์วันตัดสลับ — นำเข้าจริงครั้งเดียว

1. เจ้าของกำหนดเวลา ผู้รับผิดชอบ backup/DB/legacy/Sheets และช่องทางแจ้งผล เลือก hosting/DB ใกล้ไทยจาก latency จริง ผ่าน UAT และ readiness ของ runtime ที่ใช้งานจริง
2. สำรอง Apps Script/5ชีตและฐาน target ก่อนแตะข้อมูล ทดสอบ restore บน clone เก็บ backup ในพื้นที่ที่อนุมัติแยกจาก Git รวม roles/config/credential references ตามวิธี DBA และเก็บรายการสิทธิ์ก่อนเปลี่ยน
3. ติดตั้ง migrations/runtime privileges ที่เจ้าของอนุมัติใน target และตรวจ preflight ขณะ new intake=false ไม่มีการให้ car grants แก่ผู้ใช้ทั้งองค์กรอัตโนมัติ
4. ผู้ดูแล legacy ปิดรับจองใหม่ ตรวจว่าไม่มีช่องทางเก่าสร้างรายการได้ วางช่วง freeze ของการคืน/log สำหรับ final snapshot ด้วย หรือยืนยัน snapshot/catch-up ที่ไม่ตกหล่น ห้ามให้สองระบบรับจองพร้อมกัน เก็บรายการที่เกิดระหว่าง maintenance ให้ผู้รับผิดชอบ reconcile
5. ส่งออก 5CSV ล่าสุดหลัง freeze เพียงครั้งสุดท้าย เก็บ timestamp/hash ทำ crosswalk และตรวจ rejected rows/overlaps/สิทธิ์ ตาม [คู่มือนำเข้า](car-booking-import.md) ไม่ปิด constraints เพื่อรับแถวผิด
6. ซ้อม source ชุดเดียวกันกับ target clone ใช้ Core UUID เดียวกัน ตรวจ counts/monthly fuel-distance/OSP differences/booking conflicts/SAP และ preview รายชื่อ grants แก้รายการที่ไม่ได้รับเข้าโดยเจ้าของก่อนลงฐานจริง
7. ทำ dry-run บน target จริง ตรวจ sourceHash/approval digest และ rejected report อีกครั้ง operator ต้องมีสิทธิ์ restore และ actor ต้องเป็น active car admin (+Core user.manage เมื่อให้สิทธิ์)
8. เจ้าของอนุมัติ target-review สำหรับ dataset/ฐานนั้น แล้ว operator เรียก apply ที่มี --approve และ --target-review ตรวจรายงานหลัง commit รวมยอดจากทุก DB log รันซ้ำได้เฉพาะ source เดิมที่ผ่าน review หาก source/target เปลี่ยนให้ dry-run/reconcile ใหม่ ห้ามเขียนทับข้อมูลใหม่เพื่อให้ import ผ่าน
9. เปิดสิทธิ์ตามรายชื่อที่ตรวจแล้ว ทำ smoke test จอง/คืน/รายงาน/รีโหลด/ถอนสิทธิ์ เปิด Sheets worker/scheduler ตามที่ทดสอบจริง และตรวจ backup/SAP/คิว retry ไม่มี raw secrets ใน logs
10. เปิด new intake=true หลัง smoke/reconciliation ผ่าน แจ้งผู้ใช้ใช้ระบบใหม่ เก็บ Apps Script เดิมแบบสำรอง/อ่านอย่างน้อย2สัปดาห์ ห้ามเปิดรับจองเก่าควบคู่กันและห้ามลบทิ้งระหว่างช่วงนี้

target-review เตรียมไว้ให้ operator ในวันที่อนุมัติจริง ค่าเริ่มต้นของ importer ยัง apply ได้เฉพาะ loopback fixture; ขยายไปฐานที่ระบุได้เมื่อ review ครบและ target host/port/database ตรงกัน พร้อม source hash/digest ตรงกับ dry-run:

```json
{
  "version": 1,
  "approved": false,
  "target": { "hostname": "EXACT-HOST", "port": 5432, "database": "EXACT-DATABASE" },
  "sourceHash": "SOURCE-HASH-FROM-DRY-RUN",
  "approval": "APPROVAL-FROM-DRY-RUN",
  "backupRestoreVerified": false,
  "humanUatApproved": false,
  "legacyFreezeApproved": false,
  "latestCloneRehearsalPassed": false
}
```

```powershell
npm run import:car -- --input "FINAL-CSV-DIRECTORY" --actor "CORE-CAR-ADMIN-UUID" --mapping "REVIEWED-MAPPING.json" --access-review "REVIEWED-ACCESS.json" --apply --approve "DRY-RUN-APPROVAL" --target-review "APPROVED-TARGET.json" --output ".data/car-booking/final-import"
```

คำสั่งนี้เป็นขั้นตอนอนาคต ไม่ได้รันกับฐานหลักในงานเฟส6 ไม่มีการอนุมัติ target จากค่าใน repo/fixture template

## แผนถอยกลับ

ก่อนเปิดรับใหม่: หาก dry-run/import/restore/smoke/SAP ไม่ผ่าน ให้คง intake=false และหยุด scheduler เก็บ report/error code แก้ปัญหาหรือให้เจ้าของยกเลิก cutover การ apply ที่ล้มเหลว rollback ทั้ง transaction ตรวจข้อมูลจริงก่อนเปิด legacy อีกครั้ง

หลังเปิดรับใหม่: พัก new bookings ด้วย flag ก่อน แต่ให้จัดการรถที่ออกไปแล้วได้ เก็บ snapshot/backup ของสถานะปัจจุบันและ ledger รายการตั้งแต่ cutover: booking IDs, owner crosswalk, car/mileage/floor, cancellations, returns, logs/GPS/fuel, grants และ audit/outbox โดยผู้มีสิทธิ์ สำรองทั้งฐานเพราะ OSP CSV มีเฉพาะ completed จึงไม่พอสำหรับ active/cancelled bookings

เจ้าของตรวจว่าจะ forward-fix ในระบบใหม่ หรือกลับ legacy หากกลับ legacy ต้องกำหนด freeze สุดท้ายและ reconcile รายการใหม่ทุกแถวกับ schema/employee IDs/กฎช่วงเวลาของ legacy ก่อนเปิดรับอีกครั้ง โดยเฉพาะ late-return semantics ที่ต่างจากต้นทาง ห้าม restore backup เก่าทับธุรกรรมใหม่ ห้าม drop audit/history หรือปิด constraints ห้ามให้ทั้งสองระบบเขียนพร้อมกัน

การย้อน code/config ให้ pin release ก่อนหน้าและทดสอบ schema compatibility; additive schema/data เก็บไว้ ใช้ backup ที่ตรวจแล้วเมื่อเจ้าของอนุมัติ recovery จริง และตรวจ checksum/counts/ยอดรายเดือน/สิทธิ์/รายการค้างหลัง restore บันทึกผู้รับผิดชอบ เวลา dataset hashes และผล smoke ทุกขั้น

## ทบทวนหลังตัดสลับ

ช่วงสำรองอย่างน้อย2สัปดาห์ ติดตาม failed commands/conflicts/latency/OSP queue และเทียบยอดรายวันจากข้อมูลจริง กำหนดผู้รับผิดชอบตรวจผลตามแผนขององค์กร เอกสารนี้ไม่ได้สร้าง scheduler หรือ automation แจ้งเตือนจริง ปิดการสำรอง legacy ได้เมื่อเจ้าของลงนามว่าข้อมูลครบและมี recovery ที่ใช้งานได้
