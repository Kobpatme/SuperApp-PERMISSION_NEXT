import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import type { Database } from "@/db";
import { auditLogs, buildingConditionVersions, buildingSourceMappings, buildings, profiles, tasks } from "@/db/schema";
import type { AccessContext } from "./access";

const getTestDb = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ getDb: getTestDb }));
import { deleteBuildingRecord } from "./building-delete-server";

// Explicit opt-in; all fixture writes and deletions are rolled back on a local dev DB.
describe.skipIf(process.env.BUILDING_DELETE_INTEGRATION !== "1")("building deletion on PostgreSQL", () => {
  async function fixture(run: (db: Database, access: AccessContext, id: string) => Promise<void>) {
    config({ path: ".env.local", quiet: true });
    const target = new URL(process.env.DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) || !target.pathname.endsWith("_dev")) throw new Error("Integration tests require a local development database");
    const actual = await vi.importActual<typeof import("@/db")>("@/db");
    const rollback = new Error("rollback fixtures");
    try {
      await actual.getDb().transaction(async (tx) => {
        getTestDb.mockReturnValue(tx);
        const actorId = crypto.randomUUID(), id = crypto.randomUUID();
        await tx.insert(profiles).values({ id: actorId, email: `${actorId}@example.test` });
        await tx.insert(buildings).values({ id, code: `DELETE-TEST-${id}`, nameTh: "อาคารทดสอบการลบ", searchText: "test", version: 1 });
        await tx.insert(buildingConditionVersions).values({ buildingId: id, version: 1, effectiveFrom: new Date(), conditions: { lat: 13, lng: 100 }, reason: "test" });
        await tx.insert(buildingSourceMappings).values({ buildingId: id, sourceSystem: "test", sourceId: id });
        const access: AccessContext = { userId: actorId, role: "admin", email: "", displayName: "", allowed: true, passwordChangeRequired: false,
          isDevelopmentSession: false, permissions: [], subject: { userId: actorId, teamIds: [], grants: [{ permission: "building.record.read", scope: "ALL" }, { permission: "building.record.update", scope: "ALL" }] } };
        await run(tx as unknown as Database, access, id);
        throw rollback;
      });
    } catch (error) { if (error !== rollback) throw error; }
  }

  it("deletes a real record, conditions and source mapping while saving the audit snapshot", async () => {
    await fixture(async (db, access, id) => {
      await deleteBuildingRecord(access, id, { confirmationName: "อาคารทดสอบการลบ", version: 1 }, crypto.randomUUID());
      expect(await db.select().from(buildings).where(eq(buildings.id, id))).toHaveLength(0);
      expect(await db.select().from(buildingConditionVersions).where(eq(buildingConditionVersions.buildingId, id))).toHaveLength(0);
      expect(await db.select().from(buildingSourceMappings).where(eq(buildingSourceMappings.buildingId, id))).toHaveLength(0);
      const [audit] = await db.select().from(auditLogs).where(eq(auditLogs.entityId, id));
      expect(audit.action).toBe("building.delete"); expect(audit.actorId).toBe(access.userId);
      expect(audit.before).toMatchObject({ building: { id }, conditions: [expect.any(Object)], mappings: [expect.any(Object)] });
    });
  });
  it("retains linked tasks and the building, and creates no success audit", async () => {
    await fixture(async (db, access, id) => {
      await db.insert(tasks).values({ buildingId: id, ownerId: access.userId, title: "test" });
      await expect(deleteBuildingRecord(access, id, { confirmationName: "อาคารทดสอบการลบ", version: 1 }, crypto.randomUUID())).rejects.toMatchObject({ code: "building_has_dependencies" });
      expect(await db.select().from(buildings).where(eq(buildings.id, id))).toHaveLength(1);
      expect(await db.select().from(tasks).where(eq(tasks.buildingId, id))).toHaveLength(1);
      expect(await db.select().from(auditLogs).where(eq(auditLogs.entityId, id))).toHaveLength(0);
    });
  });
  it("rejects non-admin, mismatched confirmation and stale version without changing data", async () => {
    await fixture(async (db, access, id) => {
      const input = { confirmationName: "อาคารทดสอบการลบ", version: 1 };
      await expect(deleteBuildingRecord({ ...access, role: "manager" }, id, input, crypto.randomUUID())).rejects.toMatchObject({ code: "forbidden" });
      await expect(deleteBuildingRecord(access, id, { ...input, version: 2 }, crypto.randomUUID())).rejects.toMatchObject({ code: "building_changed" });
      await expect(deleteBuildingRecord(access, id, { ...input, confirmationName: "wrong" }, crypto.randomUUID())).rejects.toMatchObject({ code: "confirmation_mismatch" });
      expect(await db.select().from(buildings).where(eq(buildings.id, id))).toHaveLength(1);
    });
  });
});
