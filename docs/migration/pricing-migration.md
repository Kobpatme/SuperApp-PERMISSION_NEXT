# Pricing migration plan

Status: prepared, not executed. Source pricing records and approved calculation rules are unavailable.

- Resolve each source building before importing estimates.
- Convert each historical edit into a sequential estimate version only where timestamps and authorship establish an order; otherwise preserve the raw record as an anomaly.
- Recalculate line/subtotal/tax/total with the approved rounding policy and compare to source values. Material differences require owner disposition.
- Capture the effective building-condition version and immutable snapshot for every new estimate version.
- Reconcile version counts, status counts and monetary totals before switching reads.
