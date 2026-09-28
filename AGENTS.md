# Project Instructions

## Design Context

### Users

พนักงานภายในทีมเป็นผู้ใช้หลัก และอาจขยายไปยังทีมอื่นภายในบริษัท จำนวนผู้ใช้รวมคาดว่าไม่เกิน 100 คน ผู้ใช้ทำงานกับข้อมูลและรายการจำนวนมากเป็นประจำ จึงต้องรองรับงานแบบ high-volume, การค้นหาเร็ว, การสลับบริบทน้อย และการใช้งานด้วยคีย์บอร์ดอย่างมีประสิทธิภาพ ระบบควรรองรับการเพิ่มโมดูลใหม่ในอนาคตโดยไม่ทำให้การนำทางซับซ้อนขึ้น

### Brand Personality

มืออาชีพ เร็ว ปลอดภัย อินเทอร์เฟซควรสร้างความมั่นใจว่าข้อมูลถูกต้อง สถานะชัดเจน และการทำงานทุกขั้นตอนคาดเดาได้ ไม่เน้นลูกเล่นที่รบกวนงานหรือทำให้ระบบดูเป็นเพียงชุดหน้าเว็บที่นำมาต่อกัน

### Aesthetic Direction

Operational workspace ที่เรียบ สุขุม และหนาแน่นอย่างมีระเบียบ ใช้ Core Shell เป็นภาษาภาพกลาง ขณะที่แต่ละโมดูลรักษาศัพท์และ workflow เฉพาะงานไว้ รองรับทั้ง Light และ Dark mode แต่ให้ความสำคัญกับความชัดเจน ความเร็วในการสแกนข้อมูล และลำดับชั้นของคำสั่งมากกว่าการตกแต่ง ระบบควรหลีกเลี่ยง glassmorphism, gradient/glow ที่ไม่สื่อความหมาย, card ซ้อน card และ animation ที่ทำให้งานช้าลง

### Design Principles

1. Optimize for throughput — ลดจำนวนคลิก รองรับ keyboard-first, bulk actions, saved views และ progressive disclosure สำหรับงานปริมาณสูง
2. One workspace, many domains — navigation, identity, search, notifications, permissions และ feedback ใช้มาตรฐานกลาง ส่วนศัพท์และ workflow ภายในโมดูลคงความคุ้นเคยเดิม
3. Security must be visible and enforced — แสดงสิทธิ์ สถานะการบันทึก และผลของคำสั่งอย่างชัดเจน พร้อมบังคับใช้ authentication, RBAC, audit log และ data validation ฝั่ง server
4. Fast by default — ใช้ server rendering/caching เท่าที่เหมาะสม, virtualize รายการขนาดใหญ่, โหลดโมดูลตามต้องการ และให้ feedback ภายใน 100–200 ms เมื่อผู้ใช้สั่งงาน
5. Accessible internal tooling — ตั้งเป้า WCAG 2.2 AA, รองรับคีย์บอร์ด focus ที่มองเห็นได้ touch target ที่เหมาะสม และไม่ใช้สีเป็นช่องทางสื่อสถานะเพียงอย่างเดียว
6. Prepare for enterprise integration — ออกแบบ identity, notification และ activity model ให้พร้อมเชื่อมต่อ Outlook/Microsoft 365 และรองรับการย้ายฐานข้อมูลเข้าสู่โครงสร้างพื้นฐานภายในบริษัทในอนาคต

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
