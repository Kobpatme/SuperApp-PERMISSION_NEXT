-- Additive module schema. Apply to isolated fixtures first; no real users/grants/data.
create table public.duct_rental_requests (
  id uuid primary key default gen_random_uuid(), source_id text unique,
  code text not null unique, owner_id uuid not null references public.profiles(id), team_id uuid references public.teams(id),
  business_date date not null default (now() at time zone 'Asia/Bangkok')::date,
  project_name text not null, route_name text not null, owner_duct text not null, service_center text not null,
  province text not null, district text not null, request_type text not null default 'NEW' check(request_type in ('NEW','EXTENSION','CANCELLATION')),
  phase text not null default 'DESIGN' check(phase in ('DESIGN','DRAFTSMAN','PERMISSION_1','INSTALL','DRAFTSMAN_2','PERMISSION_2','3RD_PARTY_1','PERMISSION_3','3RD_PARTY_2','COMPLETE')),
  phase_statuses jsonb not null default '{"DESIGN":"pending","DRAFTSMAN":"pending","PERMISSION_1":"pending","INSTALL":"pending","DRAFTSMAN_2":"pending","PERMISSION_2":"pending","3RD_PARTY_1":"pending","PERMISSION_3":"pending","3RD_PARTY_2":"pending","COMPLETE":"pending"}',
  design jsonb not null, install jsonb, as_built jsonb, guarantee jsonb,
  missing_docs text not null default '', cancelled_at date, archived_at timestamptz,
  version integer not null default 1 check(version>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index duct_rental_request_scope_idx on public.duct_rental_requests(owner_id,team_id,phase,updated_at desc,id);
create index duct_rental_request_filter_idx on public.duct_rental_requests(service_center,request_type,phase) where archived_at is null;

create table public.duct_rental_rates (
  request_id uuid primary key references public.duct_rental_requests(id),
  monthly_fee numeric(12,2) not null default 0, yearly_fee numeric(12,2) not null default 0,
  contract_start date, contract_end date, guarantee_amount numeric(12,2), updated_at timestamptz not null default now()
);
create table public.duct_rental_documents (
  id uuid primary key default gen_random_uuid(), request_id uuid not null references public.duct_rental_requests(id),
  phase text not null, file_type text not null, name text not null, media_type text not null,
  size_bytes integer not null check(size_bytes>0 and size_bytes<=26214400), checksum_sha256 text not null check(checksum_sha256 ~ '^[0-9a-f]{64}$'),
  storage_key text not null unique check(storage_key !~ '(^/|\\|\.\.)'),
  document_version integer not null default 1 check(document_version>0), supersedes_id uuid references public.duct_rental_documents(id),
  signed_task_id uuid, created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), archived_at timestamptz
);
create index duct_rental_document_request_idx on public.duct_rental_documents(request_id,phase,file_type,created_at);
create unique index duct_rental_document_successor_idx on public.duct_rental_documents(supersedes_id) where supersedes_id is not null;
create table public.duct_rental_sign_tasks (
  id uuid primary key default gen_random_uuid(), request_id uuid not null references public.duct_rental_requests(id),
  document_id uuid not null references public.duct_rental_documents(id), document_version integer not null check(document_version>0),
  assignee_id uuid not null references public.profiles(id), assigned_by uuid not null references public.profiles(id),
  status text not null default 'pending' check(status in ('pending','signed','revoked')),
  due_at timestamptz not null, signed_document_id uuid references public.duct_rental_documents(id), signed_at timestamptz,
  snapshot jsonb not null, version integer not null default 1, created_at timestamptz not null default now(),
  check((status='signed')=(signed_document_id is not null and signed_at is not null))
);
alter table public.duct_rental_documents add constraint duct_rental_document_signed_task_fk foreign key(signed_task_id) references public.duct_rental_sign_tasks(id);
create unique index duct_rental_open_sign_task_idx on public.duct_rental_sign_tasks(request_id,assignee_id) where status='pending';
create index duct_rental_sign_inbox_idx on public.duct_rental_sign_tasks(assignee_id,status,due_at);
create table public.duct_rental_signature_assets (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id),
  name text not null, storage_key text not null unique check(storage_key !~ '(^/|\\|\.\.)'),
  checksum_sha256 text not null check(checksum_sha256 ~ '^[0-9a-f]{64}$'), size_bytes integer not null check(size_bytes>0 and size_bytes<=2097152),
  is_default boolean not null default false, archived_at timestamptz, created_at timestamptz not null default now()
);
create unique index duct_rental_default_signature_idx on public.duct_rental_signature_assets(owner_id) where is_default and archived_at is null;
create table public.duct_rental_renewals (
  id uuid primary key default gen_random_uuid(), source_id text unique, year integer not null unique check(year between 2000 and 9999),
  owner_id uuid not null references public.profiles(id), team_id uuid references public.teams(id),
  status text not null default 'draft' check(status in ('draft','sent_to_3rdparty','memo_preparing','provider_confirmed','contracted')),
  total_yearly_cost numeric(14,2) not null default 0, contract_document_id uuid references public.duct_rental_documents(id),
  version integer not null default 1 check(version>0), archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.duct_rental_renewal_routes (
  id uuid primary key default gen_random_uuid(), renewal_id uuid not null references public.duct_rental_renewals(id),
  request_id uuid not null references public.duct_rental_requests(id), snapshot jsonb not null,
  monthly_fee numeric(12,2) not null default 0, yearly_fee numeric(12,2) not null default 0,
  review_status text not null default 'pending' check(review_status in ('pending','keep','drop')), review_notes text not null default '',
  reviewed_by uuid references public.profiles(id), reviewed_at timestamptz, unique(renewal_id,request_id)
);
create index duct_rental_renewal_scope_idx on public.duct_rental_renewals(owner_id,team_id,status);
create table public.duct_rental_cancellations (
  id uuid primary key default gen_random_uuid(), source_id text unique, request_id uuid not null references public.duct_rental_requests(id),
  owner_id uuid not null references public.profiles(id), team_id uuid references public.teams(id), snapshot jsonb not null,
  status text not null default 'cancel_initiated' check(status in ('cancel_initiated','in_progress','tracking','completed','rejected')),
  effective_date date not null, reason text not null, notes text not null default '',
  monthly_fee numeric(12,2) not null default 0, yearly_fee numeric(12,2) not null default 0,
  completed_by uuid references public.profiles(id), completed_at timestamptz, archived_at timestamptz,
  version integer not null default 1 check(version>0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check((status='completed')=(completed_by is not null and completed_at is not null))
);
create unique index duct_rental_open_cancellation_idx on public.duct_rental_cancellations(request_id) where status not in ('completed','rejected') and archived_at is null;
create index duct_rental_cancellation_scope_idx on public.duct_rental_cancellations(owner_id,team_id,status);
create table public.duct_rental_mutation_receipts (
  actor_id uuid not null references public.profiles(id), idempotency_key uuid not null, fingerprint text not null,
  result jsonb not null, created_at timestamptz not null default now(), primary key(actor_id,idempotency_key)
);

-- Runtime login must be constrained, NOBYPASSRLS, never the table/function owner.
create function public.duct_rental_has_access(permission text, resource_owner uuid, resource_team uuid default null)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
  select exists(select 1 from public.profiles p join public.local_credentials c on c.user_id=p.id
    where p.id=public.current_platform_user_id() and p.status='active' and not c.must_change_password)
  and public.has_scoped_permission('duct_rental.module.view',resource_owner,resource_team)
  and public.has_scoped_permission(permission,resource_owner,resource_team);
$$;
revoke all on function public.duct_rental_has_access(text,uuid,uuid) from public;
create function public.duct_rental_request_access(request uuid, permission text)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
  select exists(select 1 from public.duct_rental_requests r where r.id=request
    and public.duct_rental_has_access(permission,r.owner_id,r.team_id));
$$;
revoke all on function public.duct_rental_request_access(uuid,text) from public;
create function public.duct_rental_phase_permission(phase text, action text)
returns text language sql immutable as $$ select 'duct_rental.' || case phase
  when 'DESIGN' then 'design' when 'DRAFTSMAN' then 'draftsman' when 'PERMISSION_1' then 'permission1'
  when 'INSTALL' then 'install' when 'DRAFTSMAN_2' then 'draftsman2' when 'PERMISSION_2' then 'permission2'
  when '3RD_PARTY_1' then 'thirdparty1' when 'PERMISSION_3' then 'permission3' when '3RD_PARTY_2' then 'thirdparty2'
  else 'terminal' end || '.' || action $$;
revoke all on function public.duct_rental_phase_permission(text,text) from public;
create function public.duct_rental_can_change_request(request uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
  select exists(select 1 from public.duct_rental_requests r where r.id=request and r.archived_at is null and r.cancelled_at is null
    and (public.duct_rental_has_access(public.duct_rental_phase_permission(r.phase,'accept'),r.owner_id,r.team_id)
      or public.duct_rental_has_access(public.duct_rental_phase_permission(r.phase,'submit'),r.owner_id,r.team_id)
      or public.duct_rental_has_access('duct_rental.request.update',r.owner_id,r.team_id)));
$$;
revoke all on function public.duct_rental_can_change_request(uuid) from public;
create function public.duct_rental_renewal_access(renewal uuid, permission text)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
  select exists(select 1 from public.duct_rental_renewals r where r.id=renewal and public.duct_rental_has_access(permission,r.owner_id,r.team_id));
$$;
revoke all on function public.duct_rental_renewal_access(uuid,text) from public;
create function public.duct_rental_task_access(task uuid)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
  select exists(select 1 from public.duct_rental_sign_tasks t where t.id=task and t.assignee_id=public.current_platform_user_id()
    and public.duct_rental_has_access('duct_rental.signoff.sign',t.assignee_id,null));
$$;
revoke all on function public.duct_rental_task_access(uuid) from public;

alter table public.duct_rental_requests enable row level security;
alter table public.duct_rental_requests force row level security;
create policy duct_request_read on public.duct_rental_requests for select using(public.duct_rental_has_access('duct_rental.module.view',owner_id,team_id));
create policy duct_request_create on public.duct_rental_requests for insert with check(owner_id=public.current_platform_user_id() and public.duct_rental_has_access('duct_rental.request.create',owner_id,team_id) and phase='DESIGN' and version=1);
create policy duct_request_change on public.duct_rental_requests for update using(
  public.duct_rental_can_change_request(id) or public.duct_rental_has_access('duct_rental.request.archive',owner_id,team_id)
  or public.duct_rental_has_access('duct_rental.cancellation.advance',owner_id,team_id)
) with check(public.duct_rental_has_access('duct_rental.module.view',owner_id,team_id));

alter table public.duct_rental_rates enable row level security;
alter table public.duct_rental_rates force row level security;
create policy duct_rate_read on public.duct_rental_rates for select using(public.duct_rental_request_access(request_id,'duct_rental.rate.read'));
create policy duct_rate_insert on public.duct_rental_rates for insert with check(public.duct_rental_request_access(request_id,'duct_rental.thirdparty1.submit') or public.duct_rental_request_access(request_id,'duct_rental.thirdparty2.submit'));
create policy duct_rate_update on public.duct_rental_rates for update using(public.duct_rental_request_access(request_id,'duct_rental.thirdparty1.submit') or public.duct_rental_request_access(request_id,'duct_rental.thirdparty2.submit')) with check(public.duct_rental_request_access(request_id,'duct_rental.thirdparty1.submit') or public.duct_rental_request_access(request_id,'duct_rental.thirdparty2.submit'));

alter table public.duct_rental_documents enable row level security;
alter table public.duct_rental_documents force row level security;
create policy duct_document_read on public.duct_rental_documents for select using(
 public.duct_rental_request_access(request_id,'duct_rental.document.read') or exists(select 1 from public.duct_rental_sign_tasks t where t.document_id=duct_rental_documents.id or t.signed_document_id=duct_rental_documents.id));
create policy duct_document_create on public.duct_rental_documents for insert with check(created_by=public.current_platform_user_id() and (
 (signed_task_id is null and public.duct_rental_request_access(request_id,'duct_rental.document.upload'))
 or (signed_task_id is not null and public.duct_rental_task_access(signed_task_id) and file_type='signed_nt_form'
   and exists(select 1 from public.duct_rental_sign_tasks t where t.id=duct_rental_documents.signed_task_id and t.request_id=duct_rental_documents.request_id and t.status='pending'))));
create policy duct_document_archive on public.duct_rental_documents for update using(public.duct_rental_request_access(request_id,'duct_rental.document.upload')) with check(public.duct_rental_request_access(request_id,'duct_rental.document.upload'));

alter table public.duct_rental_sign_tasks enable row level security;
alter table public.duct_rental_sign_tasks force row level security;
create policy duct_task_read on public.duct_rental_sign_tasks for select using(
 (assignee_id=public.current_platform_user_id() and public.duct_rental_has_access('duct_rental.signoff.sign',assignee_id,null))
 or public.duct_rental_request_access(request_id,'duct_rental.signoff.assign') or public.duct_rental_request_access(request_id,'duct_rental.signoff.revoke'));
create policy duct_task_assign on public.duct_rental_sign_tasks for insert with check(assigned_by=public.current_platform_user_id() and public.duct_rental_request_access(request_id,'duct_rental.signoff.assign'));
create policy duct_task_change on public.duct_rental_sign_tasks for update using(
 public.duct_rental_task_access(id) or public.duct_rental_request_access(request_id,'duct_rental.signoff.assign') or public.duct_rental_request_access(request_id,'duct_rental.signoff.revoke')
) with check(public.duct_rental_task_access(id) or public.duct_rental_request_access(request_id,'duct_rental.signoff.assign') or public.duct_rental_request_access(request_id,'duct_rental.signoff.revoke'));

alter table public.duct_rental_signature_assets enable row level security;
alter table public.duct_rental_signature_assets force row level security;
create policy duct_asset_read on public.duct_rental_signature_assets for select using(owner_id=public.current_platform_user_id() and public.duct_rental_has_access('duct_rental.signoff.sign',owner_id,null));
create policy duct_asset_create on public.duct_rental_signature_assets for insert with check(owner_id=public.current_platform_user_id() and public.duct_rental_has_access('duct_rental.signoff.sign',owner_id,null));
create policy duct_asset_change on public.duct_rental_signature_assets for update using(owner_id=public.current_platform_user_id() and public.duct_rental_has_access('duct_rental.signoff.sign',owner_id,null)) with check(owner_id=public.current_platform_user_id() and public.duct_rental_has_access('duct_rental.signoff.sign',owner_id,null));

alter table public.duct_rental_renewals enable row level security;
alter table public.duct_rental_renewals force row level security;
create policy duct_renewal_read on public.duct_rental_renewals for select using(public.duct_rental_has_access('duct_rental.rate.read',owner_id,team_id));
create policy duct_renewal_create on public.duct_rental_renewals for insert with check(owner_id=public.current_platform_user_id() and public.duct_rental_has_access('duct_rental.renewal.create',owner_id,team_id) and status='draft');
create policy duct_renewal_change on public.duct_rental_renewals for update using(
 public.duct_rental_has_access('duct_rental.renewal.archive',owner_id,team_id)
 or public.duct_rental_has_access(case status when 'draft' then 'duct_rental.renewal.review' when 'sent_to_3rdparty' then 'duct_rental.renewal.memo' when 'memo_preparing' then 'duct_rental.renewal.confirm' else 'duct_rental.renewal.contract' end,owner_id,team_id)
) with check(public.duct_rental_has_access('duct_rental.rate.read',owner_id,team_id));
alter table public.duct_rental_renewal_routes enable row level security;
alter table public.duct_rental_renewal_routes force row level security;
create policy duct_route_read on public.duct_rental_renewal_routes for select using(public.duct_rental_renewal_access(renewal_id,'duct_rental.rate.read'));
create policy duct_route_create on public.duct_rental_renewal_routes for insert with check(public.duct_rental_renewal_access(renewal_id,'duct_rental.renewal.create') and public.duct_rental_request_access(request_id,'duct_rental.rate.read'));
create policy duct_route_change on public.duct_rental_renewal_routes for update using(public.duct_rental_renewal_access(renewal_id,'duct_rental.renewal.review')) with check(public.duct_rental_renewal_access(renewal_id,'duct_rental.renewal.review'));

alter table public.duct_rental_cancellations enable row level security;
alter table public.duct_rental_cancellations force row level security;
create policy duct_cancel_read on public.duct_rental_cancellations for select using(public.duct_rental_has_access('duct_rental.rate.read',owner_id,team_id));
create policy duct_cancel_create on public.duct_rental_cancellations for insert with check(owner_id=public.current_platform_user_id() and public.duct_rental_has_access('duct_rental.cancellation.create',owner_id,team_id) and public.duct_rental_request_access(request_id,'duct_rental.cancellation.create') and status='cancel_initiated');
create policy duct_cancel_change on public.duct_rental_cancellations for update using(public.duct_rental_has_access('duct_rental.cancellation.advance',owner_id,team_id) or public.duct_rental_has_access('duct_rental.cancellation.reject',owner_id,team_id) or public.duct_rental_has_access('duct_rental.cancellation.archive',owner_id,team_id)) with check(public.duct_rental_has_access('duct_rental.rate.read',owner_id,team_id));

alter table public.duct_rental_mutation_receipts enable row level security;
alter table public.duct_rental_mutation_receipts force row level security;
create policy duct_receipt_read on public.duct_rental_mutation_receipts for select using(actor_id=public.current_platform_user_id());
create policy duct_receipt_create on public.duct_rental_mutation_receipts for insert with check(actor_id=public.current_platform_user_id());
-- No DELETE policies. Runtime roles receive only SELECT/INSERT/UPDATE as required.
