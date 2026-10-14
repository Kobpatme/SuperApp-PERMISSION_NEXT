# รายงานส่งมอบ METRIX — เช่าท่อร้อยสาย

ตรวจล่าสุด 14/10/2569 บน branch `codex/metrix-duct-rental-foundation` Native implementation พร้อมตรวจ UAT ใน fixture แล้ว ไม่มีการย้ายข้อมูลจริง apply ฐานหลัก/production grant ผู้ใช้จริง หรือ deployment โมดูลหลักยัง development/default-disabled ตาม release gate ที่ต้องบันทึก human UAT ก่อนประกาศ migrated

Source freeze: `Kobpatme/METRIX@f87220bf94b765e4896388632c3dbeabb5286510` Target before-module baseline: `5f32a111ebeeb3fea8918db7e702d95bc7302bdf` Source ใช้อ่านอย่างเดียว ไม่คัด auth/stores/env มาเป็น runtime

## งานตาม milestone

| M | สิ่งที่ส่งมอบ | สถานะและขอบเขต |
|---|---|---|
| M0 | baseline, ADR, source index, F01–F22, RULE-001–020, 403 control attributes/24 screens | ตรวจ tracked Source; deployed drift และ legacy HTML runtime ไม่ได้ยืนยัน |
| M1 | registry/routes/40 capabilities/scopes; Core Admin module toggle version/audit ตาม DQ09 | ไม่มี automatic grants; development module เปิดไม่ได้ fixture copy active สำหรับ browser QA เท่านั้น |
| M2 | migrations 0029–0052, FORCE RLS, constrained runtime, private storage, version/immutable/workflow guards | ผ่าน catalog/replay และ transactional DDL rollback ทั้ง 52 migrations ใน empty fixture; ไม่มี production down migration |
| M3 | executed Source goldens, Zod boundary fixtures, native money/workflow/signature rules | golden provenance SHA/hash; positive/negative/boundary ร่วมกับ integration ไม่อ้างทุก RULE มี Source callable function หรือทุก operation มี 3 goldens |
| M4 | request/accept/save/submit/files/signing/annual/cancel/tracking/settings/SSE APIs | Core session+scope+validation; audit/activity/outbox/receipt transaction เดียว; 21 PostgreSQL service tests |
| M5 | list/new/edit/design/draftsman/install/as-built native UI | draft/full submit, contacts/coordinator/cable lookup, server pagination, private files |
| M6 | NT/sign-off editor, permission2/3, rates/guarantee/contract, private PDF viewer | preview→confirm, assigned current original, actual cable count, Decimal 2dp, notes draft preservation |
| M7 | annual/cancel/SLA/tasks/Core notification/realtime/offline | year snapshots/review totals/stages, atomic cancel, own assets/sign tasks; SSE hint ไม่ส่งข้อมูลธุรกิจ |
| M8 | offline dry-run planner/CLI/file integrity/crosswalk/reconciliation + synthetic fixture | ตามเจ้าของ: ไม่ย้ายข้อมูลจริง ไม่มี apply mode |
| M9 | browser flows/security/axe/load/PDF/Core comparison + reproducible scripts | local automated QA ส่งมอบ; human UAT/production ยังไม่ผ่านและไม่อยู่ในคำอ้างนี้ |

## ผลตรวจล่าสุด

