# Duct Rental / Cable Module — UI Consistency Audit Report

**SuperApp Permission Next** — `D:/WebApp/SuperApp PERMISSION_NEXT`
**Owner:** Module เช่าท่อและร้อยสาย (Duct Rental & Cable)
**Audit Scope:** Entire duct-rental/cable module — every route/view, subordinate detail/forms/dialogs/tabs
**Priority Focus:** Cancellation (`ยกเลิกใช้ท่อ`) & Renewal Tracking (`ติดตามต่อสัญญา`)
**Method:** Source-code inventory + design-system comparison + cross-module journey analysis
**Constraint:** READ-ONLY — no DB/env/source edits, no module toggles, no permission changes

---

## 1. Route/Component Inventory (Programmatic, Deduplicated)

| # | Route | Page File | Workspace Component | Purpose | UI State Coverage |
|---|-------|-----------|---------------------|---------|-------------------|
| 1 | `/duct-rental` | `src/app/(platform)/duct-rental/page.tsx` | `RequestListWorkspace` | List requests, filters, metrics, pipeline | loading, empty, error, role-user, role-denied |
| 2 | `/duct-rental/new` | `src/app/(platform)/duct-rental/new/page.tsx` | `RequestForm` | Create request | loading, error, role-user, role-denied |
| 3 | `/duct-rental/[id]` | `src/app/(platform)/duct-rental/[id]/page.tsx` | `RequestWorkspace` | Request detail (10 phases) | loading, error, role-user, role-denied |
| 4 | `/duct-rental/[id]/edit` | `src/app/(platform)/duct-rental/[id]/edit/page.tsx` | `RequestEdit` → `RequestForm` | Edit design data | loading, error, role-user, role-denied |
| 5 | `/duct-rental/[id]/[view]` | `src/app/(platform)/duct-rental/[id]/[view]/page.tsx` | `RequestWorkspace` | Phase-specific views (9 views) | same as #3 |
| 6 | `/duct-rental/renewal` | `src/app/(platform)/duct-rental/renewal/page.tsx` | `ProcessList` (kind=renewal) | Annual renewal list | loading, empty, error, role-user, role-denied |
| 7 | `/duct-rental/renewal/[id]` | `src/app/(platform)/duct-rental/renewal/[id]/page.tsx` | `RenewalWorkspace` → `RenewalPane` | Renewal detail + route review | loading, error, role-user, role-denied |
| 8 | `/duct-rental/cancellation` | `src/app/(platform)/duct-rental/cancellation/page.tsx` | `ProcessList` (kind=cancellation) | Cancellation list | loading, empty, error, role-user, role-denied |
| 9 | `/duct-rental/cancellation/new` | `src/app/(platform)/duct-rental/cancellation/new/page.tsx` | `CancellationForm` | Create cancellation request | loading, error, role-user, role-denied |
| 10 | `/duct-rental/cancellation/[id]` | `src/app/(platform)/duct-rental/cancellation/[id]/page.tsx` | `CancellationWorkspace` → `CancellationPane` | Cancellation detail + workflow | loading, error, role-user, role-denied |
| 11 | `/duct-rental/communication-cable` | `src/app/(platform)/duct-rental/communication-cable/page.tsx` | `CableTestWorkspace` → `CommunicationCableWorkspace` | Cable workflow prototype | loading, error, role-user, role-denied |
| 12 | `/duct-rental/settings` | `src/app/(platform)/duct-rental/settings/page.tsx` | `DuctSettings` | Coordinator/team config | loading, error, role-user, role-denied |
| 13 | `/duct-rental/tasks` | `src/app/(platform)/duct-rental/tasks/page.tsx` | `SignatureWorkspace` | NT Form signing tasks | loading, empty, error, role-user, role-denied |
| 14 | `/duct-rental/tracking` | `src/app/(platform)/duct-rental/tracking/page.tsx` | `TrackingWorkspace` | Unified renewal+cancellation tracking | loading, empty, error, role-user, role-denied |

**Total: 14 distinct routes** — all mapped to workspace components in `src/modules/duct-rental/components/`

### Subordinate Components (Forms/Dialogs/Tabs/Details)

