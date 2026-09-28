# Guarantee migration plan

Status: prepared, not executed. The live Firestore export, Storage inventory and owner-approved status mapping are unavailable.

- Import building references only after canonical source mappings resolve.
- Convert monetary strings/numbers to `numeric(18,2)` and quarantine invalid, negative or over-refunded cases.
- Preserve every source status and log item in the raw import evidence; map only reviewed transitions into `guarantee_transitions`.
- Copy file bytes to the selected private provider, verify SHA-256 and count, then create attachment metadata. Legacy public URLs are not canonical evidence.
- Reconcile cases, deposits, refund requests, refunds, status totals and money totals before parallel read and cutover.
