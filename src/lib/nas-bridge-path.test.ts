import { describe, expect, it } from "vitest";
import { validateNasBridgePath } from "@/lib/nas-bridge-path";

describe("validateNasBridgePath", () => {
  it("encodes safe route segments", () => {
    expect(validateNasBridgePath(["download", "อาคาร 1", "plan.pdf"])).toBe("download/%E0%B8%AD%E0%B8%B2%E0%B8%84%E0%B8%B2%E0%B8%A3%201/plan.pdf");
  });

  it.each([[".."], ["."], ["folder/name"], ["folder\\name"], [""]])("rejects unsafe segments", (...segments) => {
    expect(() => validateNasBridgePath(segments)).toThrow("Invalid NAS bridge path");
  });
});
