create function public.duct_rental_guard_process() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare step text; permission text; total numeric(14,2);
begin
  if tg_op='INSERT' then return new; end if;
  if new.version<>old.version+1 or (new.id,new.source_id,new.owner_id,new.team_id,new.created_at) is distinct from (old.id,old.source_id,old.owner_id,old.team_id,old.created_at) then
    raise exception 'Immutable process or stale version' using errcode='23514'; end if;
  if new.archived_at is distinct from old.archived_at then
    permission:=case tg_table_name when 'duct_rental_renewals' then 'duct_rental.renewal.archive' else 'duct_rental.cancellation.archive' end;
    if old.archived_at is not null or new.archived_at is null or not public.duct_rental_has_access(permission,old.owner_id,old.team_id)
      or (to_jsonb(new)-'archived_at'-'version'-'updated_at') is distinct from (to_jsonb(old)-'archived_at'-'version'-'updated_at') then raise exception 'Archive denied' using errcode='42501'; end if;
    return new;
  end if;
  if old.archived_at is not null then raise exception 'Archived process' using errcode='23514'; end if;
  if tg_table_name='duct_rental_renewals' then
    if new.year<>old.year then raise exception 'Immutable year' using errcode='23514'; end if;
    select coalesce(sum(yearly_fee) filter(where review_status='keep'),0) into total from public.duct_rental_renewal_routes where renewal_id=old.id;
    if new.total_yearly_cost<>total then raise exception 'Incorrect renewal total' using errcode='23514'; end if;
    if new.status<>old.status then
      step:=case old.status when 'draft' then 'sent_to_3rdparty' when 'sent_to_3rdparty' then 'memo_preparing' when 'memo_preparing' then 'provider_confirmed' when 'provider_confirmed' then 'contracted' end;
      permission:=case old.status when 'draft' then 'duct_rental.renewal.review' when 'sent_to_3rdparty' then 'duct_rental.renewal.memo' when 'memo_preparing' then 'duct_rental.renewal.confirm' else 'duct_rental.renewal.contract' end;
      if step is null or new.status<>step or not public.duct_rental_has_access(permission,old.owner_id,old.team_id)
        or (old.status='draft' and exists(select 1 from public.duct_rental_renewal_routes where renewal_id=old.id and review_status='pending')) then raise exception 'Renewal transition denied' using errcode='42501'; end if;
      if new.status='contracted' and not exists(select 1 from public.duct_rental_documents d join public.duct_rental_renewal_routes r on r.request_id=d.request_id where r.renewal_id=old.id and d.id=new.contract_document_id and d.file_type='renewal_contract' and d.archived_at is null) then raise exception 'Annual contract required' using errcode='23514'; end if;
    elsif old.status<>'draft' or not public.duct_rental_has_access('duct_rental.renewal.review',old.owner_id,old.team_id) then raise exception 'Renewal edit denied' using errcode='42501'; end if;
  else
    if (new.request_id,new.snapshot,new.effective_date,new.reason,new.monthly_fee,new.yearly_fee) is distinct from (old.request_id,old.snapshot,old.effective_date,old.reason,old.monthly_fee,old.yearly_fee) then raise exception 'Immutable cancellation snapshot' using errcode='23514'; end if;
    if old.status in ('completed','rejected') then raise exception 'Closed cancellation' using errcode='23514'; end if;
    if new.status='rejected' then permission:='duct_rental.cancellation.reject';
    else
      permission:='duct_rental.cancellation.advance'; step:=case old.status when 'cancel_initiated' then 'in_progress' when 'in_progress' then 'tracking' when 'tracking' then 'completed' end;
      if new.status is distinct from step then raise exception 'Cancellation transition denied' using errcode='23514'; end if;
    end if;
    if not public.duct_rental_has_access(permission,old.owner_id,old.team_id) then raise exception 'Cancellation denied' using errcode='42501'; end if;
    if new.status='completed' and new.completed_by<>public.current_platform_user_id() then raise exception 'Verified actor required' using errcode='42501'; end if;
  end if;
  return new;
