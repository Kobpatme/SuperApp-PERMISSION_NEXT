import { spawn } from 'node:child_process';
import { carBookingTestUrl } from './car-booking-test-db.mjs';
const target=carBookingTestUrl();
const child=spawn(process.execPath,['node_modules/@playwright/test/cli.js','test','--config','playwright.car-booking.config.ts'],{stdio:'inherit',env:{...process.env,DATABASE_URL:target.href,CAR_BOOKING_TEST_DATABASE_URL:target.href}});
child.on('error',()=>{console.error('Unable to start isolated browser tests');process.exitCode=1;});child.on('exit',code=>{process.exitCode=code ?? 1;});
