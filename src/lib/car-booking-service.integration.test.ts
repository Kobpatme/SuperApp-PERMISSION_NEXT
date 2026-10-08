import { randomUUID,generateKeyPairSync } from "node:crypto";
import { mkdirSync,writeFileSync } from "node:fs";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as schema from "@/db/schema";
const mockDb=vi.hoisted(()=>vi.fn());
vi.mock("@/db",()=>({getDb:mockDb}));
import { addCarBookingLog, cancelCarBooking, createCarBookings, readCarBookingLogs, readCarBookings, readCarCalendar, readCars, returnCarBooking, saveCar, type CarBookingContext } from "./car-booking-service";
import { readCarSettings,saveCarSettings } from "./car-booking-settings";
import { readCarAccessUsers,saveCarUserAccess } from "./car-booking-access";
import { readOspReport,readCarDashboard } from "./car-booking-report-service";
import { readOspSync,requestOspSync,processOspJobs } from "./car-booking-osp-jobs";
import { ospColumns } from "./car-booking-osp";
describe.skipIf(process.env.CAR_BOOKING_SERVICE_INTEGRATION!=="1")("car services on isolated PostgreSQL with runtime RLS",()=>{
  let operator:ReturnType<typeof postgres>;
  const ctx=(id:string):CarBookingContext=>({actorId:id,displayName:"พนักงานทดสอบ",requestId:randomUUID()});
  beforeAll(()=>{
    const target=new URL(process.env.CAR_BOOKING_TEST_DATABASE_URL!);
    if(!["localhost","127.0.0.1","[::1]"].includes(target.hostname) || target.pathname!=="/permission_next_car_booking_test")throw new Error("Isolated local fixture required");
    operator=postgres(target.href,{max:6,prepare:false,onnotice:()=>{}});
    const db=drizzle(operator,{schema});
    mockDb.mockReturnValue({transaction:<T>(body:Parameters<typeof db.transaction<T>>[0])=>db.transaction(async tx=>{
      await tx.execute(sql`set local role car_booking_test_runtime`);return body(tx);
    })});
  });
  afterAll(async()=>{await operator?.end();});
  async function user(permission="car_booking.module.use",scope="OWN") {
    const id=randomUUID(),role=randomUUID(),assignment=randomUUID();
    await operator`insert into profiles(id,email,status) values(${id},${`${id}@example.test`},'active')`;
    await operator`insert into local_credentials(user_id,password_hash) values(${id},'synthetic-not-a-login-hash')`;
    if(permission){
      await operator`insert into roles(id,code,name) values(${role},${`service-test-${role}`},'Synthetic service')`;
      await operator`insert into role_permissions(role_id,permission_code) values(${role},${permission})`;
      await operator`insert into user_role_assignments(id,user_id,role_id) values(${assignment},${id},${role})`;
      await operator`insert into data_scope_grants(assignment_id,scope_type) values(${assignment},${scope})`;
    }
    return ctx(id);
  }
  async function car(mileage="100") {
    const id=randomUUID();await operator`insert into car_booking_cars(id,license_plate,latest_mileage,parking_floor) values(${id},${`service-${id}`},${mileage},'2A')`;return id;
  }
  const range=(start="2030-01-01T01:00:00Z",end="2030-01-01T02:00:00Z")=>({startTime:start,endTime:end});
  async function book(carId:string,context:CarBookingContext,interval=range()) {return (await createCarBookings({carId,destination:"ทดสอบ",intervals:[interval]},context)).ids[0];}
  const returned=(mileage="120",actualReturnTime="2030-01-01T02:00:00Z")=>({mileage,actualReturnTime,parkingFloor:"3B",refueled:false});
  it("maintenance blocks new service bookings but lets an existing trip log and return",async()=>{
    const actor=await user(),id=await car();
    try{
      vi.stubEnv("CAR_BOOKING_ACCEPT_NEW_BOOKINGS","false");await expect(book(id,actor)).rejects.toMatchObject({code:"BOOKING_PAUSED",status:503});expect(await operator`select id from car_booking_bookings where user_id=${actor.actorId}`).toHaveLength(0);
      vi.stubEnv("CAR_BOOKING_ACCEPT_NEW_BOOKINGS","true");const bookingId=await book(id,actor);
      vi.stubEnv("CAR_BOOKING_ACCEPT_NEW_BOOKINGS","false");await addCarBookingLog(bookingId,{logTime:"2030-01-01T01:30:00Z",logType:"checkpoint",location:"จุดแวะขณะพักรับจอง",mileage:"110",refueled:false,note:""},actor);await returnCarBooking(bookingId,returned(),actor);
      expect((await operator`select status from car_booking_bookings where id=${bookingId}`)[0].status).toBe("completed");
    }finally{vi.unstubAllEnvs();}
  });
  it("books historical dates with server mileage/identity; batch self-conflict and all-or-nothing rollback",async()=>{
    const actor=await user(),id=await car("0");const bookingId=await book(id,actor,range("2020-01-01T01:00:00Z","2020-01-01T02:00:00Z"));
    const [row]=await operator`select * from car_booking_bookings where id=${bookingId}`;expect(row.user_id).toBe(actor.actorId);expect(row.start_mileage).toBe("0");
    await expect(createCarBookings({carId:id,destination:"ทดสอบ",userId:randomUUID(),intervals:[range()]},actor)).rejects.toThrow();
    await expect(createCarBookings({carId:id,destination:"ทดสอบ",intervals:[range(),range()]},actor)).rejects.toMatchObject({code:"PERSON_CONFLICT"});
    await expect(createCarBookings({carId:id,destination:"ทดสอบ",intervals:[range(),range("2020-01-01T01:30:00Z","2020-01-01T03:00:00Z")]},actor)).rejects.toMatchObject({code:"PERSON_CONFLICT"});
    expect((await operator`select id from car_booking_bookings where user_id=${actor.actorId}`).length).toBe(1);
  });
  it("rejects containment/partial overlaps, accepts exact boundary and cancelled rows",async()=>{
    const a=await user(),b=await user(),id=await car();const first=await book(id,a);
    for(const interval of [range("2030-01-01T00:00:00Z","2030-01-01T03:00:00Z"),range("2030-01-01T01:30:00Z","2030-01-01T03:00:00Z")])await expect(book(id,b,interval)).rejects.toMatchObject({code:"CAR_CONFLICT"});
    await book(id,b,range("2030-01-01T02:00:00Z","2030-01-01T03:00:00Z"));await cancelCarBooking(first,a);await book(id,a);
    await expect(book(await car(),a)).rejects.toMatchObject({code:"PERSON_CONFLICT"});
  });
  it("has one winner for independent simultaneous car and person bookings",async()=>{
    const a=await user(),b=await user(),id=await car();
    const results=await Promise.allSettled([book(id,a),book(id,b)]);expect(results.filter(r=>r.status==="fulfilled")).toHaveLength(1);
    const actor=await user(),car1=await car(),car2=await car();
    const own=await Promise.allSettled([book(car1,actor),book(car2,actor)]);expect(own.filter(r=>r.status==="fulfilled")).toHaveLength(1);
  });
  it("returns once, updates car, clears stale non-fuel values and emits material evidence",async()=>{
    const actor=await user(),id=await car(),bookingId=await book(id,actor);
    const results=await Promise.allSettled([returnCarBooking(bookingId,{...returned(),fuelMileage:"110",fuelLiters:"10",fuelAmount:"400"},actor),returnCarBooking(bookingId,returned(),actor)]);
    expect(results.filter(r=>r.status==="fulfilled")).toHaveLength(1);
    const [vehicle]=await operator`select latest_mileage,parking_floor from car_booking_cars where id=${id}`;expect(vehicle).toMatchObject({latest_mileage:"120",parking_floor:"3B"});
    expect((await operator`select fuel_amount from car_booking_bookings where id=${bookingId}`)[0].fuel_amount).toBeNull();
    for(const table of ["audit_logs","activity_events","outbox_messages"]) {
      const column=table==="outbox_messages"?"aggregate_id":"entity_id";
      expect((await operator.unsafe(`select count(*)::int as count from ${table} where ${column}=$1`,[bookingId]))[0].count).toBe(2);
    }
  });
  it("enforces latest mileage, return time, previous-user order, fuel range and completed-state guards",async()=>{
    const a=await user(),b=await user(),id=await car(),first=await book(id,a),second=await book(id,b,range("2030-01-01T02:00:00Z","2030-01-01T03:00:00Z"));
    await expect(returnCarBooking(second,returned("150","2030-01-01T03:00:00Z"),b)).rejects.toMatchObject({code:"PREVIOUS_UNRETURNED"});
    await expect(returnCarBooking(first,returned("100"),a)).rejects.toMatchObject({code:"RETURN_MILEAGE"});
    await expect(returnCarBooking(first,returned("120","2030-01-01T00:00:00Z"),a)).rejects.toMatchObject({code:"RETURN_TIME"});
    for(const fuelMileage of ["99","121"])await expect(returnCarBooking(first,{...returned(),refueled:true,fuelMileage,fuelLiters:"10",fuelAmount:"400"},a)).rejects.toMatchObject({code:"FUEL_MILEAGE"});
    await returnCarBooking(first,returned(),a);
    await expect(returnCarBooking(second,returned("119","2030-01-01T03:00:00Z"),b)).rejects.toMatchObject({code:"RETURN_MILEAGE"});
    await expect(cancelCarBooking(first,a)).rejects.toMatchObject({code:"INVALID_STATUS"});
    await expect(addCarBookingLog(first,{logTime:range().startTime,logType:"other",location:"ทดสอบ",mileage:"120"},a)).rejects.toMatchObject({code:"INVALID_STATUS"});
  });
  it("releases early return availability; late completion keeps actual calendar end and capped availability",async()=>{
    const a=await user(),b=await user(),id=await car(),first=await book(id,a);await returnCarBooking(first,returned("120","2030-01-01T01:30:00Z"),a);
    const available=await readCars(b,range("2030-01-01T01:30:00Z","2030-01-01T02:00:00Z"));expect(available.some(r=>r.car_id===id)).toBe(true);
    const second=await book(id,b,range("2030-01-01T01:30:00Z","2030-01-01T02:00:00Z"));await returnCarBooking(second,returned("150","2030-01-01T03:00:00Z"),b);
    expect((await readCars(a,range("2030-01-01T02:00:00Z","2030-01-01T03:00:00Z"))).some(r=>r.car_id===id)).toBe(true);
    const calendar=await readCarCalendar(range("2030-01-01T00:00:00Z","2030-01-02T00:00:00Z"),a);
    const entries=calendar.filter(r=>r.car_id===id);expect(Object.keys(entries[0]).sort()).toEqual(["car_id","end_time","license_plate","start_time"]);expect(new Date(entries[1].end_time as string).toISOString()).toBe("2030-01-01T03:00:00.000Z");
  });
  it("handles logs with/without GPS, numeric fuel totals, owner reads and admin-only map",async()=>{
    const a=await user(),b=await user(),admin=await user("car_booking.module.admin","ALL"),id=await car(),bookingId=await book(id,a);
    const raw={logTime:range().startTime,logType:"other",location:"ทดสอบ",mileage:"100"};
    await addCarBookingLog(bookingId,raw,a);await addCarBookingLog(bookingId,{...raw,logType:"fuel",fuelLiters:"10",fuelAmount:"400",gpsLatitude:0,gpsLongitude:0},a);
    await expect(addCarBookingLog(bookingId,{...raw,mileage:"99"},a)).rejects.toMatchObject({code:"LOG_MILEAGE"});
    expect(await readCarBookingLogs(bookingId,a)).toHaveLength(2);await expect(readCarBookingLogs(bookingId,b)).rejects.toMatchObject({status:403});
    expect(await readCarBookingLogs(bookingId,a,false,1)).toHaveLength(1);
    await expect(readCarBookingLogs(bookingId,a,false,-1)).rejects.toThrow();
    await expect(readCarBookingLogs(bookingId,a,true)).rejects.toMatchObject({status:403});expect(await readCarBookingLogs(bookingId,admin,true)).toHaveLength(1);
    for(const action of [()=>cancelCarBooking(bookingId,b),()=>returnCarBooking(bookingId,returned(),b),()=>addCarBookingLog(bookingId,raw,b)])await expect(action()).rejects.toMatchObject({status:403});
    expect(await readCarBookings(range("2030-01-01T00:00:00Z","2030-01-02T00:00:00Z"),b)).toHaveLength(0);
    await returnCarBooking(bookingId,{...returned(),refueled:true,fuelMileage:"110",fuelLiters:"30",fuelAmount:"1200"},admin);
    const report=await operator.begin(async tx=>{
      await tx.unsafe("set local role car_booking_test_runtime");
      await tx`select set_config('app.user_id',${admin.actorId},true)`;
      return tx`select total_fuel_liters,total_fuel_amount from car_booking_osp_report where id=${bookingId}`;
    });
    expect(report[0]).toMatchObject({total_fuel_liters:"40",total_fuel_amount:"1600"});
  });
  it("sees grant revocation next call; password-required/inactive/no-grant users denied",async()=>{
    const actor=await user(),id=await car();await book(id,actor);
    await operator`delete from user_role_assignments where user_id=${actor.actorId}`;await expect(readCars(actor)).rejects.toMatchObject({status:403});
    const noGrant=await user("");await expect(book(id,noGrant)).rejects.toMatchObject({status:403});
    for(const mode of ["password","inactive"]) {
      const a=await user();if(mode==="password")await operator`update local_credentials set must_change_password=true where user_id=${a.actorId}`;else await operator`update profiles set status='inactive' where id=${a.actorId}`;
      await expect(readCars(a)).rejects.toMatchObject({status:403});
    }
    const [role]=await operator`select rolsuper,rolbypassrls,rolcanlogin,rolinherit from pg_roles where rolname='car_booking_service_worker'`;
    expect(role).toEqual({rolsuper:false,rolbypassrls:false,rolcanlogin:false,rolinherit:false});
    expect((await operator`select pg_has_role('car_booking_test_runtime','car_booking_service_worker','MEMBER') as allowed`)[0].allowed).toBe(false);
  });
  it("rolls back returned booking and vehicle when material audit insert fails",async()=>{
    const actor=await user(),id=await car(),bookingId=await book(id,actor);
    await operator.unsafe("revoke insert on public.audit_logs from car_booking_test_runtime");
    try {await expect(returnCarBooking(bookingId,returned(),actor)).rejects.toThrow();}
    finally {await operator.unsafe("grant insert on public.audit_logs to car_booking_test_runtime");}
    expect((await operator`select status from car_booking_bookings where id=${bookingId}`)[0].status).toBe("booked");
    expect((await operator`select latest_mileage from car_booking_cars where id=${id}`)[0].latest_mileage).toBe("100");
    expect(await operator`select id from car_booking_osp_jobs where booking_id=${bookingId}`).toHaveLength(0);
    expect((await operator`select count(*)::int as count from outbox_messages where aggregate_id=${bookingId}`)[0].count).toBe(1);
  });
  it("requires admin-only grant for car edits and preserves booking references on deactivation",async()=>{
    const staff=await user(),admin=await user("car_booking.module.admin","ALL"),id=await car(),bookingId=await book(id,staff);
    const input={licensePlate:`updated-${id}`,parkingFloor:"8B",latestMileage:"100",isActive:false};
    await expect(saveCar(input,staff,id)).rejects.toMatchObject({status:403});await saveCar(input,admin,id);
    expect((await operator`select car_id from car_booking_bookings where id=${bookingId}`)[0].car_id).toBe(id);
    await expect(book(id,await user(),range("2030-01-01T03:00:00Z","2030-01-01T04:00:00Z"))).rejects.toMatchObject({code:"CAR_INACTIVE"});
    await cancelCarBooking(bookingId,admin);
  });
  it("edits parking configuration with admin checks, version conflict and valid return-floor enforcement",async()=>{
    const staff=await user(),admin=await user("car_booking.module.admin","ALL");const settings=await readCarSettings(staff);
    await expect(saveCarSettings({floors:["Z9"],version:settings.version},staff)).rejects.toMatchObject({status:403});
    const saved=await saveCarSettings({floors:[...settings.floors,"Z9"],version:settings.version},admin);
    await expect(saveCarSettings({floors:["Z9"],version:settings.version},admin)).rejects.toMatchObject({status:409});
    const id=await car(),bookingId=await book(id,staff);
    await expect(returnCarBooking(bookingId,{...returned(),parkingFloor:"NOT-CONFIGURED"},staff)).rejects.toMatchObject({code:"PARKING_FLOOR"});
    await returnCarBooking(bookingId,{...returned(),parkingFloor:"Z9"},staff);
    await saveCarSettings({floors:settings.floors,version:saved.version},admin);
  });
  it("edits only car grants on mixed roles, preserves other scoped grants and the live session, and denies module admin access editing",async()=>{
    const manager=await user("core.user.manage","ALL"),moduleAdmin=await user("car_booking.module.admin","ALL"),target=await user("car_booking.module.use","ALL");
    const [assignment]=await operator`select id,role_id from user_role_assignments where user_id=${target.actorId}`;
    await operator`insert into role_permissions(role_id,permission_code) values(${assignment.role_id},'work.task.read')`;
    const session=randomUUID();await operator`insert into auth_sessions(id,user_id,token_hash,expires_at) values(${session},${target.actorId},${randomUUID()},now()+interval '1 hour')`;
    const snapshot=()=>operator`select rp.permission_code,s.scope_type,s.selected_team_id,a.team_id,a.valid_until from user_role_assignments a join role_permissions rp on rp.role_id=a.role_id join data_scope_grants s on s.assignment_id=a.id and (s.permission_code is null or s.permission_code=rp.permission_code) where a.user_id=${target.actorId} and rp.permission_code<>'car_booking.module.use' and (a.valid_until is null or a.valid_until>now()) order by rp.permission_code,s.scope_type`;
    const before=await snapshot();
    await expect(readCarAccessUsers(moduleAdmin)).rejects.toMatchObject({status:403});
    await operator.unsafe("revoke insert on public.audit_logs from car_booking_test_runtime");
    try {await expect(saveCarUserAccess({userId:target.actorId,canUse:false,canAdmin:false,expectedUse:true,expectedAdmin:false},manager)).rejects.toThrow();}
    finally {await operator.unsafe("grant insert on public.audit_logs to car_booking_test_runtime");}
    expect(await snapshot()).toEqual(before);expect((await readCars(target)).length).toBeGreaterThan(0);
    await saveCarUserAccess({userId:target.actorId,canUse:false,canAdmin:false,expectedUse:true,expectedAdmin:false},manager);
    expect(await snapshot()).toEqual(before);expect(await operator`select id from auth_sessions where id=${session}`).toHaveLength(1);
    await expect(readCars(target)).rejects.toMatchObject({status:403});
    await saveCarUserAccess({userId:target.actorId,canUse:true,canAdmin:false,expectedUse:false,expectedAdmin:false},manager);
    expect((await readCars(target)).length).toBeGreaterThan(0);expect(await snapshot()).toEqual(before);
    await expect(saveCarUserAccess({userId:target.actorId,canUse:false,canAdmin:false,expectedUse:false,expectedAdmin:false},manager)).rejects.toMatchObject({status:409});
    const [role]=await operator`select rolsuper,rolbypassrls,rolcanlogin,rolinherit from pg_roles where rolname='car_booking_access_manager'`;expect(role).toEqual({rolsuper:false,rolbypassrls:false,rolcanlogin:false,rolinherit:false});
    expect((await operator`select pg_has_role('car_booking_test_runtime','car_booking_access_manager','MEMBER') as allowed`)[0].allowed).toBe(false);
  });
  it("produces scoped OSP and dashboard totals with Bangkok month boundaries, zero miles and queued returns",async()=>{
    const staff=await user(),admin=await user("car_booking.module.admin","ALL"),id=await car("0");
    const bookingId=await book(id,staff,range("2041-01-01T00:00:00Z","2041-01-01T02:00:00Z"));
    await addCarBookingLog(bookingId,{logTime:"2041-01-01T01:00:00Z",logType:"fuel",location:"ปั๊มทดสอบ",mileage:"10",fuelLiters:"10",fuelAmount:"400"},staff);
    await returnCarBooking(bookingId,{...returned("100","2041-01-01T02:00:00Z"),refueled:true,fuelMileage:"80",fuelLiters:"30",fuelAmount:"1200"},staff);
    await book(await car(),staff,range("2041-01-02T00:00:00Z","2041-01-02T02:00:00Z"));
    const cancelled=await book(await car(),staff,range("2041-01-03T00:00:00Z","2041-01-03T02:00:00Z"));await cancelCarBooking(cancelled,staff);
    await book(await car(),staff,range("2041-01-31T17:30:00Z","2041-01-31T18:30:00Z"));
    for(const read of [readOspReport,readCarDashboard])await expect(read({month:"2041-01"},staff)).rejects.toMatchObject({status:403});
    const report=await readOspReport({month:"2041-01"},admin);if(!report.rows)throw new Error("Report expected");
    expect(report.rows).toHaveLength(1);expect(report.rows[0].slice(4,9)).toEqual(["0","01/01/2584","09:00","100","100"]);expect(report.rows[0].slice(16,18)).toEqual(["40","1600"]);
    const dashboard=await readCarDashboard({month:"2041-01"},admin);expect(dashboard.totals).toMatchObject({total:2,completed:1,upcoming:1,distance:"100",liters:"40",amount:"1600"});
    expect((await readCarDashboard({month:"2041-02"},admin)).totals.total).toBe(1);
    const exported=await readOspReport({month:"2041-01"},admin,true);expect(exported.csv).toContain('"40","1600"');
    expect((await operator`select kind,status from car_booking_osp_jobs where booking_id=${bookingId}`)[0]).toEqual({kind:"booking",status:"queued"});
    await expect(readOspSync(staff)).rejects.toMatchObject({status:403});await expect(requestOspSync({action:"rebuild"},staff)).rejects.toMatchObject({status:403});
  });
  it("keeps successful returns independent from failed Sheets delivery and retries a serialized idempotent batch",async()=>{
    const admin=await user("car_booking.module.admin","ALL");const key=generateKeyPairSync("rsa",{modulusLength:2048});
    vi.stubEnv("CAR_BOOKING_OSP_SYNC_ENABLED","true");vi.stubEnv("CAR_BOOKING_OSP_SPREADSHEET_ID","synthetic");vi.stubEnv("CAR_BOOKING_GOOGLE_CLIENT_EMAIL","fixture@example.test");vi.stubEnv("CAR_BOOKING_GOOGLE_PRIVATE_KEY",key.privateKey.export({type:"pkcs8",format:"pem"}).toString());
    try{
      await requestOspSync({action:"rebuild"},admin);
      const failed=await processOspJobs(admin,vi.fn(async()=>new Response("private provider response",{status:429})) as typeof fetch);expect(failed.status).toBe("failed");expect(failed.errorCode).toBe("RATE_LIMIT");
      expect((await readOspSync(admin)).counts.some(row=>row.status==="failed"&&row.count>0)).toBe(true);
      await requestOspSync({action:"retry"},admin);let writes=0;
      const request=vi.fn(async(input:string|URL|Request)=>{
        const url=String(input);if(url.includes("oauth2"))return Response.json({access_token:"synthetic"});
        if(url.endsWith(":batchUpdate")){writes++;return Response.json({});}
        if(url.includes("/values/"))return Response.json({values:[[...ospColumns]]});
        return Response.json({sheets:[{properties:{sheetId:1,title:"BookingsOSP",gridProperties:{rowCount:1000,columnCount:19}}}]});
      });
      const results=await Promise.all([processOspJobs(admin,request as typeof fetch),processOspJobs(admin,request as typeof fetch)]);
      expect(results.filter(result=>result.status==="sent")).toHaveLength(1);expect(writes).toBe(1);
      expect((await readOspSync(admin)).counts.some(row=>row.status==="sent"&&row.count>0)).toBe(true);
      expect((await processOspJobs(admin,request as typeof fetch)).status).toBe("idle_or_busy");
    }finally{vi.unstubAllEnvs();}
  });
  it("measures bounded reports/dashboard/export on 5000 bookings and 10000 logs without N+1 queries",async()=>{
    const admin=await user("car_booking.module.admin","ALL"),staff=await user(),id=await car("0"),run=randomUUID();
    await operator`insert into car_booking_bookings(legacy_id,user_id,employee_name,car_id,destination,start_time,end_time,status,start_mileage,actual_return_time,mileage_on_return,parking_floor)
    select ${run}||'-'||i,${staff.actorId}::uuid,'พนักงานข้อมูลจำลอง',${id}::uuid,'ข้อมูลทดสอบปริมาณสูง','2050-01-01T00:00:00+07:00'::timestamptz+i*interval '1 hour','2050-01-01T00:00:00+07:00'::timestamptz+i*interval '1 hour'+interval '30 minutes','completed',i*100,'2050-01-01T00:00:00+07:00'::timestamptz+i*interval '1 hour'+interval '30 minutes',i*100+100,'2A' from generate_series(0,4999) i`;
    await operator`insert into car_booking_logs(booking_id,log_time,log_type,location,mileage,fuel_liters,fuel_amount,created_by)
    select b.id,b.start_time+interval '15 minutes',case when n=1 then 'fuel' else 'checkpoint' end,'บันทึกจำลอง',b.start_mileage+10,case when n=1 then 1 else null end,case when n=1 then 40 else null end,${staff.actorId}::uuid from car_booking_bookings b cross join generate_series(1,2) n where b.user_id=${staff.actorId}::uuid`;
    const start=performance.now(),report=await readOspReport({month:"2050-03"},admin),reportMs=performance.now()-start;
    expect(report.rows).toHaveLength(50);expect(report.total).toBe(744);expect(report.nextOffset).toBe(50);
    const dashboardStart=performance.now(),dashboard=await readCarDashboard({month:"2050-03"},admin),dashboardMs=performance.now()-dashboardStart;
    expect(dashboard.totals).toMatchObject({total:744,completed:744,distance:"74400",liters:"744",amount:"29760"});expect(dashboard.bookings).toHaveLength(50);
    const exportStart=performance.now(),exported=await readOspReport({month:"all"},admin,true),exportMs=performance.now()-exportStart;expect(exported.csv).toContain(run);
    const visibleRange=range("2050-03-01T00:00:00+07:00","2050-04-01T00:00:00+07:00");
    const moduleStart=performance.now(),[cars,calendar,visibleBookings]=await Promise.all([readCars(admin),readCarCalendar(visibleRange,admin),readCarBookings(visibleRange,admin)]);
    const moduleReadsMs=Math.round(performance.now()-moduleStart);expect(cars.length).toBeGreaterThan(0);expect(calendar.length).toBe(744);expect(visibleBookings.length).toBe(744);
    const commandCar=await car("0"),bookTimes:number[]=[],returnTimes:number[]=[];
    for(let i=0;i<10;i++){
      const start=new Date(Date.UTC(2060,0,1,i)).toISOString(),end=new Date(Date.UTC(2060,0,1,i,30)).toISOString();
      const bookStart=performance.now(),bookingId=await book(commandCar,staff,range(start,end));bookTimes.push(Math.round(performance.now()-bookStart));
      const returnStart=performance.now();await returnCarBooking(bookingId,{mileage:String((i+1)*100),actualReturnTime:end,parkingFloor:"2A",refueled:false},staff);returnTimes.push(Math.round(performance.now()-returnStart));
    }
    const sorted=(values:number[])=>[...values].sort((a,b)=>a-b);
    const measurement={syntheticBookings:5000,syntheticLogs:10000,reportPageMs:Math.round(reportMs),dashboardMs:Math.round(dashboardMs),fullCsvMs:Math.round(exportMs),csvBytes:Buffer.byteLength(exported.csv || ""),moduleReadsMs,commandSamples:10,bookMs:{samples:bookTimes,p50:sorted(bookTimes)[4],max:Math.max(...bookTimes)},returnMs:{samples:returnTimes,p50:sorted(returnTimes)[4],max:Math.max(...returnTimes)},productionBenchmark:false};
    const evidenceDirectory=process.env.CAR_BOOKING_EVIDENCE_DIR || "docs/quality/car-booking-phase-4";
    mkdirSync(evidenceDirectory,{recursive:true});writeFileSync(`${evidenceDirectory}/performance.json`,JSON.stringify(measurement,null,2)+"\n");
  },60000);
});
