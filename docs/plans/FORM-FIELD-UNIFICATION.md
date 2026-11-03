# แผนรวมมาตรฐานช่องกรอกข้อมูล SuperApp ตามฟอร์ม “เพิ่มอาคาร”

## 1. เป้าหมาย ขอบเขต และสถานะเอกสาร

**สถานะ: แผนงานเท่านั้น (PLANNED) ไม่ใช่ implementation, QA PASS หรือการอนุมัติปล่อยระบบ**

ทำให้ช่องกรอกของทุกโมดูลใช้ภาษาภาพและสัญญาการเข้าถึงเดียวกับ “เพิ่มอาคาร”: หัวข้อชัด แบ่งส่วนอ่านง่าย label เหนือช่อง ระยะห่างสม่ำเสมอ ตัวควบคุมเต็มพื้นที่ focus ชัด คำแนะนำและข้อผิดพลาดสัมพันธ์กับช่อง และแสดงสถานะการบันทึกอย่างคาดเดาได้ โดย **ไม่ทำให้ทุก workflow กลายเป็นฟอร์มอาคาร**

- วิเคราะห์ repository `D:/WebApp/SuperApp PERMISSION_NEXT` แบบอ่านอย่างเดียว; HEAD ที่ตรวจ `b284a2fb843ab80fadd1346044bbb970b9587bad`; `git status --porcelain=v1` ก่อนสำรวจไม่แสดงรายการเปลี่ยนแปลง
- ครอบคลุม Buildings, Guarantees, Work/KPI, Car Booking, Duct Rental/Communication Cable รวม Admin, Authentication และช่องกรอกใน Core/Overview เพื่อไม่ทิ้ง parallel implementation
- รวมทั้ง create/edit, dialog, inline command, filter/search, report controls, upload และ schema-driven fields ไม่จำกัดเฉพาะไฟล์ชื่อ `*form*`
- ไม่เปลี่ยน schema, สูตรเงิน/ภาษี/KPI/SLA, required policy, option values, API/server actions, RBAC/data scope, optimistic version, audit, idempotency, storage หรือเส้นทางหลังสำเร็จ
- ไม่ติดตั้ง form library ใหม่ ไม่เพิ่ม theme override ไม่สร้าง Input system ซ้ำ ไม่เปลี่ยน navigation ทั้งระบบ และไม่ถือว่าการเขียนแผนอนุญาตให้แก้โค้ด
- งานนี้สร้างเฉพาะ PLAN.md นอก repository ไม่แก้ `src/` ไม่ commit และไม่ push; ไม่รัน build/seed/dev/test ที่อาจสร้างไฟล์หรือเปลี่ยนข้อมูล

**ผลที่ต้องได้ในงาน implementation ภายหลัง:** ช่องกรอกทุกแถวในบัญชี §3 มี owner และหลักฐาน migration; form behavior เดิมไม่ถดถอย; QA อิสระและเจ้าของโมดูลเป็นผู้ตัดสินรับงาน ไม่ใช่ผู้จัดทำแผนประเมินตนเอง

## 2. แหล่งอ้างอิงและข้อเท็จจริงจากโค้ด

อ่าน `AGENTS.md`, `CODEX-MASTER-PLAN-V2.md`, `DESIGN_SYSTEM.md`, `docs/product/design-language.md`, `docs/product/design-system.md` และส่วน foundation/coverage/checkpoint ของ `docs/product/unified-ui-migration.md` ร่วมกับโค้ดจริง เอกสาร unified migration มีขนาดใหญ่และมีประวัติ checkpoint หลายชุด; แผนนี้ไม่ได้รับรองว่าตรวจทุก ledger row หรือรันทดสอบซ้ำตามจำนวนที่เอกสารเก่าอ้าง

ลำดับการตัดสิน: ขอบเขตผู้ใช้ล่าสุด → ข้อห้ามด้านข้อมูล/ความปลอดภัย → โค้ดปัจจุบันและสัญญาของโมดูล → design foundation → รายงาน/สเปกเก่า ไม่เอาสีเขียว BudgetZen ใน master plan เก่ามาทับ corporate blue ปัจจุบัน และไม่ตีความคำว่า all passing ในเอกสารเป็นผลทดสอบครั้งนี้

| หลักฐาน | สิ่งที่ยืนยันจาก source | ผลต่อแผน |
|---|---|---|
| `src/app/(platform)/buildings/new/page.tsx:28–31` | `data-ui-screen="building-create"`, PageHeader พร้อม parent, BuildingCreateForm | ใช้โครงหน้าและลำดับชั้น ไม่คัดลอกชื่อ route/permission ไปโมดูลอื่น |
| `src/features/buildings/map/building-create-form.tsx` | wrapper ส่ง props เข้า BuildingEditorForm | migration ต้องครอบคลุมทั้ง create และ edit ของ editor เดียวกัน |
| `src/features/buildings/building-editor-form.tsx:54–105` | label/input, legacy option, Zod validation, alert, disabled fieldset, repeater, dirty/cancel/reload confirmation | แยก layout ออกจาก business state และรักษา semantics เดิม |
| `src/features/buildings/building-editor.css:7–22` | section/legend, grid 3→2→1 ที่ 1024/600, label gap, full-width, touch size, focus | ใช้เป็น pattern หลัก แต่ไม่ยกค่าดิบหรือ CSS debt ไปส่วนกลาง |
| `src/app/(platform)/buildings/buildings-presentation.css:72–100` | create page full width, section radius-lg/shadow-raised, legend h3 และ sticky actions | ภาพจริงเกิดจาก cascade สองไฟล์ ไม่ใช่ editor CSS อย่างเดียว |
| `src/components/ui/form.tsx:3–8` | มี FormField และ FilterBar อยู่แล้ว | ขยาย primitive เดิม ห้ามสร้างเจ้าของ field ใหม่คู่ขนาน |
| `src/styles/ui.css:238–251` | ui-form/ui-field/ui-filter; field label ยัง text-body และ gap space-1 | ต้องปรับแบบ opt-in ก่อน เพราะค่าเดิมต่างจาก building |
| `src/modules/duct-rental/components/common.tsx:105–110` | มี local `Field` อีกชุด: useId, cloneElement, label htmlFor, error | ต้องมี adapter ย้ายสัญญา error/id ไม่ใช่ย้ายเฉพาะ FormField |
| `src/components/deposit-editor.tsx:19–21,43–73` | TextField เก็บ draft เอง, hidden id/version, section หลายหมวด | ห้าม wrapper ใหม่ทำ input remount หรือทำค่าหายเมื่อ action ล้มเหลว |
| `src/components/work-create-form.tsx:24–33,35–83` | เก็บ FormData ตอน submit, restore เมื่อ fail, reset เมื่อ success, preview deadline | คง action lifecycle และ dependency ของ KPI |

**ข้อแตกต่างที่ต้องแก้ในแผน ไม่อ้างว่าต้นแบบสมบูรณ์แล้ว**

