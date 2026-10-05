import { and, eq, gte, ilike, inArray, isNull, lt, or, type SQL } from "drizzle-orm";
import { z } from "zod";
import { tasks } from "@/db/schema";
import type { AuthorizationSubject } from "@/lib/authorization";
export const workFilterSchema = z.object({
  q: z.string().trim().max(180).optional(), owner: z.string().uuid().optional(), team: z.string().uuid().optional(),
  status: z.enum(["queued", "in_progress", "blocked", "completed", "cancelled"]).optional(),
  year: z.coerce.number().int().min(2000).max(2200).optional(), month: z.coerce.number().int().min(1).max(12).optional(),
  source: z.enum(["personal", "assigned", "legacy"]).optional(),
});
export type WorkFilters = z.infer<typeof workFilterSchema>;
export function parseWorkFilters(params: Record<string, string | string[] | undefined>): WorkFilters {
  const input = Object.fromEntries(Object.entries(params).filter(([, v]) => typeof v === "string" && v !== ""));
  return workFilterSchema.parse(input);
}
export function workScope(subject: AuthorizationSubject | undefined, permission: string): SQL | undefined {
  if (!subject) return undefined;
  const grants = subject.grants.filter(g => g.permission === permission);
  if (grants.some(g => g.scope === "ALL")) return eq(tasks.ownerId, tasks.ownerId);
  const parts: SQL[] = [];
  if (grants.some(g => g.scope === "OWN")) parts.push(eq(tasks.ownerId, subject.userId));
  const teamIds = new Set(grants.some(g => g.scope === "TEAM") ? subject.teamIds : []);
  grants.forEach(g => { if (g.scope === "SELECTED_TEAMS" && g.selectedTeamId) teamIds.add(g.selectedTeamId); });
  if (teamIds.size) parts.push(inArray(tasks.teamId, [...teamIds]));
  return parts.length ? or(...parts) : undefined;
}
export function taskQueryCondition(subject: AuthorizationSubject | undefined, filters: WorkFilters = {}, permission = "work.task.read") {
  const scope = workScope(subject, permission);
  if (!scope) return undefined;
  const parts = [scope, isNull(tasks.deletedAt)];
  if (filters.owner) parts.push(eq(tasks.ownerId, filters.owner));
  if (filters.team) parts.push(eq(tasks.teamId, filters.team));
  if (filters.status) parts.push(eq(tasks.status, filters.status));
  if (filters.source) parts.push(eq(tasks.sourceKind, filters.source));
  if (filters.q) { const pattern = `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`; parts.push(or(ilike(tasks.jobCode, pattern), ilike(tasks.title, pattern))!); }
  if (filters.year) {
    const month = filters.month ?? 1;
    const from = new Date(Date.UTC(filters.year, month - 1, 1, -7));
    const until = new Date(Date.UTC(filters.year + (filters.month ? 0 : 1), filters.month ? month : 0, 1, -7));
    parts.push(gte(tasks.createdAt, from), lt(tasks.createdAt, until));
  }
  return and(...parts);
}
export function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
