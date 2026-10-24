# Enterprise workspace design system

Status: Current foundation; domain selector migration remains incremental. UX polish applied across Work module (Phase B–E of PERMISSION-UX-001).

## Tokens and foundations

`src/styles/tokens.css` owns light/dark colors, semantic status, spacing, type, radii and elevation. Retired compatibility aliases must not be reintroduced. Fonts are bundled through `src/app/fonts.ts` and `src/app/fonts/` with their OFL licenses: Manrope, Nunito, Noto Sans Thai and Source Code Pro.

Brand: corporate blue `--color-brand: #244fb8` (ADR-0004). Status colors with text labels: success green, warning amber, danger red, info blue. Never use color alone to convey status — status always has an accompanying label.

`shell.css` owns navigation geometry. `components.css` contains active shared presentation extracted from the retired theme, with compact typography and blue action tokens. `ui.css` defines shared status, page, form and table patterns. `globals.css` retains older structural selectors during strangler migration; global token definitions have been removed. Domain styles remain until consumer migration and visual checks.

## Motion

`src/styles/motion.css` defines keyframes and transitions using only `transform` and `opacity` (120/200ms), respecting `prefers-reduced-motion`. Added: `toast-enter/exit`, `card-hover`, `page-enter`. Existing: `auth-enter`, `panel-enter/exit`, `popover-enter`, `success-enter`, `row-enter`, `skeleton-shimmer`. No infinite looping animation on reading-heavy pages.

## React UI patterns (`src/components/ui`)

- `TruncatedText` — clamps text 1–3 lines, shows full text on focus/hover tooltip, keyboard-focusable when truncated. Used in work task table, task detail, people cards, job tracker groups, KPI cards, work route page activity and due lists.
- `StatusBadge` — neutral/info/success/warning/danger, always shows text label alongside color.
- `PageHeader`, `EmptyState`, `ErrorState`, `PageSkeleton`, `AnimatedNumber`.
- `PageSkeleton` used as loading state; `AnimatedNumber` shows stable formatted counts without count-up animation.

## Work module additions (Phase B–E)

- **Phase B**: Long text wrapped with `TruncatedText` across work screens; `min-width: 0` on work containers to prevent overflow.
- **Phase C**: Thai microcopy in `src/lib/copy.ts` rewritten to be conversational, concise, respectful (e.g. "เรียบร้อย ✓", "ลองอีกครั้งได้เลย"). No raw technical error messages shown to users.
- **Phase D**: Toast, card-hover and page-enter motion classes added; `prefers-reduced-motion` fully respected.
- **Phase E**: "ทางลัดงาน" quick-links grid on My Work dashboard (เพิ่มงานใหม่, งานของฉัน, ติดตาม Job, ผลการทำงานของฉัน). Command palette (`Ctrl+K` / `/`) rendered in `AppShell` for all platform pages — keyboard-first navigation with arrow keys, Enter, Esc.

## Responsive

Verified breakpoints: 375 / 768 / 1024 / 1440px. Tables scroll horizontally within their own container (`overflow-x: auto`); no full-page horizontal scroll. Touch targets at least 44px on mobile/tablet.

## Accessibility (target WCAG 2.2 AA)

- `focus-visible` outline (3px) on all interactive controls; visible focus states.
- Contrast checked with tools, not just compile; dark mode verified.
- Status communicated by text as well as color.
- Skip link ("ข้ามไปยังเนื้อหาหลัก") at top of page.
- `aria-label`, `aria-expanded`, `aria-controls`, `role` on combobox/dialog/listbox patterns.
- TruncatedText tooltips reachable by keyboard focus.
- Compiling CSS does not establish WCAG compliance — verify with actual tools after presentation changes.

## Operational Command — local checkpoint 23 ต.ค. 2569

- Direction A ใช้ navigation tokens `--color-nav-*` ที่ `tokens.css`: rail และ mobile drawer เปลี่ยน semantic surface/text/border ตาม light/dark workspace; active navigation ใช้สี accent ของแต่ละธีมและ focus ใช้ token ที่ผ่าน contrast gate. ไม่เพิ่มไฟล์ theme override
- `shell.css` คุม header/rail geometry ให้ตรงกัน, canonical sidebar ใช้ expanded 248px / collapsed 80px และเพิ่ม touch-height 44px สำหรับ controls บนจอเล็ก. Persistent rail ไม่ slide เข้ามาบัง/ตัดเมนู
- Pilot และ module entry points ใช้ `data-ui-screen` เป็น presentation contract: Overview, Work, Admin, Car Booking, Guarantees, Duct Rental, Buildings และ Buildings Map. ให้คง domain composition เฉพาะทางไว้ภายใน shared shell
- Shared primitive ownership อยู่ใน `src/components/ui` และ `src/styles/ui.css`; legacy selectors คงไว้เป็น compatibility aliases จนกว่าจะมี rollout แยกที่ได้รับอนุมัติ. ห้ามเพิ่ม duplicate primitive หรือ CSS owner ใหม่
- `TruncatedText` ปิด tooltip ด้วย Esc โดยไม่เสีย focus; shared disabled actions ไม่เปลี่ยนสีเมื่อ hover; PageHeader actions wrap โดยไม่ตัดปุ่มเป็นหลายบรรทัด
- AccountControl ใช้ disclosure + named region ไม่ใช้ ARIA menu ที่ไม่มี menuitems; ปิดด้วย Esc หรือย้าย focus ออก, คืน focus เมื่อกด Esc. ไม่เปลี่ยน logout action
- BuildingEditorForm เชื่อม error summary ผ่าน aria-describedby ในช่องค่าธรรมเนียม/คำนวณ โดยไม่เปลี่ยน validation หรือสูตรธุรกิจ
- Browser regressions: `e2e/operational-command.spec.ts` ร่วมกับ navigation/theme/focus และ reduced-motion suites ผ่าน 59 tests; ทดสอบ real components + synthetic data เท่านั้น. ดูผล/ข้อจำกัดใน `../IMPLEMENTATION_HANDOFF.md`

## Retired / do not use

Retired: `coral-stay-theme.css`, unused `bouncebox-theme.css`, old sidebar.css location. Do not append another override theme. Avoid glassmorphism, gradient/glow without meaning, stacked cards, and animations that slow down work.

Verify desktop/mobile, contrast and keyboard flows after presentation changes.
