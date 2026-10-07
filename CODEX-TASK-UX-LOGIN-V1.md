# CODEX TASK — UX/UI ระดับมืออาชีพ + หน้าล็อกอิน + กำจัดข้อความระบบ (V1)

> **ใช้กับ:** `Kobpatme/SuperApp-PERMISSION_NEXT`
> **ประเภทไฟล์:** คำสั่งงานเฉพาะกิจ (task spec) — ใช้ร่วมกับ `AGENTS.md` และ `CODEX-MASTER-PLAN-V2.md` ไม่ได้แทนที่
> **ที่วางไฟล์:** root ของ repo เป็น `CODEX-TASK-UX-LOGIN-V1.md`
> **เพิ่มบรรทัดใน `AGENTS.md`:** `For UX/UI, login and user-facing copy tasks, also read CODEX-TASK-UX-LOGIN-V1.md.`
> **ภาษา:** ข้อความที่ผู้ใช้เห็นทั้งหมดเป็นภาษาไทย / โค้ด ชื่อตัวแปร commit message เป็นภาษาอังกฤษ

---

## 0. ลำดับความสำคัญของเอกสาร (อ่านก่อนทำอะไร)

เมื่อเอกสารขัดกัน ให้ใช้ลำดับนี้ (ข้อบนชนะข้อล่าง):

1. **§3 กติกาเหล็กของไฟล์นี้** และ Non-negotiables ใน `CODEX-MASTER-PLAN-V2.md` §2 (ความปลอดภัยไม่มีการประนีประนอม)
2. **§2 การตัดสินใจของเจ้าของระบบ** ในไฟล์นี้ (ชนะ Master Plan §7.1 เรื่องสีและ §7.1 เรื่อง motion — ดูรายละเอียดใน §2)
3. `AGENTS.md` (Design Principles) และ `CODEX-MASTER-PLAN-V2.md` ส่วนที่ไม่ขัดกับข้อ 1–2
4. โค้ดจริงใน repo ณ HEAD ปัจจุบัน — **ชนะเอกสารทุกฉบับในเรื่อง "สถานะปัจจุบัน"**

> **คำเตือนสำคัญ:** Master Plan §1 (ตาราง G1–G14) เป็น snapshot เก่า บางข้อถูกแก้ในโค้ดแล้ว (เช่น G1–G4 ใน `src/app/login/actions.ts` มี generic error, dummy Argon2 hash, rate limit, audit login แล้ว) **ห้ามเขียนซ้ำหรือรื้อสิ่งที่ทำไว้ถูกต้องแล้ว** ให้ตรวจโค้ดจริงก่อนทุกครั้ง แล้วบันทึกว่า "verified-done" พร้อมหลักฐาน

---

## 1. เป้าหมายและขอบเขต

### ต้องทำ (In scope)
1. หน้า **ล็อกอิน** และ **เปลี่ยนรหัสผ่านครั้งแรก** — หน้าตาเป็นมืออาชีพ, UX ลื่น, **ไม่มีข้อความระบบ/ศัพท์เทคนิคแม้แต่คำเดียว**
2. **กำจัดข้อความระบบ** ที่หลุดไปถึงผู้ใช้ทั่วไปทั้งแอป (เขียนใหม่เป็นภาษาคน เป็นกันเอง ไม่เป็นทางการเกินไป)
3. **UX/UI ทั้งระบบ**: tokens, ฟอนต์ไทย, ขนาดตัวอักษร, การ์ดข้อความล้น, สถานะ loading/error/empty, motion ที่มีความหมาย
4. **รวม CSS** ที่ซ้อนทับกันให้เป็นระบบเดียวบน tokens
5. งานความปลอดภัย/ประสิทธิภาพ **เล็ก ๆ ที่แตะประสบการณ์ล็อกอินโดยตรง** (§T9)
6. ทดสอบอัตโนมัติ (e2e, a11y, contrast, CSS lint) เพื่อกันถอยหลัง

### ไม่ต้องทำในไฟล์นี้ (Out of scope — ห้ามแตะ)
- กฎธุรกิจ: KPI, SLA, ภาษี, สูตรคำนวณเงิน, workflow คืนเงินประกัน
- Source parity ของโมดูล (Master Plan §5) และ migration/import
- โครงสร้าง RBAC/permission matrix, schema ฐานข้อมูล (ยกเว้นที่ระบุใน §T9 และต้องผ่าน `jev_risk`)
- CSP nonce (Master Plan §3.5) — ทำตาม Master Plan ไม่ใช่งานนี้ แต่ **ห้ามเพิ่ม inline script/style ใหม่** ที่ทำให้ทำ nonce ยากขึ้น
- Deploy / production / ระบบภายนอก (SharePoint, NAS, Firestore) — อ่านอย่างเดียวหรือ fixture local เท่านั้น

---

## 2. การตัดสินใจของเจ้าของระบบ (ล็อกแล้ว — ห้ามตีความเอง)

| # | การตัดสินใจ | ผลต่อการทำงาน |
|---|---|---|
| D1 | **คงโทนน้ำเงินแบบองค์กรเดิม** (`--color-brand: #244fb8` และชุด dark) | **ห้ามนำจานสีเขียว BudgetZen ใน Master Plan §7.1 ไปใช้** ใช้ BudgetZen เฉพาะ *น้ำเสียงข้อความ, รูปทรงมุมโค้ง, ความสงบของ layout* |
| D2 | **ต้องมี motion/animation** ให้ระบบไม่แข็ง | ทำได้ตาม §T7 (ผ่อนข้อห้าม animation ของ AGENTS.md เฉพาะที่มีความหมายและเร็ว) |
| D3 | **ข้อความ UI เป็นกันเอง ไม่เป็นทางการเกินไป** | ใช้ copy bank ใน §T1.4 เป็นต้นแบบน้ำเสียง |
| D4 | **การ์ดที่ข้อความล้นต้องแก้** | §T6 |
| D5 | **ปลอดภัย รวดเร็ว สะดวก สวย** — ต้องไม่ลดความปลอดภัยเพื่อความสวย | ถ้าขัดกัน ความปลอดภัยชนะเสมอ |
| D6 | **ให้ถามก่อนเดา** | ข้อที่ต้องให้เจ้าของตอบอยู่ใน §8 — **บันทึกคำถามแล้วทำส่วนอื่นต่อ** ไม่หยุดทั้งงาน (ตาม Master Plan §0.2) |
| D7 | หน้าล็อกอินต้อง **ไม่มีข้อความระบบ** และ **ดูเป็นมืออาชีพ** | §T1, §T2 |

---

## 3. กติกาเหล็ก (Hard rules)

**ต้องทำเสมอ**
- ทำงานบน branch `codex/ux-login-polish` (หรือแตกย่อย `codex/ux-<task>`) ใช้ Conventional Commits, commit เล็ก ๆ ทีละงาน
- ก่อนแก้โค้ดที่แตะ routing/proxy/server actions/fonts/metadata ให้อ่านคู่มือใน `node_modules/next/dist/docs/` (Next.js 16 ใช้ `src/proxy.ts` ไม่ใช่ middleware)
- ทุกการแก้ผ่านประตู: `npm run lint && npm run typecheck && npm test && npm run test:documents && npm run build` และ `npm audit --omit=dev` ต้องไม่มี vulnerability
- รัน baseline gate **ใหม่** ก่อนเริ่ม และบันทึก HEAD + จำนวน test จริง (ห้ามอ้างตัวเลขจากเอกสารเก่า)
- เขียนข้อความผู้ใช้ผ่าน `src/lib/copy.ts` (สร้างถ้ายังไม่มี ตาม Master Plan §7.4) ไม่ฝังสตริงกระจัดกระจาย
- ใช้ token ใน `src/styles/tokens.css` เท่านั้น — **ห้ามมี hex/rgba สีตรงใน component/หน้า/CSS อื่น**
- ถ้ารันอะไรไม่ได้ (เช่นไม่มี Postgres สำหรับ e2e) ให้เขียนว่า **"ยังไม่ได้ยืนยัน"** พร้อมขั้นตอนยืนยัน — ห้ามเขียนว่าผ่าน

