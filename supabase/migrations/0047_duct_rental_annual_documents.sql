-- Annual contracts belong to a year, including a valid year with zero routes.
alter table public.duct_rental_documents alter column request_id drop not null;
alter table public.duct_rental_documents add column renewal_id uuid references public.duct_rental_renewals(id);
alter table public.duct_rental_documents add constraint duct_document_one_parent check((request_id is not null)::integer+(renewal_id is not null)::integer=1);
create index duct_document_annual_idx on public.duct_rental_documents(renewal_id,created_at) where renewal_id is not null;
create function public.duct_rental_annual_access(batch uuid,permission text) returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select exists(select 1 from public.duct_rental_renewals r where r.id=batch
 and public.duct_rental_has_access('duct_rental.module.view',r.owner_id,r.team_id)
 and public.duct_rental_has_access('duct_rental.rate.read',r.owner_id,r.team_id)
 and public.duct_rental_has_access(permission,r.owner_id,r.team_id));
$$;
revoke all on function public.duct_rental_annual_access(uuid,text) from public;
grant execute on function public.duct_rental_annual_access(uuid,text) to duct_rental_runtime;
create policy duct_annual_document_read on public.duct_rental_documents for select using(renewal_id is not null and public.duct_rental_annual_access(renewal_id,'duct_rental.document.read'));
create policy duct_annual_document_create on public.duct_rental_documents for insert with check(request_id is null and renewal_id is not null and file_type='renewal_contract' and created_by=public.current_platform_user_id()
 and public.duct_rental_annual_access(renewal_id,'duct_rental.document.upload') and public.duct_rental_annual_access(renewal_id,'duct_rental.renewal.contract'));
-- Preserve every existing guard; extend only the annual-document branch.
do $migration$
declare original text; changed text; needle text;
begin
 -- Windows checkouts preserve CRLF inside function bodies; match the same guard on both platforms.
 original:=replace(pg_get_functiondef('public.duct_rental_guard_document()'::regprocedure),E'\r\n',E'\n');
 needle:=E'begin\n';
 changed:=replace(original,needle,E'begin\n  if new.renewal_id is not null then\n    if tg_op<>''INSERT'' or new.request_id is not null or new.file_type<>''renewal_contract'' or new.media_type<>''application/pdf'' or new.signed_task_id is not null or new.supersedes_id is not null or new.created_by<>public.current_platform_user_id()\n      or not public.duct_rental_annual_access(new.renewal_id,''duct_rental.renewal.contract'') or not exists(select 1 from public.duct_rental_renewals r where r.id=new.renewal_id and r.status=''provider_confirmed'' and r.archived_at is null) then raise exception ''Annual document denied'' using errcode=''42501''; end if;\n    return new;\n  end if;\n');
 if changed=original then raise exception 'Expected document guard missing'; end if;
 execute changed;
 original:=pg_get_functiondef('public.duct_rental_guard_process()'::regprocedure);
 needle:='not exists(select 1 from public.duct_rental_documents d join public.duct_rental_renewal_routes r on r.request_id=d.request_id where r.renewal_id=old.id and d.id=new.contract_document_id and d.file_type=''renewal_contract'' and d.archived_at is null)';
 changed:=replace(original,needle,'not exists(select 1 from public.duct_rental_documents d where d.id=new.contract_document_id and d.file_type=''renewal_contract'' and d.archived_at is null and (d.renewal_id=old.id or exists(select 1 from public.duct_rental_renewal_routes r where r.renewal_id=old.id and r.request_id=d.request_id)))');
 if changed=original then raise exception 'Expected annual contract guard missing'; end if;
 execute changed;
end $migration$;
grant create on schema public to duct_rental_policy_worker;
alter function public.duct_rental_annual_access(uuid,text) owner to duct_rental_policy_worker;
revoke create on schema public from duct_rental_policy_worker;
