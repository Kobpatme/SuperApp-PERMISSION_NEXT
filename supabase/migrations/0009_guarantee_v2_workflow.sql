-- Native operational records for the six-step deposit workflow from V2.
create table if not exists public.guarantee_work_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  team_id uuid references public.teams(id) on delete set null,
  tl_assignee_id uuid references public.profiles(id) on delete set null,
  status text not null default 'new' check (status in ('new','fin','att','tl','On Process','ret','clo','done','Cancel')),
  place text not null check (length(trim(place)) > 0),
  area text,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists guarantee_work_items_queue_idx on public.guarantee_work_items(team_id,status,updated_at desc);
create index if not exists guarantee_work_items_tl_idx on public.guarantee_work_items(tl_assignee_id,status,updated_at desc);
create index if not exists guarantee_work_items_place_idx on public.guarantee_work_items(place);

create table if not exists public.guarantee_work_events (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.guarantee_work_items(id) on delete restrict,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  action text not null,
  from_status text,
  to_status text,
  reason text,
  occurred_at timestamptz not null default now()
);
create index if not exists guarantee_work_events_item_idx on public.guarantee_work_events(item_id,occurred_at desc);

alter table public.guarantee_work_items enable row level security;
alter table public.guarantee_work_events enable row level security;
drop policy if exists guarantee_work_items_scoped_select on public.guarantee_work_items;
create policy guarantee_work_items_scoped_select on public.guarantee_work_items for select
using (public.has_scoped_permission('guarantee.case.read',owner_id,team_id)
  or (tl_assignee_id = public.current_platform_user_id() and public.has_scoped_permission('guarantee.tl.work',public.current_platform_user_id(),null)));
drop policy if exists guarantee_work_events_scoped_select on public.guarantee_work_events;
create policy guarantee_work_events_scoped_select on public.guarantee_work_events for select
using (exists (select 1 from public.guarantee_work_items item where item.id = item_id
  and (public.has_scoped_permission('guarantee.case.read',item.owner_id,item.team_id)
    or (item.tl_assignee_id = public.current_platform_user_id() and public.has_scoped_permission('guarantee.tl.work',public.current_platform_user_id(),null)))));
-- Application writes use server-side RBAC and an auditable transaction; direct client writes stay denied.
drop trigger if exists guarantee_work_events_immutable on public.guarantee_work_events;
create trigger guarantee_work_events_immutable before update or delete on public.guarantee_work_events
for each row execute function public.reject_immutable_change();

insert into public.permissions(code,module_id,resource,action,description) values
  ('guarantee.tl.work','guarantee','tl','work','Work only assigned TL deposit cases')
on conflict(code) do nothing;
insert into public.roles(code,name,description,is_system) values
  ('guarantee_tl','Guarantee TL','Assigned TL work on building deposits',true)
on conflict(code) do nothing;
insert into public.role_permissions(role_id,permission_code)
select r.id,p.code from public.roles r join public.permissions p on p.code = 'guarantee.tl.work'
where r.code = 'guarantee_tl' on conflict do nothing;
