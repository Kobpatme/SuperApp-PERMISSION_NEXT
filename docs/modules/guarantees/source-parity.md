# Guarantees source parity

Status: SP-0 provisional freeze, 2026-09-29. The master plan names `Kobpatme/maxiwa@94742a4` as the approved baseline, but that object is not present in the local source checkout and Git transport could not fetch it because of a local credential error. The inspectable committed source is `main@471f2b6a20361f9114372c2493400c62d3ccf19c`; no equivalence to the approved baseline is claimed.

Inspectable evidence in the current checkout is concentrated in `index.html`, `firebase-client.js`, `firebase-config.js` and `cors.json`. Earlier references to `domain-logic.js`, `firestore.rules` and `scripts/domain-logic.test.mjs` are not files in this checkout and have been removed from the evidence claim.

| Source feature | Source screen | Source role/use case | Source file/function | SuperApp target | Current status | Decision | Test evidence | Notes |
|---|---|---|---|---|---|---|---|---|
| My Dashboard | Dashboard | User, admin | `index.html` dashboard sections and renderers | Guarantees dashboard/workspace | Native operational surface exists | ADAPT | `deposit-v2-domain.test.ts` | Reconcile each metric against verified baseline |
| Executive Dashboard | Dashboard | Admin/executive | `index.html` executive dashboard section | Guarantee dashboard | Partial | PORT | Gate G-01 | Scoped metrics and analytics |
| List, filters, multi-status, CSV | Deposit list | User, TL, admin | `index.html` list filters, sorting and export handlers | Guarantees list/view models | Partial | ADAPT | Gate G-02 | Server-side scope and export |
| Smart Queue | TL workspace | TL | `index.html` TL page, filters and task renderers | `deposit-tl-workspace.tsx` | Partial | ADAPT | Gate G-03 | Pending/actionable rules remain source-compatible |
| TL accept/return/complete | TL workflow | TL | `index.html` step 4/5 handlers and send-back action | `deposit-v2-workflow.ts`, actions | Foundation exists | KEEP | Existing workflow tests + Gate G-04 | Capability + assigned-case scope |
| Building Dept/User inspection | Refund workflow | Building Dept, user | `index.html` step 6 inspection fields/actions | Guarantee workflow/actions | Partial | PORT | Gate G-05 | Closing evidence required |
| Installation deposit refund | Financial dashboard/workflow | Authorized finance/user | `index.html` financial fields and submit checks | `deposit-v2-domain.ts` | Latest closure rule already present | KEEP | Protect `isInstallationRefunded()` with golden test | `depReturn=Yes` before done is not refunded |
| Removal deposit/refund | On/Off Service | User/TL/admin | `index.html` `isOnServiceItem`, active service page and save handler | Guarantee domain/workflow | Partial | ADAPT | Gate G-06 | Independent from installation refund |
| On Service holding state | Active removal | User/admin | `index.html` `getWorkflowStatusKey` and active-demo page | Guarantee view model | Rule exists in target | KEEP | Add actionable backlog test | Not normal actionable queue until request/pending exists |
| Off Service pending / cancellation | Active removal | User/TL/admin | `index.html` status options and action handlers | Guarantee workflow | Partial | PORT | Gate G-07 | Preserve service-cancellation path |
| Missing evidence / closing | Case detail | User/TL/admin | `index.html` step 3/5/6 evidence checks and file rendering | Evidence/workflow services | Partial | ADAPT | Gate G-08 | Secure private attachments |
| Recipient-specific notifications | Notification area | User/TL/admin | `index.html` notification inbox, badge and render functions | Core Notification Center | Derived list only/partial | PORT | Gate G-09 | Event -> rule -> recipient -> record -> inbox |
| User/admin management | Admin | Admin | `index.html`; user handlers | Core Admin Console | Core UI exists; mapping incomplete | ADAPT | Admin/access tests | Human-readable permissions and scopes |
| Area/owner/non-refundable analytics | Dashboards | TL/admin/executive | `domain-logic.js`, dashboard selectors | Guarantee read models | Partial | PORT | Gate G-10 | Verify totals and filters |

`RETIRE` decisions: none at SP-0. Browser Firebase auth/storage rules are not ported as architecture; they are replaced by SuperApp sessions, server RBAC, audit and private attachment access while preserving the workflow capability.
