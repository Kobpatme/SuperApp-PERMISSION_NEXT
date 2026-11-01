# Car Booking unified composition — producer evidence, not independent QA

Repository: `D:/WebApp/SuperApp PERMISSION_NEXT`, HEAD `62ed9ee4048481abd036ed1ea4853caad316a5ed`.

## Implemented ownership

Only Car Booking-owned client presentation changed: `src/features/car-booking/{car-booking-workspace.tsx,car-booking-dialog.tsx,car-booking.css,car-calendar.tsx,car-reports.tsx,car-journey-map.tsx,car-access-workspace.tsx}`. Added `car-booking-unified.test.tsx` and `e2e/car-booking-unified-composition.spec.ts`. The existing `/car-booking` and `/admin/car-booking` route functions are imported by the browser fixture, not rewritten. The latter's presentation is included through **CarAccessWorkspace**, not through the unrelated dirty `/admin/page.tsx` or `admin.css`.

- Reuse canonical PageHeader (existing route owner), Button, Panel, FormField, StatusBadge, TableRegion, Dialog and ConfirmDialog. Corporate-blue/Thai fonts, restrained raised outer surfaces, inset fields, flat readable rows and contained table scrolling reuse existing tokens. No global selector/theme/provider changes or duplicate navigation.
- Return/log/create/edit dialogs keep changed drafts until explicit discard, retain failed drafts, lock form controls/close paths during mutation and use shared focus restoration. Booking destination and parking drafts survive local view changes. Dirty parking refresh retains its original optimistic-lock version; explicit discard adopts the latest loaded snapshot. Request shapes, decimal strings, Bangkok conversions, field constraints and server authorization remain unchanged.
- Loading/errors are not falsely labelled empty. Journey reads have a retry action; access reads reject stale completions and show loading. Failed map tiles are hidden instead of displaying broken-image icons; real coordinate markers/list/fallback remain. Provider requests are blocked in this fixture.

## Actual mounted inventory and verification

| Surface | Current functions exercised in the real component fixture |
|---|---|
| Book | Start/end; invalid ordering; availability, no cars/inactive exclusion, availability invalidation; destination; pending/conflict/retry/success; exact single-interval request; paused intake; retained local draft |
| Mine / return / all | Monthly+active pagination/merge; own-vs-other client branch; month/search/status filtering; upcoming/active/completed/cancelled action gates; refresh/loading/error/retry; return is start-time gated |
| Calendar | Month/week/day; previous/next/today; legend and event selection; plate/time privacy presentation (no employee/destination in selected detail) |
| Vehicles / manage vehicles | Plate/floor/mileage/latest-user/status table; read-only consumer; create and edit; explicit deactivation, no destructive delete; exact POST/PATCH body |
| Parking | Multiline values, original version, pending/server conflict/retry, retained draft on tab+refresh, explicit discard confirmation |
| Return dialog | Time/floor/mileage, no fuel and with fuel (fuel mileage/liters/amount); original decimal strings and timestamps; failure draft/close guard/pending/success |
| Journey log dialog | All four actual types (`other`, `overnight_stop`, `checkpoint`, `fuel`), optional fuel, note; geolocation requesting/denied/unsupported/retry/attached/removed; save without GPS; exact optional coordinate/body semantics |
| Journey reads / GPS dialog | Paginated logs, loading/denied/retry/empty; source labels/date/mileage/fuel/note; real SVG projection/marker controls, selected coordinate and zoom ceiling; blocked-tile fallback. Not real-map acceptance |
| Cancel / discard dialogs | Consequence, cancel/confirm, focus restoration; cancellation pending/error/retry and unchanged endpoint; nested form discard keep/discard; separate parking discard |
| Reports / dashboard | Independent month/all filter; loading/read-error/retry; report page previous/next; actual 19-column OSP formatter with synthetic input; logs disclosure; dashboard totals/cars/top users/bookings; CSV URL; queue/retry/rebuild disclosure+confirmation/pending/error/success/jobs detail |
| Separate `/admin/car-booking` | Actual route capability/password-required branches; search/filter-empty/empty; independent use/admin checkboxes; pending/failure retained draft/retry; expected-use/expected-admin request fields; read failure/retry retains unchanged-key drafts |

