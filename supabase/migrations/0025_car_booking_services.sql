-- Narrow privileged operations needed under FORCE RLS. No runtime BYPASSRLS.
do $$ begin
 if not exists(select 1 from pg_roles where rolname='car_booking_service_worker') then
  create role car_booking_service_worker nologin noinherit nosuperuser nobypassrls;
 end if;
 if exists(select 1 from pg_roles where rolname='car_booking_service_worker' and (rolcanlogin or rolinherit or rolsuper or rolbypassrls)) then raise exception 'Unsafe car service worker'; end if;
end $$;
grant usage on schema public to car_booking_service_worker;
grant select,update on public.car_booking_cars,public.car_booking_bookings to car_booking_service_worker;
grant execute on function public.car_booking_has_access(text,uuid) to car_booking_service_worker;
create policy car_booking_worker_cars_read on public.car_booking_cars for select to car_booking_service_worker using(true);
create policy car_booking_worker_cars_update on public.car_booking_cars for update to car_booking_service_worker using(true) with check(true);
create policy car_booking_worker_bookings_read on public.car_booking_bookings for select to car_booking_service_worker using(true);
create policy car_booking_worker_bookings_lock on public.car_booking_bookings for update to car_booking_service_worker using(true) with check(true);
create function public.car_booking_lock_car(target uuid)
returns setof public.car_booking_cars language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if not (public.car_booking_has_access('car_booking.module.use',public.current_platform_user_id()) or public.car_booking_has_access('car_booking.module.admin')) then
  raise exception 'CAR_FORBIDDEN' using errcode='42501';
 end if;
 return query select c.* from public.car_booking_cars c where c.id=target for update;
end $$;
revoke all on function public.car_booking_lock_car(uuid) from public;

create function public.car_booking_previous_unreturned(target uuid)
returns text language plpgsql security definer set search_path=pg_catalog,public as $$
declare current_booking public.car_booking_bookings; previous_name text;
begin
 select * into current_booking from public.car_booking_bookings where id=target;
 if not found or not (public.car_booking_has_access('car_booking.module.use',current_booking.user_id) or public.car_booking_has_access('car_booking.module.admin')) then
  raise exception 'CAR_FORBIDDEN' using errcode='42501';
 end if;
 select b.employee_name into previous_name from public.car_booking_bookings b
 where b.car_id=current_booking.car_id and b.start_time<current_booking.start_time and b.status='booked'
 order by b.start_time,b.id limit 1;
 return previous_name;
end $$;
revoke all on function public.car_booking_previous_unreturned(uuid) from public;

create function public.car_booking_sync_return(target uuid)
returns void language plpgsql security definer set search_path=pg_catalog,public as $$
declare booking public.car_booking_bookings; car public.car_booking_cars;
begin
 -- Lock order matches all service mutations: car first, then booking.
 select * into booking from public.car_booking_bookings where id=target;
 if not found or not (public.car_booking_has_access('car_booking.module.use',booking.user_id) or public.car_booking_has_access('car_booking.module.admin')) then
  raise exception 'CAR_FORBIDDEN' using errcode='42501';
 end if;
 select * into car from public.car_booking_cars where id=booking.car_id for update;
 select * into booking from public.car_booking_bookings where id=target for update;
 if booking.status<>'completed' or booking.mileage_on_return<=car.latest_mileage then
  raise exception 'CAR_STALE_RETURN' using errcode='23514';
 end if;
 if public.car_booking_previous_unreturned(target) is not null then
  raise exception 'CAR_PREVIOUS_UNRETURNED' using errcode='23514';
 end if;
 update public.car_booking_cars set latest_mileage=booking.mileage_on_return,parking_floor=booking.parking_floor,updated_at=now() where id=car.id;
end $$;
revoke all on function public.car_booking_sync_return(uuid) from public;

-- Minimal car information specified by the legacy workflow, without raw bookings.
create function public.car_booking_vehicle_state()
returns table(car_id uuid,license_plate text,parking_floor text,latest_mileage numeric,is_active boolean,last_user text,using_now boolean)
language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if not (public.car_booking_has_access('car_booking.module.use',public.current_platform_user_id()) or public.car_booking_has_access('car_booking.module.admin')) then
  raise exception 'CAR_FORBIDDEN' using errcode='42501';
 end if;
 return query select c.id,c.license_plate,c.parking_floor,c.latest_mileage,c.is_active,
 (select b.employee_name from public.car_booking_bookings b where b.car_id=c.id and b.status='completed' order by b.actual_return_time desc,b.id desc limit 1),
 exists(select 1 from public.car_booking_bookings b where b.car_id=c.id and b.status='booked' and b.start_time<=now())
 from public.car_booking_cars c order by c.license_plate;
end $$;
revoke all on function public.car_booking_vehicle_state() from public;

create function public.car_booking_busy_cars(range_start timestamptz,range_end timestamptz)
returns table(car_id uuid) language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if not (public.car_booking_has_access('car_booking.module.use',public.current_platform_user_id()) or public.car_booking_has_access('car_booking.module.admin')) then raise exception 'CAR_FORBIDDEN' using errcode='42501'; end if;
 if not isfinite(range_start) or not isfinite(range_end) or range_end<=range_start or range_end-range_start>interval '93 days' then raise exception 'CAR_RANGE' using errcode='22023'; end if;
 return query select distinct b.car_id from public.car_booking_bookings b where b.status<>'cancelled'
 and tstzrange(b.start_time,least(b.end_time,coalesce(b.actual_return_time,b.end_time)),'[)') && tstzrange(range_start,range_end,'[)');
end $$;
revoke all on function public.car_booking_busy_cars(timestamptz,timestamptz) from public;

grant create on schema public to car_booking_service_worker;
alter function public.car_booking_lock_car(uuid) owner to car_booking_service_worker;
alter function public.car_booking_previous_unreturned(uuid) owner to car_booking_service_worker;
alter function public.car_booking_sync_return(uuid) owner to car_booking_service_worker;
alter function public.car_booking_vehicle_state() owner to car_booking_service_worker;
alter function public.car_booking_busy_cars(timestamptz,timestamptz) owner to car_booking_service_worker;
revoke create on schema public from car_booking_service_worker;

-- Runtime may append only its car-module material evidence; existing modules unaffected.
create policy car_booking_activity_append on public.activity_events for insert with check(
 module_id='car-booking' and actor_id=public.current_platform_user_id() and source_system='permission_next'
 and (public.car_booking_has_access('car_booking.module.admin') or public.car_booking_has_access('car_booking.module.use',owner_id)));
create policy car_booking_outbox_append on public.outbox_messages for insert with check(
 topic like 'car-booking.%' and payload->>'actorId'=public.current_platform_user_id()::text
 and (public.car_booking_has_access('car_booking.module.admin') or public.car_booking_has_access('car_booking.module.use',public.current_platform_user_id())));