- lint/typecheck/build ผ่าน; unit **450 ผ่าน / 62 opt-in ข้าม** ใน 81 files (76 ผ่าน/5 ข้าม) ไม่ถือ skipped เป็น passed
- document mapping **1 ผ่าน**; CSS **312 files / 0 violations**
- isolated PostgreSQL services **21 ผ่าน** ใช้ constrained runtime/RLS จริง ไม่ mock audit หรือ database policies; catalog/replay/no-auto-grants/preserved Work grants ผ่านถึง 0052
- empty rollback fixture: 52 migrations ใน transaction ที่ abort แล้วเหลือ public tables 0 / duct functions 0 ไม่ใช้ DROP กับฐานหลัก
- offline CLI **5 ผ่าน** และ pure import planner **7 ผ่าน** fixture requests 2/rates 2/documents 1/annual 1/routes 2/cancel 1; monthly 199.00/yearly 0.30/guarantee 2.02/annual keep 0.30; issues/warnings/writes 0
- browser **7 ผ่าน**: full NT 10 phases + assigned sign/realtime/cancel; full non-NT + partial contract/autosave; anonymous/no-access/temporary/stale/module switch/single-session; annual/cancel keyboard; annual keep/drop/stages/private contract; 1000-row search/paging/offline; Core before/after
- Core login/home/Work/Buildings **13 คู่ภาพก่อน–หลัง / changed pixels 0** รวม desktop/mobile Light/Dark Mask เฉพาะเวลา live refresh ของ Work; ไม่มี Source business UI pixel-comparison claim
- axe **13 views / 0 violations** ใน flow ที่ทดสอบ ตั้ง tags WCAG 2/2.1/2.2 AA ไม่เท่ากับ human accessibility certification; 320/390/640/1440 px และ reflow viewport เทียบ 200% ไม่ใช่ actual browser zoom ทุกหน้า
- 1000 synthetic requests: API คืน page 50/count 1000/nextOffset 50 ใช้ **4 SQL ต่อ list call = 3 runtime guards + 1 scoped materialized business query** วัดเฉพาะ loopback fixture ไม่มี SQL/parameters/customer data ใน metrics latency samples อยู่ใน QA JSON ไม่ใช่ production SLA/concurrent-user benchmark

คำสั่งและ local artifacts อยู่ [QA README](../quality/duct-rental/README.md) รายละเอียด parity [07](07-parity-matrix.md) และสัญญาโมดูล [module contract](../modules/duct-rental.md)

## RULE → หลักฐาน

| RULE | Test / หลักฐาน native |
|---|---|
| 001 Draft/accept | services.integration: owner/idempotent replay/partial draft/accept conflict; API session tests; browser new→draft→submit |
| 002 Design/Install | schema.test + executed original Zod fixtures; services partial/full; browser install fields |
| 003 Cable mapping | source-policy + schema cable/fiber/diameter boundary cases; RequestForm dependency |
| 004 Missing documents | source-policy original Memo/whitespace; money-workflow completion gate; services/browser Memo clears marker |
| 005 Phase visibility | source-policy original role phase cases + RLS scope/touched phase tests |
| 006 File visibility | source-policy original file cases; services private documents/annual parent/forbidden viewer; server auth/path checks |
| 007 Transition graph | money-workflow; services full NT/non-NT/skip/stale/terminal; full browser branches |
| 008 Monthly/yearly | approved-golden/money-workflow; independent Decimal values in service/browser |
| 009 Guarantee/COMPLETE | workflow schemas + service docs/5 fields; partial autosave and completion browser |
| 010 Active annual routes | services ALL snapshot/global unique year; import-planner; annual browser |
| 011 Keep total | approved-golden/Decimal; services keep/drop; import reconciliation; annual browser |
| 012 Annual stages/owner | source-policy original owner/status; services review/stage/final PDF; annual browser |
| 013 Cancellation | source-policy statuses/owner; services atomic route cancel/duplicates/terminal/reject; browser cancel |
| 014 SLA/date | source-policy original ceil/Bangkok boundaries; services rejected completed fallback; tracking counts |
| 015 Assigned signoff | services assignment-before-original/reissue/regenerate/revoke/current snapshot/closed race/live permissions; browser own signer |
| 016 Signature assets | signature-layout/image tests; own-only/default/archive services; browser upload/crop/preview/confirm |
| 017 PDF | approved-golden + pdf.test 7; actual template 5 pages/164 terminal fields; offline Source reference; visual inspection |
| 018 Files | API limits/forged signed document; service checksum/MIME/parent/storage guards/Memo; browser staged previews |
| 019 Notification/refresh | same-TX outbox; committed empty NOTIFY / rollback no hint; browser cross-user update/offline/dirty preservation |
| 020 List/pipeline | source-policy workflow status; scoped server filter/count/page; browser 1000 rows; 4-query measurement |

