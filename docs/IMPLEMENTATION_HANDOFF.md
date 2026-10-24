# IMPLEMENTATION HANDOFF — Figma-aligned system overhaul

## สถานะ / source of truth / ownership
**PROPOSED / PLAN ONLY — คำขอครั้งนี้อนุญาตวางแผน ไม่ใช่เริ่ม implementation ใหม่.** Joy รับผิดชอบตาม scope นี้เอง ไม่มี Workers/ระบบ AI ใหม่; MaxWell อนุมัติทิศทางภาพและ UAT. ข้อเสนอด้านภาพใน DESIGN.md และ behavioral criteria ใน UXUI_SPEC.md ใช้ร่วมกับแผนนี้. หัวข้อ Historical handoff ด้านล่างเก็บงานเดิมไว้ ไม่ให้อ่าน approvals/tests เก่าว่าเป็นอนุมัติรอบใหม่.

Baseline จาก source ณรอบวางแผน: HEAD `33bd9370e3d5f76ea91fa7e0ba1a7480a058d887`, branch main, working tree มีงานเดิมค้าง. ต้อง refresh อีกครั้งก่อน implementation. ผล 6,181unit/59browser/build จากรอบก่อนเป็น historical local checks ไม่ใช่ Figma visual acceptance.

## Scope และผลส่งมอบ
- ปรับ presentation ทั้ง Core + Work/KPI + Buildings + Guarantees + Duct/Cable + Car Booking + Admin รวม login/change-password/error/no-access และ overlays/print ที่เกี่ยวข้อง
- ส่งมอบ design reference ที่เลือก, pilot บนระบบเดิม, shared components/CSS ownership ที่ใช้จริง, migrated route/view/state ledger, authenticated test evidence, owner visual/UAT acceptance และ rollback instructions ในเอกสารเดิม
- ไม่สร้างโครงการ/ฐานข้อมูล production ใหม่, ไม่ rewrite backend, ไม่เพิ่มฟีเจอร์ที่ API ไม่รองรับ, ไม่เปลี่ยน auth/RBAC/RLS/audit/migrations/สูตรธุรกิจ, ไม่เพิ่มผู้ใช้หรือ grants จริง
- โครง theme รองรับ light/dark; เสนอ blue #244fb8 เป็น accent เริ่มต้น. หลาย accent/ตัวเลือกผู้ใช้ใหม่เป็น optional ไม่รวม default scope
- ห้าม commit/stash/reset/push/deploy หรือ restart แอปที่เจ้าของกำลังตรวจโดยอัตโนมัติ; local restart ต้องประสานเวลาเมื่อจำเป็น

## การตัดสินใจและสิทธิ์ที่ต้องชัดก่อนเริ่ม
1. อนุมัติเปลี่ยนเป้าหมายจาก dark-shell-always เป็น reference-aligned light/dark ทั้งระบบ; ยืนยัน blue default หรือเลือก variant จาก Figma
2. อนุมัติ implementation เป็น batch ตามแผน ไม่อ้างอนุมัติ6เฟสเดิมแทน. ขออนุมัติขอบเขตครั้งเดียว ไม่ถามทุกไฟล์ แต่ **visual pilot sign-off และ final UAT ยังคงเป็นจุดตรวจคุณภาพของเจ้าของ**
3. ทดสอบใน local isolated source/runtime ไม่แย่ง .next/port3000 ของแอปเดิม; port ที่ใช้ต้องตรวจว่างจริง ไม่ hard-code ว่าว่าง
4. ต้องได้รับสิทธิ์ตั้ง test database/seed/synthetic accounts แยกก่อน authenticated tests; migration ที่รันเพื่อจัด environment ต้องจำกัดฐานทดสอบและแยกจากการแก้ schema. ถ้าไม่ได้สิทธิ์ ให้รายงาน E2E blocked ไม่เปลี่ยนเป็น fixture แล้วปิด gate
5. ไม่ต้องขอ credential ใน chat; เจ้าของเข้าใช้หรือกรอกผ่าน masked/approved credential flow. ข้อมูลบริษัท/ภาพที่มีข้อมูลจริงห้ามส่ง provider เสริม; fixture ใช้ข้อมูลสมมติ
6. Independent review ใช้คนที่เจ้าของเลือกได้. ถ้ายังคงห้าม Workers และไม่มี reviewer ให้คง gate ไม่ยืนยัน ไม่สร้าง reviewer เอง. Production release แยกอนุมัติเสมอ

