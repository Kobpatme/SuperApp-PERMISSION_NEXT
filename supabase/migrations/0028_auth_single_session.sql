-- Additive session tombstones; feature flag permits multiple active sessions.
alter table public.auth_sessions add column if not exists revoked_at timestamptz;
alter table public.auth_sessions add column if not exists revoked_reason text;
alter table public.auth_sessions add constraint auth_sessions_revocation_check check (
  (revoked_at is null and revoked_reason is null) or
  (revoked_at is not null and revoked_reason is not null and revoked_reason in ('superseded', 'admin_revoked', 'password_changed'))
);
create index auth_sessions_active_user_idx on public.auth_sessions(user_id) where revoked_at is null;
create index auth_sessions_revoked_at_idx on public.auth_sessions(revoked_at) where revoked_at is not null;
