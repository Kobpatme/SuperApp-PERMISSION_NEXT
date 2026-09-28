create table if not exists public.guarantee_cases (
 id uuid primary key default gen_random_uuid(), case_number text not null unique, building_id uuid not null references public.buildings(id) on delete restrict,
 owner_id uuid not null references public.profiles(id) on delete restrict, team_id uuid references public.teams(id) on delete set null,
 status text not null default 'draft' check(status in ('draft','evidence_pending','submitted','finance_review','transfer_pending','partially_refunded','refunded','cancelled')),
 expected_deposit numeric(18,2) not null default 0 check(expected_deposit>=0), version integer not null default 1 check(version>0),
 opened_at timestamptz not null default now(), closed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists guarantee_cases_queue_idx on public.guarantee_cases(team_id,status,updated_at desc);
create table if not exists public.guarantee_deposits (
 id uuid primary key default gen_random_uuid(), case_id uuid not null references public.guarantee_cases(id) on delete restrict,
 amount numeric(18,2) not null check(amount>0), paid_at timestamptz not null, reference text not null unique,
 recorded_by uuid not null references public.profiles(id) on delete restrict, created_at timestamptz not null default now()
);
create index if not exists guarantee_deposits_case_idx on public.guarantee_deposits(case_id);
create table if not exists public.guarantee_refund_requests (
 id uuid primary key default gen_random_uuid(), case_id uuid not null references public.guarantee_cases(id) on delete restrict,
 amount numeric(18,2) not null check(amount>0), status text not null default 'pending' check(status in ('pending','approved','rejected','cancelled')),
 reason text not null, requested_by uuid not null references public.profiles(id) on delete restrict,
 approved_by uuid references public.profiles(id) on delete restrict, decided_at timestamptz, idempotency_key text not null unique,
 created_at timestamptz not null default now(), check(approved_by is null or approved_by<>requested_by),
 check((status='pending' and approved_by is null and decided_at is null) or (status<>'pending' and decided_at is not null))
);
create index if not exists guarantee_refund_requests_status_idx on public.guarantee_refund_requests(status,created_at);
create table if not exists public.guarantee_refunds (
 id uuid primary key default gen_random_uuid(), case_id uuid not null references public.guarantee_cases(id) on delete restrict,
 refund_request_id uuid not null references public.guarantee_refund_requests(id) on delete restrict,
 amount numeric(18,2) not null check(amount>0), received_at timestamptz not null, reference text not null unique,
 recorded_by uuid not null references public.profiles(id) on delete restrict, created_at timestamptz not null default now()
);
create index if not exists guarantee_refunds_case_idx on public.guarantee_refunds(case_id);
create table if not exists public.guarantee_transitions (
 id uuid primary key default gen_random_uuid(), case_id uuid not null references public.guarantee_cases(id) on delete restrict,
 from_status text not null, to_status text not null, reason text, actor_id uuid not null references public.profiles(id) on delete restrict,
 idempotency_key text not null unique, occurred_at timestamptz not null, created_at timestamptz not null default now(), check(from_status<>to_status)
);
create index if not exists guarantee_transitions_case_idx on public.guarantee_transitions(case_id,occurred_at desc);

create or replace function public.enforce_guarantee_refund_limit() returns trigger language plpgsql as $$
declare deposited numeric(18,2); refunded numeric(18,2); request_case uuid; request_status text;
begin
 perform 1 from public.guarantee_cases where id=new.case_id for update;
 select case_id,status into request_case,request_status from public.guarantee_refund_requests where id=new.refund_request_id;
 if request_case is distinct from new.case_id or request_status<>'approved' then raise exception 'Refund request is not approved for this case'; end if;
 select coalesce(sum(amount),0) into deposited from public.guarantee_deposits where case_id=new.case_id;
 select coalesce(sum(amount),0) into refunded from public.guarantee_refunds where case_id=new.case_id and id<>new.id;
 if refunded+new.amount>deposited then raise exception 'Refund exceeds recorded deposits'; end if;
 return new;
end $$;
drop trigger if exists guarantee_refund_limit on public.guarantee_refunds;
create trigger guarantee_refund_limit before insert or update on public.guarantee_refunds for each row execute function public.enforce_guarantee_refund_limit();

insert into public.permissions(code,module_id,resource,action,description) values
 ('guarantee.case.create','guarantee','case','create','Create guarantee case'),
 ('guarantee.case.update','guarantee','case','update','Update scoped guarantee case'),
 ('guarantee.refund.request','guarantee','refund','request','Request refund'),
 ('guarantee.refund.approve','guarantee','refund','approve','Approve another user refund'),
 ('guarantee.refund.record','guarantee','refund','record','Record verified refund')
on conflict(code) do update set description=excluded.description;

alter table public.guarantee_cases enable row level security;
alter table public.guarantee_deposits enable row level security;
alter table public.guarantee_refund_requests enable row level security;
alter table public.guarantee_refunds enable row level security;
alter table public.guarantee_transitions enable row level security;
drop policy if exists guarantee_cases_scoped_select on public.guarantee_cases;
create policy guarantee_cases_scoped_select on public.guarantee_cases for select
using(public.has_scoped_permission('guarantee.case.read',owner_id,team_id));
drop trigger if exists guarantee_transitions_immutable on public.guarantee_transitions;
create trigger guarantee_transitions_immutable before update or delete on public.guarantee_transitions for each row execute function public.reject_immutable_change();
drop trigger if exists guarantee_deposits_immutable on public.guarantee_deposits;
create trigger guarantee_deposits_immutable before update or delete on public.guarantee_deposits for each row execute function public.reject_immutable_change();
drop trigger if exists guarantee_refunds_immutable on public.guarantee_refunds;
create trigger guarantee_refunds_immutable before update or delete on public.guarantee_refunds for each row execute function public.reject_immutable_change();

comment on table public.guarantee_refunds is 'Immutable posted refunds; corrections use reversal records/events.';
