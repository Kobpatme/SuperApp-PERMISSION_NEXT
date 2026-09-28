# Repository audit: MAXIWA KPI

## Evidence snapshot

- Source: `Kobpatme/maxiwa_KPI`, branch `main`, inspected at `4f5fa99` (2026-08-14).
- History: 162 commits; first commit `5460d52` (2026-04-07). No release tags were found.
- Runtime/deployment: static assets built by a custom Node script, Cloudflare Pages/Worker, Supabase Postgres and Supabase Realtime.
- Package manager: npm (`package-lock.json`). Production dependencies are React 19, React DOM 19 and `iconv-lite`; Tailwind and Wrangler are development dependencies.
- Main implementation: `public/js/maxiwa.js` (7,424 lines), `public/_worker.js` (2,604 lines), `public/js/api.js` (602 lines), plus static HTML entry points.

## Current domain and workflow

The repository implements users, teams, KPI definitions, holidays, tasks and audit logs. A task carries an employee/name/team, job text, main/sub KPI, start date, deadline, completion date, status, notes, weights and an extensible `extra_data` object. Statuses are `Pending`, `On Process`, `On Hold`, `Completed` and `Cancelled`. Deadlines exclude weekends and active holidays; hold periods extend deadlines. Reports calculate weighted completion and SLA performance from task rows.

Roles are `Staff`, `Lead`, `Manager` and `Admin`, with optional `allowedStaff`, `allowedTeams`, KPI assignments and KPI weight overrides stored in a user permissions JSON field. The UI exposes personal work, team work, task assignment, reports, job tracking and an admin studio.

## Data and API observations

- The Cloudflare Worker talks to Supabase REST with a service/write key and dynamically adapts to legacy column variants.
- The Worker exposes task, dashboard, staff, KPI, audit and admin CRUD endpoints. It also publishes a public Supabase URL/anon key for Realtime.
- The application accepts employee ID as its login identifier. `getInitialData` looks up a user and creates a session identifier; no credential proof is present in that route.
- Session enforcement is conditional on optional columns. If the client sends no session headers, or the columns do not exist, `validateServerSession` allows the request.
- API routes do not perform role/action/data-scope authorization. Admin identity is accepted from the `x-admin-empid` header for audit attribution.
- Several reads use broad scans with compatibility fallbacks. Job search loads all tasks before filtering. Dashboard compatibility helpers can read every row.
- Deletes are hard deletes for tasks and admin-managed rows. Audit writes are best-effort and failure is swallowed.
- KPI values are embedded/snapshotted onto task rows and reports aggregate tasks. There is no immutable business-event ledger, versioned rule/fact model, adjustment approval workflow or idempotent score production.

## Security findings

| Severity | Finding | Evidence / impact |
| --- | --- | --- |
| Critical | Authentication and authorization are not enforced at the API boundary | Missing session headers are accepted; mutation/admin routes do not verify the actor's role or ownership. A caller able to reach the Worker can read or mutate broad data. |
| Critical | Service-role-style database access is used behind a broadly callable Worker | Compromise or route misuse bypasses database RLS protection. |
| High | Hard delete exists for tasks and master data | Material work history can be removed even though an audit attempt is made. |
| High | Client/headers supply actor and scope hints | `changedBy`, employee/team parameters and `x-admin-empid` are not trusted identity evidence. |
| High | Audit failure does not fail the business mutation | Important changes can complete without a durable audit record. |
| Medium | Broad scans and 1,000-row paging remain in reporting paths | Latency and memory grow with historical volume; client aggregation can diverge. |
| Medium | Dynamic schema/column probing hides contract drift | Compatibility is useful for migration but weakens validation and makes failure modes difficult to reason about. |

No committed plaintext secret was identified in the inspected configuration paths; runtime secrets are expected in Cloudflare environment variables. This does not validate the deployed secret configuration.

## Tests and quality

`npm test` passed all 11 logic tests on 2026-09-04. Coverage includes Bangkok dates, holiday-aware deadlines, period filtering, weighted scores, mutation dedupe IDs and pagination behavior. There are no repository-level TypeScript checks, integration authorization tests or critical browser E2E tests. The source is dominated by large scripts and generated `dist` duplicates.

## Migration classification

- **KEEP:** holiday-aware working-day algorithms, status vocabulary during transition, job grouping/search semantics, Thai terminology, report definitions as reconciliation references.
- **ADAPT:** user/team/KPI/task fields through explicit typed import adapters; preserve provenance and legacy IDs.
- **REFACTOR:** dashboards, task lifecycle, notes, permission scopes, realtime handling and server pagination.
- **REWRITE:** identity/authentication, server authorization, event/activity capture, versioned KPI facts/rules, audit transaction boundary.
- **RETIRE:** employee-ID-only login, conditional session enforcement, direct service-key CRUD endpoints, browser-controlled admin attribution and hard delete for material work records.

## Migration complexity

High. The legacy task table mixes work assignment, lifecycle, KPI policy snapshots and free-form metadata. Migration must preserve historic weights and manual provenance without presenting old rows as system-generated activity events. Production schema, row counts, RLS policies and actual data quality are not present in the repository and require a read-only source inventory before mapping is finalized.