Source functions และ file/line provenance เก็บใน [03](03-business-logic-catalog.md) และ fixtures ไม่แทนค่าคาดหวังด้วย implementation ใหม่ทุกกรณี

## Decisions และผลต่อพฤติกรรม

Owner answers ใช้แล้ว: DQ01 ลงนามเฉพาะงานที่รับมอบหมายและอ่านอย่างเดียวส่วนอื่น; DQ02 Decimal 2dp; DQ03 NT ใช้จำนวนสายที่กรอก (ไม่กรอก fallback 1); DQ07 เครื่องมือ/fixture เท่านั้น; DQ09 อนุญาต Core Admin toggle โดยคงดีไซน์ ไม่ขออนุมัติซ้ำ

| Decision | สถานะ / ผล |
|---|---|
| D-01 Server transition | ใช้ตาม master และข้อ 5 ของแผนที่ให้ server ตัดสิน; รับก่อนส่ง/next graph/non-NT bypass ไม่คัด arbitrary client writes ไม่มีคำตอบ human แยกรายข้อ |
| D-02 Server document gate | ใช้ตาม master/แผน บังคับ gates ฝั่ง server ร่วมกับ UI ไม่มีคำตอบแยกรายข้อ |
| D-03 Server/RLS private visibility | ใช้ตาม master/แผน ไม่เปิด private URLs ให้ทุก logged-in user ไม่มีคำตอบแยกรายข้อ |
| D-04 Profiles self role update | ไม่พอร์ต ใช้ Core RBAC ตามข้อห้ามในแผน |
| D-05 Duplicated role→phase | ใช้ capability phase resources เดียวกับ scope functions; Source visibility goldens รักษาพฤติกรรม ไม่ใช่ decision เรื่อง float (float แก้ตาม DQ02) |
| D-06 Filename Memo | ยังไม่มีอนุมัติเปลี่ยนเป็น file_type-only จึงคง filename fallback/trim-vs-list truthy พร้อม METRIX-BUG evidence |
| D-07 Signature storage | private own-user server assets สำหรับ native workflow/fixture; owner retention/privacy approval ต้องก่อน production |
| D-08 Timezone | Bangkok deterministic tests และ Source ceil edge คงเดิม ไม่เปลี่ยน lateness <24h เงียบ ๆ |
| D-09 Client random IDs | server UUID+human RQ code/source crosswalk ตาม Core architecture; Source legacy ID เก็บในการนำเข้า |
| D-10 Optimistic concurrency | server version/idempotency/locks ตาม master/แผน ทดสอบ concurrent accept/sign/archive ไม่มีคำตอบแยกรายข้อ |

Source annual reviewing/approved เก่าไม่ทำเป็นขั้นใหม่ใน live UI Import ต้อง reviewed status mapping; final PDF required หมายเลข/notes optionalตาม UI Source delete กลายเป็น archive ตาม master ALL annual creation ป้องกัน partial global year; default signature fallback จำกัด owner เดียวกัน

## PDF และการรักษา Core

NT ใช้เทมเพลต/ฟอนต์ local ต้นทาง เติม field ทุกช่องตาม mapping/actual count แล้ว flatten ไม่มี AcroForm/annotations Source renderer reference รันเฉพาะ frozen ntFormFiller ใน offline blank browser (network bytes 0) ด้วยข้อมูลจำลองเดียวกัน ตรวจภาพ Source/Native หน้า 1/3/ลงนาม 4 แล้วปรับ center/font ต่อ widget จากนั้นตรวจ native ทุกหน้า 1–5 และ signed 4 Source rasterize ด้วย canvas ส่วน native flattened vector จึงไม่กล่าว pixel identical Print/long-field acceptance ยังให้เจ้าของ UAT Summary คง 4 sections/project-location/design-install/footer และตรวจ 2 หน้า fixture

