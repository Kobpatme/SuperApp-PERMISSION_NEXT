# ADR-0002: One identity, server authorization and explicit data scope

- Status: Accepted for foundation
- Date: 2026-09-04

## Context

Every legacy application has a separate identity model. Two validate credentials/roles in browser code, and the KPI Worker accepts requests without a mandatory verified session. This cannot protect financial, KPI or cross-team data.

## Decision

Core Identity owns one authenticated user, profile, team membership and role/permission graph. Every command/query evaluates `module.resource.action` plus `OWN`, `TEAM`, `SELECTED_TEAMS` or `ALL` at the server boundary. PostgreSQL RLS is defense in depth and receives a verified request context; no browser role, query parameter, iframe message or custom actor header is trusted. Privilege changes and denied sensitive actions are audited.

## Consequences

- Legacy credentials are imported only through an approved migration/activation flow; plaintext passwords are never copied to the target.
- Module-specific role labels may remain in UI, but map to central permissions.
- RLS policy tests and IDOR tests are required before a module cutover.
- The current iframe session bridge is temporary and not accepted as authorization.
