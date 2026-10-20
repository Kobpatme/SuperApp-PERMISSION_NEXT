create table public.holidays (
 id uuid primary key default gen_random_uuid(), holiday_date date not null, name text not null check (length(btrim(name)) between 1 and 180),
 source text not null check (source in ('company','thai')), is_active boolean not null default true, version integer not null default 1 check (version > 0),
 created_by uuid not null references public.profiles(id), updated_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(holiday_date, source)
);
create index holidays_year_idx on public.holidays(holiday_date);
alter table public.holidays enable row level security;
create policy holidays_read on public.holidays for select using (public.has_scoped_permission('work.task.read', public.current_platform_user_id(), null) or public.has_scoped_permission('core.holiday.manage', null, null));
create policy holidays_manage on public.holidays for all using (public.has_scoped_permission('core.holiday.manage', null, null)) with check (public.has_scoped_permission('core.holiday.manage', null, null));
insert into public.permissions(code,module_id,resource,action,description) values ('core.holiday.manage','core','holiday','manage','จัดการวันหยุด') on conflict do nothing;
insert into public.role_permissions(role_id,permission_code) select id,'core.holiday.manage' from public.roles where code='platform_admin' on conflict do nothing;
