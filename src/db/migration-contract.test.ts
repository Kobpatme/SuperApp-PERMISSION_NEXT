import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(process.cwd(), "supabase", "migrations", "0002_platform_foundation.sql"), "utf8").toLowerCase();
const locationMigration = readFileSync(join(process.cwd(), "supabase", "migrations", "0018_building_location.sql"), "utf8").toLowerCase();

it("adds session tombstones without revoking existing users during migration", () => {
  const source = readFileSync(join(process.cwd(), "supabase/migrations/0028_auth_single_session.sql"), "utf8").toLowerCase();
  for (const part of ["revoked_at timestamptz", "revoked_reason text", "'superseded'", "'admin_revoked'", "'password_changed'", "where revoked_at is null", "check ("]) expect(source).toContain(part);
  expect(source).not.toContain("delete from"); expect(source).not.toContain("update public.auth_sessions");
});

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

describe("platform admin full-system corrective migration contract", () => {
  it("uses only the canonical active normalized platform_admin identity", () => {
    const sql = readFileSync(join(process.cwd(), "supabase/migrations/0060_platform_admin_full_system_access.sql"), "utf8").toLowerCase();
    for (const part of ["create or replace function public.is_platform_admin()", "r.code = 'platform_admin'", "p.status = 'active'", "not c.must_change_password", "a.valid_until", "public.is_platform_admin() or exists", "public.duct_rental_has_entry()", "public.car_booking_has_access"]) expect(sql).toContain(part);
    expect(sql).not.toContain("insert into public");
    expect(sql).not.toContain("update public.");
    expect(sql).not.toContain("delete from public.");
    expect(sql).not.toContain("current_setting('role'");
  });

  it("removes PUBLIC predicate execution and allowlists only trusted runtime roles", () => {
    const sql = readFileSync(join(process.cwd(), "supabase/migrations/0060_platform_admin_full_system_access.sql"), "utf8").toLowerCase();
    expect(sql).toMatch(/revoke\s+all\s+on\s+function\s+public\.is_platform_admin\(\)\s+from\s+public\s*;/);
    const grants = [...sql.matchAll(/grant\s+execute\s+on\s+function\s+public\.is_platform_admin\(\)\s+to\s+([a-z_]+)\s*;/g)].map((match) => match[1]);
    expect(grants).toEqual(["permission_core_runtime", "duct_rental_policy_worker"]);
    expect(sql).not.toMatch(/grant\s+execute[^;]*\s+to\s+(public|anon|authenticated)\s*;/);
  });

  it("requires a forward-only policy-worker membership fail-closed migration", () => {
    const sql = readFileSync(join(process.cwd(), "supabase/migrations/0061_duct_policy_worker_membership_guard.sql"), "utf8").toLowerCase();
    expect(sql).toContain("pg_auth_members");
    expect(sql).toContain("with recursive");
    expect(sql).toMatch(/roleid\s*=\s*worker_oid/);
    expect(sql).toContain("parent.member_oid = nested.roleid");
    expect(sql).toContain("must not have direct role members");
    expect(sql).toContain("rolcanlogin or principal.rolbypassrls");
    expect(sql).toMatch(/raise exception/);
    expect(sql).toContain("duct_rental_policy_worker");
    expect(sql).toMatch(/rolcanlogin/);
    expect(sql).toMatch(/rolsuper/);
    expect(sql).toMatch(/rolcreatedb/);
    expect(sql).not.toMatch(/grant\s+.*duct_rental_policy_worker\s+to/);
  });

  it("preserves the intentional worker BYPASSRLS and guards the original session", () => {
    const sql = readFileSync(join(process.cwd(), "supabase/migrations/0062_duct_policy_worker_runtime_guard.sql"), "utf8").toLowerCase();
    const freshWorker = readFileSync(join(process.cwd(), "supabase/migrations/0033_duct_rental_runtime.sql"), "utf8").toLowerCase();
    expect(freshWorker).toContain("create role duct_rental_policy_worker nologin noinherit nosuperuser bypassrls");
    expect(sql).toContain("set_option");
    expect(sql).toContain("inherit_option");
    expect(sql).toContain("rolcreaterole");
    expect(sql).toContain("rolcanlogin");
    expect(sql).toContain("rolinherit");
    expect(sql).toContain("rolsuper");
    expect(sql).toContain("rolcreatedb");
    expect(sql).toContain("rolbypassrls");
    expect(sql).toMatch(/and not rolbypassrls/);
    expect(sql).toContain("session_user");
    expect(sql).toContain("pg_has_role(session_user, 'permission_core_runtime', 'set')");
    expect(sql).toContain("pg_has_role(session_user, 'duct_rental_runtime', 'set')");
    const guardBody = sql.slice(sql.indexOf("create or replace function public.is_platform_admin()"), sql.indexOf("$$;", sql.indexOf("create or replace function public.is_platform_admin()")));
    expect(guardBody).not.toMatch(/current_user\s*=/);
    expect(guardBody).toContain("session_user");
    expect(sql).toContain("worker is current_user inside the nested call");
    expect(sql).not.toContain("session_user = 'duct_rental_policy_worker'");
    expect(sql).toMatch(/raise exception/);
  });

  it("keeps SECURITY DEFINER predicates on a pinned safe search_path", () => {
    const sql = readFileSync(join(process.cwd(), "supabase/migrations/0060_platform_admin_full_system_access.sql"), "utf8").toLowerCase();
    for (const functionName of ["is_platform_admin", "has_scoped_permission", "car_booking_has_access", "duct_rental_has_entry", "duct_rental_has_access"]) {
      const start = sql.indexOf(`create or replace function public.${functionName}`);
      const body = sql.slice(start, sql.indexOf("$$;", start) + 3);
      expect(body).toContain("security definer");
      expect(body).toMatch(/set search_path\s*=\s*pg_catalog\s*,\s*public/);
    }
  });

  it("requires active profiles and completed password setup for ordinary scoped access", () => {
    const sql = readFileSync(join(process.cwd(), "supabase/migrations/0060_platform_admin_full_system_access.sql"), "utf8").toLowerCase();
    const scopedBody = sql.match(/create or replace function public\.has_scoped_permission[\s\S]*?\$\$;/)?.[0] ?? "";
    expect(scopedBody).toContain("join profiles p on p.id = ura.user_id");
    expect(scopedBody).toContain("join local_credentials c on c.user_id = ura.user_id");
    expect(scopedBody).toMatch(/p\.status\s*=\s*'active'/);
    expect(scopedBody).toMatch(/not\s+c\.must_change_password/);
    expect(scopedBody).toContain("public.is_platform_admin() or exists");
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
  it("protects all administration tables and registers assignable admin capabilities",()=>{
    const sql=["0021_holidays.sql","0022_system_links_announcements.sql","0023_kpi_admin.sql"].map(name=>readFileSync(join(process.cwd(),"supabase/migrations",name),"utf8").toLowerCase()).join("\n");
    for(const table of ["holidays","system_links","system_link_roles","system_link_teams","admin_announcements","kpi_personal_versions","work_admin_previews"])expect(sql).toContain(`alter table public.${table} enable row level security`);
    for(const permission of ["core.holiday.manage","core.system_link.manage","core.announcement.manage"])expect(sql).toContain(permission);
    expect(sql).toContain("unique(holiday_date, source)");expect(sql).toContain("expires_at");expect(sql).toContain("created_by");expect(sql).toContain("updated_by");expect(sql).not.toContain("update public.kpi_facts");
  });
});
