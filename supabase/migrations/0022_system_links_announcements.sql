create table public.system_links (
 id uuid primary key default gen_random_uuid(), name text not null, description text not null default '', url text not null, icon text not null default 'link',
 status text not null default 'Active' check (status in ('Active','Maintenance','Coming Soon','Hidden')), visible_to_all boolean not null default false,
 version integer not null default 1 check(version>0), created_by uuid not null references public.profiles(id), updated_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.system_link_roles (
 link_id uuid not null references public.system_links(id) on delete cascade, role_id uuid not null references public.roles(id),
 created_by uuid not null references public.profiles(id), updated_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), primary key(link_id,role_id)
);
create table public.system_link_teams (
 link_id uuid not null references public.system_links(id) on delete cascade, team_id uuid not null references public.teams(id),
 created_by uuid not null references public.profiles(id), updated_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), primary key(link_id,team_id)
);
create table public.admin_announcements (
 id uuid primary key default gen_random_uuid(), message text not null check(length(message)<=4000), is_active boolean not null default false, version integer not null default 1 check(version>0),
 created_by uuid not null references public.profiles(id), updated_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.system_links enable row level security;
alter table public.system_link_roles enable row level security;
alter table public.system_link_teams enable row level security;
alter table public.admin_announcements enable row level security;
-- Tables are server-only, deny by default. Role/team visibility is verified by server identity.
create policy system_links_manage on public.system_links for all using(public.has_scoped_permission('core.system_link.manage',null,null)) with check(public.has_scoped_permission('core.system_link.manage',null,null));
create policy announcements_manage on public.admin_announcements for all using(public.has_scoped_permission('core.announcement.manage',null,null)) with check(public.has_scoped_permission('core.announcement.manage',null,null));
insert into public.permissions(code,module_id,resource,action,description) values
 ('core.system_link.manage','core','system_link','manage','จัดการลิงก์ระบบ'),('core.announcement.manage','core','announcement','manage','จัดการประกาศ') on conflict do nothing;
insert into public.role_permissions(role_id,permission_code) select r.id,p.code from public.roles r cross join public.permissions p where r.code='platform_admin' and p.code in ('core.system_link.manage','core.announcement.manage') on conflict do nothing;
