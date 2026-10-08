import type { WorkReadModel } from "@/lib/work-read-model";
import { calculateWeightedWorkReport } from "@/lib/work-report";

/** Keep personal counters consistent even when the caller can read other owners. */
export function personalWorkOverview(model: Pick<WorkReadModel, "tasks" | "generatedAt">, userId: string) {
  const tasks = model.tasks.filter((task) => task.ownerId === userId);
  const now = Date.parse(model.generatedAt);
  const weightedReport = calculateWeightedWorkReport(tasks.map((task) => ({
    status: task.status, weight: task.kpiWeight, deadline: task.dueAt, completedAt: task.completedAt,
  })));
  return {
    tasks,
    queued: tasks.filter((task) => task.status === "queued").length,
    overdue: tasks.filter((task) => task.dueAt && Date.parse(task.dueAt) < now && !["completed", "cancelled"].includes(task.status)).length,
    completion: weightedReport.completion,
  };
}
