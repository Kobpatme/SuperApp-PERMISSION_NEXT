import { describe, expect, it } from "vitest";
import { EXTREME_AMOUNT, EXTREME_LONG_EMAIL, EXTREME_THAI_NAME, extremeUiFixture } from "@/lib/ui-fixtures";

describe("extreme UI fixtures", () => {
  it("keeps the required long Thai name, unbroken email, and nine-digit amount", () => {
    expect(EXTREME_THAI_NAME.length).toBeGreaterThanOrEqual(80);
    expect(EXTREME_LONG_EMAIL.length).toBeGreaterThanOrEqual(60);
    expect(EXTREME_LONG_EMAIL).not.toMatch(/\s/);
    expect(EXTREME_AMOUNT).toBeGreaterThanOrEqual(100_000_000);
    expect(extremeUiFixture.amountLabel).toContain("123,456,789");
  });
});
