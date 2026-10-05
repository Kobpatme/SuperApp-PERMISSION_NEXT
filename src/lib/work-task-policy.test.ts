import { describe, expect, it } from "vitest";
import { assertWorkCommand, taskCapabilities, workCommandSchema } from "@/lib/work-task-policy";
import { taskStatuses } from "@/lib/work-domain";
import type { AuthorizationSubject } from "@/lib/authorization";
const userId = "00000000-0000-4000-8000-000000000001";
const teamId = "00000000-0000-4000-8000-000000000002";
const actor: AuthorizationSubject = { userId, teamIds: [teamId], grants: ["work.task.update", "work.note.create"].map(permission => ({ permission, scope: "OWN" })) };
const base = { taskId: userId, expectedVersion: 1, idempotencyKey: "fixture-command-key" };
const task = { ownerId: userId, teamId, status: "in_progress" };
describe("source task policy", () => {
  it("exhaustively validates all 25 status pairs", () => {
    const valid = ["queued:in_progress", "queued:cancelled", "in_progress:blocked", "in_progress:completed", "in_progress:cancelled", "blocked:in_progress", "blocked:cancelled"];
    for (const from of taskStatuses) for (const to of taskStatuses) {
      const run = () => assertWorkCommand(actor, { ...task, status: from }, { ...base, kind: "transition", toStatus: to, reason: "เหตุผล" });
      if (valid.includes(`${from}:${to}`)) expect(run).not.toThrow(); else expect(run).toThrow();
    }
  });
  it("allows completed notes and prevents cancelled notes and terminal staff edits", () => {
    expect(taskCapabilities(actor, { ...task, status: "completed" }).note).toBe(true);
    expect(taskCapabilities(actor, { ...task, status: "cancelled" }).note).toBe(false);
    expect(taskCapabilities(actor, { ...task, status: "completed" }).edit).toBe(false);
  });
  it("does not let a team manager accept another owner's queued task", () => {
    const manager: AuthorizationSubject = { ...actor, userId: teamId, grants: [{ permission: "work.task.update", scope: "TEAM" }] };
    expect(() => assertWorkCommand(manager, { ...task, status: "queued" }, { ...base, kind: "transition", toStatus: "in_progress", reason: "รับแทน" })).toThrow("ACCEPT_OWNER_ONLY");
  });
  it("requires reason for hold/cancellation and denies a different team", () => {
    expect(() => assertWorkCommand(actor, task, { ...base, kind: "transition", toStatus: "blocked", reason: "" })).toThrow("REASON_REQUIRED");
    const teamActor: AuthorizationSubject = { ...actor, grants: [{ permission: "work.task.update", scope: "TEAM" }] };
    expect(() => assertWorkCommand(teamActor, { ...task, teamId: userId }, { ...base, kind: "transition", toStatus: "completed", reason: "" })).toThrow();
  });
  it("replay still checks current authorization and rejects invalid versions", () => {
    expect(() => assertWorkCommand({ ...actor, grants: [] }, task, { ...base, kind: "note", body: "บันทึก" }, true)).toThrow();
    expect(workCommandSchema.safeParse({ ...base, expectedVersion: 0, kind: "note", body: "บันทึก" }).success).toBe(false);
  });
});
