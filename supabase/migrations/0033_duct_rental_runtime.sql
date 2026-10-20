-- Group roles only. A deployment operator provisions a login separately after review.
do $$ begin
 if not exists(select 1 from pg_roles where rolname='duct_rental_runtime') then create role duct_rental_runtime nologin noinherit nosuperuser nobypassrls; end if;
 if not exists(select 1 from pg_roles where rolname='duct_rental_policy_worker') then create role duct_rental_policy_worker nologin noinherit nosuperuser bypassrls; end if;
 if exists(select 1 from pg_roles where rolname='duct_rental_runtime' and (rolsuper or rolbypassrls or rolcanlogin))
   or exists(select 1 from pg_roles where rolname='duct_rental_policy_worker' and (rolsuper or rolcanlogin)) then raise exception 'Unsafe duct group role'; end if;
end $$;
grant usage on schema public to duct_rental_runtime,duct_rental_policy_worker;
grant select,insert,update on public.duct_rental_requests,public.duct_rental_rates,public.duct_rental_documents,
 public.duct_rental_sign_tasks,public.duct_rental_signature_assets,public.duct_rental_renewals,public.duct_rental_renewal_routes,public.duct_rental_cancellations to duct_rental_runtime;
grant select,insert on public.duct_rental_mutation_receipts to duct_rental_runtime;
grant insert on public.audit_logs,public.activity_events,public.outbox_messages to duct_rental_runtime;
grant execute on function public.current_platform_user_id(),public.duct_rental_has_access(text,uuid,uuid),public.duct_rental_request_access(uuid,text),public.duct_rental_phase_permission(text,text),public.duct_rental_can_change_request(uuid),public.duct_rental_renewal_access(uuid,text),public.duct_rental_task_access(uuid),public.duct_rental_has_entry() to duct_rental_runtime;
grant select on public.profiles,public.local_credentials,public.user_role_assignments,public.role_permissions,public.data_scope_grants,
 public.duct_rental_requests,public.duct_rental_rates,public.duct_rental_documents,public.duct_rental_sign_tasks,public.duct_rental_renewals,public.duct_rental_renewal_routes,public.duct_rental_cancellations to duct_rental_policy_worker;
grant update on public.duct_rental_documents,public.duct_rental_sign_tasks to duct_rental_policy_worker; -- only row locks in immutable guards
grant execute on function public.has_scoped_permission(text,uuid,uuid),public.current_platform_user_id(),public.duct_rental_phase_permission(text,text) to duct_rental_policy_worker;
grant create on schema public to duct_rental_policy_worker;
alter function public.duct_rental_has_access(text,uuid,uuid) owner to duct_rental_policy_worker;
alter function public.duct_rental_request_access(uuid,text) owner to duct_rental_policy_worker;
alter function public.duct_rental_can_change_request(uuid) owner to duct_rental_policy_worker;
alter function public.duct_rental_renewal_access(uuid,text) owner to duct_rental_policy_worker;
alter function public.duct_rental_task_access(uuid) owner to duct_rental_policy_worker;
alter function public.duct_rental_has_entry() owner to duct_rental_policy_worker;
alter function public.duct_rental_guard_request() owner to duct_rental_policy_worker;
alter function public.duct_rental_guard_task() owner to duct_rental_policy_worker;
alter function public.duct_rental_guard_document() owner to duct_rental_policy_worker;
revoke create on schema public from duct_rental_policy_worker;
-- Existing permissive Core policies cannot let this runtime append another module's evidence.
create policy duct_audit_boundary on public.audit_logs as restrictive for insert to duct_rental_runtime with check(module_id='duct-rental' and actor_id=public.current_platform_user_id());
create policy duct_activity_boundary on public.activity_events as restrictive for insert to duct_rental_runtime with check(module_id='duct-rental' and actor_id=public.current_platform_user_id() and not kpi_eligible);
create policy duct_outbox_boundary on public.outbox_messages as restrictive for insert to duct_rental_runtime with check(topic like 'duct-rental.%.v1' and aggregate_type='duct_rental' and payload->>'actorId'=public.current_platform_user_id()::text);
