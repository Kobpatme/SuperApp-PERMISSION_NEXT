import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sources = {
  car: readFileSync(new URL("./car-booking/page.tsx", import.meta.url), "utf8"),
  guarantees: readFileSync(new URL("./guarantees/page.tsx", import.meta.url), "utf8"),
  duct: readFileSync(new URL("../../modules/duct-rental/components/request-list.tsx", import.meta.url), "utf8"),
  po: readFileSync(new URL("./po-tracking/page.tsx", import.meta.url), "utf8"),
};

describe("Phase 3 module screen contracts", () => {
  it.each(Object.entries(sources))("marks %s as a canonical UI screen", (_, source) => {
    expect(source).toContain('data-ui-screen=');
  });
});
