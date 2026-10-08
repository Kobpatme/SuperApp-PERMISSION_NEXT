# CODEX MASTER PLAN V2 — Permission Next Super App

> Repository documentation policy (2026-10-08): use `docs/README.md`, current implementation status, module contracts and operations guides for handoff. Completed plans and historical audit/result reports are retained locally/in Git history and are not prerequisites in a new checkout. References to those historical reports below describe earlier execution checkpoints. This clarification does not alter business rules or release gates.

> **สถานะ:** Master execution specification สำหรับ Codex + JEV
> **Target repository:** `Kobpatme/SuperApp-PERMISSION_NEXT`
> **Audited target baseline:** `6ccef5b40fc5a9c006d02e58860897142d50ce52` (ต้องตรวจ current HEAD ใหม่ก่อนเริ่มทุกครั้ง)
> **Authoritative module baselines:** `maxiwa@94742a4`, `Permission_Next@afaee99`, `maxiwa_KPI@4f5fa99`
>
> คำสั่งงานสำหรับ Codex: ปรับปรุงระบบ `SuperApp-PERMISSION_NEXT` ให้พร้อมใช้งานจริงมากที่สุด โดยรักษา **Source Feature/Workflow/Calculation/UX Parity** ของ 3 ระบบต้นทาง พร้อมยกระดับความปลอดภัย, Admin self-service, architecture, UX/UI และ production readiness
>
> วางไฟล์นี้ที่ root ของ repo เป็น `CODEX-MASTER-PLAN-V2.md` และเพิ่มบรรทัดใน `AGENTS.md` ว่า: **"Read `CODEX-MASTER-PLAN-V2.md` before any task."**
> ข้อความที่แสดงต่อผู้ใช้ทั้งหมดต้องเป็น **ภาษาไทย** ส่วนโค้ด ชื่อตัวแปร และ commit message ใช้ภาษาอังกฤษ

---

## 0. วิธีทำงาน (Rules of engagement)

1. **อ่านก่อนแก้** อ่านให้ครบก่อนเริ่ม: `AGENTS.md`, `README.md`, `ARCHITECTURE-BASELINE.md`, `docs/adr/*`, `docs/architecture/*`, `docs/modules/*`, `docs/modules/parity-gates.md`, `docs/open-questions.md`, `docs/product/design-system.md`, `docs/product/information-architecture.md`, `docs/quality/*`
2. **Next.js เวอร์ชันนี้ไม่ใช่เวอร์ชันที่คุณคุ้นเคย** (`next@^16`, `src/proxy.ts` แทน middleware) อ่านคู่มือใน `node_modules/next/dist/docs/` ก่อนเขียนโค้ดที่แตะ routing, caching, proxy, server actions, fonts
3. **ทำทีละ Phase** ตามลำดับใน §11 จบแต่ละ Phase ต้องผ่าน gate ทั้งหมด: `npm run lint && npm run typecheck && npm test && npm run test:documents && npm run build`
4. **1 Phase = 1 branch = หลาย commit เล็ก** (Conventional Commits) ห้าม commit รวมก้อนใหญ่
5. **ห้ามเดากฎธุรกิจ** เรื่องที่อยู่ใน `docs/open-questions.md` (KPI weights, ภาษี, การปัดเศษ, นิยามคืนเงินประกันบางส่วน ฯลฯ) ให้สร้างเป็น *ค่าที่ตั้งได้ (configurable) + versioned* และบันทึกข้อสมมติใน `docs/open-questions.md` ห้าม hard-code ตัวเลขตัวอย่างเป็นค่าจริง
6. **ห้ามเขียนไปยังระบบภายนอกหรือข้อมูล production** (SharePoint, NAS, Firestore, Supabase ของ repo เดิม) ทุกอย่างอ่านอย่างเดียว และทำงานกับ fixture / ฐานข้อมูล local เท่านั้น
7. **ห้ามลบไฟล์ legacy** ให้ย้ายไป `docs/archive/` หรือ `legacy/` พร้อมบันทึกเหตุผล
8. **หลักฐานต้องมาก่อนคำอ้าง** ห้ามเขียนใน docs ว่า "เสร็จ/ผ่าน/ปลอดภัย" ถ้าไม่มี test หรือคำสั่งที่รันแล้วยืนยันได้ ถ้ารันไม่ได้ (เช่น ไม่มี Postgres) ให้เขียนว่า "ยังไม่ได้ยืนยัน" พร้อมขั้นตอนยืนยัน
9. **ทุก mutation ต้องผ่าน server** ตรวจ session → ตรวจ permission + data scope → validate ด้วย zod → เขียน audit/activity/outbox ใน transaction เดียวกัน (`runMaterialChange`) ห้ามเชื่อ state ฝั่ง client
10. เมื่อจบทุก Phase ให้อัปเดต `docs/implementation-status.md` และเขียนรายงานสั้น ๆ ตามรูปแบบใน §12
11. **Fresh evidence before implementation** — ก่อนแก้โมดูลใด ต้องตรวจ source repo จริงและ parity matrix ของโมดูลนั้นก่อน ห้ามถือว่า schema/domain foundation = migrate เสร็จ
12. **อย่าทำ UI redesign ก่อน source parity** — ต้องรู้ก่อนว่า feature/workflow/calculation/role-use-case ไหนต้อง KEEP/PORT/ADAPT/REPLACE/RETIRE
13. **Baseline ในเอกสารเป็น snapshot ไม่ใช่ความจริงถาวร** — ทุก session ใหญ่ต้อง rerun baseline gates และบันทึก current commit/test counts ใหม่ ห้ามอ้างตัวเลข test เดิมโดยไม่รันซ้ำ

### 0.1 JEV Execution Contract

JEV Native MCP เป็นเครื่องมือ advisory/orchestration ที่ต้องใช้ประกอบการทำงาน แต่ **ไม่ใช่ source of truth**

ก่อนเริ่มงานทุก session ใหญ่:

1. เรียก `jev_health` (`check_network=true`)
2. ถ้ามี `.jev/config.json` ให้ส่ง absolute project root เป็น `project_path`
3. ถ้า JEV ใช้งานไม่ได้ ให้บันทึกข้อจำกัดและทำงานต่อด้วย source evidence + deterministic tools; **ห้ามหยุดทั้งงานเพราะ JEV ล่ม**

ใช้ JEV ตามนี้:

- `jev_route` — ก่อน Phase/งานใหญ่ที่มีหลาย implementation path
- `jev_prioritize` — จัดลำดับ technical debt / parity gaps / UX gaps
- `jev_evidence_check` — ก่อนสรุปว่า feature ใดมี/ไม่มี/ครบ/ยกเลิกได้
- `jev_risk` — ก่อนแก้ Auth/RBAC/KPI/SLA/financial/workflow/migration/file access/destructive operation
- `jev_classify_error` — เมื่อ build/test/runtime fail แล้ว root cause ไม่ชัด
- `jev_continue` — หลังจบ checkpoint เพื่อประเมิน readiness ของ Phase ถัดไป

ลำดับความน่าเชื่อถือ:

```text
1. source code จริง
2. deterministic tests / typecheck / build / DB constraints
3. approved ADR / architecture docs ที่ current
4. authoritative source-repo behavior
5. JEV advisory
6. model reasoning
```

Privacy:

- ห้ามส่ง `.env`, API key, password, auth token, connection string, production record, database dump, certificate/private key ให้ JEV
- ส่งเฉพาะ sanitized metadata/context เท่าที่จำเป็น

### 0.2 Autonomous Execution / Stop Conditions

Codex **ทำงานต่อเนื่องได้เอง** ผ่านทุก safe phase โดยไม่ต้องหยุดถามผู้ใช้ทุกครั้งที่จบ Phase

**ห้ามหยุดเพื่อถามยืนยันเพียงเพราะ:**

- Phase หนึ่งเสร็จแล้ว
- ต้อง refactor หลายไฟล์
- ต้องเพิ่ม test/docs
- มี phase ปลอดภัยถัดไป
- งานมีขนาดใหญ่

**ให้หยุดและขอการตัดสินใจเฉพาะเมื่อ:**

1. ต้องแก้ production data จริง
2. ต้อง deploy production/infrastructure จริง
3. ต้องใช้ credential/secret ที่ไม่มี
4. ต้องทำ irreversible destructive migration
5. authoritative sources สองแหล่งขัดกันใน business rule สำคัญ
6. ต้องตัดสิน business policy ที่หา evidence ไม่ได้
7. source evidence ที่จำเป็นเข้าถึงไม่ได้จริง

ถ้า blocker ไม่ block งานทั้งหมด: บันทึก blocker → ทำงานส่วนอื่นต่อ → รายงานท้าย Phase

---

## 1. สถานะปัจจุบัน (ผลตรวจจริงจากโค้ด)

**Historical verified baseline ณ target commit `6ccef5b`:** lint, typecheck, unit test 87 เคส (27 ไฟล์), document test, `next build`, `npm audit --omit=dev` = 0 ช่องโหว่

> **Baseline freshness rule:** ข้อมูลข้างต้นเป็น snapshot เท่านั้น ก่อนแก้โค้ดต้องรัน gate ปัจจุบันใหม่และบันทึก current HEAD, จำนวน test, build result และ audit result ลง `docs/implementation-status.md`; หากไม่ตรงกับ snapshot ให้ใช้ผลใหม่เป็นหลักและห้ามแก้ test ให้ผ่านด้วยการลด coverage/authorization

**จุดแข็ง (ต้องรักษาไว้ ห้ามถดถอย):**
- Auth ภายในองค์กร: Argon2id, opaque session (เก็บเฉพาะ SHA-256 hash), lockout 5 ครั้ง/15 นาที, เปลี่ยนรหัสผ่านแล้วล้าง session ทั้งหมด
- RBAC + data scope `OWN / TEAM / SELECTED_TEAMS / ALL`, deny-by-default (`src/lib/authorization.ts`, `src/lib/access.ts`)
- Module manifest + capability catalog ตรวจด้วย zod (`src/lib/module-contract.ts`, `src/lib/module-registry.ts`)
- `runMaterialChange` เขียน audit + activity + outbox ใน transaction เดียว
- Security headers/CSP, ตรวจ origin ของ POST, ตรวจ path ของ NAS bridge, ตรวจ file signature ของไฟล์แนบ, optimistic locking (`version`) ของ guarantee
- `/admin` มีอยู่แล้ว: users, positions, teams, roles, permission matrix, access preview, audit, reset password, revoke sessions (`src/app/(platform)/admin/actions.ts`, `src/components/admin-workspace.tsx`)

