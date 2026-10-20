import { describe, expect, it } from "vitest";
import { assertTaskTransition, decodeActivityCursor, encodeActivityCursor, InvalidTaskTransitionError, parseManualWorkEntry } from "@/lib/work-domain";
import { addWorkingDays, applyHoldStatusUpdate, businessDaysBetween, groupTasksByJob, normalizeSourceWorkStatus, toTargetTaskStatus } from "@/lib/work-sla";
import { calculateWeightedWorkReport } from "@/lib/work-report";

describe("work domain", () => {
  it("accepts only explicit forward task transitions", () => {
    expect(() => assertTaskTransition("queued", "in_progress")).not.toThrow();
    expect(() => assertTaskTransition("completed", "in_progress")).toThrow(InvalidTaskTransitionError);
    expect(() => assertTaskTransition("in_progress", "in_progress")).toThrow();
  });
  it("requires a reason and stable idempotency key for manual work", () => {
    const entry = { ownerId: "4b8965d8-26c5-4510-b653-cdf443778324", title: "Site review", description: "Reviewed the building evidence", reason: "Completed outside the platform", occurredAt: "2026-09-04T02:00:00.000Z", idempotencyKey: "manual:u1:20260904:001" };
    expect(parseManualWorkEntry(entry).title).toBe("Site review");
    expect(() => parseManualWorkEntry({ ...entry, reason: "short" })).toThrow();
  });
  it("round-trips and validates feed cursors", () => {
    const cursor = { occurredAt: "2026-09-04T02:00:00.000Z", id: "4b8965d8-26c5-4510-b653-cdf443778324" };
    expect(decodeActivityCursor(encodeActivityCursor(cursor))).toEqual(cursor);
    expect(() => decodeActivityCursor("bad-cursor")).toThrow();
  });

  it("matches source status vocabulary without trusting it for authorization", () => {
    expect(normalizeSourceWorkStatus("on_hold")).toBe("On Hold");
    expect(toTargetTaskStatus("Pending")).toBe("queued");
    expect(toTargetTaskStatus("Completed")).toBe("completed");
  });

  it("skips weekends and active holidays when calculating deadlines", () => {
    const holidays = [{ holidayDate: "2026-05-25", isActive: true }];
    expect(addWorkingDays("2026-05-22", 1, holidays)).toBe("2026-05-26");
    expect(businessDaysBetween("2026-05-22", "2026-05-26", holidays)).toBe(1);
    expect(addWorkingDays("2026-05-22", 1, [{ holidayDate: "2026-05-25", isActive: false }])).toBe("2026-05-25");
  });

  it("extends a deadline by business days spent on hold and records history", () => {
    const result = applyHoldStatusUpdate({ status: "On Hold", deadline: "2026-05-29", extraData: { hold_started_at: "2026-05-22T02:00:00.000Z", hold_deadline_before: "2026-05-29" } }, "On Process", [], "2026-05-26T02:00:00.000Z", "u1");
    expect(result.deadline).toBe("2026-06-02");
    expect((result.extraData?.hold_history as Array<{ businessDays: number }>)[0].businessDays).toBe(2);
    expect(result.extraData?.hold_started_at).toBeUndefined();
  });

  it("groups multiple valid tasks under one job without dropping records", () => {
    const groups = groupTasksByJob([{ id: "1", job: "JOB-7" }, { id: "2", jobCode: "job-7" }, { id: "3", job: "JOB-8" }]);
    expect(groups).toHaveLength(2);
    expect(groups[0].tasks).toHaveLength(2);
    expect(groups.flatMap((group) => group.tasks).map((task) => task.id)).toEqual(["1", "2", "3"]);
  });

  it("matches source weighted completion and SLA semantics", () => {
    expect(calculateWeightedWorkReport([
      { status: "Completed", weight: "2.5", deadline: "2026-09-10", completedAt: "2026-09-10" },
      { status: "Completed", weight: 1, deadline: "2026-09-10", completedAt: "2026-09-11" },
      { status: "Pending", weight: 1 },
      { status: "Cancelled", weight: 9 },
    ])).toEqual({ sla: 71, completion: 78, totalWeight: "4.500000", completedWeight: "3.500000", onTimeWeight: "2.500000", slaWeight: "3.500000", cancelledWeight: "9.000000" });
  });
});
