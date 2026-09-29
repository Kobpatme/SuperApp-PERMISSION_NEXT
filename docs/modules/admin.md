# Admin access control plane

Status: current repository implementation; production concurrency and organization-policy review remain required.

`/admin` is capability-gated by section. A user with only audit permission does not cause user, role or organization records to be queried. Sensitive mutations re-authorize on the server and commit their audit event in the same database transaction.

Administrators with the matching capability can manage users, positions and teams; create or clone custom roles; assign manifest-defined capabilities through a human-readable permission matrix; choose `OWN`, `TEAM`, `SELECTED_TEAMS` or `ALL` data scope for a user assignment; preview effective module access; review the latest audit history; revoke sessions; and reset passwords. Password reset stores only Argon2id hashes, sets forced password change and revokes existing sessions.

Capability codes come from `src/lib/module-registry.ts` and the versioned module manifests. The server rejects any submitted code outside that catalog. System roles are read-only in the UI and server action; administrators clone them when a different policy is required. Technical codes are hidden under Advanced details in the access preview and matrix.

Positions define a default `OWN`, `TEAM` or `ALL` scope for new assignments. `SELECTED_TEAMS` is an explicit user-assignment override because it requires concrete team IDs. Updating a position does not silently rewrite existing assignments; the Admin access-review flow must review and save each affected user so the resulting access change is explicit and audited.

Role permission changes revoke sessions for currently assigned users. Runtime authorization still loads role permissions and data-scope grants on every server request and remains deny-by-default.

## External verification

- Test concurrent attempts to remove or alter the final platform administrator against the production PostgreSQL isolation configuration.
- Review the organization password/reset and session-retention policy.
- Run an access review with production-like roles, teams and selected-team assignments.
- Confirm audit retention and export requirements with the security owner.
