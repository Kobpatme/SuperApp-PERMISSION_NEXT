# Work/KPI composition checkpoint — client fixture, NOT QA closure

## Outcome and boundaries

Implemented Work-owned presentation across the **nine mounted routes**. Existing `WorkScreenShell` callers now opt into `work-composition.module.css`; the dedicated `/work/mine` composition imports the same owner while retaining its list module. Core tokens remain the only palette/depth source. No Overview CSS, shell, shared Dialog implementation, auth, grants, server actions, read models, KPI/SLA calculations, database or route policy were changed by this producer.

The substantial composition changes include header separators, compact raised metric strips, raised outer/flat inner panels, inset search wells, flat responsive list data, labelled people performance, three-column people statistics, expandable tracker hierarchy, corrected status alignment, native KPI progress plus unchanged exact numeric text, flat KPI evidence scrolling, readable report follow-up rows, grouped create/assignment fields and consistent task command forms. The existing create/assignment state, reset epochs, submission restoration, signals, handlers, names and form ownership are preserved; their only direct edits are presentation copy/legends.

Task actions now use the existing shared `Dialog` and `Button` rather than their own native-dialog lifecycle. Existing actions, capabilities, transitions, required reasons, Open PR fields, version/idempotency keys and owner/rule/date fields remain. Success closes after the real action result; pending suppresses dismissal; failed commands retain the submitted correction draft. Cancel remains the existing explicit discard behavior for task commands (there was no task-command unsaved guard). The separate create dialog retains its existing dirty-confirmation owner.

## Reference and visual inspection

Read AGENTS, master-plan constraints, current design-system document and migration specification first 300 lines plus targeted Work/view/overlay rows. Inspected the actual Overview light raster to retain corporate blue, readable Thai, restrained raised outer panels and flat data. Figma `AFiYS0OB93glB6at2o3Vnr` frame `2:4` screenshot was retrieved and inspected; frame `2:7` failed twice with MCP SSE-stream errors. No editable-token extraction or exact-match claim. Product adaptation uses existing tokens, not the reference lavender.

Producer inspected final dashboard/list/team/assign/people/tracker/KPI/reports/create and mobile task/create captures. Iterations fixed: dark Work eyebrow/disclosure contrast, keyboard-inaccessible KPI horizontal scroller, vertically split tracker metadata/status, separated KPI value/unit, oversized single-person card and an actual off-screen mobile create modal. The modal defect came from legacy `modal-scale` replacing shared Dialog's centering transform; a Work-scoped opacity-only animation now preserves canonical shared geometry. Bounds and scroll-to-submit reachability are asserted.

## Nine-route/control/state inventory

All rows were exercised with actual imported **route page functions**, real production components, AppShell, root CSS in import order and bundled fonts; server/Next boundaries alone are explicit TEST substitutes. Source-derived TEST values never represent live data. Async WorkRoutePage is awaited at the fixture boundary, not rendered as a fictitious client server-component.

