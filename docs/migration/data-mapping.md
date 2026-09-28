# Initial data mapping

| Legacy | Target | Rule |
| --- | --- | --- |
| KPI `users` + Guarantee `users` + Permission auth array | Core User/Profile + identity source map | Match verified employee ID/email; ambiguous matches require review; never migrate plaintext passwords. |
| KPI `teams` and user team text | Team/UserTeam | Normalize catalog first, retain original team text and source ID. |
| Permission building docs | Building + aliases/source map + contacts + condition versions | Separate stable master fields from versioned operational/cost conditions. |
| Guarantee `place` | `guarantee_cases.building_id` | Match code, normalized Thai/English name, address/context in priority order; low confidence is `REVIEW_REQUIRED`. |
| KPI job/building metadata | Project/Task and optional Building relation | Preserve job text and SSR reference; only set building FK on confident mapping. |
| KPI task rows | Task + migrated Activity/legacy KPI provenance | Keep task lifecycle; mark historical origin `MIGRATED`/`LEGACY_MANUAL`; do not invent system-generated events. |
| KPI weights and calculations | Legacy KPI snapshot/reconciliation tables | Preserve raw/effective weights for historical reports; new KPI facts use versioned rules. |
| Guarantee case money | GuaranteeCase + deposits/refund requests/refunds | Parse to Numeric; keep raw value; split only where source fields prove meaning. |
| Guarantee compact statuses | Guarantee transition state | Use an approved deterministic table; anomaly queue for conflicting fields. |
| Guarantee embedded `log` | Imported activity/audit record | Preserve raw log and provenance; classify only deterministic entries. |
| Firebase URLs / NAS paths | Attachment + provider storage key | Do not store permanent public URL as canonical; inventory/checksum and authorize access. |
| Permission calculation/BOQ fields | Building condition version / calculation policy version | Preserve raw nested JSON during staging, map reportable values relationally and golden-master calculations. |

Every import writes `source_system`, `source_id`, `import_run_id`, raw payload/hash and canonical ID mapping. Re-running the same import must update the staging result without duplicating canonical rows.
