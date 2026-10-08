import {readFile,writeFile} from 'node:fs/promises';
import {parse} from 'dotenv';
import {randomUUID} from 'node:crypto';
import postgres from 'postgres';
import {drizzle} from 'drizzle-orm/postgres-js';
import {sql} from 'drizzle-orm';
import {it,expect,vi} from 'vitest';
import * as schema from '@/db/schema';
const fake=vi.hoisted(()=>({transaction:vi.fn()}));
vi.mock('@/lib/car-booking-db',()=>({getCarBookingDb:()=>fake}));
import {saveCar,createCarBookings,addCarBookingLog,returnCarBooking,cancelCarBooking,readCars,readCarCalendar} from '@/lib/car-booking-service';
import {readOspReport} from '@/lib/car-booking-report-service';
it.skipIf(process.env.CAR_BOOKING_LOCAL_UAT_TEST!=='1')('main constrained login executes material journeys with RLS, then rolls back all test rows',async()=>{
 const env=parse(await readFile('.env.local','utf8')),state=JSON.parse(await readFile('.data/car-booking-uat/state.json','utf8'));
 const target=new URL(env.CAR_BOOKING_DATABASE_URL);expect(target.pathname).toBe('/permission_superapp_dev');expect(target.username).toBe('permission_car_booking_runtime');
 const client=postgres(target.href,{max:1,prepare:false}),db=drizzle(client,{schema});
 const ctx={actorId:state.actor,displayName:'UAT rollback check',requestId:randomUUID()},marker='UAT-'+randomUUID();
 let checks=false;const rollback=new Error('EXPECTED_UAT_ROLLBACK');
 try{await expect(db.transaction(async tx=>{
  fake.transaction.mockImplementation((run:(value:typeof tx)=>unknown)=>run(tx));
  const [role]=await tx.execute<{safe:boolean}>(sql`select not rolsuper and not rolbypassrls as safe from pg_roles where rolname=current_user`);expect(role.safe).toBe(true);
  const car=await saveCar({licensePlate:marker,latestMileage:'0',parkingFloor:'2A',isActive:true},ctx);
  const times={startTime:'2026-01-01T01:00:00Z',endTime:'2026-01-01T02:00:00Z'};
  const {ids}=await createCarBookings({carId:car.id,destination:marker,intervals:[times]},ctx);const id=ids[0];
  await addCarBookingLog(id,{logTime:'2026-01-01T01:30:00Z',logType:'fuel',location:marker,mileage:'10',refueled:true,fuelLiters:'10',fuelAmount:'400',note:''},ctx);
  await returnCarBooking(id,{actualReturnTime:'2026-01-01T02:30:00Z',mileage:'20',parkingFloor:'3B',refueled:true,fuelMileage:'20',fuelLiters:'30',fuelAmount:'1200'},ctx);
  const report=await readOspReport({month:'2026-01',offset:0},ctx);expect('rows' in report).toBe(true);if('rows' in report){const row=report.rows.find(row=>row[0]===id);expect(row?.[8]).toBe('20');expect(row?.[16]).toBe('40');expect(row?.[17]).toBe('1600');}
  const calendar=await readCarCalendar({startTime:'2026-01-01T01:00:00Z',endTime:'2026-01-01T03:00:00Z'},ctx);expect(calendar.length).toBeGreaterThan(0);
  const second=(await createCarBookings({carId:car.id,destination:marker,intervals:[{startTime:'2026-01-01T02:00:00Z',endTime:'2026-01-01T03:00:00Z'}]},ctx)).ids[0];await cancelCarBooking(second,ctx);
  const cars=await readCars(ctx);expect(cars.find(row=>row.car_id===car.id)?.latest_mileage).toBe('20');
  const [jobs]=await tx.execute<{count:number}>(sql`select count(*)::int as count from car_booking_osp_jobs where booking_id=${id}::uuid`);expect(jobs.count).toBe(1);
  checks=true;throw rollback;
 })).rejects.toBe(rollback);
 expect(checks).toBe(true);
 await db.transaction(async tx=>{await tx.execute(sql`select set_config('app.user_id',${ctx.actorId},true)`);expect(await tx.execute(sql`select id from car_booking_cars where license_plate=${marker}`)).toHaveLength(0);expect(await tx.execute(sql`select id from car_booking_bookings where destination=${marker}`)).toHaveLength(0);});
 await writeFile('docs/quality/car-booking-uat/main-service.json',JSON.stringify({constrainedLogin:true,materialJourneyPassed:true,zeroStartMileage:true,fuelLiters:'40',fuelAmount:'1600',lateReturnBoundaryPassed:true,cancelPassed:true,auditInsertSucceeded:true,ospJobInTransaction:1,allTestDomainWritesRolledBack:true},null,2));
 }finally{await client.end();}
},30000);
