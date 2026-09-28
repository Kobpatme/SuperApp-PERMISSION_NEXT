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
