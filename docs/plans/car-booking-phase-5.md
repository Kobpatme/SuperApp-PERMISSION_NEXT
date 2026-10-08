# ระบบจองรถ — เฟส 5: ตัวนำเข้า CSV

วันที่ 08/10/2569; branch `codex/car-booking-phase-5`; baseline `75c24af` โค้ด importer `932931f` และชุดทดสอบ `2564bcf` สถานะ: implementation และ synthetic verification พร้อม แต่ยังไม่ปิดการย้ายข้อมูลจริง เนื่องจากยังไม่ได้รับตำแหน่ง CSV ทั้ง 5 ชีต

## ขอบเขตและคำตอบเจ้าของ

เจ้าของอนุมัติให้เริ่มเฟสถัดไป ยืนยัน normalize employee_code โดยตัด `'`/ศูนย์นำหน้า รายการกำกวม/หาไม่พบต้องใช้ตารางจับคู่ที่เจ้าของตรวจแล้ว ยืนยันข้ามการจองซ้อนพร้อมรายงานและคง constraints รวมถึงเสนอสิทธิ์จาก role เดิมให้ตรวจรายชื่อก่อนใช้ คำถามตำแหน่ง CSV ยังไม่มีคำตอบ ไม่สร้างข้อมูลจริงแทนไฟล์ที่ยังไม่ได้รับ

อ่าน master/spec, frozen Code.gs/Index.html และ parity inventory ใหม่ ใช้ offline operator script แทนเพิ่มหน้า upload ข้อมูลธุรกิจ เมนู/UI/API และ runtime RLS ไม่เปลี่ยน

## สิ่งที่เพิ่ม

- CSV parser UTF-8/BOM/RFC4180, strict dates/Bangkok/Thai BE, exact Decimal และข้อผิดพลาดรายแถว แยก ambiguity/orphan/duplicate/invalid fuel/GPS/return/overlap
- การจับคู่เฉพาะ Core profiles ที่มีอยู่ ไม่มี password migration, new identity หรือ name fallback; reviewed override อยู่ใน approval digest
- legacy IDs/UUID deterministic, identical rerun เป็น unchanged; source ที่ต่างจาก target ไม่ overwrite ทั้งสองด้านของ source overlap ถูกข้าม ไม่เลือกลำดับนำเข้ามาเป็นกฎธุรกิจ
- dry-run เป็นค่าเริ่มต้น connection ต้องระบุผ่าน CAR_BOOKING_IMPORT_DATABASE_URL; apply จำกัด loopback fixture และตรวจชื่อฐานใน SQL อีกชั้น ไม่มี fallback ไป .env.local/DATABASE_URL
- trusted offline restore operator ต้อง BYPASSRLS/superuser และตรวจ active car admin actor; reviewed access ต้อง Core user.manage อีกด้วย คง runtime non-owner/NOBYPASSRLS และ constraints/FORCE RLS ทั้งหมด
- SERIALIZABLE/advisory lock, inserts + reviewed grants + audit/activity/outbox ใน transaction เดียว รายชื่อ grants อยู่ใน audit metadata; รายการไม่ผ่าน review ไม่มีสิทธิ์เพิ่ม คง car grants และ non-car scopes/session เดิม
- source hash/approval digest ผูกไฟล์/actor/mapping/rejections/accepted rows/access review; stale approval ถูกปฏิเสธ รันซ้ำไม่สร้างแถวหรือ events เพิ่ม
- reconcile accepted counts และ monthly distance/fuel รวมทุก fuel log ในฐานของ accepted bookings ถ้ามี native log เพิ่มจนยอดต่างจะ rollback ไม่อ้าง source IDs อย่างเดียวเป็นยอดฐานทั้งหมด
- BookingsOSP เป็น comparison-only: สร้าง 19 columns ใหม่, รายงาน duplicates/unmatched/column differences, แยกบั๊กเลขไมล์ 0/ยอดน้ำมันว่างจากความต่างที่ต้องตรวจ SAP จริงยังรักษาผ่าน adapter เฟส 4 ไม่มี Sheets writes

คู่มือคำสั่ง รูปแบบ crosswalk/access review และ rollback: [การนำเข้า](../operations/car-booking-import.md)

## หลักฐานล่าสุด

Baseline และ final command logs อยู่ `docs/quality/car-booking-phase-5/*.log` (ignored); สรุป tracked ใน [gates.json](../quality/car-booking-phase-5/gates.json)

