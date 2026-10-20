# ส่งมอบและ deploy โมดูลเช่าท่อร้อยสาย

ใช้ร่วมกับ [deployment runbook](deployment-runbook.md), [release checklist](release-checklist.md), [module contract](../modules/duct-rental.md) และ [กฎธุรกิจ/คำตอบเจ้าของ](../metrix-integration/06-integration-risks-and-open-questions.md)

## ชุดไฟล์ที่ต้องมี

เก็บ source, package.json/package-lock.json, Next configuration, public assets และ migrations ตาม checkout เดียวกัน Production contract ใช้ Node.js22, PostgreSQL16+ และ TLS reverse proxy มี Docker/standalone recipe ใน [DEPLOY.md](../../DEPLOY.md) แล้ว แต่ container acceptance และข้อจำกัด TencentDB ยังต้องยืนยันก่อน production; native checkout ใช้ scripts/run-with-nas.cjs/scripts/write-build-info.mjs เดิม

ต้องเก็บ src/modules/duct-rental/assets ทั้ง directory ด้วย เพราะ server PDF อ่าน template/Sarabun จาก process.cwd() และ browser ใช้ public/duct-rental/pdf.worker.min.mjs/standard_fonts แบบ local Native build/start ใช้ repository root; Docker tracing รวม assets directory และคัด public/.next/static พร้อม standalone server

```powershell
npm ci
npm run lint
npm run typecheck
npm test
npm run test:documents
npm run build
npm audit --omit=dev
```

## ฐานข้อมูลและ private storage

ตรวจ backup/restore และอนุมัติ schema apply ก่อน operator รัน npm run db:migrate โดย DATABASE_URL ของ operator มีสิทธิ์จัดการ schema/roles Migrations 0029–0057 เป็น DDL/RLS/catalog ของโมดูลใหม่ รวม Core module flag ไม่ใช่คำสั่งนำเข้าข้อมูล METRIX ห้ามใช้ operator login ใน DUCT_RENTAL_DATABASE_URL

หากเปิดใช้โมดูลใน release ที่อนุมัติแล้ว ให้ operator สร้าง login แยกแบบ LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS แล้ว grant duct_rental_runtime ให้ login นั้น ตั้งรหัสผ่านผ่าน secret manager/psql interactive password prompt ไม่เก็บใน SQL/Git/login output Login ต้องไม่เป็น table owner หรือสมาชิก duct_rental_policy_worker ซึ่งเป็น NOLOGIN policy-function owner เท่านั้น

ตั้ง DUCT_RENTAL_DATABASE_URL เป็น connection ของ runtime login และ DUCT_RENTAL_STORAGE_DIR เป็น absolute private directory ที่ service account อ่าน/เขียนได้ ไม่มี fallback ไป Core operator pool โฟลเดอร์ต้องอยู่นอก public และ backup คู่กับ PostgreSQL เอกสาร/ลายเซ็นไม่อยู่ใน repository

## เงื่อนไขเปิดโมดูล

Manifest lifecycle active/enabledByDefault false ตามคำขอเจ้าของให้เปิด local UAT ด้วยบัญชีเดิม การเปิดแต่ละ environment ยังผ่าน Core Admin และ scoped grants เดิม Human UAT, template/font rights/printing/retention, identities/teams/scopes/service-center coordinator mapping และ operator rollout review ยังต้องผ่านก่อน production ดู [การทดสอบพาดสาย](cable-trial-uat.md) งานนี้เพิ่ม migration0058 ให้ฐาน local หลังสำรองข้อมูล ไม่ใช่การเปิด production

มี 10 editable role presets แต่ไม่มี auto-assign ผู้ใช้จริง Admin เลือก/คัดลอกและมอบ scope ผ่าน Core ตามหน้าที่ Sr. Manager มี assigned-only signing ตาม DQ01 การดูราคาแยก rate.read; server ตรวจ current original/own asset/verified actor/audit time

คำสั่ง push main เป็นการส่งมอบโค้ด ไม่ใช่ apply schema/import/activate production ในงานนี้ ไม่มีการย้ายข้อมูลจริง Offline importer ไม่มี apply mode ดู [dry-run contract](../metrix-integration/10-offline-import.md)

Migration0057จำกัดสองDuct event policiesบนCore activity/outboxให้ใช้เฉพาะduct_rental_runtime เพื่อไม่ให้runtimeของCarต้องมีEXECUTEบนprivateDuctpredicate ไม่เปลี่ยนWITH CHECK/restrictiveboundaries/ข้อมูล/grants ใช้ [ALTER POLICY TO](https://www.postgresql.org/docs/current/sql-alterpolicy.html) ตรวจregressionด้วยDuct24/Car16service testsพร้อมกันในการส่งมอบ

## ตรวจหลัง deploy และ rollback

ตรวจ health/Core login/temporary-password restriction/permission denials และเมนูโมดูลที่เปิดอยู่ก่อน ถ้าเปิด Duct หลัง UAT ให้ตรวจ private PDF read/export, scoped requests, current-original signing, audit/outbox และ module disable โดยไม่ใช้ข้อมูลลูกค้าสำหรับ smoke tests

Rollback ปิดผ่าน Core Admin/ถอน grants ตาม runbookและคืน artifactก่อนหน้าเมื่อเข้ากันกับ schema ไม่ลบเอกสาร/audit/business rows ไม่ย้อน DDL แบบ destructive อัตโนมัติ การทดสอบ 57-DDL transactional rollback บน fixture ว่างไม่ใช่ production rollback recipe

## สำหรับนักพัฒนารับงานต่อ

[QA guide](../quality/duct-rental/README.md) ระบุ unit/catalog/constrained-service/browser/rollback/import commands CI ใช้ PostgreSQL fixture แยกและไม่ต้องมี Source checkout เพื่อรัน persisted goldens Browser suiteใช้ playwright.duct-rental.config.ts โดยเฉพาะและเปิด lifecycleเฉพาะ copied fixture project ไม่รวมใน default UX suite

ตัวเตรียม copied projects ต้องมี Git history ถึง baseline5f32a111 และ Python3.12+ ใน PATH; ตั้ง DUCT_RENTAL_TEST_PYTHON เป็น executable ที่มีอยู่หาก PATHไม่พร้อม Portable PostgreSQL helperเป็นทางเลือกสำหรับ Windows; CI/Linuxใช้ DUCT_RENTAL_TEST_DATABASE_URL แยกบนloopbackโดยตรง