## Phase 0 — Freeze baseline / full screen inventory / safety
งาน: บันทึก HEADและuser changes; เตรียมย้อนเฉพาะงานใหม่โดยไม่ reset เดิม; แตก37route templatesเป็น views/tabs/dialogs/states/role variants จากโค้ดและ runtime ที่เข้าถึงได้; map component/CSS consumers และ duplicate selectors; บันทึก baselineภาพ/primary click paths/technical checks/performance ใน scopeที่อนุญาต. ตรวจสถานะ map/NAS/OSP/integrations แยกจาก UX bugs.
ผล: route ledger ที่ไม่มีช่องหาย, screenshot/state baseline, source/CSS ownership map, test-environment readiness และรายการ unresolved dependencies.
Gate: สถานะ existing defect/ข้อจำกัด/ไม่ได้ทดสอบแยกชัด; environmentไม่แตะข้อมูลจริงและย้อนกลับได้. ถ้า inventoryยังไม่ครบ ห้ามตั้ง deadlineหรือประกาศ all-system coverage.

## Phase 1 — Reference lock / UX mapping / measurable target
งาน: ระบุ frame IDs/variants และ capture reference ที่จำเป็น; แยกสิ่งที่เห็นจริงจากสิ่งต้องขอ export; ตรวจlicenseก่อนใช้asset; lock light/dark/blue, navigation modes, density, type/spacing/tokens และหน้าตา4patterns: list, form, detail/drawer, dashboard. UXที่ referenceไม่มี เช่นmap/calendar/approval/signing ออกแบบต่อยอดโดยรักษางานจริงและแจ้งว่าไม่ใช่ต้นฉบับ.
ผล: DESIGN/UXUI_SPEC อัปเดตค่าที่วัดได้ พร้อมรายการ accepted deviations; ขอบเขต pilotชัดเจน.
Gate: เจ้าของยอมรับเป้าหมายที่จะเทียบ; exact valuesที่เข้าไม่ได้ไม่ถูกอ้างเป็นข้อเท็จจริง. สิทธิ์assetไม่พร้อมไม่ block การ implementหน้าตาด้วยโค้ดตัวเอง.

## Phase 2 — Visual pilot บนหน้าจริง (ห้ามข้าม)
Default pilot: shell + `/work/mine` เป็นหน้ารายการที่เปรียบเทียบตารางได้ชัด; เพิ่ม `/work/new` และ detail/dialog เดิมที่เปิดจากงานเพื่อพิสูจน์ form/overlay. ใช้ existing components/API/contracts บนสำเนาlocal ไม่สร้าง demo appแยกแล้วอ้างว่าintegrateแล้ว. เริ่มจาก shared primitivesขั้นต่ำที่ pilotต้องใช้ ไม่สร้างframeworkใหญ่ล่วงหน้า.
ผล: หน้าจริงlight/darkที่375/768/1024/1440/1920และreflow320 พร้อมside-by-side/overlay referenceที่เทียบขนาดเดียวกัน, Thai/extreme data, statesหลักและkeyboard flows.
Gate: **MaxWell visual sign-off**; ตารางปุ่มspacingไม่ใกล้เป้าหมายให้แก้pilotก่อน ไม่rolloutทั้งระบบ. Functional/test passอย่างเดียวไม่ผ่านgateนี้. ถ้าmain backendข้อมูลไม่พร้อมให้ใช้synthetic isolated environmentและระบุcoverage ไม่อ้างว่าmockคือE2E.

## Phase 3 — Stabilize shared foundation / retire competing CSS
หลังpilotผ่าน จัดtoken layer, base globals, shell, shared controls/table/filterbar/selection/pagination/form/dialog/toast/empty/error/skeleton ให้มีเจ้าของเดียว. ใช้ของเดิมที่เหมาะสม เปลี่ยนpublic propsต้องมีcompatibility tests. ย้ายconsumerพร้อมกฎเก่าในbatchเดียว;เก็บเฉพาะdomain stylesที่จำเป็น. ไม่เพิ่ม theme overrideหรือrewrite globalsทั้งไฟล์โดยไม่รู้consumers.
ผล: primitivesที่ใช้จริงจากpilot, component states/galleryหรือfixturesในtest harnessเดิม, CSS consumer checklist และdiffที่แยกuser changesได้.
Gate: pilotภาพไม่ถอย;light/dark/keyboard/touchผ่าน;ไม่มีduplicate ownershipในส่วนที่ย้าย. Retire selectorsต้องพิสูจน์unused;ยังไม่ลบไฟล์legacyหรือข้อมูลสำคัญโดยพลการ.

