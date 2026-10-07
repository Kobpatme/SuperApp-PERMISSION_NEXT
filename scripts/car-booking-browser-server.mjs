import { carBookingTestUrl } from './car-booking-test-db.mjs';
process.env.DATABASE_URL=carBookingTestUrl().href;
process.env.NODE_ENV='production';
process.env.LONGDO_MAP_API_KEY='';process.env.PERMISSION_NAS_BRIDGE_URL='';process.env.PERMISSION_NAS_BRIDGE_SECRET='';
const {nextStart}=await import('next/dist/cli/next-start.js');
await nextStart({port:3109,hostname:'localhost'},process.cwd());
