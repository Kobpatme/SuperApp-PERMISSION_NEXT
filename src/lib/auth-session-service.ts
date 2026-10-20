import { and, eq, gt, isNull, lt, lte, or } from "drizzle-orm";
import { getDb, type DatabaseTransaction } from "@/db";
import { auditLogs, authSessions, profiles } from "@/db/schema";
import { getServerEnv } from "@/lib/env";
import { getIdleDurationMs } from "@/lib/session-duration";

export type SessionRevocationReason = "superseded" | "admin_revoked" | "password_changed";
export async function lockSessionUser(tx: DatabaseTransaction, userId: string) {
  const [profile] = await tx.select({ id: profiles.id, status: profiles.status }).from(profiles).where(eq(profiles.id, userId)).for("update");
  if (!profile) throw new Error("SESSION_USER_NOT_FOUND");
  return profile;
}
/** Call in the same transaction as the account mutation. All issuers share the profile lock. */
export async function revokeUserSessions(tx: DatabaseTransaction, userId: string, reason: SessionRevocationReason) {
  await lockSessionUser(tx, userId);
  return tx.update(authSessions).set({ revokedAt: new Date(), revokedReason: reason })
    .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt))).returning({ id: authSessions.id });
}
export async function persistSession(userId: string, tokenHash: string, expiresAt: Date, metadata?: { ipAddress?: string; userAgent?: string }) {
  const single = getServerEnv().AUTH_SINGLE_SESSION;
  await getDb().transaction(async tx => {
    const profile = await lockSessionUser(tx, userId);
    if (profile.status !== "active") throw new Error("SESSION_USER_INACTIVE");
    const now = new Date();
    const idleBefore = new Date(now.getTime() - getIdleDurationMs());
    // Keep revoked rows for seven days even if their absolute expiry has passed.
    await tx.delete(authSessions).where(and(eq(authSessions.userId, userId), or(
      and(isNull(authSessions.revokedAt), or(lte(authSessions.expiresAt, now), lte(authSessions.lastSeenAt, idleBefore))),
      lt(authSessions.revokedAt, new Date(now.getTime() - 7 * 86_400_000)),
    )));
    if (single) {
      const revoked = await tx.update(authSessions).set({ revokedAt: now, revokedReason: "superseded" })
        .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt), gt(authSessions.expiresAt, now), gt(authSessions.lastSeenAt, idleBefore))).returning({ id: authSessions.id });
      if (revoked.length) await tx.insert(auditLogs).values({ actorId: userId, moduleId: "core", action: "auth.session.superseded",
        entityType: "authentication", entityId: userId, requestId: crypto.randomUUID(), metadata: { count: revoked.length } });
    }
    await tx.insert(authSessions).values({ userId, tokenHash, expiresAt, ipAddress: metadata?.ipAddress?.slice(0, 80), userAgent: metadata?.userAgent?.slice(0, 500) });
  });
}
