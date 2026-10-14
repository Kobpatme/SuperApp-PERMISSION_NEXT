# ผลตรวจซ้ำกับไฟล์ CODEX-METRIX-DUCT-RENTAL-MODULE.md

ตรวจ 14/10/2569 ที่ commit `1e833a1` เทียบไฟล์ใน Downloads, frozen METRIX `f87220bf94b765e4896388632c3dbeabb5286510`, โค้ด native, golden fixtures และหลักฐาน QA

**ผล: ยังไม่ครบตามไฟล์ 100% มีทั้งงาน implementation และ test coverage ที่ต้องเติม จึงไม่ใช่เหลือเพียง human UAT** รายงาน 99 และ parity matrix ก่อนตรวจซ้ำสรุปความครบของกลุ่ม UI/สิทธิ์กว้างเกินหลักฐาน ต้องอ่านข้อแก้ไขนี้ประกอบ

ขอบเขตครั้งนี้คือการตรวจความครบ ไม่แก้โค้ดธุรกิจ ไม่เปิดโมดูล ไม่ apply migration ไม่แก้ Source ไม่ใช้ข้อมูลจริง คำตอบเจ้าของ DQ01/02/03/07/09 มีผลเหนือแผนเดิม โดยเฉพาะ M8 ทำเครื่องมือและ fixture เท่านั้น จึงไม่นับการไม่ย้ายข้อมูลจริงเป็นงานตกหล่น

## ช่องว่างที่ยืนยันจากโค้ด

| ID | ข้อในไฟล์ | สิ่งที่พบ | ต้องทำเพื่อปิดข้อ |
|---|---|---|---|
| RC-01 | §5.2 / M1 ชุดสิทธิ์สำเร็จรูปตามบทบาท Source | migration 0029 seed 40 permissions แต่ไม่มี seed business roles/role_permissions สำหรับ Design/Draftsman/Permission/Install/3rd Party/Viewer/Management/Admin การไม่ auto-grant ผู้ใช้จริงเป็นเรื่องที่ถูกต้อง แต่ต่างจากการมีชุดพร้อมให้เลือก | สร้าง reusable role bundles และตรวจ default visibility/actions ตาม Source โดยไม่มอบให้ผู้ใช้จริงอัตโนมัติ |
| RC-02 | §6.6 / M3 ทุกคู่ cable×fiber ถูก/ผิด/ขอบ ±0.001 และ transition/document/role goldens | lookup fixtures มีคู่ถูก 18 คู่ + invalid 3 ตัวอย่าง แต่ design validation 13 fixtures ใช้ ADSS/12 Core กับ ADSS/2 Core เท่านั้น ไม่ครบ boundary ทุกคู่; ยังไม่มี source-derived golden matrix ทุก from/to และทุก role×file type แม้มี native integration ที่ตรวจ flow หลัก | เติม golden matrix และ RULE coverage ที่แยก Source expectations จาก native implementation ให้ครบ ไม่ใช้จำนวน test รวมแทน coverage |
| RC-03 | §6.5 reference constants พร้อม test เทียบ Source | owner 12/center 17/vendor 10 และ request/job/cable constants เท่าต้นทางจาก AST/VM comparison ในการตรวจครั้งนี้ แต่ไม่พบ persisted regression test ที่เทียบ arrays เหล่านี้กับ frozen Source fixture | เก็บ Source constant fixtures และ assertion ที่ตรวจรายการ/ค่า/ลำดับทั้งหมด |
| RC-04 | §7 / M5 draftsman แถบสร้างสำเร็จ `?created=1` | RequestForm:58 ส่ง URL พร้อม query แต่ `[id]/[view]/page.tsx` รับเฉพาะ params และ RequestWorkspace ไม่อ่าน query ไม่มี success banner/ปุ่มทำงานต่อแบบ Source | เพิ่มข้อความสำเร็จและ continue/dismiss behavior บน Core design พร้อม browser assertion |
| RC-05 | §0.4 / §4 / §7 / M6 หน้าลงนามรักษาฟังก์ชันเดิม | Source pdf-preview ให้เลือก display date และ clamp offset ±180/nudge 6; native UI/schema ใช้ ±1000 และ server `new Date()` โดยไม่มีตัวเลือกวันที่ ไม่พบ owner decision ที่อนุมัติสองความต่างนี้ DQ01 อนุมัติ assigned-only capability ไม่ได้อนุมัติเปลี่ยนวันที่/ช่วงเลื่อน | คืน behavior เดิมหรือบันทึก owner decision ที่ชัดเจน แยก server audit timestamp จากวันที่แสดงบน PDF และเติม boundary/UX tests |
| RC-06 | §2.3 / §4 / M6 templates 3 ไฟล์ พร้อม safe names/mapping | Source มี PDF 3 ไฟล์ hash ต่างกัน Native มี `nt-duct-rental.pdf` 1 ไฟล์ซึ่งตรง active template; README mapping ครอบคลุมเพียงไฟล์เดียว Source runtime ใช้ active ไฟล์นี้ จึงไม่สรุปว่า generation หลักเสีย แต่ packaging/reference inventory ยังไม่ครบตามรายการ | ทำ inventory/mapping ทั้ง 3 และเก็บ reference หรืออธิบายการยกเว้นไฟล์ที่ไม่ reachable ให้ตรวจทานได้ |
| RC-07 | §6.4 คง JSON payload ก่อน แล้ว normalize เป็นงานแยก | Native แยก monthly/yearly/fullAmount ไป `duct_rental_rates` แล้ว ขณะที่ Source request เก็บใน rate_notice_data/guarantee_data JSON การแยกช่วยบังคับ rate.read แต่ DQ02 อนุมัติ Decimal 2dp ไม่ได้ยืนยันการ normalize นี้โดยตรง | ระบุ architecture exception/เหตุผลและ lossless field mapping/reconciliation ให้ชัด ไม่อ้างว่า schema ตรง Source ทุกช่องโดยไม่มี adaptation |

