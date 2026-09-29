# Current data map

> Source-of-truth note (2026-09-29): the behavioral baselines are `Kobpatme/maxiwa@94742a4`, `Kobpatme/Permission_Next@afaee99`, and `Kobpatme/maxiwa_KPI@4f5fa99`. The local paths and the legacy data stores below describe migration evidence only. PostgreSQL and SuperApp server services remain the target persistence/authorization authority.

## MAXIWA KPI / Supabase

- `users`: employee identifier variants, name, team, role, avatar, permissions JSON, optional active-session fields.
- `teams`: team catalogue.
- `kpis`: team, main KPI, sub KPI, SLA working days and weight.
- `holidays`: date, name/source and active state.
- `tasks`: legacy ID, employee/name/team, job, KPI labels, start/deadline/completion, status, note, weight fields, timestamps and `extra_data` (SSR number, holds, KPI snapshots/overrides).
- `audit_log`: task reference, action, actor text, details and timestamp with legacy column variants.
- Optional `app_*` tables in a future-ready SQL document; their deployment is not proven.

## Guarantee / Firestore and Firebase Storage

- `users`: separate credentials and role/area/feature flags.
- `deposits`: one denormalized document per guarantee case containing work context, free-text building, money, workflow fields, contacts, attachment URLs, cancellation fields and embedded logs.
- `password_reset_requests`: reset audit/request documents.
- Storage folders: `payments`, `layouts`, `additional`, `tl_works`, `tl_extra`, `final_docs` and other evidence paths.

## Permission Next / named Firestore database and NAS

- `buildings/{building}`: canonical-ish building data mixed with fee/calculation/BOQ fields.
- `buildings/permission_next_auth`: user array and revision.
- `buildings/permission_next_auth_backup`: backup user array and revision.
- `buildings/permission_type_formulas`: formula registry/configuration.
- NAS hierarchy: region/province/building folders; supported DWG/PDF/image files discovered by normalized names and area.
- Quotation drafts/history: browser-local state only; no durable production entity.

## Current SuperApp baseline

- `profiles`, `user_roles`, `audit_logs` only.
- Supabase Auth is the proposed identity source.
- Native module routes and server read models are present in the current target checkout. Work/KPI still has a generic foundation rather than complete source parity; see the fresh matrices in `docs/modules/*/source-parity.md`. Legacy routes are migration references only.

## Cross-system relationship gaps

There is no shared identifier for Building, User, Team, Project/Job, Attachment, Activity or KPI Rule. The target must retain `source_system` and `source_id` crosswalks rather than joining by mutable display names.
