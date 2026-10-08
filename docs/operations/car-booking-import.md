# นำเข้าข้อมูลจองรถเดิม

เครื่องมือเฟส 5 ใช้สำหรับ operator แบบ offline บน Node.js 24 และ PowerShell 7 ทดสอบกับฐาน `permission_next_car_booking_test` เท่านั้น ยังไม่เปิดทาง apply ฐานหลักหรือระบบภายนอก ต้องได้รับ CSV จริงและตรวจผลก่อนวางแผน cutover

## ไฟล์และการจับคู่

เตรียม CSV UTF-8 ในโฟลเดอร์เดียว ชื่อ `Employees.csv`, `Cars.csv`, `Bookings.csv`, `BookingLogs.csv`, `BookingsOSP.csv` ตาม headers ในต้นทาง รองรับ BOM, quoted comma, เครื่องหมายคำพูด และ multiline cells ไฟล์ละไม่เกิน 50 MiB; CSV ที่โครงสร้างเสียจนแยกแถวไม่ได้จะหยุดทั้งงาน

Employees อ่านเฉพาะ id/name/role ไม่มีการนำเข้ารหัสผ่านหรือสร้างผู้ใช้ใหม่ ตัดช่องว่าง เครื่องหมาย `'` และศูนย์นำหน้า แล้วเทียบ employee_code ของ Core รายการหาไม่พบหรือกำกวมอยู่ใน rejected report จนมี crosswalk ที่เจ้าของตรวจแล้ว เช่น `mapping.json`:

```json
{
  "00101": "11111111-1111-4111-a111-111111111111"
}
```

key เป็นรหัสเดิมหลังตัดช่องว่าง/เครื่องหมาย `'` แต่ยังเก็บศูนย์นำหน้า value ต้องเป็น UUID ผู้ใช้ Core ที่มีอยู่ ห้ามจับคู่ด้วยชื่อหรือสร้างบัญชีทดแทน

เวลา ISO ที่ระบุ offset ใช้ instant ตามนั้น; เวลา ISO ที่ไม่มี offset และ `dd/mm/yyyy HH:mm[:ss]` ใช้ Asia/Bangkok ปี ≥2400 แปลง พ.ศ. เป็น ค.ศ. วันที่ผิดปฏิทินและรูปแบบกำกวมถูกปฏิเสธ เลขไมล์ 0 ใช้คำนวณได้ numeric/Decimal รักษาทศนิยมโดยไม่ผ่าน floating point

## Dry-run และการตรวจรายงาน

ตั้ง `CAR_BOOKING_IMPORT_DATABASE_URL` ผ่าน environment อย่างชัดเจน ไม่มี fallback ไป DATABASE_URL/.env.local การอ่านและนำเข้าใช้ operator ที่มี BYPASSRLS/superuser เพราะต้อง restore logs ของ booking ที่ completed แต่ยังตรวจ actor ซึ่งเป็น Core user active มี credential พร้อมใช้งานและ car admin ทั้ง dry-run/apply สิทธิ์ของ application runtime ยังคง non-owner/NOBYPASSRLS

```powershell
npm run import:car -- --input "D:/exports/car-booking" --actor "CORE-USER-UUID" --output ".data/car-booking-import/review"
```

เพิ่ม `--mapping "D:/exports/mapping.json"` เมื่อมี crosswalk ที่ตรวจแล้ว รายงานอยู่ใน output:

- `report.json`: source hash, approval digest, counts, monthly distance/liters/amount, ข้อเสนอสิทธิ์ และ OSP comparison
- `rejected-rows.json`: ชีต/บรรทัด/legacy ID/เหตุผลของทุกแถวที่ไม่รับเข้า
- `osp-regenerated.csv`: 19 คอลัมน์ที่สร้างใหม่จาก accepted completed bookings

ไฟล์เหล่านี้เป็นข้อมูลสำหรับผู้ดูแลและอาจมีชื่อ/ปลายทาง/GPS เก็บใน `.data` ที่ Git ignore แล้ว ผลบนหน้าจอมีเฉพาะจำนวน/hash/path ไม่มีแถวข้อมูลหรือ credential

Cars/Bookings/Logs รักษา legacy_id และสร้าง UUID แบบ deterministic รันซ้ำเหมือนเดิมเป็น unchanged หากข้อมูลเดิมใน target ต่างจาก source จะรายงาน `EXISTING_RECORD_DIFFERS` ไม่เขียนทับ รถที่ไม่มีใน Cars CSV ทำให้ booking เป็น orphan รายการซ้อนทั้งรถหรือผู้ใช้ถูกข้ามทั้งหมดในกลุ่มที่ชนกัน ไม่เลือกแถวผู้ชนะเอง และคง exclusion constraints ไว้ ช่วง `[)` ใช้ LEAST(เวลานัดคืน, เวลาคืนจริง); ยกเลิกไม่กั้นช่วง

