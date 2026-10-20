import { config } from 'dotenv';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import postgres from 'postgres';

export const testDatabaseName = 'permission_next_car_booking_test';
export function carBookingTestUrl() {
  config({ path: '.env.local', quiet: true });
  const value = process.env.CAR_BOOKING_TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!value) throw new Error('Local test connection is required (not printed)');
  const target = new URL(value);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)) throw new Error('Car tests require loopback PostgreSQL');
  if (process.env.CAR_BOOKING_TEST_DATABASE_URL && target.pathname !== `/${testDatabaseName}`) throw new Error('Unexpected car test database');
  target.pathname = `/${testDatabaseName}`;
  return target;
}
export async function initializeCarBookingTestDb() {
  const target = carBookingTestUrl();
  const operatorTarget = new URL(target); operatorTarget.pathname = '/postgres';
  const operator = postgres(operatorTarget.href, { max: 1, onnotice: () => {} });
  try {
    if (!(await operator`select 1 from pg_database where datname=${testDatabaseName}`).length) {
      await operator.unsafe(`create database ${testDatabaseName}`);
    }
  } finally { await operator.end(); }
  const db = postgres(target.href, { max: 1, prepare: false, onnotice: () => {} });
  try {
    await db`create table if not exists public.schema_migrations(name text primary key,applied_at timestamptz not null default now())`;
    let applied = 0;
    for (const name of (await readdir('supabase/migrations')).filter(n => /^\d.*\.sql$/.test(n)).sort()) {
      if ((await db`select 1 from public.schema_migrations where name=${name}`).length) continue;
      await db.begin(async tx => {
        await tx.unsafe(await readFile(resolve('supabase/migrations', name), 'utf8'));
        await tx`insert into public.schema_migrations(name) values(${name})`;
      });
      applied++;
    }
    await db.unsafe(`do $$ begin
      if not exists(select 1 from pg_roles where rolname='car_booking_test_runtime') then
        create role car_booking_test_runtime nologin noinherit nosuperuser nobypassrls;
      end if;
      if exists(select 1 from pg_roles where rolname='car_booking_test_runtime' and (rolsuper or rolbypassrls or rolcanlogin)) then
        raise exception 'Unsafe test runtime role';
      end if;
    end $$;
    grant usage on schema public to car_booking_test_runtime;
    grant select,insert,update,delete on public.car_booking_cars,public.car_booking_bookings,public.car_booking_logs to car_booking_test_runtime;
    grant select on public.car_booking_osp_report to car_booking_test_runtime;
    grant execute on function public.car_booking_has_access(text,uuid),public.car_booking_calendar(timestamptz,timestamptz) to car_booking_test_runtime;`);
    await db.unsafe(`grant execute on function public.car_booking_lock_car(uuid),public.car_booking_previous_unreturned(uuid),public.car_booking_sync_return(uuid),public.car_booking_vehicle_state(),public.car_booking_busy_cars(timestamptz,timestamptz) to car_booking_test_runtime;
      grant insert on public.audit_logs,public.activity_events,public.outbox_messages to car_booking_test_runtime;`);
    await db.unsafe(`grant select,update on public.car_booking_settings to car_booking_test_runtime;
      grant execute on function public.car_booking_can_manage_access(),public.car_booking_access_users(),public.car_booking_set_user_access(uuid,boolean,boolean) to car_booking_test_runtime;`);
    await db.unsafe(`grant select,insert,update on public.car_booking_osp_jobs to car_booking_test_runtime; grant select,update on public.car_booking_osp_state to car_booking_test_runtime;`);
    const [{ count }] = await db`select count(*)::int as count from public.schema_migrations`;
    console.log(JSON.stringify({ database: testDatabaseName, applied, migrations: count, role: 'non-owner/non-superuser/NOBYPASSRLS' }));
  } finally { await db.end(); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await initializeCarBookingTestDb(); }
  catch (error) { console.error(JSON.stringify({ error: 'Isolated migration failed', code: error.code || error.name })); process.exitCode = 1; }
}