end $$;
revoke all on function public.duct_rental_guard_process() from public;
create trigger duct_rental_renewal_guard before insert or update on public.duct_rental_renewals for each row execute function public.duct_rental_guard_process();
create trigger duct_rental_cancellation_guard before insert or update on public.duct_rental_cancellations for each row execute function public.duct_rental_guard_process();

create function public.duct_rental_guard_rate() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare request public.duct_rental_requests;
begin
 select * into request from public.duct_rental_requests where id=new.request_id;
 if request.archived_at is not null or request.cancelled_at is not null or request.phase not in ('3RD_PARTY_1','3RD_PARTY_2') then raise exception 'Rate phase required' using errcode='23514'; end if;
 if tg_op='UPDATE' then
   if new.request_id<>old.request_id then raise exception 'Immutable rate owner' using errcode='23514'; end if;
   if request.phase='3RD_PARTY_2' and (new.monthly_fee,new.yearly_fee,new.contract_start,new.contract_end) is distinct from (old.monthly_fee,old.yearly_fee,old.contract_start,old.contract_end) then raise exception 'Rate notice is frozen' using errcode='23514'; end if;
 end if;
 if request.phase='3RD_PARTY_1' and new.guarantee_amount is not null then raise exception 'Contract phase required' using errcode='23514'; end if;
 return new;
end $$;
revoke all on function public.duct_rental_guard_rate() from public;
create trigger duct_rental_rate_guard before insert or update on public.duct_rental_rates for each row execute function public.duct_rental_guard_rate();

create function public.duct_rental_guard_route() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare parent public.duct_rental_renewals; route public.duct_rental_requests;
begin
 select * into parent from public.duct_rental_renewals where id=new.renewal_id;
 if parent.status<>'draft' or parent.archived_at is not null then raise exception 'Renewal review is frozen' using errcode='23514'; end if;
 if tg_op='UPDATE' then
   if (to_jsonb(new)-'review_status'-'review_notes'-'reviewed_by'-'reviewed_at') is distinct from (to_jsonb(old)-'review_status'-'review_notes'-'reviewed_by'-'reviewed_at')
     or new.reviewed_by<>public.current_platform_user_id() then raise exception 'Immutable renewal snapshot' using errcode='23514'; end if;
 else
   select * into route from public.duct_rental_requests where id=new.request_id;
   if route.phase<>'COMPLETE' or route.cancelled_at is not null or route.archived_at is not null or new.review_status<>'pending' then raise exception 'Active route required' using errcode='23514'; end if;
 end if;
 return new;
end $$;
revoke all on function public.duct_rental_guard_route() from public;
create trigger duct_rental_route_guard before insert or update on public.duct_rental_renewal_routes for each row execute function public.duct_rental_guard_route();

create function public.duct_rental_request_signed(request uuid) returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select public.duct_rental_request_access(request,'duct_rental.document.read') and exists(
   select 1 from public.duct_rental_sign_tasks t join public.duct_rental_documents d on d.id=t.document_id
   where t.request_id=request and t.status='signed' and d.archived_at is null and d.document_version=t.document_version
   and not exists(select 1 from public.duct_rental_documents n where n.supersedes_id=d.id));
$$;
revoke all on function public.duct_rental_request_signed(uuid) from public;
grant execute on function public.duct_rental_request_signed(uuid) to duct_rental_runtime;
grant create on schema public to duct_rental_policy_worker;
alter function public.duct_rental_guard_process() owner to duct_rental_policy_worker;
alter function public.duct_rental_guard_rate() owner to duct_rental_policy_worker;
alter function public.duct_rental_guard_route() owner to duct_rental_policy_worker;
alter function public.duct_rental_request_signed(uuid) owner to duct_rental_policy_worker;
revoke create on schema public from duct_rental_policy_worker;
