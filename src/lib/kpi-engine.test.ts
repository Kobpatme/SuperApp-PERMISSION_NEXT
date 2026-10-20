import { describe, expect, it } from "vitest";
import { evaluateKpiEvent } from "@/lib/kpi-engine";

const ids = { event: "4b8965d8-26c5-4510-b653-cdf443778324", rule: "1a790be6-5304-4ec9-b26b-4e0915078941", metric: "f70e5fe5-ac17-40d1-8753-ff16ddc7d1af", owner: "651c8dfb-bdc8-47de-bdf4-0f25b155c4f5" };
const event = { id: ids.event, eventType: "work.task.completed.v1", ownerId: ids.owner, occurredAt: new Date("2026-09-04T02:00:00Z"), kpiEligible: true, payload: { quality: { points: "0.10" }, valid: true } };
const baseRule = { id: ids.rule, metricId: ids.metric, eventType: event.eventType, version: 1, calculationVersion: 3, effectiveFrom: "2026-01-01T00:00:00Z", conditions: [{ path: "valid", operator: "eq", value: true }] };

describe("automatic KPI engine", () => {
  it("uses exact decimal arithmetic and records calculation trace", () => {
    const [fact] = evaluateKpiEvent(event, [{ ...baseRule, scoring: { mode: "payload", path: "quality.points", multiplier: "0.20" } }]);
    expect(fact.value).toBe("0.020000");
    expect(fact.calculationVersion).toBe(3);
    expect(fact.trace.ruleVersion).toBe(1);
  });
  it("rejects ineligible, unmatched and ownerless events", () => {
    const rule = { ...baseRule, scoring: { mode: "fixed", value: "1.5" } };
    expect(evaluateKpiEvent({ ...event, kpiEligible: false }, [rule])).toEqual([]);
    expect(evaluateKpiEvent({ ...event, ownerId: null }, [rule])).toEqual([]);
    expect(evaluateKpiEvent({ ...event, payload: { valid: false } }, [rule])).toEqual([]);
  });
  it("caps payload-derived scores deterministically", () => {
    const [fact] = evaluateKpiEvent(event, [{ ...baseRule, scoring: { mode: "payload", path: "quality.points", multiplier: "100", cap: "3" } }]);
    expect(fact.value).toBe("3.000000");
  });
});
