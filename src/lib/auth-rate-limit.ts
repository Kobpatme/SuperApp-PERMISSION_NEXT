import { and, eq, or } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { authRateLimits } from "@/db/schema";

const windowMs = 15 * 60 * 1000;
const limits = { email: 5, ip: 20 } as const;

export type LoginRateLimitKey = { kind: keyof typeof limits; value: string };

function cleanKeys(keys: LoginRateLimitKey[]) {
  return keys.filter((key, index, all) => key.value && all.findIndex((candidate) => candidate.kind === key.kind && candidate.value === key.value) === index);
}

export async function getLoginRateLimit(keys: LoginRateLimitKey[]) {
  const normalized = cleanKeys(keys);
  if (!normalized.length || !process.env.DATABASE_URL) return { blocked: false, retryAfterSeconds: 0 };
  const rows = await getDb().select({ blockedUntil: authRateLimits.blockedUntil })
    .from(authRateLimits)
    .where(or(...normalized.map((key) => and(eq(authRateLimits.subjectType, key.kind), eq(authRateLimits.subjectKey, key.value)))));
  const now = Date.now();
  const blockedUntil = rows.map((row) => row.blockedUntil?.getTime() || 0).filter((value) => value > now).sort((a, b) => b - a)[0] || 0;
  return { blocked: blockedUntil > now, retryAfterSeconds: blockedUntil > now ? Math.ceil((blockedUntil - now) / 1000) : 0 };
}

export async function recordLoginFailure(keys: LoginRateLimitKey[]) {
  const normalized = cleanKeys(keys);
  if (!normalized.length || !process.env.DATABASE_URL) return;
  await getDb().transaction(async (tx) => {
    for (const key of normalized) {
      const maxAttempts = limits[key.kind];
      await tx.execute(sql`
        insert into auth_rate_limits (subject_type, subject_key, window_started_at, attempts, blocked_until, updated_at)
        values (${key.kind}, ${key.value}, now(), 1, case when ${maxAttempts} <= 1 then now() + interval '15 minutes' else null end, now())
        on conflict (subject_type, subject_key) do update set
          attempts = case when auth_rate_limits.window_started_at <= now() - interval '15 minutes' then 1 else auth_rate_limits.attempts + 1 end,
          window_started_at = case when auth_rate_limits.window_started_at <= now() - interval '15 minutes' then now() else auth_rate_limits.window_started_at end,
          blocked_until = case
            when auth_rate_limits.window_started_at <= now() - interval '15 minutes' then case when 1 >= ${maxAttempts} then now() + interval '15 minutes' else null end
            when auth_rate_limits.attempts + 1 >= ${maxAttempts} then now() + interval '15 minutes'
            else auth_rate_limits.blocked_until
          end,
          updated_at = now()
      `);
    }
  });
}

export async function clearLoginRateLimit(keys: LoginRateLimitKey[]) {
  const normalized = cleanKeys(keys);
  if (!normalized.length || !process.env.DATABASE_URL) return;
  await getDb().delete(authRateLimits).where(or(...normalized.map((key) => and(eq(authRateLimits.subjectType, key.kind), eq(authRateLimits.subjectKey, key.value)))));
}

export function getTrustedClientIp(requestHeaders: Headers) {
  const trustedProxyCount = Number.parseInt(process.env.TRUSTED_PROXY_COUNT || "0", 10);
  if (!Number.isInteger(trustedProxyCount) || trustedProxyCount < 1) return undefined;
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",").map((value) => value.trim()).filter(Boolean) || [];
  const candidate = forwarded.length > trustedProxyCount ? forwarded[forwarded.length - trustedProxyCount - 1] : requestHeaders.get("x-real-ip")?.trim();
  if (!candidate || candidate.length > 64 || !/^[0-9a-f:.]+$/i.test(candidate)) return undefined;
  return candidate;
}