**ห้ามเด็ดขาด**
- ห้ามทำให้ข้อความ error ล็อกอินเปิดเผยว่า "อีเมลนี้มีในระบบหรือไม่" (ยกเว้นกรณีที่ §T1.5 อธิบายไว้และมี test พิสูจน์)
- ห้ามส่งรหัสผ่านกลับไปใน state/response/log/URL ทุกกรณี
- ห้ามลด rate limit, lockout, audit, idle/absolute timeout, `mustChangePassword` enforcement
- ห้ามแสดง stack trace, SQL, path เครื่อง, ชื่อ env, ชื่อตาราง ในข้อความผู้ใช้ (เก็บใน log พร้อม `requestId`)
- ห้ามลบไฟล์ legacy (ย้ายไป `docs/archive/` หรือ `legacy/` พร้อมเหตุผล)
- ห้ามแก้ test ให้ผ่านด้วยการลดความครอบคลุมหรือลดการตรวจสิทธิ์
- ห้ามโหลดฟอนต์/สคริปต์/รูปจากเครือข่ายภายนอกตอนรันไทม์ (CSP `font-src 'self'`; ระบบอาจรันบนเครือข่ายภายใน)
- ห้ามใช้ gradient/glow/glassmorphism ตกแต่ง, ห้ามการ์ดซ้อนการ์ด, ห้ามคอนเฟตตี/ฉลองความสำเร็จ
- ห้ามเพิ่มไฟล์ theme override ใหม่ (Master Plan §7.1)
- ห้ามคอมมิต `.env*`, `.jev/logs/`, ข้อมูลจริงขององค์กร

---

## 4. JEV — สัญญาการใช้งาน (อ่านให้ครบ)

**JEV คืออะไรใน repo นี้:** เครื่องมือ MCP (ตั้งค่าที่ `.jev/config.json`, โปรไฟล์ `web-fullstack`, `privacy_mode: metadata_only`, `allow_source_code: false`) ให้คำแนะนำแบบ *advisory* เท่านั้น

**JEV ไม่ใช่ source of truth** ลำดับความน่าเชื่อถือ: โค้ดจริง → test/typecheck/build → เอกสาร ADR ที่ยังตรง → JEV → ความเห็นของโมเดล
**ห้าม** อ้างว่า "JEV อนุมัติ/ยืนยันว่าปลอดภัย/พร้อมแล้ว" แทนหลักฐานจริง และ **ห้ามแต่งผลลัพธ์ JEV** — รายงานเฉพาะค่าที่เครื่องมือตอบกลับจริง

**ทุกครั้งที่เรียก JEV:** ส่ง `project_path` เป็น absolute path ของ root repo; ส่งเฉพาะ **metadata ที่ผ่านการทำความสะอาดแล้ว** (ชื่อไฟล์, ชื่องาน, จำนวน test, ตัวเลือกการออกแบบ) — **ห้ามส่ง** `.env`, secret, รหัสผ่าน, อีเมลผู้ใช้จริง, connection string, ข้อมูล production, ภาพหน้าจอที่มีข้อมูลจริง, เนื้อหาซอร์สโค้ด

**ถ้า JEV ใช้ไม่ได้** (MCP ไม่ขึ้น/เครือข่ายล่ม/hostname resolve ไม่ได้): บันทึก "JEV unavailable ที่ขั้น X เพราะ Y" ใน `docs/implementation-status.md` และรายงาน แล้ว **ทำงานต่อด้วยหลักฐานจริง** — ห้ามหยุดทั้งงานเพราะ JEV (ลองใช้ CLI fallback ตาม `.jev/config.json` → `mcp.cli_fallback` ถ้าติดตั้งไว้)

### 4.1 ตารางจุดบังคับใช้ JEV (สรุป — รายละเอียดอยู่ในแต่ละงานที่มีเครื่องหมาย 🔶)

| จุด | เครื่องมือ | บังคับ? | ส่งอะไร (sanitized) | เอาผลไปใช้อย่างไร |
|---|---|---|---|---|
| Step 0 ก่อนเริ่ม | `jev_health` (`check_network=true`) | **บังคับ** | `project_path` | ล่ม → บันทึกแล้วไปต่อ |
| ก่อนเริ่มแต่ละ Checkpoint ที่มีหลายทางเลือกในการทำ (CP1, CP3) | `jev_route` | **บังคับ** | เป้าหมาย + ตัวเลือกวิธีทำ 2–3 ทาง (ข้อความสั้น) | เลือกวิธี แล้วบันทึกเหตุผลที่เลือก (ตามหรือไม่ตาม JEV ก็ได้ แต่ต้องมีเหตุผลจากหลักฐาน) |
| ก่อนแก้ `src/app/login/actions.ts`, `src/lib/auth.ts`, `src/lib/auth-rate-limit.ts`, `src/proxy.ts`, `changePasswordAction`, `lastSeenAt`/session | `jev_risk` | **บังคับ** | รายชื่อไฟล์ + สรุปการเปลี่ยนแปลงที่จะทำ (ไม่ส่งโค้ด) | ถ้าได้ risk สูง → เพิ่ม test ก่อนแก้ + เขียน rollback ในรายงาน |
| หลังได้ inventory ข้อความระบบ (§T5) และ audit CSS (§T8) | `jev_prioritize` | **บังคับ** | รายการ item (ชื่อไฟล์ + ประเภท) | จัดลำดับการแก้ |
| ก่อนเขียนว่า "ข้อความระบบถูกกำจัดครบแล้ว" หรือ "CSS ชุดนี้ไม่ได้ใช้แล้ว ลบได้" | `jev_evidence_check` | **บังคับ** | ข้อสรุปที่จะอ้าง + หลักฐานที่มี (ผล grep, ผล test) | ถ้าบอกว่าหลักฐานไม่พอ → หา/รันเพิ่มก่อนสรุป |
| build/test/runtime ล้มและหาสาเหตุไม่ชัด | `jev_classify_error` | เมื่อเกิดเหตุ | ข้อความ error ที่ตัดข้อมูลลับแล้ว | ใช้ช่วยตั้งสมมติฐาน แล้วพิสูจน์ด้วยการรันจริง |
| จบทุก Checkpoint | `jev_continue` | **บังคับ** | สรุปสิ่งที่ทำ + ผล gate | ใช้ตัดสินความพร้อมของ Checkpoint ถัดไป (advisory) |

> ในรายงานท้ายแต่ละ Checkpoint ต้องมีหัวข้อ **"JEV ที่ใช้"** ระบุ: เรียกเครื่องมือไหน, เมื่อไหร่, ได้คำตอบหลัก ๆ อะไร, และ **นำไปใช้หรือไม่ใช้เพราะอะไร**

---

## STEP 0 — เตรียมและพิสูจน์สถานะปัจจุบัน (ห้ามเขียนโค้ดก่อนจบขั้นนี้)

1. 🔶 **JEV:** `jev_health` (`check_network=true`, `project_path` = root แบบ absolute)
2. อ่านให้ครบ: `AGENTS.md`, `CODEX-MASTER-PLAN-V2.md` (อย่างน้อย §0, §2, §3, §7, §12, §13), `docs/product/design-system.md`, `docs/open-questions.md`, `docs/quality/*`, ไฟล์นี้
3. `git status` / `git log -1` — ถ้ามี user change ที่ยังไม่ commit **ห้ามทับ**
4. `npm ci` แล้วรัน gate ทั้งชุด บันทึก HEAD, จำนวน test, ผล build, ผล audit ลง `docs/implementation-status.md`
5. **ตรวจสถานะจริงของงานที่เกี่ยวข้อง** (อ่านโค้ด ไม่เดา) แล้วทำตาราง "verified-done / partial / missing" ของรายการต่อไปนี้ พร้อมไฟล์:บรรทัดเป็นหลักฐาน:
   - login: generic error, dummy hash, rate limit email+IP, audit login, reset `failedAttempts` เมื่อล็อกหมดอายุ
   - `proxy.ts`: redirect พร้อม `next`, API ได้ 401 JSON
   - `mustChangePassword` ถูกบังคับทุกทางเข้า (G5)
   - `PreviewNotice` แสดงเฉพาะ `developmentMode` (ตรวจว่า production build ไม่แสดงจริง)
