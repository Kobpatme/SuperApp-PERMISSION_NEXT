# Work & KPI source parity

Status: SP-0 fresh baseline, 2026-09-29. This matrix is evidence-led and does not claim migration completion.

Authoritative source: `Kobpatme/maxiwa_KPI` at `4f5fa99b05f8dbfea9304d47560aec3d48746908` (`public/js/maxiwa.js`, `public/js/api.js`, `public/_worker.js`, `docs/legacy-system-audit.md`, `docs/product-blueprint.md`). Local checkout is only a comparison artifact.

| Source feature | Source screen | Source role/use case | Source file/function | SuperApp target | Current status | Decision | Test evidence | Notes |
|---|---|---|---|---|---|---|---|---|
| Personal Dashboard | My Dashboard | Staff, Lead | `public/js/maxiwa.js`; `renderDashboard`/dashboard selectors | `/work`, `/work/mine` | Generic read model only | PORT | Existing `work-read-model.test` coverage is partial | Preserve personal scope and source metrics |
| My Tasks | My Work | Staff, Lead | `public/js/maxiwa.js`; task list rendering | `/work/mine` | Generic queue | ADAPT | `work-domain.test.ts` | Use server-scoped rows and cursor pagination |
| Pending task acceptance | My Work | Assigned staff | `public/js/api.js`; `acceptTask`, `public/_worker.js` | Work task actions | Missing native action | PORT | Gate W-01 | `Pending -> On Process`, audited |
| Create personal task | Create task | Staff | `public/js/api.js`; `saveNewTask` | `/work/new` | Domain manual entry exists, no native UI | ADAPT | Gate W-02 | Server validates owner and scope |
| Status lifecycle | My Work / Task detail | All permitted roles | `public/_worker.js`; `updateTaskStatus`, `buildHoldStatusUpdate` | Work task service | Uses internal queued/in_progress/blocked vocabulary | ADAPT | Gate W-03 | Map labels while retaining safe target enum |
| Notes and detail edit | Task detail | Staff, Lead, Manager | `public/js/api.js`; `updateTaskDetails` | Task detail/action service | Missing native command surface | PORT | Gate W-04 | Note-only updates remain auditable |
| Team Command / Team Tasks | Team dashboard | Lead, Manager | `docs/product-blueprint.md`; `public/js/maxiwa.js` | `/work/team` | Missing | PORT | Gate W-05 | TEAM/SELECTED_TEAMS scope only |
| Assignment Center | Assignment | Lead, Manager, Admin | `public/js/api.js`; `assignNewTask` | `/work/assign` | Missing | PORT | Gate W-06 | Multi-job assignment must be atomic/idempotent |
| People | People overview | Lead, Manager, Executive | `docs/executive-system-workflow-and-resources.md` | `/work/people` | Missing | PORT | Gate W-07 | No client role checks |
| Job Tracker and grouped jobs | Job Tracker | All permitted roles | `docs/legacy-system-audit.md`; `public/js/maxiwa.js` | `/work/tracker` | Missing | ADAPT | Gate W-08 | One job may contain many tasks; show timeline/audit |
| Reports / weighted SLA | Performance / reports | Manager, SrManager, Director, Executive | `public/js/api.js`; `summarizeTasks` and report selectors | `/work/reports` | Basic status counts only | ADAPT | Gate W-09 | Preserve source weights as imported facts, not browser authority |
| KPI catalog / Main KPI / Sub KPI | Admin Studio / KPI | Admin, KPI owners | `public/_worker.js`; KPI endpoints | `/admin`, `/work/kpi` | Versioned target schema exists; no populated UI | ADAPT | Gate W-10 | Versioned rules and four-eyes changes remain target authority |
| SLA deadline calculation | Task create/update | All roles | `public/_worker.js`; `addWorkingDays`, `businessDaysBetween` | Work domain service | Missing | PORT | Gate W-11 | Asia/Bangkok business dates; skip weekend and active holidays |
| Holiday calendar | Admin Studio | Admin | `public/_worker.js`; `saveHoliday`, `syncThaiHolidays` | `/admin` | Missing target feature | ADAPT | Gate W-12 | Duplicate dates rejected; company and Thai public holidays supported |
| Hold deadline extension | Task detail | All roles | `public/_worker.js`; `buildHoldStatusUpdate` | Work domain service | Missing | PORT | Gate W-13 | Extension calculated server-side and recorded |
| Audit timeline | Job Tracker / admin | Admin and permitted users | `audit_log` writes in `public/_worker.js` | Core audit/activity | Foundation exists | KEEP | Existing audit/activity tests | Never edit historical events |

`RETIRE` decisions: none at SP-0. Missing target screens are not evidence that source features should be retired.
