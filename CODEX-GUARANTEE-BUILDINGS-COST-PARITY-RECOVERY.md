# CODEX MODULE PARITY RECOVERY — GUARANTEE + BUILDINGS + COSTS
## SuperApp PERMISSION_NEXT
### Target workspace: `D:\WebApp\SuperApp PERMISSION_NEXT`

---

# 0. DOCUMENT PURPOSE

เอกสารนี้เป็น Master Corrective / Source-Parity Recovery Plan รอบถัดไปสำหรับโปรเจกต์:

```text
D:\WebApp\SuperApp PERMISSION_NEXT
```

สถานะปัจจุบัน:
- โมดูล งานและ KPI ได้รับการปรับปรุงจนใกล้เคียงต้นฉบับมากขึ้นแล้ว
- ห้ามทำให้ Work/KPI regress
- รอบนี้ให้โฟกัส:
  1. โมดูลเงินประกัน
  2. โมดูลอาคาร
  3. ค่าใช้จ่าย / Quotation / Cost model ภายในโมดูลอาคาร

เป้าหมายคือ Source-Parity Recovery + Professional UX Reconstruction โดยรักษา architecture, authentication, authorization, database, audit และ integration ของ SuperApp เอาไว้

---

# 1. SOURCE-OF-TRUTH MODEL

ใช้หลัก:

```text
Original Module
= Product behavior / workflow / mental model / UX reference

SuperApp
= Security / identity / authorization / database / integration architecture
```

ห้ามนำ security weakness ของระบบเก่ากลับมา และห้ามลด workflow/use case/business information/role experience เพียงเพราะ target ปัจจุบันยังไม่มี

---

# 2. AUTHORITATIVE SOURCE REPOSITORIES

## 2.1 เงินประกัน

```text
https://github.com/Kobpatme/maxiwa.git
```

ไฟล์สำคัญ:
```text
index.html
domain-logic.js
firebase-client.js
mock-data.js
docs/*
deliverables/*
```

ให้ถือ `maxiwa` เป็น Deposit Manager UX baseline

## 2.2 อาคาร + ค่าใช้จ่าย

```text
https://github.com/Kobpatme/Permission_Next.git
```

ไฟล์สำคัญ:
```text
Permission_Next.html
app.js
quotation-engine.js
ui.js
firebase-init.js
README.md
assets/*
```

ให้ถือ `Permission_Next` เป็น Buildings + Cost + Quotation UX baseline

---

# 3. SCOPE

## In scope — เงินประกัน
- My Dashboard
- Smart Queue / งานที่ต้องติดตาม
- Executive Dashboard
- รายการเงินประกัน
- On Service
- งานสำเร็จ
- TL Workspace
- Detail / Edit / workflow transition
- Files/evidence
- Refund state
- Financial summary
- Notifications
- role-aware navigation
- analytics
- search/filter/export

## In scope — อาคาร
- map-first workspace
- search/autocomplete
- map markers / clustering
- status summary
- filters
- building drawer/detail
- contacts
- documents / NAS UX
- map links
- data readiness / freshness
- role-based actions
- editor/admin flow

## In scope — ค่าใช้จ่าย
- CAPEX
- OPEX monthly
- OPEX annual
- Deposit / security deposit
- unclassified costs
- additional costs
- revenue share
- building-specific cost formula
- quotation
- quotation preview
- draft/history decision
- calculation provenance
- role-based cost editing

## Out of scope except regression
Work/KPI — ห้ามรื้อใหม่ ทำเฉพาะ regression fixes จาก shared CSS/components/navigation

---

# 4. CURRENT SUPERAPP MODULE MODEL

ตรวจ `src/lib/module-registry.ts`

ปัจจุบัน:
```text
work        = งานและ KPI
buildings   = อาคารและค่าใช้จ่าย
guarantees  = เงินประกัน
```

ให้รักษา architecture นี้

อย่าสร้าง module ค่าใช้จ่ายใหม่โดยไม่มีเหตุผล เพราะค่าใช้จ่ายเป็น domain สำคัญภายใน `อาคารและค่าใช้จ่าย`

---

# 5. SAFETY + BASELINE

