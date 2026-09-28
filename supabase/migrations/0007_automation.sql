create table if not exists public.automation_rules (
 id uuid primary key default gen_random_uuid(), name text not null, version integer not null check(version>0), event_type text not null,
 status text not null default 'draft' check(status in ('draft','active','paused','retired')),
 conditions jsonb not null default '[]'::jsonb, actions jsonb not null,
 created_by uuid not null references public.profiles(id) on delete restrict,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(name,version)
);
create index if not exists automation_rules_event_idx on public.automation_rules(event_type,status);
create table if not exists public.automation_executions (
 id uuid primary key default gen_random_uuid(), rule_id uuid not null references public.automation_rules(id) on delete restrict,
 activity_event_id uuid not null references public.activity_events(id) on delete restrict,
 status text not null default 'pending' check(status in ('pending','running','completed','failed','dead_letter')),
 idempotency_key text not null unique, attempt_count integer not null default 0 check(attempt_count>=0), available_at timestamptz not null default now(),
 started_at timestamptz, finished_at timestamptz, last_error text, created_at timestamptz not null default now()
);
create index if not exists automation_executions_pending_idx on public.automation_executions(status,available_at) where status in ('pending','failed');
create table if not exists public.automation_action_results (
 id uuid primary key default gen_random_uuid(), execution_id uuid not null references public.automation_executions(id) on delete restrict,
 sequence integer not null check(sequence>0), action_type text not null,
 status text not null check(status in ('running','completed','failed','skipped')), idempotency_key text not null unique,
 output jsonb, error text, started_at timestamptz not null, finished_at timestamptz, unique(execution_id,sequence)
);

insert into public.permissions(code,module_id,resource,action,description) values
 ('automation.rule.read','automation','rule','read','Read automation rules'),
 ('automation.rule.manage','automation','rule','manage','Manage versioned automation rules'),
 ('automation.execution.read','automation','execution','read','Read execution logs'),
 ('automation.execution.retry','automation','execution','retry','Retry failed execution')
on conflict(code) do update set description=excluded.description;

alter table public.automation_rules enable row level security;
alter table public.automation_executions enable row level security;
alter table public.automation_action_results enable row level security;
drop trigger if exists automation_rules_immutable on public.automation_rules;
create trigger automation_rules_immutable before update or delete on public.automation_rules for each row
when (old.status in ('active','retired')) execute function public.reject_immutable_change();
drop trigger if exists automation_action_results_immutable on public.automation_action_results;
create trigger automation_action_results_immutable before update or delete on public.automation_action_results for each row
when (old.status in ('completed','skipped')) execute function public.reject_immutable_change();

comment on table public.automation_executions is 'Idempotent event/rule execution queue with bounded retry and dead-letter state.';
