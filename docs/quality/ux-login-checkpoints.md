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
