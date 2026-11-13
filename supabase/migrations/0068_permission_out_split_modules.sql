-- Split MOD 1 / MOD 2 registration and authorization. Preserve all source data.
-- Catalog only: no settings, grant copying, automatic activation or account changes.
insert into public.permissions(code,module_id,resource,action,description)
select 'site_facility.'||code,'site-facility',split_part(code,'.',1),split_part(code,'.',2),label from (values
 ('module.view','เข้าใช้งาน Site Facility'),('site.read','ดูข้อมูลไซต์'),('site.update','แก้ไขข้อมูลไซต์'),
 ('comment.create','แสดงความคิดเห็นของไซต์'),('report.export','ส่งออกรายงานไซต์'),('opex.read','ดู OPEX ของไซต์'),
 ('dataset.manage','นำเข้าชุดข้อมูลไซต์'),('dataset.publish','เผยแพร่ชุดข้อมูลไซต์')
) as c(code,label) on conflict(code) do nothing;

create function public.pout_domain_access(domain text,permission text,owner_id uuid default null,team_id uuid default null)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select domain in ('permission-out','site-facility')
 and exists(select 1 from public.profiles p where p.id=public.current_platform_user_id() and p.status='active')
 and (public.is_platform_admin() or exists(select 1 from public.core_module_settings where module_id=domain and enabled))
 and public.has_scoped_permission((case when domain='site-facility' then 'site_facility.' else 'permission_out.' end)||'module.view',owner_id,team_id)
 and public.has_scoped_permission((case when domain='site-facility' then 'site_facility.' else 'permission_out.' end)||permission,owner_id,team_id)
$$;
revoke all on function public.pout_domain_access(text,text,uuid,uuid) from public;
grant execute on function public.pout_domain_access(text,text,uuid,uuid) to permission_core_runtime;

-- Legacy internal service labels for site-only actions resolve exclusively to
-- the new module's capabilities. Old route/site grants do not confer site access.
create or replace function public.pout_access(permission text,owner_id uuid default null,team_id uuid default null)
returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select case
 when permission like 'site_facility.%' then public.pout_domain_access('site-facility',substr(permission,15),owner_id,team_id)
 when permission in ('permission_out.site.read','permission_out.site.update','permission_out.comment.create','permission_out.opex.read') then public.pout_domain_access('site-facility',substr(permission,16),owner_id,team_id)
 when permission like 'permission_out.%' then public.pout_domain_access('permission-out',substr(permission,16),owner_id,team_id)
 else false end
$$;

drop policy pout_dataset_read on public.pout_datasets;
create policy pout_dataset_read on public.pout_datasets for select to permission_core_runtime using(
 public.pout_domain_access(case when kind='sites' then 'site-facility' else 'permission-out' end,'module.view',owner_id,team_id));
drop policy pout_dataset_insert on public.pout_datasets;
create policy pout_dataset_insert on public.pout_datasets for insert to permission_core_runtime with check(owner_id=public.current_platform_user_id() and public.pout_domain_access(case when kind='sites' then 'site-facility' else 'permission-out' end,'dataset.manage'));
drop policy pout_dataset_update on public.pout_datasets;
create policy pout_dataset_update on public.pout_datasets for update to permission_core_runtime using(public.pout_domain_access(case when kind='sites' then 'site-facility' else 'permission-out' end,'dataset.publish')) with check(public.pout_domain_access(case when kind='sites' then 'site-facility' else 'permission-out' end,'dataset.publish'));

create function public.pout_dataset_permission(dataset uuid,permission text) returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select coalesce((select public.pout_domain_access(case when d.kind='sites' then 'site-facility' else 'permission-out' end,permission,d.owner_id,d.team_id) from public.pout_datasets d where d.id=dataset),false)
$$;
create function public.pout_version_permission(version uuid,permission text) returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select coalesce((select public.pout_dataset_permission(v.dataset_id,permission) from public.pout_versions v where v.id=version),false)
$$;
revoke all on function public.pout_dataset_permission(uuid,text),public.pout_version_permission(uuid,text) from public;
grant execute on function public.pout_dataset_permission(uuid,text),public.pout_version_permission(uuid,text) to permission_core_runtime;