6. เขียน **แผนสั้น ๆ (ไม่เกินหนึ่งหน้า)** ลง `docs/plans/ux-login-v1.md` แล้ว **ทำต่อทันที** ไม่ต้องรอยืนยัน (Master Plan §0.2)

---

## T1 — หน้าล็อกอิน (`src/app/login/page.tsx`, `src/components/login-form.tsx`, `src/app/login/actions.ts`)

### T1.1 สิ่งที่ต้อง "ไม่มี" บนหน้าล็อกอิน (ห้ามเหลือแม้ในโค้ดที่ render ซ่อน)
ข้อความ/คำเหล่านี้ต้องไม่ปรากฏใน DOM ของ `/login` และ `/change-password`:
`Argon2` · `RBAC` · `ฐานข้อมูล` · `DATABASE` · `NAS` · `session` · `server` · `Workspace` · `Developer` · `readiness` · `foundation` · `Organization Identity` · `SECURE FIRST SIGN-IN` · `stack` · `token`

ที่ต้องลบ/แก้เฉพาะจุด (ตรวจพบแล้ว):
- `login/page.tsx`: บรรทัด security note "ระบบบัญชีภายในองค์กร · รหัสผ่าน Argon2id · สิทธิ์แบบ RBAC" → **ลบ**
- `login/page.tsx`: รายชื่อโมดูล 01–03 ในแผงซ้าย → **ลบ** (คนที่ยังไม่ล็อกอินไม่ควรเห็นโครงสร้างระบบภายใน)
- `login-form.tsx`: ปุ่ม "เข้าสู่ Workspace" → "เข้าสู่ระบบ"
- `login/actions.ts`: "ยังไม่ได้ตั้งค่าฐานข้อมูลภายในองค์กร" และ "…กรุณาตรวจสอบการเชื่อมต่อเซิร์ฟเวอร์" → ใช้ข้อความ §T1.4 (รายละเอียดจริงเก็บใน `console.error`/logger พร้อม `requestId`)

### T1.2 โครงและหน้าตา
- สร้าง `src/components/auth/auth-shell.tsx` ใช้ร่วมกันระหว่างหน้า login และ change-password (ห้ามก๊อปมาร์กอัปซ้ำ)
- Desktop ≥ 900px: สองคอลัมน์ — **ซ้าย** แผงแบรนด์พื้นเรียบสี token แบรนด์เข้ม (สร้าง `--color-brand-deep` ใน `tokens.css` ถ้าจำเป็น; **ไม่ใช้ gradient/glow/วงกลมเรืองแสง**; ลวดลายเรขาคณิตบาง ๆ ด้วย CSS ได้ถ้าไม่รบกวนการอ่าน) มีเฉพาะ: โลโก้ + ชื่อ "Permission Next", พาดหัว, ข้อความรองหนึ่งประโยค **ขวา** การ์ดฟอร์มกว้างไม่เกิน 400px
- Mobile < 900px: ซ่อนแผงซ้าย, แสดงโลโก้เหนือฟอร์ม
- **Semantic/a11y (ตรวจพบบั๊กเดิม):** ตอนนี้ `h1` อยู่ในแผงซ้ายซึ่งถูก `display:none` บนมือถือ ทำให้หน้าไม่มี `h1` → ให้ **หัวข้อของฟอร์มเป็น `h1` เดียวของหน้า** และพาดหัวแผงซ้ายเป็น `p`
- ช่องกรอกสูง ≥ 48px, ปุ่มหลักสูง ≥ 48px เต็มความกว้าง, ป้ายกำกับอยู่เหนือช่อง ขนาด ≥ 14px / น้ำหนัก 600
- แก้ `var(--app-text-soft)` ที่ไม่มีนิยาม (`globals.css` ราว L139) → ใช้ token ที่มีจริง
- เปลี่ยนสีม่วงทั้งหมด (`#6d5ce7`, `#7866eb`, `#a99df5`, `rgba(109,92,231,…)` ฯลฯ) ในกลุ่ม `.auth-*` เป็น `var(--color-brand*)`
- รองรับ Dark mode เต็มรูปแบบ (ทดสอบทั้งสองธีม)
- ไม่มีข้อความตัวอักษร < 12px ในหน้านี้

### T1.3 พฤติกรรม/UX ที่ต้องมี
1. **อีเมลต้องไม่หายเมื่อล็อกอินพลาด** (React 19 รีเซ็ตฟอร์มหลัง action) — ให้ `LoginState` ส่ง `email` กลับ แล้วใช้ `defaultValue` (**ห้ามส่งรหัสผ่านกลับ**) โฟกัสไปที่ช่องรหัสผ่านเมื่อ error เป็นเรื่องรหัสผ่าน
2. **Validation ภาษาไทย**: ใส่ `noValidate` บน `<form>` แล้วตรวจฝั่ง client เพื่อแสดงข้อความใต้ช่อง + **ตรวจซ้ำฝั่ง server เสมอ** (client เป็นแค่ความสะดวก) ใช้ `aria-invalid`, `aria-describedby`, และสรุปผ่าน live region/`role="alert"` ข้อผิดพลาดต้องมีไอคอน/ข้อความ **ไม่พึ่งสีอย่างเดียว**
3. **ปุ่มแสดง/ซ่อนรหัสผ่าน** (`type="button"`, `aria-pressed`, `aria-label` ไทย) — ต้องไม่ทำให้ password manager พัง (คง `autoComplete="current-password"`)
4. **เตือน Caps Lock** (`getModifierState("CapsLock")`) ข้อความข้างช่องรหัสผ่าน
5. **สถานะ pending**: ปุ่ม disabled + spinner + ข้อความ "กำลังตรวจสอบ…", ป้องกันกดซ้ำ
6. **`?next=`**: คงของเดิม (`safeNextPath`) และ **ห้ามผ่อน validation**
7. **แจ้งเหตุที่ถูกพากลับมาหน้าล็อกอิน**: รองรับ `?reason=expired` (เซสชันหมดอายุ) และ `?reason=signed-out` แสดงแถบข้อความนุ่ม ๆ ด้านบนฟอร์ม (ค่าที่ไม่รู้จัก → ไม่แสดงอะไร; ห้ามนำค่า query ไป render ตรง ๆ ให้ map จาก allowlist)
8. ลิงก์/ข้อความช่วยเหลือใต้ฟอร์ม: "เข้าสู่ระบบไม่ได้ หรือลืมรหัสผ่าน? ติดต่อผู้ดูแลระบบ" — **ห้ามแต่งช่องทางติดต่อเอง** ให้อ่านจาก env ที่ตั้งเอง (เช่น `NEXT_PUBLIC_`/server prop `SUPPORT_CONTACT_TEXT`) ถ้าว่างให้แสดงเฉพาะข้อความทั่วไป (ดู §8 ข้อ Q1)
9. `<title>` = "เข้าสู่ระบบ | Permission Next" ผ่าน `metadata` ของหน้า (ระบบทั้งแอปตอนนี้เป็นภาษาอังกฤษ ดู §T6.3)

### T1.4 Copy bank (ใช้ตามนี้ ห้ามแต่งเพิ่มโดยไม่จำเป็น)

