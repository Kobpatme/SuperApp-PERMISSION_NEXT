# Cross-module experience contract

- Building 360 joins modules only through the canonical Building UUID; display names are never join keys.
- Global search applies the same server-side permission and row-scope policy as the destination query before ranking results.
- Command palette entries require an action permission; hiding a command is convenience, while the server guard remains authoritative.
- Timeline order uses `(occurred_at desc, id)` cursor pagination so equal timestamps remain deterministic.
- Unified personal/team dashboards consume Activity/KPI facts and module query adapters; they do not scrape legacy pages or duplicate business calculations.
