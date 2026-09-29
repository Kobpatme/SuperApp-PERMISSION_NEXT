# PERMISSION_NEXT — FRESH SOURCE PARITY AUDIT

> Audit date: 2026-09-29  
> Target: `Kobpatme/SuperApp-PERMISSION_NEXT` @ `6ccef5b`  
> Direct source repositories verified and read successfully.

## Authoritative sources

| Module | Repository | Fresh source commit |
|---|---|---|
| เงินประกันอาคาร | `Kobpatme/maxiwa` | `94742a4` — 2026-09-15 |
| อาคารและค่าใช้จ่าย | `Kobpatme/Permission_Next` | `afaee99` — 2026-08-27 |
| งานและ KPI | `Kobpatme/maxiwa_KPI` | `4f5fa99` — 2026-08-14 |
| SuperApp target | `Kobpatme/SuperApp-PERMISSION_NEXT` | `6ccef5b` — 2026-09-28 |

---

# Executive conclusion

SuperApp มี platform/security/domain foundation ที่แข็งแรง แต่ยังไม่ผ่าน **Source Feature Parity** สำหรับทั้งสามโมดูล

สถานะโดยสรุป:

- **งานและ KPI:** gap สูงสุด
- **อาคารและค่าใช้จ่าย:** map/read experience มีแล้ว แต่ operational features หายหลายส่วน
- **เงินประกันอาคาร:** ใกล้ต้นทางที่สุด แต่ยังขาด role/notification/UI parity และต้อง reconcile กับ source ล่าสุด

ปัญหาเกิดจาก migration ที่เน้น architecture/domain foundation ก่อน แต่ไม่ได้ใช้ source parity matrix เป็น release gate

---

# 1. งานและ KPI — `Kobpatme/maxiwa_KPI`

## ต้นทางจริงมีอะไร

จาก `public/js/maxiwa.js`, `docs/product-blueprint.md` และ `docs/feature-parity-checklist.md`

Role experience ใน source มีอย่างน้อย:

- Staff
- Lead
- Manager
- SrManager
- Director
- Executive
- Admin

Navigation / workspace ตาม role มี:

### Staff
- My Dashboard
- My Tasks
- Create Task
- Job Tracker

### Lead
- My Dashboard
- My Tasks
- Create Task
- Team Command
- Team Tasks
- Assign Task
- Team People
- Job Tracker

### Manager
- Operations Dashboard
- Task Center
- Assign Task
- People
- Job Tracker
- System Control

### SrManager / Director / Executive
- Performance View
- Performance Dashboard / Organization Dashboard
- Work Portfolio
- People Overview
- Job Tracker

### Admin
- System Dashboard
- System Control
- Job Tracker

Source ยังมี:

- Accept pending task
- Complete task
- On Hold
- Cancel
- Note-only update
- Task detail edit
- Multiple-job create/assign
- Main KPI / Sub KPI
- KPI weights
- allowed teams
- allowed staff
- Team scope
- Job grouping
- Job Tracker timeline
- audit timeline
- holiday management
- Thai public/company holiday
- duplicate holiday detection
- SLA calendar health
- deadline recalculation
- task KPI recalculation
- KPI rule/SLA management
- audit log
- admin people/team/KPI/holiday management

## SuperApp ปัจจุบัน

`/work` ยังเป็น:

```tsx
<NativeModuleFoundation moduleId="work" />
```

และแสดง generic `WorkspaceQueue`

แม้มี:

- `work-domain.ts`
- `work-service.ts`
- `kpi-engine.ts`
- task schema
- KPI schema
- audit/activity foundation

แต่ UI ยังไม่ได้ expose ความสามารถต้นทางข้างต้น

## Verdict

**Work/KPI ยังไม่ใช่การ migrate MAXIWA KPI แบบ feature-complete**

## สิ่งที่ต้อง PORT/ADAPT

1. Role-based work experience
2. My Dashboard
3. My Tasks
4. Pending acceptance
5. Create Personal Task
6. Team Command
7. Team Tasks
8. Assignment Center
9. Team People
10. Task Center
11. Job Tracker
12. Audit Timeline
13. Work Portfolio
14. Performance View
15. KPI/SLA Admin
16. Holiday Calendar
17. Deadline recalculation
18. KPI recalculation
19. Reports / export
20. Note/log workflow

