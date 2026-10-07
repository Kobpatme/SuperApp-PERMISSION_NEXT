# Implementation status

## โมดูลจองรถ — เฟส 1, 08/10/2569

เพิ่ม migration 0024, schema/indexes/exclusion, FORCE RLS สามตาราง, capability use/admin, calendar projection และ OSP numeric view ตาม [รายงานเฟส 1](plans/car-booking-phase-1.md) โมดูลยัง development/disabled ไม่มี service/UI และไม่มี grant อัตโนมัติให้ผู้ใช้เดิม ยกเว้น car-booking ออกจาก trigger platform_admin เดิมโดยรักษาพฤติกรรมโมดูลอื่น

PostgreSQL 16.15 fixture: migrations 24 ผ่าน/รันซ้ำ applied=0; integration 10/10 ผ่านด้วย non-owner/non-superuser/NOBYPASSRLS; lint/typecheck/unit/documents/build/audit ผ่าน, unit 207 ผ่าน/12 skipped, audit 0 ไม่ได้ deploy หรือ apply ฐานจริง รอไฟเขียวเฟส 2 ตามเอกสารงาน §10

เจ้าของยืนยันจองย้อนหลังได้, admin แก้รายการชั้นจอดได้, mileage=0 ใช้คำนวณได้, calendar แสดงเพียงทะเบียน/ช่วงไม่ว่าง, late return แสดงเวลาจริงแต่ไม่ขยาย reservation เกินเวลานัด, ชื่อ/เส้นทาง/icon และปิดใช้งานรถแทนลบ

## โมดูลจองรถ — เฟส 0, 08/10/2569

สำรวจบน HEAD `c22bd86890b8ac4bc4f03b29ea8f210b7ed45d5d` จาก working tree สะอาด และสร้าง branch `codex/car-booking-phase-0` ตามเอกสารงานที่ผู้ใช้ให้ดำเนินการอย่างเคร่งครัด อ่านต้นทาง `D:/WebApp/จองรถ/New Vertion/Code.gs` และ `Index.html` ตามที่ผู้ใช้ระบุ; ตรึง SHA256 ใน [รายงานเฟส 0](plans/car-booking-phase-0.md) พร้อม [parity inventory](modules/car-booking/source-parity.md) และ [UX baseline](modules/car-booking/source-ux-baseline.md)

Fresh gates ก่อนเพิ่มเอกสาร: lint/typecheck/test/test:documents/build exit 0; Vitest 204 ผ่าน/12 skipped (50 files ผ่าน/2 skipped), document 1 ผ่าน; Next.js 16.3.6; audit ไม่พบช่องโหว่ Logs อยู่ `docs/quality/car-booking-phase-0/` ไม่ใช้จำนวน test ในเอกสารเก่าแทนผลรอบนี้

พบ employee_code ใน profiles, migration ล่าสุด 0023, catalog capability แบบสามส่วน; ยังต้องทำรายบุคคลโดยรักษา grant อื่นและไม่ล้าง session เฉพาะโมดูลใหม่ เนื่องจาก Admin ปัจจุบัน revoke sessions เมื่อเปลี่ยนสิทธิ์ RLS helper อ่าน app.user_id แต่ search ยังไม่พบ application binding; runtime least-privilege/RLS ยังไม่ได้ยืนยัน ต้นทาง OSP รวม fuel ระหว่างทาง+ตอนคืนถูกต้อง ส่วน dashboard ยังต้องแก้ให้ใช้ aggregate เดียวกันตามข้อกำหนด

JEV health local/network OK; evidence supported .52/needs_more_evidence .88/do_not_rely_on_claim จึงไม่อ้างความพร้อม implementation/RLS/parity ใช้ metadata_only และ deterministic source/gates เป็นหลัก

สถานะ: รอคำตอบ policy และไฟเขียวก่อนเฟส 1 ตามเอกสารจองรถ §3/§10 ไม่มี application/schema/permission/data changes ไม่มี migration/deploy/external write; CSV 5 ชีตและ actual hosting ยังไม่มีหลักฐาน การถอนเอกสารเฟสนี้ไม่ต้อง rollback DB

## Guarantee + Buildings parity recovery — 2026-10-01

Target baseline: `codex/professional-workspace@ec778a41b63e0b55d811671d1d492d2df05044bd`. Baseline was run before module edits: lint and typecheck passed; Vitest 35 files / 108 tests passed; document test 1/1 passed; Next.js 16.3.4 production build passed. `npm audit --omit=dev` reports one critical advisory affecting the existing `next` dependency and says no fix is available for the locked version; framework dependency changes were outside this safe parity slice.

