import { afterEach, describe, expect, it, vi } from "vitest";

const { getCurrentUser } = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));

vi.mock("@/lib/auth", () => ({ getCurrentUser, getSessionFailureReason: async () => "expired" }));

import { requireApiIdentity } from "@/lib/request-context";

afterEach(() => getCurrentUser.mockReset());

describe("requireApiIdentity", () => {
  it("returns a JSON 401 response when there is no session", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await requireApiIdentity();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      expect(await result.response.json()).toEqual({ code: "AUTHENTICATION_REQUIRED", error: "Authentication required" });
    }
  });

  it("blocks temporary-password sessions with a JSON 403 response", async () => {
    getCurrentUser.mockResolvedValue({ id: "user-1", mustChangePassword: true });
    const result = await requireApiIdentity();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
      expect(await result.response.json()).toEqual({ code: "PASSWORD_CHANGE_REQUIRED", error: "Password change required" });
    }
  });

  it("returns the authenticated user after the password requirement is cleared", async () => {
    const user = { id: "user-1", mustChangePassword: false };
    getCurrentUser.mockResolvedValue(user);
    const result = await requireApiIdentity();
    expect(result).toEqual({ ok: true, user });
  });
});