ก่อนแก้:
1. ตรวจ git status
2. ตรวจ current branch
3. preserve uncommitted work
4. ห้าม reset/clean/checkout ทับงานโดยพลการ
5. ตรวจ package.json
6. รัน lint / typecheck / tests / build ตาม scripts จริง
7. บันทึก existing failures

ถ้าสร้าง branch ใช้:
```text
fix/guarantee-buildings-cost-parity
```

---

# 6. USE REPOSITORY INTELLIGENCE TOOLS

ใช้ JEV / native code tools / repository inspection tools ที่มีอยู่เพื่อ inspect:
- routes
- components
- CSS
- domain models
- DB adapters
- actions
- server functions
- authorization
- source tests
- dead UI
- duplicate UI
- source-parity docs
- legacy bridge routes

ห้ามอ่านแค่ component หลักแล้วเริ่มแก้

---

# 7. REQUIRED AUDITS

ก่อน implementation สร้าง:
```text
docs/audits/GUARANTEE-PARITY-AUDIT.md
docs/audits/BUILDINGS-COST-PARITY-AUDIT.md
```

แต่ห้ามหยุดหลัง audit ให้ลงมือ implementation ต่อทันที

Parity matrix:
| Source feature | Source screen | Source evidence | SuperApp target | Current state | Decision | Test |
|---|---|---|---|---|---|---|

Decision:
```text
KEEP
PORT
ADAPT
REFACTOR
REWRITE
RETIRE
```

Status:
```text
DONE
PARTIAL
MISSING
BLOCKED
```

ห้าม mark DONE เพราะมีชื่อ route/component เท่านั้น

---

# PART A — GUARANTEE / DEPOSIT MODULE RECOVERY

# 8. CORE PROBLEM

SuperApp ปัจจุบันมี:
```text
DepositWorkspace
DepositEditor
DepositTlWorkspace
deposit-v2-domain
deposit-v2-server
guarantee-view-model
```

และ CSS `legacy-deposit-*`

แต่ visual similarity บางส่วนไม่เท่ากับ source parity

ตรวจว่าปัจจุบัน:
- รวมหลาย screen เป็น workspace เดียวหรือไม่
- ลด role navigation หรือไม่
- ลด My Dashboard หรือไม่
- ลด Executive Dashboard หรือไม่
- ทำ Smart Queue ง่ายเกินไปหรือไม่
- ทำ On Service เป็นเพียง filter หรือไม่
- ลด TL flow หรือไม่
- ลด notification/action context หรือไม่
- ลด financial context หรือไม่

ถ้าใช่ ให้ rebuild UX layer

---

# 9. SOURCE NAVIGATION BASELINE — DEPOSIT

จาก `maxiwa` อย่างน้อยมี:
```text
My Dashboard
งานที่ต้องติดตาม
Executive Dashboard
เงินประกันอาคาร
มีประกันรื้อถอน (On Service)
งานสำเร็จ
```

Role-specific:
```text
ดำเนินการโดย TL
  งานหน้างาน TL
```

Admin:
```text
จัดการผู้ใช้งาน
```

SuperApp ไม่จำเป็นต้อง copy sidebar ซ้อน global sidebar แต่ต้องรักษา domain navigation model

---

# 10. GUARANTEE LOCAL NAVIGATION

แนะนำ target IA:
```text
เงินประกัน
├─ ภาพรวมของฉัน
├─ งานที่ต้องติดตาม
├─ รายการเงินประกัน
├─ On Service
├─ งานสำเร็จ
├─ Dashboard / วิเคราะห์
└─ งานทีมติดตั้ง [ตามสิทธิ์]
```

แสดงเฉพาะ scope ตามสิทธิ์ และ authorization ต้อง server-side

---

# 11. MY DASHBOARD — GUARANTEE

Personal dashboard ต้องตอบ:
```text
วันนี้ฉันต้องทำอะไร?
มีเงินอะไรที่ยังค้าง?
งานใดติดอยู่ขั้นตอนไหน?
```

อย่างน้อยมี:
- งานของฉันทั้งหมด
- งานที่ต้องดำเนินการ
- ใกล้ deadline
- รอเอกสาร
- รอ TL
- กำลังคืนเงิน
- On Service
- งานเสร็จล่าสุด
- outstanding amount
- recent activity
- actionable notifications

---

# 12. SMART QUEUE

