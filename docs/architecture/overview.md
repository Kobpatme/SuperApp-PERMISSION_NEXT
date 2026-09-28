# Current architecture overview

Status: Current, verified against repository commit `6ccef5b` on 2026-09-28. Source and deterministic checks take precedence; rebuild acceptance criteria describe planned work, not completed features.

## Decision

PERMISSION_NEXT will be a TypeScript strict Next.js modular monolith backed by PostgreSQL. The Core Platform owns identity, authorization, teams, canonical buildings, work context, attachments, activity, audit and notifications. Business modules own their state machines and tables. Cross-domain effects occur through typed application services and a durable event/outbox boundary, not direct ad-hoc table access.

## Runtime shape

1. Next.js Server Components read permission-scoped view models.
2. Server Actions/Route Handlers validate input, authenticate the server session and authorize action plus data scope.
3. An application service executes a domain transaction.
4. The transaction writes business state, required audit rows and an outbox/activity record.
5. Idempotent workers evaluate KPI/notification/automation rules and record execution results.
6. Browser components receive only authorized fields and use optimistic feedback only where reconciliation is safe.

PostgreSQL is the source of truth. Current identity uses Argon2id passwords and opaque database-backed sessions (`src/lib/auth.ts`, migration 0011). Private local/NAS storage is the current provider. Microsoft 365 is an optional readiness integration. Supabase and Vercel are not required; a future provider change requires an explicit ADR. The application remains Docker-compatible for organization infrastructure.

## Dependency direction

`app/UI -> application services -> domain policies -> repository interfaces -> PostgreSQL/providers`

- Business modules may reference Core IDs and published contracts.
- Business modules must not query another module's private tables.
- Reporting reads may use reviewed read models/views.
- Presentation components contain no permission decisions or financial/KPI formulas.

## Current shell disposition

All primary module routes render native Next.js components. Legacy compatibility routes return 404 in production and are deprecated migration references. Buildings and Guarantees have operational UI; Work still uses a generic foundation. Native routing does not imply completed domain migration or production approval.

## Non-functional baseline

- Deny by default; server authorization and RLS defense in depth.
- `Asia/Bangkok` is the organization timezone; date-only business fields remain date types where appropriate.
- Numeric/Decimal for money; integer or Numeric for scores/weights according to precision policy.
- Cursor/keyset pagination for high-volume lists; selected columns and query-plan-validated indexes.
- WCAG 2.2 AA core flows, visible focus, keyboard-first navigation and non-color status labels.
- Structured logs with request/correlation IDs; no secrets/tokens/passwords in logs.
- Every import, automation, event consumer and consequential action is retry-safe.
