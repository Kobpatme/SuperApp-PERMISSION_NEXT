import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tasks, profiles } from "@/db/schema";
import type { AccessContext } from "./access";
import { taskQueryCondition } from "./work-query";
import { presentWorkStatus } from "./work-presentation";
import type { DashboardItem } from "./dashboard";
export async function readWorkQueue(access: AccessContext, query?: string): Promise<DashboardItem[]> {
  const scope = taskQueryCondition(access.subject, query ? { q: query.slice(0, 180) } : {});
  if (!access.allowed || !scope) return [];
  const rows = await getDb().select({ id: tasks.id, title: tasks.title, jobCode: tasks.jobCode, status: tasks.status, priority: tasks.priority, dueAt: tasks.dueAt, updatedAt: tasks.updatedAt, ownerId: tasks.ownerId, ownerName: profiles.displayName }).from(tasks).leftJoin(profiles, eq(profiles.id, tasks.ownerId)).where(scope).orderBy(desc(tasks.updatedAt), desc(tasks.id)).limit(query ? 20 : 500);
  return rows.map(row => ({ id: row.id, moduleId: "work", kind: "task", title: row.title, code: row.jobCode ?? undefined, href: `/work?record=${row.id}`, statusLabel: presentWorkStatus(row.status).label, priority: row.priority === "urgent" ? "urgent" : row.priority === "high" || row.status === "blocked" ? "attention" : "normal", dueAt: row.dueAt?.toISOString(), updatedAt: row.updatedAt.toISOString(), ownerId: row.ownerId, ownerName: row.ownerName ?? undefined }));
}
