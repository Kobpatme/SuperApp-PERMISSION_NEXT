# Migration and cutover runbook

No cutover may start until production exports, schema/rules, owner mappings, backup evidence and a maintenance window are approved.

1. Freeze the scoped legacy writes or enable a measured delta capture.
2. Snapshot/export the source and record immutable checksum, counts and timestamp.
3. Run a dry import into staging; never write unresolved identities/buildings into canonical rows.
4. Reconcile row counts, status distributions, money totals, file counts/checksums and representative samples.
5. Obtain domain-owner and security sign-off; record it in the import run.
6. Import canonical data idempotently and repeat reconciliation.
7. Run parallel reads and compare outputs for the approved period.
8. Switch one module at a time with monitoring and a documented rollback decision window.
9. Keep source data read-only through the retention window. Destruction requires a separate approved retention action.

Rollback means routing reads/writes back to the frozen legacy module, preserving the new database and evidence for diagnosis, and marking the import run `rolled_back`. It never means deleting source or audit records.
