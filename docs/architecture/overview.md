# Target architecture overview

## Decision

PERMISSION_NEXT will be a TypeScript strict Next.js modular monolith backed by PostgreSQL. The Core Platform owns identity, authorization, teams, canonical buildings, work context, attachments, activity, audit and notifications. Business modules own their state machines and tables. Cross-domain effects occur through typed application services and a durable event/outbox boundary, not direct ad-hoc table access.

## Runtime shape

1. Next.js Server Components read permission-scoped view models.
2. Server Actions/Route Handlers validate input, authenticate the server session and authorize action plus data scope.
3. An application service executes a domain transaction.
4. The transaction writes business state, required audit rows and an outbox/activity record.
5. Idempotent workers evaluate KPI/notification/automation rules and record execution results.
6. Browser components receive only authorized fields and use optimistic feedback only where reconciliation is safe.

PostgreSQL is the source of truth. Supabase Auth and private Storage may be used behind explicit adapters. NAS remains a temporary attachment provider until the file migration decision is approved. The application remains Docker-compatible so infrastructure can move internally.

## Dependency direction

`app/UI -> application services -> domain policies -> repository interfaces -> PostgreSQL/providers`

- Business modules may reference Core IDs and published contracts.
- Business modules must not query another module's private tables.
- Reporting reads may use reviewed read models/views.
- Presentation components contain no permission decisions or financial/KPI formulas.

## Current shell disposition

The existing Next.js shell is a useful prototype and target host, but its iframe routes are explicitly temporary. They bypass legacy login UI while legacy scripts retain direct database access, so they cannot satisfy the project definition of done. Migration will use a strangler approach: replace one workflow slice at a time with native routes and server services, reconcile, then remove the corresponding frame.

## Non-functional baseline

- Deny by default; server authorization and RLS defense in depth.
- `Asia/Bangkok` is the organization timezone; date-only business fields remain date types where appropriate.
- Numeric/Decimal for money; integer or Numeric for scores/weights according to precision policy.
- Cursor/keyset pagination for high-volume lists; selected columns and query-plan-validated indexes.
- WCAG 2.2 AA core flows, visible focus, keyboard-first navigation and non-color status labels.
- Structured logs with request/correlation IDs; no secrets/tokens/passwords in logs.
- Every import, automation, event consumer and consequential action is retry-safe.
