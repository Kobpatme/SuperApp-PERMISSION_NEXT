# Guarantee / Deposit parity audit

## Evidence freeze

- Target: `codex/professional-workspace` at `ec778a41b63e0b55d811671d1d492d2df05044bd` before this recovery slice.
- Approved source: `Kobpatme/maxiwa@94742a4` (short SHA from the master plan). The object is absent from the local source repository; `git cat-file -t 94742a4` fails. GitHub page retrieval and `git ls-remote` were unavailable in this environment.
- Provisional source: `_discovery_sources/maxiwa` at `471f2b6a20361f9114372c2493400c62d3ccf19c`. This is not claimed equivalent to the approved SHA.
- Source evidence inspected: `index.html`, `firebase-client.js`, `firebase-config.js`, `deliverables/*`; inventory is detailed in `docs/modules/guarantees/source-parity.md` and `source-ux-baseline.md`.
- Target evidence inspected: `/guarantees`, `/guarantees/[id]`, `deposit-workspace.tsx`, `deposit-editor.tsx`, `deposit-tl-workspace.tsx`, `deposit-v2-domain.ts`, `deposit-v2-workflow.ts`, `deposit-v2-server.ts`, `guarantee-view-model.ts`, capabilities and existing unit tests.

## Parity matrix

| Source feature | Source screen / evidence | SuperApp target | Current state | Decision | Evidence / remaining work |
|---|---|---|---|---|---|
| My Dashboard | Sidebar and dashboard sections in provisional `index.html` | `/guarantees` workspace | PARTIAL | ADAPT | Workspace defaults to Smart Queue; no distinct personal dashboard screen. Approved-source SHA reconciliation remains blocked. |
| Smart Queue reasons and next action | TL/workflow pages and `getWorkflowStatusKey` in source | `getSmartWorkQueue`, queue view | PARTIAL | ADAPT | Reasons include due date, age, missing evidence, outstanding value and consistency; validate owner/assignee context and actions against approved source. |
| Executive Dashboard | Executive Dashboard in provisional `index.html` | Analytics view + `guarantee-view-model.ts` | PARTIAL | ADAPT | Financial aggregates and pending breakdown exist; source parity, drill-down, and exact refund semantics need review. |
| Main register | Deposit list, search/filter/export in `index.html` | Workspace list | PARTIAL | ADAPT | Search, owner/area/status, sort, paging, CID copy and CSV exist; current read model caps at 500 and table lacks some financial columns. |
| On Service | Dedicated removal-deposit page and Off Service action | `on_service` view and workflow commands | PARTIAL | ADAPT | Dedicated view now summarizes exposure and lists owner, building, activity age, Off Service state and next step; verify separate refund outcomes and source behavior. |
| Completed / history | Completed page and refund outcome | `done` view and detail | PARTIAL | ADAPT | Search/export/detail exist; date filtering and completion/refund summaries need parity work. |
| TL workspace | TL assigned work, evidence, notes, completion | Assigned-case route and `DepositTlWorkspace` | PARTIAL | ADAPT | Server assignment scope and transitions exist; verify mobile workflow and Off Service handoff. |
| Detail / editor | Six-step workflow, finance, files and history | Detail route, `DepositEditor`, workflow command | PARTIAL | ADAPT | Grouped fields, secure evidence, history and validated transition commands exist; reconcile missing evidence labels and all financial fields. |
| Role-aware navigation and notifications | Source sidebar, TL role, notification inbox | Global module nav, query-based team view, notification helpers | PARTIAL | ADAPT | Separate workflow destinations/local IA are incomplete; notification persistence/actionability is partial. |
| Refund and outstanding semantics | Installation/removal return paths and closure rules | Domain helpers and analytics | PARTIAL | KEEP | Existing exact workflow/domain tests are present; do not change financial policy without approved source/owner evidence. |

## Risks and decisions

- No `RETIRE` decision is made. Firebase/browser authorization is replaced by SuperApp server authorization, audited commands and private attachment access while preserving user workflows.
- No production database or external service was accessed or modified.
- Before claiming complete Guarantee parity, obtain/verify the approved `94742a4` source and reconcile every provisional behavior against it.
- Safe implementation can proceed on target gaps explicitly required by the user, while status remains PARTIAL until source confirmation and behavior tests are complete.

## Prioritized implementation gaps

1. Add an explicit personal operational dashboard distinct from the queue.
2. Complete first-class On Service and completed/history contexts.
3. Reconcile dashboard financial metrics, drill-down and refund outcomes.
4. Complete source-compatible TL handoff and mobile evidence flow.
5. Restore local navigation and role-specific destinations without changing server authorization.
6. Expand register details and verify high-volume server-side paging/export.

## Implementation checkpoint (2026-10-01)

The personal dashboard slice is implemented in `DepositWorkspace`: it identifies rows by server-provided owner/assignee IDs, summarizes operational queues and outstanding value, and links to case detail. A dedicated On Service view summarizes outstanding removal deposits and surfaces owner, building, activity age and Off Service next step. A unit test verifies owner/assignee inclusion and unrelated-user exclusion. The module remains PARTIAL because source SHA reconciliation, persisted activity history, role-matrix verification, executive drill-down, date filtering and complete TL/mobile evidence flow are still open.
