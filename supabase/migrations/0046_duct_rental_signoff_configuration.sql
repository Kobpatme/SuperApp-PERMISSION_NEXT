create table public.duct_rental_signoff_configs (
 request_id uuid primary key references public.duct_rental_requests(id),
 assignee_id uuid not null references public.profiles(id), configured_by uuid not null references public.profiles(id),
 version integer not null default 1 check(version>0), updated_at timestamptz not null default now()
);
alter table public.duct_rental_signoff_configs enable row level security;
alter table public.duct_rental_signoff_configs force row level security;
grant select,insert,update on public.duct_rental_signoff_configs to duct_rental_runtime;
grant select on public.duct_rental_signoff_configs to duct_rental_policy_worker;
create policy duct_signoff_config_read on public.duct_rental_signoff_configs for select using(public.duct_rental_request_access(request_id,'duct_rental.module.view'));
create policy duct_signoff_config_insert on public.duct_rental_signoff_configs for insert with check(public.duct_rental_request_access(request_id,'duct_rental.signoff.assign') and configured_by=public.current_platform_user_id());
create policy duct_signoff_config_update on public.duct_rental_signoff_configs for update using(public.duct_rental_request_access(request_id,'duct_rental.signoff.assign')) with check(public.duct_rental_request_access(request_id,'duct_rental.signoff.assign') and configured_by=public.current_platform_user_id());
create function public.duct_rental_guard_signoff_config() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if new.configured_by<>public.current_platform_user_id() or not exists(select 1 from public.duct_rental_requests r where r.id=new.request_id and r.phase='PERMISSION_1' and r.archived_at is null and r.cancelled_at is null)
  or not exists(select 1 from public.duct_rental_signers(new.request_id) s where s.id=new.assignee_id)
  or (tg_op='UPDATE' and (new.request_id<>old.request_id or new.version<>old.version+1)) then raise exception 'Signoff configuration denied' using errcode='42501'; end if;
 return new;
end $$;
revoke all on function public.duct_rental_guard_signoff_config() from public;
create trigger duct_signoff_config_guard before insert or update on public.duct_rental_signoff_configs for each row execute function public.duct_rental_guard_signoff_config();
grant create on schema public to duct_rental_policy_worker;
alter function public.duct_rental_guard_signoff_config() owner to duct_rental_policy_worker;
revoke create on schema public from duct_rental_policy_worker;
-- Route notifications directly to the native assigned-task workspace.
create or replace function public.duct_rental_notify_task(task uuid) returns void language plpgsql security definer set search_path=pg_catalog,public as $$
declare item public.duct_rental_sign_tasks; recipient uuid; heading text;
begin
 select * into item from public.duct_rental_sign_tasks where id=task;
 if item.id is null then raise exception 'Task not found' using errcode='42501'; end if;
 if item.status='pending' and item.assigned_by=public.current_platform_user_id() and public.duct_rental_request_access(item.request_id,'duct_rental.signoff.assign') then recipient:=item.assignee_id; heading:='มีเอกสาร NT Form รอคุณลงนาม';
 elsif item.status='signed' and item.assignee_id=public.current_platform_user_id() and public.duct_rental_task_access(item.id) then recipient:=item.assigned_by; heading:='NT Form ลงนามแล้ว';
 elsif item.status='revoked' and (public.duct_rental_request_access(item.request_id,'duct_rental.signoff.assign') or public.duct_rental_request_access(item.request_id,'duct_rental.signoff.revoke')) then recipient:=item.assignee_id; heading:='ยกเลิกงานลงนาม NT Form แล้ว';
 else raise exception 'Notification denied' using errcode='42501'; end if;
 insert into public.notifications(recipient_id,type,title,body,href,priority,deduplication_key)
 values(recipient,'duct-rental.signoff.'||item.status,heading,item.snapshot->>'projectName','/duct-rental/tasks?task='||item.id::text,'high','duct-rental:'||item.id::text||':'||item.version::text)
 on conflict(recipient_id,deduplication_key) where deduplication_key is not null do nothing;
end $$;
