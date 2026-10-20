import { describe, expect, it } from "vitest";
import { validatePassword } from "./password-policy";

describe("password policy", () => {
  it("requires the shared complexity policy", () => {
    expect(validatePassword("short").ok).toBe(false);
    expect(validatePassword("long-enough-password").ok).toBe(false);
    expect(validatePassword("Secure-Local-123").ok).toBe(true);
  });

  it("rejects common temporary passwords", () => {
    expect(validatePassword("1234567890Aa!").ok).toBe(true);
    expect(validatePassword("password123").ok).toBe(false);
  });
});
