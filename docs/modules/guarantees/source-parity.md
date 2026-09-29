# Guarantees source parity

Status: SP-0 fresh-source reconciliation, 2026-09-29. Authoritative source is `Kobpatme/maxiwa` at `94742a4b8cb10a4f39b87b257e9ca548ef7ef1e6`; source evidence includes `index.html`, `domain-logic.js`, `docs/system-baseline.md`, `firestore.rules`, and `scripts/domain-logic.test.mjs`. The working checkout has unrelated uncommitted changes; this matrix uses the committed baseline only.

| Source feature | Source screen | Source role/use case | Source file/function | SuperApp target | Current status | Decision | Test evidence | Notes |
|---|---|---|---|---|---|---|---|---|
| My Dashboard | Dashboard | User, admin | `index.html`, `domain-logic.js` | Guarantees dashboard/workspace | Native operational surface exists | ADAPT | `deposit-v2-domain.test.ts` | Reconcile each metric against baseline |
| Executive Dashboard | Dashboard | Admin/executive | `index.html`; executive selectors | Guarantee dashboard | Partial | PORT | Gate G-01 | Scoped metrics and analytics |
| List, filters, multi-status, CSV | Deposit list | User, TL, admin | `index.html`; filter/export handlers | Guarantees list/view models | Partial | ADAPT | Gate G-02 | Server-side scope and export |
| Smart Queue | TL workspace | TL | `index.html`; TL queue logic | `deposit-tl-workspace.tsx` | Partial | ADAPT | Gate G-03 | Pending/actionable rules remain source-compatible |
| TL accept/return/complete | TL workflow | TL | `domain-logic.js`, `index.html` | `deposit-v2-workflow.ts`, actions | Foundation exists | KEEP | Existing workflow tests + Gate G-04 | Capability + assigned-case scope |
| Building Dept/User inspection | Refund workflow | Building Dept, user | `index.html`; inspection fields/actions | Guarantee workflow/actions | Partial | PORT | Gate G-05 | Closing evidence required |
| Installation deposit refund | Financial dashboard/workflow | Authorized finance/user | `domain-logic.js`; refund predicates | `deposit-v2-domain.ts` | Latest closure rule already present | KEEP | Protect `isInstallationRefunded()` with golden test | `depReturn=Yes` before done is not refunded |
| Removal deposit/refund | On/Off Service | User/TL/admin | `domain-logic.js`, `index.html` | Guarantee domain/workflow | Partial | ADAPT | Gate G-06 | Independent from installation refund |
| On Service holding state | Active removal | User/admin | `domain-logic.js`; backlog selectors | Guarantee view model | Rule exists in target | KEEP | Add actionable backlog test | Not normal actionable queue until request/pending exists |
| Off Service pending / cancellation | Active removal | User/TL/admin | `index.html`; status actions | Guarantee workflow | Partial | PORT | Gate G-07 | Preserve service-cancellation path |
| Missing evidence / closing | Case detail | User/TL/admin | `index.html`, `domain-logic.js` | Evidence/workflow services | Partial | ADAPT | Gate G-08 | Secure private attachments |
| Recipient-specific notifications | Notification area | User/TL/admin | `domain-logic.js`; `getActionNotifications` | Core Notification Center | Derived list only/partial | PORT | Gate G-09 | Event -> rule -> recipient -> record -> inbox |
| User/admin management | Admin | Admin | `index.html`; user handlers | Core Admin Console | Core UI exists; mapping incomplete | ADAPT | Admin/access tests | Human-readable permissions and scopes |
| Area/owner/non-refundable analytics | Dashboards | TL/admin/executive | `domain-logic.js`, dashboard selectors | Guarantee read models | Partial | PORT | Gate G-10 | Verify totals and filters |

`RETIRE` decisions: none at SP-0. Browser Firebase auth/storage rules are not ported as architecture; they are replaced by SuperApp sessions, server RBAC, audit and private attachment access while preserving the workflow capability.
