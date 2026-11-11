-- PO tracking (local staging only): imported PO lines are immutable source records;
-- receipts are append-only events and corrections are void + replacement, never delete.
create table public.po_lines (
  id uuid primary key default gen_random_uuid(),
  import_run_id uuid not null references public.source_import_runs(id) on delete restrict,
  source_id text not null,
  source_row_number integer not null check (source_row_number > 0),
  po_number text not null check (length(btrim(po_number)) between 1 and 40),
  material_code text not null check (length(btrim(material_code)) between 1 and 80),
  description text not null check (length(btrim(description)) between 1 and 500),
  unit text not null check (unit in ('M', 'PC', 'SET', 'EA')),
  ordered_qty numeric(18, 4) check (ordered_qty is null or ordered_qty >= 0),
  initial_received_qty numeric(18, 4) check (initial_received_qty is null or initial_received_qty >= 0),
  unit_price numeric(18, 4) not null check (unit_price >= 0),
  po_amount numeric(18, 2) check (po_amount is null or po_amount >= 0),
  stock_qty numeric(18, 4) check (stock_qty is null or stock_qty >= 0),
  source_outstanding_qty numeric(18, 4) check (source_outstanding_qty is null or source_outstanding_qty >= 0),
  po_release_date date not null,
  last_gr_date date,
  eta_date date,
  eta_text text check (eta_text is null or length(eta_text) <= 200),
  order_code text check (order_code is null or length(order_code) <= 60),
  vendor_code text check (vendor_code is null or length(vendor_code) <= 60),
  vendor_name text check (vendor_name is null or length(vendor_name) <= 300),
  status text not null default 'open' check (status in ('open', 'on_hold', 'closed')),
  note text not null default '' check (length(note) <= 2000),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint po_lines_import_source_key unique (import_run_id, source_id),
  constraint po_lines_source_key unique (source_id),
  constraint po_lines_eta_source_check check (eta_date is null or eta_text is null)
);
create index po_lines_po_idx on public.po_lines(po_number);
create index po_lines_material_idx on public.po_lines(material_code);
create index po_lines_order_idx on public.po_lines(order_code);
create index po_lines_status_idx on public.po_lines(status, eta_date);
create index po_lines_import_idx on public.po_lines(import_run_id);

create table public.po_receipts (
  id uuid primary key default gen_random_uuid(),
  line_id uuid not null references public.po_lines(id) on delete restrict,
  received_on date not null,
  quantity numeric(18, 4) not null check (quantity > 0),
  reference text not null check (length(btrim(reference)) between 1 and 120),
  note text not null default '' check (length(note) <= 1000),
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  replaces_receipt_id uuid references public.po_receipts(id) on delete restrict,
  voided_at timestamptz,
  voided_by uuid references public.profiles(id) on delete restrict,
  void_reason text,
  created_at timestamptz not null default now(),
  constraint po_receipts_void_check check (
    (voided_at is null and voided_by is null and void_reason is null)
    or (voided_at is not null and voided_by is not null and length(btrim(void_reason)) between 3 and 500)
  ),
  constraint po_receipts_replacement_check check (replaces_receipt_id is null or replaces_receipt_id <> id)
);
create index po_receipts_line_idx on public.po_receipts(line_id, received_on, created_at);
create unique index po_receipts_active_reference_idx
  on public.po_receipts(line_id, lower(btrim(reference))) where voided_at is null;

-- Source columns never change after import; only ETA, status and note may be edited.
create function public.guard_po_line() returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'DELETE' then raise exception 'Imported PO lines are immutable' using errcode = '23514'; end if;
  if tg_op = 'INSERT' then
    if new.version <> 1 or new.status <> 'open' or new.note <> '' then raise exception 'Invalid initial PO line state' using errcode = '23514'; end if;
    return new;
  end if;
  if new.id <> old.id or new.import_run_id <> old.import_run_id or new.source_id <> old.source_id
    or new.po_number <> old.po_number or new.material_code <> old.material_code or new.description <> old.description
    or new.unit <> old.unit or new.ordered_qty is distinct from old.ordered_qty
    or new.initial_received_qty is distinct from old.initial_received_qty or new.unit_price <> old.unit_price
    or new.po_amount is distinct from old.po_amount or new.stock_qty is distinct from old.stock_qty
    or new.source_outstanding_qty is distinct from old.source_outstanding_qty
    or new.po_release_date <> old.po_release_date or new.last_gr_date is distinct from old.last_gr_date
    or new.order_code is distinct from old.order_code or new.vendor_code is distinct from old.vendor_code
    or new.vendor_name is distinct from old.vendor_name or new.created_at <> old.created_at then
    raise exception 'Imported PO source fields are immutable' using errcode = '23514';
  end if;
  if new.version <> old.version + 1 then raise exception 'PO line version must increment' using errcode = '23514'; end if;
  return new;
