"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { verify } from "@node-rs/argon2";
import { getDb } from "@/db";
import { authSessions, localCredentials, profiles } from "@/db/schema";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth";
import { runMaterialChange } from "@/lib/material-change";

export type LoginState = { error?: string };

export async function loginAction(_state: LoginState, form: FormData): Promise<LoginState> {
  if (!process.env.DATABASE_URL) return { error: "ยังไม่ได้ตั้งค่าฐานข้อมูลภายในองค์กร" };
  const email = String(form.get("email") || "").trim().toLocaleLowerCase("en-US");
  const password = String(form.get("password") || "");
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 256) return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  let destination = "/";
  try {
    const [account] = await getDb().select({ id: profiles.id, status: profiles.status, passwordHash: localCredentials.passwordHash, mustChangePassword: localCredentials.mustChangePassword,
      failedAttempts: localCredentials.failedAttempts, lockedUntil: localCredentials.lockedUntil })
      .from(profiles).innerJoin(localCredentials, eq(localCredentials.userId, profiles.id)).where(eq(profiles.email, email)).limit(1);
    if (!account) return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    if (account.status !== "active") return { error: "บัญชีนี้ถูกระงับ กรุณาติดต่อผู้ดูแลระบบ" };
    if (account.lockedUntil && account.lockedUntil > new Date()) return { error: "บัญชีถูกล็อกชั่วคราว กรุณาลองอีกครั้งภายหลัง" };
    const valid = await verify(account.passwordHash, password);
    if (!valid) {
      const failures = account.failedAttempts + 1;
      await getDb().update(localCredentials).set({ failedAttempts: failures, lockedUntil: failures >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null, updatedAt: new Date() })
        .where(eq(localCredentials.userId, account.id));
      return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }
    await getDb().update(localCredentials).set({ failedAttempts: 0, lockedUntil: null, updatedAt: new Date() }).where(eq(localCredentials.userId, account.id));
    const h = await headers();
    await createSession(account.id, { ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined, userAgent: h.get("user-agent") || undefined });
    if (account.mustChangePassword) destination = "/change-password";
  } catch (error) {
    console.error("Local login failed", error);
    return { error: "ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบการเชื่อมต่อเซิร์ฟเวอร์" };
  }
  redirect(destination);
}

export async function changePasswordAction(_state: LoginState, form: FormData): Promise<LoginState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const password = String(form.get("password") || "");
  const confirm = String(form.get("confirm") || "");
  if (password !== confirm) return { error: "รหัสผ่านทั้งสองช่องไม่ตรงกัน" };
  if (password.length < 12 || !/[a-zA-Z]/.test(password) || !/\d/.test(password) || !/[^a-zA-Z0-9]/.test(password)) return { error: "รหัสผ่านต้องมีอย่างน้อย 12 ตัว และมีตัวอักษร ตัวเลข และสัญลักษณ์" };
  const passwordHash = await (await import("@node-rs/argon2")).hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 });
  await runMaterialChange({ audit: { actorId: user.id, moduleId: "core", action: "password.change", entityType: "profile",
    entityId: user.id, requestId: crypto.randomUUID(), metadata: { sessionsRevoked: true } } }, async (tx) => {
    await tx.update(localCredentials).set({ passwordHash, mustChangePassword: false, failedAttempts: 0, lockedUntil: null, passwordChangedAt: new Date(), updatedAt: new Date() }).where(eq(localCredentials.userId, user.id));
    await tx.delete(authSessions).where(eq(authSessions.userId, user.id));
  });
  await createSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
