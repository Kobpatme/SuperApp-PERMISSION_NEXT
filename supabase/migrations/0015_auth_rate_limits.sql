create table if not exists public.auth_rate_limits (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check(subject_type in ('email', 'ip')),
  subject_key text not null,
  window_started_at timestamptz not null,
  attempts integer not null default 0 check(attempts >= 0),
  blocked_until timestamptz,
  updated_at timestamptz not null default now(),
  unique(subject_type, subject_key)
);
create index if not exists auth_rate_limits_blocked_idx on public.auth_rate_limits(blocked_until);
