# Source parity gates

Fresh baseline date: 2026-09-29. Source SHAs are immutable evidence inputs:

- Work/KPI: `Kobpatme/maxiwa_KPI@4f5fa99b05f8dbfea9304d47560aec3d48746908`
- Buildings: `Kobpatme/Permission_Next@afaee997afecf0f42e059b7100fa90ed0d188784`
- Guarantees approved baseline: `Kobpatme/maxiwa@94742a4` (unresolved in local checkout; see `modules/guarantees/source-ux-baseline.md`)
- Guarantees provisional source evidence: `Kobpatme/maxiwa@471f2b6a20361f9114372c2493400c62d3ccf19c`
- Target audit snapshot: current target branch `codex/professional-workspace@3d8d281`; the older audit references `4080160` and `6ccef5b` are stale for this checkout.

## Classification policy

`KEEP` preserves source behavior already implemented safely. `PORT` brings over a missing use case. `ADAPT` preserves behavior while changing architecture or data contracts. `REPLACE` substitutes an unsafe source implementation with a safer equivalent. `RETIRE` is allowed only with an explicit reason, replacement, and impact statement. Missing target implementation is never a retirement reason.

## SP-1 Work/KPI acceptance gates

| Gate | Required deterministic evidence |
|---|---|
| W-01 lifecycle | Pending -> accept, On Process, On Hold -> resume, Completed, Cancelled, invalid transitions rejected |
| W-02 create/update | Personal create, assignment, detail edit and note-only update are server-authorized, idempotent and audited |
| W-03 SLA | Weekend exclusion, active holiday exclusion, crossing-day deadline and hold extension match source fixtures |
| W-04 KPI | Main/Sub KPI mapping, target, weighted score and SLA status use exact stored/versioned values |
| W-05 grouping | One job with multiple tasks renders a grouped timeline and audit history without deduplicating valid tasks |
| W-06 roles | Staff/Lead/Manager/SrManager/Director/Executive/Admin use cases map to capabilities and scopes, not client role flags |
| W-07 UI | `/work`, mine, team, assign, people, tracker, reports and KPI screens expose effective actions and next state |

## SP-2 Buildings acceptance gates

| Gate | Required deterministic evidence |
|---|---|
| B-01 CRUD | Add/edit/contact/coordinate/condition/remark actions validate, authorize and audit |
| B-02 duplicates | Thai/English normalized names and exact coordinates produce reviewable candidates before create |
| B-03 lifecycle | Archive/merge/alias preserves references and audit; no normal hard delete |
| B-04 BOQ | Fixed/variable fees and CAPEX/OPEX/DEPOSIT classifications match source cases |
| B-05 quotation | Customer/floor/distance/BOQ/revenue-share calculation, draft/version/submit/approval/export/copy summary match golden cases |
| B-06 documents | Private upload/preview/download, 100 MB limit, no overwrite and per-account permission are enforced server-side |

## SP-3 Guarantees acceptance gates

| Gate | Required deterministic evidence |
|---|---|
| G-01 finance | Installation refund counts only when `done` or `status_final=done`; early `depReturn` does not count |
| G-02 service | On Service is holding state; Off Service/service cancellation pending is actionable |
| G-03 workflow | TL accept/return/complete, inspections, cancellation, closure evidence and Done reconcile with source |
| G-04 notifications | Domain event resolves recipients and creates durable read/unread notification with deep link |
| G-05 analytics | Dashboard totals, area/owner/non-refundable/missing-evidence metrics and CSV reconcile |

## Common release gate

No module is declared migrated until its matrix is reviewed, relevant gates pass, native UI is usable, server authorization and audit are verified, and UAT evidence is recorded. Run targeted tests first, then `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:documents`, and `npm run build`.
