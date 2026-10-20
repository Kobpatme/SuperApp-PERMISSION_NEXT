import { describe, expect, it } from "vitest";
import { filterQueue, matchesQuery, readViewSettings } from "@/lib/workspace-view";
import type { DashboardItem } from "@/lib/dashboard";

const items: DashboardItem[] = [
  { id: "one", code: "BLD-001", moduleId: "buildings", kind: "building", priority: "urgent", title: "ตรวจอาคาร", buildingName: "อาคารอรุณ", ownerId: "me", ownerName: "ฉัน", href: "/buildings", statusLabel: "รอตรวจสอบ", dueAt: "2026-09-08T03:00:00+00:00" },
  { id: "two", code: "BLD-002", moduleId: "buildings", kind: "building", priority: "normal", title: "เอกสารราคา", buildingName: "อาคารเหนือ", ownerId: "team", ownerName: "ทีมอาคาร", href: "/buildings", statusLabel: "รอเอกสาร", dueAt: "2026-09-10T03:00:00+00:00" },
];

describe("workspace queue views", () => {
  it("reads only supported URL view values", () => {
    expect(readViewSettings(new URLSearchParams("view=urgent&sort=due&q=อาคาร")).view).toBe("urgent");
    expect(readViewSettings(new URLSearchParams("view=bad&sort=bad")).view).toBe("all");
  });

  it("matches Thai search across code, building, and owner fields", () => {
    expect(matchesQuery(items[0], "BLD-001")).toBe(true);
    expect(matchesQuery(items[0], "อรุณ")).toBe(true);
    expect(matchesQuery(items[1], "อรุณ")).toBe(false);
  });

  it("filters mine and sorts urgent work first", () => {
    const result = filterQueue(items, { query: "", view: "mine", status: "", sort: "priority" }, "me", "2026-09-08T08:00:00+07:00");
    expect(result.map((item) => item.id)).toEqual(["one"]);
  });
});
