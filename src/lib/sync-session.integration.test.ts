import { readFileSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { parse } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq, isNull } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { hash } from "@node-rs/argon2";
import * as schema from "@/db/schema";
import type { Database } from "@/db";
import type { AuthorizationSubject } from "@/lib/authorization";
const mocks = vi.hoisted(() => ({ db: undefined as unknown, token: "", user: "" }));
vi.mock("server-only", () => ({}));
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("@/db", () => ({ getDb: () => mocks.db }));
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => ({ value: mocks.token }), set: (_name: string, token: string) => { mocks.token = token; } }) }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("@/lib/access", () => ({ getIdentityAccessContext: async () => ({ userId: mocks.user, subject: { userId: mocks.user, teamIds: [], grants: [{ permission: "core.user.manage", scope: "ALL" }] } }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
import { getCurrentUser, getSessionFailureReason } from "@/lib/auth";
import { persistSession } from "@/lib/auth-session-service";
import { changePasswordAction, loginAction } from "@/app/login/actions";
import { revokeUserSessionsAction } from "@/app/(platform)/admin/actions";
import { createWorkBatch } from "@/lib/work-create-service";
import { mutateWorkTask } from "@/lib/work-task-service";

describe.skipIf(process.env.PARITY_INTEGRATION !== "1")("sync/session isolated PostgreSQL", () => {
  let client: ReturnType<typeof postgres>, db: Database, passwordHash: string;
  const token = () => randomBytes(32).toString("base64url");
  const hashed = (value: string) => createHash("sha256").update(value).digest("hex");
  beforeAll(async () => {
    const env = parse(readFileSync(".env.local", "utf8")), target = new URL(env.DATABASE_URL);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)) throw new Error("Loopback fixture required");
    target.pathname = "/permission_next_sync_session_test"; process.env.DATABASE_URL = target.href;
    client = postgres(target.href, { max: 10, prepare: false }); db = drizzle(client, { schema }); mocks.db = db;
    passwordHash = await hash("FixturePassword123!", { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 });
  });
  afterAll(async () => { await client?.end(); vi.unstubAllEnvs(); });
  beforeEach(() => { mocks.db = db; vi.stubEnv("AUTH_SINGLE_SESSION", "true"); });
  async function account() {
    const id = crypto.randomUUID();
    await db.insert(schema.profiles).values({ id, email: `${id}@example.test`, displayName: "Fixture" });
    await db.insert(schema.localCredentials).values({ userId: id, passwordHash, mustChangePassword: false });
    mocks.user = id; return id;
  }
  async function issue(id: string) { const value = token(); await persistSession(id, hashed(value), new Date(Date.now() + 3600000)); return value; }
  it("real repeated login invalidates the first token with the superseded reason", async () => {
    const id = await account(); const form = new FormData(); form.set("email", `${id}@example.test`); form.set("password", "FixturePassword123!");
    await expect(loginAction({}, form)).rejects.toThrow("REDIRECT:/"); const first = mocks.token;
    await expect(loginAction({}, form)).rejects.toThrow("REDIRECT:/"); const second = mocks.token;
    mocks.token = first; expect(await getCurrentUser()).toBeNull(); expect(await getSessionFailureReason()).toBe("superseded");
    mocks.token = second; expect(await getCurrentUser()).toMatchObject({ id });
  });
  it("serializes eight concurrent session issuers to exactly one active session", async () => {
    const id = await account(), values = await Promise.all(Array.from({ length: 8 }, () => issue(id)));
    const rows = await db.select().from(schema.authSessions).where(eq(schema.authSessions.userId, id));
    expect(rows.filter(row => !row.revokedAt)).toHaveLength(1); expect(rows.filter(row => row.revokedReason === "superseded")).toHaveLength(7);
    expect(values.map(hashed)).toContain(rows.find(row => !row.revokedAt)!.tokenHash);
    const audits = await db.select().from(schema.auditLogs).where(and(eq(schema.auditLogs.actorId, id), eq(schema.auditLogs.action, "auth.session.superseded")));
    expect(audits).toHaveLength(7); expect(audits.every(row => JSON.stringify(row.metadata) === '{"count":1}')).toBe(true);
  });
  it("permits multiple active tokens when the flag is false", async () => {
    vi.stubEnv("AUTH_SINGLE_SESSION", "false"); const id = await account(), first = await issue(id), second = await issue(id);
    for (const value of [first, second]) { mocks.token = value; expect(await getCurrentUser()).toMatchObject({ id }); }
  });
  it("password change revokes every old session and creates one replacement", async () => {
    vi.stubEnv("AUTH_SINGLE_SESSION", "false"); const id = await account(), first = await issue(id); mocks.token = await issue(id);
    const form = new FormData(); form.set("password", "ChangedFixture456!"); form.set("confirm", "ChangedFixture456!");
    await expect(changePasswordAction({}, form)).rejects.toThrow("REDIRECT:/");
    const rows = await db.select().from(schema.authSessions).where(eq(schema.authSessions.userId, id));
    expect(rows.filter(row => !row.revokedAt)).toHaveLength(1); expect(rows.filter(row => row.revokedReason === "password_changed")).toHaveLength(2);
    mocks.token = first; expect(await getCurrentUser()).toBeNull(); expect(await getSessionFailureReason()).toBe("expired");
  });
  it("admin revoke invalidates a token without treating it as another login", async () => {
    const id = await account(); mocks.token = await issue(id); const form = new FormData(); form.set("userId", id);
    expect(await revokeUserSessionsAction({ ok: false, message: "" }, form)).toMatchObject({ ok: true });
    expect(await getCurrentUser()).toBeNull(); expect(await getSessionFailureReason()).toBe("expired");
    expect((await db.select().from(schema.authSessions).where(eq(schema.authSessions.userId, id)))[0].revokedReason).toBe("admin_revoked");
  });
  it.each(["idle", "absolute"])("preserves %s expiry and rejects a timestamp touch", async kind => {
    const id = await account(); mocks.token = await issue(id);
    await db.update(schema.authSessions).set(kind === "idle" ? { lastSeenAt: new Date(Date.now() - 31 * 60000) } : { expiresAt: new Date(Date.now() - 1000) }).where(eq(schema.authSessions.userId, id));
    expect(await getCurrentUser()).toBeNull(); expect(await getSessionFailureReason()).toBe("expired");
  });
  it("retains fresh tombstones and removes only those older than seven days on login", async () => {
    const id = await account();
    await db.insert(schema.authSessions).values([8, 6].map(days => ({ userId: id, tokenHash: hashed(token()), expiresAt: new Date(Date.now() - 1000), revokedAt: new Date(Date.now() - days * 86400000), revokedReason: "superseded" })));
    await issue(id); const rows = await db.select().from(schema.authSessions).where(eq(schema.authSessions.userId, id));
    expect(rows).toHaveLength(2); expect(rows.filter(row => row.revokedAt)).toHaveLength(1);
  });
  it("does not relabel an already idle-expired token as superseded on the next login", async () => {
    const id = await account(), first = await issue(id);
    await db.update(schema.authSessions).set({ lastSeenAt: new Date(Date.now() - 31 * 60000) }).where(eq(schema.authSessions.userId, id));
    await issue(id); mocks.token = first; expect(await getCurrentUser()).toBeNull(); expect(await getSessionFailureReason()).toBe("expired");
  });
  it("enforces paired revocation fields and the checked reason in PostgreSQL", async () => {
    const id = await account();
    for (const values of [{ revokedAt: new Date(), revokedReason: null }, { revokedAt: null, revokedReason: "superseded" }, { revokedAt: new Date(), revokedReason: "invalid" }]) {
      await expect(db.insert(schema.authSessions).values({ userId: id, tokenHash: hashed(token()), expiresAt: new Date(Date.now() + 60000), ...values })).rejects.toThrow();
    }
  });
  it("touches at most once in sixty seconds including a work action and repeated identity reads", async () => {
    const id = await account(); mocks.token = await issue(id);
    await db.update(schema.authSessions).set({ lastSeenAt: new Date(Date.now() - 65000) }).where(eq(schema.authSessions.userId, id));
    await getCurrentUser(); const [first] = await db.select().from(schema.authSessions).where(and(eq(schema.authSessions.userId, id), isNull(schema.authSessions.revokedAt)));
    await Promise.all(Array.from({ length: 8 }, () => getCurrentUser()));
    const taskId = crypto.randomUUID(); await db.insert(schema.tasks).values({ id: taskId, ownerId: id, title: "Session touch fixture", status: "in_progress" });
    const actor: AuthorizationSubject = { userId: id, teamIds: [], grants: [{ permission: "work.task.update", scope: "OWN" }] };
    await mutateWorkTask({ kind: "transition", taskId, expectedVersion: 1, toStatus: "completed", reason: "done", idempotencyKey: crypto.randomUUID() }, { actor, requestId: crypto.randomUUID(), correlationId: crypto.randomUUID() });
    const [after] = await db.select().from(schema.authSessions).where(eq(schema.authSessions.id, first.id));
    expect(after.lastSeenAt).toEqual(first.lastSeenAt);
  });
  it("creates an ordered three-job batch with one audit/receipt, replay safety and one completion transition", async () => {
    const id = await account(), teamId = crypto.randomUUID(); await db.insert(schema.teams).values({ id: teamId, code: teamId, name: "Fixture" }); await db.insert(schema.userTeams).values({ userId: id, teamId });
    const actor: AuthorizationSubject = { userId: id, teamIds: [teamId], grants: ["work.task.create", "work.task.update", "kpi.rule.manage"].map(permission => ({ permission, scope: "ALL" })) };
    const { saveWorkAdmin } = await import("@/lib/work-admin-service"), { readWorkKpiCatalog } = await import("@/lib/work-kpi-catalog");
    await saveWorkAdmin("rule", { teamId, mainKpi: "Fixture", subKpi: "Batch", slaDays: 2, mainWeight: "100", expectedVersion: 0, active: true }, { actor, requestId: crypto.randomUUID() });
    const rule = (await readWorkKpiCatalog()).find(row => row.config.teamId === teamId)!;
    const requestId = crypto.randomUUID(), input = { jobs: "Job A\nJob B\nJob C", teamId, assigneeId: id, ruleVersionId: rule.id, idempotencyKey: crypto.randomUUID() };
    const result = await createWorkBatch(input, "personal", { actor, requestId });
    const [receipt] = await db.select().from(schema.outboxMessages).where(eq(schema.outboxMessages.aggregateId, result.id));
    const ids = receipt.payload.taskIds as string[];
    const created = await db.select().from(schema.tasks).where(eq(schema.tasks.ownerId, id));
    expect(ids.map(taskId => created.find(row => row.id === taskId)!.jobCode)).toEqual(["Job A", "Job B", "Job C"]);
    expect(await createWorkBatch(input, "personal", { actor, requestId })).toMatchObject({ replayed: true });
    expect(await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.requestId, requestId))).toHaveLength(1);
    expect(await db.select().from(schema.outboxMessages).where(eq(schema.outboxMessages.aggregateId, result.id))).toHaveLength(1);
    expect(await db.select().from(schema.tasks).where(eq(schema.tasks.ownerId, id))).toHaveLength(3);
    const completedRequest = crypto.randomUUID(), taskId = ids[0];
    await mutateWorkTask({ kind: "transition", taskId, expectedVersion: 1, toStatus: "completed", reason: "done", idempotencyKey: crypto.randomUUID() }, { actor, requestId: completedRequest, correlationId: completedRequest });
    const [completed] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId));
    expect(completed.version).toBe(2); expect(completed.completedAt).not.toBeNull();
    expect(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(completed.completedAt!)).toBe(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date()));
    expect(await db.select().from(schema.taskTransitions).where(eq(schema.taskTransitions.taskId, taskId))).toHaveLength(1);
    expect(await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.requestId, completedRequest))).toHaveLength(1);
  });
  it("rolls back completion and evidence when the audit insert fails", async () => {
    const id = await account(), taskId = crypto.randomUUID(); await db.insert(schema.tasks).values({ id: taskId, ownerId: id, title: "Rollback fixture", status: "in_progress" });
    const actor: AuthorizationSubject = { userId: id, teamIds: [], grants: [{ permission: "work.task.update", scope: "OWN" }] };
    await expect(mutateWorkTask({ kind: "transition", taskId, expectedVersion: 1, toStatus: "completed", reason: "done", idempotencyKey: crypto.randomUUID() }, { actor, requestId: undefined as unknown as string, correlationId: crypto.randomUUID() })).rejects.toThrow();
    const [row] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId));
    expect(row).toMatchObject({ status: "in_progress", version: 1, completedAt: null });
    expect(await db.select().from(schema.taskTransitions).where(eq(schema.taskTransitions.taskId, taskId))).toHaveLength(0);
  });
});
