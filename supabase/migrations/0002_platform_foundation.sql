-- Phase 1 additive platform foundation. No legacy data is deleted.
create extension if not exists "pgcrypto";

alter table public.profiles add column if not exists employee_code text;
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check check (status in ('active', 'inactive'));
create unique index if not exists profiles_employee_code_idx on public.profiles(employee_code) where employee_code is not null;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
  is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.user_teams (
  user_id uuid not null references public.profiles(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  is_primary boolean not null default false, created_at timestamptz not null default now(), primary key (user_id, team_id)
);
create unique index if not exists user_teams_one_primary_idx on public.user_teams(user_id) where is_primary;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, description text,
  is_system boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.permissions (
  code text primary key, module_id text not null, resource text not null, action text not null, description text,
  created_at timestamptz not null default now(), unique(module_id, resource, action)
);
create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_code text not null references public.permissions(code) on delete cascade,
  created_at timestamptz not null default now(), primary key(role_id, permission_code)
);
create table if not exists public.user_role_assignments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade, team_id uuid references public.teams(id) on delete cascade,
  valid_from timestamptz not null default now(), valid_until timestamptz,
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(),
  check(valid_until is null or valid_until > valid_from)
);
create index if not exists user_role_assignments_user_idx on public.user_role_assignments(user_id);
create table if not exists public.data_scope_grants (
  id uuid primary key default gen_random_uuid(), assignment_id uuid not null references public.user_role_assignments(id) on delete cascade,
  permission_code text references public.permissions(code) on delete cascade,
  scope_type text not null check(scope_type in ('OWN', 'TEAM', 'SELECTED_TEAMS', 'ALL')),
  selected_team_id uuid references public.teams(id) on delete cascade, created_at timestamptz not null default now(),
  check((scope_type = 'SELECTED_TEAMS') = (selected_team_id is not null))
);
create index if not exists data_scope_grants_assignment_idx on public.data_scope_grants(assignment_id);

create table if not exists public.buildings (
  id uuid primary key default gen_random_uuid(), code text not null unique, name_th text not null, name_en text,
  status text not null default 'active' check(status in ('active', 'inactive', 'merged')), search_text text not null,
  owner_team_id uuid references public.teams(id) on delete set null, version integer not null default 1 check(version > 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists buildings_search_idx on public.buildings using gin(to_tsvector('simple', search_text));
create table if not exists public.building_aliases (
  id uuid primary key default gen_random_uuid(), building_id uuid not null references public.buildings(id) on delete cascade,
  normalized_alias text not null unique, display_alias text not null, created_at timestamptz not null default now()
);
create table if not exists public.building_source_mappings (
  id uuid primary key default gen_random_uuid(), building_id uuid not null references public.buildings(id) on delete restrict,
  source_system text not null, source_id text not null, raw_name text, verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(),
  unique(source_system, source_id)
);
create table if not exists public.building_contacts (
  id uuid primary key default gen_random_uuid(), building_id uuid not null references public.buildings(id) on delete cascade,
  name text not null, contact_type text not null, value text not null, is_primary boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists building_contacts_building_idx on public.building_contacts(building_id);
create table if not exists public.building_condition_versions (
  id uuid primary key default gen_random_uuid(), building_id uuid not null references public.buildings(id) on delete restrict,
  version integer not null check(version > 0), effective_from timestamptz not null, effective_until timestamptz,
  conditions jsonb not null, reason text not null, created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), unique(building_id, version),
  check(effective_until is null or effective_until > effective_from)
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(), module_id text not null, entity_type text not null, entity_id uuid not null,
  provider text not null check(provider in ('nas', 'sharepoint', 'local')), storage_key text not null,
  file_name text not null, media_type text not null, size_bytes numeric(20,0) not null check(size_bytes >= 0),
  checksum_sha256 text not null check(checksum_sha256 ~ '^[0-9a-f]{64}$'),
  status text not null default 'active' check(status in ('active', 'quarantined', 'deleted')),
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(provider, storage_key)
);
create index if not exists attachments_owner_idx on public.attachments(module_id, entity_type, entity_id);

alter table public.audit_logs add column if not exists request_id text;
alter table public.audit_logs add column if not exists before jsonb;
alter table public.audit_logs add column if not exists after jsonb;
update public.audit_logs set request_id = 'legacy:' || id::text where request_id is null;
alter table public.audit_logs alter column request_id set not null;
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id, created_at desc);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(), event_type text not null, event_version integer not null check(event_version > 0),
  actor_id uuid, owner_id uuid, team_id uuid references public.teams(id) on delete set null,
  module_id text not null, entity_type text not null, entity_id uuid not null,
  building_id uuid references public.buildings(id) on delete set null, occurred_at timestamptz not null,
  source_system text not null, source_event_id text not null, correlation_id text not null, payload jsonb not null,
  created_at timestamptz not null default now(), unique(source_system, source_event_id)
);
create index if not exists activity_events_timeline_idx on public.activity_events(occurred_at desc, id);
create index if not exists activity_events_owner_idx on public.activity_events(owner_id, occurred_at desc);

