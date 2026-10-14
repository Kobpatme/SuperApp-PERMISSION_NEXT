-- PostgreSQL NOTIFY delivers after commit. Payload never contains record identifiers or data.
create function public.duct_rental_signal_change() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin perform pg_notify('duct_rental_changed',''); return null; end $$;
revoke all on function public.duct_rental_signal_change() from public;
do $$ declare item text; begin
 foreach item in array array['requests','rates','documents','sign_tasks','signature_assets','renewals','renewal_routes','cancellations','settings','signoff_configs'] loop
  execute format('create trigger duct_signal_change after insert or update on public.%I for each statement execute function public.duct_rental_signal_change()', 'duct_rental_'||item);
 end loop;
end $$;