ต้องไม่ลดเป็น sorted array + badge เท่านั้น

ตรวจ source logic แล้วรักษาเหตุผล เช่น:
- overdue
- missing document
- awaiting financial action
- awaiting TL
- refund pending
- Off Service required
- stale item
- high outstanding amount
- incomplete workflow

แต่ละ row ต้องบอก:
```text
ทำไมรายการนี้ขึ้นมา
ควรทำอะไรต่อ
ใครรับผิดชอบ
ยอดเงินที่เกี่ยวข้อง
สถานะ
```

---

# 13. EXECUTIVE DASHBOARD

เทียบ source โดยละเอียด

อย่างน้อย:
- Total insurance / valuation ตาม semantics จริง
- Installation deposit
- Demolition deposit
- refunded
- outstanding
- pending count
- success/refund rate
- pending breakdown by workflow status
- trend/distribution ถ้าข้อมูลรองรับ
- non-refundable fees/cost
- On Service exposure

metric ที่ click ได้ควร drill-down ไป filtered list ที่เกี่ยวข้อง

---

# 14. GUARANTEE REGISTER

อย่างน้อย:
- CID
- NO.
- status
- building
- customer
- owner
- PR
- request date
- total
- installation deposit
- demolition deposit ถ้าเหมาะสม
- area
- current step
- action

รองรับ:
- search
- status
- owner
- area
- sort
- pagination
- keyboard
- copy CID
- export
- row open

ห้าม operational table ใช้ text 10px

---

# 15. ON SERVICE — FIRST-CLASS VIEW

ต้องตอบ:
- ยังมีเงินประกันรื้อถอนกี่งาน
- ยอดรวมเท่าไร
- งานไหนเสี่ยง
- Off Service state
- next action
- owner
- building/customer
- age

ห้ามทำเป็น filter ธรรมดาอย่างเดียว

---

# 16. COMPLETED / HISTORY VIEW

ต้อง:
- search
- date filter
- export
- inspect refund outcome
- inspect financial summary
- open full detail
- show completion date

---

# 17. TL WORKSPACE

ต้องตอบ:
```text
TL ได้รับงานอะไร?
ต้องทำอะไร?
กำหนดเมื่อไร?
ต้องแนบหลักฐานอะไร?
เสร็จแล้วส่งต่ออย่างไร?
```

ต้องมี:
- assigned work
- due date
- building
- contact
- instruction
- evidence
- note
- workflow action
- completion handoff
- Off Service task ถ้ามี
- mobile-first usability

---

# 18. GUARANTEE DETAIL

Hierarchy:

## Header
- building
- customer/project
- CID/NO
- owner
- status
- next action

## Workflow progress
- completed/current/waiting stages

## Main information
- customer
- project
- area
- PR
- CID
- TL
- contact
- request date
- important dates

## Financial
- installation deposit
- demolition deposit
- building fee
- other cost
- total
- refunded
- outstanding

## Documents
- payment
- drawing
- additional
- TL evidence
- Off Service
- final evidence

## Refund
- install refunded
- demo refunded
- refund date
- Off Service

## History
- transition
- note
- actor
- timestamp

technical audit text ต้องไม่ dominate primary UI

---

# 19. GUARANTEE EDITOR

เป้าหมาย:
- grouped forms
- status transition แยกจาก master-data edit
- destructive action ชัด
- validation
- evidence requirement
- reason เมื่อจำเป็น
- audit automatic

ห้ามให้ user แก้ raw status โดยตรงโดยไม่ผ่าน workflow command

---

# 20. GUARANTEE NOTIFICATION

Notification ต้อง actionable:
```text
รายการ X รอเอกสาร
รายการ Y รอ TL
รายการ Z รอคืนเงิน
รายการ A ค้างเกินกำหนด
```

ไม่ใช่ technical event stream

---

# 21. GUARANTEE FINANCIAL SEMANTICS

ตรวจสูตร:
- deposit
- demolish
- fee
- other
- refundable
- non-refundable
- outstanding
- refunded

เพิ่ม unit tests ของ helpers

---

# PART B — BUILDINGS / PERMISSION MODULE

# 22. BUILDINGS UX PRINCIPLE

ต้องรักษา map-first mental model:

