# เฟส 0 — สำรวจและวางโมดูลจองรถ

วันที่: 08/10/2569 (Asia/Bangkok)
สถานะ: สำรวจเพื่อเสนอแนวทางแล้ว รอคำตอบและไฟเขียวก่อนเฟส 1 ยังไม่ได้สร้างโมดูลหรือย้ายข้อมูล

## ขอบเขตและหลักฐาน

งานนี้ใช้ `CODEX-CAR-BOOKING-MODULE.md` ที่ผู้ใช้สั่งให้อ่านและดำเนินการอย่างเคร่งครัด ไม่ได้ขยายขอบเขตเป็นการทำ Master Plan ทุกโมดูล เอกสารงาน §0.4, §3 และ §10 กำหนดให้จบเฟสแล้วหยุดรายงานและรอไฟเขียว จึงใช้ checkpoint นี้สำหรับงานจองรถ แม้ Master Plan จะอนุญาตให้เดินต่อผ่าน safe phases ของแผนทั่วไป

- Target HEAD เริ่มต้น: `c22bd86890b8ac4bc4f03b29ea8f210b7ed45d5d`; branch เดิม `main`; working tree เริ่มต้นสะอาด
- Branch งาน: `codex/car-booking-phase-0`
- เอกสารงาน: `C:/Users/kobpat_m/Downloads/CODEX-CAR-BOOKING-MODULE.md`
- SHA256 เอกสาร: `275A5666E8AD6CC1809A275EFA29E36603CDE8330B31D6044895B61A448FE3B0`
- ผู้ใช้ระบุไฟล์ต้นทางระหว่างสำรวจ: `D:/WebApp/จองรถ/New Vertion/Code.gs` และ `Index.html` ใช้ชุดนี้เท่านั้น ไม่เลือกชุด `D:/WebApp/จองรถ/` แทนเอง
- Code.gs SHA256: `B22674C71B0905C8A9623880D0D02F28F3DB473FE9F9489E73A3C8CDBB618156`
- Index.html SHA256: `A705578D72F9D33CD3A31162A65260957B451993710A5FF610854D6BADF6FECA`
- ต้นทางเป็นไฟล์ที่ผู้ใช้ให้ ไม่มี source commit SHA ที่ยืนยันได้ ใช้ hash ของไฟล์สำหรับตรึงหลักฐาน
- เก็บสำเนาไฟล์ต้นทางไว้ `docs/legacy-car-booking/` และสำเนาเอกสารงานไว้ `docs/plans/car-booking-module-spec.md` โดยตรวจ hash ตรงต้นฉบับ ไม่มีการรัน Apps Script
- อ่าน AGENTS, Master Plan, README, Architecture Baseline, ADR, architecture/module/quality docs, parity gates, open questions และ product docs ตามข้อกำหนดก่อนเขียนเอกสารนี้ ข้อมูลในเอกสารเก่าที่ขัดกับโค้ดไม่ถือเป็นสถานะปัจจุบัน

## ผลสำรวจ 7 หัวข้อ