1. FormField ปัจจุบันไม่มี `error`, `required`, `controlId`, `describedBy` หรือ focus contract แม้ root DESIGN_SYSTEM อธิบายว่ามี error/helper; ให้เชื่อ implementation 9 บรรทัดเป็นหลัก
2. Building focus ใช้ outline ดิบ 2px และสี brand ขณะที่ foundation มี `--focus-ring-width`, `--focus-ring-offset`, `--color-focus-ring`; เวอร์ชันกลางใช้ token ของ foundation ไม่จำลองข้อแตกต่างนี้
3. Border ของ building ใช้ color-border; foundation ระบุขอบตัวควบคุมเป็น color-border-strong อย่าคัดลอกขอบตกแต่งที่อาจไม่พอให้แยกช่องกรอก; ต้องวัดคู่สีจริงภายหลัง
4. Hint ใน building ไม่ได้เชื่อม aria-describedby ทุกช่อง และ error บางชุด/repeater ไม่มีการ map กลับตัวควบคุมแบบครบ path: การหา `issue.path.at(-1)` ไม่เพียงพอสำหรับ array index/field ซ้ำ ต้องเพิ่ม mapping ในงานที่อนุมัติแยก โดยไม่เปลี่ยน validation rule
5. beforeunload ของ building มี guard เฉพาะเมื่อ dirty และไม่ busy; ConfirmDialog ครอบคลุม cancel/reload ที่ผูกไว้ ไม่ใช่หลักฐานว่าป้องกัน breadcrumb/sidebar/history ทุกทาง แผนกลางต้องทำ navigation acceptance ชัดเจนก่อนกล่าวว่าครบ
6. ค่า CSS ดิบมีอยู่จริง เช่น border, textarea/button minimum และ breakpoint; ไม่ให้ความเป็นต้นแบบเป็นข้อยกเว้นการใช้ semantic tokens ในงานใหม่
7. `check-css-quality.mjs` ตรวจ literal colors, undefined vars, minimum font และ syntax บางส่วน แต่ **ไม่ได้ห้าม raw px ทุกชนิด**; script ผ่านไม่ได้พิสูจน์ token compliance ครบ ต้องตรวจ diff เพิ่ม
8. เอกสาร design-language อธิบาย radius-sm สำหรับช่องกรอก แต่ building จริงและ ui-form ใช้ radius-md: แผนนี้เลือก **radius-md ตามต้นแบบปัจจุบัน** และให้ owner ยืนยันก่อน rollout ไม่เปลี่ยน radius ทั้งระบบเงียบ ๆ

## 3. บัญชีสำรวจทุกโมดูลและนิยามการนับ

สำรวจ `src/**/*.tsx` ทุกไฟล์ที่ไม่ใช่ test/spec ด้วย pattern `<input|select|textarea|FormField|TextField|PasswordField` แล้วอ่านบริบท component/conditional/rendered field เพื่อจัดกลุ่ม พบ **46 candidate files**; ตัด `src/components/admin-module-settings.tsx` และ `src/components/notification-center.tsx` ซึ่งมีแต่ hidden inputs ออกจากยอดช่องกรอกที่ผู้ใช้เห็น เหลือ **44 field-bearing source surfaces** ตามตาราง

**นิยาม surface ในแผนนี้ = source file ที่มีช่องกรอก/ตัวควบคุมหรือ composition ของ field โดยตรง ไม่ใช่จำนวน route, จำนวน `<form>`, จำนวน control ที่ render หรือจำนวน workflow ที่ผ่าน QA** ไฟล์เดียวอาจมีหลาย form และใช้ซ้ำหลาย route; helper ที่มีตัวควบคุมเองนับหนึ่ง source surface จึงห้ามตีความยอดนี้ว่าเป็น 44 ฟอร์มธุรกิจไม่ซ้ำกัน การแยกทุก runtime variant/role เป็น acceptance ledger ต้องทำก่อนลงมือในแต่ละ wave

| กลุ่ม | จำนวน source surfaces | ขอบเขตการใช้งานที่ต้องรักษา |
|---|---:|---|
| Buildings | 5 | เพิ่ม/แก้ไข, แผนที่/ค้นหา, location candidate, typed delete |
| Guarantees | 5 | เพิ่ม/แก้ไข, แนบหลักฐาน, transition, filters/export, executive filters |
| Work/KPI | 8 | สร้าง/มอบหมาย, dependent KPI, task commands/note, filter/tracker/list และ work-admin |
| Car Booking | 5 | จอง/คืน/เติมน้ำมัน/log/เพิ่มแก้รถ/ที่จอด, calendar/report/map, access editor |
| Duct Rental / Communication Cable | 13 | request/design/phase, renewal/cancellation, signing/settings, cable trial และ utility fields |
| Admin ส่วนกลาง | 3 | users/positions/teams/roles, password reset, audit filters |
| Authentication | 3 | login/change-password field composition และ PasswordField |
| Core / Overview | 2 | queue/search/saved views และ global combobox |
| **รวม** | **44** | ไม่บวก route wrapper ซ้ำ |

### 3.1 บัญชี source surfaces แบบตรวจย้อนกลับได้

สัญลักษณ์: E = editor/command, F = filter/search/view control, S = specialized field, A = adapter/composition ที่มี field การใช้หลายตัวอักษรหมายถึงมีหลาย intent ในไฟล์เดียว

