import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const files = ["car-booking-workspace.tsx", "car-access-workspace.tsx", "car-calendar.tsx", "car-journey-map.tsx", "car-reports.tsx"];

describe("car booking field opt-in", () => {
  it.each(files)("opts normal controls in without changing special controls in %s", file => {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    const controls = source.match(/<(?:input|select|textarea)\b[^>]*/g) ?? [];
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      if (/type="(?:checkbox|radio|file|hidden)"/.test(control)) expect(control).not.toContain('className="ui-building-field"');
      else expect(control).toContain('className="ui-building-field"');
    }
  });
});
