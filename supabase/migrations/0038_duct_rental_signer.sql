create function public.duct_rental_signer_identity() returns table(display_name text,active boolean) language sql stable security definer set search_path=pg_catalog,public as $$
 select coalesce(p.display_name,p.email),p.status='active' and not c.must_change_password and public.duct_rental_has_access('duct_rental.signoff.sign',p.id,null)
 from public.profiles p join public.local_credentials c on c.user_id=p.id where p.id=public.current_platform_user_id();
$$;
revoke all on function public.duct_rental_signer_identity() from public;
grant execute on function public.duct_rental_signer_identity() to duct_rental_runtime;
grant create on schema public to duct_rental_policy_worker;
alter function public.duct_rental_signer_identity() owner to duct_rental_policy_worker;
revoke create on schema public from duct_rental_policy_worker;
alter table public.duct_rental_requests add constraint duct_guarantee_amount_private check(guarantee is null or not(guarantee ? 'fullAmount'));
