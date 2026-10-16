# Current implementation status

Updated 2026-10-16. Earlier Core-only counts below are historical checkpoints. This handoff records the latest local checkpoint; it does not claim production release, real-data reconciliation or human UAT approval. Application source and repeatable tests take precedence over historical reports.

## Runtime and verification

- Docker/GitLab handoff16/10/2569: เพิ่มstandalone/PDF tracing, multi-stage non-root runner+tools+NAS, localComposeและGitLabregistryCI, TLSกลาง3pools, migrationURLแยกและfirst-adminbootstrapแบบno-op ผู้ใช้อนุมัติขยายCore/RLSเป็นmigration0059เพื่อใช้non-owner DMLlogin;ยังไม่applyลงฐานใด ผู้ใช้เลือกให้ทดสอบDBบนDockerเท่านั้น เครื่องไม่มีDocker/WSLจึงยังไม่ยืนยันcontainer/migration/bootstrap/browser/image size ผลlocal lint/typecheck/unit6,166ผ่าน66opt-inข้าม/document1/TLS4/standalonebuildผ่าน;ComposeCLI2.39.4 configผ่านและGitleakshistory112commitsผ่านโดยมีข้อยกเว้นFirebaselegacyที่เจ้าของยืนยัน+cachefalsepositive ดู [DEPLOY](../DEPLOY.md)/[รายงาน](quality/docker-deployment/README.md) เจ้าของอนุญาตcommitและส่งorigin/mainบนGitHubเพื่อITตรวจcode โดยไม่มีproductionmutation/permission-assignment/UIchange

- Sidebar correction15/10/2569ตามเจ้าของ: ย้าย3เมนูหลักไปใต้กลุ่มเช่าท่อและพาดสายใน Core Sidebar ใช้รูปแบบย่อยเดิมของWork/Guarantees พร้อมพับขยาย/จำค่า/activeหน้าย่อยและmobile/collapsed navigation เอา3ปุ่มหลักซ้ำออกจากหน้า เหลือทางลัดงานสนับสนุน ไม่มีเปลี่ยนAPI/schema/grants ผลfresh gates: lint/typecheck/unit6,166ผ่าน/66opt-inข้าม/document/buildผ่าน; browserโฟลว์เดิม2ผ่านหลังbuildSidebarใหม่ สำเนาแอปหลักlocal syncและrestartแล้ว หลักฐาน `.data/sidebar-*`

- เช่าท่อและพาดสาย local UAT 15/10/2569 (starting HEAD `f2626487ea967138b974998fe79e36728a1bb644`): เพิ่ม3เมนูหลัก และงานพาดสาย PEA/MEA แบบบันทึกถาวรในตารางแยก migration0058; list/search/page50, draft/edit, gated transitions, revision→review→resubmit, close/archive/history, version/idempotency, FORCE RLS, audit/activity/outbox และ empty change hint หลัง commit ใช้ Core identity และ catalogเดิม ไม่มี auto grants Manifest active/default false ตามคำขอเจ้าของให้ทดสอบด้วยบัญชีเดิม แหล่งอ้างอิง frozen METRIX `f87220bf94b765e4896388632c3dbeabb5286510` เป็น client-state prototype จึงยังไม่อ้าง complete Source migration ของ MOD2
- หลักฐาน local UAT รอบล่าสุด: lint/typecheck/build/document mapping ผ่าน; unit6,166ผ่าน/66opt-inข้าม; PostgreSQL constrained services25ผ่าน; CSS321files0violations คำสั่ง/ผลอยู่ `.data/cable-final-*` Browser PEA/MEA full flow และ readonly403 ผ่าน2เคสใน final rebuilt fixture (30.9s); list axe/overflow ผ่าน1440lightและ390darkทั้ง2หน่วยงาน ด้าน business policy ยังรอยืนยันตาม [open questions](open-questions.md) Jev health ผ่าน; risk tool hard-gate จับวลีปฏิเสธ production ใน sanitized summary จึงไม่ได้เรียก model; ไม่ใช้ผลนั้นเป็นการอนุมัติ ใช้ owner authorization และ deterministic local checks
- แอปหลัก local เพิ่มเฉพาะ migration0058 หลัง pg_dump17 สำเร็จ (backup945,600bytes, pg_restore list926lines) ที่ `.data/cable-local-backup/before-cable-0058.dump` ใช้ `permission_superapp_dev` เดิม บัญชี/role assignmentsไม่ถูกปรับ ฐานหลักมี58migrations โมดูล local เปิดอยู่เดิม ทดสอบ UI ด้วย Local Admin สร้าง `CB-8E89FC37` สำเร็จ ข้อมูลจำลองระบุชื่อ “ทดสอบระบบพาดสาย PEA 15-10-2569” จากนั้นใช้บัญชีfixtureแยกตรวจfull flowเพื่อไม่รบกวนsingle-active-sessionของบัญชีหลัก ดู [คู่มือ](operations/cable-trial-uat.md) ไม่มีหน่วยงานภายนอก/ไฟล์/ลายเซ็น/ราคา/SLA/ต่อสัญญาพาดสายในรอบนี้ Rollbackปิดโมดูลผ่านCore Adminและคงตาราง/auditเพื่อรักษาคำขอUAT