| ID | กลุ่ม | Source path | Intent และข้อควรระวัง |
|---|---|---|---|
| F01 | Buildings | `src/app/(platform)/buildings/buildings-workspace.tsx` | F: ค้นหา/ตัวกรอง/โหมดแผนที่; ไม่เพิ่ม savebar |
| F02 | Buildings | `src/features/buildings/building-editor-form.tsx` | E: create/edit reference, fees/repeater/legacy values |
| F03 | Buildings | `src/features/buildings/delete-building.tsx` | E: พิมพ์ชื่อยืนยันลบ; คง destructive policy |
| F04 | Buildings | `src/features/buildings/map/location-picker.tsx` | S/F: ค้นหาที่อยู่/เลือกพิกัด; provider fallback |
| F05 | Buildings | `src/features/buildings/map/map-workspace.tsx` | F: alternate map consumer/ช่วงวันที่/หมวดค่าใช้จ่าย |
| F06 | Guarantees | `src/components/deposit-editor.tsx` | E: TextField, controlled selects, read-only team, hidden version |
| F07 | Guarantees | `src/components/deposit-evidence-upload.tsx` | S: private evidence file picker ใช้ซ้ำหลายชนิด |
| F08 | Guarantees | `src/components/deposit-transition-form.tsx` | E: เหตุผลเปลี่ยนขั้นตอน; pending/confirm |
| F09 | Guarantees | `src/components/deposit-workspace.tsx` | F: ค้นหา/สถานะ/เจ้าของ/พื้นที่ และเดือนปี export |
| F10 | Guarantees | `src/components/guarantee-executive-dashboard.tsx` | F: พื้นที่/ผู้รับผิดชอบ |
| F11 | Work/KPI | `src/components/work-create-form.tsx` | E: page และ dialog, preview deadline, draft restore |
| F12 | Work/KPI | `src/features/work/screens/assignment-center.tsx` | E: ทีม/ผู้รับผิดชอบ/jobs/priority/notes |
| F13 | Work/KPI | `src/features/work/components/task-kpi-fields.tsx` | A/E: main/sub KPI, rule version และช่องตาม KPI |
| F14 | Work/KPI | `src/features/work/components/task-actions.tsx` | E: transition/delete/edit dialogs, fund/amount และ TaskNoteForm |
| F15 | Work/KPI | `src/features/work/components/work-filters.tsx` | F: get form และ appearance variants, hidden owner |
| F16 | Work/KPI | `src/features/work/screens/job-tracker.tsx` | F: ค้นหา Job |
| F17 | Work/KPI | `src/features/work/screens/my-tasks-workspace.tsx` | F: sort/page size, ไม่เปลี่ยน pagination |
| F18 | Work/KPI | `src/features/work/components/admin-panels.tsx` | E/F: holiday, KPI/SLA, personal weights, recalc confirm, links, announcements, restore |
| F19 | Car Booking | `src/features/car-booking/car-booking-workspace.tsx` | E/F: reserve, ReturnForm, FuelFields, LogForm, CarForm, parking และ list/month filters |
| F20 | Car Booking | `src/features/car-booking/car-access-workspace.tsx` | E/F: search + per-user AccessRow checkbox form |
| F21 | Car Booking | `src/features/car-booking/car-calendar.tsx` | F: calendar view select |
| F22 | Car Booking | `src/features/car-booking/car-journey-map.tsx` | F: เลือกตำแหน่งบนแผนที่ |
| F23 | Car Booking | `src/features/car-booking/car-reports.tsx` | F: เดือน/ทุกเดือน, CSV/report/dashboard |
| F24 | Duct/Cable | `src/modules/duct-rental/components/request-form.tsx` | E/A: team/coordinator, DesignEditor และ attachments; create/edit |
| F25 | Duct/Cable | `src/modules/duct-rental/components/design-editor.tsx` | S/E: schema-driven input/select/textarea, readonly/validation |
| F26 | Duct/Cable | `src/modules/duct-rental/components/request-workspace.tsx` | E: phase editors, NT signer/reference, install/rate/guarantee, autosave notes, missing docs |
| F27 | Duct/Cable | `src/modules/duct-rental/components/request-list.tsx` | F: query/phase/request type/service center/documents/workflow |
| F28 | Duct/Cable | `src/modules/duct-rental/components/process-workspace.tsx` | E/F: ProcessList, annual year, RenewalPane route review/contract, CancellationForm/Pane |
| F29 | Duct/Cable | `src/modules/duct-rental/components/tracking-workspace.tsx` | F: reference/process/owner/SLA |
| F30 | Duct/Cable | `src/modules/duct-rental/components/signature-workspace.tsx` | S/E/F: search/signature asset/date/placement, SignatureManager file/default/name |
| F31 | Duct/Cable | `src/modules/duct-rental/components/settings-workspace.tsx` | E: service-center teams/coordinator phones, version |
| F32 | Duct/Cable | `src/modules/duct-rental/components/cable-test-workspace.tsx` | E/F: CableEditor create/edit/transition reason และ search |
| F33 | Duct/Cable | `src/modules/duct-rental/components/communication-cable-workspace.tsx` | F/A: หน่วยงาน PEA/MEA; ไม่ flatten workflow |
| F34 | Duct/Cable | `src/modules/duct-rental/components/attachment-picker.tsx` | S: file input, keyboard trigger/drop/preview |
| F35 | Duct/Cable | `src/modules/duct-rental/components/file-list.tsx` | F: file query/phase/sort |
| F36 | Duct/Cable | `src/modules/duct-rental/components/pdf-viewer.tsx` | S/F: ระดับขยาย PDF; ไม่ใช้ 3-column form |
| F37 | Admin | `src/app/(platform)/admin/page.tsx` | F: audit module/action/actor/from/to |
| F38 | Admin | `src/components/admin-workspace.tsx` | E/F: create/edit users, selected-team checkboxes, positions/teams/roles/permission matrix/search |
| F39 | Admin | `src/components/admin-workspace-ux.tsx` | A/E: ResetPasswordInput; คง minLength/autocomplete |
| F40 | Auth | `src/components/login-form.tsx` | E/A: email + PasswordField, hidden next; generic auth error |
| F41 | Auth | `src/components/change-password-form-ux.tsx` | A/E: new password/confirm, client error/focus |
| F42 | Auth | `src/components/auth/password-field.tsx` | S: visibility/Caps Lock, inputRef/error |
| F43 | Core/Overview | `src/components/workspace-queue.tsx` | E/F: SavedViews name, query/status/sort, selection checkboxes |
| F44 | Core/Overview | `src/components/workspace-search.tsx` | S/F: combobox active descendant/listbox/keyboard contract |

**เจ้าของสัญญาที่ต้องแตะใน implementation แต่ไม่นับซ้ำใน 44:** `src/components/ui/form.tsx`, `src/styles/ui.css`, `src/styles/tokens.css`, local `Field` ใน Duct `common.tsx`, route wrappers เช่น `/buildings/new`, `/buildings/[id]/edit`, `/guarantees/new`, `/work/new`, `/duct-rental/new`, `/duct-rental/[id]/edit`, `/admin/car-booking`, `/change-password` และ consumer ที่เรียก field ผ่าน component ย่อย

**ขอบเขต legacy:** `src/app/legacy/guarantee/route.ts:118`, `legacy/maxiwa/route.ts:134`, `legacy/permission-next/route.ts:26` มี production 404 guard จึงไม่รวม HTML เก่า เช่น `mods/permission-next/Permission_Next.html` หรือ `docs/legacy-car-booking/Index.html` ในยอด native surfaces ห้ามลบหรือประกาศ retire; ต้องมี source-parity review แยก หากเจ้าของระบบต้องการย้าย reference-only prototype ด้วยให้เปิด scope เพิ่มอย่างชัดเจน

## 4. มาตรฐานภาพและโครงหน้าเป้าหมาย

### 4.1 สูตรประกอบหน้า

`PageHeader + parent → error summary เมื่อมี → FormSection(s) → FormGrid → FormField + native control + hint/error → FormActions`

