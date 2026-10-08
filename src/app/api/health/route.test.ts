import { afterEach, expect, it, vi } from "vitest";
const execute = vi.hoisted(() => vi.fn());
vi.mock("@/db", () => ({ getDb: () => ({ execute }) }));
vi.mock("@/generated/build-info.json", () => ({ default: { shortCommit: null, branch: null, builtAt: null } }));
import { GET } from "./route";
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
it("returns public null build fields without environment details", async () => {
  vi.stubEnv("DATABASE_URL", undefined); vi.stubEnv("NODE_ENV", "test");
  for (const key of ["APP_COMMIT_SHA", "APP_BRANCH", "APP_BUILT_AT", "VERCEL_GIT_COMMIT_SHA", "CF_PAGES_COMMIT_SHA", "GITHUB_SHA", "VERCEL_GIT_COMMIT_REF", "CF_PAGES_BRANCH", "GITHUB_HEAD_REF", "GITHUB_REF_NAME"]) vi.stubEnv(key, undefined);
  vi.stubEnv("PRIVATE_SECRET", "must-not-leak");
  const response = await GET(), body = await response.json();
  expect(response.status).toBe(200); expect(body.build).toEqual({ shortCommit: null, branch: null, builtAt: null });
  expect(JSON.stringify(body)).not.toContain("must-not-leak"); expect(response.headers.get("cache-control")).toBe("no-store");
});
it("preserves degraded status while exposing only the allowed build keys", async () => {
  vi.stubEnv("DATABASE_URL", "postgres://fixture.invalid/fixture"); vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("APP_COMMIT_SHA", "abcdef1234567890"); execute.mockRejectedValue(new Error("private connection details"));
  const response = await GET(), body = await response.json();
  expect(response.status).toBe(503); expect(body.status).toBe("degraded");
  expect(Object.keys(body.build)).toEqual(["shortCommit", "branch", "builtAt"]); expect(body.build.shortCommit).toBe("abcdef123456");
  expect(JSON.stringify(body)).not.toContain("private connection details");
});