RC-02: Source cable tableมี 3 ชนิดและ 11 fiber labels รวม cross product 33 คู่: valid 18 / invalid 15 ส่วน schema fixtures ทดสอบ valid pair เดียว + invalid pair เดียว ตัวอย่าง unknown/null ใน lookup ไม่ใช่การครอบคลุม invalid cross pairs ทั้งหมด

RC-05: การตรวจพบความต่างของ UI/ข้อมูลที่แสดง ไม่ได้เสนอให้ client กำหนด identity หรือ audit timestamp ชื่อผู้ลงนามและเวลาธุรกรรมยังต้องยืนยันฝั่ง server

## หลักฐานไฟล์สำหรับตรวจซ้ำ

- RC-01: `supabase/migrations/0029_duct_rental_catalog.sql:1` และ capability catalog; ค้น roles seed ใน migrations พบ Core/Guarantee/Car แต่ไม่มี Duct business role bundles
- RC-02/03: `scripts/metrix-golden.mjs:60`, `scripts/metrix-validation-golden.mjs:27`, `tests/fixtures/metrix-golden/{nonfinancial,validation,finance-pdf}.json`, `src/modules/duct-rental/tests/{source-policy,schema,money-workflow}.test.ts`
- RC-04: Source `app/(dashboard)/dashboard/duct-rental/[id]/draftsman/page.tsx:163`; target `components/request-form.tsx:58`, route `[id]/[view]/page.tsx:6`
- RC-05: Source `app/pdf-preview/page.tsx:36` และ `:480`; target `schemas/operations.ts:17`, `components/signature-workspace.tsx:34`, `server/signing.ts:78` / `:163`
- RC-06: Source `public/templates/`, active reference `components/pdf/ntFormFiller.ts:35`; target `assets/README.md:5`
- RC-07: `src/modules/duct-rental/server/schema.ts:17`, `server/requests.ts:65`; Source schema/store และ attached §6.4

## งานที่มี implementation/หลักฐานรองรับแล้ว

