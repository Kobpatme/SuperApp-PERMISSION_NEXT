create table if not exists public.source_import_runs (
 id uuid primary key default gen_random_uuid(), source_system text not null, entity_type text not null, source_snapshot text not null,
 status text not null default 'pending' check(status in ('pending','running','reconciled','approved','failed','rolled_back')),
 source_count integer not null default 0 check(source_count>=0), imported_count integer not null default 0 check(imported_count>=0),
 anomaly_count integer not null default 0 check(anomaly_count>=0), checksum text not null,
 started_at timestamptz, finished_at timestamptz, approved_by uuid references public.profiles(id) on delete restrict,
 created_at timestamptz not null default now(), unique(source_system,entity_type,source_snapshot),
 check((status='approved' and approved_by is not null) or status<>'approved')
);
create table if not exists public.source_import_rows (
 id uuid primary key default gen_random_uuid(), run_id uuid not null references public.source_import_runs(id) on delete restrict,
 source_id text not null, source_checksum text not null,
 status text not null check(status in ('pending','imported','skipped','anomaly','failed')),
 target_entity_type text, target_entity_id uuid, raw_payload jsonb not null, anomaly_code text, anomaly_detail text,
 created_at timestamptz not null default now(), unique(run_id,source_id),
 check((status='imported')=(target_entity_id is not null)),
 check((status='anomaly')=(anomaly_code is not null))
);
create index if not exists source_import_rows_status_idx on public.source_import_rows(run_id,status);

insert into public.permissions(code,module_id,resource,action,description) values
 ('migration.run.read','migration','run','read','Read migration and reconciliation evidence'),
 ('migration.run.execute','migration','run','execute','Execute controlled import'),
 ('migration.run.approve','migration','run','approve','Approve reconciled import')
on conflict(code) do update set description=excluded.description;

alter table public.source_import_runs enable row level security;
alter table public.source_import_rows enable row level security;
drop trigger if exists source_import_rows_immutable on public.source_import_rows;
create trigger source_import_rows_immutable before update or delete on public.source_import_rows for each row
when (old.status in ('imported','skipped','anomaly')) execute function public.reject_immutable_change();

comment on table public.source_import_runs is 'Auditable migration batch and reconciliation approval; never implies source deletion.';
