create table public.duct_rental_settings (
 id text primary key check(id='default'), service_center_teams jsonb not null default '{}', coordinator_phones jsonb not null default '{}',
 version integer not null default 1, updated_by uuid references public.profiles(id), updated_at timestamptz not null default now()
);
insert into public.duct_rental_settings(id) values('default');
alter table public.duct_rental_settings enable row level security;
alter table public.duct_rental_settings force row level security;
create policy duct_settings_read on public.duct_rental_settings for select using(public.duct_rental_has_access('duct_rental.settings.manage',null,null));
create policy duct_settings_change on public.duct_rental_settings for update using(public.duct_rental_has_access('duct_rental.settings.manage',null,null)) with check(public.duct_rental_has_access('duct_rental.settings.manage',null,null));
grant select,update on public.duct_rental_settings to duct_rental_runtime;
grant select on public.duct_rental_settings,public.teams,public.user_teams to duct_rental_policy_worker;
create function public.duct_rental_guard_settings() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if new.id<>old.id or new.version<>old.version+1 or new.updated_by is distinct from public.current_platform_user_id()
  or jsonb_typeof(new.service_center_teams)<>'object' or jsonb_typeof(new.coordinator_phones)<>'object' then raise exception 'Invalid module settings' using errcode='23514'; end if;
 if exists(select 1 from jsonb_each_text(new.service_center_teams) c where c.key not in ('BKK 1','BKK 2','BKK 3','BKK 4','RYG','HYI','PLK','PKT','CBI','UDN','KKN','CMI','RBI','AYA','NMA','UBN','SNI') or not exists(select 1 from public.teams t where t.id::text=c.value)) then raise exception 'Unknown center or team' using errcode='23514'; end if;
 if exists(select 1 from jsonb_each_text(new.coordinator_phones) c where length(c.value)>100 or not exists(select 1 from public.profiles p where p.id::text=c.key)) then raise exception 'Unknown coordinator' using errcode='23514'; end if;
 return new;
end $$;
create trigger duct_settings_guard before update on public.duct_rental_settings for each row execute function public.duct_rental_guard_settings();
create function public.duct_rental_team_options() returns table(id uuid,name text) language sql stable security definer set search_path=pg_catalog,public as $$
 select t.id,t.name from public.teams t where public.duct_rental_has_entry() and
 (public.duct_rental_has_access('duct_rental.request.create',null,null) or public.duct_rental_has_access('duct_rental.settings.manage',null,null)
 or exists(select 1 from public.user_teams u where u.team_id=t.id and u.user_id=public.current_platform_user_id())) order by t.name;
$$;
create function public.duct_rental_install_coordinators(center text) returns table(id uuid,display_name text,email text,phone text) language sql stable security definer set search_path=pg_catalog,public as $$
 select distinct p.id,coalesce(p.display_name,p.email) as display_name,p.email,coalesce(s.coordinator_phones->>p.id::text,'') as phone from public.profiles p
 join public.local_credentials c on c.user_id=p.id cross join public.duct_rental_settings s
 where public.duct_rental_has_entry() and p.status='active' and not c.must_change_password
 and (public.duct_rental_has_access('duct_rental.settings.manage',null,null)
  or public.duct_rental_has_access('duct_rental.request.create',public.current_platform_user_id(),(s.service_center_teams->>center)::uuid))
 and (center='' and public.duct_rental_has_access('duct_rental.settings.manage',null,null)
  or exists(select 1 from public.user_teams u where u.user_id=p.id and u.team_id::text=s.service_center_teams->>center))
 and exists(select 1 from public.user_role_assignments a join public.role_permissions rp on rp.role_id=a.role_id
  join public.data_scope_grants g on g.assignment_id=a.id and (g.permission_code is null or g.permission_code=rp.permission_code)
  where a.user_id=p.id and rp.permission_code in ('duct_rental.install.accept','duct_rental.install.submit') and a.valid_from<=now() and (a.valid_until is null or a.valid_until>now())) order by display_name,p.id;
$$;
revoke all on function public.duct_rental_guard_settings(),public.duct_rental_team_options(),public.duct_rental_install_coordinators(text) from public;
grant execute on function public.duct_rental_team_options(),public.duct_rental_install_coordinators(text) to duct_rental_runtime;
grant create on schema public to duct_rental_policy_worker;
alter function public.duct_rental_guard_settings() owner to duct_rental_policy_worker;
alter function public.duct_rental_team_options() owner to duct_rental_policy_worker;
alter function public.duct_rental_install_coordinators(text) owner to duct_rental_policy_worker;
revoke create on schema public from duct_rental_policy_worker;
