# Unified UI migration — implementation specification and source coverage ledger

**Status: PLANNED.** This is preparatory work for the approved full-system redesign, not implementation, release approval, visual acceptance, accessibility certification, or proof of source parity. Every ledger item inherits PLANNED; an OPEN mapping means unresolved work, never an exemption. MaxWell's latest instruction includes Overview through Admin, authentication, utilities, every module, every function and every popup. Delivering this document does not complete that request.

**Fix-round 1 QA note (separate OPEN parity item):** `e2e/navigation-theme-focus.spec.ts` still intentionally asserts `/duct-rental/renewal/example` resolves to the renewal child metadata. Current dirty manifest/navigation choices expose only the duct root/cable metadata, so the test remains red (`expected /duct-rental/renewal`, received `/duct-rental`). Do not re-add navigation or weaken this assertion without approved current source intent; this is not attributed to the shared Dialog/drawer behavior.

**Owner-authorized Dialog checkpoint (targeted, not QA or wave completion):** `src/components/ui/dialog.tsx` now restores its mounted marker during StrictMode effect setup and consumes rejected `beforeClose` promises without unhandled browser errors. Real browser regressions cover Escape, close-button, and backdrop close after StrictMode replay, focus return, and rejection recovery. Results are recorded only in the task handoff; broader parity, renewal metadata, and baseline failures remain OPEN.

## Overview-only visual implementation checkpoint — IMPLEMENTED; VERIFIED IN TEST FIXTURE (not QA closure)

Actual producer changes now exist in `src/components/dashboard-overview.tsx`, `src/components/workspace-queue.tsx` (optional Overview presentation only), `src/components/overview-messages.tsx`, `src/components/overview.module.css` and the Overview route composition. They implement compact filterable metrics, page/action/freshness hierarchy, raised outer panels/inset search, flat queue rows, readable source feedback, responsive detail/saved-view surfaces and a flat allowed-module directory. Server reads, grants, counts, destinations, URL settings, selection/copy, paging, detail and saved-view contracts remain intact; no shared Dialog/Work/auth/database policy changes. Exact consumer/control/state map: `docs/quality/overview-scope.md`.

Producer verification: `e2e/overview-redesign.spec.ts` mounts the real Overview, queue and messages with all root app CSS and bundled fonts in an explicit TEST-model fixture, mocking only Next link/navigation boundaries; **7 browser tests passed**, **3 targeted unit files / 10 tests passed**, typecheck and changed-file ESLint exit 0, CSS check **385 files / 0 violations**, contrast script **58 pairs / 0 failures**. `docs/quality/overview/` holds logs, **21 real-component screenshots** (light/dark/mobile, detail, saved views, feedback/role variants), **9 zero-violation axe snapshots**, and computed overlay action contrast. Producer inspected reference desktop 2:7/mobile-dark 2:4 rasters and final light/dark/mobile/overlay captures; no extracted Figma-token or exact-match claim. Corrected light copy-button contrast, dark row hover contrast and mobile saved-view overflow found during execution.

**OPEN:** independent QA/owner visual approval; authenticated role/data/session integration and real Next refresh loading; shell-integration screenshot/200% zoom and full assistive-technology review; broader source parity and the other eight screen families/modules/auth/Admin. This fixture does not authenticate, bypass auth or touch live DB. Full build/full-suite were not rerun in this bounded slice. Reported three manifest/lifecycle failures plus Button attribute assertion and renewal-navigation mismatch remain OPEN, not dismissed as unrelated or fixed by this checkpoint. Earlier §8.1 does not constitute full Overview QA closure.

## Work/KPI nine-route visual composition checkpoint — IMPLEMENTED; client-fixture verification PARTIAL

Actual Work-owned composition now spans all nine mounted `/work`, `/work/mine`, `/work/new`, `/work/team`, `/work/assign`, `/work/people`, `/work/tracker`, `/work/kpi`, `/work/reports` routes, plus all ten existing `view=` dispatches. New scoped `work-composition.module.css` and the existing list module compose raised outer/flat data surfaces, inset search, grouped forms, people/tracker/KPI/report hierarchy and consistent shared task dialogs; create/assignment behavioral owners are preserved. Exact reuse/control/state/file/evidence inventory: `docs/quality/work/composition-scope.md` and `composition-artifacts.json` in that directory. This supersedes no auth/parity/security gate.

Producer execution: new actual-route TEST fixture **61 passed / 9 failed / 0 skipped**; all nine failures retain the full-page dark-shell `.app_shell_brandMark` contrast defect outside Work ownership. The 27 Work-content axe checks pass; 27 full-page snapshots retain that shell failure, not mask it. Prior deferred Work-create/assignment regressions **5 passed**, shared Dialog regressions **3 passed**, targeted units **54 tests / 14 files passed**, typecheck/changed ESLint/CSS/contrast/diffcheck exit 0. **16 PNGs** include all screen families and corrected mobile create/task overlays. Fixed actual Work dark-link contrast, KPI keyboard scrolling, tracker alignment and legacy transform-animation clipping found in browser/visual review. No Overview CSS, core token, shell/shared Dialog implementation, auth/grant/action/read-model/formula/database/policy edits by this slice.

**OPEN:** shared-shell dark brand contrast; independent QA/owner approval; actual authenticated role/data/server refresh/action/export/print/zoom acceptance; create/due unavailable-source gaps and exhaustive unsupported state combinations. Existing manifest/lifecycle/Button/renewal failures remain OPEN; full repository suite/build not rerun. This is not Work QA PASS, all-function/server acceptance or full-system completion.

## Buildings five-route recovery checkpoint — IMPLEMENTED; producer TEST-fixture evidence only

Recovered the interrupted Buildings-owned implementation from actual diffs at HEAD `62ed9ee`, retaining unrelated dirty work. Five current routes (`/buildings`, `/buildings/map`, `/buildings/new`, `/buildings/[id]`, `/buildings/[id]/edit`) use token-only outer depth/flat data, shared shell and Dialog/Confirm surfaces. Current controls, NAS safe-link feedback, location candidate semantics, pending locks, typed deletion and retained editor drafts remain exercised without changing server/business/security/provider contracts. Recovery additionally fixed drawer tab Arrow/Home/End navigation and tab-panel associations after an observed failing browser regression.

Fresh verification: Buildings actual-imported-route fixture **100 passed / 0 skipped**, targeted units **65 passed / 11 files**, Work-create/assignment **5 passed**, native Dialog **3 passed**; typecheck/changed ESLint/CSS/contrast/scoped diff all exit 0. **65 regenerated PNGs**, **43 zero-violation full-page axe reports**; all five routes include light/dark 1440/390 captures, 320 overflow and light/dark 768/1024 scroll checks. Screenshots were inspected by the producer. Exact source paths/bytes, commands/exits, route/function/overlay matrix and limits: `docs/quality/buildings/README.md` and `verification.json`.

**OPEN:** independent QA/owner acceptance; authenticated Next/RSC/session/data-scope/server refresh, live DB/conflict/deletion, real Longdo/network/geocoding, NAS bytes/audit and export/print/200%-zoom/assistive-technology checks; unavailable/exhaustive state combinations and broader source parity. Visible TEST models/adapter render no real tiles and do not bypass authentication. Active map route is full-width/list-toggle; alternate split-panel source consumer is tested separately, not advertised as a sixth route. Known manifest/lifecycle/Button/renewal/tracking issues are not closed. No full suite/build, deployment, provider/config changes or full-system completion claim.

## Car Booking composition checkpoint — IMPLEMENTED; producer TEST-fixture evidence only

Car Booking-owned presentation now reuses shared Button/Panel/Form/Status/Table/Dialog/Confirm across all ten current `/car-booking` views and the separate `/admin/car-booking` access editor. Existing reserve/return/cancel/log/GPS, vehicle create/edit/deactivation, parking, calendar, OSP/dashboard/jobs/export-link controls remain; dirty-modal confirmation, pending field locks, retained/version-bound parking drafts, retry/loading/error feedback and clean failed-tile fallback are implemented without server/business/security/provider changes. Ownership and exact per-function coverage: `docs/quality/car-booking/README.md` and `verification.json`. Existing unrelated Admin page/CSS and all other dirty work are preserved.

Producer execution: actual two route functions + production components/AppShell/CSS/fonts in a visibly labelled synthetic TEST fixture; **111 browser tests**, **54 unit tests / 9 files**, shared native Dialog **3 regressions** passed. Light/dark 320/390/768/1440 view reflow, representative overlay/failure/draft/fuel/GPS coverage, **29 PNGs**, **50 zero-violation full-page axe reports**; typecheck/changed ESLint/CSS/contrast/scoped diff exit 0. The Buildings manifest was first byte-synced only (9 changed PNG sizes; 65 manifest entries = 65 actual PNGs), with no subsequent Buildings screenshot regeneration.

**OPEN:** independent QA/owner acceptance; authenticated Next/RSC/session/data scope and actual grant persistence; live API/DB overlap/concurrency/idempotency/audit/validation; provider/geolocation/network, Google Sheets/SAP/backup/jobs, authorized CSV bytes; full suite/build, 200% zoom/assistive technology and exhaustive overlay combinations/browser unload protection. `/admin/car-booking` presentation is included, not the remaining Admin slices. Known manifest/lifecycle/Button/renewal/tracking issues stay OPEN. No production writes, seeds/resets, credential use, auth bypass, shared implementation changes, deploy or full-system completion claim.

## Guarantees three-route composition checkpoint — IMPLEMENTED; producer TEST-fixture evidence only

Guarantees-owned composition now covers current `/guarantees`, `/guarantees/new`, `/guarantees/[id]` consumers: six local views, installation-team/team/preview query branches, manager/readonly/assigned-TL workspaces, grouped financial forms, seven evidence slots, current transition and Back-discard confirmations, source feedback, report/CSV/print controls and shared tooltip use. Existing tokens/PageHeader/Button/Dialog/Confirm remain authoritative. Controlled draft ownership and explicit client FormData dispatch prevent the observed failed-action select reset; pending/failure/retry and same-file reselection are exercised without changing server actions, grants, financial helpers, validation, versions, workflow targets or private endpoints. Inventory and limitations: `docs/quality/guarantees/README.md` and `verification.json`.

Producer execution: actual three route functions + production components/AppShell/CSS/fonts, mock server/Next boundaries, visible synthetic TEST records; **72 browser tests passed**, followed by **6 final primary-form rechecks** and **1 final print/CSV recheck**. **47 unit tests / 7 files**, **3 shared native Dialog regressions**, final typecheck/changed ESLint/CSS/contrast/scoped diff exit 0; **389 CSS files / 0 violations**, **60 contrast pairs / 0 failures**, **22 inspected PNGs**, **127 zero-violation full-page axe reports**, two original-formatter TEST CSVs and one real Chromium TEST PDF. Fixed observed dark hover/CID contrast, scroll accessibility, mobile action/header geometry, short chart hit targets, native-select draft loss and printed chart/skip-link leakage. This is not independent QA acceptance.

**OPEN:** authenticated Next/RSC/session/roles/data-scope/server refresh; actual DB/concurrency/idempotency/audit/validation/private storage and authorized production bytes; upstream source parity (including broader legacy bulk/delete/Off Service/modal features absent from mounted native controls); native OS file/date pickers, all tooltip placements, unsaved shell/breadcrumb/browser-history/unload navigation, real refresh reconciliation, missing-DB/notFound integration, exhaustive role/state combinations, zoom/assistive technology and owner/independent QA. Full suite/build not rerun; existing manifest/lifecycle/Button/renewal/tracking gates stay OPEN. No production writes, seeds, credentials, policy change, shared implementation edit, deployment or whole-system completion claim.

## Duct / Communication Cable composition checkpoint — IMPLEMENTED; producer client-fixture evidence only

Duct-owned presentation now spans all **14 mounted route patterns and 10 dynamic views (23 concrete compositions)** using existing Request/Process/Tracking/Signature families, restrained raised outer panels/inset fields and preserved flat segmented metrics. The compatibility Modal now delegates all 15 existing call sites to Core Dialog; cable transitions/signature removal and dirty Back/editor confirmation reuse Core ConfirmDialog. Pending field/close locks, retained cable/compact-detail/signature drafts, contextual errors, modal padding and duplicated detail-editor cleanup preserve existing action/payload/version/money/PDF/signature contracts. Exact file bytes, popup call sites, route/control matrix and evidence limits: `docs/quality/duct-rental/unified/README.md`, `implementation-inventory.json`, `verification.json`.

Producer execution: full actual-route/AppShell/CSS/font TEST fixture **102 passed**, then **2 computed checks passed**, then **34 affected final rechecks passed** (overlapping, not additive feature coverage). Shared Dialog **3**, previous Work forms **5**, Guarantees forms **2** passed; targeted units **6099 passed / 2 existing manifest failures / 25 pending across 26 files**. Typecheck/changed ESLint/CSS/contrast/scoped diff exit 0; **389 CSS files**, **60 contrast pairs**, **217 zero-violation axe snapshots**, **35 PNGs**, ten representative paths visually inspected. Real PDF.js TEST document and canvas-to-PNG client workflows ran with mocked server/storage boundaries. Rendered inventory contains 785 repeated control instances across 23 desktop-light compositions, not 785 independently accepted functions.

**OPEN:** independent QA/owner approval; exhaustive mounted-function/role/state combinations; phase accept/submit/NT-generation/assignment/revocation and complete annual/cancel/sign server chains; broader unsaved navigation, native pickers, auth/Next/RSC/session/scope/refresh/DB/audit/idempotency/private storage/PDF-generation acceptance, upstream source parity, full suite/build, zoom/assistive technology. Existing manifest/lifecycle/renewal-navigation/conditional TrackingSummary hook gates stay OPEN. Initial shared Dialog timing-sensitive test timeout passed on recheck and remains logged. No DB/prod writes, seeds, credentials, policy/config/model/shared implementation edits or deployment; no all-function/server/full-system acceptance claim.

## Admin remainder + Login/Change Password checkpoint — IMPLEMENTED; producer TEST-fixture evidence only

Recovered the interrupted Admin/auth presentation changes and completed all **14 current Admin sections plus Login and Change Password** using existing PageHeader/Button/Dialog/ConfirmDialog/AuthShell and central raised/inset/flat tokens. Existing queries, permission gates, server actions, validation, payload names/versions and auth policy remain unchanged; no invented future Admin routes. Failed drafts/pending locks, security confirmations, original work-admin controls and responsive tables/forms are exercised. Recovery fixed Admin header/action clipping, narrow confirmation close-label wrapping and light hovered-status contrast without shared Dialog/token changes. Exact **11 source/test paths / 145651 bytes**, commands/exits, partial function/state matrix and final-slice scope: `docs/quality/admin-remainder/README.md` and `verification.json`.

Final actual-route/AppShell/CSS/font fixture: **68 passed / 0 skipped**, light/dark **320/390/768/1440**, **169 named zero-violation tagged full-page axe snapshots**, **35 PNGs** with ten representative paths visually inspected. Targeted units **39 / 8 files**, shared Dialog **3**, previous Work forms **5**, Guarantees forms **2**, documents **1** passed. Final typecheck/changed ESLint/CSS (**390 files**)/contrast (**60 pairs**)/scoped diff/build exit 0. Full Vitest: **6498 passed / 1 failed / 66 skipped**; the preserved lifecycle-order test expects four modules while the dirty registry includes Duct Rental. Earlier recovery/contrast/fixture-locator failures remain logged, not erased.

**OPEN before final slices:** Core account/search/notification and loading/denied/platform-error/global-error/404 utilities; authenticated Next/RSC/session/roles/scope/back/refresh, real auth success/action persistence/guardrails/audit/concurrency, exhaustive state/overlay combinations, upstream/source-consumer reconciliation and earlier domain/provider/private-file/export gaps; zoom/forced-colors/assistive technology, lifecycle/navigation/hook follow-ups, independent QA and owner visual approval. No DB/prod writes, seed, credentials, bypass, policy/config/model changes, commit/push/deploy or whole-system acceptance claim. `/admin/car-booking` remains covered by its earlier slice, not reimplemented here.

## 1. Authority, baseline and safety

- Resolved repository: `D:/WebApp/SuperApp PERMISSION_NEXT`. The shorter `D:/WebApp/SuperApp` does not exist on this host; discovery found the explicitly named PERMISSION_NEXT checkout. Target artifact: `D:/WebApp/SuperApp PERMISSION_NEXT/docs/product/unified-ui-migration.md`.
- Observed HEAD: `62ed9ee4048481abd036ed1ea4853caad316a5ed`. Existing dirty changes were present before this work, including Admin, module navigation/registry/contract, Duct components and tests, database schema, legacy route/HTML and untracked files. They are inputs, not this author's changes. No reset/stash/checkout/commit/push/deploy or code edits are authorized in this handoff.
- This producer writes this document only. Parallel Developer is read-only and must not write this path. No production access, account/grant changes, migrations, model/config changes or app/server restarts were performed.
- Highest authority: latest approved user scope → security/business invariants in AGENTS/master plan → current code → current contracts → older design proposals. The latest reference updates visual direction; it does not authorize inventing domain policy, dropping functionality or replacing server guards.
- Earlier DESIGN/UXUI_SPEC/HANDOFF wording “PLAN ONLY / approval pending” is historical for authorization; this document records the newly approved full-system direction while remaining itself PLANNED. Older BudgetZen green and complex-application Figma prescriptions are not simultaneous competing themes. Existing blue ADR and token architecture remain constraints.
- Source parity freeze, required business-policy decisions and security gates remain necessary before changing affected behavior. Source-derived inventory here describes this checkout, not a fresh audit of every upstream repository. Unported upstream functionality must remain OPEN, not be classified RETIRE because absent locally.

## 2. Reference evidence and visual contract

Reference supplied by MaxWell: https://www.figma.com/design/AFiYS0OB93glB6at2o3Vnr/Dashboard---Neumorphism-Sales-Management-Dashboard--preview---Community-?node-id=0-1&t=HJ9ziv8PJ9SWdYMq-0

Evidence provenance: delegated context reports previously verified raster designs, desktop light `2:7` and mobile dark `2:4`. Observations supplied: soft raised/inset gray surfaces, rounded floating sidebar, charcoal dark treatment, lavender accents. **This task did not newly inspect Figma nodes, extract editable variables, or measure the raster.** No exact Figma color, shadow, spacing, font, interaction, breakpoint, prototype, asset license or similarity percentage is claimed. Acquire context and screenshot for those frames before visual implementation/sign-off; if raster-only, measure the raster and record proposed product values as proposals, not extracted design tokens. Do not copy reference branding or business content.

### 2.1 Product interpretation: restrained soft-neumorphic operations

Retain familiar domain workflows and corporate blue, borrowing reference depth and silhouette rather than lavender branding. Light: softly differentiated workspace and raised surfaces with subtle opposing highlight/shadow, bounded by meaningful borders where interaction needs one. Dark: charcoal/slate semantic surfaces and restrained edge highlights; never invert a light screenshot or rely on black shadows alone. Primary actions and active navigation remain blue. A selected control has explicit text/icon/selection semantics plus inset treatment, not inset shadow alone. Large page panels and shell may be soft/raised; tables and financial forms remain flat and crisp inside them. Do not put a shadowed card inside every cell or nest card-on-card.

Distinctive signature: floating, rounded navigation surface + calm blue active marker + compact Thai operational typography; quiet inset search/control wells; clear non-neumorphic focus outline. Reject glass, glow, decorative gradients, giant blank KPI cards, universal pill controls, low-contrast embossed text, identical dashboard compositions for every domain, infinite animation and ornamental background blobs. At forced colors/high contrast, borders and system focus cues must retain all semantics without shadows.

### 2.2 Foundation ownership and token decisions

`src/styles/tokens.css` is the sole token-definition source. Current values, not stale prose, are the starting implementation baseline. Values below are **existing code**, not Figma measurements:

| Role | Current light | Current dark | Planned use |
|---|---|---|---|
| `--color-bg` | `#F8FAFC` | `#0F172A` | Workspace canvas |
| `--color-surface` | `#FFFFFF` | `#1E293B` | Readable panel and overlay plane |
| `--color-surface-subtle` | `#F1F5F9` | `#334155` | Inset wells / table headers |
| `--color-brand-primary` | `#244fb8` | inherited immutable value | Product identity, not automatic text color |
| `--color-brand` | `#244fb8` | `#60A5FA` | Theme-adapted primary action/link |
| `--color-text` | `#0F172A` | `#F8FAFC` | Body/heading |
| `--color-text-muted` | `#475569` | `#CBD5E1` | Supporting text |
| `--color-border-strong` | `#6B7280` | `#94A3B8` | Identifiable control boundary |
| `--color-nav-*` | themed set | themed set | Entire navigation follows theme |
| radii | xs 3 / sm 5 / md 8 / lg 12 / xl 16px | same | Controls md; panels lg; dialog/floating shell xl |
| type | micro 11 / caption 12 / body 13 / strong 14 / h3 16 / h2 20 / stat 24px | same | Do not shrink dense Thai data below legibility |
| space | `--space-1`…`--space-10`: 4…40px | same | Component padding/gaps from this scale |
| header | `--size-shell-header:64px` | same | Keep existing geometry before pilot adjustment |
| focus | width 3px / offset 2px | same | Always visible; independent of depth |
| touch | `--size-control-touch:44px` | same | Minimum mobile hit area |
| motion | fast 120 / base 200 / slow 320ms | same | Existing reduced-motion zero-duration overrides |

Do not copy contrast claims from design-language.md: its listed colors differ from current tokens. Recalculate every actual foreground/background pair, including blue buttons, muted text, error fields, nav and overlays. Target WCAG 2.2 AA, normal text 4.5:1; large text and necessary non-text UI 3:1. Decorative highlights need not be the only control boundary.

Minimum proposed additions in **tokens.css only**, after caller inventory: `--shadow-raised` and `--shadow-inset` theme-specific paired depth values; `--z-popover` and `--z-toast` if current layer tokens cannot express tested overlay ordering. Define concrete paired shadow values during measured pilot; until then use existing elevation rather than fabricate extracted Figma numbers. Do not add a second theme stylesheet, `--app-*` aliases, or hardcoded lavender. A contrast failure overrides visual similarity.

Typography: keep bundled Manrope/Nunito/Noto Sans Thai/Source Code Pro and existing font loading. Thai body line-height at least 1.6, headings at least 1.35, no negative Thai tracking; numeric columns tabular. Dates and time must retain existing Bangkok/business-calendar semantics; do not silently switch Gregorian/Buddhist storage or accounting precision. Surface exact server monetary strings; display formatting must not recalculate finance/KPI.

### 2.3 CSS/layer ownership — strangler, not one more override

| Owner | Responsibility | Forbidden |
|---|---|---|
| `tokens.css` | All semantic values, both themes, depth and layer additions | Duplicated tokens in modules/root docs/theme overrides |
| `app-shell.tsx` + `styles/app-shell.module.css` | Mounted platform shell, geometry, drawer, region placement | Domain workflow logic or new global element selectors |
| `shell.css` | Existing shell/global navigation rules still consumed | Competing geometry for same mounted shell; migrate consumer then retire obsolete selector |
| `components/ui/*` + `styles/ui.css` | Reused primitive anatomy, states, variants | Copying module-specific business logic into primitives |
| `components.css`, `motion.css`, auth styles | Existing shared legacy presentation and purposeful motion | New duplicate primitive owner or looping reading-page motion |
| Domain CSS/modules, Admin CSS, Duct ui-* families | Domain composition only, token consumers | Redefining button/dialog/table look differently per module |
| `app/globals.css` | Legacy structural compatibility during consumer migration | Appending a “new design” section at file end to win specificity |

Current shell is CSS-module-backed, while old documents also assign geometry to shell.css. First slice must identify computed-style winner and migrate overlapping ownership explicitly, not blindly update both. Import order is not a substitute for ownership. Retain selectors used by untouched consumers; remove only after consumer migration plus regression checks. A domain may choose map + list, calendar, workflow or document editor; it may not opt out of tokens, accessible controls, overlay lifecycle or feedback. Keep Tailwind utilities only where they consume the same semantic values; no arbitrary per-screen themes.


### 2.4 Implementable pilot defaults (product proposals, NOT extracted Figma values)

Use these explicit initial proposals for the first implementation slice so engineers need not invent measurements. They are reviewable defaults, not visual sign-off. Preserve current header 64px desktop and 72px at the current ≤900px mobile breakpoint for the first slice; move the existing 72px literal into a token rather than creating a competing rule. Keep 248px expanded / 80px rail widths found in `app-shell.module.css:2–3`; supersede the stale root DESIGN_SYSTEM.md 260px claim. Use existing `--space-4` (16px) as desktop floating-sidebar outer gutter, `--radius-xl` (16px) contour, existing md nav radius (8px), and existing touch height (44px). Sidebar available height is viewport minus actual header and two gutters; main offset must include width+gutter, not overlap the floating panel. At ≤900px preserve current drawer breakpoint, remove floating gutters and main offset; at 901–1023px use rail only when user preference requests it, never force drawer based on an unapproved 1024px assumption. Drawer remains current `min(328px, calc(100vw - 40px))`; long-content body scroll remains required. Further breakpoint/width changes need pilot evidence, not a claim about the raster.

Proposed token patch for the later authorized producer (do not implement in this doc-only task):

```css
/* tokens.css; pilot proposal. Existing --color-* values stay unchanged initially. */
:root {
  --size-shell-sidebar-expanded: 248px;
  --size-shell-sidebar-collapsed: 80px;
  --size-shell-header-mobile: 72px;
  --shadow-raised: -3px -3px 8px var(--color-highlight),
                    3px 3px 8px var(--color-shadow-ink);
  --shadow-inset: inset 2px 2px 4px var(--color-shadow-ink),
                 inset -2px -2px 4px var(--color-highlight);
  --z-popover: 220; /* preserves current dropdown plane */
  --z-toast: 300;   /* nonmodal only; never cover active dialog controls */
}
```

Dark inherits the shadow geometry while existing highlight/shadow-ink colors change with theme; if measured surface separation is too weak, adjust only tokens.css theme values, preserving strong control boundaries. Soft raised is for sidebar/outer panels and discrete primary buttons, inset for search/control wells/pressed selection; not every row, nested panel or disabled control. Necessary borders remain 1px strong; focus remains 3px/2px. Do not animate these shadows continuously. Modal uses native top layer and existing overlay backdrop color, not a numerically larger z-index; popovers inside a modal render inside its top-layer subtree. Toast in a modal uses its local live-region/status area; no nonmodal toast may cover modal actions. Map internal z-index belongs under module plane; skip-link remains reachable at existing `--z-skip`.

`--app-sidebar-width` currently is a local implementation alias in app-shell.module.css, despite docs discouraging new app aliases. Replace its value selection with the canonical size tokens in the same bounded consumer migration; do not introduce a second globally-defined alias or edit unrelated existing consumers. Confirm computed styles after patch because CSS-module selectors and Tailwind utility borders can compete. This removes the stale-prose ambiguity while retaining runtime verification as a gate.

## 3. Caller-first shared contracts

Names below are proposed API extensions, **not components claimed to exist**. Existing shared exports are inventoried in Appendix A. Before adding one, take its named real callers through a compile/typecheck/test spike, favoring an adapter or small extension over a new wrapper hierarchy.

### 3.1 Navigation and future-module seam

Current `module-nav.tsx` consumes registry navigationItems but hardcodes the five collapsible IDs, path ownership and Work special handling. Fix that seam once; do not keep adding IDs to a union. Keep server-filtered `allowedModuleIds`, admin gating, Work navigation and current query matching. Registry is not authorization.

```tsx
// Caller first: AppShell, including its mobile drawer.
<ModuleNav items={navigationForSession} collapsed={collapsed}
  current={{ pathname, searchParams }} idPrefix="desktop-nav"
  onNavigate={closeMobileWhenApplicable} />

// Proposed view model; build from registry + server grants, not client grants.
type NavigationNode = {
  id: string; label: string; href: string; icon: IconName;
  group: string; children?: readonly NavigationNode[];
  match?: { kind: "exact" | "prefix" | "query"; query?: Record<string,string> };
};
// Adapter preserves existing ModuleNav callers during migration.
// Child href lookup precedence: query > prefix > exact; longest matching path wins.
// Parent ownership derives from registered route roots, not a fixed ModuleId union.
```

Expanded desktop: one module section open at a time using existing preference, navigation links and disclosure controls distinct; route change reveals its section unless explicitly collapsed for that same route. Rail: icons link to destinations with accessible names and focus/hover hints; expanding restores context. Drawer: same filtered nodes, unique IDs, inert background, internal scroll, close on navigation, return focus. Keep scope label readable; optional storage failure must not break navigation or hydration. Preserve `preview=1` behavior and query-specific Guarantees installation-team active item. Do not make the first child the only accessible parent destination. Admin sections remain local navigation rather than dozens of global children.

Future onboarding acceptance: register a sixth **synthetic test-only** manifest with children, query view and route root; no shell/module-nav condition changes required; granted menu/search/dashboard/Admin catalog hooks appear through supported providers; denied user never sees protected labels/results and direct URL still rejects. Test duplicate IDs, malformed hrefs, deepest routes, unknown module, storage unavailable, localized long label. Lifecycle policy must come from current effective enabled service, not a second UI-only interpretation. Do not implement a new business module as a test fixture in production.

### 3.2 Minimal primitive extensions with real callers

```tsx
// DuctSyncUtility and save forms: extend existing Button, retain native attributes.
<Button variant="primary" pending={saving} pendingLabel="กำลังบันทึก…"
  disabled={!canSave} type="submit">บันทึก</Button>
// pending disables duplicate execution; aria-busy; stable width; no optimistic success.

// RequestWorkspace preview and CarBookingDialog are first Dialog callers.
<Dialog open={preview !== null} title={preview?.title ?? "ตัวอย่างเอกสาร"}
  onOpenChange={open => !open && closePreview()} busy={saving}
  initialFocusRef={closeRef} returnFocusRef={openerRef}
  beforeClose={reason => dirty ? confirmDiscard(reason) : true}>
  <PdfViewer {...existingViewerProps} />
</Dialog>
// Shared native <dialog> lifecycle. No module business mutation inside Dialog.
// beforeClose: async boolean; reason = escape | close-button | backdrop | navigation.
// Return to nearest surviving trigger or page heading if original was removed.

// Work TaskActionControls, Duct submit/archive/reload, BuildingDelete:
<ConfirmDialog open={intent !== null} title={intentTitle} consequence={consequence}
  confirmLabel="ยืนยัน" intent="danger" pending={pending}
  onCancel={cancelIntent} onConfirm={runExistingAction}>
  {requiredReasonOrTypedName}
</ConfirmDialog>
// Caller owns business validation/version/idempotency and server response.

// Existing TableRegion stays the scrolling/accessible boundary, not a data engine.
<TableRegion label="รายการคำขอเช่าท่อ เลื่อนแนวนอนได้">
  <table>{existingSemanticTable}</table>
</TableRegion>
// Add reusable toolbar/pagination/selection helpers only after Work + Duct callers agree.

// Existing FormField/Panel/PageHeader compose domain layouts.
<FormField label="เหตุผล" error={errors.reason} hint="ระบุเหตุผลก่อนยืนยัน">
  <textarea name="reason" required />
</FormField>
```

Map exact existing exports/signatures before implementation; the sketch does not authorize renaming them wholesale. A ButtonLink must remain a link; disabled anchors must not masquerade as actions. Avoid global boolean-prop components with dozens of unrelated modes. Domain `Modal`/`CarBookingDialog` adapters may temporarily delegate shared lifecycle while preserving existing caller signatures, reducing risk. Proposed Dialog does not require moving business state into a global store. Keep one overlay controller per mounted owner; if nested preview/confirmation is genuinely needed, maintain a stack and restore focus to the parent, not the page behind it.


#### Minimum type extensions and adapter constraints

- `Button` currently has only variant/native button props (button.tsx); add optional `pending?: boolean`, `pendingLabel?: string` without changing variant union primary/secondary/danger/ghost or `type="button"` default. Preserve `aria-describedby` provided by caller and combine aria-busy/native disabled with caller disabled. ButtonLink remains separate and receives no fake disabled mutation semantics.
- `FormField` currently accepts label/hint/className/children only (form.tsx:7). Proposed `error?: string`, `controlId?: string`, `hintId?: string`, `errorId?: string`, `required?: boolean` is the minimum extension for real caller errors. Assign deterministic IDs; associate htmlFor/describedby/aria-invalid with exactly one native control by a documented controlled slot/clone adapter. Preserve caller describedby tokens; use explicit fieldset/legend for grouped controls instead of cloning multiple arbitrary children. If no error provided, keep current markup-compatible label behavior. Tests must mount current Work and Duct labels plus proposed Building/Duct error callers before migration.
- `Panel` already supports title/description/actions/children/className/headingId; do not add a second Card component to obtain depth. A class/variant selecting tokens is enough after caller comparison.
- Dialog adapter owns showModal/close/onCancel/onClose synchronization, opener capture and cleanup on unmount. `open=false` may not leave a native open dialog. `busy` only suppresses dismissal when caller's transaction-safety contract requires it; beforeClose handles dirty edits and returns a real decision. Cancel failure must not execute onConfirm. Async close rejection stays open with accessible reason; removed opener falls back safely.
- Account source currently renders identity + logout only; no profile/density/password-menu backend is asserted. Preserve logout action and add only real destinations when specified. Search source uses 180ms debounce, minimum 2 characters for remote results, AbortController, query correlation, partial/not-ready messages and existing Ctrl/Meta+K or non-editing `/`. Retain these exact semantics unless separately reviewed; do not replace with a visual mock palette.

### 3.3 Component acceptance contracts (applies to every occurrence in ledger)

| Contract | Required behavior / anatomy | Responsive / verification |
|---|---|---|
| C-NAV | Link vs disclosure; active + expanded distinct; icon + Thai label; scoped nodes; focus visible; storage optional | Expanded/rail/drawer all reach same allowed functions; current deep link/query/back/forward correct |
| C-PAGE | Breadcrumb/context, single main landmark and h1, description, one clear primary action, secondary controls, timestamp/data state | Actions wrap without truncation; page cannot horizontally scroll; domain composition retained |
| C-ACTION | Native button/link; explicit type; label; disabled reason if needed; pending; idempotent existing action; success only from server | Hit area 44px mobile; keyboard Enter/Space; pending does not alter layout |
| C-FORM | Persistent label/hint/required/error relationship, error summary → first invalid field, values retained after failure, correct input mode | Thai validation; mobile keyboard does not obscure submit; unsaved navigation guarded; no double submit |
| C-TABLE | Caption/headers/scope, numeric alignment, sort state, row link separate from actions, local scroll, filters + result count + reset, current pagination | No silent cross-page bulk selection; sticky header not obscure focus; same record accessible on mobile; virtualization only if needed and accessible |
| C-TABS | Route navigation uses links/aria-current; in-page tabs implement tablist/tab/tabpanel + roving arrows; do not use both semantics on one control | Scrollable tab strip visible focus; current tab survives source-supported URL or local state behavior |
| C-DIALOG | Named native modal, description when needed; initial focus; trap/inert; scroll body; cancel/close/backdrop policy; return focus; caller state cleanup | Fit available viewport/dvh; long Thai title/footer; safe-area + keyboard; no escape behind pending destructive work; no abandoned loading overlay |
| C-CONFIRM | Identity + consequence + explicit verb; reason/typed name where source requires; default safe action; server denial/conflict visible without losing input | Cancel leaves state/data unchanged; one confirm gives one mutation; retry honors existing idempotency/version |
| C-POPOVER | Account disclosure is named region, not fake ARIA menu; outside/focus-out/Escape dismissal; deterministic positioning; search combobox/listbox | Keyboard selection/Enter/Escape; collision/zoom handling; never portalled under a modal; stale search requests do not win |
| C-TOOLTIP | Hover and keyboard-focus access; Escape dismiss; hoverable/persistent until dismiss; full text available without pointer | No important instruction only in tooltip/title; truncated text usable at zoom/touch |
| C-FEEDBACK | Distinguish initial loading, background refreshing, no records, filtered empty, unavailable, not-configured, partial/truncated, denied, stale/conflict, saving, success, recoverable error | One relevant live region; no fake 0 for unavailable finance; retry preserves filters/input; reference code not stack trace |
| C-DOCUMENT | Existing preview/download permissions; explicit file title/type/size; upload inspect/replace/remove; viewer page/zoom/download; preview fallback | PDF/iframe failure shows real authorized link/error; print strips shell; no public file URL introduced |
| C-MAP | Existing data provider, mode legend, selected record, keyboard-accessible list and address/coordinates, loading/provider failure | Map container scroll/gestures never trap page; fallback list retains actions when API/key/tiles/geolocation denied |
| C-SIGN | Signature asset identity/preview; draw/upload alternatives; clear/default/archive; page/position/scale/rotation/name/date controls | Arrow/numeric positioning alternative; no drag-only operation; confirmation previews final output; pending/success/conflict explicit |
| C-PRINT | Dedicated print content, title/context/time, repeat headers/page breaks, readable mono/finance, explicit data/export scope | Light ink on paper regardless of theme; no drawer/sidebar/close buttons; PDF/CSV/XLSX actual existing output verified |

C-FEEDBACK is an acceptance requirement, not evidence that every component currently supports every state. Where a state is inapplicable, record its source reason during implementation; **do not use N/A to exclude a screen/function**. Missing support is OPEN and must be designed/implemented rather than silently omitted.

## 4. Layout and responsive recipes

Use the explicit §2.4 pilot geometry: current source-backed 248/80px widths with proposed floating gutter/contour. Do not claim these values from Figma. Computed-style verification and owner visual acceptance remain required. Reference-inspired depth must not consume operational content width.

- Desktop ≥1024px: persistent sidebar/rail, sticky shell header at existing token height; content uses minmax(0,1fr), page actions right, dense operational tables; map/detail and document/properties may split horizontally where usable.
- At ≤900px: preserve current drawer breakpoint, not an unmeasured 1024px switch. At 901–1023px retain persistent navigation with user-selected rail. Exact media-query literals must mirror centrally documented breakpoint, since CSS variables cannot simply replace native media query thresholds. Preserve mounted shell behavior until tested pilot approves a different switch.
- At 768px tablet: wrap filters into meaningful rows, split panes stack if needed, retain map + list toggle, PDF properties become accessible section/drawer instead of hidden functionality.
- 375/390px and 320px reflow stress: single column forms, search still accessible from explicit button, all actions reachable, modal becomes nearly/full viewport with scrolling body and reachable footer. Local tables scroll, not document body. Do not turn every dense table into decorative cards or hide critical data/actions.
- 1440/1920px: cap reading measure for forms/auth, not maps/tables. Page uses shared spacing but specialized canvases use remaining width. Test 200% zoom, browser text increase, Thai long names, reduced motion, forced colors and portrait/landscape.
- Motion: transform/opacity for opening/closing; no width animation on rail/table; 120/200ms preferred existing tokens, reduced motion zero. Scrolling/focus cannot depend on a transitionend that never fires.

### Domain composition and task continuity

| Area | Planned composition / preserved work | Required domain acceptance |
|---|---|---|
| Overview | Focused summaries, urgent queue, allowed module entry links, source freshness | Cards link to intended filtered work; unavailable data not zero; limited grants never leak counts |
| Work | Personal/team dashboard, assignment/table/detail+note, people, tracker, KPI/reports/activity/due | Same role-specific tasks, transitions/reasons, owner/rule/date/version/idempotency, exact KPI/SLA/calendar; no fallback of unknown view to mine |
| Buildings | Map/list workspace + operational detail drawer, Building 360 detail tabs, editor/create/location | Same filter/selection/deep link; fees/history/documents/work/guarantees remain; NAS/map outages recover without fake data; deletion safeguards preserved |
| Guarantees | Workflow queue/list/dashboard, On Service/done/TL/analytics, financial detail/editor/evidence | Preserve all statuses, source component amounts, TL scope, four-eyes/refund approvals, attachment controls, optimistic-lock conflict, print/export restrictions |
| Duct/Cable | Request list/new/edit/phase workspace, editor/PDF, signing, renewal/cancellation/tracking/settings, cable trial | All dynamic phase routes and status gates; documents/NT forms/signing snapshots/placements, assignment/revoke, route review, SLA tracking, refresh pause/dirty; cable stage actions never disappear |
| Car Booking | Availability/reservation → own/return lists; calendar; vehicles; admin/settings/report/dashboard | Overlap/stale availability, Bangkok time, mileage/fuel/parking validation, journey logs/GPS fallback, booking cancel/return, OSP jobs/rebuild/export/retry; same role controls |
| Admin | Contextual section navigation, user/access dialog, role matrix, organization, Work administration, module toggle, audit, car access | Source guardrails and permissions; consequences before reset/revoke/delete/module change; no self-escalation; effective access remains read-only; validation/pending/error/success across forms |
| Auth/utilities | Existing auth shell, login/password/change, error/404/denied/loading/maintenance where supported | No auth logic/policy rewrite; next/session/password-change handling retained; safe error copy; keyboard/password affordances; no enumeration leaks |

## 5. Explicit multi-view coverage expansion

These are separate screen/view acceptance units in addition to page templates. Each is PLANNED. Parameters/IDs are placeholders, never a request against production.

### Work
`src/components/work-route-page.tsx` dispatches `mine`, `mine-list`, `team`, `assign`, `people`, `tracker`, `kpi`, `reports`, `activity`, `due`; `/work` query handling and dedicated routes must agree without losing recordId/ownerId. Test every dispatch branch with allowed and denied grant sets, empty/unavailable/ready data, task detail open/close, notes, edit/delete and each queued/in_progress/blocked/completed/cancelled permitted transition. Open PR completion fields, hold/reason, rule/owner selectors, report CSV/Excel and all Admin KPI/calendar/recalculate flows retain their exact supported API semantics.

### Buildings
`src/app/(platform)/buildings/buildings-workspace.tsx` mounts the current map/list and drawer; `src/features/buildings/map/map-workspace.tsx` is a separate component that may not be its active caller—keep it in OPEN consumer reconciliation, not silently delete it. Modes: buildings/status/expense/heatmap, category/heat metric/date filters; selected building and local drawer tabs must each receive an acceptance case from the source evidence appendix. Building 360 `?tab=` values are overview/location/documents/work/guarantees/activity. Include create location candidate/confirmation, detail location save confirmation, unsaved edit confirmation, typed-name deletion, document preview/download and source-limited rows. Quotation/BOQ/duplicate/version/approval parity requested by master plan remains OPEN where no local mounted control is mapped; do not invent a placeholder button that cannot execute.

### Guarantees
`DepositWorkspace` local views: dashboard/list/on_service/done/queue/analytics; query `view=installation-team` changes entry context. Status options: new/fin/att/tl_wait/tl_process/ret/clo/refund_process/on_service/off_service_pending/done/cancel. Include search/status/owner/area, NO sort, paging, month/year export, copy CID feedback, analytics return view, TL capabilities, evidence/file upload and detail/editor/server conflict. A disabled create action in a particular source state remains a redesigned explained disabled state, not permission to remove the function globally or claim new-create parity. Full status transition matrix must be reconciled with source policy and upstream parity before behavior changes.

### Duct Rental
Exact `[view]` allowlist in `src/app/(platform)/duct-rental/[id]/[view]/page.tsx`: `design`, `draftsman`, `permission`, `install`, `draftsman2`, `permission2`, `3rdparty`, `permission3`, `contract`, `missing-docs`. **Each is its own coverage item D-V01…D-V10 below.** Invalid values invoke notFound, not a default design screen. `/duct-rental/[id]` and edit/new retain distinct entry behaviors. Phase mapping in common.tsx deliberately maps COMPLETE back to design; do not alter business phase progression to simplify tabs.

Requests: list metrics/search/filter/paging/detail preview; new/edit fields and create confirmation; post-create announcement; accept/save/submit/archive/reload; designer/install/rate/guarantee/missing document fields; NT preview/template variants/save/generate; signer assign/revoke; history/files and attachment inspect/remove/download. Renewals: annual batch creation, route keep/drop review with notes, advance/archive, provider/memo/contract documents and preview. Cancellations: selected request, effective date/reason/notes/create, advance/reject/archive. Tracking: type/owner/SLA/query, paging/deep links and summary. Signing: task search/selection, source document/live preview, page/position/scale/rotation/offsets/date, manager draw/upload/default/archive and final sign confirmation. Cable route currently imports `CableTestWorkspace`, while `CommunicationCableWorkspace` also exists: both source surfaces stay in ledger; OPEN consumer/feature reconciliation prevents mistaking dead/alternate code for proof of reachability. Settings include every field/action in source appendix; no omission as “technical”.

### Car Booking
Local tabs in `car-booking-workspace.tsx`: book/mine/return/calendar/vehicles plus admin/all/parking/reports/dashboard. Separate dialog intents: return/log/logs/gps/car/cancel, with car create vs edit distinct form states. Calendar month/week/day or other supported values must come from calendar source evidence, not assumptions. Journey geolocation requesting/denied/unavailable/no-coordinate/remove/retry states must not block optional log saving. OSP reports/dashboard, job pending/rebuild/status/failure/download and access-management screen are independent functions, not covered merely by testing initial booking form.

### Admin
Actual local `?section=` entries in current page: overview/users/positions/teams/roles/kpi/personal-kpi/calendar/recalculate/systems/modules/announcement/audit/restore. Dedicated `/admin/car-booking` remains separate. For every section: only granted data, long labels, empty/filter-empty/pending/server-error/success, direct link/back/refresh. User edit dialog includes profile/access scopes/position/team/selected-teams, temporary password visibility, reset-password confirmation and revoke-sessions confirmation; role delete and team delete browser confirmations are overlays too. Work Admin forms include full versioned KPI/calendar/personal assignments/adjustment-preview/deadline-recalculate/system-link/announcement/restore controls as indexed; do not replace them with a single settings card.

Master-plan future Admin routes/features (e.g. security/access-requests/access-review/bulk CSV) are not asserted present just because the plan names them. Reconcile them as OPEN product/parity requirements against source/API before implementing navigation. They are not exempt from approved all-function coverage; no fabricated live backend or invented security policy.

## 6. Overlay intent register — beyond modal tag counts

Explicit AST overlay occurrences are indexed separately below, but occurrence count is not popup count: one shared dialog serves many intents, browser confirm is not JSX, account/search are disclosures, signature removal can be inline confirmation, and map provider popups are imperative. The following intent register is mandatory and PLANNED; Appendix A/B supplies exact source/line and function/action wiring.

| Intent group | Required independently exercised variants | Contract |
|---|---|---|
| Global navigation | Mobile drawer open, cancel/backdrop/close/navigation, nested module sections; rail hints | C-NAV/C-DIALOG/C-TOOLTIP |
| Global search | Trigger/shortcut, results popover, active option, keyboard, loading/no-results/error/stale response/close | C-POPOVER/C-FEEDBACK |
| Account/notifications | Account disclosure, password/logout pending; notification inbox/read-one/read-all/destination/empty/error | C-POPOVER/C-DIALOG/C-FEEDBACK |
| Generic queue | Record detail panel; create/save/delete saved view prompt/confirmation if supported; truncated text tooltip | C-DIALOG/C-CONFIRM/C-TOOLTIP |
| Work | Create modal; task transition intent for each available status; edit/delete; task note feedback | C-DIALOG/C-CONFIRM/C-FORM |
| Buildings | Detail drawer each tab; location confirmation; discard confirmation; delete with name; provider marker popup; document preview | C-DIALOG/C-CONFIRM/C-MAP/C-DOCUMENT |
| Guarantees | Evidence upload/replacement/validation; editor/TL confirmation prompts; financial approval/conflict; analytics drilldowns where source supports | C-FORM/C-CONFIRM/C-DOCUMENT/C-FEEDBACK |
| Duct request | List detail; new submit; attachment inspect PDF/image; file preview; NT preview/save/generate; submit/archive/reload; unsaved exit | C-DIALOG/C-CONFIRM/C-DOCUMENT |
| Duct processes | Annual creation; keep/drop route review; renewal advance/archive/PDF; cancellation create/advance/reject/archive | C-DIALOG/C-CONFIRM/C-DOCUMENT |
| Duct signing | Final signature preview/confirm; signature manager; archive/remove confirmation; placement/live-preview feedback | C-DIALOG/C-SIGN/C-CONFIRM |
| Cable | Create/edit request per stage; archive/revise/advance/submit confirmations and files | C-DIALOG/C-CONFIRM/C-FORM |
| Car | Return with/without fuel; log with optional fuel/GPS; log list; journey map; new/edit vehicle; booking cancel | C-DIALOG/C-CONFIRM/C-MAP/C-FORM |
| Admin | User access; reset password; revoke sessions; role/team delete; module toggle; recalculation/adjustment preview-confirm and restore | C-DIALOG/C-CONFIRM/C-FORM |
| All | Tooltip/title-only help remediation, native select/date/file chooser integration, inline alert/status/success, print/download errors | C-TOOLTIP/C-FEEDBACK/C-DOCUMENT/C-PRINT |

Browser/OS native select/date/file chooser chrome is not restyled by application CSS; its trigger, accessible labeling, selected/validation/pending result and return-focus are in scope. Browser security/geolocation/PDF permission prompts are external constraints, not exceptions to the surrounding workflow. Do not promise to theme OS dialogs.

## 7. State and Thai-copy contract

For every screen/overlay/action row, implementation evidence must record: trigger and eligible role/scope; initial state; primary action; loading; empty vs filtered-empty; error/retry; denied/session-expired; disabled + reason; saving; success; conflict/stale/partial/offline if supported; cancel/return destination; keyboard/mobile/light/dark. Sources supporting a state are indexed as exact state declarations, conditional expressions and source branch lines. A requirement not found in code is OPEN, never presumed implemented.

Proposed shared Thai phrases (do not overwrite domain terminology): “กำลังโหลดข้อมูล…”, “ยังไม่มีรายการ”, “ไม่พบรายการตามตัวกรองนี้” + “ล้างตัวกรอง”, “โหลดข้อมูลไม่สำเร็จ” + “ลองอีกครั้ง”, “กำลังบันทึก…”, “บันทึกเรียบร้อยแล้ว”, “ข้อมูลมีการเปลี่ยนแปลง กรุณาโหลดข้อมูลล่าสุดก่อนบันทึก”, “บัญชีนี้ยังไม่ได้รับสิทธิ์สำหรับส่วนนี้”. Retain generic authentication failure and existing password policy. A “ขอสิทธิ์” button must only appear if supported by an existing authorized workflow; otherwise show actual administrator-contact guidance, not a dead action. Export labels/file content governed by existing business terminology; user-facing technical identifiers receive Thai explanation with optional advanced detail. Do not translate stored enum/capability/API keys.

Errors live near responsible fields/actions; cross-screen toast may supplement but must not replace persistent financial or destructive-operation results. Background refresh must not erase dirty input or steal focus. Keep Duct pause/new-data freshness notices and work mutation signals. Unauthorized data must never flash before the server denies access. Do not add background polling or infrastructure only for visual polish.

## 8. Rollout and bounded first implementation slice

All phases PLANNED; no dates or completion percentages are implied.

1. **Freeze / reconcile:** refresh HEAD/dirty inventory and permission of each writer; obtain exact reference frames; resolve OPEN caller/legacy/upstream/API mappings; capture local synthetic baseline; choose isolated test environment with approval. Preserve existing user work using targeted diffs, not blanket reset.
2. **First slice — shell + primitive pilot only:** `tokens.css`, mounted shell CSS ownership, `AppShell`/`ModuleNav` adapter and shared Button/Panel/FormField/TableRegion/StatusBadge/Dialog behavior, exercised through Overview and existing Duct request-list + one real preview/confirmation caller. Why: proves global menu depth, long Thai data, table/overlay and blue light/dark neumorphism without rewriting finance/auth/domain state machines. Scope is bounded but is not permission to finish redesign after this slice. Preserve the module registry's existing dirty changes. Freeze exact files after refreshing consumer map and baseline; no schema/API migration.
3. **Core/auth/utilities:** login/change, account/search/notification, loading/denied/error/404, generic queue/detail/saved views; test server-session boundaries without changing policy.
4. **Domain batches:** Work → Buildings → Guarantees → Duct request+phase/editor → Duct process/tracking/signing/settings/cable → Car Booking. Sequence may run disjoint writer scopes only after shared API is stable. Every route/view/function/overlay row remains required; batch labels are not exclusions.
5. **Admin end-to-end:** all current sections and car access; permission-sensitive/financial-policy gaps need domain review before behavior change. Presentation redesign can reuse guarded actions; cannot falsely close missing business features.
6. **Reconcile / independent review / UAT:** zero unexplained missing ledger rows, real authenticated acceptance, source-parity mapping, actual file generation/render checks, accessibility/performance, owner visual approval on all families. Production deploy remains separately authorized.

### 8.1 Overview + Work/KPI implementation checkpoint (producer, not QA closure)

- **Implemented in this bounded slice:** `src/components/dashboard-overview.tsx` remains the Overview composition using `PageHeader`, `WorkspaceQueue`, `EmptyState`, module directory links, partial/unavailable source feedback, saved views, detail overlay, pagination, selection/copy feedback and responsive token consumers. `src/features/work/components/work-screen-shell.tsx` now provides the shared page/metric/empty/unavailable composition used by all Work route variants; `src/styles/work.css` gives the domain panels one token-backed surface contract and preserves responsive table/form/detail/KPI/report layouts.
- **Work route mappings exercised by source/tests:** `/work` dispatches `mine`, `mine-list`, `team`, `assign`, `people`, `tracker`, `kpi`, `reports`, `activity`, `due`; `/work/mine` keeps server filters and scoped read model; Work screens retain task detail, notes, status actions, assignment, people, tracker expansion, KPI facts/rules, reports, activity and due-list branches. Existing tests covered shared shell and route dispatch behavior; targeted run: **3 files / 12 tests passed**.
- **Overlay/primitive change:** Work create action in `src/features/work/screens/my-work.tsx` now uses shared `Dialog` lifecycle (focus, Escape/backdrop/close, busy guard seam, return focus) without changing create form/action or refresh semantics. Shared `Button` now supports `pending`/`pendingLabel` with stable `disabled` + `aria-busy`; regression test was observed RED before implementation and GREEN afterward.
- **KPI coverage:** `src/features/work/screens/kpi-workspace.tsx` retains assignments, published KPI cards, target/progress/period/facts and expandable evidence table. No KPI formula, server query, grant, calendar or recalculation policy changed.
- **Still OPEN:** authenticated role/permission runtime proof, real data/fixture parity, all nine Work URL entry points and every transition/confirmation branch in browser, visual screenshot review at light/dark/mobile, axe/manual keyboard/zoom/forced-colors review, report file export verification, and independent reviewer/owner UAT. Known baseline lint failure remains `src/modules/duct-rental/components/tracking-workspace.tsx:102` conditional `useResource`; renewal metadata and full-system/auth blockers remain unchanged.

Rollback unit: one bounded presentation patch/consumer migration; restore only owned new hunks, preserve pre-existing edits; keep adapters while untouched consumers depend on them. No revert of shared dirty baseline, DB rollback or upstream deletion. Capture before/after screenshot+behavior evidence for each affected family before proceeding.

## 9. Acceptance and evidence schema — no self-certification

Every route/view row S-/V-, every function/control/state in A-, and every overlay O- inherits this template:

```text
ID / source path:line / current source hash / owning route+view
Status: PLANNED (mapping OPEN until reconciled where noted)
Eligible role+scope / denied role+scope / trigger / expected outcome
Shared contracts / preserved server action+payload+version / cancel+return behavior
States tested / theme / viewport / keyboard+screen-reader+zoom / reduced motion
Before evidence / after evidence / real command+result / remaining blocker
Reviewer / owner visual approval / module UAT decision
```

Acceptance per page: route and named view render intended domain, every reachable Appendix A control still operable or explained by real permission/state, query/deep link/back/refresh survive, all supported states and output exports verified, no hidden replacement with a generic queue. Acceptance per overlay: every intent branch opens from its actual trigger; correct identity/content/action; focus trap/return and cancel behavior; validation/deny/pending/conflict/retry/success; body/footer usable on mobile keyboard; no underlying action executes; exact file preview/print if relevant. Acceptance per server-effect function: caller mapping or OPEN; authorized synthetic execution confirms original contract, rejected execution does not leak or mutate; no inferred success from a painted toast.

Required implementation commands per master plan: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:documents`, `npm run build`, plus approved isolated Postgres integration and relevant Playwright/axe suites. Inspect package.json/test scripts afresh before invoking. This documentation task did **not** run app gates, authenticated runtime, integration tests, Figma visual comparison, generated-PDF rendering or UAT. Historical test numbers in older docs are not evidence for this redesign.

Required visual/accessibility matrix: all route/view families and all overlay intents in light+dark; widths 320/375/390/768/1024/1440/1920 as applicable; 200% zoom and reflow; keyboard-only, screen reader landmark/control semantics, focus visibility/return, reduced motion, forced colors. Automated axe serious/critical findings must be resolved; measured contrast and manual keyboard work are separate evidence. Reuse existing tests, extend assertions; do not reduce coverage or bypass permission checks for a screenshot. Performance must be measured with realistic synthetic volume; no new map/PDF/chart bundle in initial shell path, no expensive animated box-shadow on data rows.

Independent reviewer and MaxWell/module-owner visual/UAT acceptance are outstanding. A producer document, successful write, compile, automated test or “looks good” assertion cannot close them.

## 10. Ledger method, semantics and limits

Inventory was programmatically derived from the current working-tree source, not filenames alone. TypeScript parser (installed local `typescript`) walked every non-test `.tsx` plus action/route `.ts` file under src; recorded named function declarations and arrow/function variables, native and recognized component controls, state hooks, selected effect calls and all if/ternary conditions. A separate full source-line index retains JSX `&&`, switch/type/config/option/field-label evidence. All 37 page templates are enumerated and import-closure consumers mapped through source files/barrels plus layouts. The source file/hash manifest makes the evidence snapshot reproducible despite dirty files.

Counts distinguish source occurrences from product functions/screens. A generic Modal implementation and its callers are both indexed; they are not separate product popup intents. Map-provider HTML/imperative popups, native browser confirm/prompt/alert, conditional modal intents, render-prop/generated fields and local tabs require the explicit intent/branch ledger, not naive `<dialog>` counts. Named functions include helpers and server adapters; not every function is an independent visible feature. Source references are navigational evidence, not proof that a branch currently works.

**OPEN mappings are deliberately retained:** unreferenced/alternate UI components, legacy HTML reference features, upstream features described by parity docs but not mapped to a current control, hidden generated/provider surfaces, missing capability/state support, and any route not proven reachable in runtime. Import closure is a static over-approximation, not execution coverage; dynamic/imported renderer boundaries need runtime reconciliation. Source line numbers can drift during implementation: retain IDs, update references and hash; never delete an ID to make a coverage count match. A later deeper AST extraction was approval-pending in this environment; the completed parser pass and supplemental lexical source index are the evidence used here. No pending tool result is treated as executed.

CANNOT establish: editable Figma design tokens from reported raster, current upstream SHA parity from local docs, live production integration behavior, complete role-state reachability without approved test identities/data, browser layout quality from static code, WCAG compliance without measurements, or independent acceptance. These are bounded verification limits, not exclusions from approved redesign.

### Programmatic inventory totals

| Metric | Source-derived count | Meaning |
|---|---:|---|
| route_templates | 37 | page.tsx templates; local/dynamic views separately enumerated |
| ast_files | 186 | non-test TSX plus action/route TS parser records |
| tsx_files | 147 | source occurrences; no runtime completeness implied |
| functions | 455 | source occurrences; no runtime completeness implied |
| controls | 1298 | JSX occurrence records, not unique product actions |
| states | 338 | source occurrences; no runtime completeness implied |
| effects | 138 | source occurrences; no runtime completeness implied |
| conditions | 1467 | if + ternary condition occurrences, not all possible runtime states |
| overlay_occurrences | 28 | explicit tagged/role overlay records, not unique popup intents |
| source_files | 364 | source occurrences; no runtime completeness implied |

Additional lexical branch/config source lines: **831**. Explicit expanded view/intent rows: **68**. Counts computed from collected records; no mental tally.

## 11. Page-template ledger

Each S-row is PLANNED, inherits C-PAGE/C-FEEDBACK plus contracts of its imported controls, and requires the acceptance template in §9. File column is exact source, not a speculative route. Imported TSX owners identify real component families; Appendix A recursively indexes their controls. Dynamic and local-state views in §5/§12 must also pass; 37 routes never means 37 total screens.

| ID | URL template | Exact source | Direct TSX consumers | Acceptance |
|---|---|---|---|---|
| S-001 | `/admin/car-booking` | `src/app/(platform)/admin/car-booking/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/features/car-booking/car-access-workspace.tsx` (A-138) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-002 | `/admin` | `src/app/(platform)/admin/page.tsx` | `src/components/admin-workspace.tsx` (A-095)<br>`src/features/work/components/admin-panels.tsx` (A-144)<br>`src/components/ui/page-header.tsx` (A-117)<br>`src/components/ui/button.tsx` (A-112)<br>`src/components/admin-module-settings.tsx` (A-093) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-003 | `/buildings/[id]/edit` | `src/app/(platform)/buildings/[id]/edit/page.tsx` | `src/features/buildings/building-editor-form.tsx` (A-132)<br>`src/components/ui/page-header.tsx` (A-117) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-004 | `/buildings/[id]` | `src/app/(platform)/buildings/[id]/page.tsx` | `src/components/ui/page-header.tsx` (A-117)<br>`src/components/ui/status-badge.tsx` (A-120)<br>`src/components/ui/truncated-text.tsx` (A-122)<br>`src/features/buildings/map/location-picker.tsx` (A-135)<br>`src/features/buildings/delete-building.tsx` (A-133) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-005 | `/buildings/map` | `src/app/(platform)/buildings/map/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/app/(platform)/buildings/buildings-workspace.tsx` (A-010) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-006 | `/buildings/new` | `src/app/(platform)/buildings/new/page.tsx` | `src/features/buildings/map/building-create-form.tsx` (A-134)<br>`src/components/ui/page-header.tsx` (A-117) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-007 | `/buildings` | `src/app/(platform)/buildings/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/app/(platform)/buildings/buildings-workspace.tsx` (A-010) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-008 | `/car-booking` | `src/app/(platform)/car-booking/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/components/ui/page-header.tsx` (A-117)<br>`src/features/car-booking/car-booking-workspace.tsx` (A-140) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-009 | `/duct-rental/[id]/[view]` | `src/app/(platform)/duct-rental/[id]/[view]/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/modules/duct-rental/components/request-workspace.tsx` (A-169) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-010 | `/duct-rental/[id]/edit` | `src/app/(platform)/duct-rental/[id]/edit/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/modules/duct-rental/components/request-form.tsx` (A-167) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-011 | `/duct-rental/[id]` | `src/app/(platform)/duct-rental/[id]/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/modules/duct-rental/components/request-workspace.tsx` (A-169) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-012 | `/duct-rental/cancellation/[id]` | `src/app/(platform)/duct-rental/cancellation/[id]/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/modules/duct-rental/components/process-workspace.tsx` (A-166) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-013 | `/duct-rental/cancellation/new` | `src/app/(platform)/duct-rental/cancellation/new/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/modules/duct-rental/components/process-workspace.tsx` (A-166) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-014 | `/duct-rental/cancellation` | `src/app/(platform)/duct-rental/cancellation/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/modules/duct-rental/components/process-workspace.tsx` (A-166) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-015 | `/duct-rental/communication-cable` | `src/app/(platform)/duct-rental/communication-cable/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/modules/duct-rental/components/cable-test-workspace.tsx` (A-160) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-016 | `/duct-rental/new` | `src/app/(platform)/duct-rental/new/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/modules/duct-rental/components/request-form.tsx` (A-167) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-017 | `/duct-rental` | `src/app/(platform)/duct-rental/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/modules/duct-rental/components/request-list.tsx` (A-168) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-018 | `/duct-rental/renewal/[id]` | `src/app/(platform)/duct-rental/renewal/[id]/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/modules/duct-rental/components/process-workspace.tsx` (A-166) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-019 | `/duct-rental/renewal` | `src/app/(platform)/duct-rental/renewal/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/modules/duct-rental/components/process-workspace.tsx` (A-166) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-020 | `/duct-rental/settings` | `src/app/(platform)/duct-rental/settings/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/modules/duct-rental/components/settings-workspace.tsx` (A-170) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-021 | `/duct-rental/tasks` | `src/app/(platform)/duct-rental/tasks/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/modules/duct-rental/components/signature-workspace.tsx` (A-171) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-022 | `/duct-rental/tracking` | `src/app/(platform)/duct-rental/tracking/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/modules/duct-rental/components/tracking-workspace.tsx` (A-172) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-023 | `/guarantees/[id]` | `src/app/(platform)/guarantees/[id]/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/components/deposit-editor.tsx` (A-102)<br>`src/components/deposit-tl-workspace.tsx` (A-104)<br>`src/components/ui/truncated-text.tsx` (A-122) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-024 | `/guarantees/new` | `src/app/(platform)/guarantees/new/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/components/deposit-editor.tsx` (A-102) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-025 | `/guarantees` | `src/app/(platform)/guarantees/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/components/deposit-workspace.tsx` (A-105) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-026 | `/` | `src/app/(platform)/page.tsx` | `src/components/dashboard-overview.tsx` (A-101) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-027 | `/work/assign` | `src/app/(platform)/work/assign/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/features/work/screens/assignment-center.tsx` (A-151)<br>`src/features/work/components/work-filters.tsx` (A-149) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-028 | `/work/kpi` | `src/app/(platform)/work/kpi/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/features/work/screens/kpi-workspace.tsx` (A-153)<br>`src/features/work/components/work-filters.tsx` (A-149) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-029 | `/work/mine` | `src/app/(platform)/work/mine/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/features/work/screens/my-tasks-workspace.tsx` (A-154)<br>`src/features/work/components/work-filters.tsx` (A-149) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-030 | `/work/new` | `src/app/(platform)/work/new/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/components/work-create-form.tsx` (A-123)<br>`src/features/work/components/work-screen-shell.tsx` (A-150) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-031 | `/work` | `src/app/(platform)/work/page.tsx` | `src/components/work-route-page.tsx` (A-125) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-032 | `/work/people` | `src/app/(platform)/work/people/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/features/work/screens/people-overview.tsx` (A-156)<br>`src/features/work/components/work-filters.tsx` (A-149) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-033 | `/work/reports` | `src/app/(platform)/work/reports/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/features/work/screens/reports.tsx` (A-157)<br>`src/features/work/components/work-filters.tsx` (A-149) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-034 | `/work/team` | `src/app/(platform)/work/team/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/features/work/screens/team-command.tsx` (A-158)<br>`src/features/work/components/work-filters.tsx` (A-149) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-035 | `/work/tracker` | `src/app/(platform)/work/tracker/page.tsx` | `src/components/access-denied.tsx` (A-091)<br>`src/features/work/screens/job-tracker.tsx` (A-152)<br>`src/features/work/components/work-filters.tsx` (A-149) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-036 | `/change-password` | `src/app/change-password/page.tsx` | `src/components/change-password-form.tsx` (A-100)<br>`src/components/auth/auth-shell.tsx` (A-097) | PLANNED; §9; all applicable states/roles/outputs; §5 views |
| S-037 | `/login` | `src/app/login/page.tsx` | `src/components/login-form.tsx` (A-107)<br>`src/components/auth/auth-shell.tsx` (A-097) | PLANNED; §9; all applicable states/roles/outputs; §5 views |

## 12. Explicit dynamic and query-view rows

All rows PLANNED. Each requires independently captured entry/action/state/cancel evidence under §9, including denied role, light/dark and mobile. Browser query templates below preserve exact tokens; local state rows are not invented public URLs.

| ID | View / intent | Source | Acceptance (PLANNED) |
|---|---|---|---|
| D-V01 | `/duct-rental/[id]/design` | `src/app/(platform)/duct-rental/[id]/[view]/page.tsx:6` | Phase field/document/action/gate variants; created=1 for draftsman; invalid view 404 |
| D-V02 | `/duct-rental/[id]/draftsman` | `src/app/(platform)/duct-rental/[id]/[view]/page.tsx:6` | Phase field/document/action/gate variants; created=1 for draftsman; invalid view 404 |
| D-V03 | `/duct-rental/[id]/permission` | `src/app/(platform)/duct-rental/[id]/[view]/page.tsx:6` | Phase field/document/action/gate variants; created=1 for draftsman; invalid view 404 |
| D-V04 | `/duct-rental/[id]/install` | `src/app/(platform)/duct-rental/[id]/[view]/page.tsx:6` | Phase field/document/action/gate variants; created=1 for draftsman; invalid view 404 |
| D-V05 | `/duct-rental/[id]/draftsman2` | `src/app/(platform)/duct-rental/[id]/[view]/page.tsx:6` | Phase field/document/action/gate variants; created=1 for draftsman; invalid view 404 |
| D-V06 | `/duct-rental/[id]/permission2` | `src/app/(platform)/duct-rental/[id]/[view]/page.tsx:6` | Phase field/document/action/gate variants; created=1 for draftsman; invalid view 404 |
| D-V07 | `/duct-rental/[id]/3rdparty` | `src/app/(platform)/duct-rental/[id]/[view]/page.tsx:6` | Phase field/document/action/gate variants; created=1 for draftsman; invalid view 404 |
| D-V08 | `/duct-rental/[id]/permission3` | `src/app/(platform)/duct-rental/[id]/[view]/page.tsx:6` | Phase field/document/action/gate variants; created=1 for draftsman; invalid view 404 |
| D-V09 | `/duct-rental/[id]/contract` | `src/app/(platform)/duct-rental/[id]/[view]/page.tsx:6` | Phase field/document/action/gate variants; created=1 for draftsman; invalid view 404 |
| D-V10 | `/duct-rental/[id]/missing-docs` | `src/app/(platform)/duct-rental/[id]/[view]/page.tsx:6` | Phase field/document/action/gate variants; created=1 for draftsman; invalid view 404 |
| W-V01 | `/work view=mine` | `src/components/work-route-page.tsx:45` | §5 domain contract; all supported controls + states; role-gated variants |
| W-V02 | `/work view=mine-list` | `src/components/work-route-page.tsx:45` | §5 domain contract; all supported controls + states; role-gated variants |
| W-V03 | `/work view=team` | `src/components/work-route-page.tsx:45` | §5 domain contract; all supported controls + states; role-gated variants |
| W-V04 | `/work view=assign` | `src/components/work-route-page.tsx:45` | §5 domain contract; all supported controls + states; role-gated variants |
| W-V05 | `/work view=people` | `src/components/work-route-page.tsx:45` | §5 domain contract; all supported controls + states; role-gated variants |
| W-V06 | `/work view=tracker` | `src/components/work-route-page.tsx:45` | §5 domain contract; all supported controls + states; role-gated variants |
| W-V07 | `/work view=kpi` | `src/components/work-route-page.tsx:45` | §5 domain contract; all supported controls + states; role-gated variants |
| W-V08 | `/work view=reports` | `src/components/work-route-page.tsx:45` | §5 domain contract; all supported controls + states; role-gated variants |
| W-V09 | `/work view=activity` | `src/components/work-route-page.tsx:45` | §5 domain contract; all supported controls + states; role-gated variants |
| W-V10 | `/work view=due` | `src/components/work-route-page.tsx:45` | §5 domain contract; all supported controls + states; role-gated variants |
| B-V01 | `/buildings/[id]?tab=overview` | `src/app/(platform)/buildings/[id]/page.tsx:20` | §5 domain contract; all supported controls + states; role-gated variants |
| B-V02 | `/buildings/[id]?tab=location` | `src/app/(platform)/buildings/[id]/page.tsx:20` | §5 domain contract; all supported controls + states; role-gated variants |
| B-V03 | `/buildings/[id]?tab=documents` | `src/app/(platform)/buildings/[id]/page.tsx:20` | §5 domain contract; all supported controls + states; role-gated variants |
| B-V04 | `/buildings/[id]?tab=work` | `src/app/(platform)/buildings/[id]/page.tsx:20` | §5 domain contract; all supported controls + states; role-gated variants |
| B-V05 | `/buildings/[id]?tab=guarantees` | `src/app/(platform)/buildings/[id]/page.tsx:20` | §5 domain contract; all supported controls + states; role-gated variants |
| B-V06 | `/buildings/[id]?tab=activity` | `src/app/(platform)/buildings/[id]/page.tsx:20` | §5 domain contract; all supported controls + states; role-gated variants |
| BM-V01 | `Buildings map mode=buildings` | `src/app/(platform)/buildings/buildings-workspace.tsx:51` | §5 domain contract; all supported controls + states; role-gated variants |
| BM-V02 | `Buildings map mode=status` | `src/app/(platform)/buildings/buildings-workspace.tsx:51` | §5 domain contract; all supported controls + states; role-gated variants |
| BM-V03 | `Buildings map mode=expense` | `src/app/(platform)/buildings/buildings-workspace.tsx:51` | §5 domain contract; all supported controls + states; role-gated variants |
| BM-V04 | `Buildings map mode=heatmap` | `src/app/(platform)/buildings/buildings-workspace.tsx:51` | §5 domain contract; all supported controls + states; role-gated variants |
| G-V01 | `Guarantees local view=dashboard` | `src/components/deposit-workspace.tsx:23` | §5 domain contract; all supported controls + states; role-gated variants |
| G-V02 | `Guarantees local view=list` | `src/components/deposit-workspace.tsx:23` | §5 domain contract; all supported controls + states; role-gated variants |
| G-V03 | `Guarantees local view=on_service` | `src/components/deposit-workspace.tsx:23` | §5 domain contract; all supported controls + states; role-gated variants |
| G-V04 | `Guarantees local view=done` | `src/components/deposit-workspace.tsx:23` | §5 domain contract; all supported controls + states; role-gated variants |
| G-V05 | `Guarantees local view=queue` | `src/components/deposit-workspace.tsx:23` | §5 domain contract; all supported controls + states; role-gated variants |
| G-V06 | `Guarantees local view=analytics` | `src/components/deposit-workspace.tsx:23` | §5 domain contract; all supported controls + states; role-gated variants |
| C-V01 | `Car local tab=book` | `src/features/car-booking/car-booking-workspace.tsx:24` | §5 domain contract; all supported controls + states; role-gated variants |
| C-V02 | `Car local tab=mine` | `src/features/car-booking/car-booking-workspace.tsx:24` | §5 domain contract; all supported controls + states; role-gated variants |
| C-V03 | `Car local tab=return` | `src/features/car-booking/car-booking-workspace.tsx:24` | §5 domain contract; all supported controls + states; role-gated variants |
| C-V04 | `Car local tab=calendar` | `src/features/car-booking/car-booking-workspace.tsx:24` | §5 domain contract; all supported controls + states; role-gated variants |
| C-V05 | `Car local tab=vehicles` | `src/features/car-booking/car-booking-workspace.tsx:24` | §5 domain contract; all supported controls + states; role-gated variants |
| C-V06 | `Car local tab=admin` | `src/features/car-booking/car-booking-workspace.tsx:24` | §5 domain contract; all supported controls + states; role-gated variants |
| C-V07 | `Car local tab=all` | `src/features/car-booking/car-booking-workspace.tsx:24` | §5 domain contract; all supported controls + states; role-gated variants |
| C-V08 | `Car local tab=parking` | `src/features/car-booking/car-booking-workspace.tsx:24` | §5 domain contract; all supported controls + states; role-gated variants |
| C-V09 | `Car local tab=reports` | `src/features/car-booking/car-booking-workspace.tsx:24` | §5 domain contract; all supported controls + states; role-gated variants |
| C-V10 | `Car local tab=dashboard` | `src/features/car-booking/car-booking-workspace.tsx:24` | §5 domain contract; all supported controls + states; role-gated variants |
| C-O01 | `Car dialog intent=return` | `src/features/car-booking/car-booking-workspace.tsx:19` | §5 domain contract; all supported controls + states; role-gated variants |
| C-O02 | `Car dialog intent=log` | `src/features/car-booking/car-booking-workspace.tsx:19` | §5 domain contract; all supported controls + states; role-gated variants |
| C-O03 | `Car dialog intent=logs` | `src/features/car-booking/car-booking-workspace.tsx:19` | §5 domain contract; all supported controls + states; role-gated variants |
| C-O04 | `Car dialog intent=gps` | `src/features/car-booking/car-booking-workspace.tsx:19` | §5 domain contract; all supported controls + states; role-gated variants |
| C-O05 | `Car dialog intent=car-create` | `src/features/car-booking/car-booking-workspace.tsx:19` | §5 domain contract; all supported controls + states; role-gated variants |
| C-O06 | `Car dialog intent=car-edit` | `src/features/car-booking/car-booking-workspace.tsx:19` | §5 domain contract; all supported controls + states; role-gated variants |
| C-O07 | `Car dialog intent=cancel` | `src/features/car-booking/car-booking-workspace.tsx:19` | §5 domain contract; all supported controls + states; role-gated variants |
| AD-V01 | `/admin?section=overview` | `src/app/(platform)/admin/page.tsx:64` | §5 domain contract; all supported controls + states; role-gated variants |
| AD-V02 | `/admin?section=users` | `src/app/(platform)/admin/page.tsx:64` | §5 domain contract; all supported controls + states; role-gated variants |
| AD-V03 | `/admin?section=positions` | `src/app/(platform)/admin/page.tsx:64` | §5 domain contract; all supported controls + states; role-gated variants |
| AD-V04 | `/admin?section=teams` | `src/app/(platform)/admin/page.tsx:64` | §5 domain contract; all supported controls + states; role-gated variants |
| AD-V05 | `/admin?section=roles` | `src/app/(platform)/admin/page.tsx:64` | §5 domain contract; all supported controls + states; role-gated variants |
| AD-V06 | `/admin?section=kpi` | `src/app/(platform)/admin/page.tsx:64` | §5 domain contract; all supported controls + states; role-gated variants |
| AD-V07 | `/admin?section=personal-kpi` | `src/app/(platform)/admin/page.tsx:64` | §5 domain contract; all supported controls + states; role-gated variants |
| AD-V08 | `/admin?section=calendar` | `src/app/(platform)/admin/page.tsx:64` | §5 domain contract; all supported controls + states; role-gated variants |
| AD-V09 | `/admin?section=recalculate` | `src/app/(platform)/admin/page.tsx:64` | §5 domain contract; all supported controls + states; role-gated variants |
| AD-V10 | `/admin?section=systems` | `src/app/(platform)/admin/page.tsx:64` | §5 domain contract; all supported controls + states; role-gated variants |
| AD-V11 | `/admin?section=modules` | `src/app/(platform)/admin/page.tsx:64` | §5 domain contract; all supported controls + states; role-gated variants |
| AD-V12 | `/admin?section=announcement` | `src/app/(platform)/admin/page.tsx:64` | §5 domain contract; all supported controls + states; role-gated variants |
| AD-V13 | `/admin?section=audit` | `src/app/(platform)/admin/page.tsx:64` | §5 domain contract; all supported controls + states; role-gated variants |
| AD-V14 | `/admin?section=restore` | `src/app/(platform)/admin/page.tsx:64` | §5 domain contract; all supported controls + states; role-gated variants |
| G-TL | `/guarantees?view=installation-team` | `src/app/(platform)/guarantees/page.tsx` | TL/queue scope and return context |

## 13. Explicit overlay-source occurrence index

All rows PLANNED. See §6 for expanded intents and Appendix A for exact triggers/action expressions; one occurrence can represent many popup variants. Disclosure/search/native-confirm/provider overlays are also in Appendix A and §6, not omitted because they do not use a Dialog tag.

| ID | Exact source | Kind | Wiring / title | Acceptance |
|---|---|---|---|---|
| O-001 | `src/app/(platform)/buildings/buildings-workspace.tsx:276` / A-010-C032 | `dialog` | `ref={dialogRef} className={&#96;permission-drawer ${closing ? "is-closing" : ""}&#96;} aria-label={selected ? &#96;รายละเอียด ${selected.nameTh}&#96; : "รายละเอียดอาคาร"} onCancel={event=>{event.preventDefault();dismiss();}} onClose={() => setSelectedId(null)}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-002 | `src/components/admin-workspace.tsx:55` / A-095-C003 | `dialog` | `ref={dialogRef} className="admin-user-dialog" aria-labelledby={&#96;edit-user-${user.id}&#96;}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-003 | `src/components/admin-workspace.tsx:107` / A-095-C057 | `EditUserDialog` | `user={user} positions={positions} teams={teams} rolePermissions={rolePermissions} userScopes={scopes} sessionCount={sessions.find((item) => item.userId === user.id)?.count \|\| 0}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-004 | `src/components/app-shell.tsx:57` / A-096-C007 | `dialog` | `className={&#96;${styles.drawer} shadow-lg&#96;} id="mobile-workspace-menu" ref={mobileDialog} aria-label="เมนูพื้นที่ทำงาน" onClick={(event) => { if (event.target === mobileDialog.current) mobileDialog.current?.close(); }}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-005 | `src/components/notification-center.tsx:20` / A-110-C002 | `dialog` | `ref={dialog} className="notification-dialog" aria-labelledby="notification-title" onClose={() => trigger.current?.focus()} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-006 | `src/components/ui/truncated-text.tsx:47` / A-122-C003 | `span` | `id={tooltipId} className="truncated-text-tooltip" role="tooltip" hidden={!showTooltip}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-007 | `src/components/workspace-queue.tsx:33` / A-129-C001 | `dialog` | `className={&#96;detail-panel ${closing ? "is-closing" : ""}&#96;} ref={ref} aria-labelledby="detail-title" onCancel={(event) => { event.preventDefault(); dismiss(); }} onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left \|\| event.clientX > rect.right \|\| event.clientY < rect.top \|\| event.clientY > rect.bottom) dismiss(); } }}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-008 | `src/features/buildings/delete-building.tsx:46` / A-133-C002 | `dialog` | `ref={dialog} className="building-delete-dialog" aria-labelledby="building-delete-title" aria-describedby="building-delete-description" onCancel={(event) => { if (pendingRef.current) event.preventDefault(); }}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-009 | `src/features/car-booking/car-booking-dialog.tsx:6` / A-139-C001 | `dialog` | `ref={ref} className="cb-dialog" aria-labelledby={titleId} onCancel={event=>{event.preventDefault();if(!busy)onClose();}}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-010 | `src/features/car-booking/car-booking-workspace.tsx:97` / A-140-C035 | `CarBookingDialog` | `title={{return:"คืนรถ",log:"เพิ่มบันทึกระหว่างทาง",logs:"บันทึกระหว่างทาง",gps:"พิกัดการเดินทาง",car:dialog.car?"แก้ไขรถ":"เพิ่มรถ",cancel:"ยืนยันยกเลิกการจอง"}[dialog.kind]} busy={busy} onClose={()=>setDialog(null)}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-011 | `src/features/work/components/task-actions.tsx:38` / A-146-C007 | `dialog` | `ref={dialog} className="work-command-dialog" aria-labelledby={&#96;command-${task.id}&#96;} onClose={() => { setChoice(null); opener.current?.focus(); }} onCancel={event => { if (pending) event.preventDefault(); }}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-012 | `src/features/work/screens/my-work.tsx:37` / A-155-C009 | `dialog` | `ref={createDialogRef} className="work-create-dialog" aria-labelledby="work-create-title" onClose={() => { setCreateOpen(false); router.refresh(); }} onCancel={(event) => { event.preventDefault(); createDialogRef.current?.close(); }}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-013 | `src/modules/duct-rental/components/attachment-picker.tsx:18` / A-159-C005 | `Modal` | `title="ตรวจเอกสารก่อนแนบ" close={() => setPreview(null)}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-014 | `src/modules/duct-rental/components/cable-test-workspace.tsx:28` / A-160-C012 | `Modal` | `title={editing?&#96;${editing.code} · ${cableLabels[editing.stage]}&#96;:"สร้างคำขอพาดสาย"} close={()=>setEditing(undefined)}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-015 | `src/modules/duct-rental/components/common.tsx:113` / A-161-C004 | `dialog` | `ref={ref} className={styles.modal} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); close(); }}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-016 | `src/modules/duct-rental/components/file-list.tsx:12` / A-164-C007 | `Modal` | `title={preview.name} close={() => setPreview(null)}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-017 | `src/modules/duct-rental/components/process-workspace.tsx:120` / A-166-C021 | `Modal` | `title="สร้างงานต่อสัญญารายปี" close={() => setCreate(false)}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-018 | `src/modules/duct-rental/components/process-workspace.tsx:274` / A-166-C052 | `Modal` | `title={review.status === "keep" ? "ยืนยันคงเส้นทางไว้" : "ยืนยันตัดเส้นทางออก"} close={() => { setReview(null); pause(false); }}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-019 | `src/modules/duct-rental/components/process-workspace.tsx:282` / A-166-C056 | `Modal` | `title={confirm === "archive" ? "ยืนยันเก็บเข้าประวัติ" : "ยืนยันเปลี่ยนสถานะ"} close={() => setConfirm(null)}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-020 | `src/modules/duct-rental/components/process-workspace.tsx:288` / A-166-C058 | `Modal` | `title="สัญญารายปี" close={() => setPreview(null)}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-021 | `src/modules/duct-rental/components/process-workspace.tsx:343` / A-166-C073 | `Modal` | `title="ยืนยันคำขอยกเลิก" close={() => setConfirm(false)}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-022 | `src/modules/duct-rental/components/process-workspace.tsx:419` / A-166-C085 | `Modal` | `title={confirm === "reject" ? "ยืนยันปฏิเสธคำขอ" : confirm === "archive" ? "ยืนยันเก็บเข้าประวัติ" : "ยืนยันเปลี่ยนสถานะยกเลิก"} close={() => setConfirm(null)}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-023 | `src/modules/duct-rental/components/request-form.tsx:114` / A-167-C029 | `Modal` | `title="ยืนยันส่งคำขอ" close={() => setConfirm(false)}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-024 | `src/modules/duct-rental/components/request-list.tsx:129` / A-168-C042 | `Modal` | `title="รายละเอียดคำขอเช่าท่อ" close={() => setDetail(null)}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-025 | `src/modules/duct-rental/components/request-workspace.tsx:120` / A-169-C055 | `Modal` | `title={preview.title} close={() => setPreview(null)}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-026 | `src/modules/duct-rental/components/request-workspace.tsx:121` / A-169-C059 | `Modal` | `title={confirm === "archive" ? "ยืนยันเก็บคำขอเข้าประวัติ" : confirm === "reload" ? "โหลดข้อมูลล่าสุด" : "ยืนยันส่งงาน"} close={() => setConfirm(null)}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-027 | `src/modules/duct-rental/components/signature-workspace.tsx:65` / A-171-C027 | `Modal` | `title="ยืนยันลายเซ็น ชื่อ และวันที่" close={() => setPreview(null)}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |
| O-028 | `src/modules/duct-rental/components/signature-workspace.tsx:66` / A-171-C031 | `Modal` | `title="ลายเซ็นของฉัน" close={() => setManager(false)}` | PLANNED; C-DIALOG / C-TOOLTIP as applicable, §6 intents and §9 |


# Appendix A — exhaustive extracted component/function/control/state ledger

Every subsection and row is **PLANNED**. The ID is stable for this snapshot. Function rows include helpers and server adapters for traceability; they are not permission to change calculations. Control rows retain full flattened attribute/action expressions without truncation. A dynamic text label must be read with the source line / Appendix B; no empty label means “exclude”. State declarations and conditions identify real supported variants; acceptance also requires §7 states, leaving unsupported/missing mappings OPEN. For a server route/action without static page import, mapping is OPEN endpoint/caller reconciliation, not a nonexistent feature. Layout-boundary files (error/loading/not-found) also have framework mounting outside normal imports; they are explicitly retained even where the import graph reports OPEN.

Shared acceptance mapping: interactive action/link→C-ACTION, form/input/select/textarea→C-FORM, table→C-TABLE, tabs/navigation→C-TABS/C-NAV, dialog/Modal→C-DIALOG/C-CONFIRM, map→C-MAP, PDF/upload/editor→C-DOCUMENT, signature→C-SIGN, error/status/loading/empty→C-FEEDBACK, hints/title→C-TOOLTIP. Combine contracts where a control has multiple responsibilities. Every row must get runtime evidence, or remain OPEN with blocker; no source occurrence is automatically “covered” by another screenshot.

## A-001 — `src/app/(platform)/admin/actions.ts`

- Status: PLANNED. Consumers: S-002.
- Normalized UTF-8/LF source SHA-256: `20331c65fe0f9c643f506023176958bf9f23388f7d96b37f5f019f4e855cd0ab`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-001-F001 | 19 | `requireAdmin` | `async function requireAdmin(permission = "core.user.manage") ` |
| A-001-F002 | 25 | `validPassword` | `function validPassword(value: string) ` |
| A-001-F003 | 29 | `normalizeRoleCode` | `function normalizeRoleCode(value: string) ` |
| A-001-F004 | 33 | `createUserAction` | `export async function createUserAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> ` |
| A-001-F005 | 67 | `createPositionAction` | `export async function createPositionAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> ` |
| A-001-F006 | 86 | `updatePositionAction` | `export async function updatePositionAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> ` |
| A-001-F007 | 106 | `createTeamAction` | `export async function createTeamAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> ` |
| A-001-F008 | 128 | `updateTeamAction` | `export async function updateTeamAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> ` |
| A-001-F009 | 143 | `createRoleAction` | `export async function createRoleAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> ` |
| A-001-F010 | 171 | `updateRolePermissionsAction` | `export async function updateRolePermissionsAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> ` |
| A-001-F011 | 208 | `deleteRoleAction` | `export async function deleteRoleAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> ` |
| A-001-F012 | 234 | `deleteTeamAction` | `export async function deleteTeamAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> ` |
| A-001-F013 | 256 | `updateUserAccessAction` | `export async function updateUserAccessAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> ` |
| A-001-F014 | 344 | `resetPasswordAction` | `export async function resetPasswordAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> ` |
| A-001-F015 | 362 | `revokeUserSessionsAction` | `export async function revokeUserSessionsAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> ` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-001-B001 | 21 | `access.passwordChangeRequired \|\| !isAuthorized(access.subject, permission)` |
| A-001-B002 | 35 | `!access` |
| A-001-B003 | 42 | `displayName.length < 2 \|\| !/^\S+@\S+\.\S+$/.test(email) \|\| !/^[0-9a-f-]{36}$/i.test(positionId)` |
| A-001-B004 | 43 | `!validPassword(password)` |
| A-001-B005 | 45 | `!position` |
| A-001-B006 | 46 | `position.scopeType === "TEAM" && !/^[0-9a-f-]{36}$/i.test(teamId)` |
| A-001-B007 | 47 | `teamId && !(await getDb().select({ id: teams.id }).from(teams).where(and(eq(teams.id, teamId), eq(teams.isActive, true))).limit(1)).length` |
| A-001-B008 | 55 | `teamId` |
| A-001-B009 | 69 | `!access` |
| A-001-B010 | 74 | `!code \|\| name.length < 2 \|\| !/^[0-9a-f-]{36}$/i.test(roleId) \|\| !["OWN", "TEAM", "ALL"].includes(scopeType)` |
| A-001-B011 | 88 | `!access` |
| A-001-B012 | 93 | `!/^[0-9a-f-]{36}$/i.test(positionId) \|\| name.length < 2 \|\| !/^[0-9a-f-]{36}$/i.test(roleId) \|\| !["OWN", "TEAM", "ALL"].includes(scopeType)` |
| A-001-B013 | 95 | `!before` |
| A-001-B014 | 97 | `!role` |
| A-001-B015 | 108 | `!access` |
| A-001-B016 | 111 | `code.length < 2 \|\| code.length > 64 \|\| name.length < 2 \|\| name.length > 120` |
| A-001-B017 | 130 | `!access` |
| A-001-B018 | 133 | `!/^[0-9a-f-]{36}$/i.test(teamId) \|\| name.length < 2 \|\| name.length > 120` |
| A-001-B019 | 135 | `!before \|\| !before.isActive` |
| A-001-B020 | 145 | `!access` |
| A-001-B021 | 150 | `code.length < 2 \|\| code.length > 64 \|\| name.length < 2 \|\| name.length > 120` |
| A-001-B022 | 152 | `sourceRoleId` |
| A-001-B023 | 153 | `!/^[0-9a-f-]{36}$/i.test(sourceRoleId)` |
| A-001-B024 | 161 | `capabilityCodes.length` |
| A-001-B025 | 173 | `!access` |
| A-001-B026 | 178 | `!/^[0-9a-f-]{36}$/i.test(roleId) \|\| code.length < 2 \|\| code.length > 64 \|\| name.length < 2 \|\| name.length > 120` |
| A-001-B027 | 183 | `!role` |
| A-001-B028 | 184 | `role.isSystem` |
| A-001-B029 | 193 | `catalogRows.length` |
| A-001-B030 | 196 | `capabilityCodes.length` |
| A-001-B031 | 210 | `!access` |
| A-001-B032 | 212 | `!/^[0-9a-f-]{36}$/i.test(roleId)` |
| A-001-B033 | 215 | `!role` |
| A-001-B034 | 216 | `role.isSystem` |
| A-001-B035 | 221 | `positionReference.length \|\| assignmentReference.length` |
| A-001-B036 | 236 | `!access` |
| A-001-B037 | 238 | `!/^[0-9a-f-]{36}$/i.test(teamId)` |
| A-001-B038 | 241 | `!team \|\| !team.isActive` |
| A-001-B039 | 247 | `member.length \|\| activeAssignment.length` |
| A-001-B040 | 258 | `!access` |
| A-001-B041 | 266 | `!/^[0-9a-f-]{36}$/i.test(userId)` |
| A-001-B042 | 267 | `displayName.length < 2 \|\| displayName.length > 120` |
| A-001-B043 | 268 | `email.length > 254 \|\| !/^\S+@\S+\.\S+$/.test(email)` |
| A-001-B044 | 269 | `employeeCode.length > 64` |
| A-001-B045 | 270 | `!/^[0-9a-f-]{36}$/i.test(positionId) \|\| !["active", "inactive"].includes(status)` |
| A-001-B046 | 274 | `!position` |
| A-001-B047 | 278 | `requestedScope.scopeType === "TEAM" && !/^[0-9a-f-]{36}$/i.test(teamId)` |
| A-001-B048 | 279 | `teamId && !(await getDb().select({ id: teams.id }).from(teams).where(and(eq(teams.id, teamId), eq(teams.isActive, true))).limit(1)).length` |
| A-001-B049 | 282 | `requestedScope.selectedTeamIds.length` |
| A-001-B050 | 284 | `validTeams.length !== requestedScope.selectedTeamIds.length` |
| A-001-B051 | 294 | `!before` |
| A-001-B052 | 313 | `removesAdminAccess` |
| A-001-B053 | 318 | `!otherAdmins.length` |
| A-001-B054 | 321 | `accessChanged` |
| A-001-B055 | 324 | `normalizedTeamId` |
| A-001-B056 | 327 | `requestedScope.scopeType === "SELECTED_TEAMS"` |
| A-001-B057 | 333 | `(accessChanged \|\| statusChanged) && userId !== access.userId` |
| A-001-B058 | 338 | `error instanceof Error && error.message === "LAST_PLATFORM_ADMIN"` |
| A-001-B059 | 346 | `!access` |
| A-001-B060 | 349 | `!/^[0-9a-f-]{36}$/i.test(userId) \|\| !validPassword(password)` |
| A-001-B061 | 351 | `!target` |
| A-001-B062 | 364 | `!access` |
| A-001-B063 | 366 | `!/^[0-9a-f-]{36}$/i.test(userId)` |
| A-001-B064 | 368 | `!target` |

## A-002 — `src/app/(platform)/admin/car-booking/page.tsx`

- Status: PLANNED. Consumers: S-001.
- Normalized UTF-8/LF source SHA-256: `72e3365d097eaf096aaffd1f7b20d1565b67b47073171488e6e2571108bb358f`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-002-F001 | 8 | `CarAccessPage` | `export default async function CarAccessPage()` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-002-C001 | 10 | `AccessDenied`  | `moduleName="สิทธิ์ระบบจองรถ"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-002-B001 | 10 | `access.passwordChangeRequired \|\| !isAuthorized(access.subject,"core.user.manage")` |

## A-003 — `src/app/(platform)/admin/module-actions.ts`

- Status: PLANNED. Consumers: S-002.
- Normalized UTF-8/LF source SHA-256: `90b18696d36f2db3e122f847c4f41350495a399fc5e92f4835d1d5633781079e`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-003-F001 | 13 | `setModuleEnabledAction` | `export async function setModuleEnabledAction(_state: AdminActionState, form: FormData): Promise<AdminActionState> ` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-003-E001 | 21 | `getDb().transaction(async tx => { await tx.execute(sql&#96;select set_config('app.user_id',${access.userId},true)&#96;); const [allowed] = await tx.execute<{ allowed: boolean }>(sql&#96;select public.has_scoped_permission('core.module.manage') as allowed&#96;); if (!allowed?.allowed) throw new Error("Permission revoked"); await tx.execute(sql&#96;select pg_advisory_xact_lock(hashtextextended(${&#96;module:${moduleId}&#96;},0))&#96;); const [before] = await tx.select().from(moduleSettings).where(eq(moduleSettings.moduleId, moduleId)).for("update"); if ((before?.version ?? 0) !== version) throw new Error("Stale version"); await runMaterialChange({ audit: { actorId: access.userId, moduleId: "core", action: "module.enabled.changed", entityType: "module_setting", requestId: crypto.randomUUID(), before: { moduleId, enabled: before?.enabled ?? manifest.enabledByDefault, version }, after: { moduleId, enabled: enabled === "true", version: version + 1 } } }, async () => { await tx.insert(moduleSettings).values({ moduleId, enabled: enabled === "true", version: version + 1, changedBy: access.userId }).onConflictDoUpdate({ target: moduleSettings.moduleId, set: { enabled: enabled === "true", version: version + 1, changedBy: access.userId, updatedAt: new Date() } }); }, tx); })` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-003-B001 | 15 | `!access.userId \|\| access.passwordChangeRequired \|\| !isAuthorized(access.subject, "core.module.manage")` |
| A-003-B002 | 17 | `!result.success` |
| A-003-B003 | 19 | `!manifest \|\| (enabled === "true" && manifest.lifecycle !== "active")` |
| A-003-B004 | 24 | `!allowed?.allowed` |
| A-003-B005 | 27 | `(before?.version ?? 0) !== version` |
| A-003-B006 | 33 | `enabled === "true"` |

## A-004 — `src/app/(platform)/admin/page.tsx`

- Status: PLANNED. Consumers: S-002.
- Normalized UTF-8/LF source SHA-256: `7a90ce66d62f4ca2869cc6be62dd3cae65fad54afec70a538458ffa18576e273`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-004-F001 | 26 | `AdminPage` | `export default async function AdminPage(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-004-C001 | 84 | `PageHeader`  | `title="ผู้ดูแลระบบ" description="การจัดการภายในแอป: บัญชี สิทธิ์ และการตั้งค่าพื้นที่ทำงาน" parent={{ label: "ภาพรวม", href: "/" }} actions={permissionsGranted.users ? <ButtonLink variant="primary" href="/admin/car-booking">สิทธิ์ระบบจองรถ</ButtonLink> : undefined}` |
| A-004-C002 | 84 | `ButtonLink` สิทธิ์ระบบจองรถ | `variant="primary" href="/admin/car-booking"` |
| A-004-C003 | 91 | `Link`  | `key={item.id} href={&#96;/admin?section=${item.id}&#96;} aria-current={current.id === item.id ? "page" : undefined} className={current.id === item.id ? "btn-primary" : "btn-ghost"}` |
| A-004-C004 | 108 | `Link`  | `key={item.id} href={&#96;/admin?section=${item.id}&#96;} className="admin-overview-link"` |
| A-004-C005 | 120 | `details`  | `className="admin-panel"` |
| A-004-C006 | 121 | `summary` สถานะการเชื่อมต่อข้อมูล | `` |
| A-004-C007 | 134 | `form`  | `method="get" className="admin-filter-form" aria-label="ตัวกรองประวัติ"` |
| A-004-C008 | 135 | `input`  | `type="hidden" name="section" value="audit"` |
| A-004-C009 | 136 | `input`  | `name="auditModule" defaultValue={typeof params.auditModule === "string" ? params.auditModule : ""}` |
| A-004-C010 | 137 | `input`  | `name="auditAction" defaultValue={typeof params.auditAction === "string" ? params.auditAction : ""}` |
| A-004-C011 | 138 | `select`  | `name="auditActor" defaultValue={typeof params.auditActor === "string" ? params.auditActor : ""}` |
| A-004-C012 | 142 | `input`  | `type="date" name="auditFrom" defaultValue={typeof params.auditFrom === "string" ? params.auditFrom : ""}` |
| A-004-C013 | 143 | `input`  | `type="date" name="auditTo" defaultValue={typeof params.auditTo === "string" ? params.auditTo : ""}` |
| A-004-C014 | 145 | `button` ใช้ตัวกรอง | `className="secondary-action"` |
| A-004-C015 | 146 | `Link` ล้างตัวกรอง | `href="/admin?section=audit"` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-004-E001 | 35 | `redirect("/")` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-004-B001 | 35 | `access.passwordChangeRequired \|\| (!Object.values(permissionsGranted).some(Boolean) && !Object.values(workAdmin.granted).some(Boolean))` |
| A-004-B002 | 37 | `typeof params.auditModule==="string"&&params.auditModule` |
| A-004-B003 | 38 | `typeof params.auditAction==="string"&&params.auditAction` |
| A-004-B004 | 39 | `typeof params.auditActor==="string"&&/^[0-9a-f-]{36}$/i.test(params.auditActor)` |
| A-004-B005 | 40 | `typeof params.auditFrom==="string"&&businessDateSchema.safeParse(params.auditFrom).success` |
| A-004-B006 | 41 | `typeof params.auditTo==="string"&&businessDateSchema.safeParse(params.auditTo).success` |
| A-004-B007 | 47 | `canReadUsers` |
| A-004-B008 | 50 | `needsAccessReferences` |
| A-004-B009 | 52 | `needsAccessReferences` |
| A-004-B010 | 53 | `(permissionsGranted.users \|\| permissionsGranted.teams \|\| permissionsGranted.positions)` |
| A-004-B011 | 54 | `needsAccessReferences` |
| A-004-B012 | 56 | `canReadUsers` |
| A-004-B013 | 59 | `permissionsGranted.users` |
| A-004-B014 | 60 | `permissionsGranted.audit` |
| A-004-B015 | 63 | `permissionsGranted.audit` |
| A-004-B016 | 64 | `permissionsGranted.modules` |
| A-004-B017 | 84 | `permissionsGranted.users` |
| A-004-B018 | 91 | `current.id === item.id` |
| A-004-B019 | 91 | `current.id === item.id` |
| A-004-B020 | 97 | `current.id === "overview"` |
| A-004-B021 | 124 | `source.status === "ready"` |
| A-004-B022 | 136 | `typeof params.auditModule === "string"` |
| A-004-B023 | 137 | `typeof params.auditAction === "string"` |
| A-004-B024 | 138 | `typeof params.auditActor === "string"` |
| A-004-B025 | 142 | `typeof params.auditFrom === "string"` |
| A-004-B026 | 143 | `typeof params.auditTo === "string"` |

## A-005 — `src/app/(platform)/admin/work-actions.ts`

- Status: PLANNED. Consumers: S-002.
- Normalized UTF-8/LF source SHA-256: `900942a6d99570b1182a76cbcfd010eb24278a644cc6cc58be66b64f03bb2892`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-005-F001 | 8 | `context` | `async function context() ` |
| A-005-F002 | 13 | `failed` | `(error:unknown):WorkAdminState ` |
| A-005-F003 | 14 | `saveWorkAdminAction` | `export async function saveWorkAdminAction(_previous:WorkAdminState,form:FormData):Promise<WorkAdminState> ` |
| A-005-F004 | 32 | `previewWorkAdminAction` | `export async function previewWorkAdminAction(_previous:WorkAdminState,form:FormData):Promise<WorkAdminState> ` |
| A-005-F005 | 37 | `confirmWorkAdminAction` | `export async function confirmWorkAdminAction(_previous:WorkAdminState,form:FormData):Promise<WorkAdminState> ` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-005-E001 | 40 | `confirmDeadlineRecalculation(parsed.data,ctx)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-005-B001 | 10 | `!access.subject \|\| access.passwordChangeRequired` |
| A-005-B002 | 13 | `error instanceof Error && error.name === "ConcurrentWorkUpdateError"` |
| A-005-B003 | 13 | `error instanceof z.ZodError` |
| A-005-B004 | 13 | `error instanceof Error && error.name === "AuthorizationError"` |
| A-005-B005 | 13 | `error instanceof Error && error.name === "ConcurrentWorkUpdateError"` |
| A-005-B006 | 16 | `!ctx` |
| A-005-B007 | 18 | `!["holiday","rule","personal","system","announcement"].includes(kind)` |
| A-005-B008 | 22 | `kind === "personal" \|\| kind === "rule"` |
| A-005-B009 | 25 | `kind === "personal"` |
| A-005-B010 | 33 | `!ctx` |
| A-005-B011 | 34 | `!["deadlines","kpi_migration"].includes(kind)` |
| A-005-B012 | 38 | `!ctx \|\| form.get("confirm")!=="on"` |
| A-005-B013 | 39 | `!parsed.success` |

## A-006 — `src/app/(platform)/buildings/[id]/edit/page.tsx`

- Status: PLANNED. Consumers: S-003.
- Normalized UTF-8/LF source SHA-256: `3bac7c38704c6f1f05c109ddc4af348f08b6825ca0f5704575eac445ae9f191a`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-006-F001 | 16 | `EditBuildingPage` | `export default async function EditBuildingPage(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-006-C001 | 23 | `PageHeader`  | `title={copy.buildingEditor.editTitle} description={copy.buildingEditor.editDescription} parent={{ label: copy.pages.buildings_id, href: &#96;/buildings/${id}&#96; }} className="page-enter"` |
| A-006-C002 | 24 | `BuildingEditorForm`  | `id={id} initial={buildingEditorInitial(data)} teams={rows} canCreateWithoutTeam apiKey={process.env.LONGDO_MAP_API_KEY ?? ""}` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-006-E001 | 18 | `notFound()` |
| A-006-E002 | 20 | `notFound()` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-006-B001 | 18 | `!/^[0-9a-f-]{36}$/i.test(id)` |
| A-006-B002 | 20 | `!data` |
| A-006-B003 | 21 | `data.building.ownerTeamId` |

## A-007 — `src/app/(platform)/buildings/[id]/loading.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `64c5fc711d8bfc1d2f50cbcbc6c87adf6aa67d879b0b31d60cbc545620a3dc5b`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-007-F001 | 2 | `Loading` | `export default function Loading() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-007-C001 | 2 | `PageSkeleton`  | `shape="detail"` |

## A-008 — `src/app/(platform)/buildings/[id]/page.tsx`

- Status: PLANNED. Consumers: S-004.
- Normalized UTF-8/LF source SHA-256: `bb5dd6a1672426f28a3ac17de2c466e8b459d992af3d0a30b32436df8d015d09`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-008-F001 | 15 | `BuildingDetailPage` | `export default async function BuildingDetailPage(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-008-C001 | 23 | `PageHeader`  | `title={data.building.nameTh} description={[data.building.code, data.building.nameEn].filter(Boolean).join(" · ")} parent={{ label: "ข้อมูลอาคาร", href: "/buildings" }} actions={<><StatusBadge label={data.building.status} tone={data.building.status === "active" ? "success" : "neutral"}/>{data.location.canUpdate && <Link className="button" href={&#96;/buildings/${id}/edit&#96;}>{copy.buildingEditor.editTitle}</Link>}{data.canDelete && <DeleteBuilding id={id} name={data.building.nameTh} version={data.building.version}/>}</>}` |
| A-008-C002 | 23 | `StatusBadge`  | `label={data.building.status} tone={data.building.status === "active" ? "success" : "neutral"}` |
| A-008-C003 | 23 | `Link`  | `className="button" href={&#96;/buildings/${id}/edit&#96;}` |
| A-008-C004 | 24 | `p`  | `role="status"` |
| A-008-C005 | 25 | `Link`  | `key={key} href={&#96;/buildings/${id}?tab=${key}&#96;} aria-current={tab === key ? "page" : undefined}` |
| A-008-C006 | 27 | `BuildingLocationPicker`  | `buildingId={id} apiKey={process.env.LONGDO_MAP_API_KEY ?? ""} canUpdate={data.location.canUpdate} initial={data.location.latitude !== null && data.location.longitude !== null ? { latitude: data.location.latitude, longitude: data.location.longitude, accuracy: data.location.accuracy, source: data.location.source === "gps" \|\| data.location.source === "search" \|\| data.location.source === "manual_pin" ? data.location.source : "import", placeId: data.location.placeId, address: data.location.address, subdistrict: data.location.subdistrict, district: data.location.district, province: data.location.province, postcode: data.location.postcode, } : null}` |
| A-008-C007 | 34 | `table`  | `className="ui-table"` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-008-E001 | 17 | `notFound()` |
| A-008-E002 | 19 | `notFound()` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-008-B001 | 17 | `!/^[0-9a-f-]{36}$/i.test(id)` |
| A-008-B002 | 19 | `!data` |
| A-008-B003 | 21 | `tabs.some(([key]) => key === query.tab)` |
| A-008-B004 | 23 | `data.building.status === "active"` |
| A-008-B005 | 25 | `tab === key` |
| A-008-B006 | 27 | `data.location.latitude !== null && data.location.longitude !== null` |
| A-008-B007 | 29 | `data.location.source === "gps" \|\| data.location.source === "search" \|\| data.location.source === "manual_pin"` |

## A-009 — `src/app/(platform)/buildings/building-map.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `6db1fa6b2aa33762963e2231c07f9d365564cfaab0d2c34bc09989a6853b99e6`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-009-F001 | 7 | `BuildingMap` | `export function BuildingMap(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-009-C001 | 12 | `LongdoMapCanvas`  | `apiKey={apiKey} points={points} selectedId={selectedId} onSelect={onOpenDetails}` |
| A-009-C002 | 13 | `div`  | `className="permission-map-empty" role="status"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-009-B001 | 8 | `item.lat === null \|\| item.lng === null` |
| A-009-B002 | 10 | `item.locationVerified` |

## A-010 — `src/app/(platform)/buildings/buildings-workspace.tsx`

- Status: PLANNED. Consumers: S-005, S-007.
- Normalized UTF-8/LF source SHA-256: `f81be9b63f69cb82e9d656795dd65aa675c3a80d3dac8e8629ae51632572bdd6`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-010-F001 | 23 | `number` | `(value: number) ` |
| A-010-F002 | 33 | `formatBytes` | `(size: number) ` |
| A-010-F003 | 34 | `formatDate` | `(value: string) ` |
| A-010-F004 | 36 | `optionsFor` | `function optionsFor(buildings: PermissionBuildingRow[], key: FilterKey) ` |
| A-010-F005 | 40 | `matchesBuildingQuery` | `function matchesBuildingQuery(text: string, query: string) ` |
| A-010-F006 | 44 | `BuildingsWorkspace` | `export function BuildingsWorkspace(` |
| A-010-F007 | 125 | `syncFromUrl` | `() ` |
| A-010-F008 | 187 | `onKeyDown` | `(event: KeyboardEvent) ` |
| A-010-F009 | 196 | `openBuilding` | `function openBuilding(item: PermissionBuildingRow) ` |
| A-010-F010 | 197 | `selectTab` | `function selectTab(next: typeof tab) ` |
| A-010-F011 | 201 | `retryDocuments` | `function retryDocuments() ` |
| A-010-F012 | 205 | `copyValue` | `async function copyValue(label: string, value: string) ` |
| A-010-F013 | 214 | `searchKeyDown` | `function searchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) ` |
| A-010-F014 | 220 | `setFilter` | `function setFilter(key: FilterKey, value: string) ` |
| A-010-F015 | 222 | `reset` | `function reset() ` |
| A-010-F016 | 314 | `Info` | `function Info(` |
| A-010-F017 | 315 | `splitValues` | `function splitValues(value: string, separator: RegExp) ` |
| A-010-F018 | 316 | `feeInGroup` | `function feeInGroup(fee: NonNullable<PermissionBuildingRow["boq"]>["fees"][number], group: string) ` |
| A-010-F019 | 321 | `statusTone` | `function statusTone(status: string) ` |
| A-010-F020 | 322 | `statusLabel` | `function statusLabel(status: string) ` |
| A-010-F021 | 323 | `statusClass` | `function statusClass(status: string) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-010-C001 | 226 | `PageHeader`  | `parent={{ label: "ภาพรวม", href: "/" }} title="ข้อมูลอาคาร" description="ค้นหาอาคาร ตรวจสอบตำแหน่ง ค่าใช้จ่าย ใบเสนอราคา และเอกสารภายใน"` |
| A-010-C002 | 227 | `div`  | `className="permission-search" role="search"` |
| A-010-C003 | 228 | `input`  | `ref={searchRef} value={query} onChange={(event) => { setQuery(event.target.value.slice(0, 120)); setSuggestionIndex(-1); }} onFocus={() => setFocused(true)} onKeyDown={searchKeyDown} onBlur={() => window.setTimeout(() => setFocused(false), 130)} placeholder="ค้นหาอาคาร... ภาษาไทย หรือ English" aria-label="ค้นหาอาคาร" autoComplete="off"` |
| A-010-C004 | 230 | `button` × | `type="button" className="permission-search-clear" onClick={() => { setQuery(""); searchRef.current?.focus(); }} aria-label="ล้างการค้นหา"` |
| A-010-C005 | 231 | `div`  | `className="permission-autocomplete" role="listbox" aria-label="ผลการค้นหาอาคาร"` |
| A-010-C006 | 231 | `button`  | `type="button" role="option" aria-selected={suggestionIndex === index} key={item.id} onMouseDown={(event) => event.preventDefault()} onClick={() => openBuilding(item)}` |
| A-010-C007 | 233 | `div`  | `className="permission-view-toggle" role="group" aria-label="สลับมุมมอง"` |
| A-010-C008 | 233 | `button` แผนที่ | `type="button" aria-pressed={view === "map"} onClick={() => setView("map")}` |
| A-010-C009 | 233 | `button` รายการ | `type="button" aria-pressed={view === "list"} onClick={() => setView("list")}` |
| A-010-C010 | 233 | `Link` เพิ่มอาคาร | `className="btn-primary" href="/buildings/new"` |
| A-010-C011 | 234 | `button` ตัวกรอง | `type="button" className="permission-filter-toggle" aria-expanded={filtersOpen} aria-controls="permission-filters" onClick={() => setFiltersOpen((open) => !open)}` |
| A-010-C012 | 237 | `button`  | `type="button" key={status} className={filters.status === status ? "active" : ""} aria-pressed={filters.status === status} onClick={() => setFilter("status", filters.status === status ? "" : status)}` |
| A-010-C013 | 237 | `StatusBadge`  | `label={statusLabel(status)} tone={statusTone(status)}` |
| A-010-C014 | 242 | `select`  | `value={filters[key]} onChange={(event) => setFilter(key, event.target.value)} aria-label={&#96;กรองตาม${fieldLabels[key]}&#96;}` |
| A-010-C015 | 247 | `select`  | `value={province} onChange={(event) => setProvince(event.target.value)} aria-label="กรองตามจังหวัด"` |
| A-010-C016 | 248 | `select`  | `value={mode} onChange={(event) => setMode(event.target.value as typeof mode)} aria-label="เลือกมุมมองแผนที่"` |
| A-010-C017 | 249 | `select`  | `value={category} onChange={(event) => setCategory(event.target.value as BuildingMapExpenseCategory)} aria-label="กรองตามหมวดค่าใช้จ่าย"` |
| A-010-C018 | 250 | `select`  | `value={heatMetric} onChange={(event) => setHeatMetric(event.target.value as typeof heatMetric)} aria-label="เลือกตัวชี้วัดความหนาแน่น"` |
| A-010-C019 | 251 | `input`  | `type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} aria-label="กรองวันที่เริ่มต้น"` |
| A-010-C020 | 252 | `input`  | `type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} aria-label="กรองวันที่สิ้นสุด"` |
| A-010-C021 | 253 | `button` รีเซ็ต | `type="button" className="permission-reset" onClick={reset} disabled={!query && activeFilterCount === 0}` |
| A-010-C022 | 256 | `button` : × | `type="button" key={key} onClick={() => setFilter(key, "")}` |
| A-010-C023 | 258 | `div`  | `className="permission-copy-status" role="status"` |
| A-010-C024 | 261 | `p` โหลดแล้ว จาก อาคารในขอบเขต (สูงสุด อาคารต่อการโหลดแผนที่) โปรดจำกัดการค้นหาหรือจังหวัดเพื่อดูผลลัพธ์เฉพาะกลุ่ม; รายการที่เลือกอาจถูกโหลดเพิ่มเพื่อเปิดรายละเอียด | `className="permission-map-notice" role="status"` |
| A-010-C025 | 262 | `LongdoMapCanvas`  | `apiKey={apiKey} points={mapPoints} selectedId={selectedId} heatmap={mode === "heatmap"} onSelect={(id) => { const item = mapVisible.find((building) => building.id === id); if (item) openBuilding(item); }} onFallbackToList={() => setView("list")}` |
| A-010-C026 | 269 | `button`  | `type="button" className="permission-overview-card-main" onClick={() => openBuilding(item)}` |
| A-010-C027 | 270 | `StatusBadge`  | `label={statusLabel(item.status)} tone={statusTone(item.status)}` |
| A-010-C028 | 271 | `Link` เปิดข้อมูล | `href={&#96;/buildings/${item.id}&#96;}` |
| A-010-C029 | 271 | `Link` แก้ไข | `href={&#96;/buildings/${item.id}/edit&#96;}` |
| A-010-C030 | 272 | `div`  | `className="permission-overview-empty" role="status"` |
| A-010-C031 | 272 | `button` ล้างการค้นหาและตัวกรอง | `type="button" onClick={reset}` |
| A-010-C032 | 276 | `dialog`  | `ref={dialogRef} className={&#96;permission-drawer ${closing ? "is-closing" : ""}&#96;} aria-label={selected ? &#96;รายละเอียด ${selected.nameTh}&#96; : "รายละเอียดอาคาร"} onCancel={event=>{event.preventDefault();dismiss();}} onClose={() => setSelectedId(null)}` |
| A-010-C033 | 277 | `Link`  | `className="secondary-action" href={&#96;/buildings/${selected.id}&#96;}` |
| A-010-C034 | 277 | `Link`  | `className="secondary-action" href={&#96;/buildings/${selected.id}/edit&#96;}` |
| A-010-C035 | 277 | `button` × | `type="button" onClick={dismiss} aria-label="ปิดรายละเอียด"` |
| A-010-C036 | 278 | `StatusBadge`  | `label={selected.status \|\| "—"} tone={statusTone(selected.status)}` |
| A-010-C037 | 279 | `div`  | `className="permission-drawer-alert" role="status"` |
| A-010-C038 | 280 | `div`  | `className="permission-drawer-tabs" role="tablist" aria-label="รายละเอียดอาคาร"` |
| A-010-C039 | 281 | `button`  | `type="button" role="tab" aria-selected={tab === key} key={key} onClick={() => selectTab(key)}` |
| A-010-C040 | 283 | `div`  | `className="permission-drawer-content" role="tabpanel"` |
| A-010-C041 | 288 | `button` คัดลอกพิกัด | `type="button" onClick={() => void copyValue("พิกัด", &#96;${selected.lat}, ${selected.lng}&#96;)}` |
| A-010-C042 | 288 | `details`  | `className="permission-remark"` |
| A-010-C043 | 288 | `summary` หมายเหตุจากข้อมูลเดิม | `` |
| A-010-C044 | 292 | `a` โทร | `href={&#96;tel:${value.replace(/[^+\d]/g, "")}&#96;}` |
| A-010-C045 | 292 | `button` คัดลอก | `type="button" onClick={() => void copyValue("หมายเลขโทรศัพท์", value)}` |
| A-010-C046 | 293 | `a` ส่งอีเมล | `href={&#96;mailto:${value}&#96;}` |
| A-010-C047 | 293 | `button` คัดลอก | `type="button" onClick={() => void copyValue("อีเมล", value)}` |
| A-010-C048 | 303 | `button` ค้นหาใหม่ | `type="button" onClick={retryDocuments} disabled={documentState?.status === "loading"}` |
| A-010-C049 | 304 | `div`  | `className={&#96;permission-doc-state ${documentState?.status === "error" ? "error" : ""}&#96;} role="status"` |
| A-010-C050 | 304 | `button` ลองอีกครั้ง | `type="button" onClick={retryDocuments}` |
| A-010-C051 | 305 | `a` ดาวน์โหลด | `href={file.href} download={file.name}` |
| A-010-C052 | 308 | `button` ปิด | `type="button" onClick={dismiss}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-010-T001 | 49 | `[view, setView] = useState<"map" \| "list">(initialView)` |
| A-010-T002 | 50 | `[province, setProvince] = useState(initialProvince)` |
| A-010-T003 | 51 | `[mode, setMode] = useState<"buildings" \| "status" \| "expense" \| "heatmap">((["buildings", "status", "expense", "heatmap"].includes(initialMode) ? initialMode : "buildings") as "buildings" \| "status" \| "expense" \| "heatmap")` |
| A-010-T004 | 53 | `[category, setCategory] = useState<BuildingMapExpenseCategory>(categories.includes(initialCategory as BuildingMapExpenseCategory) ? initialCategory as BuildingMapExpenseCategory : "CAPEX")` |
| A-010-T005 | 54 | `[heatMetric, setHeatMetric] = useState<"building_count" \| "fee_count" \| "amount">((["building_count", "fee_count", "amount"].includes(initialHeatMetric) ? initialHeatMetric : "building_count") as "building_count" \| "fee_count" \| "amount")` |
| A-010-T006 | 55 | `[fromDate, setFromDate] = useState(initialFromDate)` |
| A-010-T007 | 56 | `[toDate, setToDate] = useState(initialToDate)` |
| A-010-T008 | 57 | `[query, setQuery] = useState(initialQuery)` |
| A-010-T009 | 58 | `[previousInitialQuery, setPreviousInitialQuery] = useState(initialQuery)` |
| A-010-T010 | 59 | `[filters, setFilters] = useState<Filters>({ status: initialFilters.status ?? "", group: initialFilters.group ?? "", type: initialFilters.type ?? "", installType: initialFilters.installType ?? "", surveyType: initialFilters.surveyType ?? "", area: initialFilters.area ?? "", })` |
| A-010-T011 | 68 | `[previousInitialFilterSignature, setPreviousInitialFilterSignature] = useState(initialFilterSignature)` |
| A-010-T012 | 78 | `[filtersOpen, setFiltersOpen] = useState(initialFiltersOpen)` |
| A-010-T013 | 79 | `[focused, setFocused] = useState(false)` |
| A-010-T014 | 80 | `[suggestionIndex, setSuggestionIndex] = useState(-1)` |
| A-010-T015 | 81 | `[selectedId, setSelectedId] = useState<string \| null>(initialSelectedId \|\| null)` |
| A-010-T016 | 82 | `[tab, setTab] = useState<"general" \| "contact" \| "fee" \| "documents">("general")` |
| A-010-T017 | 83 | `[documentState, setDocumentState] = useState<DocumentState \| null>(null)` |
| A-010-T018 | 84 | `[documentReload, setDocumentReload] = useState(0)` |
| A-010-T019 | 85 | `[copyMessage, setCopyMessage] = useState("")` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-010-E001 | 88 | `dialogRef.current?.close()` |
| A-010-E002 | 155 | `dialog.showModal()` |
| A-010-E003 | 156 | `dialog.close()` |
| A-010-E004 | 166 | `sessionFetch(&#96;/api/nas/building-documents?${params}&#96;, { signal: controller.signal, cache: "no-store" }).then(async (response) => { if (response.status === 404) { setDocumentState({ key: building.id, status: "empty", files: [], message: copy.feedback.documentsEmpty }); return; } if (!response.ok) throw new Error(response.status === 403 ? "บัญชีนี้ไม่มีสิทธิ์ดูเอกสาร" : copy.feedback.documentsUnavailable); const raw: unknown = await response.json(); const source = raw && typeof raw === "object" && "files" in raw && Array.isArray(raw.files) ? raw.files : []; const files: DocumentFile[] = source.flatMap((entry: unknown) => { if (!entry \|\| typeof entry !== "object") return []; const file = entry as Record<string, unknown>; const category = String(file.category \|\| ""); const href = String(file.download_url \|\| ""); if (!Object.hasOwn(categoryLabels, category) \|\| !String(file.name \|\| "") \|\| !href.startsWith("/api/nas/download?token=")) return []; return [{ name: String(file.name), category: category as DocumentFile["category"], extension: String(file.extension \|\| ""), size: Number(file.size) \|\| 0, modifiedAt: String(file.modified_at \|\| ""), href }]; }); setDocumentState({ key: building.id, status: files.length ? "ready" : "empty", files, message: files.length ? "" : "พบโฟลเดอร์แล้ว แต่ยังไม่มีเอกสารที่ระบบรองรับ" }); }).catch(() => { if (timedOut \|\| !controller.signal.aborted) setDocumentState({ key: building.id, status: "error", files: [], message: timedOut ? copy.feedback.documentTimeout : copy.feedback.documentsUnavailable }); }).finally(() => window.clearTimeout(timer))` |
| A-010-E005 | 166 | `sessionFetch(&#96;/api/nas/building-documents?${params}&#96;, { signal: controller.signal, cache: "no-store" }).then(async (response) => { if (response.status === 404) { setDocumentState({ key: building.id, status: "empty", files: [], message: copy.feedback.documentsEmpty }); return; } if (!response.ok) throw new Error(response.status === 403 ? "บัญชีนี้ไม่มีสิทธิ์ดูเอกสาร" : copy.feedback.documentsUnavailable); const raw: unknown = await response.json(); const source = raw && typeof raw === "object" && "files" in raw && Array.isArray(raw.files) ? raw.files : []; const files: DocumentFile[] = source.flatMap((entry: unknown) => { if (!entry \|\| typeof entry !== "object") return []; const file = entry as Record<string, unknown>; const category = String(file.category \|\| ""); const href = String(file.download_url \|\| ""); if (!Object.hasOwn(categoryLabels, category) \|\| !String(file.name \|\| "") \|\| !href.startsWith("/api/nas/download?token=")) return []; return [{ name: String(file.name), category: category as DocumentFile["category"], extension: String(file.extension \|\| ""), size: Number(file.size) \|\| 0, modifiedAt: String(file.modified_at \|\| ""), href }]; }); setDocumentState({ key: building.id, status: files.length ? "ready" : "empty", files, message: files.length ? "" : "พบโฟลเดอร์แล้ว แต่ยังไม่มีเอกสารที่ระบบรองรับ" }); }).catch(() => { if (timedOut \|\| !controller.signal.aborted) setDocumentState({ key: building.id, status: "error", files: [], message: timedOut ? copy.feedback.documentTimeout : copy.feedback.documentsUnavailable }); })` |
| A-010-E006 | 166 | `sessionFetch(&#96;/api/nas/building-documents?${params}&#96;, { signal: controller.signal, cache: "no-store" }).then(async (response) => { if (response.status === 404) { setDocumentState({ key: building.id, status: "empty", files: [], message: copy.feedback.documentsEmpty }); return; } if (!response.ok) throw new Error(response.status === 403 ? "บัญชีนี้ไม่มีสิทธิ์ดูเอกสาร" : copy.feedback.documentsUnavailable); const raw: unknown = await response.json(); const source = raw && typeof raw === "object" && "files" in raw && Array.isArray(raw.files) ? raw.files : []; const files: DocumentFile[] = source.flatMap((entry: unknown) => { if (!entry \|\| typeof entry !== "object") return []; const file = entry as Record<string, unknown>; const category = String(file.category \|\| ""); const href = String(file.download_url \|\| ""); if (!Object.hasOwn(categoryLabels, category) \|\| !String(file.name \|\| "") \|\| !href.startsWith("/api/nas/download?token=")) return []; return [{ name: String(file.name), category: category as DocumentFile["category"], extension: String(file.extension \|\| ""), size: Number(file.size) \|\| 0, modifiedAt: String(file.modified_at \|\| ""), href }]; }); setDocumentState({ key: building.id, status: files.length ? "ready" : "empty", files, message: files.length ? "" : "พบโฟลเดอร์แล้ว แต่ยังไม่มีเอกสารที่ระบบรองรับ" }); })` |
| A-010-E007 | 166 | `sessionFetch(&#96;/api/nas/building-documents?${params}&#96;, { signal: controller.signal, cache: "no-store" })` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-010-B001 | 33 | `size < 1024` |
| A-010-B002 | 33 | `size < 1024 ** 2` |
| A-010-B003 | 34 | `Number.isNaN(date.getTime())` |
| A-010-B004 | 51 | `["buildings", "status", "expense", "heatmap"].includes(initialMode)` |
| A-010-B005 | 53 | `categories.includes(initialCategory as BuildingMapExpenseCategory)` |
| A-010-B006 | 54 | `["building_count", "fee_count", "amount"].includes(initialHeatMetric)` |
| A-010-B007 | 69 | `initialQuery !== previousInitialQuery` |
| A-010-B008 | 71 | `query !== initialQuery` |
| A-010-B009 | 73 | `initialFilterSignature !== previousInitialFilterSignature` |
| A-010-B010 | 99 | `normalizedQuery` |
| A-010-B011 | 111 | `row.summary.amount.greaterThan(max)` |
| A-010-B012 | 112 | `heatMetric === "fee_count"` |
| A-010-B013 | 112 | `category === "UNCLASSIFIED"` |
| A-010-B014 | 114 | `item.locationVerified` |
| A-010-B015 | 115 | `mode !== "heatmap"` |
| A-010-B016 | 119 | `selected && /^\d+(?:\.\d+)?$/.test(selected.duration)` |
| A-010-B017 | 120 | `selected && /^\d+(?:\.\d+)?$/.test(selected.maxHorizontal)` |
| A-010-B018 | 138 | `!hydrationRef.current` |
| A-010-B019 | 139 | `suppressUrlWriteRef.current` |
| A-010-B020 | 142 | `version !== navigationVersionRef.current` |
| A-010-B021 | 146 | `next.toString() !== current && version === navigationVersionRef.current` |
| A-010-B022 | 147 | `next.size` |
| A-010-B023 | 155 | `selected && dialog && !dialog.open` |
| A-010-B024 | 156 | `!selected && dialog?.open` |
| A-010-B025 | 160 | `tab !== "documents" \|\| !selected` |
| A-010-B026 | 167 | `response.status === 404` |
| A-010-B027 | 168 | `!response.ok` |
| A-010-B028 | 168 | `response.status === 403` |
| A-010-B029 | 170 | `raw && typeof raw === "object" && "files" in raw && Array.isArray(raw.files)` |
| A-010-B030 | 172 | `!entry \|\| typeof entry !== "object"` |
| A-010-B031 | 176 | `!Object.hasOwn(categoryLabels, category) \|\| !String(file.name \|\| "") \|\| !href.startsWith("/api/nas/download?token=")` |
| A-010-B032 | 180 | `files.length` |
| A-010-B033 | 180 | `files.length` |
| A-010-B034 | 181 | `timedOut \|\| !controller.signal.aborted` |
| A-010-B035 | 181 | `timedOut` |
| A-010-B036 | 188 | `event.key === "/" && !selected && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLSelectElement)` |
| A-010-B037 | 198 | `next === "documents" && selected` |
| A-010-B038 | 202 | `selected` |
| A-010-B039 | 215 | `event.key === "ArrowDown" && suggestions.length` |
| A-010-B040 | 216 | `event.key === "ArrowUp" && suggestions.length` |
| A-010-B041 | 217 | `event.key === "Enter" && suggestionIndex >= 0 && suggestions[suggestionIndex]` |
| A-010-B042 | 218 | `event.key === "Escape"` |
| A-010-B043 | 231 | `suggestions.length` |
| A-010-B044 | 234 | `activeFilterCount > 0` |
| A-010-B045 | 234 | `filtersOpen` |
| A-010-B046 | 237 | `filters.status === status` |
| A-010-B047 | 237 | `filters.status === status` |
| A-010-B048 | 244 | `key === "status"` |
| A-010-B049 | 262 | `item` |
| A-010-B050 | 268 | `visible.length` |
| A-010-B051 | 270 | `item.boq?.fees.length` |
| A-010-B052 | 276 | `closing` |
| A-010-B053 | 276 | `selected` |
| A-010-B054 | 281 | `key === "documents" && documentState?.key === selected.id && documentState.status === "ready"` |
| A-010-B055 | 297 | `selected.boq?.fees.some((fee) => fee.calculation_type === "revenue_share" ? fee.rate : fee.amount)` |
| A-010-B056 | 297 | `fee.calculation_type === "revenue_share"` |
| A-010-B057 | 298 | `fee.calculation_type === "revenue_share"` |
| A-010-B058 | 298 | `fees.length` |
| A-010-B059 | 298 | `fee.calculation_type === "revenue_share"` |
| A-010-B060 | 298 | `fee.revenue_period === "annual"` |
| A-010-B061 | 298 | `fee.unit !== "ครั้ง"` |
| A-010-B062 | 298 | `fee.calculation_type === "revenue_share"` |
| A-010-B063 | 304 | `documentState?.key !== selected.id \|\| documentState.status !== "ready"` |
| A-010-B064 | 304 | `documentState?.status === "error"` |
| A-010-B065 | 304 | `documentState?.key === selected.id` |
| A-010-B066 | 305 | `files.length` |
| A-010-B067 | 314 | `value` |
| A-010-B068 | 317 | `group === "OPEX_ANNUAL"` |
| A-010-B069 | 318 | `group === "OPEX_MONTHLY"` |
| A-010-B070 | 321 | `status === "Permission Confirmed"` |
| A-010-B071 | 321 | `status === "อาคารปิดถาวร"` |
| A-010-B072 | 321 | `status === "Check Permission"` |
| A-010-B073 | 322 | `status === "Permission Confirmed"` |
| A-010-B074 | 322 | `status === "MOU"` |
| A-010-B075 | 322 | `status === "Check Permission"` |
| A-010-B076 | 323 | `status === "Permission Confirmed"` |
| A-010-B077 | 323 | `status === "MOU"` |
| A-010-B078 | 323 | `status === "อาคารปิดถาวร"` |

## A-011 — `src/app/(platform)/buildings/loading.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `65f12a118d337f0e2289b2c537cd5a5adea98cef98e1228293f64dbb7be51e18`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-011-F001 | 2 | `Loading` | `export default function Loading() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-011-C001 | 2 | `PageSkeleton`  | `shape="table"` |

## A-012 — `src/app/(platform)/buildings/map/page.tsx`

- Status: PLANNED. Consumers: S-005.
- Normalized UTF-8/LF source SHA-256: `571c36c8500390cd2e2e5d814f981638ba022dff512d5a9ab5a922ea63eb82a4`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-012-F001 | 14 | `scalar` | `(params: SearchParams, key: string) ` |
| A-012-F002 | 16 | `BuildingMapPage` | `export default async function BuildingMapPage(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-012-C001 | 18 | `AccessDenied`  | `moduleName="ข้อมูลอาคาร"` |
| A-012-C002 | 39 | `main`  | `className="building-map-state" role="status"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-012-B001 | 14 | `typeof params[key] === "string"` |
| A-012-B002 | 18 | `!access.allowed` |
| A-012-B003 | 22 | `/^[0-9a-f-]{36}$/i.test(rawBuildingId)` |
| A-012-B004 | 33 | `result.state !== "ready"` |
| A-012-B005 | 39 | `state !== "ready"` |
| A-012-B006 | 39 | `state === "not_configured"` |
| A-012-B007 | 40 | `selectedBuildingId` |
| A-012-B008 | 42 | `focusData?.items.length` |
| A-012-B009 | 44 | `scalar(params, "view") === "list"` |

## A-013 — `src/app/(platform)/buildings/new/page.tsx`

- Status: PLANNED. Consumers: S-006.
- Normalized UTF-8/LF source SHA-256: `f8c2edd69892d4d9e76faa59a71510fca9a8ffefda8eef8114b85267721f72fc`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-013-F001 | 16 | `NewBuildingPage` | `export default async function NewBuildingPage() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-013-C001 | 21 | `main`  | `className="building-map-state" role="status"` |
| A-013-C002 | 21 | `Link` กลับไปอาคารและค่าใช้จ่าย | `href="/buildings"` |
| A-013-C003 | 23 | `main`  | `className="building-map-state" role="status"` |
| A-013-C004 | 23 | `Link` กลับไปอาคารและค่าใช้จ่าย | `href="/buildings"` |
| A-013-C005 | 28 | `PageHeader`  | `title={copy.buildingEditor.createTitle} description={copy.buildingEditor.createDescription} parent={{ label: copy.pages.buildings, href: "/buildings" }} className="page-enter"` |
| A-013-C006 | 29 | `BuildingCreateForm`  | `apiKey={process.env.LONGDO_MAP_API_KEY ?? ""} teams={allowedTeams} canCreateWithoutTeam={canCreateWithoutTeam}` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-013-B001 | 21 | `!canCreate` |
| A-013-B002 | 22 | `grant.scope === "ALL"` |
| A-013-B003 | 22 | `grant.scope === "TEAM"` |
| A-013-B004 | 22 | `grant.selectedTeamId` |
| A-013-B005 | 23 | `!process.env.DATABASE_URL` |
| A-013-B006 | 25 | `grants.some((grant) => grant.scope === "ALL")` |

## A-014 — `src/app/(platform)/buildings/page.tsx`

- Status: PLANNED. Consumers: S-007.
- Normalized UTF-8/LF source SHA-256: `38e560350a0df41672dfe4170ecd4cefc7db2bf40b6dbc86ffdfa92a1ea1f31a`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-014-F001 | 16 | `scalar` | `(params: SearchParams, key: string) ` |
| A-014-F002 | 18 | `BuildingsPage` | `export default async function BuildingsPage(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-014-C001 | 20 | `AccessDenied`  | `moduleName="ข้อมูลอาคาร"` |
| A-014-C002 | 41 | `main`  | `className="permission-buildings-state" role="status"` |
| A-014-C003 | 47 | `Link` หน้าก่อนหน้า | `href={&#96;/buildings?${buildingQueryParams(query, { page: Math.max(1, data.page - 1), before: data.previousCursor, after: "" })}&#96;}` |
| A-014-C004 | 51 | `Link` หน้าถัดไป | `href={&#96;/buildings?${buildingQueryParams(query, { page: data.page + 1, after: data.nextCursor, before: "" })}&#96;}` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-014-B001 | 16 | `typeof params[key] === "string"` |
| A-014-B002 | 20 | `!access.allowed` |
| A-014-B003 | 27 | `mapFirst` |
| A-014-B004 | 29 | `mapFirst && data.state === "ready"` |
| A-014-B005 | 35 | `next.state !== "ready"` |
| A-014-B006 | 41 | `data.state !== "ready"` |
| A-014-B007 | 42 | `data.state === "not_configured"` |
| A-014-B008 | 45 | `mapFirst` |
| A-014-B009 | 47 | `data.previousCursor` |
| A-014-B010 | 48 | `data.items.length === data.total && !data.previousCursor && !data.nextCursor` |
| A-014-B011 | 51 | `data.nextCursor` |

## A-015 — `src/app/(platform)/car-booking/page.tsx`

- Status: PLANNED. Consumers: S-008.
- Normalized UTF-8/LF source SHA-256: `62e9726e1479f36cbf236cb5fd158260f0abdf27d57f264dd1c62c22854d969b`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-015-F001 | 9 | `CarBookingPage` | `export default async function CarBookingPage()` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-015-C001 | 11 | `AccessDenied`  | `moduleName="ระบบจองรถ"` |
| A-015-C002 | 13 | `PageHeader`  | `title="ระบบจองรถ" description="จองและคืนรถ บันทึกการเดินทาง และรายงานการใช้รถ OSP" parent={{ label: "ภาพรวม", href: "/" }} actions={<span className="cb-scope">{isAuthorized(access.subject,"car_booking.module.admin")?"ผู้ดูแลระบบจองรถ":"จัดการรายการของตนเอง"}</span>}` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-015-B001 | 11 | `!access.allowed` |
| A-015-B002 | 13 | `isAuthorized(access.subject,"car_booking.module.admin")` |

## A-016 — `src/app/(platform)/duct-rental/[id]/[view]/page.tsx`

- Status: PLANNED. Consumers: S-009.
- Normalized UTF-8/LF source SHA-256: `93329c61a41b365686c86c9b9ffa189f833b2134c02a4bde2f746dbb0ae7a40b`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-016-F001 | 6 | `DuctPhasePage` | `export default async function DuctPhasePage(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-016-C001 | 7 | `AccessDenied`  | `moduleName="เช่าท่อร้อยสาย"` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-016-E001 | 8 | `notFound()` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-016-B001 | 7 | `!access.allowed` |
| A-016-B002 | 8 | `!views.includes(view)` |

## A-017 — `src/app/(platform)/duct-rental/[id]/edit/page.tsx`

- Status: PLANNED. Consumers: S-010.
- Normalized UTF-8/LF source SHA-256: `09f6246120faeb37e5ef20e9d4c72cc1022faddfe53a28735ee8c75e1a1d998a`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-017-F001 | 4 | `EditDuctRequestPage` | `export default async function EditDuctRequestPage(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-017-C001 | 6 | `AccessDenied`  | `moduleName="แก้ไขคำขอเช่าท่อ"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-017-B001 | 6 | `!access.allowed` |

## A-018 — `src/app/(platform)/duct-rental/[id]/page.tsx`

- Status: PLANNED. Consumers: S-011.
- Normalized UTF-8/LF source SHA-256: `afe394e4ac32fbd3f8608bf2bebe46d4e8f05f78bc0b253dd5f7caa235b96b24`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-018-F001 | 4 | `DuctRequestPage` | `export default async function DuctRequestPage(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-018-C001 | 5 | `AccessDenied`  | `moduleName="เช่าท่อร้อยสาย"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-018-B001 | 5 | `!access.allowed` |

## A-019 — `src/app/(platform)/duct-rental/cancellation/[id]/page.tsx`

- Status: PLANNED. Consumers: S-012.
- Normalized UTF-8/LF source SHA-256: `e2983fe3a3d8fc54dc09d8694c2788a484339a5a7e613d8ca1f148d9b13c1374`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-019-F001 | 4 | `Page` | `export default async function Page(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-019-C001 | 4 | `AccessDenied`  | `moduleName="ยกเลิกการใช้ท่อ"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-019-B001 | 4 | `access.allowed` |

## A-020 — `src/app/(platform)/duct-rental/cancellation/new/page.tsx`

- Status: PLANNED. Consumers: S-013.
- Normalized UTF-8/LF source SHA-256: `f1f3d52912e60f17deb670758eeb1b46def8d7f9336bf0f56ee662dab911f844`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-020-F001 | 4 | `Page` | `export default async function Page(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-020-C001 | 4 | `CancellationForm`  | `selected={request}` |
| A-020-C002 | 4 | `AccessDenied`  | `moduleName="ขอยกเลิกการใช้ท่อ"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-020-B001 | 4 | `access.allowed && access.permissions.includes("duct_rental.cancellation.create")` |

## A-021 — `src/app/(platform)/duct-rental/cancellation/page.tsx`

- Status: PLANNED. Consumers: S-014.
- Normalized UTF-8/LF source SHA-256: `310dee596a5845d991cb0b2a821427bfb6c844aa51e8994e521b9509fbda300a`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-021-F001 | 4 | `Page` | `export default async function Page() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-021-C001 | 4 | `AccessDenied`  | `moduleName="ยกเลิกการใช้ท่อ"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-021-B001 | 4 | `access.allowed` |

## A-022 — `src/app/(platform)/duct-rental/communication-cable/page.tsx`

- Status: PLANNED. Consumers: S-015.
- Normalized UTF-8/LF source SHA-256: `84e4e740a8c48ec29620ef48783058732ac6d2cf0815b6871089f07ac088ed20`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-022-F001 | 8 | `Page` | `export default async function Page() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-022-C001 | 10 | `AccessDenied`  | `moduleName="เช่าท่อและพาดสาย"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-022-B001 | 10 | `!access.allowed` |

## A-023 — `src/app/(platform)/duct-rental/new/page.tsx`

- Status: PLANNED. Consumers: S-016.
- Normalized UTF-8/LF source SHA-256: `9e5e8275dd603d6aeb079c8630969b7dd1f4b1570cb5241b27848f64f9ae2a98`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-023-F001 | 4 | `NewDuctRequestPage` | `export default async function NewDuctRequestPage() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-023-C001 | 6 | `AccessDenied`  | `moduleName="สร้างคำขอเช่าท่อ"` |
| A-023-C002 | 7 | `RequestForm`  | `user={{ id: access.userId, displayName: access.displayName, email: access.email }} permissions={access.permissions}` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-023-B001 | 6 | `!access.allowed \|\| !access.permissions.includes("duct_rental.request.create")` |

## A-024 — `src/app/(platform)/duct-rental/page.tsx`

- Status: PLANNED. Consumers: S-017.
- Normalized UTF-8/LF source SHA-256: `b234d9e7763075553da564f413cb6a7dc06860b957bca930871aea38d6da1bf5`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-024-F001 | 8 | `DuctRentalPage` | `export default async function DuctRentalPage() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-024-C001 | 10 | `AccessDenied`  | `moduleName="เช่าท่อร้อยสาย"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-024-B001 | 10 | `!access.allowed` |

## A-025 — `src/app/(platform)/duct-rental/renewal/[id]/page.tsx`

- Status: PLANNED. Consumers: S-018.
- Normalized UTF-8/LF source SHA-256: `222093598283ec7d31e11cfd533236e9e0b8e613fcc814d38f4776bf1988ace0`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-025-F001 | 4 | `Page` | `export default async function Page(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-025-C001 | 4 | `AccessDenied`  | `moduleName="ต่อสัญญาเช่าท่อ"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-025-B001 | 4 | `access.allowed` |

## A-026 — `src/app/(platform)/duct-rental/renewal/page.tsx`

- Status: PLANNED. Consumers: S-019.
- Normalized UTF-8/LF source SHA-256: `a65928190f4f4c01be944f6136bb0b99dc432dd29fab2399a600f58247ca7f62`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-026-F001 | 4 | `Page` | `export default async function Page() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-026-C001 | 4 | `AccessDenied`  | `moduleName="ต่อสัญญาเช่าท่อ"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-026-B001 | 4 | `access.allowed` |

## A-027 — `src/app/(platform)/duct-rental/settings/page.tsx`

- Status: PLANNED. Consumers: S-020.
- Normalized UTF-8/LF source SHA-256: `a533761370207d3c3fcbed19639e4599853d5df20460b67c6fbc83452c30a0a2`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-027-F001 | 4 | `Page` | `export default async function Page() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-027-C001 | 4 | `AccessDenied`  | `moduleName="ตั้งค่าเช่าท่อ"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-027-B001 | 4 | `access.allowed && access.permissions.includes("duct_rental.settings.manage")` |

## A-028 — `src/app/(platform)/duct-rental/tasks/page.tsx`

- Status: PLANNED. Consumers: S-021.
- Normalized UTF-8/LF source SHA-256: `250dae713c7dbb0e15480e99ff4d91866e4e23dd30d07f81d963900382bec7a1`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-028-F001 | 4 | `Page` | `export default async function Page(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-028-C001 | 6 | `AccessDenied`  | `moduleName="งานลงนามเช่าท่อ"` |
| A-028-C002 | 7 | `SignatureWorkspace`  | `userId={access.userId!} permissions={access.permissions} selected={task}` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-028-B001 | 6 | `!access.allowed` |

## A-029 — `src/app/(platform)/duct-rental/tracking/page.tsx`

- Status: PLANNED. Consumers: S-022.
- Normalized UTF-8/LF source SHA-256: `e799383c1e70f1852370c0a9bf668192281c3b36b458a737b8ec1a09a8d38a0e`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-029-F001 | 4 | `Page` | `export default async function Page(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-029-C001 | 4 | `AccessDenied`  | `moduleName="ติดตามกระบวนการเช่าท่อ"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-029-B001 | 4 | `["Near Due","Overdue","Completed"].includes(sla?? "")` |
| A-029-B002 | 4 | `access.allowed` |

## A-030 — `src/app/(platform)/error.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `11b041d938b676c6fb487ee57118a1f0fc6742b0be032e6b81cabbdd4bc27c11`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-030-F001 | 4 | `WorkspaceError` | `export default function WorkspaceError(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-030-C001 | 5 | `ErrorState`  | `digest={error.digest} reset={reset}` |

## A-031 — `src/app/(platform)/guarantees/[id]/loading.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `6d3cca5fac6a5aa01da1d7af6489f1403d14a8675307b05d9170c344688967b7`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-031-F001 | 2 | `Loading` | `export default function Loading() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-031-C001 | 2 | `PageSkeleton`  | `shape="detail" className="deposit-loading"` |

## A-032 — `src/app/(platform)/guarantees/[id]/page.tsx`

- Status: PLANNED. Consumers: S-023.
- Normalized UTF-8/LF source SHA-256: `fb85d2279c86e5dccdfee9d3ef3011bb4bd4b157a3c78d88164d3bfd8468fa46`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-032-F001 | 16 | `DepositDetailPage` | `export default async function DepositDetailPage(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-032-C001 | 18 | `AccessDenied`  | `moduleName="เงินประกันอาคาร"` |
| A-032-C002 | 32 | `Link` ← กลับรายการ | `href="/guarantees"` |
| A-032-C003 | 44 | `DepositEditor`  | `item={item} assignees={await listTlAssignees()} events={events.map((event) => ({ ...event, occurredAt: event.occurredAt.toISOString() }))}` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-032-E001 | 19 | `notFound()` |
| A-032-E002 | 21 | `notFound()` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-032-B001 | 18 | `!access.allowed` |
| A-032-B002 | 19 | `!/^[0-9a-f-]{36}$/i.test(id)` |
| A-032-B003 | 21 | `!item` |
| A-032-B004 | 24 | `!manager && canWorkAsAssignedTl(access, item)` |
| A-032-B005 | 25 | `!manager` |
| A-032-B006 | 33 | `index < stage` |
| A-032-B007 | 33 | `index === stage` |
| A-032-B008 | 33 | `index < stage` |
| A-032-B009 | 39 | `value` |
| A-032-B010 | 39 | `value` |
| A-032-B011 | 40 | `event.action === "transition"` |
| A-032-B012 | 40 | `event.reason` |
| A-032-B013 | 42 | `item.depReturn === "Yes"` |
| A-032-B014 | 42 | `item.demoReturn === "Yes"` |

## A-033 — `src/app/(platform)/guarantees/actions.ts`

- Status: PLANNED. Consumers: S-023, S-024.
- Normalized UTF-8/LF source SHA-256: `7d0c0f76384370742547200f8ef75148653dd1b4e15acc51862a585ecd948b61`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-033-F001 | 17 | `inputFromForm` | `function inputFromForm(form: FormData) ` |
| A-033-F002 | 26 | `saveDepositWorkItem` | `export async function saveDepositWorkItem(_previous: DepositActionState, form: FormData): Promise<DepositActionState> ` |
| A-033-F003 | 83 | `transitionDepositWorkItem` | `export async function transitionDepositWorkItem(_previous: DepositActionState, form: FormData): Promise<DepositActionState> ` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-033-E001 | 41 | `getDb().transaction(async (tx) => { const [row] = await tx.insert(guaranteeWorkItems).values({ ownerId: access.userId, teamId: targetTeam.id, tlAssigneeId: tlAssigneeId \|\| null, status: "new", place: parsed.data.place, area: parsed.data.area \|\| null, data: parsed.data, updatedAt: now }).returning({ id: guaranteeWorkItems.id }); await tx.insert(guaranteeWorkEvents).values({ itemId: row.id, actorId: access.userId, action: "create", toStatus: "new", occurredAt: now }); return row; })` |
| A-033-E002 | 60 | `getDb().transaction(async (tx) => { const updated = await tx.update(guaranteeWorkItems).set({ place: parsed.data.place, area: parsed.data.area \|\| null, teamId: targetTeam.id, tlAssigneeId: tlAssigneeId \|\| null, data: { ...item, ...parsed.data, pdf_payment: item.pdf_payment \|\| "", pdf_layout: item.pdf_layout \|\| "", pdf_additional: item.pdf_additional \|\| "", pdf_tl_work: item.pdf_tl_work \|\| "", pdf_tl_extra: item.pdf_tl_extra \|\| "", pdf_user_final: item.pdf_user_final \|\| "", pdf_demo_off: item.pdf_demo_off \|\| "", depReturn: ["clo", "done"].includes(item.status) ? "Yes" : parsed.data.depReturn, off_service_requested: startingOffService \|\| Boolean(item.off_service_requested), off_service_status: completingOffService ? "completed" : startingOffService ? "pending" : item.off_service_status, off_service_completed_date: completingOffService ? now.toISOString().slice(0, 10) : item.off_service_completed_date, id: undefined, ownerId: undefined, teamId: undefined, tlAssigneeId: undefined, status: undefined, version: undefined }, version: sql&#96;${guaranteeWorkItems.version} + 1&#96;, updatedAt: now }) .where(and(eq(guaranteeWorkItems.id, id), eq(guaranteeWorkItems.version, version))).returning({ id: guaranteeWorkItems.id }); if (!updated.length) throw new Error("ข้อมูลมีการเปลี่ยนแปลง กรุณาโหลดใหม่"); await tx.insert(guaranteeWorkEvents).values({ itemId: id, actorId: access.userId, action: completingOffService ? "off_service_complete" : startingOffService ? "off_service_requested" : "update", fromStatus: item.status, toStatus: item.status, occurredAt: now }); })` |
| A-033-E003 | 100 | `getDb().transaction(async (tx) => { const updated = await tx.update(guaranteeWorkItems).set({ status: to.data, data: { ...item, status: undefined, status_final: to.data === "done" \|\| to.data === "Cancel" ? to.data : item.status_final, complete_tl: to.data === "On Process" ? "On Process" : item.complete_tl, depReturn: to.data === "clo" \|\| to.data === "done" ? "Yes" : item.depReturn, return_status: to.data === "clo" ? "Done" : undefined, cancel_reason: to.data === "Cancel" ? reason : undefined, id: undefined, ownerId: undefined, teamId: undefined, version: undefined }, version: sql&#96;${guaranteeWorkItems.version} + 1&#96;, updatedAt: now }) .where(and(eq(guaranteeWorkItems.id, id), eq(guaranteeWorkItems.version, version))).returning({ id: guaranteeWorkItems.id }); if (!updated.length) throw new Error("ข้อมูลมีการเปลี่ยนแปลง กรุณาโหลดใหม่"); await tx.insert(guaranteeWorkEvents).values({ itemId: id, actorId: access.userId, action: "transition", fromStatus: item.status, toStatus: to.data, reason: reason \|\| null, occurredAt: now }); })` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-033-B001 | 28 | `!access.allowed \|\| access.isDevelopmentSession \|\| !process.env.DATABASE_URL` |
| A-033-B002 | 30 | `!parsed.success` |
| A-033-B003 | 33 | `tlAssigneeId && !(await listTlAssignees()).some((person) => person.id === tlAssigneeId)` |
| A-033-B004 | 38 | `!targetTeam` |
| A-033-B005 | 39 | `!id` |
| A-033-B006 | 40 | `!isAuthorized(access.subject, "guarantee.case.create", { ownerId: access.userId, teamId: targetTeam.id }) && !isAuthorized(access.subject, "guarantee.case.manage", { ownerId: access.userId, teamId: targetTeam.id })` |
| A-033-B007 | 51 | `!item \|\| (!isAuthorized(access.subject, "guarantee.case.update", { ownerId: item.ownerId, teamId: item.teamId }) && !isAuthorized(access.subject, "guarantee.case.manage", { ownerId: item.ownerId, teamId: item.teamId }))` |
| A-033-B008 | 52 | `!isAuthorized(access.subject, "guarantee.case.update", { ownerId: item.ownerId, teamId: targetTeam.id }) && !isAuthorized(access.subject, "guarantee.case.manage", { ownerId: item.ownerId, teamId: targetTeam.id })` |
| A-033-B009 | 53 | `!Number.isInteger(version) \|\| version !== item.version` |
| A-033-B010 | 56 | `startingOffService && !isOnServiceItem(item)` |
| A-033-B011 | 57 | `completingOffService && (!isOffServicePendingItem({ ...item, service_cancel_date: parsed.data.service_cancel_date }) \|\| !item.pdf_demo_off)` |
| A-033-B012 | 65 | `["clo", "done"].includes(item.status)` |
| A-033-B013 | 67 | `completingOffService` |
| A-033-B014 | 67 | `startingOffService` |
| A-033-B015 | 68 | `completingOffService` |
| A-033-B016 | 72 | `!updated.length` |
| A-033-B017 | 73 | `completingOffService` |
| A-033-B018 | 73 | `startingOffService` |
| A-033-B019 | 79 | `error instanceof Error && error.message.includes("เปลี่ยนแปลง")` |
| A-033-B020 | 85 | `!access.allowed \|\| access.isDevelopmentSession \|\| !process.env.DATABASE_URL` |
| A-033-B021 | 90 | `!to.success \|\| !/^[0-9a-f-]{36}$/i.test(id)` |
| A-033-B022 | 94 | `!item \|\| (!manager && !assignedTl)` |
| A-033-B023 | 95 | `!manager && !(["tl", "On Process"].includes(item.status) && ["On Process", "att", "ret"].includes(to.data))` |
| A-033-B024 | 96 | `version !== item.version` |
| A-033-B025 | 102 | `to.data === "done" \|\| to.data === "Cancel"` |
| A-033-B026 | 103 | `to.data === "On Process"` |
| A-033-B027 | 104 | `to.data === "clo" \|\| to.data === "done"` |
| A-033-B028 | 105 | `to.data === "clo"` |
| A-033-B029 | 106 | `to.data === "Cancel"` |
| A-033-B030 | 110 | `!updated.length` |
| A-033-B031 | 117 | `error instanceof Error` |

## A-034 — `src/app/(platform)/guarantees/loading.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `d703ef88dafe55472f0ec8b67a95bdac7b2db2e43afe0ac3d96b8a7e927b69bf`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-034-F001 | 2 | `Loading` | `export default function Loading() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-034-C001 | 2 | `PageSkeleton`  | `shape="table" className="deposit-loading"` |

## A-035 — `src/app/(platform)/guarantees/new/page.tsx`

- Status: PLANNED. Consumers: S-024.
- Normalized UTF-8/LF source SHA-256: `969359681048eddd5e1c5f6e59737e727ee8c3bff92a08a2bf382bdc6424b9ed`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-035-F001 | 11 | `NewDepositPage` | `export default async function NewDepositPage() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-035-C001 | 13 | `AccessDenied`  | `moduleName="สร้างรายการเงินประกัน"` |
| A-035-C002 | 15 | `DepositEditor`  | `assignees={await listTlAssignees()}` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-035-B001 | 13 | `!access.allowed \|\| !canCreateDepositWorkItem(access)` |
| A-035-B002 | 14 | `!process.env.DATABASE_URL` |

## A-036 — `src/app/(platform)/guarantees/page.tsx`

- Status: PLANNED. Consumers: S-025.
- Normalized UTF-8/LF source SHA-256: `5b844b471d4d46e20d5cf11700ae360f1f6a0ace1a6dcb15511719aa681b6342`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-036-F001 | 13 | `GuaranteesPage` | `export default async function GuaranteesPage(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-036-C001 | 15 | `AccessDenied`  | `moduleName="เงินประกันอาคาร"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-036-B001 | 15 | `!access.allowed` |
| A-036-B002 | 17 | `typeof params.team === "string"` |
| A-036-B003 | 18 | `Array.isArray(params.view)` |
| A-036-B004 | 23 | `preview` |
| A-036-B005 | 23 | `installationTeamView` |

## A-037 — `src/app/(platform)/layout.tsx`

- Status: PLANNED. Consumers: S-001, S-002, S-003, S-004, S-005, S-006, S-007, S-008, S-009, S-010, S-011, S-012, S-013, S-014, S-015, S-016, S-017, S-018, S-019, S-020, S-021, S-022, S-023, S-024, S-025, S-026, S-027, S-028, S-029, S-030, S-031, S-032, S-033, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `371539376bf7ff3330e72f8e7daa7478f09f0751ff4c4273609539536037a2ab`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-037-F001 | 15 | `PlatformLayout` | `export default async function PlatformLayout(` |
| A-037-F002 | 27 | `hasWorkPermission` | `(permission: string) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-037-C001 | 43 | `NotificationCenter`  | `inbox={inbox}` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-037-E001 | 19 | `redirect(&#96;/login?next=${encodeURIComponent(next)}&reason=${await getSessionFailureReason()}&#96;)` |
| A-037-E002 | 21 | `redirect("/change-password")` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-037-B001 | 17 | `!currentUser` |
| A-037-B002 | 21 | `currentUser.mustChangePassword` |
| A-037-B003 | 30 | `hasWorkPermission("work.task.read")` |
| A-037-B004 | 31 | `hasWorkPermission("work.task.create")` |
| A-037-B005 | 32 | `hasWorkPermission("work.task.manage")` |
| A-037-B006 | 33 | `hasWorkPermission("work.task.assign")` |
| A-037-B007 | 34 | `hasWorkPermission("work.task.manage") \|\| hasWorkPermission("kpi.team.read")` |
| A-037-B008 | 35 | `hasWorkPermission("work.task.read")` |
| A-037-B009 | 36 | `hasWorkPermission("kpi.score.read")` |
| A-037-B010 | 37 | `hasWorkPermission("work.report.read")` |
| A-037-B011 | 38 | `hasWorkPermission("activity.event.read")` |

## A-038 — `src/app/(platform)/loading.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `c531137fd22d7fca26c533176f36544c529ad9b3ca06e522eca8affa05e52b17`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-038-F001 | 2 | `Loading` | `export default function Loading() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-038-C001 | 2 | `PageSkeleton`  | `` |

## A-039 — `src/app/(platform)/notification-actions.ts`

- Status: PLANNED. Consumers: S-001, S-002, S-003, S-004, S-005, S-006, S-007, S-008, S-009, S-010, S-011, S-012, S-013, S-014, S-015, S-016, S-017, S-018, S-019, S-020, S-021, S-022, S-023, S-024, S-025, S-026, S-027, S-028, S-029, S-030, S-031, S-032, S-033, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `8842fcc72332d32af2cef2e85a0db57dbe688fb42d93b43763396205da5fbe24`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-039-F001 | 10 | `markNotificationsRead` | `export async function markNotificationsRead(_state: ` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-039-B001 | 12 | `access.passwordChangeRequired \|\| !isAuthorized(access.subject, "notification.inbox.update", { ownerId: access.userId })` |
| A-039-B002 | 14 | `id !== "all" && !z.string().uuid().safeParse(id).success` |
| A-039-B003 | 18 | `id === "all"` |

## A-040 — `src/app/(platform)/page.tsx`

- Status: PLANNED. Consumers: S-026.
- Normalized UTF-8/LF source SHA-256: `e8272e471b686067342b3cbd3424f073688d26f07070ca3233b37173cfa99c8c`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-040-F001 | 8 | `DashboardPage` | `export default async function DashboardPage(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-040-C001 | 12 | `aside`  | `key={row.id} className="work-home-announcement mb-4 rounded-xl border border-[var(--color-border)] border-l-4 border-l-[var(--color-brand)] bg-[var(--color-info-soft)] px-4 py-3 text-sm leading-6 text-[var(--color-text)] shadow-sm" role="note"` |
| A-040-C002 | 12 | `a`  | `className="text-[var(--color-brand)] underline-offset-4 hover:underline" href={row.url} rel="noopener noreferrer"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-040-B001 | 12 | `row.status === "Active"` |
| A-040-B002 | 12 | `row.status === "Maintenance"` |

## A-041 — `src/app/(platform)/work/actions.ts`

- Status: PLANNED. Consumers: S-002, S-027, S-029, S-030, S-031, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `073102a760d0751c78a711167190ff05df04fbaa5583a0a0d49fbc784245e5d2`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-041-F001 | 20 | `requireWorkSession` | `async function requireWorkSession() ` |
| A-041-F002 | 24 | `runTaskCommand` | `async function runTaskCommand(form: FormData, kind: "transition" \| "note" \| "edit" \| "delete" \| "restore"): Promise<WorkActionState> ` |
| A-041-F003 | 53 | `addWorkTaskNoteAction` | `export async function addWorkTaskNoteAction(_previous: WorkActionState, form: FormData) ` |
| A-041-F004 | 54 | `transitionWorkTaskAction` | `export async function transitionWorkTaskAction(_previous: WorkActionState, form: FormData) ` |
| A-041-F005 | 55 | `editWorkTaskAction` | `export async function editWorkTaskAction(_previous: WorkActionState, form: FormData) ` |
| A-041-F006 | 56 | `deleteWorkTaskAction` | `export async function deleteWorkTaskAction(_previous: WorkActionState, form: FormData) ` |
| A-041-F007 | 57 | `restoreWorkTaskAction` | `export async function restoreWorkTaskAction(_previous: WorkActionState, form: FormData) ` |
| A-041-F008 | 59 | `humanWorkError` | `function humanWorkError(error: unknown) ` |
| A-041-F009 | 70 | `createBatchAction` | `async function createBatchAction(form:FormData,kind:"personal"\|"assigned"):Promise<WorkActionState> ` |
| A-041-F010 | 80 | `createPersonalTaskAction` | `export async function createPersonalTaskAction(_previous:WorkActionState,form:FormData)` |
| A-041-F011 | 81 | `assignWorkTasksAction` | `export async function assignWorkTasksAction(_previous:WorkActionState,form:FormData)` |
| A-041-F012 | 82 | `previewWorkDeadlineAction` | `export async function previewWorkDeadlineAction(_previous:WorkActionState,form:FormData):Promise<WorkActionState>` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-041-E001 | 21 | `redirect(&#96;/login?next=%2Fwork&reason=${await getSessionFailureReason()}&#96;)` |
| A-041-E002 | 80 | `createBatchAction(form,"personal")` |
| A-041-E003 | 81 | `createBatchAction(form,"assigned")` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-041-B001 | 21 | `!await getCurrentUser()` |
| A-041-B002 | 27 | `access.passwordChangeRequired` |
| A-041-B003 | 28 | `!access.allowed \|\| !access.subject \|\| access.isDevelopmentSession` |
| A-041-B004 | 33 | `kind === "transition"` |
| A-041-B005 | 34 | `kind === "note"` |
| A-041-B006 | 35 | `kind === "delete" \|\| kind === "restore"` |
| A-041-B007 | 36 | `kind === "edit"` |
| A-041-B008 | 38 | `due` |
| A-041-B009 | 39 | `date && Number.isNaN(date.getTime())` |
| A-041-B010 | 40 | `form.has("ssrNumber")` |
| A-041-B011 | 40 | `form.has("ospNumber")` |
| A-041-B012 | 48 | `error instanceof z.ZodError` |
| A-041-B013 | 49 | `error instanceof Error && error.name === "ConcurrentWorkUpdateError"` |
| A-041-B014 | 60 | `error instanceof Error && error.name === "AuthorizationError"` |
| A-041-B015 | 61 | `error instanceof Error && error.name === "InvalidTaskTransitionError"` |
| A-041-B016 | 62 | `error instanceof Error && error.name === "ConcurrentWorkUpdateError"` |
| A-041-B017 | 63 | `error instanceof Error && error.message === "REASON_REQUIRED"` |
| A-041-B018 | 64 | `error instanceof Error && error.message === "DUPLICATE_JOB_KPI"` |
| A-041-B019 | 65 | `error instanceof Error && error.message === "TYPE_REQUIRED"` |
| A-041-B020 | 66 | `error instanceof Error && ["KPI_RULE_NOT_AVAILABLE","KPI_NOT_ASSIGNED"].includes(error.message)` |
| A-041-B021 | 67 | `error instanceof Error && ["ACCEPT_OWNER_ONLY", "EDIT_NOT_ALLOWED", "NOTE_NOT_ALLOWED"].includes(error.message)` |
| A-041-B022 | 73 | `access.passwordChangeRequired` |
| A-041-B023 | 74 | `!access.allowed\|\|!access.subject` |
| A-041-B024 | 76 | `kind==="personal"` |
| A-041-B025 | 85 | `!access.allowed\|\|!access.subject\|\|access.passwordChangeRequired` |
| A-041-B026 | 87 | `!parsed.success` |
| A-041-B027 | 89 | `!isAuthorized(access.subject,input.assigneeId===access.userId?"work.task.create":"work.task.assign",{ownerId:input.assigneeId,teamId:input.teamId})` |
| A-041-B028 | 89 | `input.assigneeId===access.userId` |
| A-041-B029 | 92 | `!member` |

## A-042 — `src/app/(platform)/work/assign/page.tsx`

- Status: PLANNED. Consumers: S-027.
- Normalized UTF-8/LF source SHA-256: `595168854106dca71a283a4493a3504d3f66ae102959fa3511bd373dd86e18cd`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-042-F001 | 8 | `Page` | `export default async function Page(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-042-C001 | 10 | `AccessDenied`  | `moduleName="งานและ KPI"` |
| A-042-C002 | 11 | `WorkFiltersForm`  | `filters={data.filters} model={data.model} appearance="workspace" resetHref="/work/assign"` |
| A-042-C003 | 11 | `p` แสดง 500 รายการล่าสุด กรุณาใช้ตัวกรองเพื่อดูช่วงที่ต้องการ | `role="status"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-042-B001 | 10 | `!data` |

## A-043 — `src/app/(platform)/work/kpi/page.tsx`

- Status: PLANNED. Consumers: S-028.
- Normalized UTF-8/LF source SHA-256: `c1bdf79ee5b12ba989bfef6e495cccf8e5cd4abc488a635d99c2385d5ec405a7`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-043-F001 | 8 | `Page` | `export default async function Page(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-043-C001 | 10 | `AccessDenied`  | `moduleName="งานและ KPI"` |
| A-043-C002 | 11 | `WorkFiltersForm`  | `filters={data.filters} model={data.model} appearance="workspace" resetHref="/work/kpi"` |
| A-043-C003 | 11 | `p` แสดง 500 รายการล่าสุด กรุณาใช้ตัวกรองเพื่อดูช่วงที่ต้องการ | `role="status"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-043-B001 | 10 | `!data` |

## A-044 — `src/app/(platform)/work/layout.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `d288e53ecd0de0e9aedc475353f4b4b08efb56ea9bc3aedda9019ee69448e83d`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-044-F001 | 2 | `WorkLayout` | `export default function WorkLayout(` |

## A-045 — `src/app/(platform)/work/loading.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `65f12a118d337f0e2289b2c537cd5a5adea98cef98e1228293f64dbb7be51e18`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-045-F001 | 2 | `Loading` | `export default function Loading() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-045-C001 | 2 | `PageSkeleton`  | `shape="table"` |

## A-046 — `src/app/(platform)/work/mine/page.tsx`

- Status: PLANNED. Consumers: S-029.
- Normalized UTF-8/LF source SHA-256: `3b08b068543532e4051164cf6e4b20328e3ad1536703fbe70ca0056511a19934`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-046-F001 | 8 | `Page` | `export default async function Page(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-046-C001 | 10 | `AccessDenied`  | `moduleName="งานและ KPI"` |
| A-046-C002 | 11 | `WorkFiltersForm`  | `filters={data.filters} model={data.model} appearance="workspace"` |
| A-046-C003 | 11 | `p` แสดง 500 รายการล่าสุด กรุณาใช้ตัวกรองเพื่อดูช่วงที่ต้องการ | `role="status"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-046-B001 | 10 | `!data` |

## A-047 — `src/app/(platform)/work/new/page.tsx`

- Status: PLANNED. Consumers: S-030.
- Normalized UTF-8/LF source SHA-256: `3ece335579ea0da2cef7a96c7a36bf44cd63556ae22796d39350b745340d9869`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-047-F001 | 10 | `NewWorkPage` | `export default async function NewWorkPage() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-047-C001 | 12 | `AccessDenied`  | `moduleName="งานและ KPI"` |
| A-047-C002 | 13 | `WorkScreenShell`  | `title="เพิ่มงาน" description={copy.feedback.workCreateDescription} parent={{ label: "งานและ KPI", href: "/work" }} appearance="workspace"` |
| A-047-C003 | 13 | `WorkCreateForm`  | `model={await getWorkReadModel(access)} userId={access.userId}` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-047-B001 | 12 | `!access.allowed` |

## A-048 — `src/app/(platform)/work/page.tsx`

- Status: PLANNED. Consumers: S-031.
- Normalized UTF-8/LF source SHA-256: `6b1c4182fa83441e0de720351cbf74ffac5880503fbd269caabb63cb20f646ce`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-048-F001 | 6 | `ModulePage` | `export default async function ModulePage(` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-048-B001 | 8 | `typeof params.view === "string"` |
| A-048-B002 | 8 | `typeof params.record === "string"` |

## A-049 — `src/app/(platform)/work/people/page.tsx`

- Status: PLANNED. Consumers: S-032.
- Normalized UTF-8/LF source SHA-256: `3b470c5f2fa2902702894d784cbd865014fe4e2fa2b42b1992bb32009c2096e3`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-049-F001 | 8 | `Page` | `export default async function Page(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-049-C001 | 10 | `AccessDenied`  | `moduleName="งานและ KPI"` |
| A-049-C002 | 11 | `WorkFiltersForm`  | `filters={data.filters} model={data.model} appearance="workspace" resetHref="/work/people"` |
| A-049-C003 | 11 | `p` แสดง 500 รายการล่าสุด กรุณาใช้ตัวกรองเพื่อดูช่วงที่ต้องการ | `role="status"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-049-B001 | 10 | `!data` |

## A-050 — `src/app/(platform)/work/reports/page.tsx`

- Status: PLANNED. Consumers: S-033.
- Normalized UTF-8/LF source SHA-256: `1a346a8089f6b9b5513b635c76d34c90d2bd2f27e99d5330e07421619a6e4098`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-050-F001 | 8 | `Page` | `export default async function Page(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-050-C001 | 10 | `AccessDenied`  | `moduleName="งานและ KPI"` |
| A-050-C002 | 11 | `WorkReportsScreen`  | `model={data.model} filters={<WorkFiltersForm filters={data.filters} model={data.model} appearance="workspace" resetHref="/work/reports" />} appearance="workspace"` |
| A-050-C003 | 11 | `WorkFiltersForm`  | `filters={data.filters} model={data.model} appearance="workspace" resetHref="/work/reports"` |
| A-050-C004 | 11 | `p` แสดง 500 รายการล่าสุด กรุณาใช้ตัวกรองเพื่อดูช่วงที่ต้องการ | `role="status"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-050-B001 | 10 | `!data` |

## A-051 — `src/app/(platform)/work/team/page.tsx`

- Status: PLANNED. Consumers: S-034.
- Normalized UTF-8/LF source SHA-256: `eb143547afd74d850efc146a45802b22c3bd02af08a1f17f0f0054c937f286d8`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-051-F001 | 8 | `Page` | `export default async function Page(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-051-C001 | 10 | `AccessDenied`  | `moduleName="งานและ KPI"` |
| A-051-C002 | 11 | `WorkFiltersForm`  | `filters={data.filters} model={data.model} appearance="workspace" resetHref="/work/team"` |
| A-051-C003 | 11 | `p` แสดง 500 รายการล่าสุด กรุณาใช้ตัวกรองเพื่อดูช่วงที่ต้องการ | `role="status"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-051-B001 | 10 | `!data` |

## A-052 — `src/app/(platform)/work/tracker/page.tsx`

- Status: PLANNED. Consumers: S-035.
- Normalized UTF-8/LF source SHA-256: `44dfa5670b7d126634519883f9e4bd66aa1f436b206ad6f1f013bda1511a2b2d`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-052-F001 | 8 | `Page` | `export default async function Page(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-052-C001 | 10 | `AccessDenied`  | `moduleName="งานและ KPI"` |
| A-052-C002 | 11 | `WorkFiltersForm`  | `filters={data.filters} model={data.model} appearance="workspace" resetHref="/work/tracker"` |
| A-052-C003 | 11 | `p` แสดง 500 รายการล่าสุด กรุณาใช้ตัวกรองเพื่อดูช่วงที่ต้องการ | `role="status"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-052-B001 | 10 | `!data` |

## A-053 — `src/app/api/admin/car-booking/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `079260ac3ba0f67b6bb13d9b714657a217d0e6e138fdcab5c9ef00c6132f66ef`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-053-F001 | 7 | `handle` | `async function handle(request:Request)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-053-B001 | 10 | `!access.userId` |
| A-053-B002 | 11 | `access.passwordChangeRequired \|\| !isAuthorized(access.subject,"core.user.manage")` |
| A-053-B003 | 13 | `request.method==="GET"` |
| A-053-B004 | 14 | `request.headers.get("origin")!==new URL(request.url).origin` |
| A-053-B005 | 15 | `text.length>8192` |
| A-053-B006 | 19 | `error instanceof CarBookingError` |
| A-053-B007 | 20 | `error instanceof z.ZodError` |

## A-054 — `src/app/api/buildings/[id]/location/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `711f1a365e0bca988bac5374925293ee9e97397a3a8ca23dd0d8177ca9a6bbb9`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-054-F001 | 10 | `PATCH` | `export async function PATCH(request: Request, ` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-054-B001 | 12 | `!access.allowed \|\| access.passwordChangeRequired` |
| A-054-B002 | 14 | `!/^[0-9a-f-]{36}$/i.test(id)` |
| A-054-B003 | 19 | `!parsed.success` |
| A-054-B004 | 22 | `!building \|\| !isAuthorized(access.subject, "building.record.read", { teamId: building.ownerTeamId })` |
| A-054-B005 | 23 | `!isAuthorized(access.subject, "building.record.update", { teamId: building.ownerTeamId })` |
| A-054-B006 | 36 | `input.accuracy == null` |
| A-054-B007 | 41 | `!changed.length` |

## A-055 — `src/app/api/buildings/[id]/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `6421202d25331ac2f261cee0d31a4f99adbeea93c72a263633864f47d926159c`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-055-F001 | 9 | `PATCH` | `export async function PATCH(request: Request, ` |
| A-055-F002 | 13 | `DELETE` | `export async function DELETE(request: Request, ` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-055-E001 | 7 | `z.object({ confirmationName: z.string().trim().min(1).max(500), version: z.number().int().positive() }).strict()` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-055-B001 | 15 | `!access.userId` |
| A-055-B002 | 16 | `!access.allowed \|\| access.passwordChangeRequired \|\| access.role !== "admin"` |
| A-055-B003 | 17 | `request.headers.get("origin") !== new URL(request.url).origin` |
| A-055-B004 | 19 | `!z.string().uuid().safeParse(id).success` |
| A-055-B005 | 23 | `!input.success` |
| A-055-B006 | 28 | `error instanceof BuildingDeleteError` |
| A-055-B007 | 29 | `error.code === "forbidden"` |
| A-055-B008 | 29 | `error.code === "not_found"` |
| A-055-B009 | 29 | `error.code === "confirmation_mismatch"` |

## A-056 — `src/app/api/buildings/location-services/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `f5af70b0d8626645ef5570e0af995d6a77512e184bce6a14ae3d57cd029ab91c`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-056-F001 | 8 | `underProviderLimit` | `function underProviderLimit() ` |
| A-056-F002 | 15 | `placesFrom` | `function placesFrom(value: unknown): Place[] ` |
| A-056-F003 | 27 | `GET` | `export async function GET(request: Request) ` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-056-E001 | 49 | `fetch(target, { signal: controller.signal, cache: "no-store", headers: safeReferer ? { Referer: safeReferer } : undefined })` |
| A-056-E002 | 59 | `fetch(target, { signal: controller.signal, cache: "no-store", headers: safeReferer ? { Referer: safeReferer } : undefined })` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-056-B001 | 10 | `minute !== requestWindow` |
| A-056-B002 | 11 | `providerRequests >= 55` |
| A-056-B003 | 16 | `Array.isArray(value)` |
| A-056-B004 | 16 | `value && typeof value === "object" && "data" in value && Array.isArray(value.data)` |
| A-056-B005 | 18 | `!entry \|\| typeof entry !== "object"` |
| A-056-B006 | 21 | `!isValidCoordinate(latitude, longitude)` |
| A-056-B007 | 22 | `item.id == null` |
| A-056-B008 | 29 | `!access.allowed \|\| access.passwordChangeRequired` |
| A-056-B009 | 31 | `!key` |
| A-056-B010 | 34 | `!underProviderLimit()` |
| A-056-B011 | 37 | `!referer` |
| A-056-B012 | 38 | `parsed.host === new URL(request.url).host && ["https:", "http:"].includes(parsed.protocol)` |
| A-056-B013 | 44 | `kind === "search"` |
| A-056-B014 | 46 | `query.length < 2` |
| A-056-B015 | 49 | `safeReferer` |
| A-056-B016 | 50 | `!response.ok` |
| A-056-B017 | 53 | `kind === "reverse"` |
| A-056-B018 | 55 | `!isValidCoordinate(latitude, longitude)` |
| A-056-B019 | 59 | `safeReferer` |
| A-056-B020 | 60 | `!response.ok` |
| A-056-B021 | 62 | `!result \|\| typeof result !== "object"` |

## A-057 — `src/app/api/buildings/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `c55e6a726909331ad945ea416fdd74e12b4ebcc7ccdc0271d789b98461f1e7c3`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-057-F001 | 3 | `POST` | `export async function POST(request: Request) ` |

## A-058 — `src/app/api/car-booking/bookings/[id]/cancel/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `155907fdcc8d747d598636af93f8ea49ef341feb0689a97751b8c1e49bf5fd8a`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-058-F001 | 2 | `POST` | `export async function POST(request:Request,context:` |

## A-059 — `src/app/api/car-booking/bookings/[id]/gps/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `20ba3ed257342b17e99648666440b839090c0167f665c0a785b33f21804df7e5`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-059-F001 | 2 | `GET` | `export async function GET(request:Request,context:` |

## A-060 — `src/app/api/car-booking/bookings/[id]/logs/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `8c804b8bf791fd9b6010b318ecf051f80e275ed18dde78bbac210b3c13aa11d5`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-060-F001 | 3 | `GET` | `export async function GET(request:Request,context:Context) ` |
| A-060-F002 | 4 | `POST` | `export async function POST(request:Request,context:Context) ` |

## A-061 — `src/app/api/car-booking/bookings/[id]/return/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `c695d92ba98c37f7bb7bfa9bd339641cd407eaa0cf72d1518e3651a712768506`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-061-F001 | 2 | `POST` | `export async function POST(request:Request,context:` |

## A-062 — `src/app/api/car-booking/bookings/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `74ab98b8ffc1907df7b0a8df4e628a58ba479228711eb6cde7ea38a37052b294`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-062-F001 | 2 | `GET` | `export async function GET(request:Request) ` |
| A-062-F002 | 3 | `POST` | `export async function POST(request:Request) ` |

## A-063 — `src/app/api/car-booking/calendar/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `b57b8ea1edea440c4f4f8a53505c5b44633e9b53443dc4638d5548ed19986165`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-063-F001 | 2 | `GET` | `export async function GET(request:Request) ` |

## A-064 — `src/app/api/car-booking/cars/[id]/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `baf241cbae28db6571f84fc70f3ad991eccee415dffbc36f4c8cca735f6aa542`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-064-F001 | 2 | `PATCH` | `export async function PATCH(request:Request,context:` |

## A-065 — `src/app/api/car-booking/cars/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `a2cb966b5efe637d4f2102cf65137f845d279292544af491d873f3eb548e4a0b`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-065-F001 | 2 | `GET` | `export async function GET(request:Request) ` |
| A-065-F002 | 3 | `POST` | `export async function POST(request:Request) ` |

## A-066 — `src/app/api/car-booking/dashboard/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `1ccffc4d122629929e1ba66e0e5edf54bf662722f7b367a383aa0d52caf3975e`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-066-F001 | 2 | `GET` | `export async function GET(request:Request)` |

## A-067 — `src/app/api/car-booking/osp-sync/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `4a289cf4008e33ec926818f7d17618b3a8da41739f7909bec4a3272b09684667`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-067-F001 | 2 | `GET` | `export async function GET(request:Request)` |
| A-067-F002 | 3 | `POST` | `export async function POST(request:Request)` |

## A-068 — `src/app/api/car-booking/reports/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `efecc6e1ec75b5f6f4696734055cd44cf46912e471a012ad22adaa3196124513`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-068-F001 | 2 | `GET` | `export async function GET(request:Request)` |

## A-069 — `src/app/api/car-booking/settings/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `f70c5d6f5acd05ba6c5fd1e4d1c3c65f183ffad0639e6f5305170a58de259264`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-069-F001 | 2 | `GET` | `export async function GET(request:Request)` |
| A-069-F002 | 3 | `PATCH` | `export async function PATCH(request:Request)` |

## A-070 — `src/app/api/dashboard/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `899f8a53a1903a137e4c012f846fd67849a01c10ac6ec56e9cfb79dadfe50f3d`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-070-F001 | 10 | `GET` | `export async function GET() ` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-070-B001 | 12 | `!identity.ok` |

## A-071 — `src/app/api/duct-rental/[...path]/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `e07215259536903c8d079832059ebb182f70111dda83c99572348db8ac9a911a`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-071-F001 | 3 | `GET` | `export async function GET(request: Request, context: ` |
| A-071-F002 | 4 | `POST` | `export async function POST(request: Request, context: ` |

## A-072 — `src/app/api/guarantees/[id]/documents/[kind]/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `c1480885358f0ea39cade3c74f808c5b44b9d814256128805a84ad9f2993e851`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-072-F001 | 15 | `error` | `(message: string, status: number) ` |
| A-072-F002 | 17 | `GET` | `export async function GET(_request: Request, context: RouteContext) ` |
| A-072-F003 | 37 | `POST` | `export async function POST(request: Request, context: RouteContext) ` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-072-E001 | 67 | `getDb().transaction(async (tx) => { const updated = await tx.update(guaranteeWorkItems).set({ data: { ...item, [kind]: path, id: undefined, ownerId: undefined, teamId: undefined, tlAssigneeId: undefined, status: undefined, version: undefined }, version: sql&#96;${guaranteeWorkItems.version} + 1&#96;, updatedAt: new Date() }) .where(and(eq(guaranteeWorkItems.id, id), eq(guaranteeWorkItems.version, version))).returning({ id: guaranteeWorkItems.id }); if (!updated.length) throw new Error("Item changed"); await tx.insert(guaranteeWorkEvents).values({ itemId: id, actorId: access.userId, action: &#96;upload:${kind}&#96;, fromStatus: item.status, toStatus: item.status }); })` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-072-B001 | 19 | `!identity.ok` |
| A-072-B002 | 21 | `!uuid.test(id) \|\| !isEvidenceKind(kind)` |
| A-072-B003 | 23 | `!item` |
| A-072-B004 | 25 | `!isStoredEvidencePath(path) \|\| !path.startsWith(&#96;guarantees/${id}/${kind}/&#96;)` |
| A-072-B005 | 28 | `path.endsWith(".pdf")` |
| A-072-B006 | 28 | `path.endsWith(".png")` |
| A-072-B007 | 39 | `!identity.ok` |
| A-072-B008 | 41 | `!origin \|\| origin !== new URL(request.url).origin` |
| A-072-B009 | 43 | `!uuid.test(id) \|\| !isEvidenceKind(kind)` |
| A-072-B010 | 44 | `!process.env.DATABASE_URL` |
| A-072-B011 | 46 | `!access.allowed \|\| access.isDevelopmentSession` |
| A-072-B012 | 48 | `!item` |
| A-072-B013 | 52 | `!manager && !assignedTl` |
| A-072-B014 | 54 | `contentLength > 21 * 1024 * 1024` |
| A-072-B015 | 58 | `!(file instanceof File) \|\| !file.size \|\| file.size > 20 * 1024 * 1024` |
| A-072-B016 | 59 | `!Number.isInteger(version) \|\| version !== item.version` |
| A-072-B017 | 62 | `!detected` |
| A-072-B018 | 72 | `!updated.length` |
| A-072-B019 | 83 | `cause instanceof Error && cause.message === "Item changed"` |

## A-073 — `src/app/api/health/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `2c261de3fce8e6ce8732446a818133148f6e7d8cfa345c27069fa3c6f2c1ba1f`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-073-F001 | 9 | `GET` | `export async function GET() ` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-073-B001 | 12 | `readiness.database` |
| A-073-B002 | 22 | `ready` |
| A-073-B003 | 23 | `ready` |

## A-074 — `src/app/api/integrations/sharepoint/readiness/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `899dd3636a0bd9ff8455b091ca15948624d3c145736901369607ce1600812147`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-074-F001 | 10 | `GET` | `export async function GET() ` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-074-B001 | 12 | `!identity.ok` |
| A-074-B002 | 14 | `!access.allowed \|\| !isAuthorized(access.subject, "core.role.manage")` |
| A-074-B003 | 19 | `!configuration.configured` |
| A-074-B004 | 29 | `error instanceof MicrosoftGraphError` |
| A-074-B005 | 33 | `status === 401` |
| A-074-B006 | 33 | `status === 403` |
| A-074-B007 | 35 | `status >= 400 && status < 600` |

## A-075 — `src/app/api/internal/car-booking/osp/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `0e104ddaa8b36a634755cbc936f8d1f31398408092b76bbc56430b5bef08bc90`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-075-F001 | 4 | `POST` | `export async function POST(request:Request)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-075-B001 | 6 | `!secret\|\|secret.length<32\|\|!principal` |
| A-075-B002 | 8 | `Buffer.byteLength(token)!==Buffer.byteLength(secret)\|\|!timingSafeEqual(Buffer.from(token),Buffer.from(secret))` |

## A-076 — `src/app/api/nas/[...path]/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `3d5ca3e03245ac426fced787a373f5802f765ef936805a42f14bc43223470d40`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-076-F001 | 12 | `bridgeUrl` | `function bridgeUrl(path: string[], requestUrl: string) ` |
| A-076-F002 | 18 | `proxy` | `async function proxy(request: Request, context: RouteContext) ` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-076-E001 | 60 | `fetch(bridgeUrl(path, request.url), init)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-076-B001 | 20 | `!identity.ok` |
| A-076-B002 | 21 | `!["GET", "HEAD", "OPTIONS"].includes(request.method)` |
| A-076-B003 | 23 | `!origin \|\| origin !== new URL(request.url).origin` |
| A-076-B004 | 27 | `!access.allowed \|\| !canReadDocuments` |
| A-076-B005 | 34 | `isUpload && (request.method !== "POST" \|\| !canUpload)` |
| A-076-B006 | 39 | `!secret` |
| A-076-B007 | 46 | `contentType` |
| A-076-B008 | 47 | `contentLength` |
| A-076-B009 | 54 | `request.method !== "GET" && request.method !== "HEAD"` |
| A-076-B010 | 67 | `isUpload && upstream.ok` |
| A-076-B011 | 77 | `path[0] === "download" && upstream.ok` |

## A-077 — `src/app/api/work/export/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `53419441b334e8c3554877f3b8bae58cebbfe07c0b4bfebe9ead20f5da4bb742`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-077-F001 | 8 | `GET` | `export async function GET(request: Request) ` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-077-E001 | 20 | `getDb().transaction(async tx => { for (;;) { const rows = await tx.select().from(tasks).where(and(read, report, cursor ? gt(tasks.id, cursor) : undefined)).orderBy(asc(tasks.id)).limit(500); for (const row of rows) lines.push([row.jobCode, row.title, row.ownerId, row.teamId, presentWorkStatus(row.status).label, row.dueAt?.toISOString(), row.mainKpi, row.subKpi].map(csvCell).join(",")); if (rows.length < 500) break; cursor = rows.at(-1)!.id; } }, { isolationLevel: "repeatable read", accessMode: "read only" })` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-077-B001 | 10 | `!identity.ok` |
| A-077-B002 | 16 | `!access.allowed \|\| !read \|\| !report` |
| A-077-B003 | 22 | `cursor` |
| A-077-B004 | 24 | `rows.length < 500` |

## A-078 — `src/app/api/workspace/search/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `c357498c7f3d8496bb5de9aa2b1b6655af36925eb54d4e8d41d145f9f4dedcd5`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-078-F001 | 6 | `GET` | `export async function GET(request: Request) ` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-078-B001 | 8 | `!identity.ok` |
| A-078-B002 | 12 | `query.length < 2` |
| A-078-B003 | 15 | `preview` |

## A-079 — `src/app/change-password/page.tsx`

- Status: PLANNED. Consumers: S-036.
- Normalized UTF-8/LF source SHA-256: `c0813e3c13cc339dffeca4a663dba831cb331d3ab5ef5947177e272d97fe5db9`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-079-F001 | 14 | `ChangePasswordPage` | `export default async function ChangePasswordPage() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-079-C001 | 17 | `AuthShell`  | `title={copy.auth.changeTitle} description={copy.auth.changeDescription} contactText={getServerEnv().SUPPORT_CONTACT_TEXT}` |
| A-079-C002 | 17 | `ChangePasswordForm`  | `` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-079-E001 | 16 | `redirect("/login")` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-079-B001 | 16 | `!user` |

## A-080 — `src/app/global-error.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `218c4b79dd66371c483d622a8514b422b2a06ace0950fc2311173ba83f2ec2c4`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-080-F001 | 10 | `GlobalError` | `export default function GlobalError(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-080-C001 | 11 | `AuthShell`  | `title={copy.feedback.errorTitle} description={copy.feedback.errorDescription}` |
| A-080-C002 | 11 | `ErrorState`  | `digest={error.digest} reset={reset} embedded` |

## A-081 — `src/app/layout.tsx`

- Status: PLANNED. Consumers: S-001, S-002, S-003, S-004, S-005, S-006, S-007, S-008, S-009, S-010, S-011, S-012, S-013, S-014, S-015, S-016, S-017, S-018, S-019, S-020, S-021, S-022, S-023, S-024, S-025, S-026, S-027, S-028, S-029, S-030, S-031, S-032, S-033, S-034, S-035, S-036, S-037.
- Normalized UTF-8/LF source SHA-256: `b41e9dcfb859f0f443a8acb05bbdd9428879e6aa266b94ac637a0d3b08c2c5da`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-081-F001 | 21 | `RootLayout` | `export default function RootLayout(` |

## A-082 — `src/app/legacy/guarantee/[asset]/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `13c756b9cea7c881cc39d3a29d9b51bc761a27a65b4f4a49e0da14bcd532a3c4`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-082-F001 | 10 | `GET` | `export async function GET(_request: Request, context: ` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-082-B001 | 11 | `process.env.NODE_ENV === "production"` |
| A-082-B002 | 13 | `!allowedAssets.has(asset)` |

## A-083 — `src/app/legacy/guarantee/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `88c7f19d09f8ca2505f4179ef4495c32cc0da7afe9864023f3fd1ef83175e8d7`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-083-F001 | 10 | `sourceDir` | `function sourceDir() ` |
| A-083-F002 | 117 | `GET` | `export async function GET() ` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-083-B001 | 118 | `process.env.NODE_ENV === "production"` |
| A-083-B002 | 120 | `!access.allowed` |

## A-084 — `src/app/legacy/maxiwa/api/[...path]/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `3b0dc33231c9b8d9a3cf168786de589562db5d82b03158114c6ceeda95ec6ac5`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-084-F001 | 19 | `sourceDir` | `function sourceDir() ` |
| A-084-F002 | 23 | `parseEnvFile` | `function parseEnvFile(text: string) ` |
| A-084-F003 | 33 | `loadLocalWorker` | `function loadLocalWorker() ` |
| A-084-F004 | 40 | `loadLocalEnv` | `function loadLocalEnv() ` |
| A-084-F005 | 53 | `runLocalWorker` | `async function runLocalWorker(request: Request, path: string[], search: string, headers: Headers) ` |
| A-084-F006 | 64 | `proxy` | `async function proxy(request: Request, context: ` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-084-E001 | 61 | `worker.fetch(workerRequest, env)` |
| A-084-E002 | 78 | `(async () => { if (!process.env.MAXIWA_API_BASE) { return runLocalWorker(request, path, incomingUrl.search, headers); } const base = new URL(process.env.MAXIWA_API_BASE); if (!new Set(["http:", "https:"]).has(base.protocol)) throw new Error("Invalid MAXIWA API configuration"); const target = new URL(path.map(encodeURIComponent).join("/"), base.href.endsWith("/") ? base : &#96;${base.href}/&#96;); target.search = incomingUrl.search; return fetch(target, { method: request.method, headers, body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(), redirect: "manual", cache: "no-store", }); })().catch(() => null)` |
| A-084-E003 | 78 | `(async () => { if (!process.env.MAXIWA_API_BASE) { return runLocalWorker(request, path, incomingUrl.search, headers); } const base = new URL(process.env.MAXIWA_API_BASE); if (!new Set(["http:", "https:"]).has(base.protocol)) throw new Error("Invalid MAXIWA API configuration"); const target = new URL(path.map(encodeURIComponent).join("/"), base.href.endsWith("/") ? base : &#96;${base.href}/&#96;); target.search = incomingUrl.search; return fetch(target, { method: request.method, headers, body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(), redirect: "manual", cache: "no-store", }); })()` |
| A-084-E004 | 87 | `fetch(target, { method: request.method, headers, body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(), redirect: "manual", cache: "no-store", })` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-084-B001 | 27 | `!match \|\| line.trim().startsWith("#")` |
| A-084-B002 | 58 | `["GET", "HEAD"].includes(request.method)` |
| A-084-B003 | 65 | `process.env.NODE_ENV === "production"` |
| A-084-B004 | 66 | `!allowedMethods.has(request.method)` |
| A-084-B005 | 67 | `!(await getCurrentUser())` |
| A-084-B006 | 70 | `!path.length \|\| path.some((part) => !/^[A-Za-z0-9._~-]+$/.test(part))` |
| A-084-B007 | 76 | `value` |
| A-084-B008 | 79 | `!process.env.MAXIWA_API_BASE` |
| A-084-B009 | 84 | `!new Set(["http:", "https:"]).has(base.protocol)` |
| A-084-B010 | 85 | `base.href.endsWith("/")` |
| A-084-B011 | 90 | `["GET", "HEAD"].includes(request.method)` |
| A-084-B012 | 95 | `!response` |

## A-085 — `src/app/legacy/maxiwa/assets/[...path]/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `a95bc3fef8b44f170c232ce446c68638acb60f7c6aa364dbf57d20a410f78a0c`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-085-F001 | 13 | `GET` | `export async function GET(_request: Request, context: ` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-085-B001 | 14 | `process.env.NODE_ENV === "production"` |
| A-085-B002 | 16 | `!path.length \|\| !allowedRoots.has(path[0]) \|\| path.some((part) => part === ".." \|\| part.includes("/") \|\| part.includes("\\"))` |
| A-085-B003 | 21 | `filePath !== distRoot && !filePath.startsWith(&#96;${distRoot}${sep}&#96;)` |
| A-085-B004 | 24 | `path.join("/") === "config.js"` |

## A-086 — `src/app/legacy/maxiwa/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `029f3daad4235e0e9a47a39641f4be9d792bbf54142417bb4b6d477f8cb94bed`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-086-F001 | 11 | `sourceDir` | `function sourceDir() ` |
| A-086-F002 | 15 | `scriptValue` | `function scriptValue(value: string) ` |
| A-086-F003 | 76 | `bootScript` | `function bootScript(empId: string) ` |
| A-086-F004 | 133 | `GET` | `export async function GET() ` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-086-B001 | 134 | `process.env.NODE_ENV === "production"` |
| A-086-B002 | 136 | `!access.allowed` |
| A-086-B003 | 139 | `user?.email` |

## A-087 — `src/app/legacy/permission-next/route.ts`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `4aa57c1411cdf58934c079fd9ee8d8a059ebed4f786f853b355a834f9fcb9ceb`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-087-F001 | 23 | `GET` | `export async function GET() ` |

## A-088 — `src/app/login/actions.ts`

- Status: PLANNED. Consumers: S-001, S-002, S-003, S-004, S-005, S-006, S-007, S-008, S-009, S-010, S-011, S-012, S-013, S-014, S-015, S-016, S-017, S-018, S-019, S-020, S-021, S-022, S-023, S-024, S-025, S-026, S-027, S-028, S-029, S-030, S-031, S-032, S-033, S-034, S-035, S-036, S-037.
- Normalized UTF-8/LF source SHA-256: `82a89542aed98a149797a4a2d5816cc4c3539b64a0055090bfd17c8dcf2dbe55`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-088-F001 | 23 | `loginKeys` | `function loginKeys(email: string, ipAddress?: string): LoginRateLimitKey[] ` |
| A-088-F002 | 30 | `auditLogin` | `async function auditLogin(input: ` |
| A-088-F003 | 42 | `loginAction` | `export async function loginAction(_state: LoginState, form: FormData): Promise<LoginState> ` |
| A-088-F004 | 109 | `changePasswordAction` | `export async function changePasswordAction(_state: LoginState, form: FormData): Promise<LoginState> ` |
| A-088-F005 | 127 | `logoutAction` | `export async function logoutAction() ` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-088-E001 | 106 | `redirect(destination)` |
| A-088-E002 | 111 | `redirect(&#96;/login?reason=${await getSessionFailureReason()}&#96;)` |
| A-088-E003 | 124 | `redirect("/")` |
| A-088-E004 | 129 | `redirect("/login?reason=signed-out")` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-088-B001 | 25 | `email` |
| A-088-B002 | 26 | `ipAddress` |
| A-088-B003 | 47 | `!process.env.DATABASE_URL` |
| A-088-B004 | 58 | `rateLimit.blocked` |
| A-088-B005 | 67 | `validInput` |
| A-088-B006 | 68 | `!account` |
| A-088-B007 | 74 | `account.lockedUntil && account.lockedUntil <= now` |
| A-088-B008 | 79 | `account.status !== "active"` |
| A-088-B009 | 84 | `account.lockedUntil && account.lockedUntil > now` |
| A-088-B010 | 88 | `!valid` |
| A-088-B011 | 93 | `account.failedAttempts + 1 >= 5` |
| A-088-B012 | 100 | `account.mustChangePassword` |
| A-088-B013 | 103 | `error instanceof Error` |
| A-088-B014 | 111 | `!user` |
| A-088-B015 | 114 | `password !== confirm` |
| A-088-B016 | 116 | `!passwordCheck.ok` |

## A-089 — `src/app/login/page.tsx`

- Status: PLANNED. Consumers: S-037.
- Normalized UTF-8/LF source SHA-256: `04ce005b48668865c515c7a924a980940529eec465d51c7ecc435d3a4bf62ba5`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-089-F001 | 11 | `LoginPage` | `export default async function LoginPage(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-089-C001 | 18 | `AuthShell`  | `title={copy.pages.login} description={copy.auth.loginTitle} notice={loginReason(reason)} contactText={supportContactText}` |
| A-089-C002 | 18 | `LoginForm`  | `next={safeNextPath(next \|\| "")}` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-089-E001 | 15 | `redirect("/")` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-089-B001 | 15 | `await getCurrentUser()` |

## A-090 — `src/app/not-found.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `9cdc3b92673fc0f209c72dc490c7459672b057ecd190b94a71ab1551ab3397da`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-090-F001 | 4 | `NotFound` | `export default function NotFound() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-090-C001 | 4 | `AuthShell`  | `title={copy.feedback.notFound} description={copy.feedback.notFoundDescription}` |
| A-090-C002 | 4 | `Link`  | `className="button" href="/"` |

## A-091 — `src/components/access-denied.tsx`

- Status: PLANNED. Consumers: S-001, S-005, S-007, S-008, S-009, S-010, S-011, S-012, S-013, S-014, S-015, S-016, S-017, S-018, S-019, S-020, S-021, S-022, S-023, S-024, S-025, S-027, S-028, S-029, S-030, S-031, S-032, S-033, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `e21c3c5b93ac65f85b2db1f4d88899e1e7bc0521249e4cfdee68e666a7f25d90`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-091-F001 | 5 | `AccessDenied` | `export function AccessDenied(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-091-C001 | 6 | `section`  | `className="access-denied" role="alert"` |
| A-091-C002 | 13 | `Link`  | `className="primary" href="/"` |

## A-092 — `src/components/account-control.tsx`

- Status: PLANNED. Consumers: S-001, S-002, S-003, S-004, S-005, S-006, S-007, S-008, S-009, S-010, S-011, S-012, S-013, S-014, S-015, S-016, S-017, S-018, S-019, S-020, S-021, S-022, S-023, S-024, S-025, S-026, S-027, S-028, S-029, S-030, S-031, S-032, S-033, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `3fe8cc95b34e499dc3bac0e5ae71aa82c5f91f07f35be03534583310e3be6949`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-092-F001 | 7 | `AccountControl` | `export function AccountControl(` |
| A-092-F002 | 14 | `close` | `(event: PointerEvent) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-092-C001 | 33 | `div`  | `className="account-control" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape" && open) { event.stopPropagation(); setOpen(false); triggerRef.current?.focus(); } }}` |
| A-092-C002 | 34 | `button`  | `ref={triggerRef} className="account-trigger" aria-label={&#96;บัญชีผู้ใช้ ${displayName}&#96;} aria-controls={popoverId} aria-expanded={open} onClick={toggle} type="button"` |
| A-092-C003 | 49 | `div`  | `ref={popoverRef} className={&#96;account-popover${open ? " open" : ""}&#96;} id={popoverId} role="region" aria-label="บัญชีผู้ใช้" hidden={!open}` |
| A-092-C004 | 59 | `form`  | `action={logoutAction}` |
| A-092-C005 | 60 | `button` ออกจากระบบ | `className="btn-logout" type="submit"` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-092-T001 | 8 | `[open, setOpen] = useState(false)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-092-B001 | 15 | `triggerRef.current && !triggerRef.current.contains(event.target as Node) && popoverRef.current && !popoverRef.current.contains(event.target as Node)` |
| A-092-B002 | 33 | `!event.currentTarget.contains(event.relatedTarget as Node)` |
| A-092-B003 | 33 | `event.key === "Escape" && open` |
| A-092-B004 | 51 | `open` |

## A-093 — `src/components/admin-module-settings.tsx`

- Status: PLANNED. Consumers: S-002.
- Normalized UTF-8/LF source SHA-256: `5a608cc41964a9269c9580351abc6c97ef69c755af53d733cd951b8e1ad9ce89`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-093-F001 | 5 | `ModuleForm` | `function ModuleForm(` |
| A-093-F002 | 12 | `AdminModuleSettings` | `export function AdminModuleSettings(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-093-C001 | 7 | `form`  | `action={action} className="admin-panel"` |
| A-093-C002 | 8 | `input`  | `type="hidden" name="moduleId" value={item.id}` |
| A-093-C003 | 8 | `input`  | `type="hidden" name="version" value={item.version}` |
| A-093-C004 | 8 | `input`  | `type="hidden" name="enabled" value={String(!item.enabled)}` |
| A-093-C005 | 9 | `button`  | `className="secondary-action" disabled={pending \|\| !item.ready}` |
| A-093-C006 | 9 | `p`  | `role="status"` |
| A-093-C007 | 13 | `p` ยังไม่ได้ติดตั้งข้อมูลตั้งค่าโมดูล กรุณาติดต่อผู้ดูแลระบบ | `role="status"` |
| A-093-C008 | 14 | `ModuleForm`  | `key={&#96;${item.id}:${item.version}&#96;} item={item}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-093-T001 | 6 | `[state, action, pending] = useActionState(setModuleEnabledAction, { ok: false, message: "" })` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-093-B001 | 7 | `item.enabled` |
| A-093-B002 | 9 | `pending` |
| A-093-B003 | 9 | `item.enabled` |
| A-093-B004 | 13 | `!available` |

## A-094 — `src/components/admin-workspace-ux.tsx`

- Status: PLANNED. Consumers: S-002.
- Normalized UTF-8/LF source SHA-256: `6c35db599050e1dfd8256ae5ee4307e5f6b71e52db331fe08233bcc0598200b6`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-094-F001 | 3 | `confirmAccountSecurityAction` | `export function confirmAccountSecurityAction(event: ` |
| A-094-F002 | 10 | `AdminSearchFeedback` | `export function AdminSearchFeedback(` |
| A-094-F003 | 15 | `ResetPasswordInput` | `export function ResetPasswordInput(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-094-C001 | 12 | `div`  | `role="status"` |
| A-094-C002 | 12 | `button` ล้างคำค้นหา | `type="button" className="secondary-action" onClick={onClear}` |
| A-094-C003 | 17 | `input`  | `id={id} aria-describedby={&#96;${id}-hint&#96;} name="password" type="password" minLength={12} autoComplete="new-password" required` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-094-E001 | 3 | `window.confirm(message)` |
| A-094-E002 | 6 | `confirm(&#96;ยืนยัน${kind === "reset-password" ? "รีเซ็ตรหัสผ่าน" : "ยกเลิกทุกเซสชัน"}ของ ${account}? ${consequence}&#96;)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-094-B001 | 4 | `user.displayName` |
| A-094-B002 | 5 | `kind === "reset-password"` |
| A-094-B003 | 6 | `!confirm(&#96;ยืนยัน${kind === "reset-password" ? "รีเซ็ตรหัสผ่าน" : "ยกเลิกทุกเซสชัน"}ของ ${account}? ${consequence}&#96;)` |
| A-094-B004 | 6 | `kind === "reset-password"` |
| A-094-B005 | 11 | `visible` |
| A-094-B006 | 12 | `total` |

## A-095 — `src/components/admin-workspace.tsx`

- Status: PLANNED. Consumers: S-002.
- Normalized UTF-8/LF source SHA-256: `4713a88d1c77791baa8b0d3b7533ed252b1b7c262bb856b6f16da1b9290a6bef`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-095-F001 | 25 | `Result` | `function Result(` |
| A-095-F002 | 29 | `scopeLabel` | `function scopeLabel(scopeType: string) ` |
| A-095-F003 | 36 | `EditUserDialog` | `function EditUserDialog(` |
| A-095-F004 | 79 | `RoleEditor` | `function RoleEditor(` |
| A-095-F005 | 88 | `AdminWorkspace` | `export function AdminWorkspace(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-095-C001 | 26 | `p`  | `className={state.ok ? "admin-success" : "admin-error"} role="status"` |
| A-095-C002 | 54 | `button` จัดการการเข้าถึง | `type="button" className="secondary-action admin-edit-trigger" onClick={() => dialogRef.current?.showModal()}` |
| A-095-C003 | 55 | `dialog`  | `ref={dialogRef} className="admin-user-dialog" aria-labelledby={&#96;edit-user-${user.id}&#96;}` |
| A-095-C004 | 56 | `button` × | `type="button" onClick={() => dialogRef.current?.close()} aria-label="ปิดหน้าต่างแก้ไข"` |
| A-095-C005 | 57 | `form`  | `action={updateProfile} className="admin-user-edit-form"` |
| A-095-C006 | 57 | `input`  | `type="hidden" name="userId" value={user.id}` |
| A-095-C007 | 59 | `input`  | `name="displayName" defaultValue={user.displayName \|\| ""} minLength={2} maxLength={120} required` |
| A-095-C008 | 60 | `input`  | `name="email" type="email" defaultValue={user.email} maxLength={254} required` |
| A-095-C009 | 61 | `input`  | `name="employeeCode" defaultValue={user.employeeCode \|\| ""} maxLength={64}` |
| A-095-C010 | 62 | `select`  | `name="status" defaultValue={user.status}` |
| A-095-C011 | 64 | `select`  | `name="positionId" value={positionId} onChange={(event) => { const next = event.target.value; setPositionId(next); setScopeType(positions.find((item) => item.id === next)?.scopeType \|\| "OWN"); }} required` |
| A-095-C012 | 65 | `select`  | `name="teamId" value={teamId} onChange={(event) => setTeamId(event.target.value)} required={scopeType === "TEAM"}` |
| A-095-C013 | 66 | `select`  | `name="scopeType" value={scopeType} onChange={(event) => setScopeType(event.target.value)}` |
| A-095-C014 | 67 | `input`  | `type="checkbox" name="selectedTeamId" value={team.id} checked={selectedTeams.includes(team.id)} onChange={(event) => setSelectedTeams((current) => event.target.checked ? [...current, team.id] : current.filter((id) => id !== team.id))}` |
| A-095-C015 | 69 | `aside`  | `className="admin-access-preview" aria-live="polite"` |
| A-095-C016 | 70 | `details`  | `` |
| A-095-C017 | 70 | `summary` รายละเอียดเพิ่มเติม | `` |
| A-095-C018 | 71 | `button` ยกเลิก | `type="button" className="secondary-action" onClick={() => dialogRef.current?.close()}` |
| A-095-C019 | 71 | `button`  | `className="primary" disabled={profilePending}` |
| A-095-C020 | 73 | `form`  | `action={resetPassword} onSubmit={event => confirmAccountSecurityAction(event, "reset-password", user)}` |
| A-095-C021 | 73 | `input`  | `type="hidden" name="userId" value={user.id}` |
| A-095-C022 | 73 | `ResetPasswordInput`  | `userId={user.id}` |
| A-095-C023 | 73 | `button`  | `className="secondary-action" disabled={passwordPending}` |
| A-095-C024 | 74 | `form`  | `action={revokeSessions} onSubmit={event => confirmAccountSecurityAction(event, "revoke-sessions", user)}` |
| A-095-C025 | 74 | `input`  | `type="hidden" name="userId" value={user.id}` |
| A-095-C026 | 74 | `button`  | `className="secondary-action" disabled={sessionPending \|\| sessionCount === 0}` |
| A-095-C027 | 84 | `details`  | `className="admin-role-editor"` |
| A-095-C028 | 84 | `summary`  | `` |
| A-095-C029 | 84 | `form`  | `action={action}` |
| A-095-C030 | 84 | `input`  | `type="hidden" name="roleId" value={role.id}` |
| A-095-C031 | 84 | `input`  | `name="code" defaultValue={role.code} disabled={role.isSystem} required` |
| A-095-C032 | 84 | `input`  | `name="name" defaultValue={role.name} disabled={role.isSystem} required` |
| A-095-C033 | 84 | `input`  | `name="description" defaultValue={role.description \|\| ""} disabled={role.isSystem}` |
| A-095-C034 | 85 | `input`  | `type="checkbox" name="permissionCode" value={capability.code} defaultChecked={granted.has(capability.code)} disabled={role.isSystem}` |
| A-095-C035 | 85 | `details`  | `` |
| A-095-C036 | 85 | `summary` รายละเอียดเพิ่มเติม | `` |
| A-095-C037 | 85 | `button`  | `className="primary" disabled={pending}` |
| A-095-C038 | 85 | `form`  | `action={deleteRole} className="admin-role-delete-form" onSubmit={(event) => { if (!window.confirm(&#96;ยืนยันลบบทบาท ${role.name}? การลบจะลบสิทธิ์ที่ผูกกับบทบาทด้วย&#96;)) event.preventDefault(); }}` |
| A-095-C039 | 85 | `input`  | `type="hidden" name="roleId" value={role.id}` |
| A-095-C040 | 85 | `button`  | `type="submit" className="danger-action" disabled={deletePending}` |
| A-095-C041 | 104 | `input`  | `type="search" value={userQuery} onChange={event=>setUserQuery(event.target.value)} placeholder="ชื่อ อีเมล รหัสพนักงาน หรือทีม"` |
| A-095-C042 | 104 | `span` แสดง จาก บัญชี | `role="status"` |
| A-095-C043 | 105 | `details`  | `className="admin-create-disclosure"` |
| A-095-C044 | 105 | `summary` เพิ่มผู้ใช้ | `` |
| A-095-C045 | 105 | `form`  | `action={createUser} className="admin-form admin-create-row"` |
| A-095-C046 | 105 | `input`  | `name="displayName" required minLength={2}` |
| A-095-C047 | 105 | `input`  | `name="email" type="email" required` |
| A-095-C048 | 105 | `input`  | `name="employeeCode"` |
| A-095-C049 | 105 | `select`  | `name="positionId" required` |
| A-095-C050 | 105 | `select`  | `name="teamId"` |
| A-095-C051 | 105 | `input`  | `name="password" type="password" minLength={12} autoComplete="new-password" required` |
| A-095-C052 | 105 | `button`  | `className="primary" disabled={userPending \|\| !positions.length}` |
| A-095-C053 | 106 | `AdminSearchFeedback`  | `total={users.length} visible={visibleUsers.length} onClear={() => setUserQuery("")}` |
| A-095-C054 | 107 | `div`  | `className="admin-table-wrap" role="region" aria-label={copy.feedback.usersTable} tabIndex={0}` |
| A-095-C055 | 107 | `table`  | `` |
| A-095-C056 | 107 | `strong`  | `title={user.displayName \|\| undefined}` |
| A-095-C057 | 107 | `EditUserDialog`  | `user={user} positions={positions} teams={teams} rolePermissions={rolePermissions} userScopes={scopes} sessionCount={sessions.find((item) => item.userId === user.id)?.count \|\| 0}` |
| A-095-C058 | 110 | `form`  | `action={createPosition} className="admin-form"` |
| A-095-C059 | 110 | `input`  | `name="code" placeholder="building_officer" required` |
| A-095-C060 | 110 | `input`  | `name="name" required` |
| A-095-C061 | 110 | `select`  | `name="roleId" required` |
| A-095-C062 | 110 | `select`  | `name="scopeType" defaultValue="OWN"` |
| A-095-C063 | 110 | `button` เพิ่มตำแหน่ง | `className="secondary-action" disabled={positionPending}` |
| A-095-C064 | 110 | `form`  | `action={updatePosition} key={position.id}` |
| A-095-C065 | 110 | `input`  | `type="hidden" name="positionId" value={position.id}` |
| A-095-C066 | 110 | `input`  | `name="name" defaultValue={position.name} aria-label={&#96;ชื่อตำแหน่ง ${position.code}&#96;}` |
| A-095-C067 | 110 | `select`  | `name="roleId" defaultValue={position.roleId} aria-label={&#96;บทบาทของตำแหน่ง ${position.code}&#96;}` |
| A-095-C068 | 110 | `select`  | `name="scopeType" defaultValue={position.scopeType} aria-label={&#96;ขอบเขตเริ่มต้นของตำแหน่ง ${position.code}&#96;}` |
| A-095-C069 | 110 | `button` บันทึก | `disabled={positionEditPending}` |
| A-095-C070 | 111 | `form`  | `action={createTeam} className="admin-team-form"` |
| A-095-C071 | 111 | `input`  | `name="code" placeholder="permission_ops" minLength={2} maxLength={64} required` |
| A-095-C072 | 111 | `input`  | `name="name" minLength={2} maxLength={120} required` |
| A-095-C073 | 111 | `button` เพิ่มทีม | `className="secondary-action" disabled={teamPending}` |
| A-095-C074 | 111 | `form`  | `action={updateTeam}` |
| A-095-C075 | 111 | `input`  | `type="hidden" name="teamId" value={team.id}` |
| A-095-C076 | 111 | `input`  | `name="name" defaultValue={team.name} aria-label={&#96;ชื่อทีม ${team.code}&#96;}` |
| A-095-C077 | 111 | `button` บันทึก | `disabled={teamEditPending}` |
| A-095-C078 | 111 | `form`  | `action={deleteTeam} onSubmit={(event) => { if (!window.confirm(&#96;ยืนยันลบทีม ${team.name}?&#96;)) event.preventDefault(); }}` |
| A-095-C079 | 111 | `input`  | `type="hidden" name="teamId" value={team.id}` |
| A-095-C080 | 111 | `button`  | `type="submit" disabled={deleteTeamPending \|\| memberCount > 0} aria-label={memberCount > 0 ? &#96;ย้ายผู้ใช้ออกจากทีม ${team.name} ก่อนลบ&#96; : &#96;ลบทีม ${team.name}&#96;}` |
| A-095-C081 | 113 | `form`  | `action={createRole} className="admin-form admin-role-create"` |
| A-095-C082 | 113 | `input`  | `name="code" required` |
| A-095-C083 | 113 | `input`  | `name="name" required` |
| A-095-C084 | 113 | `input`  | `name="description"` |
| A-095-C085 | 113 | `select`  | `name="sourceRoleId"` |
| A-095-C086 | 113 | `button`  | `className="secondary-action" disabled={rolePending}` |
| A-095-C087 | 113 | `RoleEditor`  | `key={role.id} role={role} permissions={rolePermissions} capabilities={capabilities}` |
| A-095-C088 | 114 | `div`  | `className="admin-table-wrap" role="region" aria-label={copy.feedback.auditTable} tabIndex={0}` |
| A-095-C089 | 114 | `table`  | `` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-095-T001 | 40 | `[positionId, setPositionId] = useState(user.positionId \|\| "")` |
| A-095-T002 | 42 | `[scopeType, setScopeType] = useState(initialScope)` |
| A-095-T003 | 43 | `[teamId, setTeamId] = useState(user.teamId \|\| "")` |
| A-095-T004 | 44 | `[selectedTeams, setSelectedTeams] = useState(() => userScopes.map((scope) => scope.selectedTeamId).filter(Boolean) as string[])` |
| A-095-T005 | 45 | `[profileState, updateProfile, profilePending] = useActionState(updateUserAccessAction, initial)` |
| A-095-T006 | 46 | `[passwordState, resetPassword, passwordPending] = useActionState(resetPasswordAction, initial)` |
| A-095-T007 | 47 | `[sessionState, revokeSessions, sessionPending] = useActionState(revokeUserSessionsAction, initial)` |
| A-095-T008 | 80 | `[state, action, pending] = useActionState(updateRolePermissionsAction, initial)` |
| A-095-T009 | 81 | `[deleteState, deleteRole, deletePending] = useActionState(deleteRoleAction, initial)` |
| A-095-T010 | 93 | `[userState, createUser, userPending] = useActionState(createUserAction, initial)` |
| A-095-T011 | 94 | `[positionState, createPosition, positionPending] = useActionState(createPositionAction, initial)` |
| A-095-T012 | 95 | `[teamState, createTeam, teamPending] = useActionState(createTeamAction, initial)` |
| A-095-T013 | 96 | `[deleteTeamState, deleteTeam, deleteTeamPending] = useActionState(deleteTeamAction, initial)` |
| A-095-T014 | 97 | `[roleState, createRole, rolePending] = useActionState(createRoleAction, initial)` |
| A-095-T015 | 98 | `[positionEditState, updatePosition, positionEditPending] = useActionState(updatePositionAction, initial)` |
| A-095-T016 | 99 | `[teamEditState, updateTeam, teamEditPending] = useActionState(updateTeamAction, initial)` |
| A-095-T017 | 100 | `[userQuery,setUserQuery] = useState("")` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-095-E001 | 54 | `dialogRef.current?.showModal()` |
| A-095-E002 | 56 | `dialogRef.current?.close()` |
| A-095-E003 | 71 | `dialogRef.current?.close()` |
| A-095-E004 | 73 | `confirmAccountSecurityAction(event, "reset-password", user)` |
| A-095-E005 | 74 | `confirmAccountSecurityAction(event, "revoke-sessions", user)` |
| A-095-E006 | 85 | `window.confirm(&#96;ยืนยันลบบทบาท ${role.name}? การลบจะลบสิทธิ์ที่ผูกกับบทบาทด้วย&#96;)` |
| A-095-E007 | 111 | `window.confirm(&#96;ยืนยันลบทีม ${team.name}?&#96;)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-095-B001 | 26 | `state.message` |
| A-095-B002 | 26 | `state.ok` |
| A-095-B003 | 30 | `scopeType === "ALL"` |
| A-095-B004 | 31 | `scopeType === "TEAM"` |
| A-095-B005 | 32 | `scopeType === "SELECTED_TEAMS"` |
| A-095-B006 | 49 | `position` |
| A-095-B007 | 67 | `event.target.checked` |
| A-095-B008 | 69 | `!teamId` |
| A-095-B009 | 69 | `!selectedTeamNames.length` |
| A-095-B010 | 70 | `Object.entries(groups).length` |
| A-095-B011 | 71 | `profilePending` |
| A-095-B012 | 73 | `passwordPending` |
| A-095-B013 | 74 | `sessionPending` |
| A-095-B014 | 84 | `role.isSystem` |
| A-095-B015 | 85 | `pending` |
| A-095-B016 | 85 | `!window.confirm(&#96;ยืนยันลบบทบาท ${role.name}? การลบจะลบสิทธิ์ที่ผูกกับบทบาทด้วย&#96;)` |
| A-095-B017 | 85 | `deletePending` |
| A-095-B018 | 105 | `userPending` |
| A-095-B019 | 107 | `user.status === "active"` |
| A-095-B020 | 111 | `!window.confirm(&#96;ยืนยันลบทีม ${team.name}?&#96;)` |
| A-095-B021 | 111 | `memberCount > 0` |
| A-095-B022 | 111 | `memberCount > 0` |
| A-095-B023 | 113 | `rolePending` |
| A-095-B024 | 114 | `auditRows.length` |

## A-096 — `src/components/app-shell.tsx`

- Status: PLANNED. Consumers: S-001, S-002, S-003, S-004, S-005, S-006, S-007, S-008, S-009, S-010, S-011, S-012, S-013, S-014, S-015, S-016, S-017, S-018, S-019, S-020, S-021, S-022, S-023, S-024, S-025, S-026, S-027, S-028, S-029, S-030, S-031, S-032, S-033, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `1eac5ed6534565be6bcb998e285c2c625fc2dda41f2c7f306c513d97d3048282`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-096-F001 | 13 | `AppShell` | `export function AppShell(` |
| A-096-F002 | 25 | `toggleCollapsed` | `function toggleCollapsed() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-096-C001 | 33 | `a` ข้ามไปยังเนื้อหาหลัก | `className="skip-link" href="#workspace-content"` |
| A-096-C002 | 36 | `button`  | `className={&#96;${styles.mobileToggle} transition-colors hover:border-[var(--color-brand)] hover:bg-[var(--color-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]&#96;} type="button" aria-label="เปิดเมนูพื้นที่ทำงาน" aria-haspopup="dialog" aria-controls="mobile-workspace-menu" onClick={() => mobileDialog.current?.showModal()}` |
| A-096-C003 | 37 | `Link`  | `className={&#96;${styles.brand} transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2&#96;} href="/" aria-label="Permission Next — ภาพรวม"` |
| A-096-C004 | 38 | `WorkspaceSearch`  | `allowedModuleIds={allowedModuleIds} contained` |
| A-096-C005 | 43 | `AccountControl`  | `displayName={displayName}` |
| A-096-C006 | 50 | `button`  | `className={&#96;${styles.collapse} transition-colors hover:border-[var(--color-nav-accent)] hover:text-[var(--color-nav-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-nav-focus)]&#96;} type="button" aria-label={collapsed ? "ขยายเมนูด้านข้าง" : "ยุบเมนูด้านข้าง"} aria-expanded={!collapsed} onClick={toggleCollapsed} title={collapsed ? "ขยายเมนู" : "ยุบเมนู"}` |
| A-096-C007 | 57 | `dialog`  | `className={&#96;${styles.drawer} shadow-lg&#96;} id="mobile-workspace-menu" ref={mobileDialog} aria-label="เมนูพื้นที่ทำงาน" onClick={(event) => { if (event.target === mobileDialog.current) mobileDialog.current?.close(); }}` |
| A-096-C008 | 59 | `button`  | `className="round-btn transition-colors hover:bg-[var(--color-nav-subtle)]" type="button" aria-label="ปิดเมนูพื้นที่ทำงาน" onClick={() => mobileDialog.current?.close()}` |
| A-096-C009 | 60 | `ModuleNav`  | `idPrefix="mobile-sidebar-section" allowedModuleIds={allowedModuleIds} canAdmin={canAdmin} workNavigation={workNavigation} onNavigate={() => mobileDialog.current?.close()}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-096-T001 | 14 | `[collapsed, setCollapsed] = useState(false)` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-096-E001 | 36 | `mobileDialog.current?.showModal()` |
| A-096-E002 | 57 | `mobileDialog.current?.close()` |
| A-096-E003 | 59 | `mobileDialog.current?.close()` |
| A-096-E004 | 60 | `mobileDialog.current?.close()` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-096-B001 | 28 | `next` |
| A-096-B002 | 32 | `collapsed` |
| A-096-B003 | 50 | `collapsed` |
| A-096-B004 | 50 | `collapsed` |
| A-096-B005 | 57 | `event.target === mobileDialog.current` |

## A-097 — `src/components/auth/auth-shell.tsx`

- Status: PLANNED. Consumers: S-036, S-037.
- Normalized UTF-8/LF source SHA-256: `c3bb318dccf01c2b57ef2880d39ffbd155a61b6d6d32bb9f1009b361bdf1f4d6`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-097-F001 | 5 | `AuthBrand` | `export function AuthBrand(` |
| A-097-F002 | 9 | `AuthShell` | `export function AuthShell(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-097-C001 | 14 | `p`  | `className="auth-notice" role="status"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-097-B001 | 6 | `imageSrc` |

## A-098 — `src/components/auth/password-field.tsx`

- Status: PLANNED. Consumers: S-036, S-037.
- Normalized UTF-8/LF source SHA-256: `2aa84fd1825e05c48b8d95824566276b220f144ab193070e3bd425cc931d404c`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-098-F001 | 7 | `PasswordField` | `export function PasswordField(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-098-C001 | 10 | `input`  | `{...input} id={id} ref={inputRef} type={visible ? "text" : "password"} aria-invalid={Boolean(error)} aria-describedby={&#96;${id}-hint&#96;} onKeyUp={event => setCaps(event.getModifierState("CapsLock"))} onKeyDown={event => setCaps(event.getModifierState("CapsLock"))}` |
| A-098-C002 | 11 | `button`  | `type="button" className="auth-visibility" aria-pressed={visible} aria-label={&#96;${visible ? copy.auth.hidePassword : copy.auth.showPassword}: ${label}&#96;} onClick={() => setVisible(value => !value)}` |
| A-098-C003 | 14 | `span`  | `id={&#96;${id}-hint&#96;} className="auth-field-hint" aria-live="polite"` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-098-T001 | 8 | `[visible, setVisible] = useState(false)` |
| A-098-T002 | 8 | `[caps, setCaps] = useState(false)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-098-B001 | 10 | `visible` |
| A-098-B002 | 11 | `visible` |
| A-098-B003 | 12 | `hidden` |
| A-098-B004 | 12 | `visible === hidden` |
| A-098-B005 | 14 | `error` |
| A-098-B006 | 14 | `caps` |

## A-099 — `src/components/change-password-form-ux.tsx`

- Status: PLANNED. Consumers: S-036.
- Normalized UTF-8/LF source SHA-256: `af9a3ff6fc3085645781756f05abdb4faa30d213a7e5fab4cc19a9867de23588`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-099-F001 | 8 | `submitPasswordChange` | `export function submitPasswordChange(event: ` |
| A-099-F002 | 20 | `ChangePasswordFields` | `export function ChangePasswordFields(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-099-C001 | 23 | `PasswordField`  | `label={copy.auth.newPassword} inputRef={passwordRef} name="password" minLength={12} maxLength={256} autoComplete="new-password" required autoFocus value={password} error={errors.password} onChange={event => onPasswordChange(event.target.value)}` |
| A-099-C002 | 23 | `PasswordField`  | `label={copy.auth.confirmPassword} inputRef={confirmRef} name="confirm" minLength={12} maxLength={256} autoComplete="new-password" required value={confirm} onChange={event => onConfirmChange(event.target.value)} error={errors.confirm \|\| (confirm && password !== confirm ? copy.auth.passwordMismatch : undefined)}` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-099-E001 | 23 | `onConfirmChange(event.target.value)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-099-B001 | 9 | `options.pending` |
| A-099-B002 | 12 | `!validation.ok` |
| A-099-B003 | 13 | `options.password !== options.confirm` |
| A-099-B004 | 16 | `errors.password` |
| A-099-B005 | 16 | `errors.confirm` |
| A-099-B006 | 17 | `first` |
| A-099-B007 | 23 | `confirm && password !== confirm` |

## A-100 — `src/components/change-password-form.tsx`

- Status: PLANNED. Consumers: S-036.
- Normalized UTF-8/LF source SHA-256: `e1de3a6e8dda0cac664180751752c016f77850af2a22981f35ffa9eb4432b2d5`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-100-F001 | 9 | `ChangePasswordForm` | `export function ChangePasswordForm() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-100-C001 | 18 | `form`  | `action={action} className="auth-form" noValidate aria-busy={pending} onSubmit={event => { submitPasswordChange(event, { password, confirm, pending, setErrors, focus: field => (field === "password" ? passwordRef : confirmRef).current?.focus() }); }}` |
| A-100-C002 | 21 | `div` ! | `className="auth-error" role="alert"` |
| A-100-C003 | 22 | `ChangePasswordFields`  | `password={password} confirm={confirm} errors={errors} passwordRef={passwordRef} confirmRef={confirmRef} onPasswordChange={value => { setPassword(value); setErrors({}); }} onConfirmChange={value => { setConfirm(value); setErrors(current => ({ ...current, confirm: undefined })); }}` |
| A-100-C004 | 23 | `ul`  | `aria-live="polite"` |
| A-100-C005 | 23 | `span`  | `aria-live="polite"` |
| A-100-C006 | 24 | `button`  | `className="button auth-submit-button" disabled={pending}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-100-T001 | 10 | `[state, action, pending] = useActionState(changePasswordAction, {})` |
| A-100-T002 | 11 | `[password, setPassword] = useState("")` |
| A-100-T003 | 11 | `[confirm, setConfirm] = useState("")` |
| A-100-T004 | 12 | `[errors, setErrors] = useState<{ password?: string; confirm?: string }>({})` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-100-E001 | 19 | `(field === "password" ? passwordRef : confirmRef).current?.focus()` |
| A-100-E002 | 22 | `setConfirm(value)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-100-B001 | 15 | `state.error` |
| A-100-B002 | 19 | `field === "password"` |
| A-100-B003 | 23 | `met` |
| A-100-B004 | 23 | `met` |
| A-100-B005 | 24 | `pending` |

## A-101 — `src/components/dashboard-overview.tsx`

- Status: PLANNED. Consumers: S-026.
- Normalized UTF-8/LF source SHA-256: `e3df0e03eba6d0e32788e418af7d3960b0889f7b2c8a459d91cbd267d27f121f`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-101-F001 | 15 | `DashboardOverview` | `export function DashboardOverview(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-101-C001 | 21 | `PageHeader`  | `className="page-enter" eyebrow="ภาพรวมการทำงาน" title="วันนี้ต้องจัดการอะไรบ้าง" description={&#96;สวัสดี ${displayName} · รวมงานและรายการสำคัญที่คุณต้องติดตาม&#96;} actions={<><RefreshButton/><span className="updated-at whitespace-nowrap text-xs text-[var(--color-text-muted)]">{hasLiveData ? &#96;ข้อมูล ณ ${formatWorkspaceDate(snapshot.generatedAt, true)}&#96; : copy.feedback.dataPreparing}</span></>}` |
| A-101-C002 | 21 | `RefreshButton`  | `` |
| A-101-C003 | 22 | `EmptyState`  | `className="overview-empty rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm" title="ยังไม่มีพื้นที่ทำงานที่เข้าถึงได้" description="กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์ตามหน้าที่ของคุณ" badge={<WorkspaceIcon name="guarantees" size={32}/>}` |
| A-101-C004 | 24 | `Link`  | `className="group flex min-h-28 items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition-colors duration-150 hover:border-[var(--color-brand)] hover:bg-[var(--color-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2" href={&#96;${module.href}${preview ? "?preview=1" : ""}&#96;} key={module.id}` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-101-B001 | 21 | `hasLiveData` |
| A-101-B002 | 22 | `allowedModuleIds.length` |
| A-101-B003 | 24 | `preview` |

## A-102 — `src/components/deposit-editor.tsx`

- Status: PLANNED. Consumers: S-023, S-024.
- Normalized UTF-8/LF source SHA-256: `939cdfac4d9ace0482e03aaa31ef4f71caf97cfea983da2f1fdc49515e97cb1d`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-102-F001 | 14 | `money` | `(value: number) ` |
| A-102-F002 | 15 | `TextField` | `function TextField(` |
| A-102-F003 | 19 | `DepositEditor` | `export function DepositEditor(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-102-C001 | 16 | `input`  | `name={name} type={type} defaultValue={value ?? ""} required={required} min={type === "number" ? 0 : undefined} step={type === "number" ? ".01" : undefined}` |
| A-102-C002 | 29 | `Link` ← กลับรายการ | `href="/guarantees"` |
| A-102-C003 | 30 | `form`  | `action={saveAction} className="deposit-form"` |
| A-102-C004 | 31 | `input`  | `type="hidden" name="id" value={item.id}` |
| A-102-C005 | 31 | `input`  | `type="hidden" name="version" value={item.version}` |
| A-102-C006 | 32 | `select`  | `name="area" value={area} onChange={(event) => setArea(event.target.value)} required` |
| A-102-C007 | 34 | `input`  | `name="tl_team" value={area ? &#96;ทีมติดตั้ง ${area}&#96; : ""} readOnly` |
| A-102-C008 | 40 | `select`  | `name="tlAssigneeId" defaultValue={item?.tlAssigneeId \|\| ""}` |
| A-102-C009 | 52 | `select`  | `name="inspected_by" defaultValue={item?.inspected_by \|\| ""}` |
| A-102-C010 | 53 | `select`  | `name="depReturn" defaultValue={item?.depReturn \|\| "No"}` |
| A-102-C011 | 54 | `select`  | `name="demoReturn" defaultValue={item?.demoReturn \|\| "No"}` |
| A-102-C012 | 56 | `button`  | `className="primary" disabled={savePending}` |
| A-102-C013 | 57 | `p`  | `role="status" className={&#96;deposit-form-message ${saveState.ok ? "" : "error"}&#96;}` |
| A-102-C014 | 61 | `DepositEvidenceUpload`  | `id={item.id} version={item.version} kind="pdf_payment" exists={Boolean(item.pdf_payment)}` |
| A-102-C015 | 62 | `DepositEvidenceUpload`  | `id={item.id} version={item.version} kind="pdf_layout" exists={Boolean(item.pdf_layout)}` |
| A-102-C016 | 63 | `DepositEvidenceUpload`  | `id={item.id} version={item.version} kind="pdf_additional" exists={Boolean(item.pdf_additional)}` |
| A-102-C017 | 64 | `DepositEvidenceUpload`  | `id={item.id} version={item.version} kind="pdf_tl_work" exists={Boolean(item.pdf_tl_work)}` |
| A-102-C018 | 65 | `DepositEvidenceUpload`  | `id={item.id} version={item.version} kind="pdf_tl_extra" exists={Boolean(item.pdf_tl_extra)}` |
| A-102-C019 | 66 | `DepositEvidenceUpload`  | `id={item.id} version={item.version} kind="pdf_user_final" exists={Boolean(item.pdf_user_final)}` |
| A-102-C020 | 67 | `DepositEvidenceUpload`  | `id={item.id} version={item.version} kind="pdf_demo_off" exists={Boolean(item.pdf_demo_off)}` |
| A-102-C021 | 69 | `form`  | `className="deposit-transition" action={transitionAction}` |
| A-102-C022 | 69 | `input`  | `type="hidden" name="id" value={item.id}` |
| A-102-C023 | 69 | `input`  | `type="hidden" name="version" value={item.version}` |
| A-102-C024 | 69 | `textarea`  | `name="reason" placeholder="เหตุผล (จำเป็นเมื่อส่งกลับหรือยกเลิก)" aria-label="เหตุผล"` |
| A-102-C025 | 70 | `button`  | `type="submit" name="to" value={target} disabled={transitionPending} key={target}` |
| A-102-C026 | 71 | `p`  | `role="status"` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-102-T001 | 21 | `[saveState, saveAction, savePending] = useActionState(saveDepositWorkItem, initial)` |
| A-102-T002 | 22 | `[transitionState, transitionAction, transitionPending] = useActionState(transitionDepositWorkItem, initial)` |
| A-102-T003 | 23 | `[area, setArea] = useState(item?.area \|\| "")` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-102-B001 | 16 | `full` |
| A-102-B002 | 16 | `type === "number"` |
| A-102-B003 | 16 | `type === "number"` |
| A-102-B004 | 24 | `saveState.ok && saveState.id && !item` |
| A-102-B005 | 25 | `saveState.ok && item \|\| transitionState.ok` |
| A-102-B006 | 26 | `item` |
| A-102-B007 | 27 | `status?.success` |
| A-102-B008 | 29 | `item` |
| A-102-B009 | 29 | `item` |
| A-102-B010 | 34 | `area` |
| A-102-B011 | 56 | `savePending` |
| A-102-B012 | 56 | `item` |
| A-102-B013 | 57 | `saveState.ok` |
| A-102-B014 | 70 | `target === "Cancel"` |
| A-102-B015 | 72 | `event.action === "transition"` |
| A-102-B016 | 72 | `event.reason` |

## A-103 — `src/components/deposit-evidence-upload.tsx`

- Status: PLANNED. Consumers: S-023, S-024.
- Normalized UTF-8/LF source SHA-256: `57025d22fc8126cb38ae5fa935e4a3c993ce38250a08c098728dd00785605b43`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-103-F001 | 13 | `DepositEvidenceUpload` | `export function DepositEvidenceUpload(` |
| A-103-F002 | 20 | `upload` | `async function upload() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-103-C001 | 33 | `a` เปิดไฟล์ | `href={&#96;/api/guarantees/${id}/documents/${kind}&#96;} target="_blank" rel="noreferrer"` |
| A-103-C002 | 34 | `input`  | `type="file" accept="application/pdf,image/jpeg,image/png" aria-label={&#96;เลือก${labels[kind]}&#96;} onChange={(event) => setFile(event.target.files?.[0] \|\| null)}` |
| A-103-C003 | 35 | `button`  | `type="button" disabled={!file \|\| pending} onClick={upload}` |
| A-103-C004 | 36 | `small`  | `role="status"` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-103-T001 | 17 | `[file, setFile] = useState<File \| null>(null)` |
| A-103-T002 | 18 | `[pending, setPending] = useState(false)` |
| A-103-T003 | 19 | `[message, setMessage] = useState("")` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-103-E001 | 25 | `fetch(&#96;/api/guarantees/${id}/documents/${kind}&#96;, { method: "POST", body: form })` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-103-B001 | 21 | `!file` |
| A-103-B002 | 27 | `!response.ok` |
| A-103-B003 | 29 | `error instanceof Error` |
| A-103-B004 | 32 | `exists` |
| A-103-B005 | 35 | `pending` |

## A-104 — `src/components/deposit-tl-workspace.tsx`

- Status: PLANNED. Consumers: S-023.
- Normalized UTF-8/LF source SHA-256: `8305ee7ad30e7ceafcdaeb37bb44fc84db3a461894e5926489d5b380eefa7ea1`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-104-F001 | 12 | `DepositTlWorkspace` | `export function DepositTlWorkspace(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-104-C001 | 17 | `Link` ← กลับรายการ | `href="/guarantees"` |
| A-104-C002 | 19 | `DepositEvidenceUpload`  | `id={item.id} version={item.version} kind="pdf_tl_work" exists={Boolean(item.pdf_tl_work)} canUpload={["tl", "On Process"].includes(item.status \|\| "")}` |
| A-104-C003 | 20 | `DepositEvidenceUpload`  | `id={item.id} version={item.version} kind="pdf_tl_extra" exists={Boolean(item.pdf_tl_extra)} canUpload={["tl", "On Process"].includes(item.status \|\| "")}` |
| A-104-C004 | 21 | `form`  | `action={action} className="deposit-transition"` |
| A-104-C005 | 21 | `input`  | `type="hidden" name="id" value={item.id}` |
| A-104-C006 | 21 | `input`  | `type="hidden" name="version" value={item.version}` |
| A-104-C007 | 22 | `textarea`  | `name="reason" aria-label="เหตุผล" placeholder="ระบุเหตุผลเมื่อส่งกลับ"` |
| A-104-C008 | 23 | `button`  | `type="submit" name="to" value={status} disabled={pending} key={status}` |
| A-104-C009 | 24 | `p`  | `role="status"` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-104-T001 | 13 | `[state, action, pending] = useActionState(transitionDepositWorkItem, initial)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-104-B001 | 15 | `state.ok` |
| A-104-B002 | 16 | `item.status === "tl"` |
| A-104-B003 | 16 | `item.status === "On Process"` |

## A-105 — `src/components/deposit-workspace.tsx`

- Status: PLANNED. Consumers: S-025.
- Normalized UTF-8/LF source SHA-256: `ceac18e6a694dcc5001238453e0fb286ab94cd1300f70d1d051249552314f893`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-105-F001 | 20 | `money` | `(value: number) ` |
| A-105-F002 | 24 | `itemTotal` | `(item: DepositItem) ` |
| A-105-F003 | 25 | `normalized` | `(value: unknown) ` |
| A-105-F004 | 26 | `formatDate` | `function formatDate(value: unknown) ` |
| A-105-F005 | 31 | `DepositWorkspace` | `export function DepositWorkspace(` |
| A-105-F006 | 50 | `focusSearch` | `(event: KeyboardEvent) ` |
| A-105-F007 | 102 | `setWorkspaceView` | `function setWorkspaceView(next: WorkspaceView) ` |
| A-105-F008 | 103 | `openAnalytics` | `function openAnalytics() ` |
| A-105-F009 | 104 | `returnFromAnalytics` | `function returnFromAnalytics() ` |
| A-105-F010 | 105 | `copyCid` | `async function copyCid(cid: string) ` |
| A-105-F011 | 109 | `exportCsv` | `function exportCsv() ` |
| A-105-F012 | 111 | `cell` | `(value: unknown) ` |
| A-105-F013 | 212 | `depositStatusTone` | `function depositStatusTone(key: string) ` |
| A-105-F014 | 213 | `depositPriorityTone` | `function depositPriorityTone(priority: string) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-105-C001 | 128 | `PageHeader`  | `parent={{ label: "ภาพรวม", href: "/" }} eyebrow={installationTeamView ? "เงินประกันอาคาร / งานทีมติดตั้ง" : isAnalytics ? "เงินประกันอาคาร / รายงานวิเคราะห์" : "เงินประกันอาคาร / งานดำเนินการ"} title={isAnalytics ? "ภาพรวมเงินประกันอาคาร" : installationTeamView ? "งานที่ทีมติดตั้งต้องดำเนินการ" : "รายการขอคืนเงินประกันอาคาร"} description={isAnalytics ? "รายงานหลักสำหรับติดตามเงินประกัน การคืนเงิน และประเด็นที่ต้องดำเนินการ" : &#96;ติดตามเอกสาร ขั้นตอน และสถานะการขอคืนเงินประกัน · อัปเดตล่าสุด ${lastUpdated ? lastUpdated.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : "—"}&#96;}` |
| A-105-C002 | 129 | `button` ← กลับรายการเงินประกัน | `type="button" className="analytics-back-button" aria-label="กลับรายการเงินประกัน" onClick={returnFromAnalytics}` |
| A-105-C003 | 130 | `button` วิเคราะห์ข้อมูล | `type="button" className="executive-nav-button" onClick={openAnalytics}` |
| A-105-C004 | 131 | `select`  | `aria-label="เดือนสำหรับส่งออก" value={exportMonth} onChange={(event) => setExportMonth(event.target.value)}` |
| A-105-C005 | 132 | `select`  | `aria-label="ปีสำหรับส่งออก" value={exportYear} onChange={(event) => setExportYear(event.target.value)}` |
| A-105-C006 | 133 | `button` ⇩ Export CSV | `type="button" className="deposit-export" onClick={exportCsv} disabled={!filtered.length}` |
| A-105-C007 | 134 | `button` ＋ เพิ่มรายการใหม่ | `className="primary" type="button" disabled title={createUnavailableReason}` |
| A-105-C008 | 134 | `Link` ＋ เพิ่มรายการใหม่ | `className="primary" href="/guarantees/new"` |
| A-105-C009 | 137 | `Link` กลับข้อมูลจริง | `href={installationTeamView ? "/guarantees?view=installation-team" : "/guarantees"}` |
| A-105-C010 | 138 | `Link` ดูข้อมูลตัวอย่าง | `href={&#96;/guarantees?preview=1${installationTeamView ? "&view=installation-team" : ""}&#96;}` |
| A-105-C011 | 140 | `div`  | `className="deposit-toast" role="status"` |
| A-105-C012 | 142 | `button`  | `key={key} type="button" className={view === key ? "active" : ""} onClick={() => setWorkspaceView(key)}` |
| A-105-C013 | 153 | `input`  | `ref={searchRef} type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="ค้นหาอาคาร, ลูกค้า, เจ้าของงาน, CID หรือ PR... /"` |
| A-105-C014 | 154 | `select`  | `aria-label="กรองสถานะ" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}` |
| A-105-C015 | 155 | `select`  | `aria-label="กรองเจ้าของงาน" value={ownerFilter} onChange={(event) => { setOwnerFilter(event.target.value); setPage(1); }}` |
| A-105-C016 | 156 | `select`  | `aria-label="กรองพื้นที่" value={areaFilter} onChange={(event) => { setAreaFilter(event.target.value); setPage(1); }}` |
| A-105-C017 | 157 | `button` ล้างตัวกรอง | `type="button" className="legacy-clear" onClick={() => { setQuery(""); setStatusFilter(""); setOwnerFilter(""); setAreaFilter(""); setPage(1); }}` |
| A-105-C018 | 159 | `TableRegion`  | `label="รายการเงินประกัน เลื่อนแนวนอนได้" className="deposit-table-wrap"` |
| A-105-C019 | 159 | `table`  | `className="deposit-table legacy-deposit-table"` |
| A-105-C020 | 159 | `button` NO. | `type="button" onClick={() => { setSortNo(sortNo === "asc" ? "desc" : "asc"); setPage(1); }}` |
| A-105-C021 | 160 | `tr`  | `key={item.id \|\| item.id_firestore} tabIndex={0} onClick={() => !preview && item.id && router.push(&#96;/guarantees/${item.id}&#96;)} onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (!preview && item.id && (event.key === "Enter" \|\| event.key === " ")) { event.preventDefault(); router.push(&#96;/guarantees/${item.id}&#96;); } }}` |
| A-105-C022 | 161 | `button`  | `type="button" className="copy-cid" title="คัดลอก CID" onClick={(event) => { event.stopPropagation(); void copyCid(item.cid \|\| ""); }}` |
| A-105-C023 | 161 | `StatusBadge`  | `label={workflowLabels[getWorkflowStatusKey(item)] \|\| item.status \|\| ""} tone={depositStatusTone(getWorkflowStatusKey(item))}` |
| A-105-C024 | 162 | `button` ดูรายละเอียด | `type="button" className="deposit-link"` |
| A-105-C025 | 162 | `Link` ดู / อัปเดต → | `href={&#96;/guarantees/${item.id}&#96;} onClick={(event) => event.stopPropagation()}` |
| A-105-C026 | 164 | `button` ← ก่อนหน้า | `type="button" disabled={safePage <= 1} onClick={() => setPage((value) => value - 1)}` |
| A-105-C027 | 164 | `button` ถัดไป → | `type="button" disabled={safePage >= pageCount} onClick={() => setPage((value) => value + 1)}` |
| A-105-C028 | 169 | `button` ดูรายการเงินประกันทั้งหมด | `type="button" onClick={() => setWorkspaceView("list")}` |
| A-105-C029 | 178 | `Link` เปิดรายการ → | `href={&#96;/guarantees/${item.id}&#96;}` |
| A-105-C030 | 184 | `Link` งานทีมติดตั้ง | `href="/guarantees?view=installation-team"` |
| A-105-C031 | 196 | `Link`  | `key={entry.item.id} href={&#96;/guarantees/${entry.item.id}&#96;}` |
| A-105-C032 | 197 | `StatusBadge`  | `label={entry.priority === "high" ? "เร่งด่วน" : entry.priority === "medium" ? "ติดตาม" : "ทั่วไป"} tone={depositPriorityTone(entry.priority)}` |
| A-105-C033 | 201 | `Link`  | `key={notice.id} href={&#96;/guarantees/${notice.taskId}&#96;}` |
| A-105-C034 | 202 | `Link`  | `key={item.id} href={&#96;/guarantees/${item.id}&#96;}` |
| A-105-C035 | 203 | `Link`  | `key={&#96;activity-${item.id}&#96;} href={&#96;/guarantees/${item.id}&#96;}` |
| A-105-C036 | 207 | `StatusBadge`  | `label={entry.priority === "high" ? "เร่งด่วน" : entry.priority === "medium" ? "ติดตาม" : "ทั่วไป"} tone={depositPriorityTone(entry.priority)}` |
| A-105-C037 | 207 | `Link` เปิด → | `href={&#96;/guarantees/${entry.item.id}&#96;}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-105-T001 | 36 | `[query, setQuery] = useState("")` |
| A-105-T002 | 37 | `[statusFilter, setStatusFilter] = useState("")` |
| A-105-T003 | 38 | `[ownerFilter, setOwnerFilter] = useState("")` |
| A-105-T004 | 39 | `[areaFilter, setAreaFilter] = useState("")` |
| A-105-T005 | 40 | `[view, setView] = useState<WorkspaceView>(installationTeamView ? "queue" : "dashboard")` |
| A-105-T006 | 41 | `[returnView, setReturnView] = useState<WorkspaceView>(installationTeamView ? "queue" : "list")` |
| A-105-T007 | 42 | `[page, setPage] = useState(1)` |
| A-105-T008 | 43 | `[sortNo, setSortNo] = useState<"default" \| "asc" \| "desc">("default")` |
| A-105-T009 | 44 | `[exportMonth, setExportMonth] = useState("")` |
| A-105-T010 | 45 | `[exportYear, setExportYear] = useState("")` |
| A-105-T011 | 46 | `[copyMessage, setCopyMessage] = useState("")` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-105-E001 | 113 | `exportRows.map((item) => [item.cid, item.no, workflowLabels[getWorkflowStatusKey(item)], item.place, item.customer, item.owner, item.pr, item.dateReq, itemTotal(item), item.deposit, item.demolish, item.fee, item.other, item.area])` |
| A-105-E002 | 131 | `setExportMonth(event.target.value)` |
| A-105-E003 | 132 | `setExportYear(event.target.value)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-105-B001 | 28 | `date` |
| A-105-B002 | 40 | `installationTeamView` |
| A-105-B003 | 41 | `installationTeamView` |
| A-105-B004 | 51 | `event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((event.target as HTMLElement).tagName)` |
| A-105-B005 | 61 | `view === "on_service"` |
| A-105-B006 | 62 | `view === "done"` |
| A-105-B007 | 67 | `statusFilter && getWorkflowStatusKey(item) !== statusFilter` |
| A-105-B008 | 68 | `ownerFilter && item.owner !== ownerFilter` |
| A-105-B009 | 69 | `areaFilter && item.area !== areaFilter` |
| A-105-B010 | 73 | `sortNo === "default"` |
| A-105-B011 | 74 | `sortNo === "asc"` |
| A-105-B012 | 99 | `preview` |
| A-105-B013 | 99 | `state === "not_configured"` |
| A-105-B014 | 99 | `state === "unavailable"` |
| A-105-B015 | 99 | `canPreview` |
| A-105-B016 | 99 | `!canCreate` |
| A-105-B017 | 103 | `view === "analytics"` |
| A-105-B018 | 104 | `returnView === "analytics"` |
| A-105-B019 | 106 | `!cid` |
| A-105-B020 | 111 | `/^[=+@\-\t\r]/.test(raw)` |
| A-105-B021 | 116 | `exportMonth === ""` |
| A-105-B022 | 120 | `installationTeamView` |
| A-105-B023 | 128 | `installationTeamView` |
| A-105-B024 | 128 | `isAnalytics` |
| A-105-B025 | 128 | `isAnalytics` |
| A-105-B026 | 128 | `installationTeamView` |
| A-105-B027 | 128 | `isAnalytics` |
| A-105-B028 | 128 | `lastUpdated` |
| A-105-B029 | 129 | `isAnalytics` |
| A-105-B030 | 134 | `createUnavailableReason` |
| A-105-B031 | 137 | `installationTeamView` |
| A-105-B032 | 138 | `state === "not_configured"` |
| A-105-B033 | 138 | `installationTeamView` |
| A-105-B034 | 142 | `view === key` |
| A-105-B035 | 159 | `sortNo === "asc"` |
| A-105-B036 | 159 | `sortNo === "desc"` |
| A-105-B037 | 159 | `sortNo === "asc"` |
| A-105-B038 | 159 | `sortNo === "asc"` |
| A-105-B039 | 159 | `sortNo === "desc"` |
| A-105-B040 | 160 | `event.target !== event.currentTarget` |
| A-105-B041 | 160 | `!preview && item.id && (event.key === "Enter" \|\| event.key === " ")` |
| A-105-B042 | 162 | `parseMoney(item.deposit)` |
| A-105-B043 | 162 | `preview` |
| A-105-B044 | 176 | `age === null` |
| A-105-B045 | 177 | `status === "off_service_pending"` |
| A-105-B046 | 197 | `entry.priority === "high"` |
| A-105-B047 | 197 | `entry.priority === "medium"` |
| A-105-B048 | 207 | `entry.priority === "high"` |
| A-105-B049 | 207 | `entry.priority === "medium"` |
| A-105-B050 | 212 | `key === "done"` |
| A-105-B051 | 212 | `key === "cancel"` |
| A-105-B052 | 212 | `key === "refund_process" \|\| key === "on_service" \|\| key === "off_service_pending"` |
| A-105-B053 | 213 | `priority === "high"` |
| A-105-B054 | 213 | `priority === "medium"` |

## A-106 — `src/components/guarantee-executive-dashboard.tsx`

- Status: PLANNED. Consumers: S-025.
- Normalized UTF-8/LF source SHA-256: `1e1adb7a982a079d137afc4a55e752cfdbeb01b2810a11b5eba06ef6298805fa`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-106-F001 | 9 | `amount` | `(value: number) ` |
| A-106-F002 | 10 | `money` | `(value: number) ` |
| A-106-F003 | 12 | `GuaranteeExecutiveDashboard` | `export function GuaranteeExecutiveDashboard(` |
| A-106-F004 | 30 | `downloadCsv` | `() ` |
| A-106-F005 | 65 | `RankedBars` | `function RankedBars(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-106-C001 | 37 | `button` พิมพ์ / บันทึก PDF | `type="button" onClick={() => window.print()} disabled={!ready}` |
| A-106-C002 | 37 | `button` ส่งออก CSV รายงานปัจจุบัน | `type="button" onClick={downloadCsv} disabled={!ready}` |
| A-106-C003 | 38 | `select`  | `value={area} onChange={(event) => setArea(event.target.value)}` |
| A-106-C004 | 38 | `select`  | `value={owner} onChange={(event) => setOwner(event.target.value)}` |
| A-106-C005 | 38 | `button` ล้างตัวกรอง | `type="button" onClick={() => { setArea(""); setOwner(""); }}` |
| A-106-C006 | 38 | `p` รายการในขอบเขตรายงาน | `aria-live="polite"` |
| A-106-C007 | 39 | `div`  | `className="gr-scope-banner" role="status"` |
| A-106-C008 | 40 | `p`  | `className="gr-scope-note" role="status"` |
| A-106-C009 | 43 | `Link` ดูรายการที่รวมยอด | `href="#gr-contributors"` |
| A-106-C010 | 50 | `table`  | `` |
| A-106-C011 | 54 | `button`  | `type="button" key={&#96;${month.year}-${month.month}&#96;} aria-pressed={monthIndex === index} aria-label={&#96;${month.label} เงินประกัน ${money(month.deposit)} ค่าธรรมเนียม ${money(month.fee)}&#96;} onClick={() => setMonthIndex(index)}` |
| A-106-C012 | 54 | `div`  | `className="gr-month-detail" aria-live="polite"` |
| A-106-C013 | 54 | `details`  | `className="gr-month-data"` |
| A-106-C014 | 54 | `summary` ดูตัวเลขรายเดือนทั้งหมด | `` |
| A-106-C015 | 54 | `table`  | `` |
| A-106-C016 | 58 | `Link` เปิดรายละเอียด → | `href={&#96;/guarantees/${entry.item.id}&#96;}` |
| A-106-C017 | 59 | `table`  | `` |
| A-106-C018 | 59 | `Link` รายละเอียด → | `href={&#96;/guarantees/${item.id}&#96;} aria-label={&#96;เปิดรายละเอียด ${item.place \|\| "รายการเงินประกัน"}&#96;}` |
| A-106-C019 | 67 | `Link` # | `key={id} href={&#96;/guarantees/${id}&#96;}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-106-T001 | 15 | `[area, setArea] = useState("")` |
| A-106-T002 | 16 | `[owner, setOwner] = useState("")` |
| A-106-T003 | 17 | `[monthIndex, setMonthIndex] = useState(11)` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-106-E001 | 37 | `window.print()` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-106-B001 | 27 | `item.updatedAt` |
| A-106-B002 | 28 | `latestRecordUpdate` |
| A-106-B003 | 39 | `preview` |
| A-106-B004 | 40 | `!ready` |
| A-106-B005 | 40 | `preview` |
| A-106-B006 | 41 | `ready && !scoped.length` |
| A-106-B007 | 45 | `report.refundPct === null` |
| A-106-B008 | 46 | `dueDatesMissing` |
| A-106-B009 | 46 | `dueDatesMissing` |
| A-106-B010 | 46 | `preview` |
| A-106-B011 | 48 | `dueDatesMissing` |
| A-106-B012 | 48 | `report.operational.overdueCount` |
| A-106-B013 | 51 | `due.openCount` |
| A-106-B014 | 51 | `due.openCount` |
| A-106-B015 | 58 | `report.actionItems.length` |
| A-106-B016 | 59 | `!report.topOutstanding.length` |
| A-106-B017 | 67 | `rows.length` |
| A-106-B018 | 67 | `row.contributorIds?.length` |

## A-107 — `src/components/login-form.tsx`

- Status: PLANNED. Consumers: S-037.
- Normalized UTF-8/LF source SHA-256: `647aa8ebe37ab0be56aeb8f391c3504ae0336f4b3dbc82275126f16c01130ae2`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-107-F001 | 8 | `LoginForm` | `export function LoginForm(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-107-C001 | 14 | `form`  | `className="auth-form" action={action} noValidate onSubmit={event => { if (pending) { event.preventDefault(); return; } const data = new FormData(event.currentTarget); const email = String(data.get("email") \|\| "").trim(); const password = String(data.get("password") \|\| ""); const nextErrors = { email: !email ? copy.auth.emailRequired : !/^\S+@\S+\.\S+$/.test(email) ? copy.auth.emailInvalid : undefined, password: !password ? copy.auth.passwordRequired : undefined }; setErrors(nextErrors); if (nextErrors.email \|\| nextErrors.password) { event.preventDefault(); (nextErrors.email ? emailRef : passwordRef).current?.focus(); } }} aria-busy={pending}` |
| A-107-C002 | 23 | `input`  | `type="hidden" name="next" value={next}` |
| A-107-C003 | 24 | `div`  | `className="auth-error" role="alert"` |
| A-107-C004 | 25 | `input`  | `id="login-email" ref={emailRef} name="email" type="email" autoComplete="email" placeholder={copy.auth.emailPlaceholder} defaultValue={state.email \|\| ""} aria-invalid={Boolean(errors.email)} aria-describedby="login-email-error" required autoFocus` |
| A-107-C005 | 25 | `span`  | `id="login-email-error" className="auth-field-hint" aria-live="polite"` |
| A-107-C006 | 27 | `button`  | `className="button auth-submit-button" disabled={pending} type="submit"` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-107-T001 | 9 | `[state, action, pending] = useActionState(loginAction, {})` |
| A-107-T002 | 12 | `[errors, setErrors] = useState<{ email?: string; password?: string }>({})` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-107-B001 | 13 | `state.error` |
| A-107-B002 | 15 | `pending` |
| A-107-B003 | 19 | `!email` |
| A-107-B004 | 19 | `!/^\S+@\S+\.\S+$/.test(email)` |
| A-107-B005 | 19 | `!password` |
| A-107-B006 | 21 | `nextErrors.email \|\| nextErrors.password` |
| A-107-B007 | 21 | `nextErrors.email` |
| A-107-B008 | 28 | `pending` |

## A-108 — `src/components/module-nav.tsx`

- Status: PLANNED. Consumers: S-001, S-002, S-003, S-004, S-005, S-006, S-007, S-008, S-009, S-010, S-011, S-012, S-013, S-014, S-015, S-016, S-017, S-018, S-019, S-020, S-021, S-022, S-023, S-024, S-025, S-026, S-027, S-028, S-029, S-030, S-031, S-032, S-033, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `30d873ac14aa907983f923660eaf0ae482a23147f8771a09226df5dfdada3e80`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-108-F001 | 17 | `isCollapsibleModule` | `function isCollapsibleModule(id: string): id is CollapsibleModuleId ` |
| A-108-F002 | 21 | `readSectionSnapshot` | `function readSectionSnapshot() ` |
| A-108-F003 | 26 | `subscribeToSectionChanges` | `function subscribeToSectionChanges(onStoreChange: () => void) ` |
| A-108-F004 | 27 | `handleChange` | `() ` |
| A-108-F005 | 36 | `parseSectionSnapshot` | `function parseSectionSnapshot(snapshot: string): SectionSnapshot \| undefined ` |
| A-108-F006 | 48 | `sectionForPathname` | `function sectionForPathname(pathname: string): CollapsibleModuleId \| null ` |
| A-108-F007 | 58 | `getNavItems` | `function getNavItems(moduleId: string): NavChildItem[] \| undefined ` |
| A-108-F008 | 68 | `computeActiveChildHref` | `function computeActiveChildHref( navigationItems: NavChildItem[] \| undefined, pathname: string, params: URLSearchParams ): string \| undefined ` |
| A-108-F009 | 110 | `ModuleNav` | `export function ModuleNav(` |
| A-108-F010 | 125 | `toggleSection` | `function toggleSection(id: CollapsibleModuleId) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-108-C001 | 143 | `button`  | `className={&#96;sidebar-link sidebar-module-trigger ${active ? "active" : ""}&#96;} type="button" data-module-id={item.id} aria-expanded={expanded} aria-controls={sectionId} onClick={() => toggleSection(item.id as CollapsibleModuleId)}` |
| A-108-C002 | 152 | `Link`  | `className={&#96;sidebar-link ${active ? "active" : ""}&#96;} href={destination} aria-current={parentCurrent ? "page" : undefined} aria-label={collapsed ? item.name : undefined} title={collapsed ? item.name : undefined} onClick={onNavigate}` |
| A-108-C003 | 169 | `Link`  | `className={&#96;sidebar-child-link ${childActive ? "active" : ""}&#96;} href={child.href} key={child.href} aria-current={childActive ? "page" : undefined} aria-label={collapsed ? child.label : undefined} title={collapsed ? child.label : undefined} onClick={onNavigate}` |
| A-108-C004 | 173 | `Link`  | `className={&#96;sidebar-child-link ${childActive ? "active" : ""}&#96;} href={child.href} key={child.href} aria-current={childActive ? "page" : undefined} aria-label={collapsed ? child.label : undefined} title={collapsed ? child.label : undefined} onClick={onNavigate}` |
| A-108-C005 | 179 | `Link`  | `className={&#96;sidebar-link ${(pathname === "/admin" \|\| pathname.startsWith("/admin/")) ? "active" : ""}&#96;} href="/admin" aria-current={(pathname === "/admin" \|\| pathname.startsWith("/admin/")) ? "page" : undefined} aria-label={collapsed ? "ผู้ดูแลระบบ" : undefined} title={collapsed ? "ผู้ดูแลระบบ" : undefined} onClick={onNavigate}` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-108-B001 | 37 | `!snapshot` |
| A-108-B002 | 41 | `open !== null && (typeof open !== "string" \|\| !isCollapsibleModule(open))` |
| A-108-B003 | 42 | `typeof saved.pathname === "string"` |
| A-108-B004 | 49 | `pathname === "/work" \|\| pathname.startsWith("/work/")` |
| A-108-B005 | 50 | `pathname === "/guarantees" \|\| pathname.startsWith("/guarantees/")` |
| A-108-B006 | 51 | `pathname === "/duct-rental" \|\| pathname.startsWith("/duct-rental/")` |
| A-108-B007 | 52 | `pathname === "/buildings" \|\| pathname.startsWith("/buildings/")` |
| A-108-B008 | 53 | `pathname === "/car-booking" \|\| pathname.startsWith("/car-booking/")` |
| A-108-B009 | 73 | `!navigationItems` |
| A-108-B010 | 82 | `match === "query"` |
| A-108-B011 | 84 | `itemUrl.pathname === pathname` |
| A-108-B012 | 86 | `allParamsMatch` |
| A-108-B013 | 88 | `match === "exact"` |
| A-108-B014 | 89 | `pathname === itemPathname` |
| A-108-B015 | 90 | `match === "prefix"` |
| A-108-B016 | 91 | `pathname === itemPathname \|\| pathname.startsWith(&#96;${itemPathname}/&#96;)` |
| A-108-B017 | 94 | `matched` |
| A-108-B018 | 95 | `match === "query"` |
| A-108-B019 | 95 | `match === "prefix"` |
| A-108-B020 | 100 | `matches.length === 0` |
| A-108-B021 | 103 | `b.score !== a.score` |
| A-108-B022 | 116 | `savedSection?.pathname === pathname` |
| A-108-B023 | 126 | `expandedSection === id` |
| A-108-B024 | 134 | `item.href === "/"` |
| A-108-B025 | 136 | `item.id === "work"` |
| A-108-B026 | 138 | `isCollapsibleModule(item.id)` |
| A-108-B027 | 139 | `item.id === "work"` |
| A-108-B028 | 141 | `hasChildren && isCollapsibleModule(item.id)` |
| A-108-B029 | 142 | `params.get("preview") === "1"` |
| A-108-B030 | 143 | `sectionId && !collapsed` |
| A-108-B031 | 144 | `active` |
| A-108-B032 | 153 | `active` |
| A-108-B033 | 155 | `parentCurrent` |
| A-108-B034 | 156 | `collapsed` |
| A-108-B035 | 157 | `collapsed` |
| A-108-B036 | 165 | `expanded` |
| A-108-B037 | 169 | `childActive` |
| A-108-B038 | 169 | `childActive` |
| A-108-B039 | 169 | `collapsed` |
| A-108-B040 | 169 | `collapsed` |
| A-108-B041 | 173 | `childActive` |
| A-108-B042 | 173 | `childActive` |
| A-108-B043 | 173 | `collapsed` |
| A-108-B044 | 173 | `collapsed` |
| A-108-B045 | 179 | `(pathname === "/admin" \|\| pathname.startsWith("/admin/"))` |
| A-108-B046 | 179 | `(pathname === "/admin" \|\| pathname.startsWith("/admin/"))` |
| A-108-B047 | 179 | `collapsed` |
| A-108-B048 | 179 | `collapsed` |

## A-109 — `src/components/native-module-foundation.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `c155be88be32f86deb241f599d5aa46a405ad1c2bfe113059418fdc2f2e46480`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-109-F001 | 17 | `NativeModuleFoundation` | `export async function NativeModuleFoundation(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-109-C001 | 19 | `AccessDenied`  | `moduleName={getModule(moduleId)!.name}` |
| A-109-C002 | 25 | `PageHeader`  | `title={copy.title} description={copy.description} parent={{ label: "ภาพรวม", href: "/" }} actions={<><RefreshButton/><span className="updated-at">{ready ? &#96;ข้อมูล ณ ${formatWorkspaceDate(snapshot.generatedAt, true)}&#96; : "อยู่ระหว่างเตรียมข้อมูล"}</span></>}` |
| A-109-C003 | 25 | `RefreshButton`  | `` |
| A-109-C004 | 26 | `Link`  | `href="/"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-109-B001 | 19 | `!data.accessByModule[moduleId].allowed` |
| A-109-B002 | 25 | `ready` |
| A-109-B003 | 26 | `ready` |

## A-110 — `src/components/notification-center.tsx`

- Status: PLANNED. Consumers: S-001, S-002, S-003, S-004, S-005, S-006, S-007, S-008, S-009, S-010, S-011, S-012, S-013, S-014, S-015, S-016, S-017, S-018, S-019, S-020, S-021, S-022, S-023, S-024, S-025, S-026, S-027, S-028, S-029, S-030, S-031, S-032, S-033, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `970196085f038a33ea8f210fbfa2309f3bd4322accb5ab46bda4b806603c25c3`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-110-F001 | 10 | `NotificationCenter` | `export function NotificationCenter(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-110-C001 | 16 | `button`  | `ref={trigger} className="round-btn" type="button" aria-haspopup="dialog" aria-label={&#96;การแจ้งเตือน ยังไม่อ่าน ${inbox.unread} รายการ&#96;} onClick={() => dialog.current?.showModal()}` |
| A-110-C002 | 20 | `dialog`  | `ref={dialog} className="notification-dialog" aria-labelledby="notification-title" onClose={() => trigger.current?.focus()} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}` |
| A-110-C003 | 21 | `button` ปิด | `type="button" className="secondary-action" onClick={() => dialog.current?.close()}` |
| A-110-C004 | 22 | `p`  | `role="status"` |
| A-110-C005 | 23 | `p` โหลดการแจ้งเตือนไม่สำเร็จ กรุณารีเฟรชหน้าเพื่อลองอีกครั้ง | `role="alert"` |
| A-110-C006 | 24 | `form`  | `action={action}` |
| A-110-C007 | 24 | `input`  | `type="hidden" name="id" value="all"` |
| A-110-C008 | 24 | `button` อ่านทั้งหมด | `className="secondary-action" disabled={pending}` |
| A-110-C009 | 27 | `StatusBadge`  | `label={item.readAt ? "อ่านแล้ว" : "ยังไม่อ่าน"} tone={item.readAt ? "neutral" : "info"}` |
| A-110-C010 | 28 | `StatusBadge`  | `label="ต้องให้ความสนใจ" tone="warning"` |
| A-110-C011 | 29 | `Link`  | `href={item.href} onClick={() => dialog.current?.close()}` |
| A-110-C012 | 31 | `form`  | `action={action}` |
| A-110-C013 | 31 | `input`  | `type="hidden" name="id" value={item.id}` |
| A-110-C014 | 31 | `button` ทำเครื่องหมายว่าอ่านแล้ว | `className="text-btn" disabled={pending}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-110-T001 | 13 | `[state, action, pending] = useActionState(markNotificationsRead, { message: "" })` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-110-E001 | 16 | `dialog.current?.showModal()` |
| A-110-E002 | 20 | `dialog.current.close()` |
| A-110-E003 | 21 | `dialog.current?.close()` |
| A-110-E004 | 29 | `dialog.current?.close()` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-110-B001 | 14 | `inbox.state === "denied"` |
| A-110-B002 | 18 | `inbox.unread > 99` |
| A-110-B003 | 20 | `event.target === dialog.current` |
| A-110-B004 | 23 | `inbox.state === "unavailable"` |
| A-110-B005 | 27 | `item.readAt` |
| A-110-B006 | 27 | `item.readAt` |
| A-110-B007 | 29 | `item.href` |

## A-111 — `src/components/ui/animated-number.tsx`

- Status: PLANNED. Consumers: S-025, S-026.
- Normalized UTF-8/LF source SHA-256: `d4a18c04fbec11b0c5fb1aca402d5f51739635fcfc92cc3967e28c2bcb6d74bc`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-111-F001 | 5 | `defaultFormat` | `(value: number) ` |
| A-111-F002 | 7 | `AnimatedNumber` | `export function AnimatedNumber(` |

## A-112 — `src/components/ui/button.tsx`

- Status: PLANNED. Consumers: S-002, S-009, S-010, S-011, S-012, S-013, S-014, S-015, S-016, S-017, S-018, S-019, S-020, S-021, S-022, S-027, S-028, S-029, S-031, S-032, S-033, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `6c078a0190b818c941e4069b109495e86936f98148533cdaefd172d962fadb57`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-112-F001 | 6 | `classes` | `function classes(variant: ButtonVariant, className?: string) ` |
| A-112-F002 | 10 | `Button` | `export function Button(` |
| A-112-F003 | 14 | `ButtonLink` | `export function ButtonLink(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-112-C001 | 11 | `button`  | `{...props} type={type} className={classes(variant, className)}` |
| A-112-C002 | 15 | `Link`  | `{...props} className={classes(variant, className)}` |

## A-113 — `src/components/ui/empty-state.tsx`

- Status: PLANNED. Consumers: S-010, S-012, S-013, S-014, S-016, S-017, S-018, S-019, S-020, S-022, S-026, S-027, S-028, S-029, S-030, S-031, S-032, S-033, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `9a508a8315c0bde6d27d2fe48421a9a6dc2e71996e95b32c6952e096d71da0cf`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-113-F001 | 1 | `EmptyState` | `export function EmptyState(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-113-C001 | 2 | `section`  | `className={["ui-empty", className].filter(Boolean).join(" ")} role={error ? "alert" : "status"}` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-113-B001 | 2 | `error` |

## A-114 — `src/components/ui/error-state.tsx`

- Status: PLANNED. Consumers: S-010, S-016, S-020.
- Normalized UTF-8/LF source SHA-256: `be8ec2f288a35c80caca1bbc4205ce9659265c5a062757a63f94b26e3f8083ac`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-114-F001 | 4 | `ErrorState` | `export function ErrorState(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-114-C001 | 6 | `section`  | `className="queue-empty error-state" role="alert"` |
| A-114-C002 | 6 | `button`  | `type="button" className="primary" onClick={reset}` |
| A-114-C003 | 6 | `Link`  | `className="secondary-action" href="/"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-114-B001 | 5 | `embedded` |

## A-115 — `src/components/ui/form.tsx`

- Status: PLANNED. Consumers: S-010, S-012, S-013, S-014, S-016, S-017, S-018, S-019, S-020, S-022, S-027, S-028, S-029, S-032, S-033, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `fcbc058c4083a7ea20c5cb515894417fa5c19695edf50d8018eb7d8802adcd64`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-115-F001 | 3 | `FilterBar` | `export function FilterBar(` |
| A-115-F002 | 7 | `FormField` | `export function FormField(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-115-C001 | 4 | `form`  | `{...props} className={["ui-filter", className].filter(Boolean).join(" ")}` |

## A-116 — `src/components/ui/metric-grid.tsx`

- Status: PLANNED. Consumers: S-017, S-022, S-027, S-028, S-029, S-030, S-031, S-032, S-033, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `f4c196c80da510c15a0f2fd4cd847ceef63130c93d7a0ded3bde49b8697fc542`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-116-F001 | 17 | `MetricGrid` | `export function MetricGrid(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-116-C001 | 24 | `button`  | `key={metric.label} type="button" aria-pressed={metric.pressed === true} onClick={metric.onClick} className={metricClass}` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-116-B001 | 23 | `interactive` |
| A-116-B002 | 26 | `typeof metric.value === "number"` |
| A-116-B003 | 31 | `typeof metric.value === "number"` |

## A-117 — `src/components/ui/page-header.tsx`

- Status: PLANNED. Consumers: S-001, S-002, S-003, S-004, S-005, S-006, S-007, S-008, S-009, S-010, S-011, S-012, S-013, S-014, S-015, S-016, S-017, S-018, S-019, S-020, S-021, S-022, S-025, S-026, S-027, S-028, S-029, S-030, S-031, S-032, S-033, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `b0287a32361b9616127232b2ef9edd39f3786d17e14403c5697bd5dd85a20c8a`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-117-F001 | 4 | `PageHeader` | `export function PageHeader(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-117-C001 | 13 | `Link`  | `className="underline-offset-4 hover:text-[var(--color-brand)] hover:underline" href={parent.href}` |

## A-118 — `src/components/ui/page-skeleton.tsx`

- Status: PLANNED. Consumers: S-009, S-010, S-011, S-012, S-013, S-014, S-016, S-017, S-018, S-019, S-020, S-022.
- Normalized UTF-8/LF source SHA-256: `7985a593b881d7ede2a343222d5b10f31cf26a5a1cdd60a4a0b76df1bd4f80ed`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-118-F001 | 2 | `PageSkeleton` | `export function PageSkeleton(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-118-C001 | 3 | `div`  | `className={&#96;loading-workspace skeleton-${shape} ${className}&#96;.trim()} role="status" aria-live="polite"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-118-B001 | 3 | `shape === "dashboard"` |
| A-118-B002 | 3 | `shape === "table"` |

## A-119 — `src/components/ui/panel.tsx`

- Status: PLANNED. Consumers: S-010, S-016, S-020.
- Normalized UTF-8/LF source SHA-256: `22fcabb702c68f531c803301c0fb6d6c810578ff8269e3f19685cc68573331ec`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-119-F001 | 3 | `Panel` | `export function Panel(` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-119-B001 | 5 | `title` |

## A-120 — `src/components/ui/status-badge.tsx`

- Status: PLANNED. Consumers: S-001, S-002, S-003, S-004, S-005, S-006, S-007, S-008, S-009, S-010, S-011, S-012, S-013, S-014, S-015, S-016, S-017, S-018, S-019, S-020, S-021, S-022, S-023, S-024, S-025, S-026, S-027, S-028, S-029, S-030, S-031, S-032, S-033, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `d432d395b1618bbc1d6728cbe488644349bc284dd8a229c89c7b7ef923ca8e3a`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-120-F001 | 7 | `StatusBadge` | `export function StatusBadge(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-120-C001 | 8 | `span`  | `className={&#96;ui-status ui-status-${tone}&#96;} title={description}` |

## A-121 — `src/components/ui/table-region.tsx`

- Status: PLANNED. Consumers: S-001, S-008, S-010, S-012, S-013, S-014, S-016, S-017, S-018, S-019, S-020, S-022, S-025, S-026.
- Normalized UTF-8/LF source SHA-256: `cf899a36324c1f09eda0298e887ac11ae684441ab1c094c2eb2135bbc1cf8d0b`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-121-F001 | 1 | `TableRegion` | `export function TableRegion(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-121-C001 | 2 | `div`  | `className={["ui-table-scroll", className].filter(Boolean).join(" ")} role="region" aria-label={label} tabIndex={0}` |

## A-122 — `src/components/ui/truncated-text.tsx`

- Status: PLANNED. Consumers: S-001, S-002, S-003, S-004, S-005, S-006, S-007, S-008, S-009, S-010, S-011, S-012, S-013, S-014, S-015, S-016, S-017, S-018, S-019, S-020, S-021, S-022, S-023, S-024, S-025, S-026, S-027, S-028, S-029, S-030, S-031, S-032, S-033, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `8db285c6f3aed4aa8aa2c0ca107e0c47d30e7823ec92575efe8636c123f2ed9d`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-122-F001 | 7 | `getTextClampClass` | `export function getTextClampClass(lines: TruncatedTextLines) ` |
| A-122-F002 | 16 | `TruncatedText` | `export function TruncatedText(` |
| A-122-F003 | 26 | `measure` | `() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-122-C001 | 35 | `span`  | `className="truncated-text-wrap" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}` |
| A-122-C002 | 36 | `span`  | `{...props} ref={textRef} className={classes} tabIndex={isTruncated ? 0 : -1} title={isTruncated ? text : undefined} aria-describedby={isTruncated ? tooltipId : undefined} onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); setShowTooltip(false); } props.onKeyDown?.(event); }} onFocus={(event) => { setShowTooltip(true); props.onFocus?.(event); }} onBlur={(event) => { setShowTooltip(false); props.onBlur?.(event); }}` |
| A-122-C003 | 47 | `span`  | `id={tooltipId} className="truncated-text-tooltip" role="tooltip" hidden={!showTooltip}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-122-T001 | 19 | `[isTruncated, setIsTruncated] = useState(false)` |
| A-122-T002 | 20 | `[showTooltip, setShowTooltip] = useState(false)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-122-B001 | 24 | `!element` |
| A-122-B002 | 28 | `typeof ResizeObserver === "undefined"` |
| A-122-B003 | 40 | `isTruncated` |
| A-122-B004 | 41 | `isTruncated` |
| A-122-B005 | 42 | `isTruncated` |
| A-122-B006 | 43 | `event.key === "Escape"` |

## A-123 — `src/components/work-create-form.tsx`

- Status: PLANNED. Consumers: S-030, S-031.
- Normalized UTF-8/LF source SHA-256: `6588d70462a1e6a442a4e8c281be2400f54238460034f864714ffccdcb04515c`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-123-F001 | 8 | `WorkCreateForm` | `export function WorkCreateForm(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-123-C001 | 15 | `form`  | `ref={formRef} className="work-panel work-assignment-form" action={action} aria-busy={pending}` |
| A-123-C002 | 15 | `input`  | `type="hidden" name="idempotencyKey" value={model.creationKey}` |
| A-123-C003 | 15 | `input`  | `type="hidden" name="assigneeId" value={userId}` |
| A-123-C004 | 15 | `select`  | `name="teamId" value={teamId} onChange={e=>setTeamId(e.target.value)} required` |
| A-123-C005 | 15 | `textarea`  | `name="jobs" required maxLength={4000} rows={6}` |
| A-123-C006 | 15 | `textarea`  | `name="notes" maxLength={4000}` |
| A-123-C007 | 15 | `button` ดู deadline ล่วงหน้า | `className="secondary-action" type="button" onClick={event=>{const form=event.currentTarget.form;if(form)startTransition(()=>previewAction(new FormData(form)));}} disabled={pending\|\|previewPending}` |
| A-123-C008 | 15 | `p`  | `role="status"` |
| A-123-C009 | 15 | `button`  | `className="primary" disabled={pending\|\|previewPending}` |
| A-123-C010 | 15 | `p`  | `role="status"` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-123-T001 | 9 | `[state,action,pending]=useActionState(createPersonalTaskAction,initial)` |
| A-123-T002 | 12 | `[preview,previewAction,previewPending]=useActionState(previewWorkDeadlineAction,initial)` |
| A-123-T003 | 14 | `[teamId,setTeamId]=useState(teams[0]?.teamId??"")` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-123-E001 | 15 | `previewAction(new FormData(form))` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-123-B001 | 15 | `form` |
| A-123-B002 | 15 | `pending` |

## A-124 — `src/components/work-live-refresh.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `6d821be904488e4fb8a849d3f730d4ef88dc2e331ab84423f35c1ebc8103192a`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-124-F001 | 8 | `WorkLiveRefresh` | `export function WorkLiveRefresh(` |
| A-124-F002 | 27 | `ready` | `() ` |
| A-124-F003 | 40 | `input` | `(event: Event) ` |
| A-124-F004 | 41 | `reset` | `(event: Event) ` |
| A-124-F005 | 42 | `resume` | `() ` |
| A-124-F006 | 43 | `mutation` | `() ` |
| A-124-F007 | 44 | `closed` | `(event: Event) ` |
| A-124-F008 | 45 | `broadcast` | `(event: MessageEvent) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-124-C001 | 59 | `RefreshButton`  | `onRefresh={() => coordinator.current?.request()} refreshPending={pending}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-124-T001 | 11 | `[updatedAt, setUpdatedAt] = useState(initialUpdatedAt)` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-124-E001 | 52 | `channel?.close()` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-124-B001 | 18 | `!pending && completion.current` |
| A-124-B002 | 19 | `document.querySelector(".work-state-unavailable")` |
| A-124-B003 | 25 | `!enabled` |
| A-124-B004 | 28 | `!form.isConnected` |
| A-124-B005 | 40 | `target instanceof HTMLElement` |
| A-124-B006 | 40 | `form` |
| A-124-B007 | 41 | `event.target instanceof HTMLFormElement` |
| A-124-B008 | 44 | `event.target instanceof HTMLDialogElement` |
| A-124-B009 | 45 | `event.data === "changed"` |
| A-124-B010 | 47 | `typeof BroadcastChannel === "function"` |
| A-124-B011 | 57 | `!enabled` |
| A-124-B012 | 58 | `initialUpdatedAt > updatedAt` |

## A-125 — `src/components/work-route-page.tsx`

- Status: PLANNED. Consumers: S-031.
- Normalized UTF-8/LF source SHA-256: `6c1cd74ac35ebfb025311d798b3cd1928017bba823d25fadff3a3d333403ba6a`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-125-F001 | 16 | `ActivityScreen` | `function ActivityScreen(` |
| A-125-F002 | 21 | `DueScreen` | `function DueScreen(` |
| A-125-F003 | 27 | `WorkTaskListForDue` | `function WorkTaskListForDue(` |
| A-125-F004 | 31 | `WorkRoutePage` | `export async function WorkRoutePage(` |
| A-125-F005 | 39 | `hasPermission` | `(permission: string) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-125-C001 | 17 | `WorkScreenShell`  | `title="กิจกรรมงาน" description="ตรวจสอบการเปลี่ยนแปลงที่เกี่ยวข้องกับงาน" appearance="workspace"` |
| A-125-C002 | 18 | `WorkScreenShell`  | `title="กิจกรรมงาน" description="ติดตามการสร้าง มอบหมาย เปลี่ยนสถานะ และบันทึกงานในขอบเขตสิทธิ์" parent={{ label: "งานของฉัน", href: "/work" }} appearance="workspace"` |
| A-125-C003 | 18 | `WorkEmpty`  | `title="ยังไม่มีกิจกรรมงาน" detail="กิจกรรมที่อยู่ในขอบเขตสิทธิ์ของคุณจะแสดงที่นี่เมื่อมีการเปลี่ยนแปลง"` |
| A-125-C004 | 24 | `WorkScreenShell`  | `title="งานที่ควรเร่ง" description="รวมงานของฉันที่ครบกำหนดวันนี้หรือเกินกำหนด" parent={{ label: "งานของฉัน", href: "/work" }} appearance="workspace"` |
| A-125-C005 | 24 | `WorkEmpty`  | `title="ยังไม่มีงานที่ต้องเร่ง" detail="งานที่ครบกำหนดวันนี้หรือเกินกำหนดจะแสดงที่นี่"` |
| A-125-C006 | 35 | `AccessDenied`  | `moduleName="งานและ KPI"` |
| A-125-C007 | 40 | `AccessDenied`  | `moduleName="งานและ KPI"` |
| A-125-C008 | 41 | `AccessDenied`  | `moduleName="งานและ KPI"` |
| A-125-C009 | 42 | `AccessDenied`  | `moduleName="งานและ KPI"` |
| A-125-C010 | 43 | `AccessDenied`  | `moduleName="งานและ KPI"` |
| A-125-C011 | 44 | `AccessDenied`  | `moduleName="งานและ KPI"` |
| A-125-C012 | 53 | `WorkReportsScreen`  | `model={model}` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-125-E001 | 32 | `notFound()` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-125-B001 | 17 | `model.source.status !== "ready"` |
| A-125-B002 | 18 | `model.activities.length` |
| A-125-B003 | 24 | `tasks.length` |
| A-125-B004 | 28 | `task.dueAt` |
| A-125-B005 | 32 | `!isWorkView(view)` |
| A-125-B006 | 35 | `!access.allowed` |
| A-125-B007 | 37 | `personalView` |
| A-125-B008 | 40 | `["assign", "team"].includes(currentView) && !hasPermission("work.task.manage")` |
| A-125-B009 | 41 | `currentView === "people" && !hasPermission("work.task.manage") && !hasPermission("kpi.team.read")` |
| A-125-B010 | 42 | `currentView === "kpi" && !hasPermission("kpi.score.read")` |
| A-125-B011 | 43 | `currentView === "reports" && !hasPermission("work.report.read")` |
| A-125-B012 | 44 | `currentView === "activity" && !hasPermission("activity.event.read")` |

## A-126 — `src/components/work-workspace.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `a42ee2b6f2e8ceddedc23c4f54a63a8086eb689aa7e66f280943ccfabf121b7a`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-126-F001 | 12 | `WorkWorkspace` | `export async function WorkWorkspace(` |

## A-127 — `src/components/workspace-feedback.tsx`

- Status: PLANNED. Consumers: S-026.
- Normalized UTF-8/LF source SHA-256: `9774e0f73937ebfdbdf460f7f0cfad30b2672dca3051bf05f0571351fdb4e082`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-127-F001 | 10 | `PreviewNotice` | `export function PreviewNotice(` |
| A-127-F002 | 19 | `RefreshButton` | `export function RefreshButton(` |
| A-127-F003 | 28 | `SourceDetails` | `export function SourceDetails(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-127-C001 | 13 | `div`  | `className={&#96;environment-banner ${preview ? "is-preview" : ""}&#96;} role="status"` |
| A-127-C002 | 15 | `Link`  | `href={preview ? pathname : &#96;${pathname}?preview=1&#96;}` |
| A-127-C003 | 23 | `button`  | `type="button" className="secondary-action" disabled={busy} onClick={() => onRefresh ? onRefresh() : startTransition(() => router.refresh())}` |
| A-127-C004 | 30 | `div`  | `className="source-details" role="status"` |
| A-127-C005 | 30 | `RefreshButton`  | `` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-127-B001 | 12 | `!developmentMode` |
| A-127-B002 | 13 | `preview` |
| A-127-B003 | 14 | `preview` |
| A-127-B004 | 14 | `preview` |
| A-127-B005 | 15 | `preview` |
| A-127-B006 | 15 | `preview` |
| A-127-B007 | 23 | `onRefresh` |
| A-127-B008 | 24 | `busy` |
| A-127-B009 | 29 | `preview \|\| snapshot.sources.every(source => source.status === "ready")` |

## A-128 — `src/components/workspace-icon.tsx`

- Status: PLANNED. Consumers: S-001, S-002, S-003, S-004, S-005, S-006, S-007, S-008, S-009, S-010, S-011, S-012, S-013, S-014, S-015, S-016, S-017, S-018, S-019, S-020, S-021, S-022, S-023, S-024, S-025, S-026, S-027, S-028, S-029, S-030, S-031, S-032, S-033, S-034, S-035, S-036, S-037.
- Normalized UTF-8/LF source SHA-256: `765ec7bc706460bce2d14b41dc31389d7c35386b85058edc60fb1076a7df66fe`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-128-F001 | 23 | `WorkspaceIcon` | `export function WorkspaceIcon(` |
| A-128-F002 | 50 | `workspaceIconMarkup` | `export function workspaceIconMarkup(name: IconName, size = 20, strokeWidth = 1.75): string ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-128-C001 | 26 | `svg`  | `className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false" style={style} dangerouslySetInnerHTML={{ __html: ICON_MARKUP[name] }}` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-128-B001 | 24 | `size < 18` |
| A-128-B002 | 36 | `label` |
| A-128-B003 | 38 | `label` |

## A-129 — `src/components/workspace-queue.tsx`

- Status: PLANNED. Consumers: S-026.
- Normalized UTF-8/LF source SHA-256: `0c54add8311f934b0457102bc2c7c994c272211fe9df3bd2d3ba401c68e34fb6`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-129-F001 | 18 | `priorityTone` | `(priority: DashboardItem["priority"]): "neutral" \| "warning" \| "danger" ` |
| A-129-F002 | 22 | `DetailPanel` | `function DetailPanel(` |
| A-129-F003 | 61 | `SavedViews` | `function SavedViews(` |
| A-129-F004 | 66 | `loadViews` | `function loadViews() ` |
| A-129-F005 | 72 | `save` | `function save(next: SavedView[], feedback: string) ` |
| A-129-F006 | 89 | `WorkspaceQueue` | `export function WorkspaceQueue(` |
| A-129-F007 | 121 | `update` | `function update(values: Record<string, string \| null>, push = false) ` |
| A-129-F008 | 127 | `changeSettings` | `function changeSettings(values: Partial<ViewSettings>) ` |
| A-129-F009 | 132 | `toggleItem` | `function toggleItem(item: DashboardItem) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-129-C001 | 33 | `dialog`  | `className={&#96;detail-panel ${closing ? "is-closing" : ""}&#96;} ref={ref} aria-labelledby="detail-title" onCancel={(event) => { event.preventDefault(); dismiss(); }} onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left \|\| event.clientX > rect.right \|\| event.clientY < rect.top \|\| event.clientY > rect.bottom) dismiss(); } }}` |
| A-129-C002 | 35 | `button`  | `type="button" className="round-btn" aria-label="ปิดรายละเอียด" onClick={dismiss} autoFocus` |
| A-129-C003 | 38 | `StatusBadge`  | `label={priorityLabels[item.priority]} tone={priorityTone(item.priority)}` |
| A-129-C004 | 38 | `StatusBadge`  | `label={item.statusLabel} tone="neutral"` |
| A-129-C005 | 50 | `Link`  | `className="primary" href={item.href} onClick={onClose}` |
| A-129-C006 | 51 | `button` คัดลอกรหัส | `className="secondary-action" type="button" onClick={async () => { try { await navigator.clipboard.writeText(item.code \|\| item.id); setMessage("คัดลอกรหัสรายการแล้ว"); } catch { setMessage("คัดลอกไม่สำเร็จ กรุณาเลือกรหัสแล้วคัดลอกด้วยตนเอง"); } }}` |
| A-129-C007 | 53 | `p`  | `role="status" className="inline-feedback"` |
| A-129-C008 | 76 | `details`  | `className="saved-views" ref={ref} onToggle={(event) => { if (event.currentTarget.open) loadViews(); }} onKeyDown={(event) => { if (event.key === "Escape" && ref.current) { ref.current.open = false; ref.current.querySelector("summary")?.focus(); } }}` |
| A-129-C009 | 77 | `summary` มุมมองที่บันทึกไว้ | `className="secondary-action"` |
| A-129-C010 | 80 | `button`  | `type="button" className="saved-view-link" onClick={() => { apply(view.settings); if (ref.current) ref.current.open = false; }}` |
| A-129-C011 | 80 | `button`  | `type="button" className="round-btn" aria-label={&#96;ลบมุมมอง ${view.name}&#96;} onClick={() => save(views.filter((item) => item.id !== view.id), "ลบมุมมองแล้ว")}` |
| A-129-C012 | 81 | `form`  | `onSubmit={(event) => { event.preventDefault(); if (!name.trim() \|\| views.length >= 8) return; if (save([...views, { id: crypto.randomUUID(), name: name.trim(), settings }], "บันทึกมุมมองแล้ว")) setName(""); }}` |
| A-129-C013 | 82 | `input`  | `id="saved-view-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="เช่น งานเร่งด่วนของฉัน" required` |
| A-129-C014 | 83 | `button` บันทึกมุมมองปัจจุบัน | `className="primary" type="submit" disabled={views.length >= 8}` |
| A-129-C015 | 84 | `p`  | `role="status" className="inline-feedback"` |
| A-129-C016 | 139 | `button`  | `type="button" key={view} className={&#96;ui-metric ${view === "urgent" ? "ui-metric-danger" : view === "today" ? "ui-metric-warning" : view === "mine" ? "ui-metric-info" : ""} ${settings.view === view ? "is-active" : ""}&#96;} aria-pressed={settings.view === view} onClick={() => changeSettings({ view })}` |
| A-129-C017 | 144 | `button`  | `type="button" key={view} className={settings.view === view ? "active" : ""} aria-pressed={settings.view === view} onClick={() => changeSettings({ view })}` |
| A-129-C018 | 146 | `input`  | `type="search" aria-label="ค้นหาในรายการ" placeholder="ค้นหาชื่ออาคาร รหัส หรือผู้รับผิดชอบ…" maxLength={200} value={settings.query} onChange={(event) => changeSettings({ query: event.target.value })}` |
| A-129-C019 | 147 | `button` ตัวกรอง | `type="button" className={&#96;secondary-action ${filtersOpen ? "is-active" : ""}&#96;} aria-expanded={filtersOpen} aria-controls="queue-filters" onClick={() => setFiltersOpen(!filtersOpen)}` |
| A-129-C020 | 150 | `select`  | `value={settings.status} onChange={(event) => changeSettings({ status: event.target.value })}` |
| A-129-C021 | 150 | `select`  | `value={settings.sort} onChange={(event) => changeSettings({ sort: event.target.value as ViewSettings["sort"] })}` |
| A-129-C022 | 150 | `button` ล้างตัวกรองทั้งหมด | `type="button" className="text-btn" onClick={() => changeSettings({ query: "", status: "", sort: "priority", view: "all" })}` |
| A-129-C023 | 151 | `div` แสดงข้อมูลบางส่วน บางระบบยังเชื่อมต่อไม่ได้ ดูสถานะข้อมูลด้านล่าง | `className="queue-notice" role="status"` |
| A-129-C024 | 153 | `button` คัดลอกรหัสที่เลือก | `type="button" className="secondary-action" onClick={async () => { try { await navigator.clipboard.writeText(selected.map((item) => item.code \|\| item.id).join("\n")); setMessage(&#96;คัดลอกรหัส ${selected.length} รายการแล้ว&#96;); } catch { setMessage("คัดลอกไม่สำเร็จ กรุณาลองอีกครั้ง"); } }}` |
| A-129-C025 | 156 | `button` ยกเลิกการเลือก | `type="button" className="text-btn" onClick={() => setSelection(new Set())}` |
| A-129-C026 | 157 | `p`  | `role="status" className="inline-feedback"` |
| A-129-C027 | 158 | `TableRegion`  | `label="ตารางรายการติดตาม เลื่อนแนวนอนได้"` |
| A-129-C028 | 159 | `table`  | `className="ui-table workspace-queue-table"` |
| A-129-C029 | 160 | `input`  | `type="checkbox" ref={selectAllRef} aria-label="เลือกทุกรายการในหน้านี้" checked={visible.length > 0 && selected.length === visible.length} disabled={!visible.length} onChange={(event) => { setSelection(event.target.checked ? new Set(visible.map(recordKey)) : new Set()); setSelectionScope(scope); }}` |
| A-129-C030 | 161 | `button`  | `type="button" onClick={() => changeSettings({ sort: "title" })}` |
| A-129-C031 | 162 | `button` กำหนด | `type="button" onClick={() => changeSettings({ sort: "due" })}` |
| A-129-C032 | 165 | `input`  | `type="checkbox" aria-label={&#96;เลือก ${item.code \|\| item.title}&#96;} checked={selectedKeys.has(recordKey(item))} onChange={() => toggleItem(item)}` |
| A-129-C033 | 166 | `button`  | `className="record-title" type="button" onClick={event => { openerRef.current=event.currentTarget; update({ record: item.id, module: item.moduleId }, true); }}` |
| A-129-C034 | 168 | `StatusBadge`  | `label={priorityLabels[item.priority]} tone={priorityTone(item.priority)}` |
| A-129-C035 | 169 | `StatusBadge`  | `label={item.statusLabel} tone="neutral"` |
| A-129-C036 | 171 | `button` แสดงรายการทั้งหมด | `className="secondary-action" type="button" onClick={() => changeSettings({ query: "", status: "", view: "all" })}` |
| A-129-C037 | 171 | `RefreshButton`  | `` |
| A-129-C038 | 174 | `span`  | `role="status"` |
| A-129-C039 | 174 | `button` ก่อนหน้า | `className="secondary-action" type="button" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}` |
| A-129-C040 | 174 | `button` ถัดไป | `className="secondary-action" type="button" disabled={page >= pageCount} onClick={() => update({ page: String(page + 1) })}` |
| A-129-C041 | 176 | `DetailPanel`  | `key={recordKey(activeRecord)} item={activeRecord} preview={preview} opener={openerRef} onClose={() => update({ record: null, module: null })}` |
| A-129-C042 | 177 | `div` รายการนี้ไม่อยู่ในข้อมูลติดตามที่เข้าถึงได้ในขณะนี้ | `className="queue-notice" role="status"` |
| A-129-C043 | 177 | `button` ปิดข้อความ | `type="button" className="text-btn" onClick={() => update({ record: null, module: null })}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-129-T001 | 24 | `[message, setMessage] = useState("")` |
| A-129-T002 | 62 | `[views, setViews] = useState<SavedView[]>([])` |
| A-129-T003 | 63 | `[name, setName] = useState("")` |
| A-129-T004 | 64 | `[message, setMessage] = useState("")` |
| A-129-T005 | 96 | `[selection, setSelection] = useState<Set<string>>(new Set())` |
| A-129-T006 | 97 | `[selectionScope, setSelectionScope] = useState("")` |
| A-129-T007 | 98 | `[message, setMessage] = useState("")` |
| A-129-T008 | 99 | `[filtersOpen, setFiltersOpen] = useState(Boolean(settings.status))` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-129-E001 | 29 | `dialog?.showModal()` |
| A-129-E002 | 30 | `dialog?.close()` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-129-B001 | 18 | `priority === "urgent"` |
| A-129-B002 | 18 | `priority === "attention"` |
| A-129-B003 | 33 | `closing` |
| A-129-B004 | 33 | `event.target === event.currentTarget` |
| A-129-B005 | 33 | `event.clientX < rect.left \|\| event.clientX > rect.right \|\| event.clientY < rect.top \|\| event.clientY > rect.bottom` |
| A-129-B006 | 37 | `item.moduleId === "buildings" && item.buildingName` |
| A-129-B007 | 69 | `Array.isArray(raw)` |
| A-129-B008 | 76 | `event.currentTarget.open` |
| A-129-B009 | 76 | `event.key === "Escape" && ref.current` |
| A-129-B010 | 80 | `views.length` |
| A-129-B011 | 80 | `ref.current` |
| A-129-B012 | 81 | `!name.trim() \|\| views.length >= 8` |
| A-129-B013 | 81 | `save([...views, { id: crypto.randomUUID(), name: name.trim(), settings }], "บันทึกมุมมองแล้ว")` |
| A-129-B014 | 107 | `moduleId` |
| A-129-B015 | 110 | `Number.isSafeInteger(requestedPage) && requestedPage > 0` |
| A-129-B016 | 113 | `selectionScope === scope` |
| A-129-B017 | 119 | `selectAllRef.current` |
| A-129-B018 | 123 | `value` |
| A-129-B019 | 124 | `next.size` |
| A-129-B020 | 125 | `push` |
| A-129-B021 | 129 | `next.view === "all"` |
| A-129-B022 | 129 | `next.sort === "priority"` |
| A-129-B023 | 134 | `next.has(key)` |
| A-129-B024 | 139 | `view === "urgent"` |
| A-129-B025 | 139 | `view === "today"` |
| A-129-B026 | 139 | `view === "mine"` |
| A-129-B027 | 139 | `settings.view === view` |
| A-129-B028 | 140 | `view === "all"` |
| A-129-B029 | 140 | `hasData` |
| A-129-B030 | 140 | `hasData` |
| A-129-B031 | 140 | `partial` |
| A-129-B032 | 143 | `moduleId` |
| A-129-B033 | 143 | `moduleId` |
| A-129-B034 | 143 | `hasData` |
| A-129-B035 | 143 | `preview` |
| A-129-B036 | 144 | `settings.view === view` |
| A-129-B037 | 144 | `hasData` |
| A-129-B038 | 147 | `filtersOpen` |
| A-129-B039 | 148 | `preview` |
| A-129-B040 | 160 | `event.target.checked` |
| A-129-B041 | 161 | `settings.sort === "title"` |
| A-129-B042 | 161 | `moduleId === "buildings"` |
| A-129-B043 | 162 | `settings.sort === "due"` |
| A-129-B044 | 164 | `selectedKeys.has(recordKey(item))` |
| A-129-B045 | 166 | `moduleId === "buildings" && item.buildingName` |
| A-129-B046 | 166 | `moduleId === "buildings"` |
| A-129-B047 | 171 | `hasData` |
| A-129-B048 | 171 | `unavailable` |
| A-129-B049 | 171 | `hasData` |
| A-129-B050 | 171 | `items.length` |
| A-129-B051 | 171 | `unavailable` |
| A-129-B052 | 171 | `hasData` |
| A-129-B053 | 171 | `items.length` |
| A-129-B054 | 171 | `unavailable` |
| A-129-B055 | 171 | `hasData && items.length > 0` |
| A-129-B056 | 171 | `unavailable` |
| A-129-B057 | 174 | `hasData` |
| A-129-B058 | 174 | `rows.length` |

## A-130 — `src/components/workspace-search.tsx`

- Status: PLANNED. Consumers: S-001, S-002, S-003, S-004, S-005, S-006, S-007, S-008, S-009, S-010, S-011, S-012, S-013, S-014, S-015, S-016, S-017, S-018, S-019, S-020, S-021, S-022, S-023, S-024, S-025, S-026, S-027, S-028, S-029, S-030, S-031, S-032, S-033, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `cb3e360cd23bd1aba2a2b449225bb22902d419087a71c31f941f77e8dc041c3c`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-130-F001 | 12 | `WorkspaceSearch` | `export function WorkspaceSearch(` |
| A-130-F002 | 46 | `shortcut` | `(event: KeyboardEvent) ` |
| A-130-F003 | 52 | `outside` | `(event: PointerEvent) ` |
| A-130-F004 | 62 | `goTo` | `function goTo(href: string) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-130-C001 | 64 | `div`  | `className="workspace-search" style={contained ? { maxWidth: "100%" } : undefined} ref={rootRef} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }}` |
| A-130-C002 | 66 | `input`  | `ref={inputRef} id="workspace-search-input" value={query} maxLength={200} placeholder="ค้นหาเมนูและรายการติดตาม…" aria-label="ค้นหาเมนูและรายการติดตาม" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={open ? listboxId : undefined} aria-activedescendant={open && results[active] ? &#96;${listboxId}-${active}&#96; : undefined} autoComplete="off" onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); setOpen(false); } if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActiveIndex(Math.min(active + 1, Math.max(0, results.length - 1))); } if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex(Math.max(0, active - 1)); } if (event.key === "Enter" && open && results[active]) { event.preventDefault(); goTo(results[active].href); } }}` |
| A-130-C003 | 77 | `div`  | `id={listboxId} role="listbox" aria-label="ผลการค้นหา" className="workspace-search-results"` |
| A-130-C004 | 78 | `div`  | `key={result.id} id={&#96;${listboxId}-${index}&#96;} role="option" aria-selected={active === index} className={&#96;workspace-search-result ${active === index ? "active" : ""}&#96;} onMouseEnter={() => setActiveIndex(index)} onMouseDown={(event) => event.preventDefault()} onClick={() => goTo(result.href)}` |
| A-130-C005 | 82 | `div`  | `className="search-feedback" role="status"` |
| A-130-C006 | 85 | `button` ลองค้นหาอีกครั้ง | `className="text-btn" type="button" onClick={() => { setRemote({ query: "" }); setRetry((value) => value + 1); }}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-130-T001 | 19 | `[query, setQuery] = useState("")` |
| A-130-T002 | 20 | `[open, setOpen] = useState(false)` |
| A-130-T003 | 21 | `[activeIndex, setActiveIndex] = useState(0)` |
| A-130-T004 | 22 | `[remote, setRemote] = useState<{ query: string; data?: SearchResponse; error?: boolean }>({ query: "" })` |
| A-130-T005 | 23 | `[retry, setRetry] = useState(0)` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-130-E001 | 36 | `fetch(&#96;/api/workspace/search?${search}&#96;, { signal: controller.signal })` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-130-B001 | 28 | `preview` |
| A-130-B002 | 32 | `!open \|\| needle.length < 2` |
| A-130-B003 | 35 | `preview` |
| A-130-B004 | 37 | `!response.ok \|\| !response.headers.get("content-type")?.includes("application/json")` |
| A-130-B005 | 39 | `!controller.signal.aborted` |
| A-130-B006 | 40 | `!controller.signal.aborted` |
| A-130-B007 | 48 | `((event.ctrlKey \|\| event.metaKey) && event.key.toLowerCase() === "k") \|\| (event.key === "/" && !editing)` |
| A-130-B008 | 52 | `!rootRef.current?.contains(event.target as Node)` |
| A-130-B009 | 57 | `needle.length >= 2 && remote.query === needle` |
| A-130-B010 | 64 | `contained` |
| A-130-B011 | 64 | `!event.currentTarget.contains(event.relatedTarget as Node)` |
| A-130-B012 | 66 | `open` |
| A-130-B013 | 66 | `open && results[active]` |
| A-130-B014 | 69 | `event.key === "Escape"` |
| A-130-B015 | 70 | `event.key === "ArrowDown"` |
| A-130-B016 | 71 | `event.key === "ArrowUp"` |
| A-130-B017 | 72 | `event.key === "Enter" && open && results[active]` |
| A-130-B018 | 76 | `needle` |
| A-130-B019 | 78 | `active === index` |
| A-130-B020 | 79 | `result.moduleId` |
| A-130-B021 | 83 | `loading` |
| A-130-B022 | 83 | `error` |
| A-130-B023 | 83 | `needle.length === 1` |
| A-130-B024 | 83 | `data && !data.ready` |
| A-130-B025 | 83 | `!results.length` |
| A-130-B026 | 83 | `data?.partial` |

## A-131 — `src/components/workspace-theme-toggle.tsx`

- Status: PLANNED. Consumers: S-001, S-002, S-003, S-004, S-005, S-006, S-007, S-008, S-009, S-010, S-011, S-012, S-013, S-014, S-015, S-016, S-017, S-018, S-019, S-020, S-021, S-022, S-023, S-024, S-025, S-026, S-027, S-028, S-029, S-030, S-031, S-032, S-033, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `8513babfa8a2d560ac5e8ad58324c7b7f38a86d94b4ef6d5cbd4021e6efb31f2`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-131-F001 | 10 | `WorkspaceThemeToggle` | `export function WorkspaceThemeToggle(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-131-C001 | 38 | `button`  | `className="round-btn workspace-theme-toggle" type="button" onClick={() => setTheme(isDark ? "light" : "dark")} aria-label={isDark ? copy.feedback.themeLight : copy.feedback.themeDark} title={isDark ? copy.feedback.themeLight : copy.feedback.themeDark}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-131-T001 | 11 | `[theme, setTheme] = useState<WorkspaceTheme>("light")` |
| A-131-T002 | 12 | `[ready, setReady] = useState(false)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-131-B001 | 19 | `saved === "dark" \|\| saved === "light"` |
| A-131-B002 | 21 | `window.matchMedia("(prefers-color-scheme: dark)").matches` |
| A-131-B003 | 29 | `!ready` |
| A-131-B004 | 38 | `isDark` |
| A-131-B005 | 38 | `isDark` |
| A-131-B006 | 38 | `isDark` |
| A-131-B007 | 39 | `isDark` |

## A-132 — `src/features/buildings/building-editor-form.tsx`

- Status: PLANNED. Consumers: S-003, S-006.
- Normalized UTF-8/LF source SHA-256: `7241d94922d418eaafb6cb94ed40f5a846cae6e9659fd4e0258c8b5a9bbcac64`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-132-F001 | 34 | `BuildingEditorForm` | `export function BuildingEditorForm(` |
| A-132-F002 | 48 | `warn` | `(event: BeforeUnloadEvent) ` |
| A-132-F003 | 49 | `changeField` | `function changeField(key: string, value: string) ` |
| A-132-F004 | 50 | `field` | `function field(field: Field) ` |
| A-132-F005 | 55 | `updateOther` | `function updateOther(index: number, update: Partial<OtherFee>) ` |
| A-132-F006 | 56 | `submit` | `async function submit(event: FormEvent<HTMLFormElement>) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-132-C001 | 53 | `select`  | `{...props}` |
| A-132-C002 | 53 | `textarea`  | `{...props} rows={4}` |
| A-132-C003 | 53 | `input`  | `{...props} inputMode={field.inputMode} maxLength={field.key === "address" ? 1000 : 240}` |
| A-132-C004 | 78 | `form`  | `ref={form} className="building-editor-form" onSubmit={submit} noValidate aria-busy={busy}` |
| A-132-C005 | 79 | `div`  | `id="building-editor-error" className="building-editor-error" role="alert"` |
| A-132-C006 | 79 | `button`  | `type="button" onClick={() => { if (!dirty \|\| window.confirm(c.leave)) window.location.reload(); }}` |
| A-132-C007 | 81 | `input`  | `name={key} value={identity[key]} required={key === "nameTh"} maxLength={key === "code" ? 40 : 240} onChange={event => { setDirty(true); setIdentity(old => ({ ...old, [key]: event.target.value })); }} aria-invalid={invalid.includes(key)} aria-describedby={invalid.includes(key) ? "building-editor-error" : key === "code" ? "building-code-hint" : undefined}` |
| A-132-C008 | 82 | `select`  | `name="ownerTeamId" value={identity.ownerTeamId} disabled={Boolean(id)} onChange={event => { setDirty(true); setIdentity(old => ({ ...old, ownerTeamId: event.target.value })); }}` |
| A-132-C009 | 86 | `BuildingLocationPicker`  | `apiKey={apiKey} initial={null} canUpdate onConfirmCandidate={point => { setDirty(true); setCandidate(point); setValues(old => ({ ...old, lat: String(point.latitude), lng: String(point.longitude), ...(point.address ? { address: point.address } : {}), ...(point.province ? { province: point.province } : {}) })); }}` |
| A-132-C010 | 87 | `input`  | `name={fee.key} inputMode="decimal" value={fees[fee.key] ?? ""} onChange={event => { setDirty(true); setFees(old => ({ ...old, [fee.key]: event.target.value })); }} aria-invalid={invalid.includes(fee.key)} aria-describedby={invalid.includes(fee.key) ? "building-editor-error" : undefined}` |
| A-132-C011 | 88 | `input`  | `name={key} inputMode="decimal" value={calc[key] ?? ""} onChange={event => { setDirty(true); setCalc(old => ({ ...old, [key]: event.target.value })); }} aria-invalid={invalid.includes(key)} aria-describedby={invalid.includes(key) ? "building-editor-error" : undefined}` |
| A-132-C012 | 90 | `input`  | `name={&#96;otherFeeLabel${index}&#96;} value={fee.label} maxLength={240} onChange={event => updateOther(index, { label: event.target.value })}` |
| A-132-C013 | 91 | `select`  | `value={fee.calculationType} onChange={event => updateOther(index, { calculationType: event.target.value as OtherFee["calculationType"] })}` |
| A-132-C014 | 92 | `input`  | `name={&#96;otherFeeValue${index}&#96;} inputMode="decimal" value={fee.value} onChange={event => updateOther(index, { value: event.target.value })}` |
| A-132-C015 | 93 | `select`  | `value={fee.revenuePeriod} onChange={event => updateOther(index, { revenuePeriod: event.target.value as OtherFee["revenuePeriod"] })}` |
| A-132-C016 | 94 | `input`  | `value={fee.note} maxLength={500} onChange={event => updateOther(index, { note: event.target.value })}` |
| A-132-C017 | 94 | `button`  | `type="button" aria-label={&#96;${c.removeFee} ${index + 1}&#96;} onClick={() => { setDirty(true); setOtherFees(old => old.filter((_, position) => position !== index)); }}` |
| A-132-C018 | 95 | `button`  | `type="button" disabled={otherFees.length >= 50} onClick={() => { setDirty(true); setOtherFees(old => [...old, { key: &#96;other_fee_${crypto.randomUUID()}&#96;, label: "", calculationType: "fixed", value: "", revenuePeriod: "monthly", note: "" }]); }}` |
| A-132-C019 | 96 | `textarea`  | `name="reason" value={reason} maxLength={500} rows={2} onChange={event => { setDirty(true); setReason(event.target.value); }}` |
| A-132-C020 | 97 | `span`  | `role="status"` |
| A-132-C021 | 97 | `Link`  | `href={cancel} onClick={event => { if (dirty && !window.confirm(c.leave)) event.preventDefault(); }}` |
| A-132-C022 | 97 | `button`  | `className="button" type="submit" disabled={busy}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-132-T001 | 38 | `[identity, setIdentity] = useState({ code: initial?.code ?? "", nameTh: initial?.nameTh ?? "", nameEn: initial?.nameEn ?? "", ownerTeamId: initial?.ownerTeamId ?? teams[0]?.id ?? "" })` |
| A-132-T002 | 39 | `[values, setValues] = useState<Record<string, string>>(initial?.conditions ?? { status: "Check Permission", group: "X", type: "L2", install_type: "Building", survey_type: "Need Survey", wm_point: "No", enclosure: "No" })` |
| A-132-T003 | 40 | `[fees, setFees] = useState<Record<string, string>>(initial?.fees ?? {})` |
| A-132-T004 | 41 | `[calc, setCalc] = useState<Record<string, string>>(initial?.installation ?? {})` |
| A-132-T005 | 42 | `[otherFees, setOtherFees] = useState<OtherFee[]>(initial?.otherFees ?? [])` |
| A-132-T006 | 43 | `[reason, setReason] = useState<string>(c.reasonDefault)` |
| A-132-T007 | 44 | `[candidate, setCandidate] = useState<BuildingLocationCandidate \| null>(null)` |
| A-132-T008 | 45 | `[dirty, setDirty] = useState(false)` |
| A-132-T009 | 45 | `[busy, setBusy] = useState(false)` |
| A-132-T010 | 45 | `[error, setError] = useState("")` |
| A-132-T011 | 45 | `[conflict, setConflict] = useState(false)` |
| A-132-T012 | 46 | `[invalid, setInvalid] = useState<string[]>([])` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-132-E001 | 71 | `sessionFetch(id ? &#96;/api/buildings/${id}&#96; : "/api/buildings", { method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...raw, ...(candidate ? { location: { ...candidate, verified: true } } : {}) }) })` |
| A-132-E002 | 79 | `window.confirm(c.leave)` |
| A-132-E003 | 97 | `window.confirm(c.leave)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-132-B001 | 47 | `id` |
| A-132-B002 | 48 | `dirty && !busy` |
| A-132-B003 | 49 | `["lat", "lng", "address", "province"].includes(key)` |
| A-132-B004 | 52 | `invalid.includes(field.key)` |
| A-132-B005 | 53 | `field.options` |
| A-132-B006 | 53 | `field.multiline` |
| A-132-B007 | 53 | `field.key === "address"` |
| A-132-B008 | 55 | `position === index` |
| A-132-B009 | 57 | `busy` |
| A-132-B010 | 60 | `id` |
| A-132-B011 | 62 | `!parsed.success` |
| A-132-B012 | 66 | `control instanceof HTMLElement` |
| A-132-B013 | 71 | `id` |
| A-132-B014 | 71 | `id` |
| A-132-B015 | 72 | `candidate` |
| A-132-B016 | 74 | `!response.ok \|\| !result.id` |
| A-132-B017 | 74 | `response.status === 403` |
| A-132-B018 | 74 | `result.error === "building_duplicate"` |
| A-132-B019 | 74 | `result.error === "building_changed"` |
| A-132-B020 | 74 | `response.status === 400` |
| A-132-B021 | 79 | `!dirty \|\| window.confirm(c.leave)` |
| A-132-B022 | 81 | `key === "code"` |
| A-132-B023 | 81 | `invalid.includes(key)` |
| A-132-B024 | 81 | `key === "code"` |
| A-132-B025 | 86 | `point.address` |
| A-132-B026 | 86 | `point.province` |
| A-132-B027 | 87 | `invalid.includes(fee.key)` |
| A-132-B028 | 88 | `invalid.includes(key)` |
| A-132-B029 | 97 | `busy` |
| A-132-B030 | 97 | `dirty && !window.confirm(c.leave)` |
| A-132-B031 | 97 | `busy` |

## A-133 — `src/features/buildings/delete-building.tsx`

- Status: PLANNED. Consumers: S-004.
- Normalized UTF-8/LF source SHA-256: `142d74cb84116ce3687ee3343bfb4851e38b427ac15e11fe1e559d1d2dcde7a7`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-133-F001 | 19 | `DeleteBuilding` | `export function DeleteBuilding(` |
| A-133-F002 | 27 | `submit` | `async function submit(event: FormEvent) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-133-C001 | 45 | `button` ลบอาคาร | `type="button" className="building-delete-trigger" onClick={() => { setConfirmation(""); setMessage(""); dialog.current?.showModal(); }}` |
| A-133-C002 | 46 | `dialog`  | `ref={dialog} className="building-delete-dialog" aria-labelledby="building-delete-title" aria-describedby="building-delete-description" onCancel={(event) => { if (pendingRef.current) event.preventDefault(); }}` |
| A-133-C003 | 47 | `form`  | `onSubmit={submit}` |
| A-133-C004 | 51 | `input`  | `value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" disabled={pending} required` |
| A-133-C005 | 52 | `p`  | `className="building-delete-error" role="alert"` |
| A-133-C006 | 53 | `button` ยกเลิก | `type="button" disabled={pending} onClick={() => dialog.current?.close()}` |
| A-133-C007 | 53 | `button`  | `type="submit" className="building-delete-confirm" disabled={pending \|\| confirmation.trim() !== name}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-133-T001 | 23 | `[confirmation, setConfirmation] = useState("")` |
| A-133-T002 | 24 | `[pending, setPending] = useState(false)` |
| A-133-T003 | 25 | `[message, setMessage] = useState("")` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-133-E001 | 29 | `confirmation.trim()` |
| A-133-E002 | 33 | `sessionFetch(&#96;/api/buildings/${id}&#96;, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmationName: confirmation.trim(), version }) })` |
| A-133-E003 | 34 | `confirmation.trim()` |
| A-133-E004 | 37 | `dialog.current?.close()` |
| A-133-E005 | 45 | `setConfirmation("")` |
| A-133-E006 | 45 | `dialog.current?.showModal()` |
| A-133-E007 | 51 | `setConfirmation(event.target.value)` |
| A-133-E008 | 53 | `dialog.current?.close()` |
| A-133-E009 | 53 | `confirmation.trim()` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-133-B001 | 29 | `pendingRef.current \|\| confirmation.trim() !== name` |
| A-133-B002 | 36 | `!response.ok \|\| result.deleted !== true` |
| A-133-B003 | 46 | `pendingRef.current` |
| A-133-B004 | 53 | `pending` |

## A-134 — `src/features/buildings/map/building-create-form.tsx`

- Status: PLANNED. Consumers: S-006.
- Normalized UTF-8/LF source SHA-256: `6f8db24ee4d2a420938e98b19727b426fb567bfb431e1b9cb58e6279fe8bad55`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-134-F001 | 5 | `BuildingCreateForm` | `export function BuildingCreateForm(props: ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-134-C001 | 6 | `BuildingEditorForm`  | `{...props}` |

## A-135 — `src/features/buildings/map/location-picker.tsx`

- Status: PLANNED. Consumers: S-003, S-004, S-006.
- Normalized UTF-8/LF source SHA-256: `e2ff1d6123317f9123a2a33287c276257afb8f21f008aaa96314294fbef6bbab`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-135-F001 | 11 | `BuildingLocationPicker` | `export function BuildingLocationPicker(` |
| A-135-F002 | 61 | `changeQuery` | `function changeQuery(value: string) ` |
| A-135-F003 | 65 | `choose` | `function choose(latitude: number, longitude: number, source: Source, accuracy: number \| null = null, placeId: string \| null = null) ` |
| A-135-F004 | 69 | `useCurrentLocation` | `function useCurrentLocation() ` |
| A-135-F005 | 76 | `save` | `async function save() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-135-C001 | 92 | `button` ◎ ใช้ตำแหน่งปัจจุบัน | `type="button" onClick={useCurrentLocation} disabled={!canUpdate \|\| saving}` |
| A-135-C002 | 93 | `input`  | `value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="พิมพ์ชื่ออาคาร ถนน หรือสถานที่" disabled={!canUpdate \|\| saving}` |
| A-135-C003 | 94 | `div`  | `className="building-location-results" role="listbox" aria-label="ผลการค้นหาสถานที่"` |
| A-135-C004 | 95 | `button`  | `type="button" role="option" aria-selected="false" key={&#96;${place.id ?? place.name}-${index}&#96;} onClick={() => { choose(place.latitude, place.longitude, "search", null, place.id); setQuery(place.name); setPlaces([]); }}` |
| A-135-C005 | 96 | `p`  | `role="status"` |
| A-135-C006 | 99 | `LongdoMapCanvas`  | `apiKey={apiKey} points={points} selectedId={candidate ? "candidate" : null} onPick={(latitude, longitude) => choose(latitude, longitude, "manual_pin")}` |
| A-135-C007 | 103 | `p`  | `className="building-location-message" role="status"` |
| A-135-C008 | 104 | `button` ล้างตำแหน่งที่เลือก | `type="button" className="secondary-action" disabled={!candidate \|\| saving} onClick={() => { setCandidate(null); setState("ล้างตำแหน่งที่เลือกแล้ว"); }}` |
| A-135-C009 | 104 | `button`  | `type="button" disabled={!candidate \|\| saving} onClick={save}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-135-T001 | 12 | `[candidate, setCandidate] = useState<BuildingLocationCandidate \| null>(initial)` |
| A-135-T002 | 13 | `[query, setQuery] = useState("")` |
| A-135-T003 | 14 | `[places, setPlaces] = useState<Place[]>([])` |
| A-135-T004 | 15 | `[state, setState] = useState("")` |
| A-135-T005 | 16 | `[searchState, setSearchState] = useState("")` |
| A-135-T006 | 17 | `[geocoding, setGeocoding] = useState(false)` |
| A-135-T007 | 18 | `[saving, setSaving] = useState(false)` |
| A-135-T008 | 19 | `[revision, setRevision] = useState(0)` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-135-E001 | 29 | `fetch(&#96;/api/buildings/location-services?${params}&#96;, { signal: abort.signal, cache: "no-store" })` |
| A-135-E002 | 52 | `fetch(&#96;/api/buildings/location-services?${params}&#96;, { signal: abort.signal, cache: "no-store" })` |
| A-135-E003 | 79 | `window.confirm(&#96;ยืนยันบันทึกตำแหน่งอาคารนี้?\n${place}\nพิกัด ${candidate.latitude.toFixed(6)}, ${candidate.longitude.toFixed(6)}&#96;)` |
| A-135-E004 | 80 | `onConfirmCandidate(candidate)` |
| A-135-E005 | 84 | `fetch(&#96;/api/buildings/${buildingId}/location&#96;, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...candidate, verified: true }) })` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-135-B001 | 20 | `candidate` |
| A-135-B002 | 23 | `!candidate \|\| !apiKey` |
| A-135-B003 | 30 | `!response.ok` |
| A-135-B004 | 32 | `!abort.signal.aborted` |
| A-135-B005 | 32 | `current && current.latitude === candidate.latitude && current.longitude === candidate.longitude` |
| A-135-B006 | 36 | `!abort.signal.aborted` |
| A-135-B007 | 37 | `!abort.signal.aborted` |
| A-135-B008 | 46 | `value.length < 2 \|\| !apiKey` |
| A-135-B009 | 53 | `!response.ok` |
| A-135-B010 | 55 | `!abort.signal.aborted` |
| A-135-B011 | 55 | `result.items?.length` |
| A-135-B012 | 56 | `!abort.signal.aborted` |
| A-135-B013 | 63 | `value.trim().length < 2 \|\| !apiKey` |
| A-135-B014 | 71 | `!navigator.geolocation` |
| A-135-B015 | 73 | `error.code === error.PERMISSION_DENIED` |
| A-135-B016 | 73 | `error.code === error.TIMEOUT` |
| A-135-B017 | 77 | `!candidate \|\| !canUpdate \|\| saving` |
| A-135-B018 | 79 | `!window.confirm(&#96;ยืนยันบันทึกตำแหน่งอาคารนี้?\n${place}\nพิกัด ${candidate.latitude.toFixed(6)}, ${candidate.longitude.toFixed(6)}&#96;)` |
| A-135-B019 | 80 | `!buildingId && onConfirmCandidate` |
| A-135-B020 | 81 | `!buildingId` |
| A-135-B021 | 85 | `!response.ok` |
| A-135-B022 | 85 | `response.status === 403` |
| A-135-B023 | 87 | `error instanceof Error` |
| A-135-B024 | 99 | `candidate` |
| A-135-B025 | 100 | `candidate` |
| A-135-B026 | 101 | `candidate.accuracy === null` |
| A-135-B027 | 101 | `candidate.source === "gps"` |
| A-135-B028 | 101 | `candidate.source === "search"` |
| A-135-B029 | 102 | `geocoding` |
| A-135-B030 | 104 | `saving` |

## A-136 — `src/features/buildings/map/longdo-map-canvas.tsx`

- Status: PLANNED. Consumers: S-003, S-004, S-005, S-006, S-007.
- Normalized UTF-8/LF source SHA-256: `9740169f1d442d3e4343e2a8c0df8d6b690094f74b1aa44477937def59a55c08`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-136-F001 | 13 | `removeHeatmap` | `function removeHeatmap(map: LongdoMapInstance) ` |
| A-136-F002 | 20 | `buildClusters` | `function buildClusters(points: MapPoint[], zoom: number): Cluster[] ` |
| A-136-F003 | 32 | `features` | `function features(points: MapPoint[]) ` |
| A-136-F004 | 39 | `getInitialMapFit` | `export function getInitialMapFit(points: MapPoint[], selectedId?: string \| null): InitialMapFit \| null ` |
| A-136-F005 | 50 | `LongdoMapCanvas` | `export function LongdoMapCanvas(` |
| A-136-F006 | 74 | `onRendererReady` | `() ` |
| A-136-F007 | 80 | `onMapClick` | `() ` |
| A-136-F008 | 85 | `onOverlayClick` | `(event: unknown) ` |
| A-136-F009 | 98 | `onZoom` | `() ` |
| A-136-F010 | 102 | `onCurrentLocation` | `(event: Event) ` |
| A-136-F011 | 216 | `onChange` | `() ` |
| A-136-F012 | 221 | `toggleFullscreen` | `async function toggleFullscreen() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-136-C001 | 231 | `div`  | `ref={hostRef} className="building-longdo-map-canvas" role="region" aria-label="แผนที่อาคาร Longdo"` |
| A-136-C002 | 232 | `button`  | `type="button" className="building-longdo-fullscreen" onClick={toggleFullscreen} aria-label={fullscreen ? "ออกจากเต็มหน้าจอ" : "แสดงแผนที่เต็มหน้าจอ"}` |
| A-136-C003 | 234 | `button` × | `type="button" aria-label="ปิดรายชื่อกลุ่มอาคาร" onClick={() => setClusterIds([])}` |
| A-136-C004 | 235 | `button`  | `type="button" onClick={() => { setClusterIds([]); callbackRef.current.onSelect?.(point.id); }}` |
| A-136-C005 | 237 | `div`  | `className="building-longdo-map-state" role="status"` |
| A-136-C006 | 238 | `button` ลองอีกครั้ง | `type="button" onClick={() => { setState("loading"); setRetry((value) => value + 1); }}` |
| A-136-C007 | 239 | `button` ดูรายการ | `type="button" onClick={onFallbackToList}` |
| A-136-C008 | 241 | `div` ต้องมีอาคารที่ระบุตำแหน่งอย่างน้อย 2 แห่ง จึงแสดงความหนาแน่นได้ | `className="building-longdo-map-hint" role="status"` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-136-T001 | 56 | `[state, setState] = useState<"loading" \| "ready" \| "missing-key" \| "error">(apiKey ? "loading" : "missing-key")` |
| A-136-T002 | 57 | `[retry, setRetry] = useState(0)` |
| A-136-T003 | 58 | `[fullscreen, setFullscreen] = useState(false)` |
| A-136-T004 | 59 | `[zoomRevision, setZoomRevision] = useState(0)` |
| A-136-T005 | 60 | `[clusterIds, setClusterIds] = useState<string[]>([])` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-136-B001 | 15 | `!renderer?.isStyleLoaded()` |
| A-136-B002 | 16 | `renderer.getLayer("building-expense-heat")` |
| A-136-B003 | 17 | `renderer.getSource("building-expense-heat-source")` |
| A-136-B004 | 21 | `zoom < 7` |
| A-136-B005 | 21 | `zoom < 9` |
| A-136-B006 | 21 | `zoom < 11` |
| A-136-B007 | 21 | `zoom < 13` |
| A-136-B008 | 21 | `zoom < 15` |
| A-136-B009 | 21 | `zoom < 17` |
| A-136-B010 | 26 | `current` |
| A-136-B011 | 41 | `!validPoints.length` |
| A-136-B012 | 42 | `selectedId` |
| A-136-B013 | 43 | `selected \|\| validPoints.length === 1` |
| A-136-B014 | 56 | `apiKey` |
| A-136-B015 | 68 | `!apiKey \|\| !hostRef.current` |
| A-136-B016 | 75 | `disposed \|\| !map` |
| A-136-B017 | 81 | `!callbackRef.current.onPick \|\| !map \|\| !namespaceRef.current?.LocationMode?.Pointer` |
| A-136-B018 | 83 | `typeof location?.lat === "number" && typeof location.lon === "number"` |
| A-136-B019 | 86 | `!callbackRef.current.onSelect \|\| !event \|\| typeof event !== "object"` |
| A-136-B020 | 89 | `marker.buildingIds && marker.clusterLocation && map` |
| A-136-B021 | 93 | `marker.buildingId` |
| A-136-B022 | 99 | `zoomTimer !== undefined` |
| A-136-B023 | 104 | `!ready \|\| !map \|\| typeof detail?.lat !== "number" \|\| typeof detail.lon !== "number"` |
| A-136-B024 | 108 | `!marker` |
| A-136-B025 | 113 | `disposed \|\| !hostRef.current` |
| A-136-B026 | 123 | `!disposed` |
| A-136-B027 | 126 | `map` |
| A-136-B028 | 132 | `ready` |
| A-136-B029 | 136 | `map.destroy` |
| A-136-B030 | 139 | `zoomTimer !== undefined` |
| A-136-B031 | 149 | `state !== "ready" \|\| !map \|\| initialFitDoneRef.current` |
| A-136-B032 | 152 | `!fit` |
| A-136-B033 | 153 | `fit.kind === "point"` |
| A-136-B034 | 156 | `!map.bound` |
| A-136-B035 | 168 | `state !== "ready" \|\| !host \|\| !mapRef.current \|\| typeof ResizeObserver === "undefined"` |
| A-136-B036 | 176 | `state !== "ready" \|\| !map \|\| !longdo` |
| A-136-B037 | 180 | `heatmap && points.length > 1 && map.Renderer?.isStyleLoaded()` |
| A-136-B038 | 185 | `heatmap` |
| A-136-B039 | 191 | `first.status === "Permission Confirmed"` |
| A-136-B040 | 191 | `first.status === "MOU"` |
| A-136-B041 | 191 | `first.status === "อาคารปิดถาวร"` |
| A-136-B042 | 192 | `grouped` |
| A-136-B043 | 194 | `grouped` |
| A-136-B044 | 197 | `grouped` |
| A-136-B045 | 197 | `selected` |
| A-136-B046 | 200 | `grouped` |
| A-136-B047 | 208 | `state !== "ready" \|\| !selectedId \|\| !mapRef.current` |
| A-136-B048 | 210 | `!point` |
| A-136-B049 | 223 | `!container` |
| A-136-B050 | 225 | `document.fullscreenElement` |
| A-136-B051 | 226 | `container.requestFullscreen` |
| A-136-B052 | 232 | `fullscreen` |
| A-136-B053 | 232 | `fullscreen` |
| A-136-B054 | 238 | `state === "loading"` |
| A-136-B055 | 238 | `state === "missing-key"` |

## A-137 — `src/features/buildings/map/map-workspace.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `f5358c3c2b59909c5a9b3ae1148d1e31aeb7ce248934733afebe5510efbdf57d`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-137-F001 | 17 | `money` | `(value: Decimal) ` |
| A-137-F002 | 23 | `MapWorkspace` | `export function MapWorkspace(` |
| A-137-F003 | 80 | `syncFromUrl` | `() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-137-C001 | 97 | `Link` ← อาคารและค่าใช้จ่าย | `href="/buildings" className="building-map-back"` |
| A-137-C002 | 98 | `div`  | `className="building-map-summary" aria-live="polite"` |
| A-137-C003 | 102 | `input`  | `value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ชื่ออาคาร รหัส หรือพื้นที่"` |
| A-137-C004 | 103 | `select`  | `value={province} onChange={(event) => setProvince(event.target.value)}` |
| A-137-C005 | 104 | `select`  | `value={status} onChange={(event) => setStatus(event.target.value)}` |
| A-137-C006 | 105 | `select`  | `value={mode} onChange={(event) => setMode(event.target.value as Mode)}` |
| A-137-C007 | 107 | `select`  | `value={category} onChange={(event) => setCategory(event.target.value as BuildingMapExpenseCategory)}` |
| A-137-C008 | 108 | `select`  | `value={heatMetric} onChange={(event) => setHeatMetric(event.target.value as HeatMetric)}` |
| A-137-C009 | 109 | `input`  | `type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)}` |
| A-137-C010 | 110 | `input`  | `type="date" value={toDate} onChange={(event) => setToDate(event.target.value)}` |
| A-137-C011 | 112 | `button` ◎ ตำแหน่งปัจจุบัน | `type="button" className="building-location-button" onClick={() => { setLocationMessage("กำลังขอตำแหน่งจากอุปกรณ์…"); if (!navigator.geolocation) { setLocationMessage("อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง คุณยังค้นหาอาคารจากแผนที่ได้"); return; } navigator.geolocation.getCurrentPosition((position) => { window.dispatchEvent(new CustomEvent("building-map-current-location", { detail: { lat: position.coords.latitude, lon: position.coords.longitude } })); setLocationMessage(&#96;แสดงตำแหน่งปัจจุบัน · ความแม่นยำประมาณ ${Math.round(position.coords.accuracy)} เมตร&#96;); }, (error) => setLocationMessage(error.code === error.PERMISSION_DENIED ? "ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง คุณยังค้นหาอาคารจากแผนที่ได้" : error.code === error.TIMEOUT ? "ใช้เวลารอตำแหน่งนานเกินไป กรุณาลองอีกครั้ง" : "ไม่สามารถอ่านตำแหน่งได้ กรุณาลองอีกครั้ง"), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }); }}` |
| A-137-C012 | 118 | `p`  | `className="building-map-notice" role="status"` |
| A-137-C013 | 119 | `p` แสดงข้อมูล 2,000 อาคารแรกในขอบเขต โปรดจำกัดการค้นหาหรือจังหวัดเพื่อดูรายการเพิ่มเติม | `className="building-map-notice" role="status"` |
| A-137-C014 | 121 | `button`  | `type="button" aria-pressed={selectedId === item.id} onClick={() => setSelectedId(item.id)}` |
| A-137-C015 | 121 | `Link` เปิด | `href={&#96;/buildings/${item.id}&#96;} aria-label={&#96;เปิดข้อมูลอาคาร ${item.nameTh}&#96;}` |
| A-137-C016 | 123 | `LongdoMapCanvas`  | `apiKey={apiKey} points={points} selectedId={selectedId} heatmap={mode === "heatmap"} onSelect={setSelectedId}` |
| A-137-C017 | 124 | `article`  | `key={&#96;building-detail-${selected.id}&#96;} className="building-map-detail" aria-live="polite"` |
| A-137-C018 | 124 | `button` × | `type="button" className="building-map-detail-close" onClick={() => setSelectedId("")} aria-label="ปิดรายละเอียด"` |
| A-137-C019 | 126 | `Link` ข้อมูลอาคาร | `href={&#96;/buildings/${selected.id}&#96;}` |
| A-137-C020 | 126 | `Link` แก้ไขตำแหน่ง | `href={&#96;/buildings/${selected.id}?tab=location&#96;}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-137-T001 | 28 | `[query, setQuery] = useState(initialQuery)` |
| A-137-T002 | 29 | `[province, setProvince] = useState(initialProvince)` |
| A-137-T003 | 30 | `[status, setStatus] = useState(initialStatus)` |
| A-137-T004 | 31 | `[category, setCategory] = useState<BuildingMapExpenseCategory>(groups.some(([key]) => key === initialCategory) ? initialCategory as BuildingMapExpenseCategory : "CAPEX")` |
| A-137-T005 | 32 | `[heatMetric, setHeatMetric] = useState<HeatMetric>((["building_count", "fee_count", "amount"].includes(initialHeatMetric) ? initialHeatMetric : "building_count") as HeatMetric)` |
| A-137-T006 | 33 | `[mode, setMode] = useState<Mode>((["buildings", "status", "expense", "heatmap"].includes(initialMode) ? initialMode : "buildings") as Mode)` |
| A-137-T007 | 34 | `[selectedId, setSelectedId] = useState(selectedBuildingId)` |
| A-137-T008 | 35 | `[fromDate, setFromDate] = useState(initialFromDate)` |
| A-137-T009 | 36 | `[toDate, setToDate] = useState(initialToDate)` |
| A-137-T010 | 37 | `[locationMessage, setLocationMessage] = useState("")` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-137-B001 | 20 | `fraction === "00"` |
| A-137-B002 | 31 | `groups.some(([key]) => key === initialCategory)` |
| A-137-B003 | 32 | `["building_count", "fee_count", "amount"].includes(initialHeatMetric)` |
| A-137-B004 | 33 | `["buildings", "status", "expense", "heatmap"].includes(initialMode)` |
| A-137-B005 | 56 | `row.amount.greaterThan(max)` |
| A-137-B006 | 58 | `heatMetric === "fee_count"` |
| A-137-B007 | 58 | `category === "UNCLASSIFIED"` |
| A-137-B008 | 61 | `mode !== "heatmap"` |
| A-137-B009 | 61 | `heatMetric === "building_count"` |
| A-137-B010 | 61 | `heatMetric === "fee_count"` |
| A-137-B011 | 62 | `maxFeeCount` |
| A-137-B012 | 62 | `maxAmount.isZero()` |
| A-137-B013 | 63 | `item.locationVerified` |
| A-137-B014 | 69 | `mode === "heatmap"` |
| A-137-B015 | 70 | `value` |
| A-137-B016 | 72 | `params.toString() !== searchParams.toString()` |
| A-137-B017 | 73 | `params.size` |
| A-137-B018 | 85 | `["buildings", "status", "expense", "heatmap"].includes(nextMode)` |
| A-137-B019 | 87 | `groups.some(([key]) => key === nextCategory)` |
| A-137-B020 | 89 | `["building_count", "fee_count", "amount"].includes(nextMetric)` |
| A-137-B021 | 114 | `!navigator.geolocation` |
| A-137-B022 | 115 | `error.code === error.PERMISSION_DENIED` |
| A-137-B023 | 115 | `error.code === error.TIMEOUT` |
| A-137-B024 | 121 | `visible.length` |
| A-137-B025 | 121 | `item.locationVerified` |
| A-137-B026 | 121 | `buildings.length` |
| A-137-B027 | 121 | `buildings.length` |
| A-137-B028 | 122 | `heatMetric === "building_count"` |
| A-137-B029 | 122 | `heatMetric === "fee_count"` |
| A-137-B030 | 124 | `selected.locationVerified` |
| A-137-B031 | 124 | `selected.locationSource` |

## A-138 — `src/features/car-booking/car-access-workspace.tsx`

- Status: PLANNED. Consumers: S-001.
- Normalized UTF-8/LF source SHA-256: `8428cb4f9953c9da8432385eb203ccb4e65f96e3561b43c57a01e459e785e7f8`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-138-F001 | 6 | `CarAccessWorkspace` | `export function CarAccessWorkspace() ` |
| A-138-F002 | 10 | `save` | `async(user:CarAccessUser,canUse:boolean,canAdmin:boolean)` |
| A-138-F003 | 20 | `AccessRow` | `function AccessRow(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-138-C001 | 16 | `PageHeader`  | `title="สิทธิ์ระบบจองรถ" description="กำหนดสิทธิ์รายบุคคล มีผลทันทีในคำขอถัดไปโดยไม่ต้องเข้าสู่ระบบใหม่" parent={{label:"ผู้ดูแลระบบ",href:"/admin"}}` |
| A-138-C002 | 17 | `input`  | `type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="ชื่อ อีเมล หรือรหัสพนักงาน"` |
| A-138-C003 | 17 | `button` โหลดใหม่ | `disabled={busy} onClick={()=>void load()}` |
| A-138-C004 | 17 | `p`  | `role="status" className="cb-success"` |
| A-138-C005 | 17 | `p`  | `role="alert" className="cb-error"` |
| A-138-C006 | 18 | `div`  | `className="cb-access-list" aria-live="polite"` |
| A-138-C007 | 18 | `AccessRow`  | `key={&#96;${user.id}-${user.can_use}-${user.can_admin}&#96;} user={user} busy={busy} onSave={save}` |
| A-138-C008 | 18 | `p`  | `role="status" className="cb-empty"` |
| A-138-C009 | 22 | `form`  | `className="cb-access-row" onSubmit={e=>{e.preventDefault();void onSave(user,use,admin);}}` |
| A-138-C010 | 22 | `input`  | `type="checkbox" checked={use} disabled={busy} onChange={e=>setUse(e.target.checked)}` |
| A-138-C011 | 22 | `input`  | `type="checkbox" checked={admin} disabled={busy} onChange={e=>setAdmin(e.target.checked)}` |
| A-138-C012 | 22 | `button` บันทึก | `type="submit" disabled={busy \|\| use===user.can_use&&admin===user.can_admin} aria-label={&#96;บันทึกสิทธิ์ ${user.display_name \|\| user.email}&#96;}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-138-T001 | 7 | `[users,setUsers]=useState<CarAccessUser[]>([])` |
| A-138-T002 | 7 | `[query,setQuery]=useState("")` |
| A-138-T003 | 7 | `[busy,setBusy]=useState(false)` |
| A-138-T004 | 7 | `[error,setError]=useState("")` |
| A-138-T005 | 7 | `[message,setMessage]=useState("")` |
| A-138-T006 | 21 | `[use,setUse]=useState(user.can_use)` |
| A-138-T007 | 21 | `[admin,setAdmin]=useState(user.can_admin)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-138-B001 | 8 | `e instanceof Error` |
| A-138-B002 | 13 | `e instanceof Error` |
| A-138-B003 | 18 | `users.length` |
| A-138-B004 | 22 | `user.status==="active"` |

## A-139 — `src/features/car-booking/car-booking-dialog.tsx`

- Status: PLANNED. Consumers: S-001, S-008.
- Normalized UTF-8/LF source SHA-256: `43597538600e1b08dc1aa5ee445eb96a76c6ae5474ee18725f6fc75f9b78e636`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-139-F001 | 3 | `CarBookingDialog` | `export function CarBookingDialog(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-139-C001 | 6 | `dialog`  | `ref={ref} className="cb-dialog" aria-labelledby={titleId} onCancel={event=>{event.preventDefault();if(!busy)onClose();}}` |
| A-139-C002 | 6 | `button` ปิด | `type="button" disabled={busy} onClick={onClose} aria-label="ปิดหน้าต่าง"` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-139-E001 | 5 | `dialog?.showModal()` |
| A-139-E002 | 5 | `dialog?.close()` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-139-B001 | 5 | `previous?.isConnected` |
| A-139-B002 | 6 | `!busy` |

## A-140 — `src/features/car-booking/car-booking-workspace.tsx`

- Status: PLANNED. Consumers: S-001, S-008.
- Normalized UTF-8/LF source SHA-256: `4de7ee13a5cb9f73a8fcaf6851b1c932fcaf9bd02ef3fd94df54287f21af3c8a`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-140-F001 | 20 | `carRequest` | `export async function carRequest<T>(path:string,method="GET",body?:unknown):Promise<T> ` |
| A-140-F002 | 26 | `getCarBookingTabs` | `export function getCarBookingTabs(admin:boolean)` |
| A-140-F003 | 27 | `CarBookingWorkspace` | `export function CarBookingWorkspace(` |
| A-140-F004 | 43 | `reservations` | `async(filter:string)` |
| A-140-F005 | 59 | `mutate` | `async(path:string,body:unknown,method="POST",success="บันทึกเรียบร้อยแล้ว")` |
| A-140-F006 | 68 | `checkAvailable` | `async()` |
| A-140-F007 | 107 | `ReturnForm` | `function ReturnForm(` |
| A-140-F008 | 111 | `FuelFields` | `function FuelFields(` |
| A-140-F009 | 112 | `LogForm` | `function LogForm(` |
| A-140-F010 | 114 | `locate` | `()` |
| A-140-F011 | 117 | `CarForm` | `function CarForm(` |
| A-140-F012 | 118 | `JourneyLogs` | `function JourneyLogs(` |
| A-140-F013 | 120 | `load` | `async function load()` |
| A-140-F014 | 125 | `carBookingStatusTone` | `function carBookingStatusTone(status: string) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-140-C001 | 78 | `button`  | `key={item.id} type="button" aria-current={tab===item.id?"page":undefined} onClick={()=>{setTab(item.id);setQuery("");setStatus("all");}}` |
| A-140-C002 | 78 | `Link` จัดสิทธิ์จองรถ | `href="/admin/car-booking" className="cb-link"` |
| A-140-C003 | 79 | `input`  | `type="month" value={month} onChange={e=>{if(e.target.value){setMonth(e.target.value);setCalendarDate(&#96;${e.target.value}-01&#96;);}}}` |
| A-140-C004 | 79 | `button` โหลดใหม่ | `type="button" disabled={loading \|\| busy} onClick={()=>void refresh()}` |
| A-140-C005 | 80 | `p`  | `role="status" className="cb-success"` |
| A-140-C006 | 80 | `p`  | `role="alert" className="cb-error"` |
| A-140-C007 | 80 | `p` กำลังโหลดข้อมูล… | `role="status"` |
| A-140-C008 | 81 | `form`  | `onSubmit={async e=>{e.preventDefault();if(await mutate("/api/car-booking/bookings",{carId:selectedCar,destination,intervals:[{startTime:bangkokISO(start),endTime:bangkokISO(end)}]},"POST","จองรถเรียบร้อยแล้ว")){setDestination("");setSelectedCar("");}}}` |
| A-140-C009 | 82 | `p` ระบบหยุดรับการจองใหม่ชั่วคราว ยังสามารถคืนรถ ยกเลิก และบันทึกการเดินทางได้ | `role="status"` |
| A-140-C010 | 83 | `input`  | `type="datetime-local" required value={start} onChange={e=>{setStart(e.target.value);setAvailable(null);}}` |
| A-140-C011 | 83 | `input`  | `type="datetime-local" required value={end} onChange={e=>{setEnd(e.target.value);setAvailable(null);}}` |
| A-140-C012 | 84 | `button` ตรวจรถว่าง | `type="button" disabled={busy \|\| loading \|\| !acceptNewBookings \|\| !start \|\| !end} onClick={()=>void checkAvailable()}` |
| A-140-C013 | 85 | `p` พบรถว่าง คัน | `role="status"` |
| A-140-C014 | 85 | `select`  | `required value={selectedCar} onChange={e=>setSelectedCar(e.target.value)}` |
| A-140-C015 | 86 | `input`  | `required maxLength={2000} value={destination} onChange={e=>setDestination(e.target.value)} placeholder="ระบุจุดหมายหรือภารกิจ"` |
| A-140-C016 | 87 | `button`  | `className="cb-primary" disabled={busy \|\| loading \|\| !acceptNewBookings \|\| !selectedCar \|\| availableRange!==&#96;${start}\|${end}&#96;} type="submit"` |
| A-140-C017 | 89 | `input`  | `type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="ทะเบียน ปลายทาง หรือผู้จอง"` |
| A-140-C018 | 89 | `select`  | `value={status} onChange={e=>setStatus(e.target.value)}` |
| A-140-C019 | 90 | `p` ไม่มีรายการในเดือนและตัวกรองที่เลือก | `role="status"` |
| A-140-C020 | 91 | `StatusBadge`  | `label={bookingStatus(b.status, b.startTime, now)} tone={carBookingStatusTone(b.status)}` |
| A-140-C021 | 91 | `button` คืนรถ | `onClick={()=>setDialog({kind:"return",booking:b})}` |
| A-140-C022 | 91 | `button` เพิ่มบันทึก | `onClick={()=>setDialog({kind:"log",booking:b})}` |
| A-140-C023 | 91 | `button` ยกเลิกการจอง | `className="cb-danger" onClick={()=>setDialog({kind:"cancel",booking:b})}` |
| A-140-C024 | 91 | `button` ดูบันทึก | `onClick={()=>setDialog({kind:"logs",booking:b})}` |
| A-140-C025 | 91 | `button` ดูพิกัด | `onClick={()=>setDialog({kind:"gps",booking:b})}` |
| A-140-C026 | 93 | `CarCalendar`  | `events={calendar} anchor={calendarDate} view={calendarView} loading={loading} onView={setCalendarView} onDate={date=>{setCalendarDate(date);setMonth(date.slice(0,7));}}` |
| A-140-C027 | 94 | `CarReports`  | `key={tab} dashboard={tab==="dashboard"}` |
| A-140-C028 | 95 | `button` เพิ่มรถ | `className="cb-primary" onClick={()=>setDialog({kind:"car"})}` |
| A-140-C029 | 95 | `TableRegion`  | `label="ตารางข้อมูลรถ เลื่อนแนวนอนได้" className="cb-table-wrap"` |
| A-140-C030 | 95 | `table`  | `` |
| A-140-C031 | 95 | `button` แก้ไข | `onClick={()=>setDialog({kind:"car",car:c})}` |
| A-140-C032 | 96 | `form`  | `onSubmit={e=>{e.preventDefault();void mutate("/api/car-booking/settings",{floors:floorText.split(/\r?\n/).map(v=>v.trim()).filter(Boolean),version:floorVersion},"PATCH","บันทึกชั้นจอดแล้ว");}}` |
| A-140-C033 | 96 | `textarea`  | `required rows={10} value={floorText} onChange={e=>setFloorText(e.target.value)}` |
| A-140-C034 | 96 | `button` บันทึกชั้นจอด | `type="submit" className="cb-primary" disabled={busy}` |
| A-140-C035 | 97 | `CarBookingDialog`  | `title={{return:"คืนรถ",log:"เพิ่มบันทึกระหว่างทาง",logs:"บันทึกระหว่างทาง",gps:"พิกัดการเดินทาง",car:dialog.car?"แก้ไขรถ":"เพิ่มรถ",cancel:"ยืนยันยกเลิกการจอง"}[dialog.kind]} busy={busy} onClose={()=>setDialog(null)}` |
| A-140-C036 | 98 | `p`  | `role="alert" className="cb-error"` |
| A-140-C037 | 99 | `button` ยืนยันยกเลิก | `disabled={busy} className="cb-danger" onClick={()=>void mutate(&#96;/api/car-booking/bookings/${dialog.booking!.id}/cancel&#96;,{},"POST","ยกเลิกการจองเรียบร้อยแล้ว")}` |
| A-140-C038 | 99 | `button` กลับ | `disabled={busy} onClick={()=>setDialog(null)}` |
| A-140-C039 | 100 | `ReturnForm`  | `booking={dialog.booking!} floor={returnParkingFloor(cars.find(c=>c.car_id===dialog.booking!.carId)?.parking_floor \|\| null,floors)} floors={floors} busy={busy} onSave={body=>mutate(&#96;/api/car-booking/bookings/${dialog.booking!.id}/return&#96;,body,"POST","คืนรถเรียบร้อยแล้ว")}` |
| A-140-C040 | 101 | `LogForm`  | `busy={busy} onSave={body=>mutate(&#96;/api/car-booking/bookings/${dialog.booking!.id}/logs&#96;,body,"POST","บันทึกระหว่างทางแล้ว")}` |
| A-140-C041 | 103 | `CarForm`  | `vehicle={dialog.car} floors={floors} busy={busy} onSave={body=>mutate(&#96;/api/car-booking/cars${dialog.car?&#96;/${dialog.car.car_id}&#96;:""}&#96;,body,dialog.car?"PATCH":"POST","บันทึกข้อมูลรถแล้ว")}` |
| A-140-C042 | 109 | `form`  | `onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);void onSave({actualReturnTime:bangkokISO(String(data.get("returnTime"))),parkingFloor:String(data.get("parkingFloor")),mileage:String(data.get("mileage")),refueled:fuel,...(fuel?{fuelMileage:String(data.get("fuelMileage")),fuelLiters:String(data.get("fuelLiters")),fuelAmount:String(data.get("fuelAmount"))}:{})});}}` |
| A-140-C043 | 109 | `input`  | `name="returnTime" type="datetime-local" required defaultValue={bangkokInput()}` |
| A-140-C044 | 109 | `select`  | `name="parkingFloor" required defaultValue={floor}` |
| A-140-C045 | 109 | `input`  | `name="mileage" type="number" min="0" step="any" required inputMode="decimal"` |
| A-140-C046 | 109 | `input`  | `type="checkbox" checked={fuel} onChange={e=>setFuel(e.target.checked)}` |
| A-140-C047 | 109 | `button` ยืนยันคืนรถ | `disabled={busy} type="submit" className="cb-primary"` |
| A-140-C048 | 111 | `input`  | `name="fuelMileage" type="number" min="0" step="any" required inputMode="decimal"` |
| A-140-C049 | 111 | `input`  | `name="fuelLiters" type="number" min="0.001" step="any" required inputMode="decimal"` |
| A-140-C050 | 111 | `input`  | `name="fuelAmount" type="number" min="0.01" step="any" required inputMode="decimal"` |
| A-140-C051 | 115 | `form`  | `onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);void onSave({logTime:bangkokISO(String(data.get("logTime"))),logType:type,location:String(data.get("location")),mileage:String(data.get("mileage")),note:String(data.get("note")),refueled:fuel,...(type==="fuel"\|\|fuel?{fuelLiters:String(data.get("fuelLiters")),fuelAmount:String(data.get("fuelAmount"))}:{}),...(gps \|\| {})});}}` |
| A-140-C052 | 115 | `input`  | `name="logTime" type="datetime-local" required defaultValue={bangkokInput()}` |
| A-140-C053 | 115 | `select`  | `value={type} onChange={e=>setType(e.target.value)}` |
| A-140-C054 | 115 | `input`  | `name="location" required maxLength={2000}` |
| A-140-C055 | 115 | `input`  | `name="mileage" type="number" min="0" step="any" required inputMode="decimal"` |
| A-140-C056 | 115 | `input`  | `type="checkbox" checked={fuel} onChange={e=>setFuel(e.target.checked)}` |
| A-140-C057 | 115 | `textarea`  | `name="note" maxLength={4000}` |
| A-140-C058 | 115 | `button`  | `type="button" disabled={locating \|\| busy} onClick={locate}` |
| A-140-C059 | 115 | `button` นำพิกัดออก | `type="button" onClick={()=>{setGps(null);setNotice("นำพิกัดออกแล้ว");}}` |
| A-140-C060 | 115 | `p`  | `role="status" className="cb-muted"` |
| A-140-C061 | 115 | `button` บันทึกการเดินทาง | `disabled={busy \|\| locating} type="submit" className="cb-primary"` |
| A-140-C062 | 117 | `form`  | `onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);void onSave({licensePlate:String(data.get("plate")),parkingFloor:String(data.get("floor")) \|\| null,latestMileage:String(data.get("mileage")),isActive:data.get("active")==="on"});}}` |
| A-140-C063 | 117 | `input`  | `name="plate" required maxLength={80} defaultValue={vehicle?.license_plate}` |
| A-140-C064 | 117 | `select`  | `name="floor" defaultValue={returnParkingFloor(vehicle?.parking_floor \|\| null,floors)}` |
| A-140-C065 | 117 | `input`  | `name="mileage" type="number" min="0" step="any" required defaultValue={vehicle?.latest_mileage \|\| "0"}` |
| A-140-C066 | 117 | `input`  | `name="active" type="checkbox" defaultChecked={vehicle?.is_active ?? true}` |
| A-140-C067 | 117 | `button` บันทึกรถ | `className="cb-primary" disabled={busy} type="submit"` |
| A-140-C068 | 122 | `p` กำลังโหลดบันทึก… | `role="status"` |
| A-140-C069 | 122 | `p`  | `role="alert"` |
| A-140-C070 | 122 | `CarJourneyMap`  | `logs={rows}` |
| A-140-C071 | 122 | `p` ยังไม่มี | `role="status"` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-140-T001 | 28 | `[tab,setTab]=useState("book")` |
| A-140-T002 | 28 | `[cars,setCars]=useState<Vehicle[]>([])` |
| A-140-T003 | 28 | `[bookings,setBookings]=useState<Reservation[]>([])` |
| A-140-T004 | 28 | `[calendar,setCalendar]=useState<CalendarEvent[]>([])` |
| A-140-T005 | 28 | `[floors,setFloors]=useState<string[]>([])` |
| A-140-T006 | 28 | `[floorVersion,setFloorVersion]=useState(1)` |
| A-140-T007 | 29 | `[month,setMonth]=useState(()=>bangkokInput().slice(0,7))` |
| A-140-T008 | 29 | `[start,setStart]=useState(()=>bangkokInput())` |
| A-140-T009 | 29 | `[end,setEnd]=useState(()=>bangkokInput(new Date(Date.now()+3600000)))` |
| A-140-T010 | 29 | `[available,setAvailable]=useState<Vehicle[]\|null>(null)` |
| A-140-T011 | 29 | `[availableRange,setAvailableRange]=useState("")` |
| A-140-T012 | 29 | `[selectedCar,setSelectedCar]=useState("")` |
| A-140-T013 | 29 | `[destination,setDestination]=useState("")` |
| A-140-T014 | 30 | `[calendarDate,setCalendarDate]=useState(()=>bangkokInput().slice(0,10))` |
| A-140-T015 | 30 | `[calendarView,setCalendarView]=useState<CarCalendarView>("month")` |
| A-140-T016 | 31 | `[now,setNow]=useState(()=>Date.now())` |
| A-140-T017 | 33 | `[busy,setBusy]=useState(false)` |
| A-140-T018 | 33 | `[loading,setLoading]=useState(true)` |
| A-140-T019 | 33 | `[message,setMessage]=useState("")` |
| A-140-T020 | 33 | `[error,setError]=useState("")` |
| A-140-T021 | 33 | `[dialog,setDialog]=useState<Dialog\|null>(null)` |
| A-140-T022 | 33 | `[query,setQuery]=useState("")` |
| A-140-T023 | 33 | `[status,setStatus]=useState("all")` |
| A-140-T024 | 33 | `[floorText,setFloorText]=useState("")` |
| A-140-T025 | 34 | `[acceptNewBookings,setAcceptNewBookings]=useState(true)` |
| A-140-T026 | 108 | `[fuel,setFuel]=useState(false)` |
| A-140-T027 | 113 | `[type,setType]=useState("other")` |
| A-140-T028 | 113 | `[fuel,setFuel]=useState(false)` |
| A-140-T029 | 113 | `[gps,setGps]=useState<{gpsLatitude:number;gpsLongitude:number;gpsAccuracyMeters:number}\|null>(null)` |
| A-140-T030 | 113 | `[locating,setLocating]=useState(false)` |
| A-140-T031 | 113 | `[notice,setNotice]=useState("ยังไม่ได้แนบพิกัด สามารถบันทึกได้")` |
| A-140-T032 | 119 | `[rows,setRows]=useState<JourneyLog[]>([])` |
| A-140-T033 | 119 | `[error,setError]=useState("")` |
| A-140-T034 | 119 | `[loading,setLoading]=useState(true)` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-140-E001 | 21 | `sessionFetch(path,{method,cache:"no-store",headers:body===undefined?undefined:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)})` |
| A-140-E002 | 46 | `sessionFetch(&#96;/api/car-booking/bookings?${filter}&offset=${offset}&#96;,{cache:"no-store"})` |
| A-140-E003 | 120 | `sessionFetch(&#96;/api/car-booking/bookings/${bookingId}/${gps?"gps":"logs"}?offset=${offset}&#96;,{cache:"no-store"})` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-140-B001 | 21 | `body===undefined` |
| A-140-B002 | 21 | `body===undefined` |
| A-140-B003 | 22 | `!response.ok` |
| A-140-B004 | 26 | `admin` |
| A-140-B005 | 46 | `!response.ok` |
| A-140-B006 | 52 | `!seen.has(row.id)` |
| A-140-B007 | 53 | `sequence!==refreshSequence.current.value` |
| A-140-B008 | 55 | `sequence===refreshSequence.current.value` |
| A-140-B009 | 55 | `e instanceof Error` |
| A-140-B010 | 56 | `sequence===refreshSequence.current.value` |
| A-140-B011 | 62 | `e instanceof Error` |
| A-140-B012 | 71 | `to<=from` |
| A-140-B013 | 74 | `e instanceof Error` |
| A-140-B014 | 78 | `tab===item.id` |
| A-140-B015 | 79 | `e.target.value` |
| A-140-B016 | 81 | `await mutate("/api/car-booking/bookings",{carId:selectedCar,destination,intervals:[{startTime:bangkokISO(start),endTime:bangkokISO(end)}]},"POST","จองรถเรียบร้อยแล้ว")` |
| A-140-B017 | 87 | `busy` |
| A-140-B018 | 89 | `tab==="return"` |
| A-140-B019 | 89 | `tab==="all"` |
| A-140-B020 | 95 | `tab==="admin"` |
| A-140-B021 | 95 | `c.is_active` |
| A-140-B022 | 97 | `dialog.car` |
| A-140-B023 | 103 | `dialog.car` |
| A-140-B024 | 103 | `dialog.car` |
| A-140-B025 | 109 | `fuel` |
| A-140-B026 | 114 | `!navigator.geolocation` |
| A-140-B027 | 115 | `type==="fuel"\|\|fuel` |
| A-140-B028 | 115 | `locating` |
| A-140-B029 | 120 | `gps` |
| A-140-B030 | 120 | `!response.ok` |
| A-140-B031 | 120 | `live` |
| A-140-B032 | 120 | `live` |
| A-140-B033 | 120 | `e instanceof Error` |
| A-140-B034 | 120 | `live` |
| A-140-B035 | 122 | `gps` |
| A-140-B036 | 125 | `status === "completed"` |
| A-140-B037 | 125 | `status === "cancelled"` |

## A-141 — `src/features/car-booking/car-calendar.tsx`

- Status: PLANNED. Consumers: S-001, S-008.
- Normalized UTF-8/LF source SHA-256: `a0646bb7ee6db362695d694ed964b786baa384d7e21c4e463d9b56e5ef9db91c`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-141-F001 | 6 | `CarCalendar` | `export function CarCalendar(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-141-C001 | 11 | `button` ก่อนหน้า | `disabled={loading} onClick={()=>{setSelected(null);onDate(moveCarCalendar(anchor,view,-1));}}` |
| A-141-C002 | 11 | `button` วันนี้ | `disabled={loading} onClick={()=>{setSelected(null);onDate(bangkokInput().slice(0,10));}}` |
| A-141-C003 | 11 | `button` ถัดไป | `disabled={loading} onClick={()=>{setSelected(null);onDate(moveCarCalendar(anchor,view,1));}}` |
| A-141-C004 | 11 | `select`  | `value={view} disabled={loading} onChange={e=>{setSelected(null);onView(e.target.value as CarCalendarView);}}` |
| A-141-C005 | 13 | `p` · → | `role="status" className="cb-calendar-detail"` |
| A-141-C006 | 19 | `button`  | `type="button" key={&#96;${event.car_id}-${i}&#96;} className={&#96;cb-calendar-event cb-tone-${Math.max(0,legend.findIndex(([id])=>id===event.car_id))%5}&#96;} onClick={()=>setSelected(event)} aria-label={&#96;${event.license_plate} ${thaiCarDate(event.start_time)} ถึง ${thaiCarDate(event.end_time)}&#96;}` |
| A-141-C007 | 20 | `p` ยังไม่มีช่วงไม่ว่างในช่วงนี้ | `role="status"` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-141-T001 | 7 | `[selected,setSelected]=useState<CarCalendarEvent\|null>(null)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-141-B001 | 9 | `view==="month"` |
| A-141-B002 | 19 | `day.slice(0,7)!==anchor.slice(0,7)` |
| A-141-B003 | 19 | `bangkokInput(new Date(event.start_time)).slice(0,10)===day` |
| A-141-B004 | 19 | `bangkokInput(new Date(event.end_time)).slice(0,10)===day` |

## A-142 — `src/features/car-booking/car-journey-map.tsx`

- Status: PLANNED. Consumers: S-001, S-008.
- Normalized UTF-8/LF source SHA-256: `ca6f7e187cd9f9944f04043817ae3160c989734293a27cb839b61c378433bc24`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-142-F001 | 4 | `project` | `function project(lat:number,lng:number,zoom:number) ` |
| A-142-F002 | 8 | `CarJourneyMap` | `export function CarJourneyMap(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-142-C001 | 12 | `select`  | `value={selected} onChange={e=>setSelected(e.target.value)}` |
| A-142-C002 | 12 | `button` + | `type="button" aria-label="ขยายแผนที่" disabled={zoom>=18} onClick={()=>setZoom(value=>value+1)}` |
| A-142-C003 | 12 | `button` − | `type="button" aria-label="ย่อแผนที่" disabled={zoom<=2} onClick={()=>setZoom(value=>value-1)}` |
| A-142-C004 | 13 | `svg`  | `viewBox="0 0 768 512" role="img" aria-label={&#96;แผนที่พิกัด ${log.location}&#96;} className="cb-map-canvas"` |
| A-142-C005 | 13 | `image`  | `key={&#96;${zoom}-${tile.x}-${tile.y}&#96;} href={tile.url} x={tile.x*256-origin.x} y={tile.y*256-origin.y} width="256" height="256" onError={()=>setTileError(true)}` |
| A-142-C006 | 14 | `p` โหลดพื้นแผนที่ไม่สำเร็จ ยังดูพิกัดในรายการด้านล่างได้ | `role="status"` |
| A-142-C007 | 14 | `a` © OpenStreetMap contributors | `href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer"` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-142-T001 | 9 | `[selected,setSelected]=useState(logs[0].id)` |
| A-142-T002 | 9 | `[zoom,setZoom]=useState(12)` |
| A-142-T003 | 9 | `[tileError,setTileError]=useState(false)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-142-B001 | 11 | `y>=0&&y<limit` |
| A-142-B002 | 13 | `row.id===selected` |

## A-143 — `src/features/car-booking/car-reports.tsx`

- Status: PLANNED. Consumers: S-001, S-008.
- Normalized UTF-8/LF source SHA-256: `80b6f2194c6249ce35f8e15e0cba7e23cdc30ef4321be03e768c1279f79844b4`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-143-F001 | 10 | `CarReports` | `export function CarReports(` |
| A-143-F002 | 23 | `queue` | `async(action:"retry"\|"rebuild")` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-143-C001 | 31 | `input`  | `type="month" disabled={all\|\|loading} value={month} onChange={e=>{if(e.target.value){setMonth(e.target.value);setOffset(0);}}}` |
| A-143-C002 | 31 | `input`  | `type="checkbox" checked={all} disabled={loading} onChange={e=>{setAll(e.target.checked);setOffset(0);}}` |
| A-143-C003 | 31 | `button` โหลดรายงานใหม่ | `disabled={loading} onClick={()=>void load()}` |
| A-143-C004 | 31 | `a` ดาวน์โหลด OSP CSV | `className="cb-link" href={&#96;/api/car-booking/reports?month=${selection}&format=csv&#96;}` |
| A-143-C005 | 33 | `p` กำลังโหลดรายงาน… | `role="status"` |
| A-143-C006 | 33 | `p`  | `role="alert" className="cb-error"` |
| A-143-C007 | 33 | `p`  | `role="status" className="cb-success"` |
| A-143-C008 | 35 | `div`  | `className="cb-table-wrap" tabIndex={0} role="region" aria-label="ตารางรายงาน เลื่อนดูได้ด้วยคีย์บอร์ด"` |
| A-143-C009 | 35 | `table`  | `` |
| A-143-C010 | 37 | `div`  | `className="cb-table-wrap" tabIndex={0} role="region" aria-label="ตารางรายงาน เลื่อนดูได้ด้วยคีย์บอร์ด"` |
| A-143-C011 | 37 | `table`  | `` |
| A-143-C012 | 38 | `div`  | `className="cb-table-wrap" tabIndex={0} role="region" aria-label="ตารางรายงาน เลื่อนดูได้ด้วยคีย์บอร์ด"` |
| A-143-C013 | 38 | `table`  | `className="cb-osp-table"` |
| A-143-C014 | 38 | `details`  | `` |
| A-143-C015 | 38 | `summary` ดูบันทึก | `` |
| A-143-C016 | 39 | `button` หน้ารายงานก่อนหน้า | `disabled={loading\|\|offset===0} onClick={()=>setOffset(Math.max(0,offset-50))}` |
| A-143-C017 | 39 | `button` หน้ารายงานถัดไป | `disabled={loading\|\|next===null} onClick={()=>{if(next!==null)setOffset(next);}}` |
| A-143-C018 | 40 | `button` ลองส่งรายการที่ค้างอีกครั้ง | `disabled={loading} onClick={()=>void queue("retry")}` |
| A-143-C019 | 40 | `details`  | `` |
| A-143-C020 | 40 | `summary` สร้างรายงานทั้งชีตใหม่ | `` |
| A-143-C021 | 40 | `button` ยืนยันสร้างรายงานทั้งชีตใหม่ | `disabled={loading} onClick={()=>void queue("rebuild")}` |
| A-143-C022 | 40 | `details`  | `` |
| A-143-C023 | 40 | `summary` ดูงานส่งล่าสุด (ไม่เกิน 20 รายการ) | `` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-143-T001 | 11 | `[month,setMonth]=useState(()=>bangkokInput().slice(0,7))` |
| A-143-T002 | 11 | `[all,setAll]=useState(false)` |
| A-143-T003 | 11 | `[offset,setOffset]=useState(0)` |
| A-143-T004 | 11 | `[report,setReport]=useState<Report\|null>(null)` |
| A-143-T005 | 11 | `[stats,setStats]=useState<Dashboard\|null>(null)` |
| A-143-T006 | 11 | `[sync,setSync]=useState<Sync\|null>(null)` |
| A-143-T007 | 11 | `[loading,setLoading]=useState(true)` |
| A-143-T008 | 11 | `[error,setError]=useState("")` |
| A-143-T009 | 11 | `[notice,setNotice]=useState("")` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-143-B001 | 12 | `all` |
| A-143-B002 | 16 | `dashboard` |
| A-143-B003 | 17 | `current!==sequence.current.value` |
| A-143-B004 | 18 | `dashboard` |
| A-143-B005 | 19 | `current===sequence.current.value` |
| A-143-B006 | 19 | `e instanceof Error` |
| A-143-B007 | 20 | `current===sequence.current.value` |
| A-143-B008 | 26 | `e instanceof Error` |
| A-143-B009 | 28 | `dashboard` |
| A-143-B010 | 30 | `dashboard` |
| A-143-B011 | 31 | `e.target.value` |
| A-143-B012 | 38 | `i===18&&value` |
| A-143-B013 | 39 | `next!==null` |
| A-143-B014 | 40 | `sync.configured` |
| A-143-B015 | 40 | `job.kind==="rebuild"` |
| A-143-B016 | 40 | `job.error_code` |

## A-144 — `src/features/work/components/admin-panels.tsx`

- Status: PLANNED. Consumers: S-002.
- Normalized UTF-8/LF source SHA-256: `8926001dedd5e38ac5b0ff9980563a874d9457b8b92463d87edf8897fdc2eafe`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-144-F001 | 7 | `AdminForm` | `function AdminForm(` |
| A-144-F002 | 11 | `Version` | `function Version(` |
| A-144-F003 | 12 | `CalendarPanel` | `function CalendarPanel(` |
| A-144-F004 | 18 | `KpiPanel` | `function KpiPanel(` |
| A-144-F005 | 22 | `PersonalPanel` | `function PersonalPanel(` |
| A-144-F006 | 29 | `RecalculationPanel` | `function RecalculationPanel(` |
| A-144-F007 | 34 | `SystemsPanel` | `function SystemsPanel(` |
| A-144-F008 | 36 | `choose` | `function choose(value:typeof edit)` |
| A-144-F009 | 39 | `RestoreForm` | `function RestoreForm(` |
| A-144-F010 | 43 | `WorkAdminPanels` | `export function WorkAdminPanels(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-144-C001 | 9 | `form`  | `action={action} className="work-admin-form"` |
| A-144-C002 | 9 | `input`  | `type="hidden" name="kind" value={kind}` |
| A-144-C003 | 9 | `button`  | `className="primary" disabled={pending}` |
| A-144-C004 | 9 | `button` ล้างฟอร์ม | `className="secondary-action" type="reset" disabled={pending}` |
| A-144-C005 | 9 | `p`  | `role="status"` |
| A-144-C006 | 11 | `input`  | `type="hidden" name="id" value={id ?? ""}` |
| A-144-C007 | 11 | `input`  | `type="hidden" name="expectedVersion" value={version ?? ""}` |
| A-144-C008 | 16 | `input`  | `value={year} onChange={e=>setYear(e.target.value)} placeholder="2026"` |
| A-144-C009 | 16 | `select`  | `value={source} onChange={e=>setSource(e.target.value)}` |
| A-144-C010 | 16 | `select`  | `value={active} onChange={e=>setActive(e.target.value)}` |
| A-144-C011 | 16 | `button` แก้ไข / ปิดใช้งาน | `type="button" className="text-btn" onClick={()=>setEdit(r)}` |
| A-144-C012 | 16 | `button` เพิ่มวันหยุด | `type="button" className="secondary-action" onClick={()=>setEdit(undefined)}` |
| A-144-C013 | 16 | `AdminForm`  | `key={&#96;${edit?.id}:${edit?.version}&#96;} kind="holiday" title={edit?"แก้ไขวันหยุด":"เพิ่มวันหยุด"}` |
| A-144-C014 | 16 | `input`  | `name="holidayDate" type="date" required defaultValue={edit?.holidayDate}` |
| A-144-C015 | 16 | `input`  | `name="name" required maxLength={180} defaultValue={edit?.name}` |
| A-144-C016 | 16 | `select`  | `name="source" defaultValue={edit?.source??"company"}` |
| A-144-C017 | 16 | `input`  | `type="checkbox" name="isActive" defaultChecked={edit?.isActive??true}` |
| A-144-C018 | 20 | `button` แก้ไข / ปิดใช้งาน | `type="button" className="text-btn" onClick={()=>setEdit(r)}` |
| A-144-C019 | 20 | `button` เพิ่มกฎ | `type="button" className="secondary-action" onClick={()=>setEdit(undefined)}` |
| A-144-C020 | 20 | `AdminForm`  | `key={&#96;${edit?.id}:${edit?.version}&#96;} kind="rule" title={edit?"สร้างรุ่นใหม่":"เพิ่ม KPI"}` |
| A-144-C021 | 20 | `input`  | `type="hidden" name="metricId" value={edit?.metricId??""}` |
| A-144-C022 | 20 | `input`  | `type="hidden" name="expectedVersion" value={edit?.version??0}` |
| A-144-C023 | 20 | `select`  | `name="teamId" defaultValue={edit?.teamId??""} required` |
| A-144-C024 | 20 | `input`  | `name="mainKpi" required maxLength={180} defaultValue={edit?.mainKpi}` |
| A-144-C025 | 20 | `input`  | `name="subKpi" required maxLength={180} defaultValue={edit?.subKpi}` |
| A-144-C026 | 20 | `input`  | `name="slaDays" type="number" min={0} max={366} required defaultValue={edit?.slaDays}` |
| A-144-C027 | 20 | `input`  | `name="mainWeight" type="number" step="0.000001" min="0.000001" max={100} required defaultValue={edit?.mainWeight}` |
| A-144-C028 | 20 | `input`  | `type="checkbox" name="active" defaultChecked={edit?.status!=="retired"}` |
| A-144-C029 | 27 | `select`  | `value={personKey} onChange={e=>{setPersonKey(e.target.value);setAll(false);}}` |
| A-144-C030 | 27 | `AdminForm`  | `key={&#96;${personKey}:${latest?.version}:${all}&#96;} kind="personal" title="น้ำหนักของคนนี้ (%)"` |
| A-144-C031 | 27 | `input`  | `type="hidden" name="userId" value={person.id}` |
| A-144-C032 | 27 | `input`  | `type="hidden" name="teamId" value={person.teamId}` |
| A-144-C033 | 27 | `input`  | `type="hidden" name="expectedVersion" value={latest?.version??0}` |
| A-144-C034 | 27 | `button` ใช้ KPI ที่แสดงทั้งหมด | `type="button" className="secondary-action" onClick={()=>setAll(true)}` |
| A-144-C035 | 27 | `input`  | `type="hidden" name="metricIds" value={r.metricId}` |
| A-144-C036 | 27 | `input`  | `type="checkbox" name={&#96;enabled:${r.metricId}&#96;} defaultChecked={all\|\|previous?.enabled\|\|false}` |
| A-144-C037 | 27 | `input`  | `type="number" name={&#96;weight:${r.metricId}&#96;} min="0.000001" max={100} step="0.000001" defaultValue={previous?.weight??r.mainWeight} required` |
| A-144-C038 | 32 | `form`  | `action={previewAction}` |
| A-144-C039 | 32 | `input`  | `type="hidden" name="kind" value={kind}` |
| A-144-C040 | 32 | `button`  | `className="secondary-action" disabled={previewPending\|\|confirmPending}` |
| A-144-C041 | 32 | `p`  | `role="status"` |
| A-144-C042 | 32 | `table`  | `` |
| A-144-C043 | 32 | `form`  | `action={confirmAction}` |
| A-144-C044 | 32 | `input`  | `type="hidden" name="previewId" value={preview.previewId}` |
| A-144-C045 | 32 | `input`  | `type="checkbox" name="confirm" required` |
| A-144-C046 | 32 | `button`  | `className="primary" disabled={confirmPending\|\|previewPending\|\|result.ok}` |
| A-144-C047 | 32 | `p`  | `role="status"` |
| A-144-C048 | 37 | `button` แก้ไข / ซ่อน | `type="button" className="text-btn" onClick={()=>choose(r)}` |
| A-144-C049 | 37 | `button` Duplicate | `type="button" className="text-btn" onClick={()=>choose({...r,id:undefined,version:undefined,name:&#96;${r.name} (สำเนา)&#96;})}` |
| A-144-C050 | 37 | `button` เพิ่ม / ล้างฟอร์ม | `type="button" className="secondary-action" onClick={()=>choose(undefined)}` |
| A-144-C051 | 37 | `AdminForm`  | `key={revision} kind="system" title={edit?.id?"แก้ไขลิงก์":"เพิ่มลิงก์"}` |
| A-144-C052 | 37 | `input`  | `name="name" required maxLength={180} defaultValue={edit?.name}` |
| A-144-C053 | 37 | `textarea`  | `name="description" maxLength={1000} defaultValue={edit?.description}` |
| A-144-C054 | 37 | `input`  | `name="url" required maxLength={2000} defaultValue={edit?.url} placeholder="https:// หรือ /path"` |
| A-144-C055 | 37 | `input`  | `name="icon" defaultValue={edit?.icon??"link"} maxLength={80}` |
| A-144-C056 | 37 | `select`  | `name="status" defaultValue={edit?.status??"Active"}` |
| A-144-C057 | 37 | `input`  | `type="checkbox" name="visibleToAll" defaultChecked={edit?.visibleToAll}` |
| A-144-C058 | 37 | `input`  | `type="checkbox" name="roleIds" value={r.id} defaultChecked={edit?.roleIds?.includes(r.id)}` |
| A-144-C059 | 37 | `input`  | `type="checkbox" name="teamIds" value={r.id} defaultChecked={edit?.teamIds?.includes(r.id)}` |
| A-144-C060 | 41 | `form`  | `action={action}` |
| A-144-C061 | 41 | `input`  | `type="hidden" name="taskId" value={task.id}` |
| A-144-C062 | 41 | `input`  | `type="hidden" name="version" value={task.version}` |
| A-144-C063 | 41 | `input`  | `type="hidden" name="idempotencyKey" value={&#96;restore:${task.id}:${task.version}&#96;}` |
| A-144-C064 | 41 | `input`  | `name="reason" required maxLength={1000}` |
| A-144-C065 | 41 | `button` กู้คืนงาน | `className="secondary-action" disabled={pending}` |
| A-144-C066 | 41 | `p`  | `role="status"` |
| A-144-C067 | 48 | `CalendarPanel`  | `data={data}` |
| A-144-C068 | 49 | `AdminForm`  | `key={&#96;${r.id}:${r.version}&#96;} kind="announcement" title="แก้ไขประกาศ"` |
| A-144-C069 | 49 | `textarea`  | `name="message" defaultValue={r.message} maxLength={4000}` |
| A-144-C070 | 49 | `input`  | `name="isActive" type="checkbox" defaultChecked={r.isActive}` |
| A-144-C071 | 49 | `AdminForm`  | `kind="announcement" title="เพิ่มประกาศ"` |
| A-144-C072 | 49 | `textarea`  | `name="message" required maxLength={4000}` |
| A-144-C073 | 49 | `input`  | `name="isActive" type="checkbox"` |
| A-144-C074 | 50 | `RestoreForm`  | `key={task.id} task={task}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-144-T001 | 8 | `[state,action,pending]=useActionState(saveWorkAdminAction,initial)` |
| A-144-T002 | 13 | `[edit,setEdit]=useState<WorkAdminData["calendar"][number]\|undefined>()` |
| A-144-T003 | 14 | `[year,setYear]=useState("")` |
| A-144-T004 | 14 | `[source,setSource]=useState("")` |
| A-144-T005 | 14 | `[active,setActive]=useState("")` |
| A-144-T006 | 19 | `[edit,setEdit]=useState<WorkAdminData["catalog"][number]\|undefined>()` |
| A-144-T007 | 23 | `[personKey,setPersonKey]=useState("")` |
| A-144-T008 | 23 | `[all,setAll]=useState(false)` |
| A-144-T009 | 30 | `[preview,previewAction,previewPending]=useActionState(previewWorkAdminAction,initial)` |
| A-144-T010 | 31 | `[result,confirmAction,confirmPending]=useActionState(confirmWorkAdminAction,initial)` |
| A-144-T011 | 35 | `[edit,setEdit]=useState<Partial<WorkAdminData["links"][number]>\|undefined>()` |
| A-144-T012 | 35 | `[revision,setRevision]=useState(0)` |
| A-144-T013 | 40 | `[state,action,pending]=useActionState(restoreWorkTaskAction,{ok:false,message:""} as WorkActionState)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-144-B001 | 9 | `pending` |
| A-144-B002 | 16 | `r.isActive` |
| A-144-B003 | 16 | `edit` |
| A-144-B004 | 20 | `r.status==="active"` |
| A-144-B005 | 20 | `edit` |
| A-144-B006 | 32 | `kind==="deadlines"` |
| A-144-B007 | 32 | `previewPending` |
| A-144-B008 | 32 | `kind==="deadlines"` |
| A-144-B009 | 32 | `kind==="deadlines"` |
| A-144-B010 | 32 | `confirmPending` |
| A-144-B011 | 37 | `edit?.id` |
| A-144-B012 | 50 | `data.deleted.length` |

## A-145 — `src/features/work/components/report-tools.tsx`

- Status: PLANNED. Consumers: S-031, S-033.
- Normalized UTF-8/LF source SHA-256: `bfa223c53255458bb07eee01ab7a566e9244e9c4db3228e48524204a522bf0d9`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-145-F001 | 3 | `WorkReportTools` | `export function WorkReportTools() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-145-C001 | 5 | `button` พิมพ์ | `type="button" className="secondary-action" onClick={() => window.print()}` |
| A-145-C002 | 5 | `a` Export CSV | `className="secondary-action" href={&#96;/api/work/export?${params.toString()}&#96;}` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-145-E001 | 5 | `window.print()` |

## A-146 — `src/features/work/components/task-actions.tsx`

- Status: PLANNED. Consumers: S-029, S-031, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `41f12cd4e4559c2dd6f4988b408a19088e21ed6c058307c0a51827194b802b70`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-146-F001 | 14 | `IdentityFields` | `function IdentityFields(` |
| A-146-F002 | 17 | `TaskActionControls` | `export function TaskActionControls(` |
| A-146-F003 | 32 | `open` | `function open(event: React.MouseEvent<HTMLButtonElement>, next: NonNullable<typeof choice>) ` |
| A-146-F004 | 47 | `TaskNoteForm` | `export function TaskNoteForm(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-146-C001 | 15 | `input`  | `type="hidden" name="taskId" value={task.id}` |
| A-146-C002 | 15 | `input`  | `type="hidden" name="version" value={task.version}` |
| A-146-C003 | 15 | `input`  | `type="hidden" name="idempotencyKey" value={&#96;${task.id}:${task.version}:${action}&#96;}` |
| A-146-C004 | 35 | `button`  | `key={item.status} type="button" className="secondary-action" onClick={event => open(event, { kind: "transition", status: item.status, label: item.label })}` |
| A-146-C005 | 36 | `button` แก้ไขงาน | `type="button" className="secondary-action" onClick={event => open(event, { kind: "edit", label: "แก้ไขงาน" })}` |
| A-146-C006 | 37 | `button` ลบงาน | `type="button" className="text-btn work-danger-action" onClick={event => open(event, { kind: "delete", label: "ลบงาน" })}` |
| A-146-C007 | 38 | `dialog`  | `ref={dialog} className="work-command-dialog" aria-labelledby={&#96;command-${task.id}&#96;} onClose={() => { setChoice(null); opener.current?.focus(); }} onCancel={event => { if (pending) event.preventDefault(); }}` |
| A-146-C008 | 39 | `form`  | `action={action}` |
| A-146-C009 | 39 | `IdentityFields`  | `task={task} action={&#96;${choice.kind}:${choice.status ?? ""}&#96;}` |
| A-146-C010 | 40 | `input`  | `type="hidden" name="toStatus" value={choice.status}` |
| A-146-C011 | 40 | `input`  | `name="fundNumber" required maxLength={180}` |
| A-146-C012 | 40 | `input`  | `name="amount" type="number" min={0} step="0.01" required` |
| A-146-C013 | 40 | `textarea`  | `name="reason" maxLength={1000} required={choice.status === "blocked" \|\| choice.status === "cancelled" \|\| !capabilities.accept} autoFocus rows={3}` |
| A-146-C014 | 41 | `textarea`  | `name="reason" required maxLength={1000} autoFocus rows={3}` |
| A-146-C015 | 42 | `input`  | `name="title" defaultValue={task.title} required minLength={3} maxLength={180} autoFocus` |
| A-146-C016 | 42 | `input`  | `name="jobCode" defaultValue={task.jobCode ?? task.title} required maxLength={180}` |
| A-146-C017 | 42 | `textarea`  | `name="description" defaultValue={task.description ?? ""} maxLength={4000}` |
| A-146-C018 | 42 | `input`  | `name="mainKpi" defaultValue={task.mainKpi ?? ""} maxLength={180}` |
| A-146-C019 | 42 | `input`  | `name="subKpi" defaultValue={task.subKpi ?? ""} maxLength={180}` |
| A-146-C020 | 42 | `select`  | `name="ownerId" defaultValue={task.ownerId} required` |
| A-146-C021 | 42 | `select`  | `name="ruleVersionId" defaultValue=""` |
| A-146-C022 | 42 | `input`  | `name="ssrNumber" maxLength={180} defaultValue={String(task.extraData?.ssrNumber??"")}` |
| A-146-C023 | 42 | `input`  | `name="ospNumber" maxLength={180} defaultValue={String(task.extraData?.ospNumber??"")}` |
| A-146-C024 | 42 | `input`  | `type="date" name="dueAt" defaultValue={task.dueAt ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date(task.dueAt)) : ""}` |
| A-146-C025 | 42 | `select`  | `name="priority" defaultValue={task.priority}` |
| A-146-C026 | 43 | `button`  | `className="primary" disabled={pending}` |
| A-146-C027 | 43 | `button` ปิด | `type="button" className="secondary-action" disabled={pending} onClick={() => dialog.current?.close()}` |
| A-146-C028 | 43 | `p`  | `role="status"` |
| A-146-C029 | 45 | `span`  | `role="status"` |
| A-146-C030 | 51 | `form`  | `ref={formRef} action={action} className="work-note-form" aria-busy={pending}` |
| A-146-C031 | 51 | `textarea`  | `id={&#96;note-${task.id}&#96;} name="note" rows={3} maxLength={4000} placeholder="เขียนความคืบหน้าเพิ่มเติม" required` |
| A-146-C032 | 51 | `IdentityFields`  | `task={task} action="note"` |
| A-146-C033 | 51 | `button`  | `className="secondary-action" disabled={pending}` |
| A-146-C034 | 51 | `span`  | `role="status"` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-146-T001 | 18 | `[choice, setChoice] = useState<{ kind: "transition" \| "edit" \| "delete"; status?: string; label: string } \| null>(null)` |
| A-146-T002 | 19 | `[transitionState, transitionAction, transitioning] = useActionState(transitionWorkTaskAction, initial)` |
| A-146-T003 | 20 | `[editState, editAction, editing] = useActionState(editWorkTaskAction, initial)` |
| A-146-T004 | 21 | `[deleteState, deleteAction, deleting] = useActionState(deleteWorkTaskAction, initial)` |
| A-146-T005 | 48 | `[state, action, pending] = useActionState(addWorkTaskNoteAction, initial)` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-146-E001 | 30 | `dialog.current?.showModal()` |
| A-146-E002 | 31 | `dialog.current?.close()` |
| A-146-E003 | 43 | `dialog.current?.close()` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-146-B001 | 27 | `choice?.kind === "edit"` |
| A-146-B002 | 27 | `choice?.kind === "delete"` |
| A-146-B003 | 28 | `choice?.kind === "edit"` |
| A-146-B004 | 28 | `choice?.kind === "delete"` |
| A-146-B005 | 30 | `choice` |
| A-146-B006 | 31 | `state.ok` |
| A-146-B007 | 33 | `capabilities.update` |
| A-146-B008 | 38 | `pending` |
| A-146-B009 | 42 | `task.dueAt` |
| A-146-B010 | 43 | `pending` |
| A-146-B011 | 43 | `choice.kind === "delete"` |
| A-146-B012 | 51 | `pending` |

## A-147 — `src/features/work/components/task-kpi-fields.tsx`

- Status: PLANNED. Consumers: S-027, S-030, S-031.
- Normalized UTF-8/LF source SHA-256: `9894b92e72d75563f1c02ed3f9ac81fcdef5833d3e77884df7a6d4e2f37f5bd4`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-147-F001 | 3 | `TaskKpiFields` | `export function TaskKpiFields(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-147-C001 | 6 | `select`  | `required value={main} onChange={e=>{setMain(e.target.value);setSub("");}}` |
| A-147-C002 | 6 | `select`  | `required value={sub} onChange={e=>setSub(e.target.value)}` |
| A-147-C003 | 6 | `input`  | `name="ruleVersionId" type="hidden" value={selected?.id??""}` |
| A-147-C004 | 6 | `select`  | `name="workType" defaultValue="" required={sub.includes("แจ้ง Job ให้ผู้รับเหมา")}` |
| A-147-C005 | 6 | `input`  | `name="contractorName" maxLength={180}` |
| A-147-C006 | 6 | `input`  | `name="building" maxLength={180}` |
| A-147-C007 | 6 | `input`  | `name="client" maxLength={180}` |
| A-147-C008 | 6 | `input`  | `name="contractor" maxLength={180}` |
| A-147-C009 | 6 | `input`  | `name="ssrNumber" maxLength={180}` |
| A-147-C010 | 6 | `input`  | `name="ospNumber" maxLength={180}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-147-T001 | 4 | `[main,setMain]=useState("")` |
| A-147-T002 | 4 | `[sub,setSub]=useState("")` |

## A-148 — `src/features/work/components/task-table.tsx`

- Status: PLANNED. Consumers: S-029, S-031, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `93a753e6b97dedb7806ddf6da6b8316556cc3964c4793fcb9faaa4fe8914a325`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-148-F001 | 11 | `WorkTaskTable` | `export function WorkTaskTable(` |
| A-148-F002 | 17 | `WorkTaskDetail` | `export function WorkTaskDetail(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-148-C001 | 14 | `div`  | `className={workspace ? styles.scroll : "work-table-wrap"} role="region" aria-label="รายการงาน เลื่อนแนวนอนได้" tabIndex={0}` |
| A-148-C002 | 14 | `table`  | `className={workspace ? styles.table : "work-data-table"}` |
| A-148-C003 | 14 | `Link`  | `className={workspace ? styles.taskLink : "work-task-link"} href={&#96;/work?record=${task.id}&#96;}` |
| A-148-C004 | 14 | `StatusBadge`  | `label={task.statusLabel} tone={task.status === "completed" ? "success" : task.status === "blocked" ? "warning" : task.status === "cancelled" ? "danger" : task.status === "in_progress" ? "info" : "neutral"}` |
| A-148-C005 | 19 | `StatusBadge`  | `label={task.statusLabel} tone={task.status === "completed" ? "success" : task.status === "blocked" ? "warning" : task.status === "cancelled" ? "danger" : "info"}` |
| A-148-C006 | 19 | `TaskNoteForm`  | `task={task}` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-148-B001 | 13 | `!tasks.length` |
| A-148-B002 | 14 | `workspace` |
| A-148-B003 | 14 | `workspace` |
| A-148-B004 | 14 | `workspace` |
| A-148-B005 | 14 | `workspace` |
| A-148-B006 | 14 | `workspace` |
| A-148-B007 | 14 | `workspace` |
| A-148-B008 | 14 | `workspace` |
| A-148-B009 | 14 | `workspace` |
| A-148-B010 | 14 | `task.dueAt` |
| A-148-B011 | 14 | `task.status === "completed"` |
| A-148-B012 | 14 | `task.status === "blocked"` |
| A-148-B013 | 14 | `task.status === "cancelled"` |
| A-148-B014 | 14 | `task.status === "in_progress"` |
| A-148-B015 | 14 | `(caps.update \|\| caps.delete)` |
| A-148-B016 | 19 | `task.status === "completed"` |
| A-148-B017 | 19 | `task.status === "blocked"` |
| A-148-B018 | 19 | `task.status === "cancelled"` |
| A-148-B019 | 19 | `task.dueAt` |
| A-148-B020 | 19 | `task.notes?.length` |
| A-148-B021 | 19 | `(caps.update \|\| caps.note \|\| caps.delete)` |

## A-149 — `src/features/work/components/work-filters.tsx`

- Status: PLANNED. Consumers: S-027, S-028, S-029, S-032, S-033, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `fb3e1386f2cf0ef3d1468295a3ce88d99ceced145e5c11d82556e6e79fe31ed2`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-149-F001 | 7 | `WorkFiltersForm` | `export function WorkFiltersForm(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-149-C001 | 9 | `input`  | `type="number" name="year" min={2000} max={2200} defaultValue={filters.year}` |
| A-149-C002 | 9 | `select`  | `name="month" defaultValue={filters.month ?? ""}` |
| A-149-C003 | 9 | `select`  | `name="status" defaultValue={filters.status ?? ""}` |
| A-149-C004 | 9 | `select`  | `name="team" defaultValue={filters.team ?? ""}` |
| A-149-C005 | 9 | `select`  | `name="source" defaultValue={filters.source ?? ""}` |
| A-149-C006 | 12 | `FilterBar`  | `method="get" className={styles.filters} aria-label="ตัวกรองงาน"` |
| A-149-C007 | 13 | `FormField`  | `label="ค้นหา Job / ชื่องาน" className={styles.searchField}` |
| A-149-C008 | 13 | `input`  | `type="search" name="q" defaultValue={filters.q} placeholder="ค้นหางานหรือรหัส Job…"` |
| A-149-C009 | 14 | `Button` ค้นหางาน | `variant="primary" type="submit"` |
| A-149-C010 | 14 | `ButtonLink` ล้างตัวกรอง | `variant="secondary" href={resetHref}` |
| A-149-C011 | 15 | `details`  | `className={styles.advanced} open={count > 0}` |
| A-149-C012 | 15 | `summary` ตัวกรองเพิ่มเติม | `` |
| A-149-C013 | 16 | `input`  | `type="hidden" name="owner" value={filters.owner}` |
| A-149-C014 | 19 | `FilterBar`  | `method="get" className="work-panel work-form-grid work-filters" aria-label="ตัวกรองงาน"` |
| A-149-C015 | 19 | `input`  | `type="search" name="q" defaultValue={filters.q}` |
| A-149-C016 | 19 | `input`  | `type="hidden" name="owner" value={filters.owner}` |
| A-149-C017 | 19 | `Button` ใช้ตัวกรอง | `variant="secondary" type="submit"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-149-B001 | 10 | `appearance === "workspace"` |
| A-149-B002 | 15 | `count > 0` |

## A-150 — `src/features/work/components/work-screen-shell.tsx`

- Status: PLANNED. Consumers: S-027, S-028, S-029, S-030, S-031, S-032, S-033, S-034, S-035.
- Normalized UTF-8/LF source SHA-256: `54d1c3f2031a03f5fa0ce95e1b74cf7c5c15ff40f96d694d513e92e6d5b7b3fc`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-150-F001 | 6 | `WorkScreenShell` | `export function WorkScreenShell(` |
| A-150-F002 | 11 | `WorkUnavailable` | `export function WorkUnavailable(` |
| A-150-F003 | 15 | `WorkEmpty` | `export function WorkEmpty(` |
| A-150-F004 | 19 | `WorkMetricStrip` | `export function WorkMetricStrip(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-150-C001 | 8 | `PageHeader`  | `title={title} description={description} parent={parent ?? { label: "ภาพรวม", href: "/" }} actions={action} className="page-enter"` |
| A-150-C002 | 12 | `EmptyState`  | `className="work-state work-state-unavailable" title={message} description={detail} badge={<StatusBadge label="ยังไม่พร้อมใช้งาน" tone="warning" />}` |
| A-150-C003 | 12 | `StatusBadge`  | `label="ยังไม่พร้อมใช้งาน" tone="warning"` |
| A-150-C004 | 16 | `EmptyState`  | `className="work-state work-state-empty" title={title} description={detail} action={action} badge={<StatusBadge label="ยังไม่มีข้อมูล" tone="neutral" />}` |
| A-150-C005 | 16 | `StatusBadge`  | `label="ยังไม่มีข้อมูล" tone="neutral"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-150-B001 | 8 | `workspace` |
| A-150-B002 | 8 | `workspace` |

## A-151 — `src/features/work/screens/assignment-center.tsx`

- Status: PLANNED. Consumers: S-027, S-031.
- Normalized UTF-8/LF source SHA-256: `ffcc55bc06b4ba50452e2ec2408e7470d055bd6322abe0d6b1699f4597c27faf`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-151-F001 | 9 | `AssignmentCenterScreen` | `export function AssignmentCenterScreen(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-151-C001 | 17 | `WorkScreenShell`  | `title="ศูนย์มอบหมายงาน" description="เลือกทีม ผู้รับผิดชอบ และ KPI แล้วตรวจ deadline ก่อนมอบหมาย" parent={{label:"ภาพรวมทีม",href:"/work/team"}} appearance={appearance}` |
| A-151-C002 | 19 | `form`  | `ref={formRef} action={action} className="work-panel work-assignment-form work-rollout-assignment ui-form" aria-busy={pending}` |
| A-151-C003 | 19 | `input`  | `type="hidden" name="idempotencyKey" value={model.creationKey}` |
| A-151-C004 | 19 | `select`  | `name="teamId" value={teamId} onChange={e=>setTeamId(e.target.value)} required` |
| A-151-C005 | 19 | `select`  | `name="assigneeId" key={teamId} defaultValue="" required` |
| A-151-C006 | 19 | `input`  | `name="title" required minLength={3} maxLength={180}` |
| A-151-C007 | 19 | `select`  | `name="priority" defaultValue="normal"` |
| A-151-C008 | 19 | `textarea`  | `name="jobs" required maxLength={4000} rows={5}` |
| A-151-C009 | 19 | `textarea`  | `name="notes" maxLength={4000}` |
| A-151-C010 | 19 | `button` ดู deadline ล่วงหน้า | `className="btn-secondary" type="button" onClick={event=>{const form=event.currentTarget.form;if(form)startTransition(()=>previewAction(new FormData(form)));}} disabled={pending\|\|previewPending}` |
| A-151-C011 | 19 | `p`  | `role="status"` |
| A-151-C012 | 19 | `button`  | `className="btn-primary" disabled={pending\|\|previewPending}` |
| A-151-C013 | 19 | `p`  | `role="status"` |
| A-151-C014 | 19 | `WorkEmpty`  | `title="ยังไม่มีผู้รับผิดชอบในขอบเขต" detail="ให้ผู้ดูแลกำหนดทีมและสิทธิ์การมอบหมาย"` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-151-T001 | 11 | `[state,action,pending]=useActionState(assignWorkTasksAction,initial)` |
| A-151-T002 | 14 | `[preview,previewAction,previewPending]=useActionState(previewWorkDeadlineAction,initial)` |
| A-151-T003 | 15 | `[teamId,setTeamId]=useState("")` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-151-E001 | 19 | `previewAction(new FormData(form))` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-151-B001 | 18 | `filters` |
| A-151-B002 | 19 | `model.source.status!=="ready"` |
| A-151-B003 | 19 | `model.assignmentOptions.length` |
| A-151-B004 | 19 | `form` |
| A-151-B005 | 19 | `pending` |

## A-152 — `src/features/work/screens/job-tracker.tsx`

- Status: PLANNED. Consumers: S-031, S-035.
- Normalized UTF-8/LF source SHA-256: `2e6da0a50b0776f60b9175b0389720fc7c61c23318189f404f672ab267a4e65c`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-152-F001 | 12 | `JobTrackerScreen` | `export function JobTrackerScreen(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-152-C001 | 17 | `WorkScreenShell`  | `title="Job Tracker" description="ค้นหาและติดตามงานย่อยภายใต้ Job เดียวกัน" appearance={appearance}` |
| A-152-C002 | 18 | `WorkScreenShell`  | `title="Job Tracker" description="ค้นหา Job code และเปิดดูงานย่อยทั้งหมดโดยไม่ตัดรายการที่ถูกต้อง" parent={{ label: "งานของทีม", href: "/work/team" }} appearance={appearance}` |
| A-152-C003 | 20 | `input`  | `type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="เช่น JOB-001 หรือชื่อผู้รับผิดชอบ"` |
| A-152-C004 | 20 | `button`  | `className="work-job-toggle" type="button" aria-expanded={expanded === group.key} onClick={() => setExpanded(expanded === group.key ? null : group.key)}` |
| A-152-C005 | 20 | `details`  | `` |
| A-152-C006 | 20 | `summary` บันทึกและประวัติ | `` |
| A-152-C007 | 20 | `StatusBadge`  | `label={task.statusLabel} tone={task.status === "completed" ? "success" : task.status === "blocked" ? "warning" : task.status === "cancelled" ? "danger" : "info"}` |
| A-152-C008 | 20 | `WorkEmpty`  | `title="ไม่พบ Job ที่ตรงกับคำค้น" detail={query ? "ลองใช้รหัสงาน ชื่องาน หรือชื่อผู้รับผิดชอบที่สั้นลง" : "ยังไม่มีงานที่มีข้อมูล Job ในขอบเขตของคุณ"}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-152-T001 | 14 | `[query, setQuery] = useState("")` |
| A-152-T002 | 15 | `[expanded, setExpanded] = useState<string \| null>(null)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-152-B001 | 17 | `model.source.status !== "ready"` |
| A-152-B002 | 19 | `filters` |
| A-152-B003 | 20 | `groups.length` |
| A-152-B004 | 20 | `expanded === group.key` |
| A-152-B005 | 20 | `group.hasJobCode` |
| A-152-B006 | 20 | `expanded === group.key` |
| A-152-B007 | 20 | `task.dueAt` |
| A-152-B008 | 20 | `task.status === "completed"` |
| A-152-B009 | 20 | `task.status === "blocked"` |
| A-152-B010 | 20 | `task.status === "cancelled"` |
| A-152-B011 | 20 | `query` |

## A-153 — `src/features/work/screens/kpi-workspace.tsx`

- Status: PLANNED. Consumers: S-028, S-031.
- Normalized UTF-8/LF source SHA-256: `65b98743295f71c740810835b162621c0d0eca3fc894a0a4850d8541c94fb513`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-153-F001 | 7 | `KpiWorkspaceScreen` | `export function KpiWorkspaceScreen(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-153-C001 | 9 | `WorkScreenShell`  | `title="KPI ของฉัน" description="ดูผลการทำงานและหลักฐานที่นำไปคำนวณ" appearance={appearance}` |
| A-153-C002 | 10 | `WorkScreenShell`  | `title="KPI ของฉัน" description="เข้าใจคะแนนจากงานจริง เป้าหมาย ช่วงเวลา และ SLA โดยไม่ต้องอ่านรหัสภายใน" parent={{ label: "งานและ KPI", href: "/work" }} appearance={appearance}` |
| A-153-C003 | 12 | `WorkEmpty`  | `title="ยังไม่มีผล KPI ที่เผยแพร่" detail="เมื่อมีผลคำนวณจากกฎและข้อมูลที่อนุมัติแล้ว ระบบจะแสดงเป้าหมาย ผลจริง ความคืบหน้า และงานที่นำมาคิดที่นี่"` |
| A-153-C004 | 13 | `details`  | `className="work-technical-details"` |
| A-153-C005 | 13 | `summary` เปิดรายละเอียดตรวจสอบ | `` |
| A-153-C006 | 13 | `table`  | `className="work-data-table"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-153-B001 | 9 | `model.source.status !== "ready"` |
| A-153-B002 | 11 | `filters` |
| A-153-B003 | 12 | `row.enabled` |
| A-153-B004 | 12 | `model.kpiCards.length` |
| A-153-B005 | 12 | `card.progress === null` |
| A-153-B006 | 13 | `fact.status === "applied"` |

## A-154 — `src/features/work/screens/my-tasks-workspace.tsx`

- Status: PLANNED. Consumers: S-029.
- Normalized UTF-8/LF source SHA-256: `4479563ccfe44b10187a42bac35272f6803e0c364abcc162cd13604e605f606d`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-154-F001 | 17 | `MyTasksWorkspace` | `export function MyTasksWorkspace(` |
| A-154-F002 | 24 | `number` | `(value: number) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-154-C001 | 27 | `PageHeader`  | `className={styles.pageHeader} title="งานของฉัน" description="จัดลำดับงาน ติดตามกำหนด และทำงานต่อจากจุดที่ค้างไว้" parent={{ label: "งานและ KPI", href: "/work" }} actions={canCreate ? <Link className="btn-primary" href="/work/new"><WorkspaceIcon name="info" size={18}/>เพิ่มงานใหม่</Link> : undefined}` |
| A-154-C002 | 27 | `Link` เพิ่มงานใหม่ | `className="btn-primary" href="/work/new"` |
| A-154-C003 | 38 | `p`  | `role="status"` |
| A-154-C004 | 38 | `select`  | `value={sort} onChange={event => { setSort(event.target.value as WorkListSort); setPage(1); }}` |
| A-154-C005 | 39 | `WorkTaskTable`  | `tasks={result.items} subject={subject} showNotes appearance="workspace"` |
| A-154-C006 | 39 | `WorkEmpty`  | `title="ยังไม่มีงานในรายการนี้" detail="ลองปรับตัวกรอง หรือเพิ่มงานใหม่เมื่อคุณพร้อม งานที่ได้รับมอบหมายจะแสดงที่นี่ตามสิทธิ์เดิม" action={canCreate ? <Link className="btn-primary" href="/work/new">เพิ่มงานใหม่</Link> : undefined}` |
| A-154-C007 | 39 | `Link` เพิ่มงานใหม่ | `className="btn-primary" href="/work/new"` |
| A-154-C008 | 40 | `select`  | `value={size} onChange={event => { setSize(Number(event.target.value)); setPage(1); }}` |
| A-154-C009 | 40 | `button`  | `type="button" disabled={result.page <= 1} onClick={() => setPage(result.page - 1)} aria-label="หน้าก่อนหน้า"` |
| A-154-C010 | 40 | `span` หน้า / | `aria-live="polite"` |
| A-154-C011 | 40 | `button`  | `type="button" disabled={result.page >= result.pages} onClick={() => setPage(result.page + 1)} aria-label="หน้าถัดไป"` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-154-T001 | 18 | `[page, setPage] = useState(1)` |
| A-154-T002 | 19 | `[size, setSize] = useState(10)` |
| A-154-T003 | 20 | `[sort, setSort] = useState<WorkListSort>("recent")` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-154-B001 | 27 | `canCreate` |
| A-154-B002 | 28 | `model.source.status !== "ready"` |
| A-154-B003 | 38 | `mine.length` |
| A-154-B004 | 39 | `mine.length` |
| A-154-B005 | 39 | `canCreate` |

## A-155 — `src/features/work/screens/my-work.tsx`

- Status: PLANNED. Consumers: S-031.
- Normalized UTF-8/LF source SHA-256: `c3cb16d303aff50290ff1883c6a5d80c93c3d2b903244876cd3eb9258afe9c83`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-155-F001 | 13 | `MyWorkDashboard` | `export function MyWorkDashboard(` |
| A-155-F002 | 49 | `MyTasksScreen` | `export function MyTasksScreen(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-155-C001 | 21 | `WorkScreenShell`  | `title="ภาพรวมงานของฉัน" description="เห็นงานที่ต้องทำและความคืบหน้าในขอบเขตของคุณ" appearance="workspace"` |
| A-155-C002 | 26 | `WorkScreenShell`  | `title="ภาพรวมงานของฉัน" description="จัดลำดับงานที่ต้องทำ เห็นกำหนด และไปต่อจากจุดที่ค้างอยู่" action={canCreate ? <Button variant="primary" onClick={() => setCreateOpen(true)}>เพิ่มงาน</Button> : undefined} appearance="workspace"` |
| A-155-C003 | 29 | `Button` เพิ่มงาน | `variant="primary" onClick={() => setCreateOpen(true)}` |
| A-155-C004 | 33 | `p` แสดง 500 งานล่าสุดของคุณ ความคืบหน้าคำนวณจากรายการที่แสดง ใช้ตัวกรองในรายการทั้งหมดเพื่อดูช่วงที่ต้องการ | `role="status"` |
| A-155-C005 | 34 | `Link` ดูรายการทั้งหมด | `className="btn-secondary" href="/work/mine"` |
| A-155-C006 | 34 | `WorkTaskTable`  | `tasks={mine.slice(0, 8)} subject={subject} showNotes appearance="workspace"` |
| A-155-C007 | 34 | `WorkEmpty`  | `title="ยังไม่มีงานที่ได้รับมอบหมาย" detail="งานใหม่ที่อยู่ในขอบเขตของคุณจะแสดงที่นี่ เมื่อมีงานแล้วคุณจะรับงานและอัปเดตสถานะได้จากรายการนี้."` |
| A-155-C008 | 35 | `Link` ดูทั้งหมด | `className="text-btn" href="/work?view=activity"` |
| A-155-C009 | 37 | `dialog`  | `ref={createDialogRef} className="work-create-dialog" aria-labelledby="work-create-title" onClose={() => { setCreateOpen(false); router.refresh(); }} onCancel={(event) => { event.preventDefault(); createDialogRef.current?.close(); }}` |
| A-155-C010 | 40 | `button` ปิด | `className="text-btn" type="button" onClick={() => createDialogRef.current?.close()}` |
| A-155-C011 | 42 | `WorkCreateForm`  | `model={model} userId={userId}` |
| A-155-C012 | 50 | `WorkScreenShell`  | `title="งานของฉัน" description="รายการงานส่วนตัวและงานที่ได้รับมอบหมาย" appearance="workspace"` |
| A-155-C013 | 52 | `WorkScreenShell`  | `title="งานของฉัน" description="รายการงานส่วนตัวและงานที่ได้รับมอบหมาย พร้อมสถานะที่อัปเดตได้ตามสิทธิ์" parent={{ label: "งานและ KPI", href: "/work" }} appearance="workspace"` |
| A-155-C014 | 52 | `WorkTaskTable`  | `tasks={mine} subject={subject} showNotes appearance="workspace"` |
| A-155-C015 | 52 | `WorkEmpty`  | `title="ยังไม่มีงานในรายการของคุณ" detail="ลองเพิ่มงาน หรือรอหัวหน้ามอบหมายงานใหม่ให้คุณ" action={canCreate ? <Link className="secondary-action" href="/work/new">เพิ่มงาน</Link> : undefined}` |
| A-155-C016 | 52 | `Link` เพิ่มงาน | `className="secondary-action" href="/work/new"` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-155-T001 | 14 | `[createOpen, setCreateOpen] = useState(false)` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-155-E001 | 19 | `dialog.showModal()` |
| A-155-E002 | 37 | `createDialogRef.current?.close()` |
| A-155-E003 | 40 | `createDialogRef.current?.close()` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-155-B001 | 19 | `createOpen && dialog && !dialog.open` |
| A-155-B002 | 21 | `model.source.status !== "ready"` |
| A-155-B003 | 24 | `detailId` |
| A-155-B004 | 29 | `canCreate` |
| A-155-B005 | 32 | `overview.completion === null` |
| A-155-B006 | 34 | `detail` |
| A-155-B007 | 34 | `mine.length` |
| A-155-B008 | 50 | `model.source.status !== "ready"` |
| A-155-B009 | 52 | `mine.length` |
| A-155-B010 | 52 | `canCreate` |

## A-156 — `src/features/work/screens/people-overview.tsx`

- Status: PLANNED. Consumers: S-031, S-032.
- Normalized UTF-8/LF source SHA-256: `891e3294fa5a4a08506d6d6db6d9b3b461c60489975eef69f6b2a82366df5286`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-156-F001 | 8 | `PeopleOverviewScreen` | `export function PeopleOverviewScreen(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-156-C001 | 10 | `WorkScreenShell`  | `title="บุคลากร" description="ดูภาระงานและผลการทำงานตามขอบเขตสิทธิ์" appearance={appearance}` |
| A-156-C002 | 12 | `WorkScreenShell`  | `title="บุคลากร" description="ดูทีม ภาระงาน สถานะ และผลการทำงาน โดยไม่เกินขอบเขตสิทธิ์ของคุณ" parent={{ label: "งานของทีม", href: "/work/team" }} appearance={appearance}` |
| A-156-C003 | 15 | `Link` เปิด Job Tracker | `className="btn-secondary" href="/work/tracker"` |
| A-156-C004 | 15 | `Link` ดูงานของคนนี้ | `className="btn-secondary" href={&#96;/work/tracker?owner=${person.id}&#96;}` |
| A-156-C005 | 15 | `WorkEmpty`  | `title="ยังไม่มีข้อมูลบุคลากร" detail="ข้อมูลจะแสดงเมื่อมีงานหรือผู้ใช้ที่อยู่ในขอบเขตทีมของคุณ"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-156-B001 | 10 | `model.source.status !== "ready"` |
| A-156-B002 | 13 | `filters` |
| A-156-B003 | 15 | `people.length` |
| A-156-B004 | 15 | `person.weightedPerformance === null` |
| A-156-B005 | 15 | `person.overdue` |

## A-157 — `src/features/work/screens/reports.tsx`

- Status: PLANNED. Consumers: S-031, S-033.
- Normalized UTF-8/LF source SHA-256: `dc5459063f7984995817df3741452d4bb1d8d22384994d191f6f4e0a3c0dc672`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-157-F001 | 6 | `WorkReportsScreen` | `export function WorkReportsScreen(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-157-C001 | 7 | `WorkScreenShell`  | `title="รายงานงาน" description="สรุปงานตามสถานะ คน ทีม และ SLA" appearance={appearance}` |
| A-157-C002 | 8 | `WorkScreenShell`  | `title="รายงานงาน" description="สรุปความคืบหน้าและ SLA ด้วยค่าที่มาจากงานในขอบเขตสิทธิ์" action={<WorkReportTools/>} parent={{ label: "งานและ KPI", href: "/work" }} appearance={appearance}` |
| A-157-C003 | 8 | `WorkReportTools`  | `` |
| A-157-C004 | 11 | `WorkEmpty`  | `title="ยังไม่มีข้อมูลสำหรับรายงาน" detail="รายงานจะแสดงเมื่อมีงานในขอบเขตสิทธิ์ของคุณ"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-157-B001 | 7 | `model.source.status !== "ready"` |
| A-157-B002 | 9 | `filters` |
| A-157-B003 | 10 | `model.report.completion === null` |
| A-157-B004 | 10 | `model.report.sla === null` |
| A-157-B005 | 11 | `model.report.taskCount` |
| A-157-B006 | 11 | `model.report.overdue` |

## A-158 — `src/features/work/screens/team-command.tsx`

- Status: PLANNED. Consumers: S-031, S-034.
- Normalized UTF-8/LF source SHA-256: `9492f7eb7e3100439727ac08ac59efeca1c4bf308c16d978cc2d73de92d284e0`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-158-F001 | 8 | `TeamCommandScreen` | `export function TeamCommandScreen(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-158-C001 | 10 | `WorkScreenShell`  | `title="ภาพรวมทีม" description="ติดตามภาระงานและความเสี่ยงของทีม" appearance={appearance}` |
| A-158-C002 | 13 | `WorkScreenShell`  | `title="ภาพรวมทีม" description="ดูภาระงาน กำหนด และจุดที่ต้องช่วยแก้ของทีม" action={<Link className="btn-primary" href="/work/assign">มอบหมายงาน</Link>} appearance={appearance}` |
| A-158-C003 | 13 | `Link` มอบหมายงาน | `className="btn-primary" href="/work/assign"` |
| A-158-C004 | 16 | `Link` ดูบุคลากร | `className="text-btn" href="/work/people"` |
| A-158-C005 | 16 | `Link` ดู Job Tracker | `className="text-btn" href="/work/tracker"` |
| A-158-C006 | 16 | `WorkTaskTable`  | `tasks={teamTasks} subject={subject} showNotes appearance="workspace"` |
| A-158-C007 | 16 | `WorkEmpty`  | `title="ยังไม่มีงานในทีมที่เข้าถึงได้" detail="เมื่อมีงานที่อยู่ในขอบเขตทีม รายการและภาระงานจะแสดงที่นี่"` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-158-B001 | 10 | `model.source.status !== "ready"` |
| A-158-B002 | 14 | `filters` |
| A-158-B003 | 16 | `teamTasks.length` |

## A-159 — `src/modules/duct-rental/components/attachment-picker.tsx`

- Status: PLANNED. Consumers: S-009, S-010, S-011, S-012, S-013, S-014, S-016, S-017, S-018, S-019, S-020.
- Normalized UTF-8/LF source SHA-256: `ee4e85e266707ebc0bc2b21c477de6aedd8307e9752f2c2cef8391dbdac6f6eb`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-159-F001 | 8 | `AttachmentPicker` | `export function AttachmentPicker(` |
| A-159-F002 | 11 | `select` | `(selected?: File) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-159-C001 | 17 | `div`  | `className={styles.drop} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); select(event.dataTransfer.files[0]); }}` |
| A-159-C002 | 17 | `Button` · ไม่เกิน 25 MB | `variant="secondary" type="button" onClick={() => { if (!disabled) inputRef.current?.click(); }} disabled={disabled}` |
| A-159-C003 | 17 | `input`  | `ref={inputRef} id={id} type="file" accept={accept} disabled={disabled} className={styles.pickerInput} tabIndex={-1} aria-label={label} onChange={event => { select(event.target.files?.[0]); event.target.value = ""; }}` |
| A-159-C004 | 17 | `button` ยกเลิกไฟล์ที่เลือก | `className={styles.button} type="button" disabled={disabled} onClick={() => change(null)}` |
| A-159-C005 | 18 | `Modal`  | `title="ตรวจเอกสารก่อนแนบ" close={() => setPreview(null)}` |
| A-159-C006 | 18 | `PdfViewer`  | `key={url} url={url} blob={preview} name={preview.name}` |
| A-159-C007 | 18 | `button` ยกเลิก | `className={styles.button} type="button" onClick={() => setPreview(null)}` |
| A-159-C008 | 18 | `button` ยืนยันไฟล์แนบ | `className={styles.primary} type="button" onClick={() => { change(preview); setPreview(null); }}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-159-T001 | 9 | `[preview, setPreview] = useState<File \| null>(null)` |
| A-159-T002 | 9 | `[url, setUrl] = useState("")` |
| A-159-T003 | 9 | `[error, setError] = useState("")` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-159-B001 | 10 | `!preview` |
| A-159-B002 | 12 | `!selected \|\| disabled` |
| A-159-B003 | 13 | `selected.size > 25 * 1024 * 1024 \|\| selected.size === 0` |
| A-159-B004 | 15 | `selected.name.toLowerCase().endsWith(".pdf") \|\| selected.type.startsWith("image/")` |
| A-159-B005 | 17 | `!disabled` |
| A-159-B006 | 18 | `preview.name.toLowerCase().endsWith(".pdf")` |

## A-160 — `src/modules/duct-rental/components/cable-test-workspace.tsx`

- Status: PLANNED. Consumers: S-015.
- Normalized UTF-8/LF source SHA-256: `520fe6dbb89e214412e1c81d8521b12d4d99fc160853b17fe821cf750e384b20`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-160-F001 | 15 | `CableTestWorkspace` | `export function CableTestWorkspace(` |
| A-160-F002 | 31 | `CableEditor` | `function CableEditor(` |
| A-160-F003 | 35 | `run` | `async function run(action:"save"\|"advance"\|"revise"\|"archive") ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-160-C001 | 19 | `button` กลับรายการพาดสาย | `type="button" className={styles.button} onClick={()=>setPreview(false)}` |
| A-160-C002 | 21 | `PageHeader`  | `title="พาดสายสื่อสาร" description="ทดสอบงาน PEA / MEA ด้วยบัญชีเดิม ข้อมูลที่บันทึกจะเก็บในระบบ" actions={permissions.includes("duct_rental.request.create")?<button className={styles.primary} onClick={()=>setEditing(null)}>สร้างคำขอพาดสาย</button>:undefined}` |
| A-160-C003 | 21 | `button` สร้างคำขอพาดสาย | `className={styles.primary} onClick={()=>setEditing(null)}` |
| A-160-C004 | 25 | `form`  | `className={styles.actions} onSubmit={e=>{e.preventDefault();setOffset(0);setSearch(query);}}` |
| A-160-C005 | 25 | `input`  | `value={query} maxLength={200} onChange={e=>setQuery(e.target.value)}` |
| A-160-C006 | 25 | `button` ค้นหา | `className={styles.button}` |
| A-160-C007 | 25 | `button` ดูร่างโฟลว์ | `type="button" className={styles.button} onClick={()=>setPreview(true)}` |
| A-160-C008 | 26 | `table`  | `className={styles.table}` |
| A-160-C009 | 26 | `button` เปิดรายการ | `className={styles.button} onClick={()=>setEditing(row)}` |
| A-160-C010 | 27 | `button` ก่อนหน้า | `className={styles.button} disabled={!offset} onClick={()=>setOffset(offset-50)}` |
| A-160-C011 | 27 | `button` ถัดไป | `className={styles.button} disabled={model.data?.nextOffset==null} onClick={()=>setOffset(model.data!.nextOffset!)}` |
| A-160-C012 | 28 | `Modal`  | `title={editing?&#96;${editing.code} · ${cableLabels[editing.stage]}&#96;:"สร้างคำขอพาดสาย"} close={()=>setEditing(undefined)}` |
| A-160-C013 | 28 | `CableEditor`  | `row={editing} permissions={permissions} done={async()=>{await model.refresh();setEditing(undefined);}}` |
| A-160-C014 | 36 | `select`  | `disabled={busy\|\|!editable} value={data.authority} onChange={e=>setData({...data,authority:e.target.value as "PEA"\|"MEA"})}` |
| A-160-C015 | 36 | `input`  | `disabled={busy\|\|!editable} value={data[key]} maxLength={key==="permitNumber"\|\|key==="submissionNumber"\|\|key==="cableType"?100:200} onChange={e=>setData({...data,[key]:e.target.value})}` |
| A-160-C016 | 36 | `textarea`  | `disabled={busy\|\|!editable} value={data.notes} maxLength={4000} onChange={e=>setData({...data,notes:e.target.value})}` |
| A-160-C017 | 38 | `textarea`  | `value={reason} maxLength={2000} disabled={busy} onChange={e=>setReason(e.target.value)}` |
| A-160-C018 | 39 | `button`  | `className={styles.primary} disabled={busy} onClick={()=>void run("save")}` |
| A-160-C019 | 39 | `button`  | `className={styles.primary} disabled={busy} onClick={()=>setConfirm("advance")}` |
| A-160-C020 | 39 | `button` ส่งกลับแก้ไข | `className={styles.button} disabled={busy\|\|!reason.trim()} onClick={()=>setConfirm("revise")}` |
| A-160-C021 | 39 | `button` เก็บเข้าประวัติ | `className={styles.button} disabled={busy} onClick={()=>setConfirm("archive")}` |
| A-160-C022 | 40 | `button` ยืนยัน | `className={styles.primary} disabled={busy} onClick={()=>void run(confirm)}` |
| A-160-C023 | 40 | `button` กลับไปตรวจ | `className={styles.button} disabled={busy} onClick={()=>setConfirm(null)}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-160-T001 | 16 | `[offset,setOffset]=useState(0)` |
| A-160-T002 | 16 | `[query,setQuery]=useState("")` |
| A-160-T003 | 16 | `[search,setSearch]=useState("")` |
| A-160-T004 | 17 | `[editing,setEditing]=useState<Row\|null\|undefined>(undefined)` |
| A-160-T005 | 17 | `[preview,setPreview]=useState(false)` |
| A-160-T006 | 32 | `[data,setData]=useState<CableInput>(row?.data??empty)` |
| A-160-T007 | 32 | `[reason,setReason]=useState("")` |
| A-160-T008 | 32 | `[error,setError]=useState("")` |
| A-160-T009 | 32 | `[busy,setBusy]=useState(false)` |
| A-160-T010 | 32 | `[confirm,setConfirm]=useState<"advance"\|"revise"\|"archive"\|null>(null)` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-160-E001 | 35 | `setConfirm(null)` |
| A-160-E002 | 39 | `setConfirm("advance")` |
| A-160-E003 | 39 | `setConfirm("revise")` |
| A-160-E004 | 39 | `setConfirm("archive")` |
| A-160-E005 | 40 | `setConfirm(null)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-160-B001 | 19 | `preview` |
| A-160-B002 | 21 | `permissions.includes("duct_rental.request.create")` |
| A-160-B003 | 26 | `model.loading` |
| A-160-B004 | 28 | `editing` |
| A-160-B005 | 33 | `row` |
| A-160-B006 | 35 | `row` |
| A-160-B007 | 35 | `row` |
| A-160-B008 | 36 | `key==="permitNumber"\|\|key==="submissionNumber"\|\|key==="cableType"` |
| A-160-B009 | 39 | `row` |
| A-160-B010 | 40 | `confirm==="archive"` |
| A-160-B011 | 40 | `confirm==="revise"` |
| A-160-B012 | 41 | `h.action==="save"` |
| A-160-B013 | 41 | `h.action==="archive"` |

## A-161 — `src/modules/duct-rental/components/common.tsx`

- Status: PLANNED. Consumers: S-009, S-010, S-011, S-012, S-013, S-014, S-015, S-016, S-017, S-018, S-019, S-020, S-021, S-022.
- Normalized UTF-8/LF source SHA-256: `088caae5fde8c95270c539eb02450c5d8ef398f00ab8d531d3a4fda1dede5408`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-161-F001 | 20 | `DuctSyncUtility` | `export function DuctSyncUtility(` |
| A-161-F002 | 75 | `RefreshBar` | `export function RefreshBar(` |
| A-161-F003 | 97 | `Field` | `export function Field(` |
| A-161-F004 | 102 | `Notice` | `export function Notice(` |
| A-161-F005 | 103 | `Modal` | `export function Modal(` |
| A-161-F006 | 115 | `PhaseTabs` | `export function PhaseTabs(` |
| A-161-F007 | 124 | `DuctTaskToolbar` | `export function DuctTaskToolbar(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-161-C001 | 60 | `div`  | `className={styles.ductSyncUtility} aria-busy={isBusy} role="status" aria-live="polite"` |
| A-161-C002 | 62 | `Button`  | `variant="ghost" type="button" disabled={isBusy \|\| !online} onClick={() => void refresh()} aria-busy={isBusy \|\| false}` |
| A-161-C003 | 102 | `div`  | `className={&#96;${styles.notice} ${error ? styles.alert : ""}&#96;} role={error ? "alert" : "status"}` |
| A-161-C004 | 113 | `dialog`  | `ref={ref} className={styles.modal} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); close(); }}` |
| A-161-C005 | 113 | `button` ปิด | `className={styles.button} type="button" onClick={close}` |
| A-161-C006 | 116 | `Link` · | `key={item} className={&#96;${styles.step} ${phase === item ? styles.current : ""}&#96;} href={&#96;/duct-rental/${id}/${phaseViews[item]}&#96;} aria-current={phase === item ? "page" : undefined}` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-161-E001 | 107 | `dialog?.showModal()` |
| A-161-E002 | 109 | `dialog?.close()` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-161-B001 | 41 | `online && !error && !paused && at && at !== announcedAtRef.current` |
| A-161-B002 | 46 | `!online` |
| A-161-B003 | 48 | `error` |
| A-161-B004 | 50 | `paused` |
| A-161-B005 | 52 | `at` |
| A-161-B006 | 55 | `online && !error && realtime === "connected"` |
| A-161-B007 | 55 | `online && !error && realtime` |
| A-161-B008 | 56 | `changed` |
| A-161-B009 | 67 | `isBusy` |
| A-161-B010 | 99 | `isValidElement<Record<string, unknown>>(children)` |
| A-161-B011 | 99 | `error` |
| A-161-B012 | 100 | `full` |
| A-161-B013 | 102 | `text` |
| A-161-B014 | 102 | `error` |
| A-161-B015 | 102 | `error` |
| A-161-B016 | 110 | `trigger instanceof HTMLElement && trigger.isConnected` |
| A-161-B017 | 116 | `phase === item` |
| A-161-B018 | 116 | `phase === item` |
| A-161-B019 | 116 | `statuses[item] === "done"` |
| A-161-B020 | 116 | `statuses[item] === "accepted"` |

## A-162 — `src/modules/duct-rental/components/communication-cable-workspace.tsx`

- Status: PLANNED. Consumers: S-015.
- Normalized UTF-8/LF source SHA-256: `0c1d85dfaf03335a5fbe817ac76ba9370734f60d145cbd766ad4502014ed1e3d`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-162-F001 | 18 | `CommunicationCableWorkspace` | `export function CommunicationCableWorkspace(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-162-C001 | 24 | `PageHeader`  | `title="พาดสายสื่อสาร" description="ร่างขั้นตอนขอพาดสายกับการไฟฟ้าส่วนภูมิภาคและการไฟฟ้านครหลวง"` |
| A-162-C002 | 27 | `select`  | `value={authority} onChange={event => setAuthority(event.target.value)}` |
| A-162-C003 | 28 | `button` เริ่มทดลองใหม่ | `className={styles.button} type="button" onClick={() => { setStep(0); setRevision(false); }}` |
| A-162-C004 | 33 | `button` . | `className={&#96;${styles.button} ${index === step ? styles.current : ""}&#96;} type="button" aria-current={index === step ? "step" : undefined} onClick={() => { setStep(index); setRevision(false); }}` |
| A-162-C005 | 41 | `button` ขั้นก่อนหน้า | `className={styles.button} type="button" disabled={step === 0 \|\| revision} onClick={() => setStep(step - 1)}` |
| A-162-C006 | 42 | `button` ทดลองยื่นใหม่หลังแก้ไข | `className={styles.primary} type="button" onClick={() => { setRevision(false); setStep(2); }}` |
| A-162-C007 | 42 | `button` ทดลองขั้นถัดไป | `className={styles.primary} type="button" onClick={() => setStep(step + 1)}` |
| A-162-C008 | 42 | `span` สิ้นสุดโฟลว์ตัวอย่าง | `role="status"` |
| A-162-C009 | 43 | `button` ทดลองกรณีให้แก้ไข | `className={styles.button} type="button" onClick={() => setRevision(true)}` |
| A-162-C010 | 45 | `p` กำลังดู: | `className={styles.muted} aria-live="polite"` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-162-T001 | 19 | `[authority, setAuthority] = useState("PEA")` |
| A-162-T002 | 20 | `[step, setStep] = useState(0)` |
| A-162-T003 | 21 | `[revision, setRevision] = useState(false)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-162-B001 | 33 | `index === step` |
| A-162-B002 | 33 | `index === step` |
| A-162-B003 | 37 | `revision` |
| A-162-B004 | 38 | `revision` |
| A-162-B005 | 39 | `revision` |
| A-162-B006 | 39 | `revision` |
| A-162-B007 | 42 | `revision` |
| A-162-B008 | 42 | `step < stages.length - 1` |
| A-162-B009 | 45 | `revision` |

## A-163 — `src/modules/duct-rental/components/design-editor.tsx`

- Status: PLANNED. Consumers: S-009, S-010, S-011, S-016, S-017, S-020.
- Normalized UTF-8/LF source SHA-256: `cbaa59955bb97aab849d86c6544b72a950029be74e779eab93495059df6fb5fe`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-163-F001 | 12 | `DesignEditor` | `export function DesignEditor(` |
| A-163-F002 | 14 | `set` | `(name: string, value: string) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-163-C001 | 19 | `details`  | `key={section.title} className={styles.panel} open={index < 2}` |
| A-163-C002 | 19 | `summary`  | `` |
| A-163-C003 | 20 | `textarea`  | `name={field.name} value={values[field.name] ?? ""} readOnly={readonly} onChange={event => set(field.name, event.target.value)}` |
| A-163-C004 | 20 | `select`  | `name={field.name} value={values[field.name] ?? ""} disabled={readonly} aria-invalid={!!errors[field.name]} onChange={event => set(field.name, event.target.value)}` |
| A-163-C005 | 20 | `input`  | `name={field.name} type={field.number ? "number" : "text"} step={field.name === "cableCount" ? "1" : "any"} onBlur={event => { if (field.name === "distance" && event.target.value !== "" && Number.isFinite(Number(event.target.value))) set(field.name, Number(event.target.value).toFixed(2)); }} value={values[field.name] ?? ""} readOnly={readonly \|\| field.name === "diameter"} aria-invalid={!!errors[field.name]} onChange={event => set(field.name, event.target.value)}` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-163-B001 | 13 | `readonly` |
| A-163-B002 | 15 | `name === "cableType"` |
| A-163-B003 | 16 | `name === "fiberType"` |
| A-163-B004 | 19 | `field.optional` |
| A-163-B005 | 20 | `field.area` |
| A-163-B006 | 20 | `field.options` |
| A-163-B007 | 20 | `field.name === "fiberType"` |
| A-163-B008 | 20 | `field.name === "requestType"` |
| A-163-B009 | 20 | `field.number` |
| A-163-B010 | 20 | `field.name === "cableCount"` |
| A-163-B011 | 20 | `field.name === "distance" && event.target.value !== "" && Number.isFinite(Number(event.target.value))` |

## A-164 — `src/modules/duct-rental/components/file-list.tsx`

- Status: PLANNED. Consumers: S-009, S-011, S-017.
- Normalized UTF-8/LF source SHA-256: `0c0453fa363436eee9a8ba1a65636e0d624a3d3b0a93ac2c71b93c1274b52e9c`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-164-F001 | 9 | `FileList` | `export function FileList(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-164-C001 | 12 | `input`  | `value={query} onChange={event => { setQuery(event.target.value); setLimit(50); }}` |
| A-164-C002 | 12 | `select`  | `value={phase} onChange={event => { setPhase(event.target.value); setLimit(50); }}` |
| A-164-C003 | 12 | `select`  | `value={sort} onChange={event => setSort(event.target.value)}` |
| A-164-C004 | 12 | `button` ดูตัวอย่าง | `className={styles.button} type="button" onClick={() => setPreview(file)}` |
| A-164-C005 | 12 | `a` ดาวน์โหลด | `className={styles.button} href={documentUrl(file.id, true)}` |
| A-164-C006 | 12 | `button` แสดงเอกสารเพิ่ม | `className={styles.button} type="button" onClick={() => setLimit(previous => previous + 50)}` |
| A-164-C007 | 12 | `Modal`  | `title={preview.name} close={() => setPreview(null)}` |
| A-164-C008 | 12 | `PdfViewer`  | `url={documentUrl(preview.id)} name={preview.name}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-164-T001 | 10 | `[query, setQuery] = useState("")` |
| A-164-T002 | 10 | `[phase, setPhase] = useState("")` |
| A-164-T003 | 10 | `[sort, setSort] = useState("latest")` |
| A-164-T004 | 10 | `[preview, setPreview] = useState<RequestDetail["files"][number] \| null>(null)` |
| A-164-T005 | 10 | `[limit, setLimit] = useState(50)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-164-B001 | 11 | `sort === "name"` |

## A-165 — `src/modules/duct-rental/components/pdf-viewer.tsx`

- Status: PLANNED. Consumers: S-009, S-010, S-011, S-012, S-013, S-014, S-016, S-017, S-018, S-019, S-020, S-021.
- Normalized UTF-8/LF source SHA-256: `aa1f6cb5771c230675e641bc8e41e206f0e68102419bd8a93e9893ae30508ba3`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-165-F001 | 6 | `PdfViewer` | `export function PdfViewer(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-165-C001 | 31 | `button` หน้าก่อน | `className={styles.button} type="button" disabled={page <= 1} onClick={() => setPage(previous => previous - 1)}` |
| A-165-C002 | 31 | `button` หน้าถัดไป | `className={styles.button} type="button" disabled={page >= total} onClick={() => setPage(previous => previous + 1)}` |
| A-165-C003 | 31 | `select`  | `aria-label="ระดับขยาย PDF" value={zoom} onChange={event => setZoom(Number(event.target.value))}` |
| A-165-C004 | 31 | `button` หมุนหน้า | `className={styles.button} type="button" onClick={() => setRotation(previous => (previous + 90) % 360)}` |
| A-165-C005 | 31 | `a` เปิด PDF / พิมพ์ | `className={styles.button} href={url} target="_blank" rel="noopener noreferrer"` |
| A-165-C006 | 33 | `div`  | `className={styles.preview} tabIndex={0} role="region" aria-label={&#96;เลื่อนดู ${name}&#96;}` |
| A-165-C007 | 33 | `canvas`  | `ref={canvas} role="img" aria-label={&#96;${name} หน้า ${page}&#96;}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-165-T001 | 8 | `[page, setPage] = useState(initialPage)` |
| A-165-T002 | 8 | `[total, setTotal] = useState(0)` |
| A-165-T003 | 8 | `[zoom, setZoom] = useState(1)` |
| A-165-T004 | 8 | `[rotation, setRotation] = useState(0)` |
| A-165-T005 | 8 | `[error, setError] = useState("")` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-165-B001 | 13 | `cancelled` |
| A-165-B002 | 15 | `blob` |
| A-165-B003 | 16 | `cancelled` |
| A-165-B004 | 18 | `cancelled` |
| A-165-B005 | 21 | `!element \|\| cancelled` |
| A-165-B006 | 24 | `ratio === 1` |
| A-165-B007 | 25 | `!cancelled` |
| A-165-B008 | 26 | `!cancelled` |

## A-166 — `src/modules/duct-rental/components/process-workspace.tsx`

- Status: PLANNED. Consumers: S-012, S-013, S-014, S-018, S-019.
- Normalized UTF-8/LF source SHA-256: `35168a7dfb7d244aa0c45fa81e8ef693493b64b96d1c39337d3e4aa676bbbc6b`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-166-F001 | 26 | `ProcessInfo` | `function ProcessInfo(` |
| A-166-F002 | 35 | `ProcessList` | `export function ProcessList(` |
| A-166-F003 | 39 | `createYear` | `async function createYear() ` |
| A-166-F004 | 134 | `RenewalWorkspace` | `export function RenewalWorkspace(` |
| A-166-F005 | 145 | `RenewalPane` | `function RenewalPane(` |
| A-166-F006 | 149 | `edited` | `() ` |
| A-166-F007 | 150 | `saveReview` | `async function saveReview() ` |
| A-166-F008 | 162 | `advance` | `async function advance(action: "advance" \| "archive") ` |
| A-166-F009 | 295 | `CancellationForm` | `export function CancellationForm(` |
| A-166-F010 | 298 | `create` | `async function create() ` |
| A-166-F011 | 354 | `CancellationWorkspace` | `export function CancellationWorkspace(` |
| A-166-F012 | 365 | `CancellationPane` | `function CancellationPane(` |
| A-166-F013 | 368 | `run` | `async function run(action: "advance" \| "reject" \| "archive") ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-166-C001 | 30 | `ProcessStatusBadge`  | `label={slaLabels[status]} tone={status === "Overdue" ? "action-required" : status === "Completed" ? "complete" : "pending"}` |
| A-166-C002 | 52 | `PageHeader`  | `title={kind === "renewal" ? "ต่อสัญญาเช่าท่อรายปี" : "ยกเลิกการใช้ท่อ"} description="ติดตามสถานะ ผู้รับผิดชอบ และกำหนดดำเนินการ" parent={{ label: "เช่าท่อร้อยสาย", href: "/duct-rental" }} actions={permissions.includes(&#96;duct_rental.${kind}.create&#96;) ? kind === "renewal" ? <Button variant="primary" type="button" onClick={() => setCreate(true)}>สร้างงานต่อสัญญารายปี</Button> : <ButtonLink variant="primary" href="/duct-rental/cancellation/new">ขอยกเลิกการใช้ท่อ</ButtonLink> : undefined}` |
| A-166-C003 | 58 | `Button` สร้างงานต่อสัญญารายปี | `variant="primary" type="button" onClick={() => setCreate(true)}` |
| A-166-C004 | 59 | `ButtonLink` ขอยกเลิกการใช้ท่อ | `variant="primary" href="/duct-rental/cancellation/new"` |
| A-166-C005 | 66 | `section`  | `className={styles.ductFilterToolbar} aria-label="ค้นหาและกรองรายการ" role="search"` |
| A-166-C006 | 67 | `form`  | `className="ui-filter" onSubmit={event => { event.preventDefault(); setOffset(0); }}` |
| A-166-C007 | 68 | `FormField`  | `label={kind === "renewal" ? "ค้นหาปีสัญญา (ค.ศ.)" : "ค้นหาคำขอ / โครงการ / เส้นทาง"} className={styles.ductFilterSearch}` |
| A-166-C008 | 72 | `input`  | `className={styles.input} value={query} onChange={event => { setQuery(event.target.value); setOffset(0); }}` |
| A-166-C009 | 74 | `FormField`  | `label="สถานะ"` |
| A-166-C010 | 75 | `select`  | `className={styles.input} value={status} onChange={event => { setStatus(event.target.value); setOffset(0); }}` |
| A-166-C011 | 80 | `button` ค้นหา | `className={styles.button} type="submit"` |
| A-166-C012 | 81 | `button` รีเซ็ต | `className={styles.button} type="button" onClick={() => { setQuery(""); setStatus(""); setOffset(0); }}` |
| A-166-C013 | 86 | `PageSkeleton`  | `shape="table"` |
| A-166-C014 | 89 | `TableRegion`  | `label={&#96;ตารางรายการ ${kind === "renewal" ? "ต่อสัญญา" : "ยกเลิกการใช้ท่อ"} เลื่อนแนวนอนได้&#96;} className={styles.tableWrap}` |
| A-166-C015 | 90 | `table`  | `className={styles.table}` |
| A-166-C016 | 100 | `ProcessStatusBadge`  | `label={labels[row.status]} tone={row.status === "rejected" ? "blocked" : ["completed", "contracted"].includes(row.status) ? "complete" : "in-progress"}` |
| A-166-C017 | 103 | `ButtonLink` เปิดงาน | `variant="secondary" href={&#96;/duct-rental/${kind}/${row.id}&#96;}` |
| A-166-C018 | 109 | `EmptyState`  | `title="ยังไม่มีรายการ" description={&#96;ยังไม่มีงาน${kind === "renewal" ? "ต่อสัญญา" : "ยกเลิกการใช้ท่อ"} ที่ตรงกับตัวกรองที่เลือก&#96;}` |
| A-166-C019 | 115 | `Button` ก่อนหน้า | `variant="secondary" type="button" disabled={!offset} onClick={() => setOffset(previous => Math.max(0, previous - 100))}` |
| A-166-C020 | 116 | `Button` ถัดไป | `variant="secondary" type="button" disabled={rows.length < 100} onClick={() => setOffset(previous => previous + 100)}` |
| A-166-C021 | 120 | `Modal`  | `title="สร้างงานต่อสัญญารายปี" close={() => setCreate(false)}` |
| A-166-C022 | 122 | `FormField`  | `label="ปีสัญญา (ค.ศ.)"` |
| A-166-C023 | 123 | `input`  | `className={styles.input} type="number" min={2000} max={9999} value={year} onChange={event => setYear(Number(event.target.value))}` |
| A-166-C024 | 126 | `Button` กลับ | `variant="secondary" type="button" disabled={busy} onClick={() => setCreate(false)}` |
| A-166-C025 | 127 | `Button` ยืนยันสร้างงาน | `variant="primary" type="button" disabled={busy} onClick={() => void createYear()}` |
| A-166-C026 | 141 | `PageSkeleton`  | `shape="detail"` |
| A-166-C027 | 181 | `PageHeader`  | `title={&#96;ต่อสัญญาปี ${row.year + 543} (${row.year})&#96;} description={renewalLabels[row.status]} parent={{ label: "ต่อสัญญารายปี", href: "/duct-rental/renewal" }}` |
| A-166-C028 | 190 | `PhaseProgress`  | `value={row.status} items={Object.entries(renewalLabels).map(([id, label]) => ({ id, label, description: id === row.status ? "สถานะปัจจุบัน" : undefined }))} onChange={id => announce(&#96;สถานะกระบวนการ ${renewalLabels[id]}&#96;)} label="ความคืบหน้าการต่อสัญญา"` |
| A-166-C029 | 197 | `FormField`  | `label="ค้นหาเส้นทาง"` |
| A-166-C030 | 197 | `input`  | `className={styles.input} value={query} onChange={event => { setQuery(event.target.value); setLimit(50); }}` |
| A-166-C031 | 198 | `FormField`  | `label="ผลการตรวจ"` |
| A-166-C032 | 198 | `select`  | `className={styles.input} value={filter} onChange={event => { setFilter(event.target.value); setLimit(50); }}` |
| A-166-C033 | 202 | `TableRegion`  | `label="ตารางเส้นทางต่อสัญญารายปี เลื่อนแนวนอนได้" className={styles.tableWrap}` |
| A-166-C034 | 203 | `table`  | `className={styles.table}` |
| A-166-C035 | 211 | `Link`  | `href={&#96;/duct-rental/${route.requestId}&#96;}` |
| A-166-C036 | 212 | `details`  | `` |
| A-166-C037 | 212 | `summary` รายละเอียดเส้นทาง | `` |
| A-166-C038 | 228 | `Button` คงไว้ | `variant="secondary" type="button" disabled={busy} onClick={() => { setReview({ id: route.id, status: "keep", notes: route.reviewNotes }); edited(); }}` |
| A-166-C039 | 229 | `Button` ตัดออก | `variant="secondary" type="button" disabled={busy} onClick={() => { setReview({ id: route.id, status: "drop", notes: route.reviewNotes }); edited(); }}` |
| A-166-C040 | 237 | `EmptyState`  | `title="ไม่มีเส้นทางที่ตรงเงื่อนไข" description="ปรับตัวกรองค้นหาหรือผลการตรวจ แล้วลองอีกครั้ง"` |
| A-166-C041 | 238 | `Button` แสดงอีก 50 เส้นทาง | `variant="secondary" type="button" onClick={() => setLimit(previous => previous + 50)}` |
| A-166-C042 | 243 | `FormField`  | `label="เลขที่สัญญา (ถ้ามี)"` |
| A-166-C043 | 244 | `input`  | `className={styles.input} value={contractNumber} readOnly={row.status === "contracted" \|\| !row.capabilities.includes("duct_rental.renewal.contract")} onChange={event => { setContractNumber(event.target.value); edited(); }}` |
| A-166-C044 | 246 | `FormField`  | `label="หมายเหตุผู้ให้บริการ (ถ้ามี)"` |
| A-166-C045 | 247 | `textarea`  | `className={styles.input} value={notes} readOnly={row.status === "contracted" \|\| !row.capabilities.includes("duct_rental.renewal.contract")} onChange={event => { setNotes(event.target.value); edited(); }}` |
| A-166-C046 | 249 | `AttachmentPicker`  | `label="สัญญารายปี (PDF)" file={contract} disabled={busy \|\| !row.capabilities.includes("duct_rental.renewal.contract") \|\| !row.capabilities.includes("duct_rental.document.upload")} change={file => { setContract(file); edited(); }}` |
| A-166-C047 | 255 | `Button` ดูเอกสาร | `variant="secondary" type="button" onClick={() => setPreview(doc.id)}` |
| A-166-C048 | 256 | `ButtonLink` ดาวน์โหลด | `variant="secondary" href={documentUrl(doc.id, true)}` |
| A-166-C049 | 264 | `Button`  | `variant="primary" type="button" disabled={busy \|\| row.status === "draft" && !!pending \|\| row.status === "provider_confirmed" && !contract && !documentId} onClick={() => setConfirm("advance")}` |
| A-166-C050 | 269 | `Button` เก็บเข้าประวัติ | `variant="danger" type="button" disabled={busy} onClick={() => setConfirm("archive")}` |
| A-166-C051 | 271 | `ButtonLink` กลับรายการ | `variant="secondary" href="/duct-rental/renewal"` |
| A-166-C052 | 274 | `Modal`  | `title={review.status === "keep" ? "ยืนยันคงเส้นทางไว้" : "ยืนยันตัดเส้นทางออก"} close={() => { setReview(null); pause(false); }}` |
| A-166-C053 | 275 | `FormField`  | `label="หมายเหตุผลการตรวจ"` |
| A-166-C054 | 276 | `textarea`  | `className={styles.input} value={review.notes} maxLength={10000} onChange={event => setReview(previous => previous ? { ...previous, notes: event.target.value } : null)}` |
| A-166-C055 | 278 | `Button` บันทึกผลการตรวจ | `variant="primary" type="button" disabled={busy} onClick={() => void saveReview()}` |
| A-166-C056 | 282 | `Modal`  | `title={confirm === "archive" ? "ยืนยันเก็บเข้าประวัติ" : "ยืนยันเปลี่ยนสถานะ"} close={() => setConfirm(null)}` |
| A-166-C057 | 284 | `Button` ยืนยัน | `variant="primary" type="button" disabled={busy} onClick={() => { const action = confirm; setConfirm(null); void advance(action); }}` |
| A-166-C058 | 288 | `Modal`  | `title="สัญญารายปี" close={() => setPreview(null)}` |
| A-166-C059 | 289 | `PdfViewer`  | `url={documentUrl(preview)} name="สัญญารายปี"` |
| A-166-C060 | 312 | `PageHeader`  | `title="ขอยกเลิกการใช้ท่อ" parent={{ label: "ยกเลิกการใช้ท่อ", href: "/duct-rental/cancellation" }}` |
| A-166-C061 | 317 | `FormField`  | `label="ค้นหาเส้นทางที่ใช้งานอยู่"` |
| A-166-C062 | 317 | `input`  | `className={styles.input} value={query} onChange={event => setQuery(event.target.value)}` |
| A-166-C063 | 318 | `FormField`  | `label="เส้นทางที่ขอยกเลิก"` |
| A-166-C064 | 319 | `select`  | `className={styles.input} value={requestId} disabled={busy} onChange={event => setRequestId(event.target.value)}` |
| A-166-C065 | 334 | `form`  | `noValidate className={styles.panel} onSubmit={event => { event.preventDefault(); setConfirm(true); }}` |
| A-166-C066 | 336 | `FormField`  | `label="วันที่มีผลยกเลิก"` |
| A-166-C067 | 336 | `input`  | `className={styles.input} type="date" value={date} disabled={busy} onChange={event => setDate(event.target.value)}` |
| A-166-C068 | 337 | `FormField`  | `label="เหตุผลการยกเลิก"` |
| A-166-C069 | 337 | `textarea`  | `className={styles.input} value={reason} maxLength={10000} disabled={busy} onChange={event => setReason(event.target.value)}` |
| A-166-C070 | 338 | `FormField`  | `label="หมายเหตุเพิ่มเติม (ถ้ามี)"` |
| A-166-C071 | 338 | `textarea`  | `className={styles.input} value={notes} maxLength={10000} disabled={busy} onChange={event => setNotes(event.target.value)}` |
| A-166-C072 | 340 | `Button` ขอยกเลิกการใช้ท่อ | `variant="primary" type="submit" disabled={busy \|\| !row \|\| !date \|\| !reason \|\| !row.capabilities.includes("duct_rental.cancellation.create")}` |
| A-166-C073 | 343 | `Modal`  | `title="ยืนยันคำขอยกเลิก" close={() => setConfirm(false)}` |
| A-166-C074 | 346 | `Button` ยกเลิก | `variant="secondary" type="button" disabled={busy} onClick={() => setConfirm(false)}` |
| A-166-C075 | 347 | `Button` ยืนยันสร้างคำขอ | `variant="primary" type="button" disabled={busy} onClick={() => { setConfirm(false); void create(); }}` |
| A-166-C076 | 361 | `PageSkeleton`  | `shape="detail"` |
| A-166-C077 | 381 | `PageHeader`  | `title={&#96;ยกเลิกการใช้ท่อ ${row.snapshot.code}&#96;} description={row.snapshot.projectName} parent={{ label: "ยกเลิกการใช้ท่อ", href: "/duct-rental/cancellation" }}` |
| A-166-C078 | 399 | `ButtonLink` เปิดเส้นทางต้นฉบับ | `variant="secondary" href={&#96;/duct-rental/${row.requestId}&#96;}` |
| A-166-C079 | 401 | `FormField`  | `label="หมายเหตุการดำเนินการ"` |
| A-166-C080 | 402 | `textarea`  | `className={styles.input} value={notes} maxLength={10000} disabled={busy} readOnly={closed \|\| !row.capabilities.some(code => ["duct_rental.cancellation.advance", "duct_rental.cancellation.reject"].includes(code))} onChange={event => { setNotes(event.target.value); pause(true); }}` |
| A-166-C081 | 406 | `Button`  | `variant="primary" type="button" disabled={busy} onClick={() => setConfirm("advance")}` |
| A-166-C082 | 411 | `Button` ปฏิเสธคำขอ | `variant="danger" type="button" disabled={busy} onClick={() => setConfirm("reject")}` |
| A-166-C083 | 414 | `Button` เก็บเข้าประวัติ | `variant="secondary" type="button" disabled={busy} onClick={() => setConfirm("archive")}` |
| A-166-C084 | 416 | `ButtonLink` กลับรายการ | `variant="secondary" href="/duct-rental/cancellation"` |
| A-166-C085 | 419 | `Modal`  | `title={confirm === "reject" ? "ยืนยันปฏิเสธคำขอ" : confirm === "archive" ? "ยืนยันเก็บเข้าประวัติ" : "ยืนยันเปลี่ยนสถานะยกเลิก"} close={() => setConfirm(null)}` |
| A-166-C086 | 422 | `Button` ยกเลิก | `variant="secondary" type="button" disabled={busy} onClick={() => setConfirm(null)}` |
| A-166-C087 | 423 | `Button` ยืนยัน | `variant="primary" type="button" disabled={busy} onClick={() => { const action = confirm; setConfirm(null); void run(action); }}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-166-T001 | 36 | `[offset, setOffset] = useState(0)` |
| A-166-T002 | 36 | `[query, setQuery] = useState("")` |
| A-166-T003 | 36 | `[status, setStatus] = useState("")` |
| A-166-T004 | 36 | `[year, setYear] = useState(new Date().getFullYear() + 1)` |
| A-166-T005 | 36 | `[create, setCreate] = useState(false)` |
| A-166-T006 | 36 | `[busy, setBusy] = useState(false)` |
| A-166-T007 | 36 | `[error, setError] = useState("")` |
| A-166-T008 | 135 | `[paused, setPaused] = useState(false)` |
| A-166-T009 | 146 | `[query, setQuery] = useState("")` |
| A-166-T010 | 146 | `[filter, setFilter] = useState("")` |
| A-166-T011 | 146 | `[busy, setBusy] = useState(false)` |
| A-166-T012 | 146 | `[error, setError] = useState("")` |
| A-166-T013 | 146 | `[review, setReview] = useState<{ id: string; status: "keep" \| "drop"; notes: string } \| null>(null)` |
| A-166-T014 | 146 | `[confirm, setConfirm] = useState<"advance" \| "archive" \| null>(null)` |
| A-166-T015 | 146 | `[contract, setContract] = useState<File \| null>(null)` |
| A-166-T016 | 146 | `[documentId, setDocumentId] = useState(row.contractDocumentId \|\| row.documents[0]?.id \|\| "")` |
| A-166-T017 | 146 | `[contractNumber, setContractNumber] = useState(row.contractNumber \|\| "")` |
| A-166-T018 | 146 | `[notes, setNotes] = useState(row.thirdPartyNotes \|\| "")` |
| A-166-T019 | 146 | `[preview, setPreview] = useState<string \| null>(null)` |
| A-166-T020 | 146 | `[limit, setLimit] = useState(50)` |
| A-166-T021 | 296 | `[query, setQuery] = useState("")` |
| A-166-T022 | 296 | `[requestId, setRequestId] = useState(selected \|\| "")` |
| A-166-T023 | 296 | `[date, setDate] = useState("")` |
| A-166-T024 | 296 | `[reason, setReason] = useState("")` |
| A-166-T025 | 296 | `[notes, setNotes] = useState("")` |
| A-166-T026 | 296 | `[busy, setBusy] = useState(false)` |
| A-166-T027 | 296 | `[error, setError] = useState("")` |
| A-166-T028 | 296 | `[confirm, setConfirm] = useState(false)` |
| A-166-T029 | 355 | `[paused, setPaused] = useState(false)` |
| A-166-T030 | 366 | `[notes, setNotes] = useState(row.notes)` |
| A-166-T031 | 366 | `[confirm, setConfirm] = useState<"advance" \| "reject" \| "archive" \| null>(null)` |
| A-166-T032 | 366 | `[busy, setBusy] = useState(false)` |
| A-166-T033 | 366 | `[error, setError] = useState("")` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-166-E001 | 239 | `["provider_confirmed", "contracted"].includes(row.status)` |
| A-166-E002 | 264 | `setConfirm("advance")` |
| A-166-E003 | 269 | `setConfirm("archive")` |
| A-166-E004 | 282 | `setConfirm(null)` |
| A-166-E005 | 284 | `setConfirm(null)` |
| A-166-E006 | 334 | `setConfirm(true)` |
| A-166-E007 | 343 | `setConfirm(false)` |
| A-166-E008 | 346 | `setConfirm(false)` |
| A-166-E009 | 347 | `setConfirm(false)` |
| A-166-E010 | 406 | `setConfirm("advance")` |
| A-166-E011 | 411 | `setConfirm("reject")` |
| A-166-E012 | 414 | `setConfirm("archive")` |
| A-166-E013 | 419 | `setConfirm(null)` |
| A-166-E014 | 422 | `setConfirm(null)` |
| A-166-E015 | 423 | `setConfirm(null)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-166-B001 | 30 | `status === "Overdue"` |
| A-166-B002 | 30 | `status === "Completed"` |
| A-166-B003 | 37 | `kind === "renewal"` |
| A-166-B004 | 38 | `kind === "renewal"` |
| A-166-B005 | 53 | `kind === "renewal"` |
| A-166-B006 | 56 | `permissions.includes(&#96;duct_rental.${kind}.create&#96;)` |
| A-166-B007 | 57 | `kind === "renewal"` |
| A-166-B008 | 69 | `kind === "renewal"` |
| A-166-B009 | 85 | `model.loading` |
| A-166-B010 | 89 | `kind === "renewal"` |
| A-166-B011 | 97 | `"year" in row` |
| A-166-B012 | 99 | `"year" in row` |
| A-166-B013 | 100 | `row.status === "rejected"` |
| A-166-B014 | 100 | `["completed", "contracted"].includes(row.status)` |
| A-166-B015 | 100 | `"year" in row` |
| A-166-B016 | 101 | `"year" in row` |
| A-166-B017 | 102 | `kind === "renewal"` |
| A-166-B018 | 102 | `"year" in row` |
| A-166-B019 | 102 | `row.status === "contracted"` |
| A-166-B020 | 102 | `row.status === "rejected"` |
| A-166-B021 | 109 | `kind === "renewal"` |
| A-166-B022 | 113 | `kind === "renewal"` |
| A-166-B023 | 139 | `model.data` |
| A-166-B024 | 151 | `!review` |
| A-166-B025 | 166 | `action === "advance" && contract` |
| A-166-B026 | 171 | `action === "advance" && row.status === "provider_confirmed"` |
| A-166-B027 | 171 | `selected` |
| A-166-B028 | 187 | `row.status === "contracted"` |
| A-166-B029 | 192 | `id === row.status` |
| A-166-B030 | 225 | `route.reviewStatus === "keep"` |
| A-166-B031 | 225 | `route.reviewStatus === "drop"` |
| A-166-B032 | 265 | `row.status === "draft"` |
| A-166-B033 | 265 | `row.status === "sent_to_3rdparty"` |
| A-166-B034 | 265 | `row.status === "memo_preparing"` |
| A-166-B035 | 274 | `review.status === "keep"` |
| A-166-B036 | 276 | `previous` |
| A-166-B037 | 282 | `confirm === "archive"` |
| A-166-B038 | 297 | `requestId` |
| A-166-B039 | 297 | `requestId` |
| A-166-B040 | 299 | `!row` |
| A-166-B041 | 330 | `row.rate` |
| A-166-B042 | 359 | `model.data` |
| A-166-B043 | 387 | `row.status === "rejected"` |
| A-166-B044 | 407 | `cancellationTransitions[row.status as keyof typeof cancellationTransitions] === "completed"` |
| A-166-B045 | 419 | `confirm === "reject"` |
| A-166-B046 | 419 | `confirm === "archive"` |
| A-166-B047 | 420 | `confirm === "advance" && row.status === "tracking"` |

## A-167 — `src/modules/duct-rental/components/request-form.tsx`

- Status: PLANNED. Consumers: S-010, S-016, S-020.
- Normalized UTF-8/LF source SHA-256: `83b775a5d275ba39706566b9504b0d79559be15f153fc3f15355d4c09721a138`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-167-F001 | 29 | `RequestForm` | `export function RequestForm(` |
| A-167-F002 | 54 | `warn` | `(event: BeforeUnloadEvent) ` |
| A-167-F003 | 61 | `change` | `(next: DesignValues) ` |
| A-167-F004 | 62 | `save` | `async (submit: boolean) ` |
| A-167-F005 | 84 | `leave` | `(event: MouseEvent<HTMLAnchorElement>) ` |
| A-167-F006 | 117 | `RequestEdit` | `export function RequestEdit(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-167-C001 | 89 | `Panel`  | `title="เอกสารจากทีมออกแบบ"` |
| A-167-C002 | 89 | `AttachmentPicker`  | `label="Memo (ถ้ามี)" file={memo} change={file => { setMemo(file); setDirty(true); pause?.(true); }}` |
| A-167-C003 | 89 | `AttachmentPicker`  | `label="แบบท่อจากทีมออกแบบ (ถ้ามี)" file={drawing} change={file => { setDrawing(file); setDirty(true); pause?.(true); }}` |
| A-167-C004 | 89 | `EmptyState`  | `title="ไม่มีเอกสารที่ต้องแนบ" description="คุณสามารถดำเนินการต่อได้โดยไม่แนบเอกสาร"` |
| A-167-C005 | 91 | `PageHeader`  | `title={request ? &#96;แก้ไขคำขอ ${request.code}&#96; : "สร้างคำขอเช่าท่อร้อยสาย"} parent={{ label: "เช่าท่อร้อยสาย", href: "/duct-rental" }} description="บันทึกร่างได้ และกรอกข้อมูลให้ครบก่อนส่งให้ทีมเขียนแบบ"` |
| A-167-C006 | 94 | `div`  | `className={styles.formStatus} aria-live="polite"` |
| A-167-C007 | 94 | `RequestStatusBadge`  | `label={readonly ? "อ่านอย่างเดียว" : dirty ? "ยังไม่ได้บันทึก" : "พร้อมดำเนินการ"} tone={error ? "danger" : dirty ? "warning" : "success"} description={message \|\| undefined}` |
| A-167-C008 | 94 | `StatusBadge`  | `label={sync?.online === false ? "ออฟไลน์" : "พร้อมแก้ไข"} tone={sync?.online === false ? "warning" : "info"}` |
| A-167-C009 | 96 | `RequestTabs`  | `tabs={sectionTabs} activeTab={section} onChange={setSection} label="ส่วนของคำขอ" selectionMode="radiogroup"` |
| A-167-C010 | 97 | `form`  | `noValidate onSubmit={event => { event.preventDefault(); setConfirm(true); }}` |
| A-167-C011 | 99 | `RequestFormShell`  | `form={<div className={styles.requestFormContent}> {section === "design" && <DesignEditor values={values} change={change} errors={errors} readonly={!canSave && !canSubmit} />} {section === "documents" && documents} {section === "review" && <Panel title="Review"><TableRegion label="ตารางตรวจสอบข้อมูลคำขอ เลื่อนแนวนอนได้" className={styles.reviewTableWrap}><table className={styles.reviewTable}><caption className={styles.visuallyHidden}>ข้อมูลที่กรอกในแบบคำขอ</caption><thead><tr><th scope="col">รายการ</th><th scope="col">ข้อมูล</th></tr></thead><tbody>{required.map(name => <tr key={name}><th scope="row">{name}</th><td>{String(values[name] ?? "—") \|\| "—"}</td></tr>)}</tbody></table></TableRegion></Panel>} {section === "nt-form" && <Panel title="NT Form"><p className={styles.muted}>ตรวจสอบข้อมูล Design และเอกสารให้ครบก่อนดำเนินการ</p></Panel>} {section === "signing" && <Panel title="Signing"><p className={styles.muted}>ยังไม่สามารถลงนามได้ในขั้นตอนออกแบบ</p></Panel>} {section === "complete" && <Panel title="Complete"><p>คำขอนี้เสร็จสมบูรณ์แล้ว</p></Panel>} </div>} coordinatorPanel={<div className={styles.coordinatorStack}> {!request && <Panel title="ทีมเจ้าของคำขอ"><FormField label="ทีมเจ้าของคำขอ"><select value={teamId} disabled={busy \|\| !canSave} onChange={event => setTeamId(event.target.value)}><option value="">ไม่ระบุทีม</option>{options.data?.teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></FormField></Panel>} {!readonly && <Panel title="เลือกผู้ประสานหน้างาน"><FormField label="ผู้ประสานงานตามศูนย์บริการ"><select value={coordinatorId} disabled={!canSave && !canSubmit} onChange={event => { const person = options.data?.coordinators.find(item => item.id === event.target.value); setCoordinatorId(event.target.value); if (person) change({ ...values, installContactName: person.display_name, installContactEmail: person.email, installContactPhone: person.phone }); }}><option value="">กรอกข้อมูลผู้ประสานงานเอง</option>{options.data?.coordinators.map(person => <option key={person.id} value={person.id}>{person.display_name}</option>)}</select></FormField>{!options.data?.coordinators.length && <EmptyState title="ไม่พบผู้ประสานงาน" description="สามารถกรอกชื่อและข้อมูลติดต่อเองได้" />}<Notice text={options.error} error /></Panel>} {documents} </div>}` |
| A-167-C012 | 100 | `DesignEditor`  | `values={values} change={change} errors={errors} readonly={!canSave && !canSubmit}` |
| A-167-C013 | 102 | `Panel`  | `title="Review"` |
| A-167-C014 | 102 | `TableRegion`  | `label="ตารางตรวจสอบข้อมูลคำขอ เลื่อนแนวนอนได้" className={styles.reviewTableWrap}` |
| A-167-C015 | 102 | `table`  | `className={styles.reviewTable}` |
| A-167-C016 | 103 | `Panel`  | `title="NT Form"` |
| A-167-C017 | 104 | `Panel`  | `title="Signing"` |
| A-167-C018 | 105 | `Panel`  | `title="Complete"` |
| A-167-C019 | 107 | `Panel`  | `title="ทีมเจ้าของคำขอ"` |
| A-167-C020 | 107 | `FormField`  | `label="ทีมเจ้าของคำขอ"` |
| A-167-C021 | 107 | `select`  | `value={teamId} disabled={busy \|\| !canSave} onChange={event => setTeamId(event.target.value)}` |
| A-167-C022 | 108 | `Panel`  | `title="เลือกผู้ประสานหน้างาน"` |
| A-167-C023 | 108 | `FormField`  | `label="ผู้ประสานงานตามศูนย์บริการ"` |
| A-167-C024 | 108 | `select`  | `value={coordinatorId} disabled={!canSave && !canSubmit} onChange={event => { const person = options.data?.coordinators.find(item => item.id === event.target.value); setCoordinatorId(event.target.value); if (person) change({ ...values, installContactName: person.display_name, installContactEmail: person.email, installContactPhone: person.phone }); }}` |
| A-167-C025 | 108 | `EmptyState`  | `title="ไม่พบผู้ประสานงาน" description="สามารถกรอกชื่อและข้อมูลติดต่อเองได้"` |
| A-167-C026 | 112 | `ButtonLink` กลับ | `variant="ghost" href={savedId ? &#96;/duct-rental/${savedId}&#96; : "/duct-rental"} onClick={leave}` |
| A-167-C027 | 112 | `Button` บันทึกร่าง | `disabled={busy \|\| !canSave} onClick={() => void save(false)}` |
| A-167-C028 | 112 | `Button` ส่งให้ทีมเขียนแบบ | `variant="primary" type="submit" disabled={busy \|\| !canSubmit}` |
| A-167-C029 | 114 | `Modal`  | `title="ยืนยันส่งคำขอ" close={() => setConfirm(false)}` |
| A-167-C030 | 114 | `Button` กลับไปตรวจข้อมูล | `variant="ghost" onClick={() => setConfirm(false)}` |
| A-167-C031 | 114 | `Button` ยืนยันส่งคำขอ | `variant="primary" onClick={() => { setConfirm(false); void save(true); }}` |
| A-167-C032 | 120 | `PageSkeleton`  | `shape="detail"` |
| A-167-C033 | 124 | `ErrorState`  | `embedded reset={() => void model.refresh()}` |
| A-167-C034 | 125 | `Button` ลองโหลดอีกครั้ง | `type="button" onClick={() => void model.refresh()}` |
| A-167-C035 | 126 | `Link` กลับรายการคำขอ | `href="/duct-rental"` |
| A-167-C036 | 130 | `RequestForm`  | `key={&#96;${id}:${model.data.version}&#96;} request={model.data} user={user} permissions={permissions} pause={setPaused} sync={model}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-167-T001 | 31 | `[values, setValues] = useState<DesignValues>(request ? Object.fromEntries(Object.entries(request.design).filter(([, value]) => value !== undefined)) as DesignValues : { requestType: "NEW", ownerDuct: "NT", jobType: "Network", designContactName: user.displayName, designContactEmail: user.email })` |
| A-167-T002 | 32 | `[version, setVersion] = useState(request?.version ?? 1)` |
| A-167-T003 | 32 | `[savedId, setSavedId] = useState(request?.id)` |
| A-167-T004 | 32 | `[teamId, setTeamId] = useState(request?.teamId ?? "")` |
| A-167-T005 | 33 | `[memo, setMemo] = useState<File \| null>(null)` |
| A-167-T006 | 33 | `[drawing, setDrawing] = useState<File \| null>(null)` |
| A-167-T007 | 33 | `[coordinatorId, setCoordinatorId] = useState("")` |
| A-167-T008 | 34 | `[busy, setBusy] = useState(false)` |
| A-167-T009 | 34 | `[dirty, setDirty] = useState(false)` |
| A-167-T010 | 34 | `[error, setError] = useState("")` |
| A-167-T011 | 34 | `[message, setMessage] = useState("")` |
| A-167-T012 | 34 | `[errors, setErrors] = useState<Record<string, string>>({})` |
| A-167-T013 | 34 | `[confirm, setConfirm] = useState(false)` |
| A-167-T014 | 34 | `[section, setSection] = useState("design")` |
| A-167-T015 | 118 | `[paused, setPaused] = useState(false)` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-167-E001 | 84 | `window.confirm("มีข้อมูลที่ยังไม่ได้บันทึก ต้องการออกจากหน้านี้หรือไม่")` |
| A-167-E002 | 97 | `setConfirm(true)` |
| A-167-E003 | 114 | `setConfirm(false)` |
| A-167-E004 | 114 | `setConfirm(false)` |
| A-167-E005 | 114 | `setConfirm(false)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-167-B001 | 31 | `request` |
| A-167-B002 | 40 | `!people?.length \|\| !values.serviceCenter \|\| readonly \|\| autoCoordinator.current === &#96;${values.serviceCenter}:${people[0].id}&#96;` |
| A-167-B003 | 44 | `!active` |
| A-167-B004 | 54 | `dirty` |
| A-167-B005 | 59 | `savedId` |
| A-167-B006 | 60 | `savedId` |
| A-167-B007 | 61 | `next.serviceCenter !== values.serviceCenter` |
| A-167-B008 | 64 | `submit` |
| A-167-B009 | 66 | `!valid.success` |
| A-167-B010 | 68 | `submit` |
| A-167-B011 | 71 | `!id` |
| A-167-B012 | 72 | `!submit` |
| A-167-B013 | 73 | `file` |
| A-167-B014 | 76 | `fileType === "memo"` |
| A-167-B015 | 78 | `submit` |
| A-167-B016 | 81 | `reason instanceof ApiError` |
| A-167-B017 | 84 | `dirty && !window.confirm("มีข้อมูลที่ยังไม่ได้บันทึก ต้องการออกจากหน้านี้หรือไม่")` |
| A-167-B018 | 89 | `caps.includes("duct_rental.document.upload") && !readonly` |
| A-167-B019 | 90 | `request` |
| A-167-B020 | 91 | `request` |
| A-167-B021 | 94 | `readonly` |
| A-167-B022 | 94 | `dirty` |
| A-167-B023 | 94 | `error` |
| A-167-B024 | 94 | `dirty` |
| A-167-B025 | 94 | `sync?.online === false` |
| A-167-B026 | 94 | `sync?.online === false` |
| A-167-B027 | 108 | `person` |
| A-167-B028 | 112 | `busy` |
| A-167-B029 | 112 | `dirty` |
| A-167-B030 | 112 | `savedId` |
| A-167-B031 | 119 | `!model.data` |
| A-167-B032 | 120 | `model.loading` |

## A-168 — `src/modules/duct-rental/components/request-list.tsx`

- Status: PLANNED. Consumers: S-017.
- Normalized UTF-8/LF source SHA-256: `4cb42cee2892029b398cfcb35ac844a6a2c0bdf4a1ebf8bf29710471a3e8fd97`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-168-F001 | 22 | `RequestListWorkspace` | `export function RequestListWorkspace(` |
| A-168-F002 | 26 | `filter` | `(name: keyof typeof filters, value: string) ` |
| A-168-F003 | 35 | `clearFilters` | `() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-168-C001 | 47 | `details`  | `className={styles.workflowDisclosure}` |
| A-168-C002 | 48 | `summary`  | `` |
| A-168-C003 | 49 | `PhaseTabs`  | `phase={(filters.phase \|\| "DESIGN") as keyof typeof phaseLabels} tabs={requestPhases.map(phase => ({ phase, label: phaseLabels[phase], status: String(model.data?.pipeline.find(item => item.phase === phase)?.count ?? 0) }))} onChange={phase => filter("phase", phase)} label="กรองตามขั้นตอนคำขอ"` |
| A-168-C004 | 56 | `section`  | `className={styles.filterSection} aria-label="ค้นหาและกรองคำขอ" role="search"` |
| A-168-C005 | 57 | `form`  | `className={&#96;ui-filter ${styles.searchRow}&#96;} onSubmit={event => { event.preventDefault(); filter("query", query); }}` |
| A-168-C006 | 58 | `FormField`  | `label="ค้นหาคำขอ / โครงการ / เส้นทาง" className={styles.ductFilterSearch}` |
| A-168-C007 | 59 | `input`  | `className={styles.input} name="query" value={query} onChange={event => setQuery(event.target.value)} maxLength={200} placeholder="รหัส โครงการ เจ้าของท่อ จังหวัด หรือศูนย์บริการ"` |
| A-168-C008 | 61 | `Button` ค้นหา | `variant="primary" type="submit"` |
| A-168-C009 | 62 | `Button` ตัวกรองขั้นสูง · | `variant="ghost" type="button" aria-expanded={advancedOpen} aria-controls="duct-advanced-filters" onClick={() => setAdvancedOpen(open => !open)}` |
| A-168-C010 | 63 | `Button` ล้างตัวกรองทั้งหมด | `variant="ghost" type="button" disabled={!hasActiveFilters} onClick={clearFilters}` |
| A-168-C011 | 66 | `FormField`  | `label="ขั้นตอน"` |
| A-168-C012 | 66 | `select`  | `className={styles.input} value={filters.phase} onChange={event => filter("phase", event.target.value)}` |
| A-168-C013 | 67 | `FormField`  | `label="ประเภทคำขอ"` |
| A-168-C014 | 67 | `select`  | `className={styles.input} value={filters.requestType} onChange={event => filter("requestType", event.target.value)}` |
| A-168-C015 | 68 | `FormField`  | `label="ศูนย์บริการ"` |
| A-168-C016 | 68 | `select`  | `className={styles.input} value={filters.serviceCenter} onChange={event => filter("serviceCenter", event.target.value)}` |
| A-168-C017 | 69 | `FormField`  | `label="เอกสาร"` |
| A-168-C018 | 69 | `select`  | `className={styles.input} value={filters.documents} onChange={event => filter("documents", event.target.value)}` |
| A-168-C019 | 70 | `FormField`  | `label="สถานะงาน"` |
| A-168-C020 | 70 | `select`  | `className={styles.input} value={filters.workflow} onChange={event => filter("workflow", event.target.value)}` |
| A-168-C021 | 71 | `button` × | `className={styles.filterChip} key={key} type="button" aria-label={&#96;ล้างตัวกรอง ${key}&#96;} onClick={() => { if (key === "query") setQuery(""); filter(key, ""); }}` |
| A-168-C022 | 74 | `PageSkeleton`  | `shape="table"` |
| A-168-C023 | 75 | `TableRegion`  | `label="ตารางคำขอเช่าท่อร้อยสาย เลื่อนแนวนอนได้" className={styles.ductTableWrap}` |
| A-168-C024 | 76 | `table`  | `className={&#96;ui-table ${styles.table}&#96;}` |
| A-168-C025 | 80 | `button`  | `className={styles.recordLink} type="button" onClick={() => setDetail(row.id)} aria-label={&#96;ดูรายละเอียด ${row.code}&#96;}` |
| A-168-C026 | 83 | `RequestStatusBadge`  | `label={workflowLabels[workflowStatus({ currentPhase: row.phase, cancelledAt: row.cancelledAt ?? undefined, phaseStatuses: row.phaseStatuses })] ?? "กำลังดำเนินการ"} tone="neutral"` |
| A-168-C027 | 84 | `RequestStatusBadge`  | `label={row.documentsIncomplete ? "เอกสารค้าง" : "เอกสารครบ"} tone={row.documentsIncomplete ? "warning" : "success"}` |
| A-168-C028 | 85 | `ButtonLink` เปิดงาน | `variant="ghost" href={&#96;/duct-rental/${row.id}&#96;}` |
| A-168-C029 | 87 | `div`  | `className={styles.embeddedEmpty} role={model.error ? "alert" : "status"}` |
| A-168-C030 | 91 | `Button` อัปเดตข้อมูลอีกครั้ง | `variant="secondary" onClick={() => model.refresh()}` |
| A-168-C031 | 91 | `Button` ล้างตัวกรอง | `variant="ghost" onClick={clearFilters}` |
| A-168-C032 | 91 | `ButtonLink` สร้างคำขอ | `variant="secondary" href="/duct-rental/new"` |
| A-168-C033 | 94 | `Button` ก่อนหน้า | `variant="ghost" type="button" disabled={offset === 0} onClick={() => setOffset(previous => Math.max(0, previous - 50))}` |
| A-168-C034 | 94 | `Button` ถัดไป | `variant="ghost" type="button" disabled={model.data?.nextOffset == null} onClick={() => setOffset(model.data!.nextOffset!)}` |
| A-168-C035 | 99 | `RequestShell`  | `className={styles.ductList} title="เช่าท่อร้อยสาย" description="สร้างคำขอ ติดตามการอนุญาตและติดตั้ง และดูเส้นทางเช่าท่อที่ใช้งานอยู่" actions={( <> {permissions.includes("duct_rental.settings.manage") && ( <ButtonLink variant="secondary" href="/duct-rental/settings">ตั้งค่าผู้ประสานงาน</ButtonLink> )} {permissions.includes("duct_rental.request.create") && ( <ButtonLink variant="primary" href="/duct-rental/new">สร้างคำขอ</ButtonLink> )} {permissions.includes("duct_rental.module.view") && ( <ButtonLink variant="secondary" href="/duct-rental/renewal">ต่อสัญญารายปี</ButtonLink> )} {permissions.includes("duct_rental.module.view") && ( <ButtonLink variant="secondary" href="/duct-rental/cancellation">ขอยกเลิกการใช้ท่อ</ButtonLink> )} {permissions.includes("duct_rental.module.view") && ( <ButtonLink variant="ghost" href="/duct-rental/tracking">ติดตามงานต่อสัญญาและยกเลิก</ButtonLink> )} </> )}` |
| A-168-C036 | 106 | `ButtonLink` ตั้งค่าผู้ประสานงาน | `variant="secondary" href="/duct-rental/settings"` |
| A-168-C037 | 109 | `ButtonLink` สร้างคำขอ | `variant="primary" href="/duct-rental/new"` |
| A-168-C038 | 112 | `ButtonLink` ต่อสัญญารายปี | `variant="secondary" href="/duct-rental/renewal"` |
| A-168-C039 | 115 | `ButtonLink` ขอยกเลิกการใช้ท่อ | `variant="secondary" href="/duct-rental/cancellation"` |
| A-168-C040 | 118 | `ButtonLink` ติดตามงานต่อสัญญาและยกเลิก | `variant="ghost" href="/duct-rental/tracking"` |
| A-168-C041 | 124 | `RequestTabs`  | `value="requests" label="มุมมองรายการคำขอ" tabs={[{ id: "requests", label: "รายการคำขอ", content: panel }]}` |
| A-168-C042 | 129 | `Modal`  | `title="รายละเอียดคำขอเช่าท่อ" close={() => setDetail(null)}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-168-T001 | 23 | `[filters, setFilters] = useState(emptyFilters)` |
| A-168-T002 | 23 | `[query, setQuery] = useState("")` |
| A-168-T003 | 23 | `[offset, setOffset] = useState(0)` |
| A-168-T004 | 23 | `[advancedOpen, setAdvancedOpen] = useState(false)` |
| A-168-T005 | 25 | `[detail, setDetail] = useState<string \| null>(null)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-168-B001 | 29 | `value` |
| A-168-B002 | 29 | `name === "phase"` |
| A-168-B003 | 29 | `name === "workflow"` |
| A-168-B004 | 29 | `name === "documents"` |
| A-168-B005 | 71 | `key === "query"` |
| A-168-B006 | 71 | `key === "query"` |
| A-168-B007 | 71 | `key === "phase"` |
| A-168-B008 | 74 | `model.loading` |
| A-168-B009 | 76 | `rows.length` |
| A-168-B010 | 84 | `row.documentsIncomplete` |
| A-168-B011 | 84 | `row.documentsIncomplete` |
| A-168-B012 | 87 | `model.error` |
| A-168-B013 | 89 | `model.error` |
| A-168-B014 | 89 | `activeCount` |
| A-168-B015 | 90 | `model.error` |
| A-168-B016 | 90 | `activeCount` |
| A-168-B017 | 91 | `model.error` |
| A-168-B018 | 91 | `activeCount` |
| A-168-B019 | 94 | `model.data?.counts.total` |
| A-168-B020 | 94 | `model.data?.nextOffset == null` |

## A-169 — `src/modules/duct-rental/components/request-workspace.tsx`

- Status: PLANNED. Consumers: S-009, S-011, S-017.
- Normalized UTF-8/LF source SHA-256: `665148997297aaed30408f20bd741d0586e5228fefe30ac1a69f9486f0fbe3d6`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-169-F001 | 35 | `RequestWorkspace` | `export function RequestWorkspace(` |
| A-169-F002 | 44 | `RequestPane` | `function RequestPane(` |
| A-169-F003 | 56 | `changed` | `() ` |
| A-169-F004 | 63 | `has` | `(kind: string, stage?: string) ` |
| A-169-F005 | 65 | `data` | `() ` |
| A-169-F006 | 66 | `run` | `async function run(action: "accept" \| "save" \| "submit" \| "archive") ` |
| A-169-F007 | 81 | `ntSave` | `async function ntSave() ` |
| A-169-F008 | 86 | `assign` | `async function assign() ` |
| A-169-F009 | 91 | `autoNotes` | `(value: string) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-169-C001 | 38 | `PageSkeleton`  | `shape="detail"` |
| A-169-C002 | 38 | `button` ลองโหลดอีกครั้ง | `className={styles.button} type="button" onClick={() => void model.refresh()}` |
| A-169-C003 | 38 | `Link` กลับรายการคำขอ | `href="/duct-rental"` |
| A-169-C004 | 96 | `RequestTabs`  | `tabs={viewTabs} activeTab={phase === "DESIGN" && !missingView ? (view ?? "overview") : (view ?? phaseViews[phase] ?? "overview")} onChange={next => router.push(&#96;/duct-rental/${row.id}/${next}&#96;)} label="มุมมองคำขอ 10 ขั้นตอน"` |
| A-169-C005 | 98 | `section`  | `className={styles.panel} role="status"` |
| A-169-C006 | 98 | `Link` กลับหน้ารายการ | `className={styles.button} href="/duct-rental"` |
| A-169-C007 | 98 | `button` ทำงานต่อ | `className={styles.primary} onClick={() => { setShowCreated(false); router.replace(&#96;/duct-rental/${row.id}/draftsman&#96;); }}` |
| A-169-C008 | 100 | `PhaseTabs`  | `id={row.id} phase={phase === "COMPLETE" ? "DESIGN" : phase} statuses={row.phaseStatuses}` |
| A-169-C009 | 104 | `RequestStatusBadge`  | `label={statusLabel} tone={phaseStatuses[phase] === "done" ? "success" : phaseStatuses[phase] === "accepted" ? "info" : "neutral"} description={phaseLabels[phase]}` |
| A-169-C010 | 104 | `button` รับงาน | `className={styles.primary} type="button" disabled={busy} onClick={() => void run("accept")}` |
| A-169-C011 | 105 | `RequestFormShell`  | `form={<DesignEditorShell canvas={<details className={styles.panel} open={phase === "DESIGN"}><summary className={styles.sectionSummary}>ข้อมูลออกแบบและผู้ประสานงาน</summary><DesignEditor values={Object.fromEntries(Object.entries(row.design).filter(([, value]) => value !== undefined)) as Record<string, string \| number>} change={() => {}} readonly /></details>} />} coordinatorPanel={<aside className={styles.panel}><h2>เอกสารค้าง</h2><Field label="รายการที่ต้องติดตาม"><textarea value={missingDocs} maxLength={10000} readOnly={!canSubmit} disabled={busy} onChange={event => { setMissingDocs(event.target.value); changed(); }} /></Field>{canUpload && <AttachmentPicker label="ประกอบไฟล์ Memo (PDF)" file={files.memo} change={file => { setFiles(previous => ({ ...previous, memo: file })); changed(); }} disabled={busy} />}</aside>}` |
| A-169-C012 | 105 | `DesignEditorShell`  | `canvas={<details className={styles.panel} open={phase === "DESIGN"}><summary className={styles.sectionSummary}>ข้อมูลออกแบบและผู้ประสานงาน</summary><DesignEditor values={Object.fromEntries(Object.entries(row.design).filter(([, value]) => value !== undefined)) as Record<string, string \| number>} change={() => {}} readonly /></details>}` |
| A-169-C013 | 105 | `details`  | `className={styles.panel} open={phase === "DESIGN"}` |
| A-169-C014 | 105 | `summary` ข้อมูลออกแบบและผู้ประสานงาน | `className={styles.sectionSummary}` |
| A-169-C015 | 105 | `DesignEditor`  | `values={Object.fromEntries(Object.entries(row.design).filter(([, value]) => value !== undefined)) as Record<string, string \| number>} change={() => {}} readonly` |
| A-169-C016 | 105 | `textarea`  | `value={missingDocs} maxLength={10000} readOnly={!canSubmit} disabled={busy} onChange={event => { setMissingDocs(event.target.value); changed(); }}` |
| A-169-C017 | 105 | `AttachmentPicker`  | `label="ประกอบไฟล์ Memo (PDF)" file={files.memo} change={file => { setFiles(previous => ({ ...previous, memo: file })); changed(); }} disabled={busy}` |
| A-169-C018 | 107 | `details`  | `className={styles.panel} open={phase === "DESIGN"}` |
| A-169-C019 | 107 | `summary` ข้อมูลออกแบบและผู้ประสานงาน | `className={styles.sectionSummary}` |
| A-169-C020 | 107 | `DesignEditor`  | `values={Object.fromEntries(Object.entries(row.design).filter(([, value]) => value !== undefined)) as Record<string, string \| number>} change={() => {}} readonly` |
| A-169-C021 | 108 | `a` ดาวน์โหลด PDF สรุป | `className={styles.button} href={&#96;/api/duct-rental/requests/${row.id}/summary&#96;}` |
| A-169-C022 | 108 | `a` ดาวน์โหลด NT Form | `className={styles.button} href={&#96;/api/duct-rental/requests/${row.id}/nt-preview?download=1&#96;}` |
| A-169-C023 | 108 | `button` ดู NT Form | `className={styles.button} type="button" onClick={() => setPreview({ url: &#96;/api/duct-rental/requests/${row.id}/nt-preview&#96;, title: "NT Form" })}` |
| A-169-C024 | 108 | `button` บันทึก NT Form | `className={styles.primary} type="button" disabled={busy} onClick={() => void ntSave()}` |
| A-169-C025 | 108 | `Link` แก้ไขข้อมูลออกแบบ | `className={styles.primary} href={&#96;/duct-rental/${row.id}/edit&#96;}` |
| A-169-C026 | 109 | `details`  | `` |
| A-169-C027 | 109 | `summary` แบบฟอร์ม NT ต้นฉบับและตัวอย่าง | `` |
| A-169-C028 | 109 | `button` ดูแบบฟอร์ม | `className={styles.button} onClick={() => setPreview({url:&#96;/api/duct-rental/requests/${row.id}/nt-template?variant=${item.variant}&#96;,title:item.label})}` |
| A-169-C029 | 109 | `a` ดาวน์โหลดต้นฉบับ | `className={styles.button} href={&#96;/api/duct-rental/requests/${row.id}/nt-template?variant=${item.variant}&download=1&#96;}` |
| A-169-C030 | 109 | `Link` เปิดงานลงนามที่ได้รับมอบหมาย | `className={styles.primary} href={&#96;/duct-rental/tasks?task=${row.signoff.id}&#96;}` |
| A-169-C031 | 109 | `input`  | `value={reference} maxLength={200} readOnly={!canSubmit} onChange={event => { setReference(event.target.value); changed(); }}` |
| A-169-C032 | 109 | `button` สร้างและตรวจ NT Form | `className={styles.primary} type="button" disabled={busy \|\| !canUpload \|\| !reference.trim()} onClick={() => setPreview({ url: &#96;/api/duct-rental/requests/${row.id}/nt-preview?reference=${encodeURIComponent(reference)}&#96;, title: "ตรวจ NT Form ก่อนบันทึก", nt: true })}` |
| A-169-C033 | 109 | `button` ขอให้ลงนามใหม่ | `className={styles.button} type="button" disabled={busy} onClick={() => { setBusy(true); void apiPost(&#96;signatures/${row.signoff!.id}/revoke&#96;, { version: row.signoff!.version }).then(reload).catch(reason => setError(errorText(reason))).finally(() => setBusy(false)); }}` |
| A-169-C034 | 109 | `select`  | `value={signer} disabled={busy \|\| !current \|\| closed} onChange={event => { setSigner(event.target.value); changed(); }}` |
| A-169-C035 | 109 | `button` บันทึกผู้ลงนาม | `className={styles.button} type="button" disabled={busy \|\| !signer \|\| !current \|\| closed} onClick={() => void assign()}` |
| A-169-C036 | 110 | `input`  | `name={field.name} type={field.type} step="any" value={install[field.name] ?? ""} readOnly={!canSubmit} disabled={busy} onChange={event => { setInstall(previous => ({ ...previous, [field.name]: event.target.value })); changed(); }}` |
| A-169-C037 | 111 | `details`  | `className={styles.panel}` |
| A-169-C038 | 111 | `summary` ข้อมูลจากทีมติดตั้ง | `className={styles.sectionSummary}` |
| A-169-C039 | 112 | `input`  | `type={field.type} inputMode={field.type === "text" ? "decimal" : undefined} value={rate[field.name as keyof typeof rate]} readOnly={!canSubmit} disabled={busy} onChange={event => { setRate(previous => ({ ...previous, [field.name]: event.target.value })); changed(); }}` |
| A-169-C040 | 114 | `select`  | `value={guarantee.paymentType} disabled={!canSubmit \|\| busy} onChange={event => { setGuarantee(previous => ({ ...previous, paymentType: event.target.value })); changed(); }}` |
| A-169-C041 | 114 | `select`  | `value={guarantee.venderCode} disabled={!canSubmit \|\| busy} onChange={event => { setGuarantee(previous => ({ ...previous, venderCode: event.target.value })); changed(); }}` |
| A-169-C042 | 114 | `input`  | `value={guarantee[field.name as keyof typeof guarantee]} readOnly={!canSubmit \|\| (field.name === "fullAmount" && !row.capabilities.includes("duct_rental.rate.read"))} disabled={busy} onChange={event => { setGuarantee(previous => ({ ...previous, [field.name]: event.target.value })); changed(); }}` |
| A-169-C043 | 115 | `AttachmentPicker`  | `label={slot.label} accept={slot.accept} file={files[slot.kind]} disabled={!canUpload \|\| busy \|\| (phase === "PERMISSION_1" && !row.isSigned)} change={file => { setFiles(previous => ({ ...previous, [slot.kind]: file })); changed(); }}` |
| A-169-C044 | 116 | `textarea`  | `value={notes} maxLength={10000} disabled={busy} readOnly={!canSubmit} onChange={event => autoNotes(event.target.value)} placeholder="บันทึกข้อมูลเพิ่มเติม…"` |
| A-169-C045 | 118 | `textarea`  | `value={missingDocs} maxLength={10000} readOnly={!canSubmit} disabled={busy} onChange={event => { setMissingDocs(event.target.value); changed(); }}` |
| A-169-C046 | 118 | `AttachmentPicker`  | `label="ประกอบไฟล์ Memo (PDF)" file={files.memo} change={file => { setFiles(previous => ({ ...previous, memo: file })); changed(); }} disabled={busy}` |
| A-169-C047 | 118 | `button` บันทึกเอกสารค้าง | `className={styles.button} type="button" disabled={busy \|\| !canSubmit} onClick={() => void run("save")}` |
| A-169-C048 | 118 | `button` ล้างหมายเหตุ | `className={styles.button} type="button" disabled={busy \|\| !canSubmit} onClick={() => { setMissingDocs(""); changed(); }}` |
| A-169-C049 | 118 | `Link` เปิดหน้าติดตามเอกสาร | `className={styles.button} href={&#96;/duct-rental/${row.id}/missing-docs&#96;}` |
| A-169-C050 | 119 | `button` โหลดข้อมูลล่าสุด | `className={styles.button} type="button" disabled={busy} onClick={() => setConfirm("reload")}` |
| A-169-C051 | 119 | `button` บันทึกร่าง | `className={styles.button} type="button" disabled={busy} onClick={() => void run("save")}` |
| A-169-C052 | 119 | `button`  | `className={styles.primary} type="button" disabled={busy \|\| phaseStatuses[phase] !== "accepted" \|\| !gates} onClick={() => setConfirm("submit")}` |
| A-169-C053 | 119 | `button` เก็บเข้าประวัติ | `className={styles.danger} type="button" disabled={busy} onClick={() => setConfirm("archive")}` |
| A-169-C054 | 119 | `Link` ขอยกเลิกการใช้ท่อ | `className={styles.button} href={&#96;/duct-rental/cancellation/new?request=${row.id}&#96;}` |
| A-169-C055 | 120 | `Modal`  | `title={preview.title} close={() => setPreview(null)}` |
| A-169-C056 | 120 | `PdfViewer`  | `url={preview.url} name={preview.title}` |
| A-169-C057 | 120 | `button` กลับไปแก้ไข | `className={styles.button} type="button" disabled={busy} onClick={() => setPreview(null)}` |
| A-169-C058 | 120 | `button` ยืนยันและบันทึก NT Form | `className={styles.primary} type="button" disabled={busy} onClick={() => void ntSave()}` |
| A-169-C059 | 121 | `Modal`  | `title={confirm === "archive" ? "ยืนยันเก็บคำขอเข้าประวัติ" : confirm === "reload" ? "โหลดข้อมูลล่าสุด" : "ยืนยันส่งงาน"} close={() => setConfirm(null)}` |
| A-169-C060 | 121 | `button` กลับ | `className={styles.button} type="button" onClick={() => setConfirm(null)}` |
| A-169-C061 | 121 | `button` ยืนยัน | `className={styles.primary} type="button" onClick={() => { const action = confirm; setConfirm(null); if (action === "reload") void reload(); else void run(action); }}` |
| A-169-C062 | 123 | `RequestShell`  | `title={&#96;${row.code} · ${phaseLabels[phase]}&#96;} description={row.projectName \|\| "ร่างคำขอ"} parent={{ label: "เช่าท่อร้อยสาย", href: "/duct-rental" }} actions={<Link className={styles.button} href={&#96;/duct-rental/${row.id}/edit&#96;}>ข้อมูลออกแบบ</Link>} utility={<DuctSyncUtility {...model} paused={paused} refresh={() => model.refresh()} />} content={content}` |
| A-169-C063 | 123 | `Link` ข้อมูลออกแบบ | `className={styles.button} href={&#96;/duct-rental/${row.id}/edit&#96;}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-169-T001 | 36 | `[showCreated, setShowCreated] = useState(created)` |
| A-169-T002 | 37 | `[paused, setPaused] = useState(false)` |
| A-169-T003 | 46 | `[busy, setBusy] = useState(false)` |
| A-169-T004 | 46 | `[error, setError] = useState("")` |
| A-169-T005 | 46 | `[message, setMessage] = useState("")` |
| A-169-T006 | 46 | `[errors, setErrors] = useState<Record<string, string>>({})` |
| A-169-T007 | 46 | `[dirty, setDirty] = useState(false)` |
| A-169-T008 | 47 | `[phaseStatuses, setPhaseStatuses] = useState(row.phaseStatuses)` |
| A-169-T009 | 48 | `[files, setFiles] = useState<Record<string, File \| null>>({})` |
| A-169-T010 | 48 | `[notes, setNotes] = useState(row.phaseNotes[phase] ?? "")` |
| A-169-T011 | 48 | `[missingDocs, setMissingDocs] = useState(row.missingDocs)` |
| A-169-T012 | 49 | `[install, setInstall] = useState<Record<string, string \| number>>(row.install ? Object.fromEntries(Object.entries(row.install).filter(([, value]) => value !== undefined)) as Record<string, string \| number> : {})` |
| A-169-T013 | 50 | `[rate, setRate] = useState({ monthlyFee: row.rate?.monthlyFee ?? "", yearlyFee: row.rate?.yearlyFee ?? "", contractStart: row.rate?.contractStart ?? "", contractEnd: row.rate?.contractEnd ?? "" })` |
| A-169-T014 | 51 | `[guarantee, setGuarantee] = useState({ contractNumber: row.guarantee?.contractNumber ?? "", fullAmount: row.rate?.guaranteeAmount ?? "", paymentType: row.guarantee?.paymentType ?? "", venderCode: row.guarantee?.venderCode ?? "", receiptNumber: row.guarantee?.receiptNumber ?? "" })` |
| A-169-T015 | 52 | `[reference, setReference] = useState(row.design.permissionRequestNumber ?? "")` |
| A-169-T016 | 52 | `[signer, setSigner] = useState(row.assignedSignerId ?? row.signoff?.assignee_id ?? "")` |
| A-169-T017 | 52 | `[preview, setPreview] = useState<{ url: string; title: string; nt?: boolean } \| null>(null)` |
| A-169-T018 | 52 | `[confirm, setConfirm] = useState<"submit" \| "archive" \| "reload" \| null>(null)` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-169-E001 | 119 | `setConfirm("reload")` |
| A-169-E002 | 119 | `setConfirm("submit")` |
| A-169-E003 | 119 | `setConfirm("archive")` |
| A-169-E004 | 121 | `setConfirm(null)` |
| A-169-E005 | 121 | `setConfirm(null)` |
| A-169-E006 | 121 | `setConfirm(null)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-169-B001 | 38 | `!model.data` |
| A-169-B002 | 38 | `model.loading` |
| A-169-B003 | 41 | `view === "missing-docs"` |
| A-169-B004 | 49 | `row.install` |
| A-169-B005 | 53 | `phase !== "COMPLETE"` |
| A-169-B006 | 57 | `notesTimer.current` |
| A-169-B007 | 58 | `message` |
| A-169-B008 | 60 | `files.memo` |
| A-169-B009 | 61 | `files.memo` |
| A-169-B010 | 65 | `phase === "INSTALL"` |
| A-169-B011 | 65 | `phase === "3RD_PARTY_1"` |
| A-169-B012 | 65 | `phase === "3RD_PARTY_2"` |
| A-169-B013 | 67 | `notesTimer.current` |
| A-169-B014 | 71 | `action === "save" \|\| action === "submit"` |
| A-169-B015 | 71 | `file` |
| A-169-B016 | 72 | `action === "accept" \|\| action === "archive"` |
| A-169-B017 | 74 | `action === "accept" && dirty` |
| A-169-B018 | 75 | `action === "accept"` |
| A-169-B019 | 75 | `action === "submit"` |
| A-169-B020 | 76 | `action === "archive"` |
| A-169-B021 | 76 | `action === "submit" && result.phase === "COMPLETE"` |
| A-169-B022 | 76 | `action === "submit"` |
| A-169-B023 | 78 | `reason instanceof ApiError` |
| A-169-B024 | 83 | `phase === "PERMISSION_1"` |
| A-169-B025 | 83 | `signer && signer !== row.assignedSignerId && row.capabilities.includes("duct_rental.signoff.assign")` |
| A-169-B026 | 87 | `!signer` |
| A-169-B027 | 92 | `notesTimer.current` |
| A-169-B028 | 95 | `phaseStatuses[phase] === "accepted"` |
| A-169-B029 | 95 | `phaseStatuses[phase] === "done"` |
| A-169-B030 | 96 | `phase === "DESIGN" && !missingView` |
| A-169-B031 | 100 | `phase === "COMPLETE"` |
| A-169-B032 | 103 | `row.cancelledAt` |
| A-169-B033 | 103 | `row.archivedAt` |
| A-169-B034 | 104 | `phaseStatuses[phase] === "done"` |
| A-169-B035 | 104 | `phaseStatuses[phase] === "accepted"` |
| A-169-B036 | 109 | `row.isSigned` |
| A-169-B037 | 109 | `row.signoff` |
| A-169-B038 | 109 | `row.signoff` |
| A-169-B039 | 109 | `row.assignedSignerId` |
| A-169-B040 | 112 | `row.capabilities.includes("duct_rental.rate.read")` |
| A-169-B041 | 112 | `field.type === "text"` |
| A-169-B042 | 114 | `field.name === "paymentType"` |
| A-169-B043 | 114 | `field.name === "venderCode"` |
| A-169-B044 | 119 | `busy` |
| A-169-B045 | 119 | `dirty` |
| A-169-B046 | 119 | `phase === "3RD_PARTY_2"` |
| A-169-B047 | 121 | `confirm === "archive"` |
| A-169-B048 | 121 | `confirm === "reload"` |
| A-169-B049 | 121 | `confirm === "archive"` |
| A-169-B050 | 121 | `confirm === "reload"` |
| A-169-B051 | 121 | `action === "reload"` |
| A-169-B052 | 123 | `compact` |

## A-170 — `src/modules/duct-rental/components/settings-workspace.tsx`

- Status: PLANNED. Consumers: S-020.
- Normalized UTF-8/LF source SHA-256: `00d307c7cc69321edcd49ccdea34772656159de9c13c812d3a737dd09e6b6837`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-170-F001 | 11 | `DuctSettings` | `export function DuctSettings() ` |
| A-170-F002 | 15 | `SettingsForm` | `function SettingsForm(` |
| A-170-F003 | 17 | `save` | `async function save() ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-170-C001 | 13 | `PageHeader`  | `title="ตั้งค่าผู้ประสานงานเช่าท่อ" description="กำหนดทีมของศูนย์บริการและเบอร์ติดต่อ โดยใช้บัญชีและสมาชิกทีมใน Core" parent={{ label: "เช่าท่อร้อยสาย", href: "/duct-rental" }}` |
| A-170-C002 | 13 | `SettingsForm`  | `key={model.data.version} row={model.data} options={options.data} pause={setPaused} reload={async () => { setPaused(false); await model.refresh(); await options.refresh(); }}` |
| A-170-C003 | 18 | `select`  | `value={centers[center] \|\| ""} disabled={busy} onChange={event => { setCenters(previous => ({ ...previous, [center]: event.target.value })); pause(true); }}` |
| A-170-C004 | 18 | `input`  | `value={phones[person.id] \|\| ""} maxLength={100} disabled={busy} onChange={event => { setPhones(previous => ({ ...previous, [person.id]: event.target.value })); pause(true); }}` |
| A-170-C005 | 18 | `button` บันทึกการตั้งค่า | `className={styles.primary} type="button" disabled={busy} onClick={() => void save()}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-170-T001 | 12 | `[paused, setPaused] = useState(false)` |
| A-170-T002 | 16 | `[centers, setCenters] = useState(row.service_center_teams)` |
| A-170-T003 | 16 | `[phones, setPhones] = useState(row.coordinator_phones)` |
| A-170-T004 | 16 | `[busy, setBusy] = useState(false)` |
| A-170-T005 | 16 | `[error, setError] = useState("")` |
| A-170-T006 | 16 | `[message, setMessage] = useState("")` |

## A-171 — `src/modules/duct-rental/components/signature-workspace.tsx`

- Status: PLANNED. Consumers: S-021.
- Normalized UTF-8/LF source SHA-256: `176a8164af7c3f0db4aadcd772d938e207fc29c2fabf0efa91fbbcafc6ce56a9`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-171-F001 | 18 | `SignatureWorkspace` | `export function SignatureWorkspace(` |
| A-171-F002 | 23 | `nudge` | `(dx: number, dy: number) ` |
| A-171-F003 | 26 | `change` | `(key: keyof Placement, value: number) ` |
| A-171-F004 | 40 | `inspect` | `async function inspect() ` |
| A-171-F005 | 45 | `sign` | `async function sign() ` |
| A-171-F006 | 69 | `SignatureManager` | `function SignatureManager(` |
| A-171-F007 | 71 | `point` | `(event: React.PointerEvent<HTMLCanvasElement>) ` |
| A-171-F008 | 72 | `clear` | `() ` |
| A-171-F009 | 73 | `upload` | `async function upload(file: File) ` |
| A-171-F010 | 78 | `save` | `async function save() ` |
| A-171-F011 | 83 | `changeAsset` | `async function changeAsset(id: string, action: "default" \| "archive") ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-171-C001 | 49 | `PageHeader`  | `title="งานลงนาม NT Form" description="ลงนามได้เฉพาะเอกสารที่ได้รับมอบหมาย ชื่อผู้ลงนามยืนยันจากบัญชี เลือกวันที่แสดงบนเอกสารได้" parent={{ label: "เช่าท่อร้อยสาย", href: "/duct-rental" }}` |
| A-171-C002 | 50 | `SignatureShell`  | `` |
| A-171-C003 | 55 | `input`  | `value={query} maxLength={200} onChange={event => { setQuery(event.target.value); setOffset(0); }} placeholder="รหัสคำขอ ชื่อโครงการ…"` |
| A-171-C004 | 57 | `button` จัดการลายเซ็นของฉัน | `className={&#96;${styles.button} ${styles.manageAction}&#96;} type="button" onClick={() => setManager(true)}` |
| A-171-C005 | 62 | `table`  | `className={styles.table}` |
| A-171-C006 | 62 | `Link`  | `href={&#96;/duct-rental/${item.requestId}&#96;}` |
| A-171-C007 | 62 | `button`  | `className={styles.button} type="button" onClick={() => { setTaskId(item.id); setPlacement(initial); setPaused(false); }}` |
| A-171-C008 | 63 | `button` ก่อนหน้า | `className={styles.button} disabled={paused \|\| offset === 0} onClick={() => setOffset(previous => Math.max(0, previous - 100))}` |
| A-171-C009 | 63 | `button` ถัดไป | `className={styles.button} disabled={paused \|\| model.data?.nextOffset == null} onClick={() => setOffset(model.data!.nextOffset!)}` |
| A-171-C010 | 64 | `button` ปิดเอกสาร | `className={styles.button} type="button" onClick={() => { setTaskId(""); setPaused(false); }}` |
| A-171-C011 | 64 | `PdfViewer`  | `url={ownPending && live ? live.url : documentUrl(task.signedDocumentId \|\| task.documentId)} blob={ownPending ? live?.blob : undefined} initialPage={ownPending ? 4 : 1} name={&#96;NT Form ${task.snapshot.code}&#96;}` |
| A-171-C012 | 64 | `select`  | `value={chosenAsset} disabled={busy} onChange={event => { setAssetId(event.target.value); setPaused(true); }}` |
| A-171-C013 | 64 | `input`  | `type="date" value={displayDate} disabled={busy} onChange={event => { setDisplayDate(event.target.value); setPaused(true); }}` |
| A-171-C014 | 64 | `details`  | `` |
| A-171-C015 | 64 | `summary` ปรับตำแหน่ง ขนาด และการหมุน | `className={styles.sectionSummary}` |
| A-171-C016 | 64 | `select`  | `value={target} disabled={busy} onChange={event => setTarget(event.target.value as StampTarget)}` |
| A-171-C017 | 64 | `button` เลื่อนขึ้น | `className={styles.button} disabled={busy} onClick={() => nudge(0, SIGN_NUDGE_STEP)}` |
| A-171-C018 | 64 | `button` เลื่อนซ้าย | `className={styles.button} disabled={busy} onClick={() => nudge(-SIGN_NUDGE_STEP, 0)}` |
| A-171-C019 | 64 | `button` เลื่อนขวา | `className={styles.button} disabled={busy} onClick={() => nudge(SIGN_NUDGE_STEP, 0)}` |
| A-171-C020 | 64 | `button` เลื่อนลง | `className={styles.button} disabled={busy} onClick={() => nudge(0, -SIGN_NUDGE_STEP)}` |
| A-171-C021 | 64 | `button` ลดขนาดลายเซ็น | `className={styles.button} disabled={busy} onClick={() => change("scale", Number((placement.scale - 0.05).toFixed(2)))}` |
| A-171-C022 | 64 | `button` เพิ่มขนาดลายเซ็น | `className={styles.button} disabled={busy} onClick={() => change("scale", Number((placement.scale + 0.05).toFixed(2)))}` |
| A-171-C023 | 64 | `input`  | `type="number" min={item.min} max={item.max} step={"step" in item ? item.step : 1} value={placement[item.key]} disabled={busy} onChange={event => change(item.key, Number(event.target.value))}` |
| A-171-C024 | 64 | `button` คืนตำแหน่งเริ่มต้น | `className={styles.button} type="button" onClick={() => setPlacement(initial)}` |
| A-171-C025 | 64 | `button` ตรวจตัวอย่างก่อนลงนาม | `className={styles.primary} type="button" disabled={busy \|\| !chosenAsset} onClick={() => void inspect()}` |
| A-171-C026 | 64 | `button` เพิ่มลายเซ็น | `className={styles.button} type="button" onClick={() => setManager(true)}` |
| A-171-C027 | 65 | `Modal`  | `title="ยืนยันลายเซ็น ชื่อ และวันที่" close={() => setPreview(null)}` |
| A-171-C028 | 65 | `PdfViewer`  | `url={preview} blob={previewData} name="ตัวอย่าง NT Form พร้อมลายเซ็น" initialPage={4}` |
| A-171-C029 | 65 | `button` ปรับแก้ | `className={styles.button} type="button" disabled={busy} onClick={() => setPreview(null)}` |
| A-171-C030 | 65 | `button` ยืนยันลงนาม | `className={styles.primary} type="button" disabled={busy} onClick={() => void sign()}` |
| A-171-C031 | 66 | `Modal`  | `title="ลายเซ็นของฉัน" close={() => setManager(false)}` |
| A-171-C032 | 66 | `SignatureManager`  | `assets={model.data?.assets ?? []} refresh={model.refresh} saved={id => { setAssetId(id); setPaused(true); }}` |
| A-171-C033 | 84 | `input`  | `value={name} maxLength={100} disabled={busy} onChange={event => setName(event.target.value)}` |
| A-171-C034 | 84 | `canvas`  | `className={styles.draw} ref={canvas} width={600} height={200} aria-label="พื้นที่วาดลายเซ็น สามารถใช้ปุ่มเลือกรูปแทนได้" tabIndex={0} role="img" onKeyDown={event => { if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); announce(&#96;ตำแหน่งลายเซ็น ${event.key.replace("Arrow", "")}&#96;); } else if (event.key === "Enter") { event.preventDefault(); announce("เริ่มวาดลายเซ็น"); } }} onPointerDown={event => { if (busy) return; drawing.current = true; event.currentTarget.setPointerCapture(event.pointerId); const [x, y] = point(event), ctx = canvas.current!.getContext("2d")!; ctx.strokeStyle = "black"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x, y); }} onPointerMove={event => { if (!drawing.current \|\| busy) return; const [x, y] = point(event), ctx = canvas.current!.getContext("2d")!; ctx.lineTo(x, y); ctx.stroke(); hasInk.current = true; }} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }}` |
| A-171-C035 | 84 | `button` ล้างภาพ | `className={styles.button} type="button" disabled={busy} onClick={clear}` |
| A-171-C036 | 84 | `input`  | `type="file" accept="image/png,image/jpeg" disabled={busy} onChange={event => { const file = event.target.files?.[0]; if (file) { setName(previous => previous \|\| file.name.replace(/\.[^.]+$/, "") \|\| "Signature"); setDefault(true); void upload(file); } }}` |
| A-171-C037 | 84 | `input`  | `type="checkbox" checked={isDefault} onChange={event => setDefault(event.target.checked)}` |
| A-171-C038 | 84 | `button` บันทึกลายเซ็น | `className={styles.primary} type="button" disabled={busy} onClick={() => void save()}` |
| A-171-C039 | 84 | `button` ใช้เป็นค่าเริ่มต้น | `className={styles.button} type="button" disabled={busy \|\| item.isDefault} onClick={() => void changeAsset(item.id, "default")}` |
| A-171-C040 | 84 | `button` นำออก | `className={styles.danger} type="button" disabled={busy} onClick={() => setRemove(item.id)}` |
| A-171-C041 | 84 | `button` กลับ | `className={styles.button} type="button" onClick={() => setRemove(null)}` |
| A-171-C042 | 84 | `button` ยืนยันนำออก | `className={styles.danger} type="button" disabled={busy} onClick={() => void changeAsset(remove, "archive")}` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-171-T001 | 19 | `[paused, setPaused] = useState(false)` |
| A-171-T002 | 19 | `[offset, setOffset] = useState(0)` |
| A-171-T003 | 19 | `[query, setQuery] = useState("")` |
| A-171-T004 | 20 | `[taskId, setTaskId] = useState(selected ?? "")` |
| A-171-T005 | 20 | `[assetId, setAssetId] = useState("")` |
| A-171-T006 | 20 | `[placement, setPlacement] = useState(initial)` |
| A-171-T007 | 20 | `[busy, setBusy] = useState(false)` |
| A-171-T008 | 20 | `[error, setError] = useState("")` |
| A-171-T009 | 20 | `[message, setMessage] = useState("")` |
| A-171-T010 | 20 | `[preview, setPreview] = useState<string \| null>(null)` |
| A-171-T011 | 20 | `[previewData, setPreviewData] = useState<Blob \| undefined>(undefined)` |
| A-171-T012 | 20 | `[manager, setManager] = useState(false)` |
| A-171-T013 | 21 | `[displayDate, setDisplayDate] = useState(() => new Date().toISOString().slice(0, 10))` |
| A-171-T014 | 21 | `[target, setTarget] = useState<StampTarget>("all")` |
| A-171-T015 | 22 | `[live, setLive] = useState<{ url: string; blob: Blob } \| null>(null)` |
| A-171-T016 | 22 | `[liveError, setLiveError] = useState("")` |
| A-171-T017 | 70 | `[name, setName] = useState("")` |
| A-171-T018 | 70 | `[isDefault, setDefault] = useState(false)` |
| A-171-T019 | 70 | `[busy, setBusy] = useState(false)` |
| A-171-T020 | 70 | `[error, setError] = useState("")` |
| A-171-T021 | 70 | `[message, setMessage] = useState("")` |
| A-171-T022 | 70 | `[remove, setRemove] = useState<string \| null>(null)` |

### Effect, browser confirmation, file and server-action call evidence

| ID | Line | Call |
|---|---:|---|
| A-171-E001 | 30 | `(async () => { try { const response = await fetch(&#96;/api/duct-rental/signatures/${task.id}/preview&#96;, { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ ...placement, displayDate, version: task.version, assetId: chosenAsset }) }); if (!response.ok) { const result = await response.json(); throw new Error(result.message \|\| "ไม่สามารถแสดงตัวอย่างได้"); } const blob = await response.blob(); if (controller.signal.aborted) return; url = URL.createObjectURL(blob); setLive({ url, blob }); setLiveError(""); } catch (reason) { if (!controller.signal.aborted) { setLive(null); setLiveError(errorText(reason)); } } })()` |
| A-171-E002 | 32 | `fetch(&#96;/api/duct-rental/signatures/${task.id}/preview&#96;, { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ ...placement, displayDate, version: task.version, assetId: chosenAsset }) })` |
| A-171-E003 | 42 | `fetch(&#96;/api/duct-rental/signatures/${task.id}/preview&#96;, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ ...placement, displayDate, version: task.version, assetId: chosenAsset }) })` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-171-B001 | 25 | `preview` |
| A-171-B002 | 26 | `key === "scale"` |
| A-171-B003 | 26 | `key === "scale"` |
| A-171-B004 | 29 | `!ownPending \|\| !chosenAsset \|\| !task` |
| A-171-B005 | 33 | `!response.ok` |
| A-171-B006 | 34 | `controller.signal.aborted` |
| A-171-B007 | 36 | `!controller.signal.aborted` |
| A-171-B008 | 38 | `url` |
| A-171-B009 | 41 | `!task` |
| A-171-B010 | 42 | `!response.ok` |
| A-171-B011 | 46 | `!task` |
| A-171-B012 | 62 | `item.status === "pending"` |
| A-171-B013 | 62 | `item.status === "signed"` |
| A-171-B014 | 62 | `item.status === "pending" && item.assigneeId === userId && item.canSignNow` |
| A-171-B015 | 64 | `ownPending && live` |
| A-171-B016 | 64 | `ownPending` |
| A-171-B017 | 64 | `ownPending` |
| A-171-B018 | 64 | `item.isDefault` |
| A-171-B019 | 64 | `"step" in item` |
| A-171-B020 | 74 | `!/^image\/(png\|jpeg)$/.test(file.type) \|\| file.size > 2 * 1024 * 1024` |
| A-171-B021 | 76 | `image.width > 4096 \|\| image.height > 4096` |
| A-171-B022 | 76 | `isNearWhitePaperPixel(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2])` |
| A-171-B023 | 76 | `pixels.data[i + 3] > 0` |
| A-171-B024 | 79 | `!hasInk.current` |
| A-171-B025 | 81 | `value` |
| A-171-B026 | 84 | `["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)` |
| A-171-B027 | 84 | `event.key === "Enter"` |
| A-171-B028 | 84 | `busy` |
| A-171-B029 | 84 | `!drawing.current \|\| busy` |
| A-171-B030 | 84 | `file` |
| A-171-B031 | 84 | `item.isDefault` |

## A-172 — `src/modules/duct-rental/components/tracking-workspace.tsx`

- Status: PLANNED. Consumers: S-017, S-022.
- Normalized UTF-8/LF source SHA-256: `1357a29a429ea8c909e6d8a6c5e76472ca9d4be1fb10a545eabb05083f12963d`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-172-F001 | 25 | `TrackingWorkspace` | `export function TrackingWorkspace(` |
| A-172-F002 | 27 | `filter` | `(key:keyof typeof filters,value:string) ` |
| A-172-F003 | 101 | `TrackingSummary` | `export function TrackingSummary(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-172-C001 | 30 | `PageHeader`  | `title="ติดตามงานต่อสัญญาและยกเลิก" description="คิวรวม ผู้รับผิดชอบ และกำหนด SLA" parent={{label:"เช่าท่อร้อยสาย",href:"/duct-rental"}}` |
| A-172-C002 | 41 | `section`  | `className={styles.ductFilterToolbar} aria-label="ค้นหาและกรองรายการติดตาม" role="search"` |
| A-172-C003 | 42 | `form`  | `className="ui-filter" onSubmit={event => { event.preventDefault(); setOffset(0); }}` |
| A-172-C004 | 43 | `FormField`  | `label="ค้นหาอ้างอิง / โครงการ" className={styles.ductFilterSearch}` |
| A-172-C005 | 44 | `input`  | `className={styles.input} value={filters.query} maxLength={200} onChange={event=>filter("query",event.target.value)}` |
| A-172-C006 | 46 | `FormField`  | `label="ประเภทกระบวนการ" className={styles.ductFilterSelect}` |
| A-172-C007 | 47 | `select`  | `className={styles.input} value={filters.kind} onChange={event=>filter("kind",event.target.value)}` |
| A-172-C008 | 51 | `FormField`  | `label="ผู้รับผิดชอบ" className={styles.ductFilterSelect}` |
| A-172-C009 | 52 | `select`  | `className={styles.input} value={filters.owner} onChange={event=>filter("owner",event.target.value)}` |
| A-172-C010 | 57 | `FormField`  | `label="สถานะ SLA" className={styles.ductFilterSelect}` |
| A-172-C011 | 58 | `select`  | `className={styles.input} value={filters.sla} onChange={event=>filter("sla",event.target.value)}` |
| A-172-C012 | 63 | `button` ค้นหา | `className={styles.button} type="submit"` |
| A-172-C013 | 64 | `button` รีเซ็ต | `className={styles.button} type="button" onClick={() => { setFilters({query:"",kind:"",owner:"",sla:""}); setOffset(0); }}` |
| A-172-C014 | 68 | `PageSkeleton`  | `shape="table"` |
| A-172-C015 | 71 | `TableRegion`  | `label="ตารางติดตามงานต่อสัญญาและยกเลิก เลื่อนแนวนอนได้" className={styles.tableWrap}` |
| A-172-C016 | 72 | `table`  | `className={styles.table}` |
| A-172-C017 | 82 | `StatusBadge`  | `label={slaLabels[row.sla]} tone={row.sla === "Overdue" ? "warning" : row.sla === "Completed" ? "success" : "neutral"}` |
| A-172-C018 | 83 | `ButtonLink` เปิดงาน | `variant="ghost" href={&#96;/duct-rental/${row.kind==="Renew" ? "renewal" : "cancellation"}/${row.id}&#96;}` |
| A-172-C019 | 87 | `EmptyState`  | `title="ไม่พบรายการตามเงื่อนไข" description="ปรับตัวกรองค้นหา หรือเลือกรอบรายการอื่น แล้วลองอีกครั้ง"` |
| A-172-C020 | 93 | `Button` ก่อนหน้า | `variant="secondary" type="button" disabled={!offset} onClick={()=>setOffset(previous=>Math.max(0,previous-50))}` |
| A-172-C021 | 94 | `Button` ถัดไป | `variant="secondary" type="button" disabled={model.data?.nextOffset==null} onClick={()=>setOffset(model.data!.nextOffset!)}` |
| A-172-C022 | 106 | `ButtonLink` ติดตามทั้งหมด | `variant="ghost" href="/duct-rental/tracking"` |
| A-172-C023 | 107 | `ButtonLink` เสร็จแล้ว | `variant="ghost" href="/duct-rental/tracking?sla=Completed"` |
| A-172-C024 | 108 | `ButtonLink` ใกล้ครบกำหนด | `variant="ghost" href="/duct-rental/tracking?sla=Near%20Due"` |
| A-172-C025 | 109 | `ButtonLink` เกินกำหนด | `variant="ghost" href="/duct-rental/tracking?sla=Overdue"` |

### Actual state declarations

| ID | Line | State / mutation source |
|---|---:|---|
| A-172-T001 | 26 | `[filters,setFilters] = useState({query:"",kind:"",owner:"",sla:initialSla})` |
| A-172-T002 | 26 | `[offset,setOffset] = useState(0)` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-172-B001 | 67 | `model.loading` |
| A-172-B002 | 80 | `row.kind==="Renew"` |
| A-172-B003 | 82 | `row.sla === "Overdue"` |
| A-172-B004 | 82 | `row.sla === "Completed"` |
| A-172-B005 | 83 | `row.kind==="Renew"` |
| A-172-B006 | 102 | `canView` |
| A-172-B007 | 103 | `!canView` |

## A-173 — `src/modules/duct-rental/ui-process/PhaseProgress.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `85e7c7d23987301af0d1042720f0ea0e4ac94732ffed7199dfe0687b5f5cc00f`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-173-F001 | 7 | `PhaseProgress` | `export function PhaseProgress(` |
| A-173-F002 | 10 | `select` | `(item: PhaseProgressItem) ` |
| A-173-F003 | 11 | `move` | `(event: KeyboardEvent<HTMLButtonElement>, index: number) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-173-C001 | 21 | `div`  | `className={styles.phaseProgress} role="radiogroup" aria-label={label}` |
| A-173-C002 | 22 | `button`  | `key={item.id} ref={node => { refs.current[index] = node; }} type="button" role="radio" aria-checked={item.id === value} aria-disabled={item.disabled \|\| undefined} tabIndex={item.id === value ? 0 : -1} disabled={item.disabled} className={[styles.phaseStep, item.id === value && styles.phaseStepActive].filter(Boolean).join(" ")} onClick={() => select(item)} onKeyDown={event => move(event, index)}` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-173-B001 | 10 | `!item.disabled` |
| A-173-B002 | 12 | `!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)` |
| A-173-B003 | 15 | `current < 0` |
| A-173-B004 | 16 | `event.key === "Home"` |
| A-173-B005 | 16 | `event.key === "End"` |
| A-173-B006 | 16 | `event.key === "ArrowLeft" \|\| event.key === "ArrowUp"` |
| A-173-B007 | 22 | `item.id === value` |

## A-174 — `src/modules/duct-rental/ui-process/ProcessShell.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `d3f4c3f81859d87b58a71ce48cec66a0dc7145f72a851a291966b7394112de3d`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-174-F001 | 4 | `ProcessShell` | `export function ProcessShell(` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-174-B001 | 7 | `(list \|\| detail)` |

## A-175 — `src/modules/duct-rental/ui-process/SignatureShell.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `3c1e566631cd68678be82bef77a438da98bed24a1e3f6626ad879f245fa65dff`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-175-F001 | 5 | `SignatureShell` | `export function SignatureShell(` |
| A-175-F002 | 7 | `onCanvasKeyDown` | `(event: KeyboardEvent<HTMLDivElement>) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-175-C001 | 18 | `div`  | `className={styles.signatureCanvas} ref={canvasRef} tabIndex={0} role="application" aria-label="พื้นที่วาดลายเซ็น ใช้ปุ่มลูกศรเพื่อปรับตำแหน่ง หรือกด Enter เพื่อเริ่มวาด" onKeyDown={onCanvasKeyDown}` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-175-B001 | 8 | `!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(event.key)` |
| A-175-B002 | 10 | `event.key === "Enter"` |

## A-176 — `src/modules/duct-rental/ui-process/StatusBadge.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `591e6e789f168b2c207e1bdac4f21b5ea9390d66c379ed814dc1a76c5eb12a30`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-176-F001 | 6 | `StatusBadge` | `export function StatusBadge(` |

## A-177 — `src/modules/duct-rental/ui-process/TrackingShell.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `5583cf596991863a31c6822b1dc51bdd348f78953c15bf5ead303c2fef68082d`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-177-F001 | 6 | `TrackingShell` | `export function TrackingShell(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-177-C001 | 8 | `div`  | `className={styles.trackingToolbar} role="search"` |

## A-178 — `src/modules/duct-rental/ui-request/DesignEditorShell.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `1b2d86ba4a1f31a92fe6a4e902d23e682680f4a5f0df3360d3e7503ae3d22f2e`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-178-F001 | 4 | `DesignEditorShell` | `export function DesignEditorShell(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-178-C001 | 6 | `div`  | `className={styles.editorToolbar} role="toolbar" aria-label="เครื่องมือแก้ไขแบบ"` |

## A-179 — `src/modules/duct-rental/ui-request/MetricStrip.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `64c5714a5a721d63b9606599ce3f4bdb22d9b02e0970385b859ca82866a107b9`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-179-F001 | 17 | `MetricStrip` | `export function MetricStrip(` |
| A-179-F002 | 19 | `move` | `(index: number, direction: 1 \| -1) ` |
| A-179-F003 | 26 | `onKeyDown` | `(event: KeyboardEvent<HTMLButtonElement>, index: number) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-179-C001 | 32 | `button`  | `key={metric.id ?? metric.label} ref={node => { buttonRefs.current[index] = node; }} type="button" className={[styles.metric, metric.active && styles.metricActive].filter(Boolean).join(" ")} aria-pressed={metric.active === true} aria-label={&#96;${metric.label}: ${metric.value}&#96;} disabled={metric.disabled} onKeyDown={event => onKeyDown(event, index)} onClick={() => { metric.onClick?.(); announce(&#96;${metric.label}: ${metric.value}&#96;); }}` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-179-B001 | 22 | `current < 0 \|\| enabled.length === 0` |
| A-179-B002 | 27 | `event.key === "ArrowRight" \|\| event.key === "ArrowDown"` |
| A-179-B003 | 28 | `event.key === "ArrowLeft" \|\| event.key === "ArrowUp"` |

## A-180 — `src/modules/duct-rental/ui-request/PhaseTabs.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `0cbf6bf9b390d33fdfd6e99b369bdbbdda73cb243cf454ac41a3e401a99be96d`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-180-F001 | 14 | `PhaseTabs` | `export function PhaseTabs(` |
| A-180-F002 | 18 | `select` | `(item: PhaseTab) ` |
| A-180-F003 | 19 | `onKeyDown` | `(event: KeyboardEvent<HTMLAnchorElement \| HTMLButtonElement>, index: number) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-180-C001 | 29 | `div`  | `className={styles.phaseTabs} role="radiogroup" aria-label={label}` |
| A-180-C002 | 30 | `Link`  | `key={item.phase} {...props} href={item.href}` |
| A-180-C003 | 30 | `button`  | `key={item.phase} {...props} type="button" disabled={item.disabled}` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-180-B001 | 15 | `id` |
| A-180-B002 | 18 | `!item.disabled` |
| A-180-B003 | 20 | `!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)` |
| A-180-B004 | 23 | `current < 0` |
| A-180-B005 | 24 | `event.key === "Home"` |
| A-180-B006 | 24 | `event.key === "End"` |
| A-180-B007 | 24 | `event.key === "ArrowLeft" \|\| event.key === "ArrowUp"` |
| A-180-B008 | 30 | `selected` |
| A-180-B009 | 30 | `item.href && !item.disabled` |
| A-180-B010 | 30 | `item.status` |
| A-180-B011 | 30 | `item.status` |

## A-181 — `src/modules/duct-rental/ui-request/RequestFormShell.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `5df99418be8d492001d04b37f86693c2b60f48f45cd94d5ef308eac5a6c3b0ae`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-181-F001 | 4 | `RequestFormShell` | `export function RequestFormShell(` |

## A-182 — `src/modules/duct-rental/ui-request/RequestShell.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `6fbfb3b55e40e3a5646730851f4f859710cc9130e6fb328884339b1c277239e1`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-182-F001 | 6 | `RequestShell` | `export function RequestShell(` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-182-C001 | 8 | `PageHeader`  | `title={title} description={description} parent={parent} actions={actions}` |

## A-183 — `src/modules/duct-rental/ui-request/RequestTabs.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `68abe05f9ac60980db327ac5fbc2a8a6e668636ad2ec4e9f448f073c1580225c`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-183-F001 | 11 | `RequestTabs` | `export function RequestTabs(` |
| A-183-F002 | 14 | `select` | `(tab: RequestTab) ` |
| A-183-F003 | 15 | `move` | `(event: KeyboardEvent<HTMLButtonElement>, index: number) ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-183-C001 | 26 | `div`  | `className={styles.requestTabList} role={isRadioGroup ? "radiogroup" : "tablist"} aria-label={label}` |
| A-183-C002 | 27 | `button`  | `key={tab.id} ref={node => { refs.current[index] = node; }} type="button" role={isRadioGroup ? "radio" : "tab"} id={&#96;request-tab-${tab.id}&#96;} aria-selected={!isRadioGroup ? active === tab.id : undefined} aria-checked={isRadioGroup ? active === tab.id : undefined} aria-controls={!isRadioGroup && tab.content !== undefined && tab.id === active ? &#96;request-panel-${tab.id}&#96; : undefined} aria-disabled={tab.disabled \|\| undefined} tabIndex={active === tab.id ? 0 : -1} disabled={tab.disabled} className={[styles.requestTab, active === tab.id && styles.requestTabActive].filter(Boolean).join(" ")} onKeyDown={event => move(event, index)} onClick={() => select(tab)}` |
| A-183-C003 | 29 | `div`  | `key={tab.id} id={&#96;request-panel-${tab.id}&#96;} role="tabpanel" aria-labelledby={&#96;request-tab-${tab.id}&#96;} className={styles.requestTabPanel}` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-183-B001 | 14 | `!tab.disabled` |
| A-183-B002 | 16 | `!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)` |
| A-183-B003 | 20 | `current < 0` |
| A-183-B004 | 21 | `event.key === "Home"` |
| A-183-B005 | 21 | `event.key === "End"` |
| A-183-B006 | 21 | `event.key === "ArrowLeft"` |
| A-183-B007 | 26 | `isRadioGroup` |
| A-183-B008 | 27 | `isRadioGroup` |
| A-183-B009 | 27 | `!isRadioGroup` |
| A-183-B010 | 27 | `isRadioGroup` |
| A-183-B011 | 27 | `!isRadioGroup && tab.content !== undefined && tab.id === active` |
| A-183-B012 | 27 | `active === tab.id` |
| A-183-B013 | 29 | `tab.content !== undefined && tab.id === active` |

## A-184 — `src/modules/duct-rental/ui-request/status/RequestStatusBadge.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `8377933988885cd6a7a6f4d119673f34c3d60c39549d52cd6bd996ba1036d7bd`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-184-F001 | 6 | `RequestStatusBadge` | `export function RequestStatusBadge(` |

## A-185 — `src/modules/duct-rental/ui-shared/DuctModuleNav.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `d6d97570c8a055990de210bd8711c8b6dc3e26c573bef872ae629b8bc6aeb41e`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-185-F001 | 16 | `ModuleNav` | `function ModuleNav(` |
| A-185-F002 | 34 | `DuctModuleNav` | `export function DuctModuleNav(props: DuctModuleNavProps): ReactNode ` |

### Function/control/feedback surfaces

| ID | Line | Source element / direct text | Full attribute/action/visibility wiring |
|---|---:|---|---|
| A-185-C001 | 20 | `Link`  | `key={item.key} className={styles.ductModuleLink} href={item.href} aria-current={current === item.key ? "page" : undefined}` |

### Conditional variants (if / ternary)

| ID | Line | Condition |
|---|---:|---|
| A-185-B001 | 24 | `current === item.key` |

## A-186 — `src/modules/duct-rental/ui-shared/accessibility/VisuallyHidden.tsx`

- Status: PLANNED. Consumers: OPEN — no page import-closure consumer; reconcile framework mounting / endpoint / alternate or legacy caller before closure.
- Normalized UTF-8/LF source SHA-256: `7e3d072f3defdb3b49283f13fbe5c8ddb5abb444692687fe56fb0e3f7c54e0bc`.

### Named functions / component entry points

| ID | Line | Symbol | Signature evidence |
|---|---:|---|---|
| A-186-F001 | 6 | `VisuallyHidden` | `export function VisuallyHidden(` |

# Appendix B — source branch / generated-field / option evidence

All evidence lines below are PLANNED coverage obligations. These supplement AST if/ternary records with short-circuit rendering, switch cases, type unions, field/config labels and native option values. Full matching source lines are retained (including compact JSX) so dynamically generated forms, hidden/disabled states and label expressions can be reconciled without an invented screen name. A single line may contain several user functions; every branch/control in it needs an acceptance case. This is a lexical supplement, not a claim of symbolic execution. Nonmatching declarations and callbacks remain linked by exact file/function/control references and the full source manifest; deeper generated-runtime expansion remains OPEN.

## A-002 — `src/app/(platform)/admin/car-booking/page.tsx`

- `src/app/(platform)/admin/car-booking/page.tsx:7` — `export const metadata:Metadata={title:"สิทธิ์ระบบจองรถ"};`

## A-004 — `src/app/(platform)/admin/page.tsx`

- `src/app/(platform)/admin/page.tsx:4` — `export const metadata: Metadata = { title: copy.pages.admin };`
- `src/app/(platform)/admin/page.tsx:35` — `if (access.passwordChangeRequired \|\| (!Object.values(permissionsGranted).some(Boolean) && !Object.values(workAdmin.granted).some(Boolean))) redirect("/");`
- `src/app/(platform)/admin/page.tsx:37` — `typeof params.auditModule==="string"&&params.auditModule ? eq(auditLogs.moduleId,params.auditModule):undefined,`
- `src/app/(platform)/admin/page.tsx:38` — `typeof params.auditAction==="string"&&params.auditAction ? ilike(auditLogs.action,&#96;%${params.auditAction.slice(0,100).replace(/[\\%_]/g,"\\$&")}%&#96;):undefined,`
- `src/app/(platform)/admin/page.tsx:39` — `typeof params.auditActor==="string"&&/^[0-9a-f-]{36}$/i.test(params.auditActor) ? eq(auditLogs.actorId,params.auditActor):undefined,`
- `src/app/(platform)/admin/page.tsx:40` — `typeof params.auditFrom==="string"&&businessDateSchema.safeParse(params.auditFrom).success ? gte(auditLogs.createdAt,new Date(&#96;${params.auditFrom}T00:00:00+07:00&#96;)):undefined,`
- `src/app/(platform)/admin/page.tsx:41` — `typeof params.auditTo==="string"&&businessDateSchema.safeParse(params.auditTo).success ? lte(auditLogs.createdAt,new Date(&#96;${params.auditTo}T23:59:59.999+07:00&#96;)):undefined,`
- `src/app/(platform)/admin/page.tsx:50` — `needsAccessReferences ? getDb().select({ id: positions.id, code: positions.code, name: positions.name, scopeType: positions.scopeType, roleId: positions.roleId, roleName: roles.name })`
- `src/app/(platform)/admin/page.tsx:52` — `needsAccessReferences ? getDb().select({ id: roles.id, code: roles.code, name: roles.name, description: roles.description, isSystem: roles.isSystem }).from(roles).orderBy(asc(roles.name)) : Promise.resolve([]),`
- `src/app/(platform)/admin/page.tsx:53` — `(permissionsGranted.users \|\| permissionsGranted.teams \|\| permissionsGranted.positions) ? getDb().select({ id: teams.id, code: teams.code, name: teams.name }).from(teams).where(eq(teams.isActive, true)).orderBy(asc(teams.name)) : Promise.resolve([]),`
- `src/app/(platform)/admin/page.tsx:65` — `const sections = [`
- `src/app/(platform)/admin/page.tsx:66` — `{ id:"overview", label:"ภาพรวม", group:"ภาพรวม", allowed:true, description:"เลือกส่วนที่ต้องการจัดการ หรือตรวจสถานะข้อมูล", count:null },`
- `src/app/(platform)/admin/page.tsx:67` — `{ id:"users", label:"ผู้ใช้", group:"บัญชีและองค์กร", allowed:canReadUsers, description:"จัดการบัญชีและทบทวนสิทธิ์ของผู้ใช้", count:userRows.length },`
- `src/app/(platform)/admin/page.tsx:68` — `{ id:"positions", label:"ตำแหน่ง", group:"บัญชีและองค์กร", allowed:permissionsGranted.positions, description:"กำหนดตำแหน่ง บทบาท และขอบเขตข้อมูลเริ่มต้น", count:positionRows.length },`
- `src/app/(platform)/admin/page.tsx:69` — `{ id:"teams", label:"ทีม", group:"บัญชีและองค์กร", allowed:permissionsGranted.teams, description:"จัดทีมสำหรับมอบหมายงานและกำหนดขอบเขตข้อมูล", count:teamRows.length },`
- `src/app/(platform)/admin/page.tsx:70` — `{ id:"roles", label:"บทบาทและสิทธิ์", group:"สิทธิ์และการเข้าถึง", allowed:permissionsGranted.roles, description:"กำหนดสิทธิ์การใช้งานให้เหมาะกับแต่ละบทบาท", count:roleRows.length },`
- `src/app/(platform)/admin/page.tsx:71` — `{ id:"kpi", label:"KPI / SLA", group:"ตั้งค่าพื้นที่ทำงาน", allowed:workAdmin.granted.kpi, description:"จัดการ Main KPI, Sub KPI และจำนวนวัน SLA", count:workAdmin.catalog.length },`
- `src/app/(platform)/admin/page.tsx:72` — `{ id:"personal-kpi", label:"KPI รายบุคคล", group:"ตั้งค่าพื้นที่ทำงาน", allowed:workAdmin.granted.kpi, description:"กำหนด KPI และน้ำหนักของผู้รับผิดชอบแต่ละคน", count:null },`
- `src/app/(platform)/admin/page.tsx:73` — `{ id:"calendar", label:"วันหยุด", group:"ตั้งค่าพื้นที่ทำงาน", allowed:workAdmin.granted.calendar, description:"จัดการวันหยุดที่ใช้คำนวณกำหนดส่งงาน", count:workAdmin.calendar.length },`
- `src/app/(platform)/admin/page.tsx:74` — `{ id:"recalculate", label:"คำนวณงานใหม่", group:"ตั้งค่าพื้นที่ทำงาน", allowed:workAdmin.granted.kpi, description:"ตรวจผลกระทบก่อนคำนวณกำหนดส่ง หรือดูตัวอย่าง KPI งานเก่า", count:null },`
- `src/app/(platform)/admin/page.tsx:75` — `{ id:"systems", label:"ลิงก์ระบบ", group:"ตั้งค่าพื้นที่ทำงาน", allowed:workAdmin.granted.systems, description:"จัดการทางลัดและผู้ที่มองเห็นแต่ละระบบ", count:workAdmin.links.length },`
- `src/app/(platform)/admin/page.tsx:76` — `{ id:"modules", label:"โมดูล", group:"สิทธิ์และการเข้าถึง", allowed:permissionsGranted.modules, description:"ควบคุมการเปิดใช้งาน โดยเก็บสิทธิ์และประวัติข้อมูลไว้", count:modules.length },`
- `src/app/(platform)/admin/page.tsx:77` — `{ id:"announcement", label:"ประกาศ", group:"ตั้งค่าพื้นที่ทำงาน", allowed:workAdmin.granted.announcement, description:"จัดการข้อความประกาศบนหน้าแรก", count:workAdmin.announcements.length },`
- `src/app/(platform)/admin/page.tsx:78` — `{ id:"audit", label:"ประวัติการเปลี่ยนแปลง", group:"ตรวจสอบและกู้คืน", allowed:permissionsGranted.audit, description:"ค้นหาและตรวจการเปลี่ยนแปลงในระบบ", count:null },`
- `src/app/(platform)/admin/page.tsx:79` — `{ id:"restore", label:"กู้คืนงาน", group:"ตรวจสอบและกู้คืน", allowed:access.permissions.includes("work.task.delete") && access.permissions.includes("work.task.manage"), description:"ตรวจและกู้คืนงานที่ถูกซ่อนจากรายการ", count:workAdmin.deleted.length },`
- `src/app/(platform)/admin/page.tsx:84` — `<PageHeader title="ผู้ดูแลระบบ" description="การจัดการภายในแอป: บัญชี สิทธิ์ และการตั้งค่าพื้นที่ทำงาน" parent={{ label: "ภาพรวม", href: "/" }} actions={permissionsGranted.users ? <ButtonLink variant="primary" href="/admin/car-booking">สิทธิ์ระบบจองรถ</ButtonLink> : undefined} />`
- `src/app/(platform)/admin/page.tsx:107` — `{sections.filter(item => item.id !== "overview" && item.group === group).map(item => (`
- `src/app/(platform)/admin/page.tsx:110` — `{item.count !== null && <b>{item.count}<span className="sr-only"> รายการ</span></b>}`
- `src/app/(platform)/admin/page.tsx:119` — `{permissionsGranted.audit && (`
- `src/app/(platform)/admin/page.tsx:133` — `{current.id === "audit" && permissionsGranted.audit && (`
- `src/app/(platform)/admin/page.tsx:139` — `<option value="">ทั้งหมด</option>`
- `src/app/(platform)/admin/page.tsx:140` — `{userRows.map(user => <option key={user.id} value={user.id}>{user.displayName}</option>)}`
- `src/app/(platform)/admin/page.tsx:150` — `{current.id === "modules" && (`
- `src/app/(platform)/admin/page.tsx:153` — `return { id: module.id, name: module.name, ready: module.lifecycle === "active", enabled: effectiveModuleEnabled(module, row?.enabled), version: row?.version ?? 0 };`

## A-006 — `src/app/(platform)/buildings/[id]/edit/page.tsx`

- `src/app/(platform)/buildings/[id]/edit/page.tsx:14` — `export const metadata: Metadata = { title: copy.buildingEditor.editTitle };`
- `src/app/(platform)/buildings/[id]/edit/page.tsx:21` — `const rows = data.building.ownerTeamId ? await getDb().select({ id: teams.id, name: teams.name }).from(teams).where(eq(teams.id, data.building.ownerTeamId)).limit(1) : [];`
- `src/app/(platform)/buildings/[id]/edit/page.tsx:23` — `<PageHeader title={copy.buildingEditor.editTitle} description={copy.buildingEditor.editDescription} parent={{ label: copy.pages.buildings_id, href: &#96;/buildings/${id}&#96; }} className="page-enter" />`

## A-008 — `src/app/(platform)/buildings/[id]/page.tsx`

- `src/app/(platform)/buildings/[id]/page.tsx:3` — `export const metadata: Metadata = { title: copy.pages.buildings_id };`
- `src/app/(platform)/buildings/[id]/page.tsx:20` — `const tabs = [["overview", "ภาพรวม"], ["location", "ตำแหน่ง"], ["documents", "เอกสาร"], ["work", "งานที่เกี่ยวข้อง"], ["guarantees", "เงินประกัน"], ["activity", "ประวัติ"]] as const;`
- `src/app/(platform)/buildings/[id]/page.tsx:23` — `<PageHeader title={data.building.nameTh} description={[data.building.code, data.building.nameEn].filter(Boolean).join(" · ")} parent={{ label: "ข้อมูลอาคาร", href: "/buildings" }} actions={<><StatusBadge label={data.building.status} tone={data.building.status === "active" ? "success" : "neutral"}/>{data.location.canUpdate && <Link className="button" href={&#96;/buildings/${id}/edit&#96;}>{copy.buildingEditor.editTitle}</Link>}{data.canDelete && <DeleteBuilding id={id} name={data.building.nameTh} version={data.building.version}/>}</>}/>`
- `src/app/(platform)/buildings/[id]/page.tsx:24` — `{query.saved === "1" && <p role="status">{copy.buildingEditor.saved}</p>}`
- `src/app/(platform)/buildings/[id]/page.tsx:26` — `{tab === "overview" && <div className="building-360-grid"><section className="ui-panel"><h2>ข้อมูลอ้างอิง</h2><dl><div><dt>รหัสอาคาร</dt><dd>{data.building.code}</dd></div><div><dt>สถานะ</dt><dd>{data.building.status}</dd></div><div><dt>เจ้าของข้อมูล</dt><dd>{data.building.ownerTeamId ?? "ไม่กำหนดทีม"}</dd></div></dl></section><section className="ui-panel"><h2>บริบทที่เกี่ยวข้อง</h2><dl><div><dt>งาน</dt><dd>{data.tasks.length}</dd></div><div><dt>เงินประกัน</dt><dd>{data.guarantees.length}</dd></div><div><dt>ใบเสนอราคา</dt><dd>{data.estimates.length}</dd></div></dl></section></div>}`
- `src/app/(platform)/buildings/[id]/page.tsx:27` — `{tab === "location" && <BuildingLocationPicker buildingId={id} apiKey={process.env.LONGDO_MAP_API_KEY ?? ""} canUpdate={data.location.canUpdate} initial={data.location.latitude !== null && data.location.longitude !== null ? {`
- `src/app/(platform)/buildings/[id]/page.tsx:33` — `{tab === "documents" && <section className="ui-panel"><h2>เอกสาร</h2>{!data.attachments.length && <p>ไม่มีเอกสารที่บัญชีนี้มีสิทธิ์ดู</p>}<ul className="ui-text-list">{data.attachments.map(file => <li key={file.id}><TruncatedText className="text-safe" text={&#96;${file.fileName} · ${file.mediaType} · ${file.provider}&#96;} lines={2}/></li>)}</ul></section>}`
- `src/app/(platform)/buildings/[id]/page.tsx:34` — `{tab === "work" && <section className="ui-panel"><h2>งานที่เกี่ยวข้อง</h2>{!data.tasks.length && <p>ไม่มีงานในขอบเขตสิทธิ์</p>}<div className="ui-table-scroll"><table className="ui-table"><thead><tr><th>งาน</th><th>สถานะ</th><th>กำหนด</th></tr></thead><tbody>{data.tasks.map(item => <tr key={item.id}><td><TruncatedText text={item.title} lines={2}/></td><td><TruncatedText text={item.status} lines={1}/></td><td>{item.dueAt?.toLocaleDateString("th-TH") ?? "ไม่กำหนด"}</td></tr>)}</tbody></table></div></section>}`
- `src/app/(platform)/buildings/[id]/page.tsx:35` — `{tab === "guarantees" && <section className="ui-panel"><h2>เงินประกัน</h2>{!data.guarantees.length && <p>ไม่มีรายการในขอบเขตสิทธิ์</p>}<ul className="ui-text-list">{data.guarantees.map(item => <li key={item.id}><TruncatedText className="text-safe" text={&#96;${item.caseNumber} · ${item.status} · ฿${Number(item.expectedDeposit).toLocaleString("th-TH")}&#96;} lines={2}/></li>)}</ul></section>}`
- `src/app/(platform)/buildings/[id]/page.tsx:36` — `{tab === "activity" && <section className="ui-panel"><h2>ประวัติ</h2>{!data.activities.length && <p>ไม่มีกิจกรรมที่บัญชีนี้มีสิทธิ์ดู</p>}<ol className="work-timeline">{data.activities.map(item => <li key={item.id}><time>{item.occurredAt.toLocaleString("th-TH")}</time><TruncatedText text={item.eventType} lines={2}/><TruncatedText text={item.entityType} lines={2}/></li>)}</ol></section>}`

## A-009 — `src/app/(platform)/buildings/building-map.tsx`

- `src/app/(platform)/buildings/building-map.tsx:9` — `code: item.code, name: item.nameTh, latitude: item.lat, longitude: item.lng, status: item.status,`
- `src/app/(platform)/buildings/building-map.tsx:13` — `{!points.length && <div className="permission-map-empty" role="status"><strong>ยังไม่มีอาคารที่ระบุตำแหน่ง</strong><span>อาคารเดิมยังค้นหาและตรวจสอบจากรายการได้ตามปกติ</span></div>}`

## A-010 — `src/app/(platform)/buildings/buildings-workspace.tsx`

- `src/app/(platform)/buildings/buildings-workspace.tsx:19` — `type FilterKey = "status" \| "group" \| "type" \| "installType" \| "surveyType" \| "area";`
- `src/app/(platform)/buildings/buildings-workspace.tsx:20` — `type Filters = Record<FilterKey, string>;`
- `src/app/(platform)/buildings/buildings-workspace.tsx:26` — `{ title: "ค่าใช้จ่ายครั้งแรก", type: "CAPEX" }, { title: "ค่าใช้จ่ายรายเดือน", type: "OPEX_MONTHLY" },`
- `src/app/(platform)/buildings/buildings-workspace.tsx:27` — `{ title: "ค่าใช้จ่ายรายปี", type: "OPEX_ANNUAL" }, { title: "เงินประกัน / เงินมัดจำ", type: "DEPOSIT" },`
- `src/app/(platform)/buildings/buildings-workspace.tsx:28` — `{ title: "รายการอื่นที่ต้องตรวจสอบ", type: "UNCLASSIFIED" },`
- `src/app/(platform)/buildings/buildings-workspace.tsx:30` — `type DocumentFile = { name: string; category: "dwg" \| "pdf" \| "image"; extension: string; size: number; modifiedAt: string; href: string };`
- `src/app/(platform)/buildings/buildings-workspace.tsx:31` — `type DocumentState = { key: string; status: "loading" \| "ready" \| "empty" \| "error"; files: DocumentFile[]; message: string };`
- `src/app/(platform)/buildings/buildings-workspace.tsx:95` — `return matchesBuildingQuery(text, normalizedQuery) &&`
- `src/app/(platform)/buildings/buildings-workspace.tsx:107` — `return matchesProvince && (!fromDate \|\| date >= fromDate) && (!toDate \|\| date <= toDate);`
- `src/app/(platform)/buildings/buildings-workspace.tsx:109` — `const weighted = useMemo(() => mapVisible.filter((item) => item.lat !== null && item.lng !== null).map((item) => ({ item, summary: summarizeBuildingMapFees(item.boq?.fees ?? [], category) })), [category, mapVisible]);`
- `src/app/(platform)/buildings/buildings-workspace.tsx:113` — `id: item.id, name: item.nameTh, code: item.code, latitude: item.lat!, longitude: item.lng!, status: item.status,`
- `src/app/(platform)/buildings/buildings-workspace.tsx:118` — `const selectedDetailFilters = (Object.keys(filters) as FilterKey[]).filter((key) => key !== "status" && filters[key]);`
- `src/app/(platform)/buildings/buildings-workspace.tsx:119` — `const durationDays = selected && /^\d+(?:\.\d+)?$/.test(selected.duration) ? &#96;${selected.duration} วัน&#96; : "";`
- `src/app/(platform)/buildings/buildings-workspace.tsx:120` — `const horizontalMeters = selected && /^\d+(?:\.\d+)?$/.test(selected.maxHorizontal) ? &#96;${selected.maxHorizontal} เมตร&#96; : "";`
- `src/app/(platform)/buildings/buildings-workspace.tsx:121` — `const invalidDuration = Boolean(selected?.duration && !durationDays);`
- `src/app/(platform)/buildings/buildings-workspace.tsx:122` — `const invalidHorizontal = Boolean(selected?.maxHorizontal && !horizontalMeters);`
- `src/app/(platform)/buildings/buildings-workspace.tsx:146` — `if (next.toString() !== current && version === navigationVersionRef.current) {`
- `src/app/(platform)/buildings/buildings-workspace.tsx:155` — `if (selected && dialog && !dialog.open) dialog.showModal();`
- `src/app/(platform)/buildings/buildings-workspace.tsx:156` — `if (!selected && dialog?.open) dialog.close();`
- `src/app/(platform)/buildings/buildings-workspace.tsx:170` — `const source = raw && typeof raw === "object" && "files" in raw && Array.isArray(raw.files) ? raw.files : [];`
- `src/app/(platform)/buildings/buildings-workspace.tsx:177` — `return [{ name: String(file.name), category: category as DocumentFile["category"], extension: String(file.extension \|\| ""),`
- `src/app/(platform)/buildings/buildings-workspace.tsx:188` — `if (event.key === "/" && !selected && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLSelectElement)) {`
- `src/app/(platform)/buildings/buildings-workspace.tsx:198` — `if (next === "documents" && selected) setDocumentState({ key: selected.id, status: "loading", files: [], message: copy.feedback.documentLoading });`
- `src/app/(platform)/buildings/buildings-workspace.tsx:205` — `async function copyValue(label: string, value: string) {`
- `src/app/(platform)/buildings/buildings-workspace.tsx:215` — `if (event.key === "ArrowDown" && suggestions.length) { event.preventDefault(); setSuggestionIndex((current) => Math.min(current + 1, suggestions.length - 1)); }`
- `src/app/(platform)/buildings/buildings-workspace.tsx:216` — `if (event.key === "ArrowUp" && suggestions.length) { event.preventDefault(); setSuggestionIndex((current) => Math.max(current - 1, 0)); }`
- `src/app/(platform)/buildings/buildings-workspace.tsx:217` — `if (event.key === "Enter" && suggestionIndex >= 0 && suggestions[suggestionIndex]) { event.preventDefault(); const item = suggestions[suggestionIndex]; openBuilding(item); }`
- `src/app/(platform)/buildings/buildings-workspace.tsx:226` — `<PageHeader parent={{ label: "ภาพรวม", href: "/" }} title="ข้อมูลอาคาร" description="ค้นหาอาคาร ตรวจสอบตำแหน่ง ค่าใช้จ่าย ใบเสนอราคา และเอกสารภายใน" />`
- `src/app/(platform)/buildings/buildings-workspace.tsx:230` — `{query && <button type="button" className="permission-search-clear" onClick={() => { setQuery(""); searchRef.current?.focus(); }} aria-label="ล้างการค้นหา">×</button>}`
- `src/app/(platform)/buildings/buildings-workspace.tsx:231` — `{focused && normalizedQuery && <div className="permission-autocomplete" role="listbox" aria-label="ผลการค้นหาอาคาร">{suggestions.length ? suggestions.map((item, index) => <button type="button" role="option" aria-selected={suggestionIndex === index} key={item.id} onMouseDown={(event) => event.preventDefault()} onClick={() => openBuilding(item)}><i className={&#96;permission-status-dot ${statusClass(item.status)}&#96;} /><span className="permission-autocomplete-copy"><TruncatedText text={item.nameTh} lines={1}/><TruncatedText text={[item.nameEn, item.area, item.status].filter(Boolean).join(" · ")} lines={1}/></span></button>) : <p>ไม่พบอาคารที่ตรงกับคำค้นหา</p>}</div>}`
- `src/app/(platform)/buildings/buildings-workspace.tsx:233` — `<div className="permission-overview-actions" aria-label="มุมมองข้อมูลอาคาร"><div className="permission-view-toggle" role="group" aria-label="สลับมุมมอง"><button type="button" aria-pressed={view === "map"} onClick={() => setView("map")}>แผนที่</button><button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>รายการ</button></div>{canCreate && <Link className="btn-primary" href="/buildings/new">เพิ่มอาคาร</Link>}</div>`
- `src/app/(platform)/buildings/buildings-workspace.tsx:237` — `<section className="permission-overview-summary" aria-label="สรุปอาคาร"><div><strong>{number(total)}</strong><span>อาคารทั้งหมด</span></div>{statuses.map((status) => <button type="button" key={status} className={filters.status === status ? "active" : ""} aria-pressed={filters.status === status} onClick={() => setFilter("status", filters.status === status ? "" : status)}><strong>{number(withoutStatus.filter((item) => item.status === status).length)}</strong><StatusBadge label={statusLabel(status)} tone={statusTone(status)} /></button>)}<div><strong>{number(buildings.filter((item) => item.lat !== null && item.lng !== null).length)}</strong><span>มีพิกัด</span></div></section>`
- `src/app/(platform)/buildings/buildings-workspace.tsx:239` — `{filtersOpen && <div id="permission-filters" className="permission-filterbar">`
- `src/app/(platform)/buildings/buildings-workspace.tsx:243` — `<option value="">ทั้งหมด</option>`
- `src/app/(platform)/buildings/buildings-workspace.tsx:244` — `{(key === "status" ? statuses : optionsFor(buildings, key)).map((value) => <option key={value} value={value}>{value}</option>)}`
- `src/app/(platform)/buildings/buildings-workspace.tsx:247` — `<label className="permission-map-filter"><span className="permission-filter-label">จังหวัด</span><select value={province} onChange={(event) => setProvince(event.target.value)} aria-label="กรองตามจังหวัด"><option value="">ทุกจังหวัด</option>{mapProvinces.map((item) => <option key={item}>{item}</option>)}</select></label>`
- `src/app/(platform)/buildings/buildings-workspace.tsx:248` — `<label className="permission-map-filter"><span className="permission-filter-label">มุมมอง</span><select value={mode} onChange={(event) => setMode(event.target.value as typeof mode)} aria-label="เลือกมุมมองแผนที่"><option value="buildings">อาคาร</option><option value="status">สถานะอาคาร</option><option value="expense">ค่าใช้จ่ายตามเงื่อนไข</option><option value="heatmap">Heatmap</option></select></label>`
- `src/app/(platform)/buildings/buildings-workspace.tsx:249` — `{(mode === "expense" \|\| mode === "heatmap") && <label className="permission-map-filter"><span className="permission-filter-label">หมวดค่าใช้จ่าย</span><select value={category} onChange={(event) => setCategory(event.target.value as BuildingMapExpenseCategory)} aria-label="กรองตามหมวดค่าใช้จ่าย">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>}`
- `src/app/(platform)/buildings/buildings-workspace.tsx:250` — `{mode === "heatmap" && <label className="permission-map-filter"><span className="permission-filter-label">ตัวชี้วัด</span><select value={heatMetric} onChange={(event) => setHeatMetric(event.target.value as typeof heatMetric)} aria-label="เลือกตัวชี้วัดความหนาแน่น"><option value="building_count">จำนวนอาคาร</option><option value="fee_count">จำนวนรายการ</option><option value="amount">ยอดตามหมวด</option></select></label>}`
- `src/app/(platform)/buildings/buildings-workspace.tsx:253` — `<button type="button" className="permission-reset" onClick={reset} disabled={!query && activeFilterCount === 0}>รีเซ็ต</button>`
- `src/app/(platform)/buildings/buildings-workspace.tsx:255` — `{selectedDetailFilters.length > 0 && <div className="permission-filter-chips" aria-label="ตัวกรองที่เลือก">`
- `src/app/(platform)/buildings/buildings-workspace.tsx:258` — `{copyMessage && <div className="permission-copy-status" role="status">{copyMessage}</div>}`
- `src/app/(platform)/buildings/buildings-workspace.tsx:260` — `{view === "map" && <section className="permission-unified-map" aria-label="แผนที่และรายการข้อมูลอาคาร">`
- `src/app/(platform)/buildings/buildings-workspace.tsx:261` — `{truncated && <p className="permission-map-notice" role="status">โหลดแล้ว {number(loadedCount)} จาก {number(total)} อาคารในขอบเขต (สูงสุด {number(scopeCap)} อาคารต่อการโหลดแผนที่) โปรดจำกัดการค้นหาหรือจังหวัดเพื่อดูผลลัพธ์เฉพาะกลุ่ม; รายการที่เลือกอาจถูกโหลดเพิ่มเพื่อเปิดรายละเอียด</p>}`
- `src/app/(platform)/buildings/buildings-workspace.tsx:265` — `{view === "list" && <section className="permission-overview-list" aria-label="รายการอาคาร">`
- `src/app/(platform)/buildings/buildings-workspace.tsx:271` — `<div className="permission-overview-card-actions"><Link href={&#96;/buildings/${item.id}&#96;}>เปิดข้อมูล</Link>{item.canUpdateLocation && <Link href={&#96;/buildings/${item.id}/edit&#96;}>แก้ไข</Link>}</div>`
- `src/app/(platform)/buildings/buildings-workspace.tsx:277` — `{selected && <><div className="permission-drawer-head"><div><small>รายละเอียดอาคาร</small><h2><TruncatedText text={selected.nameTh} lines={2}/></h2><TruncatedText className="permission-drawer-name-en" text={selected.nameEn \|\| "ไม่มีชื่อภาษาอังกฤษ"} lines={2}/><div className="permission-list-tags">{[selected.group, selected.surveyType, selected.type, selected.installType].filter(Boolean).map((tag) => <em key={tag}><TruncatedText text={tag as string} lines={1}/></em>)}</div><Link className="secondary-action" href={&#96;/buildings/${selected.id}&#96;}>{copy.pages.buildings_id}</Link>{selected.canUpdateLocation && <Link className="secondary-action" href={&#96;/buildings/${selected.id}/edit&#96;}>{copy.buildingEditor.editTitle}</Link>}</div><button type="button" onClick={dismiss} aria-label="ปิดรายละเอียด">×</button></div>`
- `src/app/(platform)/buildings/buildings-workspace.tsx:279` — `{(!selected.wmPoint \|\| selected.feeReviewRequired \|\| invalidDuration \|\| invalidHorizontal) && <div className="permission-drawer-alert" role="status"><strong>ข้อมูลที่ควรตรวจสอบ</strong>{!selected.wmPoint && <span>ยังไม่มีข้อมูลจุดเชื่อมต่อ WM</span>}{invalidDuration && <span>ระยะดำเนินการไม่ใช่จำนวนวัน</span>}{invalidHorizontal && <span>ระยะสายแนวนอนไม่ใช่จำนวนเมตร</span>}{selected.feeReviewRequired && <span>{copy.feedback.feeReview}</span>}</div>}`
- `src/app/(platform)/buildings/buildings-workspace.tsx:281` — `{([ ["general", "ภาพรวม"], ["contact", "ผู้ติดต่อ"], ["fee", "ค่าใช้จ่าย"], ["documents", "เอกสาร"] ] as const).map(([key, label]) => <button type="button" role="tab" aria-selected={tab === key} key={key} onClick={() => selectTab(key)}>{label}{key === "documents" && documentState?.key === selected.id && documentState.status === "ready" ? &#96; (${documentState.files.length})&#96; : ""}</button>)}`
- `src/app/(platform)/buildings/buildings-workspace.tsx:284` — `{tab === "general" && <><h3>ข้อมูลการติดตั้ง</h3><dl className="permission-info-grid">`
- `src/app/(platform)/buildings/buildings-workspace.tsx:288` — `</dl>{selected.lat !== null && selected.lng !== null && <div className="permission-coordinate"><span>พิกัด</span><code>{selected.lat}, {selected.lng}</code><button type="button" onClick={() => void copyValue("พิกัด", &#96;${selected.lat}, ${selected.lng}&#96;)}>คัดลอกพิกัด</button></div>}{selected.remark && <details className="permission-remark"><summary>หมายเหตุจากข้อมูลเดิม</summary><TruncatedText text={selected.remark} lines={3}/></details>}`
- `src/app/(platform)/buildings/buildings-workspace.tsx:289` — `{!selected.location && !durationDays && !selected.wmPoint && !selected.enclosure && !horizontalMeters && !selected.address && !selected.remark && <p className="permission-empty-inline">ยังไม่มีข้อมูลการติดตั้งเพิ่มเติม</p>}</>}`
- `src/app/(platform)/buildings/buildings-workspace.tsx:290` — `{tab === "contact" && <><h3>ผู้ติดต่อ</h3><div className="permission-contact">`
- `src/app/(platform)/buildings/buildings-workspace.tsx:291` — `{splitValues(selected.contact, /[,/]/).length > 0 && <div className="permission-contact-name"><span>ชื่อผู้ติดต่อ</span><TruncatedText text={splitValues(selected.contact, /[,/]/).join(" / ")} lines={2}/></div>}`
- `src/app/(platform)/buildings/buildings-workspace.tsx:294` — `{!selected.contact && !selected.phone && !selected.mobile && !selected.email && <p className="permission-empty-inline">ยังไม่มีข้อมูลผู้ติดต่อ</p>}`
- `src/app/(platform)/buildings/buildings-workspace.tsx:296` — `{tab === "fee" && <><h3>ค่าใช้จ่ายของอาคาร</h3>{selected.feeReviewRequired && <p className="permission-data-warning">มีค่าดิบจากต้นทางบางรายการที่ยังตรวจสอบรูปแบบไม่ผ่าน จึงแสดงแยกไว้ด้านล่าง และไม่นำรายการเหล่านั้นไปคำนวณรวมเป็นยอด</p>}`
- `src/app/(platform)/buildings/buildings-workspace.tsx:298` — `{feeGroups.map((group) => { const fees = selected.boq?.fees.filter((fee) => feeInGroup(fee, group.type) && (fee.calculation_type === "revenue_share" ? fee.rate : fee.amount)) ?? []; return fees.length ? <section key={group.type} className="permission-fee-group"><h4><TruncatedText text={group.title} lines={1}/><span>{fees.length} รายการ</span></h4><div>{fees.map((fee) => <div key={fee.key}><span><TruncatedText text={fee.label} lines={2}/><small>{fee.calculation_type === "revenue_share" ? &#96;ส่วนแบ่งรายได้${fee.revenue_period === "annual" ? "รายปี" : "รายเดือน"}&#96; : fee.unit !== "ครั้ง" ? &#96;อัตราต่อ${fee.unit}&#96; : fee.cost_type}</small></span><strong><TruncatedText text={fee.calculation_type === "revenue_share" ? &#96;${number(fee.rate ?? 0)}%&#96; : &#96;${number(fee.amount ?? 0)} บาท&#96;} lines={1}/></strong></div>)}</div></section> : null; })}`
- `src/app/(platform)/buildings/buildings-workspace.tsx:300` — `</> : !selected.feeReviewRequired && <p className="permission-empty-inline">ยังไม่มีข้อมูลค่าใช้จ่าย</p>}`
- `src/app/(platform)/buildings/buildings-workspace.tsx:301` — `{selected.feeReviewRequired && selected.feeReviewValues.length > 0 && <section className="permission-fee-group permission-fee-review"><h4>รายการรอตรวจสอบ<span>{selected.feeReviewValues.length} รายการ</span></h4><div>{selected.feeReviewValues.map((fee) => <div key={fee.sourceField}><span><TruncatedText text={fee.label} lines={2}/><small>ค่าจากต้นทาง</small></span><TruncatedText className="text-safe" text={fee.rawValue} lines={2}/></div>)}</div></section>}`
- `src/app/(platform)/buildings/buildings-workspace.tsx:303` — `{tab === "documents" && <><div className="permission-doc-heading"><h3>{copy.feedback.documentTitle}</h3><button type="button" onClick={retryDocuments} disabled={documentState?.status === "loading"}>ค้นหาใหม่</button></div>`
- `src/app/(platform)/buildings/buildings-workspace.tsx:304` — `{documentState?.key !== selected.id \|\| documentState.status !== "ready" ? <div className={&#96;permission-doc-state ${documentState?.status === "error" ? "error" : ""}&#96;} role="status"><strong>{documentState?.key === selected.id ? documentState.message : "กำลังค้นหาเอกสาร…"}</strong>{documentState?.status === "error" && <button type="button" onClick={retryDocuments}>ลองอีกครั้ง</button>}</div> :`
- `src/app/(platform)/buildings/buildings-workspace.tsx:314` — `function Info({ label, value }: { label: string; value: string }) { return value ? <div><dt>{label}</dt><dd><TruncatedText text={value} lines={3}/></dd></div> : null; }`
- `src/app/(platform)/buildings/buildings-workspace.tsx:317` — `if (group === "OPEX_ANNUAL") return fee.cost_type === "OPEX" && (fee.source_field === "annual_fee" \|\| fee.revenue_period === "annual");`
- `src/app/(platform)/buildings/buildings-workspace.tsx:318` — `if (group === "OPEX_MONTHLY") return fee.cost_type === "OPEX" && fee.source_field !== "annual_fee" && fee.revenue_period !== "annual";`

## A-012 — `src/app/(platform)/buildings/map/page.tsx`

- `src/app/(platform)/buildings/map/page.tsx:2` — `export const metadata: Metadata = { title: copy.pages.buildings_map };`
- `src/app/(platform)/buildings/map/page.tsx:13` — `type SearchParams = Record<string, string \| string[] \| undefined>;`
- `src/app/(platform)/buildings/map/page.tsx:20` — `const canCreate = createGrants.some((grant) => grant.scope === "ALL" \|\| grant.scope === "TEAM" && Boolean(access.subject?.teamIds.length) \|\| grant.scope === "SELECTED_TEAMS" && Boolean(grant.selectedTeamId));`
- `src/app/(platform)/buildings/map/page.tsx:30` — `for (let page = 1; nextCursor && page < 5; page += 1) {`

## A-013 — `src/app/(platform)/buildings/new/page.tsx`

- `src/app/(platform)/buildings/new/page.tsx:2` — `export const metadata: Metadata = { title: copy.pages.buildings_new };`
- `src/app/(platform)/buildings/new/page.tsx:19` — `const canCreate = access.allowed && !access.passwordChangeRequired && grants.some((grant) =>`
- `src/app/(platform)/buildings/new/page.tsx:20` — `grant.scope === "ALL" \|\| grant.scope === "TEAM" && Boolean(access.subject?.teamIds.length) \|\| grant.scope === "SELECTED_TEAMS" && Boolean(grant.selectedTeamId));`
- `src/app/(platform)/buildings/new/page.tsx:24` — `const rows = await getDb().select({ id: teams.id, name: teams.name }).from(teams).where(eq(teams.isActive, true)).limit(100);`
- `src/app/(platform)/buildings/new/page.tsx:28` — `<PageHeader title={copy.buildingEditor.createTitle} description={copy.buildingEditor.createDescription} parent={{ label: copy.pages.buildings, href: "/buildings" }} className="page-enter" />`

## A-014 — `src/app/(platform)/buildings/page.tsx`

- `src/app/(platform)/buildings/page.tsx:2` — `export const metadata: Metadata = { title: copy.pages.buildings };`
- `src/app/(platform)/buildings/page.tsx:15` — `type SearchParams = Record<string, string \| string[] \| undefined>;`
- `src/app/(platform)/buildings/page.tsx:22` — `const canCreate = createGrants.some((grant) => grant.scope === "ALL" \|\| grant.scope === "TEAM" && Boolean(access.subject?.teamIds.length) \|\| grant.scope === "SELECTED_TEAMS" && Boolean(grant.selectedTeamId));`
- `src/app/(platform)/buildings/page.tsx:29` — `if (mapFirst && data.state === "ready") {`
- `src/app/(platform)/buildings/page.tsx:33` — `for (let page = 1; nextCursor && page < 5; page += 1) {`
- `src/app/(platform)/buildings/page.tsx:48` — `<span>{data.items.length === data.total && !data.previousCursor && !data.nextCursor`

## A-015 — `src/app/(platform)/car-booking/page.tsx`

- `src/app/(platform)/car-booking/page.tsx:8` — `export const metadata:Metadata={title:"ระบบจองรถ"};`
- `src/app/(platform)/car-booking/page.tsx:13` — `<PageHeader title="ระบบจองรถ" description="จองและคืนรถ บันทึกการเดินทาง และรายงานการใช้รถ OSP" parent={{ label: "ภาพรวม", href: "/" }} actions={<span className="cb-scope">{isAuthorized(access.subject,"car_booking.module.admin")?"ผู้ดูแลระบบจองรถ":"จัดการรายการของตนเอง"}</span>} />`

## A-016 — `src/app/(platform)/duct-rental/[id]/[view]/page.tsx`

- `src/app/(platform)/duct-rental/[id]/[view]/page.tsx:5` — `const views = ["design", "draftsman", "permission", "install", "draftsman2", "permission2", "3rdparty", "permission3", "contract", "missing-docs"];`
- `src/app/(platform)/duct-rental/[id]/[view]/page.tsx:8` — `const { id, view } = await params, query = await searchParams; if (!views.includes(view)) notFound(); return <RequestWorkspace id={id} view={view} userId={access.userId} created={view === "draftsman" && query.created === "1"} />;`

## A-020 — `src/app/(platform)/duct-rental/cancellation/new/page.tsx`

- `src/app/(platform)/duct-rental/cancellation/new/page.tsx:4` — `export default async function Page({ searchParams }: { searchParams: Promise<{ request?: string }> }) { const access = await getAccessContext("duct-rental"); const { request } = await searchParams; return access.allowed && access.permissions.includes("duct_rental.cancellation.create") ? <CancellationForm selected={request} /> : <AccessDenied moduleName="ขอยกเลิกการใช้ท่อ" />; }`

## A-022 — `src/app/(platform)/duct-rental/communication-cable/page.tsx`

- `src/app/(platform)/duct-rental/communication-cable/page.tsx:6` — `export const metadata: Metadata = { title: "พาดสายสื่อสาร · ทดสอบใช้งาน" };`

## A-024 — `src/app/(platform)/duct-rental/page.tsx`

- `src/app/(platform)/duct-rental/page.tsx:6` — `export const metadata: Metadata = { title: "เช่าท่อร้อยสาย" };`

## A-027 — `src/app/(platform)/duct-rental/settings/page.tsx`

- `src/app/(platform)/duct-rental/settings/page.tsx:4` — `export default async function Page() { const access = await getAccessContext("duct-rental"); return access.allowed && access.permissions.includes("duct_rental.settings.manage") ? <DuctSettings /> : <AccessDenied moduleName="ตั้งค่าเช่าท่อ" />; }`

## A-032 — `src/app/(platform)/guarantees/[id]/page.tsx`

- `src/app/(platform)/guarantees/[id]/page.tsx:3` — `export const metadata: Metadata = { title: copy.pages.guarantees_id };`
- `src/app/(platform)/guarantees/[id]/page.tsx:24` — `if (!manager && canWorkAsAssignedTl(access, item)) return <DepositTlWorkspace item={item} />;`
- `src/app/(platform)/guarantees/[id]/page.tsx:40` — `<section className="deposit-panel deposit-history"><h2>ประวัติการทำงาน</h2>{events.map((event) => <TruncatedText key={event.id} text={&#96;${event.occurredAt.toLocaleString("th-TH")} · ${event.action === "transition" ? &#96;${event.fromStatus} → ${event.toStatus}&#96; : event.action}${event.reason ? &#96; · ${event.reason}&#96; : ""}&#96;} lines={3}/>) }{!events.length && <p>ยังไม่มีประวัติ</p>}</section></main>`
- `src/app/(platform)/guarantees/[id]/page.tsx:41` — `<aside className="deposit-side"><section className="deposit-panel legacy-finance"><h2>ข้อมูลสรุปค่าใช้จ่าย</h2><dl><div><dt>เงินประกันติดตั้ง</dt><dd><TruncatedText text={&#96;฿${parseMoney(item.deposit).toLocaleString("th-TH")}&#96;} lines={1}/></dd></div><div><dt>เงินประกันรื้อถอน</dt><dd><TruncatedText text={&#96;฿${parseMoney(item.demolish).toLocaleString("th-TH")}&#96;} lines={1}/></dd></div><div><dt>ค่าธรรมเนียมอาคาร</dt><dd><TruncatedText text={&#96;฿${parseMoney(item.fee).toLocaleString("th-TH")}&#96;} lines={1}/></dd></div><div><dt>ค่าใช้จ่ายอื่น {item.other_desc && <TruncatedText className="text-safe" text={&#96;(${item.other_desc})&#96;} lines={2}/>}</dt><dd><TruncatedText text={&#96;฿${parseMoney(item.other).toLocaleString("th-TH")}&#96;} lines={1}/></dd></div><div className="total"><dt>ยอดรวมสุทธิ</dt><dd><TruncatedText text={&#96;฿${total.toLocaleString("th-TH")}&#96;} lines={1}/></dd></div><div className="refund"><dt>เงินประกันที่ต้องได้รับคืน</dt><dd><TruncatedText text={&#96;฿${getOutstandingAmount(item).toLocaleString("th-TH")}&#96;} lines={1}/></dd></div></dl></section>`

## A-035 — `src/app/(platform)/guarantees/new/page.tsx`

- `src/app/(platform)/guarantees/new/page.tsx:2` — `export const metadata: Metadata = { title: copy.pages.guarantees_new };`

## A-036 — `src/app/(platform)/guarantees/page.tsx`

- `src/app/(platform)/guarantees/page.tsx:3` — `export const metadata: Metadata = { title: copy.pages.guarantees };`
- `src/app/(platform)/guarantees/page.tsx:16` — `const preview = process.env.NODE_ENV === "development" && access.isDevelopmentSession && params.preview === "1";`
- `src/app/(platform)/guarantees/page.tsx:31` — `canPreview={process.env.NODE_ENV === "development" && access.isDevelopmentSession} />`

## A-037 — `src/app/(platform)/layout.tsx`

- `src/app/(platform)/layout.tsx:29` — `{ href: "/work", label: "ภาพรวมงาน", icon: "work" as const },`
- `src/app/(platform)/layout.tsx:30` — `hasWorkPermission("work.task.read") ? { href: "/work/mine", label: "งานของฉัน", icon: "check" as const } : null,`
- `src/app/(platform)/layout.tsx:31` — `hasWorkPermission("work.task.create") ? { href: "/work/new", label: "เพิ่มงาน", icon: "info" as const } : null,`
- `src/app/(platform)/layout.tsx:32` — `hasWorkPermission("work.task.manage") ? { href: "/work/team", label: "ภาพรวมทีม", icon: "team" as const } : null,`
- `src/app/(platform)/layout.tsx:33` — `hasWorkPermission("work.task.assign") ? { href: "/work/assign", label: "มอบหมายงาน", icon: "filter" as const } : null,`
- `src/app/(platform)/layout.tsx:34` — `hasWorkPermission("work.task.manage") \|\| hasWorkPermission("kpi.team.read") ? { href: "/work/people", label: "บุคลากร", icon: "team" as const } : null,`
- `src/app/(platform)/layout.tsx:35` — `hasWorkPermission("work.task.read") ? { href: "/work/tracker", label: copy.feedback.tracker, icon: "search" as const } : null,`
- `src/app/(platform)/layout.tsx:36` — `hasWorkPermission("kpi.score.read") ? { href: "/work/kpi", label: "KPI ของฉัน", icon: "check" as const } : null,`
- `src/app/(platform)/layout.tsx:37` — `hasWorkPermission("work.report.read") ? { href: "/work/reports", label: "รายงานงาน", icon: "info" as const } : null,`
- `src/app/(platform)/layout.tsx:38` — `hasWorkPermission("activity.event.read") ? { href: "/work?view=activity", label: "กิจกรรมงาน", icon: "refresh" as const } : null,`

## A-040 — `src/app/(platform)/page.tsx`

- `src/app/(platform)/page.tsx:4` — `export const metadata: Metadata = { title: copy.pages.home };`
- `src/app/(platform)/page.tsx:12` — `return <>{messages.announcements.map(row => <aside key={row.id} className="work-home-announcement mb-4 rounded-xl border border-[var(--color-border)] border-l-4 border-l-[var(--color-brand)] bg-[var(--color-info-soft)] px-4 py-3 text-sm leading-6 text-[var(--color-text)] shadow-sm" role="note">{row.message}</aside>)}{messages.links.length > 0 && <section className="work-panel mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold text-[var(--color-text)]">ลิงก์ระบบ</h2><ul className="grid gap-3 sm:grid-cols-2">{messages.links.map(row => <li key={row.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4"><div className="font-semibold text-[var(--color-text)]">{row.status === "Active" ? <a className="text-[var(--color-brand)] underline-offset-4 hover:underline" href={row.url} rel="noopener noreferrer">{row.name}</a> : <span>{row.name} · {row.status === "Maintenance" ? "กำลังปรับปรุง" : "เร็ว ๆ นี้"}</span>}</div><p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{row.description}</p></li>)}</ul></section>}<DashboardOverview displayName={data.identity?.displayName \|\| "ผู้ใช้งาน"} userId={data.identity?.userId \|\| ""} allowedModuleIds={data.allowedModuleIds} developmentMode={data.developmentMode} preview={data.preview} snapshot={data.snapshot}/></>;`

## A-042 — `src/app/(platform)/work/assign/page.tsx`

- `src/app/(platform)/work/assign/page.tsx:7` — `export const metadata: Metadata = { title: copy.pages.work_assign };`
- `src/app/(platform)/work/assign/page.tsx:11` — `return <><AssignmentCenterScreen model={data.model} filters={<WorkFiltersForm filters={data.filters} model={data.model} appearance="workspace" resetHref="/work/assign" />} />{data.model.tasks.length === 500 && <p role="status">แสดง 500 รายการล่าสุด กรุณาใช้ตัวกรองเพื่อดูช่วงที่ต้องการ</p>}</>;`

## A-043 — `src/app/(platform)/work/kpi/page.tsx`

- `src/app/(platform)/work/kpi/page.tsx:7` — `export const metadata: Metadata = { title: copy.pages.work_kpi };`
- `src/app/(platform)/work/kpi/page.tsx:11` — `return <><KpiWorkspaceScreen model={data.model} filters={<WorkFiltersForm filters={data.filters} model={data.model} appearance="workspace" resetHref="/work/kpi" />} />{data.model.tasks.length === 500 && <p role="status">แสดง 500 รายการล่าสุด กรุณาใช้ตัวกรองเพื่อดูช่วงที่ต้องการ</p>}</>;`

## A-046 — `src/app/(platform)/work/mine/page.tsx`

- `src/app/(platform)/work/mine/page.tsx:7` — `export const metadata: Metadata = { title: copy.pages.work_mine };`
- `src/app/(platform)/work/mine/page.tsx:11` — `return <><MyTasksWorkspace key={JSON.stringify(data.filters)} filters={<WorkFiltersForm filters={data.filters} model={data.model} appearance="workspace"/>} model={data.model} subject={data.access.subject} userId={data.access.userId} canCreate={data.access.permissions.includes("work.task.create")} />{data.model.tasks.length === 500 && <p role="status">แสดง 500 รายการล่าสุด กรุณาใช้ตัวกรองเพื่อดูช่วงที่ต้องการ</p>}</>;`

## A-047 — `src/app/(platform)/work/new/page.tsx`

- `src/app/(platform)/work/new/page.tsx:3` — `export const metadata: Metadata = { title: copy.pages.work_new };`
- `src/app/(platform)/work/new/page.tsx:13` — `return <WorkScreenShell title="เพิ่มงาน" description={copy.feedback.workCreateDescription} parent={{ label: "งานและ KPI", href: "/work" }} appearance="workspace"><WorkCreateForm model={await getWorkReadModel(access)} userId={access.userId}/></WorkScreenShell>;`

## A-048 — `src/app/(platform)/work/page.tsx`

- `src/app/(platform)/work/page.tsx:3` — `export const metadata: Metadata = { title: copy.pages.work };`

## A-049 — `src/app/(platform)/work/people/page.tsx`

- `src/app/(platform)/work/people/page.tsx:7` — `export const metadata: Metadata = { title: copy.pages.work_people };`
- `src/app/(platform)/work/people/page.tsx:11` — `return <><PeopleOverviewScreen model={data.model} subject={data.access.subject} filters={<WorkFiltersForm filters={data.filters} model={data.model} appearance="workspace" resetHref="/work/people" />} />{data.model.tasks.length === 500 && <p role="status">แสดง 500 รายการล่าสุด กรุณาใช้ตัวกรองเพื่อดูช่วงที่ต้องการ</p>}</>;`

## A-050 — `src/app/(platform)/work/reports/page.tsx`

- `src/app/(platform)/work/reports/page.tsx:7` — `export const metadata: Metadata = { title: copy.pages.work_reports };`
- `src/app/(platform)/work/reports/page.tsx:11` — `return <><WorkReportsScreen model={data.model} filters={<WorkFiltersForm filters={data.filters} model={data.model} appearance="workspace" resetHref="/work/reports" />} appearance="workspace" />{data.model.tasks.length === 500 && <p role="status">แสดง 500 รายการล่าสุด กรุณาใช้ตัวกรองเพื่อดูช่วงที่ต้องการ</p>}</>;`

## A-051 — `src/app/(platform)/work/team/page.tsx`

- `src/app/(platform)/work/team/page.tsx:7` — `export const metadata: Metadata = { title: copy.pages.work_team };`
- `src/app/(platform)/work/team/page.tsx:11` — `return <><TeamCommandScreen model={data.model} subject={data.access.subject} filters={<WorkFiltersForm filters={data.filters} model={data.model} appearance="workspace" resetHref="/work/team" />} />{data.model.tasks.length === 500 && <p role="status">แสดง 500 รายการล่าสุด กรุณาใช้ตัวกรองเพื่อดูช่วงที่ต้องการ</p>}</>;`

## A-052 — `src/app/(platform)/work/tracker/page.tsx`

- `src/app/(platform)/work/tracker/page.tsx:7` — `export const metadata: Metadata = { title: copy.pages.work_tracker };`
- `src/app/(platform)/work/tracker/page.tsx:11` — `return <><JobTrackerScreen model={data.model} subject={data.access.subject} ownerId={data.filters.owner} filters={<WorkFiltersForm filters={data.filters} model={data.model} appearance="workspace" resetHref="/work/tracker" />} />{data.model.tasks.length === 500 && <p role="status">แสดง 500 รายการล่าสุด กรุณาใช้ตัวกรองเพื่อดูช่วงที่ต้องการ</p>}</>;`

## A-079 — `src/app/change-password/page.tsx`

- `src/app/change-password/page.tsx:9` — `export const metadata: Metadata = { title: copy.pages.change_password };`

## A-081 — `src/app/layout.tsx`

- `src/app/layout.tsx:14` — `title: { default: "Permission Next", template: "%s \| Permission Next" },`
- `src/app/layout.tsx:19` — `const themeScript = &#96;(function(){try{var k=['permission-next','work'+'space','theme'].join('-'),t=localStorage.getItem(k);if(t!=='dark'&&t!=='light')t='light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})();&#96;;`

## A-089 — `src/app/login/page.tsx`

- `src/app/login/page.tsx:9` — `export const metadata: Metadata = { title: copy.pages.login };`

## A-091 — `src/components/access-denied.tsx`

- `src/components/access-denied.tsx:12` — `<p className="support-contact"><strong>{copy.auth.contact}</strong>{getServerEnv().SUPPORT_CONTACT_TEXT && <> · {getServerEnv().SUPPORT_CONTACT_TEXT}</>}</p>`

## A-092 — `src/components/account-control.tsx`

- `src/components/account-control.tsx:16` — `triggerRef.current &&`
- `src/components/account-control.tsx:17` — `!triggerRef.current.contains(event.target as Node) &&`
- `src/components/account-control.tsx:18` — `popoverRef.current &&`
- `src/components/account-control.tsx:33` — `<div className="account-control" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape" && open) { event.stopPropagation(); setOpen(false); triggerRef.current?.focus(); } }}>`

## A-093 — `src/components/admin-module-settings.tsx`

- `src/components/admin-module-settings.tsx:4` — `type Item = { id: string; name: string; enabled: boolean; version: number; ready: boolean };`
- `src/components/admin-module-settings.tsx:7` — `return <form action={action} className="admin-panel"><h3>{item.name}</h3><p>{item.enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}{!item.ready && " · กำลังพัฒนา"}</p>`

## A-094 — `src/components/admin-workspace-ux.tsx`

- `src/components/admin-workspace-ux.tsx:12` — `return <div role="status"><p>{total ? "ไม่พบผู้ใช้ที่ตรงกับคำค้นหา" : "ยังไม่มีผู้ใช้ในระบบ"}</p>{total > 0 && <button type="button" className="secondary-action" onClick={onClear}>ล้างคำค้นหา</button>}</div>;`

## A-095 — `src/components/admin-workspace.tsx`

- `src/components/admin-workspace.tsx:14` — `type AdminUser = { id: string; email: string; displayName: string \| null; employeeCode: string \| null; status: string; positionId: string \| null; positionName: string \| null; teamId: string \| null };`
- `src/components/admin-workspace.tsx:15` — `type AdminPosition = { id: string; code: string; name: string; scopeType: string; roleId: string; roleName: string \| null };`
- `src/components/admin-workspace.tsx:16` — `type AdminRole = { id: string; code: string; name: string; description: string \| null; isSystem: boolean };`
- `src/components/admin-workspace.tsx:17` — `type AdminTeam = { id: string; code: string; name: string };`
- `src/components/admin-workspace.tsx:18` — `type AdminPermission = { roleId: string; code: string; description: string \| null };`
- `src/components/admin-workspace.tsx:19` — `type AdminCapability = ModuleCapability & { moduleId: string; moduleName: string };`
- `src/components/admin-workspace.tsx:20` — `type UserScope = { userId: string; scopeType: string; selectedTeamId: string \| null };`
- `src/components/admin-workspace.tsx:21` — `type AuditRow = { id: string; actorId: string \| null; moduleId: string; action: string; entityType: string; entityId: string \| null; createdAt: string };`
- `src/components/admin-workspace.tsx:22` — `type PermissionsGranted = { users: boolean; profiles: boolean; positions: boolean; teams: boolean; roles: boolean; audit: boolean };`
- `src/components/admin-workspace.tsx:62` — `<label>สถานะบัญชี<select name="status" defaultValue={user.status}><option value="active">เปิดใช้งาน</option><option value="inactive">ระงับการใช้งาน</option></select></label>`
- `src/components/admin-workspace.tsx:64` — `<label>ตำแหน่ง<select name="positionId" value={positionId} onChange={(event) => { const next = event.target.value; setPositionId(next); setScopeType(positions.find((item) => item.id === next)?.scopeType \|\| "OWN"); }} required><option value="">เลือกตำแหน่ง</option>{positions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>`
- `src/components/admin-workspace.tsx:65` — `<label>ทีมหลัก<select name="teamId" value={teamId} onChange={(event) => setTeamId(event.target.value)} required={scopeType === "TEAM"}><option value="">ไม่กำหนดทีม</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>`
- `src/components/admin-workspace.tsx:66` — `<label className="admin-span">ขอบเขตข้อมูล<select name="scopeType" value={scopeType} onChange={(event) => setScopeType(event.target.value)}><option value="OWN">OWN · เฉพาะงานตนเอง</option><option value="TEAM">TEAM · ทีมหลัก</option><option value="SELECTED_TEAMS">SELECTED_TEAMS · เลือกหลายทีม</option><option value="ALL">ALL · ทุกข้อมูล</option></select></label>`
- `src/components/admin-workspace.tsx:67` — `{scopeType === "SELECTED_TEAMS" && <fieldset className="admin-team-picker admin-span"><legend>ทีมที่เข้าถึงได้</legend>{teams.map((team) => <label key={team.id}><input type="checkbox" name="selectedTeamId" value={team.id} checked={selectedTeams.includes(team.id)} onChange={(event) => setSelectedTeams((current) => event.target.checked ? [...current, team.id] : current.filter((id) => id !== team.id))}/>{team.name}</label>)}</fieldset>}`
- `src/components/admin-workspace.tsx:69` — `<aside className="admin-access-preview" aria-live="polite"><div><span>ตัวอย่างสิทธิ์ที่จะได้รับ</span><strong>{position?.roleName \|\| "ยังไม่เลือกตำแหน่ง"}</strong></div><div><span>ขอบเขตข้อมูล</span><strong>{scopeLabel(scopeType)}</strong>{scopeType === "TEAM" && <small className={!teamId ? "warning" : ""}>{teams.find((team) => team.id === teamId)?.name \|\| "ต้องเลือกทีมหลัก"}</small>}{scopeType === "SELECTED_TEAMS" && <small className={!selectedTeamNames.length ? "warning" : ""}>{selectedTeamNames.join(", ") \|\| "ต้องเลือกอย่างน้อยหนึ่งทีม"}</small>}</div>`
- `src/components/admin-workspace.tsx:85` — `<div className="admin-capability-matrix">{modules.map((moduleId) => <fieldset key={moduleId}><legend>{capabilities.find((item) => item.moduleId === moduleId)?.moduleName}</legend>{capabilities.filter((item) => item.moduleId === moduleId).map((capability) => <label key={capability.code}><input type="checkbox" name="permissionCode" value={capability.code} defaultChecked={granted.has(capability.code)} disabled={role.isSystem}/><span><strong>{capability.labelTh}</strong>{capability.risk !== "normal" && <small>{capability.risk}</small>}<details><summary>รายละเอียดเพิ่มเติม</summary><code>{capability.code}</code></details></span></label>)}</fieldset>)}</div>{!role.isSystem && <button className="primary" disabled={pending}>{pending ? "กำลังบันทึก…" : "บันทึกบทบาทและสิทธิ์"}</button>}<Result state={state}/></form>{!role.isSystem && <form action={deleteRole} className="admin-role-delete-form" onSubmit={(event) => { if (!window.confirm(&#96;ยืนยันลบบทบาท ${role.name}? การลบจะลบสิทธิ์ที่ผูกกับบทบาทด้วย&#96;)) event.preventDefault(); }}><input type="hidden" name="roleId" value={role.id}/><button type="submit" className="danger-action" disabled={deletePending}>{deletePending ? "กำลังลบ…" : "ลบบทบาทที่สร้าง"}</button><Result state={deleteState}/></form>}</div></details>;`
- `src/components/admin-workspace.tsx:103` — `{section==="users" && (permissionsGranted.users \|\| permissionsGranted.profiles) && <section id="users" data-admin-surface="users" className="admin-panel admin-users"><header><div className="admin-panel-title"><h2>ผู้ใช้และทบทวนสิทธิ์</h2><span className="admin-status-badge admin-status-neutral">บัญชีและองค์กร</span><p>ตรวจสิทธิ์ที่จะได้รับจากบทบาทและขอบเขตข้อมูลก่อนบันทึก</p></div><strong>{users.length} บัญชี</strong></header>`
- `src/components/admin-workspace.tsx:105` — `{permissionsGranted.users && <details className="admin-create-disclosure"><summary>เพิ่มผู้ใช้</summary><form action={createUser} className="admin-form admin-create-row"><label>ชื่อที่แสดง<input name="displayName" required minLength={2}/></label><label>อีเมล<input name="email" type="email" required/></label><label>รหัสพนักงาน<input name="employeeCode"/></label><label>ตำแหน่ง<select name="positionId" required><option value="">เลือกตำแหน่ง</option>{positions.map((position) => <option key={position.id} value={position.id}>{position.name} · {position.roleName}</option>)}</select></label><label>ทีมหลัก<select name="teamId"><option value="">ไม่กำหนดทีม</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label><label>รหัสผ่านชั่วคราว<input name="password" type="password" minLength={12} autoComplete="new-password" required/></label><button className="primary" disabled={userPending \|\| !positions.length}>{userPending ? "กำลังเพิ่ม…" : "เพิ่มผู้ใช้"}</button><Result state={userState}/></form></details>}`
- `src/components/admin-workspace.tsx:107` — `<div className="admin-table-wrap" role="region" aria-label={copy.feedback.usersTable} tabIndex={0}><table><thead><tr><th>ผู้ใช้</th><th>รหัสพนักงาน</th><th>ตำแหน่ง / ทีม</th><th>ขอบเขตข้อมูล</th><th>สถานะ</th>{permissionsGranted.users && <th>จัดการ</th>}</tr></thead><tbody>{visibleUsers.map((user) => { const scopes = userScopes.filter((scope) => scope.userId === user.id); return <tr key={user.id}><td><strong title={user.displayName \|\| undefined}>{user.displayName \|\| "ไม่ระบุชื่อ"}</strong><small>{user.email}</small></td><td>{user.employeeCode \|\| "—"}</td><td><strong>{user.positionName \|\| "ยังไม่กำหนด"}</strong><small>{teams.find((team) => team.id === user.teamId)?.name \|\| "ไม่กำหนดทีม"}</small></td><td>{scopeLabel(scopes[0]?.scopeType \|\| "OWN")}</td><td><span className={&#96;admin-status ${user.status}&#96;}>{user.status === "active" ? "ใช้งาน" : "ระงับ"}</span></td>{permissionsGranted.users && <td><EditUserDialog user={user} positions={positions} teams={teams} rolePermissions={rolePermissions} userScopes={scopes} sessionCount={sessions.find((item) => item.userId === user.id)?.count \|\| 0}/></td>}</tr>; })}</tbody></table></div>`
- `src/components/admin-workspace.tsx:110` — `{section==="positions" && permissionsGranted.positions && <section id="positions" data-admin-surface="positions" className="admin-panel"><div className="admin-panel-title"><h2>ตำแหน่ง</h2><span className="admin-status-badge admin-status-neutral">ตั้งค่าองค์กร</span></div><form action={createPosition} className="admin-form"><label>รหัสตำแหน่ง<input name="code" placeholder="building_officer" required/></label><label>ชื่อตำแหน่ง<input name="name" required/></label><label>บทบาท<select name="roleId" required>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label><label>ขอบเขตเริ่มต้น<select name="scopeType" defaultValue="OWN"><option value="OWN">OWN</option><option value="TEAM">TEAM</option><option value="ALL">ALL</option></select></label><button className="secondary-action" disabled={positionPending}>เพิ่มตำแหน่ง</button><Result state={positionState}/></form><div className="admin-inline-list">{positions.map((position) => <form action={updatePosition} key={position.id}><input type="hidden" name="positionId" value={position.id}/><strong>{position.code}</strong><input name="name" defaultValue={position.name} aria-label={&#96;ชื่อตำแหน่ง ${position.code}&#96;}/><select name="roleId" defaultValue={position.roleId} aria-label={&#96;บทบาทของตำแหน่ง ${position.code}&#96;}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><select name="scopeType" defaultValue={position.scopeType} aria-label={&#96;ขอบเขตเริ่มต้นของตำแหน่ง ${position.code}&#96;}><option value="OWN">OWN</option><option value="TEAM">TEAM</option><option value="ALL">ALL</option></select><button disabled={positionEditPending}>บันทึก</button></form>)}</div><Result state={positionEditState}/></section>}`
- `src/components/admin-workspace.tsx:111` — `{section==="teams" && permissionsGranted.teams && <section id="teams" data-admin-surface="teams" className="admin-panel admin-team-panel"><header><div className="admin-panel-title"><h2>ทีม</h2><span className="admin-status-badge admin-status-neutral">ตั้งค่าองค์กร</span><p>ใช้ทีมเพื่อกำหนดขอบเขตงานและติดตามผล</p></div><strong>{teams.length} ทีม</strong></header><form action={createTeam} className="admin-team-form"><label>รหัสทีม<input name="code" placeholder="permission_ops" minLength={2} maxLength={64} required/></label><label>ชื่อทีม<input name="name" minLength={2} maxLength={120} required/></label><button className="secondary-action" disabled={teamPending}>เพิ่มทีม</button><Result state={teamState}/></form><div className="admin-team-list">{teams.map((team) => { const memberCount = users.filter((user) => user.teamId === team.id).length; return <div key={team.id} className="admin-team-item"><form action={updateTeam}><input type="hidden" name="teamId" value={team.id}/><span><strong>{team.code}</strong><small>{memberCount} ผู้ใช้</small></span><input name="name" defaultValue={team.name} aria-label={&#96;ชื่อทีม ${team.code}&#96;}/><button disabled={teamEditPending}>บันทึก</button></form><form action={deleteTeam} onSubmit={(event) => { if (!window.confirm(&#96;ยืนยันลบทีม ${team.name}?&#96;)) event.preventDefault(); }}><input type="hidden" name="teamId" value={team.id}/><button type="submit" disabled={deleteTeamPending \|\| memberCount > 0} aria-label={memberCount > 0 ? &#96;ย้ายผู้ใช้ออกจากทีม ${team.name} ก่อนลบ&#96; : &#96;ลบทีม ${team.name}&#96;}>{memberCount > 0 ? "ย้ายผู้ใช้ก่อน" : "ลบ"}</button></form></div>; })}</div><Result state={teamEditState}/><Result state={deleteTeamState}/></section>}`
- `src/components/admin-workspace.tsx:113` — `{section==="roles" && permissionsGranted.roles && <section id="roles" data-admin-surface="roles" className="admin-panel admin-roles"><header><div className="admin-panel-title"><h2>บทบาทและสิทธิ์การใช้งาน</h2><span className="admin-status-badge admin-status-neutral">สิทธิ์และการเข้าถึง</span><p>เลือกสิทธิ์ตามงานที่แต่ละบทบาทต้องรับผิดชอบ</p></div><strong>{roles.length} บทบาท</strong></header><form action={createRole} className="admin-form admin-role-create"><label>รหัสบทบาท<input name="code" required/></label><label>ชื่อบทบาท<input name="name" required/></label><label>คำอธิบาย<input name="description"/></label><label>สร้างจาก<select name="sourceRoleId"><option value="">บทบาทว่าง</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label><button className="secondary-action" disabled={rolePending}>{rolePending ? "กำลังสร้าง…" : "สร้างบทบาท"}</button><Result state={roleState}/></form><div className="admin-role-list">{roles.map((role) => <RoleEditor key={role.id} role={role} permissions={rolePermissions} capabilities={capabilities}/>)}</div></section>}`
- `src/components/admin-workspace.tsx:114` — `{section==="audit" && permissionsGranted.audit && <section id="audit" data-admin-surface="audit" className="admin-panel admin-audit"><header><div className="admin-panel-title"><h2>ประวัติการเปลี่ยนแปลง</h2><span className="admin-status-badge admin-status-neutral">ตรวจสอบย้อนหลัง</span><p>ดูการเปลี่ยนแปลงล่าสุดได้ที่นี่</p></div><strong>{auditRows.length} รายการ</strong></header><div className="admin-table-wrap" role="region" aria-label={copy.feedback.auditTable} tabIndex={0}><table><thead><tr><th>เวลา</th><th>ผู้ดำเนินการ</th><th>ส่วนงาน</th><th>การเปลี่ยนแปลง</th><th>รายการ</th></tr></thead><tbody>{auditRows.length ? auditRows.map((row) => <tr key={row.id}><td>{new Date(row.createdAt).toLocaleString("th-TH")}</td><td>{users.find((user) => user.id === row.actorId)?.displayName \|\| row.actorId \|\| "ระบบ"}</td><td>{row.moduleId}</td><td><code>{row.action}</code></td><td>{row.entityType}<small>{row.entityId \|\| "—"}</small></td></tr>) : <tr><td colSpan={5}><p className="admin-empty">ยังไม่มีประวัติการเปลี่ยนแปลง</p></td></tr>}</tbody></table></div></section>}`

## A-096 — `src/components/app-shell.tsx`

- `src/components/app-shell.tsx:55` — `{!collapsed && scopeLabel && <p className="sidebar-scope text-xs leading-5 text-[var(--color-nav-muted)]">คุณเห็นข้อมูลของ:<br/>{scopeLabel}</p>}`

## A-097 — `src/components/auth/auth-shell.tsx`

- `src/components/auth/auth-shell.tsx:9` — `export function AuthShell({ title, description, children, notice, contactText, imageSrc }: { title: string; description: string; children: ReactNode; notice?: string; contactText?: string; imageSrc?: string }) {`
- `src/components/auth/auth-shell.tsx:14` — `{notice && <p className="auth-notice" role="status">{notice}</p>}`
- `src/components/auth/auth-shell.tsx:17` — `<p className="auth-help">{copy.auth.help}<br/><strong>{copy.auth.contact}</strong>{contactText && <> · {contactText}</>}</p>`

## A-098 — `src/components/auth/password-field.tsx`

- `src/components/auth/password-field.tsx:6` — `type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string; inputRef?: Ref<HTMLInputElement>; error?: string };`

## A-099 — `src/components/change-password-form-ux.tsx`

- `src/components/change-password-form-ux.tsx:6` — `type Errors = { password?: string; confirm?: string };`
- `src/components/change-password-form-ux.tsx:7` — `type Submission = { password: string; confirm: string; pending: boolean; setErrors(errors: Errors): void; focus(field: keyof Errors): void };`
- `src/components/change-password-form-ux.tsx:23` — `return <><PasswordField label={copy.auth.newPassword} inputRef={passwordRef} name="password" minLength={12} maxLength={256} autoComplete="new-password" required autoFocus value={password} error={errors.password} onChange={event => onPasswordChange(event.target.value)}/><PasswordField label={copy.auth.confirmPassword} inputRef={confirmRef} name="confirm" minLength={12} maxLength={256} autoComplete="new-password" required value={confirm} onChange={event => onConfirmChange(event.target.value)} error={errors.confirm \|\| (confirm && password !== confirm ? copy.auth.passwordMismatch : undefined)}/></>;`

## A-100 — `src/components/change-password-form.tsx`

- `src/components/change-password-form.tsx:21` — `{state.error && !pending && <div className="auth-error" role="alert">! {state.error}</div>}`
- `src/components/change-password-form.tsx:23` — `<div className="auth-hint"><strong>{copy.auth.passwordChecklist}</strong><ul aria-live="polite">{checks.map(([met, label]) => <li key={label} className={met ? "is-met" : ""}><span aria-hidden="true">{met ? "✓" : "○"}</span> {label}</li>)}</ul><span aria-live="polite">{confirm && password === confirm && copy.auth.passwordMatch}</span></div>`
- `src/components/change-password-form.tsx:24` — `<button className="button auth-submit-button" disabled={pending}>{pending && <span className="auth-spinner" aria-hidden="true"/>}{pending ? copy.auth.savingPassword : copy.auth.savePassword}<span aria-hidden="true">→</span></button>`

## A-101 — `src/components/dashboard-overview.tsx`

- `src/components/dashboard-overview.tsx:23` — `{allowedModuleIds.length > 0 && <div className="module-directory-heading mb-4 mt-8"><h2 className="text-xl font-bold text-[var(--color-text)]">ทำงานต่อในพื้นที่ของคุณ</h2><p className="mt-1 text-sm text-[var(--color-text-muted)]">เปิดโมดูลที่คุณมีสิทธิ์ใช้งาน</p></div>}`
- `src/components/dashboard-overview.tsx:27` — `{allowedModuleIds.length > 0 && <SourceDetails snapshot={snapshot} preview={preview}/>}`

## A-102 — `src/components/deposit-editor.tsx`

- `src/components/deposit-editor.tsx:15` — `function TextField({ name, label, value, type = "text", required = false, full = false }: { name: string; label: string; value?: string \| number; type?: string; required?: boolean; full?: boolean }) {`
- `src/components/deposit-editor.tsx:16` — `return <label className={full ? "full" : ""}>{label}<input name={name} type={type} defaultValue={value ?? ""} required={required} min={type === "number" ? 0 : undefined} step={type === "number" ? ".01" : undefined}/></label>;`
- `src/components/deposit-editor.tsx:24` — `useEffect(() => { if (saveState.ok && saveState.id && !item) router.push(&#96;/guarantees/${saveState.id}&#96;); }, [saveState, item, router]);`
- `src/components/deposit-editor.tsx:25` — `useEffect(() => { if (saveState.ok && item \|\| transitionState.ok) router.refresh(); }, [saveState, transitionState, item, router]);`
- `src/components/deposit-editor.tsx:31` — `{item && <><input type="hidden" name="id" value={item.id}/><input type="hidden" name="version" value={item.version}/></>}`
- `src/components/deposit-editor.tsx:32` — `<TextField name="place" label="อาคาร *" value={item?.place} required/><label>พื้นที่ / ทีมติดตั้ง<select name="area" value={area} onChange={(event) => setArea(event.target.value)} required><option value="">เลือกพื้นที่</option>{installationAreas.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>`
- `src/components/deposit-editor.tsx:40` — `<label className="full">มอบหมายผู้รับผิดชอบทีมติดตั้ง<select name="tlAssigneeId" defaultValue={item?.tlAssigneeId \|\| ""}><option value="">ยังไม่มอบหมาย</option>{assignees.map((person) => <option key={person.id} value={person.id}>{person.displayName \|\| person.id}</option>)}</select></label>`
- `src/components/deposit-editor.tsx:52` — `<label>ผู้ตรวจรับ<select name="inspected_by" defaultValue={item?.inspected_by \|\| ""}><option value="">ยังไม่ระบุ</option><option value="TL">ทีมติดตั้ง</option><option value="Building Dept">Building Dept</option></select></label>`
- `src/components/deposit-editor.tsx:53` — `<label>คืนประกันติดตั้ง<select name="depReturn" defaultValue={item?.depReturn \|\| "No"}><option>No</option><option>Yes</option></select></label>`
- `src/components/deposit-editor.tsx:54` — `<label>คืนประกันรื้อถอน<select name="demoReturn" defaultValue={item?.demoReturn \|\| "No"}><option>No</option><option>Yes</option></select></label>`
- `src/components/deposit-editor.tsx:57` — `{saveState.message && <p role="status" className={&#96;deposit-form-message ${saveState.ok ? "" : "error"}&#96;}>{saveState.message}</p>}`
- `src/components/deposit-editor.tsx:59` — `{item && <aside className="deposit-side"><section className="deposit-panel"><h2>สถานะการเงิน</h2><dl><div><dt>ประกันติดตั้ง</dt><dd>{money(parseMoney(item.deposit))}</dd></div><div><dt>ประกันรื้อถอน</dt><dd>{money(parseMoney(item.demolish))}</dd></div><div><dt>คงค้าง</dt><dd>{money(getOutstandingAmount(item))}</dd></div></dl></section>`
- `src/components/deposit-editor.tsx:71` — `{!targets.length && <p>รายการนี้สิ้นสุดแล้ว</p>}{transitionState.message && <p role="status">{transitionState.message}</p>}</form></section>`
- `src/components/deposit-editor.tsx:72` — `<section className="deposit-panel deposit-history"><h2>ประวัติการทำงาน</h2>{events.map((event) => <TruncatedText key={event.id} text={&#96;${new Date(event.occurredAt).toLocaleString("th-TH")} · ${event.action === "transition" ? &#96;${event.fromStatus} → ${event.toStatus}&#96; : event.action}${event.reason ? &#96; · ${event.reason}&#96; : ""}&#96;} lines={3}/>) }{!events.length && <p>ยังไม่มีประวัติ</p>}</section>`

## A-103 — `src/components/deposit-evidence-upload.tsx`

- `src/components/deposit-evidence-upload.tsx:33` — `{exists && <a href={&#96;/api/guarantees/${id}/documents/${kind}&#96;} target="_blank" rel="noreferrer">เปิดไฟล์</a>}`
- `src/components/deposit-evidence-upload.tsx:34` — `{canUpload && <><input type="file" accept="application/pdf,image/jpeg,image/png" aria-label={&#96;เลือก${labels[kind]}&#96;} onChange={(event) => setFile(event.target.files?.[0] \|\| null)}/>`
- `src/components/deposit-evidence-upload.tsx:36` — `{message && <small role="status">{message}</small>}`

## A-104 — `src/components/deposit-tl-workspace.tsx`

- `src/components/deposit-tl-workspace.tsx:24` — `{!targets.length && <p>ไม่มีขั้นตอนของทีมติดตั้งที่ต้องดำเนินการ</p>}{state.message && <p role="status">{state.message}</p>}</form></section>`

## A-105 — `src/components/deposit-workspace.tsx`

- `src/components/deposit-workspace.tsx:22` — `const statusOptions = ["new", "fin", "att", "tl_wait", "tl_process", "ret", "clo", "refund_process", "on_service", "off_service_pending", "done", "cancel"];`
- `src/components/deposit-workspace.tsx:23` — `type WorkspaceView = "dashboard" \| "list" \| "on_service" \| "done" \| "queue" \| "analytics";`
- `src/components/deposit-workspace.tsx:51` — `if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((event.target as HTMLElement).tagName)) { event.preventDefault(); searchRef.current?.focus(); }`
- `src/components/deposit-workspace.tsx:67` — `if (statusFilter && getWorkflowStatusKey(item) !== statusFilter) return false;`
- `src/components/deposit-workspace.tsx:68` — `if (ownerFilter && item.owner !== ownerFilter) return false;`
- `src/components/deposit-workspace.tsx:69` — `if (areaFilter && item.area !== areaFilter) return false;`
- `src/components/deposit-workspace.tsx:89` — `const personalDueSoon = personalQueue.filter((entry) => entry.overdueDays > 0 \|\| entry.dueInDays !== null && entry.dueInDays <= 3);`
- `src/components/deposit-workspace.tsx:110` — `const exportRows = filtered.filter((item) => { const date = parseDateValue(item.dateReq); return (!exportYear \|\| date?.getFullYear() === Number(exportYear)) && (!exportMonth \|\| date?.getMonth() === Number(exportMonth)); });`
- `src/components/deposit-workspace.tsx:120` — `const tabs: Array<[WorkspaceView, string, number?]> = installationTeamView`
- `src/components/deposit-workspace.tsx:128` — `<PageHeader parent={{ label: "ภาพรวม", href: "/" }} eyebrow={installationTeamView ? "เงินประกันอาคาร / งานทีมติดตั้ง" : isAnalytics ? "เงินประกันอาคาร / รายงานวิเคราะห์" : "เงินประกันอาคาร / งานดำเนินการ"} title={isAnalytics ? "ภาพรวมเงินประกันอาคาร" : installationTeamView ? "งานที่ทีมติดตั้งต้องดำเนินการ" : "รายการขอคืนเงินประกันอาคาร"} description={isAnalytics ? "รายงานหลักสำหรับติดตามเงินประกัน การคืนเงิน และประเด็นที่ต้องดำเนินการ" : &#96;ติดตามเอกสาร ขั้นตอน และสถานะการขอคืนเงินประกัน · อัปเดตล่าสุด ${lastUpdated ? lastUpdated.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : "—"}&#96;} />`
- `src/components/deposit-workspace.tsx:131` — `<select aria-label="เดือนสำหรับส่งออก" value={exportMonth} onChange={(event) => setExportMonth(event.target.value)}><option value="">ทุกเดือน</option>{[{ value: "0", label: "ม.ค." }, { value: "1", label: "ก.พ." }, { value: "2", label: "มี.ค." }, { value: "3", label: "เม.ย." }, { value: "4", label: "พ.ค." }, { value: "5", label: "มิ.ย." }, { value: "6", label: "ก.ค." }, { value: "7", label: "ส.ค." }, { value: "8", label: "ก.ย." }, { value: "9", label: "ต.ค." }, { value: "10", label: "พ.ย." }, { value: "11", label: "ธ.ค." }].map((month) => <option value={month.value} key={month.value}>{month.label}</option>)}</select>`
- `src/components/deposit-workspace.tsx:132` — `<select aria-label="ปีสำหรับส่งออก" value={exportYear} onChange={(event) => setExportYear(event.target.value)}><option value="">ทุกปี</option>{years.map((year) => <option value={year} key={year}>{year}</option>)}</select>`
- `src/components/deposit-workspace.tsx:134` — `{!installationTeamView && (createUnavailableReason ? <button className="primary" type="button" disabled title={createUnavailableReason}>＋ เพิ่มรายการใหม่</button> : <Link className="primary" href="/guarantees/new">＋ เพิ่มรายการใหม่</Link>)}`
- `src/components/deposit-workspace.tsx:136` — `{installationTeamView && <div className="deposit-banner">มุมมองนี้แสดงเฉพาะงานสถานะ “รอทีมติดตั้งรับงาน”, “ทีมติดตั้งดำเนินการ” และ “รอดำเนินการ Off Service”</div>}`
- `src/components/deposit-workspace.tsx:137` — `{preview && <div className="deposit-banner">ข้อมูลตัวอย่างจาก workflow V2 · ไม่มีการบันทึก <Link href={installationTeamView ? "/guarantees?view=installation-team" : "/guarantees"}>กลับข้อมูลจริง</Link></div>}`
- `src/components/deposit-workspace.tsx:138` — `{!preview && state !== "ready" && <div className="deposit-banner">{state === "not_configured" ? copy.feedback.unavailable : "โหลดข้อมูลเงินประกันไม่สำเร็จ"} {canPreview && <Link href={&#96;/guarantees?preview=1${installationTeamView ? "&view=installation-team" : ""}&#96;}>ดูข้อมูลตัวอย่าง</Link>}</div>}`
- `src/components/deposit-workspace.tsx:139` — `{truncated && <div className="deposit-banner">แสดง 500 รายการที่อัปเดตล่าสุดเท่านั้น</div>}`
- `src/components/deposit-workspace.tsx:140` — `{copyMessage && <div className="deposit-toast" role="status">{copyMessage}</div>}`
- `src/components/deposit-workspace.tsx:142` — `<nav className="legacy-module-nav" aria-label="มุมมองเงินประกัน">{tabs.map(([key, label, count]) => <button key={key} type="button" className={view === key ? "active" : ""} onClick={() => setWorkspaceView(key)}>{label}{typeof count === "number" && <span>{count}</span>}</button>)}</nav>`
- `src/components/deposit-workspace.tsx:144` — `{(["list", "done"] as WorkspaceView[]).includes(view) && <>`
- `src/components/deposit-workspace.tsx:154` — `<select aria-label="กรองสถานะ" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option value="">สถานะงานทั้งหมด</option>{statusOptions.map((key) => <option key={key} value={key}>{workflowLabels[key]}</option>)}</select>`
- `src/components/deposit-workspace.tsx:155` — `<select aria-label="กรองเจ้าของงาน" value={ownerFilter} onChange={(event) => { setOwnerFilter(event.target.value); setPage(1); }}><option value="">เจ้าของงานทั้งหมด</option>{owners.map((owner) => <option key={owner}>{owner}</option>)}</select>`
- `src/components/deposit-workspace.tsx:156` — `<select aria-label="กรองพื้นที่" value={areaFilter} onChange={(event) => { setAreaFilter(event.target.value); setPage(1); }}><option value="">พื้นที่ทั้งหมด</option>{areas.map((area) => <option key={area}>{area}</option>)}</select>`
- `src/components/deposit-workspace.tsx:157` — `{(query \|\| statusFilter \|\| ownerFilter \|\| areaFilter) && <button type="button" className="legacy-clear" onClick={() => { setQuery(""); setStatusFilter(""); setOwnerFilter(""); setAreaFilter(""); setPage(1); }}>ล้างตัวกรอง</button>}`
- `src/components/deposit-workspace.tsx:160` — `{pageItems.map((item) => <tr key={item.id \|\| item.id_firestore} tabIndex={0} onClick={() => !preview && item.id && router.push(&#96;/guarantees/${item.id}&#96;)} onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (!preview && item.id && (event.key === "Enter" \|\| event.key === " ")) { event.preventDefault(); router.push(&#96;/guarantees/${item.id}&#96;); } }}>`
- `src/components/deposit-workspace.tsx:163` — `</tr>)}</tbody></table>{!pageItems.length && <div className="deposit-empty">ไม่พบรายการที่ตรงกับเงื่อนไข</div>}</TableRegion>`
- `src/components/deposit-workspace.tsx:164` — `{filtered.length > pageSize && <footer className="legacy-pagination"><span>แสดง {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} จาก {filtered.length}</span><div><button type="button" disabled={safePage <= 1} onClick={() => setPage((value) => value - 1)}>← ก่อนหน้า</button><strong>หน้า {safePage} / {pageCount}</strong><button type="button" disabled={safePage >= pageCount} onClick={() => setPage((value) => value + 1)}>ถัดไป →</button></div></footer>}`
- `src/components/deposit-workspace.tsx:168` — `{view === "on_service" && <section className="deposit-on-service" aria-label="ติดตามเงินประกันรื้อถอน On Service">`
- `src/components/deposit-workspace.tsx:180` — `{!filtered.length && <p className="deposit-empty">ไม่พบรายการ On Service ตามคำค้นหาและตัวกรอง</p>}`
- `src/components/deposit-workspace.tsx:183` — `{view === "dashboard" && <section className="deposit-personal-dashboard" aria-label="ภาพรวมงานเงินประกันของฉัน">`
- `src/components/deposit-workspace.tsx:184` — `<header><div><h2>วันนี้ฉันต้องทำอะไร?</h2><p>แสดงเฉพาะรายการที่เป็นเจ้าของหรือมอบหมายให้บัญชีนี้ ตามขอบเขตที่ระบบอนุญาต</p></div>{canViewTlWorkspace && <Link href="/guarantees?view=installation-team">งานทีมติดตั้ง</Link>}</header>`
- `src/components/deposit-workspace.tsx:185` — `{!personalUserId && <div className="deposit-banner">ไม่พบข้อมูลผู้ใช้สำหรับสร้างภาพรวมส่วนบุคคล</div>}`
- `src/components/deposit-workspace.tsx:200` — `</Link>)}{!personalQueue.length && <p className="deposit-empty">ไม่มีรายการเร่งด่วนในรายการที่มอบหมายให้คุณ</p>}</section>`
- `src/components/deposit-workspace.tsx:201` — `<section className="deposit-personal-list"><h3>แจ้งเตือนที่ทำต่อได้</h3>{personalNotifications.slice(0, 6).map((notice) => <Link key={notice.id} href={&#96;/guarantees/${notice.taskId}&#96;}><strong>{notice.title}</strong><small>{notice.detail}</small></Link>)}{!personalNotifications.length && <p className="deposit-empty">ไม่มีการแจ้งเตือนที่ต้องดำเนินการ</p>}`
- `src/components/deposit-workspace.tsx:202` — `<h3>งานเสร็จล่าสุด</h3>{personalCompleted.map((item) => <Link key={item.id} href={&#96;/guarantees/${item.id}&#96;}><strong>{item.place \|\| "ไม่ระบุอาคาร"}</strong><small>เสร็จสิ้น · {formatDate(item.updatedAt)}</small></Link>)}{!personalCompleted.length && <p className="deposit-empty">ยังไม่มีรายการที่เสร็จสิ้น</p>}`
- `src/components/deposit-workspace.tsx:203` — `<h3>ความเคลื่อนไหวล่าสุด</h3>{personalRecentActivity.map((item) => <Link key={&#96;activity-${item.id}&#96;} href={&#96;/guarantees/${item.id}&#96;}><strong>{item.place \|\| "ไม่ระบุอาคาร"}</strong><small>{workflowLabels[getWorkflowStatusKey(item)]} · อัปเดต {formatDate(item.updatedAt)}</small></Link>)}{!personalRecentActivity.length && <p className="deposit-empty">ยังไม่มีความเคลื่อนไหว</p>}`
- `src/components/deposit-workspace.tsx:207` — `{view === "queue" && <div className="deposit-queue">{queue.map((entry) => <article key={entry.item.id \|\| entry.item.id_firestore} className="deposit-queue-row"><StatusBadge label={entry.priority === "high" ? "เร่งด่วน" : entry.priority === "medium" ? "ติดตาม" : "ทั่วไป"} tone={depositPriorityTone(entry.priority)} /><div><TruncatedText text={entry.item.place \|\| "ไม่ระบุอาคาร"} lines={2}/><TruncatedText text={&#96;${workflowLabels[entry.workflowKey]} · ${entry.reasons.join(" · ")}&#96;} lines={2}/></div><b className="deposit-money">{money(entry.outstandingAmount)}</b><Link href={&#96;/guarantees/${entry.item.id}&#96;}>เปิด →</Link></article>)}{!queue.length && <div className="deposit-empty">ไม่มีรายการที่ต้องติดตาม</div>}</div>}`
- `src/components/deposit-workspace.tsx:208` — `{view === "analytics" && <GuaranteeExecutiveDashboard items={items} generatedAt={generatedAt} truncated={truncated} ready={state === "ready"} preview={preview} />}`

## A-106 — `src/components/guarantee-executive-dashboard.tsx`

- `src/components/guarantee-executive-dashboard.tsx:20` — `const scoped = useMemo(() => items.filter((item) => (!area \|\| item.area?.trim() === area) && (!owner \|\| item.owner?.trim() === owner)), [items, area, owner]);`
- `src/components/guarantee-executive-dashboard.tsx:25` — `const dueDatesMissing = due.openCount > 0 && due.dueDateCount === 0 && report.operational.overdueCount === 0;`
- `src/components/guarantee-executive-dashboard.tsx:27` — `const latestRecordUpdate = useMemo(() => items.map((item) => item.updatedAt ? new Date(item.updatedAt) : null).filter((date): date is Date => date instanceof Date && !Number.isNaN(date.getTime())).sort((a, b) => b.getTime() - a.getTime())[0], [items]);`
- `src/components/guarantee-executive-dashboard.tsx:38` — `<div className="gr-filterbar"><label>พื้นที่<select value={area} onChange={(event) => setArea(event.target.value)}><option value="">ทุกพื้นที่</option>{areas.map((value) => <option key={value}>{value}</option>)}</select></label><label>เจ้าของงาน<select value={owner} onChange={(event) => setOwner(event.target.value)}><option value="">เจ้าของงานทั้งหมด</option>{owners.map((value) => <option key={value}>{value}</option>)}</select></label>{(area \|\| owner) && <button type="button" onClick={() => { setArea(""); setOwner(""); }}>ล้างตัวกรอง</button>}<p aria-live="polite"><strong>{scoped.length.toLocaleString("th-TH")}</strong> รายการในขอบเขตรายงาน <span>· {area \|\| "ทุกพื้นที่"} · {owner \|\| "เจ้าของงานทั้งหมด"}</span></p></div>`
- `src/components/guarantee-executive-dashboard.tsx:40` — `{(!ready \|\| preview \|\| truncated) && <p className="gr-scope-note" role="status">{!ready ? "ข้อมูลยังไม่พร้อมสำหรับสรุปรายงาน กรุณาโหลดข้อมูลใหม่" : preview ? "รายงานนี้ใช้ข้อมูลตัวอย่าง ไม่ใช่ยอดเงินจริง" : "รายงานครอบคลุมเฉพาะ 500 รายการล่าสุดตามสิทธิ์ ไม่ใช่ยอดรวมทั้งองค์กร"}</p>}`
- `src/components/guarantee-executive-dashboard.tsx:41` — `{ready && !scoped.length ? <div className="gr-empty"><h3>ไม่มีข้อมูลในขอบเขตที่เลือก</h3><p>ลองเปลี่ยนพื้นที่หรือเจ้าของงานเพื่อดูรายงาน</p></div> : ready && <>`
- `src/components/guarantee-executive-dashboard.tsx:58` — `<section className="gr-panel gr-actions"><header><h3>คิวที่ต้องดำเนินการ</h3><p>คอขวด หลักฐานที่ขาด และรายการไม่มีวันครบกำหนด · ไม่รวม On Service ตามปกติ</p></header>{report.actionItems.length ? <ul>{report.actionItems.slice(0, 8).map((entry) => <li key={entry.item.id \|\| entry.item.id_firestore \|\| entry.workflowKey}><div><strong>{entry.item.place \|\| "ไม่ระบุอาคาร"}</strong><span>{entry.reasons.slice(0, 2).join(" · ") \|\| "ควรติดตาม"}</span>{entry.missingDocuments.length > 0 && <small>หลักฐานที่ขาด: {entry.missingDocuments.join(", ")}</small>}</div>{entry.item.id && !preview && <Link href={&#96;/guarantees/${entry.item.id}&#96;}>เปิดรายละเอียด →</Link>}</li>)}</ul> : <p className="gr-empty">ไม่พบคิวที่ต้องดำเนินการในขอบเขตนี้</p>}</section>`
- `src/components/guarantee-executive-dashboard.tsx:59` — `<section className="gr-panel gr-top" id="gr-contributors"><header><h3>5 รายการที่มียอดคงค้างสูงสุด</h3><p>รวม On Service · เปิดรายการเพื่อตรวจรายละเอียด</p></header>{!report.topOutstanding.length ? <p className="gr-empty">ไม่มียอดเงินประกันคงค้าง</p> : <div className="gr-table-scroll"><table><thead><tr><th>อาคาร / รายการ</th><th>พื้นที่</th><th>ผู้รับผิดชอบ</th><th>ยอดคงค้าง</th><th><span className="sr-only">รายละเอียด</span></th></tr></thead><tbody>{report.topOutstanding.map(({ item, amount: value }, index) => <tr key={item.id \|\| item.id_firestore \|\| index}><td><strong>{item.place \|\| "ไม่ระบุอาคาร"}</strong><small>{item.cid \|\| item.no \|\| "ไม่ระบุเลขอ้างอิง"}</small></td><td>{item.area \|\| "ไม่ระบุพื้นที่"}</td><td>{item.owner \|\| "ไม่ระบุผู้รับผิดชอบ"}</td><td><strong>{money(value)}</strong></td><td>{item.id && !preview && <Link href={&#96;/guarantees/${item.id}&#96;} aria-label={&#96;เปิดรายละเอียด ${item.place \|\| "รายการเงินประกัน"}&#96;}>รายละเอียด →</Link>}</td></tr>)}</tbody></table></div>}</section>`
- `src/components/guarantee-executive-dashboard.tsx:65` — `function RankedBars({ rows, preview }: { rows: Array<{ key: string; label: string; count: number; amount: number; contributorIds?: string[] }>; preview: boolean }) {`
- `src/components/guarantee-executive-dashboard.tsx:67` — `return rows.length ? <ul className="gr-ranked-bars">{rows.map((row) => <li key={row.key}><div><strong>{row.label}</strong><span>{row.count} รายการ · {row.contributorIds?.length ? row.contributorIds.map((id) => !preview && <Link key={id} href={&#96;/guarantees/${id}&#96;}>#{id.slice(0, 8)}</Link>) : "ไม่มีรหัสรายการ"}</span></div><div className="gr-track" aria-hidden="true"><span style={{ width: &#96;${row.amount / max * 100}%&#96; }}/></div><b>{money(row.amount)}</b></li>)}</ul> : <p className="gr-empty">ไม่มียอดคงค้างในขอบเขตนี้</p>;`

## A-107 — `src/components/login-form.tsx`

- `src/components/login-form.tsx:23` — `{next && <input type="hidden" name="next" value={next} />}`
- `src/components/login-form.tsx:24` — `{state.error && !pending && <div className="auth-error" role="alert"><span aria-hidden="true">!</span> {state.error}</div>}`
- `src/components/login-form.tsx:25` — `<div className="auth-field"><label htmlFor="login-email">{copy.auth.email}</label><input id="login-email" ref={emailRef} name="email" type="email" autoComplete="email" placeholder={copy.auth.emailPlaceholder} defaultValue={state.email \|\| ""} aria-invalid={Boolean(errors.email)} aria-describedby="login-email-error" required autoFocus/><span id="login-email-error" className="auth-field-hint" aria-live="polite">{errors.email && &#96;! ${errors.email}&#96;}</span></div>`
- `src/components/login-form.tsx:28` — `{pending && <span className="auth-spinner" aria-hidden="true"/>}{pending ? copy.auth.pending : copy.auth.login}`
- `src/components/login-form.tsx:29` — `{!pending && <span aria-hidden="true">→</span>}`

## A-108 — `src/components/module-nav.tsx`

- `src/components/module-nav.tsx:9` — `export type WorkNavItem = { href: string; label: string; icon: "work" \| "team" \| "filter" \| "search" \| "check" \| "info" \| "refresh" };`
- `src/components/module-nav.tsx:10` — `type CollapsibleModuleId = "work" \| "guarantees" \| "duct-rental" \| "buildings" \| "car-booking";`
- `src/components/module-nav.tsx:11` — `type SectionSnapshot = { open: CollapsibleModuleId \| null; pathname: string };`
- `src/components/module-nav.tsx:12` — `type NavChildItem = { href: string; label: string; icon: string; activeMatch?: "exact" \| "prefix" \| "query" };`
- `src/components/module-nav.tsx:41` — `if (open !== null && (typeof open !== "string" \|\| !isCollapsibleModule(open))) return undefined;`
- `src/components/module-nav.tsx:117` — `const installationTeamView = pathname.startsWith("/guarantees") && params.get("view") === "installation-team";`
- `src/components/module-nav.tsx:120` — `.filter(child => (child.url.pathname === pathname \|\| (child.url.pathname !== "/work" && pathname.startsWith(&#96;${child.url.pathname}/&#96;))) && Array.from(child.url.searchParams).every(([key, value]) => params.get(key) === value))`
- `src/components/module-nav.tsx:138` — `const expanded = isCollapsibleModule(item.id) ? !collapsed && expandedSection === item.id : false;`
- `src/components/module-nav.tsx:140` — `const parentCurrent = active && (!expanded \|\| !currentChildHref);`
- `src/components/module-nav.tsx:141` — `const sectionId = hasChildren && isCollapsibleModule(item.id) ? &#96;${idPrefix}-${item.id}&#96; : undefined;`
- `src/components/module-nav.tsx:143` — `const parentControl = sectionId && !collapsed ? <button`
- `src/components/module-nav.tsx:163` — `{!collapsed && items[index - 1]?.group !== item.group && <span className="sidebar-group-label">{groupLabels[item.group]}</span>}`
- `src/components/module-nav.tsx:165` — `{hasChildren && sectionId && <div className={&#96;sidebar-subnav-panel ${expanded ? "is-open" : ""}&#96;} id={sectionId} aria-hidden={!expanded} inert={!expanded}>`
- `src/components/module-nav.tsx:167` — `{item.id === "work" && workNavigation.map((child) => {`
- `src/components/module-nav.tsx:171` — `{item.id !== "work" && navItems?.map((child) => {`
- `src/components/module-nav.tsx:179` — `{canAdmin && <Link className={&#96;sidebar-link ${(pathname === "/admin" \|\| pathname.startsWith("/admin/")) ? "active" : ""}&#96;} href="/admin" aria-current={(pathname === "/admin" \|\| pathname.startsWith("/admin/")) ? "page" : undefined} aria-label={collapsed ? "ผู้ดูแลระบบ" : undefined} title={collapsed ? "ผู้ดูแลระบบ" : undefined} onClick={onNavigate}><WorkspaceIcon name="settings" size={21}/><span className="sidebar-link-label">ผู้ดูแลระบบ</span></Link>}`

## A-109 — `src/components/native-module-foundation.tsx`

- `src/components/native-module-foundation.tsx:11` — `const moduleCopy: Record<string, { title: string; description: string }> = {`
- `src/components/native-module-foundation.tsx:12` — `work: { title: "งานและกิจกรรม", description: "ติดตามงานของคุณ ตรวจสอบกำหนด และประสานงานกับทีม" },`
- `src/components/native-module-foundation.tsx:13` — `buildings: { title: "อาคารและค่าใช้จ่าย", description: "ค้นหาอาคารและติดตามรายการเกี่ยวกับค่าใช้จ่าย เงื่อนไขราคา และเอกสาร" },`
- `src/components/native-module-foundation.tsx:14` — `guarantees: { title: "ติดตามเงินประกัน", description: "ติดตามเอกสาร ผู้รับผิดชอบ และขั้นตอนการขอคืนเงินประกันอาคาร" },`
- `src/components/native-module-foundation.tsx:20` — `const copy = moduleCopy[moduleId] ?? { title: getModule(moduleId)!.name, description: getModule(moduleId)!.description };`
- `src/components/native-module-foundation.tsx:25` — `<PageHeader title={copy.title} description={copy.description} parent={{ label: "ภาพรวม", href: "/" }} actions={<><RefreshButton/><span className="updated-at">{ready ? &#96;ข้อมูล ณ ${formatWorkspaceDate(snapshot.generatedAt, true)}&#96; : "อยู่ระหว่างเตรียมข้อมูล"}</span></>}/>`

## A-110 — `src/components/notification-center.tsx`

- `src/components/notification-center.tsx:18` — `{inbox.unread > 0 && <span className="notification-count">{inbox.unread > 99 ? "99+" : inbox.unread}</span>}`
- `src/components/notification-center.tsx:24` — `{inbox.canUpdate && inbox.unread > 0 && <form action={action}><input type="hidden" name="id" value="all"/><button className="secondary-action" disabled={pending}>อ่านทั้งหมด</button></form>}`
- `src/components/notification-center.tsx:25` — `{!inbox.items.length && <p>ยังไม่มีการแจ้งเตือน</p>}`
- `src/components/notification-center.tsx:28` — `{["high", "urgent"].includes(item.priority) && <StatusBadge label="ต้องให้ความสนใจ" tone="warning"/>}`
- `src/components/notification-center.tsx:30` — `{item.body && <TruncatedText text={item.body} lines={3}/>}<time dateTime={item.createdAt}>{new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(item.createdAt))}</time>`
- `src/components/notification-center.tsx:31` — `{!item.readAt && inbox.canUpdate && <form action={action}><input type="hidden" name="id" value={item.id}/><button className="text-btn" disabled={pending}>ทำเครื่องหมายว่าอ่านแล้ว</button></form>}`

## A-111 — `src/components/ui/animated-number.tsx`

- `src/components/ui/animated-number.tsx:2` — `type AnimatedNumberProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {`

## A-112 — `src/components/ui/button.tsx`

- `src/components/ui/button.tsx:4` — `export type ButtonVariant = "primary" \| "secondary" \| "danger" \| "ghost";`
- `src/components/ui/button.tsx:10` — `export function Button({ variant = "secondary", className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {`

## A-113 — `src/components/ui/empty-state.tsx`

- `src/components/ui/empty-state.tsx:1` — `export function EmptyState({ title, description, action, badge, error = false, className }: { title: string; description: string; action?: React.ReactNode; badge?: React.ReactNode; error?: boolean; className?: string }) {`

## A-114 — `src/components/ui/error-state.tsx`

- `src/components/ui/error-state.tsx:6` — `return <section className="queue-empty error-state" role="alert"><Heading>{copy.feedback.errorTitle}</Heading><p>{copy.feedback.errorDescription}</p>{digest && <p>{copy.feedback.reference}: <code>{digest}</code></p>}<div className="error-state-actions"><button type="button" className="primary" onClick={reset}>{copy.feedback.retry}</button><Link className="secondary-action" href="/">{copy.feedback.home}</Link></div></section>;`

## A-115 — `src/components/ui/form.tsx`

- `src/components/ui/form.tsx:7` — `export function FormField({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {`
- `src/components/ui/form.tsx:8` — `return <label className={["ui-field", className].filter(Boolean).join(" ")}><span className="ui-field-label">{label}</span>{children}{hint && <small className="ui-field-hint">{hint}</small>}</label>;`

## A-116 — `src/components/ui/metric-grid.tsx`

- `src/components/ui/metric-grid.tsx:3` — `export type MetricItem = {`
- `src/components/ui/metric-grid.tsx:4` — `label: string;`
- `src/components/ui/metric-grid.tsx:17` — `export function MetricGrid({ label, metrics, className }: { label: string; metrics: MetricItem[]; className?: string }) {`
- `src/components/ui/metric-grid.tsx:22` — `const metricClass = [base, metric.variant && &#96;ui-metric--${metric.variant}&#96;, interactive && metric.pressed && "is-active"].filter(Boolean).join(" ");`
- `src/components/ui/metric-grid.tsx:32` — `{metric.detail && <small>{metric.detail}</small>}`

## A-117 — `src/components/ui/page-header.tsx`

- `src/components/ui/page-header.tsx:5` — `title: string; description?: string; eyebrow?: string; parent?: { label: string; href: string }; actions?: React.ReactNode; className?: string; rowClassName?: string;`
- `src/components/ui/page-header.tsx:11` — `{parent && (`
- `src/components/ui/page-header.tsx:18` — `{eyebrow && <p className="eyebrow text-sm font-bold text-[var(--color-brand)]">{eyebrow}</p>}`
- `src/components/ui/page-header.tsx:20` — `{description && <TruncatedText className="text-sm leading-6 text-[var(--color-text-muted)]" text={description} lines={2}/>}`
- `src/components/ui/page-header.tsx:22` — `{actions && <div className="page-heading-actions ml-auto flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}`

## A-119 — `src/components/ui/panel.tsx`

- `src/components/ui/panel.tsx:7` — `{(title \|\| description \|\| actions) && <header className="ui-panel-header"><div>{title && <h2 id={id}>{title}</h2>}{description && <p>{description}</p>}</div>{actions && <div className="ui-panel-actions">{actions}</div>}</header>}`

## A-120 — `src/components/ui/status-badge.tsx`

- `src/components/ui/status-badge.tsx:3` — `export type StatusTone = "neutral" \| "info" \| "success" \| "warning" \| "danger";`
- `src/components/ui/status-badge.tsx:7` — `export function StatusBadge({ label, tone = "neutral", description }: { label: string; tone?: StatusTone; description?: string }) {`
- `src/components/ui/status-badge.tsx:8` — `return <span className={&#96;ui-status ui-status-${tone}&#96;} title={description}><span aria-hidden="true">{statusIcons[tone]}</span>{tone === "success" && <WorkspaceIcon name="check" size={16} className="ui-status-mark"/>}{label}</span>;`

## A-121 — `src/components/ui/table-region.tsx`

- `src/components/ui/table-region.tsx:1` — `export function TableRegion({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {`

## A-122 — `src/components/ui/truncated-text.tsx`

- `src/components/ui/truncated-text.tsx:5` — `export type TruncatedTextLines = 1 \| 2 \| 3;`
- `src/components/ui/truncated-text.tsx:11` — `type TruncatedTextProps = Omit<HTMLAttributes<HTMLSpanElement>, "children" \| "title"> & {`
- `src/components/ui/truncated-text.tsx:47` — `{isTruncated && <span id={tooltipId} className="truncated-text-tooltip" role="tooltip" hidden={!showTooltip}>{text}</span>}`

## A-123 — `src/components/work-create-form.tsx`

- `src/components/work-create-form.tsx:13` — `const teams=model.assignmentOptions.filter(p=>p.id===userId&&p.teamId);`
- `src/components/work-create-form.tsx:15` — `return <form ref={formRef} className="work-panel work-assignment-form" action={action} aria-busy={pending}><h2>เพิ่มงานของฉัน</h2><input type="hidden" name="idempotencyKey" value={model.creationKey}/><input type="hidden" name="assigneeId" value={userId}/><fieldset disabled={pending\|\|previewPending} className="work-form-grid"><label>ทีม<select name="teamId" value={teamId} onChange={e=>setTeamId(e.target.value)} required><option value="">เลือกทีม</option>{teams.map(p=><option key={p.teamId} value={p.teamId!}>{p.teamName}</option>)}</select></label><TaskKpiFields key={teamId+model.creationKey} rules={model.kpiOptions.filter(r=>r.teamId===teamId)}/><label className="work-form-span-2">Job / รายละเอียดงาน (หนึ่งรายการต่อบรรทัด สูงสุด 20)<textarea name="jobs" required maxLength={4000} rows={6}/></label><label>หมายเหตุ<textarea name="notes" maxLength={4000}/></label></fieldset><button className="secondary-action" type="button" onClick={event=>{const form=event.currentTarget.form;if(form)startTransition(()=>previewAction(new FormData(form)));}} disabled={pending\|\|previewPending}>ดู deadline ล่วงหน้า</button><p role="status">{preview.message}</p><button className="primary" disabled={pending\|\|previewPending}>{pending?"กำลังเพิ่มงาน…":"เพิ่มงาน"}</button><p role="status">{state.message}</p></form>;`

## A-124 — `src/components/work-live-refresh.tsx`

- `src/components/work-live-refresh.tsx:18` — `if (!pending && completion.current) {`
- `src/components/work-live-refresh.tsx:29` — `return !transitionPending.current && document.visibilityState === "visible" && navigator.onLine && !dirty.size && !document.querySelector('dialog[open], [aria-modal="true"], [data-live-refresh-pause], form[aria-busy="true"]');`

## A-125 — `src/components/work-route-page.tsx`

- `src/components/work-route-page.tsx:18` — `return <WorkScreenShell title="กิจกรรมงาน" description="ติดตามการสร้าง มอบหมาย เปลี่ยนสถานะ และบันทึกงานในขอบเขตสิทธิ์" parent={{ label: "งานของฉัน", href: "/work" }} appearance="workspace">{model.activities.length ? <section className="work-panel"><ol className="work-activity-list work-activity-list-expanded">{model.activities.map((event) => <li key={event.id}><span className="work-activity-dot" aria-hidden="true"/><div><strong><TruncatedText text={event.eventLabel} lines={1}/></strong><span><TruncatedText text={event.ownerName} lines={1}/> · รายการ {event.entityId}</span><time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</time></div></li>)}</ol></section> : <WorkEmpty title="ยังไม่มีกิจกรรมงาน" detail="กิจกรรมที่อยู่ในขอบเขตสิทธิ์ของคุณจะแสดงที่นี่เมื่อมีการเปลี่ยนแปลง" />}</WorkScreenShell>;`
- `src/components/work-route-page.tsx:23` — `const tasks = model.tasks.filter((task) => task.ownerId === userId && task.dueAt && Date.parse(task.dueAt) <= now + 86_400_000 && !["completed", "cancelled"].includes(task.status));`
- `src/components/work-route-page.tsx:24` — `return <WorkScreenShell title="งานที่ควรเร่ง" description="รวมงานของฉันที่ครบกำหนดวันนี้หรือเกินกำหนด" parent={{ label: "งานของฉัน", href: "/work" }} appearance="workspace">{tasks.length ? <section className="work-panel"><WorkTaskListForDue tasks={tasks}/></section> : <WorkEmpty title="ยังไม่มีงานที่ต้องเร่ง" detail="งานที่ครบกำหนดวันนี้หรือเกินกำหนดจะแสดงที่นี่" />}</WorkScreenShell>;`
- `src/components/work-route-page.tsx:40` — `if (["assign", "team"].includes(currentView) && !hasPermission("work.task.manage")) return <AccessDenied moduleName="งานและ KPI" />;`
- `src/components/work-route-page.tsx:41` — `if (currentView === "people" && !hasPermission("work.task.manage") && !hasPermission("kpi.team.read")) return <AccessDenied moduleName="งานและ KPI" />;`
- `src/components/work-route-page.tsx:42` — `if (currentView === "kpi" && !hasPermission("kpi.score.read")) return <AccessDenied moduleName="งานและ KPI" />;`
- `src/components/work-route-page.tsx:43` — `if (currentView === "reports" && !hasPermission("work.report.read")) return <AccessDenied moduleName="งานและ KPI" />;`
- `src/components/work-route-page.tsx:44` — `if (currentView === "activity" && !hasPermission("activity.event.read")) return <AccessDenied moduleName="งานและ KPI" />;`
- `src/components/work-route-page.tsx:46` — `case "mine": return <MyWorkDashboard model={model} subject={access.subject} userId={access.userId} detailId={recordId} canCreate={canCreate} />;`
- `src/components/work-route-page.tsx:47` — `case "mine-list": return <MyTasksScreen model={model} subject={access.subject} userId={access.userId} canCreate={canCreate} />;`
- `src/components/work-route-page.tsx:48` — `case "team": return <TeamCommandScreen model={model} subject={access.subject} />;`
- `src/components/work-route-page.tsx:49` — `case "assign": return <AssignmentCenterScreen model={model} />;`
- `src/components/work-route-page.tsx:50` — `case "people": return <PeopleOverviewScreen model={model} subject={access.subject} />;`
- `src/components/work-route-page.tsx:51` — `case "tracker": return <JobTrackerScreen model={model} subject={access.subject} ownerId={ownerId} />;`
- `src/components/work-route-page.tsx:52` — `case "kpi": return <KpiWorkspaceScreen model={model} />;`
- `src/components/work-route-page.tsx:53` — `case "reports": return <WorkReportsScreen model={model} />;`
- `src/components/work-route-page.tsx:54` — `case "activity": return <ActivityScreen model={model} />;`
- `src/components/work-route-page.tsx:55` — `case "due": return <DueScreen model={model} userId={access.userId} />;`

## A-126 — `src/components/work-workspace.tsx`

- `src/components/work-workspace.tsx:4` — `type LegacyWorkWorkspaceProps = {`

## A-128 — `src/components/workspace-icon.tsx`

- `src/components/workspace-icon.tsx:6` — `type Props = {`
- `src/components/workspace-icon.tsx:7` — `name: IconName;`
- `src/components/workspace-icon.tsx:50` — `export function workspaceIconMarkup(name: IconName, size = 20, strokeWidth = 1.75): string {`

## A-129 — `src/components/workspace-queue.tsx`

- `src/components/workspace-queue.tsx:37` — `<h2 id="detail-title"><TruncatedText text={item.moduleId === "buildings" && item.buildingName ? item.buildingName : item.title} lines={2}/></h2>`
- `src/components/workspace-queue.tsx:39` — `{preview && <p className="preview-caption">ข้อมูลตัวอย่าง · ไม่มีผลต่อข้อมูลจริง</p>}`
- `src/components/workspace-queue.tsx:45` — `{item.updatedAt && <div><dt>แก้ไขล่าสุด</dt><dd>{formatWorkspaceDate(item.updatedAt, true)}</dd></div>}`
- `src/components/workspace-queue.tsx:50` — `{!preview && item.href !== moduleInfo.href && <Link className="primary" href={item.href} onClick={onClose}>{copy.feedback.openRecord}<WorkspaceIcon name="arrow" size={18}/></Link>}`
- `src/components/workspace-queue.tsx:59` — `type SavedView = { id: string; name: string; settings: ViewSettings };`
- `src/components/workspace-queue.tsx:69` — `setViews(Array.isArray(raw) ? raw.filter((item): item is SavedView => Boolean(item && typeof item.id === "string" && typeof item.name === "string" && item.settings && typeof item.settings.query === "string" && typeof item.settings.status === "string" && ["all", "mine", "urgent", "today"].includes(item.settings.view) && ["priority", "due", "title"].includes(item.settings.sort))).slice(0, 8) : []);`
- `src/components/workspace-queue.tsx:76` — `return <details className="saved-views" ref={ref} onToggle={(event) => { if (event.currentTarget.open) loadViews(); }} onKeyDown={(event) => { if (event.key === "Escape" && ref.current) { ref.current.open = false; ref.current.querySelector("summary")?.focus(); } }}>`
- `src/components/workspace-queue.tsx:81` — `<form onSubmit={(event) => { event.preventDefault(); if (!name.trim() \|\| views.length >= 8) return; if (save([...views, { id: crypto.randomUUID(), name: name.trim(), settings }], "บันทึกมุมมองแล้ว")) setName(""); }}>`
- `src/components/workspace-queue.tsx:83` — `<button className="primary" type="submit" disabled={views.length >= 8}>บันทึกมุมมองปัจจุบัน</button>{views.length >= 8 && <p>บันทึกได้สูงสุด 8 มุมมอง</p>}`
- `src/components/workspace-queue.tsx:105` — `const partial = hasData && sources.some((source) => source.status !== "ready");`
- `src/components/workspace-queue.tsx:110` — `const page = Math.min(pageCount, Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1);`
- `src/components/workspace-queue.tsx:115` — `const activeRecord = items.find((item) => item.id === params.get("record") && (!params.get("module") \|\| item.moduleId === params.get("module")));`
- `src/components/workspace-queue.tsx:119` — `useEffect(() => { if (selectAllRef.current) selectAllRef.current.indeterminate = selected.length > 0 && selected.length < visible.length; }, [selected.length, visible.length]);`
- `src/components/workspace-queue.tsx:139` — `{showMetrics && <section className="ui-metric-grid work-metric-strip" aria-label="เลือกกลุ่มงานที่ต้องติดตาม">{(Object.keys(viewLabels) as QueueView[]).map((view) => <button type="button" key={view} className={&#96;ui-metric ${view === "urgent" ? "ui-metric-danger" : view === "today" ? "ui-metric-warning" : view === "mine" ? "ui-metric-info" : ""} ${settings.view === view ? "is-active" : ""}&#96;} aria-pressed={settings.view === view} onClick={() => changeSettings({ view })}>`
- `src/components/workspace-queue.tsx:144` — `{!showMetrics && <div className="queue-views" aria-label="มุมมองรายการ">{(Object.keys(viewLabels) as QueueView[]).map((view) => <button type="button" key={view} className={settings.view === view ? "active" : ""} aria-pressed={settings.view === view} onClick={() => changeSettings({ view })}>{viewLabels[view]}<span>{hasData ? counts[view] : "—"}</span></button>)}</div>}`
- `src/components/workspace-queue.tsx:147` — `<button type="button" className={&#96;secondary-action ${filtersOpen ? "is-active" : ""}&#96;} aria-expanded={filtersOpen} aria-controls="queue-filters" onClick={() => setFiltersOpen(!filtersOpen)}><WorkspaceIcon name="filter" size={18}/>ตัวกรอง{settings.status && <span className="filter-count">1</span>}</button>`
- `src/components/workspace-queue.tsx:150` — `{filtersOpen && <div className="queue-filters" id="queue-filters"><label>สถานะ<select value={settings.status} onChange={(event) => changeSettings({ status: event.target.value })}><option value="">ทุกสถานะ</option>{statuses.map((status) => <option key={status}>{status}</option>)}{settings.status && !statuses.includes(settings.status) && <option>{settings.status}</option>}</select></label><label>เรียงตาม<select value={settings.sort} onChange={(event) => changeSettings({ sort: event.target.value as ViewSettings["sort"] })}><option value="priority">ความเร่งด่วน</option><option value="due">กำหนดใกล้ที่สุด</option><option value="title">ชื่อรายการ ก–ฮ</option></select></label><button type="button" className="text-btn" onClick={() => changeSettings({ query: "", status: "", sort: "priority", view: "all" })}>ล้างตัวกรองทั้งหมด</button></div>}`
- `src/components/workspace-queue.tsx:151` — `{partial && <div className="queue-notice" role="status"><WorkspaceIcon name="info" size={18}/>แสดงข้อมูลบางส่วน บางระบบยังเชื่อมต่อไม่ได้ ดูสถานะข้อมูลด้านล่าง</div>}`
- `src/components/workspace-queue.tsx:152` — `{sources.some((source) => source.itemCount >= 500) && <p className="queue-notice">{copy.feedback.queueLimit}</p>}`
- `src/components/workspace-queue.tsx:153` — `{selected.length > 0 && <div className="batch-toolbar"><strong>เลือก {selected.length} รายการในหน้านี้</strong><button type="button" className="secondary-action" onClick={async () => {`
- `src/components/workspace-queue.tsx:160` — `<th className="selection-cell"><input type="checkbox" ref={selectAllRef} aria-label="เลือกทุกรายการในหน้านี้" checked={visible.length > 0 && selected.length === visible.length} disabled={!visible.length} onChange={(event) => { setSelection(event.target.checked ? new Set(visible.map(recordKey)) : new Set()); setSelectionScope(scope); }}/></th>`
- `src/components/workspace-queue.tsx:161` — `<th scope="col" aria-sort={settings.sort === "title" ? "ascending" : "none"}><button type="button" onClick={() => changeSettings({ sort: "title" })}>{moduleId === "buildings" ? "อาคาร / รายการติดตาม" : "รายการ / อาคาร"}{settings.sort === "title" && " ↑"}</button></th>`
- `src/components/workspace-queue.tsx:162` — `<th scope="col">ผู้รับผิดชอบ</th><th scope="col" aria-sort={settings.sort === "due" ? "ascending" : "none"}><button type="button" onClick={() => changeSettings({ sort: "due" })}>กำหนด{settings.sort === "due" && " ↑"}</button></th><th scope="col">สถานะ</th>`
- `src/components/workspace-queue.tsx:166` — `<td className="record-cell"><button className="record-title" type="button" onClick={event => { openerRef.current=event.currentTarget; update({ record: item.id, module: item.moduleId }, true); }}><TruncatedText text={moduleId === "buildings" && item.buildingName ? item.buildingName : item.title} lines={1}/><WorkspaceIcon name="arrow" size={16}/></button><div className="record-subtitle"><span className="record-code">{item.code \|\| kindLabels[item.kind]}</span><TruncatedText text={moduleId === "buildings" ? item.title : item.buildingName \|\| getModule(item.moduleId)?.name \|\| ""} lines={1}/>{!moduleId && <TruncatedText className="record-source" text={getModule(item.moduleId)?.name \|\| ""} lines={1}/>}</div></td>`
- `src/components/workspace-queue.tsx:171` — `{!visible.length && <tr><td colSpan={5}><div className="queue-empty"><span className="empty-icon"><WorkspaceIcon name={hasData ? "search" : unavailable ? "refresh" : (getModule(moduleId ?? "")?.icon ?? "work")} size={28}/></span><h3>{hasData ? items.length ? "ไม่พบรายการที่ตรงกับตัวกรอง" : "ไม่มีรายการที่ต้องติดตาม" : unavailable ? "เชื่อมต่อข้อมูลไม่สำเร็จ" : "อยู่ระหว่างเตรียมข้อมูล"}</h3><p>{hasData ? items.length ? "ลองเปลี่ยนคำค้นหรือเลือกมุมมองทั้งหมด" : copy.feedback.queueEmpty : unavailable ? "ข้อมูลอาจไม่พร้อมใช้งานชั่วคราว ลองอัปเดตอีกครั้ง" : copy.feedback.queuePreparingHint}</p>{hasData && items.length > 0 ? <button className="secondary-action" type="button" onClick={() => changeSettings({ query: "", status: "", view: "all" })}>แสดงรายการทั้งหมด</button> : unavailable ? <RefreshButton/> : null}</div></td></tr>}`
- `src/components/workspace-queue.tsx:176` — `{activeRecord && <DetailPanel key={recordKey(activeRecord)} item={activeRecord} preview={preview} opener={openerRef} onClose={() => update({ record: null, module: null })}/>}`
- `src/components/workspace-queue.tsx:177` — `{params.get("record") && !activeRecord && <div className="queue-notice" role="status">รายการนี้ไม่อยู่ในข้อมูลติดตามที่เข้าถึงได้ในขณะนี้<button type="button" className="text-btn" onClick={() => update({ record: null, module: null })}>ปิดข้อความ</button></div>}`

## A-130 — `src/components/workspace-search.tsx`

- `src/components/workspace-search.tsx:9` — `type SearchResult = { id: string; title: string; description: string; href: string; moduleId?: ModuleId };`
- `src/components/workspace-search.tsx:10` — `type SearchResponse = { results: SearchResult[]; ready: boolean; partial: boolean };`
- `src/components/workspace-search.tsx:28` — `.map((item): SearchResult => ({ id: item.id, title: item.name, description: "เปิดพื้นที่ทำงาน", href: &#96;${item.href}${preview ? "?preview=1" : ""}&#96; })), [allowedModuleIds, needle, preview]);`
- `src/components/workspace-search.tsx:48` — `if (((event.ctrlKey \|\| event.metaKey) && event.key.toLowerCase() === "k") \|\| (event.key === "/" && !editing)) {`
- `src/components/workspace-search.tsx:57` — `const data = needle.length >= 2 && remote.query === needle ? remote.data : undefined;`
- `src/components/workspace-search.tsx:58` — `const error = needle.length >= 2 && remote.query === needle && remote.error;`
- `src/components/workspace-search.tsx:61` — `const loading = needle.length >= 2 && !data && !error;`
- `src/components/workspace-search.tsx:66` — `<input ref={inputRef} id="workspace-search-input" value={query} maxLength={200} placeholder="ค้นหาเมนูและรายการติดตาม…" aria-label="ค้นหาเมนูและรายการติดตาม" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={open ? listboxId : undefined} aria-activedescendant={open && results[active] ? &#96;${listboxId}-${active}&#96; : undefined} autoComplete="off"`
- `src/components/workspace-search.tsx:72` — `if (event.key === "Enter" && open && results[active]) { event.preventDefault(); goTo(results[active].href); }`
- `src/components/workspace-search.tsx:75` — `{open && <div className="workspace-search-popover">`
- `src/components/workspace-search.tsx:83` — `{loading ? "กำลังค้นหารายการ…" : error ? "ค้นหารายการไม่สำเร็จ" : needle.length === 1 ? "พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหารายการ" : data && !data.ready ? "ยังไม่ได้เชื่อมข้อมูลรายการ คุณยังค้นหาเมนูได้" : !results.length ? "ไม่พบข้อมูล ลองค้นหาด้วยชื่ออาคารหรือรหัสรายการ" : data?.partial ? "แสดงเฉพาะข้อมูลจากระบบที่เชื่อมต่อได้" : ""}`
- `src/components/workspace-search.tsx:85` — `{error && <button className="text-btn" type="button" onClick={() => { setRemote({ query: "" }); setRetry((value) => value + 1); }}>ลองค้นหาอีกครั้ง</button>}`

## A-131 — `src/components/workspace-theme-toggle.tsx`

- `src/components/workspace-theme-toggle.tsx:7` — `type WorkspaceTheme = "light" \| "dark";`

## A-132 — `src/features/buildings/building-editor-form.tsx`

- `src/features/buildings/building-editor-form.tsx:13` — `type OtherFee = { key: string; label: string; calculationType: "fixed" \| "revenue_share"; value: string; revenuePeriod: "monthly" \| "annual"; note: string };`
- `src/features/buildings/building-editor-form.tsx:14` — `export type BuildingEditorInitial = { code: string; nameTh: string; nameEn: string; ownerTeamId: string; version: number;`
- `src/features/buildings/building-editor-form.tsx:16` — `type Field = { key: string; label: string; options?: readonly (readonly [string, string])[]; inputMode?: "decimal" \| "numeric" \| "email"; multiline?: boolean };`
- `src/features/buildings/building-editor-form.tsx:18` — `{ key: "status", label: c.status, options: [["Permission Confirmed", "ยืนยันการอนุญาตแล้ว"], ["MOU", "บันทึกข้อตกลง"], ["Check Permission", "ตรวจสอบการอนุญาต"], ["อาคารปิดถาวร", "อาคารปิดถาวร"]] },`
- `src/features/buildings/building-editor-form.tsx:19` — `{ key: "group", label: c.group, options: [["Priority 1", "ลำดับสำคัญ 1"], ["Priority 2", "ลำดับสำคัญ 2"], ["X", "กลุ่มทั่วไป"]] },`
- `src/features/buildings/building-editor-form.tsx:20` — `{ key: "type", label: c.type, options: [["L1", "ระดับ 1"], ["L2", "ระดับ 2"], ["L3", "ระดับ 3"]] },`
- `src/features/buildings/building-editor-form.tsx:21` — `{ key: "install_type", label: c.installType, options: [["Building", "อาคาร"], ["Shopping Mall", "ศูนย์การค้า"], ["Nikom", "นิคมอุตสาหกรรม"], ["Data center", "ศูนย์ข้อมูล"], ["Airport", "สนามบิน"], ["Port", "ท่าเรือ"], ["Market", "ตลาด"]] },`
- `src/features/buildings/building-editor-form.tsx:22` — `{ key: "area", label: c.area }, { key: "province", label: c.province },`
- `src/features/buildings/building-editor-form.tsx:25` — `{ key: "survey_type", label: c.surveyType, options: [["Auto", "ดำเนินการได้เลย"], ["Need Survey", "ต้องสำรวจ"], ["Need Mark", "ต้องกำหนดจุด"], ["Wait Check", "รอตรวจสอบ"]] },`
- `src/features/buildings/building-editor-form.tsx:26` — `{ key: "duration", label: c.duration, inputMode: "numeric" }, { key: "location", label: c.location },`
- `src/features/buildings/building-editor-form.tsx:27` — `{ key: "wm_point", label: c.wmPoint }, { key: "enclosure", label: c.enclosure, options: [["No", c.no], ["Yes", c.yes]] },`
- `src/features/buildings/building-editor-form.tsx:28` — `{ key: "max_horizontal", label: c.maxHorizontal, inputMode: "decimal" }, { key: "lat", label: c.lat, inputMode: "decimal" }, { key: "lng", label: c.lng, inputMode: "decimal" },`
- `src/features/buildings/building-editor-form.tsx:30` — `const contacts: Field[] = [ { key: "address", label: c.address }, { key: "contact", label: c.contactName }, { key: "phone", label: c.phone }, { key: "mobile", label: c.mobile }, { key: "email", label: c.email, inputMode: "email" }, { key: "remark", label: c.remark, multiline: true } ];`
- `src/features/buildings/building-editor-form.tsx:35` — `apiKey: string; teams: { id: string; name: string }[]; canCreateWithoutTeam: boolean }) {`
- `src/features/buildings/building-editor-form.tsx:48` — `useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty && !busy) { event.preventDefault(); } }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirty, busy]);`
- `src/features/buildings/building-editor-form.tsx:52` — `const props = { name: field.key, value, onChange: (event: React.ChangeEvent<HTMLInputElement \| HTMLSelectElement \| HTMLTextAreaElement>) => changeField(field.key, event.target.value), "aria-invalid": invalid.includes(field.key), "aria-describedby": invalid.includes(field.key) ? "building-editor-error" : undefined };`
- `src/features/buildings/building-editor-form.tsx:53` — `return <label key={field.key}>{field.label}{field.options ? <select {...props}><option value="">{c.blank}</option>{value && !field.options.some(([key]) => key === value) && <option value={value}>{value} · {c.legacyOption}</option>}{field.options.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select> : field.multiline ? <textarea {...props} rows={4}/> : <input {...props} inputMode={field.inputMode} maxLength={field.key === "address" ? 1000 : 240}/>}</label>;`
- `src/features/buildings/building-editor-form.tsx:79` — `{error && <div id="building-editor-error" className="building-editor-error" role="alert">{error}{conflict && <button type="button" onClick={() => { if (!dirty \|\| window.confirm(c.leave)) window.location.reload(); }}>{c.reload}</button>}</div>}`
- `src/features/buildings/building-editor-form.tsx:81` — `{([ ["code", c.code], ["nameTh", c.nameTh], ["nameEn", c.nameEn] ] as const).map(([key, label]) => <label key={key}>{label}<input name={key} value={identity[key]} required={key === "nameTh"} maxLength={key === "code" ? 40 : 240} onChange={event => { setDirty(true); setIdentity(old => ({ ...old, [key]: event.target.value })); }} aria-invalid={invalid.includes(key)} aria-describedby={invalid.includes(key) ? "building-editor-error" : key === "code" ? "building-code-hint" : undefined}/>{key === "code" && <small id="building-code-hint">{c.codeHint}</small>}</label>)}`
- `src/features/buildings/building-editor-form.tsx:82` — `<label>{c.team}<select name="ownerTeamId" value={identity.ownerTeamId} disabled={Boolean(id)} onChange={event => { setDirty(true); setIdentity(old => ({ ...old, ownerTeamId: event.target.value })); }}><option value="" disabled={!canCreateWithoutTeam && !id}>{c.noTeam}</option>{identity.ownerTeamId && !teams.some(team => team.id === identity.ownerTeamId) && <option value={identity.ownerTeamId}>{c.team}</option>}{teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>`
- `src/features/buildings/building-editor-form.tsx:90` — `<label>{c.feeName}<input name={&#96;otherFeeLabel${index}&#96;} value={fee.label} maxLength={240} onChange={event => updateOther(index, { label: event.target.value })}/></label>`
- `src/features/buildings/building-editor-form.tsx:91` — `<label>{c.feeCalculation}<select value={fee.calculationType} onChange={event => updateOther(index, { calculationType: event.target.value as OtherFee["calculationType"] })}><option value="fixed">{c.fixed}</option><option value="revenue_share">{c.revenueShare}</option></select></label>`
- `src/features/buildings/building-editor-form.tsx:93` — `{fee.calculationType === "revenue_share" && <label>{c.feePeriod}<select value={fee.revenuePeriod} onChange={event => updateOther(index, { revenuePeriod: event.target.value as OtherFee["revenuePeriod"] })}><option value="monthly">{c.monthly}</option><option value="annual">{c.annual}</option></select></label>}`
- `src/features/buildings/building-editor-form.tsx:95` — `</div>)}<button type="button" disabled={otherFees.length >= 50} onClick={() => { setDirty(true); setOtherFees(old => [...old, { key: &#96;other_fee_${crypto.randomUUID()}&#96;, label: "", calculationType: "fixed", value: "", revenuePeriod: "monthly", note: "" }]); }}>{c.addFee}</button></fieldset>`
- `src/features/buildings/building-editor-form.tsx:96` — `<fieldset className="building-editor-section"><legend>{c.contact}</legend><div className="building-editor-grid">{contacts.map(field)}</div>{id && <label>{c.reason}<textarea name="reason" value={reason} maxLength={500} rows={2} onChange={event => { setDirty(true); setReason(event.target.value); }}/></label>}</fieldset>`
- `src/features/buildings/building-editor-form.tsx:97` — `<div className="building-editor-actions"><span role="status">{busy ? c.savingHint : ""}</span><Link href={cancel} onClick={event => { if (dirty && !window.confirm(c.leave)) event.preventDefault(); }}>{c.cancel}</Link><button className="button" type="submit" disabled={busy}>{busy ? c.saving : c.save}</button></div>`

## A-133 — `src/features/buildings/delete-building.tsx`

- `src/features/buildings/delete-building.tsx:19` — `export function DeleteBuilding({ id, name, version }: { id: string; name: string; version: number }) {`
- `src/features/buildings/delete-building.tsx:52` — `{message && <p className="building-delete-error" role="alert">{message}</p>}`

## A-134 — `src/features/buildings/map/building-create-form.tsx`

- `src/features/buildings/map/building-create-form.tsx:5` — `export function BuildingCreateForm(props: { apiKey: string; teams: { id: string; name: string }[]; canCreateWithoutTeam: boolean }) {`

## A-135 — `src/features/buildings/map/location-picker.tsx`

- `src/features/buildings/map/location-picker.tsx:6` — `type Source = "gps" \| "manual_pin" \| "search";`
- `src/features/buildings/map/location-picker.tsx:7` — `export type BuildingLocationCandidate = { latitude: number; longitude: number; accuracy: number \| null; source: Source \| "import"; placeId: string \| null;`
- `src/features/buildings/map/location-picker.tsx:9` — `type Place = { id: string \| null; name: string; address: string; latitude: number; longitude: number };`
- `src/features/buildings/map/location-picker.tsx:20` — `const points: MapPoint[] = useMemo(() => candidate ? [{ id: "candidate", code: "", name: "ตำแหน่งที่เลือก", latitude: candidate.latitude, longitude: candidate.longitude }] : [], [candidate]);`
- `src/features/buildings/map/location-picker.tsx:32` — `if (!abort.signal.aborted) setCandidate((current) => current && current.latitude === candidate.latitude && current.longitude === candidate.longitude ? {`
- `src/features/buildings/map/location-picker.tsx:80` — `if (!buildingId && onConfirmCandidate) { onConfirmCandidate(candidate); setState("ยืนยันตำแหน่งสำหรับแบบฟอร์มแล้ว ตำแหน่งจะบันทึกพร้อมข้อมูลอาคาร"); return; }`
- `src/features/buildings/map/location-picker.tsx:94` — `{(searchState \|\| places.length > 0) && <div className="building-location-results" role="listbox" aria-label="ผลการค้นหาสถานที่">`
- `src/features/buildings/map/location-picker.tsx:96` — `{searchState && <p role="status">{searchState}</p>}`
- `src/features/buildings/map/location-picker.tsx:103` — `{state && <p className="building-location-message" role="status">{state}</p>}`
- `src/features/buildings/map/location-picker.tsx:104` — `{canUpdate && <div className="building-location-actions"><button type="button" className="secondary-action" disabled={!candidate \|\| saving} onClick={() => { setCandidate(null); setState("ล้างตำแหน่งที่เลือกแล้ว"); }}>ล้างตำแหน่งที่เลือก</button><button type="button" disabled={!candidate \|\| saving} onClick={save}>{saving ? "กำลังบันทึก…" : "ยืนยันและบันทึกตำแหน่ง"}</button></div>}`

## A-136 — `src/features/buildings/map/longdo-map-canvas.tsx`

- `src/features/buildings/map/longdo-map-canvas.tsx:8` — `export type MapPoint = { id: string; name: string; code: string; latitude: number; longitude: number; detail?: string; status?: string; weight?: number };`
- `src/features/buildings/map/longdo-map-canvas.tsx:9` — `type Props = { apiKey: string; points: MapPoint[]; selectedId?: string \| null; heatmap?: boolean; onSelect?: (id: string) => void;`
- `src/features/buildings/map/longdo-map-canvas.tsx:11` — `type Cluster = { latitude: number; longitude: number; points: MapPoint[] };`
- `src/features/buildings/map/longdo-map-canvas.tsx:37` — `type InitialMapFit = { kind: "point"; point: MapPoint } \| { kind: "bounds"; bounds: { minLon: number; minLat: number; maxLon: number; maxLat: number } };`
- `src/features/buildings/map/longdo-map-canvas.tsx:40` — `const validPoints = points.filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude) && (point.latitude !== 0 \|\| point.longitude !== 0));`
- `src/features/buildings/map/longdo-map-canvas.tsx:83` — `if (typeof location?.lat === "number" && typeof location.lon === "number") callbackRef.current.onPick?.(location.lat, location.lon);`
- `src/features/buildings/map/longdo-map-canvas.tsx:89` — `if (marker.buildingIds && marker.clusterLocation && map) {`
- `src/features/buildings/map/longdo-map-canvas.tsx:107` — `const marker = namespaceRef.current?.Marker && new namespaceRef.current.Marker({ lat: detail.lat, lon: detail.lon }, { title: "ตำแหน่งปัจจุบัน", detail: "ตำแหน่งนี้ใช้เฉพาะการดูแผนที่ในครั้งนี้" });`
- `src/features/buildings/map/longdo-map-canvas.tsx:180` — `if (heatmap && points.length > 1 && map.Renderer?.isStyleLoaded()) {`
- `src/features/buildings/map/longdo-map-canvas.tsx:232` — `{state === "ready" && <button type="button" className="building-longdo-fullscreen" onClick={toggleFullscreen} aria-label={fullscreen ? "ออกจากเต็มหน้าจอ" : "แสดงแผนที่เต็มหน้าจอ"}>{fullscreen ? "ย่อแผนที่" : "เต็มหน้าจอ"}</button>}`
- `src/features/buildings/map/longdo-map-canvas.tsx:233` — `{clusterCandidates.length > 1 && !heatmap && <section className="building-map-cluster-picker" aria-label="เลือกอาคารในกลุ่ม">`
- `src/features/buildings/map/longdo-map-canvas.tsx:237` — `{state !== "ready" && <div className="building-longdo-map-state" role="status">`
- `src/features/buildings/map/longdo-map-canvas.tsx:239` — `{state === "error" && onFallbackToList && <button type="button" onClick={onFallbackToList}>ดูรายการ</button>}`
- `src/features/buildings/map/longdo-map-canvas.tsx:241` — `{heatmap && points.length < 2 && <div className="building-longdo-map-hint" role="status">ต้องมีอาคารที่ระบุตำแหน่งอย่างน้อย 2 แห่ง จึงแสดงความหนาแน่นได้</div>}`

## A-137 — `src/features/buildings/map/map-workspace.tsx`

- `src/features/buildings/map/map-workspace.tsx:10` — `type Mode = "buildings" \| "status" \| "expense" \| "heatmap";`
- `src/features/buildings/map/map-workspace.tsx:11` — `type HeatMetric = "building_count" \| "fee_count" \| "amount";`
- `src/features/buildings/map/map-workspace.tsx:12` — `type MapFee = { source_field: string; cost_type: string; revenue_period: string \| null; payable: boolean; amount: number \| null };`
- `src/features/buildings/map/map-workspace.tsx:13` — `export type MapBuilding = { id: string; code: string; nameTh: string; nameEn: string \| null; status: string; area: string; province: string; subdistrict: string; district: string;`
- `src/features/buildings/map/map-workspace.tsx:38` — `const located = useMemo(() => buildings.filter((item) => item.lat !== null && item.lng !== null), [buildings]);`
- `src/features/buildings/map/map-workspace.tsx:43` — `return (!needle \|\| needle.split(/\s+/).every((part) => haystack.includes(part))) && (!province \|\| item.province === province) && (!status \|\| item.status === status) &&`
- `src/features/buildings/map/map-workspace.tsx:44` — `(item.lat !== null && item.lng !== null) && (!fromDate \|\| (item.conditionEffectiveAt && item.conditionEffectiveAt.slice(0, 10) >= fromDate)) &&`
- `src/features/buildings/map/map-workspace.tsx:45` — `(!toDate \|\| (item.conditionEffectiveAt && item.conditionEffectiveAt.slice(0, 10) <= toDate));`
- `src/features/buildings/map/map-workspace.tsx:53` — `const fees = (item.boq?.fees ?? []).filter((fee) => fee.payable && matchesBuildingMapCategory(fee, category));`
- `src/features/buildings/map/map-workspace.tsx:59` — `const points: MapPoint[] = heatPoints.map(({ item, fees, amount }) => ({ id: item.id, name: item.nameTh, code: item.code,`
- `src/features/buildings/map/map-workspace.tsx:99` — `{(mode === "expense" \|\| mode === "heatmap") && <div><strong>{summary.count.toLocaleString("th-TH")}</strong><span>รายการตามเงื่อนไข · {money(summary.amount)}</span></div>}</div>`
- `src/features/buildings/map/map-workspace.tsx:103` — `<label>จังหวัด<select value={province} onChange={(event) => setProvince(event.target.value)}><option value="">ทุกจังหวัด</option>{provinces.map((item) => <option key={item}>{item}</option>)}</select></label>`
- `src/features/buildings/map/map-workspace.tsx:104` — `<label>สถานะ<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">ทุกสถานะ</option>{[...new Set(buildings.map((item) => item.status).filter(Boolean))].map((item) => <option key={item}>{item}</option>)}</select></label>`
- `src/features/buildings/map/map-workspace.tsx:105` — `<label>มุมมอง<select value={mode} onChange={(event) => setMode(event.target.value as Mode)}><option value="buildings">อาคาร</option><option value="status">สถานะอาคาร</option><option value="expense">ค่าใช้จ่ายตามเงื่อนไข</option><option value="heatmap">Heatmap</option></select></label>`
- `src/features/buildings/map/map-workspace.tsx:106` — `{(mode === "expense" \|\| mode === "heatmap") && <>`
- `src/features/buildings/map/map-workspace.tsx:107` — `<label>หมวดค่าใช้จ่าย<select value={category} onChange={(event) => setCategory(event.target.value as BuildingMapExpenseCategory)}>{groups.map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>`
- `src/features/buildings/map/map-workspace.tsx:108` — `{mode === "heatmap" && <label>ตัวชี้วัดความหนาแน่น<select value={heatMetric} onChange={(event) => setHeatMetric(event.target.value as HeatMetric)}><option value="building_count">จำนวนอาคาร</option><option value="fee_count">จำนวนรายการตามเงื่อนไข</option><option value="amount">ยอดตามหมวดที่เลือก</option></select></label>}`
- `src/features/buildings/map/map-workspace.tsx:118` — `{locationMessage && <p className="building-map-notice" role="status">{locationMessage}</p>}`
- `src/features/buildings/map/map-workspace.tsx:119` — `{truncated && <p className="building-map-notice" role="status">แสดงข้อมูล 2,000 อาคารแรกในขอบเขต โปรดจำกัดการค้นหาหรือจังหวัดเพื่อดูรายการเพิ่มเติม</p>}`
- `src/features/buildings/map/map-workspace.tsx:122` — `<section className="building-map-canvas-panel" aria-label="แผนที่และรายละเอียดอาคาร"><div className="building-map-legend"><strong>คำอธิบาย</strong><span><i className="building-map-legend-pin"/> จุดอาคาร</span>{mode !== "heatmap" && <span><i className="building-map-legend-cluster"/> กลุ่มอาคาร</span>}{mode === "heatmap" && <span><i className="building-map-legend-heat"/> ความหนาแน่น: {heatMetric === "building_count" ? "จำนวนอาคาร" : heatMetric === "fee_count" ? &#96;จำนวนรายการ · ${groups.find(([key]) => key === category)?.[1]}&#96; : &#96;ยอด · ${groups.find(([key]) => key === category)?.[1]}&#96;}</span>}</div>`
- `src/features/buildings/map/map-workspace.tsx:124` — `{selected && <article key={&#96;building-detail-${selected.id}&#96;} className="building-map-detail" aria-live="polite"><button type="button" className="building-map-detail-close" onClick={() => setSelectedId("")} aria-label="ปิดรายละเอียด">×</button><small>รายละเอียดอาคาร</small><h2>{selected.nameTh}</h2><p>{selected.code} · {selected.status}</p><p>{[selected.subdistrict, selected.district, selected.province].filter(Boolean).join(" · ") \|\| selected.address \|\| "ยังไม่มีข้อมูลที่อยู่"}</p><p>{selected.locationVerified ? "ยืนยันตำแหน่งแล้ว" : "ตำแหน่งยังไม่ยืนยัน"}{selected.locationSource ? &#96; · ${selected.locationSource}&#96; : ""}</p>`
- `src/features/buildings/map/map-workspace.tsx:125` — `{(mode === "expense" \|\| mode === "heatmap") && <p>{groups.find(([key]) => key === category)?.[1]}: {money(summarizeBuildingMapFees(selected.boq?.fees ?? [], category).amount)}</p>}`
- `src/features/buildings/map/map-workspace.tsx:126` — `<div><Link href={&#96;/buildings/${selected.id}&#96;}>ข้อมูลอาคาร</Link>{selected.canUpdateLocation && <Link href={&#96;/buildings/${selected.id}?tab=location&#96;}>แก้ไขตำแหน่ง</Link>}</div></article>}`

## A-138 — `src/features/car-booking/car-access-workspace.tsx`

- `src/features/car-booking/car-access-workspace.tsx:16` — `return <div className="cb-workspace"><PageHeader title="สิทธิ์ระบบจองรถ" description="กำหนดสิทธิ์รายบุคคล มีผลทันทีในคำขอถัดไปโดยไม่ต้องเข้าสู่ระบบใหม่" parent={{label:"ผู้ดูแลระบบ",href:"/admin"}}/>`
- `src/features/car-booking/car-access-workspace.tsx:17` — `<section className="cb-panel cb-access-panel" data-admin-surface="car-booking-access" aria-labelledby="car-access-title"><header className="cb-section-head"><div><h2 id="car-access-title">การเข้าถึงระบบจองรถ</h2><p className="cb-muted">แยกสิทธิ์การใช้งานส่วนบุคคลออกจากสิทธิ์ผู้ดูแล และบันทึกเมื่อเลือกเสร็จ</p></div><span className="cb-status-badge">{users.length} บัญชี</span></header><div className="cb-filter"><label>ค้นหาผู้ใช้<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="ชื่อ อีเมล หรือรหัสพนักงาน"/></label><button disabled={busy} onClick={()=>void load()}>โหลดใหม่</button></div>{message&&<p role="status" className="cb-success">{message}</p>}{error&&<p role="alert" className="cb-error">{error}</p>}`
- `src/features/car-booking/car-access-workspace.tsx:18` — `<p className="cb-muted">ใช้งาน: จองและจัดการรายการของตนเอง · ผู้ดูแล: จัดการรถและรายการทั้งหมด ทั้งสองสิทธิ์เลือกแยกกันได้</p><div className="cb-access-list" aria-live="polite">{visible.map(user=><AccessRow key={&#96;${user.id}-${user.can_use}-${user.can_admin}&#96;} user={user} busy={busy} onSave={save}/>)}</div>{!visible.length&&<p role="status" className="cb-empty">{users.length ? "ไม่พบผู้ใช้ที่ตรงกับคำค้นหา" : "ไม่พบผู้ใช้"}</p>}</section></div>;`
- `src/features/car-booking/car-access-workspace.tsx:22` — `return <form className="cb-access-row" onSubmit={e=>{e.preventDefault();void onSave(user,use,admin);}}><div><strong>{user.display_name \|\| user.email}</strong><p>{user.email} · {user.employee_code \|\| "ไม่มีรหัสพนักงาน"} · {user.status==="active"?"ใช้งาน":"ถูกระงับ"}</p></div><label className="cb-check"><input type="checkbox" checked={use} disabled={busy} onChange={e=>setUse(e.target.checked)}/>ใช้งาน</label><label className="cb-check"><input type="checkbox" checked={admin} disabled={busy} onChange={e=>setAdmin(e.target.checked)}/>ผู้ดูแล</label><button type="submit" disabled={busy \|\| use===user.can_use&&admin===user.can_admin} aria-label={&#96;บันทึกสิทธิ์ ${user.display_name \|\| user.email}&#96;}>บันทึก</button></form>;`

## A-139 — `src/features/car-booking/car-booking-dialog.tsx`

- `src/features/car-booking/car-booking-dialog.tsx:3` — `export function CarBookingDialog({title,children,busy,onClose}:{title:string;children:React.ReactNode;busy:boolean;onClose:()=>void}) {`

## A-140 — `src/features/car-booking/car-booking-workspace.tsx`

- `src/features/car-booking/car-booking-workspace.tsx:14` — `export type Vehicle={car_id:string;license_plate:string;parking_floor:string\|null;latest_mileage:string;is_active:boolean;last_user:string;using_now:boolean};`
- `src/features/car-booking/car-booking-workspace.tsx:15` — `export type Reservation={id:string;userId:string;employeeName:string;carId:string;destination:string;startTime:string;endTime:string;status:string;startMileage:string;actualReturnTime:string\|null};`
- `src/features/car-booking/car-booking-workspace.tsx:16` — `export type JourneyLog={id:string;logTime:string;logType:string;location:string;mileage:string;note:string;fuelLiters:string\|null;fuelAmount:string\|null;gpsLatitude:string\|null;gpsLongitude:string\|null;gpsAccuracyMeters:string\|null};`
- `src/features/car-booking/car-booking-workspace.tsx:17` — `type CalendarEvent=CarCalendarEvent;`
- `src/features/car-booking/car-booking-workspace.tsx:18` — `type PageResponse<T>={data:T[];message?:string;page?:{nextOffset:number\|null}};`
- `src/features/car-booking/car-booking-workspace.tsx:19` — `type Dialog={kind:"return"\|"log"\|"logs"\|"gps"\|"car"\|"cancel";booking?:Reservation;car?:Vehicle};`
- `src/features/car-booking/car-booking-workspace.tsx:24` — `const tabs=[{id:"book",label:"จองรถ"},{id:"mine",label:"รายการของฉัน"},{id:"return",label:"คืนรถ"},{id:"calendar",label:"ปฏิทิน"},{id:"vehicles",label:"ข้อมูลรถ"}] as const;`
- `src/features/car-booking/car-booking-workspace.tsx:25` — `const adminTabs=[{id:"admin",label:"จัดการรถ"},{id:"all",label:"การจองทั้งหมด"},{id:"parking",label:"ชั้นจอด"},{id:"reports",label:"รายงาน OSP"},{id:"dashboard",label:"แดชบอร์ด"}] as const;`
- `src/features/car-booking/car-booking-workspace.tsx:67` — `const filtered=bookings.filter(b=>(tab==="return" \|\| Date.parse(b.startTime)<monthEnd&&Date.parse(b.endTime)>monthStart)&&(tab==="all" \|\| b.userId===userId)&&(tab!=="return" \|\| b.status==="booked" && Date.parse(b.startTime)<=now)&&(status==="all" \|\| b.status===status)&&&#96;${cars.find(c=>c.car_id===b.carId)?.license_plate \|\| ""} ${b.destination} ${b.employeeName}&#96;.toLocaleLowerCase().includes(query.toLocaleLowerCase()));`
- `src/features/car-booking/car-booking-workspace.tsx:78` — `<div className="cb-toolbar"><nav aria-label="เมนูระบบจองรถ">{allTabs.map(item=><button key={item.id} type="button" aria-current={tab===item.id?"page":undefined} onClick={()=>{setTab(item.id);setQuery("");setStatus("all");}}>{item.label}</button>)}</nav>{canManageAccess&&<Link href="/admin/car-booking" className="cb-link">จัดสิทธิ์จองรถ</Link>}</div>`
- `src/features/car-booking/car-booking-workspace.tsx:79` — `{!["reports","dashboard"].includes(tab)&&<div className="cb-filter"><label>เดือนที่แสดง<input type="month" value={month} onChange={e=>{if(e.target.value){setMonth(e.target.value);setCalendarDate(&#96;${e.target.value}-01&#96;);}}}/></label><button type="button" disabled={loading \|\| busy} onClick={()=>void refresh()}>โหลดใหม่</button><span className="cb-muted">เวลาไทย (กรุงเทพฯ)</span></div>}`
- `src/features/car-booking/car-booking-workspace.tsx:80` — `{message&&<p role="status" className="cb-success">{message}</p>}{error&&<p role="alert" className="cb-error">{error}</p>}{loading&&<p role="status">กำลังโหลดข้อมูล…</p>}`
- `src/features/car-booking/car-booking-workspace.tsx:81` — `{tab==="book"&&<section className="cb-panel"><h2>จองรถ</h2><form onSubmit={async e=>{e.preventDefault();if(await mutate("/api/car-booking/bookings",{carId:selectedCar,destination,intervals:[{startTime:bangkokISO(start),endTime:bangkokISO(end)}]},"POST","จองรถเรียบร้อยแล้ว")){setDestination("");setSelectedCar("");}}}>`
- `src/features/car-booking/car-booking-workspace.tsx:82` — `{!acceptNewBookings&&<p role="status">ระบบหยุดรับการจองใหม่ชั่วคราว ยังสามารถคืนรถ ยกเลิก และบันทึกการเดินทางได้</p>}`
- `src/features/car-booking/car-booking-workspace.tsx:85` — `{available!==null&&<><p role="status">พบรถว่าง {available.length} คัน</p><label>ทะเบียนรถ<select required value={selectedCar} onChange={e=>setSelectedCar(e.target.value)}><option value="">เลือกทะเบียนรถ</option>{available.map(c=><option value={c.car_id} key={c.car_id}>{c.license_plate} · ที่จอด {c.parking_floor \|\| "ยังไม่ระบุ"} · ไมล์ {c.latest_mileage}</option>)}</select></label></>}`
- `src/features/car-booking/car-booking-workspace.tsx:89` — `{["mine","return","all"].includes(tab)&&<section className="cb-panel"><h2>{tab==="return"?"รายการที่เริ่มแล้วและยังไม่คืน":tab==="all"?"การจองทั้งหมด":"รายการของฉัน"}</h2><div className="cb-filter"><label>ค้นหาการจอง<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="ทะเบียน ปลายทาง หรือผู้จอง"/></label>{tab!=="return"&&<label>สถานะ<select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">ทุกสถานะ</option><option value="booked">ยังไม่คืน</option><option value="completed">คืนแล้ว</option><option value="cancelled">ยกเลิก</option></select></label>}</div>`
- `src/features/car-booking/car-booking-workspace.tsx:90` — `{!filtered.length&&!loading&&<p role="status">ไม่มีรายการในเดือนและตัวกรองที่เลือก</p>}`
- `src/features/car-booking/car-booking-workspace.tsx:91` — `<div className="cb-reservations">{filtered.map(b=><article className="cb-reservation" key={b.id}><div><h3>{cars.find(c=>c.car_id===b.carId)?.license_plate \|\| "รถ"}</h3><StatusBadge label={bookingStatus(b.status, b.startTime, now)} tone={carBookingStatusTone(b.status)} /></div><p>{thaiCarDate(b.startTime)} → {thaiCarDate(b.actualReturnTime \|\| b.endTime)}</p><p>{b.destination}</p>{admin&&<p className="cb-muted">ผู้จอง: {b.employeeName}</p>}<div className="cb-actions">{b.status==="booked"&&<>{Date.parse(b.startTime)<=now&&<button onClick={()=>setDialog({kind:"return",booking:b})}>คืนรถ</button>}<button onClick={()=>setDialog({kind:"log",booking:b})}>เพิ่มบันทึก</button><button className="cb-danger" onClick={()=>setDialog({kind:"cancel",booking:b})}>ยกเลิกการจอง</button></>}<button onClick={()=>setDialog({kind:"logs",booking:b})}>ดูบันทึก</button>{admin&&<button onClick={()=>setDialog({kind:"gps",booking:b})}>ดูพิกัด</button>}</div></article>)}</div>`
- `src/features/car-booking/car-booking-workspace.tsx:93` — `{tab==="calendar"&&<CarCalendar events={calendar} anchor={calendarDate} view={calendarView} loading={loading} onView={setCalendarView} onDate={date=>{setCalendarDate(date);setMonth(date.slice(0,7));}}/>}`
- `src/features/car-booking/car-booking-workspace.tsx:94` — `{(tab==="reports"\|\|tab==="dashboard")&&admin&&<CarReports key={tab} dashboard={tab==="dashboard"}/>}`
- `src/features/car-booking/car-booking-workspace.tsx:95` — `{["vehicles","admin"].includes(tab)&&<section className="cb-panel"><div className="cb-section-head"><h2>{tab==="admin"?"จัดการรถ":"ข้อมูลรถ"}</h2>{tab==="admin"&&<button className="cb-primary" onClick={()=>setDialog({kind:"car"})}>เพิ่มรถ</button>}</div><TableRegion label="ตารางข้อมูลรถ เลื่อนแนวนอนได้" className="cb-table-wrap"><table><caption className="cb-sr">ข้อมูลรถและการใช้งานล่าสุด</caption><thead><tr><th scope="col">ทะเบียน</th><th scope="col">ที่จอด</th><th scope="col">เลขไมล์ล่าสุด</th><th scope="col">ผู้ใช้ล่าสุด</th><th scope="col">สถานะ</th>{tab==="admin"&&<th scope="col">จัดการ</th>}</tr></thead><tbody>{cars.map(c=><tr key={c.car_id}><th scope="row">{c.license_plate}</th><td>{c.parking_floor \|\| "ยังไม่ระบุ"}</td><td>{c.latest_mileage}</td><td>{c.last_user}</td><td>{c.is_active?"เปิดใช้งาน":"ปิดใช้งาน"}</td>{tab==="admin"&&<td><button onClick={()=>setDialog({kind:"car",car:c})}>แก้ไข {c.license_plate}</button></td>}</tr>)}</tbody></table></TableRegion></section>}`
- `src/features/car-booking/car-booking-workspace.tsx:96` — `{tab==="parking"&&admin&&<section className="cb-panel"><h2>รายการชั้นจอด</h2><form onSubmit={e=>{e.preventDefault();void mutate("/api/car-booking/settings",{floors:floorText.split(/\r?\n/).map(v=>v.trim()).filter(Boolean),version:floorVersion},"PATCH","บันทึกชั้นจอดแล้ว");}}><label>ชั้นจอด (หนึ่งรายการต่อบรรทัด)<textarea required rows={10} value={floorText} onChange={e=>setFloorText(e.target.value)}/></label><p className="cb-muted">การแก้รายการไม่เปลี่ยนที่จอดที่บันทึกไว้ในประวัติเดิม</p><button type="submit" className="cb-primary" disabled={busy}>บันทึกชั้นจอด</button></form></section>}`
- `src/features/car-booking/car-booking-workspace.tsx:97` — `{dialog&&<CarBookingDialog title={{return:"คืนรถ",log:"เพิ่มบันทึกระหว่างทาง",logs:"บันทึกระหว่างทาง",gps:"พิกัดการเดินทาง",car:dialog.car?"แก้ไขรถ":"เพิ่มรถ",cancel:"ยืนยันยกเลิกการจอง"}[dialog.kind]} busy={busy} onClose={()=>setDialog(null)}>`
- `src/features/car-booking/car-booking-workspace.tsx:98` — `{error&&<p role="alert" className="cb-error">{error}</p>}`
- `src/features/car-booking/car-booking-workspace.tsx:99` — `{dialog.kind==="cancel"&&<><p>ยกเลิกการจองไป {dialog.booking!.destination} ใช่หรือไม่?</p><div className="cb-actions"><button disabled={busy} className="cb-danger" onClick={()=>void mutate(&#96;/api/car-booking/bookings/${dialog.booking!.id}/cancel&#96;,{},"POST","ยกเลิกการจองเรียบร้อยแล้ว")}>ยืนยันยกเลิก</button><button disabled={busy} onClick={()=>setDialog(null)}>กลับ</button></div></>}`
- `src/features/car-booking/car-booking-workspace.tsx:100` — `{dialog.kind==="return"&&<ReturnForm booking={dialog.booking!} floor={returnParkingFloor(cars.find(c=>c.car_id===dialog.booking!.carId)?.parking_floor \|\| null,floors)} floors={floors} busy={busy} onSave={body=>mutate(&#96;/api/car-booking/bookings/${dialog.booking!.id}/return&#96;,body,"POST","คืนรถเรียบร้อยแล้ว")}/>}`
- `src/features/car-booking/car-booking-workspace.tsx:101` — `{dialog.kind==="log"&&<LogForm busy={busy} onSave={body=>mutate(&#96;/api/car-booking/bookings/${dialog.booking!.id}/logs&#96;,body,"POST","บันทึกระหว่างทางแล้ว")}/>}`
- `src/features/car-booking/car-booking-workspace.tsx:102` — `{["logs","gps"].includes(dialog.kind)&&<JourneyLogs bookingId={dialog.booking!.id} gps={dialog.kind==="gps"}/>}`
- `src/features/car-booking/car-booking-workspace.tsx:103` — `{dialog.kind==="car"&&<CarForm vehicle={dialog.car} floors={floors} busy={busy} onSave={body=>mutate(&#96;/api/car-booking/cars${dialog.car?&#96;/${dialog.car.car_id}&#96;:""}&#96;,body,dialog.car?"PATCH":"POST","บันทึกข้อมูลรถแล้ว")}/>}`
- `src/features/car-booking/car-booking-workspace.tsx:109` — `return <form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);void onSave({actualReturnTime:bangkokISO(String(data.get("returnTime"))),parkingFloor:String(data.get("parkingFloor")),mileage:String(data.get("mileage")),refueled:fuel,...(fuel?{fuelMileage:String(data.get("fuelMileage")),fuelLiters:String(data.get("fuelLiters")),fuelAmount:String(data.get("fuelAmount"))}:{})});}}><p>เริ่มใช้ {thaiCarDate(booking.startTime)} · ไมล์เริ่มต้น {booking.startMileage}</p><label>เวลาคืนรถ<input name="returnTime" type="datetime-local" required defaultValue={bangkokInput()}/></label><label>ชั้นที่จอด<select name="parkingFloor" required defaultValue={floor}>{floors.map(f=><option key={f}>{f}</option>)}</select></label><label>เลขไมล์ตอนคืน<input name="mileage" type="number" min="0" step="any" required inputMode="decimal"/></label><label className="cb-check"><input type="checkbox" checked={fuel} onChange={e=>setFuel(e.target.checked)}/>เติมน้ำมันตอนคืนรถ</label>{fuel&&<FuelFields mileage/>}<button disabled={busy} type="submit" className="cb-primary">ยืนยันคืนรถ</button></form>;`
- `src/features/car-booking/car-booking-workspace.tsx:111` — `function FuelFields({mileage=false}:{mileage?:boolean}) {return <fieldset><legend>ข้อมูลการเติมน้ำมัน</legend>{mileage&&<label>เลขไมล์ตอนเติม<input name="fuelMileage" type="number" min="0" step="any" required inputMode="decimal"/></label>}<label>จำนวนลิตร<input name="fuelLiters" type="number" min="0.001" step="any" required inputMode="decimal"/></label><label>จำนวนเงิน (บาท)<input name="fuelAmount" type="number" min="0.01" step="any" required inputMode="decimal"/></label></fieldset>;}`
- `src/features/car-booking/car-booking-workspace.tsx:115` — `return <form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);void onSave({logTime:bangkokISO(String(data.get("logTime"))),logType:type,location:String(data.get("location")),mileage:String(data.get("mileage")),note:String(data.get("note")),refueled:fuel,...(type==="fuel"\|\|fuel?{fuelLiters:String(data.get("fuelLiters")),fuelAmount:String(data.get("fuelAmount"))}:{}),...(gps \|\| {})});}}><label>วันเวลาบันทึก<input name="logTime" type="datetime-local" required defaultValue={bangkokInput()}/></label><label>ประเภท<select value={type} onChange={e=>setType(e.target.value)}><option value="other">บันทึกระหว่างทาง</option><option value="overnight_stop">จอดพัก</option><option value="checkpoint">จุดแวะ</option><option value="fuel">เติมน้ำมัน</option></select></label><label>สถานที่<input name="location" required maxLength={2000}/></label><label>เลขไมล์<input name="mileage" type="number" min="0" step="any" required inputMode="decimal"/></label>{type!=="fuel"&&<label className="cb-check"><input type="checkbox" checked={fuel} onChange={e=>setFuel(e.target.checked)}/>เติมน้ำมันด้วย</label>}{(type==="fuel" \|\| fuel)&&<FuelFields/>}<label>หมายเหตุ<textarea name="note" maxLength={4000}/></label><div className="cb-actions"><button type="button" disabled={locating \|\| busy} onClick={locate}>{locating?"กำลังรับพิกัด…":"แนบพิกัดปัจจุบัน"}</button>{gps&&<button type="button" onClick={()=>{setGps(null);setNotice("นำพิกัดออกแล้ว");}}>นำพิกัดออก</button>}</div><p role="status" className="cb-muted">{notice}</p><button disabled={busy \|\| locating} type="submit" className="cb-primary">บันทึกการเดินทาง</button></form>;`
- `src/features/car-booking/car-booking-workspace.tsx:117` — `function CarForm({vehicle,floors,busy,onSave}:{vehicle?:Vehicle;floors:string[];busy:boolean;onSave:(body:unknown)=>Promise<boolean>}) {return <form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);void onSave({licensePlate:String(data.get("plate")),parkingFloor:String(data.get("floor")) \|\| null,latestMileage:String(data.get("mileage")),isActive:data.get("active")==="on"});}}><label>ทะเบียนรถ<input name="plate" required maxLength={80} defaultValue={vehicle?.license_plate}/></label><label>ชั้นที่จอด<select name="floor" defaultValue={returnParkingFloor(vehicle?.parking_floor \|\| null,floors)}><option value="">ยังไม่ระบุ</option>{floors.map(f=><option key={f}>{f}</option>)}</select></label><label>เลขไมล์ล่าสุด<input name="mileage" type="number" min="0" step="any" required defaultValue={vehicle?.latest_mileage \|\| "0"}/></label><label className="cb-check"><input name="active" type="checkbox" defaultChecked={vehicle?.is_active ?? true}/>เปิดใช้งานรถ</label><p className="cb-muted">ปิดใช้งานเพื่อหยุดรับจองใหม่ ประวัติยังอยู่</p><button className="cb-primary" disabled={busy} type="submit">บันทึกรถ</button></form>;}`
- `src/features/car-booking/car-booking-workspace.tsx:122` — `return <>{loading&&<p role="status">กำลังโหลดบันทึก…</p>}{error&&<p role="alert">{error}</p>}{gps&&rows.length>0&&<CarJourneyMap logs={rows}/>}<ol className="cb-log-list">{rows.map(row=><li key={row.id}><strong>{labels[row.logType]} · {row.location}</strong><p>{thaiCarDate(row.logTime)} · ไมล์ {row.mileage}</p>{row.fuelLiters&&<p>น้ำมัน {row.fuelLiters} ลิตร · {row.fuelAmount} บาท</p>}{row.note&&<p>{row.note}</p>}{gps&&<p>พิกัด {row.gpsLatitude}, {row.gpsLongitude} · ความแม่นยำ {row.gpsAccuracyMeters \|\| "ไม่ระบุ"} เมตร</p>}</li>)}</ol>{!loading&&!rows.length&&!error&&<p role="status">ยังไม่มี{gps?"บันทึกที่มีพิกัด":"บันทึกระหว่างทาง"}</p>}</>;`

## A-141 — `src/features/car-booking/car-calendar.tsx`

- `src/features/car-booking/car-calendar.tsx:5` — `export type CarCalendarEvent={car_id:string;license_plate:string;start_time:string;end_time:string};`
- `src/features/car-booking/car-calendar.tsx:11` — `<div className="cb-filter"><button disabled={loading} onClick={()=>{setSelected(null);onDate(moveCarCalendar(anchor,view,-1));}}>ก่อนหน้า</button><button disabled={loading} onClick={()=>{setSelected(null);onDate(bangkokInput().slice(0,10));}}>วันนี้</button><button disabled={loading} onClick={()=>{setSelected(null);onDate(moveCarCalendar(anchor,view,1));}}>ถัดไป</button><label>มุมมองปฏิทิน<select value={view} disabled={loading} onChange={e=>{setSelected(null);onView(e.target.value as CarCalendarView);}}><option value="month">เดือน</option><option value="week">สัปดาห์</option><option value="day">วัน</option></select></label></div>`
- `src/features/car-booking/car-calendar.tsx:13` — `{selected&&<p role="status" className="cb-calendar-detail"><strong>{selected.license_plate}</strong> · {thaiCarDate(selected.start_time)} → {thaiCarDate(selected.end_time)}</p>}`
- `src/features/car-booking/car-calendar.tsx:15` — `{view!=="day"&&["อา.","จ.","อ.","พ.","พฤ.","ศ.","ส."].map(day=><div key={day} className="cb-weekday" aria-hidden="true">{day}</div>)}`
- `src/features/car-booking/car-calendar.tsx:18` — `const rows=events.filter(event=>Date.parse(event.start_time)<end&&(Date.parse(event.end_time)>start \|\| event.start_time===event.end_time&&Date.parse(event.start_time)>=start));`
- `src/features/car-booking/car-calendar.tsx:20` — `})}</div>{!events.length&&!loading&&<p role="status">ยังไม่มีช่วงไม่ว่างในช่วงนี้</p>}</section>;`

## A-142 — `src/features/car-booking/car-journey-map.tsx`

- `src/features/car-booking/car-journey-map.tsx:11` — `const tiles=[];for(let x=Math.floor(origin.x/256);x<=Math.floor((origin.x+768)/256);x++)for(let y=Math.floor(origin.y/256);y<=Math.floor((origin.y+512)/256);y++){const limit=2**zoom;if(y>=0&&y<limit)tiles.push({x,y,url:&#96;https://tile.openstreetmap.org/${zoom}/${(x%limit+limit)%limit}/${y}.png&#96;});}`
- `src/features/car-booking/car-journey-map.tsx:12` — `return <div className="cb-map"><div className="cb-filter"><label>ตำแหน่งบนแผนที่<select value={selected} onChange={e=>setSelected(e.target.value)}>{logs.map(row=><option key={row.id} value={row.id}>{row.location}</option>)}</select></label><button type="button" aria-label="ขยายแผนที่" disabled={zoom>=18} onClick={()=>setZoom(value=>value+1)}>+</button><button type="button" aria-label="ย่อแผนที่" disabled={zoom<=2} onClick={()=>setZoom(value=>value-1)}>−</button></div>`
- `src/features/car-booking/car-journey-map.tsx:14` — `{tileError&&<p role="status">โหลดพื้นแผนที่ไม่สำเร็จ ยังดูพิกัดในรายการด้านล่างได้</p>}<p className="cb-muted"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></p></div>;`

## A-143 — `src/features/car-booking/car-reports.tsx`

- `src/features/car-booking/car-reports.tsx:7` — `type Report={columns:string[];rows:string[][];total:number;offset:number;limit:number;nextOffset:number\|null};`
- `src/features/car-booking/car-reports.tsx:8` — `type Dashboard=Awaited<ReturnType<typeof readCarDashboard>>;`
- `src/features/car-booking/car-reports.tsx:9` — `type Sync=Awaited<ReturnType<typeof readOspSync>>;`
- `src/features/car-booking/car-reports.tsx:33` — `{loading&&<p role="status">กำลังโหลดรายงาน…</p>}{error&&<p role="alert" className="cb-error">{error}</p>}{notice&&<p role="status" className="cb-success">{notice}</p>}`
- `src/features/car-booking/car-reports.tsx:34` — `{dashboard&&stats&&<><dl className="cb-stats">{[["การจองทั้งหมด",stats.totals.total],["คืนแล้ว",stats.totals.completed],["กำลังใช้งาน",stats.totals.active],["จองล่วงหน้า",stats.totals.upcoming],["ระยะทางรวม (กม.)",stats.totals.distance],["น้ำมันรวม (ลิตร)",stats.totals.liters],["ค่าน้ำมันรวม (บาท)",stats.totals.amount]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>`
- `src/features/car-booking/car-reports.tsx:38` — `{!dashboard&&report&&<><p>พบ {report.total} รายการคืนแล้ว</p><div className="cb-table-wrap" tabIndex={0} role="region" aria-label="ตารางรายงาน เลื่อนดูได้ด้วยคีย์บอร์ด"><table className="cb-osp-table"><caption className="cb-sr">รายงาน OSP 19 คอลัมน์</caption><thead><tr>{report.columns.map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{report.rows.map(row=><tr key={row[0]}>{row.map((value,i)=><td key={i}>{i===18&&value?<details><summary>ดูบันทึก</summary><pre tabIndex={0}>{value}</pre></details>:value}</td>)}</tr>)}</tbody></table></div></>}`
- `src/features/car-booking/car-reports.tsx:39` — `{page&&<div className="cb-filter cb-pagination"><button disabled={loading\|\|offset===0} onClick={()=>setOffset(Math.max(0,offset-50))}>หน้ารายงานก่อนหน้า</button><span>หน้า {Math.floor(offset/50)+1}</span><button disabled={loading\|\|next===null} onClick={()=>{if(next!==null)setOffset(next);}}>หน้ารายงานถัดไป</button></div>}`
- `src/features/car-booking/car-reports.tsx:40` — `{sync&&<section className="cb-sync"><h3>สถานะส่ง Google Sheets</h3><p>{sync.configured?"พร้อมส่งตามรอบงานที่ผู้ดูแลตั้งไว้":"ยังไม่ได้เปิดการส่ง Google Sheets รายการรอส่งยังเก็บอยู่"}</p><p>{sync.counts.map(row=>&#96;${statuses[row.status]} ${row.count} รายการ&#96;).join(" · ")\|\|"ยังไม่มีงานส่ง"}</p><div className="cb-actions"><button disabled={loading} onClick={()=>void queue("retry")}>ลองส่งรายการที่ค้างอีกครั้ง</button><details><summary>สร้างรายงานทั้งชีตใหม่</summary><p>สำรองก่อนเขียน รักษาค่า SAP และแถวเดิมที่ยังไม่อยู่ในระบบ จากนั้นรวมแถวซ้ำ ผลซ้ำได้เหมือนเดิม</p><button disabled={loading} onClick={()=>void queue("rebuild")}>ยืนยันสร้างรายงานทั้งชีตใหม่</button></details></div><details><summary>ดูงานส่งล่าสุด (ไม่เกิน 20 รายการ)</summary><ul>{sync.jobs.map(job=><li key={job.id}>{job.kind==="rebuild"?"สร้างทั้งชีต":"ส่งรายการคืนรถ"} · {statuses[job.status]} · ลองแล้ว {job.attempts} ครั้ง{job.error_code?" · กรุณาตรวจการตั้งค่าหรือข้อมูลชีตแล้วลองใหม่":""}</li>)}</ul></details></section>}`

## A-144 — `src/features/work/components/admin-panels.tsx`

- `src/features/work/components/admin-panels.tsx:7` — `function AdminForm({ kind,title,children }: { kind:string;title:string;children:React.ReactNode }) {`
- `src/features/work/components/admin-panels.tsx:15` — `const rows=data.calendar.filter(r=>(!year\|\|r.holidayDate.startsWith(year))&&(!source\|\|r.source===source)&&(!active\|\|String(r.isActive)===active));`
- `src/features/work/components/admin-panels.tsx:16` — `return <section id="calendar" data-admin-surface="calendar" className="admin-panel"><div className="admin-panel-title"><h2>วันหยุด</h2><span className="admin-status-badge admin-status-neutral">งานและ KPI</span></div><p>เพิ่มวันหยุดบริษัทหรือวันหยุดไทยด้วยมือ แล้วดูผลกระทบก่อนคำนวณกำหนดใหม่</p><div className="work-form-grid"><label>ปี<input value={year} onChange={e=>setYear(e.target.value)} placeholder="2026"/></label><label>แหล่งที่มา<select value={source} onChange={e=>setSource(e.target.value)}><option value="">ทั้งหมด</option><option value="company">บริษัท</option><option value="thai">วันหยุดไทย</option></select></label><label>สถานะ<select value={active} onChange={e=>setActive(e.target.value)}><option value="">ทั้งหมด</option><option value="true">ใช้งาน</option><option value="false">ปิดใช้งาน</option></select></label></div><ul>{rows.map(r=><li key={r.id}>{r.holidayDate} · {r.name} · {r.isActive?"ใช้งาน":"ปิดใช้งาน"} <button type="button" className="text-btn" onClick={()=>setEdit(r)}>แก้ไข / ปิดใช้งาน</button></li>)}</ul><button type="button" className="secondary-action" onClick={()=>setEdit(undefined)}>เพิ่มวันหยุด</button><AdminForm key={&#96;${edit?.id}:${edit?.version}&#96;} kind="holiday" title={edit?"แก้ไขวันหยุด":"เพิ่มวันหยุด"}><Version id={edit?.id} version={edit?.version}/><label>วันที่<input name="holidayDate" type="date" required defaultValue={edit?.holidayDate}/></label><label>ชื่อวันหยุด<input name="name" required maxLength={180} defaultValue={edit?.name}/></label><label>แหล่งที่มา<select name="source" defaultValue={edit?.source??"company"}><option value="company">บริษัท</option><option value="thai">วันหยุดไทย</option></select></label><label><input type="checkbox" name="isActive" defaultChecked={edit?.isActive??true}/> ใช้งาน</label></AdminForm></section>;`
- `src/features/work/components/admin-panels.tsx:20` — `return <section id="kpi" data-admin-surface="kpi" className="admin-panel"><div className="admin-panel-title"><h2>กฎ KPI / SLA</h2><span className="admin-status-badge admin-status-neutral">งานและ KPI</span></div><p>แต่ละการบันทึกสร้าง version ใหม่ งานเก่าเก็บกฎที่ใช้เดิม การปิดใช้งานยังรักษาประวัติไว้</p><ul>{data.catalog.map(r=><li key={r.id}>{r.mainKpi} / {r.subKpi} · {r.slaDays} วันทำการ · น้ำหนัก {r.mainWeight} · รุ่น {r.version} · {r.status==="active"?"ใช้งาน":"ปิดใช้งาน"} <button type="button" className="text-btn" onClick={()=>setEdit(r)}>แก้ไข / ปิดใช้งาน</button></li>)}</ul><button type="button" className="secondary-action" onClick={()=>setEdit(undefined)}>เพิ่มกฎ</button><AdminForm key={&#96;${edit?.id}:${edit?.version}&#96;} kind="rule" title={edit?"สร้างรุ่นใหม่":"เพิ่ม KPI"}><input type="hidden" name="metricId" value={edit?.metricId??""}/><input type="hidden" name="expectedVersion" value={edit?.version??0}/><label>ทีม<select name="teamId" defaultValue={edit?.teamId??""} required><option value="">เลือกทีม</option>{data.teams.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label><label>Main KPI<input name="mainKpi" required maxLength={180} defaultValue={edit?.mainKpi}/></label><label>Sub KPI<input name="subKpi" required maxLength={180} defaultValue={edit?.subKpi}/></label><label>SLA (วันทำการ)<input name="slaDays" type="number" min={0} max={366} required defaultValue={edit?.slaDays}/></label><label>น้ำหนัก Main KPI<input name="mainWeight" type="number" step="0.000001" min="0.000001" max={100} required defaultValue={edit?.mainWeight}/></label><label><input type="checkbox" name="active" defaultChecked={edit?.status!=="retired"}/> ใช้งาน</label></AdminForm></section>;`
- `src/features/work/components/admin-panels.tsx:25` — `const latest=data.personals.find(p=>p.userId===person?.id&&p.teamId===person?.teamId);`
- `src/features/work/components/admin-panels.tsx:26` — `const catalog=data.catalog.filter(r=>r.teamId===person?.teamId&&r.status==="active");`
- `src/features/work/components/admin-panels.tsx:27` — `return <section id="personal-kpi" data-admin-surface="personal-kpi" className="admin-panel"><div className="admin-panel-title"><h2>KPI รายบุคคล</h2><span className="admin-status-badge admin-status-neutral">งานและ KPI</span></div><label>ผู้รับผิดชอบ<select value={personKey} onChange={e=>{setPersonKey(e.target.value);setAll(false);}}><option value="">เลือกผู้รับผิดชอบ</option>{data.people.map(p=><option key={&#96;${p.id}:${p.teamId}&#96;} value={&#96;${p.id}:${p.teamId}&#96;}>{p.name} · {data.teams.find(t=>t.id===p.teamId)?.name}</option>)}</select></label>{person&&<AdminForm key={&#96;${personKey}:${latest?.version}:${all}&#96;} kind="personal" title="น้ำหนักของคนนี้ (%)"><input type="hidden" name="userId" value={person.id}/><input type="hidden" name="teamId" value={person.teamId}/><input type="hidden" name="expectedVersion" value={latest?.version??0}/><p>น้ำหนักที่เลือกใช้ต้องรวมเป็น 100% การเปลี่ยนแปลงสร้างรุ่นใหม่และไม่แก้น้ำหนักงานเก่า</p><button type="button" className="secondary-action" onClick={()=>setAll(true)}>ใช้ KPI ที่แสดงทั้งหมด</button>{catalog.map(r=>{ const previous=latest?.assignments.find(a=>a.metricId===r.metricId);return <div key={r.metricId} className="work-personal-kpi-row"><input type="hidden" name="metricIds" value={r.metricId}/><label><input type="checkbox" name={&#96;enabled:${r.metricId}&#96;} defaultChecked={all\|\|previous?.enabled\|\|false}/> ใช้กับคนนี้ · {r.mainKpi} / {r.subKpi}</label><label>น้ำหนักของคนนี้ (%)<input type="number" name={&#96;weight:${r.metricId}&#96;} min="0.000001" max={100} step="0.000001" defaultValue={previous?.weight??r.mainWeight} required/></label></div>;})}</AdminForm>}</section>;`
- `src/features/work/components/admin-panels.tsx:32` — `return <section data-admin-surface="recalculate" className="admin-panel"><div className="admin-panel-title"><h2>{kind==="deadlines"?"คำนวณกำหนดส่งใหม่":"ย้าย KPI งานเก่า — ตัวอย่างเท่านั้น"}</h2><span className="admin-status-badge admin-status-neutral">ตรวจผลกระทบก่อนบันทึก</span></div><form action={previewAction}><input type="hidden" name="kind" value={kind}/><button className="secondary-action" disabled={previewPending\|\|confirmPending}>{previewPending?"กำลังตรวจผลกระทบ…":"ดูตัวอย่างผลกระทบ"}</button></form><p role="status">{preview.message}</p>{preview.rows&&<><div className="admin-table-wrap"><table><caption>รายการที่จะได้รับผลกระทบ</caption><thead><tr><th scope="col">งาน</th><th scope="col">เดิม</th><th scope="col">ใหม่</th></tr></thead><tbody>{preview.rows.map(r=><tr key={r.taskId}><td>{r.title}</td><td>{kind==="deadlines"?r.beforeDueAt:r.beforeWeight}</td><td>{kind==="deadlines"?r.afterDueAt:r.afterWeight}</td></tr>)}</tbody></table></div>{kind==="deadlines"&&preview.rows.length>0&&<form action={confirmAction}><input type="hidden" name="previewId" value={preview.previewId}/><label><input type="checkbox" name="confirm" required/> ยืนยันรายการข้างต้น (ตัวอย่างมีอายุ 15 นาที)</label><button className="primary" disabled={confirmPending\|\|previewPending\|\|result.ok}>{confirmPending?"กำลังคำนวณ…":"ยืนยันคำนวณใหม่"}</button><p role="status">{result.message}</p></form>}</>}</section>;`
- `src/features/work/components/admin-panels.tsx:37` — `return <section id="systems" data-admin-surface="systems" className="admin-panel"><div className="admin-panel-title"><h2>ลิงก์ระบบ</h2><span className="admin-status-badge admin-status-neutral">พื้นที่ทำงาน</span></div><ul>{data.links.map(r=><li key={r.id}>{r.name} · {r.status} <button type="button" className="text-btn" onClick={()=>choose(r)}>แก้ไข / ซ่อน</button> <button type="button" className="text-btn" onClick={()=>choose({...r,id:undefined,version:undefined,name:&#96;${r.name} (สำเนา)&#96;})}>Duplicate</button></li>)}</ul><button type="button" className="secondary-action" onClick={()=>choose(undefined)}>เพิ่ม / ล้างฟอร์ม</button><AdminForm key={revision} kind="system" title={edit?.id?"แก้ไขลิงก์":"เพิ่มลิงก์"}><Version id={edit?.id} version={edit?.version}/><label>ชื่อ<input name="name" required maxLength={180} defaultValue={edit?.name}/></label><label>คำอธิบาย<textarea name="description" maxLength={1000} defaultValue={edit?.description}/></label><label>URL<input name="url" required maxLength={2000} defaultValue={edit?.url} placeholder="https:// หรือ /path"/></label><label>ไอคอน<input name="icon" defaultValue={edit?.icon??"link"} maxLength={80}/></label><label>สถานะ<select name="status" defaultValue={edit?.status??"Active"}><option>Active</option><option>Maintenance</option><option>Coming Soon</option><option>Hidden</option></select></label><label><input type="checkbox" name="visibleToAll" defaultChecked={edit?.visibleToAll}/> แสดงให้ผู้ใช้ทุกคน</label><fieldset><legend>บทบาทที่ดูได้</legend>{data.roles.map(r=><label key={r.id}><input type="checkbox" name="roleIds" value={r.id} defaultChecked={edit?.roleIds?.includes(r.id)}/> {r.name}</label>)}</fieldset><fieldset><legend>ทีมที่ดูได้</legend>{data.teams.map(r=><label key={r.id}><input type="checkbox" name="teamIds" value={r.id} defaultChecked={edit?.teamIds?.includes(r.id)}/> {r.name}</label>)}</fieldset></AdminForm></section>;`
- `src/features/work/components/admin-panels.tsx:45` — `{data.granted.kpi&&section==="kpi"&&<KpiPanel data={data}/>}`
- `src/features/work/components/admin-panels.tsx:46` — `{data.granted.kpi&&section==="personal-kpi"&&<PersonalPanel data={data}/>}`
- `src/features/work/components/admin-panels.tsx:47` — `{data.granted.kpi&&section==="recalculate"&&<><RecalculationPanel kind="deadlines"/><RecalculationPanel kind="kpi_migration"/></>}`
- `src/features/work/components/admin-panels.tsx:48` — `{data.granted.calendar&&section==="calendar"&&<CalendarPanel data={data}/>} {data.granted.systems&&section==="systems"&&<SystemsPanel data={data}/>}`
- `src/features/work/components/admin-panels.tsx:49` — `{data.granted.announcement&&section==="announcement"&&<section id="announcement" data-admin-surface="announcement" className="admin-panel"><div className="admin-panel-title"><h2>ประกาศแอดมิน</h2><span className="admin-status-badge admin-status-neutral">พื้นที่ทำงาน</span></div>{data.announcements.map(r=><AdminForm key={&#96;${r.id}:${r.version}&#96;} kind="announcement" title="แก้ไขประกาศ"><Version id={r.id} version={r.version}/><label>ข้อความ<textarea name="message" defaultValue={r.message} maxLength={4000}/></label><label><input name="isActive" type="checkbox" defaultChecked={r.isActive}/> แสดงบนหน้าหลัก</label></AdminForm>)}<AdminForm kind="announcement" title="เพิ่มประกาศ"><label>ข้อความ<textarea name="message" required maxLength={4000}/></label><label><input name="isActive" type="checkbox"/> แสดงบนหน้าหลัก</label></AdminForm></section>}`
- `src/features/work/components/admin-panels.tsx:50` — `{section==="restore"&&<section data-admin-surface="restore" className="admin-panel"><div className="admin-panel-title"><h2>กู้คืนงานที่ลบ</h2><span className="admin-status-badge admin-status-neutral">ตรวจสอบย้อนหลัง</span></div>{data.deleted.length?data.deleted.map(task=><RestoreForm key={task.id} task={task}/>):<p className="admin-empty">ไม่มีงานที่รอกู้คืนในขอบเขตสิทธิ์ของคุณ</p>}</section>}`

## A-146 — `src/features/work/components/task-actions.tsx`

- `src/features/work/components/task-actions.tsx:7` — `type Caps = ReturnType<typeof taskCapabilities>;`
- `src/features/work/components/task-actions.tsx:9` — `const nextStatuses: Record<string, Array<{ status: string; label: string }>> = {`
- `src/features/work/components/task-actions.tsx:10` — `queued: [{ status: "in_progress", label: "รับงาน" }, { status: "cancelled", label: "ยกเลิกงาน" }],`
- `src/features/work/components/task-actions.tsx:11` — `in_progress: [{ status: "blocked", label: "พักงาน" }, { status: "completed", label: "เสร็จสิ้น" }, { status: "cancelled", label: "ยกเลิกงาน" }],`
- `src/features/work/components/task-actions.tsx:12` — `blocked: [{ status: "in_progress", label: "ดำเนินการต่อ" }, { status: "cancelled", label: "ยกเลิกงาน" }],`
- `src/features/work/components/task-actions.tsx:18` — `const [choice, setChoice] = useState<{ kind: "transition" \| "edit" \| "delete"; status?: string; label: string } \| null>(null);`
- `src/features/work/components/task-actions.tsx:35` — `{choices.map(item => <button key={item.status} type="button" className="secondary-action" onClick={event => open(event, { kind: "transition", status: item.status, label: item.label })}>{item.label}</button>)}`
- `src/features/work/components/task-actions.tsx:36` — `{capabilities.edit && <button type="button" className="secondary-action" onClick={event => open(event, { kind: "edit", label: "แก้ไขงาน" })}>แก้ไขงาน</button>}`
- `src/features/work/components/task-actions.tsx:37` — `{capabilities.delete && <button type="button" className="text-btn work-danger-action" onClick={event => open(event, { kind: "delete", label: "ลบงาน" })}>ลบงาน</button>}`
- `src/features/work/components/task-actions.tsx:39` — `{choice && <form action={action}><h2 id={&#96;command-${task.id}&#96;}>{choice.label}</h2><p>{task.title}</p><IdentityFields task={task} action={&#96;${choice.kind}:${choice.status ?? ""}&#96;}/>`
- `src/features/work/components/task-actions.tsx:40` — `{choice.kind === "transition" && <><input type="hidden" name="toStatus" value={choice.status}/>{choice.status==="completed" && task.subKpi?.toLowerCase().includes("open pr") && <><label>Fund Number<input name="fundNumber" required maxLength={180}/></label><label>จำนวนเงิน<input name="amount" type="number" min={0} step="0.01" required/></label></>}<label>เหตุผล / ความคืบหน้า<textarea name="reason" maxLength={1000} required={choice.status === "blocked" \|\| choice.status === "cancelled" \|\| !capabilities.accept} autoFocus rows={3}/></label></>}`
- `src/features/work/components/task-actions.tsx:41` — `{choice.kind === "delete" && <><p>ซ่อนงานนี้จากรายการและรายงาน ผู้ดูแลกู้คืนได้ ประวัติงานยังคงอยู่</p><label>เหตุผลที่ลบ<textarea name="reason" required maxLength={1000} autoFocus rows={3}/></label></>}`
- `src/features/work/components/task-actions.tsx:42` — `{choice.kind === "edit" && <><label>ชื่องาน<input name="title" defaultValue={task.title} required minLength={3} maxLength={180} autoFocus/></label><label>รหัสงาน<input name="jobCode" defaultValue={task.jobCode ?? task.title} required maxLength={180}/></label><label>รายละเอียด<textarea name="description" defaultValue={task.description ?? ""} maxLength={4000}/></label><label>Main KPI<input name="mainKpi" defaultValue={task.mainKpi ?? ""} maxLength={180}/></label><label>Sub KPI<input name="subKpi" defaultValue={task.subKpi ?? ""} maxLength={180}/></label><label>ผู้รับผิดชอบ<select name="ownerId" defaultValue={task.ownerId} required><option value={task.ownerId}>{task.ownerName}</option>{capabilities.assign && task.ownerOptions?.filter(p=>p.id!==task.ownerId).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>กฎ KPI ใหม่<select name="ruleVersionId" defaultValue=""><option value="">คงกฎเดิม</option>{task.kpiOptions?.map(r=><option key={r.id} value={r.id}>{r.mainKpi} / {r.subKpi}</option>)}</select></label><label>SSR Number<input name="ssrNumber" maxLength={180} defaultValue={String(task.extraData?.ssrNumber??"")}/></label><label>OSP Number<input name="ospNumber" maxLength={180} defaultValue={String(task.extraData?.ospNumber??"")}/></label><label>กำหนดส่ง<input type="date" name="dueAt" defaultValue={task.dueAt ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date(task.dueAt)) : ""}/></label><label>ความสำคัญ<select name="priority" defaultValue={task.priority}><option value="low">ต่ำ</option><option value="normal">ปกติ</option><option value="high">สูง</option><option value="urgent">เร่งด่วน</option></select></label></>}`
- `src/features/work/components/task-actions.tsx:43` — `<div className="work-action-row"><button className="primary" disabled={pending}>{pending ? "กำลังบันทึก…" : choice.kind === "delete" ? "ยืนยันลบงาน" : "ยืนยัน"}</button><button type="button" className="secondary-action" disabled={pending} onClick={() => dialog.current?.close()}>ปิด</button></div>{state.message && <p role="status">{state.message}</p>}`
- `src/features/work/components/task-actions.tsx:45` — `</dialog>{!choice && (transitionState.message \|\| editState.message \|\| deleteState.message) && <span role="status">{transitionState.message \|\| editState.message \|\| deleteState.message}</span>}</div>;`
- `src/features/work/components/task-actions.tsx:51` — `return <form ref={formRef} action={action} className="work-note-form" aria-busy={pending}><label htmlFor={&#96;note-${task.id}&#96;}>เพิ่มบันทึก<textarea id={&#96;note-${task.id}&#96;} name="note" rows={3} maxLength={4000} placeholder="เขียนความคืบหน้าเพิ่มเติม" required /></label><IdentityFields task={task} action="note"/><button className="secondary-action" disabled={pending}>{pending ? "กำลังบันทึก…" : "เพิ่มบันทึก"}</button>{state.message && <span role="status">{state.message}</span>}</form>;`

## A-147 — `src/features/work/components/task-kpi-fields.tsx`

- `src/features/work/components/task-kpi-fields.tsx:5` — `const selected=rules.find(r=>r.mainKpi===main&&r.subKpi===sub);`
- `src/features/work/components/task-kpi-fields.tsx:6` — `return <><label>Main KPI<select required value={main} onChange={e=>{setMain(e.target.value);setSub("");}}><option value="">เลือก Main KPI</option>{[...new Set(rules.map(r=>r.mainKpi))].map(value=><option key={value}>{value}</option>)}</select></label><label>Sub KPI<select required value={sub} onChange={e=>setSub(e.target.value)}><option value="">เลือก Sub KPI</option>{rules.filter(r=>r.mainKpi===main).map(r=><option key={r.id}>{r.subKpi}</option>)}</select></label><input name="ruleVersionId" type="hidden" value={selected?.id??""}/>{!rules.length&&<p>ยังไม่มีกฎ KPI ที่ใช้ได้ ให้ผู้ดูแลตั้งค่าก่อนเพิ่มงาน</p>}<label>TYPE ผู้รับเหมา<select name="workType" defaultValue="" required={sub.includes("แจ้ง Job ให้ผู้รับเหมา")}><option value="">ไม่ระบุ</option>{["B1","C1","C2","E1"].map(value=><option key={value}>{value}</option>)}</select></label><label>ผู้รับเหมา<input name="contractorName" maxLength={180}/></label>{sub.includes("ประสานงานอาคาร")&&<><label>อาคาร<input name="building" maxLength={180}/></label><label>ลูกค้า<input name="client" maxLength={180}/></label><label>ผู้รับเหมาอาคาร<input name="contractor" maxLength={180}/></label></>}{sub.toLowerCase().includes("open job sap")&&<label>SSR Number<input name="ssrNumber" maxLength={180}/></label>}{sub.toLowerCase().includes("open job owf")&&<label>OSP Number<input name="ospNumber" maxLength={180}/></label>}</>;`

## A-148 — `src/features/work/components/task-table.tsx`

- `src/features/work/components/task-table.tsx:14` — `return <div className={workspace ? styles.scroll : "work-table-wrap"} role="region" aria-label="รายการงาน เลื่อนแนวนอนได้" tabIndex={0}><table className={workspace ? styles.table : "work-data-table"}><caption className="sr-only">รายการงานในขอบเขตสิทธิ์ของคุณ</caption><thead><tr><th scope="col">งาน / Job</th><th scope="col">ผู้รับผิดชอบ</th><th scope="col">KPI</th><th scope="col">กำหนด</th><th scope="col">สถานะ</th><th scope="col">คำสั่ง</th></tr></thead><tbody>{tasks.map((task) => { const caps = taskCapabilities(subject, task); return <tr key={task.id}><td><Link className={workspace ? styles.taskLink : "work-task-link"} href={&#96;/work?record=${task.id}&#96;}><TruncatedText text={task.title} lines={1}/></Link><span className={workspace ? styles.meta : "work-task-meta"}><TruncatedText text={task.jobCode \|\| "ยังไม่มีรหัสงาน"} lines={1}/> · อัปเดต {formatWorkspaceDate(task.updatedAt)}</span>{showNotes && <span className={workspace ? styles.note : "work-task-note"}>{task.note \|\| "ยังไม่มีบันทึกเพิ่มเติม"}</span>}</td><td><div className={workspace ? styles.person : undefined}>{workspace && <span className={styles.initials} aria-hidden="true">{task.ownerName.slice(0, 2)}</span>}<div><TruncatedText text={task.ownerName} lines={1}/><span className={workspace ? styles.meta : "work-task-meta"}><TruncatedText text={task.teamName} lines={1}/></span></div></div></td><td><TruncatedText text={task.mainKpi \|\| "ยังไม่ระบุ"} lines={1}/><span className={workspace ? styles.meta : "work-task-meta"}><TruncatedText text={task.subKpi \|\| "ยังไม่มี Sub KPI"} lines={1}/></span></td><td>{task.dueAt ? formatWorkspaceDate(task.dueAt) : "ไม่กำหนด"}</td><td><StatusBadge label={task.statusLabel} tone={task.status === "completed" ? "success" : task.status === "blocked" ? "warning" : task.status === "cancelled" ? "danger" : task.status === "in_progress" ? "info" : "neutral"}/></td><td>{(caps.update \|\| caps.delete) ? <TaskActionControls task={task} capabilities={caps}/> : <span className="work-action-muted">ดูอย่างเดียว</span>}</td></tr>})}</tbody></table></div>;`
- `src/features/work/components/task-table.tsx:19` — `return <article className="work-task-detail"><div className="work-task-detail-head"><div><span className="work-eyebrow"><TruncatedText text={task.jobCode \|\| "งานที่ไม่มีรหัส"} lines={1}/></span><h2><TruncatedText text={task.title} lines={2}/></h2><p><TruncatedText text={task.description \|\| "ยังไม่มีรายละเอียดงาน"} lines={3}/></p></div><StatusBadge label={task.statusLabel} tone={task.status === "completed" ? "success" : task.status === "blocked" ? "warning" : task.status === "cancelled" ? "danger" : "info"}/></div><dl className="work-detail-grid"><div><dt>ผู้รับผิดชอบ</dt><dd><TruncatedText text={task.ownerName} lines={1}/></dd></div><div><dt>ทีม</dt><dd><TruncatedText text={task.teamName} lines={1}/></dd></div><div><dt>Main KPI</dt><dd><TruncatedText text={task.mainKpi \|\| "ยังไม่ระบุ"} lines={1}/></dd></div><div><dt>Sub KPI</dt><dd><TruncatedText text={task.subKpi \|\| "ยังไม่ระบุ"} lines={1}/></dd></div><div><dt>กำหนด</dt><dd>{task.dueAt ? formatWorkspaceDate(task.dueAt) : "ไม่กำหนด"}</dd></div><div><dt>น้ำหนัก</dt><dd><TruncatedText text={task.kpiWeight \|\| "ยังไม่ระบุจากกฎ KPI"} lines={1}/></dd></div></dl>{task.notes?.length ? <section><h3>บันทึกที่ผ่านมา</h3><ul>{task.notes.map(note=><li key={note.id}>{formatWorkspaceDate(note.createdAt)} · {note.body}</li>)}</ul></section> : null}{(caps.update \|\| caps.note \|\| caps.delete) ? <><TaskActionControls task={task} capabilities={caps}/>{caps.note && <TaskNoteForm task={task}/>}</> : <p className="work-action-muted">บัญชีนี้มีสิทธิ์ดูรายละเอียด แต่ยังไม่มีสิทธิ์เปลี่ยนแปลงงาน</p>}</article>;`

## A-149 — `src/features/work/components/work-filters.tsx`

- `src/features/work/components/work-filters.tsx:9` — `const fields = <><label>ปี<input type="number" name="year" min={2000} max={2200} defaultValue={filters.year}/></label><label>เดือน<select name="month" defaultValue={filters.month ?? ""}><option value="">ทุกเดือน</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i+1}>{i+1}</option>)}</select></label><label>สถานะ<select name="status" defaultValue={filters.status ?? ""}><option value="">ทุกสถานะ</option><option value="queued">รอรับงาน</option><option value="in_progress">กำลังทำ</option><option value="blocked">พักงาน</option><option value="completed">เสร็จสิ้น</option><option value="cancelled">ยกเลิก</option></select></label><label>ทีม<select name="team" defaultValue={filters.team ?? ""}><option value="">ทุกทีม</option>{teams.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><label>แหล่งที่มา<select name="source" defaultValue={filters.source ?? ""}><option value="">ทุกแหล่ง</option><option value="personal">งานส่วนตัว</option><option value="assigned">มอบหมาย</option><option value="legacy">ข้อมูลเดิม</option></select></label></>;`
- `src/features/work/components/work-filters.tsx:11` — `const count = [filters.year, filters.month, filters.status, filters.team, filters.source].filter(value => value !== undefined && value !== "").length;`
- `src/features/work/components/work-filters.tsx:16` — `{filters.owner && <input type="hidden" name="owner" value={filters.owner}/>}`
- `src/features/work/components/work-filters.tsx:19` — `return <FilterBar method="get" className="work-panel work-form-grid work-filters" aria-label="ตัวกรองงาน"><label>ค้นหา Job / ชื่องาน<input type="search" name="q" defaultValue={filters.q}/></label>{fields}{filters.owner && <input type="hidden" name="owner" value={filters.owner}/>}<Button variant="secondary" type="submit">ใช้ตัวกรอง</Button></FilterBar>;`

## A-150 — `src/features/work/components/work-screen-shell.tsx`

- `src/features/work/components/work-screen-shell.tsx:6` — `export function WorkScreenShell({ title, description, parent, action, children, appearance = "default" }: { title: string; description: string; parent?: { label: string; href: string }; action?: React.ReactNode; children: React.ReactNode; appearance?: "default" \| "workspace" }) {`
- `src/features/work/components/work-screen-shell.tsx:8` — `return <div className={&#96;work-native${workspace ? " work-rollout" : ""}&#96;} data-ui-screen data-work-appearance={appearance} data-work-rollout-content={workspace ? "" : undefined}><PageHeader title={title} description={description} parent={parent ?? { label: "ภาพรวม", href: "/" }} actions={action} className="page-enter" />{children}</div>;`
- `src/features/work/components/work-screen-shell.tsx:15` — `export function WorkEmpty({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {`
- `src/features/work/components/work-screen-shell.tsx:19` — `export function WorkMetricStrip({ metrics }: { metrics: Array<{ label: string; value: string \| number; detail: string; tone?: "neutral" \| "info" \| "success" \| "warning" \| "danger" }> }) {`

## A-151 — `src/features/work/screens/assignment-center.tsx`

- `src/features/work/screens/assignment-center.tsx:17` — `return <WorkScreenShell title="ศูนย์มอบหมายงาน" description="เลือกทีม ผู้รับผิดชอบ และ KPI แล้วตรวจ deadline ก่อนมอบหมาย" parent={{label:"ภาพรวมทีม",href:"/work/team"}} appearance={appearance}>`
- `src/features/work/screens/assignment-center.tsx:19` — `{model.source.status!=="ready"?<WorkUnavailable message="ยังโหลดข้อมูลสำหรับมอบหมายไม่ได้" detail={model.source.message}/>:model.assignmentOptions.length?<form ref={formRef} action={action} className="work-panel work-assignment-form work-rollout-assignment ui-form" aria-busy={pending}><div className="work-form-intro"><div><h2>รายละเอียดการมอบหมาย</h2><p>กำหนดผู้รับผิดชอบ KPI และรายการงานก่อนตรวจ deadline</p></div></div><input type="hidden" name="idempotencyKey" value={model.creationKey}/><fieldset disabled={pending\|\|previewPending} className="work-form-grid"><label>ทีม<select name="teamId" value={teamId} onChange={e=>setTeamId(e.target.value)} required><option value="">เลือกทีม</option>{teams.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><label>ผู้รับผิดชอบ<select name="assigneeId" key={teamId} defaultValue="" required><option value="">เลือกผู้รับผิดชอบ</option>{model.assignmentOptions.filter(p=>p.teamId===teamId).map(p=><option key={&#96;${p.id}:${p.teamId}&#96;} value={p.id}>{p.name}</option>)}</select></label><TaskKpiFields key={teamId+model.creationKey} rules={model.kpiOptions.filter(r=>r.teamId===teamId)}/><label>ชื่อชุดงาน<input name="title" required minLength={3} maxLength={180}/></label><label>ความสำคัญ<select name="priority" defaultValue="normal"><option value="low">ต่ำ</option><option value="normal">ปกติ</option><option value="high">สูง</option><option value="urgent">เร่งด่วน</option></select></label><label className="work-form-span-2">Job / งานย่อย (สูงสุด 20 รายการ)<textarea name="jobs" required maxLength={4000} rows={5}/></label><label className="work-form-span-2">หมายเหตุ<textarea name="notes" maxLength={4000}/></label></fieldset><div className="work-form-actions work-rollout-form-actions"><button className="btn-secondary" type="button" onClick={event=>{const form=event.currentTarget.form;if(form)startTransition(()=>previewAction(new FormData(form)));}} disabled={pending\|\|previewPending}>ดู deadline ล่วงหน้า</button><p role="status">{preview.message}</p><button className="btn-primary" disabled={pending\|\|previewPending}>{pending?"กำลังมอบหมาย…":"มอบหมายงาน"}</button><p role="status">{state.message}</p></div></form>:<WorkEmpty title="ยังไม่มีผู้รับผิดชอบในขอบเขต" detail="ให้ผู้ดูแลกำหนดทีมและสิทธิ์การมอบหมาย"/>}</WorkScreenShell>;`

## A-152 — `src/features/work/screens/job-tracker.tsx`

- `src/features/work/screens/job-tracker.tsx:16` — `const groups = useMemo(() => model.jobGroups.filter((group) => (!ownerId \|\| group.tasks.some((task) => task.ownerId === ownerId)) && (!query.trim() \|\| &#96;${group.label} ${group.tasks.map((task) => &#96;${task.title} ${task.ownerName} ${task.jobCode ?? ""}&#96;).join(" ")}&#96;.toLocaleLowerCase("th-TH").includes(query.trim().toLocaleLowerCase("th-TH")))), [model.jobGroups, ownerId, query]);`
- `src/features/work/screens/job-tracker.tsx:18` — `return <WorkScreenShell title="Job Tracker" description="ค้นหา Job code และเปิดดูงานย่อยทั้งหมดโดยไม่ตัดรายการที่ถูกต้อง" parent={{ label: "งานของทีม", href: "/work/team" }} appearance={appearance}>`
- `src/features/work/screens/job-tracker.tsx:20` — `<section className="work-panel work-rollout-tracker-panel"><div className="work-section-head"><div><span className="work-eyebrow">Job Tracker</span><h2>ติดตามงานตาม Job</h2><p>หนึ่ง Job อาจมีหลายงานย่อย แต่ละรายการมีสถานะ ผู้รับผิดชอบ และกำหนดของตัวเอง</p></div><span className="work-form-count">{groups.length} กลุ่ม</span></div><label className="work-search-field">ค้นหา Job code ชื่องาน หรือผู้รับผิดชอบ<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="เช่น JOB-001 หรือชื่อผู้รับผิดชอบ" /></label>{groups.length ? <div className="work-card-stagger"><div className="work-job-list">{groups.map((group) => <article className="work-premium-card work-job-group" key={group.key}><button className="work-job-toggle" type="button" aria-expanded={expanded === group.key} onClick={() => setExpanded(expanded === group.key ? null : group.key)}><span><strong><TruncatedText text={group.label} lines={1}/></strong><small>{group.hasJobCode ? "รหัสงานจากข้อมูลระบบ" : "ยังไม่มีรหัส Job ที่ยืนยัน"} · {group.tasks.length} งานย่อย</small></span><span className="work-job-toggle-action">{expanded === group.key ? "ย่อรายละเอียด" : "ขยายรายละเอียด"}</span></button>{expanded === group.key && <div className="work-job-details">{group.tasks.map((task) => <div className="work-job-task" key={task.id}><div><strong><TruncatedText text={task.title} lines={1}/></strong><span><TruncatedText text={task.ownerName} lines={1}/> · <TruncatedText text={task.teamName} lines={1}/></span><span><TruncatedText text={task.mainKpi \|\| "ยังไม่ระบุ KPI"} lines={1}/> · กำหนด {task.dueAt ? formatWorkspaceDate(task.dueAt) : "ไม่กำหนด"}</span></div><details><summary>บันทึกและประวัติ</summary><WorkTaskDetail task={task} subject={subject}/><p>{task.note}</p>{task.notes?.map(note => <p key={note.id}>{formatWorkspaceDate(note.createdAt)} · {note.body}</p>)}<ol>{task.timeline?.map(event => <li key={event.id}><time>{formatWorkspaceDate(event.occurredAt)}</time> · {event.label}{event.reason && <p>{event.reason}</p>}</li>)}</ol></details><StatusBadge label={task.statusLabel} tone={task.status === "completed" ? "success" : task.status === "blocked" ? "warning" : task.status === "cancelled" ? "danger" : "info"}/></div>)}</div>}</article>)}</div></div> : <WorkEmpty title="ไม่พบ Job ที่ตรงกับคำค้น" detail={query ? "ลองใช้รหัสงาน ชื่องาน หรือชื่อผู้รับผิดชอบที่สั้นลง" : "ยังไม่มีงานที่มีข้อมูล Job ในขอบเขตของคุณ"} />}</section>`

## A-153 — `src/features/work/screens/kpi-workspace.tsx`

- `src/features/work/screens/kpi-workspace.tsx:10` — `return <WorkScreenShell title="KPI ของฉัน" description="เข้าใจคะแนนจากงานจริง เป้าหมาย ช่วงเวลา และ SLA โดยไม่ต้องอ่านรหัสภายใน" parent={{ label: "งานและ KPI", href: "/work" }} appearance={appearance}>`
- `src/features/work/screens/kpi-workspace.tsx:12` — `{model.personalAssignments.length > 0 && <section className="work-panel work-premium-card"><h2>กฎและน้ำหนัก KPI ของฉัน</h2><ul>{model.personalAssignments.map((row,i)=><li key={i}>{row.name} · {row.weight}% · รุ่น {row.version} · {row.enabled ? "ใช้งาน" : "ไม่ใช้"}</li>)}</ul><p>กฎนี้ใช้กับงานใหม่ งานเดิมเก็บน้ำหนักและกฎที่ใช้ตอนสร้าง</p></section>}{model.kpiCards.length ? <section className="work-card-stagger"><h2 className="work-eyebrow">ตัวชี้วัดหลัก</h2><div className="work-kpi-business-grid">{model.kpiCards.map((card) => <article className="work-premium-card work-kpi-business-card" key={card.id}><div className="work-kpi-card-head"><div><span className="work-eyebrow">ตัวชี้วัด</span><h2><TruncatedText text={card.metric} lines={1}/></h2></div><strong><TruncatedText text={card.actual} lines={1}/> <small>{card.unit}</small></strong></div><dl><div><dt>เป้าหมาย</dt><dd>{card.target ?? "ยังไม่มีเป้าหมายที่อนุมัติ"}</dd></div><div><dt>ความคืบหน้า</dt><dd>{card.progress === null ? "ยังคำนวณไม่ได้" : &#96;${card.progress}%&#96;}</dd></div><div><dt>ช่วงเวลา</dt><dd>{formatWorkspaceDate(card.periodStart)} – {formatWorkspaceDate(card.periodEnd)}</dd></div><div><dt>หลักฐานงาน</dt><dd>{card.factCount.toLocaleString("th-TH")} รายการ</dd></div><div><dt>น้ำหนัก</dt><dd>{card.weight ?? "ยังไม่มีน้ำหนักจากกฎที่อนุมัติ"}</dd></div></dl><p className="work-kpi-footnote">คำนวณล่าสุด {formatWorkspaceDate(card.calculatedAt, true)}</p></article>)}</div></section> : <WorkEmpty title="ยังไม่มีผล KPI ที่เผยแพร่" detail="เมื่อมีผลคำนวณจากกฎและข้อมูลที่อนุมัติแล้ว ระบบจะแสดงเป้าหมาย ผลจริง ความคืบหน้า และงานที่นำมาคิดที่นี่" />}`
- `src/features/work/screens/kpi-workspace.tsx:13` — `{model.facts.length > 0 && <section className="work-panel"><div className="work-section-head"><div><h2>หลักฐานที่ใช้คำนวณ</h2><p>รายละเอียดทางเทคนิคอยู่ในส่วนตรวจสอบ และไม่รบกวนการอ่าน KPI หลัก</p></div></div><details className="work-technical-details"><summary>เปิดรายละเอียดตรวจสอบ</summary><div className="work-table-wrap"><table className="work-data-table"><thead><tr><th>ตัวชี้วัด</th><th>ค่า</th><th>สถานะ</th><th>วันที่</th><th>เวอร์ชันการคำนวณ</th></tr></thead><tbody>{model.facts.map((fact) => <tr key={fact.id}><td>{fact.metric}</td><td>{fact.value}</td><td>{fact.status === "applied" ? "นำไปคำนวณ" : "กลับรายการ"}</td><td>{formatWorkspaceDate(fact.occurredAt)}</td><td>{fact.calculationVersion}</td></tr>)}</tbody></table></div></details></section>}`

## A-154 — `src/features/work/screens/my-tasks-workspace.tsx`

- `src/features/work/screens/my-tasks-workspace.tsx:14` — `type Props = { model: WorkReadModel; subject?: AuthorizationSubject; userId: string; canCreate?: boolean; filters?: ReactNode };`
- `src/features/work/screens/my-tasks-workspace.tsx:27` — `<PageHeader className={styles.pageHeader} title="งานของฉัน" description="จัดลำดับงาน ติดตามกำหนด และทำงานต่อจากจุดที่ค้างไว้" parent={{ label: "งานและ KPI", href: "/work" }} actions={canCreate ? <Link className="btn-primary" href="/work/new"><WorkspaceIcon name="info" size={18}/>เพิ่มงานใหม่</Link> : undefined}/>`
- `src/features/work/screens/my-tasks-workspace.tsx:38` — `<div className={styles.listMeta}><p role="status">{mine.length ? &#96;แสดง ${number(result.start)}–${number(result.end)} จาก ${number(result.total)} งานในผลลัพธ์นี้&#96; : "ยังไม่มีงานที่ตรงกับเงื่อนไข"}</p><label>เรียงตาม<select value={sort} onChange={event => { setSort(event.target.value as WorkListSort); setPage(1); }}><option value="recent">ลำดับจากระบบ</option><option value="due">กำหนดส่งใกล้ที่สุด</option><option value="title">ชื่องาน ก–ฮ</option></select></label></div>`
- `src/features/work/screens/my-tasks-workspace.tsx:40` — `<footer className={styles.footer}><label>แสดงต่อหน้า<select value={size} onChange={event => { setSize(Number(event.target.value)); setPage(1); }}>{[10, 25, 50].map(value => <option key={value} value={value}>{value} งาน</option>)}</select></label><nav aria-label="หน้ารายการงาน" className={styles.pagination}><button type="button" disabled={result.page <= 1} onClick={() => setPage(result.page - 1)} aria-label="หน้าก่อนหน้า"><span aria-hidden="true">‹</span></button><span aria-live="polite">หน้า <strong>{number(result.page)}</strong> / {number(result.pages)}</span><button type="button" disabled={result.page >= result.pages} onClick={() => setPage(result.page + 1)} aria-label="หน้าถัดไป"><span aria-hidden="true">›</span></button></nav></footer>`

## A-155 — `src/features/work/screens/my-work.tsx`

- `src/features/work/screens/my-work.tsx:19` — `if (createOpen && dialog && !dialog.open) dialog.showModal();`
- `src/features/work/screens/my-work.tsx:32` — `<WorkMetricStrip metrics={[{ label: "งานทั้งหมด", value: mine.length, detail: "ในขอบเขตของฉัน" }, { label: "รอเริ่ม", value: overview.queued, detail: "รอรับหรือเริ่มงาน", tone: "info" }, { label: "ควรเร่ง", value: overview.overdue, detail: "เกินกำหนด", tone: "danger" }, { label: "ความคืบหน้า", value: overview.completion === null ? "—" : &#96;${overview.completion}%&#96;, detail: "ถ่วงน้ำหนักตามงาน", tone: "success" }]} />`
- `src/features/work/screens/my-work.tsx:33` — `{mine.length === 500 && <p role="status">แสดง 500 งานล่าสุดของคุณ ความคืบหน้าคำนวณจากรายการที่แสดง ใช้ตัวกรองในรายการทั้งหมดเพื่อดูช่วงที่ต้องการ</p>}`
- `src/features/work/screens/my-work.tsx:35` — `{model.activities.length > 0 && <section className="work-panel work-card-stagger"><div className="work-section-head"><div><h2>กิจกรรมล่าสุด</h2><p>การเปลี่ยนแปลงที่เกี่ยวข้องกับงานในขอบเขตของคุณ</p></div><Link className="text-btn" href="/work?view=activity">ดูทั้งหมด</Link></div><ol className="work-activity-list">{model.activities.slice(0, 6).map((event) => <li key={event.id}><span className="work-activity-dot" aria-hidden="true" /><div><strong>{event.eventLabel}</strong><span>{event.ownerName} · {new Date(event.occurredAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</span></div></li>)}</ol></section>}`
- `src/features/work/screens/my-work.tsx:36` — `{createOpen && (`
- `src/features/work/screens/my-work.tsx:52` — `return <WorkScreenShell title="งานของฉัน" description="รายการงานส่วนตัวและงานที่ได้รับมอบหมาย พร้อมสถานะที่อัปเดตได้ตามสิทธิ์" parent={{ label: "งานและ KPI", href: "/work" }} appearance="workspace">{mine.length ? <WorkTaskTable tasks={mine} subject={subject} showNotes appearance="workspace" /> : <WorkEmpty title="ยังไม่มีงานในรายการของคุณ" detail="ลองเพิ่มงาน หรือรอหัวหน้ามอบหมายงานใหม่ให้คุณ" action={canCreate ? <Link className="secondary-action" href="/work/new">เพิ่มงาน</Link> : undefined} />}</WorkScreenShell>;`

## A-156 — `src/features/work/screens/people-overview.tsx`

- `src/features/work/screens/people-overview.tsx:12` — `return <WorkScreenShell title="บุคลากร" description="ดูทีม ภาระงาน สถานะ และผลการทำงาน โดยไม่เกินขอบเขตสิทธิ์ของคุณ" parent={{ label: "งานของทีม", href: "/work/team" }} appearance={appearance}>`
- `src/features/work/screens/people-overview.tsx:14` — `<WorkMetricStrip metrics={[{ label: "บุคลากร", value: people.length, detail: "ที่อยู่ในขอบเขตการดู" }, { label: "กำลังทำงาน", value: people.reduce((sum, person) => sum + person.inProgress, 0), detail: "งานที่กำลังดำเนินการ", tone: "info" }, { label: "ติดขัด", value: people.reduce((sum, person) => sum + person.onHold, 0), detail: "งานที่ต้องช่วยแก้", tone: "warning" }, { label: "เกินกำหนด", value: people.reduce((sum, person) => sum + person.overdue, 0), detail: "งานที่ควรติดตาม", tone: "danger" }]} />`

## A-157 — `src/features/work/screens/reports.tsx`

- `src/features/work/screens/reports.tsx:8` — `return <WorkScreenShell title="รายงานงาน" description="สรุปความคืบหน้าและ SLA ด้วยค่าที่มาจากงานในขอบเขตสิทธิ์" action={<WorkReportTools/>} parent={{ label: "งานและ KPI", href: "/work" }} appearance={appearance}>`
- `src/features/work/screens/reports.tsx:10` — `<WorkMetricStrip metrics={[{ label: "งานทั้งหมด", value: model.report.taskCount, detail: "รายการที่เข้าถึงได้" }, { label: "ความสำเร็จถ่วงน้ำหนัก", value: model.report.completion === null ? "—" : &#96;${model.report.completion}%&#96;, detail: "ไม่รวมงานที่ยกเลิก", tone: "success" }, { label: "SLA ถ่วงน้ำหนัก", value: model.report.sla === null ? "—" : &#96;${model.report.sla}%&#96;, detail: "จากงานที่เสร็จสิ้น", tone: "info" }, { label: "เกินกำหนด", value: model.report.overdue, detail: "ต้องติดตาม", tone: "danger" }]} />`

## A-158 — `src/features/work/screens/team-command.tsx`

- `src/features/work/screens/team-command.tsx:15` — `<WorkMetricStrip metrics={[{ label: "งานทีม", value: teamTasks.length, detail: "รายการในทีมที่เข้าถึงได้" }, { label: "รอเริ่ม", value: teamTasks.filter((task) => task.status === "queued").length, detail: "รอรับงาน", tone: "info" }, { label: "พักงาน", value: teamTasks.filter((task) => task.status === "blocked").length, detail: "ต้องติดตาม", tone: "warning" }, { label: "เกินกำหนด", value: teamTasks.filter((task) => task.dueAt && Date.parse(task.dueAt) < now && !["completed", "cancelled"].includes(task.status)).length, detail: "ควรเร่งดำเนินการ", tone: "danger" }]} />`

## A-159 — `src/modules/duct-rental/components/attachment-picker.tsx`

- `src/modules/duct-rental/components/attachment-picker.tsx:8` — `export function AttachmentPicker({ label, accept = ".pdf", file, change, disabled = false }: { label: string; accept?: string; file?: File \| null; change: (file: File \| null) => void; disabled?: boolean }) {`
- `src/modules/duct-rental/components/attachment-picker.tsx:17` — `return <div className={styles.workspace}><div className={styles.drop} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); select(event.dataTransfer.files[0]); }}><Button variant="secondary" type="button" onClick={() => { if (!disabled) inputRef.current?.click(); }} disabled={disabled}>{label} · ไม่เกิน 25 MB</Button><input ref={inputRef} id={id} type="file" accept={accept} disabled={disabled} className={styles.pickerInput} tabIndex={-1} aria-label={label} onChange={event => { select(event.target.files?.[0]); event.target.value = ""; }} />{file && <div className={styles.actions}><span className={styles.fileName}>{file.name} · {(file.size / 1024).toFixed(0)} KB</span><button className={styles.button} type="button" disabled={disabled} onClick={() => change(null)}>ยกเลิกไฟล์ที่เลือก</button></div>}</div><Notice text={error} error />`
- `src/modules/duct-rental/components/attachment-picker.tsx:18` — `{preview && <Modal title="ตรวจเอกสารก่อนแนบ" close={() => setPreview(null)}>{url && (preview.name.toLowerCase().endsWith(".pdf") ? <PdfViewer key={url} url={url} blob={preview} name={preview.name} /> : <Image unoptimized src={url} alt={preview.name} width={700} height={500} style={{ maxWidth: "100%", height: "auto", objectFit: "contain" }} />)}<div className={styles.actions}><button className={styles.button} type="button" onClick={() => setPreview(null)}>ยกเลิก</button><button className={styles.primary} type="button" onClick={() => { change(preview); setPreview(null); }}>ยืนยันไฟล์แนบ</button></div></Modal>}`

## A-160 — `src/modules/duct-rental/components/cable-test-workspace.tsx`

- `src/modules/duct-rental/components/cable-test-workspace.tsx:11` — `type Rows=Awaited<ReturnType<typeof listCables>>;`
- `src/modules/duct-rental/components/cable-test-workspace.tsx:12` — `type Row=Rows["rows"][number];`
- `src/modules/duct-rental/components/cable-test-workspace.tsx:26` — `<div className={styles.tableWrap}><table className={styles.table}><caption>รายการพาดสายที่คุณมีสิทธิ์ดู</caption><thead><tr><th scope="col">รหัส / โครงการ</th><th scope="col">หน่วยงาน</th><th scope="col">เส้นทาง</th><th scope="col">ขั้นตอน</th><th scope="col">ดำเนินการ</th></tr></thead><tbody>{model.data?.rows.map(row=><tr key={row.id}><td>{row.code}<div>{row.data.projectName}</div></td><td>{row.data.authority}</td><td>{row.data.routeName\|\|"—"}</td><td>{cableLabels[row.stage]}</td><td><button className={styles.button} onClick={()=>setEditing(row)}>เปิดรายการ</button></td></tr>)}</tbody></table>{!model.data?.rows.length&&<p className={styles.empty}>{model.loading?"กำลังโหลด…":"ยังไม่มีรายการที่ตรงเงื่อนไข"}</p>}</div>`
- `src/modules/duct-rental/components/cable-test-workspace.tsx:28` — `{editing!==undefined&&<Modal title={editing?&#96;${editing.code} · ${cableLabels[editing.stage]}&#96;:"สร้างคำขอพาดสาย"} close={()=>setEditing(undefined)}><CableEditor row={editing} permissions={permissions} done={async()=>{await model.refresh();setEditing(undefined);}}/></Modal>}`
- `src/modules/duct-rental/components/cable-test-workspace.tsx:33` — `const closed=row?.stage==="COMPLETE", canSave=!closed&&permissions.includes(row?"duct_rental.request.update":"duct_rental.request.create"), canAdvance=row&&!closed&&permissions.includes(cablePermission(row.stage));`
- `src/modules/duct-rental/components/cable-test-workspace.tsx:36` — `return <><Notice text={error} error/><div className={styles.grid}><Field label="หน่วยงาน"><select disabled={busy\|\|!editable} value={data.authority} onChange={e=>setData({...data,authority:e.target.value as "PEA"\|"MEA"})}><option>PEA</option><option>MEA</option></select></Field>{fields.map(([key,label])=><Field key={key} label={label}><input disabled={busy\|\|!editable} value={data[key]} maxLength={key==="permitNumber"\|\|key==="submissionNumber"\|\|key==="cableType"?100:200} onChange={e=>setData({...data,[key]:e.target.value})}/></Field>)}<Field label="หมายเหตุ / ผลติดตั้งและตรวจรับ" full><textarea disabled={busy\|\|!editable} value={data.notes} maxLength={4000} onChange={e=>setData({...data,notes:e.target.value})}/></Field></div>`
- `src/modules/duct-rental/components/cable-test-workspace.tsx:38` — `{row&&<Field label="เหตุผลส่งกลับ / หมายเหตุการดำเนินการ"><textarea value={reason} maxLength={2000} disabled={busy} onChange={e=>setReason(e.target.value)}/></Field>}`
- `src/modules/duct-rental/components/cable-test-workspace.tsx:39` — `<div className={styles.actions}>{canSave&&<button className={styles.primary} disabled={busy} onClick={()=>void run("save")}>{row?"บันทึกข้อมูล":"บันทึกร่าง"}</button>}{canAdvance&&<button className={styles.primary} disabled={busy} onClick={()=>setConfirm("advance")}>{cableActionLabels[row.stage]}</button>}{canAdvance&&row?.stage==="SUBMITTED"&&<button className={styles.button} disabled={busy\|\|!reason.trim()} onClick={()=>setConfirm("revise")}>ส่งกลับแก้ไข</button>}{row&&permissions.includes("duct_rental.request.archive")&&<button className={styles.button} disabled={busy} onClick={()=>setConfirm("archive")}>เก็บเข้าประวัติ</button>}</div>`
- `src/modules/duct-rental/components/cable-test-workspace.tsx:40` — `{confirm&&<div className={styles.notice}><p>{confirm==="archive"?"ยืนยันเก็บรายการนี้ออกจากรายการทำงาน โดยคงข้อมูลและประวัติไว้?":confirm==="revise"?"ยืนยันส่งกลับให้แก้ไขแบบและเอกสาร?":"ยืนยันว่าดำเนินการขั้นตอนปัจจุบันครบแล้ว และส่งต่อขั้นถัดไป?"}</p><div className={styles.actions}><button className={styles.primary} disabled={busy} onClick={()=>void run(confirm)}>ยืนยัน</button><button className={styles.button} disabled={busy} onClick={()=>setConfirm(null)}>กลับไปตรวจ</button></div></div>}`
- `src/modules/duct-rental/components/cable-test-workspace.tsx:41` — `{!!row?.history.length&&<section><h3>ประวัติการดำเนินการ</h3><ol>{row.history.map((h,i)=><li key={i}>{new Date(h.at).toLocaleString("th-TH")} · {h.action==="save"?"บันทึกข้อมูล":h.action==="archive"?"เก็บเข้าประวัติ":&#96;${cableLabels[h.from]} → ${cableLabels[h.to]}&#96;}{h.reason&&&#96; · ${h.reason}&#96;}</li>)}</ol></section>}`

## A-161 — `src/modules/duct-rental/components/common.tsx`

- `src/modules/duct-rental/components/common.tsx:41` — `if (online && !error && !paused && at && at !== announcedAtRef.current) {`
- `src/modules/duct-rental/components/common.tsx:55` — `const liveSuffix = online && !error && realtime === "connected" ? " · เชื่อมต่อสดแล้ว" : online && !error && realtime ? " · กำลังเชื่อมต่อสดใหม่" : "";`
- `src/modules/duct-rental/components/common.tsx:97` — `export function Field({ label, children, error, full }: { label: string; children: ReactNode; error?: string; full?: boolean }) {`
- `src/modules/duct-rental/components/common.tsx:100` — `return <div className={&#96;${styles.field} ${full ? styles.full : ""}&#96;}><label htmlFor={controlId}>{label}</label>{control}{error && <small id={id} className={styles.error}>{error}</small>}</div>;`
- `src/modules/duct-rental/components/common.tsx:103` — `export function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {`
- `src/modules/duct-rental/components/common.tsx:110` — `queueMicrotask(() => { if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true }); });`
- `src/modules/duct-rental/components/common.tsx:130` — `{actions && <div className={styles.ductTaskActions}>{actions}</div>}`

## A-162 — `src/modules/duct-rental/components/communication-cable-workspace.tsx`

- `src/modules/duct-rental/components/communication-cable-workspace.tsx:9` — `{ title: "ออกแบบเส้นทาง", owner: "ทีมออกแบบ", detail: "ระบุโครงการ เส้นทาง จุดต้นทาง–ปลายทาง จำนวนเสา และข้อมูลสายสื่อสาร", documents: "แบบเส้นทางและรายละเอียดสาย" },`
- `src/modules/duct-rental/components/communication-cable-workspace.tsx:10` — `{ title: "ตรวจเอกสารและรับงาน", owner: "ทีมขออนุญาต", detail: "ตรวจความครบถ้วนของแบบและข้อมูล ติดต่อหน่วยงานเจ้าของเสา", documents: "แบบเส้นทางและรายการเอกสารประกอบคำขอ" },`
- `src/modules/duct-rental/components/communication-cable-workspace.tsx:11` — `{ title: "ยื่นขออนุญาตพาดสาย", owner: "ทีมขออนุญาต", detail: "บันทึกเลขรับเรื่อง วันที่ยื่น และผู้ประสานงาน ติดตามผลจากหน่วยงาน", documents: "หนังสือขออนุญาตและหลักฐานรับเรื่อง" },`
- `src/modules/duct-rental/components/communication-cable-workspace.tsx:12` — `{ title: "รับใบอนุญาตและเงื่อนไข", owner: "ทีมขออนุญาต", detail: "ตรวจเงื่อนไขการอนุญาต บันทึกเลขใบอนุญาตและระยะเวลาที่อนุญาต รวมถึงค่าใช้จ่ายตามเอกสารหน่วยงาน", documents: "ใบอนุญาต เงื่อนไข และเอกสารค่าใช้จ่ายถ้ามี" },`
- `src/modules/duct-rental/components/communication-cable-workspace.tsx:13` — `{ title: "ยืนยันแบบก่อนติดตั้ง", owner: "ทีมออกแบบ", detail: "ตรวจแบบให้ตรงกับเงื่อนไขใบอนุญาต แล้วส่งมอบงานให้ทีมติดตั้ง", documents: "แบบที่ได้รับอนุญาตและใบส่งมอบงาน" },`
- `src/modules/duct-rental/components/communication-cable-workspace.tsx:14` — `{ title: "ติดตั้งและบันทึกผล", owner: "ทีมติดตั้ง", detail: "ดำเนินงานตามใบอนุญาต บันทึกระยะทาง จำนวนเสา และข้อมูลสายที่ติดตั้งจริง", documents: "ภาพหน้างานและแบบหลังติดตั้ง" },`
- `src/modules/duct-rental/components/communication-cable-workspace.tsx:15` — `{ title: "ตรวจรับและปิดงาน", owner: "ทีมขออนุญาต / ทีมติดตั้ง", detail: "ตรวจเอกสารปิดงานและเงื่อนไขคงค้าง เก็บข้อมูลอ้างอิงสำหรับดูแลสัญญาต่อไป", documents: "หลักฐานตรวจรับและเอกสารปิดงาน" },`
- `src/modules/duct-rental/components/communication-cable-workspace.tsx:24` — `{!embedded && <><PageHeader title="พาดสายสื่อสาร" description="ร่างขั้นตอนขอพาดสายกับการไฟฟ้าส่วนภูมิภาคและการไฟฟ้านครหลวง" /><ModuleNav current="communication-cable" /></>}`
- `src/modules/duct-rental/components/communication-cable-workspace.tsx:27` — `<Field label="หน่วยงานที่ติดต่อ"><select value={authority} onChange={event => setAuthority(event.target.value)}><option value="PEA">PEA · การไฟฟ้าส่วนภูมิภาค</option><option value="MEA">MEA · การไฟฟ้านครหลวง</option></select></Field>`
- `src/modules/duct-rental/components/communication-cable-workspace.tsx:43` — `{step === 2 && !revision && <button className={styles.button} type="button" onClick={() => setRevision(true)}>ทดลองกรณีให้แก้ไข</button>}`

## A-163 — `src/modules/duct-rental/components/design-editor.tsx`

- `src/modules/duct-rental/components/design-editor.tsx:5` — `export type DesignValues = Record<string, string \| number>;`
- `src/modules/duct-rental/components/design-editor.tsx:6` — `export const designSections: { title: string; fields: { name: string; label: string; options?: readonly string[]; area?: boolean; number?: boolean; optional?: boolean }[] }[] = [`
- `src/modules/duct-rental/components/design-editor.tsx:7` — `{ title: "ข้อมูลโครงการและประเภทคำขอ", fields: [{ name: "requestType", label: "ประเภทคำขอ", options: REQUEST_TYPE_OPTIONS.map(item => item.value) }, { name: "projectName", label: "ชื่อโครงการ" }, { name: "routeName", label: "ชื่อเส้นทาง / ถนน" }, { name: "ownerDuct", label: "เจ้าของท่อ", options: OWNER_DUCT_OPTIONS }, { name: "memoNumber", label: "เลขที่ Memo", optional: true }, { name: "routeDetail", label: "รายละเอียดเส้นทาง", area: true }, { name: "jobType", label: "ประเภทของงาน", options: JOB_TYPE_OPTIONS }, { name: "serviceCenter", label: "ศูนย์บริการ", options: SERVICE_CENTER_OPTIONS }, { name: "supportInfo", label: "รองรับ / Support", optional: true }] },`
- `src/modules/duct-rental/components/design-editor.tsx:8` — `{ title: "รายละเอียดสายและพิกัด", fields: [{ name: "cableType", label: "ชนิดสาย", options: CABLE_TYPE_OPTIONS }, { name: "fiberType", label: "Fiber Type", options: [] }, { name: "cableCount", label: "จำนวนสาย (เส้น)", number: true, optional: true }, { name: "diameter", label: "ไดมิตเตอร์ (mm)", number: true }, { name: "distance", label: "ระยะทาง (m)", number: true }, { name: "startCoords", label: "พิกัดต้นทาง" }, { name: "endCoords", label: "พิกัดปลายทาง" }, { name: "subDistrict", label: "ตำบล", optional: true }, { name: "district", label: "อำเภอ / เขต" }, { name: "province", label: "จังหวัด" }, { name: "postalCode", label: "รหัสไปรษณีย์", optional: true }, { name: "uihArea", label: "UIH Area / Contract", optional: true }, { name: "permissionRequestNumber", label: "เลขที่คำขอใช้บริการท่อ", optional: true }] },`
- `src/modules/duct-rental/components/design-editor.tsx:9` — `{ title: "ผู้ประสานงานออกแบบ", fields: [{ name: "designContactName", label: "ชื่อ-สกุลผู้ประสานงานออกแบบ", optional: true }, { name: "designContactPhone", label: "โทรศัพท์ผู้ประสานงานออกแบบ", optional: true }, { name: "designContactEmail", label: "อีเมลผู้ประสานงานออกแบบ", optional: true }] },`
- `src/modules/duct-rental/components/design-editor.tsx:10` — `{ title: "ผู้ประสานหน้างาน", fields: [{ name: "installContactName", label: "ชื่อ-สกุลผู้ประสานหน้างาน", optional: true }, { name: "installContactPhone", label: "โทรศัพท์ผู้ประสานหน้างาน", optional: true }, { name: "installContactEmail", label: "อีเมลผู้ประสานหน้างาน", optional: true }] },`
- `src/modules/duct-rental/components/design-editor.tsx:14` — `const set = (name: string, value: string) => {`
- `src/modules/duct-rental/components/design-editor.tsx:20` — `{field.area ? <textarea name={field.name} value={values[field.name] ?? ""} readOnly={readonly} onChange={event => set(field.name, event.target.value)} /> : field.options ? <select name={field.name} value={values[field.name] ?? ""} disabled={readonly} aria-invalid={!!errors[field.name]} onChange={event => set(field.name, event.target.value)}><option value="">เลือก{field.label}</option>{(field.name === "fiberType" ? getFiberTypeOptions(String(values.cableType ?? "")).map(item => item.fiberType) : field.options).map(value => <option key={value} value={value}>{field.name === "requestType" ? REQUEST_TYPE_OPTIONS.find(item => item.value === value)?.label : value}</option>)}</select> : <input name={field.name} type={field.number ? "number" : "text"} step={field.name === "cableCount" ? "1" : "any"} onBlur={event => { if (field.name === "distance" && event.target.value !== "" && Number.isFinite(Number(event.target.value))) set(field.name, Number(event.target.value).toFixed(2)); }} value={values[field.name] ?? ""} readOnly={readonly \|\| field.name === "diameter"} aria-invalid={!!errors[field.name]} onChange={event => set(field.name, event.target.value)} />}`

## A-164 — `src/modules/duct-rental/components/file-list.tsx`

- `src/modules/duct-rental/components/file-list.tsx:11` — `const filtered = files.filter(file => (!phase \|\| file.phase === phase) && file.name.toLocaleLowerCase("th-TH").includes(query.toLocaleLowerCase("th-TH"))).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name, "th") : b.createdAt.localeCompare(a.createdAt));`
- `src/modules/duct-rental/components/file-list.tsx:12` — `return <section className={styles.panel}><h2>เอกสารที่คุณมีสิทธิ์ดู</h2><div className={styles.filters}><Field label="ค้นหาเอกสาร"><input value={query} onChange={event => { setQuery(event.target.value); setLimit(50); }} /></Field><Field label="ขั้นตอนเอกสาร"><select value={phase} onChange={event => { setPhase(event.target.value); setLimit(50); }}><option value="">ทุกขั้นตอน</option>{[...new Set(files.map(file => file.phase))].map(value => <option key={value} value={value}>{phaseLabels[value as keyof typeof phaseLabels] ?? value}</option>)}</select></Field><Field label="เรียงเอกสาร"><select value={sort} onChange={event => setSort(event.target.value)}><option value="latest">ล่าสุดก่อน</option><option value="name">ชื่อเอกสาร</option></select></Field></div><ul className={styles.fileList}>{filtered.slice(0, limit).map(file => <li key={file.id} className={styles.fileRow}><div><strong>{file.name}</strong><small>{kindLabels[file.fileType] ?? file.fileType} · รุ่น {file.documentVersion} · {(file.sizeBytes / 1024).toFixed(0)} KB · {phaseLabels[file.phase as keyof typeof phaseLabels] ?? file.phase}</small></div><div className={styles.actions}>{file.mediaType === "application/pdf" && <button className={styles.button} type="button" onClick={() => setPreview(file)}>ดูตัวอย่าง</button>}{canExport && <a className={styles.button} href={documentUrl(file.id, true)}>ดาวน์โหลด</a>}</div></li>)}</ul>{!filtered.length && <p className={styles.muted}>ไม่มีเอกสารที่ตรงเงื่อนไขหรืออยู่ในสิทธิ์ของคุณ</p>}{filtered.length > limit && <button className={styles.button} type="button" onClick={() => setLimit(previous => previous + 50)}>แสดงเอกสารเพิ่ม</button>}{preview && <Modal title={preview.name} close={() => setPreview(null)}><PdfViewer url={documentUrl(preview.id)} name={preview.name} /></Modal>}</section>;`

## A-165 — `src/modules/duct-rental/components/pdf-viewer.tsx`

- `src/modules/duct-rental/components/pdf-viewer.tsx:31` — `<div className={styles.actions}><button className={styles.button} type="button" disabled={page <= 1} onClick={() => setPage(previous => previous - 1)}>หน้าก่อน</button><span className={styles.muted}>หน้า {page} / {total \|\| "…"}</span><button className={styles.button} type="button" disabled={page >= total} onClick={() => setPage(previous => previous + 1)}>หน้าถัดไป</button><label className={styles.actions}>ขยาย <select aria-label="ระดับขยาย PDF" value={zoom} onChange={event => setZoom(Number(event.target.value))}>{[0.5, 0.75, 1, 1.25, 1.5, 2].map(value => <option key={value} value={value}>{value * 100}%</option>)}</select></label><button className={styles.button} type="button" onClick={() => setRotation(previous => (previous + 90) % 360)}>หมุนหน้า</button><a className={styles.button} href={url} target="_blank" rel="noopener noreferrer">เปิด PDF / พิมพ์</a></div>`

## A-166 — `src/modules/duct-rental/components/process-workspace.tsx`

- `src/modules/duct-rental/components/process-workspace.tsx:55` — `parent={{ label: "เช่าท่อร้อยสาย", href: "/duct-rental" }}`
- `src/modules/duct-rental/components/process-workspace.tsx:76` — `<option value="">ทุกสถานะ</option>`
- `src/modules/duct-rental/components/process-workspace.tsx:77` — `{Object.entries(labels).map(([code, label]) => <option key={code} value={code}>{label}</option>)}`
- `src/modules/duct-rental/components/process-workspace.tsx:97` — `{rows.filter(row => (!status \|\| row.status === status) && ("year" in row ? String(row.year) : Object.values(row.snapshot).join(" ")).toLocaleLowerCase().includes(query.toLocaleLowerCase())).map(row => (`
- `src/modules/duct-rental/components/process-workspace.tsx:109` — `{!rows.length && <EmptyState title="ยังไม่มีรายการ" description={&#96;ยังไม่มีงาน${kind === "renewal" ? "ต่อสัญญา" : "ยกเลิกการใช้ท่อ"} ที่ตรงกับตัวกรองที่เลือก&#96;} />}`
- `src/modules/duct-rental/components/process-workspace.tsx:119` — `{create && (`
- `src/modules/duct-rental/components/process-workspace.tsx:147` — `const transition = renewalTransitions[row.status as keyof typeof renewalTransitions], canReview = row.status === "draft" && !row.archivedAt && row.capabilities.includes("duct_rental.renewal.review"), pending = row.routes.filter(route => route.reviewStatus === "pending").length;`
- `src/modules/duct-rental/components/process-workspace.tsx:148` — `const filtered = row.routes.filter(route => (!filter \|\| route.reviewStatus === filter) && Object.values(route.snapshot).join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase()));`
- `src/modules/duct-rental/components/process-workspace.tsx:166` — `if (action === "advance" && contract) {`
- `src/modules/duct-rental/components/process-workspace.tsx:171` — `await apiPost(&#96;renewals/${row.id}/${action}&#96;, { version: row.version, ...(action === "advance" && row.status === "provider_confirmed" ? { contractNumber, thirdPartyNotes: notes, ...(selected ? { contractDocumentId: selected } : {}) } : {}) });`
- `src/modules/duct-rental/components/process-workspace.tsx:181` — `<PageHeader title={&#96;ต่อสัญญาปี ${row.year + 543} (${row.year})&#96;} description={renewalLabels[row.status]} parent={{ label: "ต่อสัญญารายปี", href: "/duct-rental/renewal" }} />`
- `src/modules/duct-rental/components/process-workspace.tsx:185` — `{row.archivedAt && <Notice text="งานนี้เก็บเข้าประวัติแล้ว" />}`
- `src/modules/duct-rental/components/process-workspace.tsx:199` — `<option value="">ทุกผลการตรวจ</option><option value="pending">รอตรวจ</option><option value="keep">คงไว้</option><option value="drop">ตัดออก</option>`
- `src/modules/duct-rental/components/process-workspace.tsx:226` — `<td>{canReview && (`
- `src/modules/duct-rental/components/process-workspace.tsx:237` — `{!filtered.length && <EmptyState title="ไม่มีเส้นทางที่ตรงเงื่อนไข" description="ปรับตัวกรองค้นหาหรือผลการตรวจ แล้วลองอีกครั้ง" />}`
- `src/modules/duct-rental/components/process-workspace.tsx:238` — `{filtered.length > limit && <Button variant="secondary" type="button" onClick={() => setLimit(previous => previous + 50)}>แสดงอีก 50 เส้นทาง</Button>}`
- `src/modules/duct-rental/components/process-workspace.tsx:239` — `{["provider_confirmed", "contracted"].includes(row.status) && (`
- `src/modules/duct-rental/components/process-workspace.tsx:249` — `{row.status === "provider_confirmed" && <AttachmentPicker label="สัญญารายปี (PDF)" file={contract} disabled={busy \|\| !row.capabilities.includes("duct_rental.renewal.contract") \|\| !row.capabilities.includes("duct_rental.document.upload")} change={file => { setContract(file); edited(); }} />}`
- `src/modules/duct-rental/components/process-workspace.tsx:256` — `{row.capabilities.includes("duct_rental.document.export") && <ButtonLink variant="secondary" href={documentUrl(doc.id, true)}>ดาวน์โหลด</ButtonLink>}`
- `src/modules/duct-rental/components/process-workspace.tsx:263` — `{transition && !row.archivedAt && row.capabilities.includes(transition.permission) && (`
- `src/modules/duct-rental/components/process-workspace.tsx:264` — `<Button variant="primary" type="button" disabled={busy \|\| row.status === "draft" && !!pending \|\| row.status === "provider_confirmed" && !contract && !documentId} onClick={() => setConfirm("advance")}>`
- `src/modules/duct-rental/components/process-workspace.tsx:268` — `{!row.archivedAt && row.capabilities.includes("duct_rental.renewal.archive") && (`
- `src/modules/duct-rental/components/process-workspace.tsx:273` — `{review && (`
- `src/modules/duct-rental/components/process-workspace.tsx:281` — `{confirm && (`
- `src/modules/duct-rental/components/process-workspace.tsx:287` — `{preview && (`
- `src/modules/duct-rental/components/process-workspace.tsx:312` — `<PageHeader title="ขอยกเลิกการใช้ท่อ" parent={{ label: "ยกเลิกการใช้ท่อ", href: "/duct-rental/cancellation" }} />`
- `src/modules/duct-rental/components/process-workspace.tsx:320` — `<option value="">เลือกเส้นทาง</option>`
- `src/modules/duct-rental/components/process-workspace.tsx:321` — `{row && !list.data?.rows.some(item => item.id === row.id) && <option value={row.id}>{row.code} · {row.projectName}</option>}`
- `src/modules/duct-rental/components/process-workspace.tsx:322` — `{list.data?.rows.map(item => <option key={item.id} value={item.id}>{item.code} · {item.projectName} · {item.routeName}</option>)}`
- `src/modules/duct-rental/components/process-workspace.tsx:326` — `{row && (`
- `src/modules/duct-rental/components/process-workspace.tsx:342` — `{confirm && (`
- `src/modules/duct-rental/components/process-workspace.tsx:381` — `<PageHeader title={&#96;ยกเลิกการใช้ท่อ ${row.snapshot.code}&#96;} description={row.snapshot.projectName} parent={{ label: "ยกเลิกการใช้ท่อ", href: "/duct-rental/cancellation" }} />`
- `src/modules/duct-rental/components/process-workspace.tsx:405` — `{!closed && row.capabilities.includes("duct_rental.cancellation.advance") && (`
- `src/modules/duct-rental/components/process-workspace.tsx:410` — `{!closed && row.capabilities.includes("duct_rental.cancellation.reject") && (`
- `src/modules/duct-rental/components/process-workspace.tsx:413` — `{!row.archivedAt && row.capabilities.includes("duct_rental.cancellation.archive") && (`
- `src/modules/duct-rental/components/process-workspace.tsx:418` — `{confirm && (`
- `src/modules/duct-rental/components/process-workspace.tsx:420` — `<p>{confirm === "advance" && row.status === "tracking" ? "เมื่อยืนยัน ระบบจะบันทึกงานและเปลี่ยนเส้นทางเป็นยกเลิกโดยใช้วันที่มีผลตามคำขอ" : "ระบบจะเก็บสถานะ หมายเหตุ และประวัติผู้ดำเนินการ"}</p>`

## A-167 — `src/modules/duct-rental/components/request-form.tsx`

- `src/modules/duct-rental/components/request-form.tsx:23` — `export type FormIdentity = { id: string; displayName: string; email: string };`
- `src/modules/duct-rental/components/request-form.tsx:24` — `export type FormOptions = { teams: { id: string; name: string }[]; coordinators: { id: string; display_name: string; email: string; phone: string }[] };`
- `src/modules/duct-rental/components/request-form.tsx:27` — `type RequestSync = { online: boolean; error: string; at?: string; refresh: () => unknown; changed?: boolean; realtime?: string };`
- `src/modules/duct-rental/components/request-form.tsx:35` — `const readonly = !!request && (request.phase === "COMPLETE" \|\| request.archivedAt != null \|\| request.cancelledAt != null);`
- `src/modules/duct-rental/components/request-form.tsx:59` — `const canSave = !readonly && caps.includes(savedId ? "duct_rental.request.update" : "duct_rental.request.create");`
- `src/modules/duct-rental/components/request-form.tsx:60` — `const canSubmit = !readonly && (!request \|\| request.phase === "DESIGN") && caps.includes("duct_rental.design.submit") && (savedId ? true : caps.includes("duct_rental.request.create"));`
- `src/modules/duct-rental/components/request-form.tsx:84` — `const leave = (event: MouseEvent<HTMLAnchorElement>) => { if (dirty && !window.confirm("มีข้อมูลที่ยังไม่ได้บันทึก ต้องการออกจากหน้านี้หรือไม่")) event.preventDefault(); };`
- `src/modules/duct-rental/components/request-form.tsx:86` — `{ id: "design", label: "Design" }, { id: "documents", label: "Documents" }, { id: "review", label: "Review" },`
- `src/modules/duct-rental/components/request-form.tsx:87` — `{ id: "nt-form", label: "NT Form" }, { id: "signing", label: "Signing" }, { id: "complete", label: "Complete", disabled: !request \|\| request.phase !== "COMPLETE" },`
- `src/modules/duct-rental/components/request-form.tsx:89` — `const documents = caps.includes("duct_rental.document.upload") && !readonly ? <Panel title="เอกสารจากทีมออกแบบ"><div className={styles.attachmentStack}><AttachmentPicker label="Memo (ถ้ามี)" file={memo} change={file => { setMemo(file); setDirty(true); pause?.(true); }} /><AttachmentPicker label="แบบท่อจากทีมออกแบบ (ถ้ามี)" file={drawing} change={file => { setDrawing(file); setDirty(true); pause?.(true); }} /></div></Panel> : <EmptyState title="ไม่มีเอกสารที่ต้องแนบ" description="คุณสามารถดำเนินการต่อได้โดยไม่แนบเอกสาร" />;`
- `src/modules/duct-rental/components/request-form.tsx:91` — `<PageHeader title={request ? &#96;แก้ไขคำขอ ${request.code}&#96; : "สร้างคำขอเช่าท่อร้อยสาย"} parent={{ label: "เช่าท่อร้อยสาย", href: "/duct-rental" }} description="บันทึกร่างได้ และกรอกข้อมูลให้ครบก่อนส่งให้ทีมเขียนแบบ" />`
- `src/modules/duct-rental/components/request-form.tsx:93` — `{sync && <DuctSyncUtility {...sync} paused={busy \|\| dirty} />}`
- `src/modules/duct-rental/components/request-form.tsx:95` — `<Notice text={error} error /><Notice text={message} />{readonly && <Notice text="คำขอนี้สิ้นสุดแล้ว ข้อมูลออกแบบแสดงแบบอ่านอย่างเดียว" />}`
- `src/modules/duct-rental/components/request-form.tsx:100` — `{section === "design" && <DesignEditor values={values} change={change} errors={errors} readonly={!canSave && !canSubmit} />}`
- `src/modules/duct-rental/components/request-form.tsx:101` — `{section === "documents" && documents}`
- `src/modules/duct-rental/components/request-form.tsx:102` — `{section === "review" && <Panel title="Review"><TableRegion label="ตารางตรวจสอบข้อมูลคำขอ เลื่อนแนวนอนได้" className={styles.reviewTableWrap}><table className={styles.reviewTable}><caption className={styles.visuallyHidden}>ข้อมูลที่กรอกในแบบคำขอ</caption><thead><tr><th scope="col">รายการ</th><th scope="col">ข้อมูล</th></tr></thead><tbody>{required.map(name => <tr key={name}><th scope="row">{name}</th><td>{String(values[name] ?? "—") \|\| "—"}</td></tr>)}</tbody></table></TableRegion></Panel>}`
- `src/modules/duct-rental/components/request-form.tsx:103` — `{section === "nt-form" && <Panel title="NT Form"><p className={styles.muted}>ตรวจสอบข้อมูล Design และเอกสารให้ครบก่อนดำเนินการ</p></Panel>}`
- `src/modules/duct-rental/components/request-form.tsx:104` — `{section === "signing" && <Panel title="Signing"><p className={styles.muted}>ยังไม่สามารถลงนามได้ในขั้นตอนออกแบบ</p></Panel>}`
- `src/modules/duct-rental/components/request-form.tsx:105` — `{section === "complete" && <Panel title="Complete"><p>คำขอนี้เสร็จสมบูรณ์แล้ว</p></Panel>}`
- `src/modules/duct-rental/components/request-form.tsx:107` — `{!request && <Panel title="ทีมเจ้าของคำขอ"><FormField label="ทีมเจ้าของคำขอ"><select value={teamId} disabled={busy \|\| !canSave} onChange={event => setTeamId(event.target.value)}><option value="">ไม่ระบุทีม</option>{options.data?.teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></FormField></Panel>}`
- `src/modules/duct-rental/components/request-form.tsx:108` — `{!readonly && <Panel title="เลือกผู้ประสานหน้างาน"><FormField label="ผู้ประสานงานตามศูนย์บริการ"><select value={coordinatorId} disabled={!canSave && !canSubmit} onChange={event => { const person = options.data?.coordinators.find(item => item.id === event.target.value); setCoordinatorId(event.target.value); if (person) change({ ...values, installContactName: person.display_name, installContactEmail: person.email, installContactPhone: person.phone }); }}><option value="">กรอกข้อมูลผู้ประสานงานเอง</option>{options.data?.coordinators.map(person => <option key={person.id} value={person.id}>{person.display_name}</option>)}</select></FormField>{!options.data?.coordinators.length && <EmptyState title="ไม่พบผู้ประสานงาน" description="สามารถกรอกชื่อและข้อมูลติดต่อเองได้" />}<Notice text={options.error} error /></Panel>}`
- `src/modules/duct-rental/components/request-form.tsx:114` — `{confirm && <Modal title="ยืนยันส่งคำขอ" close={() => setConfirm(false)}><p>ตรวจสอบข้อมูลและไฟล์แนบก่อนส่งให้ทีมเขียนแบบ เมื่อส่งแล้วข้อมูลออกแบบจะเป็นอ่านอย่างเดียว</p><div className={styles.actions}><Button variant="ghost" onClick={() => setConfirm(false)}>กลับไปตรวจข้อมูล</Button><Button variant="primary" onClick={() => { setConfirm(false); void save(true); }}>ยืนยันส่งคำขอ</Button></div></Modal>}`

## A-168 — `src/modules/duct-rental/components/request-list.tsx`

- `src/modules/duct-rental/components/request-list.tsx:26` — `const filter = (name: keyof typeof filters, value: string) => {`
- `src/modules/duct-rental/components/request-list.tsx:42` — `{ id: "filtered", label: "รายการที่ตรงตัวกรอง", value: model.data?.counts.total ?? "—" },`
- `src/modules/duct-rental/components/request-list.tsx:43` — `{ id: "waiting", label: "คิวรอรับงาน", value: model.data?.queues.waiting ?? "—", onClick: () => { setFilters({ ...emptyFilters, workflow: "PENDING" }); setOffset(0); }, active: filters.workflow === "PENDING" },`
- `src/modules/duct-rental/components/request-list.tsx:44` — `{ id: "missing", label: "เอกสารค้าง", value: model.data?.queues.missing ?? "—", onClick: () => { setFilters({ ...emptyFilters, documents: "incomplete" }); setOffset(0); }, active: filters.documents === "incomplete" },`
- `src/modules/duct-rental/components/request-list.tsx:45` — `{ id: "active", label: "ใช้งานอยู่ในตัวกรอง", value: model.data?.counts.active ?? "—" },`
- `src/modules/duct-rental/components/request-list.tsx:48` — `<summary><WorkspaceIcon name="chevron" size={16} /><strong>ขั้นตอนงาน · 10 ขั้นตอน</strong>{filters.phase && <span>เลือก: {phaseLabels[filters.phase as keyof typeof phaseLabels]}</span>}</summary>`
- `src/modules/duct-rental/components/request-list.tsx:51` — `tabs={requestPhases.map(phase => ({ phase, label: phaseLabels[phase], status: String(model.data?.pipeline.find(item => item.phase === phase)?.count ?? 0) }))}`
- `src/modules/duct-rental/components/request-list.tsx:65` — `{advancedOpen && <div id="duct-advanced-filters" className={styles.requestFilters}>`
- `src/modules/duct-rental/components/request-list.tsx:66` — `<FormField label="ขั้นตอน"><select className={styles.input} value={filters.phase} onChange={event => filter("phase", event.target.value)}><option value="">ทุกขั้นตอน</option>{requestPhases.map(phase => <option key={phase} value={phase}>{phaseLabels[phase]}</option>)}</select></FormField>`
- `src/modules/duct-rental/components/request-list.tsx:67` — `<FormField label="ประเภทคำขอ"><select className={styles.input} value={filters.requestType} onChange={event => filter("requestType", event.target.value)}><option value="">ทุกประเภท</option>{REQUEST_TYPE_OPTIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></FormField>`
- `src/modules/duct-rental/components/request-list.tsx:68` — `<FormField label="ศูนย์บริการ"><select className={styles.input} value={filters.serviceCenter} onChange={event => filter("serviceCenter", event.target.value)}><option value="">ทุกศูนย์บริการ</option>{SERVICE_CENTER_OPTIONS.map(center => <option key={center}>{center}</option>)}</select></FormField>`
- `src/modules/duct-rental/components/request-list.tsx:69` — `<FormField label="เอกสาร"><select className={styles.input} value={filters.documents} onChange={event => filter("documents", event.target.value)}><option value="">ทุกสถานะเอกสาร</option><option value="complete">เอกสารครบ</option><option value="incomplete">เอกสารค้าง</option></select></FormField>`
- `src/modules/duct-rental/components/request-list.tsx:70` — `<FormField label="สถานะงาน"><select className={styles.input} value={filters.workflow} onChange={event => filter("workflow", event.target.value)}><option value="">ทุกสถานะงาน</option>{Object.entries(workflowLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></FormField>`
- `src/modules/duct-rental/components/request-list.tsx:91` — `<div className={styles.emptyActions}>{model.error ? <Button variant="secondary" onClick={() => model.refresh()}>อัปเดตข้อมูลอีกครั้ง</Button> : activeCount ? <Button variant="ghost" onClick={clearFilters}>ล้างตัวกรอง</Button> : null}{permissions.includes("duct_rental.request.create") && <ButtonLink variant="secondary" href="/duct-rental/new">สร้างคำขอ</ButtonLink>}</div>`
- `src/modules/duct-rental/components/request-list.tsx:105` — `{permissions.includes("duct_rental.settings.manage") && (`
- `src/modules/duct-rental/components/request-list.tsx:108` — `{permissions.includes("duct_rental.request.create") && (`
- `src/modules/duct-rental/components/request-list.tsx:111` — `{permissions.includes("duct_rental.module.view") && (`
- `src/modules/duct-rental/components/request-list.tsx:114` — `{permissions.includes("duct_rental.module.view") && (`
- `src/modules/duct-rental/components/request-list.tsx:117` — `{permissions.includes("duct_rental.module.view") && (`
- `src/modules/duct-rental/components/request-list.tsx:127` — `tabs={[{ id: "requests", label: "รายการคำขอ", content: panel }]}`
- `src/modules/duct-rental/components/request-list.tsx:129` — `{detail && <Modal title="รายละเอียดคำขอเช่าท่อ" close={() => setDetail(null)}><RequestWorkspace id={detail} userId={userId} compact /></Modal>}`

## A-169 — `src/modules/duct-rental/components/request-workspace.tsx`

- `src/modules/duct-rental/components/request-workspace.tsx:23` — `const installFields = [{ name: "actualStartCoords", label: "พิกัดต้นทางจริง", type: "text" }, { name: "actualEndCoords", label: "พิกัดปลายทางจริง", type: "text" }, { name: "actualDistance", label: "ระยะทางจริง (m)", type: "number" }, { name: "markLength", label: "Mark length (ML)", type: "text" }, { name: "pipeCount", label: "จำนวนท่อ (ถ้ามี)", type: "number" }, { name: "installDate", label: "วันที่ติดตั้ง", type: "date" }, { name: "supervisorName", label: "ชื่อผู้ควบคุมงาน", type: "text" }, { name: "installNotes", label: "หมายเหตุ / บันทึกหน้างาน", type: "text" }];`
- `src/modules/duct-rental/components/request-workspace.tsx:24` — `const uploadSlots: Partial<Record<RequestPhase, { kind: string; label: string; accept?: string }[]>> = {`
- `src/modules/duct-rental/components/request-workspace.tsx:25` — `DRAFTSMAN: [{ kind: "drawing", label: "แบบท่อ (PDF)" }], PERMISSION_1: [{ kind: "permission_letter", label: "หนังสืออนุญาต (PDF)" }, { kind: "confirmation_form", label: "แบบยืนยัน (PDF)" }],`
- `src/modules/duct-rental/components/request-workspace.tsx:26` — `INSTALL: [{ kind: "confirmation_form", label: "แบบยืนยันการใช้งานหลังติดตั้ง (PDF)" }], DRAFTSMAN_2: [{ kind: "cad", label: "แบบ CAD", accept: ".dwg,.dxf" }, { kind: "drawing", label: "แบบหลังติดตั้ง (PDF)" }, { kind: "kmz", label: "ไฟล์เส้นทาง KMZ / KML", accept: ".kmz,.kml" }],`
- `src/modules/duct-rental/components/request-workspace.tsx:27` — `"3RD_PARTY_1": [{ kind: "rate_notice", label: "หนังสือแจ้งอัตรา (PDF)" }, { kind: "invoice", label: "ใบแจ้งค่าใช้บริการ (PDF)" }, { kind: "signed_copy", label: "ฉบับลงนาม (ถ้ามี)" }], "3RD_PARTY_2": [{ kind: "contract", label: "เอกสารสัญญา (PDF)" }, { kind: "receipt", label: "ใบเสร็จ / BG (PDF)" }],`
- `src/modules/duct-rental/components/request-workspace.tsx:39` — `const row = model.data, owned = requestPhases.filter(phase => phase !== "COMPLETE" && row.capabilities.some(code => code === &#96;duct_rental.${phaseResource[phase as Exclude<RequestPhase, "COMPLETE">]}.accept&#96; \|\| code === &#96;duct_rental.${phaseResource[phase as Exclude<RequestPhase, "COMPLETE">]}.submit&#96;));`
- `src/modules/duct-rental/components/request-workspace.tsx:41` — `const phase = (view === "missing-docs" ? row.phase : Object.entries(phaseViews).find(([key, value]) => key !== "COMPLETE" && value === view)?.[0] ?? preferred) as RequestPhase;`
- `src/modules/duct-rental/components/request-workspace.tsx:42` — `return <div className={&#96;${styles.workspace} ${styles.ductSurface} ${styles.ductDetail}&#96;} data-ui-screen="duct-rental-request-detail"><RequestPane key={&#96;${id}:${row.version}:${view ?? "default"}&#96;} row={row} phase={phase} view={view} missingView={view === "missing-docs"} userId={userId} compact={compact} model={model} paused={paused} pause={setPaused} showCreated={showCreated && !compact} setShowCreated={setShowCreated} reload={async () => { setPaused(false); await model.refresh(); }} /></div>;`
- `src/modules/duct-rental/components/request-workspace.tsx:52` — `const [reference, setReference] = useState(row.design.permissionRequestNumber ?? ""), [signer, setSigner] = useState(row.assignedSignerId ?? row.signoff?.assignee_id ?? ""), [preview, setPreview] = useState<{ url: string; title: string; nt?: boolean } \| null>(null), [confirm, setConfirm] = useState<"submit" \| "archive" \| "reload" \| null>(null);`
- `src/modules/duct-rental/components/request-workspace.tsx:54` — `const canSubmit = current && !closed && row.capabilities.includes(&#96;duct_rental.${resource}.submit&#96;), canAccept = current && !closed && row.capabilities.includes(&#96;duct_rental.${resource}.accept&#96;);`
- `src/modules/duct-rental/components/request-workspace.tsx:55` — `const canUpload = current && !closed && row.capabilities.includes("duct_rental.document.upload");`
- `src/modules/duct-rental/components/request-workspace.tsx:61` — `const incomplete = hasIncompleteRequiredDocuments({ currentPhase: row.phase, missingDocs: effectiveMissingDocs, files: [...row.files.map(file => ({ name: file.name, fileType: file.fileType })), ...(files.memo ? [{ name: files.memo.name, fileType: "memo" }] : [])] });`
- `src/modules/duct-rental/components/request-workspace.tsx:63` — `const has = (kind: string, stage?: string) => gateFiles.some(file => file.fileType === kind && (!stage \|\| file.phase === stage));`
- `src/modules/duct-rental/components/request-workspace.tsx:64` — `const gates = submissionDocumentsReady(phase,gateFiles,row.isSigned) && (phase !== "3RD_PARTY_2" \|\| Object.values(guarantee).every(Boolean) && !incomplete);`
- `src/modules/duct-rental/components/request-workspace.tsx:74` — `if (action === "accept" && dirty) { setPhaseStatuses(previous => ({ ...previous, [phase]: "accepted" })); setMessage("รับงานเรียบร้อยแล้ว · ข้อมูลที่กรอกยังคงอยู่ในร่าง"); return; }`
- `src/modules/duct-rental/components/request-workspace.tsx:76` — `if (action === "archive") router.push("/duct-rental"); else if (action === "submit" && result.phase === "COMPLETE") router.push("/duct-rental"); else if (action === "submit") router.push(&#96;/duct-rental/${row.id}/${phaseViews[result.phase]}&#96;);`
- `src/modules/duct-rental/components/request-workspace.tsx:83` — `try { await notesSave.current; const doc = await apiPost(&#96;requests/${row.id}/nt-form&#96;, { version: versionRef.current, ...(phase === "PERMISSION_1" ? { reference } : {}) }); versionRef.current = doc.version; if (signer && signer !== row.assignedSignerId && row.capabilities.includes("duct_rental.signoff.assign")) await apiPost(&#96;requests/${row.id}/assign&#96;, { version: doc.version, documentId: doc.id, assigneeId: signer }); setPreview(null); await reload(); }`
- `src/modules/duct-rental/components/request-workspace.tsx:96` — `const tabs = <RequestTabs tabs={viewTabs} activeTab={phase === "DESIGN" && !missingView ? (view ?? "overview") : (view ?? phaseViews[phase] ?? "overview")} onChange={next => router.push(&#96;/duct-rental/${row.id}/${next}&#96;)} label="มุมมองคำขอ 10 ขั้นตอน" />;`
- `src/modules/duct-rental/components/request-workspace.tsx:98` — `{showCreated && <section className={styles.panel} role="status"><strong>สร้างคำขอสำเร็จ และส่งต่อให้ Draftsman แล้ว</strong><p>คำขอ {row.code} บันทึกในระบบแล้ว ข้อมูลและไฟล์แนบจะอัปเดตให้ผู้ใช้อื่นผ่านการเชื่อมต่อสด</p><div className={styles.actions}><Link className={styles.button} href="/duct-rental">กลับหน้ารายการ</Link><button className={styles.primary} onClick={() => { setShowCreated(false); router.replace(&#96;/duct-rental/${row.id}/draftsman&#96;); }}>ทำงานต่อ</button></div></section>}`
- `src/modules/duct-rental/components/request-workspace.tsx:102` — `{!current && <Notice text={&#96;แสดงแบบอ่านอย่างเดียว · ขั้นตอนปัจจุบัน: ${phaseLabels[row.phase]}&#96;} />}`
- `src/modules/duct-rental/components/request-workspace.tsx:103` — `{closed && <Notice text={row.cancelledAt ? &#96;ยกเลิกการใช้ท่อแล้ว มีผล ${row.cancelledAt}&#96; : row.archivedAt ? "คำขอนี้เก็บเข้าประวัติแล้ว" : "เส้นทางนี้เสร็จสมบูรณ์และใช้งานอยู่"} />}`
- `src/modules/duct-rental/components/request-workspace.tsx:104` — `<div className={styles.toolbar}><RequestStatusBadge label={statusLabel} tone={phaseStatuses[phase] === "done" ? "success" : phaseStatuses[phase] === "accepted" ? "info" : "neutral"} description={phaseLabels[phase]} />{canAccept && phaseStatuses[phase] === "pending" && <button className={styles.primary} type="button" disabled={busy} onClick={() => void run("accept")}>รับงาน{phaseLabels[phase]}</button>}</div>`
- `src/modules/duct-rental/components/request-workspace.tsx:105` — `<RequestFormShell form={<DesignEditorShell canvas={<details className={styles.panel} open={phase === "DESIGN"}><summary className={styles.sectionSummary}>ข้อมูลออกแบบและผู้ประสานงาน</summary><DesignEditor values={Object.fromEntries(Object.entries(row.design).filter(([, value]) => value !== undefined)) as Record<string, string \| number>} change={() => {}} readonly /></details>} />} coordinatorPanel={<aside className={styles.panel}><h2>เอกสารค้าง</h2><Field label="รายการที่ต้องติดตาม"><textarea value={missingDocs} maxLength={10000} readOnly={!canSubmit} disabled={busy} onChange={event => { setMissingDocs(event.target.value); changed(); }} /></Field>{canUpload && <AttachmentPicker label="ประกอบไฟล์ Memo (PDF)" file={files.memo} change={file => { setFiles(previous => ({ ...previous, memo: file })); changed(); }} disabled={busy} />}</aside>} />`
- `src/modules/duct-rental/components/request-workspace.tsx:108` — `{phase === "DESIGN" && <div className={styles.actions}>{row.capabilities.includes("duct_rental.document.export") && <><a className={styles.button} href={&#96;/api/duct-rental/requests/${row.id}/summary&#96;}>ดาวน์โหลด PDF สรุป</a><a className={styles.button} href={&#96;/api/duct-rental/requests/${row.id}/nt-preview?download=1&#96;}>ดาวน์โหลด NT Form</a></>}{row.capabilities.includes("duct_rental.document.read") && <button className={styles.button} type="button" onClick={() => setPreview({ url: &#96;/api/duct-rental/requests/${row.id}/nt-preview&#96;, title: "NT Form" })}>ดู NT Form</button>}{!closed && ["DESIGN", "DRAFTSMAN", "PERMISSION_1"].includes(row.phase) && row.capabilities.includes("duct_rental.document.upload") && <button className={styles.primary} type="button" disabled={busy} onClick={() => void ntSave()}>บันทึก NT Form</button>}{!closed && row.capabilities.includes("duct_rental.request.update") && <Link className={styles.primary} href={&#96;/duct-rental/${row.id}/edit&#96;}>แก้ไขข้อมูลออกแบบ</Link>}</div>}`
- `src/modules/duct-rental/components/request-workspace.tsx:109` — `{phase === "PERMISSION_1" && <section className={styles.panel}><h2>จัดทำและลงนาม NT Form</h2>{row.capabilities.includes("duct_rental.document.read") && <details><summary>แบบฟอร์ม NT ต้นฉบับและตัวอย่าง</summary>{([{variant:"original",label:"ต้นฉบับที่ใช้สร้าง NT Form"},{variant:"blank",label:"แบบฟอร์ม NT"},{variant:"copy",label:"ตัวอย่างสำเนา"}] as const).map(item => <div className={styles.fileRow} key={item.variant}><span>{item.label}</span><div className={styles.actions}><button className={styles.button} onClick={() => setPreview({url:&#96;/api/duct-rental/requests/${row.id}/nt-template?variant=${item.variant}&#96;,title:item.label})}>ดูแบบฟอร์ม</button>{row.capabilities.includes("duct_rental.document.export") && <a className={styles.button} href={&#96;/api/duct-rental/requests/${row.id}/nt-template?variant=${item.variant}&download=1&#96;}>ดาวน์โหลดต้นฉบับ</a>}</div></div>)}</details>}<div className={styles.workspace}><Notice text={row.isSigned ? &#96;ลงนามแล้ว${row.signoff ? &#96; · ${row.signoff.assignee_name}&#96; : ""}&#96; : row.signoff ? &#96;รอ ${row.signoff.assignee_name} ลงนาม&#96; : row.assignedSignerId ? "เลือกผู้ลงนามแล้ว · กรุณาสร้าง NT Form เพื่อส่งลงนาม" : "ยังไม่ได้มอบหมายผู้ลงนาม"} />{row.signoff?.assignee_id === userId && row.signoff.status === "pending" && <Link className={styles.primary} href={&#96;/duct-rental/tasks?task=${row.signoff.id}&#96;}>เปิดงานลงนามที่ได้รับมอบหมาย</Link>}<Field label="เลขที่หนังสือคำขออนุญาต"><input value={reference} maxLength={200} readOnly={!canSubmit} onChange={event => { setReference(event.target.value); changed(); }} /></Field><div className={styles.actions}><button className={styles.primary} type="button" disabled={busy \|\| !canUpload \|\| !reference.trim()} onClick={() => setPreview({ url: &#96;/api/duct-rental/requests/${row.id}/nt-preview?reference=${encodeURIComponent(reference)}&#96;, title: "ตรวจ NT Form ก่อนบันทึก", nt: true })}>สร้างและตรวจ NT Form</button>{current && !closed && row.capabilities.includes("duct_rental.signoff.revoke") && row.signoff && <button className={styles.button} type="button" disabled={busy} onClick={() => { setBusy(true); void apiPost(&#96;signatures/${row.signoff!.id}/revoke&#96;, { version: row.signoff!.version }).then(reload).catch(reason => setError(errorText(reason))).finally(() => setBusy(false)); }}>ขอให้ลงนามใหม่</button>}</div>{row.capabilities.includes("duct_rental.signoff.assign") && <div className={styles.actions}><Field label="ผู้รับมอบหมายลงนาม"><select value={signer} disabled={busy \|\| !current \|\| closed} onChange={event => { setSigner(event.target.value); changed(); }}><option value="">เลือกผู้ลงนาม</option>{row.signers.map(person => <option key={person.id} value={person.id}>{person.display_name}</option>)}</select></Field><button className={styles.button} type="button" disabled={busy \|\| !signer \|\| !current \|\| closed} onClick={() => void assign()}>บันทึกผู้ลงนาม</button></div>}</div></section>}`
- `src/modules/duct-rental/components/request-workspace.tsx:110` — `{phase === "INSTALL" && <section className={styles.panel}><h2>ข้อมูลการติดตั้งจริง</h2><div className={styles.grid}>{installFields.map(field => <Field key={field.name} label={field.label} error={errors[field.name]}><input name={field.name} type={field.type} step="any" value={install[field.name] ?? ""} readOnly={!canSubmit} disabled={busy} onChange={event => { setInstall(previous => ({ ...previous, [field.name]: event.target.value })); changed(); }} /></Field>)}</div></section>}`
- `src/modules/duct-rental/components/request-workspace.tsx:111` — `{phase !== "INSTALL" && row.install && <details className={styles.panel}><summary className={styles.sectionSummary}>ข้อมูลจากทีมติดตั้ง</summary><dl className={styles.details}>{installFields.map(field => <div key={field.name}><dt>{field.label}</dt><dd>{String(row.install?.[field.name as keyof typeof row.install] ?? "—")}</dd></div>)}</dl></details>}`
- `src/modules/duct-rental/components/request-workspace.tsx:112` — `{phase === "3RD_PARTY_1" && <section className={styles.panel}><h2>อัตราค่าเช่าและระยะสัญญา</h2>{row.capabilities.includes("duct_rental.rate.read") ? <div className={styles.grid}>{[{ name: "monthlyFee", label: "ค่าใช้บริการต่อเดือน", type: "text" }, { name: "yearlyFee", label: "ค่าใช้บริการต่อปี", type: "text" }, { name: "contractStart", label: "วันที่เริ่มสัญญา", type: "date" }, { name: "contractEnd", label: "วันที่สิ้นสุดสัญญา", type: "date" }].map(field => <Field key={field.name} label={field.label} error={errors[&#96;rate.${field.name}&#96;]}><input type={field.type} inputMode={field.type === "text" ? "decimal" : undefined} value={rate[field.name as keyof typeof rate]} readOnly={!canSubmit} disabled={busy} onChange={event => { setRate(previous => ({ ...previous, [field.name]: event.target.value })); changed(); }} /></Field>)}</div> : <p className={styles.muted}>ไม่มีสิทธิ์ดูอัตราค่าเช่า</p>}</section>}`
- `src/modules/duct-rental/components/request-workspace.tsx:113` — `{phase !== "3RD_PARTY_1" && row.rate && <section className={styles.panel}><h2>ข้อมูลค่าเช่า</h2><dl className={styles.details}><div><dt>ต่อเดือน</dt><dd>{row.rate.monthlyFee}</dd></div><div><dt>ต่อปี</dt><dd>{row.rate.yearlyFee}</dd></div><div><dt>ระยะสัญญา</dt><dd>{row.rate.contractStart \|\| "—"} ถึง {row.rate.contractEnd \|\| "—"}</dd></div></dl></section>}`
- `src/modules/duct-rental/components/request-workspace.tsx:114` — `{phase === "3RD_PARTY_2" && <section className={styles.panel}><h2>สัญญาและข้อมูลค้ำประกัน</h2><div className={styles.grid}>{[{ name: "contractNumber", label: "เลขที่สัญญา" }, { name: "fullAmount", label: "จำนวนเงินค้ำประกัน" }, { name: "paymentType", label: "ประเภทการชำระเงิน" }, { name: "venderCode", label: "ผู้ให้บริการ / Vendor Code" }, { name: "receiptNumber", label: "เลขใบเสร็จ" }].map(field => <Field key={field.name} label={field.label} error={errors[&#96;guarantee.${field.name}&#96;]}>{field.name === "paymentType" ? <select value={guarantee.paymentType} disabled={!canSubmit \|\| busy} onChange={event => { setGuarantee(previous => ({ ...previous, paymentType: event.target.value })); changed(); }}><option value="">เลือกรูปแบบการจ่าย</option>{[{ value: "check", label: "เช็ค" }, { value: "LG", label: "LG" }, { value: "BG", label: "BG" }, { value: "transfer", label: "โอนเงิน" }].map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select> : field.name === "venderCode" ? <select value={guarantee.venderCode} disabled={!canSubmit \|\| busy} onChange={event => { setGuarantee(previous => ({ ...previous, venderCode: event.target.value })); changed(); }}><option value="">เลือกผู้ให้บริการ</option>{VENDOR_CODE_OPTIONS.map(item => <option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}</select> : <input value={guarantee[field.name as keyof typeof guarantee]} readOnly={!canSubmit \|\| (field.name === "fullAmount" && !row.capabilities.includes("duct_rental.rate.read"))} disabled={busy} onChange={event => { setGuarantee(previous => ({ ...previous, [field.name]: event.target.value })); changed(); }} />}</Field>)}</div>{incomplete && <Notice text="ยังมีเอกสารค้างหรือไม่มี Memo กรุณาประกอบเอกสารก่อนจบงาน" error />}</section>}`
- `src/modules/duct-rental/components/request-workspace.tsx:115` — `{uploadSlots[phase] && <section className={styles.panel}><h2>เอกสารสำหรับขั้นตอนนี้</h2><div className={styles.grid}>{uploadSlots[phase]!.map(slot => <div key={slot.kind}><AttachmentPicker label={slot.label} accept={slot.accept} file={files[slot.kind]} disabled={!canUpload \|\| busy \|\| (phase === "PERMISSION_1" && !row.isSigned)} change={file => { setFiles(previous => ({ ...previous, [slot.kind]: file })); changed(); }} />{has(slot.kind, phase) && <small className={styles.saved}>มีเอกสารแล้ว</small>}</div>)}</div></section>}`
- `src/modules/duct-rental/components/request-workspace.tsx:116` — `{["DRAFTSMAN_2", "3RD_PARTY_1", "3RD_PARTY_2"].includes(phase) && <section className={styles.panel}><Field label="หมายเหตุ (บันทึกอัตโนมัติ)"><textarea value={notes} maxLength={10000} disabled={busy} readOnly={!canSubmit} onChange={event => autoNotes(event.target.value)} placeholder="บันทึกข้อมูลเพิ่มเติม…" /></Field></section>}`
- `src/modules/duct-rental/components/request-workspace.tsx:118` — `</div><aside className={styles.panel}><h2>เอกสารค้าง</h2><Field label="รายการที่ต้องติดตาม"><textarea value={missingDocs} maxLength={10000} readOnly={!canSubmit} disabled={busy} onChange={event => { setMissingDocs(event.target.value); changed(); }} /></Field>{canUpload && <AttachmentPicker label="ประกอบไฟล์ Memo (PDF)" file={files.memo} change={file => { setFiles(previous => ({ ...previous, memo: file })); changed(); }} disabled={busy} />}<div className={styles.actions}><button className={styles.button} type="button" disabled={busy \|\| !canSubmit} onClick={() => void run("save")}>บันทึกเอกสารค้าง</button><button className={styles.button} type="button" disabled={busy \|\| !canSubmit} onClick={() => { setMissingDocs(""); changed(); }}>ล้างหมายเหตุ</button></div>{!missingView && <Link className={styles.button} href={&#96;/duct-rental/${row.id}/missing-docs&#96;}>เปิดหน้าติดตามเอกสาร</Link>}</aside></div>`
- `src/modules/duct-rental/components/request-workspace.tsx:119` — `<div className={&#96;${styles.toolbar} ${styles.sticky}&#96;}><span className={styles.muted}>{busy ? "กำลังบันทึก…" : dirty ? "มีข้อมูลยังไม่บันทึก" : "ข้อมูลบันทึกแล้ว"}</span><div className={styles.actions}><button className={styles.button} type="button" disabled={busy} onClick={() => setConfirm("reload")}>โหลดข้อมูลล่าสุด</button>{canSubmit && phase !== "DESIGN" && <><button className={styles.button} type="button" disabled={busy} onClick={() => void run("save")}>บันทึกร่าง</button><button className={styles.primary} type="button" disabled={busy \|\| phaseStatuses[phase] !== "accepted" \|\| !gates} onClick={() => setConfirm("submit")}>{phase === "3RD_PARTY_2" ? "จบงาน / เริ่มใช้งาน" : "ส่งงานขั้นถัดไป"}</button></>}{row.capabilities.includes("duct_rental.request.archive") && !row.archivedAt && <button className={styles.danger} type="button" disabled={busy} onClick={() => setConfirm("archive")}>เก็บเข้าประวัติ</button>}{row.phase === "COMPLETE" && !row.cancelledAt && row.capabilities.includes("duct_rental.cancellation.create") && <Link className={styles.button} href={&#96;/duct-rental/cancellation/new?request=${row.id}&#96;}>ขอยกเลิกการใช้ท่อ</Link>}</div></div>`
- `src/modules/duct-rental/components/request-workspace.tsx:120` — `{preview && <Modal title={preview.title} close={() => setPreview(null)}><PdfViewer url={preview.url} name={preview.title} />{preview.nt && <div className={styles.actions}><button className={styles.button} type="button" disabled={busy} onClick={() => setPreview(null)}>กลับไปแก้ไข</button><button className={styles.primary} type="button" disabled={busy} onClick={() => void ntSave()}>ยืนยันและบันทึก NT Form</button></div>}</Modal>}`
- `src/modules/duct-rental/components/request-workspace.tsx:121` — `{confirm && <Modal title={confirm === "archive" ? "ยืนยันเก็บคำขอเข้าประวัติ" : confirm === "reload" ? "โหลดข้อมูลล่าสุด" : "ยืนยันส่งงาน"} close={() => setConfirm(null)}><p>{confirm === "archive" ? "คำขอจะออกจากรายการปัจจุบัน โดยเก็บข้อมูลและประวัติไว้" : confirm === "reload" ? "ข้อมูลที่ยังไม่บันทึกจะถูกแทนที่ด้วยข้อมูลล่าสุด" : "ตรวจข้อมูลและเอกสารก่อนส่งต่อขั้นถัดไป"}</p><div className={styles.actions}><button className={styles.button} type="button" onClick={() => setConfirm(null)}>กลับ</button><button className={styles.primary} type="button" onClick={() => { const action = confirm; setConfirm(null); if (action === "reload") void reload(); else void run(action); }}>ยืนยัน</button></div></Modal>}`
- `src/modules/duct-rental/components/request-workspace.tsx:123` — `return compact ? content : <RequestShell title={&#96;${row.code} · ${phaseLabels[phase]}&#96;} description={row.projectName \|\| "ร่างคำขอ"} parent={{ label: "เช่าท่อร้อยสาย", href: "/duct-rental" }} actions={<Link className={styles.button} href={&#96;/duct-rental/${row.id}/edit&#96;}>ข้อมูลออกแบบ</Link>} utility={<DuctSyncUtility {...model} paused={paused} refresh={() => model.refresh()} />} content={content} />;`

## A-170 — `src/modules/duct-rental/components/settings-workspace.tsx`

- `src/modules/duct-rental/components/settings-workspace.tsx:10` — `type Settings = { version: number; service_center_teams: Record<string, string>; coordinator_phones: Record<string, string> };`
- `src/modules/duct-rental/components/settings-workspace.tsx:13` — `return <div className={&#96;${styles.workspace} ${styles.settingsSurface}&#96;} data-ui-screen="duct-rental-settings"><PageHeader title="ตั้งค่าผู้ประสานงานเช่าท่อ" description="กำหนดทีมของศูนย์บริการและเบอร์ติดต่อ โดยใช้บัญชีและสมาชิกทีมใน Core" parent={{ label: "เช่าท่อร้อยสาย", href: "/duct-rental" }} /><ModuleNav /><RefreshBar {...model} paused={paused} refresh={model.refresh} /><Notice text={model.error \|\| options.error} error />{model.data && options.data && <SettingsForm key={model.data.version} row={model.data} options={options.data} pause={setPaused} reload={async () => { setPaused(false); await model.refresh(); await options.refresh(); }} />}</div>;`
- `src/modules/duct-rental/components/settings-workspace.tsx:18` — `return <><Notice text={error} error /><Notice text={message} /><section className={styles.panel}><h2>ศูนย์บริการและทีม</h2><div className={styles.grid}>{SERVICE_CENTER_OPTIONS.map(center => <Field key={center} label={&#96;ทีมของ ${center}&#96;}><select value={centers[center] \|\| ""} disabled={busy} onChange={event => { setCenters(previous => ({ ...previous, [center]: event.target.value })); pause(true); }}><option value="">ยังไม่กำหนดทีม</option>{options.teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></Field>)}</div></section><section className={styles.panel}><h2>เบอร์ติดต่อผู้ประสานงานติดตั้ง</h2><div className={styles.grid}>{options.coordinators.map(person => <Field key={person.id} label={&#96;${person.display_name} · ${person.email}&#96;}><input value={phones[person.id] \|\| ""} maxLength={100} disabled={busy} onChange={event => { setPhones(previous => ({ ...previous, [person.id]: event.target.value })); pause(true); }} /></Field>)}</div>{!options.coordinators.length && <p className={styles.muted}>ยังไม่พบบัญชีที่มีสิทธิ์งานติดตั้ง กรุณากำหนดบัญชีและสมาชิกทีมผ่านหน้าแอดมิน Core</p>}</section><button className={styles.primary} type="button" disabled={busy} onClick={() => void save()}>บันทึกการตั้งค่า</button></>;`

## A-171 — `src/modules/duct-rental/components/signature-workspace.tsx`

- `src/modules/duct-rental/components/signature-workspace.tsx:16` — `type Placement = { page: number; x: number; y: number; width: number; height: number; scale: number; rotation: number; signatureOffsetX: number; signatureOffsetY: number; nameOffsetX: number; nameOffsetY: number; dateOffsetX: number; dateOffsetY: number };`
- `src/modules/duct-rental/components/signature-workspace.tsx:24` — `const task = model.data?.tasks.find(item => item.id === taskId), ownPending = task?.assigneeId === userId && task.status === "pending" && task.canSignNow, chosenAsset = assetId \|\| model.data?.assets.find(item => item.isDefault)?.id \|\| model.data?.assets[0]?.id \|\| "";`
- `src/modules/duct-rental/components/signature-workspace.tsx:49` — `return <div className={&#96;${styles.workspace} ${styles.signatureSurface}&#96;} data-ui-screen="duct-rental-tasks"><PageHeader title="งานลงนาม NT Form" description="ลงนามได้เฉพาะเอกสารที่ได้รับมอบหมาย ชื่อผู้ลงนามยืนยันจากบัญชี เลือกวันที่แสดงบนเอกสารได้" parent={{ label: "เช่าท่อร้อยสาย", href: "/duct-rental" }} /><ModuleNav current="requests" />`
- `src/modules/duct-rental/components/signature-workspace.tsx:57` — `actions={permissions.includes("duct_rental.signoff.sign") && <button className={&#96;${styles.button} ${styles.manageAction}&#96;} type="button" onClick={() => setManager(true)}>จัดการลายเซ็นของฉัน</button>}`
- `src/modules/duct-rental/components/signature-workspace.tsx:62` — `<div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>คำขอ / โครงการ</th><th>สถานะ</th><th>กำหนดลงนาม</th><th>เอกสาร</th></tr></thead><tbody>{model.data?.tasks.filter(item => &#96;${item.snapshot.code} ${item.snapshot.projectName}&#96;.toLocaleLowerCase().includes(query.toLocaleLowerCase())).map(item => <tr key={item.id}><td><Link href={&#96;/duct-rental/${item.requestId}&#96;}>{item.snapshot.code}</Link><div>{item.snapshot.projectName}</div></td><td>{item.status === "pending" ? "รอลงนาม" : item.status === "signed" ? "ลงนามแล้ว" : "ยกเลิกงานลงนาม"}</td><td>{new Date(item.dueAt).toLocaleDateString("th-TH")}</td><td><button className={styles.button} type="button" onClick={() => { setTaskId(item.id); setPlacement(initial); setPaused(false); }}>{item.status === "pending" && item.assigneeId === userId && item.canSignNow ? "ตรวจและลงนาม" : "ดูเอกสาร"}</button></td></tr>)}</tbody></table>{model.data && !model.data.tasks.length && <p className={styles.muted}>ยังไม่มีงานลงนามที่คุณเข้าถึงได้</p>}</div>`
- `src/modules/duct-rental/components/signature-workspace.tsx:64` — `{task && <section className={styles.panel}><div className={styles.signatureControl}><h2>{task.snapshot.code} · {task.snapshot.projectName}</h2><button className={styles.button} type="button" onClick={() => { setTaskId(""); setPaused(false); }}>ปิดเอกสาร</button></div><Notice text={liveError} error />{task.status === "pending" && !task.canSignNow && <Notice text="งานนี้ยังลงนามไม่ได้ กรุณาตรวจสถานะคำขอและ NT Form รุ่นปัจจุบัน" />}<PdfViewer url={ownPending && live ? live.url : documentUrl(task.signedDocumentId \|\| task.documentId)} blob={ownPending ? live?.blob : undefined} initialPage={ownPending ? 4 : 1} name={&#96;NT Form ${task.snapshot.code}&#96;} />{ownPending && <div className={styles.workspace}><Field label="เลือกลายเซ็น"><select value={chosenAsset} disabled={busy} onChange={event => { setAssetId(event.target.value); setPaused(true); }}><option value="">เลือกลายเซ็น</option>{model.data?.assets.map(item => <option key={item.id} value={item.id}>{item.name}{item.isDefault ? " · ค่าเริ่มต้น" : ""}</option>)}</select></Field><Field label="วันที่ลงนามบนเอกสาร"><input type="date" value={displayDate} disabled={busy} onChange={event => { setDisplayDate(event.target.value); setPaused(true); }} /></Field><p className={styles.muted}>วันที่นี้แสดงบน PDF ส่วนเวลาบันทึกประวัติใช้เวลาจริงของระบบ</p><details><summary className={styles.sectionSummary}>ปรับตำแหน่ง ขนาด และการหมุน</summary><Field label="ส่วนที่ต้องการเลื่อน"><select value={target} disabled={busy} onChange={event => setTarget(event.target.value as StampTarget)}><option value="all">ทั้งหมด</option><option value="signature">เฉพาะลายเซ็น</option><option value="name">เฉพาะชื่อ</option><option value="date">เฉพาะวันที่</option></select></Field><div className={styles.actions}><button className={styles.button} disabled={busy} onClick={() => nudge(0, SIGN_NUDGE_STEP)}>เลื่อนขึ้น</button><button className={styles.button} disabled={busy} onClick={() => nudge(-SIGN_NUDGE_STEP, 0)}>เลื่อนซ้าย</button><button className={styles.button} disabled={busy} onClick={() => nudge(SIGN_NUDGE_STEP, 0)}>เลื่อนขวา</button><button className={styles.button} disabled={busy} onClick={() => nudge(0, -SIGN_NUDGE_STEP)}>เลื่อนลง</button></div><div className={styles.actions}><button className={styles.button} disabled={busy} onClick={() => change("scale", Number((placement.scale - 0.05).toFixed(2)))}>ลดขนาดลายเซ็น</button><button className={styles.button} disabled={busy} onClick={() => change("scale", Number((placement.scale + 0.05).toFixed(2)))}>เพิ่มขนาดลายเซ็น</button></div><div className={styles.grid}>{([{ key: "x", label: "เลื่อนทั้งหมดแนวนอน", min: SIGN_OFFSET_MIN, max: SIGN_OFFSET_MAX }, { key: "y", label: "เลื่อนทั้งหมดแนวตั้ง", min: SIGN_OFFSET_MIN, max: SIGN_OFFSET_MAX }, { key: "signatureOffsetX", label: "เลื่อนเฉพาะลายเซ็นแนวนอน", min: SIGN_OFFSET_MIN, max: SIGN_OFFSET_MAX }, { key: "signatureOffsetY", label: "เลื่อนเฉพาะลายเซ็นแนวตั้ง", min: SIGN_OFFSET_MIN, max: SIGN_OFFSET_MAX }, { key: "scale", label: "ขนาดลายเซ็น", min: 0.45, max: 1.6, step: 0.05 }, { key: "rotation", label: "หมุน (องศา)", min: -180, max: 180 }, { key: "nameOffsetX", label: "เลื่อนชื่อแนวนอน", min: SIGN_OFFSET_MIN, max: SIGN_OFFSET_MAX }, { key: "nameOffsetY", label: "เลื่อนชื่อแนวตั้ง", min: SIGN_OFFSET_MIN, max: SIGN_OFFSET_MAX }, { key: "dateOffsetX", label: "เลื่อนวันที่แนวนอน", min: SIGN_OFFSET_MIN, max: SIGN_OFFSET_MAX }, { key: "dateOffsetY", label: "เลื่อนวันที่แนวตั้ง", min: SIGN_OFFSET_MIN, max: SIGN_OFFSET_MAX }] as const).map(item => <Field key={item.key} label={item.label}><input type="number" min={item.min} max={item.max} step={"step" in item ? item.step : 1} value={placement[item.key]} disabled={busy} onChange={event => change(item.key, Number(event.target.value))} /></Field>)}</div><div className={styles.actions}><button className={styles.button} type="button" onClick={() => setPlacement(initial)}>คืนตำแหน่งเริ่มต้น</button></div></details><div className={styles.actions}><button className={styles.primary} type="button" disabled={busy \|\| !chosenAsset} onClick={() => void inspect()}>ตรวจตัวอย่างก่อนลงนาม</button><button className={styles.button} type="button" onClick={() => setManager(true)}>เพิ่มลายเซ็น</button></div></div>}</section>}`
- `src/modules/duct-rental/components/signature-workspace.tsx:65` — `{preview && <Modal title="ยืนยันลายเซ็น ชื่อ และวันที่" close={() => setPreview(null)}><PdfViewer url={preview} blob={previewData} name="ตัวอย่าง NT Form พร้อมลายเซ็น" initialPage={4} /><p>เมื่อยืนยัน ระบบจะบันทึกเอกสารและแจ้งผู้มอบหมายงาน</p><div className={styles.actions}><button className={styles.button} type="button" disabled={busy} onClick={() => setPreview(null)}>ปรับแก้</button><button className={styles.primary} type="button" disabled={busy} onClick={() => void sign()}>ยืนยันลงนาม</button></div></Modal>}`
- `src/modules/duct-rental/components/signature-workspace.tsx:66` — `{manager && <Modal title="ลายเซ็นของฉัน" close={() => setManager(false)}><SignatureManager assets={model.data?.assets ?? []} refresh={model.refresh} saved={id => { setAssetId(id); setPaused(true); }} /></Modal>}`
- `src/modules/duct-rental/components/signature-workspace.tsx:84` — `return <div className={styles.workspace}><Notice text={error} error /><Notice text={message} /><Field label="ชื่อลายเซ็น"><input value={name} maxLength={100} disabled={busy} onChange={event => setName(event.target.value)} /></Field><p className={styles.muted}>วาดด้วยเมาส์หรือปากกา หรือเลือกรูปภาพ ระบบทำพื้นหลังสีขาวให้โปร่งใส</p><canvas className={styles.draw} ref={canvas} width={600} height={200} aria-label="พื้นที่วาดลายเซ็น สามารถใช้ปุ่มเลือกรูปแทนได้" tabIndex={0} role="img" onKeyDown={event => { if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); announce(&#96;ตำแหน่งลายเซ็น ${event.key.replace("Arrow", "")}&#96;); } else if (event.key === "Enter") { event.preventDefault(); announce("เริ่มวาดลายเซ็น"); } }} onPointerDown={event => { if (busy) return; drawing.current = true; event.currentTarget.setPointerCapture(event.pointerId); const [x, y] = point(event), ctx = canvas.current!.getContext("2d")!; ctx.strokeStyle = "black"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x, y); }} onPointerMove={event => { if (!drawing.current \|\| busy) return; const [x, y] = point(event), ctx = canvas.current!.getContext("2d")!; ctx.lineTo(x, y); ctx.stroke(); hasInk.current = true; }} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }} /><div className={styles.actions}><button className={styles.button} type="button" disabled={busy} onClick={clear}>ล้างภาพ</button><Field label="เลือกรูปลายเซ็น"><input type="file" accept="image/png,image/jpeg" disabled={busy} onChange={event => { const file = event.target.files?.[0]; if (file) { setName(previous => previous \|\| file.name.replace(/\.[^.]+$/, "") \|\| "Signature"); setDefault(true); void upload(file); } }} /></Field></div><label className={styles.actions}><input type="checkbox" checked={isDefault} onChange={event => setDefault(event.target.checked)} />ใช้เป็นลายเซ็นเริ่มต้น</label><button className={styles.primary} type="button" disabled={busy} onClick={() => void save()}>บันทึกลายเซ็น</button><div className={styles.grid}>{assets.map(item => <section key={item.id}><Image src={&#96;/api/duct-rental/assets/${item.id}&#96;} width={180} height={60} alt={&#96;ลายเซ็น ${item.name}&#96;} unoptimized /><p>{item.name}{item.isDefault ? " · ค่าเริ่มต้น" : ""}</p><div className={styles.actions}><button className={styles.button} type="button" disabled={busy \|\| item.isDefault} onClick={() => void changeAsset(item.id, "default")}>ใช้เป็นค่าเริ่มต้น</button><button className={styles.danger} type="button" disabled={busy} onClick={() => setRemove(item.id)}>นำออก</button></div></section>)}</div>{remove && <div className={styles.notice}><p>นำลายเซ็นนี้ออกจากตัวเลือกหรือไม่?</p><div className={styles.actions}><button className={styles.button} type="button" onClick={() => setRemove(null)}>กลับ</button><button className={styles.danger} type="button" disabled={busy} onClick={() => void changeAsset(remove, "archive")}>ยืนยันนำออก</button></div></div>}</div>;`

## A-172 — `src/modules/duct-rental/components/tracking-workspace.tsx`

- `src/modules/duct-rental/components/tracking-workspace.tsx:21` — `type Tracking = Awaited<ReturnType<typeof readTracking>>;`
- `src/modules/duct-rental/components/tracking-workspace.tsx:30` — `<PageHeader title="ติดตามงานต่อสัญญาและยกเลิก" description="คิวรวม ผู้รับผิดชอบ และกำหนด SLA" parent={{label:"เช่าท่อร้อยสาย",href:"/duct-rental"}} />`
- `src/modules/duct-rental/components/tracking-workspace.tsx:36` — `{ label: "รายการที่ตรงตัวกรอง", value: model.data?.counts.total ?? 0, tone: "neutral" },`
- `src/modules/duct-rental/components/tracking-workspace.tsx:37` — `{ label: "เสร็จแล้ว", value: model.data?.counts.completed ?? 0, tone: "success" },`
- `src/modules/duct-rental/components/tracking-workspace.tsx:38` — `{ label: "ใกล้ครบกำหนด", value: model.data?.counts.nearDue ?? 0, tone: "info" },`
- `src/modules/duct-rental/components/tracking-workspace.tsx:39` — `{ label: "เกินกำหนด", value: model.data?.counts.overdue ?? 0, tone: "warning" },`
- `src/modules/duct-rental/components/tracking-workspace.tsx:48` — `<option value="">ทุกประเภท</option><option value="Renew">ต่อสัญญารายปี</option><option value="Cancel">ยกเลิกการใช้ท่อ</option>`
- `src/modules/duct-rental/components/tracking-workspace.tsx:53` — `<option value="">ทุกผู้รับผิดชอบ</option>`
- `src/modules/duct-rental/components/tracking-workspace.tsx:54` — `{Object.entries(owners).map(([key,label])=><option key={key} value={key}>{label}</option>)}`
- `src/modules/duct-rental/components/tracking-workspace.tsx:59` — `<option value="">ทุกสถานะ SLA</option>`
- `src/modules/duct-rental/components/tracking-workspace.tsx:60` — `{Object.entries(slaLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}`
- `src/modules/duct-rental/components/tracking-workspace.tsx:81` — `<td>{formatDate(String(row.start))} ถึง {formatDate(String(row.due))}{row.completed&&<div>เสร็จ {formatDate(String(row.completed))}</div>}</td>`
- `src/modules/duct-rental/components/tracking-workspace.tsx:87` — `{!model.data?.rows.length && <EmptyState title="ไม่พบรายการตามเงื่อนไข" description="ปรับตัวกรองค้นหา หรือเลือกรอบรายการอื่น แล้วลองอีกครั้ง" />}`

## A-173 — `src/modules/duct-rental/ui-process/PhaseProgress.tsx`

- `src/modules/duct-rental/ui-process/PhaseProgress.tsx:5` — `export type PhaseProgressItem = { id: string; label: string; description?: string; disabled?: boolean };`
- `src/modules/duct-rental/ui-process/PhaseProgress.tsx:22` — `{items.map((item, index) => <button key={item.id} ref={node => { refs.current[index] = node; }} type="button" role="radio" aria-checked={item.id === value} aria-disabled={item.disabled \|\| undefined} tabIndex={item.id === value ? 0 : -1} disabled={item.disabled} className={[styles.phaseStep, item.id === value && styles.phaseStepActive].filter(Boolean).join(" ")} onClick={() => select(item)} onKeyDown={event => move(event, index)}>`
- `src/modules/duct-rental/ui-process/PhaseProgress.tsx:23` — `<span className={styles.phaseMarker} aria-hidden="true">{index + 1}</span><span>{item.label}</span>{item.description && <small>{item.description}</small>}`

## A-174 — `src/modules/duct-rental/ui-process/ProcessShell.tsx`

- `src/modules/duct-rental/ui-process/ProcessShell.tsx:6` — `{toolbar && <div className={styles.processToolbar}>{toolbar}</div>}`
- `src/modules/duct-rental/ui-process/ProcessShell.tsx:9` — `{detail && <aside className={styles.processDetailPane} aria-label="รายละเอียดกระบวนการ">{detail}</aside>}`

## A-175 — `src/modules/duct-rental/ui-process/SignatureShell.tsx`

- `src/modules/duct-rental/ui-process/SignatureShell.tsx:14` — `{(preview \|\| controls) && <div className={styles.signatureLayout}>`
- `src/modules/duct-rental/ui-process/SignatureShell.tsx:18` — `{canvas && <div className={styles.signatureCanvas} ref={canvasRef} tabIndex={0} role="application" aria-label="พื้นที่วาดลายเซ็น ใช้ปุ่มลูกศรเพื่อปรับตำแหน่ง หรือกด Enter เพื่อเริ่มวาด" onKeyDown={onCanvasKeyDown}>{canvas}</div>}`
- `src/modules/duct-rental/ui-process/SignatureShell.tsx:19` — `{assets && <div className={styles.signatureAssets} aria-label="ลายเซ็นที่บันทึกไว้">{assets}</div>}`

## A-176 — `src/modules/duct-rental/ui-process/StatusBadge.tsx`

- `src/modules/duct-rental/ui-process/StatusBadge.tsx:3` — `export type StatusTone = "pending" \| "in-progress" \| "action-required" \| "complete" \| "blocked";`
- `src/modules/duct-rental/ui-process/StatusBadge.tsx:6` — `export function StatusBadge({ label, tone = "pending", description }: { label: string; tone?: StatusTone; description?: string }) {`
- `src/modules/duct-rental/ui-process/StatusBadge.tsx:10` — `{description && <span className={styles.statusDescription}>{description}</span>}`

## A-177 — `src/modules/duct-rental/ui-process/TrackingShell.tsx`

- `src/modules/duct-rental/ui-process/TrackingShell.tsx:4` — `export type TrackingMetric = { label: string; value: ReactNode; detail?: ReactNode };`
- `src/modules/duct-rental/ui-process/TrackingShell.tsx:8` — `{toolbar && <div className={styles.trackingToolbar} role="search">{toolbar}</div>}`
- `src/modules/duct-rental/ui-process/TrackingShell.tsx:10` — `{(metrics ?? []).slice(0, 4).map(metric => <div className={styles.trackingMetric} key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong>{metric.detail && <small>{metric.detail}</small>}</div>)}`
- `src/modules/duct-rental/ui-process/TrackingShell.tsx:12` — `{table && <div className={styles.trackingTable}>{table}</div>}`
- `src/modules/duct-rental/ui-process/TrackingShell.tsx:13` — `{cards && <div className={styles.trackingCards}>{cards}</div>}`

## A-178 — `src/modules/duct-rental/ui-request/DesignEditorShell.tsx`

- `src/modules/duct-rental/ui-request/DesignEditorShell.tsx:6` — `{toolbar && <div className={styles.editorToolbar} role="toolbar" aria-label="เครื่องมือแก้ไขแบบ">{toolbar}</div>}`
- `src/modules/duct-rental/ui-request/DesignEditorShell.tsx:9` — `{propertyPanel && <aside className={styles.propertyPanel} aria-label="คุณสมบัติ">{propertyPanel}</aside>}`

## A-179 — `src/modules/duct-rental/ui-request/MetricStrip.tsx`

- `src/modules/duct-rental/ui-request/MetricStrip.tsx:7` — `export type MetricStripItem = {`
- `src/modules/duct-rental/ui-request/MetricStrip.tsx:9` — `label: string;`
- `src/modules/duct-rental/ui-request/MetricStrip.tsx:36` — `className={[styles.metric, metric.active && styles.metricActive].filter(Boolean).join(" ")}`
- `src/modules/duct-rental/ui-request/MetricStrip.tsx:42` — `><span>{metric.label}</span><strong>{metric.value}</strong>{metric.detail && <small>{metric.detail}</small>}</button>)}`

## A-180 — `src/modules/duct-rental/ui-request/PhaseTabs.tsx`

- `src/modules/duct-rental/ui-request/PhaseTabs.tsx:9` — `export type PhaseTab = { phase: RequestPhase; label: string; href?: string; disabled?: boolean; status?: string };`
- `src/modules/duct-rental/ui-request/PhaseTabs.tsx:15` — `const items = tabs ?? requestPhases.map(item => ({ phase: item, label: defaultLabels[item], disabled: disabledPhases.includes(item), href: id ? &#96;/duct-rental/${id}/${phaseViews[item]}&#96; : undefined, status: statuses[item] }));`
- `src/modules/duct-rental/ui-request/PhaseTabs.tsx:30` — `{items.map((item, index) => { const selected = item.phase === phase; const props = { ref: (node: HTMLAnchorElement \| HTMLButtonElement \| null) => { refs.current[index] = node; }, role: "radio" as const, "aria-checked": selected, "aria-disabled": item.disabled \|\| undefined, tabIndex: selected ? 0 : -1, onKeyDown: (event: KeyboardEvent<HTMLAnchorElement \| HTMLButtonElement>) => onKeyDown(event, index), onClick: () => select(item), className: [styles.phaseTab, selected && styles.phaseTabActive].filter(Boolean).join(" ") }; return item.href && !item.disabled ? <Link key={item.phase} {...props} href={item.href}>{item.label}{item.status ? <small>{item.status}</small> : null}</Link> : <button key={item.phase} {...props} type="button" disabled={item.disabled}>{item.label}{item.status ? <small>{item.status}</small> : null}</button>; })}`

## A-181 — `src/modules/duct-rental/ui-request/RequestFormShell.tsx`

- `src/modules/duct-rental/ui-request/RequestFormShell.tsx:7` — `{(coordinatorPanel ?? autoCoordinator) && <aside className={styles.coordinatorPanel} aria-label="ผู้ประสานงานอัตโนมัติ">{coordinatorPanel ?? autoCoordinator}</aside>}`

## A-182 — `src/modules/duct-rental/ui-request/RequestShell.tsx`

- `src/modules/duct-rental/ui-request/RequestShell.tsx:6` — `export function RequestShell({ title, description, parent, actions, current = "requests", utility, children, content, className }: { title: string; description?: string; parent?: { label: string; href: string }; actions?: ReactNode; current?: string; utility?: ReactNode; children?: ReactNode; content?: ReactNode; className?: string }) {`

## A-183 — `src/modules/duct-rental/ui-request/RequestTabs.tsx`

- `src/modules/duct-rental/ui-request/RequestTabs.tsx:7` — `export type RequestTab = { id: string; label: string; disabled?: boolean; content?: ReactNode };`
- `src/modules/duct-rental/ui-request/RequestTabs.tsx:9` — `const defaultTabs: RequestTab[] = ["overview", "design", "documents", "permission", "install", "tracking", "activity", "files", "signing", "summary"].map(id => ({ id, label: id }));`
- `src/modules/duct-rental/ui-request/RequestTabs.tsx:27` — `{tabs.map((tab, index) => <button key={tab.id} ref={node => { refs.current[index] = node; }} type="button" role={isRadioGroup ? "radio" : "tab"} id={&#96;request-tab-${tab.id}&#96;} aria-selected={!isRadioGroup ? active === tab.id : undefined} aria-checked={isRadioGroup ? active === tab.id : undefined} aria-controls={!isRadioGroup && tab.content !== undefined && tab.id === active ? &#96;request-panel-${tab.id}&#96; : undefined} aria-disabled={tab.disabled \|\| undefined} tabIndex={active === tab.id ? 0 : -1} disabled={tab.disabled} className={[styles.requestTab, active === tab.id && styles.requestTabActive].filter(Boolean).join(" ")} onKeyDown={event => move(event, index)} onClick={() => select(tab)}>{tab.label}</button>)}`
- `src/modules/duct-rental/ui-request/RequestTabs.tsx:29` — `{tabs.map(tab => tab.content !== undefined && tab.id === active ? <div key={tab.id} id={&#96;request-panel-${tab.id}&#96;} role="tabpanel" aria-labelledby={&#96;request-tab-${tab.id}&#96;} className={styles.requestTabPanel}>{tab.content}</div> : null)}`

## A-184 — `src/modules/duct-rental/ui-request/status/RequestStatusBadge.tsx`

- `src/modules/duct-rental/ui-request/status/RequestStatusBadge.tsx:6` — `export function RequestStatusBadge({ label, tone = "neutral", description }: { label: string; tone?: StatusTone; description?: string }) {`
- `src/modules/duct-rental/ui-request/status/RequestStatusBadge.tsx:10` — `{description && <span className={styles.statusDescription}> · {description}</span>}`

## A-185 — `src/modules/duct-rental/ui-shared/DuctModuleNav.tsx`

- `src/modules/duct-rental/ui-shared/DuctModuleNav.tsx:7` — `export type DuctModuleNavProps = { current?: string };`
- `src/modules/duct-rental/ui-shared/DuctModuleNav.tsx:9` — `type NavItem = { key: string; href: string; label: string };`
- `src/modules/duct-rental/ui-shared/DuctModuleNav.tsx:12` — `{ key: "requests", href: "/duct-rental", label: "เช่าท่อร้อยสาย" },`
- `src/modules/duct-rental/ui-shared/DuctModuleNav.tsx:13` — `{ key: "communication-cable", href: "/duct-rental/communication-cable", label: "พาดสายสื่อสาร" },`

## A-186 — `src/modules/duct-rental/ui-shared/accessibility/VisuallyHidden.tsx`

- `src/modules/duct-rental/ui-shared/accessibility/VisuallyHidden.tsx:3` — `export type VisuallyHiddenProps = HTMLAttributes<HTMLSpanElement>;`

# Appendix C — legacy/reference and product-gap reconciliation

These are **OPEN / PLANNED**, not exempt. `/legacy/*` route handlers are included in Appendix A and must retain production-denial guards; redesign is not authorization to expose old HTML to production. The two locally present reference HTML surfaces below are separately indexed to prevent equating local native code with full historical parity. Function/tag occurrences are evidence candidates, not proof of approved replacement or live route reachability. For every legacy function, identify native destination/action + parity test or keep OPEN; RETIRE requires explicit owner evidence/decision. This static reference index does not replace fresh upstream SHA freeze or financial/workflow reconciliation.

Additional mandatory OPEN product gaps: Buildings BOQ/quotation/duplicate/version approvals; full Guarantees source workflow/financial/document generation; master-plan Admin access-request/review/security/bulk/import/effective-access details not mapped to a mounted local control; any module parity row marked partial/missing/intentional-change. Consult each input parity matrix and owner; do not synthesize routes/endpoints to fill the ledger. Architecture-only and unrendered helpers stay in the source manifest; they are not proof of a usable feature.

## Legacy reference L-01 — `mods/permission-next/Permission_Next.html`

Status OPEN / PLANNED. Normalized source SHA-256 `e5df95bfb84dead935f3621ab44de076a92a25824aa84dcf25b8046dda1c7f99`. Extracted candidates: 320.

| ID | Line | Named function / control / browser feedback evidence |
|---|---:|---|
| L-01-0001 | 31 | `<canvas id="auth-particles">` |
| L-01-0002 | 33 | `<form class="auth-card" id="login-form">` |
| L-01-0003 | 53 | `<input id="login-email" type="email" autocomplete="username" required placeholder="name@company.com">` |
| L-01-0004 | 60 | `<input id="login-password" type="password" autocomplete="current-password" required placeholder="กรอกรหัสผ่าน">` |
| L-01-0005 | 61 | `<button type="button" class="auth-toggle-pw" aria-label="แสดงรหัสผ่าน">` |
| L-01-0006 | 67 | `<button class="auth-submit" type="submit">` |
| L-01-0007 | 84 | `<button id="mobile-actions-toggle" class="mobile-actions-toggle" type="button" aria-expanded="false" aria-controls="topbar-actions" title="เมนู">` |
| L-01-0008 | 90 | `<button id="add-building-btn" type="button">` |
| L-01-0009 | 91 | `<button id="building-toggle" type="button">` |
| L-01-0010 | 94 | `<button id="user-manage-btn" class="auth-only-admin" type="button">` |
| L-01-0011 | 95 | `<button id="export-csv-btn" class="auth-only-admin" type="button">` |
| L-01-0012 | 97 | `<button id="theme-btn" type="button" title="เปลี่ยนธีม">` |
| L-01-0013 | 98 | `<button id="logout-btn" type="button">` |
| L-01-0014 | 105 | `<button id="filter-toggle" type="button" aria-expanded="true">` |
| L-01-0015 | 107 | `<select class="flt" id="f-status" aria-label="กรองตามสถานะ">` |
| L-01-0016 | 114 | `<select class="flt" id="f-group" aria-label="กรองตามกลุ่ม">` |
| L-01-0017 | 120 | `<select class="flt" id="f-area" aria-label="กรองตามพื้นที่">` |
| L-01-0018 | 128 | `<select class="flt" id="f-type" aria-label="กรองตามประเภท">` |
| L-01-0019 | 129 | `<select class="flt" id="f-install" aria-label="กรองตามรูปแบบการติดตั้ง">` |
| L-01-0020 | 130 | `<select class="flt" id="f-survey" aria-label="กรองตามประเภทการสำรวจ">` |
| L-01-0021 | 133 | `<button id="btn-reset" type="button">` |
| L-01-0022 | 137 | `<input id="search-input" type="text" placeholder="ค้นหาอาคาร... ภาษาไทย หรือ English" autocomplete="off" aria-label="ค้นหาอาคาร"/>` |
| L-01-0023 | 138 | `<button id="search-clear" type="button" title="ล้างการค้นหา">` |
| L-01-0024 | 149 | `<button type="button" class="active" data-mode="map">` |
| L-01-0025 | 150 | `<button type="button" data-mode="satellite">` |
| L-01-0026 | 151 | `<button type="button" data-mode="hybrid">` |
| L-01-0027 | 156 | `<button class="map-tool-btn active" id="legend-toggle" type="button">` |
| L-01-0028 | 157 | `<button class="map-tool-btn" id="fit-bounds-btn" type="button">` |
| L-01-0029 | 177 | `<button class="layer-toggle" type="button" data-status-layer="Permission Confirmed" style="--legend-color:#22c55e">` |
| L-01-0030 | 178 | `<button class="layer-toggle" type="button" data-status-layer="MOU" style="--legend-color:#a855f7">` |
| L-01-0031 | 179 | `<button class="layer-toggle" type="button" data-status-layer="Check Permission" style="--legend-color:#f59e0b">` |
| L-01-0032 | 180 | `<button class="layer-toggle" type="button" data-status-layer="อาคารปิดถาวร" style="--legend-color:#ef4444">` |
| L-01-0033 | 219 | `<button id="drawer-close" type="button" title="ปิด">` |
| L-01-0034 | 223 | `<button class="dtab active" id="drawer-tab-general" type="button" role="tab" aria-selected="true" aria-controls="tab-general" data-tab="general">` |
| L-01-0035 | 224 | `<button class="dtab" id="drawer-tab-contact" type="button" role="tab" aria-selected="false" aria-controls="tab-contact" data-tab="contact">` |
| L-01-0036 | 225 | `<button class="dtab" id="drawer-tab-fee" type="button" role="tab" aria-selected="false" aria-controls="tab-fee" data-tab="fee">` |
| L-01-0037 | 226 | `<button class="dtab role-hidden" id="drawer-tab-documents" type="button" role="tab" aria-selected="false" aria-controls="tab-documents" data-tab="documents">` |
| L-01-0038 | 289 | `function assertBuildingDocIsNotProtected(` |
| L-01-0039 | 295 | `function authUsersFromSnapshot(` |
| L-01-0040 | 300 | `function authRevisionFromSnapshot(` |
| L-01-0041 | 305 | `function chooseProtectedAuthUsers(` |
| L-01-0042 | 327 | `async function recoverProtectedAuthUsers(` |
| L-01-0043 | 360 | `async function mutateProtectedAuthUsers(` |
| L-01-0044 | 450 | `function makeValidatedLocalDate(` |
| L-01-0045 | 462 | `function parseBuildingUpdateDate(` |
| L-01-0046 | 495 | `function formatBuildingUpdateDate(` |
| L-01-0047 | 503 | `function isBuildingUpdateStale(` |
| L-01-0048 | 512 | `function applyAutoCheckPermissionStatus(` |
| L-01-0049 | 519 | `function shouldAutoCheckPermissionStatus(` |
| L-01-0050 | 525 | `function normalizeBuildingRecord(` |
| L-01-0051 | 553 | `function setPermissionTypeFormulaRegistry(` |
| L-01-0052 | 565 | `function whenFsdbReady(` |
| L-01-0053 | 570 | `function setSyncStatus(` |
| L-01-0054 | 580 | `function stripInternalFields(` |
| L-01-0055 | 625 | `function csvCell(` |
| L-01-0056 | 631 | `function makeLocalDateStamp(` |
| L-01-0057 | 638 | `function exportBuildingsCsv(` |
| L-01-0058 | 640 | `alert(` |
| L-01-0059 | 644 | `alert(` |
| L-01-0060 | 701 | `function normalizeEmail(` |
| L-01-0061 | 705 | `function roleLabel(` |
| L-01-0062 | 709 | `function canManageUsers(` |
| L-01-0063 | 713 | `function canManageBuildings(` |
| L-01-0064 | 717 | `function canViewBuildingDocuments(` |
| L-01-0065 | 722 | `function canUploadBuildingDocuments(` |
| L-01-0066 | 726 | `function setBoxMessage(` |
| L-01-0067 | 736 | `function applyFieldAriaLabels(` |
| L-01-0068 | 746 | `async function sha256(` |
| L-01-0069 | 752 | `async function passwordHash(` |
| L-01-0070 | 756 | `function readSavedSession(` |
| L-01-0071 | 765 | `function saveSession(` |
| L-01-0072 | 776 | `function clearSession(` |
| L-01-0073 | 781 | `function sanitizeUser(` |
| L-01-0074 | 794 | `function applyRoleUi(` |
| L-01-0075 | 824 | `function setCurrentUser(` |
| L-01-0076 | 837 | `function startUsersSync(` |
| L-01-0077 | 863 | `async function restoreSession(` |
| L-01-0078 | 870 | `async function initAuth(` |
| L-01-0079 | 887 | `function applySuperAppSession(` |
| L-01-0080 | 907 | `function applyWorkspaceTheme(` |
| L-01-0081 | 914 | `function applySidebarState(` |
| L-01-0082 | 944 | `async function loginWithPassword(` |
| L-01-0083 | 954 | `function resetUserForm(` |
| L-01-0084 | 964 | `function editUser(` |
| L-01-0085 | 982 | `function openDialogAccessibility(` |
| L-01-0086 | 996 | `function closeDialogAccessibility(` |
| L-01-0087 | 1004 | `function trapDialogTabKey(` |
| L-01-0088 | 1026 | `function serializeFormState(` |
| L-01-0089 | 1036 | `function rememberFormState(` |
| L-01-0090 | 1041 | `function formStateChanged(` |
| L-01-0091 | 1046 | `function confirmDiscardFormChanges(` |
| L-01-0092 | 1047 | `confirm(` |
| L-01-0093 | 1050 | `function closeUserAdminModal(` |
| L-01-0094 | 1061 | `async function deleteUserAccount(` |
| L-01-0095 | 1068 | `confirm(` |
| L-01-0096 | 1073 | `async function saveUserFromForm(` |
| L-01-0097 | 1109 | `function renderUserAdminList(` |
| L-01-0098 | 1122 | `<button class="user-admin-btn" type="button" data-user-edit="${attrEsc(user.email)}">` |
| L-01-0099 | 1123 | `<button class="user-admin-btn danger" type="button" data-user-delete="${attrEsc(user.email)}">` |
| L-01-0100 | 1132 | `async function migrateRawDataIfEmpty(` |
| L-01-0101 | 1165 | `async function persistAutoCheckPermissionStatuses(` |
| L-01-0102 | 1186 | `function startRealtimeSync(` |
| L-01-0103 | 1227 | `async function initFirestoreData(` |
| L-01-0104 | 1277 | `function applyTheme(` |
| L-01-0105 | 1293 | `function makeTile(` |
| L-01-0106 | 1336 | `function statusColor(` |
| L-01-0107 | 1342 | `function makeIcon(` |
| L-01-0108 | 1361 | `function showTooltip(` |
| L-01-0109 | 1372 | `function posTooltip(` |
| L-01-0110 | 1383 | `function hideTooltip(` |
| L-01-0111 | 1391 | `function statusTag(` |
| L-01-0112 | 1397 | `function groupTag(` |
| L-01-0113 | 1402 | `function typeTag(` |
| L-01-0114 | 1408 | `function canCalculateQuotation(` |
| L-01-0115 | 1411 | `function isStatusLayerVisible(` |
| L-01-0116 | 1416 | `function updateLegendCounts(` |
| L-01-0117 | 1422 | `function fitVisibleMarkers(` |
| L-01-0118 | 1431 | `function fmt(` |
| L-01-0119 | 1437 | `function esc(` |
| L-01-0120 | 1438 | `function attrEsc(` |
| L-01-0121 | 1439 | `function mapHref(` |
| L-01-0122 | 1445 | `function coordText(` |
| L-01-0123 | 1451 | `async function copyText(` |
| L-01-0124 | 1466 | `function svgIcon(` |
| L-01-0125 | 1485 | `function iconText(` |
| L-01-0126 | 1501 | `function releaseBuildingDocumentUrls(` |
| L-01-0127 | 1507 | `function clearBuildingDocumentsCache(` |
| L-01-0128 | 1512 | `function cacheBuildingDocuments(` |
| L-01-0129 | 1517 | `function buildingDocumentKey(` |
| L-01-0130 | 1521 | `function formatDocumentSize(` |
| L-01-0131 | 1529 | `function formatDocumentTimestamp(` |
| L-01-0132 | 1539 | `function normalizedBuildingDocumentData(` |
| L-01-0133 | 1559 | `function buildingDocumentRowsHtml(` |
| L-01-0134 | 1572 | `function renderBuildingDocuments(` |
| L-01-0135 | 1600 | `<button class="building-doc-category-head" type="button" data-document-category="${attrEsc(category)}" aria-expanded="false" aria-controls="building-doc-list-${attrEsc(category)}" ${categoryFiles.length ? '' : 'disabled'}>` |
| L-01-0136 | 1612 | `<input id="${uploadInputId}" class="building-doc-category-upload-input" type="file" multiple accept="${attrEsc(acceptedExtensions)}" data-upload-category="${attrEsc(category)}">` |
| L-01-0137 | 1625 | `<button id="building-doc-refresh-btn" class="building-doc-refresh-btn" type="button" title="ค้นหาเอกสารใหม่" aria-label="ค้นหาเอกสารใหม่">` |
| L-01-0138 | 1662 | `async function loadBuildingDocuments(` |
| L-01-0139 | 1685 | `async function discoverBuildingDocumentsFromNas(` |
| L-01-0140 | 1710 | `async function uploadBuildingDocumentToNas(` |
| L-01-0141 | 1734 | `async function uploadBuildingDocuments(` |
| L-01-0142 | 1803 | `async function syncBuildingDocuments(` |
| L-01-0143 | 1847 | `function formatPhone(` |
| L-01-0144 | 1891 | `function formatPhoneTelLink(` |
| L-01-0145 | 1905 | `function openDrawer(` |
| L-01-0146 | 1937 | `<button class="edit-building-btn" type="button" data-building-id="${attrEsc(r.id)}" style="border:1px solid var(--border2);background:var(--surface2);color:var(--text2);border-radius:8px;padding:6px 10px;cursor:pointer;font-size:12px;">` |
| L-01-0147 | 1949 | `<button class="copy-coord-btn" type="button" data-copy-coord="${attrEsc(buildingCoordText)}">` |
| L-01-0148 | 1953 | `<button class="quotation-open-btn" type="button" data-building-id="${attrEsc(r.id)}" style="width: 100%; padding: 12px; background: var(--green); color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .18s; font-family: inherit;">` |
| L-01-0149 | 2012 | `function switchTab(` |
| L-01-0150 | 2063 | `alert(` |
| L-01-0151 | 2098 | `function openDrawerById(` |
| L-01-0152 | 2104 | `function buildMarkerPopup(` |
| L-01-0153 | 2121 | `<button class="lf-popup-action" type="button" data-popup-building-id="${attrEsc(r.id)}">` |
| L-01-0154 | 2127 | `function renderMarkers(` |
| L-01-0155 | 2180 | `function render(` |
| L-01-0156 | 2226 | `function getFiltered(` |
| L-01-0157 | 2252 | `function applyFilters(` |
| L-01-0158 | 2254 | `function debounce(` |
| L-01-0159 | 2352 | `function toNullableNumber(` |
| L-01-0160 | 2377 | `function getBuildingInstallationProfile(` |
| L-01-0161 | 2400 | `function getStoredBuildingInstallationValue(` |
| L-01-0162 | 2406 | `function buildBuildingInstallationProfile(` |
| L-01-0163 | 2424 | `function normalizeDuplicateValue(` |
| L-01-0164 | 2428 | `function collectBuildingIds(` |
| L-01-0165 | 2436 | `function buildingMatchesId(` |
| L-01-0166 | 2441 | `function findBuildingById(` |
| L-01-0167 | 2445 | `function setBuildingEditorMessage(` |
| L-01-0168 | 2452 | `function clearBuildingEditorInvalidState(` |
| L-01-0169 | 2457 | `function normalizeOtherFees(` |
| L-01-0170 | 2491 | `function addOtherFeeRow(` |
| L-01-0171 | 2500 | `<input name="other_fee_label" type="text" value="${attrEsc(fee.label \|\| '')}" placeholder="เช่น ค่าบัตรผ่าน">` |
| L-01-0172 | 2501 | `<select name="other_fee_calculation_type">` |
| L-01-0173 | 2502 | `<input name="other_fee_value" type="number" step="0.01" min="0" ${calculationType === 'revenue_share' ? 'max="100"' : ''} value="${attrEsc(value ?? '')}">` |
| L-01-0174 | 2503 | `<select name="other_fee_revenue_period">` |
| L-01-0175 | 2504 | `<input name="other_fee_note" type="text" value="${attrEsc(fee.note \|\| '')}" placeholder="เช่น รายปี / ต่อครั้ง">` |
| L-01-0176 | 2505 | `<button type="button" class="other-fee-remove">` |
| L-01-0177 | 2511 | `function updateOtherFeeRowControls(` |
| L-01-0178 | 2525 | `function renderOtherFeeRows(` |
| L-01-0179 | 2532 | `function collectOtherFees(` |
| L-01-0180 | 2566 | `function resolveBuildingBoqCostType(` |
| L-01-0181 | 2578 | `function applyBuildingBoqCostClassification(` |
| L-01-0182 | 2604 | `function buildBuildingBoqProfile(` |
| L-01-0183 | 2664 | `function hasStoredBuildingBoqProfile(` |
| L-01-0184 | 2668 | `function normalizeBuildingBoqFee(` |
| L-01-0185 | 2696 | `function getBuildingBoqProfile(` |
| L-01-0186 | 2702 | `function getBuildingBoqFees(` |
| L-01-0187 | 2708 | `function getBuildingBoqFee(` |
| L-01-0188 | 2715 | `function getBuildingBoqFeeAmount(` |
| L-01-0189 | 2719 | `function getBuildingBoqOtherFees(` |
| L-01-0190 | 2733 | `function formatBuildingBoqFeeQuantity(` |
| L-01-0191 | 2772 | `function resolvePermissionCalculationProfile(` |
| L-01-0192 | 2834 | `function hasEnabledPermissionCalculation(` |
| L-01-0193 | 2838 | `function getPermissionInputRequirements(` |
| L-01-0194 | 2851 | `function parseStrictPermissionNumber(` |
| L-01-0195 | 2876 | `function validatePermissionMode(` |
| L-01-0196 | 2883 | `function resolveCoreRentField(` |
| L-01-0197 | 2889 | `function calculatePermissionCost(` |
| L-01-0198 | 3083 | `async function syncBuildingBoqProfiles(` |
| L-01-0199 | 3085 | `alert(` |
| L-01-0200 | 3089 | `alert(` |
| L-01-0201 | 3093 | `alert(` |
| L-01-0202 | 3100 | `alert(` |
| L-01-0203 | 3106 | `confirm(` |
| L-01-0204 | 3143 | `alert(` |
| L-01-0205 | 3148 | `alert(` |
| L-01-0206 | 3157 | `function findDuplicateBuilding(` |
| L-01-0207 | 3180 | `function duplicateSensitiveFieldsChanged(` |
| L-01-0208 | 3197 | `function openBuildingEditor(` |
| L-01-0209 | 3199 | `alert(` |
| L-01-0210 | 3252 | `function closeBuildingEditor(` |
| L-01-0211 | 3262 | `function closeDetailDrawerAfterDelete(` |
| L-01-0212 | 3270 | `async function deleteBuildingFromForm(` |
| L-01-0213 | 3272 | `alert(` |
| L-01-0214 | 3280 | `confirm(` |
| L-01-0215 | 3291 | `alert(` |
| L-01-0216 | 3295 | `async function saveBuildingFromForm(` |
| L-01-0217 | 3425 | `function loadScriptOnce(` |
| L-01-0218 | 3440 | `function loadPdfLibrary(` |
| L-01-0219 | 3444 | `function loadImageLibrary(` |
| L-01-0220 | 3449 | `function openQuotationModal(` |
| L-01-0221 | 3461 | `function parseWmFloors(` |
| L-01-0222 | 3466 | `function _updateQuotationDynamicInputs(` |
| L-01-0223 | 3618 | `function serializeQuotationState(` |
| L-01-0224 | 3625 | `function rememberQuotationState(` |
| L-01-0225 | 3631 | `function quotationStateChanged(` |
| L-01-0226 | 3637 | `function closeQuotationModal(` |
| L-01-0227 | 3640 | `confirm(` |
| L-01-0228 | 3646 | `function quickCalculateQuotation(` |
| L-01-0229 | 3660 | `function initializeQuotationDate(` |
| L-01-0230 | 3667 | `function formatCurrency(` |
| L-01-0231 | 3676 | `function formatCurrencyNumeric(` |
| L-01-0232 | 3680 | `function formatPermissionDuration(` |
| L-01-0233 | 3686 | `function getQuotationExportMessage(` |
| L-01-0234 | 3690 | `function resetQuotationExportMessage(` |
| L-01-0235 | 3696 | `function calculateQuotation(` |
| L-01-0236 | 4183 | `async function waitForQuotationFonts(` |
| L-01-0237 | 4203 | `async function generateQuotationPDF(` |
| L-01-0238 | 4274 | `async function generateQuotationImage(` |
| L-01-0239 | 4327 | `function resetQuotationForm(` |
| L-01-0240 | 4408 | `function initMobileTopbarActions(` |
| L-01-0241 | 4413 | `function setOpen(` |
| L-01-0242 | 4437 | `function initAuthParticles(` |
| L-01-0243 | 4448 | `function resize(` |
| L-01-0244 | 4454 | `function createParticle(` |
| L-01-0245 | 4464 | `function draw(` |
| L-01-0246 | 4497 | `function initAuthTilt(` |
| L-01-0247 | 4514 | `function animate(` |
| L-01-0248 | 4529 | `function initPwToggle(` |
| L-01-0249 | 4694 | `confirm(` |
| L-01-0250 | 4737 | `function openModal(` |
| L-01-0251 | 4745 | `function closeModal(` |
| L-01-0252 | 4754 | `function onEsc(` |
| L-01-0253 | 4802 | `<input type="text" id="quotation-customer" placeholder="กรอกชื่อลูกค้า">` |
| L-01-0254 | 4807 | `<input type="number" id="quotation-cust-floor" placeholder="เช่น 20" min="0" step="1">` |
| L-01-0255 | 4813 | `<select id="quotation-wm-select" style="width:100%; background:var(--surface2); border:1px solid var(--border); color:var(--text); border-radius:8px; padding:10px 12px; font-size:14px; font-family:inherit; outline:none;">` |
| L-01-0256 | 4820 | `<input type="number" id="quotation-wm-manual" placeholder="ชั้นที่มีอุปกรณ์เชื่อมต่อ" min="0" step="1">` |
| L-01-0257 | 4826 | `<input type="number" id="quotation-hwire" placeholder="เช่น 30" min="0" step="0.1" value="">` |
| L-01-0258 | 4834 | `<input type="number" id="quotation-shaft-times" min="0" step="1">` |
| L-01-0259 | 4838 | `<input type="number" id="quotation-circuit-count" min="1" step="1">` |
| L-01-0260 | 4842 | `<input type="number" id="quotation-ot-nights" min="0" step="1">` |
| L-01-0261 | 4846 | `<input type="number" id="quotation-contract-years" min="1" step="1">` |
| L-01-0262 | 4854 | `<input type="number" id="quotation-monthly-revenue" placeholder="เช่น 100000" min="0" step="0.01">` |
| L-01-0263 | 4858 | `<input type="number" id="quotation-annual-revenue" placeholder="เช่น 1200000" min="0" step="0.01">` |
| L-01-0264 | 4912 | `<button class="quotation-btn quotation-btn-primary" id="quotation-calculate-btn" type="button">` |
| L-01-0265 | 4913 | `<button class="quotation-btn quotation-btn-warning" id="quotation-reset-btn" type="button">` |
| L-01-0266 | 4916 | `<button class="quotation-close-btn" id="quotation-close-btn" type="button" style="width: 100%; margin-top: 15px;">` |
| L-01-0267 | 5012 | `<button class="quotation-btn quotation-btn-secondary" id="quotation-pdf-btn" type="button">` |
| L-01-0268 | 5013 | `<button class="quotation-btn quotation-btn-warning" id="quotation-image-btn" type="button">` |
| L-01-0269 | 5022 | `<form class="user-admin-panel" id="user-admin-form">` |
| L-01-0270 | 5029 | `<input type="hidden" name="editing_email">` |
| L-01-0271 | 5033 | `<input id="user-email" name="email" type="email" required autocomplete="off" placeholder="user@uih.co.th">` |
| L-01-0272 | 5037 | `<input id="user-password" name="password" type="password" autocomplete="new-password" placeholder="กรอกรหัสผ่าน">` |
| L-01-0273 | 5041 | `<select id="user-role" name="role" required>` |
| L-01-0274 | 5049 | `<input id="user-display-name" name="display_name" type="text" autocomplete="off" placeholder="เช่น Sale Team">` |
| L-01-0275 | 5052 | `<input id="user-can-upload-documents" name="can_upload_documents" type="checkbox">` |
| L-01-0276 | 5059 | `<button class="user-admin-btn primary" type="submit">` |
| L-01-0277 | 5060 | `<button class="user-admin-btn" id="user-form-reset-btn" type="button">` |
| L-01-0278 | 5069 | `<button id="user-admin-close-btn" class="user-admin-close" type="button">` |
| L-01-0279 | 5095 | `<button id="building-editor-close-btn" class="building-editor-close" type="button">` |
| L-01-0280 | 5097 | `<form id="building-editor-form">` |
| L-01-0281 | 5098 | `<input type="hidden" name="record_id">` |
| L-01-0282 | 5101 | `<input name="name_th" type="text" required autocomplete="off">` |
| L-01-0283 | 5102 | `<input name="name_eng" type="text" autocomplete="off">` |
| L-01-0284 | 5103 | `<select name="status">` |
| L-01-0285 | 5104 | `<select name="group">` |
| L-01-0286 | 5105 | `<select name="type">` |
| L-01-0287 | 5106 | `<select name="install_type">` |
| L-01-0288 | 5107 | `<select name="survey_type">` |
| L-01-0289 | 5108 | `<input name="duration" type="text" inputmode="numeric" placeholder="เช่น 30">` |
| L-01-0290 | 5109 | `<input name="area" type="text">` |
| L-01-0291 | 5110 | `<input name="province" type="text">` |
| L-01-0292 | 5111 | `<input name="location" type="text">` |
| L-01-0293 | 5112 | `<input name="lat" type="number" step="any">` |
| L-01-0294 | 5113 | `<input name="lng" type="number" step="any">` |
| L-01-0295 | 5114 | `<input name="wm_point" type="text" placeholder="เช่น 15, 25 หรือ No">` |
| L-01-0296 | 5115 | `<select name="enclosure">` |
| L-01-0297 | 5116 | `<input name="max_horizontal" type="number" step="0.01" min="0">` |
| L-01-0298 | 5118 | `<input name="damage_deposit" type="number" step="0.01" min="0">` |
| L-01-0299 | 5119 | `<input name="contract_deposit" type="number" step="0.01" min="0">` |
| L-01-0300 | 5120 | `<input name="insurance_fee" type="number" step="0.01" min="0">` |
| L-01-0301 | 5121 | `<input name="main_fee" type="number" step="0.01" min="0">` |
| L-01-0302 | 5122 | `<input name="annual_fee" type="number" step="0.01" min="0">` |
| L-01-0303 | 5123 | `<input name="coordination_fee" type="number" step="0.01" min="0">` |
| L-01-0304 | 5124 | `<input name="shaft_fee_per_floor" type="number" step="0.01" min="0">` |
| L-01-0305 | 5125 | `<input name="horizontal_fee" type="number" step="0.01" min="0">` |
| L-01-0306 | 5127 | `<input name="calc_meters_per_floor" type="number" step="0.01" min="0.01" placeholder="ค่าเริ่มต้น 5">` |
| L-01-0307 | 5128 | `<input name="calc_cable_rate_per_meter" type="number" step="0.01" min="0" placeholder="ค่าเริ่มต้น 158.36">` |
| L-01-0308 | 5129 | `<input name="calc_equipment_cost" type="number" step="0.01" min="0" placeholder="ค่าเริ่มต้น 2,200">` |
| L-01-0309 | 5130 | `<input name="calc_odf_cost" type="number" step="0.01" min="0" placeholder="ค่าเริ่มต้น 200">` |
| L-01-0310 | 5131 | `<input name="calc_splice_cost" type="number" step="0.01" min="0" placeholder="ค่าเริ่มต้น 400">` |
| L-01-0311 | 5135 | `<button type="button" id="other-fee-add-btn" class="other-fee-add">` |
| L-01-0312 | 5137 | `<input name="address" type="text">` |
| L-01-0313 | 5138 | `<input name="contact" type="text">` |
| L-01-0314 | 5139 | `<input name="phone" type="text">` |
| L-01-0315 | 5140 | `<input name="mobile" type="text">` |
| L-01-0316 | 5141 | `<input name="email" type="text">` |
| L-01-0317 | 5142 | `<textarea name="remark" rows="4">` |
| L-01-0318 | 5145 | `<button type="button" id="building-editor-delete-btn" class="building-editor-btn danger" hidden>` |
| L-01-0319 | 5147 | `<button type="button" id="building-editor-cancel-btn" class="building-editor-btn secondary">` |
| L-01-0320 | 5148 | `<button type="submit" class="building-editor-btn primary">` |

## Legacy reference L-02 — `docs/legacy-car-booking/Index.html`

Status OPEN / PLANNED. Normalized source SHA-256 `a705578d72f9d33cd3a31162a65260957b451993710a5ff610854d6badf6feca`. Extracted candidates: 120.

| ID | Line | Named function / control / browser feedback evidence |
|---|---:|---|
| L-02-0001 | 272 | `<input type="text" id="employee-id" class="form-input mb-4 text-center text-lg tracking-widest" placeholder="รหัสพนักงาน" maxlength="7" oninput="this.value = this.value.replace(/[^0-9]/g, '')">` |
| L-02-0002 | 273 | `<button id="login-btn" class="btn-primary w-full py-3 rounded-lg font-medium">` |
| L-02-0003 | 294 | `<button id="logout-btn" class="btn-secondary text-sm py-2 px-4 rounded-lg">` |
| L-02-0004 | 307 | `<button id="add-booking-btn" class="btn-primary text-sm py-1 px-3">` |
| L-02-0005 | 318 | `<button id="tab-book" class="tab-btn active flex-1">` |
| L-02-0006 | 321 | `<button id="tab-return" class="tab-btn flex-1">` |
| L-02-0007 | 324 | `<button id="tab-calendar" class="tab-btn flex-1">` |
| L-02-0008 | 327 | `<button id="tab-dashboard" class="tab-btn flex-1 hidden">` |
| L-02-0009 | 330 | `<button id="tab-admin" class="tab-btn flex-1 hidden">` |
| L-02-0010 | 345 | `<button id="book-btn" class="btn-primary w-full py-3 rounded-lg font-medium">` |
| L-02-0011 | 368 | `<input type="datetime-local" id="return-time" class="form-input">` |
| L-02-0012 | 375 | `<select id="parking-floor" class="form-select">` |
| L-02-0013 | 382 | `<input type="number" id="mileage" class="form-input" placeholder="ระบุเป็นตัวเลขเท่านั้น" min="0">` |
| L-02-0014 | 391 | `<select id="refueled-select" class="form-select w-48">` |
| L-02-0015 | 401 | `<input type="number" id="fuel-mileage" class="form-input" placeholder="เลขไมล์" min="0">` |
| L-02-0016 | 405 | `<input type="number" id="fuel-liters" class="form-input" placeholder="ลิตร" step="0.1" min="0">` |
| L-02-0017 | 409 | `<input type="number" id="fuel-amount" class="form-input" placeholder="บาท" min="0">` |
| L-02-0018 | 424 | `<button id="open-trip-log-btn" class="btn-secondary text-sm py-2 px-4 rounded-lg">` |
| L-02-0019 | 434 | `<button id="return-btn" class="btn-primary w-full py-3 rounded-lg font-medium">` |
| L-02-0020 | 462 | `<button id="dashboard-download-csv-btn" class="btn-primary py-2 px-4 rounded-lg mt-3 md:mt-0">` |
| L-02-0021 | 472 | `<select id="dashboard-month-select" class="form-select w-40">` |
| L-02-0022 | 476 | `<input type="number" id="dashboard-year-input" class="form-input w-24" placeholder="2569" min="2500" max="2600">` |
| L-02-0023 | 478 | `<button id="dashboard-all-time-btn" class="btn-secondary py-2 px-4 rounded-lg">` |
| L-02-0024 | 481 | `<button id="dashboard-refresh-btn" class="btn-primary py-2 px-4 rounded-lg">` |
| L-02-0025 | 580 | `<button id="admin-tab-cars" class="tab-btn active">` |
| L-02-0026 | 583 | `<button id="admin-tab-bookings" class="tab-btn">` |
| L-02-0027 | 586 | `<button id="admin-tab-employees" class="tab-btn">` |
| L-02-0028 | 596 | `<button id="add-car-btn" class="btn-primary text-sm py-2 px-4 rounded-lg">` |
| L-02-0029 | 624 | `<select id="report-month-select" class="form-select w-40">` |
| L-02-0030 | 628 | `<input type="number" id="report-year-input" class="form-input w-24" placeholder="2024" min="2000" max="2100">` |
| L-02-0031 | 630 | `<button id="download-report-btn" class="btn-primary py-2 px-4 rounded-lg">` |
| L-02-0032 | 658 | `<button id="add-employee-btn" class="btn-primary text-sm py-2 px-4 rounded-lg">` |
| L-02-0033 | 687 | `<button id="simple-modal-close-btn" class="btn-secondary py-2 px-6 rounded-lg">` |
| L-02-0034 | 702 | `<select id="trip-log-type" class="form-select">` |
| L-02-0035 | 710 | `<input type="datetime-local" id="trip-log-time" class="form-input">` |
| L-02-0036 | 714 | `<input type="text" id="trip-log-location" class="form-input" placeholder="เช่น ขอนแก่น / ปั๊ม ปตท.">` |
| L-02-0037 | 718 | `<input type="number" id="trip-log-mileage" class="form-input" placeholder="ระบุเลขไมล์ปัจจุบัน" min="0">` |
| L-02-0038 | 725 | `<input type="number" id="trip-log-fuel-liters" class="form-input" step="0.1" min="0">` |
| L-02-0039 | 729 | `<input type="number" id="trip-log-fuel-amount" class="form-input" min="0">` |
| L-02-0040 | 735 | `<textarea id="trip-log-note" class="form-input" rows="3" placeholder="ระบุรายละเอียดเพิ่มเติม">` |
| L-02-0041 | 739 | `<button id="trip-log-cancel-btn" class="btn-secondary py-2 px-6 rounded-lg">` |
| L-02-0042 | 740 | `<button id="trip-log-save-btn" class="btn-primary py-2 px-6 rounded-lg">` |
| L-02-0043 | 752 | `<input type="hidden" id="car-id-input">` |
| L-02-0044 | 755 | `<input type="text" id="car-license-plate-input" class="form-input" placeholder="ระบุทะเบียนรถ">` |
| L-02-0045 | 759 | `<select id="car-parking-floor-select" class="form-select">` |
| L-02-0046 | 763 | `<input type="number" id="car-mileage-input" class="form-input" placeholder="ระบุเลขไมล์" min="0">` |
| L-02-0047 | 767 | `<button id="car-modal-cancel-btn" class="btn-secondary py-2 px-6 rounded-lg">` |
| L-02-0048 | 768 | `<button id="car-modal-save-btn" class="btn-primary py-2 px-6 rounded-lg">` |
| L-02-0049 | 780 | `<input type="hidden" id="employee-modal-id">` |
| L-02-0050 | 783 | `<input type="text" id="employee-id-input" class="form-input" placeholder="รหัสพนักงาน 7 หลัก" maxlength="7" oninput="this.value = this.value.replace(/[^0-9]/g, '')">` |
| L-02-0051 | 787 | `<input type="text" id="employee-name-input" class="form-input" placeholder="ชื่อ-นามสกุล">` |
| L-02-0052 | 791 | `<select id="employee-role-select" class="form-select">` |
| L-02-0053 | 798 | `<button id="employee-modal-cancel-btn" class="btn-secondary py-2 px-6 rounded-lg">` |
| L-02-0054 | 799 | `<button id="employee-modal-save-btn" class="btn-primary py-2 px-6 rounded-lg">` |
| L-02-0055 | 824 | `function getAuthContext(` |
| L-02-0056 | 837 | `function showToast(` |
| L-02-0057 | 857 | `<button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600 ml-3">` |
| L-02-0058 | 872 | `function updateActiveBookings(` |
| L-02-0059 | 920 | `<button class="btn-secondary text-sm py-2 px-3 rounded-lg trip-log-btn" data-booking-id="${booking.booking_id}" title="บันทึกระหว่างทาง">` |
| L-02-0060 | 923 | `<button class="btn-primary text-sm py-2 px-3 rounded-lg return-car-btn" data-booking-id="${booking.booking_id}" data-car-plate="${car.license_plate}" title="คืนรถ">` |
| L-02-0061 | 927 | `<button class="bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-3 rounded-lg cancel-booking-btn" data-booking-id="${booking.booking_id}" title="ยกเลิก">` |
| L-02-0062 | 961 | `function showSimpleModal(` |
| L-02-0063 | 989 | `function showConfirmModal(` |
| L-02-0064 | 1032 | `function showLoading(` |
| L-02-0065 | 1039 | `function setButtonLoading(` |
| L-02-0066 | 1048 | `function setDateTimeToNow(` |
| L-02-0067 | 1061 | `function formatDateTimeThai(` |
| L-02-0068 | 1079 | `function formatTimeShort(` |
| L-02-0069 | 1089 | `function getEffectiveBookingEnd(` |
| L-02-0070 | 1094 | `function isBookingActiveNow(` |
| L-02-0071 | 1105 | `function getCalendarCarColorMap(` |
| L-02-0072 | 1125 | `function getCalendarCarColor(` |
| L-02-0073 | 1138 | `function renderCalendarLegend(` |
| L-02-0074 | 1158 | `function initCalendar(` |
| L-02-0075 | 1228 | `function handleLogin(` |
| L-02-0076 | 1265 | `function handleLogout(` |
| L-02-0077 | 1298 | `function startInactivityTimer(` |
| L-02-0078 | 1316 | `function resetInactivityTimer(` |
| L-02-0079 | 1326 | `function handleTabClose(` |
| L-02-0080 | 1348 | `function enableAutoLogout(` |
| L-02-0081 | 1368 | `function disableAutoLogout(` |
| L-02-0082 | 1385 | `function loadInitialData(` |
| L-02-0083 | 1418 | `function updateUI(` |
| L-02-0084 | 1434 | `function legacyUpdateActiveBookings(` |
| L-02-0085 | 1469 | `<button class="btn-secondary text-sm py-2 px-3 rounded-lg trip-log-btn" data-booking-id="${booking.booking_id}" title="บันทึกระหว่างทาง">` |
| L-02-0086 | 1472 | `<button class="btn-primary text-sm py-2 px-3 rounded-lg return-car-btn" data-booking-id="${booking.booking_id}" data-car-plate="${car.license_plate}" title="คืนรถ">` |
| L-02-0087 | 1475 | `<button class="bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-3 rounded-lg cancel-booking-btn" data-booking-id="${booking.booking_id}" title="ยกเลิก">` |
| L-02-0088 | 1506 | `function showReturnForm(` |
| L-02-0089 | 1552 | `function updateReturnForm(` |
| L-02-0090 | 1588 | `function addTimeSlot(` |
| L-02-0091 | 1600 | `<input type="datetime-local" class="form-input start-time-input">` |
| L-02-0092 | 1606 | `<input type="datetime-local" class="form-input end-time-input">` |
| L-02-0093 | 1613 | `<select class="form-select car-plate-select">` |
| L-02-0094 | 1619 | `<input type="text" class="form-input destination-input" placeholder="ระบุจังหวัด หรือสถานที่สำคัญและรายละเอียด">` |
| L-02-0095 | 1637 | `function updateAvailableCars(` |
| L-02-0096 | 1687 | `function legacyInitCalendar(` |
| L-02-0097 | 1736 | `function handleBookCar(` |
| L-02-0098 | 1792 | `function handleReturnCar(` |
| L-02-0099 | 1869 | `function handleCancelBooking(` |
| L-02-0100 | 1899 | `function openTripLogModal(` |
| L-02-0101 | 1920 | `function handleSaveTripLog(` |
| L-02-0102 | 1986 | `function getGPSLocation(` |
| L-02-0103 | 2028 | `function loadTripLogs(` |
| L-02-0104 | 2044 | `function renderTripLogs(` |
| L-02-0105 | 2128 | `function loadDashboard(` |
| L-02-0106 | 2169 | `function renderDashboard(` |
| L-02-0107 | 2274 | `function downloadDashboardCSV(` |
| L-02-0108 | 2309 | `function loadAdminTab(` |
| L-02-0109 | 2325 | `function loadCarsList(` |
| L-02-0110 | 2344 | `<button class="text-blue-600 hover:text-blue-800 mr-2 edit-car-btn" data-id="${car.id}" title="แก้ไข">` |
| L-02-0111 | 2347 | `<button class="text-red-600 hover:text-red-800 delete-car-btn" data-id="${car.id}" title="ลบ">` |
| L-02-0112 | 2362 | `function loadBookingsList(` |
| L-02-0113 | 2393 | `<button class="text-red-600 hover:text-red-800 cancel-booking-admin-btn" data-id="${booking.booking_id}" title="ยกเลิก">` |
| L-02-0114 | 2408 | `function loadEmployeesList(` |
| L-02-0115 | 2425 | `<button class="text-blue-600 hover:text-blue-800 mr-2 edit-employee-btn" data-id="${emp.id}" title="แก้ไข">` |
| L-02-0116 | 2428 | `<button class="text-red-600 hover:text-red-800 delete-employee-btn" data-id="${emp.id}" title="ลบ">` |
| L-02-0117 | 2443 | `function openCarModal(` |
| L-02-0118 | 2465 | `function handleSaveCar(` |
| L-02-0119 | 2503 | `function openEmployeeModal(` |
| L-02-0120 | 2512 | `function handleSaveEmployee(` |

# Appendix D — full source/CSS input manifest and OPEN reconciliation queue

All files below were read from this working tree for source/ownership discovery. Hashes are normalized UTF-8/LF source-content SHA-256 (not filesystem-byte hashes); no generated files, secrets, .env, database contents, production records or node_modules are dumped here. Only production src `.ts`, `.tsx`, `.css` are scanned; test files/tests directories excluded from this input manifest. Tests still must be inspected/run during implementation; “excluded from static extraction” is not a product-feature exclusion. UI/action/route files receive A-identifiers; other source files are dependencies and **OPEN for caller-to-feature reconciliation wherever they expose behavior not already covered**. A stylesheet is not a screen but remains an implementation dependency, including print and viewer styling.

| Source file | Ledger owner / reconciliation | Normalized SHA-256 |
|---|---|---|
| `src/app/(platform)/admin/actions.ts` | A-001 | `20331c65fe0f9c643f506023176958bf9f23388f7d96b37f5f019f4e855cd0ab` |
| `src/app/(platform)/admin/admin.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `dc0f598d1616d66b22b6c7bdaaf0a5a9e776f24ddb5539ecff3728c1d598801a` |
| `src/app/(platform)/admin/car-booking/page.tsx` | A-002 | `72e3365d097eaf096aaffd1f7b20d1565b67b47073171488e6e2571108bb358f` |
| `src/app/(platform)/admin/module-actions.ts` | A-003 | `90b18696d36f2db3e122f847c4f41350495a399fc5e92f4835d1d5633781079e` |
| `src/app/(platform)/admin/page.tsx` | A-004 | `7a90ce66d62f4ca2869cc6be62dd3cae65fad54afec70a538458ffa18576e273` |
| `src/app/(platform)/admin/work-actions.ts` | A-005 | `900942a6d99570b1182a76cbcfd010eb24278a644cc6cc58be66b64f03bb2892` |
| `src/app/(platform)/buildings/[id]/edit/page.tsx` | A-006 | `3bac7c38704c6f1f05c109ddc4af348f08b6825ca0f5704575eac445ae9f191a` |
| `src/app/(platform)/buildings/[id]/loading.tsx` | A-007 | `64c5fc711d8bfc1d2f50cbcbc6c87adf6aa67d879b0b31d60cbc545620a3dc5b` |
| `src/app/(platform)/buildings/[id]/page.tsx` | A-008 | `bb5dd6a1672426f28a3ac17de2c466e8b459d992af3d0a30b32436df8d015d09` |
| `src/app/(platform)/buildings/building-map.tsx` | A-009 | `6db1fa6b2aa33762963e2231c07f9d365564cfaab0d2c34bc09989a6853b99e6` |
| `src/app/(platform)/buildings/buildings-presentation.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `8c00145a071622c93f1e6f4651e08e09c1809017edc1400eb80a9d70ccb5f093` |
| `src/app/(platform)/buildings/buildings-workspace.tsx` | A-010 | `f81be9b63f69cb82e9d656795dd65aa675c3a80d3dac8e8629ae51632572bdd6` |
| `src/app/(platform)/buildings/loading.tsx` | A-011 | `65f12a118d337f0e2289b2c537cd5a5adea98cef98e1228293f64dbb7be51e18` |
| `src/app/(platform)/buildings/map/page.tsx` | A-012 | `571c36c8500390cd2e2e5d814f981638ba022dff512d5a9ab5a922ea63eb82a4` |
| `src/app/(platform)/buildings/new/page.tsx` | A-013 | `f8c2edd69892d4d9e76faa59a71510fca9a8ffefda8eef8114b85267721f72fc` |
| `src/app/(platform)/buildings/page.tsx` | A-014 | `38e560350a0df41672dfe4170ecd4cefc7db2bf40b6dbc86ffdfa92a1ea1f31a` |
| `src/app/(platform)/buildings/permission-buildings.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `ceb9fe093f651d8bb589e7dba82e1b37ce6e17fa73b2edb2b3315d6a0af4f8fa` |
| `src/app/(platform)/car-booking/page.tsx` | A-015 | `62e9726e1479f36cbf236cb5fd158260f0abdf27d57f264dd1c62c22854d969b` |
| `src/app/(platform)/duct-rental/[id]/[view]/page.tsx` | A-016 | `93329c61a41b365686c86c9b9ffa189f833b2134c02a4bde2f746dbb0ae7a40b` |
| `src/app/(platform)/duct-rental/[id]/edit/page.tsx` | A-017 | `09f6246120faeb37e5ef20e9d4c72cc1022faddfe53a28735ee8c75e1a1d998a` |
| `src/app/(platform)/duct-rental/[id]/page.tsx` | A-018 | `afe394e4ac32fbd3f8608bf2bebe46d4e8f05f78bc0b253dd5f7caa235b96b24` |
| `src/app/(platform)/duct-rental/cancellation/[id]/page.tsx` | A-019 | `e2983fe3a3d8fc54dc09d8694c2788a484339a5a7e613d8ca1f148d9b13c1374` |
| `src/app/(platform)/duct-rental/cancellation/new/page.tsx` | A-020 | `f1f3d52912e60f17deb670758eeb1b46def8d7f9336bf0f56ee662dab911f844` |
| `src/app/(platform)/duct-rental/cancellation/page.tsx` | A-021 | `310dee596a5845d991cb0b2a821427bfb6c844aa51e8994e521b9509fbda300a` |
| `src/app/(platform)/duct-rental/communication-cable/page.tsx` | A-022 | `84e4e740a8c48ec29620ef48783058732ac6d2cf0815b6871089f07ac088ed20` |
| `src/app/(platform)/duct-rental/new/page.tsx` | A-023 | `9e5e8275dd603d6aeb079c8630969b7dd1f4b1570cb5241b27848f64f9ae2a98` |
| `src/app/(platform)/duct-rental/page.tsx` | A-024 | `b234d9e7763075553da564f413cb6a7dc06860b957bca930871aea38d6da1bf5` |
| `src/app/(platform)/duct-rental/renewal/[id]/page.tsx` | A-025 | `222093598283ec7d31e11cfd533236e9e0b8e613fcc814d38f4776bf1988ace0` |
| `src/app/(platform)/duct-rental/renewal/page.tsx` | A-026 | `a65928190f4f4c01be944f6136bb0b99dc432dd29fab2399a600f58247ca7f62` |
| `src/app/(platform)/duct-rental/settings/page.tsx` | A-027 | `a533761370207d3c3fcbed19639e4599853d5df20460b67c6fbc83452c30a0a2` |
| `src/app/(platform)/duct-rental/tasks/page.tsx` | A-028 | `250dae713c7dbb0e15480e99ff4d91866e4e23dd30d07f81d963900382bec7a1` |
| `src/app/(platform)/duct-rental/tracking/page.tsx` | A-029 | `e799383c1e70f1852370c0a9bf668192281c3b36b458a737b8ec1a09a8d38a0e` |
| `src/app/(platform)/error.tsx` | A-030 | `11b041d938b676c6fb487ee57118a1f0fc6742b0be032e6b81cabbdd4bc27c11` |
| `src/app/(platform)/guarantees/[id]/loading.tsx` | A-031 | `6d3cca5fac6a5aa01da1d7af6489f1403d14a8675307b05d9170c344688967b7` |
| `src/app/(platform)/guarantees/[id]/page.tsx` | A-032 | `fb85d2279c86e5dccdfee9d3ef3011bb4bd4b157a3c78d88164d3bfd8468fa46` |
| `src/app/(platform)/guarantees/actions.ts` | A-033 | `7d0c0f76384370742547200f8ef75148653dd1b4e15acc51862a585ecd948b61` |
| `src/app/(platform)/guarantees/deposit.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `df78a888497d4a9f195cb7da6fc38ade0f59ef34013a75bf8cd0f7c189889ba6` |
| `src/app/(platform)/guarantees/loading.tsx` | A-034 | `d703ef88dafe55472f0ec8b67a95bdac7b2db2e43afe0ac3d96b8a7e927b69bf` |
| `src/app/(platform)/guarantees/new/page.tsx` | A-035 | `969359681048eddd5e1c5f6e59737e727ee8c3bff92a08a2bf382bdc6424b9ed` |
| `src/app/(platform)/guarantees/page.tsx` | A-036 | `5b844b471d4d46e20d5cf11700ae360f1f6a0ace1a6dcb15511719aa681b6342` |
| `src/app/(platform)/layout.tsx` | A-037 | `371539376bf7ff3330e72f8e7daa7478f09f0751ff4c4273609539536037a2ab` |
| `src/app/(platform)/loading.tsx` | A-038 | `c531137fd22d7fca26c533176f36544c529ad9b3ca06e522eca8affa05e52b17` |
| `src/app/(platform)/notification-actions.ts` | A-039 | `8842fcc72332d32af2cef2e85a0db57dbe688fb42d93b43763396205da5fbe24` |
| `src/app/(platform)/page.tsx` | A-040 | `e8272e471b686067342b3cbd3424f073688d26f07070ca3233b37173cfa99c8c` |
| `src/app/(platform)/work/actions.ts` | A-041 | `073102a760d0751c78a711167190ff05df04fbaa5583a0a0d49fbc784245e5d2` |
| `src/app/(platform)/work/assign/page.tsx` | A-042 | `595168854106dca71a283a4493a3504d3f66ae102959fa3511bd373dd86e18cd` |
| `src/app/(platform)/work/kpi/page.tsx` | A-043 | `c1bdf79ee5b12ba989bfef6e495cccf8e5cd4abc488a635d99c2385d5ec405a7` |
| `src/app/(platform)/work/layout.tsx` | A-044 | `d288e53ecd0de0e9aedc475353f4b4b08efb56ea9bc3aedda9019ee69448e83d` |
| `src/app/(platform)/work/loading.tsx` | A-045 | `65f12a118d337f0e2289b2c537cd5a5adea98cef98e1228293f64dbb7be51e18` |
| `src/app/(platform)/work/mine/page.tsx` | A-046 | `3b08b068543532e4051164cf6e4b20328e3ad1536703fbe70ca0056511a19934` |
| `src/app/(platform)/work/new/page.tsx` | A-047 | `3ece335579ea0da2cef7a96c7a36bf44cd63556ae22796d39350b745340d9869` |
| `src/app/(platform)/work/page.tsx` | A-048 | `6b1c4182fa83441e0de720351cbf74ffac5880503fbd269caabb63cb20f646ce` |
| `src/app/(platform)/work/people/page.tsx` | A-049 | `3b470c5f2fa2902702894d784cbd865014fe4e2fa2b42b1992bb32009c2096e3` |
| `src/app/(platform)/work/reports/page.tsx` | A-050 | `1a346a8089f6b9b5513b635c76d34c90d2bd2f27e99d5330e07421619a6e4098` |
| `src/app/(platform)/work/team/page.tsx` | A-051 | `eb143547afd74d850efc146a45802b22c3bd02af08a1f17f0f0054c937f286d8` |
| `src/app/(platform)/work/tracker/page.tsx` | A-052 | `44dfa5670b7d126634519883f9e4bd66aa1f436b206ad6f1f013bda1511a2b2d` |
| `src/app/api/admin/car-booking/route.ts` | A-053 | `079260ac3ba0f67b6bb13d9b714657a217d0e6e138fdcab5c9ef00c6132f66ef` |
| `src/app/api/buildings/[id]/location/route.ts` | A-054 | `711f1a365e0bca988bac5374925293ee9e97397a3a8ca23dd0d8177ca9a6bbb9` |
| `src/app/api/buildings/[id]/route.ts` | A-055 | `6421202d25331ac2f261cee0d31a4f99adbeea93c72a263633864f47d926159c` |
| `src/app/api/buildings/location-services/route.ts` | A-056 | `f5af70b0d8626645ef5570e0af995d6a77512e184bce6a14ae3d57cd029ab91c` |
| `src/app/api/buildings/route.ts` | A-057 | `c55e6a726909331ad945ea416fdd74e12b4ebcc7ccdc0271d789b98461f1e7c3` |
| `src/app/api/car-booking/bookings/[id]/cancel/route.ts` | A-058 | `155907fdcc8d747d598636af93f8ea49ef341feb0689a97751b8c1e49bf5fd8a` |
| `src/app/api/car-booking/bookings/[id]/gps/route.ts` | A-059 | `20ba3ed257342b17e99648666440b839090c0167f665c0a785b33f21804df7e5` |
| `src/app/api/car-booking/bookings/[id]/logs/route.ts` | A-060 | `8c804b8bf791fd9b6010b318ecf051f80e275ed18dde78bbac210b3c13aa11d5` |
| `src/app/api/car-booking/bookings/[id]/return/route.ts` | A-061 | `c695d92ba98c37f7bb7bfa9bd339641cd407eaa0cf72d1518e3651a712768506` |
| `src/app/api/car-booking/bookings/route.ts` | A-062 | `74ab98b8ffc1907df7b0a8df4e628a58ba479228711eb6cde7ea38a37052b294` |
| `src/app/api/car-booking/calendar/route.ts` | A-063 | `b57b8ea1edea440c4f4f8a53505c5b44633e9b53443dc4638d5548ed19986165` |
| `src/app/api/car-booking/cars/[id]/route.ts` | A-064 | `baf241cbae28db6571f84fc70f3ad991eccee415dffbc36f4c8cca735f6aa542` |
| `src/app/api/car-booking/cars/route.ts` | A-065 | `a2cb966b5efe637d4f2102cf65137f845d279292544af491d873f3eb548e4a0b` |
| `src/app/api/car-booking/dashboard/route.ts` | A-066 | `1ccffc4d122629929e1ba66e0e5edf54bf662722f7b367a383aa0d52caf3975e` |
| `src/app/api/car-booking/osp-sync/route.ts` | A-067 | `4a289cf4008e33ec926818f7d17618b3a8da41739f7909bec4a3272b09684667` |
| `src/app/api/car-booking/reports/route.ts` | A-068 | `efecc6e1ec75b5f6f4696734055cd44cf46912e471a012ad22adaa3196124513` |
| `src/app/api/car-booking/settings/route.ts` | A-069 | `f70c5d6f5acd05ba6c5fd1e4d1c3c65f183ffad0639e6f5305170a58de259264` |
| `src/app/api/dashboard/route.ts` | A-070 | `899f8a53a1903a137e4c012f846fd67849a01c10ac6ec56e9cfb79dadfe50f3d` |
| `src/app/api/duct-rental/[...path]/route.ts` | A-071 | `e07215259536903c8d079832059ebb182f70111dda83c99572348db8ac9a911a` |
| `src/app/api/guarantees/[id]/documents/[kind]/route.ts` | A-072 | `c1480885358f0ea39cade3c74f808c5b44b9d814256128805a84ad9f2993e851` |
| `src/app/api/health/route.ts` | A-073 | `2c261de3fce8e6ce8732446a818133148f6e7d8cfa345c27069fa3c6f2c1ba1f` |
| `src/app/api/integrations/sharepoint/readiness/route.ts` | A-074 | `899dd3636a0bd9ff8455b091ca15948624d3c145736901369607ce1600812147` |
| `src/app/api/internal/car-booking/osp/route.ts` | A-075 | `0e104ddaa8b36a634755cbc936f8d1f31398408092b76bbc56430b5bef08bc90` |
| `src/app/api/nas/[...path]/route.ts` | A-076 | `3d5ca3e03245ac426fced787a373f5802f765ef936805a42f14bc43223470d40` |
| `src/app/api/work/export/route.ts` | A-077 | `53419441b334e8c3554877f3b8bae58cebbfe07c0b4bfebe9ead20f5da4bb742` |
| `src/app/api/workspace/search/route.ts` | A-078 | `c357498c7f3d8496bb5de9aa2b1b6655af36925eb54d4e8d41d145f9f4dedcd5` |
| `src/app/change-password/page.tsx` | A-079 | `c0813e3c13cc339dffeca4a663dba831cb331d3ab5ef5947177e272d97fe5db9` |
| `src/app/fonts.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `53af662724e2426df74e3946da055fb46cdac9fc26f66a52f37373c2f09fe59c` |
| `src/app/global-error.tsx` | A-080 | `218c4b79dd66371c483d622a8514b422b2a06ace0950fc2311173ba83f2ec2c4` |
| `src/app/globals.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `ecdfb88327da4c2e1fae33a27f9e08d48d66427afc4589814d5c5ad5d86ba39b` |
| `src/app/layout.tsx` | A-081 | `b41e9dcfb859f0f443a8acb05bbdd9428879e6aa266b94ac637a0d3b08c2c5da` |
| `src/app/legacy/guarantee/[asset]/route.ts` | A-082 | `13c756b9cea7c881cc39d3a29d9b51bc761a27a65b4f4a49e0da14bcd532a3c4` |
| `src/app/legacy/guarantee/route.ts` | A-083 | `88c7f19d09f8ca2505f4179ef4495c32cc0da7afe9864023f3fd1ef83175e8d7` |
| `src/app/legacy/maxiwa/api/[...path]/route.ts` | A-084 | `3b0dc33231c9b8d9a3cf168786de589562db5d82b03158114c6ceeda95ec6ac5` |
| `src/app/legacy/maxiwa/assets/[...path]/route.ts` | A-085 | `a95bc3fef8b44f170c232ce446c68638acb60f7c6aa364dbf57d20a410f78a0c` |
| `src/app/legacy/maxiwa/route.ts` | A-086 | `029f3daad4235e0e9a47a39641f4be9d792bbf54142417bb4b6d477f8cb94bed` |
| `src/app/legacy/permission-next/route.ts` | A-087 | `4aa57c1411cdf58934c079fd9ee8d8a059ebed4f786f853b355a834f9fcb9ceb` |
| `src/app/login/actions.ts` | A-088 | `82a89542aed98a149797a4a2d5816cc4c3539b64a0055090bfd17c8dcf2dbe55` |
| `src/app/login/page.tsx` | A-089 | `04ce005b48668865c515c7a924a980940529eec465d51c7ecc435d3a4bf62ba5` |
| `src/app/manifest.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `96797c196876a841444634a929b19bb0ba4d3bb00cd9306344757b8eaa745d14` |
| `src/app/not-found.tsx` | A-090 | `9cdc3b92673fc0f209c72dc490c7459672b057ecd190b94a71ab1551ab3397da` |
| `src/app/robots.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `0124c2bf7dfb745fd2a38e11fa2e526ec36ec65686f05a2407937404c48cff86` |
| `src/components/access-denied.tsx` | A-091 | `e21c3c5b93ac65f85b2db1f4d88899e1e7bc0521249e4cfdee68e666a7f25d90` |
| `src/components/account-control.tsx` | A-092 | `3fe8cc95b34e499dc3bac0e5ae71aa82c5f91f07f35be03534583310e3be6949` |
| `src/components/admin-module-settings.tsx` | A-093 | `5a608cc41964a9269c9580351abc6c97ef69c755af53d733cd951b8e1ad9ce89` |
| `src/components/admin-workspace-ux.tsx` | A-094 | `6c35db599050e1dfd8256ae5ee4307e5f6b71e52db331fe08233bcc0598200b6` |
| `src/components/admin-workspace.tsx` | A-095 | `4713a88d1c77791baa8b0d3b7533ed252b1b7c262bb856b6f16da1b9290a6bef` |
| `src/components/app-shell.tsx` | A-096 | `1eac5ed6534565be6bcb998e285c2c625fc2dda41f2c7f306c513d97d3048282` |
| `src/components/auth/auth-shell.tsx` | A-097 | `c3bb318dccf01c2b57ef2880d39ffbd155a61b6d6d32bb9f1009b361bdf1f4d6` |
| `src/components/auth/password-field.tsx` | A-098 | `2aa84fd1825e05c48b8d95824566276b220f144ab193070e3bd425cc931d404c` |
| `src/components/change-password-form-ux.tsx` | A-099 | `af9a3ff6fc3085645781756f05abdb4faa30d213a7e5fab4cc19a9867de23588` |
| `src/components/change-password-form.tsx` | A-100 | `e1de3a6e8dda0cac664180751752c016f77850af2a22981f35ffa9eb4432b2d5` |
| `src/components/dashboard-overview.tsx` | A-101 | `e3df0e03eba6d0e32788e418af7d3960b0889f7b2c8a459d91cbd267d27f121f` |
| `src/components/deposit-editor.tsx` | A-102 | `939cdfac4d9ace0482e03aaa31ef4f71caf97cfea983da2f1fdc49515e97cb1d` |
| `src/components/deposit-evidence-upload.tsx` | A-103 | `57025d22fc8126cb38ae5fa935e4a3c993ce38250a08c098728dd00785605b43` |
| `src/components/deposit-tl-workspace.tsx` | A-104 | `8305ee7ad30e7ceafcdaeb37bb44fc84db3a461894e5926489d5b380eefa7ea1` |
| `src/components/deposit-workspace.tsx` | A-105 | `ceac18e6a694dcc5001238453e0fb286ab94cd1300f70d1d051249552314f893` |
| `src/components/guarantee-executive-dashboard.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `b6bddf5e41f4585276750abd531f6caa71d0a209e76b4741ce353e2ae809eb61` |
| `src/components/guarantee-executive-dashboard.tsx` | A-106 | `1e1adb7a982a079d137afc4a55e752cfdbeb01b2810a11b5eba06ef6298805fa` |
| `src/components/icons/icon-paths.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `9733fd496025fdccce4f9faf970cfa7cfbceeba78f3f216bc2c637215cc9486b` |
| `src/components/login-form.tsx` | A-107 | `647aa8ebe37ab0be56aeb8f391c3504ae0336f4b3dbc82275126f16c01130ae2` |
| `src/components/module-nav.tsx` | A-108 | `30d873ac14aa907983f923660eaf0ae482a23147f8771a09226df5dfdada3e80` |
| `src/components/native-module-foundation.tsx` | A-109 | `c155be88be32f86deb241f599d5aa46a405ad1c2bfe113059418fdc2f2e46480` |
| `src/components/notification-center.tsx` | A-110 | `970196085f038a33ea8f210fbfa2309f3bd4322accb5ab46bda4b806603c25c3` |
| `src/components/ui/animated-number.tsx` | A-111 | `d4a18c04fbec11b0c5fb1aca402d5f51739635fcfc92cc3967e28c2bcb6d74bc` |
| `src/components/ui/button.tsx` | A-112 | `6c078a0190b818c941e4069b109495e86936f98148533cdaefd172d962fadb57` |
| `src/components/ui/empty-state.tsx` | A-113 | `9a508a8315c0bde6d27d2fe48421a9a6dc2e71996e95b32c6952e096d71da0cf` |
| `src/components/ui/error-state.tsx` | A-114 | `be8ec2f288a35c80caca1bbc4205ce9659265c5a062757a63f94b26e3f8083ac` |
| `src/components/ui/form.tsx` | A-115 | `fcbc058c4083a7ea20c5cb515894417fa5c19695edf50d8018eb7d8802adcd64` |
| `src/components/ui/metric-grid.tsx` | A-116 | `f4c196c80da510c15a0f2fd4cd847ceef63130c93d7a0ded3bde49b8697fc542` |
| `src/components/ui/page-header.tsx` | A-117 | `b0287a32361b9616127232b2ef9edd39f3786d17e14403c5697bd5dd85a20c8a` |
| `src/components/ui/page-skeleton.tsx` | A-118 | `7985a593b881d7ede2a343222d5b10f31cf26a5a1cdd60a4a0b76df1bd4f80ed` |
| `src/components/ui/panel.tsx` | A-119 | `22fcabb702c68f531c803301c0fb6d6c810578ff8269e3f19685cc68573331ec` |
| `src/components/ui/status-badge.tsx` | A-120 | `d432d395b1618bbc1d6728cbe488644349bc284dd8a229c89c7b7ef923ca8e3a` |
| `src/components/ui/table-region.tsx` | A-121 | `cf899a36324c1f09eda0298e887ac11ae684441ab1c094c2eb2135bbc1cf8d0b` |
| `src/components/ui/truncated-text.tsx` | A-122 | `8db285c6f3aed4aa8aa2c0ca107e0c47d30e7823ec92575efe8636c123f2ed9d` |
| `src/components/ui/use-dialog-dismiss.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `2dd1658d861bf520c0c71915bd5bf7b636ba2cc0b554285f603696cc5947eaaf` |
| `src/components/work-create-form.tsx` | A-123 | `6588d70462a1e6a442a4e8c281be2400f54238460034f864714ffccdcb04515c` |
| `src/components/work-live-refresh.tsx` | A-124 | `6d821be904488e4fb8a849d3f730d4ef88dc2e331ab84423f35c1ebc8103192a` |
| `src/components/work-route-page.tsx` | A-125 | `6c1cd74ac35ebfb025311d798b3cd1928017bba823d25fadff3a3d333403ba6a` |
| `src/components/work-workspace.tsx` | A-126 | `a42ee2b6f2e8ceddedc23c4f54a63a8086eb689aa7e66f280943ccfabf121b7a` |
| `src/components/workspace-feedback.tsx` | A-127 | `9774e0f73937ebfdbdf460f7f0cfad30b2672dca3051bf05f0571351fdb4e082` |
| `src/components/workspace-icon.tsx` | A-128 | `765ec7bc706460bce2d14b41dc31389d7c35386b85058edc60fb1076a7df66fe` |
| `src/components/workspace-queue.tsx` | A-129 | `0c54add8311f934b0457102bc2c7c994c272211fe9df3bd2d3ba401c68e34fb6` |
| `src/components/workspace-search.tsx` | A-130 | `cb3e360cd23bd1aba2a2b449225bb22902d419087a71c31f941f77e8dc041c3c` |
| `src/components/workspace-theme-toggle.tsx` | A-131 | `8513babfa8a2d560ac5e8ad58324c7b7f38a86d94b4ef6d5cbd4021e6efb31f2` |
| `src/db/experiment-schema.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `a2e009ab7379f53f7e97dc2961172d6e709b728f58f2cc5801ea7f188c608689` |
| `src/db/index.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `ae3713322e5c5506428e3368556614490828e9a9ad6eafbccc6462577bde29b7` |
| `src/db/schema.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `71788c2fa9748eb97bfdb9532f087f1a3fa10095e7564b246aa3e13224165f99` |
| `src/db/work-admin-schema.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `c3d082a87c915236f292118315a3f01e81116927c092cf2556a604ae8093458b` |
| `src/features/buildings/building-editor-form.tsx` | A-132 | `7241d94922d418eaafb6cb94ed40f5a846cae6e9659fd4e0258c8b5a9bbcac64` |
| `src/features/buildings/building-editor.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `169ffcbf3d9be91e795eeaa9d357c44835f60fdb8b79d8cd0ead40c1050341ad` |
| `src/features/buildings/delete-building.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `09dfc74d4df79f6d9d15749b27c557f8fe5084a93b257f6a341996917e760649` |
| `src/features/buildings/delete-building.tsx` | A-133 | `142d74cb84116ce3687ee3343bfb4851e38b427ac15e11fe1e559d1d2dcde7a7` |
| `src/features/buildings/map/building-create-form.tsx` | A-134 | `6f8db24ee4d2a420938e98b19727b426fb567bfb431e1b9cb58e6279fe8bad55` |
| `src/features/buildings/map/building-map.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `8e9d28c64f608e59d630a0a722bff60f2d903e7aeb910c03d72f4c9ca0590553` |
| `src/features/buildings/map/location-picker.tsx` | A-135 | `e2ff1d6123317f9123a2a33287c276257afb8f21f008aaa96314294fbef6bbab` |
| `src/features/buildings/map/longdo-map-adapter.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `4150f63a70215f2dba7462b7995a306dfb3766a56f1f6ffc1f456586571b8c4e` |
| `src/features/buildings/map/longdo-map-canvas.tsx` | A-136 | `9740169f1d442d3e4343e2a8c0df8d6b690094f74b1aa44477937def59a55c08` |
| `src/features/buildings/map/map-workspace.tsx` | A-137 | `f5358c3c2b59909c5a9b3ae1148d1e31aeb7ce248934733afebe5510efbdf57d` |
| `src/features/car-booking/car-access-workspace.tsx` | A-138 | `8428cb4f9953c9da8432385eb203ccb4e65f96e3561b43c57a01e459e785e7f8` |
| `src/features/car-booking/car-booking-dialog.tsx` | A-139 | `43597538600e1b08dc1aa5ee445eb96a76c6ae5474ee18725f6fc75f9b78e636` |
| `src/features/car-booking/car-booking-workspace.tsx` | A-140 | `4de7ee13a5cb9f73a8fcaf6851b1c932fcaf9bd02ef3fd94df54287f21af3c8a` |
| `src/features/car-booking/car-booking.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `1ed2680551da5604db0c3001c0c8e3094641cb107ca05738a775ef7a43885b90` |
| `src/features/car-booking/car-calendar.tsx` | A-141 | `a0646bb7ee6db362695d694ed964b786baa384d7e21c4e463d9b56e5ef9db91c` |
| `src/features/car-booking/car-journey-map.tsx` | A-142 | `ca6f7e187cd9f9944f04043817ae3160c989734293a27cb839b61c378433bc24` |
| `src/features/car-booking/car-reports.tsx` | A-143 | `80b6f2194c6249ce35f8e15e0cba7e23cdc30ef4321be03e768c1279f79844b4` |
| `src/features/work/components/admin-panels.tsx` | A-144 | `8926001dedd5e38ac5b0ff9980563a874d9457b8b92463d87edf8897fdc2eafe` |
| `src/features/work/components/report-tools.tsx` | A-145 | `bfa223c53255458bb07eee01ab7a566e9244e9c4db3228e48524204a522bf0d9` |
| `src/features/work/components/task-actions.tsx` | A-146 | `41f12cd4e4559c2dd6f4988b408a19088e21ed6c058307c0a51827194b802b70` |
| `src/features/work/components/task-kpi-fields.tsx` | A-147 | `9894b92e72d75563f1c02ed3f9ac81fcdef5833d3e77884df7a6d4e2f37f5bd4` |
| `src/features/work/components/task-table.tsx` | A-148 | `93a753e6b97dedb7806ddf6da6b8316556cc3964c4793fcb9faaa4fe8914a325` |
| `src/features/work/components/work-filters.tsx` | A-149 | `fb3e1386f2cf0ef3d1468295a3ce88d99ceced145e5c11d82556e6e79fe31ed2` |
| `src/features/work/components/work-list-presentation.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `8064eaae359c9503a06d2f6f61b248ea4b35574ec6e50da6f2c3ae681ca4d38b` |
| `src/features/work/components/work-screen-shell.tsx` | A-150 | `54d1c3f2031a03f5fa0ce95e1b74cf7c5c15ff40f96d694d513e92e6d5b7b3fc` |
| `src/features/work/screens/assignment-center.tsx` | A-151 | `ffcc55bc06b4ba50452e2ec2408e7470d055bd6322abe0d6b1699f4597c27faf` |
| `src/features/work/screens/job-tracker.tsx` | A-152 | `2e6da0a50b0776f60b9175b0389720fc7c61c23318189f404f672ab267a4e65c` |
| `src/features/work/screens/kpi-workspace.tsx` | A-153 | `65b98743295f71c740810835b162621c0d0eca3fc894a0a4850d8541c94fb513` |
| `src/features/work/screens/my-tasks-workspace.tsx` | A-154 | `4479563ccfe44b10187a42bac35272f6803e0c364abcc162cd13604e605f606d` |
| `src/features/work/screens/my-work.tsx` | A-155 | `c3cb16d303aff50290ff1883c6a5d80c93c3d2b903244876cd3eb9258afe9c83` |
| `src/features/work/screens/people-overview.tsx` | A-156 | `891e3294fa5a4a08506d6d6db6d9b3b461c60489975eef69f6b2a82366df5286` |
| `src/features/work/screens/reports.tsx` | A-157 | `dc5459063f7984995817df3741452d4bb1d8d22384994d191f6f4e0a3c0dc672` |
| `src/features/work/screens/team-command.tsx` | A-158 | `9492f7eb7e3100439727ac08ac59efeca1c4bf308c16d978cc2d73de92d284e0` |
| `src/features/work/screens/work-list.module.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `2b2752462dcd9296b721468ec895721a77e60312cd402e5bb4856c78bc348d99` |
| `src/instrumentation.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `7e2143e673741f3d3093cfde9cc166033b0711e0cbd09e16037f50c024b5152b` |
| `src/lib/access.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `004d5055b23735eef33a3679d5c1935fac564df1e3e453244a1c6c830475817c` |
| `src/lib/admin-access-contract.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `c65a357d25d388f4a343448ec3bbc50a89258389f4aad19aefcbd68ae6600ac8` |
| `src/lib/attachments.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `78364a677f02968d88a17d9dc721bebfb63d05a7cf09fdc4a1a6a87e8791df1d` |
| `src/lib/audit-log.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `fa7efbba0198b9338e80076f7bd88b90d0cf2740125de0c236a07d355a249e0a` |
| `src/lib/auth-rate-limit.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `f2cb7051f8fe099481e43c75ed86c2cd4661ef8d360d389a1fe2484efef039c1` |
| `src/lib/auth-session-service.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `aadd205e69069230e44bc1611776e464337b7f62554890c2c66849af8e76640e` |
| `src/lib/auth.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `569aa416fd267c12aaacd62d0035823b224096883f2778f62539d763d7601bca` |
| `src/lib/authorization.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `d66ae2657cbcadad9f1811d4d62e6a6495c715d62b1382e61988e1d79122832a` |
| `src/lib/automation-engine.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `1dab9ac2a0dbede8fd4497f12aa5694e31afc34a718cf82f8104f0ac42ffdcfd` |
| `src/lib/build-info.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `74d2a2a20e33c1913c19bdad47eb91719d0716b876fb10ad89248097e26ffb71` |
| `src/lib/building-360-server.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `74a0a940824c299487ebc088fe606cc1ea0dbe4c2f05b1cda2357951ba69412a` |
| `src/lib/building-delete-policy.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `da1b48b49a3d693c7bfe32a5a86bd9e55624814e72b026f7e5cff650b381f216` |
| `src/lib/building-delete-server.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `7eb7c7d9a1704db8b740503ec3c5863b5b0e881395d687723638bc5c6c458ccb` |
| `src/lib/building-editor-api.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `efe3ab2c549ef2805c4569a4bd72cd9dd4f4fa3bbab888f251e3b11373e132be` |
| `src/lib/building-editor-server.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `8e77a6c5bd10be1d3ea86937f3031abdbcfafeb4e206dc3625152eb073387438` |
| `src/lib/building-editor.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `56865a470357aa1d80c906b7c611ebc3415c1f211f9ede1ebf6adce7e8a4e773` |
| `src/lib/building-location.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `d099c8584c3c6e77751cedbefa0e8be631a8efcd430b849ef19b296013407407` |
| `src/lib/building-map-domain.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `283e67b1df2d460f7a64b9811fba461e33b0ac0a95729e06420a600cc699cbfd` |
| `src/lib/building-map-url.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `a97760027c04c2eba68a665d60cba69cb81b382e559c1c8652b251e8650adedd` |
| `src/lib/building-query.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `4c21257881d1ea2d333807e14b28e6b4305bfe0739a69fc432f1335d3d918fc0` |
| `src/lib/buildings.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `fa2fcdd3efd3087b56c37522088ff47628112321768ee2ee525372ce59661f67` |
| `src/lib/capabilities.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `024c3be312941d7a06c22dd8c433e49ba93cb1d440dda227c5872d48ab631446` |
| `src/lib/car-booking-access.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `75ba982280e31c4dfa96c593aa554fec8c5d3147c5703699238481e8aa3d17bc` |
| `src/lib/car-booking-api.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `9d3d1f274d651de90e694777862e2b49f6bffb2acdf782e761184a183526cbae` |
| `src/lib/car-booking-calendar.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `66d97678245cc7526675cec58cf65e6892cbaac6d6a5afcc7166b55e9e81fba2` |
| `src/lib/car-booking-db.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `d9ca9bad190635dc8da522cd1708b46cd0c255ec10b0affee11c691577181510` |
| `src/lib/car-booking-display.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `1e62cb35466d4beb200923930680c0c2301a1579a063e6353312db5af16805da` |
| `src/lib/car-booking-google-sheets.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `b5f8c61cef8c67452166cd182b10717df9bed7051556bbd036737cd60b58e37b` |
| `src/lib/car-booking-input.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `4002e749c1fb22da19aba70dfb52ccda50034e6df588711d78bc1a31c97db831` |
| `src/lib/car-booking-maintenance.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `f7012540c79351af94c8bb7d75768606349be5ea523cb5fc5a546abae5d5d29d` |
| `src/lib/car-booking-osp-jobs.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `3e79a58c86c57bae04c3050d76a756db4ff623734bb6ee9aa7bcfb2125cb7bbf` |
| `src/lib/car-booking-osp.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `e729b59961c7e482e2be94115cd0bf63cf6c71c0f5915a55943b269b2ed8ed8e` |
| `src/lib/car-booking-report-service.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `8fba5dd09c0695de1560bfa153e85d07a37c02c854620a0b16d486af819d95f4` |
| `src/lib/car-booking-service.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `67f68caf1641cc31af81fcd454ed68a41566739c8ac712c00065713c782a9826` |
| `src/lib/car-booking-settings.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `aee36a09689903ca286bc836422f2bb1da3c9860f7a35460d16ea02170a35149` |
| `src/lib/car-booking-sheets-plan.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `4b487fa32164683ee3e9323b51360533f4fb36e0c3e7f931459623ea79614295` |
| `src/lib/copy.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `6bd09b04fc01e60146c2c17a90fd6ac489ad7b3af8d6d634bfd002293bd6cb8f` |
| `src/lib/cross-module.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `f702fb86fdd21d2c5dec7861355a50f61a18e585cf18eea83ba6f1184822333a` |
| `src/lib/dashboard-server.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `de174de087df2aa9c7811e23657db88f0d40e20a6cac10a320f12b853839b463` |
| `src/lib/dashboard.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `9e1e5311c6085636fb77612180d3a7aae7a99d09c20c51122768e63c4931315a` |
| `src/lib/deposit-v2-domain.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `1aff599ed0fbace1c0f8f0d81258b6112594651c8246f0a500667326df959f89` |
| `src/lib/deposit-v2-preview.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `27563f0b0939c8f9498b643099be85b45c11d1714fd25faf272a4b188839232d` |
| `src/lib/deposit-v2-server.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `cc9de5584699378d6a77bbae64dd73f1794a580639f9751e9ea4be3edd939637` |
| `src/lib/deposit-v2-workflow.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `9bdddd10a45a27701dc4576d0be711495241dd0bd5b873cfe4914e37b9b90158` |
| `src/lib/env.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `450cbff3c58693eba782ca991cd00e98b70aa6e045d3b52ff325c25b5c058b4a` |
| `src/lib/guarantee-domain.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `c9779a2a01130cb52ffdbe3c1a3ec7c477e1e6b38a056dbd51a668a35a0d7baa` |
| `src/lib/guarantee-evidence.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `aa0601d159b079474ef1bbb0eeb2e4b3907753f12e13d40e1b68d542102747f3` |
| `src/lib/guarantee-storage.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `b1d2bc29e8cb1d4c913be1c0646023ddd15fb975307b80d736fdd0a65bf58d0a` |
| `src/lib/guarantee-view-model.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `1f5edbd8c35ef160d684d8dbc49ffa1a8c8c8517ca4eface21253d298640a849` |
| `src/lib/installation-team-context.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `729b954db87014b7dfcb61ab4f9d30e03d86031698058b5a1ac903fad0726c3c` |
| `src/lib/kpi-engine.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `6687bac24971ac529da4a9991f81527c8ad0b9ab733d2ab3868c1595fffced81` |
| `src/lib/live-refresh.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `848f4fb31f4ed75df5b609c99df91b4bd4bd4454aaf2695c91a0bdc517ce265c` |
| `src/lib/logger.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `b84ef94bfb390b2567f7d96de24f112806a992085285248eb3e71805a06d5197` |
| `src/lib/material-change.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `73eb71055daa35181c9190298d2b22bee9224ed9fc068730405a63f6ee986c19` |
| `src/lib/microsoft365/config.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `1cc637fc4419fc389f73799f893bb26e44dea9798f8c80f6eaf7011f46b47bab` |
| `src/lib/microsoft365/graph.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `1e2f894cc24864021be6759304774f8a0b0695c36ee02d01602d10bfe4fbf0ed` |
| `src/lib/microsoft365/sharepoint.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `35af3ed079a2d20e0784c44265ee9658def651c3b094d876ab425331a613d02f` |
| `src/lib/migration-reconciliation.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `adb81045dfc28d6923747129e486b2e5b1c946940fe1cfcc47b6fce2161a3869` |
| `src/lib/module-contract.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `4c7eee93f4a05508f5aaa2710c7df5bec80f1f0b9e091f2a1b8aac36baf50b54` |
| `src/lib/module-lifecycle-contract.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `437131fd1283975012a1dd9e171530dec0e67089e3ec4c75f9d6e4ddba4ee2db` |
| `src/lib/module-lifecycle.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `7815f4f976789adfad5e956d09f339475e964d33de36da963573465289de6649` |
| `src/lib/module-registry.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `40d1cd7ce0e5fa3a22dbdb235f8d5e670334c9544e0336c34635ec25c99c941b` |
| `src/lib/nas-bridge-path.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `b527ab569fbde500f4f67e4665a3a2a839c79e2f0b02b1dfe2fd39391cd4bad7` |
| `src/lib/native-dashboard.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `bf21efe3498a8278cae36caa4f060f8b30d24823792b1023a29ddc7e0750e6f2` |
| `src/lib/notification-inbox.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `a625111ccd251b763c140d1305043db573931103878e86404d0f5c5eb8f273ea` |
| `src/lib/notification-policy.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `d84b3e84464bc677b410f8207fa5b1a435521f45813912ad87cb80fdeaf136a2` |
| `src/lib/notifications.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `d1b1250634d737c254ae64f77e13ca98b0c3ad463a9ec530c363e1bb18840394` |
| `src/lib/password-policy.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `62a5d1aa620acd5b207645cfb1e3928751439dcd5593cdd5562048e5661f29de` |
| `src/lib/permission-building-domain.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `674392e7750a3865ccb45126a0d74627a674a467589e468e9bd20c8503152954` |
| `src/lib/permission-building-server.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `dfbdd5dd682f641db785b356127d1661f118a4663867bcf3ce97d8d2762a41a2` |
| `src/lib/permission-quotation.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `b648e6d6a09d1cae8b24e3e3c7500212d6fd17f91e7071c6be152d5e55895544` |
| `src/lib/pricing-domain.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `8774a83f86ed4228a106aefc7a5c2229e07065f1768735d27830c394d6a91e5c` |
| `src/lib/request-context.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `7c796cf25b2d833f58ac45d5d8e1e21c26299396e73a7f106e13d926ba1893ba` |
| `src/lib/safe-next-path.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `409e036470399869c0a7eccc944cc503b764a2447c0e664ce797800927717ac5` |
| `src/lib/session-duration.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `8bfdbd0175f988e27a1b4ddaed62dae28069cac1c3a80371a1fe43a9e058b995` |
| `src/lib/session-fetch.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `2c7c2e324626eea17defccdf4f1556a1da241fe5e4bc45858e96e7a2f8568af9` |
| `src/lib/ui-fixtures.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `1a980b04c4a1626bb390b62fc54e7ad5b7cff40855c5ba3f3ed36a472efac143` |
| `src/lib/work-admin-domain.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `973c866d987182dac059d36b39c4e03e8ad93c65eae4a3d186685f306bf057c3` |
| `src/lib/work-admin-read.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `987deb846746c0c576256dfe224b3ce840e92887ed798ec19b13e718e48ae82d` |
| `src/lib/work-admin-service.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `8c912228cba7f8e4ba48117c5a5e50b2868ed9fb3e1e45b495f6995f98c205e9` |
| `src/lib/work-create-service.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `3566f41683f1221d685d64a52bce3cf659296ac4034286c5016409f9b2acf31f` |
| `src/lib/work-domain.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `c82f897cb1c79f2d161c91d55e0501f66c242fcd58a0b3136001bcd8b6ba67ce` |
| `src/lib/work-kpi-catalog.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `eb18b7a2f9ac9173e69faf0aa0d10e627d17d8b602cdc87bfb4bcc427b7118b8` |
| `src/lib/work-mutation-signal.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `ba259383e720c0e3880711f5a5c34ee0a590bdb27b398f1f9d0a3fadd066b96f` |
| `src/lib/work-overview.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `5acc55955966244ae6666ee44905be6448f3bbbc94585ecf47dc75532c1a156e` |
| `src/lib/work-page-data.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `1feab914912b70d8907c9c151b8c1a82a299c2d2218f20fe58e70d3beec6bcaf` |
| `src/lib/work-presentation.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `084603b7f1f99225298612945d074fe198e662889ed97bf27365224b44da38a8` |
| `src/lib/work-query.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `2468f65e88f59e44f92875ad1f99cb3a57665cbe7455351fb20b46d8c5b68443` |
| `src/lib/work-read-model.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `6babeef4bf71bb7204662fa6dac2aefcc19303ef37c0239bc6f72666500a0000` |
| `src/lib/work-recalculation.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `9fca5df6754d379125ce6d685436d3e7caf5f993af9bbe86e385e50c12718375` |
| `src/lib/work-report.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `df70c645c9aec90666b98064d835e3ae2a70d25eb2388e99e4994cd41ccb1a71` |
| `src/lib/work-service.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `d7667e15f4a72efd75624178f41f843d3ce22c055489d034cd620745f83b3de6` |
| `src/lib/work-sla.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `14bc0de870103c168971c51585ef2aca9429e5fdc38b8f815d3969e4fe907603` |
| `src/lib/work-task-policy.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `dc1f16b15587153072c7cb57fe055aa98b1ccc308f65bf83b71f944a06ae4a08` |
| `src/lib/work-task-service.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `96f85cfa3cc201f404aa696acae4e4abe972a9d9e3beea82fd817739be48af58` |
| `src/lib/work-view.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `a3547559d94dddd2cae3b5446f120cf4a7f34691af4b0093cbbad5724f3c1e3e` |
| `src/lib/workspace-preview.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `f3ab9c25ba8e45f76e51794e7853b659f84cff8564b60a168960fdd7d95f7b42` |
| `src/lib/workspace-server.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `e619df1056d5855b76acb691e0ceb2ff2e00b3e6f8b71d6f33edcf1ffdd4ec5e` |
| `src/lib/workspace-view.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `2917b147bd7e11d2bfdd037a9d284f64277f51d2460d4a3376a0c72070f5acd2` |
| `src/modules/duct-rental/capabilities.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `f9f5e35de43e71a9b1bcdf9b2c1b24eb102dbdeb57ba25fd980f2c1d992906fb` |
| `src/modules/duct-rental/components/api-client.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `9838a2aa662ce17616ecfb4ec5285b2d060655963d64260af68c964688b66190` |
| `src/modules/duct-rental/components/attachment-picker.tsx` | A-159 | `ee4e85e266707ebc0bc2b21c477de6aedd8307e9752f2c2cef8391dbdac6f6eb` |
| `src/modules/duct-rental/components/cable-test-workspace.tsx` | A-160 | `520fe6dbb89e214412e1c81d8521b12d4d99fc160853b17fe821cf750e384b20` |
| `src/modules/duct-rental/components/change-signals.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `a13a2e58b29ae3b643b13284716dc631133f8dd6994adfeea5e98bf55bf47eea` |
| `src/modules/duct-rental/components/common.tsx` | A-161 | `088caae5fde8c95270c539eb02450c5d8ef398f00ab8d531d3a4fda1dede5408` |
| `src/modules/duct-rental/components/communication-cable-workspace.tsx` | A-162 | `0c1d85dfaf03335a5fbe817ac76ba9370734f60d145cbd766ad4502014ed1e3d` |
| `src/modules/duct-rental/components/design-editor.tsx` | A-163 | `cbaa59955bb97aab849d86c6544b72a950029be74e779eab93495059df6fb5fe` |
| `src/modules/duct-rental/components/file-list.tsx` | A-164 | `0c0453fa363436eee9a8ba1a65636e0d624a3d3b0a93ac2c71b93c1274b52e9c` |
| `src/modules/duct-rental/components/pdf-viewer.tsx` | A-165 | `aa1f6cb5771c230675e641bc8e41e206f0e68102419bd8a93e9893ae30508ba3` |
| `src/modules/duct-rental/components/process-workspace.tsx` | A-166 | `35168a7dfb7d244aa0c45fa81e8ef693493b64b96d1c39337d3e4aa676bbbc6b` |
| `src/modules/duct-rental/components/request-form.tsx` | A-167 | `83b775a5d275ba39706566b9504b0d79559be15f153fc3f15355d4c09721a138` |
| `src/modules/duct-rental/components/request-list.tsx` | A-168 | `4cb42cee2892029b398cfcb35ac844a6a2c0bdf4a1ebf8bf29710471a3e8fd97` |
| `src/modules/duct-rental/components/request-workspace.tsx` | A-169 | `665148997297aaed30408f20bd741d0586e5228fefe30ac1a69f9486f0fbe3d6` |
| `src/modules/duct-rental/components/settings-workspace.tsx` | A-170 | `00d307c7cc69321edcd49ccdea34772656159de9c13c812d3a737dd09e6b6837` |
| `src/modules/duct-rental/components/signature-workspace.tsx` | A-171 | `176a8164af7c3f0db4aadcd772d938e207fc29c2fabf0efa91fbbcafc6ce56a9` |
| `src/modules/duct-rental/components/tracking-workspace.tsx` | A-172 | `1357a29a429ea8c909e6d8a6c5e76472ca9d4be1fb10a545eabb05083f12963d` |
| `src/modules/duct-rental/components/use-resource.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `04c73ef8e020898b0dbad4eeae04484d11219c4e6d18563ae86ecc2f7724bff6` |
| `src/modules/duct-rental/domain/cable-workflow.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `7944f782bacab4502621a1d96993fa6d3ad488d13a578fbac5c657806c2ec6ef` |
| `src/modules/duct-rental/domain/cables.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `54d8eafef48edac5b543dbe8740df64de0e6f7a016e9e846fffbb6fd35b54c54` |
| `src/modules/duct-rental/domain/import-planner.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `5065d8e6d316993a3454ae8a03dce7f389c0c1a4ce1c594dddea48acae49d2a1` |
| `src/modules/duct-rental/domain/money.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `5287f4cdeca94f4f3d02040eea8f1d202944ee6ed44bf35df3855ed7950c3838` |
| `src/modules/duct-rental/domain/pdf-fields.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `fc0b4a8dc916dd0a6eb7f7a2131443b0a0733ddcb7d132fc717164a43f3610fe` |
| `src/modules/duct-rental/domain/role-presets.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `bc6f84dcbb9c3ed3865a9ab29540744509a7c5f4b528b6456ec7076ab7829346` |
| `src/modules/duct-rental/domain/signature-controls.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `8001e4eb908b65299010e2996686632cd7f41cb7dfeb5e8097ba8a5f0b2566d8` |
| `src/modules/duct-rental/domain/signature-image.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `4011643944d7e2465b4c7b5022e782d02dcfa07d9517dc606aff6c259853a542` |
| `src/modules/duct-rental/domain/signature-layout.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `7f3d374441a9747ea4d7a0b81f189d62becb1c9df9876b77d0a1b155139a47c7` |
| `src/modules/duct-rental/domain/source-financial.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `288f7e4ed3766520078a1cb96ddb076d725c1e77746ba6b44b8376f9b9275cea` |
| `src/modules/duct-rental/domain/source-policy.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `2d137a2f7b0fafdbf59b606bd4b3004f536359a191a26ffd6bb2d317bce1bff2` |
| `src/modules/duct-rental/domain/submission-gates.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `a1cecfb7d9161b802cca0ae2841e701e5cabb06cb04c465808c2c3265facdf94` |
| `src/modules/duct-rental/domain/visibility.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `6c328c8db5e70c4a92d82ed2e8526dd50556e182d3a6c71315489196f876d636` |
| `src/modules/duct-rental/domain/workflow.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `16f8fca0f7988fcd26ea58e4a9f1d800cda970c66ad78a17c6a22299622a5f19` |
| `src/modules/duct-rental/manifest.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `c30d7dccbe525d1cd555781c8e019ba14d4811bdbf29c25e735040f23371b892` |
| `src/modules/duct-rental/route-ui-contract.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `6707144e27e8123cb801707011ebfbf6cd73e2f37f32e8a4fcabd211d0189902` |
| `src/modules/duct-rental/schemas/design.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `e8ef241f84f8fbce2a8c0255b236051176c786315e2f05fbeac30a77ca5710d3` |
| `src/modules/duct-rental/schemas/operations.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `15a6e88d919e7315c3b16c8901803c22b13561c960703139cedccee5815707a4` |
| `src/modules/duct-rental/server/api.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `07ff49d7289b0daff4412c2c85983a5a1cfe38249aceb77cb414cc2b9836a8ea` |
| `src/modules/duct-rental/server/cables.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `7ff21a49d5dd009e07b73743e39bb93b0521b3e516458dc125bb53ebec254ed8` |
| `src/modules/duct-rental/server/db.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `b535636810ddf1d404872579590c60967359adb70c362f4d72ebc4ff12af2730` |
| `src/modules/duct-rental/server/events.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `1ab549667651e6cd804666d3225b8ea83679a4623cd72f297c9e2f2003f39cd1` |
| `src/modules/duct-rental/server/files.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `bb0b14d1823911439408d9363bad01810b32e4819dec499f7ed337470ddf5433` |
| `src/modules/duct-rental/server/options.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `dfe3db9d3d83e271ec8c087d9de043641144c2cf2c3bc8f2af90a27ddff5c2a9` |
| `src/modules/duct-rental/server/pdf.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `3f79b28ac168eb96eb5a3734d470985ba67f6aa2580840ceff84a22b6722cb0d` |
| `src/modules/duct-rental/server/processes.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `ef73181b8d3192e4d32713c2762e2a807dd2a29816131b86bcf862b5bcfa0ea7` |
| `src/modules/duct-rental/server/requests.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `57702fd0b032d29d23854c4020bdb94c0c259698d303274d74e3579ad2e67ce2` |
| `src/modules/duct-rental/server/schema.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `2afabed0557576eb0ca5a784f37f8b32011bc1ce7ef781bdbbba0b7351c8ebdd` |
| `src/modules/duct-rental/server/signing.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `1081e7caf55c8f84011c809995779cd6049526711c4d7d571255b135e18017e6` |
| `src/modules/duct-rental/server/storage.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `c8bdd33bf837843f42b9aa6e9a1443bfad16c1dc74f82f1525d6a02f48c2c84e` |
| `src/modules/duct-rental/server/summary-pdf.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `e5d9f4aa30de911e9c172aaba207aea4d12577a22a6adc6b221e041cd80e26f8` |
| `src/modules/duct-rental/server/tracking.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `3b0e5544d352002b47f58e5515fd9d4f1f0233ca1c82c1ca5d89da0037aded86` |
| `src/modules/duct-rental/server/transaction.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `986147be5a439071d30358ce0874478a3123b865e01dfed19887e31eab2b10cc` |
| `src/modules/duct-rental/ui-process/PhaseProgress.tsx` | A-173 | `85e7c7d23987301af0d1042720f0ea0e4ac94732ffed7199dfe0687b5f5cc00f` |
| `src/modules/duct-rental/ui-process/ProcessShell.tsx` | A-174 | `d3f4c3f81859d87b58a71ce48cec66a0dc7145f72a851a291966b7394112de3d` |
| `src/modules/duct-rental/ui-process/SignatureShell.tsx` | A-175 | `3c1e566631cd68678be82bef77a438da98bed24a1e3f6626ad879f245fa65dff` |
| `src/modules/duct-rental/ui-process/StatusBadge.tsx` | A-176 | `591e6e789f168b2c207e1bdac4f21b5ea9390d66c379ed814dc1a76c5eb12a30` |
| `src/modules/duct-rental/ui-process/TrackingShell.tsx` | A-177 | `5583cf596991863a31c6822b1dc51bdd348f78953c15bf5ead303c2fef68082d` |
| `src/modules/duct-rental/ui-process/index.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `bc0eab39908fd40f4d2886a5335a8c9f0494c0668c05b964123e5098de90d1b0` |
| `src/modules/duct-rental/ui-process/ui-process.module.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `ff5f082b751db88f23f20f56f948bab14b061d704b80040b8a04c341a57e6032` |
| `src/modules/duct-rental/ui-request/DesignEditorShell.tsx` | A-178 | `1b2d86ba4a1f31a92fe6a4e902d23e682680f4a5f0df3360d3e7503ae3d22f2e` |
| `src/modules/duct-rental/ui-request/MetricStrip.tsx` | A-179 | `64c5714a5a721d63b9606599ce3f4bdb22d9b02e0970385b859ca82866a107b9` |
| `src/modules/duct-rental/ui-request/PhaseTabs.tsx` | A-180 | `0cbf6bf9b390d33fdfd6e99b369bdbbdda73cb243cf454ac41a3e401a99be96d` |
| `src/modules/duct-rental/ui-request/RequestFormShell.tsx` | A-181 | `5df99418be8d492001d04b37f86693c2b60f48f45cd94d5ef308eac5a6c3b0ae` |
| `src/modules/duct-rental/ui-request/RequestShell.tsx` | A-182 | `6fbfb3b55e40e3a5646730851f4f859710cc9130e6fb328884339b1c277239e1` |
| `src/modules/duct-rental/ui-request/RequestTabs.tsx` | A-183 | `68abe05f9ac60980db327ac5fbc2a8a6e668636ad2ec4e9f448f073c1580225c` |
| `src/modules/duct-rental/ui-request/index.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `1f249efc50744bfdac8c0847076fc0b4dfa8756638eac7451ffebb07045b3e7a` |
| `src/modules/duct-rental/ui-request/status/RequestStatusBadge.tsx` | A-184 | `8377933988885cd6a7a6f4d119673f34c3d60c39549d52cd6bd996ba1036d7bd` |
| `src/modules/duct-rental/ui-request/ui-request.module.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `fdc696bb7432d75d25ca02a8af4c3480e303dd3fd73ac0ceb3b591f6a62573bc` |
| `src/modules/duct-rental/ui-shared/DuctModuleNav.tsx` | A-185 | `d6d97570c8a055990de210bd8711c8b6dc3e26c573bef872ae629b8bc6aeb41e` |
| `src/modules/duct-rental/ui-shared/accessibility/VisuallyHidden.tsx` | A-186 | `7e3d072f3defdb3b49283f13fbe5c8ddb5abb444692687fe56fb0e3f7c54e0bc` |
| `src/modules/duct-rental/ui-shared/accessibility/announce.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `6bf29e36df90dcafc5377d98e0b725e362186ae8c655d566ad731ac3ad73f1b4` |
| `src/modules/duct-rental/ui-shared/accessibility/index.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `5263ab99b9d7d5f8955cedea3c07a5a8b5c861ff598764db87818e7363a78ca5` |
| `src/modules/duct-rental/ui-shared/index.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `74df14c41220f1e0c72c7aba1c7018026836c19ab3bfc4860acd877333aa2751` |
| `src/modules/duct-rental/ui-shared/tokens.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `3a1fdce425ff736c61689537e15ee8dabb45dc5ec28c2ebcc7fcb497160b560c` |
| `src/modules/duct-rental/ui-shared/ui-shared.module.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `09dae5061b607ec568c293959e813c376b1080cf61dcb7f0e24caf37caca0fe2` |
| `src/proxy.ts` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `86587554ed3f438f9d4c9e3e9254f3ff14c8e33d2c3936f2d67892cee6f4adc5` |
| `src/styles/app-shell.module.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `c334f295505c526d5d1a51ff3e9c343974d5cc1b5f7ac28b4faf7dce8202a8fe` |
| `src/styles/auth.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `401d7125f7a1701ee5325a3b63108a9fb58354d0da8cef432edf85a02af1b3d6` |
| `src/styles/components.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `d6ca4022aa9752989d9a7dea0569b3916c3dd80e9c60eef552c571c64492f19a` |
| `src/styles/motion.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `38e7765d5a92a3298795bf491cf0b513c687ae280dd04570662ad46e39dfcd41` |
| `src/styles/notifications.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `69dcb31646b095d089267fdd35bebde04d23b4ec689ec60a656db3d018b75cca` |
| `src/styles/shell.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `29e2067d7fcd31bd6a4268acee77f26aab0bb1d00b25bf4083c27199f2d75049` |
| `src/styles/tokens.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `3d95ebfc28c8cae998c164e8b3a9134dee6d9397998671ad1cda43b763c7a39d` |
| `src/styles/ui.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `21e03a275687cf81133829a0636df931b29d947c5d29ae248e32cf6927de8acc` |
| `src/styles/work.css` | OPEN dependency / CSS / provider or domain contract; map any exposed function before closing coverage | `b87a36e4b95bd66ad2908815dbf7ffe29d4eda05390618d3619fbd47090694fc` |

## OPEN static-consumer mappings

| UI source | Reason / next evidence |
|---|---|
| `src/app/(platform)/buildings/[id]/loading.tsx` (A-007) | OPEN / PLANNED — Framework boundary; render actual error/loading/not-found scenario and attach owner route evidence |
| `src/app/(platform)/buildings/building-map.tsx` (A-009) | OPEN / PLANNED — No static page/layout import-closure owner resolved; reconcile alternate/unmounted component or generated caller; do not drop function |
| `src/app/(platform)/buildings/loading.tsx` (A-011) | OPEN / PLANNED — Framework boundary; render actual error/loading/not-found scenario and attach owner route evidence |
| `src/app/(platform)/error.tsx` (A-030) | OPEN / PLANNED — Framework boundary; render actual error/loading/not-found scenario and attach owner route evidence |
| `src/app/(platform)/guarantees/[id]/loading.tsx` (A-031) | OPEN / PLANNED — Framework boundary; render actual error/loading/not-found scenario and attach owner route evidence |
| `src/app/(platform)/guarantees/loading.tsx` (A-034) | OPEN / PLANNED — Framework boundary; render actual error/loading/not-found scenario and attach owner route evidence |
| `src/app/(platform)/loading.tsx` (A-038) | OPEN / PLANNED — Framework boundary; render actual error/loading/not-found scenario and attach owner route evidence |
| `src/app/(platform)/work/layout.tsx` (A-044) | OPEN / PLANNED — No static page/layout import-closure owner resolved; reconcile alternate/unmounted component or generated caller; do not drop function |
| `src/app/(platform)/work/loading.tsx` (A-045) | OPEN / PLANNED — Framework boundary; render actual error/loading/not-found scenario and attach owner route evidence |
| `src/app/global-error.tsx` (A-080) | OPEN / PLANNED — Framework boundary; render actual error/loading/not-found scenario and attach owner route evidence |
| `src/app/not-found.tsx` (A-090) | OPEN / PLANNED — Framework boundary; render actual error/loading/not-found scenario and attach owner route evidence |
| `src/components/native-module-foundation.tsx` (A-109) | OPEN / PLANNED — No static page/layout import-closure owner resolved; reconcile alternate/unmounted component or generated caller; do not drop function |
| `src/components/work-live-refresh.tsx` (A-124) | OPEN / PLANNED — No static page/layout import-closure owner resolved; reconcile alternate/unmounted component or generated caller; do not drop function |
| `src/components/work-workspace.tsx` (A-126) | OPEN / PLANNED — No static page/layout import-closure owner resolved; reconcile alternate/unmounted component or generated caller; do not drop function |
| `src/features/buildings/map/map-workspace.tsx` (A-137) | OPEN / PLANNED — No static page/layout import-closure owner resolved; reconcile alternate/unmounted component or generated caller; do not drop function |
| `src/modules/duct-rental/ui-process/PhaseProgress.tsx` (A-173) | OPEN / PLANNED — No static page/layout import-closure owner resolved; reconcile alternate/unmounted component or generated caller; do not drop function |
| `src/modules/duct-rental/ui-process/ProcessShell.tsx` (A-174) | OPEN / PLANNED — No static page/layout import-closure owner resolved; reconcile alternate/unmounted component or generated caller; do not drop function |
| `src/modules/duct-rental/ui-process/SignatureShell.tsx` (A-175) | OPEN / PLANNED — No static page/layout import-closure owner resolved; reconcile alternate/unmounted component or generated caller; do not drop function |
| `src/modules/duct-rental/ui-process/StatusBadge.tsx` (A-176) | OPEN / PLANNED — No static page/layout import-closure owner resolved; reconcile alternate/unmounted component or generated caller; do not drop function |
| `src/modules/duct-rental/ui-process/TrackingShell.tsx` (A-177) | OPEN / PLANNED — No static page/layout import-closure owner resolved; reconcile alternate/unmounted component or generated caller; do not drop function |
| `src/modules/duct-rental/ui-request/DesignEditorShell.tsx` (A-178) | OPEN / PLANNED — No static page/layout import-closure owner resolved; reconcile alternate/unmounted component or generated caller; do not drop function |
| `src/modules/duct-rental/ui-request/MetricStrip.tsx` (A-179) | OPEN / PLANNED — No static page/layout import-closure owner resolved; reconcile alternate/unmounted component or generated caller; do not drop function |
| `src/modules/duct-rental/ui-request/PhaseTabs.tsx` (A-180) | OPEN / PLANNED — No static page/layout import-closure owner resolved; reconcile alternate/unmounted component or generated caller; do not drop function |
| `src/modules/duct-rental/ui-request/RequestFormShell.tsx` (A-181) | OPEN / PLANNED — No static page/layout import-closure owner resolved; reconcile alternate/unmounted component or generated caller; do not drop function |
| `src/modules/duct-rental/ui-request/RequestShell.tsx` (A-182) | OPEN / PLANNED — No static page/layout import-closure owner resolved; reconcile alternate/unmounted component or generated caller; do not drop function |
| `src/modules/duct-rental/ui-request/RequestTabs.tsx` (A-183) | OPEN / PLANNED — No static page/layout import-closure owner resolved; reconcile alternate/unmounted component or generated caller; do not drop function |
| `src/modules/duct-rental/ui-request/status/RequestStatusBadge.tsx` (A-184) | OPEN / PLANNED — No static page/layout import-closure owner resolved; reconcile alternate/unmounted component or generated caller; do not drop function |
| `src/modules/duct-rental/ui-shared/DuctModuleNav.tsx` (A-185) | OPEN / PLANNED — No static page/layout import-closure owner resolved; reconcile alternate/unmounted component or generated caller; do not drop function |
| `src/modules/duct-rental/ui-shared/accessibility/VisuallyHidden.tsx` (A-186) | OPEN / PLANNED — No static page/layout import-closure owner resolved; reconcile alternate/unmounted component or generated caller; do not drop function |

# Appendix E — document inputs and verification limits

Read inputs beyond the source manifest:
- `AGENTS.md`
- `ARCHITECTURE-BASELINE.md`
- `CODEX-MASTER-PLAN-V2.md`
- `DESIGN_SYSTEM.md`
- `README.md`
- `docs/DESIGN.md`
- `docs/IMPLEMENTATION_HANDOFF.md`
- `docs/README.md`
- `docs/UXUI_SPEC.md`
- `docs/adr/0001-modular-monolith-and-stack.md`
- `docs/adr/0002-identity-authorization-and-data-scope.md`
- `docs/adr/0003-current-runtime-and-rebuild.md`
- `docs/adr/0004-blue-auth-and-purposeful-motion.md`
- `docs/architecture/cross-module-experience.md`
- `docs/architecture/current-data-map.md`
- `docs/architecture/data-model.md`
- `docs/architecture/event-catalog.md`
- `docs/architecture/module-boundaries.md`
- `docs/architecture/overview.md`
- `docs/modules/admin.md`
- `docs/modules/buildings.md`
- `docs/modules/buildings/source-parity.md`
- `docs/modules/buildings/source-ux-baseline.md`
- `docs/modules/car-booking/source-parity.md`
- `docs/modules/car-booking/source-ux-baseline.md`
- `docs/modules/duct-rental.md`
- `docs/modules/guarantees.md`
- `docs/modules/guarantees/source-parity.md`
- `docs/modules/guarantees/source-ux-baseline.md`
- `docs/modules/parity-gates.md`
- `docs/modules/work.md`
- `docs/modules/work/parity-2026-10-05.md`
- `docs/modules/work/source-parity.md`
- `docs/modules/work/source-ux-baseline.md`
- `docs/open-questions.md`
- `docs/plans/UX-REDESIGN-CLEAN-LIGHT.md`
- `docs/product/design-language.md`
- `docs/product/design-system.md`
- `docs/product/information-architecture.md`
- `docs/quality/README.md`
- `docs/quality/accessibility-performance.md`
- `docs/quality/security-review.md`
- `docs/quality/ux-login-checkpoints.md`


Evidence actually obtained: repository discovery, current git HEAD/status, complete local source reads, installed TypeScript parser executed successfully for Appendix A, programmatic route/count/dedup/import closure, supporting lexical branch/config and legacy-reference extraction, document generation/structural coverage checks. No app/DB/external state changed by this producer. The optional enhanced AST rerun was approval-pending and contributes no results; it is not needed to read/use this published snapshot, but generated/imperative runtime reconciliation remains OPEN regardless.

Advisory limit: project mentions exact `jev_health`/route/evidence tools, but those exact tool schemas were not available in this session's exposed catalog; no substitute advisory result was fabricated. Deterministic source evidence was used as master plan permits. No claimed JEV approval. Figma source provenance is delegated prior observation, not a new API read. No independent reviewer or live application-quality verification occurred here.

Document completion criteria: one authorized Markdown artifact exists, routes and extracted source occurrences are all represented by IDs, declared counts reconcile with programmatic data, references originate from real files, no other producer path changed. **Implementation completion criteria remain §9 and every OPEN row.** Owner review can request improved visual values or deeper semantic expansion; neither this document nor its author self-certifies “meticulous quality”, source parity, zero omissions at runtime, or readiness for release.

## Wave 1 implementation checkpoint — 2026-11-01

Status: **PARTIAL / IMPLEMENTED BOUNDED PILOT; full-system redesign remains OPEN.** The approved first slice now has working source changes for canonical theme depth tokens, floating AppShell geometry, metadata-driven module sections, shared native Dialog/ConfirmDialog anatomy, and real mobile drawer + notification callers. No domain business logic, permissions, auth policy, database schema, production data, or deployment was changed by this slice.

Evidence: `npx tsc --noEmit` passed; targeted Vitest passed 28/28 across AppShell, ModuleNav, registry, and shared UI foundation; `npm run check:css` passed 382 files/0 violations; `npm run check:contrast` passed 58 pairs/0 failures; `npm run test:documents` passed 1/1; `npm run build` passed. Full `npm test` currently has 6471 passed, 66 skipped, 3 failed in the pre-existing Duct lifecycle policy/expectation mismatch; `npm run lint` has the pre-existing conditional `useResource` violation in `src/modules/duct-rental/components/tracking-workspace.tsx:102`. Authenticated browser shell evidence is blocked by the real `/` → `/login?next=%2F` gate; login page was reached at `http://localhost:3000/login?next=%2F`, but no credentials were supplied or bypassed, so light/dark shell and mobile drawer screenshots remain OPEN for authenticated verification.

Covered in this checkpoint: `src/styles/tokens.css`, `src/styles/app-shell.module.css`, shared `src/components/ui/dialog.tsx`, `src/components/app-shell.tsx`, `src/components/module-nav.tsx`, `src/components/notification-center.tsx`, and shared UI tests/styles. Remaining OPEN: authenticated visual/UAT and all Overview/domain screen/function/popup coverage beyond the shell pilot; Work, Buildings, Guarantees, Duct phase/process/signing/settings/cable, Car Booking, Admin, auth/utilities, source parity, runtime role matrix, and independent review.

Wave 1 automatic fix round 2 evidence: `npm exec vitest run src/components/ui/shared-foundation.test.tsx` passed 6/6; `npm exec -- playwright test e2e/navigation-theme-focus.spec.ts` passed 15/16, with the preserved `/duct-rental/renewal` metadata expectation remaining OPEN (manifest-owned visible destinations remain root/communication-cable); focused real-shell/Dialog fixture passed 2/2, including pointer-drag no-dismissal, busy-state stale-close guard, light/dark AppShell/ModuleNav geometry, desktop expanded/rail, and mobile 390x844 screenshots. `npm run typecheck`, `npm run check:css` (382/0), `npm run check:contrast` (58/0), and targeted ESLint passed. Authenticated visual/UAT remains BLOCKED; this fixture evidence is not authenticated acceptance. Baseline Duct lifecycle and tracking-workspace lint issues remain OPEN and were not hidden or waived.
