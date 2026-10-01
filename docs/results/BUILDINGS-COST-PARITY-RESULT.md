# Buildings / Cost / Quotation parity result — 2026-10-01

## Changes

- Restored the results list beside the map in the native Buildings workspace.
- Selecting a list row opens the existing detail drawer and updates the marker selection; marker selection continues to open the matching drawer.
- Added phone, email and coordinate copy actions with status feedback in the Building drawer.
- Expanded unit coverage for monthly and annual revenue-share classification: percentage, period and `%` unit remain explicit and these rates do not inflate monetary OPEX totals.

## Evidence

- Target HEAD before this slice: `ec778a41b63e0b55d811671d1d492d2df05044bd`.
- Approved source checkout: `Kobpatme/Permission_Next@afaee997afecf0f42e059b7100fa90ed0d188784`.
- Post-change: lint pass; typecheck pass; Vitest 35 files / 110 tests pass; document test 1/1 pass; Next.js 16.3.4 production build pass; `git diff --check` pass.
- `npm audit --omit=dev` reports one critical advisory in the existing Next.js dependency; npm reports no fix available for the locked version.
- No authenticated browser screenshots, production-scale search fixture or UAT were available in this pass.

## Parity status and open work

Status remains PARTIAL. A permissioned building editor, dynamic fee editor, cost provenance/default overrides, guided four-step quotation, server-side recalculation and stale protection, quote drafts/history and preview/export remain missing from the native route. Search results still use the configured bounded server page size and need large-catalog evidence.

## Security, risk and rollback

No schema, cost policy, rounding/tax rule, credentials, external services or production data changed. List and map use the same server-authorized set already passed to the screen. Roll back by reverting the Buildings workspace/CSS and test changes together.