BookingsOSP ใช้เปรียบเทียบเท่านั้น ไม่มีการ insert ชีตนี้ รายงานลำดับ/SAP ถูกแยกจาก regenerated calculations; แถวซ้ำ/unmatched และ column differences อยู่ใน report รวมบั๊กเก่า zero mileage/fuel blank รายการ `REVIEW_DIFFERENCE` ยังต้องตรวจ ไม่ถือว่าตรงกันแล้ว SAP จริงรักษาผ่าน adapter เฟส 4 ก่อนเชื่อม Sheets จริง

## Apply เฉพาะ fixture

```powershell
npm run import:car -- --input "D:/exports/car-booking" --actor "CORE-USER-UUID" --output ".data/car-booking-import/applied" --apply --approve "SHA256-FROM-DRY-RUN"
```

apply ต้องใช้ loopback และฐานชื่อ `permission_next_car_booking_test` สคริปต์ตรวจชื่อฐานจริงอีกครั้งก่อนเขียน digest ผูก source files, actor, crosswalk, accepted rows, rejected rows และ access review หากข้อมูลเปลี่ยนต้อง dry-run ใหม่ apply ใช้ SERIALIZABLE + advisory lock; insert และ audit/activity/outbox อยู่ transaction เดียวกัน ความขัดแย้งหรือยอดไม่ตรงยกเลิกทั้ง transaction

reconciliation ตรวจ accepted counts, ระยะทาง/น้ำมันตามเดือน Bangkok และ overlaps รวม fuel logs ทั้งหมดในฐานของ accepted bookings ด้วย ไม่จำกัดเฉพาะ legacy IDs หากมีข้อมูลเพิ่มใน target จนยอดต่างจะ abort การนำเข้า ไม่ลบข้อมูลเพื่อให้ยอดตรง เมื่อ commit สำเร็จแต่เขียนไฟล์รายงานไม่สำเร็จ ให้แก้ output แล้ว dry-run/rerun; legacy IDs ป้องกันการสร้างข้อมูลซ้ำ

## ข้อเสนอสิทธิ์ที่เจ้าของตรวจแล้ว

ค่าเริ่มต้นไม่ให้สิทธิ์ตาม role เดิมอัตโนมัติ `accessProposals` เสนอ admin เมื่อ role เดิมเป็น admin (ไม่สนตัวพิมพ์) มิฉะนั้น use เจ้าของเลือกได้เฉพาะรายการที่ตรวจแล้ว เช่น `access-review.json`:

```json
{
  "sourceHash": "SOURCE-HASH-FROM-REPORT",
  "reviewed": true,
  "grants": [{ "user_id": "CORE-USER-UUID", "level": "use" }]
}
```

เพิ่ม `--access-review "D:/exports/access-review.json"` ทั้ง dry-run และ apply เพื่อให้ digest รวมรายชื่อเดียวกัน actor ต้องมี core.user.manage เพิ่มเติม รายการใช้ไม่ได้/นอกข้อเสนอ/ยกระดับ admin จากข้อเสนอ use ถูกปฏิเสธ การเพิ่มสิทธิ์รักษา car access เดิมและ scopes ของโมดูลอื่น ไม่เปลี่ยน session metadata ใน audit ระบุ actor และรายชื่อที่ผ่าน review

## ทดสอบและ rollback

```powershell
npm run test:car:import:unit
./scripts/car-booking-portable-test.ps1 -ClusterName unique-new-fixture -ImportTests -ServiceTests
node scripts/car-booking-import-benchmark.mjs
```

ใช้ชื่อ cluster ใหม่สำหรับ integration เพราะ fixtures มีการสร้างผู้ใช้และข้อมูล ผลทดสอบแยกจากฐานหลักพอร์ต 5432; fixture ใช้ 55439 และหยุดใน finally คู่มือนี้ไม่ใช่คำสั่ง migrate ฐานหลัก หากนำเข้าผิดใน fixture ให้ใช้ cluster ใหม่/restore snapshot แทนลบประวัติ append-only ในฐานธุรกิจ ก่อน cutover จริงต้องมี backup, CSV ที่ตรวจแล้ว, crosswalk/สิทธิ์ที่อนุมัติ, reconciliation จริงและ business UAT
