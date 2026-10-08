import {fileURLToPath,URL} from 'node:url';
import {defineConfig} from 'vitest/config';
export default defineConfig({resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}},test:{include:['scripts/car-booking-local-uat.integration.test.ts']}});