| หัวข้อ | สิ่งที่ตรวจพบ | จุดที่ต้องทำสำหรับจองรถ |
|---|---|---|
| โมดูล/เมนู | `src/lib/module-registry.ts` มี work/buildings/guarantees; manifest ตรวจด้วย Zod ใน `module-contract.ts`; shell/nav และ admin ใช้ catalog ร่วมกัน | เพิ่ม manifest โมดูลที่ 4 และ capability สองระดับหลังอนุมัติชื่อ/เส้นทาง; icon enum ยังไม่มี car ต้องเพิ่มใน contract กับ WorkspaceIcon |
| RBAC/Admin | `roles`, `permissions`, `role_permissions`, `user_role_assignments`, `data_scope_grants`, `user_teams`; `/admin?section=roles` เป็น matrix; `/admin?section=users` แก้ assignment/scope; server `requireAdmin`, `isAuthorized`, `getAccessContext` | รายบุคคลต้องเพิ่ม/ถอน assignment ของโมดูลโดยรักษา role/ทีมเดิมไว้; `updateUserAction` ปัจจุบันปิด assignment เดิมทั้งหมดเมื่อเปลี่ยน access จึงใช้ตรง ๆ ไม่ได้ |
| Migration | ล่าสุด `0023_kpi_admin.sql`; `scripts/migrate-postgres.mjs` ใช้ schema_migrations และ transaction รายไฟล์; directory ชื่อ supabase เป็นชื่อเก่า SQL ใช้ PostgreSQL โดยตรง | เสนอ `0024_car_booking.sql` หากเลขยังว่างเมื่อเริ่มเฟส 1; ตรวจเลขใหม่ทุกครั้ง |
| API/actions/error/date | Next.js 16.3.6; `request-context.ts` มี requireApiIdentity สำหรับ 401/forced-password 403; `access.ts` โหลด RBAC ต่อ request; `runMaterialChange` เขียน state/audit/activity/outbox ใน transaction; work-sla/workspace-view ใช้ Bangkok | server services + Zod + ownership ตรวจซ้ำทุกคำสั่ง; errors เป็นภาษาไทยไม่เผย SQL; formatter dd/mm/พ.ศ. HH:mm ต้องระบุ Asia/Bangkok; อ่าน local Next docs ก่อนแก้ routing/caching/actions |
| UI | PageHeader, StatusBadge, EmptyState, ErrorState, skeleton, feedback และ native dialog มีแล้ว; tables/forms อยู่ใน styles/ui.css; ไม่พบ shared calendar component จาก inventory | ใช้ Core Shell/tokens น้ำเงินตาม ADR-0004; mobile-first; calendar ต้องออกแบบ range query/keyboard/reduced-motion และไม่ขนข้อมูลทุกคนทั้งหมดลง client |
| Hosting/region | README + ADR-0003 + on-premise runbook ระบุ Node/PostgreSQL ภายในองค์กร ไม่มีหลักฐานเครื่อง production หรือ region ปัจจุบัน | ให้เจ้าของยืนยัน deployment/location; ไม่สรุปว่าใช้ Vercel/Supabase/สิงคโปร์จากเอกสาร historical และไม่เปลี่ยน infrastructure |
| Employee mapping | `profiles.employeeCode` → `employee_code` มี unique index และแก้ผ่าน Admin ได้ | normalize `'`/ศูนย์นำหน้าทั้งสองด้าน; uniqueness หลัง normalize ต้องตรวจใหม่; zero-only/ว่าง/ซ้ำ/หาไม่พบเป็น unresolved ห้ามจับคู่ชื่อหรือสร้าง user เอง |

## จุดที่ต้องตรวจเพิ่มก่อนเฟส 1 ผ่าน

1. RLS: migration 0002 มี `current_platform_user_id()` อ่าน `app.user_id` และ `has_scoped_permission`; search ใน src/scripts ไม่พบการตั้ง `app.user_id`/`set_config` ใน application ปัจจุบัน ยังไม่ได้ตรวจ runtime DB role หรือพิสูจน์ RLS บนฐานจริง ห้ามอ้างว่ามี policy แล้วปลอดภัย ต้องผูก verified identity ใน transaction-local context และทดสอบด้วย role ที่ไม่ใช่ owner/superuser/BYPASSRLS พร้อม deny cross-user ทุกตาราง
2. Session: `updateRoleAction` และ `updateUserAction` ล้าง sessions เมื่อปรับสิทธิ์ ขัดกับเอกสารจองรถ §6.2 ที่ต้องใช้ได้ทันทีโดยไม่ล็อกอินใหม่ เสนอเส้นทางจัดการ grant เฉพาะโมดูลที่ audit ใน transaction และอ่านใหม่ทุก request โดยไม่แก้พฤติกรรม role/suspension/password reset ของโมดูลอื่น ต้องทดสอบ revoke กับคำขอพร้อมกันภายใน transaction ด้วย
3. Default deny: ไม่เพิ่มสิทธิ์จองรถให้ role/ผู้ใช้ใดอัตโนมัติ รวม platform_admin; ผู้มี core admin capability จัดการ grant ได้ แต่ใช้ข้อมูลจองรถต้องได้รับ grant โมดูลก่อน ตามข้อกำหนดเฉพาะ §6.7; backfill ต้องรอเจ้าของตรวจรายชื่อ
4. Test DB: tooling เดิม `scripts/ux-test-db.mjs` ตรวจ loopback และแยกชื่อ `permission_next_ux_test`; สำหรับโมดูลใหม่เสนอฐานแยก `permission_next_car_booking_test` พร้อม guard ชื่อ/host, connection least privilege และ synthetic fixtures ไม่รัน migrate-postgres ที่โหลด .env.local โดยไม่ override/ตรวจ target
5. ยังไม่พบ CSV 5 ชีตใน repo/Downloads หรือชื่อมาตรฐานใต้ D:/WebApp ที่ค้น ต้องรับ export สำหรับเฟส 5; เฟส 1–4 ทดสอบด้วย fixture สมมติได้หลังอนุมัติ

