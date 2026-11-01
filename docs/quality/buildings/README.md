# Buildings unified UI — producer evidence

**Implemented and exercised in an isolated TEST fixture; independent QA and owner visual acceptance remain OPEN.** Repository: `D:/WebApp/SuperApp PERMISSION_NEXT`, HEAD `62ed9ee`. Existing unrelated dirty work was retained. No commit, deployment, credentials, database/NAS writes, server policy, schema, global tokens, shared shell or shared Dialog changes.

## What changed

- The current `/buildings` and `/buildings/map` routes both import `BuildingsWorkspace`. It now uses the established blue/Thai-font language, raised outer summaries/panels, inset search/filter controls, flat record rows and normal document scrolling. Buildings no longer overrides shared-shell header geometry.
- Create/edit retain their original schema, fields, fee registry, decimal strings, endpoints, version/reason payloads and location candidate semantics. All fields are locked during saving; cancel is guarded; server errors focus the retained-draft error summary. Existing unload protection remains native. Deliberate discard/reload uses shared `ConfirmDialog`.
- The drawer and typed-name deletion now consume shared native `Dialog`, preserving modal focus, Escape, backdrop, return focus, pending and the typed-name/version/dependency constraints. Clipboard feedback is inside the modal rather than behind its inert backdrop. NAS denial is distinguished from a generic outage without exposing arbitrary errors.
- Location confirmation uses shared `ConfirmDialog`, stays locked while a mocked request is pending, retains a failed candidate, and preserves the exact PATCH/candidate contracts. Missing service and read-only intent are explained. The real canvas still owns clustering, selected-point focus, initial fit, heat layers, fullscreen, retry and list fallback; no coordinate/fee/provider calculations were changed. Cluster Escape restores focus to the stable map region because zoom redraws can destroy marker DOM.
- `features/buildings/map/map-workspace.tsx` is an alternate source consumer, **not an additional currently mounted route**. Its header and presentation are aligned and its selection/detail-close behavior is exercised separately; no deletion or invented reachability.

## Five-route coverage

Every route family has actual-imported-route screenshots at light/dark × 1440/390, full-page axe checks, page-error assertions, and 320px page-overflow checks. Data/access cases use explicit synthetic TEST models, not real grants or sessions.

| Current route | Controls, views and states exercised |
|---|---|
| `/buildings` | Search/suggestions with ArrowDown/Enter/Escape; clear; six field filters, selected chip removal and reset; four status shortcuts; map/list toggle; create/detail/edit links; filtered-empty reset; all four drawer tabs; contact tel/mail/copy; coordinate action and legacy remark disclosure; fee/revenue-share display. Read-only, denied, empty, unavailable, loading and data-error branches. |
| `/buildings/map` | Same active workspace; province/date filters; buildings/status/expense/heatmap modes, five expense categories, three heat metrics and URL synchronization; actual canvas with TEST vendor adapter; cluster open/select/Escape/focus after redraw, heat-layer contract, fullscreen enter/exit, missing key, loading, provider failure/retry/list fallback. Read-only/denied/empty/unavailable/loading/data-error branches. |
| `/buildings/new` | All six form sections, identity/team/general/installation/contact controls, all eight fee fields and five calculation fields; add/remove other fee and fixed/revenue-share annual period; validation focus; unsaved cancel/Escape/explicit discard; pending field lock; duplicate/forbidden feedback and retained draft; mocked successful save. Manual candidate confirmation populates both coordinate inputs and the original create payload. ALL/TEAM/SELECTED_TEAMS create variants and OWN/empty-TEAM rejection are executed through actual route grant logic. |
| `/buildings/[id]` | Six URL tabs: overview/location/documents/work/guarantees/activity; related content, scoped empty counts, attachment metadata, exact existing links; saved feedback; read-only hides editing/deletion. Location search/reverse lookup, manual pin, GPS success/denied/unavailable/timeout, candidate clear, confirm/cancel, pending Escape guard, forbidden retention and mocked save. Typed deletion: mismatch disabled, cancel/Escape/focus, version/name payload, pending guard, all six named server errors plus unknown fallback, dependency rejection and mocked success. |
| `/buildings/[id]/edit` | Same complete editor control inventory, immutable owner team, edit reason/version, validation, dirty-draft retention, other fees, saving lock, conflict feedback/reload confirmation cancellation and mocked success. Read-only/denied/unavailable use the existing notFound boundary; no new denial policy is invented. |

Additional NAS tests use all DWG/PDF/image categories, loading, 404/empty, 403, outage, timeout and retry. Download links retain `/api/nas/download?token=…` and their `download` filename; an external URL is rejected by the real component. **No NAS download, preview renderer, upload, attachment access or audit integration was claimed tested.** Building 360 currently exposes attachment metadata; it has no local preview/download button to redesign. Quotation/version/approval/archive/merge/upload/preview parity remains the existing OPEN source reconciliation, not fabricated controls.