| Component | Used In | Type |
|-----------|---------|------|
| `DesignEditor` | RequestForm, RequestWorkspace | Form section (read/write) |
| `AttachmentPicker` | RequestForm, RequestWorkspace | File upload field |
| `FileList` | RequestWorkspace | Document list |
| `PdfViewer` | RequestWorkspace, SignatureWorkspace | Modal PDF preview |
| `PhaseTabs` | RequestWorkspace | Navigation tabs (9 phases) |
| `ModuleNav` | All workspaces | Module sub-navigation |
| `RequestForm` | new, edit | Full-page form |
| `CancellationForm` | cancellation/new | Wizard-style form |
| `Modal` (local) | RequestWorkspace, CancellationWorkspace, SignatureWorkspace | Confirmation dialogs |
| `Notice` | All | Inline alerts (error/info) |
| `RefreshBar` | All list/detail | Real-time sync indicator |
| `TrackingSummary` | RequestList, TrackingWorkspace | Metric quick-links |

---

## 2. Shared Shell / Primitive Comparison

### 2.1 Primitives Used by Duct-Rental vs. Canonical (`src/components/ui/`)

| Primitive | Canonical (`src/components/ui/`) | Duct-Rental Usage | Divergence |
|-----------|----------------------------------|-------------------|------------|
| **PageHeader** | `page-header.tsx` — breadcrumb, title, description, actions | Used in **all 14 routes** via `import { PageHeader } from "@/components/ui/page-header"` | ✅ Consistent |
| **Button** | `button.tsx` — `Button` + `ButtonLink` variants (primary/secondary/danger/ghost) | **Not used** — module defines own `.button`, `.primary`, `.danger` in `workspace.module.css` | ❌ **Major** — 2 parallel button systems |
| **MetricGrid** | `metric-grid.tsx` — `MetricItem` with `tone` (neutral/info/success/warning/danger) | **Not used** — module uses `.metrics` + `.metric` CSS grid in `workspace.module.css` | ❌ **Major** — 2 metric systems |
| **TableRegion** | `table-region.tsx` — accessible scroll region with `role="region" aria-label` | **Not used** — module uses `.tableWrap` with `tabIndex={0} role="region" aria-label` (manual) | ⚠️ **Minor** — same pattern, not shared component |
| **StatusBadge** | `status-badge.tsx` — `StatusTone` enum + `WorkspaceIcon` checkmark | **Not used** — module uses `.badge` + `.warning`/`.success` CSS classes | ❌ **Major** — 2 badge systems |
| **FormField/FilterBar** | `form.tsx` — `FormField` (label+hint+error), `FilterBar` | **Not used** — module uses local `Field` in `common.tsx` | ❌ **Major** — 2 form field systems |
| **EmptyState** | `empty-state.tsx` — title, description, action, badge, error flag | **Not used** — module uses `.empty` + `.emptyIcon` + `.emptyActions` CSS | ❌ **Major** — 2 empty state systems |
| **ErrorState** | `error-state.tsx` — digest, reset, embedded mode, copy.ts messages | **Not used** — module uses `Notice error` + local messages | ❌ **Major** |
| **Panel** | `panel.tsx` — title, description, actions, headingId, `ui-panel` classes | **Not used** — module uses `.panel` CSS class | ❌ **Major** |
| **PageSkeleton** | `page-skeleton.tsx` — dashboard/table/detail shapes | **Not used** — module uses `.loadingSurface` / `.loadingState` CSS | ❌ **Major** |

### 2.2 Design Tokens (Source: `src/styles/tokens.css`)

| Token | Canonical Value | Duct-Rental CSS Usage | Status |
|-------|-----------------|----------------------|--------|
| `--color-bg` | `#F8FAFC` | Used via `var(--color-bg)` in globals | ✅ |
| `--color-surface` | `#FFFFFF` | Used via `var(--color-surface)` | ✅ |
| `--color-border` | `#CBD5E1` | Used via `var(--color-border)` | ✅ |
| `--color-brand` | `#244fb8` | Used via `var(--color-brand)` | ✅ |
| `--color-brand-soft` | `#DBEAFE` | Used via `var(--color-brand-soft)` | ✅ |
| `--color-focus-ring` | `#244fb8` | Used via `var(--color-focus-ring)` | ✅ |
| `--radius-md` | `8px` | Used via `var(--radius-md)` | ✅ |
| `--space-4` | `16px` | Used via `var(--space-4)` | ✅ |
| `--text-body` | `13px` | Used via `var(--text-body)` | ✅ |
| `--size-control-touch` | `44px` | Used via `var(--size-control-touch)` | ✅ |

