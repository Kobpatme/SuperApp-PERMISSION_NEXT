# Guarantee parity result — 2026-10-01

## Changes

- Added a personal operations landing view with due/overdue, missing-evidence, TL, refund, On Service, outstanding balance, actionable notices, recent completed cases and recent record updates.
- Added a separate On Service view with removal-deposit exposure, Off Service pending count, building, owner, activity age, next-step label and case link.
- Personal view is filtered using server-provided owner and TL assignee IDs, after the existing server authorization scope has loaded case rows.
- Show the installation-team shortcut only when the server-derived grants support TL work or team case management.
- Added a selector unit test for owned, assigned and unrelated records.

## Evidence

- Target HEAD before this slice: `ec778a41b63e0b55d811671d1d492d2df05044bd`.
- Provisional source checkout: `Kobpatme/maxiwa@471f2b6a20361f9114372c2493400c62d3ccf19c`.
- Approved source SHA `94742a4` is absent locally; no baseline equivalence is claimed.
- After implementation: lint pass; typecheck pass; Vitest 35 files / 109 tests pass; document test 1/1 pass; build pass; `git diff --check` pass.
- `npm audit --omit=dev` reports one critical advisory in the existing Next.js dependency; npm reports no fix available for the locked version.
- JEV health passed. Route confidence was low and the evidence check requested more evidence; prioritization was advisory. A JEV risk call for a contemplated financial formula port hit its human-approval hard gate and did not run; no formula or pricing policy was changed. `jev_continue` recommended gathering more evidence; this advisory did not supersede deterministic review.

## Parity status and open work

Status remains PARTIAL. Approved-source reconciliation, persistent recent activity, full detail hierarchy, expanded register fields, completed-date filtering, executive drill-down, all role-specific local navigation and mobile TL evidence/handoff still require implementation and verification. No business refund policy was changed.

## Security, risk and rollback

No schema, credentials, external systems or production data changed. The dashboard only filters data already returned under server-side access control; the personal selector is not an authorization boundary. Roll back by reverting the dashboard UI, selector helper/test and grant-derived shortcut as one code change.
