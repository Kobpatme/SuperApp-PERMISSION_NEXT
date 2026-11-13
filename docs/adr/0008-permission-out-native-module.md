# ADR: Native Permission Out with immutable source versions

Date: 2026-11-12. Status: implemented locally, operational activation pending. Source freeze: `katathepAof/Permission-out@55380a5d5bdd7e82caa3fbd87ac4b72f979d383e`.

## Decision

Owner correction (2026-11-12) supersedes the original single combined module: register **MOD 1 PEA/UFM** (`permission-out`) and **MOD 2 Site Facility & Design** (`site-facility`) independently. Maps are primary workspaces with adjacent controls, not post-form previews. Shared primitives and generic map layouts belong to canonical `src/styles/ui.css`; the old module-local skin is not imported. The owner explicitly required central CSS.

Keep existing route links/project IDs and private immutable import tables. Add migration 0068 to enforce owning-domain gates and dataset-kind policies, a new `site_facility.*` capability catalog, and immutable dataset identity. No grant copying or automatic enablement. Legacy combined site permissions must not become implicit MOD 2 grants. Share import/map presentation and internal storage infrastructure; keep separate entry routes/APIs/navigation/search/dashboard and authorization. MOD 2 route overlays are explicit and require MOD 1 authorization as well.

Port the route geometry/export semantics and Site Facility workflow into the Core Shell. Replace the source static application, Cloudflare Worker and Supabase identity with native Next routes, Core sessions/capabilities/scopes, PostgreSQL FORCE RLS and transactional audit/activity/outbox. Keep both module registrations default-off and assign no roles automatically.

Use portable, source-compatible sampled geometry and bounded Node workers rather than requiring PostGIS for this increment. Production PostGIS availability was not inspected. This retains the source algorithm's approximation limits and avoids an unapproved database extension requirement; it does not certify geographic accuracy or cross-process queue capacity.

Store imported public rows, private raw/financial data and original bytes separately. Immutable versions plus an atomic active pointer support staging/diff/publish/rollback and deterministic analysis snapshots. Source file storage in PostgreSQL bytea is private and transactionally consistent but increases database backups and capacity needs; revisit a private object-store adapter if operational volumes justify it.

Scope manual site edits and private OPEX overlays to the imported base version. Preserve canonical source keys for lineage/comments while allowing a unique editable Site Code alias. Do not silently carry overlays to a new import. This requires explicit reconciliation but prevents stale edits masking new source data.

Archive projects/sites instead of hard deletion. Formula versions are immutable and unseeded until owner approval. Reanalysis creates a new project, preserving prior source/formula/algorithm results. Duct composition only offers a reviewable draft after both modules' access checks; no financial or approval workflow is triggered automatically.

## Consequences and verification

Core remains the single identity/navigation/security boundary. Sensitive columns cannot be obtained by ordinary site readers through raw data, map, export or SQL runtime role. New consumers must use public module contracts, not private tables. Events identify entity/action but do not publish source files/OPEX to outbox.

Local tests use template0 synthetic databases and constrained roles, a credential-free isolated production build, real Next/API smoke tests with synthetic sessions, and component browser tests. These do not replace real-data reconciliation, license confirmation, human UAT, independent security review or capacity testing. Existing Next/Zod audit findings block release; this integration does not authorize a breaking platform dependency migration.
