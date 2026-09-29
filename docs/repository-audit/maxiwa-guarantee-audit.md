# Repository audit: Building Guarantee Refund (`maxiwa`)

> Historical audit snapshot. The authoritative fresh baseline is `Kobpatme/maxiwa@94742a4b8cb10a4f39b87b257e9ca548ef7ef1e6` (2026-09-15), documented in `docs/modules/guarantees/source-parity.md`. Do not use the older snapshot below to conclude that a current feature is absent.

## Evidence snapshot

- Source: `Kobpatme/maxiwa`, branch `main`, inspected at `471f2b6` (2026-07-08).
- History: 168 commits; first commit `7d93eb0` (2026-03-06). History shows a Supabase-to-Firebase migration on 2026-03-12.
- Current runtime: static `index.html` plus classic JavaScript, Firebase compat SDK, Firestore and Firebase Storage.
- There is no current `package.json`, lockfile, build pipeline, CI configuration, schema migration directory or deployment runbook in the checkout.
- Main implementation is an 8,000+ line HTML document. Data access is in `firebase-client.js`.

## Current domain and workflow

The `deposits` collection stores a denormalized guarantee case. Observed fields include building/place, owner, customer, area, project/deal/CID/PR references, request/accounting/return dates, payment destination/type, installation deposit, removal deposit, fees, other cost, calculated total, contact details, status fields, return flags, inspection fields, TL routing, evidence URLs, cancellation metadata and an embedded `log` array.

The effective workflow is implemented in browser code with compact legacy statuses:

`new -> fin -> att -> tl -> ret -> clo -> done`, with `Cancel`, TL acceptance/completion flags and an On Service view for outstanding removal deposits. Browser logic can auto-close cases with no refundable amount, require evidence at selected steps and move a completed TL case into refund processing.

User documents include `employee_id`, `name`, `email`, `role`, `area`, dashboard/TL flags, `password` and `last_session_id`. Roles observed are `admin`, `user` and `tl`.

## Security and integrity findings

| Severity | Finding | Evidence / impact |
| --- | --- | --- |
| Critical | Passwords are queried and stored in plaintext | Login filters Firestore by `employee_id` and `password`; password reset writes a new plaintext password after matching employee ID and email. |
| Critical | Authorization is browser-only | UI role checks do not protect direct calls to `add`, `update` or `delete` Firestore documents. No Firestore Rules are versioned in the repository. |
| Critical | Any authenticated-looking client state can invoke CRUD | The app uses no Firebase Authentication token; session storage and `last_session_id` are client-managed. |
| High | Material financial records can be hard-deleted | Admin UI calls `deleteDeposit`; no server-side invariant or immutable financial history exists. |
| High | Financial totals and state transitions are client-calculated | Firestore accepts the client payload; negative amounts, over-refunds and invalid transitions are not enforced at a trusted boundary. |
| High | Files use persistent Firebase download URLs | Access revocation and per-record authorization cannot be guaranteed by the app layer. |
| High | Audit is an editable array inside the business document | The same client that changes the case can replace or omit its log. |
| Medium | Full collection reads and client filtering | Every client loads all deposits/users; this will degrade and exposes more data than required. |
| Medium | No stable building foreign key | `place` is free text, creating duplicate masters and ambiguous cross-module links. |

The Firebase client configuration is committed as expected for a browser Firebase app; it is not itself a server secret. The missing evidence is the deployed Firestore/Storage Rules, which determine the actual exposure.

## Tests and quality

`npm test` from the current repository cannot be run because the current checkout has no package manifest. There are no checked-in unit/integration/E2E tests for the guarantee workflow. The large single-file UI contains useful validation and XSS escaping improvements, but domain logic, rendering and persistence are tightly coupled.

## Migration classification

- **KEEP:** Thai workflow vocabulary, six-step operational flow, area-to-TL routing, evidence categories, dashboard definitions and notification/use-case semantics.
- **ADAPT:** legacy case fields, embedded log entries and Firebase Storage references through explicit migration mappings.
- **REFACTOR:** case UI, filters, reporting, notification rules and document presentation.
- **REWRITE:** credential handling, server-side state machine, financial validation, refund ledger, durable audit/activity events and private attachments.
- **RETIRE:** plaintext passwords, client-direct CRUD, editable embedded audit, hard delete, public/persistent file URLs and name-based building linkage.

## Migration complexity

High. A case can encode multiple monetary concepts and parallel legacy status fields (`status`, `status_final`, `complete`, `complete_tl`, return flags). Migration requires deterministic status normalization, Decimal/Numeric money conversion, attachment inventory and reconciliation against actual Firestore documents. Low-confidence building matches must remain `REVIEW_REQUIRED`.
