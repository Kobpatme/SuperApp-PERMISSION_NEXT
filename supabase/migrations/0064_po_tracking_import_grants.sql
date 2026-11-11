-- Import lineage needs write access for the runtime service role. The existing
-- tables only granted SELECT; this adds INSERT/UPDATE (no DELETE) on staging.
grant insert, update on public.source_import_runs to permission_core_runtime;
grant insert on public.source_import_rows to permission_core_runtime;
create policy source_import_runs_service_insert on public.source_import_runs for insert to permission_core_runtime with check (true);
create policy source_import_runs_service_update on public.source_import_runs for update to permission_core_runtime using (true) with check (true);
create policy source_import_rows_service_insert on public.source_import_rows for insert to permission_core_runtime with check (true);