| ตำแหน่ง | ข้อความ |
|---|---|
| พาดหัวแผงซ้าย | ทุกงานสำคัญ อยู่ในที่เดียว |
| ข้อความรองแผงซ้าย | เข้าสู่ระบบครั้งเดียว แล้วใช้งานได้ทุกส่วนตามสิทธิ์ของคุณ |
| `h1` ฟอร์ม | ยินดีต้อนรับกลับมา |
| คำอธิบายใต้ `h1` | กรอกอีเมลและรหัสผ่านเพื่อเริ่มงานได้เลย |
| ป้าย/placeholder | อีเมล / `name@company.com` · รหัสผ่าน / กรอกรหัสผ่านของคุณ |
| ปุ่มหลัก / pending | เข้าสู่ระบบ / กำลังตรวจสอบ… |
| อีเมลว่าง | กรุณากรอกอีเมล |
| อีเมลผิดรูปแบบ | รูปแบบอีเมลยังไม่ถูกต้อง เช่น name@company.com |
| รหัสผ่านว่าง | กรุณากรอกรหัสผ่าน |
| ล็อกอินไม่สำเร็จ (ทุกกรณีรวมบัญชีถูกระงับ/ล็อก) | อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชียังไม่พร้อมใช้งาน (**คงข้อความเดิมของโค้ด**) |
| ถูกจำกัดการลอง (§T1.5) | ลองเข้าสู่ระบบหลายครั้งเกินไป กรุณารออีก {n} นาทีแล้วลองใหม่ |
| ระบบขัดข้อง | ตอนนี้เข้าสู่ระบบไม่ได้ กรุณาลองอีกครั้ง หากยังไม่ได้ โปรดแจ้งผู้ดูแลระบบพร้อมรหัสอ้างอิง {รหัส} |
| เซสชันหมดอายุ | เพื่อความปลอดภัย ระบบออกจากระบบให้อัตโนมัติ กรุณาเข้าสู่ระบบอีกครั้ง |
| ออกจากระบบแล้ว | ออกจากระบบเรียบร้อยแล้ว |
| Caps Lock | Caps Lock เปิดอยู่ |
| ปุ่มตา | แสดงรหัสผ่าน / ซ่อนรหัสผ่าน |
| ช่วยเหลือ | เข้าสู่ระบบไม่ได้ หรือลืมรหัสผ่าน? ติดต่อผู้ดูแลระบบ |

### T1.5 ข้อความ "ลองหลายครั้งเกินไป" — ข้อควรระวังด้านความปลอดภัย
`getLoginRateLimit` คืน `retryAfterSeconds` อยู่แล้วแต่ไม่ถูกใช้ ผู้ใช้ที่ถูกบล็อกจึงเห็นแค่ "รหัสผ่านไม่ถูกต้อง" และงง
- แสดงข้อความแยกเฉพาะสาขา **rate-limit blocked** เท่านั้น (คีย์ตามอีเมลที่พิมพ์และ IP ซึ่งถูกนับทั้งกรณีมี/ไม่มีบัญชี จึงไม่เปิดเผยการมีอยู่ของบัญชี)
- สาขา **บัญชีถูกล็อก/ถูกระงับ** ยังต้องตอบ generic เหมือนเดิม
- ต้องมี test: อีเมลที่ "มีจริง" และ "ไม่มี" ได้ข้อความและจำนวนครั้งที่ถูกบล็อกเท่ากัน
- แปลงวินาทีเป็นนาทีด้วย `Math.ceil` และต้องไม่เปิดเผยตัวนับ/ขีดจำกัดจริง

🔶 **JEV:** ก่อนแก้ `login/actions.ts` ให้เรียก `jev_risk` (บังคับ — เป็น Auth) ส่งเฉพาะ: ชื่อไฟล์, "เพิ่ม state ส่งอีเมลกลับ + แยกข้อความ rate-limit + แก้ข้อความ error ระบบ", "ไม่เปลี่ยน logic ตรวจรหัสผ่าน/lockout/audit" · ถ้าได้ risk สูง ให้เขียน test ที่ล็อกพฤติกรรมเดิม (generic error, dummy hash, audit ทุกสาขา) **ก่อน** แก้

### T1.6 เกณฑ์ตรวจรับ T1
- [ ] Playwright: `/login` ไม่มีคำใดในรายการ §T1.1 (ตรวจ `page.content()` แบบ case-insensitive)
- [ ] ล็อกอินผิด → อีเมลยังอยู่ในช่อง, โฟกัสถูกที่, ข้อความอ่านได้ด้วย screen reader
- [ ] ทดสอบ 3 ขนาดจอ (1440 / 1024 / 390) × Light/Dark ไม่มี overflow แนวนอน, ไม่มี console error
- [ ] `h1` มีหนึ่งตัวบนทุกขนาดจอ, axe ไม่มี serious/critical
- [ ] unit/integration test ใหม่ครอบคลุม: generic error ทุกสาขา, rate-limit message, อีเมลถูก echo โดยรหัสผ่านไม่ถูก echo
- [ ] gate ทั้งชุดผ่าน

---

## T2 — หน้าเปลี่ยนรหัสผ่านครั้งแรก (`src/app/change-password/page.tsx`, `change-password-form.tsx`)

1. ใช้ `AuthShell` เดียวกับ T1; ลบข้อความ: "SECURE FIRST SIGN-IN", "Organization Identity", "session เดิมทุกอุปกรณ์จะถูกยกเลิก", และ class `auth-dev-note` (ตั้งชื่อใหม่เชิงความหมาย เช่น `auth-hint`)
2. ข้อความแนะนำ (น้ำเสียงเป็นกันเอง): หัวข้อ "ตั้งรหัสผ่านใหม่ของคุณ", คำอธิบาย "รหัสผ่านชั่วคราวใช้ได้แค่ครั้งแรก ตั้งรหัสผ่านใหม่ที่คุณจำได้ง่ายแต่คนอื่นเดายาก แล้วเริ่มใช้งานได้เลย", ปุ่ม "บันทึกและเข้าใช้งาน"
3. **Checklist เกณฑ์รหัสผ่านแบบอัปเดตสด** (อย่างน้อย 12 ตัว, มีตัวอักษร, ตัวเลข, สัญลักษณ์ — **ดึงกติกาจาก `src/lib/password-policy.ts` เป็นแหล่งเดียว** ห้ามก๊อป regex ไปไว้ฝั่ง client; ถ้าไฟล์นั้นยังเรียกใช้ใน client ไม่ได้ ให้แยกส่วน pure ออกมาโดยไม่เปลี่ยนพฤติกรรม server) พร้อมไอคอน ✓/○ **และข้อความ** (ไม่พึ่งสี)
4. ปุ่มแสดง/ซ่อนรหัสผ่านทั้งสองช่อง, ตรวจ "ยืนยันรหัสผ่านตรงกัน" แบบสด, แสดงผลผ่าน `aria-live="polite"`
5. ตัววัดความแข็งแรงเป็น **optional** — ถ้าทำ ห้ามเพิ่ม dependency ใหม่ (ใช้ checklist เป็นหลัก)
6. ข้อความ error จาก server (`passwordCheck.message`, "รหัสผ่านทั้งสองช่องไม่ตรงกัน") ตรวจให้เป็นภาษาไทยที่เป็นกันเองและไม่เปิดเผยรายละเอียดภายใน
7. **ห้ามเปลี่ยน logic ของ `changePasswordAction`** (ล้าง session ทั้งหมด + สร้างใหม่ + audit ใน `runMaterialChange`) — แก้ได้เฉพาะรูปแบบ state/ข้อความ

🔶 **JEV:** `jev_risk` (บังคับ) ก่อนแตะ `changePasswordAction` แม้เพียงรูปแบบ state · ส่ง: "เปลี่ยนเฉพาะ shape ของ state และข้อความ ไม่แตะ transaction/สิทธิ์"

**ตรวจรับ:** e2e: login ด้วยบัญชี `mustChangePassword` → ถูกพามา `/change-password` → เปลี่ยนสำเร็จ → เข้าแอปได้; checklist อัปเดตสด; ไม่มีคำต้องห้ามตาม §T1.1; axe สะอาด

---

## T3 — Tokens และสี (`src/styles/tokens.css` เป็นแหล่งเดียว)

