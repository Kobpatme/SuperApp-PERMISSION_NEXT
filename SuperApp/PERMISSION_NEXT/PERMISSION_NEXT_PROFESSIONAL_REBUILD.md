# PERMISSION_NEXT — PROFESSIONAL PRODUCT & UX REBUILD PLAN

> **Repository:** `Kobpatme/SuperApp-PERMISSION_NEXT`  
> **Audited branch:** `main`  
> **Audited commit:** `6ccef5b40fc5a9c006d02e58860897142d50ce52`  
> **Audit date:** 2026-09-28  
> **Authoritative module sources:** `Kobpatme/maxiwa`, `Kobpatme/Permission_Next`, `Kobpatme/maxiwa_KPI`  
> **Primary goal:** ยกระดับ PERMISSION_NEXT จาก “หลายระบบที่ถูกรวมไว้ใน Shell เดียว” ให้เป็น **Enterprise Operations & Workflow Workspace** ที่ดูเป็นผลิตภัณฑ์เดียว ใช้งานเร็ว สถานะชัด และรองรับงานปริมาณมาก โดย **รักษา business rules, data integrity, RBAC, audit และ workflow ที่ถูกต้องอยู่แล้ว**

---

# 0. คำสั่งหลักสำหรับ Codex

ให้ถือเอกสารนี้เป็น **Professional Rebuild Master Plan** สำหรับ repository นี้

ก่อนแก้โค้ด:

1. อ่าน `AGENTS.md`
2. อ่าน `.impeccable.md`
3. อ่าน `README.md`
4. อ่าน `docs/architecture/overview.md`
5. อ่าน `docs/adr/0001-modular-monolith-and-stack.md`
6. อ่าน `docs/adr/0002-identity-authorization-and-data-scope.md`
7. อ่าน `docs/implementation-status.md`
8. ตรวจ source code ปัจจุบันก่อนแก้ทุกครั้ง
9. สำหรับ Next.js 16 ให้ทำตามคำสั่งใน `AGENTS.md` และอ่าน documentation ที่ติดตั้งใน `node_modules/next/dist/docs/` เมื่อเกี่ยวข้อง

## Authoritative Module Sources — ข้อกำหนดใหม่ที่ต้องถือเป็น Source of Truth

SuperApp ต้องรวมและพัฒนาต่อจาก 3 โมดูลหลักต่อไปนี้ โดย repository เหล่านี้เป็น **authoritative source ของ workflow/domain เดิม** สำหรับการตรวจเทียบพฤติกรรมก่อน refactor:

| Module ID | ชื่อใน SuperApp | Authoritative repository | Target route |
|---|---|---|---|
| `guarantees` | เงินประกันอาคาร | `Kobpatme/maxiwa` | `/guarantees` |
| `buildings` | อาคารและค่าใช้จ่าย | `Kobpatme/Permission_Next` | `/buildings` |
| `work` | งานและ KPI | `Kobpatme/maxiwa_KPI` | `/work` |

ข้อกำหนด:

1. **SuperApp repository เป็น target product/runtime**
2. repository ของแต่ละโมดูลเป็น reference/source สำหรับ:
   - workflow เดิม
   - terminology
   - calculation behavior
   - edge cases
   - migration reconciliation
   - UX pattern ที่ผู้ใช้เดิมคุ้นเคย
3. ห้าม copy legacy code wholesale เข้า SuperApp
4. business rule ที่ migrate แล้วต้องมี test เทียบกับ source behavior ที่ได้รับการอนุมัติ
5. หลัง native migration เสร็จ production route ต้องอยู่ใน SuperApp และไม่พึ่ง iframe
6. การแก้ source repository ภายหลังไม่ควรถูก sync อัตโนมัติเข้า SuperApp โดยไม่มี review
7. ทุก module ต้องมี owner, contract, version และ migration status

---

# A. Future Module Architecture — ต้องรองรับโมดูลใหม่ล่วงหน้า

SuperApp ต้องไม่ hardcode สมมติฐานว่า “มีเพียง 3 โมดูล”

เป้าหมายคือรองรับโมดูลที่ 4, 5, 6... โดยเพิ่ม integration cost ต่ำและไม่ทำให้ navigation / permission / dashboard พัง

## A.1 Module Manifest Contract

ทุกโมดูลใหม่ต้องประกาศ manifest ใน code เช่น:

```ts
export type ModuleManifest = {
  id: string;
  version: string;
  name: string;
  shortName: string;
  description: string;
  route: string;
  navigationGroup: "work" | "operations" | "finance" | "reports" | "management";
  order: number;
  icon: WorkspaceIconName;
  sourceRepository?: string;
  capabilities: ModuleCapability[];
  dashboardProvider?: string;
  searchProvider?: string;
  enabledByDefault: boolean;
};
```

และ capability:

```ts
export type ModuleCapability = {
  code: string;              // เช่น building.record.read
  resource: string;          // building.record
  action: string;            // read
  labelTh: string;           // ดูข้อมูลอาคาร
  descriptionTh: string;
  allowedScopes: Array<"OWN" | "TEAM" | "SELECTED_TEAMS" | "ALL">;
  risk: "normal" | "sensitive" | "administrative";
};
```

## A.2 Registry ต้องเป็น extensible

ย้ายจาก array แบบ literal ที่ผูก `ModuleId` ตายตัว ไปสู่ registry contract ที่:

- compile-time type-safe
- validate manifest ด้วย Zod
- ตรวจ duplicate route / permission code
- รองรับ enable/disable module
- Navigation อ่านจาก registry
- Global Search อ่านจาก registry
- Dashboard อ่าน provider contract จาก registry
- Admin Permission Console อ่าน capability catalog จาก registry
- Health page แสดงสถานะต่อ module
- future module ไม่ต้องแก้ switch/case หลายจุด

## A.3 Module installation ≠ Admin permission

Admin **ไม่ควรติดตั้ง arbitrary code/module จาก browser**

การเพิ่มโมดูลใหม่มี 2 ขั้น:

```text
Developer / Deployment:
Implement module → register manifest → migration → tests → deploy

Admin:
Enable module → assign role/capability → configure data scope → release to users
```

นี่ทำให้ขยายระบบได้โดยไม่เปิดช่องให้ Admin สร้าง code path หรือ permission ที่ backend ไม่รู้จัก

## A.4 Module Lifecycle

แต่ละ module มี state:

```text
development
pilot
active
maintenance
disabled
retired
```

Admin สามารถ:

- enable/disable สำหรับผู้ใช้
- จำกัด pilot group
- ดู module health
- ดู version
- ดู capability ที่ module ประกาศ

แต่ **ไม่สามารถลบ historical data หรือ schema จาก UI**

---

# B. Admin Access Control — ต้องจัดการจาก UI โดยไม่แตะ Database

นี่เป็น **ข้อกำหนดบังคับ**

> ผู้ดูแลระบบต้องสามารถจัดการผู้ใช้ ตำแหน่ง ทีม บทบาท การเข้าถึงโมดูล สิทธิ์การทำงาน และขอบเขตข้อมูลได้จาก Admin Console โดยไม่ต้องเปิด Database, SQL editor หรือแก้ seed file

Database ยังเป็น persistence layer ด้านหลัง แต่ **manual database administration ต้องไม่เป็น workflow ปกติ**

## B.1 สถานะปัจจุบัน

ของที่มีแล้วและควรเก็บ:

- `profiles`
- `positions`
- `teams`
- `user_teams`
- `roles`
- `permissions`
- `role_permissions`
- `user_role_assignments`
- `data_scope_grants`
- server-side `isAuthorized`
- deny-by-default policy
- audit ของ material changes
- ป้องกันการลดสิทธิ์ admin คนสุดท้าย

ของที่ยังขาดใน Admin UI:

- สร้าง/แก้ Role จาก UI
- Permission Matrix รายโมดูล
- กำหนด action capability ให้ Role
- กำหนด scope ราย capability/ราย module
- `SELECTED_TEAMS` UI
- module enablement / pilot access
- clone role
- preview “ผู้ใช้นี้จะเห็นอะไร”
- permission change history
- audit viewer
- bulk access assignment
- access expiry
- temporary access
- permission conflict/warning
- role usage count
- module access summary

