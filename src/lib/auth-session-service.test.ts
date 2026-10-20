import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { authSessions, auditLogs } from "@/db/schema";
import { PgDialect } from "drizzle-orm/pg-core";
const calls = vi.hoisted(() => ({ sequence: [] as string[], values: vi.fn(), conditions: vi.fn(), count: 1 }));
vi.mock("@/db", () => ({ getDb: () => ({ transaction: async (run: (tx: unknown) => Promise<void>) => run({
  select: () => ({ from: () => ({ where: () => ({ for: async () => { calls.sequence.push("lock"); return [{ id: "fixture", status: "active" }]; } }) }) }),
  delete: () => ({ where: async (condition: unknown) => { calls.sequence.push("cleanup"); calls.conditions("delete", condition); } }),
  update: () => ({ set: (values: unknown) => ({ where: (condition: unknown) => ({ returning: async () => { calls.sequence.push("revoke"); calls.values(authSessions, values); calls.conditions("update", condition); return Array.from({ length: calls.count }, () => ({ id: "fixture" })); } }) }) }),
  insert: (table: unknown) => ({ values: async (values: unknown) => { calls.sequence.push(table === auditLogs ? "audit" : "insert"); calls.values(table, values); } }),
}) }) }));
import { persistSession } from "@/lib/auth-session-service";
beforeEach(() => { vi.clearAllMocks(); calls.sequence = []; calls.count = 1; });
afterEach(() => vi.unstubAllEnvs());
it("serializes replacement and records only a count in transactional audit", async () => {
  vi.stubEnv("AUTH_SINGLE_SESSION", "true"); await persistSession("fixture", "private-fixture-hash", new Date(Date.now() + 60000));
  expect(calls.sequence).toEqual(["lock", "cleanup", "revoke", "audit", "insert"]);
  const audit = calls.values.mock.calls.find(call => call[0] === auditLogs)![1];
  expect(audit).toMatchObject({ action: "auth.session.superseded", metadata: { count: 1 } });
  expect(JSON.stringify(audit)).not.toContain("private-fixture-hash");
  expect(new PgDialect().sqlToQuery(calls.conditions.mock.calls[0][1]).sql).toContain('"revoked_at" <');
});
it("keeps multiple sessions with the rollout flag off", async () => {
  vi.stubEnv("AUTH_SINGLE_SESSION", "false"); await persistSession("fixture", "fixture-hash", new Date(Date.now() + 60000));
  expect(calls.sequence).toEqual(["lock", "cleanup", "insert"]);
});
it("does not emit a replacement event for the first login", async () => {
  calls.count = 0; vi.stubEnv("AUTH_SINGLE_SESSION", "true"); await persistSession("fixture", "fixture-hash", new Date(Date.now() + 60000));
  expect(calls.sequence).toEqual(["lock", "cleanup", "revoke", "insert"]);
});