create table if not exists public.outbox_messages (
  id uuid primary key default gen_random_uuid(), topic text not null, idempotency_key text not null unique,
  aggregate_type text not null, aggregate_id uuid not null, payload jsonb not null,
  available_at timestamptz not null default now(), published_at timestamptz,
  attempt_count integer not null default 0 check(attempt_count >= 0), last_error text, created_at timestamptz not null default now()
);
create index if not exists outbox_messages_pending_idx on public.outbox_messages(published_at, available_at) where published_at is null;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(), recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null, title text not null, body text, href text,
  priority text not null default 'normal' check(priority in ('low', 'normal', 'high', 'urgent')),
  deduplication_key text, read_at timestamptz, created_at timestamptz not null default now()
);
create unique index if not exists notifications_dedupe_idx on public.notifications(recipient_id, deduplication_key) where deduplication_key is not null;
create index if not exists notifications_inbox_idx on public.notifications(recipient_id, read_at, created_at desc);

insert into public.permissions(code, module_id, resource, action, description) values
  ('core.profile.read','core','profile','read','Read profiles'),
  ('core.profile.update','core','profile','update','Update profiles'),
  ('core.team.read','core','team','read','Read teams'),
  ('core.team.manage','core','team','manage','Manage teams'),
  ('core.role.manage','core','role','manage','Manage access'),
  ('core.audit.read','core','audit','read','Read audit records'),
  ('work.task.read','work','task','read','Read work tasks'),
  ('work.task.manage','work','task','manage','Manage work tasks'),
  ('work.manual_entry.create','work','manual_entry','create','Record off-system work'),
  ('building.record.read','building','record','read','Read buildings'),
  ('building.record.create','building','record','create','Create buildings'),
  ('building.record.update','building','record','update','Update buildings'),
  ('building.attachment.read','building','attachment','read','Read building files'),
  ('building.attachment.upload','building','attachment','upload','Upload building files'),
  ('guarantee.case.read','guarantee','case','read','Read guarantee cases'),
  ('guarantee.case.manage','guarantee','case','manage','Manage guarantee cases'),
  ('activity.event.read','activity','event','read','Read activity events'),
  ('notification.inbox.read','notification','inbox','read','Read own notifications'),
  ('notification.inbox.update','notification','inbox','update','Update own notifications')
on conflict(code) do update set description = excluded.description;

insert into public.roles(code, name, description, is_system) values
  ('platform_admin','Platform administrator','All platform operations',true),
  ('operations_manager','Operations manager','Operational team management',true),
  ('permission_specialist','Permission specialist','Building and permission operations',true),
  ('sales_operator','Sales operator','Sales work operations',true),
  ('viewer','Viewer','Read-only access',true)
on conflict(code) do update set name = excluded.name, description = excluded.description;

-- System role policy is explicit and repeatable. User assignment remains an administrator action.
insert into public.role_permissions(role_id, permission_code)
select r.id, p.code from public.roles r cross join public.permissions p
where r.code = 'platform_admin'
on conflict do nothing;
insert into public.role_permissions(role_id, permission_code)
select r.id, p.code from public.roles r join public.permissions p on p.action = 'read'
where r.code = 'viewer'
on conflict do nothing;
insert into public.role_permissions(role_id, permission_code)
select r.id, p.code from public.roles r join public.permissions p on p.code in (
  'work.task.read','work.task.manage','work.manual_entry.create','building.record.read','building.attachment.read',
  'guarantee.case.read','guarantee.case.manage','activity.event.read','notification.inbox.read','notification.inbox.update'
)
where r.code = 'operations_manager'
on conflict do nothing;
insert into public.role_permissions(role_id, permission_code)
select r.id, p.code from public.roles r join public.permissions p on p.module_id in ('building','guarantee','activity','notification')
where r.code = 'permission_specialist'
on conflict do nothing;
insert into public.role_permissions(role_id, permission_code)
select r.id, p.code from public.roles r join public.permissions p on p.code in (
  'work.task.read','work.manual_entry.create','building.record.read','activity.event.read','notification.inbox.read','notification.inbox.update'
)
where r.code = 'sales_operator'
on conflict do nothing;

