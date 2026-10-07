create table public.car_booking_settings (
 id integer primary key check(id=1), parking_floors text[] not null check(cardinality(parking_floors)>0),
 version integer not null default 1, updated_at timestamptz not null default now()
);
insert into public.car_booking_settings(id,parking_floors) values(1,array['2A','2B','3A','3B','4A','4B','5A','5B','6A','6B','7A','7B','8A','8B']);
alter table public.car_booking_settings enable row level security;
alter table public.car_booking_settings force row level security;
create policy car_booking_settings_read on public.car_booking_settings for select using(
 public.car_booking_has_access('car_booking.module.use',public.current_platform_user_id()) or public.car_booking_has_access('car_booking.module.admin'));
create policy car_booking_settings_write on public.car_booking_settings for update using(public.car_booking_has_access('car_booking.module.admin')) with check(public.car_booking_has_access('car_booking.module.admin'));

-- No user assignments: these two single-capability roles are used only by the editor.
insert into public.roles(code,name,is_system) values('car_booking_use','ผู้ใช้งานจองรถ',true),('car_booking_admin','ผู้ดูแลจองรถ',true);
insert into public.role_permissions(role_id,permission_code)
 select r.id,p.code from public.roles r join public.permissions p on
 (r.code='car_booking_use' and p.code='car_booking.module.use') or (r.code='car_booking_admin' and p.code='car_booking.module.admin');

create function public.car_booking_can_manage_access() returns boolean language sql stable security definer set search_path=pg_catalog,public as $$
 select exists(select 1 from public.profiles p join public.local_credentials c on c.user_id=p.id
 where p.id=public.current_platform_user_id() and p.status='active' and not c.must_change_password)
 and public.has_scoped_permission('core.user.manage',null,null);
$$;
revoke all on function public.car_booking_can_manage_access() from public;
do $$ begin
 if not exists(select 1 from pg_roles where rolname='car_booking_access_manager') then create role car_booking_access_manager nologin noinherit nosuperuser nobypassrls; end if;
 if exists(select 1 from pg_roles where rolname='car_booking_access_manager' and (rolcanlogin or rolinherit or rolsuper or rolbypassrls)) then raise exception 'Unsafe car access manager'; end if;
end $$;
grant usage on schema public to car_booking_access_manager;
grant select on public.profiles,public.roles,public.role_permissions to car_booking_access_manager;
grant select,insert,update on public.user_role_assignments to car_booking_access_manager;
grant select,insert,delete on public.data_scope_grants to car_booking_access_manager;
grant execute on function public.car_booking_can_manage_access() to car_booking_access_manager;
create policy car_access_profiles_read on public.profiles for select to car_booking_access_manager using(true);
create policy car_access_roles_read on public.roles for select to car_booking_access_manager using(true);
create policy car_access_permissions_read on public.role_permissions for select to car_booking_access_manager using(true);
create policy car_access_assignments_read on public.user_role_assignments for select to car_booking_access_manager using(true);
create policy car_access_assignments_insert on public.user_role_assignments for insert to car_booking_access_manager with check(true);
create policy car_access_assignments_update on public.user_role_assignments for update to car_booking_access_manager using(true) with check(true);
create policy car_access_scopes_read on public.data_scope_grants for select to car_booking_access_manager using(true);
create policy car_access_scopes_insert on public.data_scope_grants for insert to car_booking_access_manager with check(true);
create policy car_access_scopes_delete on public.data_scope_grants for delete to car_booking_access_manager using(true);

