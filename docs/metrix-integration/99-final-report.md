# รายงานความคืบหน้า — METRIX / เช่าท่อร้อยสาย

ตรวจล่าสุด 13/10/2569: งานทั้งแผนยังไม่เสร็จ โมดูลยัง development/default-disabled ไม่มี migration ฐานหลัก/production ไม่แก้ source Kobpatme/METRIX@f87220bf94b765e4896388632c3dbeabb5286510 target เริ่ม5f32a111บน branch codex/metrix-duct-rental-foundation

## Milestones

| งาน | ส่งมอบ/พิสูจน์แล้ว | ยังต้องทำ |
|---|---|---|
| M0 | เอกสาร01–09/ADR/20RULE/source index102files/403controls24screens | source deployed drift/browser/legacy HTMLยังไม่ยืนยัน |
| M1 | manifest/capabilities40/Core guard/Admin catalog; CoreเปิดปิดตามDQ09/version/audit | Admin browser/grants/UAT |
| M2 | 9business tables/FORCE RLS/immutable/version/transition guards/runtimeNOBYPASSRLS/private storage | complete source-field/import mapping/production provisioning |
| M3 | original pure-rule105 + original Zod19 + finance/PDF decision6fixtures/Decimal/canonicalworkflow | ยังไม่ครบgolden3casesทุกoperationทุกRULE |
| M4 | server API/Core session/scope/Zod/idempotency/concurrency/audit/activity/outbox; annual/cancel/signing/files | browser/allAPInegative paths/export audit/query measurement |
| M5–6 | serverNT/summary/privateassets/assignedsigning/revoke/version/Core notification/PDF render | native UI/signature editor/live refresh/source visual acceptance |
| M7 | เจ้าของยืนยันเครื่องมือและfixtureเท่านั้น | importer dry run/crosswalk/reconciliation/fixtures |
| M8 | full gates/PostgreSQL fixture tests | e2e/axe/performance/screenshots login/home/2modules/UAT |

## หลักฐานล่าสุด

- npm run lint/typecheck/test/test:documents/build ผ่าน: unit439ผ่าน55opt-inข้าม (74ผ่าน/5ข้ามใน79files), document1; Next16.3.8 production buildผ่าน
- scripts/duct-rental-catalog-test.mjs: migrationsถึง0043/replay/idempotency/no automatic platform_admin duct grants/preservedworkgrants/rollback ผ่านเฉพาะ loopback permission_next_duct_rental_test
- scripts/duct-rental-service-test.mjs: 14ผ่าน ใช้ PostgreSQLจริง SET LOCAL ROLE duct_rental_runtime; ไม่mockRLS/audit; syntheticusers/roles/hashใช้fixtureเท่านั้น
- ทดสอบOWN/TEAM/SELECTED_TEAMS/livegrant/accountrevocation/concurrentaccept/version/immutableowner/deniedskip/partialdraftvalidation/DESIGNdirectsubmit/non-NTและNTครบphases/Decimalrates&price-redaction/globalannualyear&review&contractmetadata/atomiccancellation/auditfailure rollback/moduleswitch/memoupload/phasevisibility/assigned-onlysigning/revoke/regeneration/ownassets/defaultfallback
- API6tests: anonymous/disabled/password-change/cross-origin/UUIDidempotency/streamlimit/forgedactor/invalidJSON; ใช้Coreidentityเท่านั้น
- PDF6testsผ่าน source template5pages/164terminalfields/195namednodes/mappingsครบ/flattenไม่มีAcroForm/Annots; renderตรวจThai/จำนวนสาย3/ลายเซ็นจำลอง/ชื่อ/วันที่หน้า4 ยังไม่ทำsource screenshotpixelcomparison
- goldenrunnerตรวจSHAและhashเทียบgitblobก่อนAST/VM; validationrunnerใช้sourceZod4.3.6จริง ไม่รันsourceauth/network/storewrites

55testsที่ npm testข้ามไม่ถือว่าผ่าน แยก14duct integrationที่รันผ่านจริง ไม่ได้พิสูจน์production load/sessionbrowser/realfilemigration

## RULE → test