## แนวทางวางโมดูล (ข้อเสนอ ยังไม่ใช่การตัดสินใจเจ้าของ)

- ชื่อ “ระบบจองรถ”, icon รถ, module ID `car-booking`, href `/car-booking`, group operations/order 40
- รหัสตาม contract `module.resource.action`: `car_booking.module.use` (OWN) และ `car_booking.module.admin` (ALL/administrative); admin ต้องเข้าและจัดการโมดูลได้ด้วยสิทธิ์ admin เพียงระดับเดียว ไม่บังคับผู้ดูแลติ๊ก use เพิ่ม
- ตาราง `car_booking_cars`, `car_booking_bookings`, `car_booking_logs` + `car_booking_osp_report`; UUID + legacy IDs, numeric/Decimal สำหรับน้ำมัน/เงิน, timestamptz, snapshot ชื่อผู้จอง, indexes ตามเอกสาร
- แยก domain/service/read/report, actions ใต้ route ของโมดูล, API เฉพาะ export/calendar/GPS ที่ต้องมี response contract; ทุก read ตรวจ session/capability/row scope ฝั่ง server
- การจองมี exclusion constraints ทั้ง car_id และ user_id เฉพาะ status ไม่ cancelled, range `[)`; คืนเร็วปล่อยช่วงว่าง; กรณีคืนช้าต้องตกลง effective range ก่อนเขียน SQL ไม่ขยาย range จนทำให้คืนรถไม่สำเร็จ
- ล็อกรถก่อน booking ด้วยลำดับคงที่ทุก command; double return/cancel-vs-return/log-vs-return และ batch overlap ต้องมี integration tests; state/audit/activity/outbox อยู่ transaction เดียว
- รายงาน OSP และ dashboard ใช้ aggregate เดียวกันรวม log fuel + return fuel; ไม่โหลด GPS ให้ผู้ใช้ทั่วไปใน calendar; หากเลือก Sheets งาน sync อยู่ outbox/worker เท่านั้น ไม่ผูกความสำเร็จการคืนรถกับ external write
- ตัวกรองรายการ/calendar ตามช่วงวันที่; admin cursor pagination; benchmark 5,000 bookings/10,000 logs รายงานเวลา/query plans จริงในเฟสที่มี implementation

## คำถามที่ต้องให้เจ้าของตอบ

| ID | คำถาม/ข้อเสนอที่ต้องยืนยัน | เฟสที่ขึ้นกับคำตอบ |
|---|---|---|
| CB-01 | ใช้ชื่อ “ระบบจองรถ”, icon รถ และ `/car-booking` หรือระบุชื่อ/เส้นทางอื่น? | 1/3 |
| CB-02 | ใช้ employee_code จับคู่กับรหัสเก่าได้หรือไม่ และเมื่อ normalize แล้วซ้ำจะให้ใช้ตารางจับคู่ที่เจ้าของตรวจหรือไม่? | 5 |
| CB-03 | ปฏิทินให้ผู้ได้รับ use เห็นชื่อผู้จอง/ปลายทางเหมือนเดิม หรือเห็นเพียงทะเบียนกับช่วงไม่ว่าง? | 1/3 |
| CB-04 | OSP เลือก A ส่ง Sheets เดิม + ดาวน์โหลด หรือ B ดาวน์โหลดในระบบ; ถ้า A ใครสร้าง service account/ตั้ง secrets? | 4 |
| CB-05 | ยืนยันปิดใช้งานรถด้วย is_active=false เพื่อคงประวัติ หรือมีข้อกำหนดอื่น? | 1/3 |
| CB-06 | ชั้นจอดใช้รายการ 2A–8B คงที่ หรือให้ admin แก้ได้? | 1/3 |
| CB-07 | อนุญาตจองย้อนหลังเหมือนต้นทางหรือไม่? | 2/3 |
| CB-08 | ให้เจ้าของเลือก admin โมดูลจากรายชื่อเดิมเอง หรือเสนอ backfill ทั้งหมดแล้วตรวจรายชื่อก่อนใช้? ไม่มีการให้สิทธิ์จริงก่อนอนุมัติ | 5 |
| CB-09 | ข้อมูลเก่าซ้อนเวลาจะให้เจ้าของแก้ข้อมูลหรือจัดเป็น rejected/unresolved โดยคง constraint? ไม่เสนอปิด constraint โดยอัตโนมัติ | 5 |
| CB-10 | Hosting/App/DB ปัจจุบันอยู่ที่ใด และมีฐานทดสอบที่แยกจาก production ใดที่อนุญาต? ไม่ต้องส่ง credential ในแชต | 1/9/performance |
| CB-11 | ต้นทางตรวจ conflict ด้วย actual_return_time แต่ข้อเสนอ constraint ในเอกสารใช้ LEAST(end_time,actual_return_time): ยืนยันล็อกถึงเวลานัดหมายเมื่อคืนช้า เพื่อให้บันทึกคืนสำเร็จและ calendar แสดงคืนจริงแยกกันหรือไม่? | 1/2 |
| CB-12 | ต้นทาง OSP ให้ระยะทางว่างเมื่อ start_mileage=0 แต่เอกสาร §7.2 ให้เว้นเฉพาะค่าขาด: ให้ถือ 0 เป็นเลขไมล์ที่ใช้คำนวณได้ใช่หรือไม่? | 4/5 |

