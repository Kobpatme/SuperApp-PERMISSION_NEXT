# Approved system review fixes — 11 November 2026

Baseline: `675d964`. Owner approved implementation of the eleven findings in the preceding review. Changes are local source changes, not a production release or a claim of complete enterprise security/performance certification.

## Implementation

1. Legacy Work reports now use the same report/read scope intersection as the canonical route. Permission checks precede data loading; assignment checks its own capability.
2. Duct detail editors guard tab navigation, Core/sidebar links, browser Back, reload and closing while dirty or saving. Confirming discard is explicit; pending writes block navigation. Existing modal guards remain.
3. Work reports aggregate the full authorized filter in PostgreSQL using exact decimal weights. Report rendering no longer loads the 500-row task/history/KPI model. Team filters derive from the same full scope.
4. Guarantee list/search uses server-returned pages of 20 with full-filter totals. Export walks all authorized keyset batches at one repeatable-read snapshot; the old 500-row UI limit no longer limits export/search. Existing domain rules remain the calculation authority. Year/month filters and CSV formula neutralization are preserved.
5. Global search queries each enabled/authorized module directly; it no longer searches a truncated dashboard snapshot. Work, Buildings, Guarantees, Car, PO and Duct have providers. Individual failures return a partial state, not private driver details.
6. Search results retain module-specific detail URLs. Providers are interleaved so one module cannot consume all twenty displayed results. Car results currently open its calendar workspace, not a booking-specific detail view.
7. Work dashboard/search reads only queue fields in one task SELECT. Multi-module API search explicitly shares one verified identity/module-state fan-out; it does not depend on RSC cache behavior. Report reads use two domain SELECTs. Regular Work detail/history loading remains separate from these lightweight paths.
8. Buildings renders its first 200 map records without waiting for ten thousand. Subsequent batches are fetched after paint, with abort/error/continuation handling and a visible ten-thousand scope cap. List pages use at most 100 records. Conditions load only the latest version. This is progressive full-scope loading, not a viewport/tile server redesign.
9. Session infrastructure failures throw a distinct unavailable error. API identity returns 503 with retry guidance, not 401/expired, and does not clear the session cookie or fail open.
10. PO Excel no longer locks both whole tables. Sorted per-PO advisory locks coordinate online manual/Excel writers; parent-row locks stabilize receipt quantities. The offline importer takes the exclusive maintenance gate. Online lock waits are bounded. Manual creation/key changes reject duplicate PO/material keys; existing imported ambiguous rows are preserved.
11. GitHub/GitLab CI explicitly run PO importer/service/Excel tests using disposable, freshly migrated databases. A dedicated fixture URL and loopback/name guards prevent fallback to an ordinary app database. Existing staging-clone tests remain available.

Additional build correction: attribute-scoped Duct heading styles were moved from a CSS Module into a module-owned global sheet, preserving selectors while resolving webpack's pure-selector build rejection. Contract tests read the actual new sheet.

## Repeatable checks

- `npm test`, `npm run typecheck`, `npm run lint`, `npm run check:css`, `npm run check:contrast`.
- `npm run test:documents`, `npm run test:deployment`, `npm run test:po:import`.
- `node scripts/system-review-test-db.mjs`: isolated clone, 620 tasks and 620 guarantees; full aggregates, report scope intersection, old-record search, stable equal-timestamp pagination, and task SELECT counts. Never use a production URL.
- `npm run test:po:db`, `npm run test:po:excel`: isolated clone; receipts, unknown prices, audit rollback, stale previews and concurrent import. The added Excel case proves confirmation can complete while an unrelated receipt writer holds a RowExclusive table lock.
- Set `PO_TEST_DATABASE_URL` to the explicitly named disposable loopback fixture target `permission_next_po_test` to exercise fresh migration setup. No existing fixture target is overwritten; unique per-suite databases are created and removed.
- `node scripts/system-review-browser-fixture.mjs`: loopback port 3215, synthetic 620-row API boundary, actual guarantee component/hook. This verifies interaction, not production styling or authenticated end-to-end behavior.
- Production build uses a separate `.data/system-review-build-20261111` snapshot with no environment files/credentials and shared installed dependencies: `npm run build -- --webpack`. Does not replace the normal dev build/cache.

## Verified evidence and limits

Isolated PostgreSQL checks verified 620-task totals (including cancellation/weight handling), OWN report scope with ALL task-read scope, complete guarantee pagination, and denial of another owner's guarantee search. Domain task reads: two SELECTs for a full report and one for queue/search (excluding driver type discovery).

Browser interaction fixture verified total 620, 31 pages and finding synthetic record 619 that is absent from the initial 500-row props. Actual PostgreSQL data paths are verified separately by integration tests; fixture API responses are synthetic.

PO service 13 cases and Excel 9 cases passed on isolated staging clones; the 9 Excel cases also passed with fresh-migration fixture provisioning. System-review PostgreSQL 4 cases passed, including two domain task SELECTs for report aggregation and one for queue search. Document mapping 1, deployment configuration 4, importer/ledger 21 passed.

Final main-suite checkpoint: 6,681 passed, 92 skipped (140 files passed, 8 skipped). Opt-in database suites are deliberately skipped by the default command and were exercised separately as stated above. Lint/typecheck, CSS quality (434 files), static contrast (62 pairs) and isolated production webpack build passed. The final SQL text prefilter was additionally rechecked against the isolated PostgreSQL suite; queries remain parameterized and authorization-scoped.

No production data, accounts, grants or schema were changed. Disposable test clones were removed by their validated cleanup. Existing backups, workbook files and unrelated diagnostic scripts were preserved. No commit/push/deployment or normal-app restart is implied.

Remaining operational acceptance: actual Linux GitHub/GitLab execution, authenticated browser UAT across every role/module, external integrations, representative 100-user load and latency/memory measurements. Guarantee financial summaries still evaluate the existing domain functions over the full authorized snapshot on the server; very large datasets need measured SQL aggregate/index work. The personal/executive guarantee dashboard remains explicitly labelled when based on the latest 500 records. Do not present that dashboard as a full-history financial report.
