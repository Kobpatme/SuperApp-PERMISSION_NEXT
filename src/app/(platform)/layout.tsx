import { AppShell } from "@/components/app-shell";
import { getAccessContext } from "@/lib/access";
import { modules } from "@/lib/module-registry";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getInstallationTeamContext } from "@/lib/installation-team-context";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.mustChangePassword) redirect("/change-password");
  const access = await Promise.all(modules.map((module) => getAccessContext(module.id)));
  const identity = access.find((item) => item.userId);
  const allowedModuleIds = modules.filter((_, index) => access[index].allowed).map((module) => module.id);
  const canAdmin = Boolean(identity?.subject?.grants.some((grant) => grant.permission.startsWith("core.")));
  const guaranteeAccess = access[modules.findIndex((module) => module.id === "guarantees")];
  const installationTeams = await getInstallationTeamContext(guaranteeAccess);
  return <AppShell displayName={identity?.displayName} allowedModuleIds={allowedModuleIds} canAdmin={canAdmin} installationTeams={installationTeams}>{children}</AppShell>;
}
