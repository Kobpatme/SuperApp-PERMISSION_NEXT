# ปิดข้อพบจากการตรวจความครบ — ขอบเขตไม่ย้ายข้อมูล

ตรวจรอบ 14–15/10/2569 เทียบ `CODEX-METRIX-DUCT-RENTAL-MODULE.md` ใน Downloads, frozen METRIX `f87220bf94b765e4896388632c3dbeabb5286510` และคำตอบเจ้าของ DQ01/02/03/07/09 หลังคำสั่ง “ทำให้ 100% แต่ไม่ย้ายข้อมูล”

**ปิด RC-01–07 ครบใน implementation และ automated local verification แล้ว** รวมการแก้ข้อมูลคำขอระหว่างดำเนินงานที่พบเพิ่ม ไม่ย้ายข้อมูลจริง ไม่ apply ฐานหลัก/production ไม่มอบสิทธิ์ผู้ใช้จริง ไม่เปิดโมดูลหรือ deploy Human UAT และการอนุมัติเปิดใช้เป็น release gates ที่ยังไม่ได้ดำเนินการ ไม่อ้างว่า production-ready

## ข้อพบและหลักฐานปิด

| ข้อ | ผลลัพธ์ที่ทำแล้ว | หลักฐาน |
|---|---|---|
| RC-01 ชุดบทบาท | 10 editable presets: Admin/Design/Draftsman/Permission/Install/3rd Party/Viewer/Director/Division Manager/Sr. Manager; replay รักษาบทบาทที่แอดมินปรับ; ไม่สร้าง assignments/scopes; Sr. Manager มีเฉพาะ assigned signing เพิ่มจากอ่าน | `domain/role-presets.ts`, migration 0053, Source role matrix, catalog exact permissions/customization rollback และ browser Core Admin เปิดแก้ทุก preset ได้ |
| RC-02 exhaustive goldens | cable×fiber 33 คู่: valid18/invalid15; valid ทุกคู่ทดสอบ delta −.002/−.001/0/.001/.002; Source validation124 fixtures; role/current/touched/status4000 และ role/phase/file1600; request1500, annual25, cancellation25 state pairs; P1ครบ16, guarantee/receipt64, movement80; SLAก่อน/ตรง/หลังกำหนด5/7วันรวม timezone ที่เป็นเวลาเดียวกัน | `scripts/metrix-{validation,golden,parity-golden}.mjs`, frozen fixtures, `schema/source-policy/parity-matrix.test.ts`; ใช้ Source AST/VM และ Source Zod4 จริง ไม่ใช้ target สร้าง expected |
| RC-03 constants | เทียบค่า/ชื่อ/ลำดับครบ owner/center/vendor/request/job/cable/fiber maps ทั้ง7ชุด | persisted Source fixtures และ `parity-matrix.test.ts` |
| RC-04 created banner | draftsman รับ `?created=1`, แสดงคำขอสำเร็จและปุ่มทำงานต่อที่ล้าง query | async searchParams route + RequestWorkspace; browser assert banner/continue/URL |
| RC-05 signature controls | date selector/blank date, offsets±180, nudge6 ทั้ง4targets, scale.45–1.6/ปุ่ม±.05, live preview, uploadเลือก assetใหม่/default, ตำแหน่งและ confirm PDF ก่อนส่ง; ชื่อ/assignee/audit timestamp ยังยืนยัน server | Source controls/movement goldens, API strict/bounds tests, constrained signing test: display2030-12-31 แต่ signedAtเป็นเวลาปัจจุบัน; browser date/nudge/page4/sign; rendered chosen-date PDF |
| RC-06 templates | เก็บทั้ง3ไฟล์ byte-identical พร้อม safe filenames/SHA/bytes/pages/field inventory; generation ใช้ active Source templateเดิม; reference preview/export ผ่าน scoped API | `assets/templates.json`/README, hash/page/164 terminal-field mapping testsครบ3, service export/scope/traversal tests, browser blank preview และ visual QA |
| RC-07 Source JSON | `rate_notice_data` และ `guarantee_data` เก็บ key/notes/extensions เดิมใน private financial row; money เท่านั้นปรับ DQ02; numeric columns เป็น projections ที่ triggerตรวจตรงกับJSON; partial/draft/notesไม่ล้างยอดเดิม; dry-runเก็บ JSON/as-built ครบ | migration0054, `source-financial.ts`, planner/financial tests, constrained JSON consistency/notes/projection mismatch/RLS test |

เพิ่มเติม: Source active-request edit คืนผ่าน Core owner/scoped capability; metadata-only ไม่เปลี่ยน phase/status/owner/team; terminal/archived/cancelled ยังคงอ่านอย่างเดียวตาม Master Plan แบบและลายเซ็นผูก immutable design snapshot เมื่อแก้แล้ว NT เดิมลงนามไม่ได้ และเปลี่ยน ownerเป็น non-NT มอบหมาย NT ไม่ได้ ทดสอบ actorที่ไม่ใช่ownerถูกปฏิเสธ (migrations0055–0056, services integration)

## ผลตรวจรอบปิดงาน

