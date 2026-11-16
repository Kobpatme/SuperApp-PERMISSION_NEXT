-- Users who hit a denied module can ask for access instead of finding an
-- administrator out of band. Approving records the decision and can grant a
-- role in the same transaction; rejecting keeps the requester's reason.
-- Additive only: no existing grant, role or assignment is touched.
create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  module_id text not null,
  reason text not null check (char_length(reason) between 10 and 500),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  decision_note text,
  granted_role_id uuid references public.roles(id) on delete set null,
  created_at timestamptz not null default now(),
  check ((status = 'pending') = (decided_at is null)),
  check (status <> 'rejected' or decision_note is not null)
);
create index if not exists access_requests_queue_idx on public.access_requests(status, created_at desc);
-- One open request per person and module keeps the queue readable.
create unique index if not exists access_requests_one_pending_idx
  on public.access_requests(requester_id, module_id) where status = 'pending';
create index if not exists access_requests_requester_idx on public.access_requests(requester_id, created_at desc);

-- Same trusted Core backend boundary as the other administration tables.
grant select, insert, update on public.access_requests to permission_core_runtime;

comment on table public.access_requests is
  'Self-service access requests. Decision, grant and audit are written in one transaction by the admin action.';
