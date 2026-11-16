import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, inArray, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";

/**
 * Proves the two behaviours that only exist in PostgreSQL:
 * a position can carry an explicit team list, and a data scope can differ per
 * capability inside one assignment. Requires:
 *   npm run test:position-scope:db
 *   PARITY_INTEGRATION=1 npm run test:position-scope
 */
describe.skipIf(process.env.PARITY_INTEGRATION !== "1")("position SELECTED_TEAMS with per-capability scopes", () => {
  let client: ReturnType<typeof postgres>, db: ReturnType<typeof drizzle<typeof schema>>;
  const ids = {
    role: crypto.randomUUID(), userId: crypto.randomUUID(), otherOwner: crypto.randomUUID(),
    teamA: crypto.randomUUID(), teamB: crypto.randomUUID(), position: crypto.randomUUID(), assignment: crypto.randomUUID(),
  };
  const now = new Date();

  beforeAll(async () => {
    const env = parse(readFileSync(".env.local", "utf8"));
    const url = new URL(process.env.DATABASE_URL ?? env.DATABASE_URL);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) throw new Error("Loopback fixture required");
    url.pathname = "/permission_next_position_scope_test";
    client = postgres(url.href, { max: 4, prepare: false });
    db = drizzle(client, { schema });
    await db.insert(schema.teams).values([{ id: ids.teamA, code: `probe_a_${ids.teamA.slice(0, 8)}`, name: "Probe A" }, { id: ids.teamB, code: `probe_b_${ids.teamB.slice(0, 8)}`, name: "Probe B" }]);
    await db.insert(schema.roles).values({ id: ids.role, code: `probe_${ids.role.slice(0, 8)}`, name: "Probe role" });
    await db.insert(schema.permissions).values([
      { code: "building.record.read", moduleId: "building", resource: "record", action: "read", description: "probe" },
      { code: "building.record.update", moduleId: "building", resource: "record", action: "update", description: "probe" },
    ]).onConflictDoNothing();
    await db.insert(schema.rolePermissions).values([{ roleId: ids.role, permissionCode: "building.record.read" }, { roleId: ids.role, permissionCode: "building.record.update" }]);
    await db.insert(schema.profiles).values({ id: ids.userId, email: `probe_${ids.userId.slice(0, 8)}@example.test`, displayName: "Probe" });
    await db.insert(schema.localCredentials).values({ userId: ids.userId, passwordHash: "not-used-in-this-probe", mustChangePassword: false });
    await db.insert(schema.positions).values({ id: ids.position, code: `probe_${ids.position.slice(0, 8)}`, name: "Probe position", roleId: ids.role, scopeType: "SELECTED_TEAMS" });
    await db.insert(schema.positionSelectedTeams).values({ positionId: ids.position, teamId: ids.teamA });
    await db.insert(schema.userRoleAssignments).values({ id: ids.assignment, userId: ids.userId, roleId: ids.role, teamId: ids.teamA, createdBy: ids.userId });
    await db.insert(schema.dataScopeGrants).values([
      { assignmentId: ids.assignment, permissionCode: "building.record.read", scopeType: "ALL" },
      { assignmentId: ids.assignment, permissionCode: "building.record.update", scopeType: "OWN" },
    ]);
  });

  afterAll(async () => {
    await db.delete(schema.profiles).where(eq(schema.profiles.id, ids.userId));
    await db.delete(schema.positions).where(eq(schema.positions.id, ids.position));
    await db.delete(schema.roles).where(eq(schema.roles.id, ids.role));
    await db.delete(schema.teams).where(inArray(schema.teams.id, [ids.teamA, ids.teamB]));
    await client?.end();
  });

  async function permission(permissionCode: string, ownerId: string | null, teamId: string | null) {
    return db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('app.user_id', ${ids.userId}, true)`);
      const [row] = await tx.execute<{ allowed: boolean }>(sql`select public.has_scoped_permission(${permissionCode}, ${ownerId}::uuid, ${teamId}::uuid) as allowed`);
      return row.allowed;
    });
  }

  it("lets each capability follow its own scope inside one assignment", async () => {
    expect(await permission("building.record.read", ids.otherOwner, ids.teamB)).toBe(true);
    expect(await permission("building.record.update", ids.otherOwner, ids.teamB)).toBe(false);
    expect(await permission("building.record.update", ids.userId, ids.teamA)).toBe(true);
  });

  it("keeps the position team list and removes it with the position", async () => {
    const rows = await db.select().from(schema.positionSelectedTeams).where(eq(schema.positionSelectedTeams.positionId, ids.position));
    expect(rows.map((row) => row.teamId)).toEqual([ids.teamA]);
    await db.delete(schema.positions).where(eq(schema.positions.id, ids.position));
    const after = await db.select().from(schema.positionSelectedTeams).where(eq(schema.positionSelectedTeams.positionId, ids.position));
    expect(after).toHaveLength(0);
    await db.insert(schema.positions).values({ id: ids.position, code: `probe_${ids.position.slice(0, 8)}`, name: "Probe position", roleId: ids.role, scopeType: "SELECTED_TEAMS" });
    await db.insert(schema.positionSelectedTeams).values({ positionId: ids.position, teamId: ids.teamA });
  });

  it("rejects a position scope outside the allowed set", async () => {
    await expect(db.insert(schema.positions).values({ code: `probe_bad_${now.getTime()}`, name: "Bad", roleId: ids.role, scopeType: "BAD" })).rejects.toThrow();
  });
});