## B.2 Admin Console เป้าหมาย

```text
Administration
├─ Overview
├─ Users
├─ Positions
├─ Teams
├─ Roles & Permissions
├─ Modules
├─ Access Review
├─ Audit Log
├─ Integrations
└─ System Health
```

### Users

Admin ทำได้:

- create
- edit
- activate/suspend
- assign position
- assign primary team
- assign additional teams
- set temporary role/access
- reset password
- revoke sessions
- preview effective permissions
- view access history

### Positions

Position เป็น business-friendly template เช่น:

```text
Sales
Permission Officer
TL
Operations Manager
Finance
Viewer
Platform Administrator
```

Position ไม่ควรฝังสิทธิ์แบบ opaque

Admin สามารถ:

- create/edit/deactivate
- map role template
- default data scope
- default module access
- ดูจำนวนผู้ใช้ที่ใช้ position นี้

### Roles & Permissions

สร้าง Permission Matrix:

```text
                         Viewer  Officer  Manager  Admin
งานและ KPI
  ดูงาน                    ✓       ✓        ✓       ✓
  สร้างงาน                 -       ✓        ✓       ✓
  แก้ไขงาน                 -       ✓        ✓       ✓
  ดู KPI ตนเอง             ✓       ✓        ✓       ✓
  ดู KPI ทีม               -       -        ✓       ✓

อาคารและค่าใช้จ่าย
  ดูอาคาร                  ✓       ✓        ✓       ✓
  แก้ข้อมูลอาคาร           -       ✓        ✓       ✓
  จัดการเอกสาร             -       ✓        ✓       ✓
  อนุมัติราคา              -       -        ✓       ✓

เงินประกันอาคาร
  ดูรายการ                 ✓       ✓        ✓       ✓
  สร้างรายการ              -       ✓        ✓       ✓
  ดำเนิน workflow          -       ✓        ✓       ✓
  อนุมัติ/จัดการ           -       -        ✓       ✓
```

UI ใช้ภาษาคน ไม่ให้ Admin ต้องจำ:

```text
building.record.read
guarantee.case.update
```

แต่สามารถเปิด “รายละเอียดทางเทคนิค” เพื่อดู code ได้

## B.3 Effective Permission Model

ใช้ RBAC เดิมเป็นฐาน แต่ยกระดับเป็น:

```text
User
  ↓
Position
  ↓
Role Template
  ↓
Capabilities
  ↓
Data Scope
  ↓
Optional User Overrides
```

effective access:

```text
Role capability
+ active assignment
+ module enabled
+ data scope
+ selected teams
+ optional time window
= Effective Permission
```

**Deny by default**

## B.4 Scope

ต้องรองรับครบ:

```text
OWN
TEAM
SELECTED_TEAMS
ALL
```

Admin UI ต้องให้เลือกได้จริงทั้งหมด

ตัวอย่าง:

```text
ดูข้อมูลอาคาร
Scope: ALL

แก้ไขเงินประกัน
Scope: TEAM

ดู KPI
Scope: SELECTED_TEAMS
Teams:
☑ North
☑ South
☐ Enterprise
```

## B.5 Permission Catalog Ownership

Admin **จัดสรร** permission ได้ แต่ไม่สร้าง arbitrary permission code

permission/capability catalog ต้องมาจาก module manifest / migration ที่ versioned ใน source code

เหตุผล:

- backend รู้จัก capability
- audit ได้
- test ได้
- ป้องกัน typo permission
- ป้องกัน Admin สร้าง permission ที่ไม่มี server guard

เมื่อเพิ่มโมดูลใหม่:

```text
module manifest
     ↓
capability sync/upsert
     ↓
Admin Permission Console
     ↓
Role assignment
```

## B.6 Safe Permission Changes

ทุกการแก้สิทธิ์ต้อง:

1. re-authenticate/re-authorize Admin ฝั่ง server
2. validate capability
3. validate scope
4. transaction
5. audit before/after
6. invalidate/re-evaluate session permission cache
7. แสดงผล effective access หลัง save
8. ป้องกัน lockout ของ platform admin คนสุดท้าย

Sensitive change เช่น:

- grant platform admin
- ALL scope
- finance approval
- permission management

ควรมี confirmation เพิ่ม

## B.7 No-Database Admin Acceptance Criteria

ถือว่าผ่านเมื่อ Admin สามารถทำทั้งหมดนี้โดยไม่แตะ SQL:

- [ ] เพิ่มผู้ใช้
- [ ] ระงับผู้ใช้
- [ ] สร้างทีม
- [ ] แก้ทีม
- [ ] สร้างตำแหน่ง
- [ ] แก้ตำแหน่ง
- [ ] สร้าง role
- [ ] clone role
- [ ] เปิด/ปิด capability ให้ role
- [ ] กำหนด scope
- [ ] เลือก selected teams
- [ ] เปิด/ปิด module access
- [ ] กำหนดสิทธิ์ชั่วคราว
- [ ] ดู effective permission
- [ ] ดู audit history
- [ ] reset password
- [ ] revoke sessions
- [ ] ป้องกันลบ admin คนสุดท้าย
- [ ] เพิ่มโมดูลใหม่แล้ว capability ปรากฏใน Admin Console หลัง deploy/migration โดยไม่แก้ DB เอง

---

## ห้ามทำ

- ห้าม rewrite ทั้งระบบจากศูนย์
- ห้ามเปลี่ยน business formula, KPI formula, financial calculation หรือ workflow transition โดยไม่มี test รองรับ
- ห้ามย้าย authorization decision ไปไว้ใน client
- ห้ามเชื่อ role/query string/client state เป็น authorization evidence
- ห้ามเปิด production iframe integration กลับมา
- ห้ามทำให้ legacy route กลายเป็น production route
- ห้ามเปลี่ยน schema แบบ destructive โดยไม่มี migration + rollback/forward-fix plan
- ห้ามสร้าง “Dashboard เพื่อความสวย” ที่มีกราฟซึ่งไม่ช่วยให้ผู้ใช้ตัดสินใจ
- ห้ามใช้ card จำนวนมากโดยไม่มี information hierarchy
- ห้ามใช้ gradient, glow, glassmorphism หรือ animation ที่ไม่ช่วย workflow
- ห้ามสร้าง design system ใหม่อีกชุดซ้อนของเดิม
- ห้ามแก้ CSS ด้วยการเติม override ต่อท้ายไฟล์ไปเรื่อย ๆ
- ห้าม hardcode สีสถานะในแต่ละ module
- ห้ามแสดง technical permission code เป็นภาษาหลักของผู้ใช้ทั่วไป
- ห้ามใช้ชื่อ building เป็น join key; ใช้ canonical Building UUID ตาม architecture เดิม
- ห้ามทำ production data migration ในงาน UI/UX rebuild นี้โดยอัตโนมัติ

---

# 1. Executive Audit Summary

## สิ่งที่ระบบทำได้ดีอยู่แล้ว

Repository นี้ไม่ได้มีปัญหาหลักที่ “architecture แย่”

ฐานระบบที่ควร **เก็บและต่อยอด** ได้แก่:

- Next.js App Router + TypeScript
- modular-monolith direction
- PostgreSQL + Drizzle
- server-side authorization
- RBAC + data scope (`OWN`, `TEAM`, `SELECTED_TEAMS`, `ALL`)
- canonical Building model
- audit/activity/outbox foundations
- notification data foundation
- explicit workflow/domain logic
- numeric/decimal handling สำหรับข้อมูลการเงิน
- CI: lint, typecheck, test, build, production dependency audit
- native Buildings workspace
- native Guarantee workspace
- global search foundation
- keyboard shortcut foundation
- accessibility basics เช่น focus state, dialog, skip link
- responsive foundations
- dark mode
- migration/runbook documentation

**สรุป:** ระบบมี engineering foundation ที่ดีพอจะยกระดับต่อ ไม่ควรทิ้ง

