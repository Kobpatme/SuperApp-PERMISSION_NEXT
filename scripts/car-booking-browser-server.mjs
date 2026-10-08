import { carBookingTestUrl } from './car-booking-test-db.mjs';
process.env.DATABASE_URL=carBookingTestUrl().href;
process.env.NODE_ENV='production';
process.env.LONGDO_MAP_API_KEY='';process.env.PERMISSION_NAS_BRIDGE_URL='';process.env.PERMISSION_NAS_BRIDGE_SECRET='';
process.env.CAR_BOOKING_OSP_SYNC_ENABLED='';process.env.CAR_BOOKING_GOOGLE_PRIVATE_KEY='';process.env.CAR_BOOKING_GOOGLE_CLIENT_EMAIL='';process.env.CAR_BOOKING_OSP_SPREADSHEET_ID='';process.env.CAR_BOOKING_OSP_WORKER_SECRET='';process.env.CAR_BOOKING_OSP_WORKER_USER_ID='';
const {nextStart}=await import('next/dist/cli/next-start.js');
await nextStart({port:3109,hostname:'localhost'},process.cwd());
