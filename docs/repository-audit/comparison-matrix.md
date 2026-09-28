# Repository comparison matrix

| Concern | MAXIWA KPI | Guarantee Refund | Permission Next | Target disposition |
| --- | --- | --- | --- | --- |
| UI/runtime | Static HTML, browser React scripts | Single static HTML/classic JS | Static HTML + Electron | Next.js modular monolith; migrate screen-by-screen |
| System of record | Supabase Postgres | Firestore + Firebase Storage | Named Firestore DB + NAS | One PostgreSQL domain model; private attachment registry/storage adapters |
| Identity | Employee-ID lookup and optional session columns | Plaintext password in Firestore | PBKDF2 in browser auth document | Supabase Auth/enterprise-ready identity, one server-verified session |
| Authorization | UI role logic; API lacks action/scope checks | UI role/area checks | UI role checks | Deny-by-default server policy + data scope + RLS defense in depth |
| User/team master | `users`, `teams`, permissions JSON | Separate `users` collection | User array in a building document | Core User/Profile/Team/Role/Permission only |
| Building identity | Free text in tasks/extra data | Free-text `place` | Building documents with mixed numeric/string IDs | Canonical UUID Building + source mapping |
| Core workflow | Task status + SLA deadline | Multi-field six-step refund flow | Building status + calculation UI | Domain-specific explicit state machines |
| KPI | Weighted task aggregation | Dashboard metrics only | None | Event-driven, versioned, explainable KPI facts |
| Activity/audit | `audit_log`, notes and task rows | Editable `log` array | No durable domain audit | Separate immutable ActivityEvent and append-oriented AuditLog |
| Money | Legacy numeric values/weights | Browser Number | Browser Number | PostgreSQL Numeric/Decimal; server calculations |
| Attachments | Not a shared model | Firebase download URLs | NAS files matched by names | Shared metadata + private providers + signed/authorized access |
| Realtime | Supabase browser Realtime | Firestore full collection | Firestore full collection | Targeted invalidation/subscriptions by permission and use case |
| Tests | 11 logic tests | None in current checkout | 4 Node tests | Unit + integration + RLS + critical Playwright flows |
| Deployment | Cloudflare Pages/Worker | Unspecified static Firebase app | Cloudflare Pages + Electron | Docker/Vercel-compatible app + PostgreSQL; environment-specific adapters |

## Duplicate concepts to consolidate

- Three user/role stores and three session models.
- Building names/contacts represented independently in Guarantee and Permission Next.
- Work history split across KPI tasks, guarantee embedded logs and building update dates.
- Document metadata represented as URL fields or NAS directory results.
- Status strings and audit attribution controlled independently in each client.
- Dashboard and reporting calculations repeated in browser code.

## Constraints discovered

- Legacy field names and compact statuses must remain available to import adapters and reconciliation reports.
- NAS access is a real operational dependency; target storage must support a temporary provider adapter instead of assuming an immediate file move.
- KPI holiday/SLA behavior is business-significant and needs golden-master tests before refactor.
- Permission calculation formulas and BOQ classifications must be versioned before quote approval is implemented.
- Production data, database rules and credentials are intentionally absent, so Phase 0 can define mappings but cannot certify counts or perform cutover.
