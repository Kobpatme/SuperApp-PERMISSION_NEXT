# Permission-Next Super App

Secure modular-monolith foundation for a unified internal workspace covering:

- Work & Activity and automatic KPI
- Canonical Building, conditions and versioned pricing
- Building guarantee and refund workflows
- Car booking and scheduling
- Duct rental workflows, PDF signing and annual renewals (development/default-disabled until owner UAT)
- Shared identity, scoped authorization, audit, events, attachments, notifications and automation

## Run locally

For a clean Docker/IT handoff, use the [Docker and GitLab guide](DEPLOY.md):

```powershell
Copy-Item .env.example .env
docker compose up --build -d --wait app
# Supply INITIAL_ADMIN_* privately in .env, then run once:
docker compose --profile tools run --rm bootstrap
```

The Docker reference uses separate schema/Core/Car/Duct accounts and private
volumes. Container/database acceptance must be run on a Docker host before
release. `npm run test:docker` creates only a disposable isolated fixture.

For an existing native development setup:

```powershell
npm install
# Preserve/configure .env.local with localhost DB URLs and host storage paths.
# DATABASE_URL_MIGRATE is the operator URL; DATABASE_URL is Core runtime.
npm run db:migrate
npm run auth:bootstrap
npm run dev
```

The application is self-contained for an organization network. It uses PostgreSQL for business data, Argon2id password hashes and opaque database-backed sessions. There is no external authentication or storage dependency. Set `DATABASE_URL` and the private `GUARANTEE_STORAGE_DIR`, run the migrations, and bootstrap the first administrator once. Every later account, position and status change is handled in `/admin` without direct database access.

The first administrator uses a privately supplied temporary password and must change it at first sign-in. Bootstrap is a one-time operation and never resets an existing administrator. Administrators add or suspend users, reset passwords, and map positions to RBAC roles and `OWN`, `TEAM` or `ALL` data scopes. Accounts are suspended rather than deleted so financial history and audit references remain intact.

Primary module routes are native Next.js surfaces. Legacy compatibility routes remain available only outside production as migration references and return 404 in production.

## Architecture

Git tracks application code, dependencies, migrations, repeatable tests, development/deployment tools, and architecture/operations references. Generated screenshots, reports, logs, and rendered fixtures under `docs/quality/` stay local or in CI artifacts; historical report links refer to those artifacts. See [repository policy](./docs/operations/repository-policy.md). Completed one-time source transformations are no longer tracked.

Start with the [documentation index](./docs/README.md), [current implementation status](./docs/implementation-status.md), and [release checklist](./docs/operations/release-checklist.md). Module contracts and unresolved business specifications remain available during migration.

## Microsoft 365 readiness

The repository includes a server-only Microsoft Graph readiness adapter for the company SharePoint Team Site. It does not change the current production data path and does not create or modify SharePoint content. See [MICROSOFT365-CONNECTION.md](./MICROSOFT365-CONNECTION.md) for the IT request, environment variables, least-privilege permission model, and verification endpoint.

## Important security boundary

Client-side state, query strings and user-editable metadata are never authorization evidence. Production mutations must go through server services, verify the local database session, check action plus data scope, write material audit/activity/outbox records atomically and rely on PostgreSQL RLS as defense in depth.
