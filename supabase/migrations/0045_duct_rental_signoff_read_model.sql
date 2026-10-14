create function public.duct_rental_request_signoff(request uuid) returns table(id uuid,status text,assignee_id uuid,assignee_name text,document_id uuid,version integer) language sql stable security definer set search_path=pg_catalog,public as $$
 select t.id,t.status,t.assignee_id,coalesce(p.display_name,'ผู้ลงนาม'),t.document_id,t.version
 from public.duct_rental_sign_tasks t join public.profiles p on p.id=t.assignee_id
 where t.request_id=request and t.status<>'revoked' and public.duct_rental_request_access(request,'duct_rental.module.view')
 order by t.created_at desc,t.id desc limit 1;
$$;
revoke all on function public.duct_rental_request_signoff(uuid) from public;
grant execute on function public.duct_rental_request_signoff(uuid) to duct_rental_runtime;
grant create on schema public to duct_rental_policy_worker;
alter function public.duct_rental_request_signoff(uuid) owner to duct_rental_policy_worker;
revoke create on schema public from duct_rental_policy_worker;
