# Duct / Communication Cable unified presentation

**Producer implementation; client-fixture verified. NOT independent QA, authenticated integration acceptance, exhaustive all-function acceptance or whole-system completion.**

Repository: `D:/WebApp/SuperApp PERMISSION_NEXT`, HEAD `62ed9ee`. Shorter supplied path does not exist. Fresh starting status and Duct test output: `../unified-baseline-status.txt`, `../unified-baseline-vitest.json`. Existing dirty module manifests/nav/components/tests and other module waves were preserved. File sizes below include pre-existing overlapping edits, not a claim of wholly new authorship.

## Implemented

- Shared family CSS composes corporate-blue/Thai soft raised outer panels, inset fields, flat data and responsive main/rail layouts; RequestShell, RequestFormShell, ProcessShell, TrackingShell and SignatureShell remain in use. No new theme/global override or duplicate navigation introduced.
- Removed duplicate mounted design/missing-document editors from RequestWorkspace and composed the retained unique controls in RequestFormShell. Added missing file-row/pagination layout and narrow header/action containment.
- All **15 existing Modal call sites** now delegate through the Duct compatibility adapter to Core Dialog. Explicit operation busy state and child-editor registration protect close paths; a disabled fieldset locks modal controls. Cable/compact-detail/signature drafts request nested discard confirmation; Back on RequestForm uses Core ConfirmDialog rather than window.confirm. Cable transitions and signature removal use nested Core ConfirmDialog. Existing callback/payload/version contracts remain.
- Fixed empty tracking metric landmark semantics and preserved the approved square-corner, separator-only, shadow-free metric strip. No TrackingSummary conditional-hook change was made without a reproduced symptom.
- Scoped error feedback remains inside operation-bearing preview/review/create/sign dialogs. Fixed edge-clipped modal title/body padding found during screenshot inspection.
- Button attribute-order assertion now checks the same button/type/disabled/classes independently of serialization order. Focus-source assertion follows Core delegation and real browser focus evidence.

No business/domain/server/API/schema/storage/NAS/auth/grant/security/calculation/PDF-content/signature-geometry changes. No DB/prod writes, seeds, credentials, auth bypass, config/model changes, commits, pushes, deployments, resets, stashes or reverts.

## Exact coverage and evidence

`implementation-inventory.json` lists **14 current route patterns**, **10 dynamic views**, **23 concrete route/view compositions**, source paths/bytes and all Modal call sites. `verification.json` is the programmatically aggregated evidence inventory.

| Area | Producer evidence | Still OPEN |
|---|---|---|
| All 14 routes / 10 dynamic views | Actual route functions + production clients/AppShell/root CSS/bundled fonts; light/dark 320/390/768/1440 | Real Next/RSC/session/role/scope and refresh acceptance |
| Request list/detail/form | Search/advanced status query; detail popup/focus; compact pending/dirty retention; Back discard; failed draft retry; exact money strings | Exhaustive filter/tab/page permutations; every accept/submit/NT-generation/assign/revoke transition; broader unsaved shell/breadcrumb/history/unload navigation |
| Documents/drawings | Every enabled mounted picker in six phase families; real four-page TEST PDF preview/page/zoom/rotation; original multipart boundary payloads | Real private storage, authorized bytes, server MIME/size validation, native OS picker, CAD/KMZ content validity and print integration |
| Renewal | All five statuses render; review notes/pending failure retention; create-year lock; archive confirmations and version payload | Complete advance/final-contract upload chain, actual annual snapshot/concurrency/audit |
| Cancellation | Three active statuses; advance/reject/archive confirmations; reject payload; selected-route create/date/reason/version | Actual completion effect on original record, every terminal/role combination |
| Cable | Eight stage editors; pending/failed drafts; seven forward confirmations plus revise/archive payloads; nested discard | Real persistence/workflow UAT; all prototype-flow tabs and source parity; no invented attachment/fee/external filing features |
| Signature | Actual canvas drawing and cropped PNG multipart; asset default/removal; assigned-task PDF client flow, nudge/name offset and original geometry/version payload | Actual signed PDF generation/content, validated private PNGs, signer auth, all import/placement/date/rotation combinations |
| Settings/tracking | Mapping/phone failed-save retention/version; SLA query/type/owner/reset boundary requests | Actual grants/persistence and every paging/filter combination |

