# QA_REVIEW — duct batch1 (deleg_8c8defd4) — Independent QA (hermes-qa)

**Repo:** `D:/WebApp/SuperApp PERMISSION_NEXT` (branch `main`, 40 commits ahead of origin/main)
**Verdict:** TECHNICAL = **PASS** | VISUAL = **UNVERIFIED** | Overall = **PASS** (technical gates met; visual evidence insufficient — see findings)
**Mode:** Read-only. No code/db/env/permission/server modifications. Pre-existing uncommitted overview work preserved untouched (buildings, dashboard-overview, deposit-workspace, car-booking, native-dashboard, workspace-queue, next-env.d.ts; untracked `DUCT-RENTAL-UI-CONSISTENCY-AUDIT.md`).

## Batch 1 diff inspected (git HEAD vs working tree)
- `src/modules/duct-rental/components/process-workspace.tsx` 54 → 413 lines (~385 rewritten)
- `src/modules/duct-rental/components/tracking-workspace.tsx` 19 → 92 lines (~85)
- `src/components/module-nav.tsx` 156 → 158 lines (+4)
- `src/app/(platform)/duct-rental/tracking/page.tsx` +2 lines (1-line logic change)
- Tests: `src/modules/duct-rental/tests/tracking-ux.test.tsx` (new), `src/components/module-nav.test.tsx` (expanded)
- CSS: `src/app/globals.css`, `src/styles/components.css`, `src/styles/ui.css`, `src/styles/work.css`, `src/components/ui/page-header.tsx`

## Functional parity vs HEAD (verified by diff review)
Business logic IDENTICAL between HEAD and working tree — only presentation migrated from local classes (`workspace.module.css` `.button/.primary/.danger/.Field/.badge/.warning/.success/.empty`) to canonical primitives (`Button`/`ButtonLink`, `TableRegion`, `StatusBadge`, `FormField`, `EmptyState`, `PageSkeleton`) plus `Notice`/`RefreshBar`/`PageHeader` retained:
- Permissions unchanged: same `duct_rental.*` capability set on both sides; **no permission expansion** (`allowedModuleIds` untouched; diff permission strings identical: cancellation.advance/archive/create/reject, document.export/upload, renewal.archive/contract/review).
- Request payloads/mutation handlers identical: `apiPost("renewals",{year})`, `apiPost("cancellations",{requestId,version,effectiveDate,reason,notes})`, `apiPost("renewals/{id}/review",{version,routeId,reviewStatus,notes})`, `apiPost("renewals/{id}/documents", FormData{version,file})`, `apiPost("renewals|/cancellations/{id}/{action}",{version,notes,contractNumber,thirdPartyNotes,contractDocumentId})`.
- Version/concurrency preserved: versioned keys `key={id}:{model.data.version}`, `version: row.version` in every mutating payload.
- Documents/signing preserved: `AttachmentPicker`, `documentUrl()`, `PdfViewer`, `duct_rental.document.upload/export` capability gates.
- Refresh/error handling preserved: `RefreshBar {...model} paused={paused} refresh={model.refresh}`, `Notice text={error} error`, `errorText()`, try/catch/finally `busy` flags.
- Return links preserved: "เปิดงาน" → `/duct-rental/{renewal|cancellation}/{id}`, "กลับรายการ" → list, "เปิดเส้นทางต้นฉบับ" → `/duct-rental/{requestId}`, TrackingSummary deep-links incl. `?sla=Completed`.

## Completed / whitelist / query reset / nav (tested)
- `tracking/page.tsx`: whitelist `["Near Due","Overdue","Completed"]`; anything else (incl. unknown) → `""` (no initial filter); `key={initialSla}` remounts workspace on SLA change; `filter()` resets `offset` to 0 on every filter change.
- `module-nav.tsx`: `currentDuctHref` regex `/^\/duct-rental\/(new|[0-9a-f-]{36})(\/|$)/i` → `/duct-rental` parent stays active for `/new` and `/new/[id]`; sidebar gains only cancellation + tracking children (no new permissions/surfaces).
- Tests `tracking-ux.test.tsx`: ?sla=Completed renders, ?sla=Bogus renders with no initial filter, Completed/Overdue options present, SLA badges (success/warning/neutral), `role="region"` with aria-label, `เปิดงาน` links, counts 3/1/1/1, empty state, loading shell (`loading-workspace`/`skeleton-table`), ProcessList create-action permission gating.
- `module-nav.test.tsx`: sidebar lists cancellation + tracking; aria-current activation for cancellation/new, cancellation/[id], tracking, renewal detail, request detail.

