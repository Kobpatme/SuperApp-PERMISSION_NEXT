import type { DatabaseTransaction } from "@/db";
import { notifications } from "@/db/schema";

export type NotificationInput = {
  recipientId: string;
  type: string;
  title: string;
  body?: string;
  href?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  deduplicationKey?: string;
};

/** Called inside the producer transaction so notifications never outrun domain state. */
export async function createNotification(tx: DatabaseTransaction, input: NotificationInput) {
  const [notification] = await tx.insert(notifications).values({ ...input, priority: input.priority ?? "normal" }).onConflictDoNothing().returning();
  return notification ?? null;
}