---

# 2. ทำไมปัจจุบันระบบ “ดูไม่เป็นมืออาชีพ”

ปัญหาหลักไม่ใช่แค่สีหรือ font แต่เป็น **Product Cohesion**

## 2.1 Design intent กับ active visual theme ขัดกัน

`.impeccable.md` และ `AGENTS.md` ระบุชัดว่า product character ต้องเป็น:

- มืออาชีพ
- เร็ว
- ปลอดภัย
- operational
- สุขุม
- high-volume
- หลีกเลี่ยงลูกเล่น
- ไม่ควรดูเหมือนหลายเว็บมาต่อกัน

แต่ root layout ปัจจุบัน import:

```ts
import "@/app/globals.css";
import "@/app/sidebar.css";
import "@/app/coral-stay-theme.css";
```

และ metadata ระบุ:

```ts
title: "Permission Next — Coral Stay Workspace"
```

active design theme ใช้ภาษาและแนวคิดแบบ **Coral Stay** พร้อม coral accent `#FF5A5F`

ปัญหาไม่ใช่ว่าสี coral “ผิด” แต่ชื่อ theme, visual personality และ styling strategy ไม่สอดคล้องกับ operational enterprise product ที่ระบุไว้ใน project instructions

นอกจากนี้ยังมี `bouncebox-theme.css` ซึ่งไม่ได้ import ใน root layout แต่ยังอยู่ใน repository และมี visual language คนละชุด

### ผลที่เกิด

Codex หรือ developer ในอนาคตไม่รู้ว่า:

- `globals.css` คือ source of truth หรือไม่
- `coral-stay-theme.css` คือ source of truth หรือไม่
- `bouncebox-theme.css` ยังใช้อยู่หรือไม่
- token ชุดไหนควรเพิ่ม
- selector ไหนเป็น base และ selectorไหนเป็น override

นี่เป็นหนึ่งในต้นเหตุของ visual drift

---

# 3. Documentation Drift — P0

## พบ architecture source of truth ขัดกัน

`ARCHITECTURE-BASELINE.md` ยังระบุแนวทาง:

- Supabase Auth
- Supabase Storage
- Vercel + Supabase

แต่ implementation ล่าสุดและ `README.md` ระบุแนวทาง:

- self-contained organization network
- PostgreSQL
- Argon2id
- opaque database-backed sessions
- private organization/local/NAS storage
- on-premise compatible

ขณะที่ `docs/architecture/overview.md` ระบุ PostgreSQL เป็น source of truth และ Supabase เป็น optional adapter

## ต้องแก้ก่อนงานใหญ่

สร้าง **Canonical Architecture Statement**

แนะนำ:

```text
README.md
   ↓
docs/architecture/overview.md
   ↓
ADRs
   ↓
module-specific documentation
```

ให้ `ARCHITECTURE-BASELINE.md`:

- update ให้ตรงกับปัจจุบัน หรือ
- เปลี่ยนชื่อเป็น `ARCHITECTURE-BASELINE-LEGACY.md`
- ใส่ warning ชัดเจนว่า superseded

Codex ต้องไม่ตีความเอกสารเก่าว่าเป็น architecture ปัจจุบัน

---

# 4. Repository UX / Frontend Audit

จาก current tree:

- 213 files
- 116 TypeScript/TSX files
- 23 test/spec files
- 14 SQL migrations
- 45 Markdown documents

CSS application/domain หลักมีขนาดรวมมากกว่า 150 KB โดยยังไม่รวม vendor CSS

ตัวอย่างไฟล์ใหญ่:

```text
src/app/globals.css                                  ~69 KB
src/app/(platform)/buildings/permission-buildings.css ~32 KB
src/app/(platform)/guarantees/deposit.css           ~26 KB
src/app/bouncebox-theme.css                         ~20 KB
src/app/coral-stay-theme.css                        ~18 KB
src/app/(platform)/admin/admin.css                   ~10 KB
src/app/sidebar.css                                  ~8 KB
```

และมี component ขนาดใหญ่:

```text
src/components/deposit-workspace.tsx                ~26 KB
src/app/(platform)/buildings/buildings-workspace.tsx ~24 KB
src/components/workspace-queue.tsx                  ~23 KB
src/components/admin-workspace.tsx                  ~14 KB
src/components/deposit-editor.tsx                   ~11 KB
```

## ความเสี่ยง

### CSS

`globals.css` มี base visual language เดิมจำนวนมาก จากนั้น `coral-stay-theme.css` override ทับอีกชั้น

พบ:

- หลาย `:root`
- hard-coded hex colors จำนวนมาก
- `!important` หลายจุด
- responsive override หลายรอบ
- module CSS มี semantic colors ของตัวเอง
- global selectors และ module selectors overlap

ผลคือ UI อาจ “ดูใช้ได้” แต่แก้หนึ่งจุดแล้วกระทบอีก module ได้ง่าย

### Component size

component ใหญ่ทำให้:

- business/view logic ปน UI
- review ยาก
- responsive behavior แก้ยาก
- test interaction ยาก
- component reuse ต่ำ
- visual pattern แตกต่างกันได้ง่าย

---

# 5. Product Experience Audit

## 5.1 App Shell — พื้นฐานดี แต่ยังไม่เป็น Command Center

ไฟล์สำคัญ:

- `src/components/app-shell.tsx`
- `src/components/module-nav.tsx`
- `src/components/workspace-search.tsx`
- `src/app/sidebar.css`

ของที่ดี:

- sidebar collapse
- responsive mobile dialog
- global search
- Ctrl/Cmd + K
- dark mode
- account menu
- permission-aware module navigation

สิ่งที่ยังขาด:

- notification center ใน Shell
- user role/team/data-scope visibility
- recent items
- pinned/favorite destinations
- command/action palette
- contextual breadcrumbs
- global creation actions ตาม permission
- consistent module-level action placement

`src/lib/notifications.ts` มี notification foundation แล้ว แต่ Shell ยังไม่มี notification experience

---

# 6. Dashboard Audit

ไฟล์:

- `src/components/dashboard-overview.tsx`
- `src/components/workspace-queue.tsx`
- `src/lib/dashboard.ts`
- `src/lib/dashboard-server.ts`

แนวคิด “วันนี้ต้องจัดการอะไรบ้าง” ถูกทางแล้ว

แต่ current dashboard ยังขึ้นอยู่กับ external/internal adapter URLs:

```env
DASHBOARD_WORK_SOURCE_URL=
DASHBOARD_BUILDINGS_SOURCE_URL=
DASHBOARD_GUARANTEES_SOURCE_URL=
```

เมื่อ endpoint ไม่พร้อม UX จะกลายเป็น “รอเชื่อมข้อมูล”

สำหรับ modular monolith ที่ domain หลักอยู่ใน application เดียว ควรค่อย ๆ เปลี่ยนจาก HTTP source adapter มาเป็น **typed internal query adapter** สำหรับ module ที่ native แล้ว

HTTP adapter คงไว้เฉพาะ external/legacy source ที่จำเป็นจริง

## Dashboard ใหม่ต้องตอบ 4 คำถาม

1. วันนี้ฉันต้องทำอะไร
2. อะไรกำลังเสี่ยง/เกิน SLA
3. อะไรรอฉันอนุมัติหรือดำเนินการ
4. งานของทีมติดตรงไหน

Dashboard ไม่ควรเป็น analytics wall

---

# 7. Module Cohesion Audit

## 7.1 Work & KPI

route:

```text
src/app/(platform)/work/page.tsx
```

ปัจจุบันใช้:

```tsx
<NativeModuleFoundation moduleId="work" ... />
```

ดังนั้น Work module ยังเป็น generic queue/foundation มากกว่า operational module เต็มรูปแบบ

เอกสาร implementation status ก็ระบุว่า:

- production-backed My Work ยังไม่ครบ
- feed/reports ยังไม่ครบ
- KPI screen ยังไม่ populated

### ผลด้าน UX