1. **คงน้ำเสียงสีน้ำเงินเดิม (D1)** ไม่เปลี่ยนค่า `--color-brand*` หลัก; เพิ่มเฉพาะ token ที่ขาด: `--color-brand-deep`, `--color-focus-ring`, `--motion-fast: 120ms`, `--motion-base: 200ms`, `--ease-out`, ระดับเงา ฯลฯ พร้อมคู่ใน dark mode
2. ค้นหาและแทนที่สีม่วง/สีฮาร์ดโค้ดทั้งหมด: `grep -rniE "#(6c5be8|6d5ce7|7866eb|a99df5|5645cb|5d4bd5|6f5de3|8979ef|ece9ff)|rgba\(109, ?92, ?231" src` แล้วย้ายไปใช้ token (ตัวเลขที่พบตอนตรวจ: ~12 จุดใน CSS, ยังมี `#fff` ที่ทำให้ dark mode พังเป็นจุด ๆ เช่น `.card`, `.round-btn`, `.avatar`, `.brand-mark`)
3. สร้างสคริปต์ `scripts/check-css-quality.mjs` + npm script `check:css` ที่ **ล้มเมื่อพบ**: (ก) hex/rgb/rgba/hsl นอก `tokens.css` (ข) `font-size` < 12px สำหรับข้อความ (ยกเว้น overline อักษรละติน 11px ที่ allowlist ไว้ชัดเจน) (ค) `letter-spacing` ติดลบบนข้อความไทย (ง) การอ้าง `var(--x)` ที่ไม่มีนิยาม (จะจับกรณี `--app-text-soft`) แล้วเพิ่มเข้า CI (`.github/workflows/quality.yml`)
4. สคริปต์ตรวจ contrast อัตโนมัติ: ทุกคู่ foreground/background ที่ประกาศใน tokens ต้อง ≥ 4.5:1 (ข้อความใหญ่/UI 3:1) ทั้ง Light/Dark — ให้ CI ล้มถ้าไม่ผ่าน **ห้ามอ้างตัวเลข contrast โดยไม่รันสคริปต์**
5. สถานะต้องมีข้อความกำกับเสมอ ไม่พึ่งสีอย่างเดียว; แดงเฉพาะ "เกินกำหนด/ผิดพลาด/ลบ" จริง

---

## T4 — ฟอนต์และตัวอักษร

ปัญหาที่ตรวจพบ: ใช้ "Segoe UI / Leelawadee UI" (มีเฉพาะ Windows), `'DM Sans','Noto Sans Thai'` ใน `globals.css` ไม่ได้ถูกโหลดจริง, ไม่มี `next/font` ใน repo → บน Mac/มือถือ ภาษาไทยตกเป็นฟอนต์ระบบที่หน้าตาไม่สม่ำเสมอ

1. Self-host ด้วย `next/font/local` (อ่านคู่มือ Next 16 ใน `node_modules/next/dist/docs/` ก่อน) ตาม Master Plan §7.1 Typography: Heading `Manrope` + `Noto Sans Thai`, Body `Nunito` + `Noto Sans Thai`, Mono `Source Code Pro` (ไฟล์ woff2 ใน repo + ไฟล์ license OFL, subset ละติน+ไทย, `font-display: swap`) — **ห้ามโหลดจาก Google Fonts ตอนรันไทม์**
2. กำหนดงบน้ำหนักฟอนต์ที่หน้าล็อกอิน (เป้า ≤ 300 KB รวม woff2 ที่โหลดจริง) แล้วบันทึกค่าที่วัดได้จริง
3. ฐานตัวอักษร: เนื้อหา 14–16px, ข้อความรอง ≥ 12–13px, `line-height` เนื้อหา ≥ 1.6, หัวข้อ ≥ 1.35, **ห้าม `letter-spacing` ติดลบกับข้อความไทย** (ตอนนี้หัวข้อหลายจุดใช้ `-1px` ถึง `-2.5px`)
4. แก้ขนาดเล็กเกินไป: ตอนตรวจพบ `font-size` 8–11px ราว 89 จุดใน `globals.css` (10px 38 จุด, 11px 31 จุด, 9px 15 จุด, 8px 5 จุด) — ปรับให้ผ่านเกณฑ์ใน `check:css`
5. ทดสอบด้วยข้อความไทยยาวต่อเนื่องไม่มีวรรค (ดู §T6)

🔶 **JEV:** `jev_route` ก่อนเลือกวิธีโหลดฟอนต์ถ้ามีมากกว่าหนึ่งทางที่ใช้ได้ภายใต้ CSP เดิม (ส่งเฉพาะตัวเลือก ไม่ส่งซอร์ส)

---

## T5 — กำจัดข้อความระบบในทั้งแอป

### T5.1 ขั้นตอน
1. รัน grep ทั้ง `src/` หาคำเหล่านี้ใน JSX/สตริง: `Argon2|RBAC|ฐานข้อมูล|DATABASE|\bNAS\b|session|Developer|readiness|foundation|read model|outbox|Preview|Data Scope|Effective|เซิร์ฟเวอร์|ตั้งค่า`
2. จำแนกทุกจุดเป็น **A = ผู้ใช้ทั่วไปเห็น**, **B = เฉพาะผู้ดูแล (admin)**, **C = เฉพาะ development**
   - A → เขียนใหม่เป็นภาษาคน (บอกว่าเกิดอะไร + ทำอะไรต่อได้)
   - B → คงรายละเอียดเทคนิคได้ แต่ป้ายเป็นภาษาไทยที่อ่านรู้เรื่อง และแสดงเฉพาะผู้มีสิทธิ์ (ตรวจฝั่ง server)
   - C → ต้องถูกตัดจาก production จริง (test พิสูจน์ด้วย production build)
3. 🔶 **JEV:** `jev_prioritize` (บังคับ) ส่งรายการ item (ไฟล์ + ประเภท A/B/C) → ใช้จัดลำดับการแก้ (แก้ A ที่เห็นบ่อยก่อน)

### T5.2 จุดที่ตรวจพบแล้ว (ตรวจเพิ่มจาก grep ของคุณเองด้วย — ไฟล์นี้อาจไม่ครบ)

| ไฟล์ | ปัญหา | ทิศทาง |
|---|---|---|
| `components/workspace-feedback.tsx` → `SourceDetails` | แสดง "สถานะข้อมูล · เชื่อมต่อ N จาก M ระบบ" และ `source.message` ดิบ ให้ **ทุกคน** (ไม่ได้จำกัดเฉพาะ dev) | ผู้ใช้ทั่วไป: ซ่อนเมื่อทุกอย่างปกติ; เมื่อมีปัญหาแสดงบรรทัดเดียว เช่น "ข้อมูลบางส่วนยังอัปเดตไม่ได้ ลองกด อัปเดตข้อมูล อีกครั้ง"; รายละเอียดต่อโมดูลย้ายไปหน้า admin (ตรวจเนื้อหา `source.message` ก่อนว่าเป็นศัพท์เทคนิคแค่ไหน) |
| `components/workspace-feedback.tsx` → `PreviewNotice` | ถูกจำกัดที่ `developmentMode` อยู่แล้ว — **ไม่ต้องรื้อ** | ตรวจด้วย production build ว่าไม่แสดงจริง + เพิ่ม test |
| `components/deposit-workspace.tsx` (L78, L112), `guarantees/new/page.tsx` (L10) | "ยังไม่ได้ตั้งค่าฐานข้อมูลกลาง", "บัญชี Developer เป็นโหมดอ่านอย่างเดียว" | "ตอนนี้ยังดึงข้อมูลไม่ได้ ลองรีเฟรชอีกครั้ง หากยังไม่ได้โปรดแจ้งผู้ดูแลระบบ" |
| `buildings/buildings-workspace.tsx` (L92–93, 123, 127, 218) | "ใน NAS", "เชื่อมคลังเอกสาร NAS ไม่ได้" | "ยังไม่พบเอกสารของอาคารนี้" / "เปิดเอกสารไม่ได้ในตอนนี้ ลองใหม่อีกครั้ง" / ปุ่ม "ค้นหาใหม่" คงเดิม |
| `components/admin-workspace.tsx` (L67) | "Effective Access Preview", "Data Scope" | "ตัวอย่างสิทธิ์ที่จะได้รับ", "ขอบเขตข้อมูล" (ส่วน B — เป็นไทย อ่านรู้เรื่อง) |
| `components/native-module-foundation.tsx` | `foundation-state` + ตารางเปล่า (ตรวจว่าโมดูลที่ยังไม่พร้อมแสดงอะไรให้ผู้ใช้) | หน้า "ส่วนนี้กำลังเตรียมพร้อม" ที่เขียนเป็นภาษาคน ไม่มีตารางว่างที่ดูเหมือนพัง |
| `components/app-shell.tsx` (`sidebar-scope`) | "ขอบเขตสิทธิ์ที่ได้รับ ตนเอง · ทุกทีม" | "คุณเห็นข้อมูลของ: ตนเอง" (ปรับตาม scope) |
| `app/layout.tsx` | `title`/`description` เป็นอังกฤษและเชิงเทคนิค | ไทย; ใช้ `title.template` เช่น `%s | Permission Next` และ `generateMetadata` รายหน้า |

