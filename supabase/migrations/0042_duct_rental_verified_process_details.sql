create or replace function public.duct_rental_document_visible(request uuid, document_phase text, kind text) returns boolean language plpgsql stable security definer set search_path=pg_catalog,public as $$
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
   or (draftsman and kind not in ('invoice','memo')) or (install and document_phase in ('DRAFTSMAN','PERMISSION_1','INSTALL') and kind in ('drawing','permission_letter','confirmation_form'));
end $$;

create function public.duct_rental_guard_process_details() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid := public.current_platform_user_id();
begin
 if tg_table_name='duct_rental_renewals' then
  if tg_op='INSERT' then
   if new.reviewed_by is not null or new.approved_by is not null or new.contracted_by is not null
    or new.reviewed_at is not null or new.approved_at is not null or new.contracted_at is not null
    or new.contract_number is not null or new.third_party_notes is not null then raise exception 'Invalid renewal metadata' using errcode='23514'; end if;
  else
   if (new.contract_number,new.third_party_notes,new.contract_document_id) is distinct from (old.contract_number,old.third_party_notes,old.contract_document_id)
    and not (old.status='provider_confirmed' and new.status='contracted') then raise exception 'Contract phase required' using errcode='23514'; end if;
   if (new.reviewed_by,new.reviewed_at) is distinct from (old.reviewed_by,old.reviewed_at)
    and not (old.status='draft' and new.status='sent_to_3rdparty' and new.reviewed_by=actor and new.reviewed_at is not null) then raise exception 'Verified reviewer required' using errcode='42501'; end if;
   if (new.approved_by,new.approved_at) is distinct from (old.approved_by,old.approved_at)
    and not (new.status='provider_confirmed' and old.status='memo_preparing' and new.approved_by=actor and new.approved_at is not null) then raise exception 'Verified confirmer required' using errcode='42501'; end if;
   if (new.contracted_by,new.contracted_at) is distinct from (old.contracted_by,old.contracted_at)
    and not (new.status='contracted' and old.status='provider_confirmed' and new.contracted_by=actor and new.contracted_at is not null) then raise exception 'Verified contractor required' using errcode='42501'; end if;
  end if;
 else
  if tg_op='INSERT' then
   if new.rejected_by is not null or new.rejected_at is not null then raise exception 'Invalid cancellation metadata' using errcode='23514'; end if;
  else
   if (new.contract_start,new.contract_end) is distinct from (old.contract_start,old.contract_end) then raise exception 'Immutable contract snapshot' using errcode='23514'; end if;
   if (new.rejected_by,new.rejected_at) is distinct from (old.rejected_by,old.rejected_at)
    and not (new.status='rejected' and old.status not in ('completed','rejected') and new.rejected_by=actor and new.rejected_at is not null) then raise exception 'Verified rejector required' using errcode='42501'; end if;
  end if;
 end if;
 return new;
end $$;
revoke all on function public.duct_rental_guard_process_details() from public;
grant create on schema public to duct_rental_policy_worker;
alter function public.duct_rental_guard_process_details() owner to duct_rental_policy_worker;
revoke create on schema public from duct_rental_policy_worker;
create trigger duct_rental_renewal_details_guard before insert or update on public.duct_rental_renewals for each row execute function public.duct_rental_guard_process_details();
create trigger duct_rental_cancel_details_guard before insert or update on public.duct_rental_cancellations for each row execute function public.duct_rental_guard_process_details();