**ช่องว่างที่ยืนยันแล้ว (ต้องแก้):**

| # | ปัญหา | ตำแหน่ง |
|---|---|---|
| G1 | login บอกสถานะ "ถูกระงับ/ถูกล็อก" ก่อนตรวจรหัสผ่าน → เดาได้ว่าอีเมลมีจริง | `src/app/login/actions.ts` |
| G2 | ไม่พบบัญชีแล้วคืนค่าทันที (ไม่ทำ Argon2) → timing enumeration | เช่นเดียวกัน |
| G3 | `failedAttempts` ไม่รีเซ็ตเมื่อล็อกหมดอายุ → ผิดครั้งเดียวโดนล็อกซ้ำ | เช่นเดียวกัน |
| G4 | ไม่มี rate limit ตาม IP, เชื่อ `x-forwarded-for` ตรง ๆ, ไม่มี audit ของ login (สำเร็จ/ล้มเหลว/ล็อก) | `login/actions.ts`, `auth.ts` |
| G5 | `mustChangePassword` บังคับเฉพาะที่ `(platform)/layout.tsx` — `/api/*` และ server action ถูกเรียกตรงได้ด้วยรหัสชั่วคราว | `src/lib/access.ts`, `src/app/api/**` |
| G6 | `proxy.ts` ตรวจแค่ว่ามี cookie; เด้งไป `/login` โดยทิ้ง URL เดิม; `/api/*` ควรได้ 401 JSON ไม่ใช่ redirect HTML | `src/proxy.ts` |
| G7 | `writeAuditLog` (NAS upload/download) ทำนอก transaction และกลืน error | `src/lib/audit-log.ts`, `src/app/api/nas/[...path]/route.ts` |
| G8 | `/api/dashboard` และ `/api/workspace/search` ไม่ตรวจ session เองอย่างชัดเจน (พึ่ง access context ที่คืนค่าว่าง) | `src/app/api/**` |
| G9 | Work module: route `/work/assign`, `/work/people`, `/work/tracker` มีอยู่แต่ `WorkWorkspace` ไม่รู้จัก view เหล่านี้ → **แสดงหน้า "งานของฉัน" แทนแบบเงียบ ๆ**; หน้ากิจกรรมแสดง `eventType` ดิบ | `src/components/work-workspace.tsx` |
| G10 | ยังไม่เคยรัน migration/RLS/concurrency กับ PostgreSQL จริง; ไม่มี integration test ของ `loadSubject`, admin actions, login, API routes; `@playwright/test` ติดตั้งแต่ไม่มี config/e2e | ทั้ง repo |
| G11 | ไม่มี Dockerfile/compose, ไม่มี `not-found.tsx`, `global-error.tsx`, favicon/app icon, title รายหน้า | ทั้ง repo |
| G12 | ฟอนต์เป็น system font (Segoe UI/Leelawadee/Tahoma) — บน Mac/Android/Linux ตกเป็นฟอนต์ทั่วไป; token alias ซ้อนหลายชุด (`--app-*`, `--ink`, `--color-*`); `globals.css` ~60 KB | `src/styles/tokens.css`, `src/app/globals.css` |
| G13 | เอกสารล้าสมัย/ขัดกับโค้ด: TD-012 (บอกว่า `getDb()` สร้าง client ใหม่ทุกครั้ง แต่โค้ดเป็น singleton แล้ว), หลายไฟล์ยังพูดถึง Supabase ทั้งที่ใช้ local Postgres; root มีไฟล์แผนขนาดใหญ่ (`PERMISSION_NEXT_PROFESSIONAL_REBUILD.md` 68 KB ฯลฯ) | root, `docs/` |
| G14 | `.env.example` มี hostname/SITE_PATH ของ SharePoint และพาธไดรฟ์จริงขององค์กร | `.env.example` |

---

## 2. หลักการที่ห้ามละเมิด (Non-negotiables)

- **Deny-by-default** ทุกทางเข้า (page, route handler, server action, API) ต้องตรวจที่ server
- **ไม่มีการแก้สิทธิ์ผ่านฐานข้อมูลโดยตรงในการใช้งานปกติ** ทุกอย่างทำผ่าน `/admin` (§4)
- **Audit ที่เป็น material ต้องอยู่ใน transaction เดียวกับการเปลี่ยนข้อมูล** ถ้าเขียน audit ไม่ได้ ต้อง rollback
- **ข้อความ error ต้องไม่รั่วข้อมูล** (ไม่บอกว่าอีเมลมีจริงหรือไม่, ไม่ส่ง stack trace/SQL ไปที่ client)
- **ตัวเลขเงินใช้ `decimal.js` / `numeric` เท่านั้น** ห้ามใช้ `Number` คำนวณเงิน
- **Secret ห้ามอยู่ใน repo** และห้ามส่งออกไป client
- **Accessibility ระดับ WCAG 2.2 AA** เป็นเกณฑ์ผ่านของทุกหน้า (§7.6)
- **Design ต้องเคารพ `AGENTS.md` → Aesthetic Direction**: operational workspace เรียบ หนาแน่นอย่างมีระเบียบ หลีกเลี่ยง glassmorphism, gradient/glow ที่ไม่สื่อความหมาย, card ซ้อน card และ animation ที่ทำให้งานช้าลง

---

## 3. Phase 0 — Security & Auth hardening (ทำก่อนสิ่งอื่น)

แก้ G1–G8 โดยมีรายละเอียดดังนี้

### 3.1 Login (`src/app/login/actions.ts`, `src/lib/auth.ts`)
- ตอบข้อความกลางเดียวกันทุกกรณีที่ล้มเหลว: "อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชียังไม่พร้อมใช้งาน" (รวม suspended/locked) แต่ **บันทึกสาเหตุจริงไว้ใน audit**
- ทำ Argon2 verify กับ dummy hash เมื่อไม่พบบัญชี เพื่อให้เวลาตอบสนองใกล้เคียงกัน
- ล็อกอินสำเร็จ/ล้มเหลว/ถูกล็อก → เขียน `auth.login.success | auth.login.failure | auth.account.locked` ลง `audit_logs` (เก็บ IP, user-agent, ไม่เก็บรหัสผ่าน)
- รีเซ็ต `failedAttempts` เมื่อ `lockedUntil` หมดอายุ (นับรอบใหม่)
- เพิ่ม **rate limit ต่อ IP + ต่อ email** (ตารางเล็กใน Postgres เช่น `auth_rate_limits` หรือ in-memory + fallback; ต้องทำงานถูกต้องเมื่อรันหลาย instance → ใช้ Postgres) และเพิ่ม backoff
- อ่าน client IP จาก `x-forwarded-for` **เฉพาะเมื่อ** ตั้ง `TRUSTED_PROXY_COUNT`/`TRUSTED_PROXY_CIDRS` ใน env มิฉะนั้นใช้ IP จาก connection; validate รูปแบบ IP ก่อนเก็บ
- Session: เพิ่ม **idle timeout** (เช่น 30 นาที ตั้งค่าได้) และ absolute timeout (12 ชม. ตามเดิม), หมุน token (rotate) เมื่อสิทธิ์ผู้ใช้เปลี่ยนหรือทุก N นาที, เก็บ `lastSeenAt`
- นโยบายรหัสผ่านย้ายไปไฟล์เดียว (`src/lib/password-policy.ts`) ใช้ร่วมกันใน change-password, admin create user, admin reset, bootstrap script (ตอนนี้ bootstrap ยอมรับ 8 ตัว ขณะที่ change-password บังคับ 12 ตัว → ให้เท่ากัน) ตรวจกับ common-password list ขนาดเล็ก

### 3.2 บังคับ `mustChangePassword` ทุกทางเข้า (G5)
- ย้ายการตรวจเข้า `getIdentityAccessContext` / `getCurrentUser` ให้คืนสถานะ `passwordChangeRequired` และให้ `getAccessContext` คืน `allowed: false` เมื่อยังไม่เปลี่ยนรหัส
- ทุก route handler ใน `src/app/api/**` และทุก server action ต้องตอบ `403 { code: "PASSWORD_CHANGE_REQUIRED" }` (ยกเว้น `changePasswordAction`, `logoutAction`)
- เขียน test ครอบคลุม

### 3.3 Proxy และ API (G6, G8)
- `src/proxy.ts`: ถ้าไม่มี session → หน้า HTML redirect ไป `/login?next=<path เดิมที่ปลอดภัย>` (validate `next` ต้องเป็น path ภายใน ขึ้นต้น `/` ไม่ใช่ `//`); `/api/*` ตอบ `401 application/json`
- หลัง login สำเร็จให้กลับไป `next`
- เพิ่ม helper `requireApiAccess(moduleId, capability)` ให้ทุก route handler ใช้เหมือนกัน (ตอบ 401/403/JSON รูปแบบเดียวกัน) แล้วแก้ `/api/dashboard`, `/api/workspace/search`, `/api/nas/*`, `/api/guarantees/**`, `/api/integrations/**`

### 3.4 Audit ของ NAS (G7)
- ทำให้ audit ของ upload/download เป็น *required*: ถ้า upload สำเร็จแต่เขียน audit ไม่ได้ ให้บันทึกลง outbox/`pending_audit` เพื่อ retry และตอบ client ว่าสำเร็จพร้อม log error (หรือทำ two-phase: audit intent → upload → audit result)
- อย่ากลืน error ใน `writeAuditLog` ให้ throw หรือคืนผลให้ผู้เรียกตัดสินใจ และเลิกข้าม actor `development-session` ในโหมด production

