import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ identity: vi.fn(), access: vi.fn(), db: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/request-context", () => ({ requireApiIdentity: mocks.identity }));
vi.mock("@/lib/access", () => ({ getAccessContext: mocks.access }));
vi.mock("@/db", () => ({ getDb: mocks.db }));
import { GET } from "./route";
describe("scoped work CSV boundary", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.identity.mockResolvedValue({ ok: true }); });
  it("rejects unauthenticated and forced-password requests without reading data", async () => {
    for (const status of [401,403]) { mocks.identity.mockResolvedValue({ ok: false, response: new Response(null, { status }) }); expect((await GET(new Request("http://localhost/api/work/export"))).status).toBe(status); }
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it("requires both report and task permission", async () => {
    mocks.access.mockResolvedValue({ allowed: true, subject: { userId: "a", teamIds: [], grants: [{ permission: "work.task.read", scope: "ALL" }] } });
    expect((await GET(new Request("http://localhost/api/work/export"))).status).toBe(403);
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it("returns 400 for malformed filters", async () => {
    mocks.access.mockResolvedValue({ allowed: true });
    expect((await GET(new Request("http://localhost/api/work/export?team=bad"))).status).toBe(400);
    expect(mocks.db).not.toHaveBeenCalled();
  });
});