## สิ่งที่ไม่ควร copy ตรง ๆ

- legacy client authorization
- service-key/API trust model
- hard delete
- employee-id-only identity model
- permissions JSON เป็น security authority

ให้ map source roles/use-cases ไปเป็น capability + data scope ใน SuperApp

---

# 2. อาคารและค่าใช้จ่าย — `Kobpatme/Permission_Next`

## ต้นทางจริงมีอะไร

จาก `app.js`, `README.md`, `quotation-engine.js`

ต้นทางมี:

- Map
- List/search/filter
- Building detail
- Add Building
- Edit Building
- Delete Building
- duplicate detection
- duplicate Thai name
- duplicate English name
- duplicate exact coordinates
- stale Permission after 365 days
- building conditions
- fee management
- BOQ profile
- cost classification
- CAPEX
- OPEX
- DEPOSIT
- revenue share
- other fee rows
- building quotation
- horizontal-distance validation
- customer floor
- WM floor
- vertical floor calculation
- quotation reference
- quotation validity date
- quotation summary
- PDF/image export workflow
- CSV export
- admin user management
- `admin / permission / sale`
- per-account `can_upload_documents`
- NAS file search
- NAS file download
- inline PDF/image preview
- NAS file upload up to 100 MB
- no overwrite
- Electron desktop support

## SuperApp ปัจจุบัน

มีแล้ว:

- map
- search
- filters
- Building drawer
- contacts
- fee display
- BOQ normalization
- NAS browsing
- stale status computed for display
- quotation helper functions
- `price_estimates` schema
- estimate versions/items/approval schema

แต่ current Building UI ระบุเองว่า:

> `ข้อมูลจาก PostgreSQL กลาง · อ่านอย่างเดียว`

## Missing parity

### Building operations
- Create
- Edit
- Archive/Merge replacement for legacy delete
- duplicate warning
- duplicate resolution

### Fee / condition administration
- condition editing
- BOQ editing
- other fees
- revenue share editing

### Quotation
SuperApp มี helper/schema แต่ยังไม่มี complete native flow:

- create estimate
- customer input
- floor selection
- WM/customer-floor calculation
- horizontal validation
- BOQ calculation
- version
- draft
- approval
- export
- copy summary
- history

### Documents
ต้นทางมี:

- preview PDF/image
- upload
- upload permission
- max 100 MB
- no-overwrite

SuperApp current screen เน้น download/read เป็นหลัก

## Verdict

**Buildings มี interaction shell ใกล้ต้นทาง แต่ยังขาด operational parity อย่างมีนัยสำคัญ**

---

# 3. เงินประกันอาคาร — `Kobpatme/maxiwa`

## Fresh source is newer than previous SuperApp audit

audit เดิมใน SuperApp อ้าง source เก่าช่วงกรกฎาคม

แต่ source ล่าสุด:

`94742a4` — 2026-09-15

ดังนั้นเอกสาร audit เดิมต้อง mark stale และ refresh

## Latest source behavior

ต้นทางล่าสุดมี:

- Executive Dashboard
- My Dashboard
- เงินประกันอาคาร
- On Service
- Done
- Smart Queue
- TL tasks
- Notifications
- User management
- CSV
- filters
- multi-status
- refund analytics
- area analytics
- owner financial analytics
- non-refundable cost detail
- TL workflow
- off-service flow

Source fields/use cases:

- `can_see_dashboard`
- `can_see_tl`
- area restriction
- TL acceptance
- TL completion
- TL due date
- return/refund flow
- closure
- Building Dept inspection
- cancellation
- On Service
- Off Service pending
- service cancellation

## Latest financial rule

Commit `94742a4` changed an important rule:

> installation deposit counts as refunded only after the job is closed (`done` / final done), not merely because `depReturn = Yes`.

SuperApp current `deposit-v2-domain.ts` **มี `isInstallationRefunded()` ที่สอดคล้องกับ rule ใหม่นี้แล้ว**

นี่คือส่วนที่พอร์ตตาม source ล่าสุดได้ดี

## Latest On Service rule

Source ระบุ:

- On Service เป็น normal holding state
- ไม่ควรถูกมองเป็น actionable queue ระหว่างลูกค้ายังใช้บริการ
- จะ actionable เมื่อมี service cancellation / Off Service request

