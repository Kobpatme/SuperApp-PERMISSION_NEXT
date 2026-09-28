import { describe, expect, it } from "vitest";
import { assertTaskTransition, decodeActivityCursor, encodeActivityCursor, InvalidTaskTransitionError, parseManualWorkEntry } from "@/lib/work-domain";

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
});
