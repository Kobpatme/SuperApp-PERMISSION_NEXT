import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/change-password-form";
import { getCurrentUser } from "@/lib/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { copy } from "@/lib/copy";
import { getServerEnv } from "@/lib/env";
import type { Metadata } from "next";

export const metadata: Metadata = { title: copy.pages.change_password };

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AuthShell title={copy.auth.changeTitle} description={copy.auth.changeDescription} contactText={getServerEnv().SUPPORT_CONTACT_TEXT}><ChangePasswordForm/></AuthShell>;
}
