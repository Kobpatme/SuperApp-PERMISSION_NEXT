import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planImport, parseCsv, decimal, date, normalizeEmployee } from './car-booking-import-core.mjs';
import { checkTarget } from './import-car-booking.mjs';
import { fixture, csv } from './car-booking-import-fixture.mjs';
const plan=(f,options={})=>planImport(f.files,f.snapshot,{actor:f.snapshot.profiles[0].id,...options});
test('CSV BOM, escaped quotes, embedded newlines, and private extra columns',()=>{
 const f=fixture(),parsed=parseCsv(f.files.Bookings,'Bookings');assert.equal(parsed[0].data.destination,f.data.Bookings[0].destination);
 const employees=parseCsv('id,name,role,password\r\n101,Test,user,PRIVATE\r\n','Employees');assert.equal('password' in employees[0].data,false);
 assert.throws(()=>parseCsv('id,name,role\n"101','Employees'),/CSV_UNCLOSED/);assert.throws(()=>parseCsv('id,id,name,role\n','Employees'),/CSV_HEADERS/);
});
test('strict calendar parsing and Bangkok/Thai BE conversion',()=>{
 assert.equal(date('01/01/2578 08:00'),'2035-01-01T01:00:00.000Z');assert.equal(date('2035-01-01T08:00Z'),'2035-01-01T08:00:00.000Z');
 for(const value of ['2035-02-29 08:00','2035-04-31 08:00','2035-01-01 24:00','01/02/35','junk'])assert.throws(()=>date(value),/INVALID_DATE/);
});
test('exact decimals preserve zero and large values, reject coercion and infinity',()=>{
 assert.equal(decimal('0'),'0');assert.equal(decimal('9,007,199,254,740,993.01'),'9007199254740993.01');
 for(const value of ['NaN','Infinity','1e3','1,23','-1'])assert.throws(()=>decimal(value));
});
test('employee normalization and reviewed ambiguity override',()=>{
 assert.equal(normalizeEmployee("  '000101  "),'101');const f=fixture();f.snapshot.profiles.push({...f.snapshot.profiles[1],employee_code:'00101'});
 assert.equal(plan(f).rejected.find(r=>r.sheet==='Employees').reason,'AMBIGUOUS_EMPLOYEE');
 assert.equal(plan(f,{mapping:{'00101':f.snapshot.profiles[0].id}}).rows.Bookings.length,1);
});
test('zero mileage plus log and return fuel reconciles to 100km/40 liters/1600 baht',()=>{
 const p=plan(fixture());assert.equal(p.rejected.length,0);assert.deepEqual(Object.values(p.monthly)[0],{bookings:1,distance:'100',liters:'40',amount:'1600'});
 assert.equal(p.regeneratedOsp[0][8],'100');assert.equal(p.regeneratedOsp[0][16],'40');assert.ok(p.ospComparison[0].differences.some(d=>d.classification==='LEGACY_FUEL_BUG'));
});
test('source overlaps reject both; exact boundary and late return cap allow next booking',()=>{
 const f=fixture(),base=f.data.Bookings[0];f.data.Bookings.push({...base,booking_id:'next',employee_id:'102',start_time:'2035-01-01 10:00',end_time:'2035-01-01 12:00',booking_status:'booked',actual_return_time:'',mileage_on_return:'',refueled:'false',fuel_mileage:'',fuel_liters:'',fuel_amount:''});
 f.files.Bookings=csv('Bookings',f.data.Bookings);assert.equal(plan(f).rows.Bookings.length,2);
 f.data.Bookings[1].start_time='2035-01-01 09:59';f.files.Bookings=csv('Bookings',f.data.Bookings);
 const p=plan(f);assert.equal(p.rows.Bookings.length,0);assert.equal(p.rejected.filter(r=>r.reason==='OVERLAPPING_BOOKING').length,2);assert.equal(p.rejected.find(r=>r.sheet==='BookingLogs').reason,'ORPHAN_BOOKING');
});
test('user collisions apply across cars; cancelled bookings do not block',()=>{
 const f=fixture();f.data.Cars.push({...f.data.Cars[0],car_id:'2',license_plate:'SECOND'});f.files.Cars=csv('Cars',f.data.Cars);
 f.data.Bookings.push({...f.data.Bookings[0],booking_id:'second',car_plate:'SECOND'});f.files.Bookings=csv('Bookings',f.data.Bookings);assert.equal(plan(f).rows.Bookings.length,0);
 f.data.Bookings[1]={...f.data.Bookings[1],booking_status:'cancelled',actual_return_time:'',mileage_on_return:'',refueled:'false',fuel_mileage:'',fuel_liters:'',fuel_amount:''};f.files.Bookings=csv('Bookings',f.data.Bookings);assert.equal(plan(f).rows.Bookings.length,2);
});
test('duplicates, orphan cars and malformed row widths are explicit rejections',()=>{
 const f=fixture();f.data.Bookings.push({...f.data.Bookings[0]});f.files.Bookings=csv('Bookings',f.data.Bookings);assert.equal(plan(f).rejected.filter(r=>r.reason==='DUPLICATE_LEGACY_ID').length,2);
 f.files.Bookings=csv('Bookings',[{...f.data.Bookings[0],car_plate:'MISSING'}]);assert.equal(plan(f).rejected.find(r=>r.sheet==='Bookings').reason,'ORPHAN_CAR');
 f.files.Cars='car_id,license_plate,parking_floor,latest_mileage\n1,plate\n';assert.equal(plan(f).rejected.find(r=>r.sheet==='Cars').reason,'CSV_ROW_WIDTH');
});
test('identical rerun keeps approval and changed existing records never overwrite',()=>{
 const f=fixture(),p=plan(f);for(const [sheet,key] of [['Cars','cars'],['Bookings','bookings'],['BookingLogs','logs']])f.snapshot[key]=p.rows[sheet].map(({line,mode,...r})=>{void line;void mode;return r;});
 const repeat=plan(f);assert.equal(repeat.approval,p.approval);assert.equal(repeat.counts.Bookings.unchanged,1);
 f.snapshot.bookings[0].destination='Edited in new app';assert.equal(plan(f).rejected.find(r=>r.sheet==='Bookings').reason,'EXISTING_RECORD_DIFFERS');
});
test('partial GPS and invalid fuel never silently convert to empty values',()=>{
 const f=fixture();f.data.BookingLogs[0].gps_longitude='';f.files.BookingLogs=csv('BookingLogs',f.data.BookingLogs);assert.equal(plan(f).rejected.find(r=>r.sheet==='BookingLogs').reason,'INVALID_GPS');
 f.data.Bookings[0].fuel_amount='0';f.files.Bookings=csv('Bookings',f.data.Bookings);assert.equal(plan(f).rejected.find(r=>r.sheet==='Bookings').reason,'INVALID_FUEL');
});
test('OSP duplicate and noncompleted references are compared only, never imported',()=>{
 const f=fixture();f.data.BookingsOSP.push({...f.data.BookingsOSP[0]},{_booking_id:'missing'});f.files.BookingsOSP=csv('BookingsOSP',f.data.BookingsOSP);const p=plan(f);
 assert.equal(p.ospComparison[0].duplicate,true);assert.equal(p.ospComparison[2].reason,'NO_ACCEPTED_COMPLETED_BOOKING');assert.equal(p.rows.BookingsOSP,undefined);
});
test('review content is approval-bound and live databases cannot be apply targets',()=>{
 const f=fixture();assert.notEqual(plan(f).approval,plan(f,{accessReview:{reviewed:true,grants:[]}}).approval);
 assert.throws(()=>checkTarget('postgres://localhost/permission_superapp_dev',true),/ISOLATED/);assert.throws(()=>checkTarget('postgres://remote/permission_next_car_booking_test',true),/ISOLATED/);
 assert.doesNotThrow(()=>checkTarget('postgres://127.0.0.1:55439/permission_next_car_booking_test',true));
});
test('trimmed booking IDs and numeric car IDs reject every duplicate row',()=>{
 const f=fixture();f.data.Bookings.push({...f.data.Bookings[0],booking_id:' legacy-completed '});f.files.Bookings=csv('Bookings',f.data.Bookings);
 assert.equal(plan(f).rejected.filter(r=>r.sheet==='Bookings'&&r.reason==='DUPLICATE_LEGACY_ID').length,2);
 f.data.Cars.push({...f.data.Cars[0],car_id:'001',license_plate:'OTHER'});f.files.Cars=csv('Cars',f.data.Cars);assert.equal(plan(f).rejected.filter(r=>r.sheet==='Cars'&&r.reason==='DUPLICATE_CAR').length,2);
});
test('a future cutover needs exact reviewed target and all operator attestations',()=>{
 const review={version:1,approved:true,backupRestoreVerified:true,humanUatApproved:true,legacyFreezeApproved:true,latestCloneRehearsalPassed:true,sourceHash:'a'.repeat(64),approval:'b'.repeat(64),target:{hostname:'127.0.0.1',port:5432,database:'permission_superapp_dev'}};
 assert.doesNotThrow(()=>checkTarget('postgres://127.0.0.1:5432/permission_superapp_dev',true,review));
 for(const invalid of [{...review,approved:false},{...review,backupRestoreVerified:false},{...review,target:{...review.target,database:'wrong'}},{...review,target:{...review.target,port:55439}},{...review,sourceHash:'stale'}])assert.throws(()=>checkTarget('postgres://127.0.0.1:5432/permission_superapp_dev',true,invalid),/TARGET_REVIEW/);
});
