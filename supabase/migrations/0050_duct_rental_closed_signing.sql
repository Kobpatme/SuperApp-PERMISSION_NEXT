create function public.duct_rental_task_actionable(task uuid) returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select public.duct_rental_has_entry() and public.duct_rental_task_access(task) and exists(
  select 1 from public.duct_rental_sign_tasks t join public.duct_rental_requests r on r.id=t.request_id
  where t.id=task and r.phase='PERMISSION_1' and r.archived_at is null and r.cancelled_at is null);
$$;
revoke all on function public.duct_rental_task_actionable(uuid) from public;
grant execute on function public.duct_rental_task_actionable(uuid) to duct_rental_runtime;
create function public.duct_rental_guard_signing_open() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if tg_op='INSERT' or new.status is distinct from old.status then
  if not exists(select 1 from public.duct_rental_requests r where r.id=new.request_id and r.phase='PERMISSION_1' and r.archived_at is null and r.cancelled_at is null) then raise exception 'Signing workflow closed' using errcode='23514'; end if;
 end if;
 return new;
end $$;
revoke all on function public.duct_rental_guard_signing_open() from public;
create trigger duct_signing_open_guard before insert or update on public.duct_rental_sign_tasks for each row execute function public.duct_rental_guard_signing_open();
grant create on schema public to duct_rental_policy_worker;
alter function public.duct_rental_task_actionable(uuid) owner to duct_rental_policy_worker;
alter function public.duct_rental_guard_signing_open() owner to duct_rental_policy_worker;
revoke create on schema public from duct_rental_policy_worker;