ไฟล์ source ได้รับแล้ว ไม่ต้องส่ง Code.gs/Index.html ซ้ำ; CSV ยังจำเป็นก่อน import จริง

## หลักฐานคุณภาพใหม่

Logs อยู่ `docs/quality/car-booking-phase-0/` จาก target HEAD ข้างต้นก่อนเพิ่มเอกสารเฟสนี้

| คำสั่ง | ผล |
|---|---|
| npm run lint | exit 0 |
| npm run typecheck | exit 0 |
| npm test | exit 0; 50 files ผ่าน/2 skipped; 204 tests ผ่าน/12 skipped |
| npm run test:documents | exit 0; 1 ผ่าน |
| npm run build | exit 0; Next.js 16.3.6 |
| npm audit --omit=dev | exit 0; ไม่พบช่องโหว่ |

Skipped tests ไม่ถือว่าผ่าน RLS/concurrency ของโมดูลใหม่ ยังไม่ได้ run migration, benchmark หรือ browser flow จองรถ เพราะยังไม่มี implementation

การตรวจ diff: เอกสารที่เขียนใหม่ตรวจ whitespace แยกจาก source/logs; full `git diff --check` ของ archive และ raw logs แจ้ง trailing whitespace/blank EOF ที่มีอยู่ในต้นฉบับหรือ output คำสั่ง เก็บไว้เป็นหลักฐานโดยไม่จัดรูปแบบหรือเปลี่ยน source จึงไม่อ้างว่า full diff whitespace gate ผ่าน

## JEV และข้อจำกัด

- อ่าน `.jev/config.json` และ skill jev-orchestrator รวม privacy/confidence policy; metadata_only, allow_source_code=false, log_raw_state=false
- health: local/network OK; ไม่ส่ง secrets, source bodies หรือข้อมูลผู้ใช้
- evidence_check: supported 0.52, needs_more_evidence 0.88, policy do_not_rely_on_claim จึงไม่ใช้ผลนี้อ้างว่าพร้อม implementation; คงคำถาม/source discrepancies/RLS/hosting ที่ยังไม่ได้ยืนยัน
- JEV เป็น advisory ไม่สามารถสำรวจ filesystem, รัน build/lint/test หรือพิสูจน์ migration/RLS/ยอดนำเข้าให้แทน deterministic tools ได้ ข้อความ “JEV ตรวจ” ในงานจึงใช้ร่วมกับหลักฐานคำสั่งจริง ไม่ใช้แทนกัน

## ผลกระทบ ความเสี่ยง และ rollback

เปลี่ยนเฉพาะเอกสาร/หลักฐานบน branch งาน ไม่มี mutation ข้อมูลธุรกิจ สิทธิ์จริง หรือ production; ไม่มี deploy/cutover/external Sheet write ไม่มีการลบ legacy

Rollback เฟส 0: revert เฉพาะ documentation commit ของ branch; ไม่ต้อง rollback database ผลทดสอบฐานทั่วไปไม่เท่ากับการรับรองโมดูลจองรถ

ก่อนเฟส 1: ขอไฟเขียวจากเจ้าของตามเอกสารงาน §3/§10 พร้อมคำตอบ policy ที่เกี่ยวกับ schema/RLS; ไม่ควรเริ่ม SQL จากคำตอบที่ยังเดาอยู่