```text
ค้นหาอาคาร
→ เห็นผลบนแผนที่และรายการ
→ เปิด building drawer
→ ตรวจ ภาพรวม / ผู้ติดต่อ / ค่าใช้จ่าย / เอกสาร
→ เปิดแผนที่
→ ประเมินราคาเบื้องต้น
```

ห้ามเปลี่ยนเป็น generic table/dashboard

---

# 23. BUILDINGS MAIN WORKSPACE

ตรวจ:
```text
src/app/(platform)/buildings/buildings-workspace.tsx
src/app/(platform)/buildings/building-map.tsx
src/app/(platform)/buildings/permission-buildings.css
```

ต้องมี:
- search
- autocomplete
- map
- building list
- quick status
- advanced filter
- result count
- fit visible markers
- selected state
- drawer/detail

---

# 24. BUILDING SEARCH

รักษา:
- ไทย
- English
- building code
- autocomplete
- keyboard navigation
- result status
- area/context

ถ้า target ใช้ server pagination อย่าให้ autocomplete จำกัดแค่ current page โดยไม่ตั้งใจ

---

# 25. MAP PARITY

Map เป็น functional workspace:
- marker colors/status
- clustering
- marker click
- selected building
- fit visible
- mapped/unmapped count
- responsive
- empty state
- external map link
- coordinate copy

Map กับ list ต้อง sync

---

# 26. BUILDING DRAWER

Source tabs:
```text
ภาพรวม
ผู้ติดต่อ
ค่าใช้จ่าย
เอกสาร
```

ต้องรักษา

Header:
- Thai name
- English name
- status
- group
- type
- install type
- survey type

Quick summary:
- status
- area
- province
- freshness/update state

Actions:
- edit
- open map
- quotation

---

# 27. BUILDING GENERAL TAB

ต้องมี:
- location/zone
- permission duration
- WM point
- enclosure
- max horizontal
- address
- coordinate
- remark
- data readiness/stale warning

restore concept:
```text
ข้อมูลพร้อมสำหรับการประเมินเบื้องต้น
ข้อมูลที่ควรตรวจสอบ
```

---

# 28. CONTACT TAB

ต้องมี:
- contacts
- phones
- mobiles
- email
- click-to-call
- mailto
- copy
- proper empty state

---

# 29. BUILDING FRESHNESS

แสดง:
- อัปเดตล่าสุด
- ข้อมูลเก่า
- ยังไม่มี WM point
- ข้อมูลไม่พร้อมประเมิน

อย่าสร้าง false precision

---

# 30. BUILDING EDITOR

ตามสิทธิ์ ต้องรองรับ:
- names
- status
- classification
- coordinates
- permission fields
- installation fields
- contacts
- costs
- formula
- other fees
- remark

server permission ต้องเป็น authority

---

# PART C — COST / EXPENSE PARITY

# 31. COST IS A FIRST-CLASS BUILDING DOMAIN

ต้นฉบับมี classification:
```text
CAPEX
OPEX / OPEX_MONTHLY
OPEX_ANNUAL
DEPOSIT
UNCLASSIFIED
```

UI:
```text
ค่าใช้จ่ายครั้งแรก
ค่าใช้จ่ายรายเดือน
ค่าใช้จ่ายรายปี
เงินประกัน / เงินมัดจำ
รายการอื่นที่ต้องตรวจสอบ
```

ต้องรักษา semantics เหล่านี้

---

# 32. COST TAB

แต่ละ item:
- label
- amount/rate
- type
- unit
- calculation behavior
- period
- note/detail

Group summary:
- subtotal
- recurring/non-recurring context

ห้ามรวม monthly + annual + once-off เป็นยอดเดียวแบบไม่มีบริบท

---

# 33. REVENUE SHARE

รองรับ:
```text
calculation_type = revenue_share
revenue_period = monthly | annual
```

ต้อง:
- preserve rate
- preserve period
- percentage ไม่ใช่ currency
- แสดงว่า "คิดจากรายได้รายเดือน/รายปี"
- รวมใน quotation ตาม semantics ที่ถูกต้อง

เพิ่ม tests

---

# 34. OTHER FEES

ต้นฉบับรองรับ:
```text
ค่าใช้จ่ายเพิ่มเติม
+ เพิ่มค่าใช้จ่าย
```