ผู้ใช้เข้า Work แล้วเจอประสบการณ์ที่ “บาง” กว่า Buildings และ Guarantees อย่างชัดเจน

### เป้าหมาย

Work ต้องเป็น workspace จริง:

- My Work
- Team Work
- Due / Overdue
- Activity Feed
- KPI Summary
- KPI Explanation
- Manual Entry (ถ้าสิทธิ์อนุญาต)
- Reports
- Saved Views

---

# 8. Buildings Module Audit

ไฟล์:

- `src/app/(platform)/buildings/page.tsx`
- `src/app/(platform)/buildings/buildings-workspace.tsx`
- `src/app/(platform)/buildings/building-map.tsx`
- `src/app/(platform)/buildings/permission-buildings.css`

จุดแข็ง:

- map-first interaction เหมาะกับ domain
- autocomplete
- filters
- drawer
- documents
- fee information
- status shortcuts
- responsive map/list

แต่ page ปัจจุบันเรียก:

```ts
listPermissionBuildings("", 1, 2000)
```

จากนั้น filtering ส่วนใหญ่ทำใน client

## ต้องปรับ

ห้ามใช้ “โหลด 2,000 row แล้ว filter ทั้งหมดใน browser” เป็น long-term architecture

ควรสร้าง:

### Desktop

```text
Command Bar
├─ Search
├─ Status quick filters
├─ Advanced filter
├─ View: Split / Map / List
└─ Result count

Workspace
├─ Map / List
└─ Building Detail Drawer
```

### Query model

- server-side search
- cursor/keyset pagination
- viewport-aware map query หรือ lightweight map projection
- selected columns
- debounced query
- query state ใน URL
- virtualized list เมื่อ row สูง
- lazy load document data เมื่อเปิด Documents tab

## Building detail

ใช้ shared `EntityDetailShell`

tabs:

1. Overview
2. Contacts
3. Fees & Conditions
4. Documents
5. Related Work
6. Guarantee
7. Activity

นี่จะทำให้ Building เป็นจุดเชื่อมข้าม module จริง ไม่ใช่แค่ drawer ของข้อมูลอาคาร

---

# 9. Guarantee / Deposit Module Audit

ไฟล์หลัก:

- `src/components/deposit-workspace.tsx`
- `src/components/deposit-editor.tsx`
- `src/components/deposit-tl-workspace.tsx`
- `src/app/(platform)/guarantees/[id]/page.tsx`
- `src/app/(platform)/guarantees/deposit.css`

โมดูลนี้มี feature เยอะที่สุด และใกล้ operational product มากที่สุด

แต่มีปัญหา:

- component ใหญ่
- analytics calculation จำนวนมากใน Client Component
- terminology mix เช่น `Deposit Manager`
- class name ยังมี `legacy-*`
- viewer/manager/TL ได้ detail experience คนละ structure
- financial dashboard, queue, analytics และ list อยู่ใน workspace เดียวจน hierarchy หนาแน่น
- state/filter/export logic อยู่รวมใน component เดียว

## แนวทางใหม่

### Main workspace

Default ต้องเป็น **Work Queue**

```text
เงินประกัน
├─ งานที่ต้องทำ
├─ รายการทั้งหมด
├─ On Service
├─ รอคืนเงิน
├─ เสร็จสิ้น
└─ Analytics
```

อย่าให้ Analytics เป็น default

### Detail page

ทุก role ใช้ shared shell เดียว:

```text
Header
├─ Building / Case ID
├─ Status
├─ Owner
├─ Due/SLA
└─ permitted actions

Workflow Stepper / Timeline

Main Content
├─ Overview
├─ Finance
├─ Documents
├─ Installation Team
├─ Refund
└─ Activity / Audit

Context Rail
├─ Next action
├─ Outstanding amount
├─ Missing documents
└─ related building
```

จากนั้น permission กำหนดว่า action ไหนเห็น/กดได้

**อย่าสร้างคนละ visual architecture ตาม role**

---

# 10. Admin UX Audit

ไฟล์:

- `src/components/admin-workspace.tsx`
- `src/app/(platform)/admin/admin.css`

ปัจจุบัน admin page รวม:

- create user
- create position
- manage teams
- user table
- edit permission
- password reset

ในหน้าเดียว

ข้อมูลถูกต้อง แต่ cognitive load สูง

## เปลี่ยนเป็น Admin Console

```text
Administration
├─ Users
├─ Positions
├─ Teams
├─ Roles & Permissions
├─ Audit Log
├─ Integrations
└─ System Health
```

### Users

table:

- Name
- Employee ID
- Position
- Team
- Data scope
- Status
- Last login
- Actions

### User Detail Drawer

sections:

- Profile
- Access
- Team
- Sessions
- Security
- Audit

technical permission code เช่น:

```text
building.record.read
```

ให้แสดงใน collapsible **Advanced details**

ภาษาหลักให้เป็น:

```text
ดูข้อมูลอาคาร
แก้ไขข้อมูลอาคาร
จัดการเงินประกัน
ดูข้อมูลทุกทีม
```

---

# 11. Language & Terminology Standard

ปัจจุบัน UI มีภาษา mixed เช่น:

- Permission Next
- Workspace
- Deposit Manager
- Core Identity / RBAC
- MOD
- Analytics
- preview
- source

ระบบภายในสามารถใช้ English ได้ แต่ต้องมีกฎ

## กฎใหม่

### End-user UI

ใช้ภาษาไทยเป็นหลัก

ตัวอย่าง:

| Technical/Internal | End-user |
|---|---|
| Workspace | พื้นที่ทำงาน |
| Deposit Manager | เงินประกันอาคาร |
| Core Identity / RBAC | การจัดการผู้ใช้และสิทธิ์ |
| Source unavailable | ระบบข้อมูลบางส่วนไม่พร้อม |
| MOD 1 | งานและ KPI |
| MOD 2 | อาคารและค่าใช้จ่าย |
| MOD 3 | เงินประกัน |
| Analytics | วิเคราะห์ข้อมูล |
| Preview | ข้อมูลตัวอย่าง |

### Developer/Admin Advanced

เก็บ technical terms ได้เมื่อจำเป็น

---

# 12. New Product Positioning

ใช้ชื่อหลัก:

# Permission Next

คำอธิบาย:

> **Operations & Workflow Workspace**

หรือภาษาไทย:

> **ศูนย์กลางงาน ข้อมูล และเวิร์กโฟลว์ของทีม**

ไม่ใช้ `Coral Stay Workspace` เป็น product naming

---

# 13. New Visual Direction

## Character

- Professional
- Operational
- Calm
- Dense but readable
- Fast
- Trustworthy
- Enterprise
- Neutral
- Data-first

## หลีกเลี่ยง

- playful branding
- hospitality aesthetic
- oversized rounded UI
- excessive shadows
- decorative colors
- giant headings
- floating cards ทุกอย่าง
- icon overload
- full-page dashboards ที่เต็มไปด้วย KPI card

---

# 14. Enterprise Design System V2

สร้าง source of truth ใหม่

แนะนำ structure:

```text
src/styles/
├─ tokens.css
├─ base.css
├─ shell.css
├─ components.css
├─ utilities.css
└─ modules/
   ├─ work.css
   ├─ buildings.css
   ├─ guarantees.css
   └─ admin.css
```

ไม่จำเป็นต้องเปลี่ยนทั้งหมดใน commit เดียว แต่เป้าหมายสุดท้ายต้องลด cascade ซ้อน

## Token groups

```css
--color-bg
--color-surface
--color-surface-subtle
--color-border
--color-border-strong

--color-text
--color-text-muted
--color-text-subtle

--color-brand
--color-brand-hover
--color-brand-soft

--color-success
--color-success-soft
--color-warning
--color-warning-soft
--color-danger
--color-danger-soft
--color-info
--color-info-soft

--radius-xs
--radius-sm
--radius-md
--radius-lg

--shadow-xs
--shadow-sm
--shadow-md

--space-1 ... --space-10

--font-ui
--font-mono
```

## Color policy

