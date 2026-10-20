-- Team management permission for the organization-managed admin workspace.
insert into public.permissions(code,module_id,resource,action,description) values
  ('core.team.manage','core','team','manage','Create and manage organizational teams')
on conflict(code) do update set description=excluded.description;

