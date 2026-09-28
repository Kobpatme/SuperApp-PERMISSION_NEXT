-- Typed fee rows for filtering/reporting; immutable condition JSON remains the source snapshot.
create table if not exists public.building_condition_fees (
  id uuid primary key default gen_random_uuid(),
  condition_version_id uuid not null references public.building_condition_versions(id) on delete cascade,
  source_key text not null,
  label text not null,
  category text not null,
  cost_type text not null check (cost_type in ('CAPEX','OPEX','DEPOSIT','UNCLASSIFIED')),
  calculation_type text not null default 'fixed' check (calculation_type in ('fixed','revenue_share')),
  amount numeric(18,2) check (amount >= 0),
  rate numeric(18,4) check (rate >= 0),
  unit text not null default 'ครั้ง',
  revenue_period text,
  payable boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  unique (condition_version_id, source_key)
);
create index if not exists building_condition_fees_type_idx on public.building_condition_fees(cost_type, category);
create policy building_condition_versions_scoped_select on public.building_condition_versions for select
using (exists (
  select 1 from public.buildings b where b.id = building_condition_versions.building_id
    and public.has_scoped_permission('building.record.read', null, b.owner_team_id)
));
alter table public.building_condition_fees enable row level security;
create policy building_condition_fees_scoped_select on public.building_condition_fees for select
using (exists (
  select 1 from public.building_condition_versions cv
  join public.buildings b on b.id = cv.building_id
  where cv.id = building_condition_fees.condition_version_id
    and public.has_scoped_permission('building.record.read', null, b.owner_team_id)
));
