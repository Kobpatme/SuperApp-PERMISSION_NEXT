-- An approval grants a role next to the one the position already gives. Until now
-- every assignment looked identical, so editing a user expired them all and the
-- approved grant disappeared without a trace. The source column keeps the
-- position assignment separate from grants that were approved later.
alter table public.user_role_assignments
  add column if not exists source text not null default 'position';

alter table public.user_role_assignments
  drop constraint if exists user_role_assignments_source_check;
alter table public.user_role_assignments
  add constraint user_role_assignments_source_check
  check (source in ('position', 'access_request', 'manual'));

-- Approvals written before this column existed are marked so they survive the
-- next user edit as well. Matching on the deciding administrator and the
-- transaction time avoids reclassifying a position assignment that happens to
-- share the granted role.
update public.user_role_assignments a
   set source = 'access_request'
 where a.source = 'position'
   and exists (
     select 1
       from public.access_requests r
      where r.requester_id = a.user_id
        and r.granted_role_id = a.role_id
        and r.status = 'approved'
        and a.created_by is not distinct from r.decided_by
        and r.decided_at is not null
        and a.created_at between r.decided_at - interval '5 seconds' and r.decided_at + interval '5 seconds'
   );

create index if not exists user_role_assignments_source_idx
  on public.user_role_assignments(user_id, source)
  where valid_until is null;

comment on column public.user_role_assignments.source is
  'position = derived from the user position; access_request = approved self-service request; manual = granted directly by an administrator.';