end $$;
create trigger guard_po_line before insert or update or delete on public.po_lines
  for each row execute function public.guard_po_line();

-- Serialize receipt writes per line, then reject any total above the ordered quantity.
create function public.guard_po_receipt() returns trigger language plpgsql set search_path = public as $$
declare
  line_ordered numeric;
  line_initial numeric;
  already_received numeric;
begin
  if tg_op = 'DELETE' then raise exception 'PO receipts cannot be deleted; void and replace instead' using errcode = '23514'; end if;
  if tg_op = 'UPDATE' then
    if old.voided_at is not null or new.voided_at is null
      or new.id <> old.id or new.line_id <> old.line_id or new.received_on <> old.received_on
      or new.quantity <> old.quantity or new.reference <> old.reference or new.note <> old.note
      or new.recorded_by <> old.recorded_by or new.replaces_receipt_id is distinct from old.replaces_receipt_id
      or new.created_at <> old.created_at or new.voided_by is null or length(btrim(new.void_reason)) < 3 then
      raise exception 'PO receipt updates are limited to one void with a reason' using errcode = '23514';
    end if;
    return new;
  end if;
  select ordered_qty, coalesce(initial_received_qty, 0) into line_ordered, line_initial
    from public.po_lines where id = new.line_id for update;
  if not found then raise exception 'PO line not found' using errcode = '23503'; end if;
  if line_ordered is null then raise exception 'LINE_QUANTITY_INCOMPLETE' using errcode = '23514'; end if;
  if new.received_on > current_date then raise exception 'Receipt date cannot be in the future' using errcode = '23514'; end if;
  if length(btrim(new.reference)) < 1 then raise exception 'Receipt reference is required' using errcode = '23514'; end if;
  if new.replaces_receipt_id is not null and not exists (
    select 1 from public.po_receipts r where r.id = new.replaces_receipt_id and r.line_id = new.line_id and r.voided_at is not null
  ) then raise exception 'Replacement must reference a voided receipt of the same line' using errcode = '23514'; end if;
  select coalesce(sum(quantity), 0) into already_received from public.po_receipts
    where line_id = new.line_id and voided_at is null;
  if line_initial + already_received + new.quantity > line_ordered then
    raise exception 'OVER_RECEIPT' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger guard_po_receipt before insert or update or delete on public.po_receipts
  for each row execute function public.guard_po_receipt();

alter table public.po_lines enable row level security;
alter table public.po_lines force row level security;
alter table public.po_receipts enable row level security;
alter table public.po_receipts force row level security;
grant select, insert, update on public.po_lines, public.po_receipts to permission_core_runtime;
create policy po_lines_service_select on public.po_lines for select to permission_core_runtime using (true);
create policy po_lines_service_insert on public.po_lines for insert to permission_core_runtime with check (true);
create policy po_lines_service_update on public.po_lines for update to permission_core_runtime using (true) with check (true);
create policy po_receipts_service_select on public.po_receipts for select to permission_core_runtime using (true);
create policy po_receipts_service_insert on public.po_receipts for insert to permission_core_runtime with check (true);
create policy po_receipts_service_update on public.po_receipts for update to permission_core_runtime using (true) with check (true);

-- Register capabilities in the existing admin catalog; no role or user grants are created.
insert into public.permissions (code, module_id, resource, action, description) values
  ('po_tracking.po.read', 'po_tracking', 'po', 'read', 'ดูรายการติดตาม PO'),
  ('po_tracking.po.manage', 'po_tracking', 'po', 'manage', 'แก้ไขสถานะ ETA และหมายเหตุ PO'),
  ('po_tracking.receipt.record', 'po_tracking', 'receipt', 'record', 'บันทึกการรับของ'),
  ('po_tracking.receipt.correct', 'po_tracking', 'receipt', 'correct', 'แก้ไขการรับของด้วยการยกเลิกและบันทึกใหม่'),
  ('po_tracking.price.read', 'po_tracking', 'price', 'read', 'ดูราคาและมูลค่า PO'),
  ('po_tracking.report.read', 'po_tracking', 'report', 'read', 'ดูแดชบอร์ดและรายงาน PO'),
  ('po_tracking.import.manage', 'po_tracking', 'import', 'manage', 'ตรวจสอบการนำเข้าและกระทบยอด PO')
on conflict (code) do nothing;
