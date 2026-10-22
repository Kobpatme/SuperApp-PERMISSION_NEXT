# UX Redesign — Clean Light Minimal (End-to-End UI Redesign with Design System)

Status: P0 in progress · Approved: 2026-10-22 · Repo: `D:/WebApp/SuperApp PERMISSION_NEXT` · Branch: `main`
Method: **Strangler** — replace incrementally, verify every phase. No big-bang rewrite.

## 1. Goal

ปรับหน้าตาทั้งระบบตั้งแต่หน้า Login ถึงทุกโมดูล ให้เป็นแนว **Clean Light Minimal** ที่ดูพรีเมี่ยม น่าใช้งาน และสอดคล้องกันทั้งระบบ ผ่าน Design System กลาง (tokens + shared classes + React UI components)

## 2. Scope / Non-goals

**In scope (presentation layer เท่านั้น)**
- `src/styles/*.css` — tokens, shared classes, layout, motion
- `src/components/ui/*` — shared React UI components
- Page layout / structure ของแต่ละหน้า (presentation)
- Microcopy เฉพาะที่เกี่ยวกับ UI (ถ้าจำเป็น)

**Out of scope — ห้ามแตะโดยเด็ดขาด**
- auth logic, RBAC, RLS, audit log, migrations, business logic, API contracts

**ต้องขออนุมัติแยก (ไม่รวมในแผนนี้)**
- `git push` ขึ้น remote · Deploy · Migration · การลบข้อมูลจริง

## 3. Constraints (จาก AGENTS.md + design-system.md + UX-UI-LIVELY-UPGRADE.md)

1. Aesthetic: operational workspace ที่เรียบ สุขุม หนาแน่นอย่างมีระเบียบ — ไม่เน้นลูกเล่นรบกวนงาน
2. ห้าม glassmorphism · gradient/glow ที่ไม่สื่อความหมาย · card ซ้อน card · animation ที่ทำให้งานช้าลง
3. Light + Dark mode ต้องผ่านการตรวจ contrast จริงทั้งคู่
4. ฟอนต์ bundled เท่านั้น (Manrope, Nunito, Noto Sans Thai, Source Code Pro) — ห้ามโหลดภายนอก
5. สถานะสื่อด้วย **ข้อความควบคู่สีเสมอ** ไม่ใช้สีเป็นช่องทางเดียว
6. animation เฉพาะ `transform` / `opacity` (120/200/320ms) และเคารพ `prefers-reduced-motion`
7. WCAG 2.2 AA — contrast 4.5:1 ข้อความปกติ · focus visible · touch target ≥44px บนมือถือ
8. ใช้ token เท่านั้น ห้ามฮาร์ดโค้ดสี · ห้ามเพิ่มธีม override ใหม่
9. Feedback ภายใน 100–200 ms · ไม่มี animation วนไม่หยุดในหน้าที่ต้องอ่านนาน

## 4. Phases and acceptance

| Phase | Deliverable | Acceptance |
|---|---|---|
| **P0** | Design Language Spec + audit ของจริง — `docs/product/design-language.md` | สเปกครบ (สเกล/คอมโพเนนต์/motion) · contrast วัดจริงแล้ว |
| **P1** | Foundation tokens — `tokens.css` (+ ปรับค่าที่จำเป็น) | typecheck + test + build ผ่าน · ไม่มีสีฮาร์ดโค้ดนอก tokens.css |
| **P2** | Core Shell & Navigation — sidebar, topbar, command palette | ทุก route เข้าถึงได้ · focus visible · responsive 900/650px |
| **P3** | Authentication — login, change-password | ฟอร์มใช้งานได้จริง · contrast ผ่าน · ไม่แตะ auth logic |
| **P4** | Dashboard Home — "วันนี้ต้องจัดการอะไรบ้าง" | 4 การ์ดสรุป + ตาราง + การ์ดโมดูล · ไม่มีทางลัดรก |
| **P5** | Work Module — 8 หน้า | ทุกหน้าสอดคล้องสเปก · ตารางเลื่อนในกรอบตัวเอง |
| **P6** | Buildings + Guarantees + Car-booking | เดียวกัน |
| **P7** | Duct-rental (14 หน้า) + Admin | เดียวกัน |
| **P8** | Motion & Accessibility polish + responsive 375/768/1024/1440 | contrast/focus/keyboard/reduced-motion ผ่านทุกเบรกพอยต์ |
| **P9** | Final QA + อัปเดตเอกสาร + รายงานตรวจรับ | รายงานแยก "ทำอะไร/พิสูจน์อะไร/เหลืออะไร" |

## 5. Global acceptance criteria (ทุกเฟส)

- `npm run typecheck` ผ่าน · `vitest` (6,181 tests) ผ่าน · `npm run build` ผ่าน
- Contrast วัดจริง ≥ 4.5:1 (ข้อความ) และ ≥ 3.0:1 (ขอบตัวควบคุมที่ต้องมองเห็น)
- Focus มองเห็นทุกตัวควบคุม · ใช้คีย์บอร์ดได้ทั้งระบบ
- `prefers-reduced-motion: reduce` ปิด animation ได้จริง
- Light + Dark mode ผ่านทั้งคู่ · ไม่มีสกอลล์แนวนอนระดับหน้า
- ไม่มี glassmorphism / gradient ไม่สื่อความหมาย / card ซ้อน card

## 6. Risks

| Risk | Mitigation |
|---|---|
| CSS cascade ทับกันระหว่างย้าย (globals.css ยังมี selector เก่า) | Strangler + ตรวจภาพทุกเฟส + ตรวจทีละหน้า |
| Dark mode contrast หลุด | วัด contrast จริงทุกครั้งที่เปลี่ยนโทเคน |
| ไม่มี visual regression test | ตรวจด้วยตาทุกเฟส (screenshot จริง) — ระบุว่าเป็นข้อจำกัด |
| ขอบเขตใหญ่ (35 หน้า) | แบ่งเฟสเล็ก ตรวจรับเป็นช่วง |
| แก้แล้วกระทบ logic | แก้เฉพาะ CSS/className — ห้ามแตะ logic/API |

## 7. Progress log

- 2026-10-22 — P0 started: อ่าน CSS/คอมโพเนนต์จริงครบ, วัด contrast จริง, เขียนสเปก