Primary brand ใช้ **neutral enterprise blue / indigo family** แทน coral เป็น global action color

semantic colors ใช้เฉพาะความหมาย:

- Green = success
- Amber = warning / SLA risk
- Red = error / destructive / overdue
- Blue = information / active selection
- Neutral gray/slate = inactive

module accent ใช้ได้ แต่ห้ามเปลี่ยน semantic meaning

---

# 15. Typography

ปัจจุบัน CSS อ้าง:

- Nunito Sans
- DM Sans
- JetBrains Mono
- Noto Sans Thai

แต่ root layout ไม่ได้โหลด font อย่างชัดเจน

ทำให้หน้าตาอาจแตกต่างตามเครื่อง

## ต้องแก้

กำหนด font loading strategy ที่ reproducible

อย่างน้อย:

- UI font เดียวสำหรับ Thai + English ที่อ่านง่าย
- mono เฉพาะ code/id
- ไม่ใช้หลาย display font โดยไม่จำเป็น
- table/body 13–14px desktop
- heading scale ชัดเจน
- line-height รองรับภาษาไทย

---

# 16. Standard Page Anatomy

ทุก native module ต้องใช้ structure เดียว

```text
AppShell

PageHeader
├─ Breadcrumb
├─ Title
├─ Supporting text
└─ Primary / Secondary actions

ModuleToolbar
├─ Search
├─ Quick filters
├─ Advanced filters
├─ View options
└─ Saved view

Content
├─ Table / List / Map / Queue
└─ Empty / Loading / Error

Detail
└─ Drawer or Detail Route
```

---

# 17. App Shell V2

แก้:

- `src/components/app-shell.tsx`
- `src/components/module-nav.tsx`
- `src/components/workspace-search.tsx`
- `src/components/account-control.tsx`
- `src/app/sidebar.css`

## Desktop target

- topbar 64–68px
- sidebar expanded ~240px
- collapsed ~64–72px
- main content width fluid
- global search centered/primary
- notification icon
- account
- environment badge เฉพาะ non-production

## Navigation groups

```text
ภาพรวม

งานของฉัน
- งานและ KPI

การดำเนินงาน
- อาคารและค่าใช้จ่าย
- เงินประกัน

การจัดการ
- ผู้ดูแลระบบ
```

หากอนาคตมีโมดูลเพิ่ม ให้ registry รองรับ group

เพิ่ม field ใน module registry:

```ts
group
order
icon
shortName
capabilities
```

---

# 18. Notification Center

Backend foundation มีแล้ว

สร้าง UI:

```text
NotificationButton
NotificationPopover
NotificationList
NotificationItem
```

features:

- unread count
- priority
- timestamp
- deep link
- mark read
- mark all read
- permission-safe
- no polling ถี่โดยไม่จำเป็น

notification ต้องตอบคำถาม:

> “มีอะไรเกิดขึ้นที่ต้องให้ฉันสนใจ?”

ไม่ใช่ activity log ทุกเหตุการณ์

---

# 19. Global Search → Command Center

ของเดิม `Ctrl/Cmd + K` ดีอยู่แล้ว

ยกระดับเป็น:

```text
Search
├─ Buildings
├─ Work
├─ Guarantees
├─ People (optional)
├─ Documents
└─ Navigation

Commands
├─ สร้างงาน
├─ เพิ่มรายการเงินประกัน
├─ เปิดอาคาร
└─ ไปยังหน้าที่ใช้บ่อย
```

permission filter ต้องเกิด server-side เหมือนเดิม

shortcut:

- `Ctrl/Cmd + K` = global search / command
- `/` = search ใน module ปัจจุบัน
- `Esc` = close overlay
- `g h` optional = home
- หลีกเลี่ยง shortcut ที่ซ่อนและจำยาก

---

# 20. Dashboard V2 — Operations Command Center

default homepage ไม่ควรเน้น “directory ของ module”

## Layout

```text
Greeting + Current Scope

Attention Summary
[Overdue] [Due Today] [Waiting Approval] [Needs Action]

My Work
table/queue

Team Exceptions
เฉพาะ manager

Recent Activity
รายการสำคัญเท่านั้น

Quick Access
Buildings / Guarantee / KPI
```

## Metric rule

metric ทุกอันต้อง click-through ได้

ห้ามมี metric ที่ไม่มี action หรือ drill-down

---

# 21. Shared Data Components

สร้าง component กลางแทนการทำซ้ำ

```text
src/components/ui/
├─ button.tsx
├─ icon-button.tsx
├─ input.tsx
├─ select.tsx
├─ badge.tsx
├─ status-badge.tsx
├─ page-header.tsx
├─ toolbar.tsx
├─ filter-bar.tsx
├─ data-table.tsx
├─ pagination.tsx
├─ empty-state.tsx
├─ error-state.tsx
├─ skeleton.tsx
├─ drawer.tsx
├─ modal.tsx
├─ tabs.tsx
├─ timeline.tsx
├─ definition-list.tsx
├─ money.tsx
└─ date-time.tsx
```

ไม่จำเป็นต้องใช้ third-party component library ถ้าไม่จำเป็น

เป้าหมายคือ **pattern consistency**

---

# 22. Shared Status System

ห้ามแต่ละ module สร้างสี status เอง

สร้าง:

```ts
type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";
```

domain map:

```ts
workflowStatusPresentation(status)
buildingStatusPresentation(status)
workStatusPresentation(status)
```

return:

```ts
{
  label,
  tone,
  icon?,
  description?
}
```

UI ห้าม infer meaning จาก raw status string เอง

---

# 23. Shared Entity Detail Experience

สร้าง:

```text
EntityDetailShell
├─ DetailHeader
├─ Status
├─ Metadata
├─ Tabs
├─ Timeline
├─ ContextActions
└─ RelatedEntities
```

ใช้กับ:

- Building
- Work item
- Guarantee case

จุดประสงค์:

เมื่อผู้ใช้เปิด “รายการ” ใด ๆ ต้องเข้าใจ layout ได้ทันที แม้ domain ต่างกัน

---

# 24. Work Module Rebuild

สร้าง route structure:

```text
/work
/work/mine
/work/team
/work/activity
/work/kpi
/work/reports
/work/[id]
```

ถ้าไม่ต้องการ nested route มาก ให้ใช้ tab + query parameter แต่ต้อง share layout

## Main screen

Default = My Work

columns:

- priority
- task
- building/context
- status
- owner
- due
- SLA
- updated
- action

## KPI

KPI ไม่ควรเป็น score อย่างเดียว

ต้องแสดง:

- current score
- target
- change
- source facts
- calculation explanation
- adjustment history
- period selector

---

# 25. Buildings Module Rebuild

## P1

ย้าย filtering/search หลักไป server

replace:

```ts
listPermissionBuildings("", 1, 2000)
```

ด้วย typed query:

```ts
listBuildings({
  query,
  status,
  group,
  type,
  installType,
  surveyType,
  area,
  cursor,
  limit,
  viewport?
})
```

## Map

- dynamic/lazy import
- queryเฉพาะ field ที่ map ต้องใช้
- cluster
- fit bounds
- preserve selected building
- sync URL
- map loading skeleton
- fallback list เมื่อ map error

## Building 360

นำ foundation `assembleBuilding360` มา expose จริง

Building detail tabs:

```text
ภาพรวม
ผู้ติดต่อ
ค่าใช้จ่ายและเงื่อนไข
เอกสาร
งานที่เกี่ยวข้อง
เงินประกัน
ประวัติ
```

---

# 26. Guarantee Module Refactor

แยก `deposit-workspace.tsx`

แนะนำ:

```text
src/features/guarantees/
├─ components/
│  ├─ guarantee-toolbar.tsx
│  ├─ guarantee-table.tsx
│  ├─ guarantee-kpi-strip.tsx
│  ├─ guarantee-work-queue.tsx
│  ├─ guarantee-finance-summary.tsx
│  ├─ guarantee-analytics.tsx
│  └─ guarantee-detail-shell.tsx
├─ queries/
├─ view-models/
└─ presentation.ts
```

