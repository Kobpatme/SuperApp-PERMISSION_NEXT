create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id text not null,
  role text not null,
  created_at timestamptz not null default now(),
  constraint user_roles_user_module_unique unique (user_id, module_id),
  constraint user_roles_role_check check (role in ('admin', 'manager', 'permission', 'sale', 'viewer'))
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  module_id text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = nullif(current_setting('app.user_id', true), '')::uuid
      and module_id = 'core'
      and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles
  for select
  using (id = nullif(current_setting('app.user_id', true), '')::uuid or public.is_platform_admin());

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin on public.profiles
  for update
  using (id = nullif(current_setting('app.user_id', true), '')::uuid or public.is_platform_admin())
  with check (id = nullif(current_setting('app.user_id', true), '')::uuid or public.is_platform_admin());

drop policy if exists roles_select_self_or_admin on public.user_roles;
create policy roles_select_self_or_admin on public.user_roles
  for select
  using (user_id = nullif(current_setting('app.user_id', true), '')::uuid or public.is_platform_admin());

drop policy if exists roles_manage_admin_only on public.user_roles;
create policy roles_manage_admin_only on public.user_roles
  for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists audit_select_self_or_admin on public.audit_logs;
create policy audit_select_self_or_admin on public.audit_logs
  for select
  using (actor_id = nullif(current_setting('app.user_id', true), '')::uuid or public.is_platform_admin());

drop policy if exists audit_insert_authenticated on public.audit_logs;
create policy audit_insert_authenticated on public.audit_logs
  for insert
  with check (actor_id = nullif(current_setting('app.user_id', true), '')::uuid);

comment on table public.user_roles is 'Server-managed RBAC assignments. Core uses module_id=core.';
comment on table public.audit_logs is 'Append-only user-visible audit events; elevated jobs use a separate controlled connection.';
