import { AppShell } from "@/components/app-shell";
import { getAccessContext } from "@/lib/access";
import { modules } from "@/lib/module-registry";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getInstallationTeamContext } from "@/lib/installation-team-context";
import { getNotificationInbox } from "@/lib/notification-inbox";
import { NotificationCenter } from "@/components/notification-center";
import { isAuthorized } from "@/lib/authorization";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.mustChangePassword) redirect("/change-password");
  const access = await Promise.all(modules.map((module) => getAccessContext(module.id)));
  const identity = access.find((item) => item.userId);
  const allowedModuleIds = modules.filter((_, index) => access[index].allowed).map((module) => module.id);
  const canAdmin = ["core.profile.read", "core.user.manage", "core.role.manage", "core.audit.read"].some(permission => isAuthorized(identity?.subject, permission));
  const guaranteeAccess = access[modules.findIndex((module) => module.id === "guarantees")];
  const installationTeams = await getInstallationTeamContext(guaranteeAccess);
  const inbox = await getNotificationInbox();
  const scopeNames = { OWN: "ตนเอง", TEAM: "ทีมของตน", SELECTED_TEAMS: "ทีมที่กำหนด", ALL: "ทุกทีม" };
  const scopeLabel = [...new Set(identity?.subject?.grants.map(grant => scopeNames[grant.scope]))].join(" · ");
  return <AppShell displayName={identity?.displayName} allowedModuleIds={allowedModuleIds} canAdmin={canAdmin} installationTeams={installationTeams} notificationCenter={<NotificationCenter inbox={inbox}/>} scopeLabel={scopeLabel}>{children}</AppShell>;
}