ย้าย analytics aggregation ออกจาก render component

ถ้าข้อมูลมาจาก DB ให้คำนวณ server-side หรือ query aggregate ตามเหมาะสม

client ทำเฉพาะ local interaction

---

# 27. Admin Console Refactor — Full Access Control Plane

> Section นี้ต้องทำตามข้อกำหนดใน **Section B**: Admin จัดการ access จาก UI ทั้งหมด และไม่ใช้การแก้ Database เป็น workflow ปกติ

route:

```text
/admin/users
/admin/positions
/admin/teams
/admin/roles
/admin/audit
/admin/integrations
/admin/system
```

หรือใช้ tabs ที่ route-aware

ต้องมี:

- search
- filter
- pagination
- clear empty state
- audit history
- confirm destructive/sensitive action
- success/error toast หรือ inline feedback ที่ consistent

password reset:

- แยกเป็น Security section
- warning ชัด
- ไม่วางชิดกับ profile fields แบบ action ธรรมดา

---

# 28. Saved Views

ปัจจุบัน saved views ของ queue เก็บใน `localStorage`

ดีสำหรับ prototype แต่ enterprise experience ควรค่อย ๆ รองรับ server preference

สร้าง abstraction:

```ts
UserPreferenceStore
```

initial adapter:

```text
localStorage
```

future:

```text
PostgreSQL user_preferences
```

ห้ามผูก component โดยตรงกับ localStorage ในระยะยาว

---

# 29. Loading / Empty / Error System

สร้างมาตรฐาน:

## Loading

- page skeleton
- table skeleton
- drawer skeleton
- map skeleton

## Empty

แยก:

- ไม่มีข้อมูล
- ไม่มีผลค้นหา
- ไม่มีสิทธิ์
- ยังไม่ได้เชื่อมระบบ
- filter ทำให้ไม่มีผล

แต่ละ state มี action ที่สมเหตุสมผล

## Error

error message ต้องประกอบด้วย:

```text
เกิดอะไรขึ้น
ผู้ใช้ทำอะไรต่อได้
retry
correlation/request id (เมื่อมี)
```

ห้ามแสดง stack trace ต่อ user

---

# 30. Form UX Standard

ทุก form:

- label ชัด
- required indicator
- inline validation
- error summary เมื่อ form ยาว
- pending state
- prevent duplicate submit
- unsaved-change warning เมื่อจำเป็น
- success confirmation
- destructive action แยก visual hierarchy
- keyboard usable

สำหรับ financial form:

- numeric formatting
- unit/currency
- server recalculation
- immutable evidence เมื่อ workflow ต้องการ

---

# 31. Table UX Standard

ระบบนี้เป็น high-volume internal tool ดังนั้น table สำคัญกว่า card

ทุก operational table ควรรองรับตามความจำเป็น:

- sticky header
- clear density
- row hover
- row selection
- bulk action
- sortable columns
- filter
- pagination/cursor
- column overflow strategy
- mobile card fallback เฉพาะเมื่อ table ใช้ไม่ได้จริง
- keyboard focus
- status text + tone
- empty result

---

# 32. Responsive Strategy

breakpoint เป้าหมาย:

```text
Desktop >= 1280
Laptop 1024–1279
Tablet 768–1023
Mobile < 768
```

## Desktop

เน้น density และ multi-pane

## Tablet

sidebar collapsible
drawer full-ish width
table horizontal scroll อย่างมี control

## Mobile

เน้น:

- lookup
- quick update
- review
- approve
- document
- status

ไม่พยายามยัด desktop analytics ทั้งหมดลงมือถือ

---

# 33. Accessibility Target

ตั้งเป้า WCAG 2.2 AA สำหรับ core flows

ต้อง test:

- keyboard only
- visible focus
- dialog focus return
- Escape handling
- screen reader label
- status not color-only
- contrast
- touch targets
- reduced motion
- table semantics
- form error association

เพิ่ม automated accessibility smoke test ใน Playwright ได้หากเหมาะสม

---

# 34. Performance Plan

## Buildings

- server pagination
- viewport query
- virtual list
- lazy map
- lazy document tab

## Guarantees

- server aggregate
- split analytics bundle
- memo เฉพาะที่จำเป็น
- avoid recalculating full dataset ทุก interaction

## Dashboard

- internal query adapters
- cache scoped data ที่ปลอดภัย
- parallel server queries
- clear stale/fresh policy

## Search

- debounce
- selected columns
- indexed normalized terms
- max results
- cancel stale request

## Target UX performance

บน organization network ปกติ:

- interaction feedback: < 200 ms
- search feedback: < 300 ms หลัง debounce เมื่อ backend พร้อม
- navigation ให้ skeleton/response เริ่มทันที
- หลีกเลี่ยง blocking full-dataset fetch

---

# 35. CSS Refactor Strategy

**ห้าม delete 69 KB `globals.css` แล้วเขียนใหม่ทั้งหมดในครั้งเดียว**

ใช้ strangler refactor

## Phase CSS-1

สร้าง token V2

## Phase CSS-2

ย้าย shell

## Phase CSS-3

ย้าย shared controls

## Phase CSS-4

ย้าย module ทีละตัว

## Phase CSS-5

ลบ dead selectors

ท้ายสุด:

- remove `coral-stay-theme.css`
- remove `bouncebox-theme.css` ถ้าไม่มี consumer
- metadata ไม่กล่าวถึง Coral Stay
- `globals.css` เหลือ base/reset หรือถูกแยกอย่างชัดเจน

ต้องใช้ code search ก่อนลบ selector

---

# 36. Legacy Cleanup

ปัจจุบันยังมี:

```text
src/app/legacy/*
mods/permission-next/*
src/components/permission-frame.tsx
src/components/guarantee-frame.tsx
src/components/maxiwa-frame.tsx
```

README ระบุว่า production ใช้ native surfaces และ legacy route ใช้ migration reference เท่านั้น

ดังนั้น:

1. ตรวจ consumer จริง
2. mark deprecated
3. ย้าย reference code ไป `legacy/` หรือ `_archive/` ที่ชัดเจน
4. production build ต้องไม่ bundle legacy UI โดยไม่จำเป็น
5. legacy components ที่ไม่มี consumer ให้ลบหลัง test
6. เก็บ golden-master fixtures ที่จำเป็นต่อ migration/test

---

# 37. Architecture Cleanup

## Current architecture target

ให้ canonical statement เป็น:

> Permission Next is a TypeScript strict Next.js modular monolith backed by PostgreSQL. Core Platform owns identity, authorization, team/data scope, canonical entities, audit/activity, notifications and integration boundaries. Modules own domain state and workflows.

Infrastructure adapters:

```text
PostgreSQL = source of truth
Local/NAS private storage = current file provider
SharePoint = prepared optional provider/integration
Supabase = optional adapter only if explicitly approved
```

ห้าม documentation สร้างความเข้าใจว่า Supabase/Vercel เป็นข้อบังคับ ถ้า deployment จริงเป็น on-premise

---

# 38. Source-of-Truth Documentation

หลัง Phase 0 ให้เหลือ hierarchy:

```text
README.md
docs/architecture/overview.md
docs/adr/*
docs/modules/*
docs/operations/*
```

สร้าง:

```text
docs/product/
├─ product-principles.md
├─ information-architecture.md
├─ ux-patterns.md
├─ terminology.md
└─ design-system.md
```

`DESIGN-SYSTEM.md` root เดิมให้ migrate เข้า `docs/product/design-system.md`

---

# 39. Suggested Information Architecture

```text
Permission Next
│
├─ ภาพรวม
│
├─ งานของฉัน
│  ├─ งาน
│  ├─ กิจกรรม
│  └─ KPI
│
├─ การดำเนินงาน
│  ├─ อาคารและค่าใช้จ่าย
│  └─ เงินประกัน
│
├─ รายงาน
│  ├─ งาน
│  ├─ KPI
│  ├─ อาคาร
│  └─ เงินประกัน
│
└─ การจัดการ
   ├─ ผู้ใช้
   ├─ ตำแหน่ง
   ├─ ทีม
   ├─ สิทธิ์
   ├─ Integrations
   └─ System
```