- หน้าสร้าง/แก้ไขเต็มหน้า: H1 เดียว, breadcrumb กลับรายการ, section `fieldset/legend`, ข้อมูลเรียงตามงาน ไม่เรียงตามชนิด input
- Dialog: ใช้ Dialog/ConfirmDialog เดิม; มี heading ของ dialog อยู่แล้ว ไม่ใส่ PageHeader/H1 ซ้ำ ไม่ซ้อน `<form>` และไม่ซ้อน raised cards ทุกช่อง
- Inline command/permission row: ใช้ label/control/error pattern เดียวกัน แต่ action อยู่ใกล้แถวนั้น ไม่ลากไป sticky footer ของทั้งหน้า
- Filter/search/report toolbar: คง FilterBar/GET/local filter semantics; แชร์ typography/control/focus/hint เท่านั้น **ไม่เพิ่ม dirty warning, submit-save หรือ section cards ทั้งชุด**
- File, map, PDF, canvas/signature และ combobox ใช้ adapter เฉพาะ control; ไม่บีบให้เป็น text input และไม่ตัด keyboard/provider behavior

### 4.2 ตาราง token ที่ใช้จริง

| บทบาท | Token/กฎเป้าหมาย |
|---|---|
| พื้น section | `--color-surface`, `--color-border`, `--radius-lg`; `--shadow-raised` เฉพาะชั้น panel ที่เหมาะสม ไม่ card ซ้อน card |
| ขอบ/พื้น control | `--border-width`, `--color-border-strong`, `--radius-md`, `--color-surface`; inset ใช้ `--shadow-inset` โดยไม่ให้เงาเป็นขอบเพียงอย่างเดียว |
| ระยะ | section padding `--space-4`, form/section gap `--space-4` หรือ `--space-5`, label gap `--space-2`, control padding `--space-2`/`--space-3` |
| Type | label/control `--text-body-strong`, legend `--text-h3` ตาม page presentation; hint/error `--text-caption` หรือ body ตามความยาว อ่านไทยได้จริง |
| ข้อความ | `--color-text`, `--color-text-muted`; line-height ตาม foundation และไม่ตัดวรรณยุกต์ |
| ขนาด | min-height `--size-control-touch`; width 100%, min-width 0, box-sizing border-box; textarea resize vertical |
| Focus | `--focus-ring-width`, `--focus-ring-offset`, `--color-focus-ring`; ไม่ใช้ shadow อย่างเดียว |
| Error | `--color-danger`, `--color-danger-soft` พร้อมข้อความ ไม่ใช้สีอย่างเดียว |
| Action | Button primary/ghost/secondary/danger เดิม, `--color-on-brand`; ใช้ z-index token ที่ foundation owner อนุมัติ ไม่คัดลอก z-index ดิบ |

ไม่มี raw hex/px ใหม่ใน component declarations; border/focus/touch ใช้ token ที่มีอยู่ ไม่สร้าง alias ซ้ำ ส่วน media query ของเดิมใช้ raw breakpoint ตามข้อยกเว้นใน DESIGN_SYSTEM (CSS custom properties ใช้ใน media query ไม่ได้) ให้เก็บ 1024/600 เป็น compatibility baseline ไม่เพิ่ม literal size ไปส่วนอื่น

### 4.3 Responsive composition ที่เสนอ — ยังไม่ได้ render

- หน้ากว้าง 1440: ใช้พื้นที่เนื้อหาหลัง shell, section grid สูงสุด 3 คอลัมน์ `repeat(3,minmax(0,1fr))`; ข้อความยาว/address/notes ใช้ full span
- ที่ 1024: เปลี่ยนเป็น 2 คอลัมน์; ที่ 600 และต่ำกว่า: 1 คอลัมน์; เก็บลำดับ DOM ให้ตรงลำดับการอ่าน/Tab ไม่ใช้ CSS order สลับ
- ตรวจที่ 320/375/390/600/768/1024/1440 รวมขอบ breakpoint 600/601 และ 1024/1025; ไม่มี page overflow
- ภายใน dialog/side pane ให้ใช้ available width ไม่ใช่ viewport อย่างเดียว; เลือก container-aware grid/fallback หนึ่งคอลัมน์ใน adapter หลังตรวจ browser policy ห้าม dialog แคบยังแสดง 3 คอลัมน์เพราะ viewport กว้าง
- Sticky actions สำหรับ page editor เท่านั้น: status ด้านต้น, cancel และ save ด้านท้าย; มือถือ wrap ไม่บีบตัวอักษร/ไม่บัง field error, focus, virtual keyboard หรือ safe area ต้องมีพื้นที่ท้ายเนื้อหาชดเชย footer
- พื้นที่ signature canvas/PDF/table อยู่ใน container ของตนเอง; ข้อจำกัด reflow ของเนื้อหาสองมิติไม่ใช่ข้อยกเว้นให้ฟอร์มทั้งหน้าล้น

## 5. สัญญา shared primitives และขอบเขตเจ้าของ

**แนวทาง: evolve existing FormField แบบ backward compatible และ opt-in ก่อน** ไม่ทำ global selector sweep ทั้งระบบในครั้งเดียว

| ชิ้นส่วนที่เสนอ | ตำแหน่งเจ้าของ | สัญญา |
|---|---|---|
| FormField เดิมที่ขยาย | `src/components/ui/form.tsx` | คง label/hint/className/children; เพิ่ม error/required indicator/controlId/describedBy แบบไม่ทำให้ consumer เดิมพัง |
| FormSection / FormGrid / FormActions (ชื่อเสนอ) | ภายใต้ `src/components/ui/` โดย foundation owner | visual composition เท่านั้น; section ใช้ fieldset/legend; grid มี full-span; actions มี page/inline/dialog variant |
| native control styling | `src/styles/ui.css` | opt-in class/variant เดียวสำหรับ input/select/textarea; ไม่บังคับ checkbox/radio/file/hidden เป็น full-width text control |
| field status / error summary helper | shared UI + module adapter | id/announcement/focus utility; รับ normalized errors จากโมดูล ไม่ import domain schema เข้ากลาง |
| ค่า token | `src/styles/tokens.css` เท่านั้น | reuse ก่อน; เพิ่มได้เมื่อขาดจริงและผ่าน owner review; ไม่เพิ่ม theme override |
| schema, payload, parsing, transport | โมดูลเดิม | คง Zod/server action/sessionFetch, serialization, precision และ API contracts |
| dirty/pending/submit/reset | form owner เดิม | shared UI รับ props ไม่ยึด state หรือเปลี่ยน workflow เอง |

**API design ที่ต้องตกลงก่อนเขียน:**

