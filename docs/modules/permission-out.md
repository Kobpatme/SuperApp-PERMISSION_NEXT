# Permission Out — two native map-first modules

Local implementation on `codex/permission-out-module`. The first combined six-tab implementation was rejected by the owner on 2026-11-12 as a UX/architecture mismatch. The owner explicitly approved **two separate modules, map-first, using central CSS**. This supersedes the earlier combined-workspace handoff. Pinned upstream: [Permission-out @55380a5](https://github.com/katathepAof/Permission-out/tree/55380a5d5bdd7e82caa3fbd87ac4b72f979d383e). Both modules are **disabled by default**, with existing Core platform-admin preview semantics. No configured local business/production database migration, real import, grants, commit/push or deployment was performed.

## Workspace and authorization

MOD 1 is registered independently as `permission-out`, entering `/permission-out` with an always-present PEA/UFM map, side tools, immutable projects, reports, route datasets and fee policy. MOD 2 is registered as `site-facility`, entering `/site-facility` with its own map, filters, site detail/edit/comments, reports and site datasets. `/permission-out/sites?q=...` redirects to the new authorized site entry, preserving the search term. Core navigation, search and dashboard use separate module IDs.

The owning API is `/api/permission-out/*` or `/api/site-facility/*`, using Core sessions, password-change enforcement, live module gates and same-origin mutation checks. Resource allowlists reject cross-domain paths; dataset administration also validates dataset kind in the service and database. Shared private import tables are retained, not duplicated; data access follows the owning domain, not the browser's choice of URL. No upstream Supabase accounts, static-app embed or extra login is used.

MOD 1 entry is `permission_out.module.view`; actions: `project.manage`, `analysis.run`, `report.export`, `dataset.manage`, `dataset.publish`, `formula.manage` with that prefix. MOD 2 entry is `site_facility.module.view`; actions: `site.read`, `site.update`, `comment.create`, `report.export`, `opex.read`, `dataset.manage`, `dataset.publish` with the `site_facility.` prefix. OPEX/dataset/formula administration use ALL scope; other capabilities accept OWN/TEAM/SELECTED_TEAMS/ALL. Legacy `permission_out.site.*`, comment and OPEX grants do not authorize MOD 2. No grants are automatically copied or seeded; an administrator must explicitly review both modules' access. Default-disabled is not a hard block on platform administrators.

Additive migrations `0067_permission_out.sql` and `0068_permission_out_split_modules.sql` retain eleven FORCE-RLS `pout_*` tables. The second migration separates domain/module gates and dataset-kind-specific read/write policies without copying grants or enabling modules. Services bind the trusted Core actor inside each transaction. Public projections exclude raw source columns, secret-like keys and financial fields. OPEX overrides/history, original source files and unfiltered raw rows remain private. Site originals require site dataset administration plus OPEX access; route originals require route dataset administration. Downloads are audited under the owning module.

## Shared presentation and map behavior

Both modules compose canonical `src/styles/ui.css` and `tokens.css`: shared buttons, fields, tabs, dialogs, panels and tables plus generic `ui-map-*` layout. There is no active module CSS theme or button/input reset. The former `workspace.module.css` is retained but no longer imported. `src/components/map-workspace/` contains reusable map/data-import presentation, not domain authorization.

Both modules use a full-width map with a collapsible tool/filter card over the map, without an internally scrolling sidebar. MOD 1 groups dataset selection, advanced analysis options and result filters into native disclosures; file uploads, multiple dataset versions and analysis/reanalysis controls remain available. Map background, fit and expand controls sit beside the page heading and move inside the expanded map. Core sidebar navigation retains all module pages instead of duplicating a local tab row. MOD 1 shows authorized published routes before any analysis, then filtered result segments; selecting a table row or route opens map detail and zooms to the route. MOD 2 opens detail from a map marker or table row. Fit-to-data, expanded-map/Escape, street/satellite/no-background, reference and result-status layer controls are shared. Display-only layer toggles do not change export filters. Tile failure does not disable data operations. Canvas colors resolve semantic tokens rather than passing unresolved CSS variables.

Site display modes are individual points, approximate province-centroid overview, and customer-weighted circles; the latter is not an interpolated heat raster. These adapt source Overview/Sites/Density without claiming exact source clustering/visual parity. MOD 2 can explicitly overlay published MOD 1 routes only when the user also has MOD 1 access; there is no bypass or implicit cross-module grant. Source per-category/area-specific overlay controls and source regional quick presets are not claimed as fully reproduced.

## Route analysis

Multiple base/compare KML/KMZ inputs or published dataset versions are supported. Server parsing validates coordinates, blocks DTD/entities, encrypted/traversal/duplicate ZIP entries and limits archive expansion. Imported geometry is not executed as HTML. Source physical cable-size mappings and metadata are retained. Province boundaries for 77 provinces are bundled offline from the frozen source; PEA polygons come from authorized published datasets. Road/building references are opt-in map layers.

Base-only = New; comparison-only = Remove; Same appears once from base. Sampling/tolerance and optional 90%-coverage self-deduplication follow the source. Multi-province/status/overlap and Maxi-only category/status filters apply to map, totals and authorized exports. Sampling and geographic matching are estimates, not cadastral or engineering certification. PEA hierarchy is source-provided for known offices, not a nationwide authoritative hierarchy; unknown/unconfirmed branches remain explicitly marked.

Projects preserve immutable input lines, dataset versions, source SHA, algorithm version, options, formula and geographic snapshot. A retry key plus input digest prevents accidental duplicate analysis; reuse with another payload is rejected. Reanalysis creates a new project from an authorized saved snapshot, optionally with extra inputs and current options/formula. It never overwrites the old result. Archive is soft, not destructive deletion.

Fees use Decimal: provided poles (including zero) take precedence; otherwise ceil(kilometres × approved poles/km); diameter × poles × rate is accumulated without per-line rounding, surcharge applied, summary rounded half-up to two decimals. Missing diameters are flagged. **No production formula is seeded**; source example constants are synthetic tests only. Owners must approve and create an effective-dated formula before operational estimates.

CSV summary, source-style 25-column RD03/Maxi CSV (including pair-specific trimming), KML and KMZ use authorized filtered results. Spreadsheet formula prefixes and XML are escaped. Source CSV deliberately includes the matched counterpart to a selected source line; it is not a row-for-row segment export. Estimated poles within a selected PEA area use sampled coverage, not a surveyed pole inventory. KML includes grouped office/province/status folders, overlap labels and matched PEA polygons. Source files/keys are preserved for traceability.

Analysis/export geometry runs in bounded native Node workers: two concurrent workers per process, 60-second timeout, 256 MB old-generation heap; load limits return an actionable error. This is a safety bound, not a shared multi-instance job queue. Uploaded request bodies are streamed with 105 MB aggregate cap and two concurrent parse/analysis requests per process. Per-file 100 MB, expanded archive 160 MB, entry 32 MB, parsed records 20,000 and total coordinates 500,000; geometry grid/sample budgets also apply. Route export and map cap at 5,000 segments; oversized export fails rather than silently truncating. Narrow filters or split work. No 100-user throughput claim has been established.

## Site Facility and dataset lifecycle

Excel requires exact `Total Site` sheet and the source 70 nonblank unique headers. Site Code must be unique; missing/invalid L/M coordinates remain in list/report but are excluded from map. Raw columns are stored privately. List pages contain 50 rows; map projection is capped at 5,000, export at 20,000. Counts and authorized OPEX/group summaries use the full filter, not just the current page.

Stage → inspect added/updated/removed/unchanged → publish with expected dataset version. Checksums are idempotent only for the same active baseline. Competing publication invalidates stale review; restage and review against the new baseline. Publication swaps a pointer atomically; rollback republishes an existing immutable archived version. Original files are private database bytea and must be included in database backup/capacity planning.

Manual public/OPEX edits are versioned overlays **per imported base version**. Republishing another source version does not silently carry manual edits forward; reconcile explicitly. Returning to an older version restores its overlays. Editable Site Code is a business alias; the imported canonical key remains stable for comments and source lineage. Duplicate aliases are rejected within the current dataset. Optimistic edit versions and dataset locks prevent lost writes and edit/publish races. Archive hides the overlay without deleting source/history.

Comments and read markers persist in PostgreSQL. Remark edits may append an attributed comment when comment permission is present. Inbox entries are scoped to readable sites and current source keys. These are native module notifications, not an implemented Outlook/email delivery adapter. OPEX values are never copied into ordinary mutation audit metadata.

Material changes atomically persist business state, Core audit, activity and outbox; failure to audit rolls back the business write. Read markers are personal non-material state. See [events](../architecture/event-catalog.md).

## Cross-module composition

An explicit link to Duct Rental checks source project access plus target module/create scope. It opens a reviewable cable-request draft containing a source reference. No cross-module private table coupling, automatic request creation, approval or fee write occurs.

## Activation and remaining gates

1. Resolve current platform dependency audit findings (Next.js and Zod) with a separately reviewed compatible upgrade; do not run force upgrades without regression review.
2. Operator backs up and rehearses restore, applies additive migrations 0067/0068 using the existing deployment/migration process, and verifies constrained runtime role/RLS. This task applied migrations only to disposable synthetic databases.
3. Data owner confirms source reuse rights, PEA office crosswalk and formula policy. Confirm retention/storage capacity for private originals; no explicit upstream LICENSE was identified during discovery.
4. Review and assign each module's separate least-privilege roles/scopes, then explicitly enable the intended module(s). Check independent disablement and denial paths as a non-admin; administrator preview alone is not acceptance. Do not automatically migrate the old combined site's grants.
5. Stage representative real files, reconcile geometry/fees/OPEX/export against approved references, complete human UAT/accessibility and volume testing, then authorize release. No real data has been reconciled here.

Rollback: disable module for ordinary users and preserve tables, versions, original files and audit. Do not drop tables or run destructive down migrations. Platform administrators retain existing Core preview behavior.

See [source parity](permission-out/source-parity.md), [source UX](permission-out/source-ux-baseline.md), [ADR](../adr/0008-permission-out-native-module.md) and [repeatable local verification](../quality/permission-out/README.md).
