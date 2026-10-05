import { copy } from "@/lib/copy";
import { AppShell } from "@/components/app-shell";
import { getAccessContext } from "@/lib/access";
import { modules } from "@/lib/module-registry";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getNotificationInbox } from "@/lib/notification-inbox";
import { NotificationCenter } from "@/components/notification-center";
import { isAuthorized } from "@/lib/authorization";
import { headers } from "next/headers";
import { safeNextPath } from "@/lib/safe-next-path";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    const next = safeNextPath((await headers()).get("x-pn-request-path"));
    redirect(`/login?next=${encodeURIComponent(next)}&reason=expired`);
  }
  if (currentUser.mustChangePassword) redirect("/change-password");
  const access = await Promise.all(modules.map((module) => getAccessContext(module.id)));
  const identity = access.find((item) => item.userId);
  const allowedModuleIds = modules.filter((_, index) => access[index].allowed).map((module) => module.id);
  const canAdmin = ["core.profile.read", "core.user.manage", "core.role.manage", "core.audit.read", "core.holiday.manage", "core.system_link.manage", "core.announcement.manage", "kpi.rule.manage"].some(permission => isAuthorized(identity?.subject, permission));
  const workGrants = identity?.subject?.grants ?? [];
  const hasWorkPermission = (permission: string) => workGrants.some((grant) => grant.permission === permission);
  const workNavigation = [
    { href: "/work", label: "ภาพรวมงาน", icon: "work" as const },
    hasWorkPermission("work.task.read") ? { href: "/work/mine", label: "งานของฉัน", icon: "check" as const } : null,
    hasWorkPermission("work.task.create") ? { href: "/work/new", label: "เพิ่มงาน", icon: "info" as const } : null,
    hasWorkPermission("work.task.manage") ? { href: "/work/team", label: "ภาพรวมทีม", icon: "team" as const } : null,
    hasWorkPermission("work.task.assign") ? { href: "/work/assign", label: "มอบหมายงาน", icon: "filter" as const } : null,
    hasWorkPermission("work.task.manage") || hasWorkPermission("kpi.team.read") ? { href: "/work/people", label: "บุคลากร", icon: "team" as const } : null,
    hasWorkPermission("work.task.read") ? { href: "/work/tracker", label: copy.feedback.tracker, icon: "search" as const } : null,
    hasWorkPermission("kpi.score.read") ? { href: "/work/kpi", label: "KPI ของฉัน", icon: "check" as const } : null,
    hasWorkPermission("work.report.read") ? { href: "/work/reports", label: "รายงานงาน", icon: "info" as const } : null,
    hasWorkPermission("activity.event.read") ? { href: "/work?view=activity", label: "กิจกรรมงาน", icon: "refresh" as const } : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const inbox = await getNotificationInbox();
  const scopeNames = { OWN: "ตนเอง", TEAM: "ทีมของตน", SELECTED_TEAMS: "ทีมที่กำหนด", ALL: "ทุกทีม" };
  const scopeLabel = [...new Set(identity?.subject?.grants.map(grant => scopeNames[grant.scope]))].join(" · ");
  return <AppShell displayName={identity?.displayName} allowedModuleIds={allowedModuleIds} canAdmin={canAdmin} workNavigation={workNavigation} notificationCenter={<NotificationCenter inbox={inbox}/>} scopeLabel={scopeLabel}>{children}</AppShell>;
}