**Finding:** Token consumption is **consistent** — all workspaces use semantic tokens. The divergence is **component composition**, not tokens.

---

## 3. Detailed Consistency Findings (Severity: P0/P1/P2)

### P0 — Critical: Dual Component Systems (Blocking Design System Adoption)

| Finding ID | Route/Component | Existing Divergence | Canonical Target | Evidence |
|------------|-----------------|---------------------|------------------|----------|
| **P0-01** | All 14 routes — Buttons | Local `.button`, `.primary`, `.danger` in `workspace.module.css` (lines 4, 27-30) | `src/components/ui/button.tsx` — `Button` + `ButtonLink` with `variant` prop | Module CSS defines 47 lines of button styles; canonical has 16 lines + variant system |
| **P0-02** | All list/detail — Metrics | Local `.metrics` + `.metric` grid (CSS lines 7, 26-32) | `src/components/ui/metric-grid.tsx` — `MetricGrid` + `MetricItem` with `tone` | Module metrics lack `tone` semantic classification; hardcoded colors |
| **P0-03** | All tables — Status Badges | Local `.badge` + `.warning`/`.success` (CSS lines 8, 54) | `src/components/ui/status-badge.tsx` — `StatusBadge` with `StatusTone` enum | No icon support, no `description` prop, tone not typed |
| **P0-04** | All forms — Field/Label/Error | Local `Field` in `common.tsx` (lines 19-23) | `src/components/ui/form.tsx` — `FormField` with `hint`, `error`, `full` | No hint support, error not linked via `aria-describedby` consistently |
| **P0-05** | All empty states | Local `.empty` + `.emptyIcon` + `.emptyActions` (CSS lines 10, 56-58) | `src/components/ui/empty-state.tsx` — `EmptyState` with `action`, `badge`, `error` | No standardized illustration/icon system |
| **P0-06** | All error states | Local `Notice error` + inline messages | `src/components/ui/error-state.tsx` — `ErrorState` with `digest`, `reset`, `copy.ts` | No error digest/reference code for support |
| **P0-07** | All panels/sections | Local `.panel` CSS (line 3) | `src/components/ui/panel.tsx` — `Panel` with `title`, `description`, `actions`, `headingId` | No accessible heading association |
| **P0-08** | All loading states | Local `.loadingSurface` / `.loadingState` (CSS lines 39-40) | `src/components/ui/page-skeleton.tsx` — `PageSkeleton` with `shape` prop | No skeleton shapes matching content |

### P1 — High: Functional/Navigation/Label Inconsistencies

| Finding ID | Route | Issue | Current Behavior | Expected (Canonical/Cross-Module) |
|------------|-------|-------|------------------|-----------------------------------|
| **P1-01** | `/duct-rental/cancellation/new` | Label mismatch | Page title: "ขอยกเลิกการใช้ท่อ" but breadcrumb in METRIX source says "ขอยกเลิกเส้นทาง" | Align with source vocabulary: "ขอยกเลิกเส้นทาง" |
| **P1-02** | `/duct-rental/renewal/[id]` | Missing "Add File สัญญา" label parity | Button: "บันทึกสัญญา" (line 545 in source) vs METRIX "Add File สัญญา" | Use source label "Add File สัญญา" for 3rd party step |
| **P1-03** | `/duct-rental/tracking` | SLA status labels differ from METRIX | `slaLabels`: "อยู่ในกำหนด", "ใกล้ครบกำหนด", "เกินกำหนด", "เสร็จแล้ว" | METRIX uses "On Track", "Near Due", "Overdue", "Completed" (English in source) — Thai OK but verify with owner |
| **P1-04** | `/duct-rental/communication-cable` | Prototype notice not dismissible | Static `Notice` banner "แบบร่างสำหรับทบทวนโฟลว์..." | Should be dismissible or move to `PageHeader` description |
| **P1-05** | `/duct-rental/[id]` PhaseTabs | Missing `COMPLETE` tab | `PhaseTabs` filters `COMPLETE` out (line 41) | Source has `COMPLETE` as terminal — should show read-only |
| **P1-06** | `/duct-rental/cancellation/[id]` | Flow steps hardcoded | `CANCEL_FLOW_STEPS` array (4 steps) vs source `cancellationTransitions` (3 transitions) | Sync with `domain/workflow.ts` transitions |
| **P1-07** | ModuleNav (sidebar) | Duct-rental children: "เช่าท่อร้อยสาย", "ต่อสัญญา", "พาดสายสื่อสาร" | Short labels vs full page titles "ยกเลิกการใช้ท่อ", "ติดตามต่อสัญญาและยกเลิก" | Include cancellation + tracking in sidebar or justify omission |
| **P1-08** | `/duct-rental/tasks` | Signature workflow isolated | Separate module "งานลงนาม NT Form" not linked from request detail | Request detail has "ขอยกเลิกการใช้ท่อ" link but no "ลงนาม" link when signoff pending |
| **P1-09** | All routes | `ModuleNav` current prop inconsistent | Some pages pass `current="renewal"`, others `current="cancellation"`, detail pages pass none | Standardize `current` to match sidebar key |

