import { describe, expect, it } from "vitest";
import { dashboardSourcePayloadSchema, orderDashboardItems, type DashboardItem } from "@/lib/dashboard";

describe("dashboard integration contract", () => {
  it("rejects unsafe external links and unknown states", () => {
    expect(() => dashboardSourcePayloadSchema.parse({ items: [{ id: "1", kind: "task", priority: "unknown", title: "Task", href: "https://outside.example", statusLabel: "Pending" }] })).toThrow();
  });

  it("limits source payloads to 500 items", () => {
    const item = { id: "1", kind: "task", title: "Task", statusLabel: "Pending" };
    expect(() => dashboardSourcePayloadSchema.parse({ items: Array.from({ length: 501 }, (_, index) => ({ ...item, id: String(index) })) })).toThrow();
  });

  it("orders urgent and dated work first", () => {
    const base = { moduleId: "work", kind: "task", href: "/work", statusLabel: "Pending" } as const;
    const items: DashboardItem[] = [
      { ...base, id: "normal", title: "Normal", priority: "normal" },
      { ...base, id: "later", title: "Later", priority: "urgent", dueAt: "2026-08-13T09:00:00+07:00" },
      { ...base, id: "earlier", title: "Earlier", priority: "urgent", dueAt: "2026-08-12T09:00:00+07:00" },
    ];
    expect(orderDashboardItems(items).map((item) => item.id)).toEqual(["earlier", "later", "normal"]);
  });
});
