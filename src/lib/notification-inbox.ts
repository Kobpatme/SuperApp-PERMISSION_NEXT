import "server-only";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { getIdentityAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { safeNotificationHref } from "@/lib/notification-policy";

export async function getNotificationInbox() {
  const access = await getIdentityAccessContext();
  const empty = { items: [], unread: 0, state: "denied" as "ready" | "denied" | "unavailable", canUpdate: false };
  if (!isAuthorized(access.subject, "notification.inbox.read", { ownerId: access.userId })) return empty;
  try {
    const scope = eq(notifications.recipientId, access.userId);
    const [rows, tally] = await Promise.all([
      getDb().select({ id: notifications.id, title: notifications.title, body: notifications.body, href: notifications.href,
        priority: notifications.priority, readAt: notifications.readAt, createdAt: notifications.createdAt })
        .from(notifications).where(scope).orderBy(desc(notifications.createdAt), desc(notifications.id)).limit(30),
      getDb().select({ value: count() }).from(notifications).where(and(scope, isNull(notifications.readAt))),
    ]);
    return { items: rows.map(row => ({ ...row, href: safeNotificationHref(row.href), readAt: row.readAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString() })),
      unread: tally[0]?.value ?? 0, state: "ready" as const,
      canUpdate: isAuthorized(access.subject, "notification.inbox.update", { ownerId: access.userId }) };
  } catch {
    return { ...empty, state: "unavailable" as const };
  }
}
export type NotificationInbox = Awaited<ReturnType<typeof getNotificationInbox>>;