### T5.3 ข้อความสิทธิ์/ปุ่มขอสิทธิ์
ใช้น้ำเสียงตาม Master Plan §7.4: ไม่กล่าวโทษ บอกทางไปต่อ เช่น "บัญชีนี้ยังไม่ได้รับสิทธิ์สำหรับส่วนนี้ ขอสิทธิ์จากผู้ดูแลได้เลย"

🔶 **JEV:** `jev_evidence_check` (บังคับ) **ก่อน** เขียนว่า "กำจัดข้อความระบบครบแล้ว" — ส่งข้อสรุป + หลักฐาน (ผล grep ก่อน/หลัง, ผล e2e ที่ตรวจ DOM) · ห้ามสรุปจนกว่า grep และ e2e จะสะอาดจริง

**ตรวจรับ:** grep รายการต้องห้ามบนหน้า A เหลือ 0; e2e ตรวจ DOM หน้าหลักของผู้ใช้ระดับ "พนักงานทั่วไป" ไม่พบคำต้องห้าม; production build ไม่แสดงเนื้อหา C

---

## T6 — เลย์เอาต์: ข้อความล้น/ถูกตัด + สถานะ + เมตาดาต้า

### T6.1 การ์ดข้อความล้น (D4)
- จุดที่ตรวจพบ: `.dashboard-action-copy strong/small`, `.record-subtitle`, `.workspace-search-result-copy small` ใช้ `white-space:nowrap` + ellipsis → ข้อมูลสำคัญหาย
- แก้: ใน **การ์ดและรายการ** ให้ตัดบรรทัดได้ (หัวข้อ clamp 2 บรรทัด, รองลงมา clamp 2–3 บรรทัด ด้วย `-webkit-line-clamp` + `min-width:0`) และใส่ `title`/tooltip ที่มีข้อความเต็ม; ใน **ตาราง** ให้ข้อความตัดบรรทัดแทนการซ่อน (ยกเว้นคอลัมน์รหัส/เลขที่ที่ใช้ mono และมี tooltip)
- ข้อความไทยไม่มีวรรค → ใช้ `overflow-wrap:anywhere` ที่ระดับการ์ดเมื่อจำเป็น
- **Fixture ทดสอบ:** ข้อความไทยยาว 120+ ตัวอักษรไม่มีวรรค, ชื่ออาคารยาว, อีเมลยาว, ตัวเลขเงินหลักล้าน — ถ่าย screenshot ที่ 320 / 390 / 1024 / 1440 ต้องไม่มี overflow แนวนอนและไม่ชนกัน

### T6.2 สถานะต่าง ๆ
- `error.tsx` (ปัจจุบันเป็น `queue-empty` ทั่วไป): เพิ่ม **รหัสอ้างอิง** (`digest`/requestId) + ปุ่ม "ลองอีกครั้ง" + "กลับหน้าแรก" ข้อความเป็นกันเอง
- สร้าง `not-found.tsx`, `global-error.tsx` (ยังไม่มีตาม Master Plan G11) ใช้ `AuthShell`-style ที่เรียบ
- `loading.tsx`: skeleton ที่ **ตรงรูปทรงหน้าจริง** (ปัจจุบันเป็นเส้น+กล่องเดียวทุกหน้า) อย่างน้อย dashboard / ตาราง / รายละเอียด
- Empty state ทุกที่ต้องบอก "ทำอะไรต่อได้" พร้อมปุ่ม ไม่ใช่แค่บอกว่าว่าง
- `AccessDenied` มีปุ่ม "ขอสิทธิ์จากผู้ดูแล" (ลิงก์/ข้อความตาม §8 Q1)

### T6.3 เมตาดาต้า
favicon + `icon`/`apple-icon` ใน `src/app/`, `manifest`, `robots` = disallow (ระบบภายใน), title รายหน้าเป็นภาษาไทย

---

## T7 — Motion (D2): ทำให้ระบบมีชีวิตโดยไม่รบกวนงาน

**หลักการ:** motion ต้องมีหน้าที่ — ยืนยันการกระทำ, บอกการเปลี่ยนสถานะ, นำสายตา — ไม่ใช่ตกแต่ง

**ข้อกำหนดทางเทคนิค (บังคับ)**
- ใช้ token `--motion-fast`(120ms) / `--motion-base`(200ms) เท่านั้น ห้ามเกิน **240ms** (ยกเว้นตัวเลขนับขึ้นบน KPI ถ้าทำ ≤ 400ms)
- animate เฉพาะ `transform` และ `opacity` (ห้าม animate `width/height/top/left` ที่ทำให้ layout ขยับ)
- ทุก animation ต้องมี fallback ใน `@media (prefers-reduced-motion: reduce)` (ปิดการเคลื่อนไหวแต่คงการเปลี่ยนสถานะเช่นเปลี่ยนสี/ขอบ)
- ห้าม loop ไม่รู้จบ ยกเว้น spinner/skeleton; ห้าม parallax, confetti, bounce, หรือเอฟเฟกต์ที่ทำให้ผู้ใช้ต้องรอ

**ชุดที่ต้องทำ (ลำดับความสำคัญ)**
1. ล็อกอิน/เปลี่ยนรหัสผ่าน: การ์ดฟอร์มเลื่อนขึ้น+จางเข้า (≤ 240ms), error สั่นเบา ๆ ครั้งเดียว (reduced-motion → แค่ไฮไลต์ขอบ), ปุ่ม pending มี spinner, ไอคอนตาสลับแบบ cross-fade
2. Detail panel (`dialog`): slide-in จากขวา + backdrop fade; ปิดแบบย้อนกลับ
3. Dropdown/popover (account, saved views, search results): fade + translateY เล็กน้อย
4. ติ๊กถูก/บันทึกสำเร็จ: ไอคอน ✓ ปรากฏแบบ scale เล็ก ๆ + ข้อความ inline feedback (ใช้ `.inline-feedback` ที่มี)
5. รายการ/แถวที่เพิ่มใหม่: จางเข้า (stagger ไม่เกิน 3 รายการ × 40ms)
6. Skeleton shimmer (มีแล้ว) — ปรับให้ตรงรูปทรงหน้าจริง (§T6.2)
7. (ไม่บังคับ) ตัวเลข KPI นับขึ้นบนแดชบอร์ดครั้งเดียวตอนโหลด

**ตรวจรับ:** ตรวจด้วย Playwright (emulate `reducedMotion: 'reduce'`) ว่าไม่มี animation เหลือ; ไม่มี layout shift (CLS) จาก animation; ไม่ทำให้ interaction feedback ช้ากว่า 200ms

---

## T8 — รวม CSS (ทำทีละกลุ่ม ห้ามรื้อรวดเดียว)

