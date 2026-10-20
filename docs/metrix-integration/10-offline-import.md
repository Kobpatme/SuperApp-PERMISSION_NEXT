# เครื่องมือนำเข้าแบบ offline dry run

เจ้าของยืนยัน DQ07: ยังไม่ย้ายข้อมูลจริง เตรียมเครื่องมือและ fixture เท่านั้น เครื่องมือนี้ไม่อ่าน `.env` ไม่เชื่อมฐานข้อมูล/เครือข่าย และไม่มี apply mode

```powershell
node scripts/duct-rental-import-fixture.mjs
node scripts/duct-rental-import-dry-run.mjs --source tests/fixtures/metrix-import/source.json --crosswalk tests/fixtures/metrix-import/crosswalk.json --file-root tests/fixtures/metrix-golden --out .data/duct-import-report.json
node --test scripts/duct-rental-import.test.mjs
npm test -- src/modules/duct-rental/tests/import-planner.test.ts
```

Source envelope ระบุ frozen commit และ requests/request_files/annual_renewals/annual_renewal_routes/cancellations Crosswalk ต้องให้ actor→Core UUID, service center→Core team UUID, reviewed status aliases และ file manifest relativePath/size/checksum/MIME อย่างชัดเจน

Planner ใช้ deterministic UUIDv5/source IDs, รักษา design/install/rates/guarantee/snapshots/phase/status/notes/timestamps รวม uploaded_at และสรุป counts/Decimal totals/missing files/quarantine ค่าเดือนและปีแยกกัน ประวัติ signoff มีสถานะและ mapped actors ที่ตรวจทานได้ แต่ไม่สร้าง live task/permission จากข้อมูลเก่า ไม่คัด password/session/roles/public URLs เป็น runtime authorization

File root ต้องอยู่ภายใน directory ที่ระบุจริง: ปฏิเสธ traversal/symlink escape, ตรวจ hash/bytes/MIME/PDF page/PNG-JPEG dimensions/KML DTD; ไม่แตก archive/CAD ไม่ fetch legacy URL สัญญารายปีใช้ manifest key `annual:<source-year-id>:contract` และ private year parent

Fixture ที่ผ่าน: requests 2, rates 2, documents 1, annual renewal 1/routes 2, cancellation 1; monthly 199.00, yearly 0.30, guarantee 2.02, annual keep 0.30; issues/warnings/writes = 0 CLI tests ตรวจ positive/integrity mismatch/media mismatch/root escape/unsupported apply

`readyForReviewedMigration` ยืนยันโครงสร้างแผนเท่านั้น ไม่ยืนยันว่ามี UUID จริงใน Core, สิทธิ์ production, template rights, สถานะธุรกิจที่เจ้าของรับรอง หรือ UAT ต้องตรวจ crosswalk/reconciliation โดยเจ้าของก่อนอนุญาตสร้าง importer ที่ apply และต้องมี backup/restore rehearsal แยก ไม่มีการย้ายไฟล์จริงหรือ sign assets จาก browser ในงานนี้
