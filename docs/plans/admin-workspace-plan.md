# แผนโมดูลผู้ดูแลระบบ (Admin Workspace)

- สถานะ: พร้อมนำไปแตกงานพัฒนา
- วันที่: 2026-09-26
- ขอบเขต: ผู้ใช้ภายในไม่เกิน 100 คน ใช้ Core Identity, PostgreSQL และ RBAC กลางของระบบ

## 1. เป้าหมาย

ให้ผู้ดูแลสามารถจัดการวงจรชีวิตผู้ใช้ ทีม บทบาท สิทธิ์ และขอบเขตข้อมูลจากจุดเดียว โดยทุกคำสั่งสำคัญตรวจสิทธิ์ฝั่งเซิร์ฟเวอร์และมี audit log ที่ตรวจย้อนหลังได้ โมดูลต้องรองรับงานจำนวนมาก ค้นหาเร็ว ใช้คีย์บอร์ดได้ และไม่ทำให้ผู้ดูแลต้องสลับไปแก้ฐานข้อมูลโดยตรงหลัง bootstrap ผู้ดูแลคนแรก

## 2. หลักการออกแบบ

1. Deny by default: ไม่มี assignment หรือหมดอายุแล้วต้องเข้าถึงไม่ได้
2. Action + scope: สิทธิ์ทุกตัวใช้ `module.resource.action` ร่วมกับ `OWN`, `TEAM`, `SELECTED_TEAMS` หรือ `ALL`
3. Server enforced: UI มีหน้าที่สื่อสถานะ แต่ API/Server Action และ PostgreSQL RLS เป็นผู้บังคับสิทธิ์จริง
4. Least privilege: ให้เฉพาะงานและขอบเขตที่จำเป็น มีวันเริ่มต้น/หมดอายุ และทบทวนได้
5. No silent destruction: ปิดใช้งานแทนการลบผู้ใช้/ทีม/บทบาทที่เคยถูกใช้งาน
6. Atomic audit: การเปลี่ยนสิทธิ์และ audit ต้อง commit หรือ rollback พร้อมกัน
7. Safe administration: ห้ามลดสิทธิ์ผู้ดูแลคนสุดท้าย ห้ามอนุมัติสิทธิ์ระดับสูงให้ตนเอง และคำสั่งเสี่ยงต้องยืนยันผลกระทบ

## 3. โครงสร้างที่มีอยู่และจะนำมาใช้

ระบบมีฐานที่เหมาะสมแล้ว ได้แก่ `profiles`, `teams`, `user_teams`, `roles`, `permissions`, `role_permissions`, `user_role_assignments`, `data_scope_grants` และ `audit_logs` รวมถึงตัวตรวจ `has_scoped_permission()` และ authorization ฝั่งเซิร์ฟเวอร์

งานใหม่จึงเป็นการสร้าง Admin Workspace และเติมวงจรชีวิตผู้ใช้/การทบทวนสิทธิ์ ไม่สร้างระบบสิทธิ์คู่ขนาน และไม่ใช้ `user_metadata`, query string หรือข้อมูลจาก browser เป็นหลักฐานสิทธิ์

## 4. โครงสร้างเมนู

| หน้า | หน้าที่หลัก |
| --- | --- |
| ภาพรวมผู้ดูแล | จำนวนผู้ใช้ตามสถานะ, สิทธิ์ใกล้หมดอายุ, คำขอรออนุมัติ, เหตุการณ์เสี่ยง, health ของ identity/database |
| ผู้ใช้ | ค้นหา/กรอง, เพิ่มหรือเชิญ, แก้โปรไฟล์, เปิด/ปิดใช้งาน, กำหนดทีมและสิทธิ์, ดู effective access |
| ทีม | เพิ่ม/แก้ชื่อ, สมาชิก, primary team, ผู้ดูแลทีม, ปิดใช้งานทีม |
| บทบาทและสิทธิ์ | ดู permission matrix, สร้างบทบาทธุรกิจ, clone บทบาท, ตรวจผลกระทบก่อนบันทึก |
| การกำหนดขอบเขต | กำหนด OWN/TEAM/SELECTED_TEAMS/ALL ราย assignment พร้อมวันเริ่มและวันหมดอายุ |
| ทบทวนสิทธิ์ | รายการสิทธิ์ที่ต้องรับรอง, ต่ออายุ, ลดสิทธิ์ หรือเพิกถอนเป็นชุด |
| Audit log | ค้นตามผู้กระทำ/ผู้ได้รับผล/คำสั่ง/ช่วงเวลา/request ID และ export ตามสิทธิ์ |
| ระบบและการเชื่อมต่อ | readiness ของ Supabase Auth, Microsoft 365/Outlook/SharePoint ในอนาคต และสถานะงานเบื้องหลัง |

