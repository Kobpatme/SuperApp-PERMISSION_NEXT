# Incident response

1. Declare severity and incident lead; preserve request IDs, audit/activity evidence and deployment version.
2. Contain access or pause the affected worker/module without deleting evidence.
3. Rotate a credential only through the owning secret manager; never paste it into tickets or logs.
4. Use the deployment/cutover rollback path if its decision window and data consistency conditions remain valid.
5. Reconcile business state, outbox, KPI facts, automation effects and attachments before reopening writes.
6. Document timeline, scope, user impact, root cause, corrective actions and owner. Security incidents require the company escalation path.
