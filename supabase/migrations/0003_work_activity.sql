create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
  building_id uuid references public.buildings(id) on delete set null, owner_team_id uuid references public.teams(id) on delete set null,
  status text not null default 'active' check(status in ('active', 'completed', 'cancelled')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(), project_id uuid references public.projects(id) on delete set null,
  building_id uuid references public.buildings(id) on delete set null,
  owner_id uuid not null references public.profiles(id) on delete restrict, team_id uuid references public.teams(id) on delete set null,
  title text not null, description text,
  status text not null default 'queued' check(status in ('queued', 'in_progress', 'blocked', 'completed', 'cancelled')),
  priority text not null default 'normal' check(priority in ('low', 'normal', 'high', 'urgent')),
  due_at timestamptz, completed_at timestamptz, version integer not null default 1 check(version > 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check((status = 'completed') = (completed_at is not null))
);
create index if not exists tasks_my_work_idx on public.tasks(owner_id, status, due_at);
create index if not exists tasks_team_idx on public.tasks(team_id, status, due_at);

create table if not exists public.task_transitions (
  id uuid primary key default gen_random_uuid(), task_id uuid not null references public.tasks(id) on delete restrict,
  from_status text not null, to_status text not null, reason text,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  idempotency_key text not null unique, occurred_at timestamptz not null, created_at timestamptz not null default now(),
  check(from_status <> to_status)
);
create index if not exists task_transitions_task_idx on public.task_transitions(task_id, occurred_at desc);

create table if not exists public.manual_work_entries (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete restrict,
  team_id uuid references public.teams(id) on delete set null, building_id uuid references public.buildings(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null, description text not null, reason text not null, occurred_at timestamptz not null,
  idempotency_key text not null unique, status text not null default 'recorded' check(status in ('recorded', 'voided')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists manual_work_entries_owner_idx on public.manual_work_entries(owner_id, occurred_at desc);

alter table public.activity_events add column if not exists project_id uuid references public.projects(id) on delete set null;
alter table public.activity_events add column if not exists correction_of_event_id uuid references public.activity_events(id) on delete restrict;
alter table public.activity_events add column if not exists kpi_eligible boolean not null default false;

insert into public.permissions(code, module_id, resource, action, description) values
  ('work.task.create','work','task','create','Create work tasks'),
  ('work.task.update','work','task','update','Update scoped work tasks'),
  ('work.report.read','work','report','read','Read work reports'),
  ('activity.event.correct','activity','event','correct','Create event correction')
on conflict(code) do update set description = excluded.description;

alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_transitions enable row level security;
alter table public.manual_work_entries enable row level security;

drop policy if exists tasks_scoped_select on public.tasks;
create policy tasks_scoped_select on public.tasks for select
using(public.has_scoped_permission('work.task.read', owner_id, team_id));
drop policy if exists manual_work_entries_scoped_select on public.manual_work_entries;
create policy manual_work_entries_scoped_select on public.manual_work_entries for select
using(public.has_scoped_permission('work.task.read', owner_id, team_id));

drop trigger if exists task_transitions_immutable on public.task_transitions;
create trigger task_transitions_immutable before update or delete on public.task_transitions for each row execute function public.reject_immutable_change();

comment on table public.manual_work_entries is 'Fallback for verified off-system work; never the primary activity source.';
comment on table public.task_transitions is 'Immutable transition evidence with replay protection.';
