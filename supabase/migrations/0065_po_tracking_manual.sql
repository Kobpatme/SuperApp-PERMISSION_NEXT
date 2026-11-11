-- Manual PO entry alongside the immutable import lineage (local staging).
-- Additive only: no grants, roles, policies, users or data are changed.
--
-- An imported line keeps `import_run_id`/`source_id`/`source_row_number` and
-- remains immutable except ETA, status and note. A manual line has no import
-- lineage and its master data may be edited, but never deleted, with the same
-- version and receipt guards.

alter table public.po_lines add column origin text not null default 'import';
alter table public.po_lines add constraint po_lines_origin_check check (origin in ('import', 'manual'));
alter table public.po_lines alter column import_run_id drop not null;
alter table public.po_lines alter column source_id drop not null;
alter table public.po_lines alter column source_row_number drop not null;
alter table public.po_lines add constraint po_lines_lineage_check check (
  (origin = 'import' and import_run_id is not null and source_id is not null
    and source_row_number is not null and source_row_number > 0)
  or (origin = 'manual' and import_run_id is null and source_id is null and source_row_number is null)
);
-- Manual lines are created with an order quantity so receipts can be recorded
-- against a complete quantity from the first day.
alter table public.po_lines add constraint po_lines_manual_qty_check check (origin <> 'manual' or ordered_qty is not null);
create index po_lines_origin_idx on public.po_lines(origin);

create or replace function public.guard_po_line() returns trigger language plpgsql set search_path = public as $$
declare
  received numeric;
begin
  if tg_op = 'DELETE' then raise exception 'PO lines cannot be deleted; void the line status instead' using errcode = '23514'; end if;

  if tg_op = 'INSERT' then
    if new.origin = 'manual' then
      if new.import_run_id is not null or new.source_id is not null or new.source_row_number is not null
        or new.version <> 1 then
        raise exception 'Invalid manual PO line lineage' using errcode = '23514';
      end if;
      return new;
    end if;
    if new.import_run_id is null or new.source_id is null or new.source_row_number is null then
      raise exception 'Imported PO line requires source lineage' using errcode = '23514';
    end if;
    if new.version <> 1 or new.status <> 'open' or new.note <> '' then raise exception 'Invalid initial PO line state' using errcode = '23514'; end if;
    return new;
  end if;

  if new.id <> old.id or new.origin <> old.origin or new.created_at <> old.created_at then
    raise exception 'PO line identity is immutable' using errcode = '23514';
  end if;
  if new.version <> old.version + 1 then raise exception 'PO line version must increment' using errcode = '23514'; end if;

  if old.origin = 'import' then
    if new.import_run_id <> old.import_run_id or new.source_id <> old.source_id
      or new.po_number <> old.po_number or new.material_code <> old.material_code or new.description <> old.description
      or new.unit <> old.unit or new.ordered_qty is distinct from old.ordered_qty
      or new.initial_received_qty is distinct from old.initial_received_qty or new.unit_price <> old.unit_price
      or new.po_amount is distinct from old.po_amount or new.stock_qty is distinct from old.stock_qty
      or new.source_outstanding_qty is distinct from old.source_outstanding_qty
      or new.po_release_date <> old.po_release_date or new.last_gr_date is distinct from old.last_gr_date
      or new.order_code is distinct from old.order_code or new.vendor_code is distinct from old.vendor_code
      or new.vendor_name is distinct from old.vendor_name then
      raise exception 'Imported PO source fields are immutable' using errcode = '23514';
    end if;
    return new;
  end if;

  -- Manual line: lineage must stay empty and quantities must stay above what
  -- has already been received. Units are locked once a receipt exists because
  -- receipt quantities carry the line's unit implicitly.
  if new.import_run_id is not null or new.source_id is not null or new.source_row_number is not null then
    raise exception 'Manual PO line cannot acquire import lineage' using errcode = '23514';
  end if;
  if new.unit <> old.unit and exists (
    select 1 from public.po_receipts r where r.line_id = old.id and r.voided_at is null
  ) then
    raise exception 'UNIT_LOCKED: unit cannot change after receipts exist' using errcode = '23514';
  end if;
  select coalesce(sum(quantity), 0) into received from public.po_receipts
    where line_id = old.id and voided_at is null;
  if coalesce(new.initial_received_qty, 0) + received > new.ordered_qty then
    raise exception 'OVER_RECEIPT' using errcode = '23514';
  end if;
  return new;
end $$;
