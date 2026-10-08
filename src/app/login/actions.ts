"use server";

import { eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hash, verify } from "@node-rs/argon2";
import { getDb } from "@/db";
import { localCredentials, profiles } from "@/db/schema";
import { revokeUserSessions } from "@/lib/auth-session-service";
import { createSession, destroySession, getCurrentUser, getSessionFailureReason } from "@/lib/auth";
import { clearLoginRateLimit, getLoginRateLimit, getTrustedClientIp, recordLoginFailure, type LoginRateLimitKey } from "@/lib/auth-rate-limit";
import { writeAuditLog } from "@/lib/audit-log";
import { runMaterialChange } from "@/lib/material-change";
import { validatePassword } from "@/lib/password-policy";
import { safeNextPath } from "@/lib/safe-next-path";
import { copy } from "@/lib/copy";
import { logEvent } from "@/lib/logger";

export type LoginState = { error?: string; email?: string };
const genericLoginError = copy.auth.genericError;
const dummyPasswordHash = "$argon2id$v=19$m=19456,t=2,p=1$wkwySqmJsieZfznthHo2Qg$d8F9W9AnR5D2cjrarKTUpsdhwyYNsXeC5Zchro3ngaw";

function loginKeys(email: string, ipAddress?: string): LoginRateLimitKey[] {
  return [
    ...(email ? [{ kind: "email" as const, value: email }] : []),
    ...(ipAddress ? [{ kind: "ip" as const, value: ipAddress }] : []),
  ];
}

async function auditLogin(input: { action: string; actorId?: string; requestId: string; reason: string; email: string; ipAddress?: string; userAgent?: string }) {
  await writeAuditLog({
    actorId: input.actorId,
    moduleId: "core",
    action: input.action,
    entityType: "authentication",
    entityId: input.actorId,
    requestId: input.requestId,
    metadata: { reason: input.reason, email: input.email, ipAddress: input.ipAddress || "unknown", userAgent: input.userAgent || "unknown" },
  });
}

export async function loginAction(_state: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") || "").trim().toLocaleLowerCase("en-US");
  const password = String(form.get("password") || "");
  const next = safeNextPath(String(form.get("next") || ""));
  const requestId = crypto.randomUUID();
  if (!process.env.DATABASE_URL) {
    logEvent("error", "auth.login.unavailable", { requestId, reason: "database_unconfigured" });
    return { email, error: copy.auth.serviceError(requestId) };
  }
  const requestHeaders = await headers();
  const ipAddress = getTrustedClientIp(requestHeaders);
  const userAgent = requestHeaders.get("user-agent") || undefined;
  const keys = loginKeys(email, ipAddress);
  let destination = "/";
  try {
    const rateLimit = await getLoginRateLimit(keys);
    if (rateLimit.blocked) {
      await auditLogin({ action: "auth.login.failure", requestId, reason: "rate_limited", email, ipAddress, userAgent });
      return { email, error: copy.auth.rateLimited(rateLimit.retryAfterSeconds) };
    }
    const validEmail = /^\S+@\S+\.\S+$/.test(email);
    const validInput = validEmail && password.length >= 8 && password.length <= 256;
    const [account] = await getDb().select({ id: profiles.id, status: profiles.status, passwordHash: localCredentials.passwordHash, mustChangePassword: localCredentials.mustChangePassword,
      failedAttempts: localCredentials.failedAttempts, lockedUntil: localCredentials.lockedUntil })
      .from(profiles).innerJoin(localCredentials, eq(localCredentials.userId, profiles.id)).where(eq(profiles.email, email)).limit(1);
    const valid = await verify(account?.passwordHash || dummyPasswordHash, validInput ? password : "invalid-input");
    if (!account) {
      await recordLoginFailure(keys);
      await auditLogin({ action: "auth.login.failure", requestId, reason: "invalid_credentials", email, ipAddress, userAgent });
      return { email, error: genericLoginError };
    }
    const now = new Date();
    if (account.lockedUntil && account.lockedUntil <= now) {
      await getDb().update(localCredentials).set({ failedAttempts: 0, lockedUntil: null, updatedAt: now }).where(eq(localCredentials.userId, account.id));
      account.failedAttempts = 0;
      account.lockedUntil = null;
    }
    if (account.status !== "active") {
      await recordLoginFailure(keys);
      await auditLogin({ action: "auth.login.failure", actorId: account.id, requestId, reason: "inactive_account", email, ipAddress, userAgent });
      return { email, error: genericLoginError };
    }
    if (account.lockedUntil && account.lockedUntil > now) {
      await auditLogin({ action: "auth.login.failure", actorId: account.id, requestId, reason: "account_locked", email, ipAddress, userAgent });
      return { email, error: genericLoginError };
    }
    if (!valid) {
      await getDb().update(localCredentials).set({ failedAttempts: sql`${localCredentials.failedAttempts} + 1`,
        lockedUntil: sql`case when ${localCredentials.failedAttempts} + 1 >= 5 then now() + interval '15 minutes' else ${localCredentials.lockedUntil} end`, updatedAt: new Date() })
        .where(eq(localCredentials.userId, account.id));
      await recordLoginFailure(keys);
      await auditLogin({ action: account.failedAttempts + 1 >= 5 ? "auth.account.locked" : "auth.login.failure", actorId: account.id, requestId, reason: "invalid_credentials", email, ipAddress, userAgent });
      return { email, error: genericLoginError };
    }
    await getDb().update(localCredentials).set({ failedAttempts: 0, lockedUntil: null, updatedAt: new Date() }).where(eq(localCredentials.userId, account.id));
    await clearLoginRateLimit(keys);
    await auditLogin({ action: "auth.login.success", actorId: account.id, requestId, reason: "authenticated", email, ipAddress, userAgent });
    await createSession(account.id, { ipAddress, userAgent });
    if (account.mustChangePassword) destination = "/change-password";
    else destination = next;
  } catch (error) {
    logEvent("error", "auth.login.failed", { requestId, errorType: error instanceof Error ? error.name : "unknown" });
    return { email, error: copy.auth.serviceError(requestId) };
  }
  redirect(destination);
}

export async function changePasswordAction(_state: LoginState, form: FormData): Promise<LoginState> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?reason=${await getSessionFailureReason()}`);
  const password = String(form.get("password") || "");
  const confirm = String(form.get("confirm") || "");
  if (password !== confirm) return { error: copy.auth.passwordMismatch };
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.ok) return { error: passwordCheck.message };
  const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 });
  await runMaterialChange({ audit: { actorId: user.id, moduleId: "core", action: "password.change", entityType: "profile",
    entityId: user.id, requestId: crypto.randomUUID(), metadata: { sessionsRevoked: true } } }, async (tx) => {
    await tx.update(localCredentials).set({ passwordHash, mustChangePassword: false, failedAttempts: 0, lockedUntil: null, passwordChangedAt: new Date(), updatedAt: new Date() }).where(eq(localCredentials.userId, user.id));
    await revokeUserSessions(tx, user.id, "password_changed");
  });
  await createSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login?reason=signed-out");
}
