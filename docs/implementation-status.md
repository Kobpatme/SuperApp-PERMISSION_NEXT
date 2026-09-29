# Implementation status

## Fresh source-parity recovery — 2026-09-29

The current target checkout is `codex/professional-workspace@3d8d281`. The previous audit snapshots `4080160` and `6ccef5b` are stale for this checkout. Approved behavioral sources are `Kobpatme/maxiwa@94742a4`, `Kobpatme/Permission_Next@afaee99`, and `Kobpatme/maxiwa_KPI@4f5fa99`; local folders and legacy compatibility routes are comparison artifacts, not source-of-truth authorities. The approved Guarantees SHA is not present in the local source object database; provisional source evidence is recorded separately and must be reconciled before declaring Guarantees parity.

Fresh matrices and acceptance gates are maintained in [Work](modules/work/source-parity.md), [Buildings](modules/buildings/source-parity.md), [Guarantees](modules/guarantees/source-parity.md), and [parity gates](modules/parity-gates.md). UX baselines are maintained beside each matrix. SP-0 documentation is substantially complete, with the Guarantees baseline limitation open. Security hardening is the active implementation checkpoint; no module is declared migrated yet.

### Fresh deterministic baseline

- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm test`: 27 files / 87 tests passed
- `npm run test:documents`: pass (1 test)
- `npm run build`: pass (Next.js 16.3.4)
- `npm audit --omit=dev`: 0 vulnerabilities
- Target commit used for this baseline: `3d8d281`
- JEV health: local and network checks passed; the subsequent `jev_continue` request was unavailable because the TypeSafe hostname could not be resolved at that moment. Deterministic evidence remains authoritative.

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