### 3.5 CSP และ headers
- เปลี่ยน `script-src 'unsafe-inline'` เป็น nonce-based CSP (ผ่าน proxy) ถ้าทำได้โดยไม่ทำให้ theme bootstrap script พัง; ถ้าเปลี่ยนไม่ได้ให้บันทึกเหตุผลใน ADR
- เพิ่ม `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, ปรับ `Permissions-Policy`
- ตรวจ `img-src` ที่อนุญาต tile ของ OpenStreetMap/ArcGIS: ถ้าใช้บนเครือข่ายภายในที่ออกเน็ตไม่ได้ ให้ทำ fallback ของแผนที่ (ข้อความ + ตารางพิกัด) และไม่ให้หน้า crash

**Acceptance:** มี test ครอบ G1–G8, อ่านโค้ดแล้วไม่มีทางเข้าใดที่ข้ามการตรวจ session/permission/mustChangePassword, `npm run build` ผ่าน

---

## 4. Phase 1 — Admin จัดการสิทธิ์เองได้ทั้งหมด โดยไม่แตะ Database

**เป้าหมายผลิตภัณฑ์:** ผู้ดูแลระบบ (ผู้ที่ไม่ใช่นักพัฒนา) เพิ่มคน ปรับสิทธิ์ ย้ายทีม เปิด/ปิดโมดูล ตรวจสอบย้อนหลัง และกู้สถานการณ์ได้ครบผ่านหน้าเว็บ ไม่ต้องรัน SQL หรือ script ใด ๆ ยกเว้นการ bootstrap admin คนแรกครั้งเดียว

ระบบมี `/admin` พื้นฐานอยู่แล้ว (ดู `docs/modules/admin.md`, `docs/plans/admin-workspace-plan.md`) — งานคือ **ต่อยอดให้สมบูรณ์ ไม่เขียนใหม่ทิ้ง** และปรับ UX ให้ผู้ดูแลที่ไม่ใช่นักเทคนิคใช้ได้

### 4.1 โครงสร้างหน้า Admin (Information Architecture)
แยกเป็นหน้าย่อยตาม route (แต่ละหน้าตรวจ capability ของตัวเอง ไม่ query ข้อมูลที่ไม่มีสิทธิ์เห็น):

| Route | ทำอะไร | Capability หลัก |
|---|---|---|
| `/admin` | ภาพรวม: จำนวนผู้ใช้/บัญชีถูกล็อก/คำขอสิทธิ์ที่รอ/การเปลี่ยนแปลงล่าสุด/คำเตือนความปลอดภัย | `core.profile.read` |
| `/admin/users` | รายชื่อผู้ใช้ (ค้นหา กรอง เรียง แบ่งหน้า), สร้าง, แก้, ระงับ/เปิด, ย้ายทีม/ตำแหน่ง, นำเข้าจาก CSV | `core.user.manage` |
| `/admin/users/[id]` | โปรไฟล์ + **Effective access** (เห็นว่าผู้ใช้คนนี้ทำอะไรได้ในโมดูลไหน ขอบเขตใด **พร้อมเหตุผลว่าได้มาจาก role ไหน**) + ประวัติ + sessions | `core.user.manage` |
| `/admin/roles` | บทบาท (role) + **ตารางสิทธิ์ (permission matrix)** จัดกลุ่มตามโมดูล ใช้ภาษาไทย ไม่โชว์รหัสทางเทคนิคเว้นแต่กด "รายละเอียดขั้นสูง" | `core.role.manage` |
| `/admin/teams` | ทีม/ตำแหน่ง/โครงสร้างองค์กร | `core.user.manage` |
| `/admin/modules` | **เปิด/ปิด/ตั้งสถานะโมดูล** (`development/pilot/active/maintenance/disabled`) เก็บใน DB (§4.3) | `core.module.manage` (ใหม่) |
| `/admin/access-requests` | คิวคำขอสิทธิ์จากผู้ใช้ → อนุมัติ/ปฏิเสธพร้อมเหตุผล | `core.role.manage` |
| `/admin/access-review` | รีวิวสิทธิ์เป็นรอบ (เช่น ทุกไตรมาส) ให้หัวหน้า/แอดมินยืนยันหรือเพิกถอนทีละคน | `core.role.manage` |
| `/admin/audit` | ค้นหา/กรอง/ส่งออก audit log (ผู้กระทำ, เป้าหมาย, โมดูล, ช่วงเวลา, ชนิดเหตุการณ์) | `core.audit.read` |
| `/admin/security` | นโยบายรหัสผ่าน, idle timeout, จำนวนครั้งล็อก, session ที่ active ทั้งระบบ, บัญชีที่ถูกล็อก, ปุ่ม "ออกจากระบบทุกคน" | `core.security.manage` (ใหม่) |

### 4.2 ฟีเจอร์ที่ต้องมี (ตรวจเทียบกับของเดิมก่อน แล้วเติมส่วนที่ขาด)
1. **Permission matrix แบบมนุษย์อ่านรู้เรื่อง** แถว = ความสามารถ (ภาษาไทย) คอลัมน์ = role; ค้นหาได้, จัดกลุ่มตามโมดูล, ติดป้าย risk (`normal/sensitive/administrative`) และ **แสดง diff ก่อนบันทึก** ("จะเพิ่ม 3 สิทธิ์, ลบ 1 สิทธิ์ กระทบผู้ใช้ 12 คน")
2. **Effective access preview / "ดูในมุมผู้ใช้"** แสดงเมนูและสิ่งที่ผู้ใช้นั้นเห็นจริง (read-only ห้ามใช้เพื่อทำรายการแทนผู้ใช้)
3. **Data scope ต่อ assignment** `OWN/TEAM/SELECTED_TEAMS/ALL` เลือกผ่าน UI พร้อมตัวเลือกทีม; อธิบายความหมายของแต่ละ scope เป็นภาษาไทยข้างช่องเลือก
4. **สิทธิ์ชั่วคราว** ตั้ง `validFrom/validUntil` ผ่าน UI (schema รองรับแล้ว) พร้อมเตือนก่อนหมดอายุ และรายการ "สิทธิ์ที่กำลังจะหมดอายุ"
5. **Role clone / template** ทำสำเนา system role มาแก้ (system role แก้ตรง ๆ ไม่ได้ตามเดิม), ตั้งชื่อ/คำอธิบายภาษาไทย
6. **Bulk actions**: เลือกหลายคน → กำหนด role/ทีม/ระงับ/รีเซ็ตรหัส (ทุก bulk ต้องมี preview และ confirm, audit รายบุคคล)
7. **นำเข้าผู้ใช้จาก CSV** (ตัวอย่างไฟล์ดาวน์โหลดได้): validate ทีละแถว, แสดง error ต่อแถว, dry-run ก่อนยืนยัน, ไม่ส่งรหัสผ่านทางอีเมลโดยพลการ (สร้างรหัสชั่วคราว + บังคับเปลี่ยน)
8. **คำขอสิทธิ์จากผู้ใช้**: ที่หน้า 403 (`AccessDenied`) มีปุ่ม "ขอสิทธิ์" เลือกเหตุผล → เข้าคิวของแอดมิน + แจ้งเตือน (ใช้ระบบ notification/outbox ที่มี) → ผู้ใช้เห็นสถานะคำขอ
9. **Guardrails** ที่บังคับที่ server + แสดงเหตุผลใน UI: ห้ามลบ/ลดสิทธิ์ platform admin คนสุดท้าย (ตรวจใน transaction เดียวกัน), ห้ามแอดมินลดสิทธิ์ตัวเองจนเข้า `/admin` ไม่ได้ (ต้องมี admin อีกคนยืนยัน), การให้สิทธิ์ระดับ `administrative` ต้องกรอกเหตุผล, (ตัวเลือก) **four-eyes** สำหรับการให้สิทธิ์ `administrative`
10. **ผลกระทบทันที**: เปลี่ยน role/สิทธิ์ → ล้าง session ของผู้ได้รับผลกระทบ (มีแล้วส่วนหนึ่ง) และแจ้งผู้ใช้ด้วยข้อความที่เข้าใจได้เมื่อถูกเด้งออก ("สิทธิ์ของคุณถูกปรับ กรุณาเข้าสู่ระบบอีกครั้ง")
11. **Audit ที่อ่านรู้เรื่อง**: แสดงเป็นประโยคภาษาไทย ("สมชาย เพิ่มสิทธิ์ 'อนุมัติคืนเงิน' ให้บทบาท 'ผู้จัดการ'") พร้อม before/after ขยายดูได้ และส่งออก CSV
12. **กู้คืนตัวเอง (break-glass)**: ขั้นตอนที่ระบุใน `docs/operations/` สำหรับกรณีแอดมินทุกคนเข้าไม่ได้ (ใช้ `npm run auth:bootstrap` เท่านั้น) และ script ต้องเขียน audit; ให้ใช้นโยบายรหัสผ่านเดียวกับระบบ

### 4.3 ย้าย "สถานะโมดูล" ไปฐานข้อมูล (แผนที่เอกสารระบุว่ายัง planned)
- ตอนนี้ `isModuleEnabled` ดูจาก manifest ใน code (`enabledByDefault && lifecycle === "active"`) → เพิ่มตาราง `module_settings(module_id, lifecycle, enabled, updated_by, updated_at)` ให้ Admin สลับสถานะได้ **โดยไม่ต้อง deploy** (manifest ยังเป็น source of truth ของโครงสร้าง/สิทธิ์ ส่วน DB เป็น override ของสถานะ)
- โมดูลสถานะ `pilot` เห็นได้เฉพาะ role/ผู้ใช้ที่แอดมินระบุ; `maintenance` แสดงหน้า "กำลังปรับปรุง" แทนการ 404
- เปลี่ยนสถานะทุกครั้ง audit และมี confirm

### 4.4 Catalog synchronization (ให้สิทธิ์ของโมดูลใหม่โผล่ใน Admin เอง)
- ตารางมี `permissions` อยู่แล้ว แต่ capability นิยามใน `src/lib/capabilities.ts`/manifest → สร้าง `syncPermissionCatalog()` ที่ **idempotent** รันอัตโนมัติตอน `db:migrate`/บูตเซิร์ฟเวอร์ (เขียนเฉพาะเพิ่ม/อัปเดตป้ายชื่อ ห้ามลบ capability ที่ role ยังอ้างถึง — ให้ทำเครื่องหมาย `deprecated`)
- เพิ่ม test: manifest ใหม่ → sync → ปรากฏใน matrix โดยไม่ต้องแก้ SQL/seed มือ
- ห้ามสร้างสิทธิ์ให้ role ใดอัตโนมัติ (ต้องให้แอดมินติ๊กเอง) ยกเว้น `platform_admin`

### 4.5 System roles ตั้งต้น (ตรวจสอบ/ปรับ ห้ามลดสิทธิ์โดยไม่บอก)
`platform_admin`, `operations_manager`, `permission_specialist`, `sales_operator`, `viewer`, `guarantee_tl` (มีอยู่แล้วใน seed/migration) — ทำเอกสาร "ตารางสิทธิ์ตั้งต้น" ใน `docs/modules/admin.md` และให้ test ยืนยันว่า seed ตรงกับเอกสาร

### 4.6 Acceptance ของ Phase 1
- ผู้ดูแลที่ไม่ใช่นักพัฒนาทำสถานการณ์เหล่านี้ได้ **จาก UI ล้วน**: พนักงานใหม่เข้ามา → สร้างบัญชี+ทีม+บทบาท; ย้ายคนข้ามทีม; ให้สิทธิ์ชั่วคราว 30 วัน; ระงับบัญชีคนลาออก; ปิดโมดูลชั่วคราว; ดูว่าใครแก้สิทธิ์อะไรเมื่อไร; อนุมัติคำขอสิทธิ์
- มี integration test (Postgres จริงใน CI) ของ guardrails ข้อ 9, การแข่งกันของ "admin คนสุดท้าย" (concurrent), และการล้าง session
- มีสคริปต์ e2e (Playwright) ของ flow: สร้างผู้ใช้ → ล็อกอินด้วยรหัสชั่วคราว → เปลี่ยนรหัส → เห็นเฉพาะโมดูลที่ได้สิทธิ์ → แอดมินถอนสิทธิ์ → ผู้ใช้ถูกเด้งและเข้าไม่ได้

---

## 5. Phase 2 — ย้ายโมดูลให้ครบตาม repo ต้นทาง (Source parity)

repo ต้นทางที่ใช้เป็น **แหล่งอ้างอิงพฤติกรรมแบบอ่านอย่างเดียว**:

| โมดูล | Repo ต้นทาง | Approved baseline | เส้นทางใน Super App |
|---|---|---:|---|
| เงินประกันอาคาร | `https://github.com/Kobpatme/maxiwa.git` | `94742a4` | `/guarantees` |
| อาคารและค่าใช้จ่าย | `https://github.com/Kobpatme/Permission_Next.git` | `afaee99` | `/buildings` |
| งานและ KPI | `https://github.com/Kobpatme/maxiwa_KPI.git` | `4f5fa99` | `/work` |

