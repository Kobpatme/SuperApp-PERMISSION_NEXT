import { z } from "zod";

export const taskStatuses = ["queued", "in_progress", "blocked", "completed", "cancelled"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

const transitions: Record<TaskStatus, readonly TaskStatus[]> = {
  queued: ["in_progress", "cancelled"],
  in_progress: ["blocked", "completed", "cancelled"],
  blocked: ["in_progress", "cancelled"],
  completed: [],
  cancelled: [],
};

export class InvalidTaskTransitionError extends Error {
  constructor(readonly from: TaskStatus, readonly to: TaskStatus) {
    super(`Invalid task transition: ${from} -> ${to}`);
    this.name = "InvalidTaskTransitionError";
  }
}

export function assertTaskTransition(from: TaskStatus, to: TaskStatus) {
  if (!transitions[from].includes(to)) throw new InvalidTaskTransitionError(from, to);
}

export const manualWorkEntrySchema = z.object({
  ownerId: z.string().uuid(), teamId: z.string().uuid().optional().nullable(), buildingId: z.string().uuid().optional().nullable(), projectId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(3).max(180), description: z.string().trim().min(10).max(4000),
  reason: z.string().trim().min(10).max(500), occurredAt: z.coerce.date(), idempotencyKey: z.string().trim().min(12).max(160),
}).refine((value) => value.occurredAt <= new Date(), { path: ["occurredAt"], message: "Work cannot occur in the future" });

export function parseManualWorkEntry(input: unknown) {
  return manualWorkEntrySchema.parse(input);
}

export type ActivityCursor = { occurredAt: string; id: string };
export function encodeActivityCursor(cursor: ActivityCursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}
export function decodeActivityCursor(value: string): ActivityCursor {
  const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;
  return z.object({ occurredAt: z.string().datetime(), id: z.string().uuid() }).parse(parsed);
}
