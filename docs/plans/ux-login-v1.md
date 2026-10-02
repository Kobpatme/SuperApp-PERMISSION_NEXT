# แผน UX/login V1 — 2026-10-03

ใช้ลำดับเอกสารตาม task §0; คงสีน้ำเงินและความปลอดภัยเดิม คำตอบ Q1–Q4 จากเจ้าของถือเป็นข้อกำหนดแล้ว

1. CP0: อ่านเอกสาร ตรวจซอร์ส/HEAD/working tree และรัน npm ci, lint, typecheck, test, test:documents, build, audit ใหม่ บันทึกหลักฐานจริง
2. CP1: AuthShell ร่วม, ข้อความไทยใน copy.ts, คงอีเมลเมื่อผิด, validation/visibility/Caps Lock/pending/reason/help, checklist จาก password-policy, tokens/contrast/CSS gate และ ADR สีน้ำเงิน
3. CP2: inventory ข้อความ A/B/C แก้ข้อความผู้ใช้ทั่วไป, wrapping/fixture, error/empty/loading/access denied และ metadata
4. CP3: local fonts พร้อม license/งบโหลด, inventory CSS/alias, migrate กลุ่ม auth/shell/dashboard/table/detail/module โดยตรวจภาพก่อน-หลัง และเก็บ legacy ที่ไม่แน่ใจ
5. CP4: purposeful transform/opacity motion ≤200ms พร้อม reduced-motion และตรวจ CLS
6. CP5: ทดสอบ session touch/idle expiry, safe redirect พร้อม reason, boot warning trusted proxy=0, Playwright/Postgres fixture/axe/overflow/CI และรัน full gate

JEV ใช้เฉพาะ marker/§4.1; ส่ง metadata เท่านั้นและบันทึกคำตอบจริง ผล advisory ไม่ใช่หลักฐานผ่าน

แต่ละ CP ใช้ Conventional Commits ขนาดเล็กบน codex/ux-login-polish แล้ว push เฉพาะไฟล์งานนี้ รักษาไฟล์ของผู้ใช้ที่ยังไม่ commit ไม่ deploy หรือแก้ข้อมูล production

Q1: ติดต่อผู้ดูแลระบบ + env ที่ตั้งได้; Q2: TRUSTED_PROXY_COUNT=0 + boot warning/เอกสาร; Q3: PN mark ที่เปลี่ยนเป็นรูปได้; Q4: blue ADR

ถ้า Postgres/CI/ภาพบางหน้ารันไม่ได้ ให้บันทึก “ยังไม่ได้ยืนยัน” พร้อมคำสั่งยืนยัน ไม่ลด auth/test เพื่อให้ผ่าน
