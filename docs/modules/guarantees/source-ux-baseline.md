# Guarantees source UX baseline

Status: SP-0 fresh source freeze, 2026-09-29. The approved SHA cannot be resolved in the local checkout; this baseline uses the committed current source checkout as provisional evidence and records the limitation explicitly.

## Evidence

- Repository: `Kobpatme/maxiwa`
- Approved baseline from the master plan: `94742a4` (not present in local object database)
- Local source checkout: `main` at `471f2b6a20361f9114372c2493400c62d3ccf19c`
- Fetching the missing object was attempted but Git transport failed with a local credential error; no equivalence is claimed.
- Inspectable evidence: `index.html`, `firebase-client.js`, `firebase-config.js`, `cors.json`

## UX inventory from the inspectable checkout

| Question | Source behavior to preserve | Evidence |
|---|---|---|
| Entry/default landing | Deposit workspace exposes My Dashboard, Executive Dashboard, deposit list, On Service, completed work, TL work and Admin users according to role. | `index.html` navigation around the sidebar and page sections |
| Primary actions | Create/edit a deposit case, move it through the six-step workflow, attach evidence, process TL work, inspect/accept/return work and close the case. | `index.html` form steps and workflow handlers |
| Common click paths | List/search/filter → open detail/form → progress through general, finance, evidence, TL, return and closure steps → save/audit → return to the relevant queue. | `index.html` `STEPS`, `goToStep`, `submitForm`, TL and close handlers |
| Search/filter | Search by building/customer/owner, filter by workflow status, owner and area, sort by case number and export CSV. | `index.html` list filters and export controls |
| Detail interaction | A modal/wizard keeps the workflow context; detail views show files, progress and activity log. | `index.html` `renderJobFilesHTML`, `renderWFProgress`, `renderActivityLog` |
| States visible to users | New, finance, attachments, TL wait/process, user inspection, close evidence, refund process, done, On Service and cancelled. | `index.html` status options and `getWorkflowStatusKey` |
| Success/error/empty behavior | Explicit empty list/notification states, toast feedback, required evidence checks and send-back-to-TL action. | `index.html` list, notification and submit handlers |
| Dashboard model | Personal and executive dashboard views show refund/outstanding metrics, area breakdown and operational summaries. | `index.html` My Dashboard and Executive Dashboard sections |
| Notifications | Notification inbox/badge is part of the shell; workflow changes create actionable notifications in the source model. | `index.html` notification controls and render functions |
| Keyboard/mobile | Source is responsive and modal-based; target must preserve focusable workflow controls while replacing client-side Firebase authority with server authorization. | `index.html`, `firebase-client.js` |

## Workflow and financial implications

- The six-step sequence is a user mental model, not merely a status list.
- On Service is a holding/backlog view derived from completed closure plus an outstanding demolition deposit; it must not be collapsed into ordinary completed work.
- Installation and demolition/removal refund paths are distinct and require evidence before closure.
- Target monetary values must remain typed numeric/Decimal and must not infer tax, fee or refund policy where owner evidence is unavailable.

## Evidence limitation and next action

The missing approved object blocks a definitive baseline-to-current diff for Guarantees. Before declaring this module source parity complete, obtain a verified checkout or owner-provided immutable export for `94742a4`, rerun the source inventory and reconcile any behavior differences against this provisional freeze.

## Target parity rule

Keep Guarantees as a workflow/TL/refund/financial workspace. Do not flatten it into a generic CRUD list. Replace Firebase auth/storage and browser mutation authority with SuperApp session/RBAC, transactional audit/activity/outbox and private attachment access.