1. รองรับ controlled และ uncontrolled input, `ref`, `name`, `id`, `required`, `readOnly`, `disabled`, `type`, `inputMode`, `min/max/step`, `maxLength`, `autoComplete`, `onBlur`, `form` โดยไม่กลืน attributes
2. เนื่องจาก FormField เดิมใช้ `<label>` ห่อ children ให้คง legacy path ชั่วคราว; API ใหม่ใช้ explicit `controlId` กับ `label htmlFor` และ slot ที่บอก control id/describedBy ชัดเจน ไม่ clone arbitrary custom component แล้วคิดว่าจะส่ง ARIA ถึง input ได้เสมอ
3. รวม hint IDs + external describedBy + error IDs แบบ dedupe ไม่เขียนทับของเดิม; ID stable และไม่ชนกันเมื่อเปิด page/dialog พร้อมกันหรือใช้ editor หลาย instance
4. required indicator “จำเป็น” ต้องสัมพันธ์กับ native required/aria-required จริง ไม่ตั้ง rule เพิ่มเอง; ไม่ใช้ placeholder แทน label
5. checkbox/radio ใช้ label ข้าง control และ hit target ตาม touch token; permission matrix ใช้ group legend และชื่อที่ระบุบุคคล/ทีม ไม่ใช้ layout ขนาดกล่องเหมือน text field
6. อย่าสลับ `value`/`defaultValue` หรือตั้ง React key ใหม่ระหว่าง validation; ไม่ inject hidden input ที่ซ้ำ payload เดิม
7. Duct `Field` adapter ต้องรักษา error/full/control linkage รวมถึง describedBy เดิม; Deposit TextField ย้าย presentation ก่อนแล้วคง draft state ไว้ จน regression ระบุว่าเลิก local wrapper ได้
8. `FilterBar` เป็น `<form>` อยู่แล้ว: ห้ามซ้อนใน parent form; toolbar ที่มี local state และไม่มี submit ใช้ container ที่ไม่สร้าง nested form

## 6. พฤติกรรม การตรวจข้อมูล และการเข้าถึง

| ประเด็นจากต้นแบบ 12 ข้อ | ข้อตกลงกลาง | ขอบเขต/สิ่งที่ไม่ย้ายโดยอัตโนมัติ |
|---|---|---|
| 1 PageHeader + breadcrumb | คง hierarchy, parent และ page identity | dialog/inline ไม่ต้องมี page shell ของ building |
| 2 section card + legend | กลุ่ม field ใช้ fieldset/legend ที่มีความหมาย | filter/PDF toolbar ไม่สร้าง card ทุกกลุ่ม |
| 3 responsive grid | 3→2→1 และ full-span | pane แคบอิงพื้นที่จริง ไม่ฝืน 3 คอลัมน์ |
| 4 label grid gap | label เหนือ text control, strong body | checkbox/radio เป็น inline label |
| 5 touch/full width/focus | ใช้ shared tokens ทุกธีม | file/hidden/canvas มี adapter ไม่เหมารวม |
| 6 hint + section help | เชื่อมด้วย ID และใช้ copy ไทย | hint ไม่แทน error และไม่แทน label |
| 7 error summary + invalid + focus | summary role alert, field error link, focus แรกที่ผิด | map nested path ด้วย row ID ไม่ใช้ index อย่างเดียว |
| 8 dirty + leave guard | ยืนยัน discard สำหรับ editor ที่มี draft | ไม่เตือนเมื่อ filter เปลี่ยน ไม่อ้างครอบคลุมทุก navigation จนทดสอบ |
| 9 sticky actions + busy | status/cancel/save สม่ำเสมอ, lock field/action ระหว่าง submit | inline/dialog ใช้ footer ของตน และคง secondary command เช่น preview deadline |
| 10 legacy select | คงค่าปัจจุบันที่ไม่อยู่ใน options พร้อมป้ายอ่านออก | ห้ามเพิ่ม option ผิดสิทธิ์หรือทำให้ค่าที่ server ไม่ยอมรับบันทึกได้ |
| 11 repeater | stable row key, label/ID รายแถว, add/remove announcement, cap จาก domain | cap 50 เป็น building otherFees ไม่ใช่ cap ทุกโมดูล |
| 12 friendly server errors/reload | module code → Thai copy, retry/reload เคารพ draft/version | ไม่ย้าย building error code map ไปครอบทุก API |

### 6.1 Error/focus contract ที่ตรวจได้

- ขณะกรอก: ไม่แสดง “ผิด” ทุก keystroke โดยไม่มีเหตุ; ใช้ validation timing เดิมของโมดูลก่อน เปลี่ยน timing ต้องอนุมัติเพิ่ม
- Submit invalid: แสดง summary บนสุดพร้อมรายการที่ระบุชื่อช่อง; map field path → control ref/ID; focus ตัวแรกที่มองเห็นและแก้ได้ ถ้าเป็น hidden/readonly/group-level error ให้ focus summary หรือ group heading ที่รองรับ programmatic focus
- ใช้ `aria-invalid=true` เฉพาะช่องที่ผิด; error ID เฉพาะช่อง; ไม่ประกาศ alert ซ้ำทุก field และ summary พร้อมกันจน screen reader อ่านทับ
- เมื่อ server error/permission/conflict/network: เก็บค่าที่กรอก ไม่แสดง stack/SQL/provider detail; unknown code ใช้ “บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง” และ reference ที่ปลอดภัยถ้าระบบมีอยู่แล้ว
- Conflict: ข้อความ “ข้อมูลรายการนี้เปลี่ยนแล้ว กรุณาโหลดข้อมูลล่าสุด”; reload ต้องยืนยันหากมี draft ไม่ retry ด้วย version เก่าเงียบ ๆ
- Repeater: ลบแล้ว focus ไป row ที่ใกล้ที่สุดหรือปุ่มเพิ่ม; error อ้าง stable row key/path; ถ้าเพิ่มถึง limit ให้บอกเหตุผล ไม่ใช้ disabled อย่างเดียว

### 6.2 Pending/draft/navigation contract

- `aria-busy` บน form/พื้นที่ที่กำลังทำงาน, status มีข้อความไทย; ปิด submit ซ้ำและ competing commands ด้วย state เดิม; อย่าพึ่ง disabled CSS แทน server guards
- ใช้ disabled fieldset อย่างระวัง: สร้าง FormData ในจังหวะเดิมก่อนปิดช่องเพื่อไม่ให้ค่าที่ต้องส่งหาย; readOnly ยังถูกส่งใน FormData แต่ disabled ไม่ส่ง ห้ามเปลี่ยนสลับโดยไม่เทียบ payload
- Save failure ต้องไม่ reset select/text/file selection โดยไม่ตั้งใจ; success เคลียร์ dirty/reset เฉพาะเมื่อ module owner ระบุว่าสำเร็จ
- Page cancel และ dialog close/Escape/backdrop: ถ้า dirty ให้ ConfirmDialog ที่คืน focus กลับ editor เมื่อเลือกแก้ต่อ; busy ไม่ปิดหรือทิ้ง draft โดยไม่แจ้ง
- Browser unload ใช้ native prompt ไม่รับประกันข้อความไทยของ browser; breadcrumb/sidebar/browser back ต้องมี coverage และแนวทางที่รองรับ App Router จริงก่อนเพิ่ม navigation helper ห้าม invent router interception API
- ไม่บันทึก password, file bytes, signature หรือข้อมูลอ่อนไหวใน localStorage เพื่อ “กันค่าหาย”; SavedViews ของ queue คงขอบเขตข้อมูลเดิม
- Autosave notes ของ Duct รักษา debounce/pause/sync/version เดิม ไม่เปลี่ยนเป็นปุ่ม save รวมเพียงเพื่อให้หน้าตาเหมือน building