## Phase 4 — Core / navigation / entry / recovery
ย้ายDashboard,AppShell,ModuleNav,global palette,notification/account/theme,login/change-password presentation,403/404/global/route errorsและloading. คงserver filtering/auth actions/session policyเดิม. Dashboardเป็นงานข้ามโมดูล ไม่สร้างตัวเลขลวงแทนข้อมูลไม่พร้อม.
ผล: ผู้ใช้เข้าสู่ระบบเดิม → นำทาง/ค้นหา/แจ้งเตือน/เปิดงาน/กลับบริบทได้;ทุกoverlayอยู่ในthemeเดียว; no-access/expired/errorไม่รั่วข้อมูล.
Gate: visual+behavior regressionทั้งprivileged/restricted accountsบนtestDBที่อนุญาต;startup/themeflash/layoutshiftเทียบbaseline. ไม่เปลี่ยนสิทธิ์เพื่อให้เมนูดูครบ.

## Phase 5 — Module migration ทีละ batch
Dependency: Phase2visualผ่าน + Phase3primitivesเสถียร + Phase4shellเชื่อมจริง. แต่ละbatchต้องinventory→ย้ายหน้า/consumer/styles→ทดสอบ→ภาพเทียบ→แก้regressionก่อนbatchถัดไป;ไม่แจกหลายคนแก้ไฟล์เดียวกันและไม่เรียกWorkers.
- **5A Work/KPI:** pilotเป็นฐานแล้วขยายoverview/team/assign/people/tracker/KPI/reports/activity/detail/new;คงtask actions,deadline/SLA/KPI/filters/exportsและdata scopes
- **5B Buildings:** map+list+detail/create/edit/location/conditions/fees/quotation/documentsตามviewsจริง;map/NAS fallbackไม่บล็อกงานรายการ;คงexact amounts/version/history
- **5C Guarantees:** queues/detail/new/TL/installation/refund/evidence/historyตามviewsจริง;คงworkflow gates/four-eyes/version/conflicts/financial semantics
- **5D Duct/Cable:** requests/new/edit/dynamic phase,renewal,cancellation,tracking,signing/PDF/settings,communication cable;คงdocument gates/realtime pause/idempotency/authority
- **5E Car Booking:** calendar/list/booking/return/cancel/log/reports/OSPและcar admin;ไม่ลดoverlap/permission checks;ยืนยันmobileการเลือกวันและรายละเอียด
- **5F Admin:** users/teams/positions/roles/matrix/access preview/audit/settingsตามtabsจริง;อ่านrisk/ผลกระทบได้,confirmเดิมครบ,readonlyและdeniedไม่หาย;car adminใช้patternเดียวกัน
ผลต่อbatch: route/view/state rowsที่มีหลักฐานจริง,ภาพlight/dark/desktop/mobile,permission/primary flow regression และknown gaps.
Gate: featureที่ขาดตั้งแต่ก่อนงานยังเป็นgapไม่ใช่featureที่งานนี้ทำเสร็จ;ห้ามแปลงทุก workflow เป็นตาราง CRM. ถ้าต้องแก้backend/policyให้แยกdecision ไม่แอบรวมในUXbatch.

## Phase 6 — System-wide acceptance / cleanup
ขยายregressionจากpilotเป็นทุกroute/view/critical stateในledger;authenticatedflowsบนฐานทดสอบจริงแยก;ตรวจvisualside-by-side/light/dark,axe/contrast,keyboard/zoom200%/Thai/textresize/screen-reader,targetsทั้งwidth+height,table/dialog/mobilekeyboard/print. ตรวจdependencies/themebleed/CSSdeadselectors/performanceใหม่จากbaseline. รันlint/typecheck/unit/document/build/Playwrightบนsourceสุดท้าย ไม่ใช้ผลรอบเก่า.
ผล: acceptance ledgerมีpass/fail/N-Aพร้อมเหตุผลและหลักฐาน;MaxWellลองระบบจริง,ผู้รีวิวอิสระตรวจdiffตามสิทธิ์.
Gate: visual approval + workflow/UAT + technical gates + ไม่มีblockingregression;skipped/unrun/fixture-onlyแยกชัด ไม่ประกาศWCAG/productionพร้อมจากaxeหรือbuildอย่างเดียว. หากindependentreviewหรือtestDBยังไม่อนุญาต gateยังopen.

