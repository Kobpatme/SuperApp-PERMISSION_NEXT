# Work and KPI module

Status: Current repository implementation; production data population remains pending.

The default view is My Work. Team and due/overdue views use the same permission-scoped read model. Activity requires `activity.event.read`. KPI requires `kpi.score.read` and shows stored snapshots plus source fact, activity ID, rule version and calculation version. It never asks users to duplicate activity as KPI input.

Server queries restrict owner/team scope before limiting results and re-check row authorization before returning view models. Mutations remain in domain services with transition validation, optimistic concurrency, audit, activity and outbox writes.

Limits: task view returns the 250 most recently updated visible tasks; activity 80 events; KPI 24 snapshots and 50 facts. Cursor pagination, approved live rules, production history, full report exports and browser performance validation remain planned.
