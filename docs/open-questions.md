# Open questions

These questions cannot be proven from the repositories. They do not block architecture/documentation work, but the indicated phase cannot pass without an answer or direct read-only evidence.

| ID | Question | Blocks | Safe default until resolved |
| --- | --- | --- | --- |
| OQ-001 | Which deployed instances and database projects are the production systems of record for each module? | Production inventory, migration dry run | Make no external writes and treat all local data as non-production evidence. |
| OQ-002 | Can a read-only export of Supabase schema/data profile, both Firestore databases, Storage metadata and current security rules be provided? | Final data mapping and security verification | Build import contracts/fixtures only. |
| OQ-003 | What retention, privacy, audit and financial-record policies apply, and who approves deletion/merge? | Destructive migration, retention and archive | Preserve everything; use soft delete/tombstones and append-only history. |
| OQ-004 | Who owns KPI policy and approves rule dimensions, weights, adjustments and historical recalculation? | KPI production configuration | Implement configurable/versioned mechanics without hardcoding sample weights. |
| OQ-005 | What constitutes a complete/partial guarantee refund, and may deposited/refunded amounts include tax/withholding/fees? | Guarantee financial state machine | Keep separate monetary components and reject automatic inference. |
| OQ-006 | Which legacy users are authoritative where employee ID/email/name conflict, and what is the target SSO/provider? | Identity migration/cutover | Use Supabase Auth-compatible identity abstraction and a reviewed crosswalk. |
| OQ-007 | Is the NAS authoritative long term, or must documents move to Supabase/S3/SharePoint? | Attachment cutover and operations | Keep a provider boundary; do not move or delete files. |
| OQ-008 | Who are the UAT representatives for KPI, Guarantee, Pricing, managers and admins? | Module cutover | Prepare scripted acceptance tests and keep legacy read access. |
| OQ-009 | What are the actual data volumes, concurrency peaks and report retention periods? | Performance sizing/index validation | Design for <100 users with server pagination; validate indexes against real query plans later. |
| OQ-010 | Are Cloudflare/Electron deployments still required after web cutover? | Final deployment topology | Keep target Docker/Vercel compatible and do not remove legacy packaging yet. |
| OQ-011 | Which production-like PostgreSQL/Supabase environment may be used for migration, RLS, concurrency and rollback tests? | Phase 1 integration gate and Phase 9 release | Do not apply migrations externally; validate types and SQL contracts only. |
| OQ-012 | What are the approved pricing tax rates, rounding points and exception rules? | Pricing production calculations | Keep the exact-decimal/versioned engine configurable; do not seed business rates. |

## Work/KPI/Admin parity defaults — 2026-10-05

| Decision | Applied default | Remaining owner decision |
|---|---|---|
| D1 | Soft delete + preserved audit/history + scoped admin restore | Retention policy remains OQ-003 |
| D2 | Source sync relies on external holiday data; manual date entry (source=thai/company), no network dependency | Approve authoritative provider and reviewed import/sync workflow |
| D3 | Actor-bound KPI migration dry-run only; no historical writes/raw fact edits | Approve dataset/crosswalk/business UAT before any historical application |
| D4 | Executive/Performance presentation deferred; native reports retained | Confirm current usage and presentation requirements |
| D5 | Existing RBAC, no duplicate legacy roles; capability mapping in docs/modules/work/parity-2026-10-05.md | Configure actual users/scopes through Roles UI after review |

Isolated local PostgreSQL fixtures were used for migrations/transactions/browser evidence. Production activation and least-privileged RLS assessment remain OQ-011; this work does not apply production migrations or grant real users new roles.

## Single active session policy — 2026-10-08

The addendum applies the same single-session rule to administrators and staff; no bypass was introduced. A new login displaces an older administrator session, so operators must account for this during shared-account troubleshooting. If unattended/service accounts are introduced later, their identity and session policy needs a separate owner decision. This does not block the current interactive-account implementation. The feature flag can disable future superseding; it does not restore tokens already revoked.
