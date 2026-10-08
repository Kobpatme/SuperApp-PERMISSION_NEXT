import { describe, expect, it } from "vitest";
import type { WorkTaskRecord } from "@/lib/work-read-model";
import { personalWorkOverview } from "@/lib/work-overview";

const now = "2026-10-08T05:00:00Z";
function task(ownerId: string, status: string, weight: string, dueAt = "2026-10-07T05:00:00Z"): WorkTaskRecord {
  return { id: crypto.randomUUID(), title: "Fixture", ownerId, status, kpiWeight: weight, dueAt,
    completedAt: status === "completed" ? dueAt : null, updatedAt: now, description: null,
    statusLabel: status, priority: "normal", ownerName: "Fixture", teamId: null, teamName: "",
    jobCode: null, mainKpi: null, subKpi: null, note: null, version: 1 };
}
describe("personal work overview", () => {
  it("keeps counts and weighted progress personal when an administrator sees other owners", () => {
    const mine = [task("mine", "completed", "0.3"), task("mine", "queued", "0.1"), task("mine", "cancelled", "100")];
    const result = personalWorkOverview({ tasks: [...mine, task("other", "queued", "1000")], generatedAt: now }, "mine");
    expect(result.tasks).toEqual(mine);
    expect(result).toMatchObject({ queued: 1, overdue: 1, completion: 75 });
  });
  it("uses the snapshot clock, excludes finished/cancelled tasks, and keeps a deadline at now on time", () => {
    const tasks = [task("mine", "queued", "1", now), task("mine", "blocked", "1"), task("mine", "completed", "1"), task("mine", "cancelled", "1")];
    expect(personalWorkOverview({ tasks, generatedAt: now }, "mine").overdue).toBe(1);
  });
  it("shows no fabricated progress when the user has no active work", () => {
    expect(personalWorkOverview({ tasks: [task("other", "completed", "1")], generatedAt: now }, "mine")).toMatchObject({ tasks: [], queued: 0, overdue: 0, completion: null });
    expect(personalWorkOverview({ tasks: [task("mine", "cancelled", "1")], generatedAt: now }, "mine").completion).toBeNull();
  });
});
