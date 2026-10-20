create table public.car_booking_osp_jobs(
 id uuid primary key default gen_random_uuid(),booking_id uuid references public.car_booking_bookings(id) on delete restrict,
 kind text not null check(kind in ('booking','rebuild')),status text not null default 'queued' check(status in ('queued','running','sent','failed')),
 attempts integer not null default 0 check(attempts>=0),next_attempt_at timestamptz not null default now(),lease_expires_at timestamptz,
 error_code text,created_at timestamptz not null default now(),sent_at timestamptz,
 check((kind='booking' and booking_id is not null) or (kind='rebuild' and booking_id is null))
);
create unique index car_osp_booking_job_key on public.car_booking_osp_jobs(booking_id) where kind='booking';
create index car_osp_due_idx on public.car_booking_osp_jobs(status,next_attempt_at,created_at);
create table public.car_booking_osp_state(id integer primary key check(id=1),lease_token uuid,lease_expires_at timestamptz,last_sent_at timestamptz);
insert into public.car_booking_osp_state(id) values(1);
alter table public.car_booking_osp_jobs enable row level security;
alter table public.car_booking_osp_jobs force row level security;
alter table public.car_booking_osp_state enable row level security;
alter table public.car_booking_osp_state force row level security;
create policy car_osp_jobs_read on public.car_booking_osp_jobs for select using(public.car_booking_has_access('car_booking.module.admin'));
create policy car_osp_jobs_append on public.car_booking_osp_jobs for insert with check(public.car_booking_has_access('car_booking.module.admin'));
create policy car_osp_jobs_update on public.car_booking_osp_jobs for update using(public.car_booking_has_access('car_booking.module.admin')) with check(public.car_booking_has_access('car_booking.module.admin'));
create policy car_osp_state_read on public.car_booking_osp_state for select using(public.car_booking_has_access('car_booking.module.admin'));
create policy car_osp_state_update on public.car_booking_osp_state for update using(public.car_booking_has_access('car_booking.module.admin')) with check(public.car_booking_has_access('car_booking.module.admin'));
grant insert on public.car_booking_osp_jobs to car_booking_service_worker;
create policy car_osp_return_append on public.car_booking_osp_jobs for insert to car_booking_service_worker with check(kind='booking' and status='queued');
create function public.car_booking_queue_osp_return() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if new.status='completed' then
  if tg_op='INSERT' or old.status is distinct from 'completed' then
   insert into public.car_booking_osp_jobs(booking_id,kind) values(new.id,'booking') on conflict do nothing;
  end if;
 end if;
 return new;
end $$;
revoke all on function public.car_booking_queue_osp_return() from public;
grant create on schema public to car_booking_service_worker;
alter function public.car_booking_queue_osp_return() owner to car_booking_service_worker;
revoke create on schema public from car_booking_service_worker;
create trigger car_booking_queue_osp after insert or update of status on public.car_booking_bookings for each row execute function public.car_booking_queue_osp_return();

-- Evaluate identity/grants once per statement, never once per historical row.
-- The same fresh checks and explicit OWN condition still apply on every request.
alter policy car_booking_cars_read on public.car_booking_cars using(
 (select public.car_booking_has_access('car_booking.module.admin')) or
 (select public.car_booking_has_access('car_booking.module.use',public.current_platform_user_id())));
alter policy car_booking_bookings_read on public.car_booking_bookings using(
 (select public.car_booking_has_access('car_booking.module.admin')) or
 (user_id=(select public.current_platform_user_id()) and
 (select public.car_booking_has_access('car_booking.module.use',public.current_platform_user_id()))));
alter policy car_booking_logs_read on public.car_booking_logs using(
 (select public.car_booking_has_access('car_booking.module.admin')) or
 ((select public.car_booking_has_access('car_booking.module.use',public.current_platform_user_id())) and exists(
 select 1 from public.car_booking_bookings b where b.id=booking_id and b.user_id=(select public.current_platform_user_id()))));
create or replace view public.car_booking_osp_report with (security_invoker=true) as
 select b.*, c.license_plate, b.mileage_on_return-b.start_mileage as distance_km,
 coalesce(f.liters,0)+coalesce(b.fuel_liters,0) as total_fuel_liters,
 coalesce(f.amount,0)+coalesce(b.fuel_amount,0) as total_fuel_amount
 from public.car_booking_bookings b join public.car_booking_cars c on c.id=b.car_id
 left join lateral(select sum(l.fuel_liters) as liters,sum(l.fuel_amount) as amount from public.car_booking_logs l
 where l.booking_id=b.id and (l.log_type='fuel' or l.refueled)) f on true
 where b.status='completed' and (select public.car_booking_has_access('car_booking.module.admin'));
