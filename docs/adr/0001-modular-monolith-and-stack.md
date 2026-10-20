# ADR-0001: Modular monolith and target stack

- Status: Accepted for foundation
- Date: 2026-09-04

## Context

The three systems use different static runtimes and two data platforms. The expected population is below 100 users, while transactions, authorization, audit and cross-module reporting require strong consistency. There is no evidence that independent scaling/deployment warrants microservices.

## Decision

Use a Next.js App Router modular monolith with TypeScript strict, PostgreSQL, Drizzle ORM, Zod validation and server-side application services. Supabase Auth/private Storage are acceptable adapters; the application remains Docker-compatible. Domain boundaries are enforced in code and schema. A transactional outbox is introduced when side effects leave the business transaction.

## Consequences

- One deploy and database simplify operations and transactions.
- Modules can later be extracted behind existing contracts if measured workload demands it.
- Legacy scripts cannot be copied wholesale; they become reference/golden-master inputs.
- PostgreSQL migration and source reconciliation become first-class work.

## Rejected alternatives

- Microservices now: operational cost without evidence.
- Three embedded applications: preserves duplicate identity/data/security boundaries and violates the product goal.
- Generic EAV/`records` table: weak integrity and poor reporting.
