# Permission Out — repeatable verification

Checkpoint: 2026-11-12; branch `codex/permission-out-module`. Synthetic fixtures only. Default-disabled, no main application database changes or deployment. [Contract and release gates](../../modules/permission-out.md).

## Current owner-approved split (supersedes combined UI below)

The initial combined six-tab/form-first UI was rejected by the owner. Current acceptance is two separately registered map-first modules: `/permission-out` and `/site-facility`, separate API resource allowlists/capability namespaces/module enablement, owning-domain dataset RLS and no grant copying. Both compose canonical `src/styles/ui.css`/Core primitives; no active `workspace.module.css` import. Source read evidence: `Permission_Out.html` module switcher/left-tools/right-map/detail drawer and `mod2.html` independent sidebar/map/search/modes. The earlier checkpoint below is historical, not proof the rejected UX matched source.

Corrective checks: module registry uniqueness and separate entry capabilities; route API rejects site resources and vice versa; legacy route-side site/OPEX grants do not confer MOD 2 rights; independent module disablement; dataset-kind administration; direct SQL site-row denial without site-read capability; immutable dataset identity. Browser adds map-before-analysis, route selection/drawer/Escape/focus return, marker-to-authorized-detail, explicit MOD 1 overlay and canonical control/Canvas-theme checks. Province overview and customer-weighted circles are approximate adaptations, not source cluster/heat parity.

The split baseline was 6,711 passed / 102 opt-in skipped at HEAD `5e2edcc6917af6bfcb1ef5382f2ec617d4d9476d`. Corrected suite is 6,714 passed / 103 opt-in skipped; a separate disposable PostgreSQL + authenticated production Next run passed 11 cases. Full component browser matrix passed 38 cases (390/1440, light/dark, 8 view variants, keyboard/recovery/map interactions). Final reruns use `.data/permission-out-split-final-*`; see the final refresh note for the latest build. Lint/typecheck are clean; document 1, CSS 454 files/zero violations, contrast 62 pairs/zero failures, and diff whitespace check passed. Windows line-ending warnings are not whitespace errors. CI has not been observed, configured business databases were not migrated, and human UAT is still pending.

Historical and current logs/screenshots are ignored local evidence, not clean-checkout requirements. Browser tiles are blocked on purpose; maps still render vector geometry and controls over the no-tile fallback. Component fixture APIs are synthetic; actual auth/API/SQL verification is a separate suite. Existing Next/Zod dependency-audit release blockers are unchanged.

Final refresh: build `.data/permission-out-build-V7xm5s` contains the map-detail focus/Escape return, disambiguated zoom controls and live Canvas-theme repaint. `.data/permission-out-split-final-unit.log` records 6,714/103, `split-final-ui.log` records 38 passed including live Light/Dark Canvas changes, and `split-final-build.log` records successful production build. `split-final-db.log` is the separate 11-case acceptance against the latest build. Typecheck/lint logs are `split-final-typecheck.log`/`split-final-lint.log`. Source/script fixture metadata remains synthetic, not user UAT. Jev risk explicitly did not authorize migrations; only disposable fixture databases were changed under the user's approved local implementation scope. Its evidence check is advisory, not proof or release approval.

## Commands

```powershell
npm test
npm run typecheck
npm run lint
npm run test:documents
npm run check:css
npm run check:contrast
node scripts/permission-out-build.mjs
node scripts/permission-out-test-db.mjs --build '<absolute isolated build path printed above>'
node node_modules/@playwright/test/cli.js test --config playwright.permission-out.config.ts
npm audit --omit=dev
git diff --check
```

Build script copies source into a fresh ignored `.data/permission-out-build-*`, omits application env/credentials/data, links installed dependencies and runs production webpack without touching the running app's `.next`. Native geometry/export workers are explicitly traced into the deployment output.

Database runner initializes its own loopback PostgreSQL cluster if portable binaries are available, or accepts explicit `PERMISSION_OUT_TEST_OPERATOR_URL` on loopback (CI service). The suite creates a uniquely named database from template0 and applies all migrations, never clones production/customer data. It creates synthetic identities/scopes and constrained runtime sessions; its finally blocks drop only its own database and stop only its own cluster. CI workflow includes the database and component-browser suites but CI execution was not observed locally. Generated local fixture/build directories are ignored and retained, not deleted by this task.

## Shared field correction — 2026-11-13

The map `Field` now opts text inputs, selects and textareas into the existing Core `ui-field-control ui-building-field` classes, preserving existing control classes and native file/checkbox/radio semantics. The map toolbar uses the same field helper; datalist-backed filters and site dialogs are included. Central CSS retains native multi-row listbox height instead of forcing 44px. No new module skin, API/schema changes, grants, data import or deployment.