## Executed checks (actual output, not claimed)
| Check | Command | Result |
|---|---|---|
| Focused duct tests | `npx vitest run module-nav tracking-ux shared-foundation-css` | 3 files, 21 tests, **21 passed, 0 failed** |
| Full test suite | `npm test` (`vitest run`) | **6325 passed \| 66 skipped (6391)**, 0 failed. Dev claim "full6325" VERIFIED by this run. Baseline "5928" never observed; not repeated. |
| Typecheck | `npm run typecheck` (`tsc --noEmit`) | **PASS** (clean) |
| Lint | `npm run lint` (`eslint .`) | **PASS** (clean) |
| CSS quality | `npm run check:css` | **354 files, 0 violations** |
| Contrast | `npm run check:contrast` | **58 pairs, 0 failures** |
| Production build | `npm run build` (`next build`) | **PASS**, compiled, 21 static routes incl. all 14 duct-rental routes |

All duct-rental routes build: `/duct-rental`, `/cancellation`, `/cancellation/[id]`, `/cancellation/new`, `/renewal`, `/renewal/[id]`, `/tracking`, `/new`, `/[id]`, `/[id]/edit`, `/[id]/[view]`, `/communication-cable`, `/settings`, `/tasks`.

## CSS cascade observations (non-blocking)
- `styles.tableWrap` / `styles.table` (workspace.module.css) still own table geometry on tracking/process tables; shared canonical `ui-table-scroll` + `ui-table` (ui.css, declared exactly once per shared-foundation-css.test.ts) is NOT applied to duct tables — split ownership, divergence risk (e.g. dark-mode `.workspace-table th` rules do not reach duct `.table th`).
- `FormField` = implicit `<label>` wrapping only: no `htmlFor`/`id` association, no `aria-describedby` error wiring; errors rendered via separate `Notice`.
- `.loadingSurface` / `.loadingState` remain defined in workspace.module.css (used by request-form/request-workspace, outside batch1 scope); tracking/process now use shared `PageSkeleton`.

## Screenshots — located and counted (bounded discovery; artifacts NOT self-verified as live-app evidence)
- Dir: `C:/Users/kobpat_m/AppData/Local/hermes/profiles/hermes-developer/cache/scratch/fixture/out/`
- PNGs: **17** (dev claimed 18 → **NOT met**). Exact list: cancellation-detail dark/light, cancellation-list dark/light, cancellation-new dark/light + mobile dark/light, renewal-detail dark/light + mobile dark/light, renewal-list dark/light, tracking-completed dark + mobile dark/light.
- **MISSING:** `tracking-completed-light.png` (the file the prior rglob searched for and found `[]`). HTML companion `tracking-completed-light.html` EXISTS but has no rendered PNG.
- HTML fixtures: 12 files (6 scope views × dark/light), every view carries `data-ui-screen` matching a real screen (`duct-rental-cancellation-list/...-new/...-detail`, `duct-rental-renewal-list/...-detail`, `duct-rental-tracking`) and title suffix `ฟิกเจอร์ข้อมูลจำลอง (ไม่ใช่ข้อมูลจริงจากระบบ)` = **simulated fixture data, not real system data**.
- No `@font-face` in fixtures (font tokens only as CSS vars); no `next/script`/`__NEXT__`/hydration markers → static snapshots, **no hydration scope**.
- Generation scripts `cdp_screenshot.py` / `cdp_mobile.py` and `chrome.log` were **pruned/missing** at time of review → provenance (localhost:3000 current build vs static fixture) cannot be confirmed.
- Live app `localhost:3000` is behind a login wall; no saved vault credentials; no credentials guessed, no session created, no DB fixtures written → **real-app visual evidence UNVERIFIED** (and correctly not attempted).

