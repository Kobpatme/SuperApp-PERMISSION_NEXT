import { describe, expect, it, afterEach } from "vitest";
import { getTrustedClientIp } from "./auth-rate-limit";

const originalProxyCount = process.env.TRUSTED_PROXY_COUNT;

afterEach(() => {
  if (originalProxyCount === undefined) delete process.env.TRUSTED_PROXY_COUNT;
  else process.env.TRUSTED_PROXY_COUNT = originalProxyCount;
});

describe("trusted client IP", () => {
  it("does not trust forwarded headers by default", () => {
    delete process.env.TRUSTED_PROXY_COUNT;
    expect(getTrustedClientIp(new Headers({ "x-forwarded-for": "203.0.113.10" }))).toBeUndefined();
  });

  it("selects the client before the configured proxy chain", () => {
    process.env.TRUSTED_PROXY_COUNT = "1";
    expect(getTrustedClientIp(new Headers({ "x-forwarded-for": "203.0.113.10, 10.0.0.5" }))).toBe("203.0.113.10");
  });

  it("rejects malformed addresses", () => {
    process.env.TRUSTED_PROXY_COUNT = "1";
    expect(getTrustedClientIp(new Headers({ "x-forwarded-for": "not-an-ip, 10.0.0.5" }))).toBeUndefined();
  });
});
