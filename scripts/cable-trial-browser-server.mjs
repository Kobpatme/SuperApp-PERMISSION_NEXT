import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const fixture=JSON.parse(await readFile('.data/duct-rental-browser/runtime.json','utf8'));
for(const value of [fixture.databaseUrl,fixture.runtimeUrl]){const u=new URL(value);if(u.pathname!=='/permission_next_duct_rental_test'||!['localhost','127.0.0.1','[::1]'].includes(u.hostname))throw Error('Isolated fixture required');}
Object.assign(process.env,{DATABASE_URL:fixture.databaseUrl,DUCT_RENTAL_DATABASE_URL:fixture.runtimeUrl,DUCT_RENTAL_STORAGE_DIR:fixture.storageDir,CAR_BOOKING_DATABASE_URL:fixture.databaseUrl,NODE_ENV:'production'});
for(const key of ['PERMISSION_NAS_BRIDGE_URL','PERMISSION_NAS_BRIDGE_SECRET','LONGDO_MAP_API_KEY'])process.env[key]='';
const root=resolve('.data/duct-rental-browser/current');process.chdir(root);
const {nextStart}=await import('next/dist/cli/next-start.js');await nextStart({port:3118,hostname:'localhost'},root);