### P2 — Medium: Visual/Responsive/Accessibility Polish

| Finding ID | Area | Divergence | Target |
|------------|------|------------|--------|
| **P2-01** | Typography scale | Module uses `--text-stat: 24px` for metrics; canonical uses same but `MetricGrid` expects `metric.value` as ReactNode | Align metric value rendering |
| **P2-02** | Focus rings | `.workspace :is(button,a,input,select,textarea,summary):focus-visible` uses `var(--focus-ring-width)` 3px | Canonical `button:focus-visible` same — **consistent** |
| **P2-03** | Touch targets | `.workspace button{min-height:var(--size-control-touch)}` = 44px | Canonical `.button{min-height:44px}` — **consistent** |
| **P2-04** | Responsive breakpoints | Module: 1000px, 600px; Canonical globals: 1120px, 900px, 650px | Align to canonical breakpoints |
| **P2-05** | Table horizontal scroll | `.tableWrap` has `overflow:auto` + `tabIndex={0}` | `TableRegion` provides same — migrate to component |
| **P2-06** | Modal focus trap | Local `Modal` uses `useEffect` + `showModal()` + focus restoration | Canonical has no modal — use `<dialog>` pattern consistently |
| **P2-07** | Dark mode | Module CSS has `@media (prefers-color-scheme: dark)` overrides in globals.css only | Tokens handle dark mode — **consistent** |
| **P2-08** | Reduced motion | Tokens define `--motion-fast/base/slow` + `@media (prefers-reduced-motion)` | No animation in module CSS — **consistent** |

---

## 4. Cross-Module Journey Analysis

### 4.1 Cancellation Journey (`ยกเลิกใช้ท่อ`)

```
Request List (/duct-rental) 
  → "ขอยกเลิกการใช้ท่อ" link (RequestWorkspace line 104)
  → Cancellation New (/duct-rental/cancellation/new?request=ID)
  → Select active route → Fill reason/date/notes → Submit
  → Cancellation Detail (/duct-rental/cancellation/[id])
  → Workflow: cancel_initiated → in_progress → tracking → completed
  → On completion: Request marked cancelled, route returns to list
```

**Gaps:**
- No breadcrumb on Cancellation New page (missing `parent` in PageHeader)
- Cancellation list (`/duct-rental/cancellation`) not in sidebar ModuleNav
- Tracking page (`/duct-rental/tracking`) shows both renewal+cancellation but not linked from cancellation detail
- Request detail shows "ขอยกเลิกการใช้ท่อ" only when `COMPLETE` — correct per domain

### 4.2 Renewal Tracking Journey (`ติดตามต่อสัญญา`)

```
Renewal List (/duct-rental/renewal)
  → "สร้างงานต่อสัญญารายปี" button
  → Renewal Detail (/duct-rental/renewal/[id])
  → Route review (Keep/Drop) → Submit for approval
  → Admin approve → Memo preparation → Provider confirm → Contract upload
  → Contracted status
  → Tracking page (/duct-rental/tracking?kind=Renew) shows SLA
```

**Gaps:**
- Renewal list not in sidebar ModuleNav (only "ต่อสัญญา" link goes to list)
- No direct link from Request detail to its renewal (if exists)
- Tracking page filters by kind but no deep link from renewal detail

### 4.3 Cross-Module Navigation (Sidebar vs. In-Module)

