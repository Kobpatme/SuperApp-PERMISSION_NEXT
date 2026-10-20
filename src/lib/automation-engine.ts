import { z } from "zod";

const condition = z.object({ path: z.string().regex(/^[A-Za-z0-9_.-]+$/), equals: z.union([z.string(), z.number(), z.boolean(), z.null()]) });
const action = z.discriminatedUnion("type", [
  z.object({ type: z.literal("notification.create"), recipient: z.enum(["actor", "owner", "team_manager"]), title: z.string().min(1).max(180) }),
  z.object({ type: z.literal("task.create"), assignee: z.enum(["actor", "owner", "team_manager"]), title: z.string().min(1).max(180), dueInHours: z.number().int().min(1).max(8760) }),
]);
export const automationRuleSchema = z.object({ id: z.string().uuid(), version: z.number().int().positive(), eventType: z.string().min(3), conditions: z.array(condition).default([]), actions: z.array(action).min(1).max(20) });

function atPath(payload: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((value, part) => value && typeof value === "object" ? (value as Record<string, unknown>)[part] : undefined, payload);
}

export function planAutomation(rawRule: unknown, event: { id: string; eventType: string; payload: Record<string, unknown> }) {
  const rule = automationRuleSchema.parse(rawRule);
  if (rule.eventType !== event.eventType || !rule.conditions.every((item) => atPath(event.payload, item.path) === item.equals)) return null;
  const executionKey = `automation:${rule.id}:v${rule.version}:event:${event.id}`;
  return { executionKey, actions: rule.actions.map((item, index) => ({ ...item, sequence: index + 1, idempotencyKey: `${executionKey}:action:${index + 1}` })) };
}

export function retryDelaySeconds(attempt: number) {
  if (!Number.isInteger(attempt) || attempt < 1) throw new Error("Attempt must be a positive integer");
  return Math.min(3600, 15 * 2 ** Math.min(attempt - 1, 8));
}
