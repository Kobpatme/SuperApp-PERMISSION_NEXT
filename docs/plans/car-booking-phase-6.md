# ระบบจองรถ — เฟส 6: เตรียม UAT และตัดสลับ

วันที่ 08/10/2569; branch `codex/car-booking-phase-6`; baseline `cca23f2` สถานะ: งานพัฒนา/เครื่องมือปฏิบัติการ/automated rehearsal เสร็จใน local fixture ไม่มี human UAT sign-off หรือ cutover จริง

เจ้าของสั่งให้เลื่อนการย้าย CSV จริงไปทำครั้งเดียวหลังระบบเสร็จ และให้ทำเฟสถัดไปจนจบ คำสั่งนี้แทนเงื่อนไขรอ CSV ก่อนเริ่มงานเฟส6 ในรายงานเฟส5 จึงดำเนินการพัฒนา/ทดสอบโดยไม่ขอไฟล์ระหว่างงาน ไม่ถือเป็นคำสั่งปิด Apps Script เดิม หรือนำข้อมูล/สิทธิ์จริงลงฐานหลัก

## ส่งมอบ

- สวิตช์ `CAR_BOOKING_ACCEPT_NEW_BOOKINGS=false` พักรับจองใหม่ทั้ง API และ service ด้วย503 BOOKING_PAUSED หลังตรวจผู้ใช้/สิทธิ์ อ่าน/คืน/ยกเลิก/log ยังใช้งานได้ UI รับสถานะจาก settings และปิดปุ่มพร้อมข้อความภาษาไทย ไม่อาศัยการซ่อนปุ่มเพื่อบังคับกฎ
- โหลด monthly/active bookings, cars, calendar และ settings พร้อมกัน แทนการรอหลายรอบตามลำดับ คง pagination/date bounds และ stale-response sequence guard เดิม ใช้ Set รวม booking IDs ไม่ซ้ำ
- `check:car:readiness` ตรวจแบบ read-only: migrations,6ตาราง/FORCE RLS, exclusion ทั้งรถ/คน, invoker OSP view, runtime role/ownership/schema USAGE/table grants/helper roles/function ACL และ actor ที่ active ตรวจ release config/worker และ owner attestations แยกจากผล local
- `--target-review` สำหรับ operator วันที่อนุมัติย้ายจริง ผูก host/port/database กับ connection และ sourceHash/approval กับ dry-run รวม backup/UAT/freeze/clone-rehearsal acknowledgements ค่าเริ่มต้นยัง apply ได้เฉพาะ loopback fixture ไม่มีการเปิด target จริงจาก template อัตโนมัติ
- เพิ่ม automated journey: จอง → เติมระหว่างทาง10/400 → คืน30/1200 → admin OSP40/1600 พร้อมตรวจ dashboard เทียบยอด OSP ที่ได้จริง รวม paused UI, session/grants, GPS/privacy, downloads/keyboard/axe/mobile
- ซ้อม pg_dump/pg_restore ของข้อมูล fixture จริง ตรวจ fingerprints ของ8ตาราง รวมประวัติ/grants, RLS/constraints และการปฏิเสธ runtime ที่ไม่มี identity หลัง restore
- [เช็กลิสต์ UAT/ตัดสลับ/ถอยกลับ](../operations/car-booking-cutover.md), [นำเข้า](../operations/car-booking-import.md), [ฐาน/runtime](../operations/car-booking-database.md) และ [Sheets](../operations/car-booking-osp.md) พร้อมใช้ในวันที่เจ้าของกำหนด

Commits implementation: `8a4236d` pause/refresh, `269c644` reviewed future target, `29dc4e6` preflight/recovery, `216f7b5` journeys/measurements, `3a8cedb` preflight schema-USAGE denial verification

## ผลตรวจล่าสุด

Fresh baseline rerun บน cca23f2 ผ่าน lint/typecheck/unit229passed27skipped/documents1/buildNext16.3.8 ก่อนแก้ ไม่ใช้จำนวนจากรายงานเก่าแทนคำสั่งรอบนี้

| Gate | ผลรอบสุดท้าย |
|---|---|
| lint/typecheck/build | exit0; Next.js16.3.8 |
| Vitest | 230passed/28skipped;56filespassed/3skipped |
| documents | 1passed |
| npm audit --omit=dev | 0 vulnerabilities |
| importer parser/planner | 14passed |
| SQL schema/services/import/preflight | 10/16/10/6 passed |
| fresh migrations/rerun | 27/0; ไม่มี migration ใหม่ |
| Chromium | 8passed/40.4s; Light/Dark desktop/mobile, scoped axe0, page overflow0 |
| CSS/contrast | 241files/0violations;58pairs/0failures |
| recovery | fingerprints8ตารางตรงกัน; FORCE RLS6, exclusion2, anonymous runtimeอ่าน0แถว |

SQL services ใช้ SET LOCAL ROLE เป็น non-owner/non-superuser/NOBYPASSRLS Browser ใช้ operator connection ใน isolated fixture เพื่อ setup/login และถูกเสริมด้วย RLS service/schema tests ไม่ถือเป็น production runtime provisioning ตัว paused UI scenario จำลอง settings=false; backend pause ผ่าน API unit และ real-SQL service tests แยกกัน

