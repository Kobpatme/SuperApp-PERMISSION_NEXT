-- Source [id]/edit allows active-request metadata edits; 20260707 RLS protects management.
-- Closed histories stay immutable per Core. Owners/default Design team retain working edits.
create function public.duct_rental_can_edit_design(request uuid) returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select exists(select 1 from public.duct_rental_requests r where r.id=request and r.phase<>'COMPLETE' and r.archived_at is null and r.cancelled_at is null
  and public.duct_rental_has_access('duct_rental.request.update',r.owner_id,r.team_id)
  and (r.owner_id=public.current_platform_user_id() or public.duct_rental_has_access('duct_rental.request.archive',r.owner_id,r.team_id)
   or (r.phase='DESIGN' and public.duct_rental_has_access('duct_rental.design.submit',r.owner_id,r.team_id))));
$$;
revoke all on function public.duct_rental_can_edit_design(uuid) from public;
grant execute on function public.duct_rental_can_edit_design(uuid) to duct_rental_runtime;
do $guard$
declare original text; changed text;
begin
 original:=pg_get_functiondef('public.duct_rental_guard_request()'::regprocedure);
 changed:=replace(original,'  if new.phase is distinct from old.phase then',
 '  if public.duct_rental_can_edit_design(old.id)
    and (to_jsonb(new)-''design''-''project_name''-''route_name''-''owner_duct''-''service_center''-''province''-''district''-''request_type''-''version''-''updated_at'')
      is not distinct from (to_jsonb(old)-''design''-''project_name''-''route_name''-''owner_duct''-''service_center''-''province''-''district''-''request_type''-''version''-''updated_at'') then return new; end if;
  if new.phase is distinct from old.phase then');
 if changed=original then raise exception 'Expected request guard missing'; end if;
 execute changed;
end $guard$;
grant create on schema public to duct_rental_policy_worker;
alter function public.duct_rental_can_edit_design(uuid) owner to duct_rental_policy_worker;
revoke create on schema public from duct_rental_policy_worker;
