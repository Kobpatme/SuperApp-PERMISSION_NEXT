import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
import { fixture, csv } from './car-booking-import-fixture.mjs';
import { planImport } from './car-booking-import-core.mjs';
const f=fixture(),booking=f.data.Bookings[0],log=f.data.BookingLogs[0];
f.data.Bookings=[];f.data.BookingLogs=[];f.data.BookingsOSP=[];
for(let i=0;i<5000;i++){
 const start=new Date(Date.UTC(2045,0,1)+i*3600000),end=new Date(+start+3600000),actual=new Date(+start+2700000),mid=new Date(+start+900000);
 const id=`benchmark-${i}`,mileage=i*100;
 f.data.Bookings.push({...booking,booking_id:id,start_time:start.toISOString(),end_time:end.toISOString(),actual_return_time:actual.toISOString(),start_mileage:String(mileage),mileage_on_return:String(mileage+100),fuel_mileage:String(mileage+90)});
 f.data.BookingLogs.push({...log,log_id:`fuel-${i}`,booking_id:id,log_time:mid.toISOString(),created_at:mid.toISOString(),mileage:String(mileage+50)},{...log,log_id:`stop-${i}`,booking_id:id,log_time:mid.toISOString(),created_at:mid.toISOString(),mileage:String(mileage+50),log_type:'checkpoint',refueled:'false',fuel_liters:'',fuel_amount:''});
}
f.files=Object.fromEntries(Object.entries(f.data).map(([name,rows])=>[name,csv(name,rows)]));
const start=performance.now(),plan=planImport(f.files,f.snapshot,{actor:f.snapshot.profiles[0].id}),durationMs=Math.round(performance.now()-start);
assert.equal(plan.rejected.length,0);assert.equal(plan.rows.Bookings.length,5000);assert.equal(plan.rows.BookingLogs.length,10000);
console.log(JSON.stringify({syntheticBookings:5000,syntheticLogs:10000,plannerMs:durationMs,rejected:0,monthly:plan.monthly,databaseWrites:0,productionBenchmark:false},null,2));
