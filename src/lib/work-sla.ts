import { z } from "zod";

/** Source-compatible date-only holiday row. Dates are interpreted in Asia/Bangkok. */
export const workHolidaySchema = z.object({
  holidayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isActive: z.boolean().default(true),
});
export type WorkHoliday = z.infer<typeof workHolidaySchema>;

export const sourceWorkStatuses = ["Pending", "On Process", "On Hold", "Completed", "Cancelled"] as const;
export type SourceWorkStatus = (typeof sourceWorkStatuses)[number];

const sourceToTarget: Record<SourceWorkStatus, "queued" | "in_progress" | "blocked" | "completed" | "cancelled"> = {
  Pending: "queued",
  "On Process": "in_progress",
  "On Hold": "blocked",
  Completed: "completed",
  Cancelled: "cancelled",
};
const targetToSource = Object.fromEntries(Object.entries(sourceToTarget).map(([source, target]) => [target, source])) as Record<
  (typeof sourceToTarget)[SourceWorkStatus], SourceWorkStatus
>;

function statusKey(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export function normalizeSourceWorkStatus(value: unknown, fallback: SourceWorkStatus = "Pending"): SourceWorkStatus {
  const key = statusKey(value || fallback);
  const match = sourceWorkStatuses.find((status) => statusKey(status) === key);
  return match ?? fallback;
}

export function toTargetTaskStatus(value: unknown) {
  return sourceToTarget[normalizeSourceWorkStatus(value)];
}

export function toSourceWorkStatus(value: string) {
  return targetToSource[value as keyof typeof targetToSource] ?? normalizeSourceWorkStatus(value);
}

export function bangkokDateKey(value: string | Date | undefined | null = new Date()) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim();
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date).map((part) => [part.type, part.value]));
  return parts.year && parts.month && parts.day ? `${parts.year}-${parts.month}-${parts.day}` : date.toISOString().slice(0, 10);
}

function dateFromKey(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if(!match) return null;
  const date=new Date(Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3])));
  return date.toISOString().slice(0,10)===value ? date:null;
}

function keyFromDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function activeHolidayDates(holidays: readonly WorkHoliday[]) {
  return new Set(holidays.filter((holiday) => holiday.isActive).map((holiday) => holiday.holidayDate));
}

/** Matches maxiwa_KPI: start date is not counted; weekends and active holidays are skipped. */
export function addWorkingDays(startDate: string | Date | undefined | null, days: number, holidays: readonly WorkHoliday[] = []) {
  if(!Number.isInteger(days)||days<0||days>10000)throw new Error("Invalid working day count");
  const start = dateFromKey(bangkokDateKey(startDate));
  if (!start) throw new Error("Invalid work start date");
  const holidaySet = activeHolidayDates(holidays);
  const date = new Date(start);
  let remaining = Math.max(0, Number(days || 0));
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6 && !holidaySet.has(keyFromDate(date))) remaining -= 1;
  }
  return keyFromDate(date);
}

/** Counts dates after start through end, with a negative result for reverse ranges. */
export function businessDaysBetween(startValue: string | Date, endValue: string | Date, holidays: readonly WorkHoliday[] = []) {
  const start = dateFromKey(bangkokDateKey(startValue));
  const end = dateFromKey(bangkokDateKey(endValue));
  if (!start || !end || start.getTime() === end.getTime()) return 0;
  const direction = end > start ? 1 : -1;
  const cursor = new Date(start);
  const holidaySet = activeHolidayDates(holidays);
  let count = 0;
  while (cursor.getTime() !== end.getTime()) {
    cursor.setUTCDate(cursor.getUTCDate() + direction);
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6 && !holidaySet.has(keyFromDate(cursor))) count += direction;
  }
  return count;
}

export type HoldHistoryEntry = { start: string; end: string; businessDays: number; deadlineBefore: string; deadlineAfter: string; changedBy: string };
export type SourceHoldTask = { status?: unknown; deadline?: string | null; extraData?: Record<string, unknown> | null };

/** Applies the source hold rule without mutating the input task. */
export function applyHoldStatusUpdate(task: SourceHoldTask, nextStatus: unknown, holidays: readonly WorkHoliday[] = [], now: string | Date, changedBy = "") {
  const current = normalizeSourceWorkStatus(task.status);
  const target = normalizeSourceWorkStatus(nextStatus);
  const extra = { ...(task.extraData ?? {}) } as Record<string, unknown>;
  const nowIso = new Date(now).toISOString();
  const holdStart = typeof extra.hold_started_at === "string" ? extra.hold_started_at : "";

  if (target === "On Hold") {
    if (!holdStart) {
      extra.hold_started_at = nowIso;
      extra.hold_started_by = changedBy;
      extra.hold_deadline_before = task.deadline ?? "";
    }
    return { extraData: extra, deadline: task.deadline ?? "" };
  }
  if (current !== "On Hold" || !holdStart) return {};

  const holdDays = Math.max(0, businessDaysBetween(holdStart, nowIso, holidays));
  const nextDeadline = holdDays > 0 && task.deadline ? addWorkingDays(task.deadline, holdDays, holidays) : (task.deadline ?? "");
  const history = Array.isArray(extra.hold_history) ? [...extra.hold_history] as HoldHistoryEntry[] : [];
  history.push({ start: holdStart, end: nowIso, businessDays: holdDays, deadlineBefore: String(extra.hold_deadline_before || task.deadline || ""), deadlineAfter: nextDeadline, changedBy });
  delete extra.hold_started_at;
  delete extra.hold_started_by;
  delete extra.hold_deadline_before;
  extra.hold_days_total = Number(extra.hold_days_total || 0) + holdDays;
  extra.hold_history = history.slice(-20);
  return { extraData: extra, deadline: nextDeadline };
}

export type GroupableWork = { id: string; job?: string | null; jobCode?: string | null; [key: string]: unknown };
export type WorkJobGroup<T extends GroupableWork> = { key: string; label: string; tasks: T[] };

/** Keeps valid multi-task jobs together; it never deduplicates tasks. */
export function groupTasksByJob<T extends GroupableWork>(tasks: readonly T[]): WorkJobGroup<T>[] {
  const groups = new Map<string, WorkJobGroup<T>>();
  for (const task of tasks) {
    const label = String(task.jobCode ?? task.job ?? "").trim() || `รายการ ${task.id}`;
    const key = label.toLocaleLowerCase("th-TH");
    const group = groups.get(key) ?? { key, label, tasks: [] };
    group.tasks.push(task);
    groups.set(key, group);
  }
  return [...groups.values()];
}
