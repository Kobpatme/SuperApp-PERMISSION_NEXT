-- Narrow producer: recipient and href derive from an authorized task, not caller JSON.
grant insert,select on public.notifications to duct_rental_policy_worker;
create function public.duct_rental_notify_task(task uuid) returns void language plpgsql security definer set search_path=pg_catalog,public as $$
declare item public.duct_rental_sign_tasks; recipient uuid; heading text;
begin
 select * into item from public.duct_rental_sign_tasks where id=task;
 if item.id is null then raise exception 'Task not found' using errcode='42501'; end if;
 if item.status='pending' and item.assigned_by=public.current_platform_user_id() and public.duct_rental_request_access(item.request_id,'duct_rental.signoff.assign') then
   recipient:=item.assignee_id; heading:='มีเอกสาร NT Form รอคุณลงนาม';
 elsif item.status='signed' and item.assignee_id=public.current_platform_user_id() and public.duct_rental_task_access(item.id) then
   recipient:=item.assigned_by; heading:='NT Form ลงนามแล้ว';
 elsif item.status='revoked' and (public.duct_rental_request_access(item.request_id,'duct_rental.signoff.assign') or public.duct_rental_request_access(item.request_id,'duct_rental.signoff.revoke')) then
   recipient:=item.assignee_id; heading:='ยกเลิกงานลงนาม NT Form แล้ว';
 else raise exception 'Notification denied' using errcode='42501'; end if;
 insert into public.notifications(recipient_id,type,title,body,href,priority,deduplication_key)
 values(recipient,'duct-rental.signoff.'||item.status,heading,item.snapshot->>'projectName','/duct-rental?view=signatures&task='||item.id::text,'high','duct-rental:'||item.id::text||':'||item.version::text)
 on conflict(recipient_id,deduplication_key) where deduplication_key is not null do nothing;
end $$;
revoke all on function public.duct_rental_notify_task(uuid) from public;
grant execute on function public.duct_rental_notify_task(uuid) to duct_rental_runtime;
grant create on schema public to duct_rental_policy_worker;
alter function public.duct_rental_notify_task(uuid) owner to duct_rental_policy_worker;
revoke create on schema public from duct_rental_policy_worker;
