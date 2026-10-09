# รายงาน checkpoint — METRIX / เช่าท่อร้อยสาย

วันที่ 10/10/2569 งานทั้งแผนยังไม่เสร็จและยังไม่เปิดใช้จริง Source `Kobpatme/METRIX@f87220bf94b765e4896388632c3dbeabb5286510` ตรงกับ remote HEAD; target ก่อนแก้ `5f32a111ebeeb3fea8918db7e702d95bc7302bdf` ไม่มี uncommitted user work ไม่แก้ source repo

## Milestones

| Milestone | ส่งมอบแล้ว | ยังขาด / สิ่งที่ขวาง |
|---|---|---|
| M0 | เอกสาร 01–06 + ADR, 07 matrix, 08 source index 102 TS/TSX/SQL files และ 09 controls 403 attributes/24 screen files; 20 RULE | รายละเอียด runtime/legacy HTML/PDF binary ที่ยังไม่ได้ตรวจระบุใน08; DQ01–05 ไม่เลือกกฎที่ขัดกันเอง; ไม่อ้าง exhaustive runtime audit |
| M1 | module-local manifest/capabilities40; existing registry/Admin catalog; guarded `/duct-rental`; permission seed0029; tests และ test DB | ยัง development/default-disabled; ยังไม่มี admin DB lifecycle toggle ใน Core ต้องกำหนด scope shared ก่อนเพิ่ม; existing UI จัด role grants ได้แต่ยังไม่ใช่ UAT ของโมดูล |
| M2 | field mapping/source constraints/target proposal ใน04 | ยังไม่สร้าง business tables/RLS/repositories; finalize signing/monetary contracts หลัง DQ01/02 ก่อน schema ลงข้อมูล |
| M3 | source pure nonfinancial rules และ validation; golden82; module89tests | ยังไม่ครบ20 RULE; state machine allowed/denied ทุกtransitionและ financeยังไม่ผ่าน |
| M4 | ใช้ Core guard/session ที่มีอยู่บนหน้า module | business services/API/mutations/audit/idempotency/concurrency ยังไม่ทำ |
| M5–6 | UI/controls inventoryและnative ADR | native business screens/complex flows/PDF/signing/export/notification ยังไม่ทำ |
| M7 | ระบุ source mapping/data decisions | ไม่มี dataset/export/import/reconciliation จริง; รอ DQ06/07 |
| M8 | full application gates และ catalog migration isolated checks | browser/e2e/visual regression/axe/load/source PDF render/security workflow/UAT ยังไม่ทำ |

## หลักฐานที่รันจริง

