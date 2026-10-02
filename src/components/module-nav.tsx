"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { modules, overviewDestination, type ModuleId } from "@/lib/module-registry";
import { WorkspaceIcon } from "@/components/workspace-icon";

export type WorkNavItem = { href: string; label: string; icon: "work" | "team" | "filter" | "search" | "check" | "info" | "refresh" };
type CollapsibleModuleId = "work" | "guarantees";
type SectionState = Record<CollapsibleModuleId, boolean>;

const sectionStorageKey = "permission-next-sidebar-sections";
const defaultSections: SectionState = { work: true, guarantees: true };
const sectionChangeEvent = "permission-next-sidebar-sections-change";

function isCollapsibleModule(id: string): id is CollapsibleModuleId {
  return id === "work" || id === "guarantees";
}

function readSectionSnapshot() {
  try { return window.localStorage.getItem(sectionStorageKey) || ""; }
  catch { return ""; }
}

function subscribeToSectionChanges(onStoreChange: () => void) {
  const handleChange = () => onStoreChange();
  window.addEventListener("storage", handleChange);
  window.addEventListener(sectionChangeEvent, handleChange);
  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(sectionChangeEvent, handleChange);
  };
}

function parseSectionSnapshot(snapshot: string): SectionState {
  try {
    const saved = JSON.parse(snapshot) as Partial<SectionState>;
    return { work: saved.work !== false, guarantees: saved.guarantees !== false };
  } catch {
    return defaultSections;
  }
}

export function ModuleNav({ allowedModuleIds, collapsed = false, canAdmin = false, workNavigation = [], onNavigate }: { allowedModuleIds: ModuleId[]; collapsed?: boolean; canAdmin?: boolean; workNavigation?: WorkNavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const sectionSnapshot = useSyncExternalStore(subscribeToSectionChanges, readSectionSnapshot, () => "");
  const expandedSections = useMemo(() => parseSectionSnapshot(sectionSnapshot), [sectionSnapshot]);
  const installationTeamView = pathname.startsWith("/guarantees") && params.get("view") === "installation-team";
  const groupLabels = { overview: "ภาพรวม", work: "งานของฉัน", operations: "การดำเนินงาน", finance: "การเงิน", reports: "รายงาน", management: "การจัดการ" };
  const items = [{ ...overviewDestination, group: "overview" as const, icon: "home" as const }, ...modules.filter((module) => allowedModuleIds.includes(module.id))];

  function toggleSection(id: CollapsibleModuleId) {
    const next = { ...expandedSections, [id]: !expandedSections[id] };
    try { window.localStorage.setItem(sectionStorageKey, JSON.stringify(next)); }
    catch { /* The preference is optional. */ }
    window.dispatchEvent(new Event(sectionChangeEvent));
  }

  return <nav className="sidebar-nav" aria-label="พื้นที่ทำงาน">
    {items.map((item, index) => {
      const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href) && !(item.id === "guarantees" && installationTeamView);
      const hasChildren = item.id === "work" ? workNavigation.length > 0 : item.id === "guarantees";
      const expanded = isCollapsibleModule(item.id) ? expandedSections[item.id] : false;
      const parentLink = <Link className={`sidebar-link ${active ? "active" : ""}`} href={`${item.href}${params.get("preview") === "1" ? "?preview=1" : ""}`} aria-current={active ? "page" : undefined} aria-label={collapsed ? item.name : undefined} title={collapsed ? item.name : undefined} onClick={onNavigate}>
        <WorkspaceIcon name={item.icon} size={21}/><span className="sidebar-link-label">{item.name}</span>
      </Link>;
      return <div className="sidebar-nav-entry" key={item.href}>
        {!collapsed && items[index - 1]?.group !== item.group && <span className="sidebar-group-label">{groupLabels[item.group]}</span>}
        {hasChildren ? <div className="sidebar-link-row">
          {parentLink}
          {!collapsed && <button className={`sidebar-section-toggle ${expanded ? "is-expanded" : ""}`} type="button" aria-label={`${expanded ? "พับ" : "ขยาย"}เมนู${item.name}`} aria-expanded={expanded} onClick={() => isCollapsibleModule(item.id) && toggleSection(item.id)}><WorkspaceIcon name="chevron" size={17}/></button>}
        </div> : parentLink}
        {hasChildren && expanded && <div className="sidebar-subnav" aria-label={`เมนู${item.name}`}>
          {item.id === "work" && workNavigation.map((child) => {
            const childUrl = new URL(child.href, "https://workspace.local");
            const childActive = childUrl.pathname === pathname && (!childUrl.searchParams.get("view") || childUrl.searchParams.get("view") === params.get("view")) && (childUrl.pathname === "/work" || pathname === childUrl.pathname || pathname.startsWith(`${childUrl.pathname}/`));
            return <Link className={`sidebar-child-link ${childActive ? "active" : ""}`} href={child.href} key={child.href} aria-current={childActive ? "page" : undefined} aria-label={collapsed ? child.label : undefined} title={collapsed ? child.label : undefined} onClick={onNavigate}><WorkspaceIcon name={child.icon} size={18}/><span className="sidebar-link-label">{child.label}</span></Link>;
          })}
          {item.id === "guarantees" && <Link className={`sidebar-child-link ${installationTeamView ? "active" : ""}`} href="/guarantees?view=installation-team" aria-current={installationTeamView ? "page" : undefined} aria-label={collapsed ? "ทีมติดตั้ง" : undefined} title={collapsed ? "ทีมติดตั้ง" : undefined} onClick={onNavigate}><WorkspaceIcon name="team" size={18}/><span className="sidebar-link-label">ทีมติดตั้ง</span></Link>}
        </div>}
      </div>;
    })}
    {canAdmin && <Link className={`sidebar-link ${pathname.startsWith("/admin") ? "active" : ""}`} href="/admin" aria-current={pathname.startsWith("/admin") ? "page" : undefined} aria-label={collapsed ? "ผู้ดูแลระบบ" : undefined} title={collapsed ? "ผู้ดูแลระบบ" : undefined} onClick={onNavigate}><WorkspaceIcon name="settings" size={21}/><span className="sidebar-link-label">ผู้ดูแลระบบ</span></Link>}
  </nav>;
}
