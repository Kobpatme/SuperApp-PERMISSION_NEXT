-- A query-routing hint only: every returned task still passes its existing RLS policy.
create function public.duct_rental_may_manage_sign_tasks() returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select public.duct_rental_has_entry() and exists(
  select 1 from public.user_role_assignments a join public.role_permissions p on p.role_id=a.role_id
  join public.data_scope_grants g on g.assignment_id=a.id and (g.permission_code is null or g.permission_code=p.permission_code)
  where a.user_id=public.current_platform_user_id() and a.valid_from<=now() and (a.valid_until is null or a.valid_until>now())
  and p.permission_code in ('duct_rental.signoff.assign','duct_rental.signoff.revoke'));
$$;
revoke all on function public.duct_rental_may_manage_sign_tasks() from public;
grant execute on function public.duct_rental_may_manage_sign_tasks() to duct_rental_runtime;
grant create on schema public to duct_rental_policy_worker;
alter function public.duct_rental_may_manage_sign_tasks() owner to duct_rental_policy_worker;
revoke create on schema public from duct_rental_policy_worker;
create index duct_rental_sign_assignee_idx on public.duct_rental_sign_tasks(assignee_id,created_at desc,id);
