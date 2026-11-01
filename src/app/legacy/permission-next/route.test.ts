import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAccessContext } = vi.hoisted(() => ({
  getAccessContext: vi.fn(),
}));

vi.mock("@/lib/access", () => ({ getAccessContext }));

import { GET } from "./route";

describe("archived Permission Next route boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NODE_ENV", "development");
  });

  it("is unavailable in production without checking access", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = await GET();

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not found");
    expect(getAccessContext).not.toHaveBeenCalled();
  });

  it("rejects callers without buildings access", async () => {
    getAccessContext.mockResolvedValue({ allowed: false });

    const response = await GET();

    expect(response.status).toBe(403);
    expect(await response.text()).toBe("Forbidden");
    expect(getAccessContext).toHaveBeenCalledWith("buildings");
  });

  it("serves only the archived static placeholder to authorized development callers", async () => {
    getAccessContext.mockResolvedValue({ allowed: true });

    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("Permission Next — ต้นแบบอ้างอิง (เก็บถาวร)");
    expect(body).not.toContain("__SUPER_APP_SESSION__");
    expect(body).not.toContain("<script");
  });
});
