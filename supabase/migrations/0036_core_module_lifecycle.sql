-- Owner explicitly authorized Core toggle addition; preserves existing design and defaults.
insert into public.permissions(code,module_id,resource,action,description) values('core.module.manage','core','module','manage','เปิดหรือปิดโมดูล') on conflict(code) do nothing;
create table public.core_module_settings(module_id text primary key check(module_id ~ '^[a-z][a-z0-9-]*$'), enabled boolean not null, version integer not null default 1 check(version>0), changed_by uuid references public.profiles(id), updated_at timestamptz not null default now());
insert into public.core_module_settings(module_id,enabled) values('work',true),('buildings',true),('guarantees',true),('car-booking',true),('duct-rental',false);
alter table public.core_module_settings enable row level security;
alter table public.core_module_settings force row level security;
create policy core_module_read on public.core_module_settings for select using(public.current_platform_user_id() is not null);
create policy core_module_create on public.core_module_settings for insert with check(public.has_scoped_permission('core.module.manage') and changed_by=public.current_platform_user_id());
create policy core_module_change on public.core_module_settings for update using(public.has_scoped_permission('core.module.manage')) with check(public.has_scoped_permission('core.module.manage') and changed_by=public.current_platform_user_id());
grant select on public.core_module_settings to duct_rental_policy_worker;
create or replace function public.duct_rental_has_entry() returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select coalesce((select enabled from public.core_module_settings where module_id='duct-rental'),false) and exists(
 select 1 from public.profiles p join public.local_credentials c on c.user_id=p.id
 join public.user_role_assignments a on a.user_id=p.id join public.role_permissions rp on rp.role_id=a.role_id and rp.permission_code='duct_rental.module.view'
 join public.data_scope_grants g on g.assignment_id=a.id and (g.permission_code is null or g.permission_code=rp.permission_code)
 where p.id=public.current_platform_user_id() and p.status='active' and not c.must_change_password
 and a.valid_from<=now() and (a.valid_until is null or a.valid_until>now()));
$$;
create or replace function public.duct_rental_has_access(permission text, resource_owner uuid, resource_team uuid default null)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select public.duct_rental_has_entry() and public.has_scoped_permission('duct_rental.module.view',resource_owner,resource_team)
 and public.has_scoped_permission(permission,resource_owner,resource_team);
$$;
