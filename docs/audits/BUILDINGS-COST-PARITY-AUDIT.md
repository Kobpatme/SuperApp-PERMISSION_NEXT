# Buildings / Cost / Quotation parity audit

## Evidence freeze

- Target: `codex/professional-workspace` at `ec778a41b63e0b55d811671d1d492d2df05044bd` before this recovery slice.
- Approved source: `Kobpatme/Permission_Next@afaee997afecf0f42e059b7100fa90ed0d188784`; local checkout SHA matches.
- Source evidence inspected: `Permission_Next.html`, `app.js`, `quotation-engine.js`, `ui.js`, `firebase-init.js`, `README.md`, `assets/*`, `tests/document-mapping.test.js`, and `tests/stability-guards.test.js`.
- Target evidence inspected: `/buildings`, map/workspace, Building 360, query/server model, building condition/fee domain and tests, quotation helpers, estimate schema and document routes.

## Parity matrix

| Source feature | Source screen / evidence | SuperApp target | Current state | Decision | Evidence / remaining work |
|---|---|---|---|---|---|
| Map-first search and status context | Source `Permission_Next.html`, `app.js` map and search controls | `/buildings` map | PARTIAL | ADAPT | Thai/English/code search, filters, clustering, fit, selected marker and mapped count exist; native UI currently renders the map without the results list, leaving the two-column list area empty. |
| Search / autocomplete | `app.js` autocomplete and normalized search | Server search + workspace suggestions | PARTIAL | ADAPT | Search is permission-scoped, but suggestions are derived from the currently loaded bounded result set; verify large-result behavior and keyboard ARIA. |
| Building drawer | Overview/contact/cost/document source tabs | Dialog drawer in workspace | PARTIAL | ADAPT | Four tabs and context are present; drawer lacks quotation action, coordinate copy, contact copy and clear freshness/data-readiness summary. |
| Building editor / duplicate / archive | Source editor and maintenance actions | Building condition schema and server services | MISSING | PORT / REPLACE | No native edit UI is present. Use server validation, permission checks and audit; replace hard-delete with audited archive/merge. |
| Contacts and map actions | Click-to-call, email and location in source | Drawer contact and external map link | PARTIAL | ADAPT | Phone/email/coordinate copy actions were added in this slice. Editor and user testing remain open. |
| Documents / NAS | Categorized file search, download, mapping tests | Private NAS API in drawer | PARTIAL | ADAPT | Loading/error/empty/retry and categorized downloads exist; freshness metadata/error classes and access behavior need full verification. |
| CAPEX/OPEX/annual/deposit/unclassified | BOQ and fee classification in `app.js` | Versioned fee domain and grouped drawer | PARTIAL | ADAPT | Groups and revenue-share display exist; no native fee editor or validated additional-fee workflow. |
| Revenue share monthly/annual | `calculation_type=revenue_share`, `revenue_period` in `app.js` | Domain normalization and quotation tests | PARTIAL | KEEP | Percentage and period remain typed and display separately; add golden calculation coverage for both periods and ensure no currency treatment. |
| Formula defaults and building overrides | Source formula fields and building editor | Building condition fee rows | PARTIAL | ADAPT | Formula fields are represented in source/target data, but default-versus-override provenance and UI editing are incomplete. |
| Preliminary quotation four-step flow | Customer → route → conditions → review in source UI and engine | Pure parsing/date/summary helpers and estimate/version schema | MISSING | PORT | No native quotation workflow route or create/recalculate/review UI; helpers/schema alone do not satisfy the user workflow. |
| Quotation draft/history/stale protection/export | Versioned drafts, restore, preview and export in source | Estimate/version schema and helpers | MISSING | ADAPT | No native draft/history or stale recalculation UI. Preserve revision provenance and validate calculations server-side. |
| Building 360 cross-module context | Building detail and source links | `/buildings/[id]` related work, guarantees, estimates, docs and activity | PARTIAL | KEEP | Explicit canonical ID links exist; separately enforce each module's authorization. |

## Risks and decisions

- No `RETIRE` decision is made. Legacy Firebase/NAS authority is replaced by server RBAC, private document routes, canonical IDs and audited mutations.
- Cost classification and revenue-share periods are behavior that must remain typed; percentage values must not be formatted as money.
- Formula constants, tax, rounding and approval policy must not be invented. Missing owner-approved policy remains configurable/open.
- Building edit, fee edit, quotation persistence and export require server-side permission, validation, audit and stale-version checks before implementation.
- No production database, NAS, SharePoint or source production data was accessed or modified.

## Prioritized implementation gaps

1. Restore the synchronized map + results-list workspace and keyboard row selection.
2. Complete drawer contact/coordinate actions and data-readiness/freshness context.
3. Implement permission-checked building and dynamic cost editing with version provenance.
4. Port the four-step quotation flow with server-authoritative calculations, explicit cost semantics and stale protection.
5. Add draft/history/revision and preview/export without losing auditability.

## Implementation checkpoint (2026-10-01)

The workspace now renders the existing server-filtered buildings as a selectable result list beside the map. Row selection opens the same detail drawer and updates the selected marker; marker selection updates the same selected ID. Drawer users can copy phone numbers, email addresses and coordinates with live status feedback. Lint, typecheck, unit tests and production build pass after the change. The result remains PARTIAL because editing, quotations, large-catalog evidence and authenticated browser review are still open.
