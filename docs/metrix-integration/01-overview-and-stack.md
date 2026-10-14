# ภาพรวม METRIX และการ freeze ต้นทาง

> สถานะล่าสุด 14/10/2569: native implementation และ local QA ส่งมอบแล้ว ดู [99](99-final-report.md) ตัวเลข baseline ด้านล่างเป็นประวัติ 10/10 ไม่ใช่ผลล่าสุด Core module toggle แบบ version/audit เพิ่มแล้วตาม DQ09 โมดูลหลักยัง development/default-disabled จน human UAT ไม่ได้ deploy หรือย้ายข้อมูลจริง


ตรวจวันที่ 10/10/2569; target ก่อนแก้ `5f32a111ebeeb3fea8918db7e702d95bc7302bdf` working tree สะอาด ต้นทาง `Kobpatme/METRIX@f87220bf94b765e4896388632c3dbeabb5286510` local `D:/WebApp/METRIX Request` และ remote HEAD ตรงกัน สำเนาอ่านอย่างเดียว `_discovery_sources/METRIX` ไม่มีการ fetch/แก้ repo ต้นทาง

ต้นทางเป็น Next.js 16.1.7 / React 19.2.3 / TypeScript / Zustand 5 / React Query 5 / React Hook Form 7 / Zod 4 / Tailwind 4 / lucide-react; ใช้ Supabase JS 2.103.2 และ SSR 0.10.2 สำหรับ Auth, PostgreSQL, RLS, Realtime และ Storage (`package.json`, `lib/supabase/*`, `store/*`) PDF ใช้ react-pdf 4, pdf-lib 1.17, pdfjs-dist 5 และ Sarabun ผ่านไฟล์ local; ไม่มี test script ต้นทาง

App Router: `app/(dashboard)/dashboard/duct-rental/*`; state/CRUD ส่วนใหญ่ใน browser stores; create-draft และ accept-phase ใช้ API ฝั่ง server; สูตร/สิทธิ์/validation กระจาย `lib/utils.ts`, `lib/processTracking.ts`, `schemas/ductRentalSchema.ts`, stores, page handlers, SQL policies และ PDF field mapping รายการทุกไฟล์อยู่ [08](08-source-file-index.md) และ controls [09](09-ui-control-evidence.md)

Env ที่อ้างใน tracked runtime: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (`lib/supabase/config.ts`) ไม่คัดค่าจริงหรือเพิ่ม credential เหล่านี้ใน target เพราะเปลี่ยนไปใช้ Core PostgreSQL/identity/storage; `next.config.ts` อนุญาตภาพ catbox แต่ยังไม่ยืนยันความจำเป็นของบริการนี้ ไม่มี cron/background scheduler ที่พบใน tracked Next code; browser Realtime + reconcile 15 วินาทีเป็น refresh ของ requests ไม่ใช่ cron

Roles: admin/design/draftsman/permission/install/3rdparty/viewer/director/division_manager/section_manager/supervisor/sr_manager; installation service-center list เพิ่มด้วย migration 20260417 สิทธิ์กรอง request จาก phase ที่เคย touched และ role; SQL มีความกว้างกว่าบาง UI guards ต้องแปลงเป็น capability + data scope ไม่คัด client authorization

Core Super App ยืนยันจาก `auth.ts`, `auth-session-service.ts`, `access.ts`, `authorization.ts`, `module-contract.ts`, `module-registry.ts`, admin actions, `material-change.ts`, `/api/health`: shared opaque session, single active session, live DB grants, module registry, required audit/activity/outbox มีอยู่แล้ว Module lifecycle ยัง static ไม่ใช่ admin module toggle ใน DB (ตรงกับเอกสาร information architecture)

Baseline ปัจจุบันผ่าน lint/typecheck/unit 267 ผ่าน 41 ข้ามใน 69 files/document 1/build Next 16.3.8 ไม่ถือว่า skipped integration ผ่าน; ไม่ได้รัน runtime ต้นทางหรือดึง production data ข้อมูลจริง/จำนวนแถว/credentials/cutover ยังต้องเจ้าของยืนยัน

JEV health network=true ใช้ได้; route confidence .47 → fallback Codex; evidence supported .59 / needs-more .87 → ห้ามอ้าง parity complete; risk hard gate เป็น advisory สำหรับ migration ไม่ใช่การอนุญาต production การทำ local fixture/โค้ด reversible อยู่ในขอบเขตแผนที่ผู้ใช้สั่ง
