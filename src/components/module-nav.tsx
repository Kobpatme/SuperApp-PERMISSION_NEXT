"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { modules, overviewDestination, type ModuleId } from "@/lib/module-registry";
import { WorkspaceIcon } from "@/components/workspace-icon";
import { SidebarTeamSelector } from "@/components/sidebar-team-selector";
import type { InstallationTeamContext } from "@/lib/installation-team-context";

export function ModuleNav({ allowedModuleIds, installationTeams, collapsed = false, canAdmin = false, onNavigate }: { allowedModuleIds: ModuleId[]; installationTeams: InstallationTeamContext; collapsed?: boolean; canAdmin?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const items = [overviewDestination, ...modules.filter((module) => allowedModuleIds.includes(module.id))];

  return <nav className="sidebar-nav" aria-label="พื้นที่ทำงาน">
    {items.map((item) => {
      const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
      return <div className="sidebar-nav-entry" key={item.href}><Link className={`sidebar-link ${active ? "active" : ""}`} href={`${item.href}${params.get("preview") === "1" ? "?preview=1" : ""}`} aria-current={active ? "page" : undefined} aria-label={collapsed ? item.name : undefined} title={collapsed ? item.name : undefined} onClick={onNavigate}>
        <WorkspaceIcon name={item.id === "overview" ? "home" : item.id as ModuleId} size={21}/><span className="sidebar-link-label">{item.name}</span>
      </Link>{item.id === "guarantees" && <SidebarTeamSelector context={installationTeams} collapsed={collapsed} onNavigate={onNavigate}/>}</div>;
    })}
    {canAdmin && <Link className={`sidebar-link ${pathname.startsWith("/admin") ? "active" : ""}`} href="/admin" aria-current={pathname.startsWith("/admin") ? "page" : undefined} aria-label={collapsed ? "ผู้ดูแลระบบ" : undefined} title={collapsed ? "ผู้ดูแลระบบ" : undefined} onClick={onNavigate}><WorkspaceIcon name="settings" size={21}/><span className="sidebar-link-label">ผู้ดูแลระบบ</span></Link>}
  </nav>;
}
