-- Evaluate the existing global management shortcut once per statement.
-- Row-scoped or phase-specific users retain the canonical visibility function.
create function public.duct_rental_all_requests_visible() returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select public.duct_rental_has_access('duct_rental.module.view',null,null) and
  (public.duct_rental_has_access('duct_rental.request.archive',null,null) or public.duct_rental_has_access('duct_rental.settings.manage',null,null));
$$;
revoke all on function public.duct_rental_all_requests_visible() from public;
grant execute on function public.duct_rental_all_requests_visible() to duct_rental_runtime;
grant create on schema public to duct_rental_policy_worker;
alter function public.duct_rental_all_requests_visible() owner to duct_rental_policy_worker;
revoke create on schema public from duct_rental_policy_worker;
drop policy duct_request_read on public.duct_rental_requests;
create policy duct_request_read on public.duct_rental_requests for select using(
 case when (select public.duct_rental_all_requests_visible()) then true else public.duct_rental_request_visible(id) end);
