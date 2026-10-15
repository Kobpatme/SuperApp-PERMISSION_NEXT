# METRIX native local QA — 15/10/2569

Source `f87220bf94b765e4896388632c3dbeabb5286510`; immutable Core baseline `5f32a111ebeeb3fea8918db7e702d95bc7302bdf` ดู [current status](../../implementation-status.md), [module contract](../../modules/duct-rental.md) และ [deployment](../../operations/duct-rental-deployment.md)

## ผลล่าสุด

| Check | ผล |
|---|---|
| lint / typecheck / production build | ผ่าน |
| npm test | 6,164 ผ่าน / 65 opt-in ข้าม; 78 files ผ่าน / 5 ข้าม |
| document mapping / CSS | 1 ผ่าน / 316 files, 0 violations |
| constrained PostgreSQL services | 24 ผ่าน (แยกรันด้วย opt-in; multi-operation integration ไม่ใช่ latency assertion) |
| migration catalog/replay/grants | ผ่านถึง 0057; 40 capabilities/10 editable presets; no auto assigns/grants; preset customization และ Work grants คงเดิม |
| empty transaction DDL rollback | 57 migrations → abort → 0 public tables / 0 duct functions |
| import planner / financial / CLI | 7 / 3 / 5 ผ่าน; fixture writes 0 |
| browser | 8 ผ่านใน 179.7 วินาที |
| Core screenshot comparison | 13 คู่; changedPixels 0 ทุกคู่ |
| axe | 13 views, 0 violations; tags WCAG 2/2.1/2.2 AA |
| 1000-row list | คืน 50/count 1000/next 50; 14 measured calls × 4 SQL |
| local API timing samples | latest closure427.6–513.6ms/5samples; historical larger fixture1.99–2.26sec |
| NT PDF | 10tests; three template hashes/164 terminal fields; all5NT/signed4/chosen-date4/reference/summary render inspected |

Opt-in skipped tests ไม่เป็นหลักฐาน passed Integration RLS ใช้ PostgreSQL จริงและ runtime role จริง ไม่มี production DB/file/customer fixtures

## รันซ้ำ

ต้องมี PostgreSQL loopback และ local operator connection ที่ตั้งอยู่ใน environment/.env.local; scripts เปลี่ยน target เป็นชื่อ fixture ที่กำหนดเท่านั้น ไม่พิมพ์ connection string ห้ามชี้ fixture helpers ไปเครื่อง production รัน services/catalog/browser **ตามลำดับ** เพราะใช้ fixture เดียวกัน

```powershell
npm run lint
npm run typecheck
npm test
npm run test:documents
node scripts/check-css-quality.mjs
npm run build
node scripts/duct-rental-catalog-test.mjs
node scripts/duct-rental-service-test.mjs
node scripts/duct-rental-schema-rollback.mjs
node --test scripts/duct-rental-import.test.mjs
```

```powershell
$env:DUCT_RENTAL_PDF_QA = '1'
npm test -- src/modules/duct-rental/tests/pdf.test.ts
Remove-Item Env:DUCT_RENTAL_PDF_QA
node scripts/duct-rental-source-pdf.mjs
node scripts/duct-rental-browser-fixture.mjs
node scripts/duct-rental-browser-projects.mjs
node node_modules/next/dist/bin/next build .data/duct-rental-browser/current
node node_modules/next/dist/bin/next build .data/duct-rental-browser/baseline
node node_modules/@playwright/test/cli.js test --config playwright.duct-rental.config.ts > docs/quality/duct-rental/browser-final.log 2>&1
node scripts/duct-rental-query-counts.mjs docs/quality/duct-rental/browser-final.log
python scripts/duct-rental-compare-core.py
```

Fixture databases: `permission_next_duct_rental_test` และ empty `permission_next_duct_rental_rollback_test` Browser projects `.data/duct-rental-browser/{current,baseline}` current copy เปลี่ยน lifecycle development→active เฉพาะ fixture Main manifest ยัง closed Fixture profiles เป็น fake IDs 9001–9005/team 9101 ใช้เฉพาะ `*.example.test`; runtime credentials สุ่มเก็บใน ignored runtime.json ห้ามนำขึ้น Git/ส่งรายงาน

Browser ports 3112/3113 ใช้ fake Core session เดียวข้าม port สำหรับภาพก่อน–หลัง ไม่รัน Source app ไม่ใช้ Source Auth ไม่คัด .env เข้า fixture project ปิด NAS/maps/external sheet configuration

## หลักฐานและข้อจำกัด

JSON/log/PNG/PDF generated อยู่ local directory นี้และ ignored ไม่ force-add เอกสาร private Runtime evidence: browser-final.log/results, core-comparison.json, query-counts.json, list-performance.json, 13 `*-axe.json`, Core paired screenshots, nt-form/nt-form-signed/summary และ source-nt-form/source-nt-form-signed