## Phase 7 — Handoff / controlled release
บันทึกไฟล์/versions/known limits/วิธีรัน/rollbackในเอกสารเดิม. Restore/rebuildเฉพาะpresentation snapshotโดยไม่ย้อนข้อมูล;ไม่ใช้git resetหรือrestoreทั้งไฟล์ที่มีuserchanges. ซ้อมrollbackในlocalcopyก่อนส่งมอบ. Commit/merge/push/deployต้องได้รับอนุมัติแยก;releaseจริงต้องbackup/recovery/monitoringที่เหมาะสมกับenvironmentและมีเจ้าของอนุมัติ ไม่ถือว่าขอแผนคืออนุมัติปล่อยระบบ.

## Dependency order / estimation / stop conditions
ลำดับหลัก:0→1→2(owner visual gate)→3→4→5A..5F→6(UAT/review)→7(release approval).
ยังไม่เสนอวันจบแบบรับปากจาก37route names:หลัง0–2ให้ประเมินจากจำนวนviewsจริง,reuse coverage,pilot cycle timeและtestenv แล้วใส่ช่วงประมาณของแต่ละbatchพร้อมสมมติฐาน. ถ้าขอบเขตเพิ่มให้บอกผลต่อแผน ไม่ลดQAเพื่อให้ทันกำหนด.
หยุดเฉพาะเรื่องที่ต้องตัดสินใจ:reference/visualไม่ผ่าน,policyขัดกัน,assetสิทธิ์ไม่พอสำหรับการcopy,testDB/credentialsไม่พร้อม,จำเป็นต้องแก้protectedbackend,externalmutationหรือproductionrelease. ทำงานอิสระที่ได้รับอนุมัติต่อได้ แต่ห้ามปิดgateที่blocked.

## Coverage ledger — route templates จาก filesystem (PENDING ทุกแถว)
เก็บต่อroute:variants/states/roles,component owner,reference/adaptation,baseline,visual,behavior,technical,a11y,E2E,UAT,rollback. ช่องuncheckedด้านล่างไม่ใช่คะแนนความเสร็จ;ก่อนปิดแต่ละbatchต้องแตกchildviewsให้ครบ.

