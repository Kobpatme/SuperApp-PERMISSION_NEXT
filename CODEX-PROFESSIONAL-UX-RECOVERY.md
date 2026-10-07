# CODEX PROFESSIONAL UX RECOVERY & SOURCE-PARITY REBUILD
## SuperApp PERMISSION_NEXT
### Target workspace: `D:\WebApp\SuperApp PERMISSION_NEXT`

---

# 0. PURPOSE

เอกสารนี้เป็น **Master Corrective Plan** สำหรับให้ Codex ทำการตรวจสอบ แก้ไข รื้อ และยกระดับโปรเจกต์ `SuperApp PERMISSION_NEXT` ให้มีความเป็นมืออาชีพ ใช้งานจริงได้ และมีประสบการณ์ใกล้เคียงระบบต้นฉบับมากที่สุด โดยเฉพาะโมดูล **งานและ KPI** ซึ่งในสถานะปัจจุบันมีความคลาดเคลื่อนจากต้นฉบับสูงมากทั้งด้าน:

- Information Architecture
- Navigation
- Screen hierarchy
- Workflow
- Visual hierarchy
- Typography
- Responsive behavior
- Table / form / card / dialog behavior
- Role-based experience
- Feature parity
- KPI experience
- Task lifecycle
- System messages / debug text
- Layout consistency
- Overflow / text truncation
- UX consistency between modules

งานนี้ **ไม่ใช่แค่ UI polish** และ **ไม่ใช่การเปลี่ยนสีหรือเพิ่ม spacing เป็นจุด ๆ**

ให้ถือว่านี่คือ:

> **Professional UX Recovery + Source-Parity Rebuild**

หลักการสำคัญคือ:

> **ต้นฉบับ = Product / UX Reference**
> **SuperApp = Integration / Architecture Target**

ดังนั้นให้เก็บข้อดีของ architecture ใหม่ เช่น authentication, authorization, database, audit, integration, security และ shared infrastructure ของ SuperApp ไว้ แต่ให้ดึง **workflow, information architecture, behavior, terminology, screen structure และ user experience ที่ดีจากต้นฉบับกลับมาอย่างจริงจัง**

---

# 1. PRIMARY WORKSPACE AND SOURCE OF TRUTH

## 1.1 Target project

ทำงานหลักที่:

```text
D:\WebApp\SuperApp PERMISSION_NEXT
```

อย่าแก้ production source repos โดยไม่จำเป็น

---

## 1.2 Source applications / original UX references

ให้ตรวจและเทียบกับ source ต้นฉบับต่อไปนี้ก่อนลงมือแก้ทุกโมดูล

### Permission / อาคาร

```text
https://github.com/Kobpatme/Permission_Next.git
```

ถ้ามี local checkout ให้ใช้ local ก่อน เพราะสะดวกต่อ visual comparison

---

### เงินประกันอาคาร

```text
https://github.com/Kobpatme/maxiwa.git
```

---

### งานและ KPI — CRITICAL / P0

```text
https://github.com/Kobpatme/maxiwa_KPI.git
```

โมดูลนี้ต้องถือว่า `maxiwa_KPI` เป็น **UX baseline หลัก**

อย่าตีความว่า SuperApp เวอร์ชันปัจจุบันคือ baseline

---

# 2. EXECUTION PHILOSOPHY

Codex ต้องทำงานตามหลักต่อไปนี้

## 2.1 Do not blindly preserve current UI

ห้ามถือว่า UI ปัจจุบันถูกต้องเพียงเพราะมี implementation อยู่แล้ว

ถ้า implementation ปัจจุบัน:

- แบน workflow ของต้นฉบับ
- ลดจำนวนหน้าจอ
- รวมหลาย use case เป็น generic page
- ทำให้ role-specific experience หายไป
- ทำให้ usability แย่ลง
- ทำให้ information hierarchy หายไป

ให้รื้อและออกแบบใหม่ได้

---

## 2.2 Preserve business behavior, not accidental legacy bugs

ให้รักษา:

- Domain behavior
- Workflow
- Terminology
- Task lifecycle
- KPI semantics
- Role-aware UX
- Search/filter semantics
- Job grouping
- Deadline behavior
- Hold behavior
- SLA behavior
- Weighted KPI logic

