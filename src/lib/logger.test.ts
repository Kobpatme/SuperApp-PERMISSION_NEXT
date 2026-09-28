import { describe, expect, it } from "vitest";
import { redactForLog } from "@/lib/logger";

describe("structured log redaction", () => {
  it("redacts secrets recursively without removing operational context", () => {
    expect(redactForLog({ requestId: "r1", authorization: "Bearer x", nested: { apiKey: "x", count: 2 } })).toEqual({ requestId: "r1", authorization: "[REDACTED]", nested: { apiKey: "[REDACTED]", count: 2 } });
  });
});
