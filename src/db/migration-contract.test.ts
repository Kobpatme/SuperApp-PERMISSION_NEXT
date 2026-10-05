import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(process.cwd(), "supabase", "migrations", "0002_platform_foundation.sql"), "utf8").toLowerCase();
const locationMigration = readFileSync(join(process.cwd(), "supabase", "migrations", "0018_building_location.sql"), "utf8").toLowerCase();

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

describe("building location migration contract", () => {
  it("adds nullable legacy coordinates and source metadata without fabricated backfill", () => {
    for (const field of ["latitude numeric(10,7)", "longitude numeric(11,7)", "location_accuracy", "location_source", "location_verified", "location_verified_at", "location_verified_by", "location_updated_at", "address", "subdistrict", "district", "province", "postcode", "longdo_place_id"]) {
      expect(locationMigration).toContain(field);
    }
    expect(locationMigration).toContain("location_verified boolean not null default false");
    expect(locationMigration).toContain("add column if not exists");
    expect(locationMigration).not.toContain("update public.buildings");
  });

  it("rejects partial/out-of-range positions and verified locations without audit identity", () => {
    expect(locationMigration).toContain("latitude is null and longitude is null");
    expect(locationMigration).toContain("latitude between -90 and 90");
    expect(locationMigration).toContain("longitude between -180 and 180");
    expect(locationMigration).toContain("location_verified_at is not null and location_verified_by is not null");
  });
});

describe("work parity additive migration contract", () => {
  it("keeps recovery and note evidence behind scoped policies", () => {
    const sql = readFileSync(join(process.cwd(), "supabase/migrations/0019_task_notes_and_edits.sql"), "utf8").toLowerCase();
    for (const name of ["task_notes", "work_mutation_receipts", "deleted_at", "deleted_by", "enable row level security", "work.note.create", "work.task.assign", "work.task.delete", "created_by", "updated_by"]) expect(sql).toContain(name);
    expect(sql).not.toContain("delete from public.tasks");
  });
});
