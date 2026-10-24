import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sources = [
  readFileSync(new URL("./page.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("./buildings-workspace.tsx", import.meta.url), "utf8"),
  readFileSync(new URL("./map/page.tsx", import.meta.url), "utf8"),
];

describe("Buildings specialized workspace contract", () => {
  it("keeps canonical screen markers on list and map entry points", () => {
    expect(sources[0]).toContain('data-ui-screen="buildings"');
    expect(sources[1]).toContain('data-ui-screen="buildings"');
    expect(sources[2]).toContain('data-ui-screen="buildings-map"');
  });
});