- Baseline ก่อนแก้: lint/typecheck/unit267ผ่าน41ข้าม/document1/buildผ่านบนNext16.3.8
- Final checkpoint: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:documents`, `npm run check:css`, `npm run check:contrast`, `npm run build` ผ่าน; unit356ผ่าน41ข้าม (69ผ่าน/4ข้ามใน73files); document1; CSS257files0violations; contrast58pairs0failures; buildรวม `/duct-rental`
- `node scripts/metrix-golden.mjs`: 63 source-function fixtures โดย AST extraction/transpile/VM/frozen clock Bangkok; ตรวจsourceSHAและhashเทียบgitblobก่อนรัน ไม่เรียกnetwork/Auth/DB
- `node scripts/metrix-validation-golden.mjs _discovery_sources/METRIX <source-dependency-checkout>`: 19 fixtures ใช้ source schemaจริงกับZod4.3.6 (targetZod3); stored JSONไม่ต้องมีsource/dependenciesเพื่อรัน `npm test`
- `npm test -- src/modules/duct-rental/tests`: 89 testsผ่าน มี finite geometry negative paths, registry/visibility/Admin catalog/SQL catalog checks
- `node scripts/duct-rental-catalog-test.mjs`: เฉพาะloopback/database `permission_next_duct_rental_test`; initial migrations0001–0029/replaycatalog/idempotency/no automatic duct role grants/existing work auto-grants preserved/transaction rollback ผ่าน ไม่มีการเปลี่ยนข้อมูลหลัก
- source original และ discovery clone `git status --short` ว่าง; shared design paths `git diff --name-only` ว่าง

41 opt-in integration testsที่ข้ามไม่ได้ถูกอ้างว่าผ่าน Test DB นี้ยืนยันเฉพาะcatalog ไม่ใช่duct business RLS/concurrency/auth/application flows หน้า Admin รับ capability ใหม่ใน unit contract แล้ว แต่การบันทึก grants ใน environment จริงต้องมี migration0029 ที่ได้รับอนุมัติติดตั้งใน environment นั้นก่อน ยังไม่ติดตั้งฐานหลักและยังไม่ทดสอบ Admin browser flow ของโมดูลนี้

## RULE → test coverage

| RULE | หลักฐาน target | ขอบเขตที่ยังไม่ครบ |
|---|---|---|
| 001 | ไม่มี | draft/accept server/negative/concurrency |
| 002 | schema.test.ts; 19 originalZod4fixtures+finiteguard | server mutation validationยังไม่ต่อ |
| 003 | source-policy.test.ts; 24 cablelookupsรวมunknown | form integrationยังไม่ต่อ |
| 004 | source-policy.test.ts; 5cases × list/helper/memo | COMPLETE serverguard/UIยังไม่ต่อ |
| 005–006 | ไม่มี | Corecapability/scope mapping และ authorizedprivatefilequeries; ไม่พอร์ตunknown-roleallow |
| 007 | source-policy.test.ts; 5 next-phasebranchcases | state machineallowed/deniedทุกtransitionยังไม่ทำ |
| 008–009 | ไม่มี | finance/signing/contractvalidationรอdecision |
| 010–011 | ไม่มี | active-route snapshot/annualyear/decimal sum |
| 012 | source-policy.test.ts; 6 ownerlabelcases | renewal state mutationsยังไม่ทำ |
| 013 | source-policy.test.ts; 5 aliasstatus+5 ownercases | cancellation workflowtransactionยังไม่ทำ |
| 014 | source-policy.test.ts; 6SLA+3datearithmetic+3datelabelcases | livequery/listยังไม่ต่อ; legacy late<24h behavior preserved |
| 015–019 | ไม่มี | assignedsigning/asset/PDF/files/notifications/refresh |
| 020 | source-policy.test.ts; 4workflowstatuscases | search/filter/counters/paginationquery/UIยังไม่ต่อ |

7 rule IDs ใน nonfinancialfixtures + RULE002validation = 8 IDs มีบางส่วนที่พิสูจน์แล้ว ไม่ใช่ 8 RULE ครบทั้งหมด อย่างน้อย3ตัวอย่างต่อoperationที่พอร์ต ไม่อ้างgoldenครบทั้งcatalog

## Shared diff / ดีไซน์เดิม

นอก `src/modules/duct-rental` เพิ่ม/แก้เฉพาะ:

| ไฟล์ | เหตุผล |
|---|---|
| src/lib/module-registry.ts | import+register manifest2บรรทัด; sourceactive4modulesยังเรียงเหมือนเดิม |
| src/app/(platform)/duct-rental/page.tsx | route ใหม่และ Coreguard; ใช้ existing PageHeader/EmptyState/AccessDenied ไม่มีCSSใหม่ |
| supabase/migrations/0029_duct_rental_catalog.sql | seedcatalog40และยกเว้นauto-grantเฉพาะduct; preservecar/othermodules |
| scripts/metrix-golden.mjs, metrix-validation-golden.mjs | reproducible frozen-sourceexpectedfixtures ไม่ทำexternal writes |
| scripts/duct-rental-catalog-test.mjs | isolatedDBguardและcatalogreplay/rollback |
| tests/fixtures/metrix-golden/*.json | source-derivedsyntheticexpectedresults ไม่มีข้อมูลจริง |
| docs/metrix-integration/*, docs/README.md, docs/implementation-status.md | contracts/evidence/handoff |

ไม่แก้tokens/globalCSS/fonts/mainlayout/sidebar/topbar/theme/sharedcomponent implementation เมนูใหม่ถูกปิดตามmanifest; registrytestยืนยันactiveorderเดิม ไม่ได้ถ่ายscreenshotก่อน/หลังlogin/dashboard/สองโมดูล จึงไม่อ้างvisualregressionผ่าน การเปลี่ยนไฟล์ `next-env.d.ts` โดยbuildถูกคืนเป็นรูปแบบเดิมหลังตรวจ ไม่รวมในcommit

## Test DB / production / rollback

0029 applyเฉพาะฐานทดสอบชื่อด้านบน ยังไม่applyฐานหลักหรือproduction ไม่grantสิทธิ์จริง ไม่ใช้credentialsMETRIXหรือเชื่อมsourceSupabase/storage ไม่มี business table/import

Code rollback: revert foundation commits โดยไม่แตะexistingmodules; keepmanifestdisabledเพื่อหยุดentryทันที DBcatalogเป็นadditive: ถอนmodule grantsผ่านAdminเมื่อมีจริง เก็บpermissionrowsไว้เพื่อรักษาประวัติ ก่อนคืนtriggerfunctionต้องreviewร่วมกับcatalogmigrationถัดไป; testfixturerollbackพิสูจน์transactionไม่ทิ้งfixturepermissions ห้ามลบrole/history/ข้อมูลจริงเพื่อrollback

## JEV และข้อจำกัด

ใช้ `jev-orchestrator` metadata-only: health networkใช้ได้; route .47fallback; evidence .59supported/.87needs-more → ไม่claimครบ; riskdeterministichardgateตรวจคำmigration/production (Jevไม่ได้อนุญาตการดำเนินการ); continueเลือกescalate .62fallback มีbusinessdecisionต้องเจ้าของตอบจริง ไม่ส่งsourcebodies/secrets/env/productiondataให้JEV

ไม่ได้เปิดsourceproductionruntime ไม่อ่านข้อมูลจริง ไม่ยืนยันPDFfontlicense/renderทั้งหมด/legacyHTML/ทุกUIข้อความ/keyboard-mobile-a11y/performance/realusers; sourceindex/controlsเป็นstaticevidence ไม่ใช้แทนe2e

## การตัดสินใจที่ต้องใช้เพื่อเดินต่อ

1. DQ01: ให้ “ลงนาม” เป็น capability แยก เฉพาะ assigned user/documentversion โดยคงSr.Managerอ่านอย่างเดียวในส่วนอื่น หรือคงอ่านอย่างเดียวและเลื่อนลงนาม? SourceUIกับSQLขัดกัน จึงไม่เลือกเอง
2. DQ02: ใช้decimal/2dpตามstoredmoneyและไม่จำลองfloatdrift หรือเก็บlegacyผลfloatสำหรับreconciliationก่อนตัดสิน? แผนบังคับdecimalแต่sourceผลต่างได้ จึงยังไม่เปิดfinancialpersistence/calculation
3. ก่อนM6: DQ03 PDFcableCount='1' vsformจำนวนจริง; DQ08signasset/license/retention และก่อนM7 DQ06/07 reviewedusers/data/cutover; ownerUAT/grantsจริง/productionapplyต้องสั่งแยกภายหลัง

คำถาม1–2ส่งเจ้าของไว้ระหว่างทำงานแล้ว ยังไม่ได้รับคำตอบ ไม่ถือว่าเวลาผ่านไปคือapproval ส่วนที่ไม่ขึ้นกับคำตอบทำเป็นcheckpointและทดสอบแล้ว ส่วนbusinessservices/UIต้องต่อจากdata/workflowcontractsที่ยืนยัน ไม่อ้างว่าจบM0–M8ทั้งแผน
