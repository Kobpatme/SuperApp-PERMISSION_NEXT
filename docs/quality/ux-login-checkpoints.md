# รายงาน UX/login V1 — 2026-10-03

ภาพทั้งหมดใช้ข้อมูลสมมติบน PostgreSQL `permission_next_ux_test`; ไม่ใช่ข้อมูลจริงขององค์กร

## Checkpoint 0 — baseline
### สิ่งที่ทำ (ไฟล์หลักที่แก้/เพิ่ม)
อ่าน AGENTS/Master Plan/task ครบ รวมเอกสาร prerequisite; ตรวจ HEAD/source, สร้าง branch ที่สั่งและแผน `docs/plans/ux-login-v1.md`; บันทึก baseline ใน implementation-status
### หลักฐาน (คำสั่งที่รัน + ผลลัพธ์จริง)
npm ci (rerun หลัง cache EPERM) exit0; lint/typecheck/test/test:documents/build exit0; 143 tests ผ่าน/3 skipped, 40 files ผ่าน/1 skipped, document1; audit exit1 critical1 (GHSA-vcvr-r3jv-pc5j) — CP0 full gate ยังไม่ครบ
### สถานะของงานที่ตรวจพบว่าทำไว้แล้ว
generic/dummy/audit/expired-lock reset: login/actions.ts:17,18,67,86; proxy next/401: proxy.ts:11,17; forced-password: access.ts:72/request-context.ts:38; PreviewNotice dev-only: workspace-feedback.tsx:13/workspace-server.ts:11
### JEV ที่ใช้
CP0 วันที่ 2026-10-03: health network_ok=true; continue gather_evidence confidence .39/fallback_to_codex ใช้ตรวจ advisory/registry เพิ่ม ไม่ใช้แทน gates
### Screenshot ก่อน-หลัง (path)
`docs/quality/ux-login-evidence/before-login-{light,dark}-{1440,1024,390}.png`; ไม่มี after CP0 เพราะยังไม่แก้ UI
### สิ่งที่ยังไม่ได้ยืนยัน / ข้อสมมติ / คำถาม
Q1–Q4 ได้คำตอบแล้วตามแผน; production/UAT ไม่ได้ยืนยัน; legacy user changes ไม่ถูก stage
### ความเสี่ยงและวิธี rollback
revert documentation commit `0edfe64`; ไม่เปลี่ยน source/permission/data
### ผลกระทบต่อสิทธิ์/ข้อมูลเดิม
ไม่มี; commit/push CP0 สำเร็จบน branch codex/ux-login-polish

## Checkpoint 1 — auth และ blue tokens
### สิ่งที่ทำ (ไฟล์หลักที่แก้/เพิ่ม)
AuthShell/PasswordField ร่วม, copy.ts, login/change-password forms, email-only state, reason allowlist, SUPPORT_CONTACT_TEXT env, PN mark ที่เปลี่ยนรูปได้, shared pure passwordCriteria, blue ADR-0004, contrast/CSS scripts; patch Next/eslint-config-next 16.3.6; เพิ่ม isolated Postgres/Playwright tooling ก่อน CP5 เพื่อใช้ตรวจ auth ตั้งแต่ CP1
### หลักฐาน (คำสั่งที่รัน + ผลลัพธ์จริง)
tests ของ auth branch เดิม 6 เคสรันผ่านก่อนแก้; full gate lint/typecheck/test/documents/build/audit exit0 รอบ CP1; unit152 ผ่าน/3 skipped (42 files ผ่าน/1 skipped), documents1, audit0 vulnerabilities; check:contrast 50 pairs/0 failures; `UX_EXTERNAL_SERVER=1 npx playwright test e2e/auth.spec.ts` 7 passed (15.7s), ตรวจทั้งสองหน้า Light/Dark ×1440/1024/390: HTML forbidden0, h1 visible1, horizontal overflow0, axe serious/critical0
### สถานะของงานที่ตรวจพบว่าทำไว้แล้ว
คง dummy Argon2, generic account failure, lockout/reset, audit และ password transaction/session revocation ใน actions.ts; เพิ่ม test branches โดยไม่ลด coverage เดิม; safeNextPath เดิมไม่เปลี่ยน
### JEV ที่ใช้
2026-10-03: route shared_shell .90 (ใช้); risk1.91 confidence .80, hard_gate=false (ใช้ deterministic tests); evidence supported .63/needs_more .86 — เพิ่ม grep/HTML/axeและตรวจภาพจริงก่อนสรุป; classify_error environment .35/fallback_to_codex สำหรับ runner teardown (ตรวจโดยแยก server ได้ exit0); continue บันทึกผลใน implementation-status ไม่ใช้แทน evidence
### Screenshot ก่อน-หลัง (path)
ก่อน: `before-login-*`, `before-change-password-*`; หลัง: `cp1-login-{light,dark}-{1440,1024,390}.png` และ `cp1-change-password-{light,dark}-{1440,1024,390}.png` ใน `docs/quality/ux-login-evidence/`; ตรวจภาพมือถือและ desktop จริง
### สิ่งที่ยังไม่ได้ยืนยัน / ข้อสมมติ / คำถาม
check:css ทั้งระบบยังมี legacy violations รอ CP3; module DOM/CI รอ checkpoints ถัดไป; managed webServer teardown บน Windows ค้าง ต้องใช้ external server (CI Linux ยังไม่ได้ยืนยัน)
### ความเสี่ยงและวิธี rollback
revert auth presentation/copy commits; เก็บ auth protection tests และ Next security patchไว้ได้ ไม่มี migration ใหม่
### ผลกระทบต่อสิทธิ์/ข้อมูลเดิม
ไม่มีการเปลี่ยน permission/lockout/timeout/transaction; fixture writes เฉพาะฐานแยก ไม่มีข้อมูลจริงถูกใช้