SuperApp current domain logic ก็มีแนวทางนี้แล้ว

## Gap ที่ยังเหลือ

### Notification parity

ต้นทางใช้:

```js
getActionNotifications(data, {
  recipientRole,
  statusResolver,
  statusLabelResolver
})
```

และ notification UI มี read state + role-specific behavior

SuperApp มี function port แต่ `DepositWorkspace` เรียกในลักษณะทั่วไปและยังไม่ได้เชื่อมเป็น Core Notification Center แบบเต็ม

ต้องสร้าง:

```text
domain event
→ notification rule
→ core notification
→ recipient
→ unread/read
→ deep link
```

### Role/capability parity

ต้นทางมี:

- admin
- user
- tl
- `can_see_tl`
- `can_see_dashboard`
- area restriction

ไม่ควร copy flags ตรง ๆ

ให้ map เป็น:

- module capability
- action capability
- data scope
- selected teams/areas

### User/Admin parity

ต้นทางมี user management ใน module

SuperApp ควรย้าย responsibility ไป Admin Console กลาง แต่ต้องรักษาความสามารถเทียบเท่า

### Dashboard parity

ต้อง reconcile metric ทีละรายการ โดยเฉพาะ:

- installation deposit
- removal deposit
- refunded
- outstanding
- On Service
- pre-service removal
- success rate
- area outstanding
- monthly refund
- average refund duration

### Source security evolution

ต้นทาง `maxiwa` ล่าสุดมี staging design สำหรับ Firebase Auth + Firestore/Storage Rules และ emulator tests แล้ว

SuperApp ไม่จำเป็นต้อง adopt Firebase Auth เพราะ target architecture ใช้ server-side local/on-prem identity แต่เอกสาร audit เดิมที่บอก source ไม่มี security enforcement ควรถูก update ให้ระบุว่า:

- legacy production path เดิมยังมีข้อจำกัด
- source repo ล่าสุดมี secure migration path และ rules tests
- target SuperApp ยังคงใช้ own server-side RBAC architecture

---

# 4. Source-of-truth documentation ต้องแก้

ปัจจุบัน SuperApp บางเอกสารยังอ้าง local folders เป็น source of truth

ต้องเปลี่ยนเป็น:

```text
Kobpatme/maxiwa
Kobpatme/Permission_Next
Kobpatme/maxiwa_KPI
```

เป็น approved source baseline

Local folder ใช้เป็น comparison artifact เท่านั้น เว้นแต่ owner ระบุ explicit ว่า local branch ใหม่กว่าและต้องใช้แทน

---

# 5. Fresh Parity Status

| Module | Current parity | Main gap |
|---|---|---|
| Work & KPI | LOW | product/workflow screens แทบทั้งชุด |
| Buildings | MEDIUM-LOW | CRUD, duplicate, quotation, upload |
| Guarantees | MEDIUM-HIGH | dashboard/role/notification/admin parity |

---

# 6. Required next implementation order

## Phase SP-0 — Freeze source baseline

บันทึก commits:

```text
maxiwa          94742a4
Permission_Next afaee99
maxiwa_KPI      4f5fa99
```

ทุก parity test ต้องอ้าง source SHA

---

## Phase SP-1 — Build parity matrices

สร้าง:

```text
docs/modules/work/source-parity.md
docs/modules/buildings/source-parity.md
docs/modules/guarantees/source-parity.md
```

ทุก source feature ต้อง classify:

```text
KEEP
PORT
ADAPT
REPLACE
RETIRE
```

ห้าม `RETIRE` เพราะ SuperApp ยังไม่ได้ implement

---

## Phase SP-2 — Work/KPI recovery

Priority สูงสุด

สร้าง native:

```text
/work
/work/mine
/work/team
/work/assign
/work/people
/work/tracker
/work/reports
/work/kpi
```

Admin capability:

```text
KPI/SLA
Holiday
Recalculate deadline
Audit
```

Role presentation ไม่จำเป็นต้อง copy role labels ตรง ๆ แต่ use cases ต้องครบ

---

## Phase SP-3 — Buildings operational recovery

เพิ่ม:

```text
Building Create/Edit
Duplicate Detection
Condition Version Editor
BOQ Editor
Other Fees / Revenue Share
Quotation Workspace
Estimate Version
Approval
Export
NAS Upload/Preview
```

