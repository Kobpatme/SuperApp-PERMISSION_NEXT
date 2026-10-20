import Decimal from "decimal.js";
import { normalizeSourceWorkStatus } from "@/lib/work-sla";

export type WorkReportTask = {
  status: string;
  weight?: string | number | null;
  kpiEffectiveWeight?: string | number | null;
  deadline?: string | Date | null;
  completedAt?: string | Date | null;
};

export type WeightedWorkReport = {
  sla: number | null;
  completion: number | null;
  totalWeight: string;
  completedWeight: string;
  onTimeWeight: string;
  slaWeight: string;
  cancelledWeight: string;
};

function weightOf(task: WorkReportTask) {
  const raw = task.kpiEffectiveWeight ?? task.weight ?? 1;
  const value = new Decimal(String(raw).replace("%", "").trim());
  return value.isFinite() && value.gt(0) ? value : new Decimal(1);
}

function onTime(task: WorkReportTask) {
  if (!task.deadline || !task.completedAt) return false;
  const deadline = new Date(task.deadline).getTime();
  const completedAt = new Date(task.completedAt).getTime();
  return Number.isFinite(deadline) && Number.isFinite(completedAt) && completedAt <= deadline;
}

function roundedPercent(numerator: Decimal, denominator: Decimal) {
  return denominator.gt(0) ? numerator.div(denominator).mul(100).toDecimalPlaces(0).toNumber() : null;
}

/** Source-compatible weighted completion/SLA report, with exact decimal accumulation. */
export function calculateWeightedWorkReport(tasks: readonly WorkReportTask[]): WeightedWorkReport {
  let totalWeight = new Decimal(0);
  let completedWeight = new Decimal(0);
  let onTimeWeight = new Decimal(0);
  let cancelledWeight = new Decimal(0);
  for (const task of tasks) {
    const weight = weightOf(task);
    const status = normalizeSourceWorkStatus(task.status);
    if (status === "Cancelled") {
      cancelledWeight = cancelledWeight.add(weight);
      continue;
    }
    totalWeight = totalWeight.add(weight);
    if (status === "Completed") {
      completedWeight = completedWeight.add(weight);
      if (onTime(task)) onTimeWeight = onTimeWeight.add(weight);
    }
  }
  return {
    sla: roundedPercent(onTimeWeight, completedWeight),
    completion: roundedPercent(completedWeight, totalWeight),
    totalWeight: totalWeight.toFixed(6),
    completedWeight: completedWeight.toFixed(6),
    onTimeWeight: onTimeWeight.toFixed(6),
    slaWeight: completedWeight.toFixed(6),
    cancelledWeight: cancelledWeight.toFixed(6),
  };
}
