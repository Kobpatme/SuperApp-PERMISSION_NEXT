# Implementation checklist

> Historical foundation checklist. Current acceptance is tracked in [the fresh audit](repository-audit/professional-rebuild.md). Checked foundation items do not imply production verification. Current identity is local sessions; hosted-auth references are superseded by ADR-0003.

## Phase 0 — Discovery & Audit

- [x] Read master specification and repository instructions
- [x] Clone and inspect all three source repositories
- [x] Record framework/runtime/package/deployment evidence
- [x] Inspect schema/data contracts, auth, authorization, storage and workflow
- [x] Inspect tests and run available baseline suites
- [x] Create three repository audits
- [x] Create comparison matrix and reusable asset register
- [x] Create technical debt and migration risk registers
- [x] Create current data map and initial migration mapping
- [x] Define target architecture and module boundaries
- [x] Record foundational ADRs
- [x] Record non-verifiable open questions without blocking safe work
- [x] Rerun lint, typecheck, unit tests, document tests and build after dependency/documentation changes
- [x] Run production dependency scan and record the dev-tooling exception
- [x] Mark Phase 0 complete after review

## Phase 1 — Platform Foundation

- [x] Native app shell/design tokens without production legacy frames
- [x] Core user/profile/team/membership schema
- [x] Role/permission/data-scope schema and policy evaluator
- [x] Server request context and RLS context contract
- [x] Canonical Building + alias/source mapping foundation
- [x] Shared attachment metadata/provider boundary
- [x] Transactional AuditLog + ActivityEvent/outbox foundation
- [x] In-app notification foundation
- [x] Environment validation and health checks
- [x] CI: install, lint, typecheck, tests, build and dependency scan
- [ ] Authorization/RLS/integration tests

The remaining Phase 1 item requires a configured production-like PostgreSQL/Supabase instance; SQL contract and unit tests are already present.

## Phase 2 — Work & Activity

- [x] Task/manual-entry/event repository foundation
- [x] Explicit transitions, optimistic concurrency and idempotency
- [x] Activity cursor and report data contracts
- [ ] Import and reconcile legacy work entries
- [ ] Production-backed My Work, feed and reports

## Phase 3 — Automatic KPI

- [x] Versioned rule/fact/target/score/run/adjustment schema
- [x] Exact-decimal event evaluation and explainability trace
- [x] Replay and self-approval protections
- [ ] Approve real KPI rules and migrate history
- [ ] Run live calculation workers and populated KPI screens

## Phases 4–7

- [x] Guarantee workflow/finance foundation
- [x] Pricing version/snapshot/approval foundation
- [x] Scoped search, Building 360 and command contracts
- [x] Automation rule/execution/retry foundation
- [ ] Complete production-backed module UIs and workers

## Phase 8 — Migration & Cutover

- [x] Import evidence, checksum, anomaly and reconciliation control plane
- [x] Cutover/rollback runbook
- [ ] Obtain exports/mappings/approvals and execute dry run
- [ ] Reconcile, parallel-read and cut over each module

## Phase 9 — Production Readiness

- [x] Repository security headers, CSRF, logging, health and runbooks
- [ ] Live security/RLS/load/accessibility/browser tests
- [ ] Backup restore drill, monitoring/on-call and deployment rehearsal
- [ ] Production release approval
