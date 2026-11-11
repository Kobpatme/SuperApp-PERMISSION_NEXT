import { beforeEach, describe, expect, it, vi } from "vitest";
import { auditLogs, guaranteeWorkEvents, guaranteeWorkItems } from "@/db/schema";

const state = vi.hoisted(() => ({ committed: [] as { table: unknown; value: unknown }[], failAudit: false, item: null as null | Record<string, unknown>, stale: false }));
vi.mock("@/db", () => ({ getDb: () => ({ transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
  const pending: { table: unknown; value: unknown }[] = [];
  const tx = { update: (table: unknown) => ({ set: (value: unknown) => ({ where: () => ({ returning: async () => {
    if (state.stale) return [];
    pending.push({ table, value }); return [{ id: "12345678-1234-1234-1234-123456789abc" }];
  } }) }) }), insert: (table: unknown) => ({ values: (value: unknown) => {
    if (table === auditLogs && state.failAudit) throw new Error("audit failed");
    pending.push({ table, value });
    return { returning: async () => [{ id: (value as { id: string }).id }], then: (resolve: () => void) => resolve() };
  } }) };
  const result = await fn(tx);
  state.committed.push(...pending);
  return result;
} }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/access", () => ({ getAccessContext: async () => ({ allowed: true, isDevelopmentSession: false, userId: "actor", subject: {} }) }));
vi.mock("@/lib/authorization", () => ({ isAuthorized: () => true }));
vi.mock("@/lib/deposit-v2-server", () => ({ getDepositWorkItem: async () => state.item, listTlAssignees: async () => [], canWorkAsAssignedTl: () => false }));
vi.mock("@/lib/installation-team-context", () => ({ getInstallationTeamForArea: async () => ({ id: "team" }) }));
import { saveDepositWorkItem, transitionDepositWorkItem } from "./actions";

function form(demoReturn = "No") {
  const data = new FormData();
  for (const [key, value] of Object.entries({ place: "A", area: "A", deposit: "0", demolish: "50", fee: "0", other: "0", depReturn: "No", demoReturn })) data.set(key, value);
  return data;
}

describe("guarantee creation", () => {
  beforeEach(() => { state.committed = []; state.failAudit = false; state.item = null; state.stale = false; vi.stubEnv("DATABASE_URL", "fixture"); });
  it("rejects creation with a returned removal deposit", async () => {
    const result = await saveDepositWorkItem({ ok: false, message: "" }, form("Yes"));
    expect(result.ok).toBe(false);
    expect(state.committed).toHaveLength(0);
  });
  it("writes the item, original event and central audit together", async () => {
    const result = await saveDepositWorkItem({ ok: false, message: "" }, form());
    expect(result.ok).toBe(true);
    expect(state.committed.map((entry) => entry.table)).toEqual([guaranteeWorkItems, guaranteeWorkEvents, auditLogs]);
    expect(state.committed[2].value).toMatchObject({ actorId: "actor", moduleId: "guarantees", entityId: result.id });
  });
  it("rolls back item and event if central audit fails", async () => {
    state.failAudit = true;
    const result = await saveDepositWorkItem({ ok: false, message: "" }, form());
    expect(result.ok).toBe(false);
    expect(state.committed).toHaveLength(0);
  });
  it("requires off-service evidence before completing a removal refund", async () => {
    state.item = { id: "12345678-1234-1234-1234-123456789abc", ownerId: "actor", teamId: "team", status: "done", version: 1, demolish: 50, demoReturn: "No", service_cancel_date: "2026-01-01" };
    const input = form("Yes"); input.set("id", String(state.item.id)); input.set("version", "1"); input.set("service_cancel_date", "2026-01-01");
    expect((await saveDepositWorkItem({ ok: false, message: "" }, input)).ok).toBe(false);
    expect(state.committed).toHaveLength(0);
    state.item.pdf_demo_off = "evidence";
    expect((await saveDepositWorkItem({ ok: false, message: "" }, input)).ok).toBe(true);
    expect(state.committed[1].value).toMatchObject({ action: "off_service_complete" });
    expect(state.committed[2].value).toMatchObject({ action: "guarantee.off_service_complete" });
  });
  it("writes transition audit and does not audit a conflicting update", async () => {
    state.item = { id: "12345678-1234-1234-1234-123456789abc", ownerId: "actor", teamId: "team", status: "new", version: 1 };
    const input = new FormData(); input.set("id", String(state.item.id)); input.set("version", "1"); input.set("to", "fin");
    expect((await transitionDepositWorkItem({ ok: false, message: "" }, input)).ok).toBe(true);
    expect(state.committed[1].value).toMatchObject({ action: "transition" });
    expect(state.committed[2].value).toMatchObject({ action: "guarantee.transition" });
    state.committed = []; state.stale = true;
    expect((await transitionDepositWorkItem({ ok: false, message: "" }, input)).ok).toBe(false);
    expect(state.committed).toHaveLength(0);
  });
});
