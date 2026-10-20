-- Additive OSP module foundation. No real-user assignments or role grants.
create extension if not exists btree_gist;
-- Keep legacy automatic grants for other modules; car access is explicit only.
create or replace function public.grant_new_permission_to_platform_admin() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 if new.module_id = 'car-booking' or new.code like 'car_booking.%' then return new; end if;
 insert into public.role_permissions(role_id,permission_code)
 select id,new.code from public.roles where code='platform_admin'
 on conflict do nothing;
 return new;
end $$;
insert into public.permissions(code,module_id,resource,action,description) values
 ('car_booking.module.use','car-booking','module','use','ใช้งานระบบจองรถ'),
 ('car_booking.module.admin','car-booking','module','admin','ดูแลระบบจองรถ')
on conflict(code) do nothing;

create table public.car_booking_cars (
 id uuid primary key default gen_random_uuid(), legacy_id integer unique,
 license_plate text not null unique check(length(trim(license_plate)) > 0),
 parking_floor text, latest_mileage numeric not null default 0 check(latest_mileage >= 0 and latest_mileage < 'Infinity'::numeric),
 is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.car_booking_bookings (
 id uuid primary key default gen_random_uuid(), legacy_id text unique,
 user_id uuid not null references public.profiles(id) on delete restrict,
 employee_name text not null,
 car_id uuid not null references public.car_booking_cars(id) on delete restrict,
 destination text not null check(length(trim(destination)) > 0),
 start_time timestamptz not null, end_time timestamptz not null,
 status text not null default 'booked' check(status in ('booked','completed','cancelled')),
 start_mileage numeric not null check(start_mileage >= 0 and start_mileage < 'Infinity'::numeric),
 actual_return_time timestamptz, mileage_on_return numeric,
 parking_floor text, refueled boolean not null default false,
 fuel_mileage numeric, fuel_liters numeric, fuel_amount numeric,
 cancelled_at timestamptz, cancelled_by uuid references public.profiles(id) on delete restrict,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint car_booking_time_check check(end_time > start_time and isfinite(start_time) and isfinite(end_time)),
 constraint car_booking_return_time_check check(actual_return_time is null or (isfinite(actual_return_time) and actual_return_time >= start_time)),
 constraint car_booking_return_mileage_check check(mileage_on_return is null or (mileage_on_return > start_mileage and mileage_on_return < 'Infinity'::numeric)),
 constraint car_booking_completed_check check(status <> 'completed' or (actual_return_time is not null and mileage_on_return is not null and nullif(trim(parking_floor),'') is not null)),
 constraint car_booking_fuel_check check(
  (not refueled and fuel_mileage is null and fuel_liters is null and fuel_amount is null)
  or (refueled and fuel_mileage is not null and fuel_liters is not null and fuel_amount is not null
      and status='completed' and mileage_on_return is not null and fuel_mileage >= start_mileage and fuel_mileage <= mileage_on_return
      and fuel_liters > 0 and fuel_liters < 'Infinity'::numeric and fuel_amount > 0 and fuel_amount < 'Infinity'::numeric)),
 -- Owner approved: late returns do not expand the reservation interval.
 constraint car_booking_car_overlap exclude using gist
 (car_id with =, tstzrange(start_time,least(end_time,coalesce(actual_return_time,end_time)),'[)') with &&)
 where (status <> 'cancelled'),
 constraint car_booking_user_overlap exclude using gist
 (user_id with =, tstzrange(start_time,least(end_time,coalesce(actual_return_time,end_time)),'[)') with &&)
 where (status <> 'cancelled')
);
create index car_booking_car_start_idx on public.car_booking_bookings(car_id,start_time);
create index car_booking_user_status_idx on public.car_booking_bookings(user_id,status);
create index car_booking_status_start_idx on public.car_booking_bookings(status,start_time);
create index car_booking_start_idx on public.car_booking_bookings(start_time);
create table public.car_booking_logs (
 id uuid primary key default gen_random_uuid(), legacy_id text unique,
 booking_id uuid not null references public.car_booking_bookings(id) on delete restrict,
 log_time timestamptz not null,
 log_type text not null check(log_type in ('overnight_stop','fuel','checkpoint','other')),
 location text not null check(length(trim(location)) > 0),
 mileage numeric not null check(mileage >= 0 and mileage < 'Infinity'::numeric),
 refueled boolean not null default false, fuel_liters numeric, fuel_amount numeric,
 note text not null default '', gps_latitude numeric(10,7), gps_longitude numeric(10,7), gps_accuracy_meters numeric,
 created_by uuid not null references public.profiles(id) on delete restrict,
 created_at timestamptz not null default now(),
 constraint car_booking_log_fuel_check check(
  ((log_type = 'fuel' or refueled) and fuel_liters is not null and fuel_amount is not null
   and fuel_liters > 0 and fuel_liters < 'Infinity'::numeric and fuel_amount > 0 and fuel_amount < 'Infinity'::numeric)
  or (log_type <> 'fuel' and not refueled and fuel_liters is null and fuel_amount is null)),
 constraint car_booking_gps_check check(
  (gps_latitude is null and gps_longitude is null and gps_accuracy_meters is null)
  or (gps_latitude is not null and gps_longitude is not null and gps_latitude between -90 and 90
   and gps_longitude between -180 and 180 and (gps_accuracy_meters is null or (gps_accuracy_meters >= 0 and gps_accuracy_meters < 'Infinity'::numeric))))
);
create index car_booking_log_booking_idx on public.car_booking_logs(booking_id,log_time,id);

-- Specific helper reads canonical RBAC as its owner, avoiding recursive identity RLS.
-- Runtime role needs EXECUTE explicitly; no PUBLIC execute / automatic role grants.
create function public.car_booking_has_access(permission text, owner_id uuid default null)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
 select permission in ('car_booking.module.use','car_booking.module.admin')
 and exists(select 1 from public.profiles p join public.local_credentials c on c.user_id=p.id
            where p.id=public.current_platform_user_id() and p.status='active' and not c.must_change_password)
 -- Even a misconfigured ALL use grant must never expand personal row access.
 and (permission <> 'car_booking.module.use' or owner_id=public.current_platform_user_id())
 and public.has_scoped_permission(permission,owner_id,null);
$$;
revoke all on function public.car_booking_has_access(text,uuid) from public;
alter table public.car_booking_cars enable row level security;
alter table public.car_booking_cars force row level security;
alter table public.car_booking_bookings enable row level security;
alter table public.car_booking_bookings force row level security;
alter table public.car_booking_logs enable row level security;
alter table public.car_booking_logs force row level security;
create policy car_booking_cars_read on public.car_booking_cars for select using(
 public.car_booking_has_access('car_booking.module.use',public.current_platform_user_id()) or public.car_booking_has_access('car_booking.module.admin'));
create policy car_booking_cars_create on public.car_booking_cars for insert with check(public.car_booking_has_access('car_booking.module.admin'));
create policy car_booking_cars_update on public.car_booking_cars for update using(public.car_booking_has_access('car_booking.module.admin')) with check(public.car_booking_has_access('car_booking.module.admin'));
create policy car_booking_bookings_read on public.car_booking_bookings for select using(
 public.car_booking_has_access('car_booking.module.use',user_id) or public.car_booking_has_access('car_booking.module.admin'));
create policy car_booking_bookings_create on public.car_booking_bookings for insert with check(
 public.car_booking_has_access('car_booking.module.use',user_id) or public.car_booking_has_access('car_booking.module.admin'));
create policy car_booking_bookings_update on public.car_booking_bookings for update using(
 public.car_booking_has_access('car_booking.module.use',user_id) or public.car_booking_has_access('car_booking.module.admin'))
 with check(public.car_booking_has_access('car_booking.module.use',user_id) or public.car_booking_has_access('car_booking.module.admin'));
create policy car_booking_logs_read on public.car_booking_logs for select using(exists(
 select 1 from public.car_booking_bookings b where b.id=booking_id and
 (public.car_booking_has_access('car_booking.module.use',b.user_id) or public.car_booking_has_access('car_booking.module.admin'))));
create policy car_booking_logs_create on public.car_booking_logs for insert with check(
 created_by=public.current_platform_user_id() and exists(select 1 from public.car_booking_bookings b
 where b.id=booking_id and b.status='booked' and mileage >= b.start_mileage and
 (public.car_booking_has_access('car_booking.module.use',b.user_id) or public.car_booking_has_access('car_booking.module.admin'))));

-- Admin-only numeric projection. Thai display/19-column export added in report phase.
create view public.car_booking_osp_report with (security_invoker=true) as
 select b.*, c.license_plate, b.mileage_on_return-b.start_mileage as distance_km,
 coalesce(f.liters,0)+coalesce(b.fuel_liters,0) as total_fuel_liters,
 coalesce(f.amount,0)+coalesce(b.fuel_amount,0) as total_fuel_amount
 from public.car_booking_bookings b join public.car_booking_cars c on c.id=b.car_id
 left join lateral(select sum(l.fuel_liters) as liters,sum(l.fuel_amount) as amount from public.car_booking_logs l
 where l.booking_id=b.id and (l.log_type='fuel' or l.refueled)) f on true
 where b.status='completed' and public.car_booking_has_access('car_booking.module.admin');

-- Dedicated NOLOGIN projection owner; never grant membership to the runtime role.
-- It can SELECT only cars/bookings, has no write privileges and cannot bypass RLS.
do $$ begin
 if not exists(select 1 from pg_roles where rolname='car_booking_calendar_reader') then
  create role car_booking_calendar_reader nologin noinherit nosuperuser nobypassrls;
 end if;
 if exists(select 1 from pg_roles where rolname='car_booking_calendar_reader' and (rolcanlogin or rolsuper or rolbypassrls or rolinherit)) then
  raise exception 'Unexpected calendar reader role attributes';
 end if;
end $$;
grant usage on schema public to car_booking_calendar_reader;
grant select on public.car_booking_cars,public.car_booking_bookings to car_booking_calendar_reader;
grant execute on function public.car_booking_has_access(text,uuid) to car_booking_calendar_reader;
create policy car_booking_calendar_cars on public.car_booking_cars for select to car_booking_calendar_reader using(true);
create policy car_booking_calendar_bookings on public.car_booking_bookings for select to car_booking_calendar_reader using(true);

-- Bounded, redacted calendar; source personal/destination/GPS fields never returned.
create function public.car_booking_calendar(range_start timestamptz,range_end timestamptz)
returns table(car_id uuid,license_plate text,start_time timestamptz,end_time timestamptz)
language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
 if range_start is null or range_end is null or range_end <= range_start or range_end-range_start > interval '93 days' then
  raise exception 'Invalid calendar range' using errcode='22023';
 end if;
 if not (public.car_booking_has_access('car_booking.module.use',public.current_platform_user_id()) or public.car_booking_has_access('car_booking.module.admin')) then
  raise exception 'Permission denied' using errcode='42501';
 end if;
 return query select b.car_id,c.license_plate,b.start_time,coalesce(b.actual_return_time,b.end_time)
 from public.car_booking_bookings b join public.car_booking_cars c on c.id=b.car_id
 where b.status <> 'cancelled' and b.start_time < range_end and coalesce(b.actual_return_time,b.end_time) > range_start
 order by b.start_time,b.id;
end;
$$;
revoke all on function public.car_booking_calendar(timestamptz,timestamptz) from public;
grant create on schema public to car_booking_calendar_reader;
alter function public.car_booking_calendar(timestamptz,timestamptz) owner to car_booking_calendar_reader;
revoke create on schema public from car_booking_calendar_reader;
