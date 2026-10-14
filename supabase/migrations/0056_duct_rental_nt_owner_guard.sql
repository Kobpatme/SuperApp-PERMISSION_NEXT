-- Source canSign requires NT. Active metadata edits must not keep another owner's NT valid.
create or replace function public.duct_rental_nt_current(document uuid) returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select public.duct_rental_has_entry() and exists(
  select 1 from public.duct_rental_documents d join public.duct_rental_requests r on r.id=d.request_id
  where d.id=document and d.file_type='nt_form' and d.archived_at is null and d.design_snapshot=r.design
  and upper(btrim(coalesce(r.owner_duct,'')))='NT'
  and (public.duct_rental_request_access(r.id,'duct_rental.document.read') or exists(select 1 from public.duct_rental_sign_tasks t where t.document_id=d.id and t.assignee_id=public.current_platform_user_id() and t.status<>'revoked'))
  and not exists(select 1 from public.duct_rental_documents newer where newer.request_id=d.request_id and newer.file_type='nt_form' and newer.document_version>d.document_version and newer.archived_at is null));
$$;
revoke all on function public.duct_rental_nt_current(uuid) from public;
grant execute on function public.duct_rental_nt_current(uuid) to duct_rental_runtime;
