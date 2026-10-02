-- Location metadata is additive. Existing/imported buildings remain valid without coordinates.
alter table public.buildings
  add column if not exists latitude numeric(10,7),
  add column if not exists longitude numeric(11,7),
  add column if not exists location_accuracy numeric(10,2),
  add column if not exists location_source text,
  add column if not exists location_verified boolean not null default false,
  add column if not exists location_verified_at timestamptz,
  add column if not exists location_verified_by uuid references public.profiles(id) on delete set null,
  add column if not exists location_updated_at timestamptz,
  add column if not exists address text,
  add column if not exists subdistrict text,
  add column if not exists district text,
  add column if not exists province text,
  add column if not exists postcode text,
  add column if not exists longdo_place_id text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'buildings_location_coordinate_check') then
    alter table public.buildings add constraint buildings_location_coordinate_check
      check ((latitude is null and longitude is null) or (latitude between -90 and 90 and longitude between -180 and 180));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'buildings_location_accuracy_check') then
    alter table public.buildings add constraint buildings_location_accuracy_check check (location_accuracy is null or location_accuracy >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'buildings_location_source_check') then
    alter table public.buildings add constraint buildings_location_source_check check (location_source is null or location_source in ('gps','manual_pin','search','import'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'buildings_location_verification_check') then
    alter table public.buildings add constraint buildings_location_verification_check
      check (not location_verified or (latitude is not null and longitude is not null and location_verified_at is not null and location_verified_by is not null));
  end if;
end $$;

create index if not exists buildings_location_idx on public.buildings(latitude, longitude);
