-- Forward-only corrective policy migration.
-- Existing migrations are immutable; this changes only server-side policy predicates.
-- No grants, users, module settings, or business rows are seeded here.

-- Canonical identity is the normalized RBAC role, not the legacy user_roles table.
create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
set search_path = pg_catalog, public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    join public.local_credentials c on c.user_id = p.id
    join public.user_role_assignments a on a.user_id = p.id
    join public.roles r on r.id = a.role_id and r.code = 'platform_admin'
    where p.id = public.current_platform_user_id()
      and p.status = 'active'
      and not c.must_change_password
      and a.valid_from <= now()
      and (a.valid_until is null or a.valid_until > now())
  );
$$;

-- This SECURITY DEFINER predicate is not a client-facing API. Keep execution
-- limited to the trusted service roles that evaluate Core/RLS policy boundaries.
revoke all on function public.is_platform_admin() from public;
grant execute on function public.is_platform_admin() to permission_core_runtime;
grant execute on function public.is_platform_admin() to duct_rental_policy_worker;

-- A valid platform_admin is system-wide; ordinary grants retain their scopes.
create or replace function public.has_scoped_permission(requested_permission text, resource_owner uuid default null, resource_team uuid default null)
returns boolean language sql security definer set search_path = pg_catalog, public stable as $$
  select public.is_platform_admin() or exists (
    select 1 from user_role_assignments ura
    join profiles p on p.id = ura.user_id
    join local_credentials c on c.user_id = ura.user_id
    join role_permissions rp on rp.role_id = ura.role_id and rp.permission_code = requested_permission
    join data_scope_grants dsg on dsg.assignment_id = ura.id and (dsg.permission_code is null or dsg.permission_code = requested_permission)
    where ura.user_id = current_platform_user_id()
      and p.status = 'active'
      and not c.must_change_password
      and ura.valid_from <= now() and (ura.valid_until is null or ura.valid_until > now())
      and (
        dsg.scope_type = 'ALL'
        or (dsg.scope_type = 'OWN' and resource_owner = ura.user_id)
        or (dsg.scope_type = 'SELECTED_TEAMS' and resource_team = dsg.selected_team_id)
        or (dsg.scope_type = 'TEAM' and resource_team is not null and exists (
          select 1 from user_teams ut where ut.user_id = ura.user_id and ut.team_id = resource_team
        ))
      )
  );
$$;

create or replace function public.car_booking_has_access(permission text, owner_id uuid default null)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
 select permission in ('car_booking.module.use','car_booking.module.admin')
 and exists(select 1 from public.profiles p join public.local_credentials c on c.user_id=p.id
            where p.id=public.current_platform_user_id() and p.status='active' and not c.must_change_password)
 and (public.is_platform_admin() or permission <> 'car_booking.module.use' or owner_id=public.current_platform_user_id())
 and public.has_scoped_permission(permission,owner_id,null);
$$;

-- Admins can operate the experimental duct module even while its regular-user
-- entry flag is disabled; module toggling remains enforced for non-admins.
create or replace function public.duct_rental_has_entry() returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select public.is_platform_admin() or (coalesce((select enabled from public.core_module_settings where module_id='duct-rental'),false) and exists(
 select 1 from public.profiles p join public.local_credentials c on c.user_id=p.id
 join public.user_role_assignments a on a.user_id=p.id join public.role_permissions rp on rp.role_id=a.role_id and rp.permission_code='duct_rental.module.view'
 join public.data_scope_grants g on g.assignment_id=a.id and (g.permission_code is null or g.permission_code=rp.permission_code)
 where p.id=public.current_platform_user_id() and p.status='active' and not c.must_change_password
 and a.valid_from<=now() and (a.valid_until is null or a.valid_until>now())));
$$;

create or replace function public.duct_rental_has_access(permission text, resource_owner uuid, resource_team uuid default null)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select public.duct_rental_has_entry()
   and (public.is_platform_admin() or (public.has_scoped_permission('duct_rental.module.view',resource_owner,resource_team)
   and public.has_scoped_permission(permission,resource_owner,resource_team)));
$$;

comment on function public.is_platform_admin() is 'Canonical active platform_admin identity; client roles and legacy user_roles are not trusted.';
comment on function public.has_scoped_permission(text,uuid,uuid) is 'Platform admins receive all capabilities and scopes; all other users remain deny-by-default and scoped.';