No mounted reservation-edit, separate check-in/out screen, copy or print control exists in the inspected current consumer. Booking plus return/log workflows and vehicle editing are preserved; no invented screens or business/data rules were added. CSV is present: only its actual authorized URL/filter wiring is verified, **not real download bytes**.

### Matrix and evidence

- **111 browser tests passed, 0 failed/skipped** using `UX_EXTERNAL_SERVER=1 npx playwright test e2e/car-booking-unified-composition.spec.ts --reporter=list` (exit 0).
- Ten local views: light/dark at 1440/390 plus light/dark 320/768 reflow. Separate access route: all eight theme/width combinations at 320/390/768/1440. Seven existing overlay variants: light 1440, dark 390, light 320; additional form-discard dark 390 and parking-discard light 390. This is not every possible overlay/theme/width/state combination.
- **29 PNGs**, **50 named full-page axe reports, 0 recorded violations**. Overlays assert viewport bounds, scroll-to-last-control/footer, Escape and return focus. Long forms intentionally scroll (header is not sticky); error/fuel screenshots show the footer scroll position. Main mobile and access screenshots include full-page output. Screenshot inspection covered desktop/mobile contact sheets and native-sized final GPS/fuel/error/discard details; corrected the observed failed-tile glyphs.
- **54 unit tests / 9 files passed**, native shared Dialog **3 browser regressions passed**. Existing Work/Buildings tests were not rerun because no shared implementation was edited; prior evidence is not promoted to new acceptance.
- Typecheck, changed-file ESLint (no warnings), CSS quality (**387 files / 0 violations**), semantic contrast (**60 pairs / 0 failures**) and scoped diff check all exit 0. Actual primary and danger hover/focus contrast is recorded separately in `hover-*.json` / `danger-hover-*.json`.
- Exact absolute paths, bytes, dimensions, named tests and command strings: `verification.json`. Logs are local artifacts under this directory (ignored by the repository's existing `docs/quality/**/*` rule); no ignore/config change was made.

## Boundaries — OPEN, not exemptions

This imports the actual two route functions, production components, AppShell, root CSS/module CSS and bundled fonts. Synthetic TEST models and mocked Next/server access boundaries are visibly labelled. All network requests are intercepted; no login, credentials, DB reset/seed, live server mutation, grants, NAS, Sheets write, provider config, commit/deploy or auth bypass occurred. Actual OSP formatter input is synthetic, not production data.

**CANNOT establish:** authenticated Next/RSC/navigation/session/data-scope acceptance; actual API/DB concurrency, overlap/idempotency/audit/validation enforcement; real provider/location permissions/tile delivery; live access grant persistence and revocation; Google Sheets jobs/SAP/backup; authorized CSV bytes; full build/full suite; 200% zoom or complete assistive-technology review. API error/pending paths are mocked request/response behavior, not server acceptance. Browser-level unload protection and every unsupported state combination are not claimed. Independent QA and owner visual approval remain OPEN. Broader Admin surfaces remain separately OPEN, even though `/admin/car-booking` presentation is included here. Known manifest/lifecycle/Button-attribute/renewal-navigation/tracking-hook issues remain OPEN, without weakened assertions or cross-domain fixes.

## Buildings bookkeeping first

Before Car Booking writes, `docs/quality/buildings/verification.json` was read and refreshed **only for actual screenshot byte sizes**: nine changed entries, 65 entries = 65 existing PNGs, dimensions unchanged. Buildings source/tests/results and metadata assertions were not rewritten; no Buildings screenshots were rerun afterward. A final byte/count check is retained in `verification.json` here. This bookkeeping is not a product defect or a new Buildings QA claim.
