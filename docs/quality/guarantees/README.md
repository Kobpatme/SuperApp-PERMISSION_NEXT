# Guarantees unified composition — producer evidence

**IMPLEMENTED; client-fixture verification only. Independent QA and authenticated acceptance remain OPEN.**

Repository: `D:/WebApp/SuperApp PERMISSION_NEXT`, HEAD `62ed9ee4048481abd036ed1ea4853caad316a5ed`. The shorter `D:/WebApp/SuperApp` does not exist. Pre-existing dirty Overview/Work/Buildings/Car Booking/Admin/registry/Duct/schema/legacy work was retained. No reset, stash, commit, deployment, credentials, database seed or production mutation.

## What changed

- Existing mounted native Guarantees CSS now consumes current tokens for restrained raised outer panels, flat financial/data sections, inset fields, Thai typography, touch controls and light/dark composition. Archived HTML/public CSS were not edited.
- List/dashboard/report actions use the existing shared PageHeader slot. Search, all existing status/owner/area filters, sorting, pagination, exports, analytics return context and query dispatch remain. Disabled creation has visible explanation; clipboard failure gives feedback rather than an unhandled rejection.
- New/detail forms use grouped flat fieldsets, primary save footer and controlled text/select drafts. Client submit snapshots the same FormData and invokes the same action inside startTransition; React's automatic action-form reset had reset select DOM despite retained React state and a reset guard. Browser regression demonstrated the failure before this fix and verifies retained values plus exact decimal strings/version on retry. Server validation and action implementations are unchanged.
- Shared ConfirmDialog is used for current transitions and unsaved **Back to list** intent. Pending locks Escape/close/actions; rejected transitions retain reason and dialog; successful transitions clear reason and request the existing refresh. TL controls derive the exact existing target set. No workflow targets or policy were added.
- All seven evidence slots retain private endpoint/kind/version contracts. Pending locks file selection; failed upload retains the selected file; success clears both React and native input so the same file can be selected again.
- Readonly progress is keyboard-scrollable; dark CID contrast is corrected. Report tables are focusable scroll regions; chart months have touch-sized scrollable screen controls. Print keeps all twelve months within the chart and hides the non-report skip link; report content/formatter/calculation logic is unchanged.

## Executed gates

| Gate | Actual result |
|---|---|
| `UX_EXTERNAL_SERVER=1 npx playwright test e2e/guarantees-unified-composition.spec.ts --reporter=list --output=test-results-guarantees` | exit 0; **72 passed**, 0 skipped (`browser.log`) |
| Same fixture `-g 'new light:|new dark:|manager light:|manager dark:|new form:|manager form:'` | exit 0; **6 final form rechecks passed** after explicit primary-save variant (`form-final.log`) |
| Same fixture `-g 'original formatter'` | exit 0; **1 final print/CSV recheck passed**, including print chart bounds/hidden skip link (`print-final.log`) |
| `UX_EXTERNAL_SERVER=1 npx playwright test e2e/navigation-theme-focus.spec.ts -g 'native Dialog' --reporter=list --output=test-results-guarantees-dialog` | exit 0; **3 passed** (`shared-dialog.log`); initial timing-race attempt failed one test under concurrent execution, unmodified isolated rerun passed |
| Targeted Vitest: deposit-unified, deposit-workspace, deposit-visual-branches, deposit-v2-domain, guarantee-view-model, guarantee-domain, guarantee-storage | exit 0; **47 tests / 7 files** (`units.log`) |
| `npx tsc --noEmit`; changed TS/TSX `npx eslint ...` | exit 0; final source and fixture |
| `node scripts/check-css-quality.mjs`; `node scripts/check-contrast.mjs`; scoped `git diff --check -- ...` | exit 0; **389 files / 0 CSS violations**, **60 contrast pairs / 0 failures** (`gates.log`) |

There are **22 inspected representative PNGs**, **127 zero-violation full-page WCAG axe JSON files**, **2 actual TEST CSV files**, and **1 actual Chromium TEST PDF**. Verification inventory contains exact absolute paths/bytes and executable commands. The 6/1 rechecks are repeated coverage, not additional unique functions or proof of a second full-suite run.

## Current route/function/state matrix

