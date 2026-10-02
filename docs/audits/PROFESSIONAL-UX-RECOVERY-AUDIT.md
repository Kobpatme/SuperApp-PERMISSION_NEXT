# Professional UX recovery audit

Date: 2026-09-30
Scope: Work & KPI P0, shared shell/navigation, authorization boundaries, source-parity evidence

## Evidence reviewed

- `CODEX-MASTER-PLAN-V2.md`
- `CODEX-PROFESSIONAL-UX-RECOVERY.md`
- `docs/modules/work/source-parity.md`
- `docs/modules/work/source-ux-baseline.md`
- approved local source freeze for `MAXIWA KPI`
- current target read model, schema, actions, route pages and styles

## Findings

1. Work routes previously shared a generic queue and unknown views silently fell back to My Work. This hid missing workflows and made parity impossible to verify.
2. The target task schema did not expose the source concepts needed by Job Tracker and KPI workflows: job code, Main KPI, Sub KPI, notes and optional task weight.
3. The existing domain helpers already contained useful lifecycle, working-day, hold and weighted-report logic, but the UI did not expose those concepts as Work screens.
4. Authorization was already server-oriented, but the new screens needed explicit route-level gates and row-level checks so navigation could not become the only control.
5. Dense operational UI needed a readable table strategy, explicit empty/unavailable states and humanized status/activity text.

## Corrective work completed

- Added explicit native Work screens and strict view routing. `/work/mine`, `/work/team`, `/work/assign`, `/work/people`, `/work/tracker`, `/work/kpi` and `/work/reports` no longer resolve to a generic queue.
- Added a permission-scoped Work read model with grouped jobs, people summaries, KPI cards, status counts and weighted report values.
- Added additive task fields and migration `0017_work_source_parity.sql`; no production database was touched.
- Added audited, transactional assignment and note actions with Zod input validation, server authorization, duplicate protection and optimistic concurrency.
- Added role-aware subnavigation derived from server grants and repeated permission checks on the server route.
- Added Work-specific responsive tables, keyboard-operable controls, Thai status/activity presentation and separate unavailable/empty states.
- Added routing/presentation tests and verified the full existing suite.

## Verification

- `npm run lint` — pass
- `npm run typecheck` — pass
- `npm test` — 35 files / 108 tests pass
- `npm run test:documents` — pass
- `npm run build` — pass on Next.js 16.3.4
- local browser — public login shell visible with no console error observed; authenticated Work visual QA awaits an approved test account

## Open acceptance gates

- Apply the additive migration only in an approved local/staging database and run DB/RLS/integration tests.
- Load approved historical Work/KPI data and compare route-level output against the frozen source behavior.
- Build native holiday/KPI administration and complete Job Tracker timeline/audit drilldown.
- Replace the current bounded 500-row Work read with cursor/virtualized behavior after representative query-plan evidence.
- Run authenticated desktop/tablet/mobile browser QA and keyboard/focus checks with an organization-approved test identity.
- Keep the parity label at PARTIAL until source data, role UAT and live security evidence are complete.
