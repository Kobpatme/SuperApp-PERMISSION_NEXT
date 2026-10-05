-- Additive recovery; 0017/0018 are already occupied. No legacy note backfill.
alter table public.tasks add column if not exists deleted_at timestamptz;
alter table public.tasks add column if not exists deleted_by uuid references public.profiles(id) on delete restrict;
create index if not exists tasks_active_queue_idx on public.tasks(team_id, updated_at desc) where deleted_at is null;
create table public.task_notes (
  id uuid primary key default gen_random_uuid(), task_id uuid not null references public.tasks(id) on delete restrict,
  author_id uuid not null references public.profiles(id) on delete restrict, body text not null check (length(btrim(body)) between 1 and 4000),
  created_by uuid not null references public.profiles(id), updated_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index task_notes_task_idx on public.task_notes(task_id, created_at);
create table public.work_mutation_receipts (
  idempotency_key text primary key, task_id uuid not null references public.tasks(id) on delete restrict,
  actor_id uuid not null references public.profiles(id), fingerprint text not null, result_version integer not null check (result_version > 0),
  created_by uuid not null references public.profiles(id), updated_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.task_notes enable row level security;
alter table public.work_mutation_receipts enable row level security;
create policy task_notes_read on public.task_notes for select using (exists (
  select 1 from public.tasks t where t.id = task_id and t.deleted_at is null and public.has_scoped_permission('work.task.read', t.owner_id, t.team_id)
));
create policy task_notes_insert on public.task_notes for insert with check (exists (
  select 1 from public.tasks t where t.id = task_id and t.deleted_at is null and public.has_scoped_permission('work.note.create', t.owner_id, t.team_id)
));
-- Receipts are an internal server facility; no browser/public policy.
insert into public.permissions(code, module_id, resource, action, description) values
 ('work.task.assign','work','task','assign','มอบหมายงาน'),
 ('work.task.delete','work','task','delete','ลบและกู้คืนงาน'),
 ('work.note.create','work','note','create','เพิ่มบันทึกงาน')
on conflict (code) do nothing;
-- Existing system-admin grants only; normal roles are edited in Roles UI.
insert into public.role_permissions(role_id, permission_code)
select r.id,p.code from public.roles r cross join public.permissions p
where r.code = 'platform_admin' and p.code in ('work.task.assign','work.task.delete','work.note.create')
on conflict do nothing;
