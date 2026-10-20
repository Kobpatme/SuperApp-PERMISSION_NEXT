import { z } from "zod";
import type { ModuleId } from "@/lib/module-registry";

export const dashboardItemKinds = ["task", "building", "guarantee", "approval", "document"] as const;
export const dashboardPriorities = ["urgent", "attention", "normal"] as const;

export type DashboardItem = {
  id: string;
  moduleId: ModuleId;
  kind: (typeof dashboardItemKinds)[number];
  priority: (typeof dashboardPriorities)[number];
  title: string;
  description?: string;
  href: string;
  dueAt?: string;
  statusLabel: string;
  code?: string;
  buildingName?: string;
  ownerId?: string;
  ownerName?: string;
  nextAction?: string;
  updatedAt?: string;
};

export type DashboardSourceStatus = "ready" | "not_configured" | "unavailable";

export type DashboardSource = {
  moduleId: ModuleId;
  status: DashboardSourceStatus;
  itemCount: number;
  message: string;
};

export type DashboardSnapshot = {
  generatedAt: string;
  items: DashboardItem[];
  sources: DashboardSource[];
};

const sourceItemSchema = z.object({
  id: z.string().min(1).max(200),
  kind: z.enum(dashboardItemKinds),
  priority: z.enum(dashboardPriorities).default("normal"),
  title: z.string().min(1).max(240),
  description: z.string().max(500).optional(),
  href: z.string().max(500).refine((value) => /^\/(?!\/)/.test(value) && !/[\\\u0000-\u0020]/.test(value), "Expected a local application link").optional(),
  dueAt: z.string().datetime({ offset: true }).optional(),
  statusLabel: z.string().min(1).max(80),
  code: z.string().max(80).optional(),
  buildingName: z.string().max(240).optional(),
  ownerId: z.string().max(200).optional(),
  ownerName: z.string().max(160).optional(),
  nextAction: z.string().max(500).optional(),
  updatedAt: z.string().datetime({ offset: true }).optional(),
});

export const dashboardSourcePayloadSchema = z.object({
  items: z.array(sourceItemSchema).max(500),
});

export function orderDashboardItems(items: DashboardItem[]) {
  const priorityOrder = { urgent: 0, attention: 1, normal: 2 } as const;
  return [...items].sort((a, b) => {
    const priority = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priority) return priority;
    if (a.dueAt && b.dueAt) return Date.parse(a.dueAt) - Date.parse(b.dueAt);
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return a.title.localeCompare(b.title, "th");
  });
}
