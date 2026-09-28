# Repository audit: Permission Next

## Evidence snapshot

- Source: `Kobpatme/Permission_Next`, branch `main`, inspected at `afaee99` (2026-08-27), package version 1.2.4.
- History: 56 commits; first commit `e746faf` (2026-07-02). No release tags were found in the application repository.
- Runtime/deployment: static Cloudflare Pages application and Electron desktop package. Data uses the named Firestore database `permission-building`; building documents are read from a local Windows/NAS bridge.
- Package manager: npm. Runtime dependency is `electron-updater`; Electron and electron-builder are development dependencies.
- Main implementation: `app.js` (5,910 lines), `Permission_Next.html`, `style.css`, `firebase-init.js`, quotation engine and Node NAS bridge.

## Current domain and workflow

The `buildings` collection is both business storage and a container for protected configuration documents. Building fields include ID, Thai/English names, status/group/type/install/survey type, area/province/location/address, coordinates, contacts, update date, cable/WM/enclosure constraints, multiple fee/deposit/rent fields, installation calculation profile, BOQ profile, other fees, permission-calculation settings and remarks.

The application provides map/list search, filters, building drawer, building CRUD, automatic stale-status updates after 365 days, duplicate warnings by normalized Thai/English name or exact coordinates, BOQ profile generation and a client-side preliminary quotation calculator/exporter. Quotation drafts/history are browser-side; there is no durable estimate/version/approval model.

Users are stored as an array inside `buildings/permission_next_auth`, with a backup document and revision. Roles are `admin`, `permission` and `sale`. Passwords use PBKDF2-SHA256 with per-user salt and automatic upgrade from a legacy hash, but all verification and role decisions occur in the browser without Firebase Authentication.

The NAS bridge has useful hardening: loopback default, origin allowlist, bounded body size, extension allowlist, exact/ambiguous folder matching, path containment checks, opaque short-lived download tokens, no-overwrite uploads and read-only mode. Electron starts it with an ephemeral secret.

## Security and integrity findings

| Severity | Finding | Evidence / impact |
| --- | --- | --- |
| Critical | Authentication and authorization are client-side | A PBKDF2 hash protects passwords at rest, but the auth user array and CRUD APIs are available through the browser client. No Firebase Auth identity exists. |
| Critical | Firestore Rules are not versioned | Server-side enforcement, data scope and protection of auth/config documents cannot be verified or reproduced. |
| High | Business writes and automatic status updates originate in the browser | Role checks, validation, duplicate detection and state changes can be bypassed by a direct Firestore client. |
| High | Building and auth/config documents share one collection | This increases accidental exposure/deletion risk and complicates RLS-style policy design and migration. |
| High | Building deletion is hard delete | No merge/tombstone workflow, reference check or immutable audit exists. |
| High | Quotation is not a durable/versioned approval workflow | Calculations and exported documents cannot be traced to an immutable building-condition snapshot. |
| Medium | All building rows are subscribed to each client | Client memory/filter cost and data exposure grow with the dataset. |
| Medium | Auto-stale updates can write many records from any signed-in browser | The operation is not a controlled job and has no idempotent run/audit model. |
| Medium | Direct deployed-origin NAS trust in the legacy bridge is broad | The current standalone bridge treats allowed deployed origins as trusted; the target SuperApp proxy improves this with an explicit server secret and RBAC but needs integration tests. |

## Tests and quality

`npm test` passed all 4 tests on 2026-09-04. Tests cover exact/ambiguous NAS folder mapping, token-gated/read-only behavior, bounded document operations and repeated-submit guards. `npm run check` also includes syntax checks and `npm audit`, but was not used because it performs a network-dependent audit. There are no authorization, Firestore Rule, quotation approval or migration tests.

## Migration classification

- **KEEP:** building search terminology, map interaction model, duplicate signals, calculation formulas as reconciliation fixtures, exact NAS folder matching and protected path/token techniques.
- **ADAPT:** canonical building fields, contacts/conditions, BOQ and permission formula data into normalized relational tables with legacy provenance.
- **REFACTOR:** map/list components, responsive filters, document browsing and quotation UI into the common design system.
- **REWRITE:** identity, server authorization, persistence, building history/merge, quote versions/approval/snapshots, audit/activity production and private file registry.
- **RETIRE:** embedded auth documents, browser-direct Firestore writes, hard delete, full-collection subscription and browser-only quote history.

## Migration complexity

High. The repository contains no real building dataset, no Firestore export and no Rules. The application comments state that 912 seed records were previously imported, but current production row counts and quality cannot be verified. Nested calculation/BOQ profiles require version-aware mapping, and building documents live outside Firestore on a naming-based NAS hierarchy.
