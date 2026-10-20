alter table public.tasks add column if not exists job_code text;
alter table public.tasks add column if not exists main_kpi text;
alter table public.tasks add column if not exists sub_kpi text;
alter table public.tasks add column if not exists note text;
alter table public.tasks add column if not exists kpi_weight numeric(18,6);

create index if not exists tasks_job_code_idx on public.tasks(job_code, updated_at desc);
create index if not exists tasks_kpi_idx on public.tasks(main_kpi, sub_kpi, updated_at desc);
