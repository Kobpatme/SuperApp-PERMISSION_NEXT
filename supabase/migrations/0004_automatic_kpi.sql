create table if not exists public.kpi_metrics (
  id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, unit text not null,
  direction text not null default 'higher_is_better' check(direction in ('higher_is_better','lower_is_better')),
  is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.kpi_rule_versions (
  id uuid primary key default gen_random_uuid(), metric_id uuid not null references public.kpi_metrics(id) on delete restrict,
  version integer not null check(version > 0), event_type text not null,
  status text not null default 'draft' check(status in ('draft','active','retired')),
  effective_from timestamptz not null, effective_until timestamptz,
  calculation_version integer not null default 1 check(calculation_version > 0), rule jsonb not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(metric_id, version), check(effective_until is null or effective_until > effective_from)
);
create index if not exists kpi_rule_versions_event_idx on public.kpi_rule_versions(event_type,status,effective_from);
create unique index if not exists kpi_rule_versions_active_window_idx on public.kpi_rule_versions(metric_id,event_type,effective_from) where status='active';

create table if not exists public.kpi_targets (
  id uuid primary key default gen_random_uuid(), metric_id uuid not null references public.kpi_metrics(id) on delete restrict,
  user_id uuid references public.profiles(id) on delete cascade, team_id uuid references public.teams(id) on delete cascade,
  period_start timestamptz not null, period_end timestamptz not null, target_value numeric(24,6) not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(num_nonnulls(user_id,team_id)=1), check(period_end>period_start)
);
create index if not exists kpi_targets_period_idx on public.kpi_targets(period_start,period_end);

create table if not exists public.kpi_facts (
  id uuid primary key default gen_random_uuid(), activity_event_id uuid not null references public.activity_events(id) on delete restrict,
  rule_version_id uuid not null references public.kpi_rule_versions(id) on delete restrict,
  metric_id uuid not null references public.kpi_metrics(id) on delete restrict,
  owner_id uuid not null references public.profiles(id) on delete restrict, team_id uuid references public.teams(id) on delete set null,
  value numeric(24,6) not null, calculation_version integer not null check(calculation_version>0), trace jsonb not null,
  status text not null default 'applied' check(status in ('applied','reversed')),
  occurred_at timestamptz not null, created_at timestamptz not null default now(),
  unique(activity_event_id,rule_version_id,calculation_version)
);
create index if not exists kpi_facts_owner_period_idx on public.kpi_facts(owner_id,occurred_at desc);

create table if not exists public.kpi_adjustments (
  id uuid primary key default gen_random_uuid(), fact_id uuid not null references public.kpi_facts(id) on delete restrict,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  approved_by uuid references public.profiles(id) on delete restrict, reason text not null,
  old_value numeric(24,6) not null, new_value numeric(24,6) not null,
  status text not null default 'pending' check(status in ('pending','approved','rejected')),
  decided_at timestamptz, created_at timestamptz not null default now(),
  check(approved_by is null or approved_by<>requested_by),
  check((status='pending' and approved_by is null and decided_at is null) or (status<>'pending' and approved_by is not null and decided_at is not null))
);
create index if not exists kpi_adjustments_status_idx on public.kpi_adjustments(status,created_at);

create table if not exists public.kpi_calculation_runs (
  id uuid primary key default gen_random_uuid(), calculation_version integer not null check(calculation_version>0),
  started_at timestamptz not null, finished_at timestamptz, event_count integer not null default 0 check(event_count>=0),
  fact_count integer not null default 0 check(fact_count>=0), error_count integer not null default 0 check(error_count>=0),
  trace_id text not null unique, status text not null default 'running' check(status in ('running','completed','failed')),
  errors jsonb not null default '[]'::jsonb
);
create table if not exists public.kpi_score_snapshots (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete restrict,
  team_id uuid references public.teams(id) on delete set null, metric_id uuid not null references public.kpi_metrics(id) on delete restrict,
  period_start timestamptz not null, period_end timestamptz not null, score numeric(24,6) not null,
  fact_count integer not null check(fact_count>=0), calculation_version integer not null check(calculation_version>0), calculated_at timestamptz not null,
  unique(owner_id,metric_id,period_start,period_end,calculation_version), check(period_end>period_start)
);

insert into public.permissions(code,module_id,resource,action,description) values
 ('kpi.score.read','kpi','score','read','Read scoped KPI scores'),
 ('kpi.team.read','kpi','team','read','Read team KPI'),
 ('kpi.rule.manage','kpi','rule','manage','Manage versioned KPI rules'),
 ('kpi.adjustment.request','kpi','adjustment','request','Request KPI adjustment'),
 ('kpi.adjustment.approve','kpi','adjustment','approve','Approve another user adjustment')
on conflict(code) do update set description=excluded.description;

alter table public.kpi_metrics enable row level security;
alter table public.kpi_rule_versions enable row level security;
alter table public.kpi_targets enable row level security;
alter table public.kpi_facts enable row level security;
alter table public.kpi_adjustments enable row level security;
alter table public.kpi_calculation_runs enable row level security;
alter table public.kpi_score_snapshots enable row level security;

drop policy if exists kpi_facts_scoped_select on public.kpi_facts;
create policy kpi_facts_scoped_select on public.kpi_facts for select
using(public.has_scoped_permission('kpi.score.read',owner_id,team_id));
drop policy if exists kpi_scores_scoped_select on public.kpi_score_snapshots;
create policy kpi_scores_scoped_select on public.kpi_score_snapshots for select
using(public.has_scoped_permission('kpi.score.read',owner_id,team_id));

drop trigger if exists kpi_facts_immutable on public.kpi_facts;
create trigger kpi_facts_immutable before update or delete on public.kpi_facts for each row execute function public.reject_immutable_change();
drop trigger if exists kpi_rule_versions_immutable on public.kpi_rule_versions;
create trigger kpi_rule_versions_immutable before update or delete on public.kpi_rule_versions for each row
when (old.status in ('active','retired')) execute function public.reject_immutable_change();

comment on table public.kpi_facts is 'Explainable derived facts; unique event/rule/calculation tuple prevents replay scoring.';
comment on table public.kpi_adjustments is 'Four-eyes adjustment workflow; requester cannot approve own request.';
