# Addendum A–D implementation — 2026-10-08

Baseline `5384287`, branch `codex/sync-session-health`. Source evidence read directly from `maxiwa_KPI@588ec67` and `b62abf8` after fetching the missing objects, with earlier e759024/e11a742 context. No source checkout reset or external data write. Baseline lint/typecheck/build passed; unit 243 passed/28 skipped.

## Delivered scope

- A: serialized session issuance, additive 0028 revocation fields/constraints/indexes, seven-day tombstones, transactional count-only audit, default-true strict feature flag, Thai superseded notice, shared active-session lookup and conditional touch. Central identity access redirects invalid server actions; API boundaries return 401 and browser API clients navigate instead of retaining a stale screen. Password/admin actions preserve invalidation semantics; no administrator exemption.
- B: visible/online RSC refresh, 60-second jitter, visibility resume, no overlapping requests, bounded backoff, draft/modal/pending-form pause, signal-only cross-tab and Bangkok update time. Personal/team permissions and the 500-row limit are unchanged; no formula/status changes.
- C: ordered three-job batch, one request/receipt and **one audit per batch**, replay without extra rows, completion timestamp/version/transition/audit/button updates, conditional session touch and atomic audit-failure rollback. SuperApp intentionally differs from the source's swallowed audit failures.
- D: public short SHA/branch/build time, portable build metadata generation, health route tests, read-only deploy verifier and [operations guide](../../operations/sync-session-health.md).

## Evidence

Unit 267 passed/41 opt-in tests skipped; the 13 new PostgreSQL cases ran separately and passed on the dedicated loopback fixture. Deploy verifier 3 passed, document mapping 1 passed. Lint/typecheck/build passed; CSS 251 files/0 violations and contrast 58 pairs/0 failures. Latest browser result is stored in [browser.json](browser.json); six scenarios cover Light/Dark displacement, unauthorized old token, cross-tab batch/completion, cross-account assignment, draft/modal pause, 500-row/scroll/expanded note preservation and UI audit failure/touch throttling.

[Query evidence](refresh-query-counts.json): `/work/team` 16 SELECTs per authenticated RSC request, `/work/mine` 13. Existing React request-scoped identity cache loads shared identity/grants once rather than once per module. At 100 active users polling once per minute, the average is approximately 26.7 queries/sec for the team view or 21.7 for the personal list, excluding other traffic. This is not a production capacity benchmark. Further reductions should split task/KPI/notification read models by screen and batch lookups while retaining per-request permissions; do not introduce a cross-request authorization cache.

Local main installation: consistent snapshot restored into a separate clone with **68 table fingerprints matching** before 0028. Migration then applied on `permission_superapp_dev`; 28 ledger entries, original business/account/car/session fields preserved, no weight recalculation. [Recovery](recovery.json) and [installation](database-repair.json). Private backup/state/screenshots remain in ignored `.data/sync-session-health-install/`; retain for recovery. Tests use a different synthetic database and real CSV migration remains deferred.

Local main [browser smoke](main-browser.json) passed: overview count matches the database, personal list/KPI ready, car API 200, mobile no page overflow, zero page errors; the temporary verification session was removed. [Public health verification](health-verification.json) reports ready and matches implementation commit `4e6357ccb942`. Local dev is running on port 3000 with PostgreSQL on 5432.

Next 16.3.8 emitted a Gzip drain-listener threshold warning while rendering the large synthetic list. This has not been established as a memory leak; no listener limit was raised to hide it. An earlier browser teardown closed an in-flight stream; test cleanup now waits for refresh completion, and the final six-scenario run had no destination-stream error. These local assertions do not establish hosting readiness.

## Jev and limits

Health local/network OK, metadata_only. Auth risk request hit an advisory deterministic sensitive-operation gate before model execution; it cannot authorize changes. User-requested local implementation, fixture testing and backed-up additive local migration proceeded with deterministic checks; no production or real credential changes. Route chose router_refresh (confidence1). Evidence supported.64/needs_more_evidence.92; subsequently completed constraints, full 500-row browser and UI audit-failure checks. Final continue was attempted with aggregate test counts and scope only, but Jev's privacy gate classified that summary as raw source and blocked execution. No raw source or secrets were submitted and no opt-in bypass/repeated query was used. Codex closes the local scope using the deterministic evidence above.

No deployment, external Sheets writes, real employee migration or human UAT sign-off. Rollback uses `AUTH_SINGLE_SESSION=false` and removal of the Work refresh component; additive schema stays intact. See the operations guide.