ปัญหา: `globals.css` มีบล็อกซ้อนทับกันเอง ("Unified product language" → "Operational aesthetic overrides" → "Workspace refresh") แต่ละชั้นแก้ของชั้นก่อน, มีโค้ดตกค้างจากดีไซน์ tab-top เก่า (`.module-tabs`, `.metrics`, `.task-row`, `.dashboard-grid`, `.top-brand-mark` เก่า ฯลฯ), alias token ซ้อนหลายชุด (`--app-*`, `--ink`, `--muted`, `--line`, `--violet*`, `--teal*`)

**วิธีทำ (ห้ามข้าม)**
1. 🔶 **JEV:** `jev_route` (บังคับ) — ตัวเลือก: (ก) แบ่ง `globals.css` ตามโดเมนแล้วค่อยลบของเก่า (ข) migrate consumer ของ alias ทีละกลุ่มแล้วลบ alias (ค) ทำทั้งสองสลับกัน ส่งเฉพาะตัวเลือก ไม่ส่งซอร์ส
2. ทำ **inventory**: รายการ selector ทั้งหมด + ผล `grep` ว่ามีที่ใช้ใน `src/` (className ใน TSX) หรือไม่ + selector ที่ถูกสร้างแบบ dynamic (ตรวจเทมเพลตสตริง/`clsx`) → ตาราง "ใช้อยู่ / ไม่ใช้ / ไม่แน่ใจ"
3. 🔶 **JEV:** `jev_prioritize` (บังคับ) กับรายการกลุ่ม CSS ที่จะจัดการ
4. **ถ่าย screenshot ก่อนแก้** (Light/Dark × 1440/1024/390) ของ: login, change-password, dashboard, work, buildings, guarantees, admin, 403/404/error — ใช้ `?preview=1` ใน development เพื่อให้มีข้อมูลตัวอย่างโดยไม่แตะข้อมูลจริง
5. ทำทีละกลุ่ม: auth → shell/topbar/sidebar → dashboard → ตาราง/queue → detail panel → โมดูล แต่ละกลุ่ม commit แยก, รัน gate + screenshot ซ้ำ, เทียบ
6. 🔶 **JEV:** `jev_evidence_check` (บังคับ) **ก่อนลบ selector ที่ "ไม่ได้ใช้"** — ส่งข้อสรุป + หลักฐาน (ผล grep + ผล screenshot diff) ถ้าไม่แน่ใจ ให้ **ย้ายไปไว้ใน `docs/archive/` หรือคอมเมนต์ที่ commit แยก** แทนการลบทิ้ง
7. ผลลัพธ์ที่ต้องได้: ไม่มี alias token ซ้อน (หรือมีแผนลบที่ชัดเจนและ test), `globals.css` เล็กลงอย่างวัดได้ (บันทึกขนาดก่อน/หลัง), ผ่าน `check:css`
8. ห้ามเปลี่ยนพฤติกรรมของหน้า (ปรับเฉพาะ presentation) — ถ้า screenshot ต่างโดยไม่ตั้งใจ ให้ย้อนกลับ

---

## T9 — ความปลอดภัย/ประสิทธิภาพเล็ก ๆ ที่แตะประสบการณ์ล็อกอิน

> ทุกข้อในหมวดนี้ต้องผ่าน `jev_risk` ก่อนแก้ และต้องมี test

1. **`getCurrentUser` (`src/lib/auth.ts`)**: ตอนนี้ `update(authSessions).set({ lastSeenAt })` ทุกครั้งที่ถูกเรียก (หลายครั้งต่อหนึ่งคำขอ) — ปรับให้เขียนเฉพาะเมื่อ `lastSeenAt` เก่ากว่า ~60 วินาที และครอบ `cache()` ของ React ในชั้นที่เหมาะสม (`request-context.ts` เรียกตรงอยู่) **ต้องคงความหมายของ idle timeout** (ความคลาดเคลื่อนสูงสุดเท่าความละเอียดที่เลือก — บันทึกใน docs) และมี test ครอบ: เซสชัน idle เกินกำหนดยังถูกปฏิเสธ
2. **เซสชันหมดอายุ → กลับมาที่เดิม**: `(platform)/layout.tsx` ทำ `redirect("/login")` ตรง ๆ ไม่แนบ `next`/เหตุผล — แก้ให้พากลับ `/login?next=<path เดิม>&reason=expired` โดยต้องผ่าน `safeNextPath` เสมอ (ทางเลือกวิธีรู้ path: ตั้ง header ใน `proxy.ts` หรือจัดการในชั้นที่เหมาะสม — ให้ `jev_route` ช่วยเลือก)
3. **`TRUSTED_PROXY_COUNT`**: ค่าเริ่มต้น `0` ⇒ `getTrustedClientIp` คืน `undefined` ⇒ limit ทำงานเฉพาะตามอีเมล (ไม่มีขอบเขตตาม IP) — **ห้ามเดาค่าเอง** ให้ (ก) เอกสารอธิบายชัดใน `docs/operations/` (ข) ให้ `src/lib/env.ts` ตรวจและ **เตือนตอนบูต** เมื่อ `NODE_ENV=production` แล้วเป็น `0` (ค) ถามเจ้าของ (§8 Q2)
4. **เตือนก่อนหมดเวลา** (idle) เป็นงานเสริม **ไม่บังคับ** — ถ้าทำ จะเพิ่ม endpoint keep-alive ซึ่งเป็นพื้นผิว auth ใหม่ → ต้อง `jev_risk` และ test; ถ้าไม่แน่ใจให้ข้ามและบันทึกเป็น backlog
5. ตรวจว่า `npm run build` + `npm audit --omit=dev` ยังสะอาด

🔶 **JEV:** `jev_risk` (บังคับ) ก่อนข้อ 1–2 และ 4 · ส่ง: ชื่อไฟล์ + "ลดความถี่ UPDATE lastSeenAt / เพิ่ม next+reason ตอน redirect / ไม่เปลี่ยนเงื่อนไข idle/absolute timeout"

---

## T10 — การทดสอบเพื่อกันถอยหลัง

1. **Playwright config + e2e** (ตอนนี้ `@playwright/test` ติดตั้งแล้วแต่ไม่มี config/spec): flow หลัก: login → (ผิด → เห็นข้อความ + อีเมลคงอยู่) → login สำเร็จ → เปลี่ยนรหัสผ่านครั้งแรก → เข้าโมดูล → logout → กลับ `/login` พร้อมข้อความ "ออกจากระบบเรียบร้อยแล้ว"
2. **axe** (`@axe-core/playwright` เป็น devDependency ได้) ทุกหน้าหลัก × Light/Dark × 3 ขนาดจอ: ไม่มี serious/critical
3. **ตรวจคำต้องห้าม** (§T1.1, §T5) ใน DOM ของหน้า login/change-password และหน้าหลักของผู้ใช้ทั่วไป
4. **Overflow fixture** (§T6.1) เป็น visual/DOM check ว่าไม่มี `scrollWidth > clientWidth` ที่ไม่ตั้งใจ
5. Unit test ใหม่: ข้อความ rate-limit ไม่แตกต่างระหว่างอีเมลมี/ไม่มี, state ไม่คืนรหัสผ่าน, `reason` ที่ไม่อยู่ใน allowlist ไม่แสดง, `next` ที่เป็น `//evil.com` ถูกปฏิเสธ
6. e2e ต้องใช้ PostgreSQL local: ถ้าไม่มีในสภาพแวดล้อมของคุณ → เขียน test + คู่มือรัน แล้วรายงานว่า **"ยังไม่ได้ยืนยัน"** ห้ามเขียนว่าผ่าน (เพิ่ม job CI พร้อม service container ถ้าทำได้ — ตาม Master Plan §8.3)

---

## 7. ลำดับงานและ Checkpoint