### 6.3 Specialized controls ที่ต้องรักษา

- เงิน/ทศนิยม: ใส่หน่วยใน label/hint; คง string/Decimal/domain parser และ rounding เดิม ไม่แปลง `Number` เพื่อ formatting ใหม่
- วันเวลา: ใช้ native date/month/datetime-local เดิมใน wave แรก คง timezone กรุงเทพฯ และ conversion ของ car/work; label ชัด ไม่เปลี่ยน format payload
- Password: คง autocomplete, show/hide, Caps Lock, errors/ref และ generic auth error; ไม่เพิ่ม dirty unload warning ที่รบกวน sign-in
- File upload: label/trigger ใช้คีย์บอร์ดได้ แสดงชนิด/ขนาด/ชื่อไฟล์ตาม policy เดิม; cancel/reselect ไฟล์เดิมทำงาน; private download grants ไม่เปลี่ยน
- Combobox: คง role/listbox/aria-expanded/controls/activedescendant, Arrow/Enter/Escape และ IME ภาษาไทย; ห้ามเปลี่ยนเป็น native select โดยไม่อนุมัติ
- Signature/PDF/map: แบ่ง field groups ข้าง canvas ได้ แต่ไม่เปลี่ยนตำแหน่งลายเซ็น พิกัด หน่วย หรือ zoom semantics

## 7. ลำดับ migration และจุดหยุดรับงาน

ยังไม่ผูกวันส่งมอบ/จำนวนคน เพราะไม่มี capacity และ owner assignment ที่ยืนยัน ลำดับนี้เป็น dependency-based ไม่ใช่คำสัญญาเวลา

**กฎเหล็กเรื่องทิศทาง (แก้ไขตามคำสั่งเจ้าของระบบ 2026-11-03):** ฟอร์ม “เพิ่มอาคาร” (F02 `src/features/buildings/building-editor-form.tsx` + `building-editor.css`) เป็น **reference ที่ตรึงไว้ (frozen golden reference)** — **ห้ามแก้ไฟล์เหล่านี้ในทุก wave** ทิศทางคือ “โมดูลอื่นถูกแก้ให้เหมือนอาคาร” ไม่ใช่ “อาคารถูกแก้ให้เหมือนของกลาง” การสกัด primitive ทำได้เฉพาะในไฟล์ shared (`src/components/ui/**`, `src/styles/ui.css`) โดยห้ามแตะไฟล์อาคาร และต้องพิสูจน์ว่า primitive reproduce หน้าตาอาคารได้จริงก่อนเอาไปใช้กับโมดูลอื่น

| Wave | งานและ surfaces | สิ่งส่งมอบ/เงื่อนไขไปต่อ |
|---|---|---|
| 0 — Freeze | ตรวจ HEAD/dirty tree ใหม่, อ่าน parity ของแต่ละโมดูลและ current source baselines, แยก 44 source rows เป็น route/intent/role/state ledger, ยืนยันว่าไฟล์อาคารสะอาดตรง HEAD | owner ยืนยัน scope, payload snapshots, baseline screenshot และ known failures; ไม่ถือรายงานเก่าเป็น PASS |
| 1 — Foundation + direction pilot (อาคารห้ามแตะ) | สกัด/ขยาย FormField/FilterBar และ composition ในไฟล์ shared เท่านั้น ให้ reproduce หน้าตาอาคารได้; แล้วย้าย **โมดูลแรกที่ไม่ใช่อาคาร** (Guarantees F06 `src/components/deposit-editor.tsx`) มาใช้ pattern อาคาร; **ไม่แก้ไฟล์อาคารแม้แต่บรรทัดเดียว** | shared contract tests; พิสูจน์ว่า primitive ตรงกับ pattern อาคาร; deposit regression เดิมยังผ่าน; `git diff --name-only` ต้องไม่มีไฟล์ใต้ `src/features/buildings/` |
| 2 — Work + Guarantees | F06–F18 โดยย้าย create/assignment/editor ก่อน filter/task/admin branches | draft restore, preview, KPI dependencies, evidence/transition และ hidden versions ไม่ถดถอย; แบ่ง PR ตาม owner ไม่เปลี่ยน overlapping files พร้อมกัน |
| 3 — Car Booking | F19–F23 รวม `/admin/car-booking` | reserve/return/fuel/log/car/parking และ access payload ครบ; timezone/dirty modal/role gating เดิม |
| 4 — Duct/Cable | F24–F36; เริ่ม Field adapter → request/design → phase → process → signing/settings/cable → utility filters | ตรวจ dynamic phase views, readonly, autosave, money/version, uploads และ signature geometry; ไม่ถือ FormField migration อย่างเดียวว่าครบ |
| 5 — Admin/Auth/Core + remainder | F37–F44 และ F01/F03–F05, ตรวจ dependency ของ F18 ที่อยู่ admin; owners ส่งมอบไม่แก้ซ้ำกัน | permission matrix/reset/login/change-password/combobox/map/delete/search/filters ครบ context |
| 6 — Retire duplicates | ค้น consumers ทุก selector/adapter ใหม่, ลบเฉพาะ CSS ซ้ำที่ไม่มีผู้ใช้แล้วและได้รับอนุมัติ | ledger ไม่มีแถว unowned; ไม่มี duplicate visual owner, docs ตรง API, QA อิสระ/owner ลงนาม |

**วิธีทำทุก wave:** baseline → contract/regression tests ก่อนเปลี่ยน → migrate หนึ่ง intent → producer evidence → independent review → owner acceptance → จึงขยาย ไม่ทำ find/replace `.building-editor-*` เป็น `.ui-*` ทั้ง repo

**จุดหยุด:** การตัดสิน required/legacy acceptance/permissions/financial policy ที่ source ขัดกันต้องส่ง domain owner; UI work ที่อิสระเดินต่อได้ แต่ห้ามลด test เพื่อให้ผ่าน ห้ามย้าย known failure เป็น “ไม่เกี่ยว” โดยไม่มีการจัดประเภทและผู้รับผิดชอบ

## 8. แผนไฟล์และการจัดการ CSS ซ้ำ

ต่อไปนี้เป็น **ไฟล์ที่จะพิจารณาแก้ในงานที่ได้รับอนุญาตภายหลัง ไม่ใช่รายการที่แก้ครั้งนี้**