Source reference ใช้ frozen ntFormFiller เท่านั้น มี SHA/hash evidence, synthetic data, network bytes 0 Source canvas rasterization เทียบ native flattened vector ความต่าง count 1→3 เป็น DQ03 อนุมัติแล้ว ตรวจภาพไทย/ตำแหน่ง หน้า 1/3/4; หลังแก้ appearance ตรวจ native ทุก 5 หน้าและ signed 4 ไม่กล่าว pixel-identical NT/Source UI Summary 2 หน้า fixture ตรวจ header/sections/design/install/footer

Core 13 คู่: login 1, home/work/buildings × desktop1440/mobile390 × Light/Dark Mask เฉพาะ `.updated-at` / `.work-live-refresh time` ไม่ mask control/navigation/layout

Axe views: design, signed permission, signatures, contract ready/mobile light/mobile dark, cancel new/completed, annual list/contract ready/contracted, list 320 และ list reflow dark640 `#workspace-content` scope คีย์บอร์ดตรวจ modal Escape/focus restore/search/paging 640px เป็น equivalent 200% viewport ไม่ใช่ actual browser zoom ทุกหน้า

Timing เป็น local synthetic dataset และ server-side scoped materialized query ไม่ดึงทั้ง business table ไป browser ไม่ยืนยัน 100 concurrent users/production SLA No SQL/parameters/actors/secrets logged by fixture metrics (เปิดได้เฉพาะ exact loopback fixture DB)

รอบเก่าที่เครื่องถูก suspend หลายชั่วโมงไม่ใช้เป็น evidence รอบสุดท้าย rerun ผ่านครบ ส่วน integration role-scope case เกิน default 5s เมื่อ dataset fixture โต จึงใช้ explicit integration timeout 30s และ rerun 21 ผ่าน ไม่ลด assertion/ข้าม test

Human UAT/real user mappings/template rights/retention/production storage/load/cutover ยังไม่ได้ตรวจ ไม่สรุป migrated หรือ production-ready

## รอบปิดข้อพบ RC-01–07

รายงานปิดRC-01–07เก็บlocal/Githistory commit392c327; contract/parity/current statusเป็นข้อมูลรับงานต่อ Logsใช้closure-{unit,services,catalog,rollback,lint,typecheck,build,css,document-mapping,pdf,import-cli}.log และbrowser.log/results; goldens Sourcevalidation124/Sourcepure5699/financePDF6/parity matrices; SourceSHA/blob/SourceZod4 verified

Portable fixture cluster ใหม่ loopback55447 แยกจาก main5432 ใช้ scripts/duct-rental-local-check.mjs; ไม่มี .env/application connection หรือ Source credentials ส่งออก main manifest development/default false การเปิดactiveทำเฉพาะcopied browser project ภาพ Core13คู่0differences, axe13views0violations, list15calls×4SQL/max513.6msในfixture (ไม่ใช่ production SLA)

PDFtests10; closure-pdf-render/contact-sheet.png และchosen-date4 ตรวจ10pagesรวมall5NT/signed4/chosen-date4/summary1/blank1/copy1 วันที่31/12/2030ตรง ส่วนserver auditเป็นเวลาจริง Referencetemplatesทั้ง3คงhash/bytes/fields มีPoppler Symbol-font warning จากSource templateแต่ภาพที่ตรวจไม่มีclipping/tofu

คำว่า main paths/21tests/7browser และเวลารอบ14/10ในคำอธิบายเดิมเป็น historical evidence ก่อนclosure ผลปัจจุบันอยู่ในตารางบนและreport12 ไม่มี skipped/humanUATนับเป็นผ่าน

Fresh checkoutใช้Node22/PostgreSQL16/Python3.12+; ตั้งDUCT_RENTAL_TEST_DATABASE_URLเป็นloopback fixtureชื่อที่ระบุและDUCT_RENTAL_TEST_PYTHONถ้าpythonไม่อยู่ในPATH DefaultUXbrowserconfigไม่รันDuctsuite ส่วนCIตรวจDuctcatalog/services/rollback/importบนฐานแยก Source checkoutจำเป็นเฉพาะregenerategoldens/SourcePDFreference ไม่จำเป็นต่อunit persisted fixtures รายงาน12/99อยู่Git history ไม่เป็นprerequisiteของcheckoutใหม่

Handoffregression15/10: หลัง0057 Ductservices24/57-DDLrollback/catalog/importCLI5และCar schema10/service16ผ่านทั้งคู่ CoreUX45/Admin-Work11ผ่านบนfixtureคนละฐาน ชุดCarserviceรีเซ็ตเฉพาะตารางรถในชื่อฐานทดสอบที่ตรวจแล้วเพื่อไม่ปนloadfixturesจากรอบก่อน ไม่แตะbusinessdataจริง
