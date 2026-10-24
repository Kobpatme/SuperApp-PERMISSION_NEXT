import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WorkFiltersForm } from "./work-filters";

describe("WorkFiltersForm shared presentation", () => {
  it("uses canonical filter and button primitives in workspace mode", () => {
    const html = renderToStaticMarkup(<WorkFiltersForm appearance="workspace" resetHref="/work" />);

    expect(html).toContain("ui-filter");
    expect(html).toContain('class="ui-button ui-button-primary"');
    expect(html).toContain('class="ui-button ui-button-secondary"');
  });
});
