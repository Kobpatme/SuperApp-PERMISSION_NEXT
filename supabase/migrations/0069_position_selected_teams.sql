-- Positions can target an explicit team list, mirroring the user-level SELECTED_TEAMS scope.
-- Additive only: no existing position, assignment or grant is rewritten.
--
-- Why: an administrator could already set SELECTED_TEAMS per user, but a position
-- (the reusable template that seeds a new user's assignment) only allowed OWN/TEAM/ALL.
-- That forced every position-based user onto a coarser scope than the role model allows.
alter table public.positions drop constraint if exists positions_scope_type_check;
alter table public.positions drop constraint if exists positions_scope_check;
alter table public.positions add constraint positions_scope_check check(scope_type in ('OWN','TEAM','SELECTED_TEAMS','ALL'));

create table if not exists public.position_selected_teams (
  position_id uuid not null references public.positions(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (position_id, team_id)
);
create index if not exists position_selected_teams_team_idx on public.position_selected_teams(team_id);

-- Same trusted backward DML boundary as public.positions in 0059_core_runtime.sql:
-- end-user RBAC stays server-enforced, and the table is not exposed to module runtimes.
grant select, insert, delete on public.position_selected_teams to permission_core_runtime;

comment on table public.position_selected_teams is
  'Explicit team list used only when a position scope is SELECTED_TEAMS; server validation keeps other scopes free of rows.';