## 6 approved views coverage
Scope views present as fixtures: cancellation list, cancellation new, cancellation detail, renewal list, renewal detail, tracking = **6/6 covered at fixture level** (each dark+light desktop; mobile for cancellation-new, renewal-detail, tracking-completed). BUT tracking-completed-light.png is missing, so the claimed 18-image set is incomplete.

## Actionable defects (for hermes-developer; no QA-side fixes applied)
1. **Screenshot deficit (blocking visual sign-off):** Regenerate the missing `tracking-completed-light.png` and re-export the complete 18-image set (6 views × light/dark + 3 mobile) from the current build after login. Until then visual status = UNVERIFIED; screenshots are synthetic fixtures, not live-app evidence. Absolute existing paths listed above.
2. **CSS cascade cleanup (P2, optional):** Consider applying canonical `ui-table-scroll`/`ui-table` to duct tracking/process tables or documenting that `workspace.module.css` `.tableWrap`/`.table` intentionally own geometry; add `htmlFor`/`id` + `aria-describedby` to `FormField` error wiring if form-field semantics are hardened.
3. **Preserve uncommitted overview work:** do not discard/stash existing modifications to buildings/dashboard-overview/deposit-workspace/car-booking/native-dashboard/workspace-queue/next-env.d.ts and untracked `DUCT-RENTAL-UI-CONSISTENCY-AUDIT.md`.

## Thai summary (สรุปสำหรับเจ้าของโมดูล)
ตรวจ batch1 ของโมดูลเช่าท่อ/ร้อยสาย (ยกเลิก, ต่อสัญญา, ติดตาม) แล้ว: ด้านเทคนิค **PASS** — ทดสอบจริงผ่านทั้งหมด 6,325 เทส (duct เฉพาะ 21/21), typecheck, lint, คุณภาพ CSS, คอนทราสต์ และ production build ผ่านหมด ตรรกะการทำงานเหมือนเดิมกับก่อนปรับ (HEAD) ทุกประการ: สิทธิ์, payload การส่งคำขอ, เวอร์ชัน/การแข่งขัน, เอกสาร/ลงนาม, รีเฟรช/จัดการข้อผิดพลาด, ลิงก์กลับ, หัวข้อ/เมนู โอนจากคลาสในไฟล์ไปใช้คอมโพเนนต์กลางแล้ว ส่วน "Completed" ถูกเพิ่มในตัวกรองที่อนุญาต ค่าที่ไม่รู้จักรีเซ็ตตัวกรอง และเมนูย่อยเปิดถูกต้องสำหรับ /duct-rental/new และ /new/[id] โดยไม่ขยายสิทธิ์

ด้านภาพ **ยังยืนยันไม่ได้ (UNVERIFIED)** — มีจริงแค่ 17 รูป ไม่ใช่ 18 ตามที่อ้าง หน้าที่ขาดคือ `tracking-completed-light.png` รูปทั้งหมดเป็นไฟล์จำลอง (ระบุว่าไม่ใช่ข้อมูลจริงจากระบบ) スクリปต์สร้างรูปถูกลบไปแล้ว และเว็บจริง localhost:3000 ติด Login Table ไม่มีรหัสเข้าสู่ระบบ จึงขอไม่เดาหรือสร้างเซสชัน/ข้อมูลทดสอบ

ข้อต้องแก้ (สำหรับนักพัฒนา): สร้างรูป `tracking-completed-light.png` ใหม่และออกภาพชุดครบ 18 รูปจากเวอร์ชันปัจจุบันหลังล็อกอิน ก่อนจึงจะเซ็นรับภาพได้ ข้อสังเกตเล็กน้อยเรื่อง CSS: ตารางยังอ้างอิงคลาสเดิมใน `workspace.module.css` ควรพิจารณาใช้คลาสตารางกลางให้สอดกัน หรือทำความสะอาดคลาสเก่าที่ไม่ใช้แล้ว งานภาพรวมที่ยังไม่ได้ commit ก่อนหน้านี้ถูกเก็บรักษาไว้ไม่ถูกแตะต้อง