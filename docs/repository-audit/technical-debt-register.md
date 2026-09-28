# Technical debt register

Priority uses P0 (must resolve before any production data connection), P1 (must resolve before module cutover), P2 (resolve before production readiness) and P3 (planned improvement).

| ID | Priority | Area | Debt | Required disposition |
| --- | --- | --- | --- | --- |
| TD-001 | P0 | KPI API | Missing mandatory authentication/authorization; absent headers are accepted | Replace with Core identity and deny-by-default action/resource policy. |
| TD-002 | P0 | Guarantee | Plaintext passwords and unauthenticated client-direct Firestore CRUD | Freeze legacy credential changes; migrate identities; server-only mutations. |
| TD-003 | P0 | Permission Next | Browser-managed authentication/roles and unversioned Firestore Rules | Do not treat as authorization; migrate to Core identity/RBAC. |
| TD-004 | P0 | Current shell | Legacy pages are served in same-origin iframes and their login gates are programmatically bypassed | Retire frames module-by-module; do not call this production integration. |
| TD-005 | P1 | Data | No canonical building FK in KPI/Guarantee | Build source-map and reviewed deduplication workflow. |
| TD-006 | P1 | Finance | Monetary arithmetic uses JavaScript Number and client-supplied totals | Numeric columns and server-side calculators/invariants. |
| TD-007 | P1 | Audit | Audit is best-effort or editable business JSON | Transactional append-oriented audit, separate immutable activity events. |
| TD-008 | P1 | Workflow | Status transitions live in UI conditionals and parallel fields | Explicit domain transition services with tests/idempotency. |
| TD-009 | P1 | KPI | No rule versions, facts, adjustments or source-event trace | Implement event-ledger-driven KPI model. |
| TD-010 | P1 | Files | Firebase URLs and naming-based NAS links are not a shared secure model | Attachment registry, provider key, checksum, private access and audit. |
| TD-011 | P1 | Current DB | Drizzle schema models only three tables and omits relational FK definitions represented in SQL | Replace with complete modular schema/migrations; add consistency tests. |
| TD-012 | P1 | Current DB | `getDb()` creates a new Postgres client per call without lifecycle/pooling policy | Introduce a singleton/serverless-safe connection boundary. |
| TD-013 | P1 | Current audit | `writeAuditLog` swallows failures and is outside business transactions | Make required audit writes atomic; define best-effort only for non-material telemetry. |
| TD-014 | P2 | Performance | Full collection/table scans and browser aggregation | Server pagination, selected columns, indexed normalized search and pre-aggregated reports where justified. |
| TD-015 | P2 | Maintainability | 5,000-8,000 line scripts mix UI, domain and persistence | Incremental strangler migration into domain/application/presentation layers. |
| TD-016 | P2 | Tests | No end-to-end authorization, RLS, migration or financial workflow coverage | Add unit, integration and Playwright suites before cutover. |
| TD-017 | P2 | Operations | No unified backup/restore, monitoring, deployment or incident runbook | Deliver and test in Phase 9; do not claim restore success before a drill. |
| TD-018 | P3 | UX | Three visual systems and duplicated navigation/status semantics | Apply common shell/tokens and domain-specific workflow language. |
| TD-019 | P2 | Tooling | Four moderate advisories remain in the dev-only `drizzle-kit` transitive esbuild chain | Keep the CLI out of production, retain lockfile pinning, monitor upstream and do not accept npm's breaking downgrade suggestion. |

The current SuperApp passes lint, typecheck, unit tests, document tests and production build. The production dependency audit reports zero vulnerabilities. The `_discovery_sources` evidence directory is explicitly excluded from application lint/build scope.
