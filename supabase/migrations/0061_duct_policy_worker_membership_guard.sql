-- Forward-only security correction for the Duct SECURITY DEFINER owner role.
--
-- The policy worker must remain an internal owner so its SECURITY DEFINER
-- functions can call public.is_platform_admin(). It must not be assumable by
-- a login (directly or through nested role membership). PostgreSQL has no
-- ordinary trigger that can reject a future GRANT ROLE, so deployments must
-- preserve this invariant and this migration fails closed if it is violated.

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

  -- Keep the owner role non-login and non-privileged. BYPASSRLS is retained
  -- because this role owns the existing Duct policy SECURITY DEFINER guards.
  if exists (
    select 1
    from pg_catalog.pg_roles
    where oid = worker_oid
      and (rolcanlogin or rolsuper or rolcreatedb)
  ) then
    raise exception 'Unsafe Duct policy worker attributes for %', worker_name;
  end if;

  -- A direct member can SET ROLE to the worker even when the worker is
  -- NOLOGIN. Reject every direct membership, not only currently visible
  -- login roles, so a later attribute change cannot turn it into a path.
  if exists (
    select 1
    from pg_catalog.pg_auth_members
    where roleid = worker_oid
  ) then
    raise exception 'Duct policy worker must not have direct role members';
  end if;

  -- Also inspect the complete membership graph. This catches a login or
  -- BYPASSRLS role that could reach the worker through nested role grants.
  if exists (
    with recursive reachable(member_oid, granted_role_oid) as (
      select m.member, m.roleid
      from pg_catalog.pg_auth_members m
      where m.roleid = worker_oid
      union
      select nested.member, nested.roleid
      from pg_catalog.pg_auth_members nested
      join reachable parent on parent.member_oid = nested.roleid
    )
    select 1
    from reachable path
    join pg_catalog.pg_roles principal on principal.oid = path.member_oid
    where principal.rolcanlogin or principal.rolbypassrls
  ) then
    raise exception 'A login-eligible or BYPASSRLS role can reach Duct policy worker';
  end if;
end $$;

comment on role duct_rental_policy_worker is
  'Internal SECURITY DEFINER owner only; must have no direct or nested role members.';
