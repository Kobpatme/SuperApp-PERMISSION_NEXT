# Permission Out — source freeze and acceptance contract

Approved scope: native route analysis and Site Facility, owner approval in chat 2026-11-12. Source `katathepAof/Permission-out@55380a5d5bdd7e82caa3fbd87ac4b72f979d383e`; target starting `5e2edcc6917af6bfcb1ef5382f2ec617d4d9476d`. Working branch `codex/permission-out-module`. No real import, production activation, external database write or identity migration.

**Owner correction supersedes the initial combined UI:** two independently registered modules, MOD 1 `/permission-out` and MOD 2 `/site-facility`, each map-first and using canonical central CSS. The original six-tab/form-first implementation was rejected; earlier passing checks must not be cited as proof of source UX parity. Migration 0068 splits domain gates/permissions and dataset-kind RLS without copying grants, enabling modules or deleting data. See [current presentation/security contract](../permission-out.md) and [MOD 2](../site-facility.md).

Source evidence: `Permission_Out.html` geometry helpers/sampleLine/analyzeDiff/dedupeSelfOverlap, `production.js` projects/catalog/billing, `mod2.js` filters/editor/comments/OPEX/export, `admin-data.js` Total Site parser/version flow, `src/worker.js` authorization/projections, `supabase/migrations/20260723110000_billing_existing_poles.sql`, `20260814150000_mod2_total_site_excel.sql`, and source CSV/filter regression scripts.

| Capability | Decision | Acceptance requirement | Local implementation status |
|---|---|---|---|
| KML/KMZ multiple base/compare files; gx tracks/metadata | ADAPT | Server parse, archive/XML limits, coordinates validated | implemented; synthetic verification |
| Geometry sampling; New/Same/Remove | PORT | Source goldens; base-only=new, compare-only=remove; Same emitted once | implemented; synthetic verification |
| Optional self overlap removal | PORT | Source 90% sampled coverage rule; no silent alteration | implemented; synthetic verification |
| Province/status/overlap filters, selected export | ADAPT | Same authorized/filter scope in map, totals and exports | implemented; synthetic verification |
| Pole count/diameter and versioned fees | ADAPT | Provided zero retained; otherwise ceil(distance*policy); Decimal summary rounding | implemented; synthetic verification |
| Saved projects/results | ADAPT | Immutable dataset/algorithm/formula snapshots; scoped reads and audit | implemented; synthetic verification |
| PEA boundary matching and hierarchy/export polygons | PORT | Multiple crossed areas, deterministic matching, source format fixtures | implemented; synthetic verification |
| Reference datasets (road/building), regional quick modes | ADAPT | Versioned input references, no embedded production payloads | reference layers implemented; multi-select replaces quick presets |
| CSV pairing/trim and KML/KMZ grouping | PORT | Source regression assertions, Unicode and hostile text fixtures | implemented; synthetic verification |
| Site map/list/filter/detail | ADAPT | Server pagination, bounded map projection, identical scoped aggregate | implemented; synthetic verification |
| Source Overview/Sites/Density and area/category overlays | ADAPT | Independent map-first site workspace with explicit route overlay authorization | partial: province overview/customer-weighted circles; exact clusters/heat and all area/category controls not claimed |
| Site changes/comments/read notifications | ADAPT | Optimistic version, stable site identity across dataset versions, audited soft archive | implemented; synthetic verification |
| Site OPEX | ADAPT | Restricted server projection including raw fields, maps, comments context/export | implemented; synthetic verification |
| Total Site Excel | ADAPT | Exact sheet/70 headers/unique Site Code; invalid coordinates remain in list | implemented; synthetic verification |
| Dataset staging/diff/publish/rollback | ADAPT | Digest/idempotency, immutable versions, atomic pointer swap, concurrent publish protection | implemented; synthetic verification |
| Source Auth/Admin user store/Cloudflare configuration | REPLACE | Core identity/Admin/module gate; no new accounts or automatic grants | intentionally-changed |
| Browser local projects and offline private data | REPLACE | Durable server project; no private offline cache or service worker | intentionally-changed |
| Existing cable workflow link | ADAPT | Application composition checks both modules; no private table coupling | implemented; synthetic verification |

Baseline before implementation: lint/typecheck completed without errors; unit 6,681 passed, 92 opt-in skipped (148 files). No current production build claim. Runtime schema, PostGIS availability and real volumes have not been inspected. Source regression scripts and target browser/DB checks have now run; this baseline is historical, not the current verification status. Formula policy values remain unconfigured until approved; source defaults may be test fixtures only.

Release gates: lint/typecheck/unit/document/build; isolated PostgreSQL schema/RLS/transaction/concurrency/import tests; browser keyboard/responsive/light/dark/axe; source geometry/fee/export goldens; reconciled real-data dry run and human UAT. Disable module to roll back; preserve tables, versions, files and audit. No down migration with destructive drops.

## Implemented checkpoint and explicit gaps

Two native route trees/APIs, separate manifests/entry capabilities/module enablement, domain-aware FORCE RLS, independent search/dashboard and guarded Duct draft composition are present. Map/sidebar/detail layouts compose shared `ui.css` primitives, replacing the active module-local skin. Geometry/source export helpers and province boundaries are pinned to the frozen SHA, not fetched dynamically. KML preserves office/province/status grouping and uncertainty labels; pairing/trim uses bounded worker execution. Site Code aliases retain stable imported identity, and manual edits/OPEX are scoped to the imported base version. Admin publication uses optimistic versions and fresh-baseline diff review.

The first combined implementation's 6,711-unit/26-browser checkpoint is historical. Current split verification is recorded in the [QA record](../../quality/permission-out/README.md). No source live-browser parity, real-data reconciliation, surveyed geography accuracy, production schema/runtime, 100-user capacity or human UAT claim is made. Native multi-select replaces source regional quick presets; native notifications use durable reads, not Outlook delivery. Soft archive replaces hard deletion; per-version overlays deliberately require reconciliation on new imports. Province-centroid overview/customer-weighted circles and a single explicit cross-module route overlay adapt source map modes but do not reproduce exact clustering/heat or all area/category controls. Source hierarchy is partial/provisional, not a verified nationwide crosswalk.

**Release blocked:** existing Next/Zod production dependency audit findings require a separately reviewed upgrade. Formula/PEA policy, reuse rights and real-file acceptance remain owner/operational gates. Do not infer complete parity or activation approval from passing local tests.
