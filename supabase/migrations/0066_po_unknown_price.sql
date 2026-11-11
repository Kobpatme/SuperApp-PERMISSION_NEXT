-- Unknown price is NULL, distinct from an explicitly agreed zero price.
-- No existing values, accounts, grants or policies are changed.
alter table public.po_lines alter column unit_price drop not null;

-- NULL-safe immutability: the imported price cannot be filled/cleared through
-- ordinary updates. Keep the complete 0065 workflow/receipt guards unchanged.
do $$
declare
  definition text;
begin
  select pg_get_functiondef('public.guard_po_line()'::regprocedure) into definition;
  if position('new.unit_price <> old.unit_price' in definition) > 0 then
    execute replace(definition, 'new.unit_price <> old.unit_price', 'new.unit_price is distinct from old.unit_price');
  elsif position('new.unit_price is distinct from old.unit_price' in definition) = 0 then
    raise exception 'Unexpected PO guard definition; review before applying';
  end if;
end $$;

-- Rollback: SET NOT NULL is only possible after reviewing all unknown-price
-- rows. Never backfill zero automatically to make rollback succeed.
