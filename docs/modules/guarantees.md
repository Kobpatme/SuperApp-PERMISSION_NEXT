# Guarantees

Status: current native workflow with production-data verification still required.

`/guarantees` opens on the scoped work queue so staff see actions, missing evidence and follow-up items before the full register. The register, On Service cases and completed work retain their source terminology and workflow rules. Financial analytics are a secondary view.

The executive financial view is built by `buildGuaranteeExecutiveView`. It preserves the existing installation/removal deposit, refund, fee, area and outstanding-case formulas while moving calculation out of React rendering. Its 12-month window uses the server query timestamp, so the same data and timestamp always produce the same result.

All reads are constrained by the server access context and rechecked per row. Assigned TL access stays limited to explicitly assigned cases. Create, update, transition and evidence actions remain server-authorized and audited as documented in `docs/migration/guarantee-v2-integration.md`.

The current register is bounded to the latest 500 authorized cases. Server pagination and server filtering are planned before data volume exceeds that bound. Production readiness also requires approved legacy-status mapping, financial reconciliation and private evidence-storage configuration.