Recovery บน clusterเดียวกัน restore ไปฐานใหม่ `permission_next_car_booking_restore_test` โดยไม่ลบ/แทนฐานเดิม: bookings5,061/logs10,012/cars47/audit88/activity79/outbox79/profiles80/assignments81 ทั้ง8 fingerprintsตรงกัน backup1,522ms/restore10,933ms Global database roles มีอยู่ใน fixture cluster นี้ การ restore ข้าม server จริงต้องสำรอง/provision roles/config ด้วยตาม runbook ผลนี้ไม่รับรอง backup ของฐานจริง

หลักฐาน machine-readable และ screenshots อยู่ [gates.json](../quality/car-booking-phase-6/gates.json), [performance](../quality/car-booking-phase-6/performance.json), [browser timing](../quality/car-booking-phase-6/browser-performance.json), [recovery](../quality/car-booking-phase-6/recovery.json), [fixture readiness](../quality/car-booking-phase-6/readiness-fixture.json), [main read-only readiness](../quality/car-booking-phase-6/main-readiness.json) Command logs ใน directory เดียวกัน ignored

ระหว่างเตรียมมี Windows Access denied ที่ initdb; retry fixture startup แล้วรอบที่รายงานผ่านจริง ไม่มีการถือ startup failure ว่าผ่าน Browser รอบแรกพบ expected dashboard อิงยอด fixture เดิมหลังเพิ่ม golden trip แก้ให้เทียบผลรวม OSP แล้วผ่านครบ8 ไม่ลดกฎยอดรายงานให้ผ่าน test

## ประสิทธิภาพที่วัดได้

ข้อมูลจำลอง5,000bookings/10,000logs: module read bundle289ms, report50rows24ms/dashboard14ms/fullCSV5.1MB389ms Booking command10samples p5014ms/max17ms; return10samples p5023ms/max83ms เป็น service+DB/RLS/audit timing ในเครื่องนี้

Browser ล่าสุด1sample: เปิดหน้า1,609ms จองถึงข้อมูลโหลดใหม่326ms คืน218ms; API acknowledgements173/104ms ตัวเลข browser รวม automation/actions/render/refresh การเปิดหน้ารอบนี้เกินเป้า~1วินาที จึงไม่อ้างว่าทุก cold opening ผ่านเป้า ต้องวัดกับผู้ใช้จริงและ hosting/region ใน UAT ค่า before จอง1,010ms และหลัง326ms เป็นคนละรอบ single sample ไม่ใช่ production p95 หรือการรับรองภาระ100คนพร้อมกัน ทั้งหมดวัดใน local synthetic environment

## JEV และขอบเขตที่ยังเลื่อนไว้

ใช้ skill jev-orchestrator ตาม AGENTS ด้วย metadata เท่านั้น health local/networkOK; route automated acceptance+cutover plan confidence1.0 Risk hard gate จับข้อความที่กล่าวถึง production/rollback จึงไม่ใช้เป็น authorization สำหรับงานนั้น การทดสอบ/read-only ที่เจ้าของอนุมัติยังทำต่อด้วย deterministic tools

Final evidence_check supported.56/needs_more_evidence.80, policy do_not_rely_on_claim; continue confidence.49/fallback_to_codex ไม่ใช้ผล advisory แทน SQL/browser หรือ human sign-off คงข้อมูลจริง/hosting/Sheets connection/production claims ไว้รอตรวจ

หลักฐาน main แบบ read-only รายงาน readyForUat=false/readyForCutover=false เพราะยังไม่มี car schema/runtime provisioning ครบ ไม่ใช่ข้อสรุปว่าฐานหลักใช้งานโมดูลได้แล้ว ขณะที่ fixture ที่จัด role อย่างจำกัดรายงาน readyForUat=true/readyForCutover=false ตามสถานะที่ยังไม่ได้ตรวจ human UAT/real migration/Sheets/scheduler/region

CSV จริงถูกเลื่อนตามคำสั่ง ไม่เป็น blocker ของงานพัฒนาเฟสนี้ ไม่ขอไฟล์หรือให้สิทธิ์จริงอัตโนมัติ ยังไม่มี actual small-group UAT, final real import/reconciliation, hosting/runtime activation, real Sheets writes, freeze legacy หรือ cutover ไม่มี push/deploy และไม่มี migration/data/credential change ของฐานหลัก .env.local คงเดิม

local main app3000/PostgreSQL5432 ยังทำงาน test servers3109/55439 หยุดแล้ว หลังส่งมอบเหลือขั้นเปิดใช้งานจริงตาม checklist เมื่อเจ้าของกำหนด ไม่ขยายไป phase อื่นของ Super App โดยไม่ได้รับงาน

Rollback code ผ่าน Git revert เฉพาะ commits เฟส6 โดยเก็บ additive schema/historyไว้ การพักรับจองเป็น configที่ย้อนกลับได้ แผนถอยข้อมูลจริงคง snapshot/ledgerธุรกรรมใหม่และตรวจ reconciliation ก่อนกลับ legacy ไม่ restore backupเก่าทับธุรกรรมใหม่
