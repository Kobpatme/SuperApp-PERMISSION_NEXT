-- Duct-only event predicates are private. Do not evaluate their ACLs for other
-- constrained module runtimes inserting into the shared Core evidence tables.
-- Keep predicate bodies, restrictive boundaries, data and function grants intact.
alter policy duct_activity_append on public.activity_events to duct_rental_runtime;
alter policy duct_outbox_append on public.outbox_messages to duct_rental_runtime;
