# Work & KPI source parity

Status: SP-1 native recovery slice, 2026-09-30. This matrix is evidence-led and does not claim migration completion.

Latest local implementation status: [2026-10-05 Work/KPI/Admin parity matrix](parity-2026-10-05.md). The rows below preserve the earlier checkpoint and are not the current gap list.

Authoritative source: `Kobpatme/maxiwa_KPI` at `4f5fa99b05f8dbfea9304d47560aec3d48746908` (`public/js/maxiwa.js`, `public/js/api.js`, `public/_worker.js`, `docs/legacy-system-audit.md`, `docs/product-blueprint.md`). Local checkout is only a comparison artifact.

| Source feature | Source screen | Source role/use case | Source file/function | SuperApp target | Current status | Decision | Test evidence | Notes |
|---|---|---|---|---|---|---|---|---|
| Personal Dashboard | My Dashboard | Staff, Lead | `public/js/maxiwa.js`; `renderDashboard`/dashboard selectors | `/work`, `/work/mine` | Native dashboard and explicit My Tasks screen; historical data pending | ADAPT | `npm test`, `work-view.test.ts` | Preserve personal scope and source metrics |
| My Tasks | My Work | Staff, Lead | `public/js/maxiwa.js`; task list rendering | `/work/mine` | Native server-scoped table with status actions and notes | ADAPT | `npm test`, `npm run build` | Pagination/cursor hardening remains open for datasets above the current bounded read |
| Pending task acceptance | My Work | Assigned staff | `public/js/api.js`; `acceptTask`, `public/_worker.js` | Work task actions | Native `queued -> in_progress` action is present | ADAPT | `work-domain.test.ts`, build | Transition remains server-authorized and audited |
| Create personal task | Create task | Staff | `public/js/api.js`; `saveNewTask` | `/work/new` | Native UI and audited server action | ADAPT | Existing action tests, build | Server validates owner and scope |
| Status lifecycle | My Work / Task detail | All permitted roles | `public/_worker.js`; `updateTaskStatus`, `buildHoldStatusUpdate` | Work task service | Native lifecycle action with Thai presentation labels | ADAPT | `work-domain.test.ts`, `work-presentation.test.ts` | Target enum remains safe and source labels are not leaked |
| Notes and detail edit | Task detail | Staff, Lead, Manager | `public/js/api.js`; `updateTaskDetails` | Task detail/action service | Native note action and detail surface; full edit form pending | PARTIAL | `work-presentation.test.ts`, build | Note-only updates remain auditable and optimistic |
| Team Command / Team Tasks | Team dashboard | Lead, Manager | `docs/product-blueprint.md`; `public/js/maxiwa.js` | `/work/team` | Native team screen with server permission gate | PARTIAL | `work-view.test.ts`, build | TEAM/SELECTED_TEAMS scope and populated data require live DB/UAT |
| Assignment Center | Assignment | Lead, Manager, Admin | `public/js/api.js`; `assignNewTask` | `/work/assign` | Native multi-job form/action with duplicate and scope checks | PARTIAL | build, typecheck | Batch writes are atomic; audit/activity are currently batch-level |
| People | People overview | Lead, Manager, Executive | `docs/executive-system-workflow-and-resources.md` | `/work/people` | Native workload/status/performance cards and tracker links | PARTIAL | build, typecheck | Historical performance and position joins require live data |
| Job Tracker and grouped jobs | Job Tracker | All permitted roles | `docs/legacy-system-audit.md`; `public/js/maxiwa.js` | `/work/tracker` | Native searchable grouped-job screen | PARTIAL | build, `work-domain.test.ts` | Timeline/audit drilldown and large-dataset pagination remain open |
| Reports / weighted SLA | Performance / reports | Manager, SrManager, Director, Executive | `public/js/api.js`; `summarizeTasks` and report selectors | `/work/reports` | Native status, overdue, due-soon and weighted summary | PARTIAL | `work-domain.test.ts`, build | Preserve source weights as imported facts, not browser authority |
| KPI catalog / Main KPI / Sub KPI | Admin Studio / KPI | Admin, KPI owners | `public/_worker.js`; KPI endpoints | `/admin`, `/work/kpi` | Native business-facing KPI read screen; catalog/admin UI pending | PARTIAL | build, typecheck | Versioned rules and four-eyes changes remain target authority |
| SLA deadline calculation | Task create/update | All roles | `public/_worker.js`; `addWorkingDays`, `businessDaysBetween` | Work domain service | Missing | PORT | Gate W-11 | Asia/Bangkok business dates; skip weekend and active holidays |
| Holiday calendar | Admin Studio | Admin | `public/_worker.js`; `saveHoliday`, `syncThaiHolidays` | `/admin` | Missing target feature | ADAPT | Gate W-12 | Duplicate dates rejected; company and Thai public holidays supported |
| Hold deadline extension | Task detail | All roles | `public/_worker.js`; `buildHoldStatusUpdate` | Work domain service | Missing | PORT | Gate W-13 | Extension calculated server-side and recorded |
| Audit timeline | Job Tracker / admin | Admin and permitted users | `audit_log` writes in `public/_worker.js` | Core audit/activity | Foundation plus native activity screen; full Job timeline pending | PARTIAL | `work-presentation.test.ts`, build | Never edit historical events |

`RETIRE` decisions: none at SP-0. Missing target screens are not evidence that source features should be retired.