| Surface | Exercised current native behavior | Responsive / state coverage |
|---|---|---|
| `/guarantees` | dashboard, queue, list, on_service, done, analytics; personal assigned/owned figures, financial summaries, evidence/follow-up labels and links | Each of six views: light/dark × 320/390/768/1440; full-page axe and no document overflow |
| Query entry | `view=installation-team`, `team=TEST-team` passed unchanged to mocked reader, two current TL tabs, analytics return; `preview=1` development-only branch | Installation-team light/dark × four widths; query dispatch and preview tested separately |
| List functions | search/empty/clear, combined status/owner/area, ascending/descending NO sort, export month/year, failed clipboard feedback; 25 TEST-record paging, keyboard `/`, Enter row navigation, export across pages | Actual handlers and downloaded register CSV; light/dark hover and focused-link axe checks |
| `/guarantees/new` | current fields/assignment, exact monetary strings, validation-bearing form controls, pending, failure draft retention, retry, success navigation, unsaved Back confirmation | Light/dark × four widths; failed/retried operations at dark 390; denied/loading route branches |
| `/guarantees/[id]` manager | existing edit fields, financial sidebar, history, seven evidence kinds, transition reasons and target controls | Light/dark × four widths; failed/retried edits; retained drafts and version payload |
| Same detail readonly | existing data/evidence-presence/finance/refund/history/progress display; no domain editor/upload | Light/dark × four widths, keyboard progress scrolling; fixture role projection only |
| Same detail assigned TL | two allowed evidence slots, job metadata and exact accept/send-back/complete targets; no financial editor | Light/dark × four widths; `tl`, `On Process`, terminal `done` branches |
| Workflow controls | All **19 existing manager targets across 9 status values**, plus **3 TL target controls**; terminal done/Cancel states | Each manager target: Escape/focus return, held pending, rejected result, retained reason, retry, exact target/id/version; no real financial/destructive writes |
| Evidence | All **7 kinds**: existing-link href, pending lock, mock failure/file retention, success clear, same-file reselect | 14 mock POST attempts, unchanged multipart version; no storage/provider validation claim |
| Reports | area/owner filtering, selected chart month, monthly disclosure, original formatter CSV, original print control | Full view matrix; real TEST download bytes and A4 landscape Chromium PDF, twelve-month print bounds |
| Dialogs/tooltips | Unsaved Back and transition confirmation; long Thai title shared tooltip focus/Escape | Each dialog intent light/dark × four widths with bounds/footer/focus/axe. Long-title tooltip at dark 320. Error cancellation screenshot at dark 390 |
| Source feedback | main empty/unavailable/not_configured/truncated/denied/readonly/loading; new/detail denied/loading | Main feedback at dark 390; source-state combinations are not exhaustively cross-multiplied |

Visual review included approved Car Booking composition as local product reference, final list, mobile dashboard/report, desktop/mobile form, readonly/TL families, confirmation/error/discard and final primary-save footer. Browser findings corrected: dark row-hover link contrast, readonly CID contrast, keyboard overflow regions, action-slot width, native-select reset, short chart hit targets, narrow dialog header, and print chart clipping/skip-link leakage. Responsive checks wait for finite CSS transitions before measuring settled geometry; no overflow/axe waiver is applied.

## Boundaries and remaining OPEN gates

- The fixture imports **all three actual route functions**, production components, AppShell, complete root CSS import order and bundled fonts. Only server readers/actions/access and Next navigation/link boundaries are mocked. Every screen visibly says TEST. This is not authenticated Next/RSC/session integration, server RBAC/data-scope proof, a database, a provider or real refresh reconciliation.
- No server business/auth/grant/schema/API/storage/financial helpers were modified. Monetary input strings and material action payload names/version are preserved. Financial reconciliation, concurrency/idempotency/audit and actual server validation remain OPEN.
- Register/report CSV and PDF contain synthetic records only. They prove the original client formatters/print path execute, **not authorized production exports, bank totals, private evidence bytes or storage access**. The report retains original source wording such as “ข้อมูลระบบจริง” inside its report body; the surrounding printed TEST banner identifies this fixture as synthetic.
- Existing upstream source parity remains provisional: approved `maxiwa@94742a4` was unavailable per `docs/modules/guarantees/source-parity.md`. Current upstream HTML has broader bulk/delete/Off Service/modal features not mounted in these three native routes. **No dummy bulk/delete/off-service popup or approval rule was invented, and those parity gaps are not closed.**
- Unsaved confirmation covers the editor's explicit Back action, not shell navigation, breadcrumb/back-history interception or browser unload. Native OS file/date picker UI, all tooltip placement permutations, full assistive technology/200% zoom, real loading/refresh/version reconciliation and exhaustive state × role × breakpoint combinations remain OPEN. New-route missing-DB branch and notFound integration were not separately exercised in this fixture.
- Full repository suite/build were not rerun in this bounded no-DB slice. Previously reported manifest/lifecycle/Button-attribute/renewal-navigation/tracking-hook failures remain OPEN. Independent QA/owner visual approval is still required; this checkpoint is not QA PASS, complete source parity, release readiness or whole-system completion.
