# Repeatable quality gates

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:documents`, `npm run build`, `npm run check:css` and `npm run check:contrast` for application changes. Stop the development server before a build in the same directory. Use the isolated database/browser commands in module operations guides for mutations and concurrency; never point fixture tooling at main or production data.

Authentication, authorization/scopes, optimistic versions, idempotency, audit rollback, expiry and single-session displacement need negative-path tests. Preserve exact-decimal financial/KPI formulas and approved source workflows. UI checks cover Light/Dark, desktop/mobile, visible keyboard focus, modal dismissal, accessible labels, overflow and draft retention. Static contrast and compilation alone do not prove accessibility.

Generated reports/screenshots/logs/rendered fixtures stay local or in CI artifacts. Output directories are retained as placeholders, and `npm run test:e2e` regenerates its error-render fixture. Test counts and local readiness live in [current status](../implementation-status.md); production acceptance uses the [release checklist](../operations/release-checklist.md).
