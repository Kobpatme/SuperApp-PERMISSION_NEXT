import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workFilters = readFileSync(resolve(process.cwd(), "src/features/work/components/work-filters.tsx"), "utf8");
const adminPanels = readFileSync(resolve(process.cwd(), "src/features/work/components/admin-panels.tsx"), "utf8");
const jobTracker = readFileSync(resolve(process.cwd(), "src/features/work/screens/job-tracker.tsx"), "utf8");
const myTasksWorkspace = readFileSync(resolve(process.cwd(), "src/features/work/screens/my-tasks-workspace.tsx"), "utf8");
const taskActions = readFileSync(resolve(process.cwd(), "src/features/work/components/task-actions.tsx"), "utf8");
const workCss = readFileSync(resolve(process.cwd(), "src/styles/work.css"), "utf8");

const surfaces = [workFilters, adminPanels, jobTracker, myTasksWorkspace, taskActions];

// Legacy layout classes that cancel the shared FormSection/FormGrid card and must never
// be applied to a FormSection or FormGrid element.
const legacyLayoutClasses = [
  "work-form-grid",
  "work-create-fieldset",
  "work-create-details-fieldset",
  "work-create-grid",
  "work-create-details-grid",
  "work-create-col-2",
];

describe("Wave 2b work surfaces style contract", () => {
  it("keeps legacy layout classes off FormSection/FormGrid and keeps work.css from cancelling the shared section card", () => {
    for (const source of surfaces) {
      for (const cls of legacyLayoutClasses) {
        expect(source).not.toContain(`className="${cls}"`);
      }
    }
    // No surviving rule in work.css may cancel the shared .ui-form-section card.
    expect(workCss).not.toMatch(/\.ui-form-section\s*\{[\s\S]*?border:\s*0[\s\S]*?\}/);
    expect(workCss).not.toMatch(/\.ui-form-section\s*\{[\s\S]*?background:\s*transparent[\s\S]*?\}/);
    // .work-form-grid has no remaining consumer; its rule must be fully gone.
    expect(workCss).not.toContain(".work-form-grid {");
    expect(workCss).not.toMatch(/\.work-form-grid\s*,/);
  });
});
