# Current implementation status

Updated 2026-10-15. Earlier Core-only counts below are historical checkpoints. This handoff records the latest local checkpoint; it does not claim production release, real-data reconciliation or human UAT approval. Application source and repeatable tests take precedence over historical reports.

## Runtime and verification

- Next.js 16.3.8, React 19, PostgreSQL, Argon2id passwords and opaque database sessions. Optional NAS/Microsoft 365 adapters retain server-side authorization.
- Local main: PostgreSQL on port 5432, application on port 3000. Migration ledger has 28 entries after backed-up restore rehearsals; original business/account/car/session fields preserved. No historical KPI recalculation.
- Latest application verification: unit 267 passed / 41 opt-in skipped; dedicated sync/session PostgreSQL 13 passed; browser 6 passed; lint/typecheck/build and document mapping passed. These are local results, not production evidence.
- Repository cleanup was checked from staged source without environment files or generated evidence: lint/typecheck/build passed, unit 267 passed and document mapping 1 passed, using installed locked dependencies. Markdown cleanup changes documentation and Git tracking only.

## เช่าท่อร้อยสาย / METRIX — 15/10/2569

**ปิดข้อพบตามไฟล์แนบ:** RC-01–07 implementation/local verification ครบแล้ว รวม 10 editable role bundles/exhaustive Source goldens/constants/created banner/date+offset signature controls/templates3/private lossless financial JSON และ active metadata edits ดู [หลักฐานปิดข้อ](metrix-integration/12-parity-closure.md) ไม่มี real migration หรือ human UAT/production-ready claim

Native module implementation M0–M9 ส่งมอบสำหรับ local UAT: 40 capabilities/scopes, Core Admin enable/disable ตาม DQ09, server workflow/private PDF/assigned signing, 10-phase NT/non-NT, annual/cancel/SLA/realtime และ offline importer tools/fixtures ไม่มี real data migration

Latest verification: lint/typecheck/build ผ่าน, unit6164ผ่าน65opt-inข้าม/document1; constrained PostgreSQL24ผ่าน/catalogถึง0056/empty56-migration DDL rollback; import CLI5+planner7/financial3; browser8ผ่าน/Core13คู่0pixelchange/axe13views0violations; 1000-row page50ใช้4SQLต่อcall15calls (ไม่ใช่ production SLA)

Main manifest ยังdevelopment/default-disabled ตาม human UAT gate ไม่มีmain/productionapply/grants/deploy Owner decisionsDQ01/02/03/07/09ใช้แล้ว การเปิดจริงต้อง real identities/teams/scopes/coordinator map/template&retention review และบันทึกUAT รายงานเก่า267/439testsข้างต้นเป็น historicalCorecheckpoint ไม่ใช่ผลล่าสุด ดู [รายงาน](metrix-integration/99-final-report.md) และ [QA](quality/duct-rental/README.md)

## Car booking

Schema/RLS, booking/return/log/cancel APIs, native calendar/admin UI, OSP reports/dashboard, durable Sheets sync, reviewed offline importer, intake pause, readiness and recovery tooling are implemented. Local main UAT activation and scoped API/browser checks passed. See [module specification](plans/car-booking-module-spec.md) and [cutover checklist](operations/car-booking-cutover.md).

The owner deferred real CSV import until the system is complete. Employee-code normalization/crosswalk and overlap rejection are implemented, but no real employee migration or role proposal has been applied. Real Sheets credentials/connection, business UAT, production hosting and legacy cutover remain pending.

## Buildings, guarantees and pricing

Native building search/map/detail/create/edit and scoped administrator deletion, guarantee workspaces and server-side exact-decimal/domain foundations are present. Operational source parity and real-data reconciliation remain partial; do not infer completed module migration from native routes. Remaining acceptance is in [module gates](modules/parity-gates.md), module source-parity matrices and [open questions](open-questions.md).

## Next release gates

Confirm production inventory/runtime credentials and database privileges; approve real data/crosswalk and KPI/financial policy; complete module parity and human UAT; run representative load/accessibility/security checks; verify Sheets and storage connections; rehearse hosting backup/rollback and obtain release approval. Use the [release checklist](operations/release-checklist.md), not historical phase reports, to authorize readiness.

## Documentation policy

Active architecture, module contracts, original unresolved business specifications, operations and release guidance remain tracked. Completed plans and historical reports remain local and in Git history. Generated quality outputs are ignored. [Documentation index](README.md) / [repository policy](operations/repository-policy.md).
