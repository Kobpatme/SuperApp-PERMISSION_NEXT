# Permission-Next Architecture Baseline

เอกสารนี้เป็นข้อสรุปทางเทคนิคเพิ่มเติมจาก `CODEX_IMPLEMENTATION_PLAN_PERMISSION_NEXT.md` และใช้เป็น baseline สำหรับการพัฒนาระบบจริง ส่วน `index.html` และ Mod แบบ iframe ในปัจจุบันเป็นเพียง UI/UX prototype สำหรับยืนยันหน้าตาและ workflow เดิมก่อน migration

## Technology decisions

| Layer | Decision |
| --- | --- |
| Frontend | Next.js App Router, TypeScript strict |
| Application backend | Server Actions และ Route Handlers |
| Infrastructure | Supabase |
| Database | Supabase PostgreSQL |
| ORM | Drizzle ORM |
| Supabase SDK | ใช้เฉพาะ Auth และ Storage |
| Authentication | Supabase Auth ผ่าน Core Shell ครั้งเดียว |
| Authorization | Server-side RBAC + PostgreSQL RLS |
| Storage | Supabase Storage, Private buckets, short-lived Signed URLs |
| Deployment | Vercel + Supabase |
| Production | Supabase Pro + external database/file backup |

## Application boundaries

- Core Shell เป็นเจ้าของ Login, Logout, session refresh, user profile, team membership และ module navigation
- แต่ละ mod ไม่มีหน้า Login และห้ามสร้าง auth session ของตัวเอง
- Business logic อยู่ใน domain service ฝั่ง server ไม่อยู่ใน React component
- Server Components ใช้สำหรับอ่านข้อมูลเป็นค่าเริ่มต้น
- Server Actions ใช้กับ mutation ที่มาจาก UI และต้องตรวจ session, RBAC, input และ ownership ใหม่ทุกครั้ง
- Route Handlers ใช้กับ webhook, external integration, export และ file download ที่ต้องควบคุม response โดยตรง
- Client Components ใช้เฉพาะ interaction ที่ต้องทำใน browser เช่น Map, drawer, filter และ form state

## Module registry

| Mod | Domain | Repository | Target route |
| --- | --- | --- | --- |
| 1 | ระบบเก็บงาน / MAXIWA KPI | `D:\WebApp\SLA_Preformance\MAXIWA KPI` (local source of truth), `Kobpatme/maxiwa_KPI.git` (repository reference) | `/work` |
| 2 | ค่าใช้จ่ายอาคาร / Permission Next | `Kobpatme/Permission_Next.git` | `/buildings` |
| 3 | ขอคืนเงินประกันอาคาร | `D:\WebApp\ระบบขอคืนเงินประกัน_V2` (local source of truth), `Kobpatme/maxiwa.git` (repository reference) | `/guarantees` |

Core Shell เป็น Mod-independent และไม่นับเป็นหมายเลข Mod

## Database access rules

- Drizzle เป็น data-access layer เดียวสำหรับ business data
- ห้าม query ตาราง business จาก browser และห้ามใช้ Supabase SDK query ตารางเหล่านี้
- Validate input ด้วย schema ก่อนส่งเข้า domain service
- Request ปกติใช้ least-privileged database role ที่ไม่ bypass RLS
- เมื่อ query ผ่าน direct PostgreSQL connection ต้องผูก verified user/team context เข้ากับ transaction เพื่อให้ RLS policy ประเมินตัวตนได้
- แยก elevated connection สำหรับ migration, backup และ background job พร้อม audit log; ห้ามนำ connection นี้ไปใช้กับ user request
- ทุกตารางหลักมี `created_at`, `updated_at` และ actor/audit metadata ตามความเหมาะสม

## Authentication and authorization flow

1. Core Shell อ่านและ refresh session ด้วย Supabase Auth ฝั่ง server
2. Middleware/layout ป้องกัน unauthenticated route
3. Server Action หรือ Route Handler ตรวจ session ที่เชื่อถือได้จาก server
4. RBAC ตรวจสิทธิ์ระดับ module และ action
5. Database transaction ส่ง user/team context ให้ PostgreSQL
6. RLS จำกัดแถวข้อมูลเป็นชั้นป้องกันเพิ่มเติม
7. Audit log บันทึก actor, action, entity, timestamp และผลลัพธ์

Role หรือ user object ที่ส่งจาก Client Component, query string, iframe หรือ `postMessage` ใช้เพื่อแสดงผลเท่านั้น ห้ามใช้เป็นหลักฐานอนุญาตการทำงานใน production

## File storage rules

- ใช้ Private bucket แยกตาม data classification หรือ domain เมื่อจำเป็น
- ตรวจชนิดไฟล์, ขนาด, ownership และ permission ก่อน upload/download
- เก็บ storage path และ metadata ใน PostgreSQL แต่ไม่เก็บ public URL ถาวร
- Signed URL ต้องสร้างฝั่ง server หลังผ่าน RBAC/RLS และมีอายุสั้น
- ตั้ง retention, malware scanning และ audit event ตามระดับความเสี่ยงของเอกสาร

## Deployment and operations

- Vercel deploy Next.js โดยแยก Preview, Staging และ Production
- Supabase แยก project/environment และไม่ใช้ production secrets ใน Preview
- Validate environment variables ตอน build/startup และห้าม commit secrets
- Production ใช้ Supabase Pro และมี external backup ที่ทดสอบ restore ได้จริงทั้ง PostgreSQL และ Storage
- Migration ต้อง version ด้วย Drizzle, review ก่อน deploy และมี rollback/forward-fix plan

## Migration from the current prototype

1. เก็บ prototype ปัจจุบันเป็น visual/workflow reference
2. สร้าง Next.js Core Shell และ Supabase Auth แบบ single login
3. วาง Drizzle schema, RLS policies, RBAC และ audit log ก่อนย้าย business data
4. ย้าย Mod 1 ระบบเก็บงานโดยคงหน้าตาและ workflow ของ MAXIWA KPI
5. ย้าย Mod 2 Permission Next Map เป็น Client Component โดยให้ข้อมูลและ mutation ผ่าน server boundary
6. ย้ายไฟล์เข้า Private Storage และเปลี่ยนทุก download เป็น Signed URL
7. ย้าย Mod 3 ระบบขอคืนเงินประกันอาคารโดยคง workflow และสถานะเดิม
8. ทำ data reconciliation, security tests, user acceptance test และ cutover ทีละ mod

## Production quality gates

- TypeScript strict, lint, unit, integration และ end-to-end tests ผ่าน
- Server Actions/Route Handlers มี authentication, authorization และ validation tests
- RLS policy tests ครอบคลุม allow/deny ข้าม user, team และ mod
- ไม่มี service-role key, database password หรือ signed URL logic ใน browser bundle
- Backup restore drill ผ่านก่อน production cutover
- ผู้ใช้เดิมทำ workflow หลักได้ครบและเวลาใช้งานไม่ช้ากว่าระบบเดิมอย่างมีนัยสำคัญ
