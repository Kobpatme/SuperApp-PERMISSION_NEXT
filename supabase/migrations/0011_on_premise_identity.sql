-- Standalone PostgreSQL identity for on-premise deployment. No external auth service is required.
create table if not exists public.local_credentials (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  password_hash text not null,
  failed_attempts integer not null default 0 check(failed_attempts >= 0),
  locked_until timestamptz,
  password_changed_at timestamptz not null default now(),
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists auth_sessions_user_idx on public.auth_sessions(user_id,expires_at);
create unique index if not exists profiles_email_normalized_idx on public.profiles(lower(email));

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  role_id uuid not null references public.roles(id) on delete restrict,
  scope_type text not null default 'OWN' check(scope_type in ('OWN','TEAM','ALL')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists position_id uuid references public.positions(id) on delete set null;

insert into public.permissions(code,module_id,resource,action,description) values
  ('core.user.manage','core','user','manage','Create, suspend and reset local users'),
  ('core.position.manage','core','position','manage','Manage business positions')
on conflict(code) do update set description=excluded.description;

insert into public.positions(code,name,role_id,scope_type)
select 'platform_admin','ผู้ดูแลระบบ',id,'ALL' from public.roles where code='platform_admin'
on conflict(code) do nothing;
insert into public.positions(code,name,role_id,scope_type)
select 'operations_manager','ผู้จัดการฝ่ายปฏิบัติการ',id,'ALL' from public.roles where code='operations_manager'
on conflict(code) do nothing;
insert into public.positions(code,name,role_id,scope_type)
select 'guarantee_officer','เจ้าหน้าที่เงินประกัน',id,'TEAM' from public.roles where code='permission_specialist'
on conflict(code) do nothing;
insert into public.positions(code,name,role_id,scope_type)
select 'viewer','ผู้ตรวจสอบข้อมูล',id,'ALL' from public.roles where code='viewer'
on conflict(code) do nothing;

comment on table public.local_credentials is 'Argon2id password hashes for organization-managed accounts; plaintext passwords are never stored.';
comment on table public.auth_sessions is 'Opaque browser sessions; only SHA-256 token hashes are stored.';
