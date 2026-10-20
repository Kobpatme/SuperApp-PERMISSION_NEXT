# Legacy work-entry migration plan

Status: prepared, not executed. Production source export and owner-approved field mapping are unavailable.

## Mapping

- A legacy work record becomes either a `task` plus immutable `task_transition` history, or a `manual_work_entry` when no system-owned workflow can be proven.
- Each accepted source record emits one `work.manual_entry.recorded.v1` or task lifecycle activity event.
- Source repository, source record ID and raw checksum form the import idempotency key.
- Employee IDs must resolve to a verified Profile mapping; building text must resolve through `building_source_mappings`. Unresolved rows go to an anomaly queue and are not silently assigned.

## Reconciliation gates

Compare source count, imported count, rejected/anomaly count, per-employee totals, per-period totals and duplicate keys. Owners must sign off before read traffic moves to the new module. No source data is deleted by this migration.
