# ADR-0003: Current local identity and incremental professional rebuild

- Status: Accepted; records existing implementation, not an infrastructure rollout
- Date: 2026-09-28
- Supersedes: hosted identity/storage assumptions in ADR-0001, ARCHITECTURE-BASELINE and old bootstrap instructions

The runtime is a TypeScript strict Next.js modular monolith with PostgreSQL/Drizzle. Migration 0011 and `auth.ts` implement Argon2id credentials and opaque sessions. Private local/NAS storage remains current. Microsoft 365 readiness is optional. ADR-0002's server-side capability and data-scope boundary remains authoritative.

Native routes are production surfaces. Legacy compatibility handlers reject production requests. Domain migration and infrastructure validation remain separate from UI completion.

Use `PERMISSION_NEXT_PROFESSIONAL_REBUILD.md` as master; the user confirmed this supplied file in place of the unavailable V2 filename. Refactor incrementally, preserving canonical IDs, numeric rules, workflow evidence and audit history. No production migration or deployment is authorized by this ADR.

Hierarchy: README -> architecture overview -> accepted ADRs -> module/product/operations documentation. Older plans are historical when they conflict with verified source.
