alter table public.duct_rental_requests add column phase_notes jsonb not null default '{}'::jsonb;
-- Defense in depth against arbitrary updates by a compromised module runtime.
create or replace function public.duct_rental_guard_request() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare expected_phase text; allowed boolean;
begin
  if tg_op='INSERT' then
    if new.owner_id is distinct from public.current_platform_user_id() or new.cancelled_at is not null or new.archived_at is not null
      or new.phase_statuses->>'DESIGN' <> 'pending' then raise exception 'Invalid draft' using errcode='42501'; end if;
    return new;
  end if;
  if (new.id,new.owner_id,new.team_id,new.source_id,new.code,new.business_date,new.created_at) is distinct from
    (old.id,old.owner_id,old.team_id,old.source_id,old.code,old.business_date,old.created_at) or new.version<>old.version+1 then
    raise exception 'Immutable identity or stale version' using errcode='23514';
  end if;
  if new.archived_at is distinct from old.archived_at then
    if not public.duct_rental_has_access('duct_rental.request.archive',old.owner_id,old.team_id)
      or new.archived_at is null or old.archived_at is not null
      or (to_jsonb(new)-'archived_at'-'version'-'updated_at') is distinct from (to_jsonb(old)-'archived_at'-'version'-'updated_at') then
      raise exception 'Archive denied' using errcode='42501'; end if;
    return new;
  end if;
  if new.cancelled_at is distinct from old.cancelled_at then
    if not public.duct_rental_has_access('duct_rental.cancellation.advance',old.owner_id,old.team_id) or old.cancelled_at is not null
      or not exists(select 1 from public.duct_rental_cancellations c where c.request_id=old.id and c.status='completed' and c.effective_date=new.cancelled_at)
      or (to_jsonb(new)-'cancelled_at'-'version'-'updated_at') is distinct from (to_jsonb(old)-'cancelled_at'-'version'-'updated_at') then
      raise exception 'Cancellation denied' using errcode='42501'; end if;
    return new;
  end if;
  if new.missing_docs='' and new.phase=old.phase and old.archived_at is null and old.cancelled_at is null and old.phase<>'COMPLETE'
    and public.duct_rental_has_access('duct_rental.document.upload',old.owner_id,old.team_id)
    and exists(select 1 from public.duct_rental_documents d where d.request_id=old.id and d.file_type='memo' and d.archived_at is null)
    and (to_jsonb(new)-'missing_docs'-'version'-'updated_at') is not distinct from (to_jsonb(old)-'missing_docs'-'version'-'updated_at') then return new; end if;
  if old.archived_at is not null or old.cancelled_at is not null or old.phase='COMPLETE' then raise exception 'Closed request' using errcode='23514'; end if;
  if new.phase is distinct from old.phase then
    expected_phase:=case old.phase when 'DESIGN' then 'DRAFTSMAN'
      when 'DRAFTSMAN' then case when upper(trim(old.owner_duct)) not in ('','NT') then '3RD_PARTY_1' else 'PERMISSION_1' end
      when 'PERMISSION_1' then 'INSTALL' when 'INSTALL' then 'DRAFTSMAN_2' when 'DRAFTSMAN_2' then 'PERMISSION_2'
      when 'PERMISSION_2' then '3RD_PARTY_1' when '3RD_PARTY_1' then 'PERMISSION_3' when 'PERMISSION_3' then '3RD_PARTY_2' when '3RD_PARTY_2' then 'COMPLETE' end;
    if new.phase<>expected_phase or (old.phase<>'DESIGN' and old.phase_statuses->>old.phase<>'accepted') or new.phase_statuses->>old.phase<>'done'
      or new.phase_statuses->>new.phase<>'pending'
      or (new.phase_statuses-old.phase-new.phase) is distinct from (old.phase_statuses-old.phase-new.phase)
      or not public.duct_rental_has_access(public.duct_rental_phase_permission(old.phase,'submit'),old.owner_id,old.team_id) then
      raise exception 'Invalid phase transition' using errcode='42501'; end if;
  elsif new.phase_statuses is distinct from old.phase_statuses then
    if old.phase_statuses->>old.phase<>'pending' or new.phase_statuses->>old.phase<>'accepted'
      or new.phase_statuses-old.phase is distinct from old.phase_statuses-old.phase
      or not public.duct_rental_has_access(public.duct_rental_phase_permission(old.phase,'accept'),old.owner_id,old.team_id)
      or (to_jsonb(new)-'phase_statuses'-'version'-'updated_at') is distinct from (to_jsonb(old)-'phase_statuses'-'version'-'updated_at') then
      raise exception 'Accept denied' using errcode='42501'; end if;
  else
    allowed:=public.duct_rental_has_access(public.duct_rental_phase_permission(old.phase,'submit'),old.owner_id,old.team_id)
      or (old.phase='DESIGN' and public.duct_rental_has_access('duct_rental.request.update',old.owner_id,old.team_id));
    if not allowed then raise exception 'Edit denied' using errcode='42501'; end if;
  end if;
  if old.phase<>'DESIGN' and not (old.phase='PERMISSION_1' and new.design-'permissionRequestNumber' is not distinct from old.design-'permissionRequestNumber' and (new.project_name,new.route_name,new.owner_duct,new.service_center,new.province,new.district,new.request_type) is not distinct from (old.project_name,old.route_name,old.owner_duct,old.service_center,old.province,old.district,old.request_type)) and (new.design,new.project_name,new.route_name,new.owner_duct,new.service_center,new.province,new.district,new.request_type)
    is distinct from (old.design,old.project_name,old.route_name,old.owner_duct,old.service_center,old.province,old.district,old.request_type) then
    raise exception 'Design is frozen' using errcode='23514'; end if;
  if old.phase<>'INSTALL' and new.install is distinct from old.install then raise exception 'Install phase required' using errcode='23514'; end if;
  if old.phase<>'DRAFTSMAN_2' and new.as_built is distinct from old.as_built then raise exception 'As built phase required' using errcode='23514'; end if;
  if old.phase<>'3RD_PARTY_2' and new.guarantee is distinct from old.guarantee then raise exception 'Contract phase required' using errcode='23514'; end if;
  if new.phase_notes-old.phase is distinct from old.phase_notes-old.phase then raise exception 'Only current phase notes may change' using errcode='23514'; end if;
  return new;
end $$;