- Historical navigation-only checkpoint: component preview `.data/cable-flow-preview` ตรวจ1440/390/320×light/dark ไม่มีoverflow/axe violations ก่อนต่อยอดเป็น persistence ตามคำขอเจ้าของ

- Next.js 16.3.8, React 19, PostgreSQL, Argon2id passwords and opaque database sessions. Optional NAS/Microsoft 365 adapters retain server-side authorization.
- Local main: PostgreSQL17 on port5432, application on port3000 using the original permission_superapp_dev database. All57migrations installed after a verified backup/restore rehearsal; fingerprints of64original data tables unchanged. Migration0047 accepts Windows CRLF function bodies. Original accounts and module grants preserved; no real METRIX import or historical KPI recalculation. Unused fixture databases/clusters removed; test tools remain reproducible.
- Earlier Core-only checkpoint: unit267/41opt-in, sync/session PostgreSQL13/browser6. Current application local checks15/10: lint/typecheck/build/unit6164pass/65opt-in skipped/document1/CSS316files0violations/contrast58pairs0failures/staticcopy0findings/production dependency audit0vulnerabilities. This is local evidence, not human UAT/production approval.
- Main handoff retains source/runtime assets/licenses, lockfile/configuration, all57migrations, repeatable tests/fixtures/tools and current contracts/runbooks. Generated evidence/.env/.data/Sourceclones are ignored. Nine completed METRIX discovery/audit/closure reports are untracked with local copies/Git history preserved; current module/parity/QA/deployment guidance is retained. CI separates UX/Admin-Work/Car/Duct fixtures and checks Duct PostgreSQL/catalog/rollback/import. Browser pools are spec-owned; security assertions check soft-revocation and rejected old tokens. Migration0057 scopes two Duct event policies to its runtime group, fixing constrained Car writes without granting private Duct predicates to Car.

## เช่าท่อร้อยสาย / METRIX — 15/10/2569

**ปิดข้อพบตามไฟล์แนบ:** RC-01–07 implementation/local verification ครบแล้ว รวม10editablebundles/exhaustiveSourcegoldens/constants/createdbanner/date+offsetsignaturecontrols/templates3/privateSourceJSON/activeedits ดู [contract](modules/duct-rental.md)/[QA](quality/duct-rental/README.md) รายงานก่อน/หลังเก็บlocal/Githistory commit392c327 ไม่มีrealmigration/humanUAT/production-ready claim

Native module implementation M0–M9 ส่งมอบสำหรับ local UAT: 40 capabilities/scopes, Core Admin enable/disable ตาม DQ09, server workflow/private PDF/assigned signing, 10-phase NT/non-NT, annual/cancel/SLA/realtime และ offline importer tools/fixtures ไม่มี real data migration

Latest verification: lint/typecheck/buildผ่าน, unit6164/65opt-inข้าม/document1; DuctPostgreSQL24/catalogถึง0057/57-DDLrollback/importCLI5ผ่าน; Car schema10/service16ผ่าน; freshUXbrowser45/Admin-Work11ผ่านหลังแก้CI ส่วนDuctbrowser8/Core13คู่0pixelchange/axe13views0violationsเป็นcheckpoint15/10ก่อนhandoffcleanup; 1000-rowpage50×4SQL/call ไม่ใช่productionSLA

Manifestยังdevelopment/default-disabledตามhumanUAT gate ไม่มีmain/productionapply/grants/deploy DQ01/02/03/07/09ใช้แล้ว เปิดจริงต้องreviewidentities/teams/scopes/coordinator/template/retention/UAT ดู [deployment](operations/duct-rental-deployment.md)/[QA](quality/duct-rental/README.md) การpushmainไม่ใช่เปิดโมดูลหรือย้ายข้อมูลจริง

## Car booking

Schema/RLS, booking/return/log/cancel APIs, native calendar/admin UI, OSP reports/dashboard, durable Sheets sync, reviewed offline importer, intake pause, readiness and recovery tooling are implemented. Local main UAT activation and scoped API/browser checks passed. See [module specification](plans/car-booking-module-spec.md) and [cutover checklist](operations/car-booking-cutover.md).

The owner deferred real CSV import until the system is complete. Employee-code normalization/crosswalk and overlap rejection are implemented, but no real employee migration or role proposal has been applied. Real Sheets credentials/connection, business UAT, production hosting and legacy cutover remain pending.

## Buildings, guarantees and pricing

Native building search/map/detail/create/edit and scoped administrator deletion, guarantee workspaces and server-side exact-decimal/domain foundations are present. Operational source parity and real-data reconciliation remain partial; do not infer completed module migration from native routes. Remaining acceptance is in [module gates](modules/parity-gates.md), module source-parity matrices and [open questions](open-questions.md).

## Next release gates

Confirm production inventory/runtime credentials and database privileges; approve real data/crosswalk and KPI/financial policy; complete module parity and human UAT; run representative load/accessibility/security checks; verify Sheets and storage connections; rehearse hosting backup/rollback and obtain release approval. Use the [release checklist](operations/release-checklist.md), not historical phase reports, to authorize readiness.

## Documentation policy

Active architecture, module contracts, original unresolved business specifications, operations and release guidance remain tracked. Completed plans and historical reports remain local and in Git history. Generated quality outputs are ignored. [Documentation index](README.md) / [repository policy](operations/repository-policy.md).