The fixture intercepts only Next/server/API/storage boundaries, uses visibly labelled synthetic TEST records, and aborts unexpected origins. PDF.js and the drawing/cropping clients are real. TEST PDF bytes are generated by pdf-lib; TEST storage images are visibly labelled, not production signatures. Synthetic CAD/KMZ selection proves only client plumbing, not those file formats. API success is a mock-boundary response, not server acceptance.

## Executed commands/results

- `UX_EXTERNAL_SERVER=1 npx playwright test e2e/duct-rental-unified-composition.spec.ts --timeout=25000 --reporter=list --output=docs/quality/duct-rental/unified-traces`: **102 passed**, exit 0 (`../unified-browser-verified.log`).
- Two subsequently added computed-style tests: **2 passed**, exit 0 (`../unified-computed-verified.log`). After final compact-detail busy/dirty registration, affected record routes, all six attachment families, compact popup, list and computed checks: **34 passed**, exit 0 (`../unified-final-recheck.log`). These overlap earlier checks; do not add reruns as distinct functionality.
- Shared native Dialog: **3 passed**, exit 0 (`../unified-shared-dialog-recheck.log`). Initial concurrent run had one timing-sensitive pending-guard timeout; it is retained in `../unified-shared-dialog.log`, not concealed. No shared implementation/test edits were made here.
- Prior Work-create/assignment: **5 passed**; Guarantees primary forms: **2 passed**, exit 0. Logs `../unified-work-forms.log`, `../unified-guarantee-forms.log`.
- `npx vitest run src/modules/duct-rental/tests src/lib/module-registry.test.ts src/lib/module-contract.test.ts src/components/ui/shared-foundation.test.tsx src/components/deposit-workspace.test.tsx src/components/deposit-unified.test.tsx --reporter=json --outputFile=docs/quality/duct-rental/unified-unit-verified.json`: **6099 passed / 2 failed / 25 pending, 26 files**, exit 1. Both failures are existing Duct manifest/lifecycle/navigation expectations; not waived or changed. Pending integrations are not passes.
- `npx tsc --noEmit`: exit 0. Changed presentation/new e2e ESLint: exit 0. `node scripts/check-css-quality.mjs`: **389 files / 0 violations**, exit 0. `node scripts/check-contrast.mjs`: **60 pairs / 0 failures**, exit 0. Scoped `git diff --check`: exit 0.
- **217 zero-violation axe snapshots**, including **184 route/theme/width snapshots**. **217 rendered-control inventories**; desktop-light route snapshots contain **785 control instances across 23 compositions**. This is an inventory of repeated rendered controls, not 785 independently exercised functions.
- **35 PNGs**. Producer visually inspected ten distinct representative paths: `route-0-light-1440.png`, `route-0-dark-320.png`, `route-1-light-1440.png`, `route-6-light-1440.png`, `route-15-light-1440.png`, `route-19-light-1440.png`, `overlay-pdf-dark-390.png`, `overlay-signature-light-390.png` (before/after padding correction), `overlay-signature-remove-dark-390.png`, `overlay-discard-dark-390.png`. Not all 35 are independently visually approved.
- Computed metric radii **0px**, shadows **none** for all four cells in both themes. Actual hovered Search contrast: light **5.1686:1**, dark **7.0219:1** (`computed-*.json`). These do not certify every possible interaction color.

## Remaining gates / handoff

Independent read-only QA and owner visual acceptance remain required. Keep existing manifest/lifecycle, renewal child-navigation and conditional TrackingSummary useResource issues OPEN. Keep upstream legacy/source parity, authenticated server/data-scope/idempotency/concurrency/audit/storage/PDF generation acceptance, exhaustive state/control combinations, 200% zoom and assistive-technology testing OPEN. Full repository suite/build were not rerun: avoid DB-dependent suites and collision with the existing Next runtime/.next during this no-DB/no-config bounded slice. No full-system completion claim.
