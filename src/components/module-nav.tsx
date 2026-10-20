"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { modules, overviewDestination, type ModuleId } from "@/lib/module-registry";
import { WorkspaceIcon } from "@/components/workspace-icon";

export type WorkNavItem = { href: string; label: string; icon: "work" | "team" | "filter" | "search" | "check" | "info" | "refresh" };
type CollapsibleModuleId = "work" | "guarantees" | "duct-rental";
type SectionState = Record<CollapsibleModuleId, boolean>;

const sectionStorageKey = "permission-next-sidebar-sections";
const defaultSections: SectionState = { work: true, guarantees: true, "duct-rental": true };
const sectionChangeEvent = "permission-next-sidebar-sections-change";

function isCollapsibleModule(id: string): id is CollapsibleModuleId {
  return id === "work" || id === "guarantees" || id === "duct-rental";
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
    return { work: saved.work !== false, guarantees: saved.guarantees !== false, "duct-rental": saved["duct-rental"] !== false };
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
  const currentWorkHref = workNavigation
    .map(child => ({ href: child.href, url: new URL(child.href, "https://workspace.local") }))
    .filter(child => (child.url.pathname === pathname || (child.url.pathname !== "/work" && pathname.startsWith(`${child.url.pathname}/`))) && Array.from(child.url.searchParams).every(([key, value]) => params.get(key) === value))
    .sort((a, b) => b.url.pathname.length - a.url.pathname.length || b.url.searchParams.size - a.url.searchParams.size)[0]?.href;
  const currentDuctHref = pathname === "/duct-rental" || /^\/duct-rental\/(new|[0-9a-f-]{36})(\/|$)/i.test(pathname)
    ? "/duct-rental"
    : ["/duct-rental/renewal", "/duct-rental/communication-cable"].find(href => pathname === href || pathname.startsWith(`${href}/`));
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
      const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
      const hasChildren = item.id === "work" ? workNavigation.length > 0 : item.id === "guarantees" || item.id === "duct-rental";
      // Icon-only rails expose all destinations; expanded/mobile menus retain saved disclosure state.
      const expanded = isCollapsibleModule(item.id) ? collapsed || expandedSections[item.id] : false;
      const currentChildHref = item.id === "work" ? currentWorkHref : item.id === "duct-rental" ? currentDuctHref : item.id === "guarantees" && installationTeamView ? "/guarantees?view=installation-team" : undefined;
      const parentCurrent = active && (!expanded || !currentChildHref);
      const parentLink = <Link className={`sidebar-link ${active ? "active" : ""}`} href={`${item.href}${params.get("preview") === "1" ? "?preview=1" : ""}`} aria-current={parentCurrent ? "page" : undefined} aria-label={collapsed ? item.name : undefined} title={collapsed ? item.name : undefined} onClick={onNavigate}>
        <WorkspaceIcon name={item.icon} size={20}/><span className="sidebar-link-label">{item.name}</span>
      </Link>;
      return <div className="sidebar-nav-entry" key={item.href}>
        {!collapsed && items[index - 1]?.group !== item.group && <span className="sidebar-group-label">{groupLabels[item.group]}</span>}
        {hasChildren ? <div className="sidebar-link-row">
          {parentLink}
          {!collapsed && <button className={`sidebar-section-toggle ${expanded ? "is-expanded" : ""}`} type="button" aria-label={`${expanded ? "พับ" : "ขยาย"}เมนู${item.name}`} aria-expanded={expanded} onClick={() => isCollapsibleModule(item.id) && toggleSection(item.id)}><WorkspaceIcon name="chevron" size={18}/></button>}
        </div> : parentLink}
        {hasChildren && expanded && <div className="sidebar-subnav" aria-label={`เมนู${item.name}`}>
          {item.id === "work" && workNavigation.map((child) => {
            const childActive = child.href === currentWorkHref;
            return <Link className={`sidebar-child-link ${childActive ? "active" : ""}`} href={child.href} key={child.href} aria-current={childActive ? "page" : undefined} aria-label={collapsed ? child.label : undefined} title={collapsed ? child.label : undefined} onClick={onNavigate}><WorkspaceIcon name={child.icon} size={18}/><span className="sidebar-link-label">{child.label}</span></Link>;
          })}
          {item.id === "guarantees" && <Link className={`sidebar-child-link ${installationTeamView ? "active" : ""}`} href="/guarantees?view=installation-team" aria-current={installationTeamView ? "page" : undefined} aria-label={collapsed ? "ทีมติดตั้ง" : undefined} title={collapsed ? "ทีมติดตั้ง" : undefined} onClick={onNavigate}><WorkspaceIcon name="team" size={18}/><span className="sidebar-link-label">ทีมติดตั้ง</span></Link>}
          {item.id === "duct-rental" && [
            { href: "/duct-rental", label: "เช่าท่อร้อยสาย", icon: "buildings" as const },
            { href: "/duct-rental/renewal", label: "ต่อสัญญา", icon: "refresh" as const },
            { href: "/duct-rental/communication-cable", label: "พาดสายสื่อสาร", icon: "work" as const },
          ].map(child => {
            const childActive = child.href === currentDuctHref;
            return <Link className={`sidebar-child-link ${childActive ? "active" : ""}`} href={child.href} key={child.href} aria-current={childActive ? "page" : undefined} aria-label={collapsed ? child.label : undefined} title={collapsed ? child.label : undefined} onClick={onNavigate}><WorkspaceIcon name={child.icon} size={18}/><span className="sidebar-link-label">{child.label}</span></Link>;
          })}
        </div>}
      </div>;
    })}
    {canAdmin && <Link className={`sidebar-link ${(pathname === "/admin" || pathname.startsWith("/admin/")) ? "active" : ""}`} href="/admin" aria-current={(pathname === "/admin" || pathname.startsWith("/admin/")) ? "page" : undefined} aria-label={collapsed ? "ผู้ดูแลระบบ" : undefined} title={collapsed ? "ผู้ดูแลระบบ" : undefined} onClick={onNavigate}><WorkspaceIcon name="settings" size={21}/><span className="sidebar-link-label">ผู้ดูแลระบบ</span></Link>}
  </nav>;
}
