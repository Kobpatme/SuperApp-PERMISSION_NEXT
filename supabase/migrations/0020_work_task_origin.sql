alter table public.tasks add column if not exists source_kind text not null default 'legacy' check (source_kind in ('legacy','personal','assigned'));
-- Historical origin is unknown; do not infer it from owner/status.