ต้องรักษา dynamic list:
- label
- amount/rate
- type
- unit
- calculation type
- period
- validation

---

# 35. BUILDING-SPECIFIC COST FORMULA

ตรวจ source fields เช่น:
```text
calc_meters_per_floor
calc_cable_rate_per_meter
calc_equipment_cost
calc_odf_cost
calc_splice_cost
shaft_fee_per_floor
horizontal_fee
```

Target ต้อง:
- per-building override
- central defaults
- แสดง default vs override
- validate numeric
- preserve provenance

ห้าม hard-code calculation constants ใน UI component

---

# 36. QUOTATION — CRITICAL

ต้นฉบับมี:
```text
ประเมินราคาเบื้องต้น
```

Multi-step:
```text
1 ลูกค้า
2 เส้นทางสาย
3 เงื่อนไข
4 ตรวจสอบราคา
```

SuperApp ต้อง restore flow นี้ถ้ายัง missing/partial

---

# 37. QUOTATION STEP 1 — CUSTOMER

รองรับ:
- selected building
- customer
- project / identifiers ที่ source ใช้
- contact
- relevant metadata

อย่าให้กรอกข้อมูลซ้ำโดยไม่จำเป็น

---

# 38. QUOTATION STEP 2 — CABLE ROUTE

รองรับ:
- vertical route
- horizontal route
- floors
- meters per floor
- total cable distance
- shaft
- source-specific route fields

แสดง distance summary

สูตรต้องอยู่ domain calculation module

---

# 39. QUOTATION STEP 3 — CONDITIONS

รวม:
- building costs
- recurring fees
- deposits
- revenue share
- other fees
- cost conditions
- default/override

ผู้ใช้ต้องเห็น cost ใดถูกนำไปคิด

---

# 40. QUOTATION STEP 4 — REVIEW

ต้องมี:
- CAPEX summary
- recurring cost
- deposit
- installation cost
- other fees
- assumptions
- source building
- recalculation state
- stale warning

รักษา concept:
```text
ข้อมูลมีการเปลี่ยนแปลง — กรุณากดคำนวณใหม่ก่อนส่งออก
```

---

# 41. QUOTATION DRAFT / HISTORY

ต้นฉบับมี:
```text
บันทึกร่าง
เรียกคืนร่าง
ประวัติร่าง
ฉบับที่
```

ตรวจ business relevance

ถ้ายังใช้:
```text
PORT / ADAPT
```

ถ้าจะ retire ต้องระบุเหตุผลใน audit

ห้ามหายไปเงียบ ๆ

---

# 42. QUOTATION PREVIEW / EXPORT

รักษา flow:
```text
กรอก → ตรวจ → preview → export
```

preview ต้องเป็น business-readable document

---

# 43. COST + GUARANTEE RELATIONSHIP

แยก concept:

## Building DEPOSIT
ค่าใช้จ่าย/เงื่อนไขของอาคาร

## Guarantee
workflow ติดตามเงินประกันที่จ่ายจริงและขอคืน

ห้าม merge domain โดยไร้ boundary

แต่ทำ cross-module link ได้เมื่อ identity เชื่อถือได้:
```text
Building → related guarantee cases
Guarantee → building master/detail
```

ห้าม fuzzy-match ชื่ออาคารแล้วผูกอัตโนมัติโดยไม่มี safety

ใช้ explicit building ID / mapping table เมื่อทำได้

---

# 44. CROSS-MODULE EXPERIENCE

Building drawer อาจมี:
```text
เงินประกันที่เกี่ยวข้อง
```

Guarantee detail อาจมี:
```text
เปิดข้อมูลอาคาร
```

แต่ authorization ของแต่ละ module ต้องแยกตรวจ

---

# 45. SHARED PRODUCT DESIGN — NOT SHARED WORKFLOW

แชร์:
- typography
- colors
- controls
- focus
- dialog shell
- responsive foundation
- status semantics
- spacing

แต่:
```text
Work != Buildings != Guarantee
```

อย่าบังคับ same dashboard/table/nav/detail ถ้าทำให้ source workflow แย่ลง

---

# 46. TYPOGRAPHY