แต่ไม่จำเป็นต้องรักษา:

- legacy security flaws
- browser-side authorization
- unsafe direct database access
- hard delete
- duplicated CSS
- technical debt
- broken layout
- small unreadable typography
- old implementation limitations

---

## 2.3 No “Frankenstein SuperApp”

ห้ามแก้แบบนำ component ของแต่ละระบบมายำเข้าด้วยกันโดยไม่มี design language และ workflow ที่ชัดเจน

แต่ละ module ต้อง:

1. รักษา domain identity
2. อยู่ภายใต้ Core Shell เดียวกัน
3. ใช้ shared design tokens ที่เหมาะสม
4. ไม่ถูกบังคับให้ทุก module ใช้ layout เดียวกันจน workflow เสีย
5. ดูเป็นผลิตภัณฑ์เดียวกันโดยไม่สูญเสีย usability ของต้นฉบับ

---

# 3. WORK MODE / TOOL USAGE

ก่อนเริ่มแก้ ให้ใช้ tools / skills / local utilities ที่มีอยู่ใน environment อย่างเต็มที่

ถ้ามี JEV / repo intelligence / native code inspection tool พร้อมใช้งาน ให้ใช้เพื่อ:

- map codebase
- trace routes
- inspect dependencies
- discover dead UI
- compare duplicate components
- find stale CSS
- identify fallback behavior
- identify unreachable routes
- inspect all user-facing strings
- detect overflow-prone layouts
- detect hidden or unused source-parity implementation
- find test coverage gaps

อย่าทำงานโดยอาศัยการอ่านข้อความเพียงไม่กี่ไฟล์

---

# 4. PHASE 0 — SAFETY, INVENTORY AND BASELINE

ก่อนแก้ source code ให้ทำทั้งหมดต่อไปนี้

## 4.1 Repository safety

- ตรวจ git status
- ตรวจ current branch
- ตรวจ uncommitted work
- ห้ามลบงานของผู้ใช้งาน
- ห้าม reset / checkout ทับไฟล์โดยพลการ
- ถ้ามี local changes ให้ preserve ก่อน
- สร้าง branch สำหรับงาน recovery ถ้าเหมาะสม

แนะนำชื่อ:

```text
fix/professional-ux-source-parity
```

---

## 4.2 Build baseline

รันสิ่งที่มีในโปรเจกต์ตาม package scripts เช่น:

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

ถ้าชื่อ script ไม่ตรง ให้ตรวจ `package.json`

บันทึก:

- test failures เดิม
- build failures เดิม
- lint issues เดิม
- warnings เดิม

ห้ามทำให้ baseline แย่ลง

---

## 4.3 Route inventory

สร้าง inventory routes ทั้งหมด โดยเฉพาะ:

```text
/
 /work
 /work/mine
 /work/team
 /work/new
 /work/assign
 /work/people
 /work/tracker
 /work/kpi
 /work/reports
 /buildings
 /guarantees
 /admin
```

ตรวจว่า route แต่ละตัว:

- render อะไรจริง
- fallback ไป view ไหนหรือไม่
- มี navigation เข้าถึงหรือไม่
- มี role guard หรือไม่
- มี empty/error/loading state หรือไม่
- ใช้ component ใด
- มี source equivalent อะไร

---

# 5. PHASE 1 — FULL UX / UI AUDIT

สร้างไฟล์ใหม่:

```text
docs/audits/PROFESSIONAL-UX-RECOVERY-AUDIT.md
```

ต้องมีอย่างน้อย:

## 5.1 Global issues

ตรวจ:

- font size
- line-height
- font fallback ไทย
- text contrast
- overflow
- horizontal scroll
- hidden content
- truncation
- broken wrapping
- duplicate CSS
- conflicting selectors
- inconsistent spacing
- inconsistent buttons
- inconsistent page headings
- forms
- tables
- dialogs
- mobile
- tablet
- dark mode
- sticky elements
- z-index
- focus states
- keyboard usability

---

## 5.2 User-facing text audit

ค้นข้อความทุกประเภทที่ไม่ควรอยู่ใน production UI เช่น:

