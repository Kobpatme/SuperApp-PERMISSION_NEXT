# Development and operations documentation

Start with [current status](implementation-status.md), [open decisions](open-questions.md), [architecture](architecture/overview.md), and [release gates](operations/release-checklist.md). Read `AGENTS.md` and `CODEX-MASTER-PLAN-V2.md` before development.

## Architecture and domain contracts

- [Architecture decisions](adr/0003-current-runtime-and-rebuild.md), [data model](architecture/data-model.md), [module boundaries](architecture/module-boundaries.md), [event catalog](architecture/event-catalog.md).
- [Admin](modules/admin.md), [Work/KPI](modules/work/parity-2026-10-05.md), [Buildings](modules/buildings.md), [Guarantees](modules/guarantees.md), [Car booking specification](plans/car-booking-module-spec.md).
- [Source parity acceptance](modules/parity-gates.md), [technical debt](repository-audit/technical-debt-register.md), [migration risks](repository-audit/migration-risk-register.md). These registers describe source/target risks; verify current code before treating old entries as unresolved target defects.
- [Design system](product/design-system.md), [navigation model](product/information-architecture.md), [quality checks](quality/README.md).

## Deployment and maintenance

- [Deployment](operations/deployment-runbook.md), [on-premise hosting](operations/on-premise-deployment.md), [backup/restore](operations/backup-restore-runbook.md), [incident response](operations/incident-response.md).
- [Car database](operations/car-booking-database.md), [import](operations/car-booking-import.md), [OSP sync](operations/car-booking-osp.md), [cutover](operations/car-booking-cutover.md).
- [Single sessions and live refresh](operations/sync-session-health.md), [authorization bootstrap](operations/authorization-bootstrap.md), [repository policy](operations/repository-policy.md).

Completed plans and historical audit/result reports are retained locally and in Git history, not required by a new checkout. Source-parity contracts and original unresolved module specifications remain available for future development.
