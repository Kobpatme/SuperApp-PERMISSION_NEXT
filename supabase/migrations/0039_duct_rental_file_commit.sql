grant select on public.duct_rental_signature_assets to duct_rental_policy_worker;
create function public.duct_rental_file_committed(key text) returns boolean language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
 if not public.duct_rental_has_entry() then raise exception 'Entry denied' using errcode='42501'; end if;
 return exists(select 1 from public.duct_rental_documents where storage_key=key)
   or exists(select 1 from public.duct_rental_signature_assets where storage_key=key);
end $$;
revoke all on function public.duct_rental_file_committed(text) from public;
grant execute on function public.duct_rental_file_committed(text) to duct_rental_runtime;
grant create on schema public to duct_rental_policy_worker;
alter function public.duct_rental_file_committed(text) owner to duct_rental_policy_worker;
revoke create on schema public from duct_rental_policy_worker;
