# Guarantees

Status: current native workflow with production-data verification still required.

`/guarantees` opens on the scoped work queue so staff see actions, missing evidence and follow-up items before the full register. The register, On Service cases and completed work retain their source terminology and workflow rules. Financial analytics are a secondary view.

The executive financial view uses `buildGuaranteeManagementReport` and the same installation/removal refund, On Service and outstanding helpers as the register. Cancelled money is excluded; returned removal deposits follow `demoReturn`, and On Service outstanding deposits remain visible. Its 12-month registration chart uses the server query timestamp and request dates; it does not claim to represent bank cash flow. Area and owner filters apply to all report sections. Missing due dates are exposed as incomplete risk coverage rather than zero risk. The report has an accessible monthly data table, links to authorized case details and an A4 landscape print stylesheet.

All reads are constrained by the server access context and rechecked per row. Assigned TL access stays limited to explicitly assigned cases. Create, update, transition and evidence actions remain server-authorized and audited as documented in `docs/migration/guarantee-v2-integration.md`.

The current register is bounded to the latest 500 authorized cases. Server pagination and server filtering are planned before data volume exceeds that bound. Production readiness also requires approved legacy-status mapping, financial reconciliation and private evidence-storage configuration.