Fresh commands: `npm test` (6,727 passed / 103 opt-in skipped), `npm run test:permission-out:browser` (40 passed), `npm run typecheck`, targeted ESLint for the changed TS/TSX files, `npm run test:documents` (1 passed), `npm run check:css` (455 files / 0 violations), `npm run check:contrast` (62 pairs / 0 failures), `node scripts/permission-out-build.mjs` (isolated `.data/permission-out-build-4uaTzZ`) and `git diff --check`. Browser checks compare computed appearance against same-native-type Core reference controls in both themes for enabled/focus/invalid/disabled/readonly states, ensure every displayed text control opts in, preserve multi-select height and excluded native controls, and cover site-dialog inputs/textarea. Existing 390/1440 screenshots were regenerated; mobile dark analysis and desktop light site screenshots were visually inspected. Tile requests remain blocked by the synthetic fixture.

The initial comparison incorrectly used an input reference for a select (native cursor mismatch); the test was corrected to use the same element type, then all 40 cases passed. The sandboxed initial fixture lingered at teardown; only its verified process was stopped, and the approved rerun exited normally. Final full `npm run lint` also exited 0; the existing local dev login at port 3000 returned HTTP 200. Ordinary local dev and business databases were not stopped or migrated. These are local component checks, not real-data UAT; prior release blockers remain.

## Evidence and limits

- Geometry/import/domain/export/API/composition unit fixtures cover New/Same/Remove, reversed/disjoint/partial overlaps, 90% dedupe, exact fees including zero poles, headers/coordinates, XML/archive rejection, redaction, selected exports and CSRF host/scheme checks. Source upstream CSV pairing and filtered-summary scripts were also run at the pinned SHA, including multiple/reverse/crossing/disjoint/trim fixtures.
- Disposable PostgreSQL acceptance: 10 tests with immutable rows/formulas/snapshots, audit-failure rollback, idempotency/input digest, publish contention/rebase, per-version site/OPEX edits, scope isolation and TEAM formula access. The tenth starts the production-built Next app on a random loopback port, uses synthetic Core sessions with a constrained SQL login, analyzes an uploaded KML through UI/API, downloads KML, views sites and verifies ordinary-reader module denial/OPEX redaction. This is an authenticated smoke test, not all-screen end-to-end or user acceptance.
- Component browser fixture: 26 tests across six views at 390/1440 widths, light/dark, axe serious/critical checks, keyboard/focus and validation recovery. Components/CSS are real; router/API responses are synthetic, mutations intentionally reject for recovery tests, external tiles are blocked. Screenshots `.data/permission-out-<view>-<width>-<theme>.png`; real Next screenshot `.data/permission-out-real-sites.png`.
- Full-suite checkpoint before the final export/hierarchy regression addition: 6,709 passed, 102 opt-in skipped. Standard-suite skips are not evidence of DB execution; the separate 10-test suite is required. Final verification results are recorded in the handoff below.
- Earlier local CSS check: 447 files, zero violations; static contrast: 62 pairs, zero failures. Automated axe/static checks are not WCAG certification.

Ignored evidence logs: `.data/permission-out-final-all.log`, `permission-out-final-ui.log`, `permission-out-final-acceptance.log`; final refresh uses `permission-out-handoff-*`. Paths are local generated artifacts, not required by a clean checkout.

### Final refreshed local handoff

Full suite: **6,711 passed / 102 opt-in skipped**, including 30 module/composition unit fixtures (native worker pair-specific trim and hierarchy/selected export regression included). Separate constrained-role database/production-Next suite: **10 passed**, including CSV, source CSV, trimmed CSV, KML and KMZ HTTP exports. Isolated production build: `.data/permission-out-build-wnEa79`; traced standalone output contains `analysis-worker.mjs`, `geometry.mjs` and `source-export.mjs`. Typecheck/lint/document mapping/CSS/contrast and `git diff --check` passed; Git emitted only Windows line-ending warnings.

Browser case results: **26 passed**; on Windows the sandboxed runner lingered after the cases in web-server teardown, so only its verified synthetic fixture process was explicitly stopped. This teardown limitation is separate from test-case results. PostgreSQL initdb initially failed in the sandbox; rerun with approved local process permissions passed all 10 cases and cleaned up its own database/cluster. No application service was stopped or restarted. Jev advisory requested more evidence; it was not treated as a correctness certificate or release authorization. The deterministic checks above support local handoff only; outstanding release gates below remain unchanged.

## Release blocker: existing dependency audit

`npm audit --omit=dev` reports two affected production packages: existing Next.js 16.3.8 (critical findings) and Zod 3.x (high). The new XML dependency is pinned to 0.9.12 rather than the vulnerable/deprecated source version. No force upgrade or breaking Zod migration was made. Next and Zod findings must be resolved before activation/release; exploitability of this deployment was not established by the audit alone.

Primary advisories include [Next Image Optimization SVG/sharp vulnerability](https://github.com/advisories/GHSA-2464-fhr4-w9xw), [Next Server Actions DoS](https://github.com/advisories/GHSA-p3m5-59mp-jv5r), [Next use-cache vulnerability](https://github.com/advisories/GHSA-673q-mjm6-r5xr) and [Zod constrained collections memory exhaustion](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). Recheck current advisory constraints during the separately approved upgrade.

Outstanding: real-file dry run/reconciliation, approved formula and PEA crosswalk, ownership/license confirmation, full deployment configuration/restore rehearsal, 100-user load tests, human UAT and independent review. Do not describe this local implementation as production-ready or complete source parity.