> **Fresh audit confirmed:** ทั้ง 3 repo ถูกเปิดอ่านและตรวจ source จริงแล้ว ณ 2026-09-29 ไม่ใช่การอนุมานจากชื่อ repo
>
> Approved baseline ข้างต้นเป็นจุดอ้างอิงที่ตรวจแล้ว ไม่ใช่คำสั่งให้ ignore commit ใหม่ ถ้า `main` เดินหน้าเกิน baseline ให้ Codex ทำ `baseline..main` diff และจัดประเภทการเปลี่ยนแปลงว่า `bugfix / behavior-change / security / UX-only / data-contract` ก่อนเสนออัปเดต baseline ห้ามเปลี่ยน baseline อัตโนมัติโดยไม่บันทึก evidence

### 5.0 Mandatory Fresh Source Freeze — ทำก่อน implementation ของทุกโมดูล

Phase นี้เป็น **read-only discovery** และต้องทำก่อนแก้ module code:

```text
Inspect source repo + target repo
        ↓
Record exact SHAs
        ↓
Feature / screen inventory
        ↓
Workflow / state inventory
        ↓
Calculation / report inventory
        ↓
Role / permission use-case inventory
        ↓
Source UX baseline
        ↓
Parity matrix
        ↓
Golden-test plan
        ↓
Only then implement
```

ผลที่ต้องบันทึก:

```text
docs/modules/work/source-parity.md
docs/modules/work/source-ux-baseline.md
docs/modules/buildings/source-parity.md
docs/modules/buildings/source-ux-baseline.md
docs/modules/guarantees/source-parity.md
docs/modules/guarantees/source-ux-baseline.md
```

`source-ux-baseline.md` ต้องตอบอย่างน้อย:

- ผู้ใช้เข้า module จากไหน
- default landing screen คืออะไร
- primary action คืออะไร
- common click path กี่ขั้น
- filters/search ไหนใช้บ่อย
- detail เปิดแบบ page/drawer/modal อย่างไร
- status/step ที่ผู้ใช้เห็นมีอะไร
- success/error/empty behavior
- หลัง action สำเร็จ user ถูกพาไปไหน
- keyboard/mobile behavior ที่สำคัญ

Mental model ที่ต้องรักษา:

- Work/KPI = **role/task/performance specific workspace** ไม่ใช่ generic queue อย่างเดียว
- Buildings = **map-first + building operations + quotation**
- Guarantees = **workflow-step + TL/refund/financial mental model**

### 5.1 ขั้นตอนบังคับสำหรับทุกโมดูล
1. โคลน repo ต้นทางไว้นอก `src/` (เช่น `_discovery_sources/` ซึ่งอยู่ใน `.gitignore` และถูกยกเว้นจาก lint/build อยู่แล้ว) หรือใช้ GitHub connector/read-only checkout ที่พิสูจน์ SHA ได้
2. เรียก `jev_evidence_check` ก่อนสรุป source inventory และใช้ `jev_prioritize` หลังได้ parity gaps แล้ว
3. เติม/อัปเดต **parity matrix** ที่ `docs/modules/<module>/source-parity.md` โดยทุก feature ต้อง classify เป็น `KEEP | PORT | ADAPT | REPLACE | RETIRE` และมีสถานะ `done | partial | missing | intentionally-changed`
4. ทุก `RETIRE` ต้องระบุเหตุผล, replacement behavior, user impact และ evidence; ห้าม retire เพียงเพราะ SuperApp ยังไม่ได้ implement
5. เติม/อัปเดต `source-ux-baseline.md` เพื่อรักษา user mental model ไม่ใช่แค่ checklist ฟังก์ชัน
6. เขียน test จาก **พฤติกรรมต้นทาง** (golden fixtures) ก่อนหรือพร้อมการ implement
7. ทำครบตาม gate ใน `docs/modules/parity-gates.md` ก่อนเขียนว่าโมดูลนั้น "migrated"
8. ฟีเจอร์ที่ตั้งใจเปลี่ยน (เช่น ยกเลิก plaintext password, client-direct Firestore, hard delete) ให้บันทึก ADR สั้น ๆ
9. ก่อนแก้ calculation/workflow/RBAC/migration ให้เรียก `jev_risk`; ถ้า source กับ target behavior ขัดกันให้หยุดเฉพาะ business decision นั้นและทำส่วนอิสระต่อ

### 5.1.1 Migration Reconciliation Contract

ทุก import/backfill จากระบบต้นทางต้องสร้าง reconciliation report ที่ตรวจย้อนกลับได้:

```text
Source repository + SHA
Import run ID
Started / Finished
Source rows
Imported rows
Updated rows
Skipped rows
Rejected rows
Duplicate rows
Unresolved mappings
Source financial totals (เมื่อเกี่ยวข้อง)
Imported financial totals
Difference
Canonical ID mappings
Orphans
Warnings
Idempotent rerun: PASS / FAIL
```

ข้อบังคับ:

- import เดิมรันซ้ำต้องไม่สร้าง duplicate
- row ที่ reject ต้องมี reason code และ source reference โดยไม่เผย secret
- ห้ามแก้ source data เพื่อให้ import ผ่าน
- financial reconciliation ใช้ Decimal/numeric เท่านั้น
- ก่อน cutover ต้องตรวจ count + amount + mapping + orphan report
- เก็บ `source_import_run` / `source_import_row` หรือ equivalent evidence ตาม architecture ปัจจุบัน

### 5.2 โมดูล งานและ KPI (`/work`) — ใกล้เคียงที่สุดกับการปิดงาน
สถานะ: SP-1 กำลังทำ (มี Work domain helper, deadline วันทำการ/วันหยุด, SLA แบบถ่วงน้ำหนัก, `/work/new`) ที่ขาด:
- **แก้ G9 ทันที:** ทำ view `assign`, `people`, `tracker`, `team`, `reports`, `kpi` ให้ครบและ **ตรงกับชื่อเมนู**; ห้าม fallback เป็น "งานของฉัน" แบบเงียบ ๆ; view ที่ยังไม่เสร็จให้ซ่อนจากเมนูหรือแสดงหน้า "กำลังพัฒนา" ชัดเจน; view ที่ไม่รู้จักให้ `notFound()`
- ศูนย์มอบหมายงาน (assignment center), หน้ารายละเอียดงาน + บันทึก/note, action เปลี่ยนสถานะตาม state machine, hold/extend พร้อมประวัติ
- Admin UI สำหรับวันหยุด (holiday calendar) และกฎ KPI (versioned, effective-dated, four-eyes สำหรับ adjustment)
- หน้ากิจกรรม: แปลง `eventType` เป็นประโยคไทยที่อ่านออก, ลิงก์ไปยังรายการ, กรองตามผู้ใช้/ช่วงเวลา
- รายงาน: สรุปตามสถานะ/คน/ทีม/ช่วงเวลา, ส่งออก CSV/Excel, ตัวเลขทศนิยมแบบ exact
- นำเข้าข้อมูลย้อนหลังจาก maxiwa_KPI ผ่าน import run/row evidence (`source_import_*`) พร้อม reconciliation report; **KPI weights ต้องมาจากกฎที่อนุมัติ (OQ-004) ห้ามใส่ค่าสมมติ**

