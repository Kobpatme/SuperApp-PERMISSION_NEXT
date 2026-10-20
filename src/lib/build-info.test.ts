import { expect, it } from "vitest";
import { normalizeBuildInfo, resolveBuildInfo } from "@/lib/build-info";
const empty = { shortCommit: null, branch: null, builtAt: null };
it("returns null fields for absent or unsafe metadata", () => {
  expect(normalizeBuildInfo({})).toEqual(empty);
  expect(normalizeBuildInfo({ commit: "password", branch: "C:\\private", builtAt: "not a date" })).toEqual(empty);
});
it("prefers explicit values over host and compiled metadata", () => {
  expect(resolveBuildInfo({ APP_COMMIT_SHA: "abcdef1234567890", GITHUB_SHA: "000000012345", APP_BRANCH: "release/test", APP_BUILT_AT: "2026-10-08T01:00:00Z", SECRET: "private" }, empty))
    .toEqual({ shortCommit: "abcdef123456", branch: "release/test", builtAt: "2026-10-08T01:00:00.000Z" });
});
it.each(["VERCEL_GIT_COMMIT_SHA", "CF_PAGES_COMMIT_SHA", "GITHUB_SHA"])("supports %s without assuming a host", key => {
  expect(resolveBuildInfo({ [key]: "abcdef0123456789" }, empty).shortCommit).toBe("abcdef012345");
});
