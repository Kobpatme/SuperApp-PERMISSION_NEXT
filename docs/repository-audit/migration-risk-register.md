# Migration risk register

| ID | Likelihood | Impact | Risk | Mitigation / exit criterion |
| --- | --- | --- | --- | --- |
| MR-001 | High | Critical | Production schemas/data differ from code assumptions | Read-only schema export and row/profile report before final mapping; no production write. |
| MR-002 | High | Critical | Same building appears under different names across Firestore/NAS/Guarantee/KPI | Canonical source map, normalized names/address, confidence score and `REVIEW_REQUIRED`; never low-confidence auto-merge. |
| MR-003 | High | High | Legacy guarantee statuses are inconsistent across parallel fields | Deterministic mapping table, anomaly queue and count/amount reconciliation per status. |
| MR-004 | High | Critical | Historic KPI meaning changes during event migration | Preserve legacy rows as `LEGACY_MANUAL`/`MIGRATED`; snapshot original weights and never fabricate system events. |
| MR-005 | Medium | Critical | Float/Number conversion changes financial totals | Import raw value, parse to Numeric with explicit scale, flag invalid values, compare totals before/after. |
| MR-006 | High | High | Attachments are inaccessible, duplicated or orphaned | Inventory URLs/NAS files, checksum where possible, preserve source key, test authorization and sample-open files. |
| MR-007 | Medium | Critical | User identity collisions across employee ID/email stores | Identity crosswalk with verified employee ID/email; manual review on ambiguity; preserve legacy IDs. |
| MR-008 | Medium | High | Cutover allows writes in both systems and causes divergence | Module-by-module freeze window, final delta import, reconciliation and explicit rollback decision. |
| MR-009 | Medium | High | Source rate limits/timeouts interrupt migration | Repeatable checkpointed imports, bounded batches, idempotency keys and run logs. |
| MR-010 | Medium | High | Audit/activity duplication during retries | Unique source-system/source-event keys and transactional outbox/consumer idempotency. |
| MR-011 | Medium | High | NAS adapter depends on Windows mapped drive/user ACL | Document service account/mapping, health checks and fallback/read-only policy; plan provider migration separately. |
| MR-012 | Medium | High | Unknown legal retention/compliance rules | Mark destructive retention/cutover blocked until policy owner answers OQ-003. |
| MR-013 | Low | High | Legacy compatibility code could be mistaken for a production integration | Primary routes are native and legacy routes return 404 in production; remove compatibility code after migration evidence is no longer needed. |
| MR-014 | Low | High | Timezone/date parsing shifts deadlines or periods | Standardize `Asia/Bangkok`, store timestamptz/date intentionally and run golden-master cases across UTC boundaries. |

## Mandatory reconciliation dimensions

- Row counts by source entity and active/terminal status.
- Guarantee monetary sums by deposit type, status, area and year.
- KPI task counts and weighted totals by user/team/period/status.
- Building counts, duplicate groups, missing names/coordinates and source mappings.
- Attachment counts, byte totals, missing objects and checksum mismatches.
- User/team/role crosswalk counts and unresolved identities.