drop policy pout_version_read on public.pout_versions;
create policy pout_version_read on public.pout_versions for select to permission_core_runtime using(exists(select 1 from public.pout_datasets d where d.id=dataset_id and (d.active_version_id=pout_versions.id or public.pout_dataset_permission(d.id,'dataset.manage'))));
drop policy pout_version_insert on public.pout_versions;
create policy pout_version_insert on public.pout_versions for insert to permission_core_runtime with check(public.pout_dataset_permission(dataset_id,'dataset.manage') and created_by=public.current_platform_user_id());
drop policy pout_version_update on public.pout_versions;
create policy pout_version_update on public.pout_versions for update to permission_core_runtime using(public.pout_dataset_permission(dataset_id,'dataset.publish')) with check(public.pout_dataset_permission(dataset_id,'dataset.publish'));
drop policy pout_rows_insert on public.pout_rows;
create policy pout_rows_insert on public.pout_rows for insert to permission_core_runtime with check(public.pout_version_permission(version_id,'dataset.manage') and exists(select 1 from public.pout_versions v where v.id=version_id and v.state='staging'));
drop policy pout_rows_read on public.pout_rows;
create policy pout_rows_read on public.pout_rows for select to permission_core_runtime using(exists(select 1 from public.pout_versions v join public.pout_datasets d on d.id=v.dataset_id where v.id=version_id and (d.kind<>'sites' or public.pout_access('site_facility.site.read',d.owner_id,d.team_id) or public.pout_access('site_facility.dataset.manage'))));
drop policy pout_private_read on public.pout_private_rows;
create policy pout_private_read on public.pout_private_rows for select to permission_core_runtime using(exists(select 1 from public.pout_versions v join public.pout_datasets d on d.id=v.dataset_id where v.id=version_id and (case when d.kind='sites' then public.pout_access('site_facility.opex.read') else public.pout_access('permission_out.dataset.manage') end)));
drop policy pout_private_insert on public.pout_private_rows;
create policy pout_private_insert on public.pout_private_rows for insert to permission_core_runtime with check(public.pout_version_permission(version_id,'dataset.manage') and exists(select 1 from public.pout_versions v where v.id=version_id and v.state='staging'));
drop policy pout_file_read on public.pout_source_files;
create policy pout_file_read on public.pout_source_files for select to permission_core_runtime using(public.pout_version_permission(version_id,'dataset.manage') and exists(select 1 from public.pout_versions v join public.pout_datasets d on d.id=v.dataset_id where v.id=version_id and (d.kind<>'sites' or public.pout_access('site_facility.opex.read'))));
drop policy pout_file_insert on public.pout_source_files;
create policy pout_file_insert on public.pout_source_files for insert to permission_core_runtime with check(public.pout_version_permission(version_id,'dataset.manage'));
drop policy pout_reads_own on public.pout_comment_reads;
create policy pout_reads_own on public.pout_comment_reads for all to permission_core_runtime using(user_id=public.current_platform_user_id() and public.pout_access('site_facility.module.view',user_id)) with check(user_id=public.current_platform_user_id() and public.pout_access('site_facility.module.view',user_id));

create function public.pout_guard_dataset_identity() returns trigger language plpgsql as $$
begin
 if (to_jsonb(new)-array['active_version_id','version']) is distinct from (to_jsonb(old)-array['active_version_id','version']) then raise exception 'Permission Out dataset identity is immutable' using errcode='23514'; end if;
 return new;
end $$;
create trigger pout_dataset_identity before update on public.pout_datasets for each row execute function public.pout_guard_dataset_identity();
