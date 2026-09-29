"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { modules, overviewDestination, type ModuleId } from "@/lib/module-registry";
import { WorkspaceIcon } from "@/components/workspace-icon";

export function ModuleNav({ allowedModuleIds, collapsed = false, canAdmin = false, onNavigate }: { allowedModuleIds: ModuleId[]; collapsed?: boolean; canAdmin?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const installationTeamView = pathname.startsWith("/guarantees") && params.get("view") === "installation-team";
  const groupLabels = { overview: "ภาพรวม", work: "งานของฉัน", operations: "การดำเนินงาน", finance: "การเงิน", reports: "รายงาน", management: "การจัดการ" };
  const items = [{ ...overviewDestination, group: "overview" as const, icon: "home" as const }, ...modules.filter((module) => allowedModuleIds.includes(module.id))];

  return <nav className="sidebar-nav" aria-label="พื้นที่ทำงาน">
    {items.map((item, index) => {
      const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href) && !(item.id === "guarantees" && installationTeamView);
      return <div className="sidebar-nav-entry" key={item.href}>{!collapsed && items[index - 1]?.group !== item.group && <span className="sidebar-group-label">{groupLabels[item.group]}</span>}<Link className={`sidebar-link ${active ? "active" : ""}`} href={`${item.href}${params.get("preview") === "1" ? "?preview=1" : ""}`} aria-current={active ? "page" : undefined} aria-label={collapsed ? item.name : undefined} title={collapsed ? item.name : undefined} onClick={onNavigate}>
        <WorkspaceIcon name={item.icon} size={21}/><span className="sidebar-link-label">{item.name}</span>
      </Link>{item.id === "guarantees" && <div className="sidebar-subnav" aria-label="เมนูเงินประกันอาคารเพิ่มเติม"><Link className={`sidebar-child-link ${installationTeamView ? "active" : ""}`} href="/guarantees?view=installation-team" aria-current={installationTeamView ? "page" : undefined} aria-label={collapsed ? "ทีมติดตั้ง" : undefined} title={collapsed ? "ทีมติดตั้ง" : undefined} onClick={onNavigate}><WorkspaceIcon name="team" size={18}/><span className="sidebar-link-label">ทีมติดตั้ง</span></Link></div>}</div>;
    })}
    {canAdmin && <Link className={`sidebar-link ${pathname.startsWith("/admin") ? "active" : ""}`} href="/admin" aria-current={pathname.startsWith("/admin") ? "page" : undefined} aria-label={collapsed ? "ผู้ดูแลระบบ" : undefined} title={collapsed ? "ผู้ดูแลระบบ" : undefined} onClick={onNavigate}><WorkspaceIcon name="settings" size={21}/><span className="sidebar-link-label">ผู้ดูแลระบบ</span></Link>}
  </nav>;
}