แสดงเมนู “ผู้ดูแลระบบ” ใน Core Shell เฉพาะผู้ที่มี permission อย่างน้อยหนึ่งตัวใน `core.*` ที่เกี่ยวข้อง แต่ทุกหน้าต้องตรวจซ้ำบนเซิร์ฟเวอร์

## 5. ฟังก์ชันหลัก

### 5.1 ผู้ใช้

- เพิ่มผู้ใช้แบบรายคนด้วยรหัสพนักงาน ชื่อ อีเมล ทีมหลัก และบทบาทเริ่มต้น
- รองรับ invite/activation แยกจาก profile; ห้ามกำหนดหรือย้ายรหัสผ่านจากระบบเดิม
- ตรวจอีเมลและรหัสพนักงานซ้ำก่อนบันทึก
- เปิดใช้, ระงับชั่วคราว, ปิดใช้ และตั้งวันมีผลล่วงหน้า
- เปลี่ยนทีมหลักและเพิ่มทีมรองโดยแสดงผลกระทบต่อ scope ก่อนยืนยัน
- กำหนดหลายบทบาทได้ พร้อม `valid_from`/`valid_until`
- แสดง Effective Access ที่คำนวณจากบทบาท สิทธิ์ ขอบเขต ทีม และวันหมดอายุจริง
- bulk import CSV แบบ preview → validate → confirm → reconciliation report; รายการผิดไม่ทำให้ข้อมูลดีหาย
- ห้าม hard delete ผู้ใช้ที่มีประวัติธุรกิจหรือ audit

### 5.2 ทีมและขอบเขต

- สร้าง แก้ไข และปิดใช้งานทีม
- จัดสมาชิกแบบ bulk และบังคับให้มี primary team ได้ไม่เกินหนึ่งทีม
- รองรับผู้ดูแลแบบจำกัดทีมด้วย `TEAM` หรือ `SELECTED_TEAMS`
- การย้าย/ปิดทีมต้องแสดงจำนวนผู้ใช้ assignments และ records ที่ได้รับผลกระทบ
- `ALL` ใช้เฉพาะบทบาทส่วนกลางที่อนุมัติไว้; ไม่ให้ทีมแอดมินมอบ `ALL` ด้วยตนเอง

### 5.3 บทบาทและสิทธิ์

- System roles แก้ code หรือลบไม่ได้; เปลี่ยน permission matrix ได้เฉพาะผู้มี `core.role.manage` ระดับ `ALL`
- Custom roles สร้างจากว่างหรือ clone จาก role เดิม พร้อมชื่อ คำอธิบาย owner และสถานะ
- Permission matrix แยกตามโมดูล/ทรัพยากร/คำสั่ง และแสดงจำนวนผู้ใช้ที่จะได้รับผลกระทบ
- การ assign `platform_admin`, การเพิ่ม `core.role.manage` หรือ `ALL` ต้องใช้ผู้อนุมัติคนที่สอง
- ตรวจ separation of duties และห้าม self-approval
- รองรับ temporary access และงานอัตโนมัติสำหรับแจ้งเตือน/หมดอายุ

### 5.4 Audit และการตรวจสอบ

- บันทึก actor, target, before/after, เหตุผล, request ID, เวลา และแหล่งคำสั่ง
- เหตุการณ์ขั้นต่ำ: create/invite/activate/suspend user, team membership change, role assignment/revoke, scope change, role-permission change, bulk operation และ denied sensitive action
- Audit เป็น append-only; การแก้ไขใช้ correction event ไม่แก้แถวเดิม
- ข้อมูลลับ เช่น token, password, session และ key ต้องไม่ลง audit
- Export audit ต้องมี permission แยกและบันทึก audit ของการ export อีกครั้ง

## 6. Permission catalog ที่เสนอ

