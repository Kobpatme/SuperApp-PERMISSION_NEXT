import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ access: vi.fn(), create: vi.fn(), list: vi.fn() }));
vi.mock("@/lib/access", () => ({ getAccessContext: mocks.access }));
vi.mock("@/lib/request-context", () => ({ authenticationRequiredResponse: () => Response.json({ code: "AUTHENTICATION_REQUIRED" }, { status: 401 }) }));
vi.mock("../server/requests", () => ({ createRequest: mocks.create, listRequests: mocks.list, changeRequest: vi.fn(), readRequest: vi.fn() }));
import { handleDuctRentalRequest } from "../server/api";

describe("duct API uses only verified Core identity", () => {
  const actor = randomUUID();
  beforeEach(() => { vi.clearAllMocks(); mocks.access.mockResolvedValue({ userId: actor, allowed: true, passwordChangeRequired: false }); mocks.create.mockResolvedValue({ id: randomUUID() }); mocks.list.mockResolvedValue({ rows: [] }); });
  const post = (body: string, headers: Record<string, string> = {}) => new Request("http://localhost/api/duct-rental/requests", { method: "POST", headers: { Origin: "http://localhost", "Content-Type": "application/json", "Idempotency-Key": randomUUID(), ...headers }, body });
  it("denies anonymous direct requests before any business service", async () => {
    mocks.access.mockResolvedValue({ userId: "", allowed: false });
    expect((await handleDuctRentalRequest(post("{}"), ["requests"])).status).toBe(401); expect(mocks.create).not.toHaveBeenCalled();
  });
  it.each([{ allowed: false }, { passwordChangeRequired: true }])("denies disabled grants/account state %j", async state => {
    mocks.access.mockResolvedValue({ userId: actor, allowed: true, passwordChangeRequired: false, ...state });
    expect((await handleDuctRentalRequest(post("{}"), ["requests"])).status).toBe(403); expect(mocks.create).not.toHaveBeenCalled();
  });
  it("rejects cross-origin, missing idempotency and oversized streamed bodies", async () => {
    expect((await handleDuctRentalRequest(post("{}", { Origin: "http://untrusted.test" }), ["requests"])).status).toBe(403);
    expect((await handleDuctRentalRequest(post("{}", { "Idempotency-Key": "" }), ["requests"])).status).toBe(400);
    expect((await handleDuctRentalRequest(post(JSON.stringify({ large: "x".repeat(65536) })), ["requests"])).status).toBe(413);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("ignores forged actor and authorization flags; passes only the verified session actor", async () => {
    const response = await handleDuctRentalRequest(post(JSON.stringify({ design: {}, actorId: randomUUID(), role: "admin", canSubmit: true })), ["requests"]);
    expect(response.status).toBe(200);
    expect(mocks.create).toHaveBeenCalledWith({}, null, expect.any(String), { actorId: actor, requestId: expect.any(String) }, false);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("returns bounded validation errors without internal details", async () => {
    const response = await handleDuctRentalRequest(post("not-json"), ["requests"]);
    expect(response.status).toBe(400); expect(await response.json()).toMatchObject({ code: "PAYLOAD" });
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
