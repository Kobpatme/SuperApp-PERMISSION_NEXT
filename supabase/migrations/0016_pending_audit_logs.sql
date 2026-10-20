create table if not exists public.pending_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  module_id text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  request_id text not null,
  before jsonb,
  after jsonb,
  metadata jsonb not null default '{}'::jsonb,
  last_error text not null,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  available_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists pending_audit_logs_pending_idx on public.pending_audit_logs(resolved_at, available_at);
create index if not exists pending_audit_logs_request_idx on public.pending_audit_logs(request_id);
alter table public.pending_audit_logs enable row level security;