แสดงเฉพาะสิ่งที่ user มี permission

---

# 40. User Experience Principles

ทุกการตัดสินใจ UX ให้ตรวจ 7 ข้อนี้

1. **Can I see what needs attention?**
2. **Can I understand current status?**
3. **Can I see the next action?**
4. **Can I complete common work with minimum clicks?**
5. **Can I recover from an error?**
6. **Can I understand why I can/cannot perform an action?**
7. **Can I return to the same working context?**

---

# 41. Phase Plan

## Phase 0 — Safety + Source of Truth

### ทำ

- create git tag/branch before redesign
- audit current build
- update architecture docs
- update product naming
- document active/deprecated CSS
- document active/deprecated legacy routes

### Acceptance

- ไม่มี architecture docs ขัดกัน
- developer ใหม่รู้ source of truth ภายใน 5 นาที
- production stack ระบุชัด

---

## Phase 1 — Design System V2

### ทำ

- token system
- typography
- semantic colors
- shared button/input/badge/status
- shared page header
- shared toolbar
- shared loading/empty/error
- light/dark parity

### Acceptance

- module ใหม่ไม่ต้อง hardcode visual foundation
- status color meaning consistent
- no new page-specific button design

---

## Phase 2 — Shell & Navigation

### ทำ

- AppShell V2
- grouped navigation
- command/search
- notification center
- account scope
- breadcrumbs
- mobile navigation

### Acceptance

- ผู้ใช้ไป module หลักได้ <= 2 interactions
- Ctrl/Cmd+K ใช้งานได้ทุก native route
- unread notification visible
- shell ไม่เปลี่ยน pattern ตาม module

---

## Phase 3 — Dashboard V2

### ทำ

- attention-first home
- My Work
- Due today
- Overdue
- Waiting approval
- exceptions
- quick module access
- typed internal adapters

### Acceptance

ผู้ใช้เปิดหน้าแรกแล้วรู้ภายใน 5–10 วินาทีว่า “ต้องทำอะไรต่อ”

---

## Phase 4 — Work & KPI Native Workspace

### ทำ

- real operational work list
- My/Team work
- activity feed
- KPI explainability
- production-backed queries

### Acceptance

Work module ไม่ใช่ generic placeholder/foundation

---

## Phase 5 — Buildings V2

### ทำ

- server search/filter
- pagination
- view modes
- Building 360
- documents lazy load
- related work/guarantee

### Acceptance

- ไม่ fetch 2,000 full rows เป็น default
- search/filter URL-shareable
- building context ไม่หายเมื่อเปลี่ยน view

---

## Phase 6 — Guarantees V2

### ทำ

- split giant components
- work queue default
- shared detail shell
- server/view-model analytics
- consistent role experience
- financial + workflow clarity

### Acceptance

manager/viewer/TL ใช้ visual architecture เดียวกัน แต่ action ต่างตาม permission

---

## Phase 7 — Admin Console

### ทำ

- sections/routes
- searchable users
- human-readable permission
- audit
- system health
- integration status

### Acceptance

admin ไม่ต้องแก้ database ตรง
และไม่ต้องเข้าใจ permission code เพื่อทำงานทั่วไป

---

## Phase 7.5 — Future Module Platform Contract

### ทำ

- refactor module registry ให้เป็น manifest-driven
- capability catalog sync
- module lifecycle/status
- module health contract
- dynamic permission matrix
- dynamic navigation grouping
- dashboard/search provider contracts
- test fixture สำหรับ “Module 4” ตัวอย่างที่ไม่มี business implementation เพื่อพิสูจน์ว่า platform รองรับ extension

### Acceptance

- เพิ่ม module manifest ใหม่โดยไม่ต้องแก้ authorization switch/case กระจายหลายไฟล์
- capability ของ module ใหม่ปรากฏใน Admin Console หลัง deployment
- user ที่ไม่ได้ grant ไม่เห็น module
- navigation/dashboard/search ไม่ error เมื่อ module disabled
- ไม่มี hardcoded assumption ว่ามี 3 modules เท่านั้น

---

## Phase 8 — UX Quality

### ทำ

- keyboard pass
- WCAG pass
- mobile/tablet pass
- empty/error/loading pass
- visual regression
- terminology pass

---

## Phase 9 — Performance & Production Readiness

### ทำ

- query plan
- load tests
- RLS/integration tests
- restore drill
- monitoring
- browser matrix
- release rehearsal

---

# 42. Required Automated Tests

## Unit

- status presentation mapping
- filter parsing
- pagination contract
- permission visibility
- money/date presentation
- domain transitions

## Integration

- RBAC
- data scope
- Building 360
- notification
- global search
- dashboard adapters

## E2E / Playwright

roles:

```text
viewer
sales_operator
permission_specialist
operations_manager
platform_admin
TL assigned user
```

flows:

```text
login
home attention
search building
open building
open related guarantee
edit permitted guarantee
denied action
admin user update
theme
mobile navigation
keyboard navigation
```

---

# 43. Visual Regression Scenarios

capture:

```text
login
overview
work
buildings split view
building drawer
guarantees list
guarantee detail
admin users
global search
notification center
dark mode
tablet
mobile
```

---

# 44. UX Acceptance Criteria

## Navigation

- current module always obvious
- active state not color-only
- no duplicate global navigation
- back behavior predictable

## Search

- global and local search have different clear purpose
- keyboard usable
- loading/empty/error clear

## Data density

- operational data uses list/table first
- cards used for summary only
- no card-inside-card unless structurally necessary

## Actions

- one dominant primary action per context
- destructive action red and separated
- disabled action explains why when needed

## State

- loading visible
- saved success visible
- errors actionable
- stale data indicated when relevant

---

# 45. Engineering Acceptance Criteria

ทุก phase ต้องผ่าน:

```bash
npm run lint
npm run typecheck
npm test
npm run test:documents
npm run build
```

ถ้า database integration environment มี:

- migration contract tests
- authorization/RLS tests
- concurrency tests

ห้าม merge phase ที่ build/test fail

---

# 46. Refactoring Rules

## React

- Server Component by default
- Client Component เฉพาะ interaction
- ห้ามเอา full business calculation มาไว้ใน render component
- extract view model เมื่อ component ต้อง transform domain data จำนวนมาก
- component เกิน ~300–400 lines ให้ review ว่าควร split หรือไม่
- ไม่ split เพื่อ split; แบ่งตาม responsibility

## Domain

- domain logic ต้อง testable โดยไม่ต้อง render React
- UI presentation mapping แยกจาก transition policy
- server mutation re-authorize ทุกครั้ง

## CSS

- semantic class
- token first
- no new random hex ถ้ามี semantic token
- responsive rule อยู่ใกล้ component/module
- ลด `!important`

---

# 47. Immediate Quick Wins

ให้ทำก่อน feature ใหม่

### QW-01
เปลี่ยน metadata:

```text
Permission Next — Coral Stay Workspace
```

เป็น:

```text
Permission Next — Operations Workspace
```

### QW-02
เลิกใช้คำว่า `Coral Stay` ใน active product-facing design docs/theme

### QW-03
mark `bouncebox-theme.css` deprecated หรือ remove เมื่อยืนยันว่าไม่มี import

### QW-04
สร้าง canonical design tokens

### QW-05
ทำ sidebar/navigation typography ให้ compact ขึ้น

### QW-06
เพิ่ม Notification Center

### QW-07
เปลี่ยน Admin จาก single long page เป็น grouped console

### QW-08
เปลี่ยน Guarantee default hierarchy เป็น work-first ไม่ analytics-first

### QW-09
Buildings เปลี่ยนจาก 2,000-row default fetch เป็น paginated/query model

### QW-10
สร้าง shared status badge + shared page header

---

# 48. Files Requiring Priority Review

## P0