## Checkpoint 2 — ข้อความ สถานะ และการตัดบรรทัด
### สิ่งที่ทำ (ไฟล์หลักที่แก้/เพิ่ม)
copy.ts, SourceDetails, AccessDenied, NativeModuleFoundation, ErrorState/error/global-error/not-found, skeleton dashboard/table/detail, title metadata 18 routes, PN icon/apple-icon/manifest/robots, Thai admin labels, document/map feedback, wrapping cards/table text, mobile topbar 320px. รายละเอียดการเชื่อมต่อย้ายไปหน้า admin ที่บังคับ core.audit.read ฝั่ง server. แก้เลือกชื่ออาคารยาวไม่ส่งชื่อเกินข้อจำกัด query120 ไปค้นหาอีกครั้ง.
### หลักฐาน (คำสั่งที่รัน + ผลลัพธ์จริง)
full gate CP2 lint/typecheck/test/test:documents/build/audit exit0; unit152 passed/3 skipped, documents1, audit0. Playwright workspace.spec.ts 8 passed (1.2m): Light/Dark ×320/390/1024/1440, dashboard/work/buildings/guarantees/403/404 และ building drawer. ตรวจ root overflow0, serious/critical axe0, forbidden text0, runtime error0. document503 จำลองแล้วแสดงข้อความทั่วไป ไม่เผย error ต้นทาง. Static JSX display scanner เพิ่มหลัง JEV ขอหลักฐาน: `node scripts/check-ui-copy.mjs` category-A0, B1 เป็นคำเตือนลบอาคารถาวร (ไม่เปลี่ยนความหมาย). source grep ที่เหลือเป็น imports/identifiers/admin-only/dev-only; ไม่อ้างว่าตรวจได้ทุกค่าข้อมูลในอนาคต.
### สถานะของงานที่ตรวจพบว่าทำไว้แล้ว
PreviewNotice ยังใช้ developmentMode; workspace-server ยังต้อง NODE_ENV=development และ isDevelopmentSession; production ?preview=1 ไม่แสดง preview. ไม่มี auth bypass สำหรับภาพทดสอบ ใช้ synthetic users ในฐานแยก.
### JEV ที่ใช้
2026-10-03: prioritize inventory (admin .57, nowrap .56, NAS .42) ใช้ source classification A ก่อน B; evidence supported .65/needs_more .83 จึงเพิ่ม static JSX display scan และ rerun auth matrix ไม่อ้างตรวจทุก dynamic state; continue .97 ใช้ต่อ CP3 เพราะคำสั่งและ source evidence มีผลจริง.
### Screenshot ก่อน-หลัง (path)
ก่อน `docs/quality/ux-login-evidence/before-{dashboard,work,buildings,guarantees,admin,404}-{light,dark}-{1440,1024,390}.png`; หลัง `cp2-*-staff-{light,dark}-{320,390,1024,1440}.png` รวม building-detail และ `cp2-*` admin matrix. เปิดภาพ building-detail light320 และ buildings light390 ตรวจแล้ว. ภาพ baseline ก่อนใช้ fixture ยาวเพิ่มเติมจึงไม่ใช่ pixel regression แบบข้อมูลเดียวกัน.
### สิ่งที่ยังไม่ได้ยืนยัน / ข้อสมมติ / คำถาม
Q1 ช่องทางยังไม่ตัดสิน ใช้ข้อความทั่วไปและ SUPPORT_CONTACT_TEXT; Q2 เตือน production รอ CP5; fonts/CSS/motion รอ CP3/4. Production integration และ business UAT ไม่ได้ยืนยัน. ตารางที่เลื่อนแนวนอนภายใน container มีเจตนา; root ต้องไม่ล้น.
### ความเสี่ยงและวิธี rollback
revert presentation checkpoint commits. ไม่มี schema migration/business formula changes; คงคำเตือนลบถาวรและ permission checks. อ่าน diagnostics เฉพาะผู้มี audit permission และแสดงเฉพาะ module/status ไม่ raw exception.
### ผลกระทบต่อสิทธิ์/ข้อมูลเดิม
ไม่มี permission/data changes. Seed แก้เฉพาะ permission_next_ux_test loopback; ตัวเลขและชื่อทั้งหมดสมมติ.