1. Foundation owner: `src/components/ui/form.tsx`, `src/styles/ui.css`, tests ใต้ `src/components/ui/`; tokens.css เฉพาะ token ที่ขาดจริง; เอกสาร `docs/product/design-system.md`/DESIGN_SYSTEM ให้ตรง API หลังรับรอง
2. Buildings owner: **ห้ามแก้ F02 editor (`building-editor-form.tsx`, `building-editor.css`)** เพราะเป็น frozen reference; ที่ migrate ได้คือ surface อื่นของกลุ่มอาคาร (F01, F03–F05: workspace/map/delete/location) และทำหลังโมดูลอื่นผ่านแล้วเท่านั้น; ไม่ลบ layout/map-specific styles
3. Guarantees owner: TextField และ deposit-form/deposit-field-hint ใน `src/components/deposit-editor.tsx` + `src/app/(platform)/guarantees/deposit.css`; เก็บ financial/dashboard/table styles ของตน
4. Work owner: create/task/KPI/assignment/filters/admin fields; ประสาน `src/styles/work.css`, work composition/list module CSS ให้เหลือ layout/domain styles ไม่ทับ input look; ไม่ทำให้ KPI fields remount ต่างเดิม
5. Car owner: `car-booking.css`, cb-form-grid/cb-filter/cb-check และ consumers; คง map/calendar/report layout
6. Duct owner: `components/common.tsx` Field adapter, `ui-shared/ui-shared.module.css`, `ui-request/ui-request.module.css`, `ui-process/ui-process.module.css` และ consumers ที่ใช้ styles.input; คง RequestFormShell/DesignEditorShell/ProcessShell/SignatureShell ไม่แทนด้วย shell ใหม่
7. Admin/Auth/Core owners: `admin.css`, `src/styles/auth.css`, `src/styles/components.css`, `globals.css` เฉพาะ selector ที่มี consumer ใน wave นั้น; รักษา auth shell และ combobox behavior

ใช้ชั้น compatibility ชั่วคราวที่มี owner/รายการ consumers/เงื่อนไขลบ ไม่เพิ่ม override ต่อท้ายไม่สิ้นสุด ไม่เพิ่ม `!important` เพื่อแก้ cascade เก็บ screenshot และ computed style ของ pilot ก่อนยุบ selector; ระวัง `.ui-form input` เดิมกว้างพอจะจับ checkbox/hidden/file โดยไม่ตั้งใจ

## 9. แผนพิสูจน์ผลสำหรับ Developer และ QA อิสระ

**สถานะทุกข้อด้านล่าง: ยังไม่ได้รันในงานเขียนแผนนี้**

### 9.1 Automated checks

