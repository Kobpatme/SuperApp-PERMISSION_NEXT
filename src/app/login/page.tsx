import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { copy, loginReason } from "@/lib/copy";
import { safeNextPath } from "@/lib/safe-next-path";
import { getServerEnv } from "@/lib/env";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reason?: string }> }) {
  if (await getCurrentUser()) redirect("/");
  const { next, reason } = await searchParams;

  return <AuthShell title={copy.auth.loginTitle} description={copy.auth.loginDescription} notice={loginReason(reason)} contactText={getServerEnv().SUPPORT_CONTACT_TEXT}><LoginForm next={safeNextPath(next || "")}/></AuthShell>;
}
