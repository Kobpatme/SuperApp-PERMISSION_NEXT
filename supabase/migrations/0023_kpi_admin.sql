alter table public.tasks add column work_type text check(work_type is null or work_type in ('B1','C1','C2','E1'));
alter table public.tasks add column extra_data jsonb not null default '{}'::jsonb;
alter table public.tasks add column hold_data jsonb not null default '{}'::jsonb;
alter table public.tasks add column sla_rule_version_id uuid references public.kpi_rule_versions(id) on delete restrict;
create table public.kpi_personal_versions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), team_id uuid not null references public.teams(id), version integer not null check(version>0), assignments jsonb not null,
 created_by uuid not null references public.profiles(id), updated_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,team_id,version)
);
create table public.work_admin_previews (
 id uuid primary key default gen_random_uuid(), actor_id uuid not null references public.profiles(id), kind text not null check(kind in ('deadlines','kpi_migration')), digest text not null, payload jsonb not null,
 expires_at timestamptz not null, applied_at timestamptz, created_by uuid not null references public.profiles(id), updated_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.kpi_personal_versions enable row level security;
alter table public.work_admin_previews enable row level security;
create policy personal_kpi_manage on public.kpi_personal_versions for all using(public.has_scoped_permission('kpi.rule.manage',user_id,team_id)) with check(public.has_scoped_permission('kpi.rule.manage',user_id,team_id));
create policy work_previews_owner on public.work_admin_previews for all using(actor_id=public.current_platform_user_id()) with check(actor_id=public.current_platform_user_id());