### 5.3 โมดูล อาคารและค่าใช้จ่าย (`/buildings`)
มีแล้ว: canonical building, ค้นหา, แผนที่ (Leaflet), รายละเอียดอาคาร, NAS bridge สำหรับเอกสาร, เงื่อนไข/ค่าธรรมเนียมแบบมีเวอร์ชัน, engine ใบเสนอราคา Decimal
ที่ต้องเติมตาม parity: ฟอร์มสร้าง/แก้ไขอาคารและเงื่อนไขพร้อม version history, workflow ใบเสนอราคา (estimate → version → item → approval แยกผู้เสนอ/ผู้อนุมัติ), Building 360 (รวมอาคารเดียวกันจากทุกโมดูลด้วย canonical ID), นำเข้า CSV/staging (`scripts/import-permission-*.mjs` มีอยู่แล้ว), ค้นหาเอกสารจาก NAS พร้อม preview/ดาวน์โหลดที่ audit ได้
- อัตราภาษี/การปัดเศษ (OQ-012) ต้องเป็นค่าตั้งได้แบบ versioned — ห้าม seed ค่าจริงเอง
- แผนที่ต้องไม่พังเมื่อโหลด tile ภายนอกไม่ได้ (§3.5)

### 5.4 โมดูล เงินประกันอาคาร (`/guarantees`)
มีแล้ว: workspace, deposit editor/evidence upload, สถานะ/การทำงานของ TL, optimistic locking, ตรวจไฟล์แนบ, trigger จำกัดวงเงินคืน, four-eyes ในคำขออนุมัติ
ที่ต้องเติมตาม parity: ครบทุกสถานะและ transition ที่ต้นทางมี (ตรวจ mapping กับ OQ-005), เอกสารที่ต้องสร้าง (route `/legacy/guarantee` ปัจจุบันเป็นตัวอ้างอิงเท่านั้น — ต้องมีเวอร์ชัน native ครบก่อนปิดของเดิม), นำเข้า CSV (`scripts/import-guarantee-csv.mjs`) พร้อม reconcile, ทีมติดตั้งตามพื้นที่ (migration `0014`), แจ้งเตือนเมื่อเอกสารครบ/ค้างนาน, มุมมองการเงิน (ยอดฝาก/คืน แยกส่วนประกอบ ไม่อนุมานภาษี/ค่าธรรมเนียมเอง)
- ย้ายข้อมูลหลักไป **ตารางที่มีชนิดข้อมูลชัดเจน** (ตอนนี้ `guarantee_work_items.data` เป็น JSON ก้อนเดียว) ตามแผน migration ใน `docs/migration/guarantee-*.md` โดยไม่ทำให้ข้อมูลเดิมหาย (expand → backfill → contract)

### 5.5 Legacy routes
`/legacy/*` ต้อง 404 บน production (ทำแล้ว) — เพิ่ม test ยืนยัน และตั้งเป้ายกเลิกเมื่อ parity gate ของโมดูลนั้นผ่าน ห้ามลบก่อนได้รับการยืนยันจากเจ้าของโมดูล

---

## 6. Phase 3 — วางระบบรองรับโมดูลในอนาคต (Platform for future modules)

เป้าหมาย: เพิ่มโมดูลที่ 4, 5, ... ด้วยงาน **"เพิ่มโฟลเดอร์ + ลงทะเบียน manifest"** ไม่ต้องแก้ shell, admin, search, dashboard, notification

1. **Module SDK / template** — โฟลเดอร์ `src/modules/_template/` (หรือ `docs/modules/_template.md` + generator) ประกอบด้วย: manifest, capabilities, route group `(platform)/<module>/`, read model, server actions ตัวอย่างที่ใช้ `runMaterialChange`, search provider, dashboard provider, notification topics, test skeleton, docs skeleton
2. **Generator:** `npm run module:new -- --id <slug> --name "<ชื่อไทย>"` สร้างโครงข้างต้นพร้อม capability ตั้งต้น (`<id>.record.read` ฯลฯ ตามรูปแบบ regex ใน `module-contract.ts`)
3. **สัญญากลาง (contracts)** ทุกโมดูลต้องมี: `entryPermissions`, `capabilities` (มี `labelTh`, `risk`, `allowedScopes`), `searchProvider`, `dashboardProvider`, ชนิดเหตุการณ์ใน `docs/architecture/event-catalog.md`, และ route ที่ตรวจสิทธิ์เองโดยไม่พึ่ง navigation
4. **Navigation ที่ไม่บวมเมื่อมีโมดูลมากขึ้น:** จัดกลุ่มตาม `group` (work/operations/finance/reports/management), พับ/ขยายกลุ่มได้, pin รายการโปรด, "ค้นหาโมดูล/คำสั่ง" ด้วย Command palette (`Ctrl/⌘+K`) ที่กรองตามสิทธิ์ (ต่อยอด `WorkspaceSearch`)
5. **Shared services** ที่โมดูลใหม่เรียกใช้ได้เลย: attachments (provider boundary), notifications, audit/activity/outbox, import-run framework, export (CSV/XLSX) helper, pagination/filter/saved-views helper
6. **Cross-module:** Building 360 และ dashboard กลางดึงข้อมูลผ่าน provider contract เท่านั้น ห้าม import ข้ามโมดูลตรง ๆ (เพิ่ม lint rule/`eslint-plugin-boundaries` หรือ test ตรวจ dependency direction ตาม `docs/architecture/module-boundaries.md`)
7. **โมดูลตัวอย่างสำหรับทดสอบ** (ติดป้าย `development`, ซ่อนใน production) เพื่อยืนยันว่า generator → admin matrix → เมนู → ค้นหา ทำงานจริงโดยไม่แก้ไฟล์ส่วนกลาง
8. **ADR ใหม่:** `docs/adr/0004-module-lifecycle-and-catalog-sync.md` และ `0005-future-module-checklist.md` พร้อม "Definition of Ready/Done ของโมดูลใหม่"

รายการโมดูลที่วางแผนไว้ล่วงหน้า (ให้ทำ **แค่ช่องทาง** ไม่ต้องทำเนื้อหา): ตัวอย่างเช่น รายงาน/แดชบอร์ดบริหาร, คลังเอกสารกลาง, ระบบอนุมัติ/เวิร์กโฟลว์กลาง, ทรัพยากรบุคคลเบา ๆ — *รายการนี้เป็นตัวอย่างเพื่อทดสอบสถาปัตยกรรม ไม่ใช่ข้อกำหนดของผู้ใช้*; ให้ถามเจ้าของระบบก่อนเริ่มโมดูลจริงทุกครั้ง

---

## 7. Phase 4 — UX/UI Redesign ตาม BudgetZen (ปรับให้เหมาะกับระบบปฏิบัติการองค์กร)

แหล่งอ้างอิง: **https://designmd.ai/chef/budgetzen** (MIT, DESIGN.md format) — ระบบดีไซน์แนว "สงบ อบอุ่น ลดความกังวล" สำหรับแอปการเงิน

> **หลักตัดสินเมื่อขัดกัน:** `AGENTS.md → Design Principles` (throughput, keyboard-first, หนาแน่นอย่างมีระเบียบ, ไม่ตกแต่งเกินจำเป็น) ชนะ BudgetZen ในเรื่อง **ความหนาแน่น การตกแต่ง และแอนิเมชัน**; BudgetZen ชนะในเรื่อง **สี ฟอนต์ รูปทรง น้ำเสียง (tone of voice)**

### 7.1 Design tokens — ต้องแก้ที่ `src/styles/tokens.css` ที่เดียว (single source)
ห้ามเพิ่ม theme override ไฟล์ใหม่ (ตามที่ `docs/product/design-system.md` ระบุ) ให้ลบ/ยุบ alias ซ้อน (`--app-*`, `--ink`, `--muted`, `--line`) ทีละกลุ่มด้วยการ migrate consumer แล้วลบ ไม่ทิ้งค้าง

**สีจาก BudgetZen และการปรับเพื่อความชัด (contrast) — ตัวเลขด้านล่างคำนวณเทียบพื้นขาว/พื้นหลัง:**

| Token | BudgetZen | ใช้ใน Super App | หมายเหตุ contrast |
|---|---|---|---|
| `--color-bg` | `#FAFFFE` | ใช้ตามนี้ | พื้นหลังหลัก |
| `--color-surface` | `#FFFFFF` | ใช้ตามนี้ | การ์ด/แผง/โมดัล |
| `--color-brand` (พื้นผิว/progress/ไอคอน) | `#10B981` | `#10B981` | **ห้ามใช้เป็นพื้นปุ่มที่มีตัวอักษรขาว** (ตัวอักษรขาวบน `#10B981` ≈ 2.5:1 ไม่ผ่าน AA) |
| `--color-brand-strong` (ปุ่มหลัก/ลิงก์/ข้อความสีเขียว) | — | **`#047857`** | ตัวอักษรขาวบน `#047857` ≈ 5.5:1 ผ่าน AA; hover ใช้ `#065F46` |
| `--color-brand-soft` | — | `#D1FAE5` (ข้อความบนพื้นนี้ใช้ `#065F46` ≈ 6.8:1) | แถวที่เลือก, chip |
| `--color-info` (พื้นผิว) / `--color-link` (ข้อความ) | `#38BDF8` | พื้นผิว `#38BDF8`, **ข้อความ/ลิงก์ `#0369A1`** | `#38BDF8` บนขาว ≈ 2.1:1 ห้ามใช้เป็นตัวอักษร; `#0369A1` ≈ 5.9:1 |
| `--color-info-soft` | — | `#E0F2FE` + ข้อความ `#0369A1` (≈ 5.2:1) | tip/ข้อมูลเสริม |
| `--color-warning` (พื้นผิว) / ข้อความ | `#F59E0B` | พื้นผิว `#F59E0B`, **ข้อความ `#B45309` บน `#FEF3C7`** (≈ 4.5:1) | `#F59E0B` เป็นตัวอักษรบนขาว ≈ 2.2:1 ไม่ผ่าน |
| `--color-danger` (พื้นผิว) / ข้อความ | `#EF4444` | พื้นผิว `#EF4444`, **ข้อความ `#B91C1C`** (≈ 6.5:1) บน `#FEE2E2` (≈ 5.3:1) | `#EF4444` บนขาว ≈ 3.8:1 ใช้กับตัวอักษรใหญ่/ไอคอนเท่านั้น |
| `--color-text` | — | `#1C1917` | ≈ 17:1 |
| `--color-text-muted` | Neutral `#78716C` | `#78716C` | ≈ 4.75:1 ใช้ได้กับ ≥ 14 px |
| `--color-text-disabled` / เส้น/ไอคอนรอง | Tertiary `#A8A29E` | ใช้เฉพาะ border/ไอคอน/สถานะ inactive | **ห้ามใช้เป็นข้อความ** (≈ 2.5:1) |

