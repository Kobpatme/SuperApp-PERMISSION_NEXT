# Session, Work refresh and build verification

## Installation and rollout

1. Back up the PostgreSQL database and verify a restore in an isolated database.
2. Apply migrations through `npm run db:migrate`; the additive session migration is **0028**, following existing car migrations 0024–0027. Do not reuse the older migration number in the supplied addendum.
3. For production rollout, start with `AUTH_SINGLE_SESSION=false`, build and verify the running application, then enable `true` and restart. Default when omitted is true. This document does not authorize production deployment.
4. With true, a successful new login serializes against that user's profile, replaces all still-valid sessions and logs `auth.session.superseded` with only a count. Existing sessions are preserved by the schema migration itself. Administrators follow the same policy.
5. Revoked sessions cannot authenticate, update work or call authenticated APIs. Superseded browsers see a short Thai notice. Other expiry/revocation reasons retain generic expiry feedback. Password change still invalidates all old sessions and creates a replacement. Revoked records remain for seven days, cleaned on that user's next login.

Rollback: set `AUTH_SINGLE_SESSION=false` and restart; future logins permit multiple sessions. Already revoked tokens remain invalid and users can log in again. To stop automatic Work refresh, remove `WorkLiveRefresh` from the Work layout; keep server authentication checks. Leave additive columns/indexes/constraints intact. Never undo the migration with destructive SQL or restore an old database over newer business data.

## Work updates

Work overview/list/team/assignment/people/tracker/KPI/report routes reconcile through `router.refresh()` every 54–66 seconds while visible and online. Returning after more than 15 seconds triggers reconciliation. Failed refreshes back off to at most five minutes. The manual button and automatic signals share one coordinator; requests do not overlap.

Open dialogs, explicit `data-live-refresh-pause`, pending forms and unsaved input pause reconciliation. Success resets only the form that saved; unrelated drafts remain paused. Same-origin tabs receive a signal-only BroadcastChannel message on `pn-work`. Other accounts see new work on the next eligible poll. No Supabase realtime, localStorage session lock or extra auth heartbeat is used. Hidden/offline/drafting tabs discover invalid sessions when they next make a request; invalid server actions and API calls fail closed immediately.

The latest-update label uses Bangkok time without repeated aria-live announcements. RSC reconciliation retains scroll/client state, and the existing 500-row limit remains. No KPI/SLA, status or weighting rules change.

## Public build identity

`npm run build` generates public build metadata. `APP_COMMIT_SHA`, `APP_BRANCH`, `APP_BUILT_AT` take precedence, followed by available host metadata and Git at build time. npm dev/typecheck/test ensure the ignored generated JSON exists in a fresh checkout. Missing/invalid values resolve to null. Git is not invoked in a health request.

After deploying a build from a known commit:

```powershell
node scripts/verify-deploy.mjs --url https://app.example.test --expect-commit <commit-sha>
```

The check only reads public `/api/health`, verifies ready status and SHA prefix, and fails with a nonzero exit code for mismatches, missing identity, degraded status or HTTP failure. It never logs in or writes data. Compare to the commit actually used to build, not a later documentation commit. The new public fields are limited to short SHA, branch and build timestamp; configuration values, library versions and paths are not returned.

## Repeatable synthetic verification

All database/browser tests below force loopback `permission_next_sync_session_test`; they never use main as a fixture. Seed resets only dedicated synthetic accounts in that fixture. Close the test server before building again.

```powershell
node scripts/sync-session-test-db.mjs init
node scripts/sync-session-test-db.mjs seed
$env:PARITY_INTEGRATION='1'
node node_modules/vitest/vitest.mjs run src/lib/sync-session.integration.test.ts
Remove-Item Env:PARITY_INTEGRATION
npm run build
node node_modules/@playwright/test/cli.js test --config playwright.sync-session.config.ts
node --test scripts/verify-deploy.test.mjs
node scripts/measure-work-refresh.mjs
```

Fixture measurements log only SQL operation kinds, never SQL text/parameters. `PARITY_QUERY_METRICS` is honored only for the named fixture database. Capacity conclusions require a representative hosting/load test; these are local request measurements.
