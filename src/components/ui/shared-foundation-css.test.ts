import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/styles/ui.css"), "utf8");
const workCss = readFileSync(resolve(process.cwd(), "src/styles/work.css"), "utf8");
const depositCss = readFileSync(resolve(process.cwd(), "src/app/(platform)/guarantees/deposit.css"), "utf8");
const legacyComponentsCss = readFileSync(resolve(process.cwd(), "src/styles/components.css"), "utf8");

const countOccurrences = (source: string, needle: string) => source.split(needle).length - 1;

describe("shared button interaction states", () => {
  it("applies hover styling only to enabled canonical buttons", () => {
    for (const variant of ["primary", "secondary", "danger", "ghost"]) {
      expect(css).toContain(`.ui-button-${variant}:not(:disabled):hover`);
      expect(css).not.toContain(`.ui-button-${variant}:hover`);
    }
  });

  it("keeps overview metric and table geometry in canonical owners", () => {
    expect(css).toContain(".ui-metric-grid > .ui-metric:is(button)");
    expect(css).toContain(".ui-metric {");
    expect(css).toContain(".ui-metric-grid > .ui-metric:is(button).is-active");
    expect(css).toContain(".ui-table.workspace-queue-table");
    expect(css).toContain(".ui-table.workspace-queue-table th:nth-child(2)");
    expect(legacyComponentsCss).not.toMatch(/\.attention-(?:strip|item)(?:[\s.:,{]|$)/);
    expect(legacyComponentsCss).not.toMatch(/\.workspace-table(?:[\s.:,{]|$)/);
  });

  it("declares the shared table base exactly once", () => {
    expect(countOccurrences(css, ".ui-table-scroll {"), "canonical table scroll owner").toBe(1);
    expect(countOccurrences(css, ".ui-table {"), "canonical table owner").toBe(1);
  });

  it("owns overview header alignment inside the overview scope and wraps only on narrow screens", () => {
    expect(workCss).toContain(".overview-screen > .page-heading .page-heading-row { width:100%; flex-wrap:nowrap; align-items:flex-start; justify-content:space-between; }");
    expect(workCss).toContain(".overview-screen > .page-heading .page-heading-content { flex:1 1 auto; }");
    expect(workCss).toContain(".overview-screen > .page-heading .page-heading-actions { flex:0 0 auto; width:auto; margin-left:auto; align-items:center; }");
    expect(workCss).toContain("@media (max-width: 650px)");
    expect(workCss).toContain(".overview-screen > .page-heading .page-heading-row { align-items:stretch; flex-direction:column; gap:var(--space-3); }");
    expect(workCss).toContain(".overview-screen > .page-heading .page-heading-actions { width:100%; margin-left:0; justify-content:flex-start; }");
    expect(workCss).not.toMatch(/(^|\n)\.page-heading-actions\s*\{[^}]*justify-content/);
  });

  it("preserves queue descendant presentation without changing table-cell layout", () => {
    expect(css).toContain(".ui-table.workspace-queue-table .record-title");
    expect(css).toContain("appearance:none");
    expect(css).toContain(".ui-table.workspace-queue-table .record-subtitle");
    expect(css).toContain(".ui-table.workspace-queue-table .record-code");
    expect(css).toContain(".ui-table.workspace-queue-table .record-source");
    expect(css).toContain(".ui-table.workspace-queue-table .owner-cell > .owner-cell-content");
    expect(css).toContain("display:flex; align-items:center; gap:var(--space-1)");
    expect(css).not.toContain(".ui-table.workspace-queue-table .owner-cell { display:flex");
  });
});

describe("migrated work surfaces keep the shared form card", () => {
  const workCreate = readFileSync(resolve(process.cwd(), "src/components/work-create-form.tsx"), "utf8");
  const assignment = readFileSync(resolve(process.cwd(), "src/features/work/screens/assignment-center.tsx"), "utf8");

  it("removes legacy layout classes from migrated FormSection/FormGrid elements", () => {
    expect(assignment).not.toContain('className="work-form-grid"');
    expect(workCreate).not.toContain('className="work-create-fieldset"');
    expect(workCreate).not.toContain('className="work-create-details-fieldset"');
    expect(workCreate).not.toContain('className="work-create-grid"');
    expect(workCreate).not.toContain('className="work-create-details-grid"');
    expect(workCreate).not.toContain('className="work-create-col-2"');
  });

  it("keeps module CSS from cancelling the shared section card", () => {
    for (const sheet of [workCss, depositCss]) {
      expect(sheet).not.toMatch(/\.ui-form-section\s*\{[\s\S]*?border:\s*0[\s\S]*?\}/);
      expect(sheet).not.toMatch(/\.ui-form-section\s*\{[\s\S]*?background:\s*transparent[\s\S]*?\}/);
    }
  });
});
