# Target conceptual data model

This began as the Phase 0 conceptual model. Additive repository DDL now exists in `supabase/migrations/0002_platform_foundation.sql` through `0008_migration_control.sql`. Those migrations are not certified for production until schema profiling and a production-like dry run are complete.

## Core identity and scope

- `users`, `profiles`
- `teams`, `user_teams`
- `roles`, `permissions`, `user_roles`, `role_permissions`
- scoped grants supporting `OWN`, `TEAM`, `SELECTED_TEAMS`, `ALL`

Permissions use `module.resource.action`; grants are evaluated server-side against resource ownership/team context. User-provided metadata is never authorization evidence.

## Shared masters

- `buildings`, `building_aliases`, `building_source_mappings`, `building_contacts`
- `building_condition_versions`
- optional `projects`, `tasks`, `assignments` only where discovery data proves a shared work context

Canonical IDs are UUIDs. Legacy numeric/string IDs remain unique per `source_system` in mapping tables.

## Events and audit

- `activity_events`: immutable business facts with event type/version, actor, owner, team, entity, building/project, occurrence time, source, correlation and typed metadata.
- `activity_event_corrections`: or a linked reversal event; originals are never silently edited.
- `audit_logs`: append-oriented before/after/material security records with request ID.
- `outbox_messages`: transactional delivery boundary with unique idempotency key.

## KPI

- `kpi_metrics`, `kpi_rule_versions`, conditions/scopes, targets and periods.
- `kpi_facts` uniquely tied to source event + rule version + calculation version.
- `kpi_scores`/snapshots as reproducible aggregates.
- `kpi_adjustments` and approvals with reason, requester, approver, old/new value and effective period.
- `kpi_calculation_runs` with counts, version, errors and trace IDs.

## Guarantee

- `guarantee_cases`, `guarantee_deposits`, `guarantee_refund_requests`, `guarantee_refunds`, `guarantee_transitions`.
- Monetary columns use Numeric and checks prevent negative values or refund totals above policy limits.
- Material rows are not hard-deleted; cancellation/void/reversal preserves history.

## Pricing

- `building_cost_condition_versions`
- `price_estimates`, immutable `price_estimate_versions`, `price_estimate_items`
- `price_approvals` and immutable building-condition snapshots.

## Shared services

- `attachments` plus ownership links and provider-specific storage keys.
- `notifications`, delivery attempts and preferences.
- `automation_rules`, executions and action results.
- `source_import_runs`, row mappings, anomalies and reconciliation summaries.

## Required constraints

Foreign keys, unique source mappings, typed status/check constraints, timestamptz for instants, dates for business dates, optimistic version columns where concurrent edit is possible and indexes derived from verified queries. JSON is limited to event/provider metadata and legacy raw payload preservation; reportable canonical values use relational columns.
