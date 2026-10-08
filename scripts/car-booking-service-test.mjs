import { spawn } from 'node:child_process';
import { carBookingTestUrl } from './car-booking-test-db.mjs';
// Propagate only the guarded local fixture URL, without printing credentials.
const target = carBookingTestUrl();
const child = spawn(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', 'src/lib/car-booking-service.integration.test.ts'], {
  stdio: 'inherit', env: { ...process.env, CAR_BOOKING_DATABASE_URL: '', CAR_BOOKING_TEST_DATABASE_URL: target.href, CAR_BOOKING_SERVICE_INTEGRATION: '1', CAR_BOOKING_ACCEPT_NEW_BOOKINGS: 'true' },
});
child.on('error', () => { console.error('Unable to start local service tests'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
