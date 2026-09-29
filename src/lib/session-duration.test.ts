import { describe, expect, it } from "vitest";
import { getIdleDurationMs, getSessionDurationMs } from "./session-duration";

describe("session duration configuration", () => {
  it("applies the default unit conversion", () => {
    expect(getSessionDurationMs({})).toBe(12 * 60 * 60 * 1000);
    expect(getIdleDurationMs({})).toBe(30 * 60 * 1000);
  });

  it("applies configured hours and minutes", () => {
    expect(getSessionDurationMs({ AUTH_ABSOLUTE_TIMEOUT_HOURS: "8" })).toBe(8 * 60 * 60 * 1000);
    expect(getIdleDurationMs({ AUTH_IDLE_TIMEOUT_MINUTES: "15" })).toBe(15 * 60 * 1000);
  });
});