create function public.car_booking_access_users() returns table(id uuid,display_name text,email text,employee_code text,status text,can_use boolean,can_admin boolean)
language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if not public.car_booking_can_manage_access() then raise exception 'CAR_ACCESS_FORBIDDEN' using errcode='42501'; end if;
 return query select p.id,p.display_name,p.email,p.employee_code,p.status,
 exists(select 1 from public.user_role_assignments a join public.role_permissions rp on rp.role_id=a.role_id join public.data_scope_grants s on s.assignment_id=a.id and (s.permission_code is null or s.permission_code=rp.permission_code)
 where a.user_id=p.id and a.valid_from<=now() and (a.valid_until is null or a.valid_until>now()) and rp.permission_code='car_booking.module.use' and s.scope_type in ('OWN','ALL')),
 exists(select 1 from public.user_role_assignments a join public.role_permissions rp on rp.role_id=a.role_id join public.data_scope_grants s on s.assignment_id=a.id and (s.permission_code is null or s.permission_code=rp.permission_code)
 where a.user_id=p.id and a.valid_from<=now() and (a.valid_until is null or a.valid_until>now()) and rp.permission_code='car_booking.module.admin' and s.scope_type='ALL')
 from public.profiles p order by p.display_name,p.email;
end $$;
revoke all on function public.car_booking_access_users() from public;

create function public.car_booking_set_user_access(target uuid,allow_use boolean,allow_admin boolean) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare assignment record; new_assignment uuid;
begin
 if not public.car_booking_can_manage_access() then raise exception 'CAR_ACCESS_FORBIDDEN' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtext('car-access:'||target::text));
 if not exists(select 1 from public.profiles where id=target) then raise exception 'CAR_USER_NOT_FOUND' using errcode='23514'; end if;
 -- Preserve existing assignments, teams, expiry and every currently granted non-car scope.
 -- Expand generic scopes only on mixed roles carrying car permissions.
 for assignment in select a.id,a.role_id from public.user_role_assignments a
 where a.user_id=target and (a.valid_until is null or a.valid_until>now())
 and exists(select 1 from public.role_permissions rp where rp.role_id=a.role_id and rp.permission_code in ('car_booking.module.use','car_booking.module.admin')) for update
 loop
  insert into public.data_scope_grants(assignment_id,permission_code,scope_type,selected_team_id)
   select assignment.id,rp.permission_code,s.scope_type,s.selected_team_id from public.data_scope_grants s
   join public.role_permissions rp on rp.role_id=assignment.role_id
   where s.assignment_id=assignment.id and s.permission_code is null and rp.permission_code not in ('car_booking.module.use','car_booking.module.admin');
  delete from public.data_scope_grants where assignment_id=assignment.id and (permission_code is null or permission_code in ('car_booking.module.use','car_booking.module.admin'));
  if not exists(select 1 from public.data_scope_grants where assignment_id=assignment.id) then
   update public.user_role_assignments set valid_until=now() where id=assignment.id;
  end if;
 end loop;
 if allow_use then
  insert into public.user_role_assignments(user_id,role_id,created_by) select target,id,public.current_platform_user_id() from public.roles where code='car_booking_use' returning id into new_assignment;
  insert into public.data_scope_grants(assignment_id,permission_code,scope_type) values(new_assignment,'car_booking.module.use','OWN');
 end if;
 if allow_admin then
  insert into public.user_role_assignments(user_id,role_id,created_by) select target,id,public.current_platform_user_id() from public.roles where code='car_booking_admin' returning id into new_assignment;
  insert into public.data_scope_grants(assignment_id,permission_code,scope_type) values(new_assignment,'car_booking.module.admin','ALL');
 end if;
end $$;
revoke all on function public.car_booking_set_user_access(uuid,boolean,boolean) from public;
grant create on schema public to car_booking_access_manager;
alter function public.car_booking_access_users() owner to car_booking_access_manager;
alter function public.car_booking_set_user_access(uuid,boolean,boolean) owner to car_booking_access_manager;
revoke create on schema public from car_booking_access_manager;

create policy car_access_activity_append on public.activity_events for insert with check(module_id='car-booking' and actor_id=public.current_platform_user_id() and public.car_booking_can_manage_access());
create policy car_access_outbox_append on public.outbox_messages for insert with check(topic='car-booking.access.changed.v1' and payload->>'actorId'=public.current_platform_user_id()::text and public.car_booking_can_manage_access());
