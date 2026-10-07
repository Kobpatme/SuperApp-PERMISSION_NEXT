import { randomUUID } from "node:crypto";
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
});
