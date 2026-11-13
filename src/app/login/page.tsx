import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { copy, loginReason } from "@/lib/copy";
import { safeNextPath } from "@/lib/safe-next-path";
import type { Metadata } from "next";
import { headers } from "next/headers";

export const metadata: Metadata = { title: copy.pages.login };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reason?: string }> }) {
  // อ่าน SUPPORT_CONTACT_TEXT โดยตรงเพื่อไม่ให้เกิด fetch ระหว่าง server render
  const supportContactText = process.env.SUPPORT_CONTACT_TEXT || "";

  // Session-cookie updates rerender this page during the login Server Action.
  // Let its client finish the transition; ordinary authenticated visits redirect.
  if (await getCurrentUser() && !(await headers()).has("next-action")) redirect("/");
  const { next, reason } = await searchParams;

  return <AuthShell imageSrc="/logo.png" teamBrand title={copy.pages.login} notice={loginReason(reason)} contactText={supportContactText}><LoginForm next={safeNextPath(next || "")}/></AuthShell>;
}