| Module | Sidebar Children (ModuleNav) | In-Module Nav (ModuleNav in workspace) | Missing |
|--------|------------------------------|----------------------------------------|---------|
| duct-rental | "เช่าท่อร้อยสาย", "ต่อสัญญา", "พาดสายสื่อสาร" | "คำขอเช่าท่อ", "ยกเลิกการใช้ท่อ", "ติดตามต่อสัญญาและยกเลิก", "งานลงนามและลายเซ็น" | **Cancellation, Tracking, Tasks missing from sidebar** |
| guarantees | "ภาพรวมเงินประกัน", "ทีมติดตั้ง" | Same | ✅ Aligned |
| buildings | "ข้อมูลอาคาร", "เพิ่มอาคาร" | Same | ✅ Aligned |
| work | Dynamic from `workNavigation` | Same | ✅ Aligned |

**Root Cause:** Sidebar `ModuleNav` (src/components/module-nav.tsx lines 129-136) hardcodes only 3 children; workspace `ModuleNav` (src/modules/duct-rental/components/common.tsx lines 9-14) has 4.

---

## 5. Root Cause Analysis

| Root Cause | Affected Findings | Why It Exists |
|------------|-------------------|---------------|
| **RC-01: Parallel component evolution** | P0-01 through P0-08 | Duct-rental module built before canonical `src/components/ui/` primitives stabilized; never migrated |
| **RC-02: Local component library** | P0-01 through P0-08 | `src/modules/duct-rental/components/common.tsx` + `workspace.module.css` act as module-local design system |
| **RC-03: Source vocabulary drift** | P1-01, P1-02, P1-06 | METRIX source uses English status labels; Thai translation applied inconsistently |
| **RC-04: Sidebar/module-nav sync gap** | P1-07, P1-09 | Two independent `ModuleNav` implementations (shell + module) with different child lists |
| **RC-05: Workflow-state hardcoding** | P1-05, P1-06 | PhaseTabs excludes COMPLETE; Cancellation flow steps hardcoded vs domain model |
| **RC-06: No shared form/field primitives** | P0-04 | Module predates `src/components/ui/form.tsx` |
| **RC-07: Isolated signature workflow** | P1-08 | Signature workspace built as standalone; not integrated into request detail actions |

---

## 6. Prioritized Rollout Batches (Cancellation + Renewal First)

### Batch 1 — P0 Primitives Migration (Foundation)
**Scope:** Replace all local button/metric/badge/field/empty/error/panel/loading with canonical primitives
**Files to Modify:** 14 route pages + `workspace.module.css` + `common.tsx`
**Estimated Effort:** 2-3 days
**Acceptance:** Zero local `.button`, `.metric`, `.badge`, `.panel`, `.empty`, `.loadingSurface` classes in duct-rental components

### Batch 2 — Cancellation Journey Polish (P1-01, P1-07, P1-08, P1-09)
**Scope:** 
- Fix Cancellation New page breadcrumb + title alignment
- Add Cancellation + Tracking to sidebar ModuleNav
- Add "ลงนาม" link in RequestWorkspace when signoff pending
- Standardize `ModuleNav.current` prop across all routes
**Files:** `src/app/(platform)/duct-rental/cancellation/new/page.tsx`, `src/components/module-nav.tsx`, `src/modules/duct-rental/components/request-workspace.tsx`, all route pages
**Estimated Effort:** 1 day

### Batch 3 — Renewal Journey Polish (P1-02, P1-03, P1-05, P1-06)
**Scope:**
- Align renewal button labels with METRIX ("Add File สัญญา")
- Sync SLA status labels with source
- Add COMPLETE tab to PhaseTabs (read-only)
- Sync cancellation flow steps with `domain/workflow.ts`
**Files:** `src/modules/duct-rental/components/process-workspace.tsx`, `src/modules/duct-rental/components/common.tsx`, `src/modules/duct-rental/domain/workflow.ts`
**Estimated Effort:** 1 day

### Batch 4 — Communication Cable Integration (P1-04, P2-04)
**Scope:**
- Make prototype notice dismissible or move to PageHeader
- Align responsive breakpoints to canonical (1120/900/650)
**Files:** `src/modules/duct-rental/components/communication-cable-workspace.tsx`, `workspace.module.css`
**Estimated Effort:** 0.5 day

