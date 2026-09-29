# Professional rebuild: fresh repository audit

Date: 2026-09-28. Baseline: main, `6ccef5b40fc5a9c006d02e58860897142d50ce52`; initially clean working tree. Branch: `codex/professional-workspace`.
Master: [supplied specification](../../PERMISSION_NEXT_PROFESSIONAL_REBUILD.md), confirmed instead of unavailable V2.

| Classification | Evidence and disposition |
| --- | --- |
| Already Done / KEEP | Native App Router routes; local identity/session; explicit domain transitions; Decimal KPI/pricing; canonical Building UUID; audit/outbox; notification producer; CI; 14 migrations. |
| Partially Done / REFACTOR | Shell/search/queue, Buildings map+drawer, Guarantees workflow, Admin users/positions/teams. Server guards remain authoritative. |
| Missing | Role editing/matrix, effective access UI, notification consumer, native Work views, live Building 360, registry providers and Module 4 proof. |
| Stale | Architecture baseline, overview iframe statements, September 4 status, bootstrap requiring hosted Auth UUID, Coral Stay design docs. |
| Dangerous | Client filtering after 2,000-row Buildings fetch; layered theme ownership; role-name assumptions; last-admin check outside mutation transaction needs concurrency review. |
| Can Retire after verification | Unimported BounceBox theme and frame components; retain source fixtures for document/migration tests. |

Local `_discovery_sources/maxiwa`, `Permission_Next`, `maxiwa_KPI` exist as ignored workflow references. Do not copy legacy architecture or mutate source repositories.

## Baseline validation

All five gates passed: lint, typecheck, 20 test files / 60 tests, one document mapping test, Next.js 16.3.4 production build. These do not establish deployed RLS, live concurrency, historical reconciliation, browser accessibility, or restore readiness.

## Phase status

0. Source of truth: repository checkpoint complete (`ba06d0b`); historical documentation explicitly superseded. All five gates passed.
1. Design tokens/shared patterns: token ownership and shared primitives implemented; active themes retired, shell styles moved, domain structure preserved. All five gates passed (60 unit tests). Visual/domain selector migration remains open.
2. Shell/navigation/search/notifications: grouped manifest navigation, visible data-scope summary and recipient-only notification inbox implemented. Five gates pass (22 test files / 64 tests). Visual/browser acceptance remains open.
3. Dashboard internal queries: native scoped Work/Guarantee providers implemented; Buildings reports ready with no action items. External HTTP adapters removed from the primary dashboard path. Browser validation remains open.
4. Work/KPI native views: My/Team/Due views, activity, KPI snapshots/fact provenance and status reports implemented. Approved real KPI rule catalog and historical production population remain blocked externally.
5. Buildings server queries/360: bounded 100-row server search/filter/page with URL state and canonical-ID Building 360 implemented. Composite cursor, viewport projection, query-plan and browser performance validation remain open.
6. Guarantees queue/detail: operational queue is now the default, analytics is secondary, and the financial view model is deterministic and regression-tested. Server-side register pagination/filtering, browser validation and production financial reconciliation remain open.
7. Admin access console: capability-gated sections, custom role creation/clone, manifest-constrained permission matrix, effective access preview, all four data scopes, position/team editing, audit history, session revoke and password reset implemented. Production concurrency and organization-policy review remain open.
7.5. Extensible registry: static versioned manifest/capability contract and disabled Module 4 proof implemented early as a shell dependency. Database lifecycle/pilot controls and capability sync remain planned.
8. Legacy/CSS/accessibility: unreferenced iframe components/theme bridge and dead demo CSS retired; remote logo dependency removed; keyboard/map/admin semantics improved. Login route passed desktop/tablet/mobile visual and keyboard smoke checks. Authenticated browser acceptance remains open.
9. Performance/security/production QA: bounded server reads and section-gated Admin queries verified in source; full deterministic gates pass per checkpoint. Representative production query plans, concurrency/load, deployed security controls, approved business mappings and reconciliation need separate evidence.

## JEV

Native health/network passed. Project uses web-fullstack, metadata-only, source bodies disabled. Phase 0 route recommended documentation. Evidence check advised gathering evidence; direct auth migration/native route/production legacy guard inspection confirmed the limited documentation conclusion. JEV does not establish readiness.

## Final repository verification

On 2026-09-29 the final repository state passed ESLint, TypeScript, 27 Vitest files / 80 tests, the document mapping test and the Next.js 16.3.4 production build. Login visual/keyboard smoke passed desktop, tablet and mobile viewports with no browser console errors. JEV final evidence/continue review requested external evidence and escalation, consistent with the documented need for authenticated staging, production-like data, infrastructure controls and business-owner approval. No deployment or production mutation was attempted.
