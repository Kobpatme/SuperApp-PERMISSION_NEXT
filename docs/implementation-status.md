# Current implementation status

Updated 2026-10-15. Earlier Core-only counts below are historical checkpoints. This handoff records the latest local checkpoint; it does not claim production release, real-data reconciliation or human UAT approval. Application source and repeatable tests take precedence over historical reports.

## Runtime and verification

- Next.js 16.3.8, React 19, PostgreSQL, Argon2id passwords and opaque database sessions. Optional NAS/Microsoft 365 adapters retain server-side authorization.
- Local main: PostgreSQL on port 5432, application on port 3000. Migration ledger has 28 entries after backed-up restore rehearsals; original business/account/car/session fields preserved. No historical KPI recalculation.
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
