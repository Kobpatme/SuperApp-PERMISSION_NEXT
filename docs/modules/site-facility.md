# Site Facility & Design — MOD 2

Map background, fit and expanded-view controls sit beside the page title. The duplicate in-page tab row is removed; map, reports and dataset functions remain available through the existing Core sidebar routes.

Owner-approved split on 2026-11-12, correcting the rejected combined Permission Out UI. Separate registry ID `site-facility`, native entry `/site-facility`, API `/api/site-facility/*`, capability prefix `site_facility.` and default-disabled lifecycle. MOD 1 remains `/permission-out` for PEA/UFM route intelligence; site navigation and management are no longer tabs inside MOD 1.

The map is visible at entry with a compact filter card over the map (owner-approved 2026-11-13), marker/list detail selection, fit/expanded view, background choices and map-independent searchable table. The card has a full-width search field, two-column filters, a result count and reset action, with native collapse/expand and no internal scrollbar. Comments and OPEX reports remain below the map so they cannot stretch the filter card. Central `src/styles/ui.css` owns all form/button/table/dialog/panel styling and the shared `ui-map-*` geometry; no module-specific theme/reset is imported. Both Light/Dark use Core tokens. Initial data, map selection, editing, comments and OPEX remain server-authorized.

Published routes from MOD 1 are an explicit optional overlay and require independent MOD 1 access. Province overview markers and customer-weighted density circles are approximate adaptations, not exact upstream cluster/heat behavior or geographic certification. Layer switches affect map display only; query filters govern authorized aggregates and exports.

Excel staging/diff/publish/rollback, immutable source versions, stable source keys versus editable Site Code aliases, per-base-version edits, private OPEX, comments/read markers, audit/activity/outbox and source-download retention are defined in the [shared data/activation contract](permission-out.md). Site-only readers/administrators do not require route-module enablement. Route-only grants, including legacy combined site grants, do not confer site access. No automatic role copying or module activation is performed.

Migration 0068 separates domain-aware RLS without deleting or duplicating imported data. It has been exercised only in disposable synthetic databases; applying it to configured local business/production data is a separate operator step. See [verification evidence and remaining gates](../quality/permission-out/README.md).