| Permission | ใช้สำหรับ | Scope ที่อนุญาต |
| --- | --- | --- |
| `core.profile.read` | ดูรายชื่อและโปรไฟล์ | TEAM, SELECTED_TEAMS, ALL |
| `core.profile.update` | แก้ข้อมูลทั่วไป | TEAM, SELECTED_TEAMS, ALL |
| `core.user.invite` | เชิญ/activate ผู้ใช้ | TEAM, SELECTED_TEAMS, ALL |
| `core.user.status.manage` | ระงับ/เปิดใช้ | TEAM, SELECTED_TEAMS, ALL |
| `core.team.read` | ดูทีม | TEAM, SELECTED_TEAMS, ALL |
| `core.team.manage` | สร้างทีมและจัดสมาชิก | SELECTED_TEAMS, ALL |
| `core.role.read` | ดู role/permission matrix | ALL |
| `core.role.manage` | สร้าง/แก้บทบาท | ALL |
| `core.role.assign` | assign/revoke role | TEAM, SELECTED_TEAMS, ALL |
| `core.access_review.manage` | รับรอง/เพิกถอนสิทธิ์รอบทบทวน | SELECTED_TEAMS, ALL |
| `core.audit.read` | อ่าน audit | TEAM, SELECTED_TEAMS, ALL |
| `core.audit.export` | ส่งออก audit | ALL |
| `core.system.read` | ดู health/readiness | ALL |
| `core.system.manage` | เปลี่ยนค่าระบบที่อนุญาต | ALL + step-up confirmation |

permission เดิมให้คงไว้และเพิ่มเฉพาะรายการที่ขาดผ่าน migration แบบ additive; trigger ปัจจุบันจะเพิ่ม permission ใหม่ให้ `platform_admin` โดยอัตโนมัติ

## 7. บทบาทผู้ดูแลที่เสนอ

| บทบาท | ขอบเขต |
| --- | --- |
| Platform Admin | จัดการระบบทั้งหมด ใช้จำนวนน้อยที่สุด และต้องมีผู้ดูแลที่ใช้งานได้อย่างน้อย 2 คน |
| Access Admin | จัดบทบาท assignment และ scope แต่แก้ระบบ/การเชื่อมต่อไม่ได้ |
| User Admin | เพิ่มผู้ใช้ แก้โปรไฟล์ ทีม และสถานะ เฉพาะทีมที่ได้รับมอบหมาย |
| Team Admin | จัดสมาชิกและดู effective access เฉพาะ TEAM/SELECTED_TEAMS |
| Security Auditor | อ่าน audit และรายงานแบบ read-only; export เมื่อได้รับสิทธิ์แยก |
| System Operator | ดู health และจัดการ integration ที่กำหนด แต่ไม่มีสิทธิ์อ่านข้อมูลธุรกิจโดยปริยาย |

## 8. การเปลี่ยนแปลงข้อมูลที่ต้องเพิ่ม

1. `profiles`: เพิ่ม identity linkage และสถานะวงจรชีวิตที่ชัดเจน เช่น invited/active/suspended/archived โดย migration ต้องรองรับค่า active/inactive เดิม
2. `user_invitations`: email, employee code, token hash, expires_at, invited_by, accepted_at, revoked_at โดยไม่เก็บ token ดิบ
3. `access_change_requests`: request type, requested_by, approved_by, payload, status, reason และเวลาตัดสินใจ สำหรับคำสั่ง privileged
4. `access_review_campaigns` และ `access_review_items`: รอบทบทวน ผู้รับผิดชอบ ผลตัดสิน และหลักฐาน
5. เพิ่ม constraint/index สำหรับอีเมลที่ normalize แล้ว, active assignment ที่ซ้ำกัน, วันหมดอายุ และรายการรออนุมัติ
6. กำหนด RLS สำหรับทุกตารางใหม่ และทดสอบด้วย identity จริงก่อนเปิดใช้งาน

placeholder profiles จากการย้ายข้อมูล เช่นเจ้าของงานเงินประกัน ต้องแสดงสถานะ “ยังไม่ผูกบัญชี” และใช้ขั้นตอน claim/link กับ Auth user ที่ยืนยันแล้ว ห้ามสร้างบัญชีจากชื่อที่ตรงกันโดยอัตโนมัติ