## Checkpoint 3 — ฟอนต์และ CSS
### สิ่งที่ทำ (ไฟล์หลักที่แก้/เพิ่ม)
Local Manrope/Nunito/Noto Sans Thai/Source Code Pro พร้อม OFL licenses; fonts.ts/root layout; auth.css แยกโดเมน; semantic token migration หกกลุ่มพร้อม commit แยก; ลบ alias definitions41 ตัวหลังตรวจ consumer0; check:css ขยาย clamp/rem และเพิ่ม CI branch. แผน selector ที่ยังไม่แน่ใจอยู่ docs/plans/css-consolidation.md ไม่ลบแบบคาดเดา.
### หลักฐาน (คำสั่งที่รัน + ผลลัพธ์จริง)
ux-gate.ps1 รันทุกกลุ่มและ cp3-final: lint/typecheck/test/documents/build/contrast/audit exit0. Final unit152 passed/3 skipped, documents1, audit0; check:css179 files0 violations; contrast58 pairs0 failures. `UX_EXTERNAL_SERVER=1 UX_PHASE=cp3-final npx playwright test`16 passed1.8m หลังลบ alias; axe serious/critical0, root overflow0, forbidden0. Offline font test:3 preload responses90,888 bytes, external requests0. Globals59,591→58,064 bytes (-1,527). ทุกกลุ่ม screenshots48ภาพ/0 page errors รวม admin; final staff matrixตรวจ320–1440. เก็บ errors/gates/font-budget JSON ตาม phase.
### สถานะของงานที่ตรวจพบว่าทำไว้แล้ว
คง production preview guard และ auth controls เดิม; ไม่เปิด bypass เพื่อถ่ายภาพ. Selector dynamic ที่ยังไม่แน่ใจคงไว้. เดิม --bounce-teal/--app-info ไม่มี definition แก้เป็น semantic token ที่มีจริง.
### JEV ที่ใช้
2026-10-03: font route separate_local_variables .63/fallback; CSS route alternating extraction/consumer migration .67/fallback ใช้ตามการตรวจ cascadeจริง; prioritize auth.77 shell.60 tables.59 dashboard.56 details.48 modules.34. Evidenceก่อน alias deletion supported.72/needs_more.60 จึงเพิ่ม scriptที่ปฏิเสธการลบเมื่อ consumerเหลือ และ rerun browser16เคส. ไม่มี selector deletion. classify flaky.82/needs_more.85 สำหรับ streaming/axe ใช้รอ heading/fonts/RAF/finite animation โดยไม่ลด axe rules แล้ว rerunผ่าน. Continueผลเก็บใน implementation-status; ไม่ใช้แทน gate.
### Screenshot ก่อน-หลัง (path)
`docs/quality/ux-login-evidence/cp3-before-{login,change-password,dashboard,work,buildings,guarantees,admin,404}-{light,dark}-{390,1024,1440}.png`; หลังแต่ละกลุ่ม cp3-auth/shell/dashboard/tables/details/modules รูปแบบเดียวกัน. Final authและstaffใช้ `cp3-final-*.png` รวม detail/403/404 ที่320–1440. ตรวจภาพ dark dashboard1440 และ detail390 จริง. KPI animationเดิมยังมีเลขระหว่างนับ จะปรับ CP4.
### สิ่งที่ยังไม่ได้ยืนยัน / ข้อสมมติ / คำถาม
Remote CIยังไม่ได้ยืนยันก่อนpushนี้; workflowเพิ่มcheck:cssแล้ว จะตรวจrunจริง. Production integration/UATยังไม่ได้ยืนยัน. Q1/Q2ยังคงค่าตามเจ้าของ; CP4/CP5รอดำเนินการ.
### ความเสี่ยงและวิธี rollback
Revertแต่ละ presentation commitได้ตามกลุ่ม; original globalsอยู่docs/archive/ux-login-v1/cp3-globals-before.css. ไม่เปลี่ยนสูตร/สิทธิ์/ข้อมูล; fontsมีlicenseในrepo.
### ผลกระทบต่อสิทธิ์/ข้อมูลเดิม
ไม่มี; browserใช้synthetic usersในฐานแยกเท่านั้น.