| กลุ่ม | ผลตรวจ |
|---|---|
| Native registry/Core auth/scoped RBAC/module toggle | มีจริง; main manifest development/default-disabled ไม่มี auth ซ้ำ ไม่ฝัง Source shell |
| Request workflows NT/non-NT/accept/draft/docs/COMPLETE | มี domain/server guards และ integration/browser happy paths; ไม่เท่ากับทุก control ผ่าน parity |
| Assigned sign/private assets/stale original/revoke | มี runtime enforcement และ tests; RC-05 เป็นข้อที่ยังต่างจาก Source |
| Rates/guarantee/annual/cancel/SLA | ใช้ Decimal ตาม DQ02, actual count ตาม DQ03, snapshots/atomic cancellation/Bangkok; RC-07 ต้องบันทึก contract adaptation |
| Core design | ตรวจ artifact เดิม 13 screenshot pairs ยังคง changedPixels=0 และ layout diff มีเพียง Admin capability predicate ตาม DQ09 |
| Offline import | ตรง DQ07: dry-run tools/synthetic fixtures ไม่มี real apply; ไม่ถือว่า real migration/reconciliation ผ่าน |

## การทดสอบรอบนี้กับหลักฐานเดิม

รันซ้ำ `npm test -- src/modules/duct-rental/tests`: **181 ผ่าน / 21 integration opt-in ข้าม** ใน 11 files (10 ผ่าน/1 ข้าม) รวม PDF tests ไม่ถือ 21 skipped เป็น passed ไม่ได้รัน PostgreSQL/browser ใหม่ในรอบนี้

หลักฐานก่อนตรวจซ้ำที่ commit เดิม: full unit450ผ่าน62ข้าม, constrained PostgreSQL21ผ่าน, browser7ผ่าน, Core13คู่0pixelchange, axe13views0violations, offline CLI5ผ่าน, page50/1000rows/4SQL สามารถสนับสนุนเส้นทางที่ทดสอบแล้ว แต่ไม่พิสูจน์ RC-01–07 ว่าครบ

ไม่ได้ rerun full build/lint/security scan ทุก subsystem หรือ human UAT ในรอบตรวจนี้ โค้ด runtime ไม่ได้เปลี่ยนจาก commit ที่มีหลักฐานก่อนหน้า

## สถานะ milestone หลังตรวจซ้ำ

| M | สถานะ |
|---|---|
| M0 | discovery/ADR/baseline มี; ต้องทำ template inventory และปรับรายงานไม่กล่าวเกินหลักฐาน |
| M1 | ⚠️ catalog/guard/toggle มี แต่ role bundles ยังขาด (RC-01) |
| M2 | DDL/RLS/private runtime และ local transactional rollback มี; schema adaptation ต้องชี้แจง RC-07 |
| M3 | ⚠️ tests ที่มีผ่าน แต่ required exhaustive goldens/constant tests ไม่ครบ (RC-02/03) |
| M4 | server services และ prior 21 real PostgreSQL tests มี; ปิด coverage ที่เกี่ยวกับ RC-02/05/07 เพิ่ม |
| M5 | ⚠️ native main UI มี แต่ created success behavior ขาด (RC-04); ยังไม่ได้ sign off ทุก Source control |
| M6 | ⚠️ main PDF/signing/contract flow มี แต่ RC-05/06 ยังไม่ครบ |
| M7 | main annual/cancel/SLA/tasks/realtime มีและเคยทดสอบ; ยังรอ owner parity/UAT |
| M8 | ✅ tools/fixtures ตรง scope ที่เจ้าของปรับแล้ว; ไม่ย้ายข้อมูลจริง |
| M9 | main QA evidence มี แต่ต้องเพิ่ม regression cases สำหรับช่องว่างที่พบก่อนปิด parity |

## เงื่อนไขก่อนใช้จริงที่แยกจากงานตกหล่น

Human UAT, real users/teams/scopes/coordinator mapping, template/retention review และอนุมัติ rollout เป็น release conditions ไม่มี production apply/grants/deployment ในขอบเขตตรวจนี้ การคงโมดูลปิดและไม่ย้ายข้อมูลจริงเป็นไปตามคำสั่ง ไม่ใช่สิ่งที่ต้องแอบทำเพื่อให้ครบ

JEV health ใช้ได้; evidence-check สำหรับข้อสรุปไม่ครบ supported0.78/needs_more_evidence0.74/gather_more_evidence เป็น advisory เท่านั้น ข้อค้นพบข้างต้นมาจากไฟล์/AST/fixtures/test output ไม่ใช้คะแนนเป็น proof หรือ authorization