| Route | Exact existing composition reused / presentation delta | Browser controls and states actually checked |
|---|---|---|
| `/work` | `MyWorkDashboard`, WorkMetricStrip, WorkTaskTable, WorkTaskDetail, activity and create/ConfirmDialog; Work shell/module presentation | Ready/empty/unavailable/denied client branches; task record detail; create open, dirty cancel, discard, focus return, modal bounds, footer reachability; all task status families represented |
| `/work/mine` | `MyTasksWorkspace`, existing summary/count/list toolbar, WorkFiltersForm, WorkTaskTable, local paging/sort; raised panel and shared Work composition | Search/disclosure; year/month/status/team/source controls; reset href; actual title sort, next page (2 rows), size 25 (12 rows); ready/empty/unavailable/denied; responsive cards preserve data/actions |
| `/work/new` | Existing `WorkCreateForm` under WorkScreenShell; labelled field group/guidance and responsive action alignment, no state rewrite | Team/Main/Sub KPI/jobs/notes; deferred preview and submit; pending input disable; preview retains draft; failed submit retains fields; success resets; denied. Empty/unavailable source still renders the existing form — OPEN source guard, not claimed fixed |
| `/work/team` | Existing `TeamCommandScreen`, WorkMetricStrip and WorkTaskTable; shared header/metric/list-panel composition | All common filter controls/reset href, table actions/source status variants, ready/empty/unavailable/denied. Existing assignment/people/tracker destinations retained, not replaced by invented team rules |
| `/work/assign` | Existing `AssignmentCenterScreen`, TaskKpiFields and form-action footer; grouped fieldset + shared Work panel composition | Team/assignee/title/Main/Sub/jobs/notes; common filters; deferred preview, pending disable, failure retention, retry-success reset; ready/no-assignee/unavailable/denied; prior dynamic KPI-field regression retained |
| `/work/people` | Existing `PeopleOverviewScreen` metrics and cards; labelled unchanged weighted result, bounded card grid, six flat stats | All common filters/reset href; person tracker link preserves owner query; ready/empty/unavailable/denied; mobile score/card reflow. No new performance calculation |
| `/work/tracker` | Existing `JobTrackerScreen` local query/group disclosure, task history/details; inset search and flat group hierarchy | All common filters/reset href; actual local matching and filtered-empty; expand group and history-summary availability; ready/empty/unavailable/denied; mobile metadata/status. Existing owner filtering retained, not separately authenticated |
| `/work/kpi` | Existing `KpiWorkspaceScreen` assignments, cards and facts; native progress, flat rules, readable value/unit and focusable evidence region | All common filters/reset href; existing exact target/actual/progress/weight/date/facts; native progress value; technical disclosure/table; ready/empty/unavailable/denied; light/dark/mobile; no formula changes |
| `/work/reports` | Existing `WorkReportsScreen`, WorkReportTools, metrics/status distribution; raised report columns and flat follow-up values | All common filters/reset href; existing CSV URL and print control present; ready/empty/unavailable/denied; mobile reflow. CSV file bytes/real print output remain OPEN, not tested by intercepting a fake export |

### Additional actual branches and overlay intent map

- `/work?view=mine,mine-list,team,assign,people,tracker,kpi,reports,activity,due`: all ten actual dispatch branches rendered their expected h1; record detail was tested independently. No dispatch or security-policy edits.
- Queued accept and blocked resume: successful deferred action, close and exact task/version/target payload. In-progress hold: required reason, pending Escape suppression, error feedback and retained reason. Complete: Open PR fund number/amount controls and precision preserved. Cancel, edit and delete: each named shared dialog opens and returns focus via Escape; all existing edit fields checked. Note: pending and successful feedback checked. Read-only detail exposes no mutation controls.
- Styled create: dirty draft cancel/discard, focus trap, return focus, bounded mobile overlay and reachable lower submit. Existing deferred suite additionally exercises failed submit, repeated success, preview/submit pending, controlled assignment reset and dynamic conditional fields.
- Close-button/backdrop/StrictMode/rejected-beforeClose behavior is exercised by the unchanged shared Dialog regression suite. This is not a claim of every task intent being server-authorized or every failure being exhaustively simulated.

## Actual verification

All commands were run from `D:/WebApp/SuperApp PERMISSION_NEXT`. No test server, DB seed, live mutation or security bypass was used; `UX_EXTERNAL_SERVER=1` skips the unrelated default DB-backed webServer for these entirely intercepted client fixtures.