| CP | เนื้อหา | JEV ที่ต้องใช้ | เกณฑ์จบ |
|---|---|---|---|
| **CP0** | Step 0 | `jev_health` → `jev_continue` | baseline ใหม่บันทึกแล้ว, ตาราง verified-done ครบ |
| **CP1** | T3 (tokens) + T1 + T2 + AuthShell | `jev_route` → `jev_risk` (login/changePassword) → `jev_evidence_check` (ก่อนสรุปไม่มีข้อความระบบบนหน้า auth) → `jev_continue` | ตรวจรับ T1/T2 ครบ, gate ผ่าน |
| **CP2** | T5 (ข้อความระบบทั้งแอป) + T6 (ล้น/สถานะ/เมตาดาต้า) | `jev_prioritize` → `jev_evidence_check` → `jev_continue` | grep สะอาด, e2e DOM สะอาด, screenshot 320–1440 ไม่มี overflow |
| **CP3** | T4 (ฟอนต์) + T8 (รวม CSS) | `jev_route` (ทั้งสองงาน) → `jev_prioritize` → `jev_evidence_check` (ก่อนลบ CSS) → `jev_continue` | `check:css` ผ่านใน CI, ขนาด CSS ลดลงวัดได้, screenshot ไม่ต่างโดยไม่ตั้งใจ |
| **CP4** | T7 (motion) | `jev_continue` | reduced-motion ผ่าน, ไม่มี CLS |
| **CP5** | T9 (security เล็ก ๆ) + T10 (test ครบ) | `jev_risk` (ทุกข้อใน T9) → `jev_continue` | test ครอบ, axe สะอาด, CI เขียว |

ทำต่อเนื่องเองข้าม Checkpoint ที่ปลอดภัยได้ **โดยไม่ต้องหยุดถาม** (Master Plan §0.2) หยุดเฉพาะ: ต้องแตะข้อมูล production / ต้อง deploy / ต้องใช้ secret ที่ไม่มี / ต้องทำ migration แบบย้อนกลับไม่ได้ / แหล่งอ้างอิงสองแห่งขัดกันเรื่องกฎธุรกิจ / ต้องตัดสินนโยบายที่หาหลักฐานไม่ได้

---

## 8. คำถามที่ต้องให้เจ้าของระบบตอบ (ไม่บล็อกงาน — บันทึกลงรายงานแล้วทำส่วนอื่นต่อ)

| # | คำถาม | ระหว่างรอคำตอบให้ทำอย่างไร |
|---|---|---|
| Q1 | ช่องทางติดต่อผู้ดูแลระบบที่ควรแสดงบนหน้าล็อกอิน/หน้าไม่มีสิทธิ์ (LINE / โทรศัพท์ / อีเมล / ชื่อแผนก) | แสดงข้อความทั่วไป "ติดต่อผู้ดูแลระบบ" และเตรียม env/prop ให้ตั้งค่าได้ — **ห้ามแต่งช่องทางเอง** |
| Q2 | production รันหลัง reverse proxy หรือไม่ และกี่ชั้น (`TRUSTED_PROXY_COUNT`) | คงค่า `0` + เตือนตอนบูต + เอกสาร |
| Q3 | มีโลโก้/ตราองค์กรจริงหรือไม่ | ใช้ตัวอักษรย่อ "PN" ที่มีอยู่ ออกแบบให้สลับเป็นรูปได้ง่าย |
| Q4 | ยืนยันว่าต้องการ **สีน้ำเงินเดิม** แทนจานสีเขียวของ BudgetZen ใน Master Plan §7.1 (เอกสารสองฉบับขัดกัน) | ทำตาม D1 (น้ำเงิน) — บันทึก ADR สั้น ๆ ว่าเบี่ยงจาก §7.1 เพราะคำสั่งเจ้าของระบบ |

---

## 9. Definition of Done และรูปแบบรายงาน

**เสร็จเมื่อ (ต้องมีหลักฐานทุกข้อ ไม่ใช่คำกล่าวอ้าง)**
- [ ] `/login` และ `/change-password` ไม่มีข้อความระบบ (e2e + grep) และดูเป็นมืออาชีพบน 3 ขนาดจอ × 2 ธีม
- [ ] ผู้ใช้ทั่วไปไม่เห็นข้อความเทคนิคใดในหน้าหลักทุกโมดูล (e2e ตรวจ DOM)
- [ ] ไม่มี hex/rgba นอก `tokens.css`, ไม่มี `font-size` < 12px ที่ไม่ได้ allowlist, ไม่มี `var()` ที่ไม่มีนิยาม (`check:css` ใน CI)
- [ ] contrast ผ่าน AA ตามสคริปต์, axe ไม่มี serious/critical
- [ ] ข้อความไม่ล้น/ถูกตัดในการ์ดที่ 320–1440px ด้วย fixture ข้อความไทยยาว
- [ ] ฟอนต์ไทย self-host ใช้งานได้บนเครือข่ายที่ออกอินเทอร์เน็ตไม่ได้ (ไม่มีคำขอไปโดเมนภายนอกใน Network panel)
- [ ] ไม่มีการลดความปลอดภัย: test ของ login/lockout/rate-limit/audit/`mustChangePassword` ยังผ่านและเพิ่มขึ้น
- [ ] gate ทั้งชุดผ่าน + `npm audit --omit=dev` สะอาด + CI เขียว (หรือระบุ "ยังไม่ได้ยืนยัน" พร้อมเหตุผลสำหรับส่วนที่ต้องใช้ Postgres)
- [ ] `docs/implementation-status.md` อัปเดตด้วยตัวเลขจริงจากการรัน

**รายงานท้ายแต่ละ Checkpoint** (ใช้รูปแบบ Master Plan §12 และเพิ่มหัวข้อ):
```text
## Checkpoint <n> — <ชื่อ>
### สิ่งที่ทำ (ไฟล์หลักที่แก้/เพิ่ม)
### หลักฐาน (คำสั่งที่รัน + ผลลัพธ์จริง)
### สถานะของงานที่ "ตรวจพบว่าทำไว้แล้ว" (verified-done + ไฟล์:บรรทัด)
### JEV ที่ใช้ (เครื่องมือ / เวลา / คำตอบหลัก / นำไปใช้หรือไม่ + เหตุผล / หรือ "unavailable")
### Screenshot ก่อน-หลัง (path)
### สิ่งที่ยังไม่ได้ยืนยัน / ข้อสมมติ / คำถามที่ต้องให้เจ้าของระบบตอบ (อ้างหมายเลข Q)
### ความเสี่ยงและวิธี rollback
### ผลกระทบต่อสิทธิ์/ข้อมูลเดิม (ถ้ามี)
```

---

## 10. คำสั่งเริ่มงาน (วางให้ Codex)

```text
Read AGENTS.md, CODEX-MASTER-PLAN-V2.md and CODEX-TASK-UX-LOGIN-V1.md in full.
Precedence is defined in section 0 of CODEX-TASK-UX-LOGIN-V1.md. The owner decisions in section 2 (keep the blue tone, add purposeful motion, friendly Thai copy, fix overflowing cards, no system text on the login page) override the colour palette in Master Plan 7.1.

Start with STEP 0: call jev_health (check_network=true, project_path = absolute repo root), verify the current repository state from source (several items in the Master Plan gap table are already fixed), run the full gate, record the real baseline, then continue autonomously through CP1 to CP5.

Use JEV only at the points marked with the JEV marker and in the table in section 4.1. JEV is advisory: it never replaces source evidence, tests, build results, or accessibility checks. Send only sanitized metadata; never source bodies, secrets, real user data or production data. If JEV is unavailable, record that and continue.

Never weaken authentication, rate limiting, lockout, audit, session timeouts or mustChangePassword enforcement. Never reveal whether an email exists. Never write "done" or "passed" without evidence from a command you actually ran; otherwise write "not yet verified" with the steps to verify.

All user-facing text is Thai and friendly; code, identifiers and commit messages are English. Work on branch codex/ux-login-polish with small Conventional Commits. Stop only under the stop conditions in Master Plan section 0.2; otherwise record questions (section 8) and keep going.
```
