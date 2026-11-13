-- New module, disabled for ordinary users until explicitly enabled in Core Admin.
-- No existing records, grants or identities are changed. PostgreSQL JSONB stores
-- validated EPSG:4326 geometry; the portable sampled algorithm needs no extension.
create table public.pout_datasets (
  id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 200),
  kind text not null check(kind in ('pea','ufm','road','building','sites')),
  owner_id uuid not null references public.profiles(id), team_id uuid references public.teams(id),
  active_version_id uuid, version integer not null default 1 check(version > 0), created_at timestamptz not null default now(), unique(owner_id,name,kind)
);
create table public.pout_versions (
  id uuid primary key default gen_random_uuid(), dataset_id uuid not null references public.pout_datasets(id),
  checksum text not null check(checksum ~ '^[a-f0-9]{64}$'), filename text not null,
  state text not null default 'staging' check(state in ('staging','published','archived')),
  baseline_version_id uuid, report jsonb not null, created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(), unique nulls not distinct(dataset_id,checksum,baseline_version_id), unique(dataset_id,id)
);
alter table public.pout_datasets add constraint pout_active_version_fk foreign key (id,active_version_id) references public.pout_versions(dataset_id,id) deferrable initially deferred;
create table public.pout_rows (
  version_id uuid not null references public.pout_versions(id), source_key text not null,
  data jsonb not null, primary key(version_id,source_key)
);
create index pout_rows_province on public.pout_rows(version_id,(data->>'province'));
create index pout_rows_name on public.pout_rows(version_id,(data->>'name'));
create table public.pout_private_rows (
  version_id uuid not null, source_key text not null, data jsonb not null,
  primary key(version_id,source_key), foreign key(version_id,source_key) references public.pout_rows(version_id,source_key)
);
create table public.pout_source_files (
  version_id uuid primary key references public.pout_versions(id), contents bytea not null check(octet_length(contents) <= 104857600)
);
create table public.pout_site_edits (
  dataset_id uuid not null references public.pout_datasets(id), source_key text not null, data jsonb not null,
  base_version_id uuid not null references public.pout_versions(id),
  version integer not null default 1, archived boolean not null default false,
  changed_by uuid not null references public.profiles(id), changed_at timestamptz not null default now(), primary key(dataset_id,source_key,base_version_id)
);
create table public.pout_comments (
  id uuid primary key default gen_random_uuid(), dataset_id uuid not null references public.pout_datasets(id), source_key text not null,
  body text not null check(length(body) between 1 and 2000), actor_id uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create table public.pout_site_finance_edits (
  dataset_id uuid not null,source_key text not null,base_version_id uuid not null,opex numeric(18,2),
  history jsonb not null default '[]'::jsonb,changed_by uuid not null references public.profiles(id),
  primary key(dataset_id,source_key,base_version_id),check(opex is null or opex>=0),
  foreign key(dataset_id,source_key,base_version_id) references public.pout_site_edits(dataset_id,source_key,base_version_id)
);
create index pout_comments_site on public.pout_comments(dataset_id,source_key,created_at);
create table public.pout_comment_reads (
  user_id uuid not null references public.profiles(id), dataset_id uuid not null references public.pout_datasets(id),
  seen_at timestamptz not null default now(), primary key(user_id,dataset_id)
);
create table public.pout_formulas (
  id uuid primary key default gen_random_uuid(), parameters jsonb not null, created_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create table public.pout_projects (
  id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 1 and 200),
  owner_id uuid not null references public.profiles(id), team_id uuid references public.teams(id),
  snapshot jsonb not null, archived boolean not null default false, version integer not null default 1,
  idempotency_key uuid not null, created_at timestamptz not null default now(), unique(owner_id,idempotency_key)
);
create index pout_projects_owner on public.pout_projects(owner_id,created_at desc);

create function public.pout_access(permission text, owner_id uuid default null, team_id uuid default null)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
  select exists(select 1 from public.profiles p where p.id=public.current_platform_user_id() and p.status='active')
    and (public.is_platform_admin() or exists(select 1 from public.core_module_settings where module_id='permission-out' and enabled))
    and public.has_scoped_permission('permission_out.module.view',owner_id,team_id)
    and public.has_scoped_permission(permission,owner_id,team_id)
$$;
revoke all on function public.pout_access(text,uuid,uuid) from public;
grant execute on function public.pout_access(text,uuid,uuid) to permission_core_runtime;

-- Versioned rows and original source files cannot be modified after insertion.
create function public.pout_immutable() returns trigger language plpgsql as $$
begin raise exception 'Permission Out history is immutable' using errcode='23514'; end $$;
create trigger pout_rows_immutable before update or delete on public.pout_rows for each row execute function public.pout_immutable();
create trigger pout_private_immutable before update or delete on public.pout_private_rows for each row execute function public.pout_immutable();
create trigger pout_files_immutable before update or delete on public.pout_source_files for each row execute function public.pout_immutable();
create trigger pout_formulas_immutable before update or delete on public.pout_formulas for each row execute function public.pout_immutable();
create trigger pout_comments_immutable before update or delete on public.pout_comments for each row execute function public.pout_immutable();
create function public.pout_guard_version() returns trigger language plpgsql as $$
begin
  if tg_op='DELETE' or (to_jsonb(new)-'state') is distinct from (to_jsonb(old)-'state') then raise exception 'Permission Out versions are immutable' using errcode='23514'; end if;
  return new;
end $$;
create trigger pout_version_guard before update or delete on public.pout_versions for each row execute function public.pout_guard_version();
create function public.pout_guard_project() returns trigger language plpgsql as $$
begin
  if tg_op='DELETE' or (to_jsonb(new)-array['archived','version']) is distinct from (to_jsonb(old)-array['archived','version']) or new.version<>old.version+1 then raise exception 'Permission Out snapshots are immutable' using errcode='23514'; end if;
  return new;
end $$;
create trigger pout_project_guard before update or delete on public.pout_projects for each row execute function public.pout_guard_project();

do $$ declare name text; begin
  foreach name in array array['pout_datasets','pout_versions','pout_rows','pout_private_rows','pout_source_files','pout_site_edits','pout_site_finance_edits','pout_comments','pout_comment_reads','pout_formulas','pout_projects'] loop
    execute format('alter table public.%I enable row level security',name);
    execute format('alter table public.%I force row level security',name);
  end loop;
end $$;
grant select,insert,update on public.pout_datasets,public.pout_versions,public.pout_site_edits,public.pout_projects,public.pout_comment_reads to permission_core_runtime;
grant select,insert,update on public.pout_site_finance_edits to permission_core_runtime;
grant select,insert on public.pout_rows,public.pout_private_rows,public.pout_source_files,public.pout_comments,public.pout_formulas to permission_core_runtime;
create policy pout_dataset_read on public.pout_datasets for select to permission_core_runtime using(public.pout_access('permission_out.module.view',owner_id,team_id));
create policy pout_dataset_insert on public.pout_datasets for insert to permission_core_runtime with check(public.pout_access('permission_out.dataset.manage') and owner_id=public.current_platform_user_id());
create policy pout_dataset_update on public.pout_datasets for update to permission_core_runtime using(public.pout_access('permission_out.dataset.publish')) with check(public.pout_access('permission_out.dataset.publish'));
create policy pout_version_read on public.pout_versions for select to permission_core_runtime using(exists(select 1 from public.pout_datasets d where d.id=dataset_id and (d.active_version_id=pout_versions.id or public.pout_access('permission_out.dataset.manage'))));
create policy pout_version_insert on public.pout_versions for insert to permission_core_runtime with check(public.pout_access('permission_out.dataset.manage') and created_by=public.current_platform_user_id());
create policy pout_version_update on public.pout_versions for update to permission_core_runtime using(public.pout_access('permission_out.dataset.publish')) with check(public.pout_access('permission_out.dataset.publish'));
create policy pout_rows_read on public.pout_rows for select to permission_core_runtime using(exists(select 1 from public.pout_versions v where v.id=version_id));
create policy pout_rows_insert on public.pout_rows for insert to permission_core_runtime with check(public.pout_access('permission_out.dataset.manage') and exists(select 1 from public.pout_versions v where v.id=version_id and v.state='staging'));
create policy pout_private_read on public.pout_private_rows for select to permission_core_runtime using(public.pout_access('permission_out.opex.read') and exists(select 1 from public.pout_versions v where v.id=version_id));
create policy pout_private_insert on public.pout_private_rows for insert to permission_core_runtime with check(public.pout_access('permission_out.dataset.manage') and exists(select 1 from public.pout_versions v where v.id=version_id and v.state='staging'));
create policy pout_file_read on public.pout_source_files for select to permission_core_runtime using(public.pout_access('permission_out.dataset.manage') and public.pout_access('permission_out.opex.read'));
create policy pout_file_insert on public.pout_source_files for insert to permission_core_runtime with check(public.pout_access('permission_out.dataset.manage'));
create policy pout_edits_read on public.pout_site_edits for select to permission_core_runtime using(exists(select 1 from public.pout_datasets d where d.id=dataset_id and public.pout_access('permission_out.site.read',d.owner_id,d.team_id)));
create policy pout_edits_write on public.pout_site_edits for all to permission_core_runtime using(exists(select 1 from public.pout_datasets d where d.id=dataset_id and public.pout_access('permission_out.site.update',d.owner_id,d.team_id))) with check(changed_by=public.current_platform_user_id() and exists(select 1 from public.pout_datasets d where d.id=dataset_id and public.pout_access('permission_out.site.update',d.owner_id,d.team_id)));
create policy pout_finance_read on public.pout_site_finance_edits for select to permission_core_runtime using(public.pout_access('permission_out.opex.read'));
create policy pout_finance_insert on public.pout_site_finance_edits for insert to permission_core_runtime with check(changed_by=public.current_platform_user_id() and public.pout_access('permission_out.opex.read') and exists(select 1 from public.pout_datasets d where d.id=dataset_id and public.pout_access('permission_out.site.update',d.owner_id,d.team_id)));
create policy pout_finance_update on public.pout_site_finance_edits for update to permission_core_runtime using(public.pout_access('permission_out.opex.read')) with check(changed_by=public.current_platform_user_id() and public.pout_access('permission_out.opex.read') and exists(select 1 from public.pout_datasets d where d.id=dataset_id and public.pout_access('permission_out.site.update',d.owner_id,d.team_id)));
create policy pout_comments_read on public.pout_comments for select to permission_core_runtime using(exists(select 1 from public.pout_datasets d where d.id=dataset_id and public.pout_access('permission_out.site.read',d.owner_id,d.team_id)));
create policy pout_comments_insert on public.pout_comments for insert to permission_core_runtime with check(actor_id=public.current_platform_user_id() and exists(select 1 from public.pout_datasets d where d.id=dataset_id and public.pout_access('permission_out.comment.create',d.owner_id,d.team_id)));
create policy pout_reads_own on public.pout_comment_reads for all to permission_core_runtime using(user_id=public.current_platform_user_id() and public.pout_access('permission_out.module.view',user_id)) with check(user_id=public.current_platform_user_id() and public.pout_access('permission_out.module.view',user_id));
create policy pout_formula_read on public.pout_formulas for select to permission_core_runtime using(public.pout_access('permission_out.module.view',public.current_platform_user_id()) or exists(select 1 from public.teams t where public.pout_access('permission_out.module.view',public.current_platform_user_id(),t.id)));
create policy pout_formula_insert on public.pout_formulas for insert to permission_core_runtime with check(public.pout_access('permission_out.formula.manage') and created_by=public.current_platform_user_id());
create policy pout_project_read on public.pout_projects for select to permission_core_runtime using(public.pout_access('permission_out.module.view',owner_id,team_id));
create policy pout_project_insert on public.pout_projects for insert to permission_core_runtime with check(owner_id=public.current_platform_user_id() and public.pout_access('permission_out.project.manage',owner_id,team_id));
create policy pout_project_update on public.pout_projects for update to permission_core_runtime using(public.pout_access('permission_out.project.manage',owner_id,team_id)) with check(public.pout_access('permission_out.project.manage',owner_id,team_id));

-- Catalog only; no automatic role assignments or module activation.
insert into public.permissions(code,module_id,resource,action,description)
select 'permission_out.'||code,'permission-out',split_part(code,'.',1),split_part(code,'.',2),label from (values
  ('module.view','เข้าใช้งานวิเคราะห์เส้นทางและไซต์','normal','["OWN","TEAM","SELECTED_TEAMS","ALL"]'),
  ('project.manage','สร้างและจัดการโครงการวิเคราะห์','normal','["OWN","TEAM","SELECTED_TEAMS","ALL"]'),
  ('analysis.run','วิเคราะห์เปรียบเทียบเส้นทาง','normal','["OWN","TEAM","SELECTED_TEAMS","ALL"]'),
  ('site.read','ดูข้อมูลไซต์','normal','["OWN","TEAM","SELECTED_TEAMS","ALL"]'),
  ('site.update','แก้ไขข้อมูลไซต์','sensitive','["OWN","TEAM","SELECTED_TEAMS","ALL"]'),
  ('comment.create','แสดงความคิดเห็นของไซต์','normal','["OWN","TEAM","SELECTED_TEAMS","ALL"]'),
  ('report.export','ส่งออกรายงานและเส้นทาง','sensitive','["OWN","TEAM","SELECTED_TEAMS","ALL"]'),
  ('opex.read','ดูค่าใช้จ่าย OPEX ของไซต์','sensitive','["ALL"]'),
  ('dataset.manage','นำเข้าชุดข้อมูลกลาง','administrative','["ALL"]'),
  ('dataset.publish','เผยแพร่และย้อนกลับชุดข้อมูล','administrative','["ALL"]'),
  ('formula.manage','จัดการสูตรค่าพาดสาย','administrative','["ALL"]')
) as c(code,label,risk,scopes) on conflict(code) do nothing;
