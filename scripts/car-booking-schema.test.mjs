import { randomUUID } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { test, after } from 'node:test';
import postgres from 'postgres';
import { carBookingTestUrl } from './car-booking-test-db.mjs';

const db = postgres(carBookingTestUrl().href, { max: 5, prepare: false, onnotice: () => {} });
after(async () => { await db.end(); });
const runtime = async (actor, body) => db.begin(async tx => {
  await tx.unsafe('set local role car_booking_test_runtime');
  await tx`select set_config('app.user_id',${actor || ''},true)`;
  return body(tx);
});
async function user(permission, scope = 'OWN') {
  const id = randomUUID();
  await db`insert into profiles(id,email,status) values(${id},${`${id}@example.test`},'active')`;
  await db`insert into local_credentials(user_id,password_hash) values(${id},'synthetic-not-a-login-hash')`;
  if (permission) {
    const role = randomUUID(), assignment = randomUUID();
    await db`insert into roles(id,code,name) values(${role},${`car-test-${role}`},'Synthetic car test')`;
    await db`insert into role_permissions(role_id,permission_code) values(${role},${permission})`;
    await db`insert into user_role_assignments(id,user_id,role_id) values(${assignment},${id},${role})`;
    await db`insert into data_scope_grants(assignment_id,scope_type) values(${assignment},${scope})`;
  }
  return id;
}
async function car() {
  const id = randomUUID();
  await db`insert into car_booking_cars(id,license_plate,latest_mileage) values(${id},${`fixture-${id}`},100)`;
  return id;
}
async function booking(tx, userId, carId, start = '2030-01-01T01:00:00Z', end = '2030-01-01T02:00:00Z') {
  const [row] = await tx`insert into car_booking_bookings(user_id,employee_name,car_id,destination,start_time,end_time,start_mileage)
    values(${userId},'Synthetic user',${carId},'Synthetic destination',${start},${end},100) returning id`;
  return row.id;
}
const denied = { code: '42501' }, conflict = { code: '23P01' };