Baseline:
```text
Body         15–16px
Navigation   14–16px
Table cell   14–15px
Table header 13–14px
Secondary    13–14px
Badge        12–13px
Form input   15–16px
```

โดยเฉพาะ:
- legacy-deposit-table
- legacy-kpis
- owner-badge
- area-badge
- building drawer
- fee rows

ต้องอ่านง่าย

---

# 47. RESPONSIVE / OVERFLOW

ตรวจ:
```text
1440x900
1366x768
1280x800
1024x768
768x1024
430x932
390x844
360x800
```

Guarantee:
- tables
- finance cards
- workflow progress
- TL mobile

Buildings:
- map/list split
- drawer
- search
- filters

Quotation:
- 4-step
- preview
- long cost labels

0 accidental horizontal page overflow

---

# 48. MOBILE — GUARANTEE

ห้ามบีบ 12-column table ลง mobile

ใช้:
- cards
- essential columns
- expandable row
- detail route

Smart Queue และ TL ต้อง mobile-first

---

# 49. MOBILE — BUILDINGS

Map ต้องยัง usable:
- search first
- map/list toggle หรือ adaptive layout
- drawer เป็น bottom/full-screen sheet
- filters accessible
- selected building preserved

ห้ามซ่อน map แบบไม่มีทางเปิดกลับ

---

# 50. SYSTEM COPY CLEANUP

ห้าม primary UI โชว์:
- raw DB ID
- source state
- migration text
- adapter error
- internal enum
- technical preview copy
- developer wording

rewrite เป็นภาษาผู้ใช้

---

# 51. ERROR STATES

แยก:
```text
not configured
temporarily unavailable
permission denied
no data
no match
partial data
document storage unavailable
calculation error
```

ห้าม silent fallback

---

# 52. DOCUMENT / NAS EXPERIENCE

Buildings documents:
- loading
- empty
- unavailable
- forbidden
- timeout
- categories
- filename
- size
- modified date
- download

ห้าม expose token/internal bridge details

---

# 53. GUARANTEE FILES / EVIDENCE

ต้องแสดง:
- expected evidence
- uploaded
- missing
- upload progress
- error
- role permission
- required-before-transition

ถ้าผู้ใช้เปิดไฟล์ได้ ต้องไม่ลดเหลือ checkbox มี/ไม่มี

---

# 54. SECURITY

ห้ามนำกลับ:
- client-authority
- role from request body
- direct Firebase service access from browser
- uncontrolled file URL
- unchecked status mutation
- hard delete without policy

Mutation ต้อง:
- authenticated
- authorized
- validated
- audited

---

# 55. PERFORMANCE

Guarantee:
- ตรวจ limit 500
- server pagination
- server filters
- search
- analytics
- export

อย่าโหลดทุก row แล้ว filter client-side หาก production data โตได้

Buildings:
- server pagination
- map data strategy
- search endpoint
- marker payload

Quotation:
- calculation ใน domain layer
- persisted result validate server-side

---

# 56. TEST PLAN — GUARANTEE

เพิ่ม tests:
```text
guarantee view routing
personal dashboard scope
smart queue reasons
on-service classification
completed classification
outstanding amount
refund state
workflow transitions
TL permissions
evidence requirements
role nav
executive metrics
```

---

# 57. TEST PLAN — BUILDINGS

เพิ่ม tests:
```text
building query
status filter
autocomplete/search
cost grouping
freshness
map coordinates
document access
role actions
building relation
```

---

# 58. TEST PLAN — COST / QUOTATION

เพิ่ม tests:
```text
CAPEX grouping
monthly OPEX
annual OPEX
DEPOSIT
UNCLASSIFIED
revenue_share monthly
revenue_share annual
other fees
per-building overrides
default fallback
vertical distance
horizontal distance
total cable distance
shaft fee
quotation stale state
quotation totals
```

---

# 59. E2E / INTEGRATION CRITICAL FLOWS

## G1
Guarantee → My Dashboard → urgent case → update workflow

## G2
Guarantee → Smart Queue → reason → action

## G3
Guarantee → On Service → case → Off Service flow

## G4
TL → assigned task → evidence → complete handoff

## B1
Buildings → search → map marker → drawer

## B2
Buildings → drawer → contacts → copy/call

## B3
Buildings → drawer → costs