- debug text
- developer notes
- internal IDs
- API terminology
- source-system wording
- implementation details
- calculation IDs
- activity IDs
- rule version IDs
- database wording
- placeholder copy
- temporary migration copy
- “ระบบต้นทาง”
- “รายละเอียดทางเทคนิค”
- “รอเชื่อมข้อมูล”
- environment hints
- stack traces
- raw status values
- mock/test labels

แบ่งเป็น:

```text
USER COPY
ADMIN DIAGNOSTIC
DEVELOPER DIAGNOSTIC
REMOVE
```

Production UI ต้องไม่โชว์ technical diagnostics โดย default

---

# 6. PHASE 2 — TYPOGRAPHY RECOVERY

ปัจจุบันมี UI text จำนวนมากเล็กเกินไป

ให้ปรับ typography system ใหม่โดยยึด readability ภาษาไทยเป็นหลัก

## 6.1 Minimum recommended scale

ใช้ประมาณนี้เป็น baseline:

```text
Body / default UI     : 15–16px
Form label            : 14–15px
Input / select        : 15–16px
Navigation            : 14–16px
Secondary text        : 13–14px
Badge / status        : 12–13px
Table header          : 13–14px
Table cell            : 14–15px
Page title            : 28–34px desktop
Section title         : 20–24px
Card title            : 16–18px
```

ไม่ควรใช้:

```text
9px
10px
11px
```

ใน operational UI ปกติ ยกเว้น metadata ที่ไม่สำคัญจริงและยังอ่านได้

---

## 6.2 Typography requirements

- ไทยต้องอ่านง่าย
- ไม่ compact จนเกินไป
- line-height อย่างน้อย ~1.45 สำหรับ body
- table row ไม่อัดแน่นจนอ่านยาก
- button label ไม่เล็กเกินไป
- sidebar label ต้องอ่านได้ทันที
- no clipped glyphs
- no line-height collapse

---

# 7. PHASE 3 — OVERFLOW AND RESPONSIVE SYSTEM

ห้ามแก้ text overflow เป็นรายจุดอย่างเดียว

สร้างกฎกลาง

## 7.1 Required CSS rules

ตรวจและใช้ตามความเหมาะสม:

```css
min-width: 0;
max-width: 100%;
overflow-wrap: anywhere;
word-break: break-word;
```

ห้ามใช้ `overflow: hidden` เพื่อซ่อนปัญหาโดยไม่พิจารณา usability

---

## 7.2 Long values

ต้องรองรับ:

- Thai names
- building names
- job codes
- IDs
- document names
- long notes
- long KPI names
- breadcrumbs
- statuses
- role names
- owner names

---

## 7.3 Table strategy

สำหรับ desktop:

- table ใช้เต็มพื้นที่
- มี sensible min widths
- sticky header เมื่อเหมาะสม
- horizontal scroll เฉพาะเมื่อจำเป็น

สำหรับ mobile:

พิจารณา:

- responsive cards
- stacked rows
- expandable detail
- horizontal scroll พร้อม affordance

อย่าบีบ 6–10 columns ลงจอ 390px

---

## 7.4 Mandatory viewport QA

อย่างน้อย:

```text
1440 x 900
1366 x 768
1280 x 800
1024 x 768
768 x 1024
430 x 932
390 x 844
360 x 800
```

Acceptance:

```text
0 unintended text overflow
0 clipped buttons
0 inaccessible controls
0 page-breaking horizontal overflow
```

---

# 8. PHASE 4 — CSS AND DESIGN SYSTEM CLEANUP

ปัจจุบันมี CSS หลายยุคซ้อนกัน

ตรวจอย่างน้อย:

```text
src/app/globals.css
src/styles/tokens.css
src/styles/components.css
src/styles/shell.css
src/styles/ui.css
src/styles/work.css
```

---

## 8.1 Goals

- tokens มีแหล่งเดียว
- typography definitions มีแหล่งเดียว
- shell geometry มีแหล่งเดียว
- shared UI primitives มีแหล่งเดียว
- module CSS scoped
- ลด overrides
- ลด duplicate selectors
- ลบ dead CSS
- ลบ retired theme fragments
- ไม่มี selector ที่ต้อง “แข่ง specificity” โดยไม่จำเป็น

