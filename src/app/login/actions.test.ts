import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ account: undefined as undefined | Record<string, unknown>, verify: vi.fn(), audit: vi.fn(), failure: vi.fn(), clear: vi.fn(), session: vi.fn(), limit: vi.fn(), update: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`); } }));
vi.mock("@node-rs/argon2", () => ({ verify: mocks.verify, hash: vi.fn() }));
vi.mock("@/lib/auth", () => ({ createSession: mocks.session, destroySession: vi.fn(), getCurrentUser: vi.fn() }));
vi.mock("@/lib/auth-rate-limit", () => ({ getLoginRateLimit: mocks.limit, recordLoginFailure: mocks.failure, clearLoginRateLimit: mocks.clear, getTrustedClientIp: () => undefined }));
vi.mock("@/lib/audit-log", () => ({ writeAuditLog: mocks.audit }));
vi.mock("@/db", () => ({ getDb: () => ({
  select: () => ({ from: () => ({ innerJoin: () => ({ where: () => ({ limit: async () => mocks.account ? [mocks.account] : [] }) }) }) }),
  update: () => ({ set: (values: unknown) => { mocks.update(values); return { where: async () => undefined }; } }),
}) }));
import { loginAction } from "./actions";

function form() { const data = new FormData(); data.set("email", "fixture@example.test"); data.set("password", "FixtureWrong123!"); data.set("next", "/work"); return data; }
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("DATABASE_URL", "postgres://fixture/fixture"); mocks.account = undefined;
  mocks.limit.mockResolvedValue({ blocked: false, retryAfterSeconds: 0 }); mocks.verify.mockResolvedValue(false);
});
describe("login security branches", () => {
  it("verifies a dummy hash and audits unknown accounts without returning a password", async () => {
    const result = await loginAction({}, form());
    expect(result.error).toBe("อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชียังไม่พร้อมใช้งาน");
    expect(mocks.verify).toHaveBeenCalledOnce(); expect(mocks.verify.mock.calls[0][0]).toMatch(/^\$argon2id/);
    expect(mocks.failure).toHaveBeenCalledOnce(); expect(mocks.audit.mock.calls[0][0].metadata.reason).toBe("invalid_credentials");
    expect(JSON.stringify(result)).not.toContain("FixtureWrong123!"); expect(result).not.toHaveProperty("password");
  });
  it.each(["suspended", "locked", "wrong-password"])("keeps generic errors and audit for %s", async (scenario) => {
    mocks.account = { id: "fixture-id", status: scenario === "suspended" ? "suspended" : "active", passwordHash: "fixture-hash", failedAttempts: 0, lockedUntil: scenario === "locked" ? new Date(Date.now() + 60000) : null };
    expect((await loginAction({}, form())).error).toBe("อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชียังไม่พร้อมใช้งาน");
    expect(mocks.verify).toHaveBeenCalledOnce(); expect(mocks.audit).toHaveBeenCalledOnce(); expect(mocks.session).not.toHaveBeenCalled();
  });
  it("resets an expired lock before counting the new failure", async () => {
    mocks.account = { id: "fixture-id", status: "active", passwordHash: "fixture-hash", failedAttempts: 5, lockedUntil: new Date(Date.now() - 1000) };
    await loginAction({}, form()); expect(mocks.update.mock.calls[0][0]).toMatchObject({ failedAttempts: 0, lockedUntil: null });
    expect(mocks.audit.mock.calls[0][0].action).toBe("auth.login.failure");
  });
  it("returns identical limiter feedback for known and unknown emails without looking up accounts", async () => {
    mocks.limit.mockResolvedValue({ blocked: true, retryAfterSeconds: 61 });
    const unknown = await loginAction({}, form());
    mocks.account = { id: "fixture-id", status: "active" };
    const known = await loginAction({}, form());
    expect(known).toEqual(unknown); expect(known.error).toContain("2 นาที");
    expect(known.email).toBe("fixture@example.test"); expect(mocks.verify).not.toHaveBeenCalled(); expect(mocks.audit).toHaveBeenCalledTimes(2);
  });
  it("audits and creates a session before safe redirect", async () => {
    mocks.account = { id: "fixture-id", status: "active", passwordHash: "fixture-hash", failedAttempts: 0, lockedUntil: null };
    mocks.verify.mockResolvedValue(true);
    await expect(loginAction({}, form())).rejects.toThrow("REDIRECT:/work");
    expect(mocks.audit.mock.calls[0][0].action).toBe("auth.login.success"); expect(mocks.session).toHaveBeenCalledOnce();
  });
});
