-- Compatibility for databases created before profiles became the local identity source.
alter table public.profiles alter column id set default gen_random_uuid();
