-- Source useRequestStore.ts rateNoticeData/guaranteeData JSON shapes remain intact.
-- Keep financial JSON on its existing private RLS row; numeric columns are validated projections.
-- No Source data import/backfill, real-user assignments or account changes.
alter table public.duct_rental_rates add column rate_notice_data jsonb not null default '{}'::jsonb,
 add column guarantee_data jsonb not null default '{}'::jsonb;
alter table public.duct_rental_rates add constraint duct_financial_json_objects check
 (jsonb_typeof(rate_notice_data)='object' and jsonb_typeof(guarantee_data)='object');
create function public.duct_rental_guard_financial_json() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare phase text;
begin
 select r.phase into phase from public.duct_rental_requests r where r.id=new.request_id;
 if tg_op='UPDATE' and phase='3RD_PARTY_2' and new.rate_notice_data is distinct from old.rate_notice_data then raise exception 'Rate notice JSON is frozen' using errcode='23514'; end if;
 if phase='3RD_PARTY_1' and new.guarantee_data<>'{}'::jsonb then raise exception 'Contract phase required' using errcode='23514'; end if;
 if new.rate_notice_data ? 'monthlyFee' and (new.rate_notice_data->>'monthlyFee')::numeric(12,2) is distinct from new.monthly_fee then raise exception 'Monthly projection mismatch' using errcode='23514'; end if;
 if new.rate_notice_data ? 'yearlyFee' and (new.rate_notice_data->>'yearlyFee')::numeric(12,2) is distinct from new.yearly_fee then raise exception 'Yearly projection mismatch' using errcode='23514'; end if;
 if new.guarantee_data ? 'fullAmount' and nullif(new.guarantee_data->>'fullAmount','')::numeric(12,2) is distinct from new.guarantee_amount then raise exception 'Guarantee projection mismatch' using errcode='23514'; end if;
 return new;
end $$;
revoke all on function public.duct_rental_guard_financial_json() from public;
create trigger duct_financial_json_guard before insert or update on public.duct_rental_rates for each row execute function public.duct_rental_guard_financial_json();
grant create on schema public to duct_rental_policy_worker;
alter function public.duct_rental_guard_financial_json() owner to duct_rental_policy_worker;
revoke create on schema public from duct_rental_policy_worker;