แทน hard delete ด้วย archive/merge/tombstone

---

## Phase SP-4 — Guarantee fresh reconciliation

เทียบ source `94742a4` กับ:

```text
deposit-v2-domain.ts
deposit-v2-workflow.ts
deposit-workspace.tsx
deposit-editor.tsx
deposit-tl-workspace.tsx
guarantees/actions.ts
```

เพิ่ม golden tests สำหรับ latest source financial rules

จากนั้นเติม:

- Notification Center integration
- exact dashboard metric parity
- role use-case parity
- On Service/Off Service UX parity
- source admin capability mapping

---

# 7. Golden-master tests ที่ต้องสร้าง

## Work/KPI

source fixture:

- Pending → accept
- On Process
- Hold
- Hold deadline extension
- weekend
- holiday
- Completed
- Cancelled
- weighted KPI
- SLA
- multi-job assignment
- job timeline

## Buildings

- stale after 365
- excluded stale statuses
- duplicate Thai
- duplicate English
- duplicate coordinate
- WM floor parse
- basement floor
- horizontal max
- BOQ fixed fee
- variable fee
- revenue share
- quotation ref/date
- export summary

## Guarantee

- closed installation = refunded
- `depReturn Yes` before close != refunded
- removal return independent
- On Service normal holding
- Off Service pending actionable
- cancellation
- Building Dept close
- TL close
- missing evidence
- notification role
- dashboard totals

---

# 8. Admin requirement

Admin Console กลางต้อง subsume capabilities จากทุก source

## Work/KPI
- people
- team
- KPI
- holiday
- SLA
- audit
- role/team access

## Buildings
- user/module access
- building edit permission
- document upload permission
- quotation approval

## Guarantee
- dashboard access
- TL access
- area/team scope
- workflow manage

Admin ห้ามแก้ database โดยตรง

---

# 9. Important architectural rule

**Source parity ≠ source architecture parity**

ให้พอร์ต:

- feature
- workflow
- calculation
- terminology
- mental model

ไม่พอร์ต:

- insecure client auth
- direct browser DB authority
- hard deletes
- editable audit
- public file access
- duplicated user stores

SuperApp platform remains the security and persistence authority.

---

# 10. Codex + JEV execution instruction

ใช้คำสั่ง:

```text
Read PERMISSION_NEXT_FRESH_SOURCE_PARITY_AUDIT.md first.

This is a source-parity recovery project.

Authoritative commits:
- Kobpatme/maxiwa @ 94742a4
- Kobpatme/Permission_Next @ afaee99
- Kobpatme/maxiwa_KPI @ 4f5fa99
- target SuperApp @ 6ccef5b

Before coding:
1. call jev_health
2. inspect all four repositories directly
3. create source parity matrices
4. use jev_evidence_check before declaring any source feature absent or complete
5. use jev_prioritize for missing features
6. use jev_risk before business-rule, financial, KPI, RBAC, migration or destructive changes

Do not begin by visually redesigning pages.

Required order:
1. source-of-truth documentation
2. Work/KPI parity
3. Buildings operational parity
4. Guarantee fresh-source reconciliation
5. cross-module notifications/dashboard/search
6. UAT

For each source feature classify:
KEEP / PORT / ADAPT / REPLACE / RETIRE.

Every RETIRE decision needs an explicit reason and replacement.

Preserve the SuperApp's server-side RBAC, audit, PostgreSQL and secure file-access architecture.

Run after every coherent phase:
npm run lint
npm run typecheck
npm test
npm run test:documents
npm run build

Do not modify production data or deploy production infrastructure.
```

---

# 11. Definition of Done

A module is not “migrated” merely because schema/domain foundation exists.

It is migrated only when:

- source feature matrix reviewed
- source workflow reconciled
- key calculation golden tests pass
- role/use-case parity approved
- native UI complete
- RBAC enforced
- audit preserved
- UAT passed

Final goal:

> ผู้ใช้เดิมเปิด SuperApp แล้วพบว่าความสามารถสำคัญของระบบเดิมยังอยู่ครบ แต่ระบบใหม่ปลอดภัย เป็นมาตรฐาน และทำงานเป็น Product เดียวกัน
