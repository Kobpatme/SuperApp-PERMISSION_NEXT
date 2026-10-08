-- DBA/operator only, after 0024-0027. Login provisioning is separate.
-- Never grant membership in the three SECURITY DEFINER helper roles.
grant usage on schema public to permission_car_booking_runtime;
grant select,insert,update on public.car_booking_cars,public.car_booking_bookings,public.car_booking_osp_jobs to permission_car_booking_runtime;
grant select,insert on public.car_booking_logs to permission_car_booking_runtime;
grant select,update on public.car_booking_settings,public.car_booking_osp_state to permission_car_booking_runtime;
grant select on public.car_booking_osp_report to permission_car_booking_runtime;
grant select on public.schema_migrations to permission_car_booking_runtime;
grant insert on public.audit_logs,public.activity_events,public.outbox_messages to permission_car_booking_runtime;
grant execute on function public.car_booking_has_access(text,uuid),
 public.car_booking_calendar(timestamptz,timestamptz), public.car_booking_lock_car(uuid),
 public.car_booking_previous_unreturned(uuid),public.car_booking_sync_return(uuid),
 public.car_booking_vehicle_state(),public.car_booking_busy_cars(timestamptz,timestamptz),
 public.car_booking_can_manage_access(),public.car_booking_access_users(),
 public.car_booking_set_user_access(uuid,boolean,boolean) to permission_car_booking_runtime;