## Resumed verification — 2026-11-01

The interrupted producer had already left working UI and a draft report. Recovery read the actual diffs and last relevant delegation-log segment, preserved them, and reran the checked-in fixture rather than assuming the old results were current. The referenced `verification.json` and repository-local command logs were missing; they are now supplied with fresh results. The recovery also reproduced a missing keyboard tab interaction (RED exit 1), then added roving ArrowLeft/ArrowRight/Home/End tab selection and explicit tab/panel associations (GREEN exit 0). No mutation or permission contract changed.

Added behavioral checks cover complete control-value snapshots before/after cancelled leave and rejected save, exact retained decimal/other-fee/reason/version payloads, all four status toggles, and scroll reachability/overflow at 768/1024px in both themes. The active map route is full-width with a list toggle, **not a split-panel route**; split list/canvas/detail reachability is exercised only on the explicit alternate source consumer. Current screenshots were regenerated and route/form/overlay contact sheets plus native-size mobile form crops were inspected. This is producer inspection, not independent QA.

## Executed verification

| Command | Result |
|---|---|
| `UX_EXTERNAL_SERVER=1 npx playwright test e2e/buildings-unified-composition.spec.ts --reporter=list` | exit 0; **100 passed**, 0 skipped; `browser.log` |
| Targeted Vitest command in `verification.json` | exit 0; **65 passed / 11 files**; `unit.log` |
| `UX_EXTERNAL_SERVER=1 npx playwright test e2e/work-create-dialog-regression.spec.ts --reporter=list` | exit 0; **5 passed**; `work-regression.log` |
| `UX_EXTERNAL_SERVER=1 npx playwright test e2e/navigation-theme-focus.spec.ts --grep 'native Dialog' --reporter=list` | exit 0; **3 passed**; `dialog-regression.log` |
| `npx tsc --noEmit`; changed-file ESLint | both exit 0; exact file arguments in `verification.json` |
| CSS / contrast scripts | exit 0; **386 files / 0 CSS violations**, **60 pairs / 0 failures**; `css.log`, `contrast.log` |
| Scoped `git diff --check` | exit 0; only existing line-ending conversion warnings |

**65 PNGs**, **43 full-page axe reports with zero violations**, and enabled deletion-action hover contrast of **5.9146 light / 8.5056 dark** are measured artifacts. `verification.json` records exact absolute source paths, file bytes, command exits, screenshot inventory and counts. `list-*`, `map-*`, `create-*`, `detail-*`, `edit-*` are the five screen families. `overlay-{cluster,delete,documents,fees,location,unsaved}-{theme}-{width}` covers the four desktop/mobile theme variants for these overlay presentations. `360-*`, `editor-error-*`, `filters-dark-320`, and state-specific files provide additional evidence.

Producer inspected the route and overlay variants, full forms and representative source-limited/error views. Drawers fit the viewport and their footer is reachable; forms' sticky save/cancel actions remain reachable. Full-page form captures show the sticky action bar at the capture viewport position; they do not imply a second action bar inside the form.

## Reference and limits

Figma `https://www.figma.com/design/AFiYS0OB93glB6at2o3Vnr` desktop `2:7` and mobile `2:4` raster screenshots were retrieved and visually inspected on 2026-11-01; creator/license not verified: **INSPIRATION_ONLY**. Soft outer depth/inset controls informed composition; no protected assets, editable tokens, lavender brand replacement, exact Figma measurements or 1:1 similarity claim. Existing Overview/Work captures and current semantic tokens were also inspected. The local authoritative legacy checkout resolves to `afaee997afecf0f42e059b7100fa90ed0d188784`; current mounted target contracts, rather than stale source-parity prose, define this bounded implementation.

**CANNOT establish / OPEN:** real Longdo tiles, provider marker event delivery and network/geocoding; authenticated Next/RSC navigation, actual role/data scopes and refresh loading; real DB conflict/deletion, NAS/file bytes/audit; live export/print, broad 200% zoom and assistive-technology acceptance; source parity outside current mapped controls; independent QA/owner approval. The TEST adapter deliberately draws **no map** and shows a visible warning. Only the vendor/server/Next boundaries are mocked; actual canvas/route/client components, root CSS, fonts and shared shell are rendered. Full build/full repository suite were not run in this bounded dirty tree. Previously reported manifest/lifecycle/Button-attribute/renewal-nav failures, tracking hook issues and Work auth/export/print/zoom/unavailable gaps remain OPEN. This is not full-system completion or production readiness.