Implemented a first native slice after the required audits:

- Buildings now renders its result list beside the map. Selecting a result opens the existing detail drawer and updates the selected marker; marker selection continues to open the same building detail. The list and map use the same server-filtered result set.
- Building contacts now support phone/email copy and the overview supports coordinate copy, with live success/error feedback.
- Guarantees now opens on a personal operations dashboard, with owner/assigned work, deadline/missing-document/TL/refund/On Service summaries, outstanding balance, actionable notices and recent completion/update rows. The filter uses only rows already scoped by the server query. The TL workspace shortcut is rendered only when server-derived grants allow the view.
- On Service is now a separate follow-up view showing removal deposit exposure, Off Service pending count, building, owner, activity age, next step and a link to each case.
- Added a unit test for owned/assigned personal-dashboard filtering.
- Expanded fee tests to verify monthly and annual revenue-share periods and that percentages stay outside currency totals.
- Created `docs/audits/GUARANTEE-PARITY-AUDIT.md` and `docs/audits/BUILDINGS-COST-PARITY-AUDIT.md` before implementation and recorded provisional/approved source evidence there.

Post-change verification: lint pass; typecheck pass; Vitest 35 files / 109 tests pass; document test 1/1 pass; production build pass; `git diff --check` pass. `npm audit --omit=dev` remains at one critical Next.js advisory. No authenticated screenshot/UAT was performed. No production database, NAS, SharePoint or source production service was accessed.

JEV: `jev_health` succeeded with network connectivity; route selected Buildings at very low confidence and evidence check advised gathering more evidence, so source inspection and deterministic tools controlled decisions. Prioritization ranked source evidence freeze, map/list parity, quotation, personal dashboard and TL/On Service follow-up. A risk call for a contemplated financial formula port hit a human-approval hard gate and did not run; no formula or pricing policy changed. `jev_continue` advised gathering more evidence. JEV remained advisory throughout.

Source freeze: Permission_Next matches approved `afaee997afecf0f42e059b7100fa90ed0d188784`; maxiwa_KPI matches approved `4f5fa99b05f8dbfea9304d47560aec3d48746908`; Guarantees source `maxiwa@94742a4` remains unavailable in the local object database and its provisional checkout at `471f2b6a20361f9114372c2493400c62d3ccf19c` is not claimed equivalent. Guarantees audit status remains PARTIAL.

Remaining major work: complete native quotation route/calculation/revision/export; permissioned building and dynamic cost editors; guarantee date-filtered completed view, richer TL mobile/evidence handoff, executive drill-down and complete local role navigation; reconcile approved Guarantees source; verify with browser/UAT, accessibility, integration and performance evidence. This slice does not claim either module migrated or production-ready.

## Fresh source-parity recovery — 2026-09-30

The current target checkout is `codex/professional-workspace@e9841bb`. The previous audit snapshots `4080160`, `6ccef5b` and `3d8d281` are stale for this checkout. Approved behavioral sources are `Kobpatme/maxiwa@94742a4`, `Kobpatme/Permission_Next@afaee99`, and `Kobpatme/maxiwa_KPI@4f5fa99`; local folders and legacy compatibility routes are comparison artifacts, not source-of-truth authorities. The approved Guarantees SHA is not present in the local source object database; provisional source evidence is recorded separately and must be reconciled before declaring Guarantees parity.

Fresh matrices and acceptance gates are maintained in [Work](modules/work/source-parity.md), [Buildings](modules/buildings/source-parity.md), [Guarantees](modules/guarantees/source-parity.md), and [parity gates](modules/parity-gates.md). UX baselines are maintained beside each matrix. SP-0 documentation is substantially complete, with the Guarantees baseline limitation open. Security hardening is the active implementation checkpoint; no module is declared migrated yet.

### Fresh deterministic baseline after Work recovery slice

- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm test`: 35 files / 108 tests passed
- `npm run test:documents`: pass (1 test)
- `npm run build`: pass (Next.js 16.3.4)
- `npm audit --omit=dev`: 0 vulnerabilities
- Target commit used for this baseline: `e9841bb`
- Authenticated visual QA remains blocked by the absence of an organization-approved test credential; the public login screen was checked in the local browser and the dev server was stopped after inspection.
- JEV health/routing/evidence/prioritization/risk checks were advisory only; deterministic checks remain authoritative.

### P0 Work & KPI recovery checkpoint — 2026-09-30

Implemented as a native, permission-scoped slice:

- Explicit screens for dashboard, My Tasks, Team Command, Assignment Center, People, Job Tracker, KPI, reports, activity and due work. Unknown `view` values now return `notFound()` instead of silently falling back to My Work.
- Source-compatible task fields for job code, Main KPI, Sub KPI, note and optional KPI weight, with additive local migration `0017_work_source_parity.sql`. The migration was not run against production.
- Server-side read model with owner/team row filtering, humanized status/activity labels, grouped jobs, assignment options, KPI cards and weighted report values.
- Assignment action for up to 20 jobs with Zod validation, duplicate protection, team/assignee re-check, atomic task/event/audit/outbox write and revalidation.
- Task status and note actions preserve authorization, optimistic version checks and human-facing mutation errors.
- Role-aware Work navigation is derived from server-loaded grants; protected screens still repeat server permission checks.
- Work-specific readable table/overflow/empty/unavailable/error states and a neutral green operational token direction were added without changing the source-of-truth calculation layer.

Known limitations remain explicit: holiday/KPI administration is not yet a native UI, historical source data has not been imported, assignment audit is currently batch-level, and authenticated browser/UAT/RLS evidence is still required before claiming parity or production readiness. See [the recovery audit](audits/PROFESSIONAL-UX-RECOVERY-AUDIT.md) and [the result record](audits/PROFESSIONAL-UX-RECOVERY-RESULT.md).

### Phase 1 security hardening checkpoint — 2026-09-29

Implemented in the local target checkout:

- Login uses one generic failure message, performs dummy Argon2 verification for unknown/invalid input, records success/failure/lock audit events, resets expired account locks and supports an internal Postgres-backed email/IP failure window.
- Session validation enforces absolute and idle expiry using `auth_sessions.last_seen_at`; password policy is shared by change-password, admin password operations and bootstrap validation.
- Proxy redirects preserve only safe internal `next` paths; unauthenticated `/api/*` requests return JSON 401, and password-change-required API calls return JSON 403.
- Dashboard, workspace search, NAS, SharePoint readiness and guarantee document routes now perform an explicit API identity check before domain authorization.
- New migrations `0015_auth_rate_limits.sql` and `0016_pending_audit_logs.sql` were applied successfully to the local PostgreSQL development database.
- NAS upload/download audit failures now reach explicit error handling, are queued in `pending_audit_logs` for retry, and mark the successful upstream response with `x-audit-status: pending`; the retry worker is still a later operations task.
- Building list defaults to the full current operational set (up to 2,000 rows), and the fee drawer keeps validated fee rows visible while separating only unverified raw source values.

Evidence for this checkpoint: `npm run lint`, `npm run typecheck`, `npm test` (32 files / 101 tests), `npm run test:documents`, `npm run build`, `npm audit --omit=dev`, and the local migration command all pass. Remaining Phase 1 gaps are integration tests against database-backed route/session behavior, a durable pending-audit retry worker, CSP nonce evaluation, and full trusted-proxy deployment evidence. This checkpoint does not declare the phase complete or the system production-ready.

SP-1 checkpoint: source-compatible Work domain helpers now cover status vocabulary mapping, Bangkok working-day/active-holiday deadlines, hold extension history, grouped jobs and exact-decimal weighted SLA/completion reporting. The permission-scoped read model exposes weighted report values. Native `/work/new` personal-task creation writes task state, audit, activity and outbox atomically; native route surfaces exist for mine/team/assignment/people/tracker/reports/KPI. Remaining SP-1 gates include source-compatible task fields, assignment center, task detail/note actions, holiday/KPI admin UI, populated historical data and live database/RLS/UAT evidence.

Current rebuild audit: 2026-09-28 — see [verified gaps and phase status](repository-audit/professional-rebuild.md).

The sections below are the **historical September 4 foundation checkpoint**, not current feature-completion claims. Current identity is local sessions (ADR-0003); Buildings/Guarantees now have native operational interfaces. Rebuild acceptance remains open in the linked audit.

Historical checkpoint date: 2026-09-04

## Phase 0 — Discovery & Audit

- Status: Complete.
- Three source repositories were cloned and audited. Comparison, reusable assets, technical debt, migration risk, data map, target architecture, ADRs and initial mappings are recorded.
- Baseline and upgraded repository gates pass; production dependency audit reports zero vulnerabilities.

## Phase 1 — Platform Foundation

- Repository implementation: Complete. Native module surfaces replace production iframe entry points; legacy routes return 404 in production. Core identity/team/RBAC/data-scope, canonical Building, attachment metadata/provider contract, append-only audit/activity/outbox, notifications, environment health and CI are implemented.
- Verification status: Pending infrastructure. Unit and SQL contract tests pass, but migrations and RLS have not been executed against a production-like PostgreSQL/Supabase instance.
- Security behavior: production authorization is deny-by-default and does not trust `user_metadata` or legacy roles. First-admin bootstrap is documented and requires a verified Auth UUID.

## Phase 2 — Work & Activity

- Repository foundation: Implemented. Task/manual-work schema, explicit state machine, optimistic concurrency, immutable transition evidence, cursor contract and transactional event production are present.
- Incomplete: source migration, populated My Work/feed/report views and live integration tests require verified exports and a database.

## Phase 3 — Automatic KPI

- Repository foundation: Implemented. Versioned/effective rules, exact-decimal engine, replay-proof facts, calculation runs, score snapshots, explainability trace and four-eyes adjustments are present.
- Incomplete: approved business rule catalog, historical migration, live workers and populated My/Team KPI screens require domain-owner input and production data.

## Phase 4 — Guarantee

- Repository foundation: Implemented. Canonical building relation, explicit lifecycle, Numeric deposits/refunds, concurrent refund-limit trigger, four-eyes request approval and immutable financial evidence are present.
- Incomplete: live Firestore/Storage migration, final owner-approved status mapping, native operational forms/dashboard and live KPI/notification flow.

## Phase 5 — Building & Pricing

- Repository foundation: Implemented. Building condition history, estimate/version/item/approval schema, immutable snapshots, exact-decimal totals and approval separation are present.
- Incomplete: source migration, approved rounding/rate policy, native forms and live event/KPI flow.

## Phase 6 — Cross-module Experience

- Repository foundation: Implemented. Building 360 canonical-ID assembly, row-scoped global search, permission-filtered command registry and unified dashboard adapter contracts are present.
- Incomplete: production-backed search index, populated Building 360/timeline and expanded navigation screens.

## Phase 7 — Automation

- Repository foundation: Implemented. Versioned event rules, deterministic execution/action idempotency, bounded retry, action results and dead-letter state are present.
- Incomplete: worker deployment, approved rules, alerting and live task/notification actions.

## Phase 8 — Migration & Cutover

- Control plane: Implemented. Import run/row evidence, deterministic checksums, anomaly isolation, reconciliation logic and module rollback runbook are present.
- Execution: Blocked by missing production exports, schema/rules inventory, identity/building mappings, owner sign-off and target database. No production data has been changed.

## Phase 9 — Production Readiness

- Repository hardening: Implemented. CI, CSP/security headers, CSRF origin guard, redacted structured logging, health check and deployment/backup/restore/observability/incident/release runbooks are present.
- Production approval: Not ready. Live RLS/concurrency/load/accessibility/browser testing, threat/privacy review, backup restore drill, monitoring ownership and deployment rehearsal remain mandatory.

## Building deletion — 2026-10-03

- เพิ่ม DELETE API และปุ่มยืนยันในหน้ารายละเอียดอาคาร จำกัดเฉพาะ platform_admin พร้อม read/update data scope ฝั่ง server, same-origin check, exact-name confirmation และ optimistic version check ภายใต้ row lock
- ลบข้อมูลจาก PostgreSQL จริงพร้อม audit snapshot ใน transaction เดียว; ปฏิเสธเมื่อมี operational/financial/document dependencies
- หลักฐาน: unit/API 140 tests ผ่าน; PostgreSQL integration 3 tests ผ่านโดย rollback fixtures ทั้งหมด; lint, typecheck และ production build ผ่าน ตรวจหน้าต่างยืนยันด้วย Chrome โดยไม่ลบอาคารผู้ใช้
- ไม่เพิ่ม migration/environment; ไม่เปลี่ยนข้อมูลอาคารจริงระหว่างการตรวจ UI และไม่ได้ประกาศ production readiness

## Guarantee executive analytics — 2026-10-03

- แยกรายงานผู้บริหารเป็น GuaranteeExecutiveDashboard และ buildGuaranteeManagementReport ใช้สูตร refund/outstanding/On Service ชุดเดียวกับหน้ารายการ แสดง KPI, ประเด็นติดตาม, ความครอบคลุมวันครบกำหนด, ยอดตั้งเบิก 12 เดือน, สถานะ/พื้นที่ และ 5 รายการคงค้างสูงสุด
- เพิ่มตัวกรองพื้นที่/เจ้าของงานที่ใช้กับทั้งรายงาน ตารางเดือนที่เข้าถึงด้วยคีย์บอร์ด ลิงก์รายละเอียด และรูปแบบพิมพ์ A4 landscape; ระบุขอบเขตสิทธิ์ ข้อจำกัด 500 รายการและความหมายของยอดตั้งเบิกอย่างชัดเจน
- หลักฐาน: 143 unit tests ผ่าน (PostgreSQL deletion tests 3 เคสแยก opt-in ไม่ได้รันในงานรายงานนี้), document test 1 ผ่าน, lint/typecheck/production build ผ่าน ตรวจ Chrome ด้วย 51 รายการจริงและตัวกรอง BKK 4 ไม่มี console error/warning ใหม่ ตรวจขนาดเนื้อหารายงานมือถือ 343px ภายใน viewport 375px
- การพิมพ์/PDF ใช้ print stylesheet; ยังไม่ได้ตรวจผล PDF ที่ผู้ใช้บันทึกจริง ไม่เปลี่ยนฐานข้อมูลหรือสิทธิ์เดิม
# UX/login CP1 — 2026-10-03

AuthShell + friendly Thai forms/copy, email-only state, safe reasons, SUPPORT_CONTACT_TEXT, PN image swap prop และ blue ADR แล้วตาม source; full gate รอบ CP1 exit0: lint/typecheck/unit152 ผ่าน+3 skipped/documents1/build Next16.3.6/audit0 vulnerabilities; contrast50 pairs0 failures; Playwright auth7 passed (15.7s) exit0 แบบ external server บน isolated local Postgres

JEV CP1: route shared_shell .90; risk1.91/.80 hard_gate=false; evidence needs_more .86 → ตรวจ HTML/axe/screenshotsเพิ่ม; classify environment .35/fallback; continue .72 verify_before_commit → ใช้ gates จริงก่อน commit รายงานเต็มและภาพก่อน/หลังอยู่ `docs/quality/ux-login-checkpoints.md`

ข้อจำกัด: check:css legacy inventory ยังไม่ผ่าน รอ CP3; managed Playwright server teardown ค้างบน Windows แต่ external-server run exit0; CI/UAT ยังไม่ได้ยืนยัน

# UX/login CP0 — baseline 2026-10-03

HEAD ก่อนแก้: `f6ed848ea0e687e749a65349beca8075a4477238`; เริ่มจาก `codex/professional-workspace` แล้วสร้าง `codex/ux-login-polish` ตามคำสั่งเจ้าของ ผู้ใช้มีการลบแผน legacy สองไฟล์และ untracked docs/SuperApp; ไม่ทับหรือ stage ไฟล์เหล่านั้น

| คำสั่งที่รัน | ผลจริง |
|---|---|
| npm ci | ครั้งแรก EPERM ที่ npm cache; rerun ด้วย escalation exit 0, 397 packages |
| npm run lint | exit 0 |
| npm run typecheck | exit 0 |
| npm test | exit 0; 40 files ผ่าน/1 skipped; 143 tests ผ่าน/3 skipped |
| npm run test:documents | exit 0; 1 test |
| npm run build | exit 0; Next 16.3.4 |
| npm audit --omit=dev | exit 1; 1 critical GHSA-vcvr-r3jv-pc5j; npm แจ้ง No fix available แต่ GitHub advisory ระบุ patched 16.3.6 — จะตรวจ registry ก่อนเลือก patch |

Raw command logs: `docs/quality/ux-login-evidence/baseline-*.log` (local ignored logs; ไม่ใช่ข้อมูล production)

| รายการจาก gap table | สถานะจากซอร์ส | หลักฐานก่อนแก้ |
|---|---|---|
| G1 generic error | verified-done | src/app/login/actions.ts:17,72,77 |
| G2 dummy Argon2 | verified-done | src/app/login/actions.ts:18,61 |
| G3 expired lock reset | verified-done | src/app/login/actions.ts:67–70 |
| G4 email/IP limiter + login audit | partial: implementation มีแล้ว; IP ยังไม่ทำงานเมื่อ proxy=0 | src/app/login/actions.ts:21,48,51,64,86,91; src/lib/auth-rate-limit.ts:7,61 |
| G5 forced-password guards | verified-done จาก source; DB integration ยังไม่ได้ยืนยัน | src/lib/access.ts:72; src/lib/request-context.ts:38; admin/actions.ts:20; work/actions.ts:45; guarantees/actions.ts:27; building APIs ตรวจ access.allowed |
| G6 safe next / API 401 | verified-done | src/proxy.ts:11,17; src/proxy.test.ts:11,18 |
| PreviewNotice dev-only | source verified; production DOM ยังไม่ได้ยืนยัน | src/components/workspace-feedback.tsx:13; src/lib/workspace-server.ts:11–12 (isDevelopmentSession ปัจจุบัน false) |

CP0 JEV: health check_network=true + absolute root สำเร็จ network_ok=true; continue ตอบ gather_evidence confidence 0.39/fallback_to_codex ใช้คำแนะนำให้ตรวจ advisory/registry เพิ่ม แล้วทำ safe UX ต่อโดยไม่ประกาศ full gate ผ่าน

ก่อน/หลัง screenshot: ก่อน login `docs/quality/ux-login-evidence/before-login-{light,dark}-{1440,1024,390}.png` กำลังเก็บ; authenticated screenshots ยังไม่ได้ยืนยัน ไม่มีการใช้บัญชีจริง

แผน: docs/plans/ux-login-v1.md; Q1 generic contact/env, Q2 proxy=0/warning/docs, Q3 PN mark, Q4 blue ADR ได้คำตอบแล้ว Rollback CP0: revert เฉพาะ documentation commit ไม่มีการเปลี่ยนสิทธิ์/ข้อมูล

## UX login CP2 — 2026-10-03
Source presentation/copy checkpoint verified with full gate exit0 (unit152/3skip, documents1, audit0); production matrix8passed, root overflow/axe serious-critical/forbidden words/runtime errors0. Static JSX scan A0/B1. Evidence/report: docs/quality/ux-login-checkpoints.md. No production data, permission matrix or business rules changed. CP3 font/CSS and CP4/5 remain not yet verified.

## UX login CP3 — 2026-10-03
Six CSS groups independently committed and verified; final full gate exit0, unit152/3skip/documents1/audit0. CSS179files0violations;contrast58pairs0failures. Final browser16passed1.8m; offline fonts90,888bytes/0external; globals59,591→58,064bytes.41alias definitions removed after zero-consumer check; uncertain selectors preserved with plan. Reports and before/after paths in docs/quality/ux-login-checkpoints.md. Remote CI pending push verification; CP4/5 not yet verified.

CP3 remote CI verified: run37127367637 at923ba38 completed success; GitHub job steps show check:css/contrast/copy, unit/documents/build/audit success.

## UX login CP4 — 2026-10-03
Full gate exit0; CSS181files0; browser18passed2.1m; reduced animations0, normal transform/opacity≤200ms, pending73.3/57.3ms, settled-windowCLS0. Fixed initially failing opener focus and reduced backdrop tests before rerun. Screenshots48+staff matrices0overflow/runtime errors; reports in docs/quality/ux-login-checkpoints.md. CP5 not yet verified.

CP4 remoteCI verified:37128298589 at7ea4720 completed success, includingCSS/contrast/unit/documents/build/audit.

## UX login CP5 — local verification 2026-10-03
Full gate cp5-final-security exit0:unit169passed/3skip(44filespass/1skip),documents1,build/audit0. CSS182files0;contrast58pairs0;copyA0/total0. Localbrowser36passed3.4m;security6realPostgresflows,admin/error/authaxe,ordinaryreadrole/longThai/empty/drawer matrix320–1440. Fonts90,888bytes0external;pending78.5/62.8ms,settledWindowCLS0,reducedanimations0. Allfinalscreenshots0overflow/runtimeerrors. Serverbootwarningverifiedwithproxy0. CP5 initial CI37131654116 failed29passed/7failed because no-database build prerendered change-password as a static redirect. Fixed force-dynamic in ee8d49c; reproduced no-database build and focused13auth/security tests passed. RemoteCI37132528028 at ee8d49c verified success on all steps, browser36passed2.2m, unit169passed/3skip, CSS182files0, contrast58pairs0, audit0. JEV continue at2026-10-03T15:19:46Z returned continue confidence.70/verify_before_commit, advisory only. Detailed§9reportsandpaths:docs/quality/ux-login-checkpoints.md;operations:docs/operations/ux-login.md. No productiondeploy/data writes or permissionmatrix changes.
# Work/KPI/Admin parity — baseline 2026-10-05

คำขอ: ทำตาม CODEX-WORK-KPI-ADMIN-PARITY.md; baseline HEAD `7233bf4a5d4b965e626f1ab9e94a175320be924a`, source `maxiwa_KPI@4f5fa99b05f8dbfea9304d47560aec3d48746908` ตรวจจาก checkout จริงแบบ read-only

Baseline rerun: typecheck/lint/unit/document/build exit 0; unit 186 passed / 3 skipped; document 1 passed. Logs `.parity-baseline-*.log` (ignored). ไม่ทับไฟล์งานอาคาร/UX ที่ค้างอยู่

JEV health: local/network OK, metadata_only. Phase 1 route domain_service confidence .69 / fallback_to_codex. Risk local-code workflow ถูก deterministic hard gate จับคำ delete; เป็น advisory ไม่ได้อนุญาต mutation ใด ๆ งานนี้สร้างโค้ด soft delete ตามคำขอ ไม่ลบข้อมูลจริงและไม่รัน migration บนฐานผู้ใช้

Migration numbering ปรับตาม schema จริง: 0017 work_source_parity และ 0018 building_location มีอยู่แล้ว จึงเริ่ม additive migrations ที่ 0019 ไม่แก้ไฟล์เดิม

Phase 1 checkpoint: lint/typecheck/unit192 passed +6 skipped/documents1/build exit0. Isolated PostgreSQL integration 3 passed (rerun หลังแก้ stale-version ordering และ fixture completion timestamp). JEV continue gather_evidence .43/fallback; ใช้ full gates และ integration เป็นหลัก. ปุ่ม transition พร้อมเหตุผล/edit/soft-delete/notes มีแล้ว; preview SLA ต่อใน Phase 3. rollback: revert เฉพาะ commits งานนี้; migration เป็น additive และไม่ลบตารางประวัติ

Phase 2 checkpoint: final lint/typecheck/unit195 +6 skipped/documents1/build exit0. เพิ่ม explicit route screens, shared scoped query filters, Tracker note/transition/audit timeline, weighted People summary, print และ CSV แบบ snapshot/keyset ที่ตัดกับสิทธิ์ work.report.read. Table screens จำกัด 500 พร้อมข้อความและตัวกรอง; CSV ไม่ตัดเหลือ 500. Migration 0020 origin field ใช้ legacy สำหรับข้อมูลเดิมโดยไม่เดา. JEV prioritize routes→people→reports→tracker→assign; continue gather_evidence .73. Source TYPE จริงเป็น contractorType B1/C1/C2/E1 ไม่ใช่ KPI type enumeration จึงเก็บเป็น task field ใน Phase 3. Browser UAT ยังต้องตรวจ

Phase 3 advisory: route versioned_json .87/verify_before_commit; risk 1.12/confidence .23 ไม่มี hard gate ใช้ deterministic tests เป็นหลัก. ไม่ใช้ kpi_targets/adjustments แทน personal assignments เพราะ semantics เป็น target ตามช่วงเวลา/fact approval; เพิ่ม versioned personal assignment table แยก

## Work/KPI/Admin parity — Phase 3/4 local close, 2026-10-05

ครบขอบเขต implementation ภายใต้ D1–D5: versioned KPI/SLA + personal weights, calendar, scoped system links, announcements, overview/audit filters; native assignment/create fields + server deadline preview, append notes, edit/hold/soft-delete/restore. Deadline recalculation uses preview/explicit confirm/expiry/actor/config/task version checks. KPI migration remains dry-run; Executive presentation deferred. Full row-by-row §2 matrix, role mapping, JEV checkpoints and rollback: [parity matrix](modules/work/parity-2026-10-05.md).

| Final local verification | Result |
|---|---|
| lint / typecheck / build | exit 0; Next 16.3.6 |
| npm test | 50 files passed / 2 skipped; 203 tests passed / 12 skipped (9 PostgreSQL tests require opt-in, run separately below) |
| test:documents | 1 passed |
| Isolated PostgreSQL integration | 9 passed; actual concurrency409, replay/evidence rollback, scope denial, notes/recovery, versioned rule/override/create, preview/confirm, hold SLA, edit, calendar duplicate/stale |
| Browser | 6 passed / 1.0m; 24 screen captures, Light/Dark1440/390, axe serious-critical0, root overflow0; Staff completion notes, CSV scope, denied assignment, server SLA preview/personal creation and admin announcement/system-link submission |
| CSS / contrast | 205 files / 0 violations; 58 pairs / 0 failures |

Logs `.parity-final-*.log`, `.parity-phase3-integration.log`, `.parity-browser.log` are local ignored command outputs. Browser JSON/screenshots in docs/quality/work-parity-evidence. Additive migrations0019–0023 passed contracts and were applied only to loopback permission_next_parity_test. No application/production database migration, historical KPI writes, deployment or real-user grants. Production least-privileged RLS and business UAT are still release gates; do not infer production cutover from this local checkpoint.

JEV evidence_check supported .61 / needs_more_evidence .89; completed additional real concurrent/edit/calendar and browser checks. Phase4 continue escalate .28 / fallback_to_codex; advisory confidence weak, deterministic gates govern local completion, production claims withheld. Complete checkpoint log in parity matrix. Branch sequence codex/work-parity-phase1 → phase2 → phase3 → phase4; unrelated existing building/UX work preserved outside parity commits.

## Admin UX layout alignment — 2026-10-05–06

Branch codex/admin-layout, baseline1ed939c. Shared PageHeader + one permission-filtered section navigation; 13 bookmarkable areas rendered individually. Searchable users, collapsed account creation, readable long names; uniform token-based forms/tables/focus and mobile horizontal navigation. Audit filters stay with their results and preserve selected section/date inputs. Existing RBAC/mutation actions retained.

Final lint/typecheck/unit203passed12skipped/documents1/build exit0; CSS205files0violations, contrast58pairs0failures. Browser5passed: 52 section views (13 × light/dark ×1440/390), axe serious/critical0, root overflow0, page errors0, search/modal Esc+focus/navigation/history/Staff denial. Evidence and rollback: [Admin layout report](quality/admin-layout/README.md); 20 PNGs and final JSON in the same directory. Dev remains available on127.0.0.1:3000 with its existing isolated local fixture connection. No schema or business-data migration in this visual change. JEV health local/networkOK; continue gather_evidence .48/fallback; completed final browser/compile checks with deterministic tools.

## Main synchronization and building editor verification — 2026-10-07

ผู้ใช้สั่งให้รวมงานที่ commit แล้วและงานค้างขึ้น main. Remote baseline ตรวจด้วย fetch เป็น `6e3b7e1`; local baseline `7f794f6` มี 32 commits ที่ยังไม่อยู่ใน main. ตรวจงานค้างและบันทึกฟอร์มอาคารร่วม create/edit พร้อมเงื่อนไข ค่าใช้จ่าย ประวัติเวอร์ชัน และการตรวจสิทธิ์ฝั่ง server (`35a58be`). แก้การคัดลอก retained fee ไม่ให้ใช้ primary key ของเวอร์ชันเดิม และให้คำค้นใช้ normalization เดียวกับ search index เพื่อค้นหารหัสที่มีขีดกลางได้. ย้ายเอกสารเดิมไป SuperApp/PERMISSION_NEXT ตาม working tree โดยรักษาเนื้อหา; ไม่ติดตามไฟล์ส่วนตัว .obsidian.

แพตช์ dependency (`f835284`): sharp 0.35.5 และ source-map-js 1.2.2; npm audit --omit=dev พบ 0 vulnerabilities. ผลนี้ครอบคลุม production dependencies ตามคำสั่ง audit เท่านั้น.

ผลตรวจล่าสุด: lint/typecheck/build/documents exit 0; unit 204 passed / 12 skipped; isolated Work PostgreSQL integration 9 passed; building editor browser 9 passed (34.3s). Browser ยืนยัน create/edit/reload/search, exact decimals, metadata/external-fee preservation, duplicate/stale-version conflicts, team scope/forced-password denial, atomic rollback และ Light/Dark 390/1440 with no serious/critical axe violations. การเก็บ fixture รักษาประวัติ append-only และไม่ลบทีมที่ activity อ้างถึง. CSS 205 files / 0 violations, contrast 58 pairs / 0 failures. หลังแก้ search รัน build/typecheck/unit และ lint ของไฟล์ที่เปลี่ยนซ้ำแล้วผ่าน.

หลักฐาน: docs/quality/ux-login-evidence/main-sync-final-20261007-gates.json, e2e-results.json และ building-editor screenshots. Command logs ที่ ignored: .main-sync-build.log, .main-sync-test.log, .main-sync-editor-final.log, .main-sync-work-integration.log. JEV health local/network OK; evidence check supported .86, needs_more_evidence .65, continue_but_verify (advisory only). ใช้ผล deterministic checks เป็นข้อสรุป และตรวจ remote SHA หลัง push อีกครั้ง. ไม่มี production deployment หรือ migration บนฐานข้อมูลแอปในงานนี้; browser/DB writes ใช้ฐานทดสอบ loopback แยก. Rollback ผ่าน Git revert; ไม่มี migration ใหม่จาก editor.
