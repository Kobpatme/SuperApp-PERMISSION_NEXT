import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(process.cwd(), "supabase", "migrations", "0002_platform_foundation.sql"), "utf8").toLowerCase();

describe("platform migration security contract", () => {
  it("creates normalized RBAC and all four data scopes", () => {
    for (const table of ["teams", "user_teams", "roles", "permissions", "role_permissions", "user_role_assignments", "data_scope_grants"]) {
      expect(migration).toContain(`public.${table}`);
    }
    for (const scope of ["'own'", "'team'", "'selected_teams'", "'all'"]) expect(migration).toContain(scope);
  });
  it("enables RLS and append-only evidence", () => {
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("has_scoped_permission");
    expect(migration).toContain("audit_logs_immutable");
    expect(migration).toContain("activity_events_immutable");
  });
  it("keeps audit, activity and outbox as separate transactional records", () => {
    expect(migration).toContain("public.audit_logs");
    expect(migration).toContain("public.activity_events");
    expect(migration).toContain("public.outbox_messages");
    expect(migration).toContain("idempotency_key text not null unique");
  });
});
