# Work/KPI source UX baseline

Status: SP-0 fresh source freeze, 2026-09-29. This is a behavioral reference, not a claim that the target module is migrated.

## Evidence

- Repository: `Kobpatme/maxiwa_KPI`
- Approved baseline: `4f5fa99b05f8dbfea9304d47560aec3d48746908`
- Local checkout: `main` at the approved baseline
- Primary evidence: `public/maxiwa.html`, `public/js/maxiwa.js`, `public/js/api.js`, `public/js/executive-dashboard.js`, `docs/legacy-system-audit.md`, `docs/product-blueprint.md`, `scripts/logic-tests.mjs`

## UX inventory

| Question | Source behavior to preserve | Evidence |
|---|---|---|
| Entry/default landing | Role-aware navigation starts users in personal work/dashboard context; Lead/Manager/Executive users receive team or executive views in addition to personal work. | `public/js/maxiwa.js` `navItemsForUser`, `shouldUsePersonalWork`, executive view configuration |
| Primary actions | Staff create personal work and accept/update assigned work; Lead/Manager assign work; Admin maintains users, teams, KPI and holidays. | `docs/legacy-system-audit.md`, `docs/feature-parity-checklist.md`, `public/js/maxiwa.js` task and admin views |
| Common click paths | My Work → open task → accept/update status or append note; Team/People → inspect person/team → assign; Task Center → filter/edit; Job Tracker → search job → expand grouped tasks; Admin → users/teams/KPI/holidays/audit. | `public/js/maxiwa.js` view components and API calls |
| Search/filter | Task Center uses job, person/team, KPI and status-oriented filtering; Job Tracker searches job code and groups related tasks. | `public/js/maxiwa.js` Task Center and Job Tracker views |
| Detail interaction | Task detail is an in-context edit/note dialog; Job Tracker expands a job group to show each task, note and audit timeline. | `public/js/maxiwa.js` task edit/detail and tracker components |
| States visible to users | `Pending`, `On Process`, `On Hold`, `Completed`, `Cancelled`; risk language includes healthy/approaching/overdue; SLA and completion are weighted. | `docs/legacy-system-audit.md`, `public/js/maxiwa.js`, `public/js/executive-dashboard.js` |
| Success/error/empty behavior | Mutation feedback remains in the workspace; empty states explain that no task/person/job matches the current scope; errors must not silently substitute another view. | Source view components and API error handling |
| Navigation model | Role-first groups: personal work, team management, organization management, performance overview and tools. | `public/js/maxiwa.js` `navItemsForUser`, `Sidebar` |
| Keyboard/mobile | Source is a responsive browser workspace; target must preserve keyboard-operable native controls and make dense task tables usable at narrow widths. Source repository has no executable WCAG evidence, so this is a target acceptance obligation. | `public/maxiwa.html`, `docs/product-blueprint.md` |

## Calculation and workflow implications

- Deadline calculation excludes weekends and active holidays; source tests cover both date arithmetic and holiday normalization.
- Hold time extends the effective deadline and remains visible in risk calculations.
- Weighted SLA and weighted completion use task-level effective KPI weights; cancelled work is excluded from the active denominator.
- A job can contain multiple valid tasks. The target must group them without deduplicating legitimate work.
- Source roles and scoped permissions are behavioral inputs only; target authorization must remain server-side.

## Target parity rule

Do not flatten Work/KPI into a generic queue. The native target should expose role-specific work, team/people operations, assignment, tracker, reports and KPI views, while replacing browser-side authority with server authorization and audited actions.