- ต้องออกแบบ **Dark mode** เอง (BudgetZen ระบุว่ามีโหมด Light/Dark แต่ต้องคำนวณ contrast ใหม่ด้วยชุดสีเดียวกัน): พื้น `#0F1412`-โทนเขียวเข้มเทา, surface `#171D1A`, brand `#34D399` สำหรับพื้นผิว/ข้อความ, ตรวจ AA ทุกคู่สี
- ตรวจ contrast อัตโนมัติด้วยสคริปต์ (ทดสอบทุกคู่ foreground/background ที่ประกาศใน tokens) และให้ CI ล้มถ้าคู่ที่ใช้กับข้อความต่ำกว่า 4.5:1 (ข้อความใหญ่/UI component 3:1)
- **สถานะต้องมีข้อความกำกับเสมอ ไม่พึ่งสีอย่างเดียว** (ตามเดิม)
- ใช้สีแดงเฉพาะ "เกินกำหนด/ผิดพลาด/การลบ" อย่าให้แดชบอร์ดเป็นสีแดงเป็นส่วนใหญ่ (สอดคล้อง Don't ของ BudgetZen); เตือนล่วงหน้าใช้เหลืองอำพัน

**Typography**
- BudgetZen ระบุ Manrope (หัวข้อ), Nunito (เนื้อหา), Source Code Pro (โค้ด) — **สามตัวนี้ไม่มีอักษรไทย** จึงต้องจับคู่ฟอนต์ไทย:
  - Heading: `Manrope` + `Noto Sans Thai` (หรือ `IBM Plex Sans Thai`) เป็น fallback
  - Body/UI: `Nunito` + `Noto Sans Thai`
  - Mono (รหัสอาคาร/เลขที่เอกสาร): `Source Code Pro`
- **Self-host เท่านั้น** (`next/font/local` พร้อมไฟล์ฟอนต์ใน repo, ตรวจสิทธิ์ใช้งานของแต่ละฟอนต์ — Manrope/Nunito/Noto Sans Thai/Source Code Pro ใช้ OFL) เพื่อให้ทำงานบนเครือข่ายภายในและ CSP `font-src 'self'` เดิม; ห้ามโหลดจาก Google Fonts ตอนรันไทม์
- สเกลตามที่ BudgetZen กำหนดเป็นฐาน แต่ปรับให้กระชับสำหรับงานข้อมูลหนาแน่น: Display 36/ExtraBold, Headline 28/Bold, Subhead 20/SemiBold, Body 16 (ตารางข้อมูลใช้ Body Small 14), Caption 12/SemiBold, Overline 11/Bold
- **ภาษาไทย:** `line-height` เนื้อหา ≥ 1.6, หัวข้อ ≥ 1.35 (ป้องกันวรรณยุกต์/สระถูกตัด), ห้ามใช้ `letter-spacing` ติดลบกับข้อความไทย, ตัดบรรทัดด้วย `word-break: normal; overflow-wrap: anywhere` เฉพาะที่จำเป็น และทดสอบกับข้อความไทยยาว ๆ

**Spacing / Shape / Elevation**
- ฐาน 8px (BudgetZen) — ใช้ scale 4/8/12/16/24/32/48; ตารางข้อมูลมีโหมด **Comfortable / Compact** (ผู้ใช้เลือกเอง เก็บใน preference ต่อผู้ใช้) เพื่อรองรับงานปริมาณสูง
- มุมโค้งมนตามสไตล์ BudgetZen: ปุ่ม/ช่อง 10–12 px, การ์ด 16 px, chip เต็มวงรี — **แต่ห้ามการ์ดซ้อนการ์ด** (AGENTS.md)
- เงา 4 ระดับ (Subtle/Medium/Large/Overlay) เบา ๆ ไม่ใช้ glow/gradient ตกแต่ง
- Motion: ≤ 150–200 ms, เฉพาะ feedback ที่มีความหมาย; เคารพ `prefers-reduced-motion`; **ไม่ทำ confetti/ฉลองความสำเร็จ** ในงานปฏิบัติการ (ข้ามข้อ "milestone animations" ของ BudgetZen) ใช้ progress bar และข้อความสรุปที่สงบแทน

### 7.2 Component library (`src/components/ui/`)
ทำให้เป็นชุดเดียวที่โมดูลทั้งหมดใช้ร่วมกัน พร้อมหน้า **Storybook-like gallery** ที่ `/dev/ui` (เปิดเฉพาะ development) และ visual test:

`Button` (primary/secondary/ghost/destructive, loading state, ขนาด sm/md), `IconButton`, `Input/Select/Textarea/DatePicker/MoneyInput` (label, hint, error, จำนวนหลักตัวเลขไทย/อาหรับ), `Checkbox/Radio/Switch`, `Card` (Card Title + body ตาม BudgetZen), `Chip/StatusBadge` (On Track/At Risk/Over → แปลงเป็น "ตามแผน / ใกล้เกินกำหนด / เกินกำหนด" ฯลฯ พร้อมข้อความ), `DataTable` (เรียง กรอง เลือกหลายแถว sticky header, เลื่อนแนวนอนในกรอบของตัวเอง, virtualize เมื่อ > 200 แถว, บันทึก saved views), `Tabs`, `Dialog/ConfirmDialog` (ใช้ `<dialog>`), `Drawer`, `Toast`, `Tooltip`, `Progress`, `EmptyState`, `ErrorState`, `Skeleton`, `PageHeader` (breadcrumb + actions), `Pagination`, `CommandPalette`, `Stepper`, `Timeline`, `Avatar`, `KeyboardShortcutHint`
- ทุก component มี type, ตัวอย่าง, test (React Testing Library หรือ Playwright component), และเอกสารสั้นใน `docs/product/design-system.md` (อัปเดตให้เป็นปัจจุบัน — ไฟล์ `DESIGN-SYSTEM.md` ที่ root เป็นของเก่า ให้ย้ายไป `docs/archive/`)

### 7.3 Shell และ Navigation
- Top bar: โลโก้/ชื่อระบบ, ค้นหากลาง (`Ctrl/⌘+K`), แจ้งเตือน, สลับธีม, เมนูบัญชี (โปรไฟล์, เปลี่ยนรหัสผ่าน, ความหนาแน่น, ออกจากระบบ)
- Sidebar จัดกลุ่มตาม `group`, พับได้, จำสถานะ, แสดง "ขอบเขตสิทธิ์" ของผู้ใช้แบบเข้าใจง่าย (มีอยู่ ให้ทำให้อ่านง่ายขึ้น), มือถือใช้ dialog เมนูเดิม แต่ตรวจ focus trap และปุ่มปิด
- **Breadcrumb + PageHeader** ทุกหน้าย่อย; ปุ่มหลักของหน้าอยู่ตำแหน่งคงที่
- **หน้าแรก (Dashboard) แบบ "หนึ่งเหลือบตาเห็นสิ่งสำคัญ"**: การ์ดสรุป 3–4 ใบ (งานที่ต้องทำวันนี้, เกินกำหนด, รอฉันอนุมัติ, ข้อความเตือน), รายการ "ต้องติดตาม" เรียงตามความเร่งด่วน, ลิงก์ลัดของโมดูลที่มีสิทธิ์; ใช้ progressive disclosure — ไม่โชว์ตัวเลขมากเกินไป (ตรงกับ Don't ของ BudgetZen) แต่ตัวเลขสำคัญต้องอยู่ในหนึ่งเหลือบมอง
- **Keyboard-first**: shortcut หลัก (`g` แล้ว `w/b/g` ไปโมดูล, `/` โฟกัสค้นหา, `n` สร้างใหม่, `?` แสดงรายการ shortcut), focus order ถูกต้อง, มี skip link (มีแล้ว)

### 7.4 น้ำเสียงและข้อความ (Tone of voice)
ปรับตาม Do's ของ BudgetZen ให้เหมาะกับงานองค์กร: ให้กำลังใจ ชัดเจน ไม่กล่าวโทษ
- แทน "คุณไม่มีสิทธิ์" → "บัญชีนี้ยังไม่ได้รับสิทธิ์สำหรับส่วนนี้ ขอสิทธิ์จากผู้ดูแลได้ที่ปุ่มด้านล่าง"
- แทน "เกินกำหนด 3 งาน" ที่เป็นสีแดงจ้า → "มี 3 งานที่ควรเร่งดำเนินการ" (ใช้สีเหลืองอำพันสำหรับใกล้กำหนด, แดงเฉพาะเกินกำหนดจริง)
- Empty state ต้องบอกว่า "ทำอะไรต่อได้" (มีปุ่ม), Error state ต้องมีรหัสอ้างอิง (digest/requestId) ให้ผู้ใช้แจ้งแอดมินได้
- สร้างไฟล์ `src/lib/copy.ts` (หรือ i18n dictionary) รวมข้อความที่ใช้ซ้ำ เพื่อความสม่ำเสมอ และเตรียมรองรับภาษาอังกฤษในอนาคต

### 7.5 หน้าที่ต้องออกแบบ/ปรับ (รายการตรวจ)
1. **Login**: ตัดข้อความ "Argon2id · RBAC" ออกจากหน้า (เป็นภาษาของนักพัฒนา) ใส่ช่องทางติดต่อผู้ดูแลแทน, ปุ่มแสดง/ซ่อนรหัสผ่าน, เตือน Caps Lock, ข้อความผิดพลาดกลาง, รองรับ `?next=`
2. **Change password**: แสดงเกณฑ์รหัสผ่านแบบ checklist ที่อัปเดตสด, ตัววัดความแข็งแรง
3. **403 / 404 / 500 / global-error / maintenance**: สร้าง `not-found.tsx`, `global-error.tsx`, ปรับ `error.tsx` (แสดง digest), `AccessDenied` มีปุ่ม "ขอสิทธิ์"
4. **Dashboard, Work, Buildings, Guarantees, Admin** ตามหลักข้างต้น
5. **เมตาดาต้า**: favicon + app icon (`src/app/icon.*`, `apple-icon.*`), `manifest`, title รายหน้า (`generateMetadata`), `robots` = disallow (ระบบภายใน)
6. **พิมพ์/เอกสาร**: หน้าที่ต้องพิมพ์ (ใบเสนอราคา, สรุปเงินประกัน) มี print stylesheet
7. **การแจ้งเตือน**: จัดกลุ่มตามโมดูล/ความเร่งด่วน, อ่านทั้งหมด, ลิงก์ไปยังรายการ (destination route ต้องตรวจสิทธิ์ซ้ำ ตามเอกสาร)

### 7.6 Accessibility (WCAG 2.2 AA) — เกณฑ์ผ่านที่ตรวจได้
- รัน `axe` ผ่าน Playwright บนหน้าหลักทุกหน้า ทั้ง Light/Dark และ 3 ขนาดจอ (1440, 1024, 390) — ไม่มี violation ระดับ serious/critical
- โฟกัสมองเห็นชัด (มี `:focus-visible` แล้ว ตรวจให้ครบทุก component), ขนาด target ≥ 24×24 px (แนะนำ 44 บนมือถือ), รองรับซูม 200%/reflow 320 px, `prefers-contrast: more` และ `prefers-reduced-motion`
- ตาราง: `scope`, caption, ป้ายบอกการเรียง (`aria-sort`); ฟอร์ม: label ผูกกับ input, error ผูกด้วย `aria-describedby`, แจ้งผลด้วย live region
- ทดสอบด้วยคีย์บอร์ดล้วนตาม flow หลักและบันทึกผลใน `docs/quality/accessibility-performance.md`

### 7.7 ประสิทธิภาพ
- เป้า: หน้าหลักโหลดใช้งานได้ < 2 วินาทีบนเครือข่ายองค์กร, interaction feedback 100–200 ms, ลด JS ฝั่ง client (Server Components เป็นค่าตั้งต้น), lazy-load แผนที่/กราฟ
- ตารางใหญ่: server-side pagination/sort/filter + virtualize; หลีกเลี่ยงการดึงทั้งตาราง (TD-014)
- วัดด้วย Lighthouse CI/Playwright trace และบันทึกผล

**Acceptance ของ Phase 4:** ทุกหน้าใช้ tokens ชุดเดียว (ไม่มี hex ตรงใน component/หน้า ยกเว้นใน tokens), ผ่าน axe, ผ่านเช็ค contrast อัตโนมัติ, มี screenshot ก่อน/หลังของหน้าหลักทุกหน้า (Light/Dark, Desktop/Mobile) แนบใน PR, `globals.css` ลดขนาดและไม่มี token alias ซ้อน

---

## 8. Phase 5 — คุณภาพ การทดสอบ และการนำขึ้นระบบ (Production readiness)

### 8.1 ทดสอบกับ PostgreSQL จริง (G10)
- เพิ่ม `docker-compose.dev.yml` (Postgres) และ **service Postgres ใน `.github/workflows/quality.yml`**
- สคริปต์ `npm run test:integration` รัน migration ทั้งหมดบนฐานว่าง → seed → ทดสอบ: `loadSubject`, RBAC/data scope ต่อ query, admin actions ทุกตัว, login/lockout/session, guardrail admin คนสุดท้ายแบบ concurrent, trigger จำกัดวงเงินคืนของ guarantee, RLS (ถ้าใช้บทบาท DB ที่ไม่มี `BYPASSRLS`)
- ตรวจ migration ให้ **รันซ้ำได้/เรียงลำดับถูก/มี down หรือแผน rollback** และเพิ่ม test drift ระหว่าง `src/db/schema.ts` กับ SQL migration (TD-011)

### 8.2 End-to-end (Playwright)
สร้าง `playwright.config.ts` และชุด e2e อย่างน้อย: login → เปลี่ยนรหัส → dashboard ตามสิทธิ์; flow ของแอดมิน §4.6; สร้างงาน → เปลี่ยนสถานะ → ปรากฏใน KPI/กิจกรรม; ค้นหาอาคาร → ดูเอกสาร; สร้างเคสเงินประกัน → อัปโหลดหลักฐาน → เปลี่ยนสถานะ; สิทธิ์ถูกถอนกลางคัน → ผู้ใช้ถูกเด้ง; ความปลอดภัย: เข้า URL/API ที่ไม่มีสิทธิ์ต้องได้ 403/404 ไม่รั่วข้อมูล

### 8.3 CI/CD
- ขยาย `quality.yml`: lint, typecheck, unit, integration (Postgres), e2e (headless), build, `npm audit --omit=dev`, ตรวจ contrast, ตรวจ secret (gitleaks), ตรวจ dependency บน PR
- ตั้ง `dependabot`/renovate สำหรับ dependency ส่วน `drizzle-kit` (TD-019) ให้อยู่ใน devDependencies เท่านั้นและไม่ถูกติดตั้งใน image production

### 8.4 การนำขึ้นระบบ (on-premise ตาม `docs/operations/on-premise-deployment.md`)
- `Dockerfile` แบบ multi-stage (non-root, `output: "standalone"`, healthcheck ที่ `/api/health`) + `docker-compose.prod.example.yml` (app + Postgres + reverse proxy ตัวอย่าง)
- `/api/health` แยก **liveness** (ไม่แตะ DB) กับ **readiness** (แตะ DB); ไม่คืนรายละเอียดภายในให้ผู้เรียกที่ไม่ยืนยันตัวตน
- Runbook ที่ซ้อมได้จริง: backup/restore (สคริปต์ `pg_dump` + ตรวจกู้คืนอัตโนมัติ), การอัปเกรด/rollback, การหมุน secret, break-glass admin, เหตุการณ์ด้านความปลอดภัย, การเก็บ audit (retention ตาม OQ-003)
- Observability: structured log (มี `logger.ts` แล้ว — ใช้ให้ทั่วแทน `console.error`), request-id ต่อคำขอ, metric พื้นฐาน, การแจ้งเตือนเมื่อ outbox/automation ค้าง
- Worker สำหรับ outbox/automation (ตาม `docs/architecture/event-catalog.md`): process แยกหรือ scheduled job พร้อม retry/dead-letter และหน้าตรวจสถานะใน `/admin`
- **ห้ามประกาศ "พร้อม production"** จนกว่าจะมีหลักฐาน: integration test ผ่านบน Postgres จริง, ซ้อม restore สำเร็จ, ตรวจ accessibility แล้ว, ได้รับการยืนยันจากเจ้าของโมดูล (UAT)

---

## 9. Phase 6 — ความเรียบร้อยของ Repo และเอกสาร

1. ย้ายไฟล์แผน/บันทึกเก่าออกจาก root ไป `docs/archive/`: `PERMISSION_NEXT_PROFESSIONAL_REBUILD.md`, `PERMISSION_NEXT_FRESH_SOURCE_PARITY_AUDIT.md`, `PLAN-super-app.md`, `DESIGN-SYSTEM.md` (เก่า) — เหลือใน root: `README.md`, `AGENTS.md`, `CODEX-MASTER-PLAN.md`, `ARCHITECTURE-BASELINE.md`, `MICROSOFT365-CONNECTION.md` (ถ้ายังใช้)
2. `mods/permission-next/Permission_Next.html` (340 KB) และ `dev-server.js` เป็นของระบบเก่า → ย้ายไป `legacy/` พร้อม README บอกสถานะ; ตรวจว่า `test:documents` ยังอ้างถึงถูกต้อง
3. ตรวจ `.jev/`, `.impeccable.md` (ซ้ำกับ `AGENTS.md`) — รวมหรือลบส่วนซ้ำโดยบันทึกในเอกสาร
4. **อัปเดตเอกสารให้ตรงโค้ดปัจจุบัน:** ลบ/แก้ TD-012 (ตอนนี้ `getDb()` ใช้ singleton แล้ว), ลบการอ้างถึง Supabase Auth/RLS ที่ไม่ใช่ runtime ปัจจุบัน (ADR-0003), ทำ **ตาราง "สถานะจริง"** ใน `docs/implementation-status.md` ที่อ้างหลักฐานได้
5. `.env.example`: เปลี่ยนค่า SharePoint hostname/site path และพาธไดรฟ์จริง (`D:\...`, `P:\...`) เป็นค่าตัวอย่างสมมติ (`example.sharepoint.com`, `/path/to/...`); เพิ่มตัวแปรใหม่ (`TRUSTED_PROXY_*`, idle timeout ฯลฯ) พร้อมคำอธิบาย และตรวจทุกตัวแปรด้วย zod (`src/lib/env.ts`) ให้ **ล้มตั้งแต่บูต** เมื่อค่าที่จำเป็นบน production ขาด
6. `README.md`: เขียนใหม่ให้ผู้ดูแลใหม่ติดตั้งได้ตั้งแต่ศูนย์ (ข้อกำหนด, ตัวแปร, migrate, bootstrap, รันด้วย Docker, สำรอง/กู้คืน, คู่มือแอดมินฉบับย่อพร้อมภาพหน้าจอ)
7. เพิ่ม `SECURITY.md` (ช่องทางแจ้งช่องโหว่), `CONTRIBUTING.md` (branch/commit/gate), `CHANGELOG.md`
8. ตั้ง `.gitattributes`/`.editorconfig` ให้ไฟล์เป็น UTF-8 และปลายบรรทัดสม่ำเสมอ (repo มีเส้นทางแบบ Windows และข้อความไทย)

---

## 10. ตารางกำหนดสิทธิ์เริ่มต้น (แนวทาง ห้ามลดสิทธิ์เดิมโดยไม่บอก)

ให้ Codex ตรวจสิทธิ์ที่มีอยู่จริงใน `src/lib/capabilities.ts` และ migration แล้วจัดทำตาราง "role × capability" ใน `docs/modules/admin.md` โดย:
- `platform_admin`: ทุกอย่าง + จัดการผู้ใช้/บทบาท/โมดูล/ความปลอดภัย/audit
- `operations_manager`: ดู/จัดการงานและเคสในขอบเขตทีม, อนุมัติตามโมดูล, ดู audit เฉพาะโมดูลตนเอง (ถ้าอนุญาต)
- `permission_specialist`: อาคาร/เอกสาร/ใบเสนอราคา ในขอบเขตที่ได้รับ
- `sales_operator`: งานของตนเอง (`OWN`) และข้อมูลอาคารแบบอ่าน
- `viewer`: อ่านอย่างเดียว
- `guarantee_tl`: ทำงานเฉพาะเคสที่ถูกมอบหมาย (`OWN`)
> ตารางข้างต้นเป็นเพียงแนวทางเริ่มต้นเพื่อการตรวจเทียบ — **ให้ยึดตามของจริงในระบบและสอบถามเจ้าของระบบก่อนเปลี่ยนสิทธิ์ตั้งต้นใด ๆ**

---

## 11. ลำดับการทำงาน และเกณฑ์จบแต่ละ Phase

| ลำดับ | Phase | เนื้อหา | เกณฑ์จบ (ทุกข้อต้องผ่าน) |
|---|---|---|---|
| 0 | เตรียม | `jev_health`, อ่านเอกสาร, ตรวจ current HEAD/working tree, รัน gate ปัจจุบัน, ตั้ง Postgres dev, สร้าง branch | baseline ใหม่ถูกบันทึก, ไม่มี user change ถูกทับ |
| 0.5 | §5.0 Fresh Source Freeze (read-only) | ตรวจ 3 source repos, lock SHA, feature/workflow/calculation/role/UX inventory, parity matrices | มี parity + UX baseline ครบ 3 module, `jev_evidence_check` ผ่าน, **ยังไม่ทำ UI redesign** |
| 1 | §3 Security hardening | G1–G8 | test ครอบทุกข้อ, ไม่มีทางเข้าที่ข้ามการตรวจ |
| 2 | §8.1–8.3 (ส่วนแรก) | Postgres ใน CI + integration test พื้นฐาน + Playwright config | integration ผ่านบน CI |
| 3 | §4 Admin self-service | ทุกข้อใน §4.2–4.6 | ผ่าน e2e ของ §4.6 |
| 4 | §7.1–7.2 | Tokens + component library | ผ่านเช็ค contrast, มี gallery |
| 5 | §5.2 Work module | แก้ G9 + ฟีเจอร์ parity | parity matrix + test จาก fixture ต้นทาง |
| 6 | §5.3, §5.4 | Buildings, Guarantees | เช่นเดียวกัน |
| 7 | §6 Future modules | SDK/generator/โมดูลตัวอย่าง | สร้างโมดูลตัวอย่างด้วยคำสั่งเดียวแล้วเห็นใน Admin/เมนู/ค้นหา |
| 8 | §7.3–7.7 | Shell, หน้าหลัก, a11y, perf | axe สะอาด, screenshot ก่อน/หลัง |
| 9 | §8.4, §9 | Docker, runbook, ล้าง repo/เอกสาร | ซ้อม backup/restore ได้, README ใช้ติดตั้งจริงได้ |

---

## 12. รูปแบบรายงานเมื่อจบแต่ละ Phase (ต้องแนบทุกครั้ง)

```
## Phase <n> — <ชื่อ>
### สิ่งที่ทำ (ไฟล์หลักที่แก้/เพิ่ม)
### หลักฐาน (คำสั่งที่รัน + ผลลัพธ์สรุป)
### Source parity / source SHA ที่ใช้ (ถ้าเกี่ยวข้อง)
### JEV ที่ใช้ (route/prioritize/evidence/risk/error/continue) และข้อสรุปที่นำไปใช้
### สิ่งที่ยังไม่ได้ยืนยัน / ข้อสมมติ / คำถามที่ต้องให้เจ้าของระบบตอบ
### ความเสี่ยงและวิธี rollback
### ผลกระทบต่อสิทธิ์/ข้อมูลเดิม (ถ้ามี)
```

## 13. สิ่งที่ห้ามทำ (สรุป)
- ห้ามใส่ค่าธุรกิจที่ยังไม่ได้รับอนุมัติ (ภาษี, KPI weights, นิยามคืนเงิน) เป็นค่าจริง
- ห้ามเชื่อ client เป็นหลักฐานของสิทธิ์
- ห้ามลด/ข้ามการตรวจสิทธิ์เพื่อให้ test ผ่าน
- ห้ามเพิ่ม CSS override theme ใหม่ทับของเดิม
- ห้ามใช้ `Number` กับเงิน, ห้ามเก็บ secret/รหัสผ่านใน repo หรือ log
- ห้ามแตะข้อมูลหรือระบบ production/ภายนอก, ห้ามลบ legacy โดยไม่ได้รับการยืนยัน
- ห้ามเขียนว่า "เสร็จ/ปลอดภัย/พร้อม production" โดยไม่มีหลักฐานที่รันได้จริง
---

## 14. คำสั่งเริ่มงาน Codex (Master Start Command)

ใช้ข้อความนี้เมื่อเปิด repo ใน Codex App:

```text
Read AGENTS.md and CODEX-MASTER-PLAN-V2.md completely before modifying any file.

This is an end-to-end Permission Next Super App recovery and professionalization task.
Do not treat the existing SuperApp implementation as feature-complete merely because schemas or domain helpers exist.

Authoritative module sources:
- Kobpatme/maxiwa @ approved baseline 94742a4 -> /guarantees
- Kobpatme/Permission_Next @ approved baseline afaee99 -> /buildings
- Kobpatme/maxiwa_KPI @ approved baseline 4f5fa99 -> /work

Target repository audited baseline:
- Kobpatme/SuperApp-PERMISSION_NEXT @ 6ccef5b

FIRST, DO NOT CODE.

1. Call jev_health with check_network=true and the absolute project_path when .jev/config.json exists.
2. Inspect git status, current branch, current HEAD, uncommitted user work and repository instructions.
3. Run the current quality baseline and record fresh results; historical test counts in the plan are snapshots only.
4. Inspect all three authoritative source repositories directly and compare approved baseline SHA vs current main.
5. Complete Phase 5.0 Fresh Source Freeze: feature, screen, workflow, calculation/report, role/use-case and UX inventories.
6. Update source-parity.md + source-ux-baseline.md for Work/KPI, Buildings and Guarantees.
7. Use jev_evidence_check before declaring parity status and jev_prioritize to order missing work.
8. Only after the parity evidence exists, start safe implementation phases in the order defined by the master plan.

Important behavior:
- Preserve source feature/workflow/calculation/user mental models.
- Do NOT copy legacy security architecture, browser-side authorization, hard deletes, public file access or duplicated identity stores.
- SuperApp remains the authority for authentication, server-side RBAC/data scope, PostgreSQL, audit/activity/outbox, notification and secure file access.
- Admin must manage normal users/roles/permissions/module access/data scope through UI without editing the database.
- Do not flatten Work/KPI, Buildings and Guarantees into one generic queue UI.
- Do not begin by redesigning colors/cards. Source parity comes before visual consolidation.

Use JEV:
- jev_route before major implementation paths
- jev_prioritize for gaps
- jev_evidence_check for parity/architecture conclusions
- jev_risk before auth/RBAC/KPI/SLA/financial/workflow/migration/destructive changes
- jev_classify_error for unclear failures
- jev_continue after checkpoints

JEV is advisory only. Source code and deterministic verification win. Never send secrets or production data to JEV.

Work autonomously through safe phases. Do not stop merely because a phase completed. Stop only for production mutation/deployment/credentials, irreversible destructive migration, conflicting authoritative business rules, an unresolved owner decision, or genuinely unavailable evidence. Record non-blocking blockers and continue independent work.

After every coherent phase run the required quality gates, inspect the diff, update docs/implementation-status.md and the relevant parity documents, then continue when safe.

Do not modify production data or external production systems.
Do not claim migrated/secure/production-ready without executable evidence.

Start now with JEV health + fresh baseline + Fresh Source Freeze.
```

### 14.1 Definition of success สำหรับ Codex

งานนี้ไม่ถือว่าสำเร็จเมื่อ “หน้าตาดีขึ้น” หรือ “build ผ่าน” เท่านั้น แต่ต้องมีหลักฐานว่า:

- source parity matrix ของทั้ง 3 module ถูก review และไม่มี feature สำคัญหายเงียบ ๆ
- Work/KPI กลับมามี role/task/performance experience ตามต้นทางใน native architecture
- Buildings กลับมามี operational CRUD/duplicate/BOQ/quotation/document capabilities ตามที่อนุมัติ
- Guarantees reconcile กับ source ล่าสุดทั้ง workflow/financial/TL/On Service/Off Service/notification/dashboard
- Admin จัดการ access ปกติได้จาก UI โดยไม่แตะ DB
- module ใหม่ในอนาคตเพิ่มผ่าน contract/manifest ได้โดยไม่แก้ core หลายจุด
- security/RBAC/audit/data scope ไม่ถดถอย
- import/backfill มี reconciliation + idempotency evidence
- lint/typecheck/unit/document/integration/e2e/build gates ที่เกี่ยวข้องผ่านจริง
- UAT ของเจ้าของโมดูลยังเป็นเงื่อนไขก่อนประกาศ production-ready


