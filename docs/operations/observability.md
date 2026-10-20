# Observability and service objectives

Correlate HTTP request ID, activity correlation ID, outbox message, KPI calculation run and automation execution. Logs are structured and redact credentials/tokens.

Initial alert candidates:

- authentication/authorization denial anomaly and repeated privileged failures;
- HTTP 5xx rate and p95 latency by route;
- database connection saturation and slow queries;
- outbox oldest-unpublished age;
- KPI run failures/replay conflicts;
- automation retry/dead-letter count;
- attachment checksum/provider failures;
- migration reconciliation imbalance.

Initial internal targets pending measured baseline: interactive command acknowledgement within 100–200 ms, paginated list responses p95 below 500 ms on the company network, and zero unaudited material mutations. Recalibrate only from production-like load evidence.
