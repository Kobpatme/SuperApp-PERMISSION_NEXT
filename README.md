# Permission-Next Super App

Secure modular-monolith foundation for a unified internal workspace covering:

- Work & Activity and automatic KPI
- Canonical Building, conditions and versioned pricing
- Building guarantee and refund workflows
- Shared identity, scoped authorization, audit, events, attachments, notifications and automation

## Run locally

```powershell
npm install
Copy-Item .env.example .env.local
npm run db:migrate
npm run auth:bootstrap
npm run dev
```

The application is self-contained for an organization network. It uses PostgreSQL for business data, Argon2id password hashes and opaque database-backed sessions. There is no external authentication or storage dependency. Set `DATABASE_URL` and the private `GUARANTEE_STORAGE_DIR`, run the migrations, and bootstrap the first administrator once. Every later account, position and status change is handled in `/admin` without direct database access.

The first administrator receives a temporary password and must change it at first sign-in. Administrators add or suspend users, reset passwords, and map positions to RBAC roles and `OWN`, `TEAM` or `ALL` data scopes. Accounts are suspended rather than deleted so financial history and audit references remain intact.

Primary module routes are native Next.js surfaces. Legacy compatibility routes remain available only outside production as migration references and return 404 in production.

## Architecture

Git tracks application code, dependencies, migrations, repeatable tests, development/deployment tools, and architecture/operations references. Generated screenshots, reports, logs, and rendered fixtures under `docs/quality/` stay local or in CI artifacts; historical report links refer to those artifacts. See [repository policy](./docs/operations/repository-policy.md). Completed one-time source transformations are no longer tracked.

Start with [target architecture](./docs/architecture/overview.md), [implementation status](./docs/implementation-status.md), [implementation checklist](./docs/implementation-checklist.md), and [release checklist](./docs/operations/release-checklist.md). Legacy files remain as read-only workflow references during migration.

## Microsoft 365 readiness

The repository includes a server-only Microsoft Graph readiness adapter for the company SharePoint Team Site. It does not change the current production data path and does not create or modify SharePoint content. See [MICROSOFT365-CONNECTION.md](./MICROSOFT365-CONNECTION.md) for the IT request, environment variables, least-privilege permission model, and verification endpoint.

## Important security boundary

Client-side state, query strings and user-editable metadata are never authorization evidence. Production mutations must go through server services, verify the local database session, check action plus data scope, write material audit/activity/outbox records atomically and rely on PostgreSQL RLS as defense in depth.
