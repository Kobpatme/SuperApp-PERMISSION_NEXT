create function public.duct_rental_has_entry() returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select exists(select 1 from public.profiles p join public.local_credentials c on c.user_id=p.id
   join public.user_role_assignments a on a.user_id=p.id join public.role_permissions rp on rp.role_id=a.role_id and rp.permission_code='duct_rental.module.view'
   join public.data_scope_grants g on g.assignment_id=a.id and (g.permission_code is null or g.permission_code=rp.permission_code)
   where p.id=public.current_platform_user_id() and p.status='active' and not c.must_change_password
   and a.valid_from<=now() and (a.valid_until is null or a.valid_until>now()));
$$;
revoke all on function public.duct_rental_has_entry() from public;
create policy duct_activity_append on public.activity_events for insert with check(
 module_id='duct-rental' and actor_id=public.current_platform_user_id() and public.duct_rental_has_entry()
 and event_type like 'duct-rental.%.v1' and not kpi_eligible);
create policy duct_outbox_append on public.outbox_messages for insert with check(
 topic like 'duct-rental.%.v1' and aggregate_type='duct_rental'
 and payload->>'actorId'=public.current_platform_user_id()::text and public.duct_rental_has_entry());
-- Core audit policy already restricts actor_id to the transaction-bound verified user.
