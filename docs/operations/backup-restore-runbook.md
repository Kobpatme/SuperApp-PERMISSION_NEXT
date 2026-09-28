# Backup and restore runbook

- Encrypt backups, restrict access, define retention with the data owner and keep restore credentials separate from the application.
- Back up PostgreSQL plus attachment metadata; back up or version provider objects according to the selected NAS/SharePoint policy.
- Quarterly, restore into an isolated non-production environment and verify schema version, row counts, constraints, representative records, attachment checksums and login/RBAC behavior.
- Record RPO/RTO measurements and every discrepancy. A backup is not considered verified until a restore drill succeeds.
- Never overwrite production during a drill. Promotion of restored data requires a separate incident/change approval.

Current status: no production target or backup provider is configured, so no restore success is claimed.
