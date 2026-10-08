import "server-only";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cache } from "react";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { authSessions, localCredentials, profiles } from "@/db/schema";
import { getIdleDurationMs, getSessionDurationMs } from "@/lib/session-duration";
import { logEvent } from "@/lib/logger";
import { persistSession } from "@/lib/auth-session-service";

export const sessionCookieName = "pn_session";
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export type CurrentUser = { id: string; email: string; user_metadata: { display_name: string }; mustChangePassword?: boolean };

// React cache is request-scoped; no identity is retained between requests/users.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!process.env.DATABASE_URL) return null;
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token || token.length < 40) return null;
  try {
    const now = new Date();
    const [row] = await getDb().select({ sessionId: authSessions.id, lastSeenAt: authSessions.lastSeenAt, id: profiles.id, email: profiles.email, displayName: profiles.displayName, mustChangePassword: localCredentials.mustChangePassword })
      .from(authSessions).innerJoin(profiles, eq(profiles.id, authSessions.userId)).innerJoin(localCredentials, eq(localCredentials.userId, profiles.id))
      .where(and(eq(authSessions.tokenHash, hashToken(token)), isNull(authSessions.revokedAt), gt(authSessions.expiresAt, now), gt(authSessions.lastSeenAt, new Date(now.getTime() - getIdleDurationMs())), eq(profiles.status, "active"))).limit(1);
    if (!row) return null;
    const activityThreshold = new Date(now.getTime() - 60_000);
    if (row.lastSeenAt < activityThreshold) {
      // Conditional write avoids duplicate touches and cannot refresh an expired row.
      await getDb().update(authSessions).set({ lastSeenAt: now }).where(and(
        eq(authSessions.id, row.sessionId), lt(authSessions.lastSeenAt, activityThreshold),
        isNull(authSessions.revokedAt),
        gt(authSessions.expiresAt, now), gt(authSessions.lastSeenAt, new Date(now.getTime() - getIdleDurationMs())),
      ));
    }
    return { id: row.id, email: row.email, user_metadata: { display_name: row.displayName || row.email.split("@")[0] }, mustChangePassword: row.mustChangePassword };
  } catch (error) {
    logEvent("error", "auth.session.validation_failed", { requestId: randomUUID(), errorType: error instanceof Error ? error.name : "UnknownError" });
    return null;
  }
});

/** Only distinguish a known superseded cookie; no session details leave the server. */
export const getSessionFailureReason = cache(async (): Promise<"superseded" | "expired"> => {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!process.env.DATABASE_URL || !token || token.length < 40) return "expired";
  try {
    const [row] = await getDb().select({ reason: authSessions.revokedReason }).from(authSessions)
      .where(and(eq(authSessions.tokenHash, hashToken(token)), eq(authSessions.revokedReason, "superseded"), gt(authSessions.expiresAt, new Date()))).limit(1);
    return row?.reason === "superseded" ? "superseded" : "expired";
  } catch { return "expired"; }
});

export async function createSession(userId: string, metadata?: { ipAddress?: string; userAgent?: string }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + getSessionDurationMs());
  await persistSession(userId, hashToken(token), expiresAt, metadata);
  (await cookies()).set(sessionCookieName, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", priority: "high", path: "/", expires: expiresAt });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(sessionCookieName)?.value;
  if (token && process.env.DATABASE_URL) await getDb().delete(authSessions).where(eq(authSessions.tokenHash, hashToken(token))).catch(() => undefined);
  store.delete(sessionCookieName);
}
