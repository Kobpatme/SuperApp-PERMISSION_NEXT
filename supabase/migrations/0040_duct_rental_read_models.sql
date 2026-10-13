grant select on public.permissions to duct_rental_policy_worker;
create function public.duct_rental_memo_present(request uuid) returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select public.duct_rental_request_access(request,'duct_rental.module.view') and exists(select 1 from public.duct_rental_documents d where d.request_id=request and d.archived_at is null and (d.file_type='memo' or lower(d.name) like '%memo%'));
$$;
create function public.duct_rental_document_visible(request uuid, document_phase text, kind text) returns boolean language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare r public.duct_rental_requests; design boolean; draftsman boolean; install boolean; other boolean;
begin
 select * into r from public.duct_rental_requests where id=request;
 if r.id is null or not public.duct_rental_has_access('duct_rental.document.read',r.owner_id,r.team_id) then return false; end if;
 if public.duct_rental_has_access('duct_rental.request.archive',r.owner_id,r.team_id) or public.duct_rental_has_access('duct_rental.settings.manage',r.owner_id,r.team_id) then return true; end if;
 design:=public.duct_rental_has_access('duct_rental.design.accept',r.owner_id,r.team_id) or public.duct_rental_has_access('duct_rental.design.submit',r.owner_id,r.team_id);
 draftsman:=public.duct_rental_has_access('duct_rental.draftsman.accept',r.owner_id,r.team_id) or public.duct_rental_has_access('duct_rental.draftsman.submit',r.owner_id,r.team_id) or public.duct_rental_has_access('duct_rental.draftsman2.accept',r.owner_id,r.team_id) or public.duct_rental_has_access('duct_rental.draftsman2.submit',r.owner_id,r.team_id);
 install:=public.duct_rental_has_access('duct_rental.install.accept',r.owner_id,r.team_id) or public.duct_rental_has_access('duct_rental.install.submit',r.owner_id,r.team_id);
 other:=exists(select 1 from public.permissions p where p.module_id='duct-rental' and p.resource in ('permission1','permission2','permission3','thirdparty1','thirdparty2') and public.duct_rental_has_access(p.code,r.owner_id,r.team_id));
 return other or (not design and not draftsman and not install) or (design and kind<>'invoice')
   or (draftsman and kind not in ('invoice','memo')) or (install and document_phase in ('DRAFTSMAN','PERMISSION_1','INSTALL') and kind in ('drawing','permission_letter','confirmation_form','other'));
end $$;
revoke all on function public.duct_rental_memo_present(uuid),public.duct_rental_document_visible(uuid,text,text) from public;
grant execute on function public.duct_rental_memo_present(uuid),public.duct_rental_document_visible(uuid,text,text) to duct_rental_runtime;
drop policy duct_document_read on public.duct_rental_documents;
create policy duct_document_read on public.duct_rental_documents for select using(public.duct_rental_document_visible(request_id,phase,file_type)
 or exists(select 1 from public.duct_rental_sign_tasks t where t.status<>'revoked' and (t.document_id=duct_rental_documents.id or t.signed_document_id=duct_rental_documents.id)));
create function public.duct_rental_request_capabilities(request uuid) returns text[] language sql stable security definer set search_path=pg_catalog,public as $$
 select coalesce(array_agg(p.code order by p.code),'{}'::text[]) from public.permissions p
 where p.module_id='duct-rental' and public.duct_rental_request_access(request,p.code);
$$;
revoke all on function public.duct_rental_request_capabilities(uuid) from public;
grant execute on function public.duct_rental_request_capabilities(uuid) to duct_rental_runtime;
create function public.duct_rental_signers(request uuid) returns table(id uuid,display_name text) language sql stable security definer set search_path=pg_catalog,public as $$
 select p.id,coalesce(p.display_name,'ผู้ลงนาม') from public.profiles p join public.local_credentials c on c.user_id=p.id
 where public.duct_rental_request_access(request,'duct_rental.signoff.assign') and p.status='active' and not c.must_change_password and exists(
 select 1 from public.user_role_assignments a join public.role_permissions rp on rp.role_id=a.role_id and rp.permission_code='duct_rental.signoff.sign'
 join public.data_scope_grants g on g.assignment_id=a.id and (g.permission_code is null or g.permission_code=rp.permission_code)
 where a.user_id=p.id and a.valid_from<=now() and (a.valid_until is null or a.valid_until>now()) and g.scope_type in ('OWN','ALL')) order by display_name,p.id;
$$;
revoke all on function public.duct_rental_signers(uuid) from public;
grant execute on function public.duct_rental_signers(uuid) to duct_rental_runtime;
grant create on schema public to duct_rental_policy_worker;
alter function public.duct_rental_memo_present(uuid) owner to duct_rental_policy_worker;
alter function public.duct_rental_document_visible(uuid,text,text) owner to duct_rental_policy_worker;
alter function public.duct_rental_request_capabilities(uuid) owner to duct_rental_policy_worker;
alter function public.duct_rental_signers(uuid) owner to duct_rental_policy_worker;
revoke create on schema public from duct_rental_policy_worker;