create or replace function public.grant_new_permission_to_platform_admin() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.role_permissions(role_id,permission_code)
  select id,new.code from public.roles where code='platform_admin'
  on conflict do nothing;
  return new;
end $$;
drop trigger if exists permissions_platform_admin_grant on public.permissions;
create trigger permissions_platform_admin_grant after insert on public.permissions for each row execute function public.grant_new_permission_to_platform_admin();

create or replace function public.current_platform_user_id() returns uuid
language sql stable as $$
  select nullif(current_setting('app.user_id', true), '')::uuid;
$$;

create or replace function public.has_scoped_permission(requested_permission text, resource_owner uuid default null, resource_team uuid default null)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from user_role_assignments ura
    join role_permissions rp on rp.role_id = ura.role_id and rp.permission_code = requested_permission
    join data_scope_grants dsg on dsg.assignment_id = ura.id and (dsg.permission_code is null or dsg.permission_code = requested_permission)
    where ura.user_id = current_platform_user_id()
      and ura.valid_from <= now() and (ura.valid_until is null or ura.valid_until > now())
      and (
        dsg.scope_type = 'ALL'
        or (dsg.scope_type = 'OWN' and resource_owner = ura.user_id)
        or (dsg.scope_type = 'SELECTED_TEAMS' and resource_team = dsg.selected_team_id)
        or (dsg.scope_type = 'TEAM' and resource_team is not null and exists (
          select 1 from user_teams ut where ut.user_id = ura.user_id and ut.team_id = resource_team
        ))
      )
  );
$$;
revoke all on function public.has_scoped_permission(text, uuid, uuid) from public;

create or replace function public.reject_immutable_change() returns trigger language plpgsql as $$
begin raise exception '% is append-only', tg_table_name; end;
$$;
drop trigger if exists audit_logs_immutable on public.audit_logs;
create trigger audit_logs_immutable before update or delete on public.audit_logs for each row execute function public.reject_immutable_change();
drop trigger if exists activity_events_immutable on public.activity_events;
create trigger activity_events_immutable before update or delete on public.activity_events for each row execute function public.reject_immutable_change();

alter table public.teams enable row level security;
alter table public.user_teams enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_role_assignments enable row level security;
alter table public.data_scope_grants enable row level security;
alter table public.buildings enable row level security;
alter table public.building_aliases enable row level security;
alter table public.building_source_mappings enable row level security;
alter table public.building_contacts enable row level security;
alter table public.building_condition_versions enable row level security;
alter table public.attachments enable row level security;
alter table public.activity_events enable row level security;
alter table public.outbox_messages enable row level security;
alter table public.notifications enable row level security;

drop policy if exists buildings_scoped_select on public.buildings;
create policy buildings_scoped_select on public.buildings for select
using(public.has_scoped_permission('building.record.read', null, owner_team_id));
drop policy if exists activity_events_scoped_select on public.activity_events;
create policy activity_events_scoped_select on public.activity_events for select
using(public.has_scoped_permission('activity.event.read', owner_id, team_id));
drop policy if exists notifications_own_select on public.notifications;
create policy notifications_own_select on public.notifications for select using(recipient_id = public.current_platform_user_id());
drop policy if exists notifications_own_update on public.notifications;
create policy notifications_own_update on public.notifications for update
using(recipient_id = public.current_platform_user_id()) with check(recipient_id = public.current_platform_user_id());

comment on function public.has_scoped_permission is 'Canonical deny-by-default action + row scope evaluator for PostgreSQL RLS.';
comment on table public.activity_events is 'Immutable business facts; corrections are new linked events, never edits.';
comment on table public.audit_logs is 'Append-only security and material-change evidence; distinct from activity events.';