---

## 8.2 Do not

ห้ามเพิ่ม:

```text
theme-final.css
fix.css
override-v2.css
hotfix.css
work-final.css
```

เพื่อทับปัญหาเดิม

ให้แก้ root cause

---

# 9. PHASE 5 — WORK & KPI REBUILD (P0)

นี่คือส่วนสำคัญที่สุด

## 9.1 Current architecture problem

ตรวจยืนยัน implementation ปัจจุบันของ:

```text
src/components/work-workspace.tsx
src/components/work-route-page.tsx
src/app/(platform)/work/*
```

จุดที่ต้องแก้:

route:

```text
/work/assign
/work/people
/work/tracker
```

ต้องมี real views

ห้าม fallback ไป `"mine"`

---

# 10. WORK & KPI SOURCE-PARITY MODEL

ใช้ `maxiwa_KPI` เป็น UX baseline

ตรวจอย่างละเอียด:

```text
public/maxiwa.html
public/dashboard.html
public/js/maxiwa.js
public/js/api.js
public/js/executive-dashboard.js
public/_worker.js
docs/*
```

โดยเฉพาะ navigation model:

## Staff

```text
My Dashboard
My Tasks
Create Task
Job Tracker
```

## Lead

```text
My Dashboard
My Tasks
Create Task
Team Command
Team Tasks
Assign Task
Team People
Job Tracker
```

## Manager

```text
Operations Dashboard
Task Center
Assign Task
People
Job Tracker
System Control (ตามสิทธิ์)
```

## SrManager / Director / Executive

```text
Performance View
Performance Dashboard
Work Portfolio
People Overview
Job Tracker
```

## Admin

```text
System Dashboard
System Control
Job Tracker
```

SuperApp ไม่จำเป็นต้องใช้ label อังกฤษเหมือนเดิมทั้งหมด แต่ต้องรักษา mental model และ functionality

---

# 11. REBUILD WORK MODULE AS REAL SCREENS

อย่าให้ `WorkWorkspace` เป็น giant component ที่ทำทุกอย่าง

แยก component / screen อย่างมีโครงสร้าง เช่น:

```text
src/features/work/
  components/
  screens/
  domain/
  queries/
  actions/
  models/
```

ตัวอย่าง:

```text
MyWorkDashboard
MyTaskList
TeamCommandDashboard
TeamTaskCenter
AssignmentCenter
PeopleOverview
JobTracker
PerformanceReports
KpiWorkspace
```

ชื่อจริงปรับตาม architecture ปัจจุบันได้

---

# 12. MY DASHBOARD

ต้องมี visual hierarchy ที่ดีกว่า generic queue

อย่างน้อยควรมี:

- งานที่ต้องทำ
- งานใกล้ครบกำหนด
- overdue
- pending acceptance
- in progress
- on hold
- completed
- weighted progress
- KPI snapshot
- recent activity
- actionable next step

หลีกเลี่ยงการโชว์แต่ count แบบ generic

---

# 13. MY TASKS

ต้องรองรับ:

- Pending
- On Process
- On Hold
- Completed
- Cancelled

และ action ตามสิทธิ์:

- accept
- start
- hold
- resume
- complete
- add note
- edit permitted fields
- view audit/activity

ต้องมี task detail experience ที่ใกล้ source

---

# 14. CREATE TASK

รักษาความง่ายของต้นฉบับ

แต่ใช้ validation ฝั่ง server

ต้อง:

- clear required fields
- KPI selection ตาม scope
- SLA/deadline preview
- validation message อ่านง่าย
- success state ชัดเจน

---

# 15. TEAM COMMAND

Lead / Manager ต้องมีหน้าสำหรับบริหารทีมจริง

แสดง:

- team workload
- due / overdue
- pending
- blocked / on hold
- completion
- SLA
- people workload
- risk
- quick actions

อย่าใช้ My Work page แล้วเปลี่ยน filter เป็น team เท่านั้น

---

# 16. ASSIGNMENT CENTER

`/work/assign` ต้องเป็นหน้าจอจริง

ต้องรองรับ:

