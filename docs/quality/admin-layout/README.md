# Admin layout alignment — 2026-10-05–06

Baseline: `1ed939c` on codex/work-parity-phase4; new branch codex/admin-layout. Reference: Core Shell, shared PageHeader, UI tokens, docs/product/design-system.md and current Work/Admin parity matrix. Existing unrelated building/UX edits were preserved.

## Changes

- One shared page header appears before content. One permission-filtered navigation replaces three duplicate anchor menus.
- Bookmarkable `/admin?section=...` links show one management area at a time: overview, users, positions, teams, roles, KPI/SLA, personal KPI, calendar, recalculation, systems, announcements, audit and restore.
- Overview links carry descriptions/counts. Desktop navigation sits alongside content; mobile navigation becomes a keyboard-accessible horizontal strip.
- Users have immediate name/email/employee/team search, result count and a collapsed create form. Long Thai names keep a readable column width and full title text.
- Forms, tables, focus rings and spacing use shared Light/Dark tokens. Audit filters sit with audit results and preserve date values/selected section when submitted.
- Existing mutation actions, RBAC and data queries remain the authority. Unauthorized section requests fall back to allowed overview; users without Admin grants redirect to home.
- Existing browser tests now navigate directly to the relevant section instead of relying on every admin form being on the same page.

## Verification

Baseline unit: 203 passed / 12 skipped. Final unit: 203 passed / 12 skipped (50 files passed / 2 skipped); document mapping: 1 passed. Lint/typecheck/build/CSS/contrast verified through local `.admin-ui-*.log` command outputs. CSS: 205 files, 0 violations. Contrast: 58 pairs, 0 failures.

Playwright uses the existing running dev server at 127.0.0.1:3000 and isolated synthetic parity accounts; it does not switch database connections or submit business mutations. Five tests inspect all 13 sections in Light/Dark at 1440/390 (52 section views), user search, edit-dialog open/Esc/focus, keyboard navigation/history and Staff denial. Assertions: one h1, active navigation, zero root overflow, zero browser page errors and zero axe serious/critical violations. Final JSON and 20 screenshots are stored here.

JEV health: local/network OK, metadata_only. Continue checkpoint: gather_evidence .48 / fallback_to_codex; completed final browser/modal checks and final compile/style gates using deterministic evidence. JEV is advisory only.

Reproduce: run `npx playwright test -c playwright.admin-layout.config.ts` with the existing local parity dev server and fixture accounts. Rollback: revert only Admin-layout commits; no schema migration or database rollback is required.
