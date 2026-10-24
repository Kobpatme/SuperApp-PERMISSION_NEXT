import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("Admin shared presentation contract", () => {
  it("marks Admin as a canonical UI screen", () => {
    expect(pageSource).toContain('data-ui-screen="admin"');
  });

  it("uses the canonical ButtonLink for the car-booking action", () => {
    expect(pageSource).toContain('import { ButtonLink } from "@/components/ui/button"');
    expect(pageSource).toContain('<ButtonLink variant="primary"');
  });
});