### Batch 5 — Remaining P2 Polish + Visual Regression
**Scope:** Focus rings, touch targets, dark mode, reduced motion, skeleton shapes
**Files:** `workspace.module.css`, all workspace components
**Estimated Effort:** 1 day

---

## 7. Acceptance Matrix (with Screenshot Requirements)

| Checkpoint | Verification Method | Screenshot Required |
|------------|---------------------|---------------------|
| **Batch 1 Complete** | Grep for removed local classes: `grep -r "\.button\|\.primary\|\.danger\|\.metric\|\.badge\|\.panel\|\.empty\|\.loadingSurface" src/modules/duct-rental/components/` → 0 results | Full-page screenshots of: Request List, Request Detail, Renewal List, Renewal Detail, Cancellation List, Cancellation Detail, Tracking, Tasks, Settings, Communication Cable (Light/Dark, Desktop/Mobile) |
| **Batch 2 Complete** | 1. Sidebar shows 5 children for duct-rental 2. Cancellation New has breadcrumb "เช่าท่อร้อยสาย / ขอยกเลิกเส้นทาง" 3. Request Detail shows "ลงนาม" link when signoff pending 4. All route pages pass `current` to ModuleNav | Sidebar expanded, Cancellation New page, Request Detail with signoff pending |
| **Batch 3 Complete** | 1. Renewal Detail "Add File สัญญา" button visible at provider_confirmed 2. PhaseTabs shows COMPLETE tab (read-only) 3. Cancellation Detail flow steps match `cancellationTransitions` 4. SLA labels match source | Renewal Detail at provider_confirmed, PhaseTabs with COMPLETE, Cancellation Detail |
| **Batch 4 Complete** | 1. Communication Cable prototype notice dismissible 2. Responsive at 1120/900/650 breakpoints | Communication Cable page at 3 breakpoints |
| **Batch 5 Complete** | 1. axe-core scan: 0 serious/critical violations 2. Contrast check: all text ≥4.5:1 3. PageSkeleton shapes match content | axe report, contrast report, skeleton screenshots |

---

## 8. Coverage Checklist (All Inventoried Views)

| View | Route | P0 Primitives | P1 Labels/Nav | P2 Polish | Status |
|------|-------|---------------|---------------|-----------|--------|
| Request List | `/duct-rental` | ❌ | ⚠️ (ModuleNav current) | ⚠️ | Pending |
| Request New | `/duct-rental/new` | ❌ | ✅ | ⚠️ | Pending |
| Request Detail | `/duct-rental/[id]` | ❌ | ⚠️ (PhaseTabs, signoff link) | ⚠️ | Pending |
| Request Edit | `/duct-rental/[id]/edit` | ❌ | ✅ | ⚠️ | Pending |
| Request Phase Views | `/duct-rental/[id]/[view]` | ❌ | ⚠️ (PhaseTabs) | ⚠️ | Pending |
| Renewal List | `/duct-rental/renewal` | ❌ | ⚠️ (sidebar missing) | ⚠️ | Pending |
| Renewal Detail | `/duct-rental/renewal/[id]` | ❌ | ⚠️ (labels, flow) | ⚠️ | Pending |
| Cancellation List | `/duct-rental/cancellation` | ❌ | ❌ (sidebar missing) | ⚠️ | Pending |
| Cancellation New | `/duct-rental/cancellation/new` | ❌ | ❌ (breadcrumb, title) | ⚠️ | Pending |
| Cancellation Detail | `/duct-rental/cancellation/[id]` | ❌ | ❌ (flow steps) | ⚠️ | Pending |
| Communication Cable | `/duct-rental/communication-cable` | ❌ | ⚠️ (prototype notice) | ❌ | Pending |
| Settings | `/duct-rental/settings` | ❌ | ✅ | ⚠️ | Pending |
| Tasks (Signing) | `/duct-rental/tasks` | ❌ | ❌ (sidebar missing) | ⚠️ | Pending |
| Tracking | `/duct-rental/tracking` | ❌ | ❌ (sidebar missing) | ⚠️ | Pending |

**Legend:** ❌ = Not started, ⚠️ = Partial/Issues identified, ✅ = Aligned

---

## 9. Owner Summary (Thai)

### สรุปสำหรับเจ้าของโมดูล

