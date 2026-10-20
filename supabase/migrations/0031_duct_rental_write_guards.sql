-- Defense in depth against arbitrary updates by a compromised module runtime.
create function public.duct_rental_guard_request() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
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
  if old.archived_at is not null or old.cancelled_at is not null or old.phase='COMPLETE' then raise exception 'Closed request' using errcode='23514'; end if;
  if new.phase is distinct from old.phase then
    expected_phase:=case old.phase when 'DESIGN' then 'DRAFTSMAN'
      when 'DRAFTSMAN' then case when upper(trim(old.owner_duct)) not in ('','NT') then '3RD_PARTY_1' else 'PERMISSION_1' end
      when 'PERMISSION_1' then 'INSTALL' when 'INSTALL' then 'DRAFTSMAN_2' when 'DRAFTSMAN_2' then 'PERMISSION_2'
      when 'PERMISSION_2' then '3RD_PARTY_1' when '3RD_PARTY_1' then 'PERMISSION_3' when 'PERMISSION_3' then '3RD_PARTY_2' when '3RD_PARTY_2' then 'COMPLETE' end;
    if new.phase<>expected_phase or old.phase_statuses->>old.phase<>'accepted' or new.phase_statuses->>old.phase<>'done'
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
  if old.phase<>'DESIGN' and (new.design,new.project_name,new.route_name,new.owner_duct,new.service_center,new.province,new.district,new.request_type)
    is distinct from (old.design,old.project_name,old.route_name,old.owner_duct,old.service_center,old.province,old.district,old.request_type) then
    raise exception 'Design is frozen' using errcode='23514'; end if;
  if old.phase<>'INSTALL' and new.install is distinct from old.install then raise exception 'Install phase required' using errcode='23514'; end if;
  if old.phase<>'DRAFTSMAN_2' and new.as_built is distinct from old.as_built then raise exception 'As built phase required' using errcode='23514'; end if;
  if old.phase<>'3RD_PARTY_2' and new.guarantee is distinct from old.guarantee then raise exception 'Contract phase required' using errcode='23514'; end if;
  return new;
end $$;
revoke all on function public.duct_rental_guard_request() from public;
create trigger duct_rental_request_guard before insert or update on public.duct_rental_requests for each row execute function public.duct_rental_guard_request();

create function public.duct_rental_guard_task() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare doc public.duct_rental_documents;
begin
  if tg_op='UPDATE' then
    if (to_jsonb(new)-'status'-'signed_document_id'-'signed_at'-'version') is distinct from (to_jsonb(old)-'status'-'signed_document_id'-'signed_at'-'version')
      or new.version<>old.version+1 then raise exception 'Task identity is immutable' using errcode='23514'; end if;
    if new.status='signed' then
      if old.status<>'pending' or old.assignee_id<>public.current_platform_user_id() or not public.duct_rental_task_access(old.id)
        or not exists(select 1 from public.duct_rental_documents d where d.id=new.signed_document_id and d.signed_task_id=old.id and d.request_id=old.request_id and d.created_by=old.assignee_id) then
        raise exception 'Assigned signature required' using errcode='42501'; end if;
    elsif new.status='revoked' then
      if old.status='revoked' or not (public.duct_rental_request_access(old.request_id,'duct_rental.signoff.assign') or public.duct_rental_request_access(old.request_id,'duct_rental.signoff.revoke')) then
        raise exception 'Revoke denied' using errcode='42501'; end if;
      new.signed_document_id:=null; new.signed_at:=null;
      return new;
    else raise exception 'Invalid task transition' using errcode='23514'; end if;
  else
    if new.status<>'pending' or new.assigned_by<>public.current_platform_user_id() or not public.duct_rental_request_access(new.request_id,'duct_rental.signoff.assign')
      or not public.duct_rental_has_access('duct_rental.signoff.sign',new.assignee_id,null) and new.assignee_id=public.current_platform_user_id() then
      raise exception 'Assignment denied' using errcode='42501'; end if;
    -- Assignee capability is checked independently of assigning actor's bound identity.
    if not exists(select 1 from public.profiles p join public.local_credentials c on c.user_id=p.id
      join public.user_role_assignments a on a.user_id=p.id join public.role_permissions rp on rp.role_id=a.role_id and rp.permission_code='duct_rental.signoff.sign'
      join public.data_scope_grants g on g.assignment_id=a.id and (g.permission_code is null or g.permission_code=rp.permission_code)
      where p.id=new.assignee_id and p.status='active' and not c.must_change_password and a.valid_from<=now() and (a.valid_until is null or a.valid_until>now())
      and (g.scope_type in ('ALL','OWN'))) then raise exception 'Inactive or unqualified assignee' using errcode='42501'; end if;
  end if;
  select * into doc from public.duct_rental_documents where id=new.document_id for update;
  if doc.id is null or doc.request_id<>new.request_id or doc.document_version<>new.document_version or doc.archived_at is not null or doc.file_type<>'nt_form'
    or exists(select 1 from public.duct_rental_documents d where d.supersedes_id=doc.id) then raise exception 'Stale document' using errcode='23514'; end if;
  return new;
end $$;
revoke all on function public.duct_rental_guard_task() from public;
create trigger duct_rental_task_guard before insert or update on public.duct_rental_sign_tasks for each row execute function public.duct_rental_guard_task();

create function public.duct_rental_guard_document() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare task public.duct_rental_sign_tasks; previous public.duct_rental_documents;
begin
  if tg_op='UPDATE' then
    if old.archived_at is not null or new.archived_at is null or (to_jsonb(new)-'archived_at') is distinct from (to_jsonb(old)-'archived_at') then
      raise exception 'Document is immutable' using errcode='23514'; end if;
    if exists(select 1 from public.duct_rental_sign_tasks t where t.document_id=old.id and t.status='pending') then
      raise exception 'Revoke pending tasks first' using errcode='23514'; end if;
    return new;
  end if;
  if new.signed_task_id is not null then
    select * into task from public.duct_rental_sign_tasks where id=new.signed_task_id for update;
    select * into previous from public.duct_rental_documents where id=task.document_id for update;
    if task.id is null or task.status<>'pending' or task.assignee_id<>public.current_platform_user_id() or task.request_id<>new.request_id
      or previous.document_version<>task.document_version or previous.archived_at is not null
      or exists(select 1 from public.duct_rental_documents d where d.supersedes_id=previous.id) or new.file_type<>'signed_nt_form'
      or new.media_type<>'application/pdf' or new.supersedes_id is not null then raise exception 'Signing denied' using errcode='42501'; end if;
  elsif new.supersedes_id is not null then
    select * into previous from public.duct_rental_documents where id=new.supersedes_id for update;
    if previous.id is null or previous.request_id<>new.request_id or previous.file_type<>new.file_type or new.document_version<>previous.document_version+1
      or exists(select 1 from public.duct_rental_sign_tasks t where t.document_id=previous.id and t.status='pending') then
      raise exception 'Revoke before regeneration' using errcode='23514'; end if;
  end if;
  return new;
end $$;
revoke all on function public.duct_rental_guard_document() from public;
create trigger duct_rental_document_guard before insert or update on public.duct_rental_documents for each row execute function public.duct_rental_guard_document();
