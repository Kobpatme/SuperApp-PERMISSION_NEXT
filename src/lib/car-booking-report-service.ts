import { sql,type SQL } from "drizzle-orm";
import { z } from "zod";
import type { DatabaseTransaction } from "@/db";
import { withCarBookingTransaction,type CarBookingContext } from "./car-booking-service";
import { CarBookingError } from "./car-booking-input";
import { buildOspRow,ospColumns,ospCsv,type OspSource } from "./car-booking-osp";
export const reportFilterSchema=z.object({month:z.union([z.literal("all"),z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)]).default("all"),offset:z.coerce.number().int().min(0).max(1000000).default(0)}).strict();
function condition(month:string):SQL{
 if(month==="all")return sql`true`;
 const start=new Date(`${month}-01T00:00:00+07:00`),next=new Date(start.getTime()+7*3600000);next.setUTCMonth(next.getUTCMonth()+1);
 return sql`b.start_time>=${start.toISOString()}::timestamptz and b.start_time<${new Date(next.getTime()-7*3600000).toISOString()}::timestamptz`;
}
export async function ospSourceRows(tx:DatabaseTransaction,month="all",offset?:number){
 return tx.execute<OspSource&{sequence:string;total:string}>(sql`select b.*,c.license_plate,row_number() over(order by b.start_time,b.id)::text as sequence,count(*) over()::text as total,
 coalesce(l.logs,'[]'::jsonb) as logs from public.car_booking_bookings b join public.car_booking_cars c on c.id=b.car_id
 left join lateral(select jsonb_agg(jsonb_build_object('id',l.id,'log_time',l.log_time,'log_type',l.log_type,'location',l.location,'mileage',l.mileage::text,'refueled',l.refueled,'fuel_liters',l.fuel_liters::text,'fuel_amount',l.fuel_amount::text,'note',l.note,'gps_latitude',l.gps_latitude::text,'gps_longitude',l.gps_longitude::text,'gps_accuracy_meters',l.gps_accuracy_meters::text) order by l.log_time,l.id) as logs from public.car_booking_logs l where l.booking_id=b.id) l on true
 where b.status='completed' and ${condition(month)} order by b.start_time,b.id ${offset===undefined?sql``:sql`limit 50 offset ${offset}`}`);
}
export async function readOspReport(raw:unknown,context:CarBookingContext,download=false){
 const filter=reportFilterSchema.parse(raw);
 return withCarBookingTransaction(context,async(tx,admin)=>{
  if(!admin)throw new CarBookingError("FORBIDDEN","เฉพาะผู้ดูแลระบบจองรถเท่านั้น",403);
  const sources=await ospSourceRows(tx,filter.month,download?undefined:filter.offset),rows=sources.map(row=>buildOspRow(row,Number(row.sequence)));
  if(download)return {csv:ospCsv(rows)};
  const total=sources[0]?Number(sources[0].total):Number((await tx.execute<{total:string}>(sql`select count(*)::text as total from car_booking_bookings b where b.status='completed' and ${condition(filter.month)}`))[0].total);
  return {columns:ospColumns,rows,total,offset:filter.offset,limit:50,nextOffset:filter.offset+rows.length<total?filter.offset+50:null};
 });
}
export async function readCarDashboard(raw:unknown,context:CarBookingContext){
 const filter=reportFilterSchema.parse(raw);
 return withCarBookingTransaction(context,async(tx,admin)=>{
  if(!admin)throw new CarBookingError("FORBIDDEN","เฉพาะผู้ดูแลระบบจองรถเท่านั้น",403);
  const metrics=sql`with metrics as(select b.*,c.license_plate,case when b.status='completed' then coalesce(r.distance_km,0) else 0 end as distance,case when b.status='completed' then coalesce(r.total_fuel_liters,0) else 0 end as liters,case when b.status='completed' then coalesce(r.total_fuel_amount,0) else 0 end as amount from public.car_booking_bookings b join public.car_booking_cars c on c.id=b.car_id left join public.car_booking_osp_report r on r.id=b.id where b.status<>'cancelled' and ${condition(filter.month)})`;
  const [result]=await tx.execute<{
   totals:{total:number;completed:number;active:number;upcoming:number;distance:string;liters:string;amount:string};
   cars:{car_id:string;license_plate:string;count:number;distance:string;liters:string;amount:string}[];
   topUsers:{user_id:string;employee_name:string;count:number}[];
   bookings:{id:string;license_plate:string;employee_name:string;destination:string;status:string;start_time:string;distance:string;liters:string;amount:string}[];
  }>(sql`${metrics}, totals as(select count(*)::int as total,count(*) filter(where status='completed')::int as completed,count(*) filter(where status='booked' and start_time<=now())::int as active,count(*) filter(where status='booked' and start_time>now())::int as upcoming,coalesce(sum(distance),0)::text as distance,coalesce(sum(liters),0)::text as liters,coalesce(sum(amount),0)::text as amount from metrics),
   car_totals as(select car_id,license_plate,count(*)::int as count,sum(distance)::text as distance,sum(liters)::text as liters,sum(amount)::text as amount from metrics group by car_id,license_plate),
   top_users as(select user_id,max(employee_name) as employee_name,count(*)::int as count from metrics group by user_id order by count desc,user_id limit 5),
   page as(select id,license_plate,employee_name,destination,status,start_time,distance::text,liters::text,amount::text from metrics order by start_time,id limit 50 offset ${filter.offset})
   select (select to_jsonb(t) from totals t) as totals,coalesce((select jsonb_agg(to_jsonb(c) order by count desc,license_plate,car_id) from car_totals c),'[]'::jsonb) as cars,coalesce((select jsonb_agg(to_jsonb(u) order by count desc,user_id) from top_users u),'[]'::jsonb) as "topUsers",coalesce((select jsonb_agg(to_jsonb(p) order by start_time,id) from page p),'[]'::jsonb) as bookings`);
  return {...result,offset:filter.offset,limit:50,nextOffset:filter.offset+result.bookings.length<result.totals.total?filter.offset+50:null};
 });
}