- เลือกคน
- เลือกทีมตามสิทธิ์
- เลือก KPI
- เลือก job
- multi-task assignment ตาม source behavior
- deadline
- notes
- duplicate prevention
- validation
- success feedback
- audit

ถ้า source รองรับ multiple jobs/tasks ให้รักษา behavior โดยไม่ทำให้ atomicity เสีย

---

# 17. PEOPLE

`/work/people` ต้องเป็นหน้าจอจริง

อย่างน้อย:

- people list
- team
- role
- active workload
- overdue
- completed
- weighted performance
- KPI assigned
- drill-down
- filters

Staff ไม่ควรเห็นข้อมูลเกิน scope

---

# 18. JOB TRACKER

`/work/tracker` ต้องเป็นหน้าจอจริง

คุณสมบัติสำคัญ:

- search job code
- group tasks by job
- one job → multiple tasks
- ไม่ deduplicate งานที่ถูกต้อง
- status per task
- owner
- KPI
- deadline
- notes
- audit timeline
- activity timeline
- grouped expansion

นี่คือ feature สำคัญของ source ห้ามลดเหลือ generic queue

---

# 19. KPI EXPERIENCE — REBUILD

KPI ปัจจุบันต้องปรับใหม่

## 19.1 Primary UI should show business information

ตัวอย่าง:

- Main KPI
- Sub KPI
- Weight
- Target
- Actual
- Progress
- SLA
- Performance
- Period
- trend / context
- owner/team scope

---

## 19.2 Technical lineage

ข้อมูลเช่น:

```text
activityEventId
ruleVersionId
calculationVersion
internal IDs
database row IDs
```

ห้ามเป็น primary content

ให้ย้ายไป:

```text
"ข้อมูลตรวจสอบ"
"Audit detail"
"Technical details"
```

และแสดงเฉพาะผู้มีสิทธิ์เมื่อจำเป็น

---

## 19.3 KPI transparency

ผู้ใช้ควรเข้าใจ:

```text
คะแนนมาจากอะไร
คิดอย่างไร
งานใดถูกนำมาคิด
น้ำหนักเท่าไร
ช่วงเวลาอะไร
SLA เท่าไร
```

ไม่ควรต้องอ่าน internal IDs เพื่อเข้าใจคะแนน

---

# 20. KPI ADMIN / CATALOG

รักษา concept:

- Main KPI
- Sub KPI
- Weight
- assignment
- team scope
- personal override
- active period
- versioning
- effective date

ถ้า SuperApp architecture มี versioned KPI rules ที่ดีกว่า legacy ให้ใช้ของใหม่

แต่ UX ต้องไม่ทำให้ admin ทำงานยากกว่าต้นฉบับ

---

# 21. SLA / DEADLINE BEHAVIOR

ตรวจ source algorithms

ต้องรักษา behavior:

- Asia/Bangkok dates
- weekends excluded
- active holidays excluded
- hold duration extends effective deadline
- cancelled excluded where appropriate
- weighted SLA consistent

ต้องมี tests

---

# 22. STATUS VOCABULARY

UI ควรแสดงสถานะที่มนุษย์เข้าใจ

source:

```text
Pending
On Process
On Hold
Completed
Cancelled
```

ถ้า database ใหม่ใช้:

```text
queued
in_progress
blocked
done
cancelled
```

ให้ map ใน domain/presentation layer

ห้ามโชว์ raw enum ให้ผู้ใช้โดยไม่จำเป็น

---

# 23. SYSTEM MESSAGE CLEANUP

ทำ centralized copy audit

ลบหรือซ่อนข้อความเช่น:

```text
activity:
rule:
calculation:
ระบบต้นทาง
รอเชื่อมข้อมูล
debug
source unavailable
technical details
preview internals
migration state
environment hints
```

ถ้าเป็น error ที่ผู้ใช้จำเป็นต้องรู้ ให้ rewrite เป็นภาษามนุษย์ เช่น:

แทน:

```text
source unavailable
```

ใช้:

```text
ไม่สามารถโหลดข้อมูลได้ในขณะนี้
ลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบหากปัญหายังคงอยู่
```

---

# 24. EMPTY STATES

ทุกหน้าต้องมี empty state ที่บอก:

1. เกิดอะไรขึ้น
2. เพราะอะไร
3. ผู้ใช้ทำอะไรต่อ