| Command | Exit / result |
|---|---|
| `npx playwright test e2e/work-unified-composition.spec.ts --reporter=list,json --output=docs/quality/work/playwright-output` | **0: 71 passed, 0 skipped/flaky** (the original 70-case fixture matrix plus one rendered-pair regression). All nine dark routes now pass full-page axe; no waiver, skip, or weakened assertion |
| `UX_EXTERNAL_SERVER=1 npx playwright test e2e/work-create-dialog-regression.spec.ts --reporter=list` | **0: 5 passed** |
| `UX_EXTERNAL_SERVER=1 npx playwright test e2e/navigation-theme-focus.spec.ts --grep 'native Dialog' --reporter=list` | **0: 3 passed** |
| Targeted Vitest: features/work, work-route-page, work-overview/domain/query/task-policy/view/page-data/presentation and shared-foundation | **0: 14 files, 54 tests passed** |
| `npm run typecheck` | **0** |
| Changed TS/TSX ESLint (7 production files + new fixture) | **0** |
| `npm run check:css` | **0: 386 files, 0 violations** |
| `npm run check:contrast` | **0: 60 configured pairs, 0 failures**; includes the semantic `brand-mark/brand-soft` pair |
| `npx playwright test e2e/work-unified-composition.spec.ts --grep 'shared shell brand mark' --reporter=list` | **0: 1 passed**; rendered light/dark computed-style pair asserted at 4.5 minimum |
| `npx vitest run src/components/ui/shared-foundation.test.tsx src/components/module-nav.test.tsx src/components/overview-composition.test.tsx` | **0: 3 files, 30 tests passed** |
| `git diff --check` | **0** |

27 full-page axe snapshots are retained for desktop light/dark and mobile light across all nine routes; all 27 now have zero violations. The additional Work-only scan is asserted zero in each of those same 27 browser cases. The rendered brand-mark ratio changed from **3.1663213451647927** (`#3B82F6` on `#173A5E`) to **8.195618412336652** (`#BFDBFE` on `#173A5E`); light is **7.149175584004714** (`#1E40AF` on `#DBEAFE`). Task-dialog scans have zero violations; measured primary-action hover ratios are recorded in `dialog-contrast-light.json` and `dialog-contrast-dark.json` (5.168555560022562 and 7.021859543278343). All nine routes additionally pass 320px document-overflow assertions. 390px/1440px are the principal visual matrix; real 200% browser zoom remains OPEN.

Evidence stays in this directory: final `composition-browser.log` / `composition-results.json`, regression/unit/typecheck/ESLint/CSS/contrast/diffcheck logs, 27 `axe-*.json`, two dialog contrast snapshots and **16 PNGs**. Desktop light route captures are `work-light-1440.png` and `work-{mine,new,team,assign,people,tracker,kpi,reports}-light-1440.png`; representative additional captures are KPI desktop dark, new/people/tracker/reports mobile light, create modal mobile light and task error dialog mobile dark. `composition-artifacts.json` records exact absolute producer-file paths/sizes and screenshot paths.

## OPEN / cannot certify

- Shared-shell dark brand-mark contrast is fixed at the canonical AppShell consumer with a dedicated semantic token pair; the rendered regression and all 70 original Work fixture cases pass. Independent QA and owner approval remain required.
- Authenticated session/roles, actual server filtering/read refresh/loading, actions against real authorized data, conflict concurrency, exports/download bytes, print output, full screen-reader review, actual browser zoom and production shell acceptance remain OPEN. Fixture denied/readonly cases are UI branch checks only.
- Source guards: `/work/new` still lacks an unavailable-source presentation guard; query `due` still has no explicit unavailable branch. Existing 500-row/truncation notice is preserved but not exercised in this fixture. KPI null/disabled assignments and every possible server validation/error combination are not exhaustively simulated. Native OS date/select/file chrome is not themed.
- Existing reported repository failures remain OPEN: three manifest/lifecycle failures, Button attribute-order assertion and renewal-navigation mismatch. The full repository suite/build were not rerun here, and this producer makes no fresh causality claim for those failures.
- Work source compositions for dashboard/team/tracker/reports were deliberately reused, not falsely claimed as rewritten screen components. Their substantial visual changes come through the Work-owned shell/module CSS and already shared list/filter consumers; all nine mounted routes are actually exercised.

No commit, stash/reset/revert, push, deploy, credential guessing or production mutation was performed. Other dirty Overview/Admin/Duct/legacy/schema/registry files and the earlier Work behavioral fixes remain intact.
