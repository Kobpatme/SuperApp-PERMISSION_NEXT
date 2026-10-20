# Building deposit V2 integration

Authoritative source: `Kobpatme/maxiwa@94742a4b8cb10a4f39b87b257e9ca548ef7ef1e6`. The local checkout `D:\WebApp\ระบบขอคืนเงินประกัน_V2` is only a comparison artifact and may contain uncommitted presentation work; this document must not treat it as source of truth.

The Next.js module at `/guarantees` now uses a TypeScript port of the source's `domain-logic.js` for installation/removal deposit metrics, On Service and Off Service states, outstanding amounts, missing evidence, consistency checks, prioritized work queue, notifications and operational analytics. The six-step status flow is validated server-side for native writes. Search, status filtering and CSV export work on the visible list.

`supabase/migrations/0009_guarantee_v2_workflow.sql` (legacy directory name) adds scoped operational records, assigned-TL ownership, an append-only work-event stream and the `guarantee_tl` role/permission. The source's Firebase client, custom password/session logic and client-only permission checks are **not** copied. Server actions use the on-premise identity, row-scope grants, optimistic version checks and transactional event writes. Direct client inserts and updates have no RLS policies. Evidence upload is handled server-side (PDF/JPG/PNG, 20 MB) in `GUARANTEE_STORAGE_DIR`; document opening checks row access and streams the private file through the application.

No production database or Firebase records were read or migrated during this change. The development-only `?preview=1` view uses synthetic records. Before live use, apply the PostgreSQL migrations, configure `DATABASE_URL` and `GUARANTEE_STORAGE_DIR`, bootstrap the first administrator, and verify role grants and data scopes. The create and update actions accept `guarantee.case.create`, `guarantee.case.update` or the existing scoped `guarantee.case.manage` permission. Each TL account needs a `guarantee_tl` role assignment with an `OWN` grant for `guarantee.tl.work`, then must be explicitly assigned to an item. TL writes are limited to that item's TL evidence and TL workflow transitions.

Outstanding parity work before replacing V2 completely:

- V2 records have not been imported. Record ownership, team scope, building mapping and attachments need a reviewed migration plan.
- The current list intentionally loads at most 500 recently updated records. It displays a warning when more exist; server pagination and database-level KPI aggregation are needed for larger datasets.
- Live database and private storage write paths require the organization's configured PostgreSQL instance and private file share. Verify service-account filesystem permissions in a production-like environment.
- Only one current evidence file per document kind is shown; replacement files are retained privately in Storage for recovery, and no automated retention policy is configured yet.
