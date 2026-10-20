create table if not exists public.price_estimates (
 id uuid primary key default gen_random_uuid(), estimate_number text not null unique,
 building_id uuid not null references public.buildings(id) on delete restrict,
 owner_id uuid not null references public.profiles(id) on delete restrict, team_id uuid references public.teams(id) on delete set null,
 status text not null default 'draft' check(status in ('draft','submitted','revision_requested','approved','cancelled')),
 current_version integer not null default 1 check(current_version>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists price_estimates_queue_idx on public.price_estimates(team_id,status,updated_at desc);
create table if not exists public.price_estimate_versions (
 id uuid primary key default gen_random_uuid(), estimate_id uuid not null references public.price_estimates(id) on delete restrict,
 version integer not null check(version>0), condition_version_id uuid not null references public.building_condition_versions(id) on delete restrict,
 condition_snapshot jsonb not null, subtotal numeric(18,2) not null check(subtotal>=0), tax numeric(18,2) not null check(tax>=0),
 total numeric(18,2) not null, status text not null default 'draft' check(status in ('draft','submitted','revision_requested','approved','superseded')),
 notes text, created_by uuid not null references public.profiles(id) on delete restrict, created_at timestamptz not null default now(),
 unique(estimate_id,version), check(total=subtotal+tax)
);
create table if not exists public.price_estimate_items (
 id uuid primary key default gen_random_uuid(), estimate_version_id uuid not null references public.price_estimate_versions(id) on delete restrict,
 sequence integer not null check(sequence>0), description text not null, quantity numeric(18,4) not null check(quantity>0), unit text not null,
 unit_price numeric(18,4) not null check(unit_price>=0), amount numeric(18,2) not null check(amount>=0), metadata jsonb not null default '{}'::jsonb,
 unique(estimate_version_id,sequence), check(amount=round(quantity*unit_price,2))
);
create table if not exists public.price_approvals (
 id uuid primary key default gen_random_uuid(), estimate_version_id uuid not null references public.price_estimate_versions(id) on delete restrict,
 requested_by uuid not null references public.profiles(id) on delete restrict, decided_by uuid not null references public.profiles(id) on delete restrict,
 decision text not null check(decision in ('approved','revision_requested')), reason text, idempotency_key text not null unique,
 decided_at timestamptz not null, check(decided_by<>requested_by), check(decision='approved' or length(trim(coalesce(reason,'')))>=5)
);
create index if not exists price_approvals_version_idx on public.price_approvals(estimate_version_id,decided_at desc);

insert into public.permissions(code,module_id,resource,action,description) values
 ('pricing.estimate.read','pricing','estimate','read','Read scoped estimates'),
 ('pricing.estimate.create','pricing','estimate','create','Create estimate'),
 ('pricing.estimate.update','pricing','estimate','update','Create a new estimate version'),
 ('pricing.estimate.submit','pricing','estimate','submit','Submit estimate for review'),
 ('pricing.estimate.approve','pricing','estimate','approve','Approve another user estimate')
on conflict(code) do update set description=excluded.description;

alter table public.price_estimates enable row level security;
alter table public.price_estimate_versions enable row level security;
alter table public.price_estimate_items enable row level security;
alter table public.price_approvals enable row level security;
drop policy if exists price_estimates_scoped_select on public.price_estimates;
create policy price_estimates_scoped_select on public.price_estimates for select
using(public.has_scoped_permission('pricing.estimate.read',owner_id,team_id));

drop trigger if exists price_estimate_versions_immutable on public.price_estimate_versions;
create trigger price_estimate_versions_immutable before update or delete on public.price_estimate_versions for each row
when (old.status in ('submitted','approved','superseded')) execute function public.reject_immutable_change();
drop trigger if exists price_estimate_items_immutable on public.price_estimate_items;
create trigger price_estimate_items_immutable before update or delete on public.price_estimate_items for each row execute function public.reject_immutable_change();
drop trigger if exists price_approvals_immutable on public.price_approvals;
create trigger price_approvals_immutable before update or delete on public.price_approvals for each row execute function public.reject_immutable_change();

comment on table public.price_estimate_versions is 'Immutable submitted/approved pricing versions with captured building-condition evidence.';
