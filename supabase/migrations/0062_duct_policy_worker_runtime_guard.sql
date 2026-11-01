-- Forward-only third-round correction for the Duct policy-worker boundary.
--
-- 0061 validated the state that existed at migration time. PostgreSQL does not
-- provide a normal trigger that can reject a later GRANT ROLE, so this migration
-- also makes the SECURITY DEFINER admin predicate fail closed at runtime. A
-- session may reach the predicate only through the approved Core runtime or
-- Duct runtime role; merely being granted the worker role is insufficient.

-- Keep the SECURITY DEFINER owner an internal, non-privileged role. Include
-- CREATEROLE explicitly: it is a role-management capability, not a substitute
-- for LOGIN and must never be present on this owner.
do $$
declare
  worker_oid oid;
  worker_name text := 'duct_rental_policy_worker';
begin
  select oid into worker_oid
  from pg_catalog.pg_roles
  where rolname = worker_name;

  if worker_oid is null then
    raise exception 'Missing required Duct policy worker role: %', worker_name;
  end if;

  if exists (
    select 1
    from pg_catalog.pg_roles
    where oid = worker_oid
      and (rolcanlogin or rolinherit or rolsuper or rolcreatedb or rolcreaterole)
  ) then
    raise exception 'Unsafe Duct policy worker attributes for %', worker_name;
  end if;

  -- BYPASSRLS is intentional and required by the existing SECURITY DEFINER
  -- policy guards owned by this role. Fail closed if an operator removed it;
  -- never grant it here or silently replace it with a weaker privilege.
  if exists (
    select 1
    from pg_catalog.pg_roles
    where oid = worker_oid
      and not rolbypassrls
  ) then
    raise exception 'Duct policy worker must retain intentional BYPASSRLS';
  end if;

  -- No direct member can inherit or SET ROLE to the worker. This is stronger
  -- than checking only login members and remains useful if role attributes
  -- change later.
  if exists (
    select 1
    from pg_catalog.pg_auth_members
    where roleid = worker_oid
  ) then
    raise exception 'Duct policy worker must not have direct role members';
  end if;

  -- Model only membership edges whose SET ROLE option is enabled. INHERIT is
  -- carried for clarity but is not treated as a SET ROLE edge: the worker is
  -- NOINHERIT, and SET ROLE requires set_option on every edge in the chain.
  if exists (
    with recursive reachable(member_oid, granted_role_oid, path_settable, path_inheritable) as (
      select m.member, m.roleid, m.set_option, m.inherit_option
      from pg_catalog.pg_auth_members m
      where m.roleid = worker_oid
        and m.set_option
      union all
      select nested.member,
             nested.roleid,
             parent.path_settable and nested.set_option,
             parent.path_inheritable and nested.inherit_option
      from pg_catalog.pg_auth_members nested
      join reachable parent on parent.member_oid = nested.roleid
      where parent.path_settable
        and nested.set_option
    )
    select 1
    from reachable path
    join pg_catalog.pg_roles principal on principal.oid = path.member_oid
    where path.path_settable
      and (principal.rolcanlogin or principal.rolbypassrls)
  ) then
    raise exception 'A SET ROLE-capable login or BYPASSRLS role can reach Duct policy worker';
  end if;
end $$;

-- Preserve the legitimate architecture:
--   login -> SET ROLE permission_core_runtime -> Core predicate directly
--   login -> SET ROLE duct_rental_runtime -> Duct SECURITY DEFINER worker
-- The worker is current_user inside the nested call, while session_user remains
-- the original service login. Do not compare current_user to a runtime role:
-- SECURITY DEFINER changes it to the function owner. A rogue login granted only
-- the worker role fails this guard because it cannot SET ROLE to a trusted
-- runtime group.
create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
set search_path = pg_catalog, public
stable
as $$
  select (
    pg_has_role(session_user, 'permission_core_runtime', 'SET')
    or pg_has_role(session_user, 'duct_rental_runtime', 'SET')
  )
  and exists (
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

comment on function public.is_platform_admin() is
  'Canonical active platform_admin identity; callable only from approved Core or Duct runtime sessions.';
comment on role duct_rental_policy_worker is
  'Internal SECURITY DEFINER owner only; NOLOGIN/NOINHERIT/NOSUPERUSER/NOCREATEDB/NOCREATEROLE/BYPASSRLS and no members.';
