# Repository security review

Status: current static and deterministic review. Deployment controls require infrastructure evidence.

Reviewed on 2026-09-29:

- Opaque session tokens are random, only SHA-256 token hashes are stored, cookies are HttpOnly, SameSite=Lax, Secure in production and high priority. Active-user status and expiry are checked on every authenticated request.
- Passwords use Argon2id. Failed login increments are atomic and lock the account for 15 minutes after the fifth failure. Password change/reset revokes existing sessions and writes an audit event.
- Module visibility is manifest-driven; server queries and mutations separately authorize capability and row data scope. Client visibility is not treated as authority.
- Admin reads are section-gated. Role permission submissions accept only capability codes declared by the versioned catalog. System roles reject mutation. Role changes revoke affected sessions. Final-platform-admin changes are serialized and checked inside the transaction.
- Guarantee evidence validates UUID/kind, row access, optimistic version, size and file signature; storage paths are rooted and traversal-safe. Upload POST now requires same-origin.
- NAS bridge paths reject empty, dot, traversal, slash, backslash, NUL, excessive length and excessive depth before upstream URL construction. Mutating requests require same-origin and the bridge secret stays server-side.
- SharePoint readiness requires `core.role.manage` instead of a legacy role name and returns a generic error while retaining detailed diagnostics server-side.
- Legacy application and asset routes return 404 in production.

The build/test gates do not prove proxy TLS, PostgreSQL privileges/RLS under the deployed role, firewall rules, secret rotation, backup restore, audit retention, malware scanning, Microsoft tenant consent or penetration-test results. Those are release evidence, not repository assumptions.