**โมดูลเช่าท่อและร้อยสาย (Duct Rental) มี 14 หน้าจอหลัก** ครอบคลุม: รายการคำขอ, สร้าง/แก้ไขคำขอ, รายละเอียด 10 ขั้นตอน, ต่อสัญญารายปี (รายการ+รายละเอียด), ยกเลิกการใช้ท่อ (รายการ+สร้าง+รายละเอียด), พาดสายสื่อสาร, ตั้งค่า, งานลงนาม, ติดตามกระบวนการรวม

**ปัญหาหลัก 3 ประการ:**

1. **ระบบคอมโพเนนต์สองชุด (Critical)** — โมดูลใช้ปุ่ม, เมตริก, แบดจ์, ฟิลด์, สเตทว่าง/ผิดพลาด/โหลด, แผง, ตารางแบบเขียนเองใน `workspace.module.css` + `common.tsx` แทนที่จะใช้ shared primitives ใน `src/components/ui/` (PageHeader, Button, MetricGrid, StatusBadge, FormField, EmptyState, ErrorState, Panel, TableRegion, PageSkeleton) → ทำให้ UI ไม่สม่ำเสมอ กับโมดูลอื่น และยากต่อการบำรุงรักษา

2. **การนำทางและคำศัพท์ไม่สอดคล้อง (High)** — Sidebar เมนูข้างเคียงขาด "ยกเลิกการใช้ท่อ", "ติดตามต่อสัญญา", "งานลงนาม"; หน้าสร้างยกเลิกขาด breadcrumb; ปุ่มต่อสัญญาใช้คำต่างจากระบบต้นทาง (METRIX); ขั้นตอน workflow ยกเลิก hardcode ไม่ตรง domain model

3. **Workflow เองอาจหาย/แยกจากกัน (Medium)** — หน้าติดตาม (tracking) รวม renewal+cancellation แล้วแต่ sidebar/เมนูในโมดูลไม่เชื่อมโยง; งานลงนามแยกออกไปไม่ได้ลิงก์จากรายละเอียดคำขอ

**แผนแก้ไข 5 ช่วง (Cancellation + Renewal ก่อน):**
- ช่วง 1: ย้ายทุกคอมโพเนนต์ไปใช้ shared primitives (2-3 วัน)
- ช่วง 2: ปรับเส้นทางยกเลิก + sidebar + ลิงก์ลงนาม (1 วัน)
- ช่วง 3: ปรับเส้นทางต่อสัญญา + labels + phase tabs (1 วัน)
- ช่วง 4: พาดสายสื่อสาร + responsive breakpoints (0.5 วัน)
- ช่วง 5: Polish + accessibility + visual regression (1 วัน)

**ต้องการ Screenshot ยืนยัน:** ทุกหน้าจอ 14 หน้า × Light/Dark × Desktop/Mobile = 56 รูป ก่อน/หลังแต่ละช่วง

---

## 10. Appendix: File References

### Duct-Rental Module Files
- Routes: `src/app/(platform)/duct-rental/**/*.tsx` (14 files)
- Workspaces: `src/modules/duct-rental/components/*-workspace.tsx` (9 files)
- Forms: `request-form.tsx`, `process-workspace.tsx` (CancellationForm, RenewalPane, CancellationPane)
- Shared: `common.tsx`, `design-editor.tsx`, `attachment-picker.tsx`, `file-list.tsx`, `pdf-viewer.tsx`, `signature-workspace.tsx`, `tracking-workspace.tsx`, `communication-cable-workspace.tsx`, `settings-workspace.tsx`, `workspace.module.css`
- Domain: `domain/workflow.ts`, `domain/source-policy.ts`, `domain/cable-workflow.ts`, `capabilities.ts`, `manifest.ts`, `route-ui-contract.ts`

### Canonical Primitives
- `src/components/ui/page-header.tsx`, `button.tsx`, `metric-grid.tsx`, `table-region.tsx`, `status-badge.tsx`, `form.tsx`, `empty-state.tsx`, `error-state.tsx`, `panel.tsx`, `page-skeleton.tsx`, `truncated-text.tsx`

### Design Tokens
- `src/styles/tokens.css` (single source of truth)

### Source Reference (METRIX)
- `_discovery_sources/METRIX/app/(dashboard)/dashboard/duct-rental/**/*.tsx` — 8 pages for parity comparison

---

**End of Audit Report** — Ready for Batch 1 implementation upon approval.