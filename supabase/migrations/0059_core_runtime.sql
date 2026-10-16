-- Owner approved separating Core's trusted backend service from the DDL account.
-- Core enforces end-user RBAC/scopes in server services (including login before
-- an identity exists). This group replaces the former table-owner connection;
-- it is NOT a per-user SQL login and must never be granted to Car/Duct logins.
-- No business grants, module flags, records or existing policies are changed.
do $$ begin
  if not exists(select 1 from pg_roles where rolname='permission_core_runtime') then
    create role permission_core_runtime nologin noinherit nosuperuser nocreatedb nocreaterole nobypassrls;
  end if;
  if exists(select 1 from pg_roles where rolname='permission_core_runtime'
    and (rolcanlogin or rolsuper or rolcreatedb or rolcreaterole or rolbypassrls))
    or exists(select 1 from pg_auth_members m join pg_roles r on r.oid=m.member where r.rolname='permission_core_runtime') then
    raise exception 'Unsafe Core runtime group';
  end if;
end $$;

grant usage on schema public to permission_core_runtime;
-- PostgreSQL 16 defaults to this boundary; retain it on an upgraded cluster too.
-- The dedicated migration operator remains the schema owner.
revoke create on schema public from public;
grant execute on function public.current_platform_user_id(),public.has_scoped_permission(text,uuid,uuid),public.is_platform_admin() to permission_core_runtime;
-- Older shared event INSERT policies reference these boolean predicates.
-- Allow evaluating them without granting calendar projections or module DML.
grant execute on function public.car_booking_has_access(text,uuid),public.car_booking_can_manage_access() to permission_core_runtime;

-- Explicit allowlist: no grants on future tables, specialized module tables,
-- migration ledger writes, DDL, TRUNCATE, ownership or helper-role membership.
do $$
declare item record; operation text;
begin
  for item in select * from (values
    ('profiles',                    array['select','insert','update']),
    ('local_credentials',           array['select','insert','update']),
    ('auth_sessions',               array['select','insert','update','delete']),
    ('auth_rate_limits',            array['select','insert','update','delete']),
    ('positions',                   array['select','insert','update']),
    ('teams',                       array['select','insert','update']),
    ('user_teams',                  array['select','insert','delete']),
    ('roles',                       array['select','insert','update','delete']),
    ('permissions',                 array['select','insert']),
    ('role_permissions',            array['select','insert','delete']),
    ('user_role_assignments',       array['select','insert','update']),
    ('data_scope_grants',           array['select','insert']),
    ('user_roles',                  array['select']),
    ('buildings',                   array['select','insert','update','delete']),
    ('building_aliases',            array['select']),
    ('building_source_mappings',    array['select','delete']),
    ('building_contacts',           array['select']),
    ('building_condition_versions', array['select','insert','update','delete']),
    ('building_condition_fees',     array['select','insert']),
    ('attachments',                 array['select']),
    ('audit_logs',                  array['select','insert']),
    ('pending_audit_logs',          array['select','insert']),
    ('activity_events',             array['select','insert']),
    ('outbox_messages',             array['select','insert']),
    ('notifications',               array['select','insert','update']),
    ('projects',                    array['select']),
    ('tasks',                       array['select','insert','update']),
    ('task_transitions',            array['select','insert']),
    ('task_notes',                  array['select','insert']),
    ('work_mutation_receipts',      array['select','insert']),
    ('manual_work_entries',         array['select','insert']),
    ('kpi_metrics',                 array['select','insert']),
    ('kpi_rule_versions',           array['select','insert']),
    ('kpi_targets',                 array['select']),
    ('kpi_facts',                   array['select']),
    ('kpi_adjustments',             array['select']),
    ('kpi_calculation_runs',        array['select']),
    ('kpi_score_snapshots',         array['select']),
    ('kpi_personal_versions',       array['select','insert']),
    ('work_admin_previews',         array['select','insert','update']),
    ('guarantee_cases',             array['select']),
    ('guarantee_deposits',          array['select']),
    ('guarantee_refund_requests',   array['select']),
    ('guarantee_refunds',           array['select']),
    ('guarantee_transitions',       array['select']),
    ('guarantee_work_items',        array['select','insert','update']),
    ('guarantee_work_events',       array['select','insert']),
    ('price_estimates',            array['select']),
    ('price_estimate_versions',    array['select']),
    ('price_estimate_items',       array['select']),
    ('price_approvals',            array['select']),
    ('automation_rules',          array['select']),
    ('automation_executions',     array['select']),
    ('automation_action_results', array['select']),
    ('source_import_runs',        array['select']),
    ('source_import_rows',        array['select']),
    ('holidays',                  array['select','insert','update']),
    ('system_links',              array['select','insert','update']),
    ('system_link_roles',         array['select','insert','delete']),
    ('system_link_teams',         array['select','insert','delete']),
    ('admin_announcements',       array['select','insert','update'])
  ) as permissions(table_name,operations)
  loop
    foreach operation in array item.operations loop
      execute format('grant %s on public.%I to permission_core_runtime',operation,item.table_name);
      -- Add policies only where RLS is already enabled. Retain existing policies
      -- for all other DB roles. SQL privileges above still limit each operation.
      if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=item.table_name and c.relrowsecurity) then
        execute format('create policy core_service_%s on public.%I for %s to permission_core_runtime %s',
          operation,item.table_name,operation,
          case operation when 'insert' then 'with check (true)' when 'update' then 'using (true) with check (true)' else 'using (true)' end);
      end if;
    end loop;
  end loop;
end $$;

-- Lifecycle writes already bind verified identity and have specific RLS checks.
-- Keep those checks, including changed_by and core.module.manage, in force.
grant select,insert,update on public.core_module_settings to permission_core_runtime;
grant select on public.schema_migrations to permission_core_runtime;
comment on role permission_core_runtime is 'Trusted Core backend DML service. End-user RBAC remains server-enforced. No DDL/ownership; never grant this group to Car/Duct runtimes.';