ตัวอย่าง:

```text
ยังไม่มีงานที่ได้รับมอบหมาย
งานใหม่ที่ได้รับมอบหมายจะแสดงที่นี่
```

ไม่ใช้ข้อความ technical

---

# 25. ERROR STATES

ต้องแยก:

- permission denied
- no data
- loading
- API error
- partial data
- validation error
- unavailable service

ไม่ใช้ fallback ไปหน้าอื่นแบบ silent

**Critical rule:**

> ถ้า route มี error ห้าม fallback ไป My Work แล้วทำเหมือนสำเร็จ

---

# 26. LOADING STATES

ทุก dynamic page ต้องมี loading state ที่สอดคล้องกับ layout จริง

หลีกเลี่ยง:

- layout shift
- blank screen
- tiny spinner without context

---

# 27. NAVIGATION REBUILD

Global sidebar = module navigation

Work module ต้องมี local navigation ที่สะท้อน role/use case

อย่าเอาทุกอย่างไปยัดใน global sidebar

ตัวอย่าง:

```text
งานของฉัน
  ภาพรวม
  งานของฉัน
  สร้างงาน

บริหารทีม
  ภาพรวมทีม
  งานของทีม
  มอบหมายงาน
  บุคลากร

เครื่องมือ
  Job Tracker
  KPI
  รายงาน
```

แสดงเฉพาะสิ่งที่ role เข้าถึงได้

---

# 28. PERMISSION MODULE PARITY

หลัง Work/KPI P0 ให้ตรวจ `/buildings`

เทียบกับ `Permission_Next`

ตรวจ:

- map-first workflow
- search
- filters
- building detail
- drawer
- interaction
- responsiveness
- action placement
- terminology

อย่าปรับให้เหมือน Work module หาก source UX เหมาะกว่า

---

# 29. GUARANTEE MODULE PARITY

เทียบ `/guarantees` กับ `maxiwa`

ตรวจ:

- queues
- detail
- transitions
- documents
- money values
- installation-team view
- filtering
- statuses
- workflow

รักษา business flow ของต้นฉบับ

---

# 30. DESIGN QUALITY TARGET

เป้าหมาย:

```text
Enterprise operational workspace
Professional
Clean
Readable
Dense enough for real work
Not tiny
Not toy-like
Not over-decorated
Consistent
Fast to scan
Thai-first readability
```

หลีกเลี่ยง:

- excessive gradients
- glassmorphism
- huge cards
- too much whitespace
- 10px labels everywhere
- decorative dashboards ที่ใช้งานจริงยาก
- over-rounded controls
- rainbow status colors

---

# 31. INTERACTION QUALITY

ทุก control ต้องมี:

- hover
- focus
- active
- disabled
- loading
- error
- success

keyboard:

- Tab order
- Enter
- Space
- Esc
- focus return after dialog
- accessible labels

---

# 32. ACCESSIBILITY

ขั้นต่ำ:

- semantic headings
- form labels
- aria where necessary
- visible focus
- text + color for status
- contrast
- keyboard dialogs
- no inaccessible icon-only action
- responsive zoom behavior

---

# 33. PERFORMANCE

ตรวจ:

- unnecessary client rendering
- large client bundles
- repeated fetch
- N+1
- client-side full-table filtering
- huge arrays
- duplicate calculation
- slow dashboard queries

ให้ใช้:

- server filtering
- pagination
- scoped queries
- caching where safe
- stable loading states

---

# 34. TESTING REQUIREMENTS

## 34.1 Unit

เพิ่ม/แก้ tests สำหรับ:

- status mapping
- SLA
- holiday
- hold
- weighted KPI
- permissions
- role navigation
- route view mapping
- task actions
- job grouping

---

## 34.2 Integration

ต้องมี coverage สำหรับ:

```text
/work/assign
/work/people
/work/tracker
/work/kpi
/work/reports
```

ยืนยันว่า render view ที่ถูกต้อง

---

## 34.3 Regression

รัน:

```text
lint
typecheck
unit
integration
build
```

และ E2E ถ้ามี

---

# 35. VISUAL VERIFICATION — MANDATORY

