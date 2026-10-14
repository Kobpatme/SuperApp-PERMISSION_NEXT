alter table public.duct_rental_documents add column design_snapshot jsonb;

create function public.duct_rental_nt_current(document uuid) returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select public.duct_rental_has_entry() and exists(
  select 1 from public.duct_rental_documents d join public.duct_rental_requests r on r.id=d.request_id
  where d.id=document and d.file_type='nt_form' and d.archived_at is null and d.design_snapshot=r.design
  and (public.duct_rental_request_access(r.id,'duct_rental.document.read') or exists(select 1 from public.duct_rental_sign_tasks t where t.document_id=d.id and t.assignee_id=public.current_platform_user_id() and t.status<>'revoked'))
  and not exists(select 1 from public.duct_rental_documents newer where newer.request_id=d.request_id and newer.file_type='nt_form' and newer.document_version>d.document_version and newer.archived_at is null));
$$;
revoke all on function public.duct_rental_nt_current(uuid) from public;
grant execute on function public.duct_rental_nt_current(uuid) to duct_rental_runtime;

create function public.duct_rental_guard_nt_design() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare current_design jsonb; original uuid;
begin
 if tg_table_name='duct_rental_documents' then
  if tg_op='UPDATE' then
   if new.design_snapshot is distinct from old.design_snapshot then raise exception 'Immutable document design snapshot' using errcode='23514'; end if;
  elsif new.file_type in ('nt_form','signed_nt_form') then
   select design into current_design from public.duct_rental_requests where id=new.request_id;
   if new.design_snapshot is null or new.design_snapshot is distinct from current_design then raise exception 'NT design version mismatch' using errcode='23514'; end if;
   if new.file_type='signed_nt_form' then
    select document_id into original from public.duct_rental_sign_tasks where id=new.signed_task_id;
    if not public.duct_rental_nt_current(original) then raise exception 'Stale NT original' using errcode='23514'; end if;
   end if;
  end if;
 elsif tg_op='INSERT' or new.status='signed' and old.status<>'signed' then
  if not public.duct_rental_nt_current(new.document_id) then raise exception 'Stale NT signing task' using errcode='23514'; end if;
 end if;
 return new;
end $$;
revoke all on function public.duct_rental_guard_nt_design() from public;
create trigger duct_nt_design_document_guard before insert or update on public.duct_rental_documents for each row execute function public.duct_rental_guard_nt_design();
create trigger duct_nt_design_task_guard before insert or update on public.duct_rental_sign_tasks for each row execute function public.duct_rental_guard_nt_design();

create or replace function public.duct_rental_request_signed(request uuid) returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select public.duct_rental_request_access(request,'duct_rental.document.read') and exists(
  select 1 from public.duct_rental_sign_tasks t where t.request_id=request and t.status='signed' and public.duct_rental_nt_current(t.document_id));
$$;
grant create on schema public to duct_rental_policy_worker;
alter function public.duct_rental_nt_current(uuid) owner to duct_rental_policy_worker;
alter function public.duct_rental_guard_nt_design() owner to duct_rental_policy_worker;
revoke create on schema public from duct_rental_policy_worker;