## B4
Buildings → drawer → documents

## Q1
Buildings → quotation → step1 → step2 → step3 → calculate → review

## Q2
Change building/cost input → quotation stale → recalculate

---

# 60. ACCEPTANCE GATES — GUARANTEE

```text
G-01 My Dashboard จริง
G-02 Smart Queue มี reason/next action
G-03 Executive Dashboard ใกล้ source semantics
G-04 Main register usable
G-05 On Service first-class
G-06 Completed usable
G-07 TL mobile workflow complete
G-08 Detail financial/documents/workflow complete
G-09 role-aware local nav
G-10 no important source feature silently removed
```

---

# 61. ACCEPTANCE GATES — BUILDINGS

```text
B-01 Map-first preserved
B-02 Search/autocomplete usable
B-03 Map/list sync
B-04 Drawer: Overview/Contact/Cost/Documents
B-05 Data readiness/freshness
B-06 Role edit action
B-07 Map/coordinate action
B-08 Document flow usable
```

---

# 62. ACCEPTANCE GATES — COST

```text
C-01 CAPEX
C-02 OPEX monthly
C-03 OPEX annual
C-04 Deposit
C-05 Unclassified
C-06 Revenue share
C-07 Other fees
C-08 Building formula overrides
C-09 Cost editing
```

---

# 63. ACCEPTANCE GATES — QUOTATION

```text
Q-01 Accessible from building
Q-02 Multi-step flow
Q-03 Cable distance summary
Q-04 Building costs injected
Q-05 CAPEX/OPEX/deposit semantics
Q-06 Stale protection
Q-07 Review/preview
Q-08 Draft/history explicitly PORT or RETIRE with reason
```

---

# 64. VISUAL VERIFICATION

เปรียบเทียบ source กับ target จริง

เงินประกัน:
```text
My Dashboard
Smart Queue
Executive Dashboard
Main List
On Service
Done
TL
Detail
```

อาคาร:
```text
Main map
Search
Filter
Drawer overview
Contact
Cost
Documents
Quotation
```

ไม่ต้อง pixel-perfect แต่ต้อง:
```text
behaviorally recognizable
workflow recognizable
content hierarchy comparable
```

---

# 65. DO NOT OVER-COPY LEGACY VISUAL DEBT

source มี text เล็กบางจุด

ไม่ต้อง copy ข้อเสีย

preserve:
- hierarchy
- navigation
- density concept
- workflow

แต่ใช้ typography ของ SuperApp ที่อ่านง่าย

---

# 66. CSS RULE

ห้ามสร้าง:
```text
guarantee-final.css
building-fix.css
cost-hotfix.css
legacy-v3.css
```

เพื่อ override ปลายเหตุ

ใช้:
- tokens
- shared primitives
- domain CSS
- scoped selectors

cleanup `legacy-*` ได้ถ้า structure ใหม่ดีกว่า

---

# 67. COMPONENT ARCHITECTURE

พิจารณา:
```text
src/features/guarantees/
  screens/
  components/
  domain/
  queries/
  actions/

src/features/buildings/
  screens/
  components/
  cost/
  quotation/
  map/
```

ไม่จำเป็นต้องย้ายทุกไฟล์ถ้าความเสี่ยงสูง แต่ห้าม giant component โตต่อโดยไร้โครงสร้าง

---

# 68. WORK/KPI REGRESSION

shared CSS changes ต้องตรวจ:
```text
/work
/work/mine
/work/team
/work/assign
/work/people
/work/tracker
/work/kpi
/work/reports
```

ถ้า regress ต้องแก้ก่อน final

---

# 69. BUILD / QUALITY

รันตาม scripts จริง:
```text
lint
typecheck
test
build
```

ห้าม claim success ถ้า build fail

---

# 70. FINAL DOCUMENTS

สร้าง:
```text
docs/audits/GUARANTEE-PARITY-AUDIT.md
docs/audits/BUILDINGS-COST-PARITY-AUDIT.md

docs/results/GUARANTEE-PARITY-RESULT.md
docs/results/BUILDINGS-COST-PARITY-RESULT.md
```

อัปเดต source parity docs เดิมถ้ามี

---

# 71. FINAL REPORT FORMAT