test('domain and OSP tables FORCE RLS and runtime is non-owner/non-superuser', async () => {
  const tables = await db`select c.relrowsecurity,c.relforcerowsecurity,pg_get_userbyid(c.relowner) as owner from pg_class c
    where c.oid in ('car_booking_cars'::regclass,'car_booking_bookings'::regclass,'car_booking_logs'::regclass,'car_booking_osp_jobs'::regclass,'car_booking_osp_state'::regclass)`;
  assert.equal(tables.length, 5);
  for (const table of tables) { assert.equal(table.relrowsecurity, true); assert.equal(table.relforcerowsecurity, true); assert.notEqual(table.owner, 'car_booking_test_runtime'); }
  const [role] = await db`select rolsuper,rolbypassrls from pg_roles where rolname='car_booking_test_runtime'`;
  assert.deepEqual(role, { rolsuper: false, rolbypassrls: false });
  await runtime('', async tx => { assert.equal((await tx`select * from car_booking_cars`).length, 0); });
  const staff=await user('car_booking.module.use');
  await runtime(staff,async tx=>{assert.equal((await tx`select * from car_booking_osp_jobs`).length,0);assert.equal((await tx`select * from car_booking_osp_state`).length,0);});
  await assert.rejects(runtime(staff,tx=>tx`insert into car_booking_osp_jobs(kind) values('rebuild')`),denied);
});
test('no automatic grants to existing system roles; no permission and forced-password/suspended accounts denied', async () => {
  const [auto] = await db`select count(*)::int as count from role_permissions rp join roles r on r.id=rp.role_id
    where r.is_system and r.code not in ('car_booking_use','car_booking_admin') and rp.permission_code like 'car_booking.%'`;
  assert.equal(auto.count, 0);
  const stranger = await user(), staff = await user('car_booking.module.use'), carId = await car();
  await assert.rejects(runtime(stranger, tx => booking(tx, stranger, carId)), denied);
  await assert.rejects(runtime(stranger, tx => tx`select * from car_booking_calendar('2030-01-01','2030-01-02')`), denied);
  await db`update local_credentials set must_change_password=true where user_id=${staff}`;
  await assert.rejects(runtime(staff, tx => booking(tx, staff, carId)), denied);
  await db`update local_credentials set must_change_password=false where user_id=${staff}`;
  await db`update profiles set status='inactive' where id=${staff}`;
  await assert.rejects(runtime(staff, tx => booking(tx, staff, carId)), denied);
});
test('OWN cannot read/write another booking or logs; admin-only grant can read both; no hard delete', async () => {
  const a = await user('car_booking.module.use'), b = await user('car_booking.module.use');
  const admin = await user('car_booking.module.admin', 'ALL'), carId = await car();
  const id = await runtime(a, tx => booking(tx, a, carId));
  await runtime(a, tx => tx`insert into car_booking_logs(booking_id,log_time,log_type,location,mileage,created_by,gps_latitude,gps_longitude)
    values(${id},'2030-01-01T01:10:00Z','overnight_stop','Synthetic stop',110,${a},0,0)`);
  await runtime(b, async tx => {
    assert.equal((await tx`select * from car_booking_bookings where id=${id}`).length, 0);
    assert.equal((await tx`select * from car_booking_logs where booking_id=${id}`).length, 0);
    assert.equal((await tx`update car_booking_bookings set destination='forged' where id=${id} returning id`).length, 0);
  });
  await assert.rejects(runtime(b, tx => booking(tx, a, carId)), denied);
  await assert.rejects(runtime(b, tx => tx`insert into car_booking_logs(booking_id,log_time,log_type,location,mileage,created_by)
    values(${id},now(),'other','Forged',110,${b})`), denied);
  await runtime(admin, async tx => {
    assert.equal((await tx`select * from car_booking_bookings where id=${id}`).length, 1);
    assert.equal((await tx`select * from car_booking_logs where booking_id=${id}`).length, 1);
    assert.equal((await tx`delete from car_booking_bookings where id=${id} returning id`).length, 0);
  });
});
test('redacted bounded calendar sees busy cars without owner/destination/GPS; cannot assume reader role', async () => {
  const a = await user('car_booking.module.use'), b = await user('car_booking.module.use'), carId = await car();
  await runtime(a, tx => booking(tx, a, carId));
  await runtime(b, async tx => {
    const rows = await tx`select * from car_booking_calendar('2030-01-01','2030-01-02') where car_id=${carId}`;
    assert.equal(rows.length, 1);
    assert.deepEqual(Object.keys(rows[0]).sort(), ['car_id','license_plate','start_time','end_time'].sort());
  });
  await assert.rejects(runtime(b, tx => tx`select * from car_booking_calendar('2030-01-01','2031-01-01')`), { code: '22023' });
  assert.equal((await db`select pg_has_role('car_booking_test_runtime','car_booking_calendar_reader','MEMBER') as allowed`)[0].allowed, false);
  assert.equal((await db`select has_table_privilege('car_booking_calendar_reader','car_booking_logs','SELECT') as allowed`)[0].allowed, false);
});
test('revoke/grant on next transaction takes effect without replacing the same session', async () => {
  const id = await user('car_booking.module.use'), session = randomUUID();
  await db`insert into auth_sessions(id,user_id,token_hash,expires_at) values(${session},${id},${randomUUID()},now()+interval '1 hour')`;
  const permission = () => runtime(id, async tx => (await tx`select car_booking_has_access('car_booking.module.use',${id}) as allowed`)[0].allowed);
  assert.equal(await permission(), true);
  await db`update user_role_assignments set valid_until=now() where user_id=${id}`;
  assert.equal(await permission(), false);
  await db`update user_role_assignments set valid_until=null where user_id=${id}`;
  assert.equal(await permission(), true);
  assert.equal((await db`select id from auth_sessions where id=${session}`).length, 1);
});
test('car and user overlap rejected; exact boundary and cancelled reservations do not conflict', async () => {
  const a = await user('car_booking.module.use'), b = await user('car_booking.module.use'), c1 = await car(), c2 = await car();
  const id = await runtime(a, tx => booking(tx, a, c1));
  await assert.rejects(runtime(b, tx => booking(tx, b, c1, '2030-01-01T01:30Z','2030-01-01T02:30Z')), conflict);
  await assert.rejects(runtime(a, tx => booking(tx, a, c2)), conflict);
  await runtime(b, tx => booking(tx, b, c1, '2030-01-01T02:00Z','2030-01-01T03:00Z'));
  await runtime(a, tx => tx`update car_booking_bookings set status='cancelled' where id=${id}`);
  await runtime(a, tx => booking(tx, a, c1));
});
test('two independent simultaneous requests have one winner at the exclusion constraint', async () => {
  const a = await user('car_booking.module.use'), b = await user('car_booking.module.use'), carId = await car();
  const results = await Promise.allSettled([a,b].map(id => runtime(id, tx => booking(tx,id,carId))));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.find(r => r.status === 'rejected').reason.code, '23P01');
});
test('even ALL use scope cannot read another owner; malformed fuel/GPS/return values rejected', async () => {
  const a = await user('car_booking.module.use'), misconfigured = await user('car_booking.module.use','ALL'), carId = await car();
  const id = await runtime(a, tx => booking(tx,a,carId));
  await runtime(misconfigured, async tx => { assert.equal((await tx`select * from car_booking_bookings where id=${id}`).length,0); });
  await assert.rejects(runtime(a, tx => tx`update car_booking_bookings set status='completed',actual_return_time='2029-12-31',mileage_on_return=120,parking_floor='2A' where id=${id}`), { code: '23514' });
  await assert.rejects(runtime(a, tx => tx`update car_booking_bookings set status='completed',actual_return_time='2030-01-01T02:00Z',mileage_on_return=100,parking_floor='2A' where id=${id}`), { code: '23514' });
  await assert.rejects(runtime(a, tx => tx`insert into car_booking_logs(booking_id,log_time,log_type,location,mileage,created_by,gps_latitude)
    values(${id},now(),'other','Synthetic',110,${a},1)`), { code: '23514' });
  await assert.rejects(runtime(a, tx => tx`insert into car_booking_logs(booking_id,log_time,log_type,location,mileage,created_by)
    values(${id},now(),'fuel','Synthetic',110,${a})`), { code: '23514' });
});
test('early return releases interval and late return cannot block completion', async () => {
  const a = await user('car_booking.module.use'), b = await user('car_booking.module.use'), c1 = await car(), c2 = await car();
  const early = await runtime(a, tx => booking(tx, a, c1));
  await runtime(a, tx => tx`update car_booking_bookings set status='completed',actual_return_time='2030-01-01T01:30Z',mileage_on_return=120,parking_floor='2A' where id=${early}`);
  await runtime(b, tx => booking(tx, b, c1, '2030-01-01T01:30Z','2030-01-01T02:00Z'));
  const late = await runtime(a, tx => booking(tx, a, c2,'2030-01-02T01:00Z','2030-01-02T02:00Z'));
  await runtime(b, tx => booking(tx, b, c2,'2030-01-02T02:00Z','2030-01-02T03:00Z'));
  await runtime(a, tx => tx`update car_booking_bookings set status='completed',actual_return_time='2030-01-02T02:30Z',mileage_on_return=140,parking_floor='2A' where id=${late}`);
});
test('report exact fuel aggregation 10+30 / 400+1200; report is admin-only', async () => {
  const a = await user('car_booking.module.use'), admin = await user('car_booking.module.admin','ALL'), carId = await car();
  const id = await runtime(a, tx => booking(tx,a,carId));
  await runtime(a, tx => tx`insert into car_booking_logs(booking_id,log_time,log_type,location,mileage,fuel_liters,fuel_amount,created_by)
    values(${id},'2030-01-01T01:10Z','fuel','Synthetic fuel',110,10,400,${a})`);
  await runtime(a, tx => tx`update car_booking_bookings set status='completed',actual_return_time='2030-01-01T02:00Z',mileage_on_return=150,parking_floor='2A',refueled=true,fuel_mileage=140,fuel_liters=30,fuel_amount=1200 where id=${id}`);
  await runtime(admin, async tx => { const [row] = await tx`select total_fuel_liters,total_fuel_amount from car_booking_osp_report where id=${id}`; assert.equal(row.total_fuel_liters,'40'); assert.equal(row.total_fuel_amount,'1600'); });
  await runtime(a, async tx => { assert.equal((await tx`select * from car_booking_osp_report where id=${id}`).length,0); });
});
