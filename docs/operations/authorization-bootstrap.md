# Authorization bootstrap

> **Historical hosted-auth procedure; do not execute against the current runtime.** Current setup uses `npm run db:migrate` then `npm run auth:bootstrap` as documented in README and `on-premise-deployment.md`. Subsequent account management is through `/admin`. The SQL below is retained only as migration history. See ADR-0003.

The normalized RBAC migration intentionally does not translate legacy `user_roles` automatically. A module-scoped legacy role cannot be safely converted to a cross-module role without an approved mapping.

## First administrator

After migration `0002_platform_foundation.sql`, an authorized database operator must create the first assignment inside a transaction, using the verified Supabase Auth user UUID. Never infer the UUID from display name or email.

```sql
begin;

insert into public.user_role_assignments(user_id, role_id, created_by)
select :'verified_user_uuid'::uuid, id, :'verified_user_uuid'::uuid
from public.roles
where code = 'platform_admin';

insert into public.data_scope_grants(assignment_id, scope_type)
select ura.id, 'ALL'
from public.user_role_assignments ura
join public.roles r on r.id = ura.role_id
where ura.user_id = :'verified_user_uuid'::uuid
  and r.code = 'platform_admin'
  and not exists (select 1 from public.data_scope_grants d where d.assignment_id = ura.id);

commit;
```

Confirm the user can read the admin area, then record the operator, ticket/reference, timestamp and verification result. Subsequent grants must be made through an audited admin workflow. The application remains deny-by-default until this bootstrap is complete.

## Runtime contract

The application database role must not have `BYPASSRLS`. Supabase requests use `auth.uid()`. Controlled server transactions using a direct PostgreSQL connection must set `app.user_id` locally from the verified identity before executing scoped queries:

```sql
select set_config('app.user_id', :'verified_user_uuid', true);
```

Never accept this value from request JSON, query parameters or user-editable metadata.
