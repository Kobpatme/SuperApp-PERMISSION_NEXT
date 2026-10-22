---
type: project
status: needs-current-code-verification
---
# ภาพรวม SuperApp
[[00 - SuperApp Home|กลับหน้าเริ่มต้น]]

## เป้าหมายตามเอกสารเดิม
รวมงานและ KPI อาคารและค่าใช้จ่าย และเงินประกันอาคาร ให้เป็นพื้นที่ทำงานเดียวกัน โดยรักษา workflow การคำนวณ สิทธิ์ และ audit

| ส่วน | Repository ที่เอกสารอ้างถึง | Route เป้าหมาย |
|---|---|---|
| SuperApp | `Kobpatme/SuperApp-PERMISSION_NEXT` | ผลิตภัณฑ์หลัก |
| [[20-Modules/งานและ KPI]] | `Kobpatme/maxiwa_KPI` | `/work` |
| [[20-Modules/อาคารและค่าใช้จ่าย]] | `Kobpatme/Permission_Next` | `/buildings` |
| [[20-Modules/เงินประกันอาคาร]] | `Kobpatme/maxiwa` | `/guarantees` |

## Baseline ใน audit วันที่ 29 กันยายน 2026
| Repository | Commit ที่บันทึกไว้ |
|---|---|
| SuperApp-PERMISSION_NEXT | `6ccef5b` |
| maxiwa_KPI | `4f5fa99` |
| Permission_Next | `afaee99` |
| maxiwa | `94742a4` |

นี่เป็น snapshot ในเอกสาร ไม่ใช่การยืนยันสถานะโค้ดล่าสุด

## ตำแหน่ง source code ที่ยืนยันแล้ว
- เจ้าของระบุ: `D:/WebApp/SuperApp PERMISSION_NEXT`
- Vault โน้ตอยู่ในโฟลเดอร์ย่อย: `SuperApp/`
- ตรวจ Git เมื่อ 16 ตุลาคม 2026: branch `main` ติดตาม `origin/main`
- Local HEAD: `f5938c9d51862fc1ca9f949cbaa405b96151dda4`
- Commit subject: `docs: document Docker handoff and pending acceptance`
- ไม่ได้ fetch remote จึงยังไม่ยืนยันว่าเท่ากับสถานะล่าสุดบน server
- Working tree ไม่สะอาด: `next-env.d.ts` ถูกแก้อยู่ก่อนตรวจครั้งนี้; `SuperApp/` และ `_vault_backups/` เป็น untracked
- ยังไม่ได้ตรวจ implementation หรือรัน tests ของ source code ปัจจุบัน

## แนวสถาปัตยกรรมตามเอกสาร
- Next.js + TypeScript modular monolith
- PostgreSQL และ server-side authorization
- Core Platform ดูแล identity, RBAC, data scope, audit, notifications และ canonical Building
- แต่ละโมดูลดูแล domain และ workflow
- Local/NAS เป็นแนวทางจัดเก็บไฟล์ที่เอกสารระบุ; adapter อื่นต้องตรวจการอนุมัติและ implementation จริง

## เรื่องที่ต้องแยกให้ชัด
- Vault นี้เป็นคลังโน้ตในโฟลเดอร์ย่อยของ source repository; อย่าสับสนไฟล์โน้ตกับไฟล์ runtime
- โครงสร้างเป้าหมาย ไม่เท่ากับสถานะที่ implement แล้ว
- audit เก่าไม่ใช่หลักฐานว่าปัจจุบันยังขาดฟีเจอร์
- การจัด Vault ครั้งนี้ไม่แก้โค้ด ไม่ deploy และไม่เปลี่ยนข้อมูล production

## แหล่งอ้างอิง
- [[PERMISSION_NEXT/PERMISSION_NEXT_FRESH_SOURCE_PARITY_AUDIT]] — ตารางต้นทาง, สรุปช่องว่าง, ลำดับ SP-0 ถึง SP-4
- [[PERMISSION_NEXT/PERMISSION_NEXT_PROFESSIONAL_REBUILD]] — ข้อกำหนดผลิตภัณฑ์, admin, architecture และ UX
