# Current implementation status

Updated 2026-10-08. This handoff records the latest local checkpoint; it does not claim production release, real-data reconciliation or human UAT approval. Application source and repeatable tests take precedence over historical reports.

## Runtime and verification

- Next.js 16.3.8, React 19, PostgreSQL, Argon2id passwords and opaque database sessions. Optional NAS/Microsoft 365 adapters retain server-side authorization.
- Local main: PostgreSQL on port 5432, application on port 3000. Migration ledger has 28 entries after backed-up restore rehearsals; original business/account/car/session fields preserved. No historical KPI recalculation.
- Latest application verification: unit 267 passed / 41 opt-in skipped; dedicated sync/session PostgreSQL 13 passed; browser 6 passed; lint/typecheck/build and document mapping passed. These are local results, not production evidence.
- Repository cleanup was checked from staged source without environment files or generated evidence: lint/typecheck/build passed, unit 267 passed and document mapping 1 passed, using installed locked dependencies. Markdown cleanup changes documentation and Git tracking only.

## Work and KPI

Native overview, personal/team lists, assignment, people, tracker, reports and KPI workflows are implemented. Personal ownership is filtered before the 500-row limit, and personal counters use the same scoped task set. Exact-decimal calculations, versioned rules and existing status/SLA semantics remain intact. Mutation state, receipts, audit/activity/outbox commit atomically.

Visible/online refresh uses one coordinator for manual and automatic requests, pauses for drafts/modals/pending forms, and signals changes across tabs. Session creation serializes per account and displaces prior active sessions; administrators follow the same rule. Password/admin invalidation and Thai login feedback are preserved. Public health exposes build identity; deployment verification is read-only.

Local query measurements were 16 SELECTs for team and 13 for personal RSC refresh. The 500-row synthetic browser test emitted a Next Gzip drain-listener warning; it has not been established as a memory leak and no listener limit was raised. Representative production load remains unverified. See [Work contract](modules/work/parity-2026-10-05.md) and [session/refresh operations](operations/sync-session-health.md).

## Car booking

Schema/RLS, booking/return/log/cancel APIs, native calendar/admin UI, OSP reports/dashboard, durable Sheets sync, reviewed offline importer, intake pause, readiness and recovery tooling are implemented. Local main UAT activation and scoped API/browser checks passed. See [module specification](plans/car-booking-module-spec.md) and [cutover checklist](operations/car-booking-cutover.md).

The owner deferred real CSV import until the system is complete. Employee-code normalization/crosswalk and overlap rejection are implemented, but no real employee migration or role proposal has been applied. Real Sheets credentials/connection, business UAT, production hosting and legacy cutover remain pending.

## Buildings, guarantees and pricing

Native building search/map/detail/create/edit and scoped administrator deletion, guarantee workspaces and server-side exact-decimal/domain foundations are present. Operational source parity and real-data reconciliation remain partial; do not infer completed module migration from native routes. Remaining acceptance is in [module gates](modules/parity-gates.md), module source-parity matrices and [open questions](open-questions.md).

## Next release gates

Confirm production inventory/runtime credentials and database privileges; approve real data/crosswalk and KPI/financial policy; complete module parity and human UAT; run representative load/accessibility/security checks; verify Sheets and storage connections; rehearse hosting backup/rollback and obtain release approval. Use the [release checklist](operations/release-checklist.md), not historical phase reports, to authorize readiness.

## Documentation policy

Active architecture, module contracts, original unresolved business specifications, operations and release guidance remain tracked. Completed plans and historical reports remain local and in Git history. Generated quality outputs are ignored. [Documentation index](README.md) / [repository policy](operations/repository-policy.md).