ห้ามถือว่า “build ผ่าน” = UX ถูกต้อง

ต้องทำ visual check

แต่ละ major screen ตรวจ:

```text
desktop
tablet
mobile
light
dark
```

เปรียบเทียบกับ source application ในด้าน:

- hierarchy
- workflow
- density
- navigation
- primary actions
- content organization

ไม่จำเป็นต้อง pixel-perfect

แต่ต้อง **behaviorally and experientially recognizable**

---

# 36. SOURCE PARITY MATRIX

อัปเดต:

```text
docs/modules/work/source-parity.md
```

ทุก feature ต้องมี:

```text
SOURCE
TARGET
STATUS
DECISION
TEST
NOTES
```

สถานะเช่น:

```text
DONE
PARTIAL
BLOCKED
NOT STARTED
```

ห้ามเขียนว่า DONE ถ้ายังไม่มี usable screen

---

# 37. ACCEPTANCE GATES — WORK/KPI

ถือว่างาน P0 จบต่อเมื่อทั้งหมดผ่าน

## W-01

Staff เปิดหน้า work แล้วได้ personal dashboard จริง

## W-02

My Tasks ใช้งานได้ครบ lifecycle ตาม scope

## W-03

Create Task ใช้งานได้

## W-04

Task detail + note + permitted edit ใช้งานได้

## W-05

Lead มี Team Command / Team Tasks จริง

## W-06

`/work/assign` เป็น Assignment Center จริง

## W-07

`/work/people` เป็น People experience จริง

## W-08

`/work/tracker` เป็น grouped Job Tracker จริง

## W-09

Reports มี weighted completion / SLA ตาม source semantics

## W-10

KPI มี business-facing UI ที่อ่านเข้าใจได้

## W-11

SLA deadline ทำงานตาม Bangkok business dates

## W-12

Holiday calendar ทำงาน

## W-13

Hold extension ทำงานและ audit ได้

---

# 38. VISUAL / TYPOGRAPHY ACCEPTANCE

ถือว่าผ่านเมื่อ:

```text
0 user-facing text < 12px โดยไม่มีเหตุผล
0 accidental horizontal page overflow
0 clipped labels
0 unreadable table cells
0 overlapping buttons
0 sidebar text overflow
0 dialog overflow
0 hidden action because viewport width
0 internal debug IDs in primary UI
```

---

# 39. USER-FACING QUALITY ACCEPTANCE

ผู้ใช้ต้องสามารถ:

- เข้าใจว่าตัวเองอยู่หน้าไหน
- เห็นสิ่งที่ต้องทำต่อ
- หางานได้
- หาคนได้
- หางานตาม job ได้
- เข้าใจ KPI
- เข้าใจ status
- เข้าใจ deadline
- ใช้งานผ่านมือถือได้
- ไม่ต้องเข้าใจศัพท์ทางเทคนิคของระบบ

---

# 40. CLEANUP

หลัง rebuild:

- ลบ dead code
- ลบ obsolete CSS
- ลบ unused components
- ลบ legacy fallback ที่ไม่จำเป็น
- ลบ duplicate route behavior
- ลบ debug UI
- ลบ temporary copy
- ลบ obsolete comments

ห้ามลบ legacy integration ที่ยังใช้จริงโดยไม่ trace ก่อน

---

# 41. DOCUMENTATION

อัปเดต:

```text
README.md
docs/product/design-system.md
docs/modules/work/source-parity.md
docs/modules/work/source-ux-baseline.md
```

สร้าง:

```text
docs/audits/PROFESSIONAL-UX-RECOVERY-AUDIT.md
docs/audits/PROFESSIONAL-UX-RECOVERY-RESULT.md
```

---

# 42. FINAL RESULT REPORT

เมื่อเสร็จ ให้รายงาน:

## Summary

- สิ่งที่แก้
- architecture ที่เปลี่ยน
- Work/KPI ที่ rebuild
- parity ที่คืนกลับมา
- typography
- overflow
- copy cleanup
- responsive
- tests

## Changed files

ระบุไฟล์สำคัญ

## Tests

ระบุ command + result

## Remaining gaps

ห้ามซ่อน known issues

## Visual QA

ระบุ viewport ที่ตรวจ

