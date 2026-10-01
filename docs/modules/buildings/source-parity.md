# Buildings & expenses source parity

Status: SP-0 fresh baseline, 2026-09-29. Authoritative source is `Kobpatme/Permission_Next` at `afaee997afecf0f42e059b7100fa90ed0d188784` (`app.js`, `Permission_Next.html`, `quotation-engine.js`, `tests/document-mapping.test.js`, `tests/stability-guards.test.js`). The local checkout is not the source of truth.

| Source feature | Source screen | Source role/use case | Source file/function | SuperApp target | Current status | Decision | Test evidence | Notes |
|---|---|---|---|---|---|---|---|---|
| Map-first building search | Buildings | Permission, sale, admin | `app.js`; map/filter rendering | `/buildings` | Map + synchronized result list rendered; result set remains bounded by server query | ADAPT | `building-query.test.ts`; lint/typecheck/build | Preserve map-first mental model and synchronized selection; confirm large-catalog autocomplete against production-scale fixtures |
| Building detail drawer | Buildings | All permitted users | `app.js`; drawer actions | `/buildings/[id]` | Building 360 read view exists | ADAPT | Building query tests | Add complete operational actions |
| Add/edit building | Building editor | Permission/admin | `app.js`; editor submit handlers | Building service/actions | Read-focused target | PORT | Gate B-01 | Server validation and audit required |
| Duplicate detection | Building editor | Permission/admin | `app.js`; normalized name/coordinate checks | Building domain service | Partial/needs source reconciliation | PORT | Gate B-02 | Normalize Thai/English names and exact coordinates |
| Archive/merge | Building maintenance | Authorized admin | Source delete/maintenance behavior | Archive/merge service | Missing | REPLACE | Gate B-03 | Replace unsafe hard delete; audit impact and aliases |
| Contacts/coordinates/conditions/remarks | Building editor | Permission/admin | `app.js` editor fields | Building canonical + condition versions | Schema/foundation exists | ADAPT | `permission-building-domain.test.ts` | Preserve condition version history |
| BOQ and fee classification | Building/BOQ | Permission/admin | `app.js`; BOQ/fee registry | `building_condition_fees` | Foundation and read presentation exist | ADAPT | `permission-quotation.test.ts` | CAPEX/OPEX/DEPOSIT/UNCLASSIFIED |
| CAPEX/OPEX/DEPOSIT | BOQ | Finance/permission | `app.js`; fee classification | Building condition fee service | Partial | PORT | Gate B-04 | Server-side classification |
| Revenue share/additional fees | BOQ | Permission/admin | `app.js`; other fee rows | Pricing/building fee service | Partial | PORT | Gate B-05 | Fixed and revenue-share variants |
| Quotation create/edit | Quotation workspace | Permission/sales | `quotation-engine.js`, `app.js` | `permission-quotation.ts`, price tables | Domain helper exists; UX incomplete | ADAPT | `permission-quotation.test.ts` | Calculation authority stays server-side |
| Quotation version/draft/submit/approval | Quotation workspace | Creator/reviewer | `app.js`; estimate/version actions | Price estimate services/actions | Schema exists; flow incomplete | PORT | Gate B-06 | Four-eyes approval and immutable versions |
| Customer/floor/distance calculation | Quotation form | Sales/permission | `quotation-engine.js`; floor parsers | Pricing domain | Partial | ADAPT | Gate B-07 | WM/customer/vertical/horizontal limits |
| Export/copy summary | Quotation | Sales/permission | `app.js`; export/copy handlers | Export action | Missing/partial | PORT | Gate B-08 | Do not expose unauthorized fields |
| NAS/DWG/PDF/image document workflow | Documents | Account upload permission | `app.js`, `tests/document-mapping.test.js` | attachments + secure NAS routes | Download/read foundation exists | ADAPT | `attachments.test.ts`, document tests | Private storage key only; max 100 MB/no overwrite |
| Stale permission rule | Building detail | Permission/admin | `app.js`; stale status calculation | Building condition view model | Partial | PORT | Gate B-09 | Source status exclusions and 365-day rule require golden cases |

`RETIRE` decisions: none at SP-0. The source's browser Firebase/NAS authority is not ported; it is replaced by server authorization and private attachment providers, while user-visible document capability is retained.
