-- Owner-requested local UAT workflow. Separate records; no user grants or fees.
create table public.communication_cable_requests (
 id uuid primary key default gen_random_uuid(), code text not null unique,
 owner_id uuid not null references public.profiles(id),
 stage text not null default 'DESIGN' check(stage in ('DESIGN','REVIEW','SUBMITTED','PERMIT','CONFIRM','INSTALL','COMPLETE','REVISION')),
 data jsonb not null check(jsonb_typeof(data)='object' and data->>'authority' in ('PEA','MEA') and length(data->>'projectName') between 1 and 200),
 history jsonb not null default '[]' check(jsonb_typeof(history)='array'),
 version integer not null default 1 check(version>0), archived_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index communication_cable_owner_idx on public.communication_cable_requests(owner_id,updated_at desc);
alter table public.communication_cable_requests enable row level security;
alter table public.communication_cable_requests force row level security;
grant select,insert,update on public.communication_cable_requests to duct_rental_runtime;
create policy cable_read on public.communication_cable_requests for select to duct_rental_runtime using(public.duct_rental_has_access('duct_rental.module.view',owner_id,null));
create policy cable_create on public.communication_cable_requests for insert to duct_rental_runtime with check(owner_id=public.current_platform_user_id() and public.duct_rental_has_access('duct_rental.request.create',owner_id,null));
create policy cable_update on public.communication_cable_requests for update to duct_rental_runtime using(public.duct_rental_has_access('duct_rental.module.view',owner_id,null)) with check(public.duct_rental_has_access('duct_rental.module.view',owner_id,null));
create function public.guard_communication_cable() returns trigger language plpgsql set search_path=public as $$
declare permission text;
begin
 if TG_OP='INSERT' then
  if new.stage<>'DESIGN' or new.version<>1 or new.history<>'[]'::jsonb or new.archived_at is not null then raise exception 'Invalid initial cable state' using errcode='23514'; end if;
  return new;
 end if;
 if old.archived_at is not null or new.owner_id<>old.owner_id or new.code<>old.code or new.id<>old.id or new.created_at<>old.created_at or new.version<>old.version+1 then raise exception 'Invalid cable update' using errcode='23514'; end if;
 if new.archived_at is not null then
  permission:='duct_rental.request.archive';
  if new.stage<>old.stage or new.data<>old.data then raise exception 'Archive cannot edit cable data' using errcode='23514'; end if;
 else
  if old.stage='COMPLETE' then raise exception 'Cable is closed' using errcode='23514'; end if;
  permission:=case when new.stage=old.stage then 'duct_rental.request.update' when old.stage in ('DESIGN','REVISION','CONFIRM') then 'duct_rental.design.submit' when old.stage='INSTALL' then 'duct_rental.install.submit' else 'duct_rental.permission1.submit' end;
  if new.stage<>old.stage and not ((old.stage,new.stage) in (('DESIGN','REVIEW'),('REVIEW','SUBMITTED'),('SUBMITTED','PERMIT'),('SUBMITTED','REVISION'),('REVISION','REVIEW'),('PERMIT','CONFIRM'),('CONFIRM','INSTALL'),('INSTALL','COMPLETE'))) then raise exception 'Invalid cable transition' using errcode='23514'; end if;
 end if;
 if not public.duct_rental_has_access(permission,old.owner_id,null) then raise exception 'Cable permission denied' using errcode='42501'; end if;
 if jsonb_array_length(new.history)<>jsonb_array_length(old.history)+1 or not new.history @> old.history then raise exception 'Cable history must append' using errcode='23514'; end if;
 return new;
end $$;
create trigger guard_communication_cable before insert or update on public.communication_cable_requests for each row execute function public.guard_communication_cable();