## Source parity

ระบุว่า feature ไหน:

```text
DONE
PARTIAL
BLOCKED
```

---

# 43. EXECUTION ORDER

ทำตามลำดับนี้

```text
0. Git safety + baseline
1. Inventory routes/components/CSS
2. Full UX audit
3. Source comparison
4. Typography recovery
5. Overflow/responsive foundation
6. CSS/design-system cleanup
7. Work/KPI IA rebuild
8. My Dashboard
9. My Tasks
10. Create Task
11. Team Command
12. Assignment Center
13. People
14. Job Tracker
15. KPI
16. Reports
17. System copy cleanup
18. Buildings parity
19. Guarantees parity
20. Mobile/tablet QA
21. Dark mode QA
22. Accessibility
23. Tests
24. Build
25. Visual verification
26. Documentation
27. Final report
```

---

# 44. NON-NEGOTIABLE RULES

## RULE 1

ห้ามแก้เพียง font-size แล้วถือว่าเสร็จ

## RULE 2

ห้ามใช้ `WorkspaceQueue` แทนทุก workflow

## RULE 3

ห้าม `/work/assign`, `/work/people`, `/work/tracker` fallback ไป `"mine"`

## RULE 4

ห้ามลด source functionality โดยไม่มีเหตุผลและ documentation

## RULE 5

ห้ามโชว์ developer/internal diagnostics ใน primary UI

## RULE 6

ห้ามสร้าง CSS override layer ใหม่เพื่อกลบปัญหาเดิม

## RULE 7

ห้าม claim parity โดยดูแค่ route/feature name

ต้อง test behavior จริง

## RULE 8

ห้ามแก้ security architecture ใหม่ให้แย่ลงเพื่อให้เหมือน legacy

## RULE 9

ห้ามใช้ client-side authorization เป็น source of truth

## RULE 10

งานจะถือว่าเสร็จเมื่อ UX ใช้งานจริงได้ ไม่ใช่แค่ compile ผ่าน

---

# 45. DEFINITION OF DONE

โปรเจกต์ถือว่าผ่าน recovery รอบนี้เมื่อ:

- SuperApp ดูเป็นผลิตภัณฑ์มืออาชีพ
- ข้อความอ่านง่าย
- ไม่มี overflow สำคัญ
- ไม่มี residual debug/system copy
- mobile ใช้งานจริงได้
- Work/KPI มี mental model กลับมาใกล้ต้นฉบับ
- role-based experience กลับมา
- Assignment / People / Tracker ใช้งานได้จริง
- KPI อ่านเข้าใจได้
- internal lineage ถูกย้ายออกจาก primary UI
- Buildings และ Guarantees ไม่สูญเสีย workflow เดิม
- tests ผ่าน
- build ผ่าน
- source-parity docs อัปเดตตามจริง
- known gaps ถูกระบุอย่างซื่อสัตย์

---

# 46. FINAL INSTRUCTION TO CODEX

อย่าถามเพื่อขออนุญาตในทุกขั้นตอน

ให้ทำงานต่อเนื่องตั้งแต่ audit จนถึง implementation และ verification

ถ้าพบปัญหา:

1. วิเคราะห์ root cause
2. เลือกแนวทางที่รักษา behavior และ architecture ที่ดีที่สุด
3. แก้
4. test
5. ตรวจ visual
6. ทำต่อจนจบ

ถ้ามีข้อขัดแย้งระหว่าง:

```text
Current SuperApp UI
vs
Original module UX
```

ให้เลือก **Original module UX / workflow** เป็น reference ด้านประสบการณ์ผู้ใช้

แต่ใช้ **SuperApp security / architecture** เป็น reference ด้าน infrastructure

เป้าหมายไม่ใช่ copy source code

เป้าหมายคือ:

> **สร้าง SuperApp PERMISSION_NEXT ที่ดูและใช้งานเหมือนผลิตภัณฑ์ที่ถูกออกแบบมาอย่างตั้งใจ โดยรักษาจุดแข็งของระบบต้นฉบับทุกโมดูล และยกระดับ architecture/security ให้เหมาะกับ production**

ทำงานให้จบครบตาม acceptance gates ก่อนสรุปผล
