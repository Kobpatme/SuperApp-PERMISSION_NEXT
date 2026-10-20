import { expect, it } from "vitest";
import { safeNotificationHref } from "@/lib/notification-policy";
it("keeps notification deep links local", () => {
  expect(safeNotificationHref("/work?view=mine")).toBe("/work?view=mine");
  for (const href of ["//example.org", "/\\example.org", "https://example.org", "javascript:alert(1)", "/\nexample", null]) expect(safeNotificationHref(href)).toBeNull();
});