| Gate | ผลที่รันจริง |
|---|---|
| lint/typecheck/build | ผ่านทั้ง primary project และ copied current/baseline browser production builds |
| full unit | 6,164ผ่าน / 65 opt-inข้าม; 78 filesผ่าน / 5ข้าม ไม่ถือ skipped เป็น passed |
| constrained PostgreSQL | 24ผ่าน แยกจากunit บน clusterใหม่ loopback55447 / `permission_next_duct_rental_test` ใช้ runtime role FORCE RLS |
| catalog/presets | migrationsถึง0056; 40capabilities/10presets exact; replay/customization/no auto-assign/no platform-admin duct grant ผ่าน |
| DDL rollback | 56migrationsใน transaction บนฐานว่างแยก → rollback → public tables0 / duct functions0 |
| offline import | planner7 + financial preservation3 + CLI5 ผ่าน; fixtureเท่านั้น; writes0 / ไม่มี apply mode |
| browser | 8ผ่าน / 0failed / 0skipped, 179.7วินาที: NTครบ10ขั้น/non-NT/signing/annual/cancel/permissions/notes/offline/Core presets/Core screenshots |
| Core visual | baseline `5f32a111ebeeb3fea8918db7e702d95bc7302bdf`; 13คู่ desktop/mobile Light/Dark; changedPixels0ทุกคู่ |
| accessibility | axe13views, violations0; keyboard dialog focus/Escape,320px และ640px equivalent200% viewport ไม่อ้างactual browser zoomทุกหน้า |
| list/performance | 1000synthetic rows/page50; 15measuredlistcalls ×4SQL (3runtimeguards+1pagedbusinessquery), ไม่มีN+1 ไม่อ้างproduction SLA |
| documents/CSS | legacy mapping1ผ่าน; CSS316files/0violations |
| PDF | tests10ผ่าน; render/inspect10pages: NTทุก5หน้า/signed4/chosen-date4/summary1/reference blank1/copy1; chosen-date31/12/2030ตรง มี Poppler Symbol-font warning ใน static Source templates แต่ภาพที่ตรวจไม่มี clipping/tofu |
| Source/Core protection | original METRIX และ frozen discovery git statusว่าง; ไม่มีแก้Core shell/global CSS/tokens/fonts/sidebar/topbar ในรอบนี้ |

Source reference PDF renderer/evidence จากรอบก่อนยังคงอยู่ Nativeใช้ vector/raster overlay ตามบริบท ไม่อ้างbyte equalityของ generated PDFs เทียบ Source คง active template hash, field mappings, signatures/date layout และ DQ03 actual cable count

## JSON/RBAC architecture contract

เก็บ JSON payload semantics ของ Source ก่อน: unknown keys/notes/extensions ไม่ถูก normalize ทิ้ง ตัวอย่าง Source JSON/ชื่อไฟล์/URL ที่เครื่องมือ dry-runอ่านเป็น review metadata ไม่กลายเป็นสิทธิ์ fetch/download หรือ live signer assignment ภายใน runtime ใช้ private document IDs ที่ serverตรวจแล้ว ไม่มี client supplied path/URL authority

ที่เก็บจริงเป็น `duct_rental_rates` แทนวางยอดเงินใน request ที่ผู้ดูทั่วไปอ่านได้ เพราะแผนกำหนด `rate.read` ฝั่ง server/RLS ตำแหน่งกายภาพนี้เป็น Core adapter; ไม่เปลี่ยนชื่อ/ความหมาย Source JSON และยังไม่ทำ real backfill Numeric projectionsรองรับ constraints/snapshot/totalsและDQ02เท่านั้น ไม่เพิ่มสูตร×12 ภาษี หรือ prorata

Viewer/working presets มี `request.update` สำหรับ owner exception ที่ Sourceมี แต่ server ตรวจownerหรือ admin หรือDesignในphaseDESIGNอีกชั้น ผู้บริหาร readonlyไม่มี capabilityนี้ รวม Sr. Manager ซึ่งลงนามได้เฉพาะ current original ที่มอบหมาย (DQ01)

## การทำซ้ำและขอบเขตที่ยังแยกไว้

`scripts/duct-rental-local-check.mjs` ใช้portable binariesเดิม สร้างcluster/data/passwordไฟล์เฉพาะfixtureใต้ignored`.data/duct-rental-postgres` ไม่อ่าน application connection มี start/catalog/services/rollback/fixture/projects/browser/stop modes Browsercopyเท่านั้นที่ปรับlifecycleเป็นactive; manifestหลักยังdevelopment/default-disabled

Goldensอ่านSource AST/expressions/Zodแบบoffline หลังตรวจSHA/blob ไม่สั่งรันSource app/auth/store/seed/migration Source validation dependencyอ่านจากoriginal packageที่มีอยู่ ไม่มีแก้Source

M0–M9 งานimplementation/automated evidenceครบตามขอบเขตที่เจ้าของปรับ M8เป็นtools/fixturesเท่านั้น ก่อนเปิดจริงยังต้อง owner UAT, identities/teams/scopes/coordinator mapping, template/retention/printing review และreviewed operator rollout การย้ายข้อมูลจริงต้องคำสั่งใหม่พร้อม crosswalk/backup/reconciliation ไม่มีการทำสิ่งเหล่านี้เพื่อปิดคะแนนความครบ

JEVรับเฉพาะsanitized summary เป็นadvisory: evidence-check supported.66/needs-more.83/gather-more โดยไม่แจกแจงข้อขาด ไม่ใช้เป็นproof/approval ผลปิดข้อพบยึดSource/compiler/tests/SQL/browser/renderโดยตรง และยังแยกhuman UAT/productionที่ไม่ได้ตรวจไว้อย่างชัดเจน

หลักฐานละเอียด: `docs/quality/duct-rental/closure-*.log`, browser-results.json, core-comparison.json, query-counts.json, *-axe.json และ closure-pdf-render การตรวจซ้ำ [11](11-requirement-recheck.md) เก็บเป็นประวัติของก่อนแก้; รายงานนี้เป็นสถานะปัจจุบัน

Implementation commits: `e7fe158` (presets/pure Source matrices/offline JSON preservation) และ `c92927f` (native controls/templates/private persistence/active edit guards) QA scripts/browser regressions/report closure บันทึกแยก ไม่มี push/deploy