```text
README.md
ARCHITECTURE-BASELINE.md
DESIGN-SYSTEM.md
AGENTS.md
.impeccable.md
docs/architecture/overview.md

src/app/layout.tsx
src/app/globals.css
src/app/coral-stay-theme.css
src/app/bouncebox-theme.css
src/app/sidebar.css
```

## P1 Shell

```text
src/components/app-shell.tsx
src/components/module-nav.tsx
src/components/workspace-search.tsx
src/components/account-control.tsx
src/components/workspace-theme-toggle.tsx
src/lib/module-registry.ts
```

## P1 Dashboard

```text
src/components/dashboard-overview.tsx
src/components/workspace-queue.tsx
src/lib/dashboard.ts
src/lib/dashboard-server.ts
src/lib/workspace-server.ts
```

## P1 Work

```text
src/app/(platform)/work/page.tsx
src/components/native-module-foundation.tsx
src/lib/work-domain.ts
src/lib/work-service.ts
src/lib/kpi-engine.ts
```

## P1 Buildings

```text
src/app/(platform)/buildings/page.tsx
src/app/(platform)/buildings/buildings-workspace.tsx
src/app/(platform)/buildings/building-map.tsx
src/app/(platform)/buildings/permission-buildings.css
src/lib/permission-building-domain.ts
src/lib/permission-building-server.ts
src/lib/cross-module.ts
```

## P1 Guarantees

```text
src/app/(platform)/guarantees/page.tsx
src/app/(platform)/guarantees/[id]/page.tsx
src/components/deposit-workspace.tsx
src/components/deposit-editor.tsx
src/components/deposit-tl-workspace.tsx
src/app/(platform)/guarantees/deposit.css
src/lib/deposit-v2-domain.ts
src/lib/deposit-v2-server.ts
src/lib/deposit-v2-workflow.ts
```

## P1 Admin

```text
src/app/(platform)/admin/*
src/components/admin-workspace.tsx
src/lib/access.ts
src/lib/authorization.ts
```

---

# 49. Definition of Done — Professional Rebuild

จะถือว่า PERMISSION_NEXT ผ่าน Professional Rebuild เมื่อ:

- [ ] product naming ไม่อ้าง Coral Stay/BounceBox
- [ ] architecture docs มี source of truth เดียว
- [ ] active design system มี token source เดียว
- [ ] Shell ทุก module เหมือนกัน
- [ ] module navigation เป็นกลุ่มที่เข้าใจง่าย
- [ ] Global Search + Command ใช้งานได้
- [ ] Notification Center ใช้งานได้
- [ ] Dashboard เป็น attention-first
- [ ] Work module เป็น native operational workspace จริง
- [ ] Buildings ไม่โหลด dataset ใหญ่ทั้งชุดโดย default
- [ ] Building 360 ใช้งานจริง
- [ ] Guarantee ใช้ shared detail architecture
- [ ] Admin แยกเป็น console ที่ชัดเจน
- [ ] Admin สร้าง/แก้ Role และ Permission Matrix ได้จาก UI
- [ ] Admin กำหนด `OWN / TEAM / SELECTED_TEAMS / ALL` ได้จาก UI
- [ ] Admin เปิด/ปิด access ราย module ได้โดยไม่แก้ Database
- [ ] Effective Permission Preview ใช้งานได้
- [ ] Permission change มี immutable audit
- [ ] module registry รองรับ Module 4+ โดยไม่ hardcode จำนวนโมดูล
- [ ] capability ของ module ใหม่ sync เข้า Admin Console หลัง deploy/migration
- [ ] technical permission code ไม่ใช่ UI หลัก
- [ ] status semantics เหมือนกันทั้งระบบ
- [ ] loading/error/empty patterns เหมือนกัน
- [ ] tables/filters/toolbars ใช้ shared pattern
- [ ] saved view abstraction ไม่ผูกกับ browser storage โดยตรง
- [ ] CSS cascade/dead theme ลดลงอย่างมีนัยสำคัญ
- [ ] legacy UI ไม่ถูก bundle/serve ใน production flow
- [ ] keyboard flow ผ่าน
- [ ] WCAG core flow ผ่าน
- [ ] tablet/mobile core flow ผ่าน
- [ ] lint ผ่าน
- [ ] typecheck ผ่าน
- [ ] unit tests ผ่าน
- [ ] document tests ผ่าน
- [ ] production build ผ่าน
- [ ] authorization/integration tests ผ่านเมื่อ infrastructure พร้อม
- [ ] ไม่มี regression ใน business workflow เดิม

---

# 50. Codex Execution Protocol

ให้ Codex ทำทีละ Phase

ในแต่ละ Phase:

1. inspect files
2. สรุป current behavior
3. ระบุ files ที่จะเปลี่ยน
4. ทำ smallest coherent refactor
5. run tests
6. ตรวจ diff
7. ตรวจ accessibility
8. ตรวจ responsive
9. update documentation
10. commit เป็น phase แยก

ตัวอย่าง commit:

```text
chore: establish canonical product architecture
refactor: introduce enterprise design tokens
refactor: unify app shell and navigation
feat: add notification center
refactor: rebuild operations dashboard
feat: complete native work workspace
refactor: scale buildings workspace queries
refactor: unify guarantee detail experience
refactor: split administration console
test: add ux and accessibility regression coverage
```

---

# 51. Final Product Standard

PERMISSION_NEXT ไม่ควรให้ความรู้สึกว่า:

> “เอา MAXIWA + Permission + Guarantee มาแปะรวมกัน”

แต่ควรให้ความรู้สึกว่า:

> **“นี่คือระบบงานหลักของทีม และแต่ละโมดูลเป็นส่วนหนึ่งของระบบเดียวกันตั้งแต่แรก”**

สิ่งที่ต้องเหมือนกัน:

- navigation
- identity
- search
- notification
- permissions
- page hierarchy
- action hierarchy
- status language
- feedback
- keyboard interaction
- error behavior
- loading behavior
- detail structure
- responsive behavior

สิ่งที่อนุญาตให้ต่างกัน:

- domain workflow
- map
- finance-specific views
- KPI-specific views
- domain terminology
- specialized data visualization

---

# 52. Priority Recommendation

หากต้องเลือกลำดับที่ทำให้ “ความรู้สึกมืออาชีพ” เปลี่ยนเร็วที่สุด ให้ทำ:

```text
1. Documentation Source of Truth
2. Enterprise Design System V2
3. App Shell V2
4. Dashboard V2
5. Guarantee Detail Consistency
6. Buildings Scalability + Building 360
7. Work/KPI Full Native Experience
8. Admin Console
9. Legacy/CSS Cleanup
10. Accessibility + Performance + Production QA
```

อย่าสลับไปเริ่มด้วยการเพิ่ม feature ใหม่จำนวนมาก

**รอบนี้เป้าหมายคือทำให้ของที่มีอยู่แล้วกลายเป็นผลิตภัณฑ์ที่ coherent ก่อน**

---

# 53. Audit Conclusion

PERMISSION_NEXT มีฐาน engineering ที่ “ดีกว่าภาพลักษณ์ที่ UI แสดงออกมา”

ปัญหาหลักคือ:

1. design language ปัจจุบันไม่สอดคล้องกับ enterprise intent
2. CSS มีหลายยุคและหลาย visual layer
3. module maturity ไม่เท่ากัน
4. module interaction pattern ยังไม่เป็นมาตรฐานเดียว
5. Work module ยังไม่เต็ม
6. Buildings ยังใช้ client-heavy data model
7. Guarantee มี feature มากแต่ component/hierarchy หนาแน่น
8. Admin รวมหลาย responsibility ในหน้าเดียว
9. foundation บางอย่าง เช่น notifications / Building 360 / commands มีใน code แต่ยังไม่ถูก expose เป็น UX ที่สมบูรณ์
10. architecture documentation มี drift

ดังนั้นคำตอบไม่ใช่ “เปลี่ยนสีให้ดูแพงขึ้น”

แต่คือ:

> **Consolidate the product language, expose the strong domain foundations through one coherent interaction model, remove visual/architectural ambiguity, and optimize every screen around the next action the user needs to take.**