- [ ] `/admin/car-booking` — `src/app/(platform)/admin/car-booking/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/admin` — `src/app/(platform)/admin/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/buildings/[id]/edit` — `src/app/(platform)/buildings/[id]/edit/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/buildings/[id]` — `src/app/(platform)/buildings/[id]/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/buildings/map` — `src/app/(platform)/buildings/map/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/buildings/new` — `src/app/(platform)/buildings/new/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/buildings` — `src/app/(platform)/buildings/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/car-booking` — `src/app/(platform)/car-booking/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/duct-rental/[id]/[view]` — `src/app/(platform)/duct-rental/[id]/[view]/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/duct-rental/[id]/edit` — `src/app/(platform)/duct-rental/[id]/edit/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/duct-rental/[id]` — `src/app/(platform)/duct-rental/[id]/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/duct-rental/cancellation/[id]` — `src/app/(platform)/duct-rental/cancellation/[id]/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/duct-rental/cancellation/new` — `src/app/(platform)/duct-rental/cancellation/new/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/duct-rental/cancellation` — `src/app/(platform)/duct-rental/cancellation/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/duct-rental/communication-cable` — `src/app/(platform)/duct-rental/communication-cable/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/duct-rental/new` — `src/app/(platform)/duct-rental/new/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/duct-rental` — `src/app/(platform)/duct-rental/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/duct-rental/renewal/[id]` — `src/app/(platform)/duct-rental/renewal/[id]/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/duct-rental/renewal` — `src/app/(platform)/duct-rental/renewal/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/duct-rental/settings` — `src/app/(platform)/duct-rental/settings/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/duct-rental/tasks` — `src/app/(platform)/duct-rental/tasks/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/duct-rental/tracking` — `src/app/(platform)/duct-rental/tracking/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/guarantees/[id]` — `src/app/(platform)/guarantees/[id]/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/guarantees/new` — `src/app/(platform)/guarantees/new/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/guarantees` — `src/app/(platform)/guarantees/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/` — `src/app/(platform)/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/work/assign` — `src/app/(platform)/work/assign/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/work/kpi` — `src/app/(platform)/work/kpi/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/work/mine` — `src/app/(platform)/work/mine/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/work/new` — `src/app/(platform)/work/new/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/work` — `src/app/(platform)/work/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/work/people` — `src/app/(platform)/work/people/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/work/reports` — `src/app/(platform)/work/reports/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/work/team` — `src/app/(platform)/work/team/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/work/tracker` — `src/app/(platform)/work/tracker/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/change-password` — `src/app/change-password/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING
- [ ] `/login` — `src/app/login/page.tsx` — audit/visual/behavior/E2E/UAT: PENDING

### Additional surfaces / view expansion ที่ต้องทำใน Phase0
- [ ] Work query/activity/detail และdialogsจากrouteเดิมทั้งหมด
- [ ] Buildings tabs/map/location/quotation/document viewers และcreate/editstates
- [ ] Guarantees queryviews/TL/installation/refund/financial panels/confirmations
- [ ] Duct dynamic[view]ทุกค่าที่รองรับจริง,communication cable stages,PDF/signature/renewal/cancel subviews
- [ ] Car calendar/list/reports/OSP/settings/booking/return/log/cancel dialogs
- [ ] Adminทุกtabs/permissionmatrix/accesspreview/auditและcar admin
- [ ] Global palette/notifications/account/theme/sidebarrail/mobile drawer
- [ ] loading/error/not-found/global-error/access-denied/maintenance/session recoveryที่มีจริง;ไม่เพิ่มAPIbehaviorเพื่อแสดงstate
- [ ] print/download/generated-document presentationที่เกี่ยวข้อง;PDF legal templatesเปลี่ยนต้องแยกอนุมัติ
- [ ] legacy routes/production404/browsercompatibilityเป็นregression-only ไม่redesignหรือเปิดlegacyที่ปิดแล้ว

---
# Historical handoff — previous Operational Command implementation


## Target agent and capability rationale
งานนี้เป็นงานออกแบบและกำหนดข้อกำหนด UX/UI เป็นหลัก การลงมือแก้ไขโค้ดจริงควรดำเนินโดย:
- Human implementer (ทีมพัฒนาของผู้ใช้) หรือ Hermes-native coding worker ที่ได้รับอนุญาตเท่านั้น
- **ไม่ได้กำหนดโมเดลหรือ provider เฉพาะ** ในขั้นนี้
- **ไม่มีการเปิด Worker Dispatch** ในขั้นนี้ (ตามคำขอของผู้ใช้)
- Mina ยังคงรับผิดชอบการประสานงานและติดตามจนถึงสถานะสุดท้ายที่ยืนยันได้

## Intended user outcome
ผู้ใช้สามารถนำทาง ใช้งานฟีเจอร์หลัก และรับข้อตอบสนองจากระบบได้อย่างราบรื่น บนอุปกรณ์ทุกขนาด โดยมีความสวยงามระดับมืออาชีพและเข้าถึงได้ตาม WCAG 2.2 AA ระบบเป็น Product เดียวจริง ไม่รู้สึกว่าเป็นหลาย web apps ฝังอยู่ใน sidebar เดียว

## Inputs and provenance
- `docs/DESIGN.md` — โครงสร้างโทนสี (#244fb8 เป็น primary), ฟอนต์, ระยะห่าง, คอมโพเนนต์, responsive, interaction states
- `docs/UXUI_SPEC.md` — User tasks, primary flow, information hierarchy, accessibility, acceptance checks
- เอกสารอ้างอิงภายนอกที่ตรวจสอบแล้ว: DesignMD (Command Center, AdminForge, HRFlow), Figma Community (หน้าแรก ui-kits/dashboard)
- ฐานเดิมของโปรเจกต์: `src/styles/tokens.css` (สีแบรนด์ปัจจุบัน #1D4ED8 ต้องปรับเป็น #244fb8 ตามคำสั่งผู้ใช้), `src/app/fonts.ts` + `src/app/fonts/` (bundled fonts, OFL license), `src/components/ui/` (คอมโพเนนต์ที่มีอยู่แล้ว), `docs/product/design-system.md` (design system ปัจจุบัน), `AGENTS.md`, `UX-UI-LIVELY-UPGRADE.md`

## Work items and ownership
งานแบ่งเป็น 6 เฟส เพื่อขออนุมัติเป็น Batch ก่อนแก้ไขโค้ดจริง แต่ละเฟสมีงานย่อยและไฟล์ที่เกี่ยวข้องในโปรเจกต์ `D:/WebApp/SuperApp PERMISSION_NEXT/`:

| เฟส | งานหลัก | ไฟล์ที่เกี่ยวข้อง (ในโปรเจกต์จริง) | เกณฑ์ยอมรับสั้น |
|---|---|---|---|
| Phase 1 | Design Tokens & Brand Color | `src/styles/tokens.css`, `src/app/globals.css` | สี #244fb8 ใช้สม่ำเสมอทั่วระบบ ไม่มีสีแบรนด์สองค่าปะปน |
| Phase 2 | คอมโพเนนต์พื้นฐาน | `src/components/ui/*` (animated-number, empty-state, error-state, page-header, page-skeleton, status-badge, truncated-text) | มี states ครบ (default, hover, focus, active, disabled) สถานะมีสี + ข้อความ |
| Phase 3 | หน้าหลักและ Layout | `src/app/(platform)/layout.tsx`, `src/app/(platform)/page.tsx`, `src/features/work/*`, `src/features/buildings/*`, `src/modules/duct-rental/*` | Direction A ชัดเจน (dark shell + light workspace) Responsive ผ่านที่ 375/768/1024/1440px |
| Phase 4 | ฟอร์มและสถานะระบบ | `src/components/ui/*`, `src/lib/copy.ts` (ถ้ามี) + คอมโพเนนต์ UI ที่มีข้อความระบบ | ไม่มี error ดิบรั่วสู่ผู้ใช้ ข้อความเป็นภาษาไทยเป็นกันเอง มี loading/empty/error/success ครบ |
| Phase 5 | Accessibility & Responsive | ทุกคอมโพเนนต์ + หน้าจอหลัก | WCAG 2.2 AA, touch target 44px, ไม่มี horizontal scroll บน core flow, Thai text ไม่ถูกตัด |
| Phase 6 | QA และส่งมอบ | เอกสารสรุป, ผลทดสอบ (lint, typecheck, vitest, build, playwright) | QA_REVIEW เสร็จสมบูรณ์ อนุมัติให้ merge/push/deploy แยกต่างหาก |

แต่ละงานมอบหมายให้ผู้รับผิดชอบหนึ่งราย ไม่แก้ไขไฟล์เดียวกันพร้อมกันหลายราย

## Allowed scope + rollback
- อนุญาตแก้ไข: ไฟล์สไตล์ (`src/styles/*`), คอมโพเนนต์ UI (`src/components/ui/*`), หน้าเว็บใน `src/app/(platform)/*`, ฟีเจอร์ (`src/features/*`), モดูล (`src/modules/*`), ไฟล์ข้อความระบบ (เช่น `src/lib/copy.ts`)
- ห้ามแก้ไข: ข้อมูลบริษัท การตั้งค่าระบบ production credentials โค้ดส่วน auth/RBAC/RLS/audit/migration ไฟล์ส่วนที่ไม่เกี่ยวกับ UX/UI โดยไม่จำเป็น
- Rollback: ต้องมี git diff ที่ย้อนกลับได้ ก่อน push หรือ deploy ต้องขออนุมัติแยก (ไม่รวมในสิทธิ์นี้)

## Quality gates
- User flows ผ่านการทดสอบจริง (primary workflow ตาม UXUI_SPEC.md)
- Responsive: 375 / 768 / 1024 / 1440px ไม่มีฟังก์ชันหาย ไม่มี horizontal scroll บน core flow
- Accessibility: focus visible (3px), contrast 4.5:1 (ตรวจด้วยเครื่องมือจริง เช่น @axe-core/playwright), keyboard-operable, aria-live
- Error/empty/loading states ครบถ้วนตาม UXUI_SPEC.md
- ทดสอบและ code review ก่อนรวมเข้าสาขาหลัก (`lint`, `typecheck`, `vitest`, `build`, `playwright test` ผ่าน)

## Approval status
**APPROVED FOR LOCAL IMPLEMENTATION** — MaxWell อนุมัติ Phase 1 และ Phase 2–6 ใน Discord วันที่ 23 ต.ค. 2569; Joy รับช่วงจาก Mina โดยไม่เรียก Workers. ไม่รวม commit/push/deploy หรือการเปลี่ยนฐานข้อมูล. ผลการตรวจ local และ release gates ที่ยังไม่ยืนยันอยู่ท้ายเอกสาร

## Evidence and handback to MINA
เมื่อได้รับอนุมัติและดำเนินการแล้ว ผู้รับผิดชอบควรส่งคืนให้ Mina:
- ไฟล์ที่แก้ไขทั้งหมด (path และการเปลี่ยนแปลง)
- ผลการทดสอบ (lint, typecheck, vitest, build, playwright)
- Screenshot ก่อนและหลังแก้ไข (หากผู้ใช้อนุญาต)
- ประเด็นที่ยังไม่แก้ไข / ข้อจำกัดที่พบ / ความเสี่ยงที่เหลือ

---

## Local implementation and QA checkpoint — 23 ต.ค. 2569

Owner: Joy รับช่วงจาก Mina ตามคำสั่ง MaxWell. Starting HEAD: `33bd9370e3d5f76ea91fa7e0ba1a7480a058d887`, branch `main`. ไม่มี branch/commit/push/deploy ใหม่ และไม่ restart แอปเดิม.

### งานที่ดำเนินการ
- Phase 1: คืน `--color-brand`, `--color-focus-ring`, `--color-info` ใน light mode เป็น #244fb8; dark brand #60A5FA คงเดิม. ไม่ reset `tokens.css` ทั้งไฟล์ เพราะมี user changes ค้างอยู่ก่อน
- Phase 2: ใช้ UI primitives เดิม; `TruncatedText` เพิ่ม Esc dismissal; shared primary/secondary actions มี disabled/active states ที่ชัดเจน; status ยังคงข้อความประกอบสี
- Phase 3: `--color-nav-*` และ scoped navigation semantics ใช้กับ rail/drawer จริงของ AppShell. คง sidebar260/80px ที่แก้มาก่อน, แก้ collapsed rail geometry/header offset และเอา slide-in ของ persistent rail ออก. Dashboard/Work/Buildings/Duct ใช้ shell ร่วมกัน ไม่เขียนหน้าหรือระบบ routing ใหม่
- Phase 4: เชื่อม `aria-describedby` จากช่องค่าธรรมเนียม/คำนวณไป error summary ในฟอร์มอาคาร. ยืนยัน validation → error → retry → success ด้วย real form + synthetic responses. ใช้ copy/loading/empty/error primitives เดิม ไม่เพิ่มข้อความหรือระบบ copy ซ้ำ
- Phase 5: named account disclosure แทน ARIA menu ที่ไม่ครบ, Esc/blur dismissal และ focus return; scroll-padding สำหรับ sticky header; touch-height44px บนจอเล็ก; PageHeader actions wrap แต่ไม่ตัดปุ่มหลายบรรทัด. Matrix ตรวจใน browser และภาพ desktop/mobile ตรวจด้วยตา
- Phase 6: local automated gates และ self-review ผ่านตามรายการด้านล่าง. **QA_REVIEW ระดับ release ยังไม่ปิด** เพราะห้าม Workers/DB mutation; ไม่มี independent reviewer หรือ authenticated UAT ครบทุกหน้า

### ไฟล์ที่ Joy แก้ในซอร์ซ
- `src/styles/tokens.css` — 3 brand tokens จาก Phase1 และ navigation/header tokens
- `src/styles/shell.css` — scoped dark navigation, geometry, responsive targets/focus
- `src/styles/components.css` — ไม่ animate width; PageHeader actions wrapping
- `src/styles/ui.css` — disabled/active states, long status/error wrapping
- `src/components/app-shell.tsx` — persistent rail ไม่ slide เข้ามาตัดเมนู
- `src/components/account-control.tsx` — disclosure semantics/Esc/blur/focus
- `src/components/ui/truncated-text.tsx` — Esc tooltip dismissal
- `src/features/buildings/building-editor-form.tsx` — error association เท่านั้น ไม่แก้ schema/สูตร/การบันทึก
- `e2e/operational-command.spec.ts` — browser regression ใหม่ ใช้ components/styles/fonts จริง; router/actions/API เป็น fixture, actions ฝั่ง server ถูกปิด ไม่เชื่อม DB
- อัปเดตเอกสารเดิมเท่านั้น: DESIGN, UXUI_SPEC, IMPLEMENTATION_HANDOFF, product/design-system และ implementation-status

Pre-existing changes ที่รักษาไว้: `next-env.d.ts`, ความกว้างใน `shell.css`, light/dark palette ส่วนอื่นใน `tokens.css`, เอกสารใหม่ทั้ง3 และ `scripts/reset-admin-password.mjs` (ไม่รัน ไม่แก้). Git diff เมื่อเทียบ HEAD รวม user changes เหล่านี้ด้วย ไม่ใช่งาน Joy ทั้งหมด. Rollback ให้ย้อนเฉพาะ hunks ของงานรอบนี้ ห้าม reset working tree ทั้งชุด.

### คำสั่งและผลที่รันจริง
จาก root โครงการ ใช้ direct binaries เพื่อไม่ให้ npm lifecycle เขียน build-info ในแอปเดิม:
```bash
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/vitest/vitest.mjs run
node scripts/check-css-quality.mjs
node scripts/check-contrast.mjs
node scripts/check-ui-copy.mjs
node --test mods/permission-next/tests/document-mapping.test.js
```
ผล: lint/typecheck ผ่าน; Vitest6181passed/66skipped (82filespassed/5skipped); CSS327files/0violations; contrast58pairs/0failures; static copy0findings; document mapping1passed. Skipped tests ไม่ถือว่าผ่าน.

```bash
UX_EXTERNAL_SERVER=1 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='C:/Program Files/Google/Chrome/Application/chrome.exe' node node_modules/@playwright/test/cli.js test e2e/operational-command.spec.ts e2e/navigation-theme-focus.spec.ts e2e/permission-ux-motion.spec.ts --reporter=list --output='C:/Users/kobpat_m/AppData/Local/hermes/profiles/hermes-joy/cache/scratch/operational-command-final'
```
ผลสุดท้าย **59 passed**: 4 representative screens × 375/768/1024/1440 × light/dark ตรวจไม่มี body overflow และ axe WCAG A/AA tags ไม่พบ violations ใน fixture, mobile drawer Esc/focus return, palette keyboard/recovery, account/tooltip, real form validation/retry/success, collapsed80px, reflow320 และ visible control heights44px; reduced motion และ navigation suites เดิมผ่าน. Chrome path เป็น local environment override ไม่ hard-code ใน shared suite; CI ใช้ managed browser เดิม.

Production build ผ่าน: snapshot source ปัจจุบันและ physical copy ของ dependencies เดิมไป Hermes scratch `operational-command-build` ไม่คัดลอก `.env*`, `.data`, secrets หรือ reset-password script; environment child ถูกลดเหลือ OS variables และปิด telemetry. รัน `node scripts/write-build-info.mjs` แล้ว `node node_modules/next/dist/bin/next build` ในสำเนา — compiled/typecheck/static21pages ผ่าน, `BUILD_EXIT=0`. ครั้งแรกไม่ผ่านเพราะข้าม prebuild metadata; แก้ test harness ให้เรียก script เดิม ไม่แก้ production code เพื่อหลบ failure.

หลักฐาน screenshots/traces: `C:/Users/kobpat_m/AppData/Local/hermes/profiles/hermes-joy/cache/scratch/operational-command-final/`. ภาพเป็นข้อมูลสมมติเท่านั้น. Scratch เป็นหลักฐานชั่วคราว; ชุดทดสอบใน repository รันซ้ำได้.

### ข้อจำกัด/งานตรวจรับที่ยังเหลือ
- ยังไม่รัน authenticated end-to-end ที่เขียน session/DB หรือ fixture DB suites เพราะคำสั่งไม่ให้เปลี่ยนฐานข้อมูล; app เดิมไม่ได้ถูก restart/deploy จึงยังไม่อ้างว่าหน้ารันเดิมแสดงโค้ดล่าสุด
- Matrix ใช้หน้า representative ไม่ใช่ทุก route/state: ไม่รับรอง forms/financial workflows ทั้งหมด, data parity, production config, full WCAG2.2AA, screen-reader/manual zoom200% หรือ human UAT
- Touch test ตรวจความสูง controls ที่มองเห็นใน representative flows; ไม่ใช่การตรวจครบทุกลิงก์/checkbox ทั้งระบบ
- ไม่มี independent review เพราะเจ้าของห้ามเรียก Workers. ผลนี้คือ local implementation + deterministic checks + self-review ไม่ใช่ independent approval
- ไม่ใช้ advisory/provider เสริม: ไม่มี JEV/worker dispatch, ไม่ส่ง credentials/ข้อมูลจริงให้บริการอื่น. ใช้ local UI skill search และเครื่องมือ deterministic
- สิทธิ์ commit/merge/push/deploy และ DB mutation ยังคงต้องแยกอนุมัติ; ไม่ใช่ส่วนของ checkpoint นี้