## Checkpoint 4 — motion ที่สื่อสถานะ
### สิ่งที่ทำ (ไฟล์หลักที่แก้/เพิ่ม)
motion.css รวม transform/opacity120/200ms; auth enter/error/pending spinner/eye crossfade; detailและbuilding drawerเข้าออก/backdrop; account/saved-view/search popover; inline success; แถวแรก3แถว stagger0/40/80ms; skeletonรูปทรงเดิม. ปิด decoration loops, layout/color transitions และ optional KPI count-up เพื่อแสดงจำนวนจริงทันที. useDialogDismissคงnative focus trapระหว่างexit; queueเก็บปุ่มเปิดเพื่อคืนfocus.
### หลักฐาน (คำสั่งที่รัน + ผลลัพธ์จริง)
cp4-final gate lint/typecheck/unit152+3skip/documents1/build/contrast58/audit0 exit0. check:css181files0. Playwright18passed2.1m. Motionnormal pending73.3ms/reduce57.3ms; settledWindowCLS0ทั้งสอง; reduced document animations0และcomputedanimationsnone. ปกติ keyframepropsเป็นtransform/opacity duration≤200ms; loopเฉพาะspinner/skeleton. Initialtestsพบfocus restorationและbackdrop reductionผิด แก้แล้วrerun18ผ่าน ไม่ลดassertion. Screenshot48ภาพ0errors/overflow; staffmatrix320–1440/axe0.
### สถานะของงานที่ตรวจพบว่าทำไว้แล้ว
loading skeleton/inline feedback/native dialogมีอยู่แล้ว ปรับpresentation; auth pending/guardsเดิมคงไว้. ไม่เพิ่มkeepaliveหรือเปลี่ยนข้อมูล.
### JEV ที่ใช้
continue confidence.80/verify_before_commit ใช้หลังผลจริง18เคส; ไม่ใช้JEVเกินจุดCP4. CP3 CIตรวจrun37127367637/verifyjobทุกstep successรวมcheck:css (https://github.com/Kobpatme/SuperApp-PERMISSION_NEXT/actions/runs/37127367637).
### Screenshot ก่อน-หลัง (path)
ก่อน cp3-final-*.png/cp3-modules-*.png; หลัง docs/quality/ux-login-evidence/cp4-final-{login,change-password,dashboard,work,buildings,guarantees,admin,404}-{light,dark}-{390,1024,1440}.png และ cp4-final-*-staff-*.png. เปิด loginlight390ตรวจจริง; motiontiming/CLSอยู่cp4-motion-{normal,reduce}.json.
### สิ่งที่ยังไม่ได้ยืนยัน / ข้อสมมติ / คำถาม
CLSเป็นช่วงหลังหน้าโหลดนิ่งที่ทดสอบเปิด/ปิดpanelและpopover ไม่อ้างทุกnetwork/font/dataในproduction. RemoteCIของCP4รอpush; CP5security/DBflowเต็มรอทำ. Q1/Q2คงตามคำตอบเจ้าของ.
### ความเสี่ยงและวิธี rollback
revertCP4presentation commit; ui.cssและAnimatedNumberเดิมเก็บในdocs/archive/ux-login-v1/cp4-*. Keyboardfocus regressionมีtest. Native closefallback160msรองรับanimationถูกยกเลิก.
### ผลกระทบต่อสิทธิ์/ข้อมูลเดิม
ไม่มี permission/formula/data changes.