- Contract/unit: FormField backward compatibility, id/label/error/hint linking, describedBy merge, stable IDs, required/readOnly/disabled/ref forwarding, full-span และ checkbox/file opt-out
- Regression: controlled/uncontrolled draft ไม่หายหลัง server action fail; successful reset ตรงเงื่อนไข; hidden id/version/idempotency/name ซ้ำคงเดิม; FormData payload ก่อน/หลังเหมือนกันสำหรับ fixture เดียวกัน
- CSS: `node scripts/check-css-quality.mjs`, `node scripts/check-contrast.mjs`, `git diff --check`; เพิ่ม review raw px/color/token diff เพราะ checker ไม่ครอบคลุมทั้งหมด
- Implementation gates ตาม package.json: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:documents`, `npm run build`; รันเฉพาะ workspace ที่ได้รับอนุญาต เพราะ lifecycle scripts เขียน build-info/outputs ได้
- เลือก targeted suites ตาม wave แล้ว full suite ก่อนปิด rollout: `e2e/building-editor.spec.ts`, `e2e/buildings-unified-composition.spec.ts`, `e2e/work-create-dialog-regression.spec.ts`, `e2e/work-unified-composition.spec.ts`, `e2e/guarantees-unified-composition.spec.ts`, `e2e/car-booking-unified-composition.spec.ts`, `e2e/duct-rental-unified-composition.spec.ts`, `e2e/admin-auth-unified-composition.spec.ts` ร่วมกับ domain/unit และ route/server integration ที่เกี่ยวข้อง
- ตรวจ Playwright config/fixtures ก่อนเลือกคำสั่ง; อย่า seed/reset DB หรือเรียก production endpoint จากการรัน UI tests โดยไม่ตรวจ environment และขอบเขต
- `.github/workflows/a11y-audit.yml` ปัจจุบันตรวจรายชื่อ Duct บางหน้า ไม่ใช่ทุกโมดูล และมีข้อควรตรวจ dependency `axe-playwright`/`playwright` เทียบ package.json, `injectScript` และ exit-on-violation; วางงานขยาย workflow แยก ไม่ถือว่าแค่มี workflow ก็เป็น gate ที่ครอบคลุม

### 9.2 Matrix ที่ QA ต้องบันทึก

ต่อ source surface ให้แตกเป็น `route/consumer × intent × role/data scope × state × theme × viewport` โดยคัด risk-based combinations และระบุรายการที่ยังไม่ครอบคลุมอย่างตรงไปตรงมา

- States: pristine, dirty, focused, invalid, submitting, success, server validation failure, network failure, forbidden/session expired, stale version, empty options, legacy value, readOnly/disabled
- Context: full page/dialog/inline/filter, เปิดปิดซ้ำ, เปลี่ยน parent field แล้ว dependent fields ถูกต้อง, repeater add/remove/limit, upload cancel/reselect, autosave กับ background refresh
- Themes: light/dark; viewports และ breakpoint edges ตาม §4; zoom 200%, reflow 320, forced colors, reduced motion
- Keyboard: Tab/Shift+Tab, Enter ไม่ submit command ผิดตัว, Escape/close/backdrop + focus restoration, Arrow/IME สำหรับ combobox/select; sticky bar ไม่บัง focused control
- Error test: field แรก, field ท้ายหน้า, nested row, server-only error, conflict reload + discard/keep; screen reader อ่าน label/hint/error ไม่ซ้ำและไม่เงียบ
- Contrast: วัด computed foreground/background ของ text/hint/error/placeholder/disabled และ control boundaries/focus ทุกธีมใน state ที่ใช้งานจริง; WCAG 2.2 AA เป้าหมายข้อความปกติ 4.5:1 และ UI จำเป็น 3:1 ไม่ยืมตัวเลขเก่ามารับรอง
- Real integration: authenticated Next/App Router, server action/API, role scopes, optimistic conflict, draft refresh และ private file provider แยกจาก component fixture; mock fixture ไม่ใช่หลักฐานสิทธิ์/การบันทึกจริง

### 9.3 เกณฑ์ส่งมอบ

- [ ] 44 source rows มี owner, consumers, intents และสถานะพร้อม evidence ไม่ใช้จำนวนไฟล์ที่แก้แทน coverage
- [ ] ทุก field ใช้ contract กลางหรือ specialized adapter ที่ระบุเหตุผล และไม่มี control look ซ้ำที่ไม่มี owner
- [ ] payload/validation/permissions/calculations/version/audit/idempotency ไม่เปลี่ยนโดยงาน presentation
- [ ] ทุก editor ที่ย้ายเก็บ draft เมื่อ fail และมี leave/pending behavior ที่ระบุขอบเขตชัด
- [ ] ภาพก่อน/หลัง light/dark/mobile/desktop + computed styles + focus/error evidence อยู่ใน handoff
- [ ] unit/regression/contrast/a11y/integration ที่เกี่ยวข้องมีคำสั่ง exit/result จริง; failure เดิม/ใหม่แยกชัด ไม่เปลี่ยน assertion เพื่อปิดงาน
- [ ] independent QA และเจ้าของโมดูลรับงาน; ผู้พัฒนาไม่ self-award QA PASS

## 10. ความเสี่ยง การย้อนกลับ และการแบ่งงาน

| ความเสี่ยง | ป้องกัน | ย้อนกลับในงาน implementation |
|---|---|---|
| เปลี่ยน shared CSS แล้วทุกโมดูลขยับพร้อมกัน | opt-in pilot, caller inventory, one foundation writer | ถอด opt-in จาก consumer ที่มีปัญหา กลับ compatibility adapter เฉพาะ wave ไม่ reset repo ทั้งก้อน |
| input remount/Server Action reset ทำ draft หาย | stable IDs/keys, payload/draft regression | คืน presentation wrapper เดิมโดยคง module state/action |
| duplicate ID/ทับ aria-describedby | multi-instance tests และ explicit linkage | คืน adapter ที่ link เดิมได้จนแก้ shared contract |
| nested form/fieldset disabled ทำ payload ขาด | DOM semantics + FormData comparison | คืน composition เดิม ห้ามชดเชยด้วย payload ที่เดาค่า |
| sticky footer/keyboard บัง error | scroll/focus/mobile/zoom tests | ใช้ nonsticky action variant ชั่วคราวที่ owner รับรอง |
| CSS ข้าม owner/งาน parallel ชนกัน | assign foundation owner และ disjoint module files; F18 ต้องประสาน Admin | revert เฉพาะการเปลี่ยนของ wave ที่อนุมัติ ไม่ stash/reset งานผู้อื่น |
| ย้าย generic error แล้วข้อมูลอ่อนไหวรั่ว | module-owned code map + safe fallback | คืน existing safe copy ไม่แสดง raw API error |
| แผนภาพเหมือนกันแต่ธุรกิจเปลี่ยน | freeze name/value/type/constraints/server endpoints และ golden fixture | rollback presentation; ไม่ rollback database เพราะแผนนี้ไม่ต้องมี DB migration |

การย้อนกลับใช้เฉพาะ patch/commit ของงาน implementation ที่ได้รับอนุมัติในอนาคต **ไม่ได้อนุญาต commit/push ในงานปัจจุบัน** ให้ตรวจ dirty baseline ใหม่ก่อนทุก wave; หากมี source change ระหว่างสำรวจต้อง refresh inventory แทนการทับไฟล์

## 11. สิ่งที่ยังยืนยันไม่ได้และการตัดสินใจที่ต้องขอ

**CANNOT จากการอ่านโค้ดครั้งนี้:**

- ไม่ยืนยันภาพที่ browser render จริง, pixel match, contrast จริง, touch behavior, screen reader, native OS picker, keyboard integration หรือ WCAG compliance เพราะไม่ได้เปิด/รันแอป
- ไม่ยืนยันผล test ปัจจุบันหรือข้อผิดพลาดเก่าใน unified-ui-migration ว่ายังคงอยู่: เป็น historical checkpoint ต้องรันใหม่ใน implementation workspace ที่อนุญาต
- ไม่รับรอง upstream parity/ฟังก์ชันที่ยังไม่ได้ port จาก repos ต้นทาง, runtime feature flags, ข้อมูล production หรือทุก role×state combination; 44 คือ source-file inventory ตามนิยาม ไม่ใช่ยอดฟอร์ม runtime ทั้งหมด
- ไม่ยืนยัน end-to-end persistence, auth/session/server refresh, file permissions/provider, Longdo/GPS, concurrent version, transaction/audit หรือ DB constraints จากการ inspect presentation
- ไม่มีข้อสรุป capacity/วันส่งมอบ/ผู้รับผิดชอบรายบุคคล และไม่มี owner visual approval
- ไม่อ้างว่ารายการ JEV แบบเก่าใน master plan ถูกเรียกแล้ว; งานนี้ใช้ local source evidence และ deterministic inventory ไม่ส่งข้อมูลโครงการออก advisory service

**ข้อเสนอที่ต้องยืนยันก่อน implementation:** เลือก radius-md ตาม building จริงเหนือ prose radius-sm; ใช้ focus/border tokens กลางเพื่อเข้าถึงได้แทนคัดลอก raw CSS; ขอบเขต discard guard ของ navigation และ read-only/specialized variants; กำหนด owner และ independent QA ต่อ wave; วิธีแตก source rows เป็น exact route/intent acceptance ledger

ไม่มีข้อจำกัดเหล่านี้ขัดขวางการส่งแผน แต่ต้องคง OPEN จนได้ evidence ไม่เปลี่ยนเป็น PASS ด้วยการคาดเดา

## 12. บันทึกการส่งมอบและคำขอต้นฉบับ

### 12.1 สิ่งที่ทำจริง

อ่านเอกสารและ source, ตรวจ HEAD/status, สำรวจ field-bearing files ด้วยโปรแกรมและจัดกลุ่มหลังดูบริบท, ตรวจ reference cascade/shared primitive/parallel wrappers/quality scripts และเขียนแผนนี้เท่านั้น ไม่เปลี่ยนไฟล์ repository ไม่ commit ไม่ push ไม่ deploy ไม่สร้าง UI/test fixture และไม่ประเมินคุณภาพตนเอง

ไฟล์ผลลัพธ์ที่ผู้ใช้อนุญาตเพียงไฟล์เดียว:
`C:/Users/kobpat_m/AppData/Local/hermes/profiles/hermes-joy/cache/scratch/superapp-form-plan/PLAN.md`

byte size ส่งคืนจาก `wc -c` หลังบันทึก ไม่ใส่ตัวเลขในไฟล์นี้เพื่อหลีกเลี่ยง self-referential size; การตรวจขนาด/หัวข้อ/จำนวนแถวเป็นการตรวจความครบของ artifact ไม่ใช่ QA acceptance ของ UI

### 12.2 คำขอผู้ใช้ (verbatim)

> Produce a written design/migration PLAN (Thai) for unifying the "field input UI" of every module form in the SuperApp repo so that all of them follow the pattern used by the "เพิ่มอาคาร" (add building) form. Write the plan as a single Markdown file at C:/Users/kobpat_m/AppData/Local/hermes/profiles/hermes-joy/cache/scratch/superapp-form-plan/PLAN.md and report its absolute path and exact byte size. Do NOT change any repo file, do NOT commit, do NOT push.
