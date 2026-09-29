# Buildings source UX baseline

Status: SP-0 fresh source freeze, 2026-09-29. This is a behavioral reference, not a claim that the target module is migrated.

## Evidence

- Repository: `Kobpatme/Permission_Next`
- Approved baseline: `afaee997afecf0f42e059b7100fa90ed0d188784`
- Local checkout: `main` at the approved baseline
- Primary evidence: `Permission_Next.html`, `app.js`, `quotation-engine.js`, `ui.js`, `tests/document-mapping.test.js`, `tests/stability-guards.test.js`, `README.md`

## UX inventory

| Question | Source behavior to preserve | Evidence |
|---|---|---|
| Entry/default landing | Map-first Buildings workspace with search, filters and building markers/list; opening a building uses a detail drawer. | `Permission_Next.html`, `app.js`, `ui.js` |
| Primary actions | Search a building, open Building 360-style detail, manage building data when authorized, inspect costs/BOQ and start a preliminary quotation. | `Permission_Next.html` building editor and quotation sections |
| Common click paths | Search → select suggestion/marker → open drawer → inspect overview/contacts/costs/documents; quotation → enter customer/floor/distance/revenue inputs → calculate → preview/copy/export. | `Permission_Next.html`, `quotation-engine.js` |
| Search/filter | Thai/English building name, status/area and map/list context; source normalizes building data before display and uses source-specific status/formula rules. | `app.js`, `Permission_Next.html` |
| Detail interaction | Drawer/modal keeps the map context and exposes tabs for building information, documents and quotation-related data. | `ui.js`, `Permission_Next.html` |
| States visible to users | Building lifecycle/status, permission readiness, document availability, cost categories and preliminary quotation state. | `Permission_Next.html`, `app.js` |
| Success/error/empty behavior | Empty search and missing document states are explicit; quotation displays inline validation/warnings and a preliminary estimate disclaimer. | `Permission_Next.html`, `quotation-engine.js` |
| Quotation mental model | Guided steps collect customer/building/floor/distance inputs, calculate installation and building fees, show CAPEX/OPEX/DEPOSIT-style breakdowns, then provide preview/PDF/image/print/copy actions. | `Permission_Next.html`, `quotation-engine.js` |
| Documents | Documents are discovered from the building/NAS context and exposed as categorized DWG/PDF/image entries; target must keep private, audited access. | `README.md`, `tests/document-mapping.test.js`, `app.js` |
| Keyboard/mobile | Source uses drawer/dialog interaction and responsive layout; target must keep search/results keyboard-accessible and provide a non-map fallback when tiles are unavailable. | `ui.js`, `Permission_Next.html` |

## Calculation implications

- Floor parsing supports ground aliases, numeric floors and basements; vertical distance is inclusive.
- Horizontal distance is validated against the building maximum and warns when exceeded.
- Estimate output distinguishes installation, building fees, revenue-share/recurring values and preliminary status.
- Target money calculations must remain server-authoritative and use exact decimal values; source browser calculations are behavioral evidence only.

## Target parity rule

Keep Buildings map-first and operational. Do not replace it with a generic table or hide cost/document context behind unrelated navigation. Replace client Firebase/NAS authority with server-side permission, private provider access, audit and canonical IDs.
