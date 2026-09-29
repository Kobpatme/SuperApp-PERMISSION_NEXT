# Work and KPI module

Status: Current repository implementation; source parity recovery is in progress and production data population remains pending.

The default view is My Work. Team and due/overdue views use the same permission-scoped read model. Native route aliases are available for `/work/mine`, `/work/team`, `/work/assign`, `/work/people`, `/work/tracker`, `/work/reports` and `/work/kpi`; their source-complete workflows remain gated by the parity matrix. Personal task creation uses a server action and atomic task/audit/activity/outbox write. Activity requires `activity.event.read`. KPI requires `kpi.score.read` and shows stored snapshots plus source fact, activity ID, rule version and calculation version. It never asks users to duplicate activity as KPI input.

Server queries restrict owner/team scope before limiting results and re-check row authorization before returning view models. Mutations remain in domain services with transition validation, optimistic concurrency, audit, activity and outbox writes.

Limits: task view returns the 250 most recently updated visible tasks; activity 80 events; KPI 24 snapshots and 50 facts. Cursor pagination, source task-field import, assignment/detail/note workflows, approved live rules, production history, full report exports and browser performance validation remain planned.
