import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { authSessions, localCredentials, profiles } from "@/db/schema";
import { getIdleDurationMs, getSessionDurationMs } from "@/lib/session-duration";

export const sessionCookieName = "pn_session";
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export type CurrentUser = { id: string; email: string; user_metadata: { display_name: string }; mustChangePassword?: boolean };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!process.env.DATABASE_URL) return null;
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token || token.length < 40) return null;
  try {
    const now = new Date();
    const [row] = await getDb().select({ sessionId: authSessions.id, id: profiles.id, email: profiles.email, displayName: profiles.displayName, mustChangePassword: localCredentials.mustChangePassword })
      .from(authSessions).innerJoin(profiles, eq(profiles.id, authSessions.userId)).innerJoin(localCredentials, eq(localCredentials.userId, profiles.id))
      .where(and(eq(authSessions.tokenHash, hashToken(token)), gt(authSessions.expiresAt, now), gt(authSessions.lastSeenAt, new Date(now.getTime() - getIdleDurationMs())), eq(profiles.status, "active"))).limit(1);
    if (!row) return null;
    await getDb().update(authSessions).set({ lastSeenAt: now }).where(eq(authSessions.id, row.sessionId));
    return { id: row.id, email: row.email, user_metadata: { display_name: row.displayName || row.email.split("@")[0] }, mustChangePassword: row.mustChangePassword };
  } catch (error) {
    console.error("Unable to validate local session", error);
    return null;
  }
}

export async function createSession(userId: string, metadata?: { ipAddress?: string; userAgent?: string }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + getSessionDurationMs());
  await getDb().transaction(async (tx) => {
    await tx.delete(authSessions).where(and(eq(authSessions.userId, userId), lt(authSessions.expiresAt, new Date())));
    await tx.insert(authSessions).values({ userId, tokenHash: hashToken(token), expiresAt,
      ipAddress: metadata?.ipAddress?.slice(0, 80), userAgent: metadata?.userAgent?.slice(0, 500) });
  });
  (await cookies()).set(sessionCookieName, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", priority: "high", path: "/", expires: expiresAt });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(sessionCookieName)?.value;
  if (token && process.env.DATABASE_URL) await getDb().delete(authSessions).where(eq(authSessions.tokenHash, hashToken(token))).catch(() => undefined);
  store.delete(sessionCookieName);
}