สรุป:
1. Root causes
2. Guarantee changes
3. Buildings changes
4. Cost model changes
5. Quotation changes
6. Cross-module links
7. Responsive fixes
8. Accessibility
9. Performance
10. Security
11. Tests run
12. Build result
13. Visual QA
14. Parity matrix: DONE / PARTIAL / BLOCKED
15. Remaining gaps

ห้ามซ่อนสิ่งที่ยังไม่เสร็จ

---

# 72. EXECUTION ORDER

```text
01 Git safety
02 baseline build/test
03 inspect source maxiwa
04 inspect source Permission_Next
05 Guarantee parity audit
06 Buildings/Cost parity audit
07 shared UX regression baseline
08 Guarantee IA/local nav
09 Guarantee My Dashboard
10 Smart Queue
11 Main register
12 On Service
13 Completed
14 Executive Dashboard
15 Guarantee detail/editor
16 TL workflow
17 Guarantee responsive
18 Building search/map
19 Building drawer/detail
20 Contact
21 Cost tab
22 Building editor
23 Cost editor/model
24 Quotation multi-step
25 Quotation calculation
26 Quotation preview/history decision
27 Documents/NAS
28 Cross-module building/guarantee links
29 responsive
30 accessibility
31 performance
32 tests
33 build
34 visual source comparison
35 Work/KPI regression
36 docs
37 final report
```

---

# 73. NON-NEGOTIABLE RULES

1. ห้ามใช้ current SuperApp UI เป็น source UX truth
2. เงินประกันต้องเทียบ `maxiwa`
3. อาคาร/ค่าใช้จ่ายต้องเทียบ `Permission_Next`
4. ห้ามลด My Dashboard / Smart Queue / Executive / On Service / TL ให้เหลือ generic tab โดยไม่วิเคราะห์
5. Map-first buildings UX ต้องไม่หาย
6. ค่าใช้จ่ายต้องรักษา CAPEX/OPEX/Deposit/Revenue Share semantics
7. Quotation ต้องไม่ถูกลดเหลือ calculator input เดียว
8. ห้ามทำ cross-module relation ด้วย fuzzy match ที่เสี่ยง
9. ห้าม security downgrade
10. ห้าม Work/KPI regress
11. ห้ามจบที่ audit
12. ห้ามจบที่ CSS polish
13. ห้าม mark DONE จน visual + behavior test ผ่าน

---

# 74. DEFINITION OF DONE

## Guarantee
- mental model ใกล้ maxiwa
- role experience ครบ
- My Dashboard ใช้งานได้
- Smart Queue actionable
- Executive Dashboard usable
- On Service จริง
- TL workflow จริง
- Detail/financial/evidence/workflow ครบ

## Buildings
- map-first ใกล้ Permission_Next
- search/filter/autocomplete ดี
- drawer detail ครบ
- contacts usable
- documents usable
- freshness/data readiness ชัด

## Costs
- grouped semantics ครบ
- revenue share ถูกต้อง
- other fees ครบ
- formula override ครบ

## Quotation
- multi-step
- calculations validated
- cost semantics ถูกต้อง
- stale state
- preview/export flow

## Overall
- responsive
- readable
- no major overflow
- tests pass
- build pass
- Work/KPI ไม่ regress
- docs updated
- known gaps reported honestly

---

# 75. FINAL INSTRUCTION TO CODEX

ทำงาน end-to-end และอย่าหยุดเพื่อถาม approval ทุก phase

เมื่อพบ ambiguity:
1. inspect source
2. inspect business logic
3. inspect tests
4. choose solution preserving source behavior
5. maintain target security architecture
6. implement
7. test
8. visually compare
9. continue

ถ้า source กับ SuperApp ขัดกัน:
```text
UX/workflow → source module wins
security/authorization/data integrity → SuperApp architecture wins
```

เป้าหมายคือทำให้ **เงินประกัน + อาคารและค่าใช้จ่าย** กลับมามีความรู้สึกและประสิทธิภาพใกล้ต้นฉบับในระดับเดียวกับที่ Work/KPI ถูกปรับสำเร็จแล้ว โดยไม่ทำให้ SuperApp กลายเป็นการยำหลายระบบเข้าด้วยกัน

ทำจนถึง Definition of Done ก่อนสรุปผล
