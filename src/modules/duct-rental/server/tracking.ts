import { sql } from "drizzle-orm";
import { z } from "zod";
import { transaction, type DuctContext } from "./transaction";
type TrackingRow = { id: string; kind: "Renew" | "Cancel"; routeId: string; reference: string; title: string; status: string; owner: string; start: Date; due: Date; completed: Date | null; sla: "On Track" | "Near Due" | "Overdue" | "Completed" };
export async function readTracking(raw: unknown, context: DuctContext) {
 const input = z.object({ query: z.string().max(200).default(""), kind: z.enum(["","Renew","Cancel"]).default(""), owner: z.enum(["","Team Design","3rd Party","Team Permission","Completed"]).default(""), sla: z.enum(["","On Track","Near Due","Overdue","Completed"]).default(""), offset: z.coerce.number().int().min(0).max(1000000).default(0), limit: z.coerce.number().int().min(1).max(100).default(50) }).strict().parse(raw);
 const base = sql`with items as (
 select id,'Renew'::text as kind,concat('YEAR-',year) as "routeId",coalesce(contract_number,'-') as reference,concat('ต่อสัญญาปี ',year+543,' (',year,')') as title,status,
 case when status in ('sent_to_3rdparty','provider_confirmed') then '3rd Party' when status='memo_preparing' then 'Team Permission' when status='contracted' then 'Completed' else 'Team Design' end as owner,
 created_at as start,created_at+interval '168 hours' as due,coalesce(contracted_at,case when status='contracted' then updated_at end) as completed from public.duct_rental_renewals where archived_at is null
 union all
 select id,'Cancel',snapshot->>'code',coalesce(contract_end::text,snapshot->>'code'),snapshot->>'projectName',status,
 case when status='completed' then 'Completed' when status='rejected' then 'Team Design' else 'Team Permission' end,
 created_at,created_at+interval '120 hours',coalesce(completed_at,rejected_at,case when status='rejected' then updated_at end) from public.duct_rental_cancellations where archived_at is null
 ), marked as (select *,case when completed is not null then 'Completed' when ceil(extract(epoch from due-now())/86400)<0 then 'Overdue' when ceil(extract(epoch from due-now())/86400)<=1 then 'Near Due' else 'On Track' end as sla from items)`;
 const filters = sql`where (${input.query}='' or strpos(lower(concat_ws(' ',"routeId",reference,title)),lower(${input.query}))>0) and (${input.kind}='' or kind=${input.kind}) and (${input.owner}='' or owner=${input.owner}) and (${input.sla}='' or sla=${input.sla})`;
 return transaction(context, async tx => {
  const rows = Array.from(await tx.execute<TrackingRow>(sql`${base} select * from marked ${filters} order by start desc,id limit ${input.limit} offset ${input.offset}`));
  const [counts] = await tx.execute<{ total: number; completed: number; overdue: number; nearDue: number; active: number }>(sql`${base} select count(*)::int as total,count(*) filter(where sla='Completed')::int as completed,count(*) filter(where sla='Overdue')::int as overdue,count(*) filter(where sla='Near Due')::int as "nearDue",count(*) filter(where sla<>'Completed')::int as active from marked ${filters}`);
  return { rows, counts, nextOffset: input.offset+rows.length<counts.total ? input.offset+rows.length : null };
 });
}
