# Core utility checkpoint

Status: **producer implementation complete for the bounded visual slice; independent QA and authenticated acceptance remain open.**

Implemented shared-token composition for account disclosure, workspace search, notifications, access denied, loading skeletons, platform error, global error, and 404. Existing actions, permissions, route names, payloads, and server boundaries are unchanged. The utility surfaces now opt into `core-utility-*` classes backed by `src/styles/ui.css`; no new theme, navigation, API, DB, credential, or auth behavior was added.

## Changed paths

- `src/components/account-control.tsx`
- `src/components/workspace-search.tsx`
- `src/components/notification-center.tsx`
- `src/components/access-denied.tsx`
- `src/components/ui/error-state.tsx`
- `src/components/ui/page-skeleton.tsx`
- `src/components/auth/auth-shell.tsx`
- `src/app/not-found.tsx`
- `src/app/global-error.tsx`
- `src/styles/ui.css`
- `src/components/core-utilities.test.tsx`

## Evidence

The targeted Playwright run used the actual production Login, Change Password, Admin, AppShell, Dialog, account/search and notification callers with only Next/server/DB/action boundaries mocked in the existing TEST fixture. It passed 3 tests: Login light at 1440px across 1440/768/390/320 checks, mobile nested user dialog at 390px, and module-unavailable/search-empty behavior. Axe checks in those exercised flows had zero serious/critical violations. Representative rasters are intentionally limited to `login-light-1440.png` and `notification-account-dialog-light-390.png`.

Observed screenshot review: no viewport overflow; the 390px dialog footer remains reachable and actions are fully visible; the desktop auth surface keeps the central blue brand panel and inset form fields. This is visual evidence for the exercised fixture, not a claim of full-browser or assistive-technology acceptance.

## Commands / results

- `npm test -- --run src/components/core-utilities.test.tsx src/components/app-shell.test.tsx src/components/ui/shared-foundation.test.tsx src/components/deposit-visual-branches.test.tsx` → **4 files / 19 tests passed**
- `npm run typecheck` → **exit 0**
- changed-file ESLint command → **exit 0**
- `npx playwright test e2e/admin-auth-unified-composition.spec.ts --grep 'module unavailable + search empty feedback|/login light: actual auth route four widths|user dialog light 390'` → **3 passed / 0 failed**

## Remaining scope

Independent QA, real authenticated Next/RSC/session/role and server persistence checks, notification read action verification against the real provider, all search stale/error combinations in a real browser, all loading/error/404 mounted boundary paths, 200% zoom/forced colors/assistive technology, and owner visual approval remain open. Existing parent-slice follow-ups and known lifecycle/navigation baselines are not closed here.
