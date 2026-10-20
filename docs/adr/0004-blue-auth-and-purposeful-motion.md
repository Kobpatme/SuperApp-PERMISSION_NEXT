# ADR-0004 — คงโทนน้ำเงินและ motion ที่ช่วยงาน

- สถานะ: เจ้าของยืนยัน (Q4), 2026-10-03
- ขอบเขต: UX/login V1 §0, §2; เบี่ยงจาก Master Plan §7.1 เรื่อง palette

คง `--color-brand: #244fb8` และคู่ dark เดิม ไม่ใช้ palette เขียว BudgetZen เจ้าของยืนยันน้ำเงินเดิม โดยรับแนวทางข้อความที่เป็นมิตร รูปทรงและ layout ที่สงบมาใช้

เพิ่ม motion เฉพาะ feedback/สถานะ ใช้ transform/opacity 120–200ms และปิดเมื่อ reduced-motion ไม่มี gradient/glow/card ซ้อน card ไม่เปลี่ยน authentication/RBAC/workflow หรือ policy ธุรกิจ

Rollback: revert presentation commits โดยคง security guards และคำตอบเจ้าของไว้
