import Decimal from "decimal.js";
import { z } from "zod";

const conditionSchema = z.object({ path: z.string().regex(/^[A-Za-z0-9_.-]+$/), operator: z.enum(["eq", "neq", "in", "exists"]), value: z.unknown().optional() });
export const kpiRuleSchema = z.object({
  id: z.string().uuid(), metricId: z.string().uuid(), eventType: z.string().min(3), version: z.number().int().positive(), calculationVersion: z.number().int().positive(),
  effectiveFrom: z.coerce.date(), effectiveUntil: z.coerce.date().optional().nullable(),
  conditions: z.array(conditionSchema).default([]), scoring: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("fixed"), value: z.string().regex(/^-?\d+(\.\d+)?$/) }),
    z.object({ mode: z.literal("payload"), path: z.string(), multiplier: z.string().regex(/^-?\d+(\.\d+)?$/).default("1"), cap: z.string().regex(/^\d+(\.\d+)?$/).optional() }),
  ]),
});

export type KpiRule = z.infer<typeof kpiRuleSchema>;
export type KpiEvent = { id: string; eventType: string; ownerId?: string | null; teamId?: string | null; occurredAt: Date; kpiEligible: boolean; payload: Record<string, unknown> };

function atPath(payload: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((value, part) => value && typeof value === "object" ? (value as Record<string, unknown>)[part] : undefined, payload);
}

function matches(event: KpiEvent, rule: KpiRule) {
  if (!event.kpiEligible || event.eventType !== rule.eventType || event.occurredAt < rule.effectiveFrom || (rule.effectiveUntil && event.occurredAt >= rule.effectiveUntil)) return false;
  return rule.conditions.every((condition) => {
    const actual = atPath(event.payload, condition.path);
    if (condition.operator === "exists") return actual !== undefined && actual !== null;
    if (condition.operator === "eq") return actual === condition.value;
    if (condition.operator === "neq") return actual !== condition.value;
    return Array.isArray(condition.value) && condition.value.includes(actual);
  });
}

export function evaluateKpiEvent(rawEvent: KpiEvent, rawRules: unknown[]) {
  if (!rawEvent.ownerId) return [];
  return rawRules.map((raw) => kpiRuleSchema.parse(raw)).filter((rule) => matches(rawEvent, rule)).map((rule) => {
    let score: Decimal;
    if (rule.scoring.mode === "fixed") score = new Decimal(rule.scoring.value);
    else {
      const rawValue = atPath(rawEvent.payload, rule.scoring.path);
      if (typeof rawValue !== "string" && typeof rawValue !== "number") throw new Error(`KPI payload value missing: ${rule.scoring.path}`);
      score = new Decimal(String(rawValue)).mul(rule.scoring.multiplier);
      if (rule.scoring.cap) score = Decimal.min(score, new Decimal(rule.scoring.cap));
    }
    return { activityEventId: rawEvent.id, ruleVersionId: rule.id, metricId: rule.metricId, ownerId: rawEvent.ownerId!, teamId: rawEvent.teamId ?? null, value: score.toFixed(6), calculationVersion: rule.calculationVersion, occurredAt: rawEvent.occurredAt, trace: { eventType: rawEvent.eventType, ruleVersion: rule.version, scoring: rule.scoring } };
  });
}