| RULE | หลักฐาน | ยังขาด |
|---|---|---|
| 001–002 | service create/partialdraft/submit/accept/version/idempotency/negative + originalZod19 | UI/coordinatorlookup |
| 003 | originalcablelookup24+invalid | browserselects |
| 004 | memo/note/listwhitespacegolden + COMPLETEgate | UIclear/marker |
| 005–006 | originalvisibility42 + capability-derivedtouched-phaseRLS/privatefiles | roleunion/remainingfiletypes/browser |
| 007 | branchgolden + NT/non-NTfullDBflow/deniedskip/stale | fullactionpositive/negative matrix |
| 008–009 | independentmanualrates/ROUND_HALF_UP2dp/guaranteeredaction/docgates | drafts/autosave/UIedges |
| 010–011 | active snapshot/globalyear/ALLscope/noenddatefilter/keep-onlyexacttotal | historicyear importreconciliation |
| 012–014 | owner/status/SLA/dategoldens/annual&canceltransactions | tracking/filter/urgentUI |
| 015–016 | assignedcurrentoriginal/revoke/regenerate/Core notifications/privatePNG/default | draw/upload/editor/nudge/rotation/scale/acknowledge |
| 017 | original23maps + approvedactualcount + renderedPDF | source summarylayout/printacceptance |
| 018 | checksum/MIME/size/privateauthorizedread/memoclear/ambiguouscommitprobe | uploadpreview/MIMEedges/retention |
| 019–020 | Core tasknotifications/scopedlistfilters/counts/pagination | refresh/draftpreservation/offline/querytimings |

## Owner decisions / security adaptations

DQ01 assigned-onlysigning/readonlyelsewhere; DQ02 decimal2dp; DQ03 countตามคำขอ/omittedfallback1; DQ07 tools&fixturesไม่มีrealmigration; DQ09 Coretoggleโดยคงdesign ไม่ต้องถามซ้ำ
CanonicalgraphตามsourceUIและmasterserverworkflow: DESIGNส่งตรงได้/phaseถัดไปรับก่อนส่ง/non-NTbypass; annualcreationต้องALLเพื่อไม่สร้างpartialsnapshotที่uniqueทั่วระบบต่อปี; defaultsignaturefallbackจำกัดownerเดียวกันแก้crossownerbugตามprivateassets

## Shared diff / design

นอกโมดูล: registry/access/module-lifecycle/dashboard-serverเพื่อregister/liveflag/Corecapability; Adminpage/actions/componentใช้existingclasses; platformlayoutเพิ่มcore.module.manageในAdminvisibilitypredicateเท่านั้น; newmodule/APIroutes; package/lockpinnedlocalPDFdependencies; migrations0029–0043; envexample/scripts/fixtures/docs ไม่มีtokens/globalCSS/Corefonts/sidebar/topbar/theme/sharedcomponentimplementationเปลี่ยน ยังไม่มีbefore-afterscreenshotslogin/home/2modulesจึงไม่อ้างvisualregressionผ่าน next-env.d.tsที่buildสร้างคืนก่อนcommit

## Environment / handoff

ไม่applymain/production ไม่grantผู้ใช้จริง ไม่เชื่อมMETRIXSupabase/storage ไม่export/importrealdata ไม่deploy โมดูลปิดระหว่างพัฒนา
Operatorต้องสร้างconstrainedloginสมาชิกduct_rental_runtimeแยกmigrationlogin/privateStorage/migrationsที่อนุมัติ แล้วAdminจัดrealroles/scopes/teamsและUAT sourceowners ต้องยืนยันtemplate rights/signatureretention/cutoverpolicy rollbackปิดโมดูล/ถอนgrantsโดยเก็บข้อมูล/auditไม่hard-delete

## JEV advisory

ใช้health/routing/risk/evidence sanitizedmetadataเท่านั้น ไม่มีsourcebodies/env/credentials/customerdata JEVไม่อนุมัติproduction evidence-checkก่อนUI supported0.67/needs_more_evidence0.85/gather_more_evidence สอดคล้องbrowser/visual/load/remaining-rule gaps ใช้compiler/tests/DBจริงเป็นหลักฐาน ไม่อ้างsourceparityครบ