นอกโมดูลที่แตะ: registry/access/dashboard-server/module-lifecycle สำหรับ catalog/live enabled; Core Admin page/actions/component และ layout visibility predicate เพิ่ม core.module.manage ตาม DQ09; API/new routes; migrations/permission seed; package/lock pinned pdf-lib/fontkit/pdfjs; local worker/fonts; .env.example; scripts/tests/docs ไม่เปลี่ยน Core tokens/global CSS/fonts/sidebar/topbar/shared layout design Template และ private files ไม่อยู่ public asset path

Baseline comparison ใช้ commit 5f32a111 พร้อม cookie session fixtureเดียวกันข้าม ports ไม่แก้ Source app และไม่อ้างว่า production UI ทุกสภาพเหมือนเดิม

## สิ่งที่เจ้าของตรวจต่อก่อนเปิดจริง

1. UAT full NT/non-NT/annual/cancel/signature/Thai PDF printing และ scope visibility ด้วยผู้รับผิดชอบจริง บันทึกผลก่อนเปลี่ยน lifecycle active
2. review real user/role/team/service-center coordinator mappings; admin grant scopes ไม่ auto grant platform_admin ผู้ใช้ Source
3. review backup/migrations 0029–0052/private storage/constrained login แยก migration operator; approve apply เมื่อพร้อม ไม่มี production apply ในงานนี้
4. ยืนยัน template/font usage rights, signature retention/access/export และ cutover/parallel-run policy หากต้องใช้จริง
5. หากจะย้ายข้อมูลจริง ต้องสั่งงานเพิ่มเติมพร้อม reviewed crosswalk/file inventory/reconciliation และ backup rehearsal เครื่องมือปัจจุบัน dry run เท่านั้น

Rollback ใช้ปิดโมดูล/ถอน grants โดยเก็บประวัติและ audit ไม่ลบข้อมูล ไม่ใช้ transactional DDL fixture เป็น production rollback recipe

ยังไม่ได้ตรวจ: source deployed drift/production data/จริงทุก role combination/actual zoomทุกหน้า/load 100 concurrent users/production filesystem or network behavior/human UAT องค์ประกอบ Source ที่เป็น MOD2/static placeholders อยู่นอกขอบเขต ไม่ประกาศ migrated หรือ production-ready

## JEV และหลักฐาน

JEV ใช้ sanitized metadata เท่านั้น เป็น advisory ไม่เป็น proof หรือ production authorization รายงานนี้ยึด Source/compiler/tests/PostgreSQL/browser/render เป็นหลัก Risk wrapper ที่เคย hard-gate local migration summary ไม่ใช่ human approval rejection และไม่ได้ใช้เพื่ออนุญาต production Final evidence assessment แยกจาก deterministic gates ไม่มี .env/credential/customer data/source bodies ส่งไป

Final JEV evidence-check: supported 0.75 / needs_more_evidence 0.87 / gather_more_evidence (advisory only) ผล advisory ไม่แจกแจงว่าขาดหลักฐานใด รายงานจึงยังแยก owner UAT และ environment จริงที่ไม่ได้ตรวจไว้อย่างชัดเจน ไม่ทำ production ต่อเพื่อปิดคะแนน JEV ส่วน local assertions ยืนยันด้วย deterministic results ข้างต้น

Final source attestation: git status ของ original METRIX Request และ frozen discovery copy ว่าง ตรวจ 14/10/2569 Protected Core tokens/global CSS/fonts/sidebar/topbar ไม่เปลี่ยน มีเฉพาะ layout Admin visibility predicate ตาม DQ09 การวัดล่าสุด 14 list calls × 4 SQL และ latency 1.99–2.26 sec ใน fixture

Implementation commits แยกส่วน: fb7c109 service/schema, c3eb481 request workflow/PDF, 35bd03e signature editor, 8efb721 annual/cancel/SLA, 3f75fa3 offline import, 88402e5 reproducible QA ไม่มี push/deploy
