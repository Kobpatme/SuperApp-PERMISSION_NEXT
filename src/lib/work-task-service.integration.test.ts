import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { auditLogs, outboxMessages, profiles, taskNotes, tasks, taskTransitions, teams } from "@/db/schema";
import type { Database, DatabaseTransaction } from "@/db";
import type { AuthorizationSubject } from "@/lib/authorization";
const testDb = vi.hoisted(() => vi.fn());
vi.mock("@/db", () => ({ getDb: testDb }));
import { mutateWorkTask } from "@/lib/work-task-service";
describe.skipIf(process.env.PARITY_INTEGRATION !== "1")("task transactions on isolated PostgreSQL", () => {
  async function fixture(run: (tx: DatabaseTransaction, actor: AuthorizationSubject, id: string) => Promise<void>) {
    config({ path: ".env.local", quiet: true });
    const target = new URL(process.env.DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)) throw new Error("Local fixture database required");
    target.pathname = "/permission_next_parity_test"; process.env.DATABASE_URL = target.href;
    const actual = await vi.importActual<typeof import("@/db")>("@/db");
    const rollback = new Error("rollback fixture");
    try { await actual.getDb().transaction(async tx => {
      testDb.mockReturnValue(tx as unknown as Database);
      const actorId = crypto.randomUUID(), teamId = crypto.randomUUID(), id = crypto.randomUUID();
      await tx.insert(profiles).values({ id: actorId, email: `${actorId}@example.test` });
      await tx.insert(teams).values({ id: teamId, code: teamId, name: "ทีมทดสอบ" });
      await tx.insert(tasks).values({ id, ownerId: actorId, teamId, title: "งานทดสอบ", status: "in_progress", note: "legacy" });
      const actor: AuthorizationSubject = { userId: actorId, teamIds: [teamId], grants: ["work.task.read", "work.task.update", "work.note.create", "work.task.manage", "work.task.delete"].map(permission => ({ permission, scope: "TEAM" })) };
      await run(tx, actor, id); throw rollback;
    }); } catch (error) { if (error !== rollback) throw error; }
  }
  it("replays without duplicating audit/transition/outbox and returns 409 for stale versions", async () => {
    await fixture(async (tx, actor, id) => {
      const command = { kind: "transition", taskId: id, expectedVersion: 1, toStatus: "completed", reason: "เสร็จแล้ว", idempotencyKey: crypto.randomUUID() };
      const ctx = { actor, requestId: crypto.randomUUID(), correlationId: crypto.randomUUID() };
      expect(await mutateWorkTask(command, ctx)).toMatchObject({ version: 2, replayed: false });
      expect(await mutateWorkTask(command, ctx)).toMatchObject({ version: 2, replayed: true });
      expect(await tx.select().from(taskTransitions).where(eq(taskTransitions.taskId, id))).toHaveLength(1);
      expect(await tx.select().from(auditLogs).where(eq(auditLogs.entityId, id))).toHaveLength(1);
      expect(await tx.select().from(outboxMessages).where(eq(outboxMessages.aggregateId, id))).toHaveLength(1);
      await expect(mutateWorkTask({ ...command, idempotencyKey: crypto.randomUUID() }, ctx)).rejects.toMatchObject({ status: 409 });
      await expect(mutateWorkTask({ ...command, reason: "different" }, ctx)).rejects.toMatchObject({ status: 409 });
    });
  });
  it("appends completed notes, preserves legacy text and supports audited recovery", async () => {
    await fixture(async (tx, actor, id) => {
      await tx.update(tasks).set({ status: "completed", completedAt: new Date() }).where(eq(tasks.id, id));
      const ctx = { actor, requestId: crypto.randomUUID(), correlationId: crypto.randomUUID() };
      const base = { taskId: id, expectedVersion: 1, idempotencyKey: crypto.randomUUID() };
      await mutateWorkTask({ ...base, kind: "note", body: "ใหม่" }, ctx);
      expect(await tx.select().from(taskNotes).where(eq(taskNotes.taskId, id))).toHaveLength(1);
      expect((await tx.select().from(tasks).where(eq(tasks.id, id)))[0]).toMatchObject({ note: "legacy", status: "completed", version: 2 });
      await mutateWorkTask({ ...base, expectedVersion: 2, idempotencyKey: crypto.randomUUID(), kind: "delete", reason: "ทดสอบ" }, ctx);
      expect((await tx.select().from(tasks).where(eq(tasks.id, id)))[0].deletedAt).not.toBeNull();
      await mutateWorkTask({ ...base, expectedVersion: 3, idempotencyKey: crypto.randomUUID(), kind: "restore", reason: "กู้คืน" }, ctx);
      expect((await tx.select().from(tasks).where(eq(tasks.id, id)))[0].deletedAt).toBeNull();
    });
  });
  it("denies wrong team and rolls back state if evidence cannot be written", async () => {
    await fixture(async (tx, actor, id) => {
      const command = { taskId: id, expectedVersion: 1, idempotencyKey: crypto.randomUUID(), kind: "note", body: "ใหม่" };
      const ctx = { actor: { ...actor, teamIds: [] }, requestId: crypto.randomUUID(), correlationId: crypto.randomUUID() };
      await expect(mutateWorkTask(command, ctx)).rejects.toMatchObject({ status: 403 });
      await expect(mutateWorkTask(command, { ...ctx, actor, requestId: undefined as unknown as string })).rejects.toThrow();
      expect((await tx.select().from(tasks).where(eq(tasks.id, id)))[0].version).toBe(1);
      expect(await tx.select().from(taskNotes).where(eq(taskNotes.taskId, id))).toHaveLength(0);
    });
  });
});
