-- PostgreSQL evaluates every applicable permissive policy; AND/OR do not
-- guarantee short circuit. Existing car policies reference these read-only
-- predicates even for a duct event. Grant predicates only, never car tables,
-- lock/write functions, group membership or broader Core privileges.
grant execute on function public.car_booking_has_access(text,uuid),public.car_booking_can_manage_access() to duct_rental_runtime;
