import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/styles/ui.css"), "utf8");
const legacyComponentsCss = readFileSync(resolve(process.cwd(), "src/styles/components.css"), "utf8");

describe("shared button interaction states", () => {
  it("applies hover styling only to enabled canonical buttons", () => {
    for (const variant of ["primary", "secondary", "danger", "ghost"]) {
      expect(css).toContain(`.ui-button-${variant}:not(:disabled):hover`);
      expect(css).not.toContain(`.ui-button-${variant}:hover`);
    }
  });

  it("keeps metric primitive ownership out of the legacy component stylesheet", () => {
    expect(legacyComponentsCss).not.toMatch(/\.work-metric(?:-strip)?(?:[\s.:,{]|$)/);
    expect(css).toContain(".ui-metric-grid");
    expect(css).toContain(".ui-metric {");
  });
});
