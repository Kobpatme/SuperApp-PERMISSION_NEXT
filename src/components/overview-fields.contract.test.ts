import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("overview field skin", () => {
  it("keeps queue search compound and opts normal popup fields in", () => {
    const queue = read("src/components/workspace-queue.tsx");
    expect(queue).toContain('className="queue-search shell-compound-field"');
    expect(queue).toContain('className="ui-building-field" id="saved-view-name"');
    expect(queue.match(/<select className="ui-building-field"/g)).toHaveLength(2);
    expect(queue).not.toMatch(/<input[^>]*type="checkbox"[^>]*ui-building-field/);
  });

  it("does not override the compound search skin in overview", () => {
    const css = read("src/components/overview.module.css");
    const rule = css.match(/\.screen :global\(\.queue-search\)\s*\{([^}]*)\}/)?.[1];
    expect(rule).toBeDefined();
    expect(rule).not.toMatch(/background|border|box-shadow|padding/);
  });
});
