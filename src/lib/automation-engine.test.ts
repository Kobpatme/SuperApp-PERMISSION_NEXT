import { describe, expect, it } from "vitest";
import { planAutomation, retryDelaySeconds } from "@/lib/automation-engine";

const rule = { id: "4b8965d8-26c5-4510-b653-cdf443778324", version: 2, eventType: "guarantee.refund.requested.v1", conditions: [{ path: "urgent", equals: true }], actions: [{ type: "notification.create", recipient: "team_manager", title: "ตรวจคำขอคืนเงิน" }] };
describe("automation planning", () => {
  it("creates deterministic execution and action keys", () => {
    const plan = planAutomation(rule, { id: "evt-1", eventType: rule.eventType, payload: { urgent: true } });
    expect(plan?.executionKey).toContain(":v2:event:evt-1");
    expect(plan?.actions[0].idempotencyKey).toContain(":action:1");
  });
  it("does not run unmatched rules", () => expect(planAutomation(rule, { id: "evt-1", eventType: rule.eventType, payload: { urgent: false } })).toBeNull());
  it("uses capped exponential retry", () => {
    expect(retryDelaySeconds(1)).toBe(15); expect(retryDelaySeconds(4)).toBe(120); expect(retryDelaySeconds(99)).toBe(3600);
  });
});
