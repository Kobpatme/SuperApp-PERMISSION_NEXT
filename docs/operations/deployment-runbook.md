# Deployment runbook

1. Require reviewed changes and green CI: lockfile install, lint, typecheck, unit/document tests, build and production dependency audit.
2. Verify environment readiness without printing secrets; `/api/health` must report ready.
3. Back up the database and record backup ID, timestamp, encryption and retention before migrations.
4. Apply migrations in numeric order using a least-privilege operator; capture output and schema version.
5. Deploy one immutable build artifact. Confirm CSP/security headers, authentication, permission denial and representative module reads.
6. Monitor error rate, latency, database saturation, outbox lag and failed automation/KPI runs during the rollback window.
7. Record approver, artifact/version, migration versions, smoke-test result and rollback-window closure.

Never run Drizzle migration tooling inside the production web process. A failed migration or health check stops deployment; it does not trigger an automatic destructive rollback.
