# Work overview repair — 2026-10-08

Baseline `249e174`, branch `codex/work-overview-repair`. Scope: personal Work/KPI overview `/work` and its linked personal task list.

## Findings and repair

Local main `permission_superapp_dev` had 22 migration entries: 0001–0018 and 0024–0027. Work/admin migrations 0019–0023 were missing. The read model selected absent task columns and queried absent tables, so the overview returned unavailable despite one existing task.

The personal overview filtered its list by owner but used overdue/completion aggregates across all accessible owners. ALL-scope administrators could see other users included in personal counters. Personal filtering also occurred after the 500-row limit.

Personal views now send the current owner into the query before the limit. Counters derive from the same personal task set using the snapshot clock and existing exact-decimal weighting/cancellation rules. Team views retain authorized scopes. At 500 personal tasks, the overview identifies its limited calculation window. No KPI weights, facts, task statuses or deadlines were recalculated.

## Local database recovery

A consistent PostgreSQL snapshot/custom dump remains in ignored `.data/work-overview-repair/`. A separate local clone restored all 59 tables with matching fingerprints before applying the five pending migrations. The same existing migrations then ran atomically on local main. Original task fields, KPI records, profiles/credentials and car domain records were compared before/after and preserved. Main now has 27 migration entries, one task and zero KPI facts. See [recovery](recovery.json) and [database repair](database-repair.json).

Private dump, connection details, fingerprints and screenshots stay outside Git. Retain the backup for recovery. Reverting application code leaves additive schema intact. Do not reverse with destructive SQL; restore and verify the backup in another database before any decision to replace local main.

## Verification

- Unit: 243 passed, 28 opt-in integration tests skipped. Ten new regressions cover personal counters, decimals, cancellation/empty states, deadline boundary, personal/team route scopes and forged owner filters.
- Lint/typecheck/document test passed. Baseline lint scanned ignored operational caches under `.data`; ESLint now excludes this non-source directory, matching the existing Git ignore policy.
- Headless browser on local main: overview ready, personal count matches the database query, personal list and KPI workspace ready, car API HTTP 200, mobile no page overflow, zero page errors. Temporary audited session revoked in `finally`, no domain writes. See [browser evidence](main-browser.json). Native browser connector unavailable; Playwright used instead.
- Production build passed (Next 16.3.8). Dev stopped during build to avoid generated-cache contention and restarted afterward.

Real CSV migration remains deferred. No external writes, production deployment or business UAT sign-off. Empty KPI catalog/history remains empty rather than receiving example rules. Jev health/risk consulted with sanitized metadata (risk .85, confidence .48); deterministic recovery, data comparisons and tests govern this local repair.
