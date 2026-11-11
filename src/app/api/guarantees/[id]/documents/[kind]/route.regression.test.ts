import { beforeEach, describe, expect, it, vi } from "vitest";
import { auditLogs, guaranteeWorkEvents, guaranteeWorkItems } from "@/db/schema";
const state = vi.hoisted(() => ({ committed: [] as { table: unknown; value: unknown }[], failAudit: false, removed: vi.fn() }));
vi.mock("@/db", () => ({ getDb: () => ({ transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
  const pending: { table: unknown; value: unknown }[] = [];
  const tx = {
    update: (table: unknown) => ({ set: (value: unknown) => ({ where: () => ({ returning: async () => { pending.push({ table, value }); return [{ id: "id" }]; } }) }) }),
    insert: (table: unknown) => ({ values: async (value: unknown) => { if (table === auditLogs && state.failAudit) throw new Error("audit failed"); pending.push({ table, value }); } }),
  };
  const result = await fn(tx); state.committed.push(...pending); return result;
} }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/request-context", () => ({ requireApiIdentity: async () => ({ ok: true }) }));
vi.mock("@/lib/access", () => ({ getAccessContext: async () => ({ allowed: true, isDevelopmentSession: false, userId: "actor", subject: {} }) }));
vi.mock("@/lib/authorization", () => ({ isAuthorized: () => true }));
vi.mock("@/lib/deposit-v2-server", () => ({ getDepositWorkItem: async () => ({ ownerId: "actor", teamId: "team", status: "done", version: 1 }), canWorkAsAssignedTl: () => false }));
vi.mock("@/lib/guarantee-storage", () => ({ writeGuaranteeEvidence: async () => {}, removeGuaranteeEvidence: state.removed, readGuaranteeEvidence: vi.fn() }));
import { POST } from "./route";
const id = "12345678-1234-1234-1234-123456789abc";
function request() {
  const form = new FormData(); form.set("file", new File(["%PDF-1.4\n"], "test.pdf", { type: "application/pdf" })); form.set("version", "1");
  return new Request(`http://localhost/api/guarantees/${id}/documents/pdf_demo_off`, { method: "POST", headers: { origin: "http://localhost" }, body: form });
}
describe("guarantee document audit", () => {
  beforeEach(() => { state.committed = []; state.failAudit = false; state.removed.mockReset(); vi.stubEnv("DATABASE_URL", "fixture"); });
  it("commits the update, module event and central audit", async () => {
    const response = await POST(request(), { params: Promise.resolve({ id, kind: "pdf_demo_off" }) });
    expect(response.status).toBe(200);
    expect(state.committed.map((x) => x.table === guaranteeWorkItems ? "item" : x.table === guaranteeWorkEvents ? "event" : x.table === auditLogs ? "audit" : "other")).toEqual(["item", "event", "audit"]);
    expect(state.committed[2].value).toMatchObject({ actorId: "actor", moduleId: "guarantees", entityId: id });
  });
  it("removes the uploaded file and rolls back when audit fails", async () => {
    state.failAudit = true;
    const response = await POST(request(), { params: Promise.resolve({ id, kind: "pdf_demo_off" }) });
    expect(response.status).toBe(500); expect(state.committed).toHaveLength(0); expect(state.removed).toHaveBeenCalledOnce();
  });
});