## 9. Backend และ transaction boundary

- ใช้ Server Actions/route handlers ที่รับ schema validation เดียวกัน
- โหลด actor จาก verified session เท่านั้น แล้วเรียก `assertAuthorized()` ด้วย resource owner/team
- เปลี่ยนข้อมูลพร้อม `audit_logs`, activity/outbox ที่จำเป็นใน transaction เดียวผ่านรูปแบบ `runMaterialChange()`
- ใช้ optimistic concurrency/version เมื่อแก้ role, membership หรือ assignment เพื่อป้องกันผู้ดูแลสองคนเขียนทับกัน
- ใช้ idempotency key กับ invite, bulk import และ approve/revoke
- Pagination/filter/sort ทำฝั่งเซิร์ฟเวอร์; ไม่โหลดผู้ใช้และ audit ทั้งหมดเข้าหน้าเว็บ

## 10. ลำดับการพัฒนา

### ระยะ A — Foundation และ read-only (1 sprint)

- เพิ่ม permission ที่ขาด, schema สำหรับ invitation/change request และ indexes
- ทำ `/admin` overview, Users list, User detail และ Effective Access แบบ read-only
- เพิ่ม audit query พร้อม server-side pagination/filter
- เขียน authorization/RLS/IDOR tests และ seed สำหรับ local development

### ระยะ B — User และ Team management (1 sprint)

- invite/activate/suspend, แก้ profile, team membership และ primary team
- bulk import preview/validate/confirm/reconcile
- เพิ่มผลกระทบก่อนยืนยัน, optimistic locking และ atomic audit
- เปิด Team Admin ด้วย scope จำกัด

### ระยะ C — Role, Scope และ Approval (1–2 sprints)

- role matrix, custom role, assignment, expiry และ scope editor
- two-person approval สำหรับ privileged access
- guardrails: last-admin, self-approval, inactive team/user และ scope escalation
- notification สำหรับคำขอรออนุมัติและสิทธิ์ใกล้หมดอายุ

### ระยะ D — Access review และ Integration readiness (1 sprint)

- access review campaign และ bulk certify/revoke
- audit export ตามสิทธิ์
- identity/integration health, M365 readiness และ operational dashboard
- UAT, load test รายการ/audit และคู่มือผู้ดูแล

## 11. Definition of Done

- ผู้ไม่มีสิทธิ์เปิด URL หรือเรียก API โดยตรงแล้วได้ 403/404 ตามนโยบาย
- Team Admin มองเห็นและแก้ได้เฉพาะทีมที่ grant ไว้; ทดสอบ IDOR ข้ามทีมผ่าน
- ผู้ดูแลเพิ่มผู้ใช้ ผูกทีม assign role/scope และระงับผู้ใช้ได้ครบจาก UI โดยไม่ใช้ SQL
- ไม่มีทางเพิกถอนผู้ดูแลที่ใช้งานได้คนสุดท้ายหรืออนุมัติ privileged access ให้ตนเอง
- ทุก material mutation มี audit ก่อน/หลัง เหตุผล actor และ request ID ใน transaction เดียว
- สิทธิ์หมดอายุหยุดทำงานตามเวลาโดยไม่ต้องรันงาน manual
- bulk import รายงาน accepted/rejected/duplicate และรันซ้ำได้โดยไม่สร้างข้อมูลซ้ำ
- keyboard focus, label, error และ contrast ผ่าน WCAG 2.2 AA สำหรับ flow หลัก
- lint, typecheck, unit/integration/RLS/IDOR tests และ production build ผ่าน

## 12. เรื่องที่ต้องยืนยันก่อนเริ่มระยะ B/C

1. Identity provider ระยะใช้งานจริงจะใช้ Supabase Auth ต่อ หรือเชื่อม Microsoft Entra ID ตั้งแต่รุ่นแรก
2. ผู้อนุมัติคนที่สองสำหรับ `platform_admin`/`ALL` คือบทบาทใด และต้องมี ticket/reference หรือไม่
3. ระยะเวลาเก็บ audit และสิทธิ์ในการ export ตามนโยบายบริษัท
4. ใครเป็นเจ้าของการทบทวนสิทธิ์รายทีม และรอบทบทวนเป็นรายไตรมาสหรือรอบอื่น