| ตรวจ | ผล |
|---|---|
| lint / typecheck | exit 0 |
| Vitest | 229 passed / 27 skipped; 56 files passed / 3 skipped |
| documents | 1 passed |
| build | exit 0; Next.js 16.3.8 |
| npm audit --omit=dev | 0 vulnerabilities |
| importer parser/planner | 13 passed |
| real PostgreSQL importer | 9 passed: actor/stale denial, audit rollback, exact totals, idempotency, additive review, source conflict/edit protection, CLI report/CSV และ extra database fuel reconciliation |
| existing SQL schema/services | 10 + 15 passed; runtime non-owner/non-superuser/NOBYPASSRLS |
| migrations on fresh fixture | 27 applied / rerun 0; ไม่มี migration ใหม่ |
| planner benchmark | synthetic 5,000 bookings / 10,000 logs, 3,530 ms, rejected 0, database writes 0 |
| service benchmark rerun | 5,000/10,000: report50 rows36ms/dashboard25ms/CSV5.1MB497ms |

[Planner benchmark](../quality/car-booking-phase-5/import-performance.json), [service rerun](../quality/car-booking-phase-5/service-performance.json) เป็น local synthetic measurement ไม่มี production latency claim หลักฐานเฟส 4 เดิมยังคงไว้ ไม่ทับด้วยตัวเลข rerun

เครื่องมือ fixture แก้ quoting ของ initdb password-file path ที่มีช่องว่างบน Windows ให้ใช้ Start-Process Hidden; final fresh cluster `phase5-reconciliation-final` บน PostgreSQL16.15 ผ่านและหยุดใน finally มี startup failure จากการใช้ PowerShell5 และ Windows Access denied ระหว่างเตรียม ก่อน retry ด้วย PowerShell7 และยืนยันรอบสุดท้ายแล้ว ไม่ใช้ failure เป็นผลผ่าน

ไม่มี UI changes จึงไม่ได้รัน browser suite ใหม่ในเฟสนี้ ใช้หลักฐาน browser7 ของเฟส 4 เป็นประวัติ ไม่อ้างว่า rerun แล้ว

## JEV

Skill jev-orchestrator ใช้เฉพาะ metadata; health local/network OK; risk .17/confidence .87 แนะนำ Codex ตรวจด้วย deterministic tools; route offline fixture importer .95 ไม่มี authorization จาก JEV

Final evidence_check supported .47 / needs_more_evidence .83, policy do_not_rely_on_claim จึงใช้ผลคำสั่ง/SQL เป็นข้อสรุป implementation และคง real-data/production claims ไว้รอตรวจ ไม่ถือว่า advisory รับรอง phase completion

continue confidence .38/policy fallback_to_codex (choice escalate); confidence ต่ำและ CSV ยังขาด จึงปิดเฉพาะ implementation checkpoint ด้วยหลักฐาน deterministic และรอข้อมูลจากเจ้าของ ไม่ขยายงานไป cutover หรือขอสิทธิ์ production จากคำแนะนำนี้

## สิ่งที่ยังต้องทำก่อนปิด migration จริง

ยังไม่มี Employees/Cars/Bookings/BookingLogs/BookingsOSP CSV จึงไม่มีจำนวน real accepted/rejected, real user crosswalk, รายชื่อให้สิทธิ์จริง หรือ real monthly reconciliation ต้องรับไฟล์และตรวจ dry-run/report/crosswalk/access proposals กับเจ้าของก่อน ไม่มี main migration/seed/real grants/deploy/external writes ในเฟสนี้

local app ยังคงพอร์ต3000 ใช้ PostgreSQLหลัก5432 ตามที่เจ้าของให้เปิดก่อนหน้า; ตรวจ listen แล้วเหลือเฉพาะ3000/5432 ไม่มี fixture55439 ค้าง ไม่เปลี่ยน .env.local หรือ credentials ฐานหลักที่ตรวจไว้ก่อนเฟสมี18 migrations และยังไม่มี car tables การเปิดแอปไม่ได้หมายความว่าติดตั้ง schema car module บนฐานนั้นแล้ว

Rollback implementation ผ่าน Git revert ของ commits เฟส5; ไม่มี business DB migration ให้ย้อนกลับ หากต้องถอยข้อมูลจริงในอนาคตต้องใช้ approved backup/restore plan ไม่ลบ audit/history เพื่อแก้ยอด หยุดที่งานเฟส5และข้อมูลที่ยังรอ ไม่เริ่มเฟส6/cutover อัตโนมัติ
