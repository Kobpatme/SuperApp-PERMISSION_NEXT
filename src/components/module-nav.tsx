"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { modules, overviewDestination, type ModuleId, getModule } from "@/lib/module-registry";
import { WorkspaceIcon, type IconName } from "@/components/workspace-icon";

export type WorkNavItem = { href: string; label: string; icon: "work" | "team" | "filter" | "search" | "check" | "info" | "refresh" };
type SectionSnapshot = { open: string | null; pathname: string };
type NavChildItem = { href: string; label: string; icon: string; activeMatch?: "exact" | "prefix" | "query" };

const sectionStorageKey = "permission-next-sidebar-section";
const sectionChangeEvent = "permission-next-sidebar-section-change";
// Keep the accordion usable for this page when persistence is unavailable.
let transientSectionSnapshot: string | null = null;

function readSectionSnapshot() {
  if (transientSectionSnapshot !== null) return transientSectionSnapshot;
  try { return window.localStorage.getItem(sectionStorageKey) || ""; }
  catch { return ""; }
}

function writeSectionSnapshot(snapshot: string) {
  try { window.localStorage.setItem(sectionStorageKey, snapshot); transientSectionSnapshot = null; }
  catch { transientSectionSnapshot = snapshot; }
  window.dispatchEvent(new Event(sectionChangeEvent));
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

function parseSectionSnapshot(snapshot: string): SectionSnapshot | undefined {
  if (!snapshot) return undefined;
  try {
    const saved = JSON.parse(snapshot) as Partial<SectionSnapshot>;
    const open = saved.open;
    if (open !== null && typeof open !== "string") return undefined;
    return { open: open ?? null, pathname: typeof saved.pathname === "string" ? saved.pathname : "" };
  } catch {
    return undefined;
  }
}

function sectionForPathname(pathname: string): string | null {
  const candidates = modules
    .filter(module => pathname === module.href || pathname.startsWith(`${module.href}/`))
    .sort((a, b) => b.href.length - a.href.length);
  return candidates[0]?.id ?? null;
}

/** Resolve static child navigation items for a module from registry metadata. */
function getNavItems(moduleId: string): NavChildItem[] | undefined {
  const registryModule = getModule(moduleId);
  return registryModule?.navigationItems;
}

/**
 * Compute which child href is active for the current route using activeMatch
 * and longest-path-wins resolution. Query matches take precedence over prefix,
 * which takes precedence over exact. Among equal specificity, longest href wins.
 */
function computeActiveChildHref(
  navigationItems: NavChildItem[] | undefined,
  pathname: string,
  params: URLSearchParams
): string | undefined {
  if (!navigationItems) return undefined;

  const matches: Array<{ href: string; score: number }> = [];

  for (const item of navigationItems) {
    const match = item.activeMatch ?? "exact";
    const itemPathname = item.href.split("?")[0];
    let matched = false;

    if (match === "query") {
      const itemUrl = new URL(item.href, "https://workspace.local");
      if (itemUrl.pathname === pathname) {
        const allParamsMatch = Array.from(itemUrl.searchParams).every(([key, value]) => params.get(key) === value);
        if (allParamsMatch) matched = true;
      }
    } else if (match === "exact") {
      if (pathname === itemPathname) matched = true;
    } else if (match === "prefix") {
      if (pathname === itemPathname || pathname.startsWith(`${itemPathname}/`)) matched = true;
    }

    if (matched) {
      const score = match === "query" ? 2 : match === "prefix" ? 1 : 0;
      matches.push({ href: item.href, score });
    }
  }

  if (matches.length === 0) return undefined;

  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.href.length - a.href.length;
  });

  return matches[0].href;
}

export function ModuleNav({ allowedModuleIds, collapsed = false, canAdmin = false, workNavigation = [], onNavigate, idPrefix = "sidebar-section" }: { allowedModuleIds: ModuleId[]; collapsed?: boolean; canAdmin?: boolean; workNavigation?: WorkNavItem[]; onNavigate?: () => void; idPrefix?: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const sectionSnapshot = useSyncExternalStore(subscribeToSectionChanges, readSectionSnapshot, () => "");
  const savedSection = useMemo(() => parseSectionSnapshot(sectionSnapshot), [sectionSnapshot]);
  const routeSection = sectionForPathname(pathname);
  const expandedSection = savedSection?.pathname === pathname ? savedSection.open : routeSection;
  const installationTeamView = pathname.startsWith("/guarantees") && params.get("view") === "installation-team";
  const currentWorkHref = workNavigation
    .map(child => ({ href: child.href, url: new URL(child.href, "https://workspace.local") }))
    .filter(child => (child.url.pathname === pathname || (child.url.pathname !== "/work" && pathname.startsWith(`${child.url.pathname}/`))) && Array.from(child.url.searchParams).every(([key, value]) => params.get(key) === value))
    .sort((a, b) => b.url.pathname.length - a.url.pathname.length || b.url.searchParams.size - a.url.searchParams.size)[0]?.href;
  const groupLabels: Record<string, string> = { overview: "ภาพรวม", finance: "การเงิน", reports: "รายงาน", management: "การจัดการ" };
  const items = [{ ...overviewDestination, group: "overview" as const, icon: "home" as const }, ...modules.filter((module) => allowedModuleIds.includes(module.id))];

  function toggleSection(id: string) {
    const next: SectionSnapshot = { open: expandedSection === id ? null : id, pathname };
    writeSectionSnapshot(JSON.stringify(next));
  }

  return <nav id={idPrefix === "sidebar-section" ? "workspace-navigation" : undefined} className="sidebar-nav" aria-label="พื้นที่ทำงาน">
    {items.map((item, index) => {
      const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
      const navItems = getNavItems(item.id);
      const hasChildren = item.id === "work" ? workNavigation.length > 0 : !!navItems?.length;
      // Collapsed rails show module icons only; expanded/mobile navigation behaves as a single-open accordion.
      const expanded = hasChildren && !collapsed && expandedSection === item.id;
      const currentChildHref = item.id === "work" ? currentWorkHref : computeActiveChildHref(navItems, pathname, params);
      const parentCurrent = active && (!expanded || !currentChildHref);
      const sectionId = hasChildren ? `${idPrefix}-${item.id}` : undefined;
      const destination = `${item.href}${params.get("preview") === "1" ? "?preview=1" : ""}`;
      const parentControl = <Link
        className={`sidebar-link ${active ? "active" : ""}`}
        href={destination}
        aria-current={parentCurrent ? "page" : undefined}
        aria-label={collapsed ? item.name : undefined}
        title={collapsed ? item.name : undefined}
        onClick={onNavigate}
      >
        <WorkspaceIcon name={item.icon} size={20}/><span className="sidebar-link-label">{item.name}</span>
      </Link>;
      return <div className="sidebar-nav-entry" key={item.href}>
        {!collapsed && items[index - 1]?.group !== item.group && groupLabels[item.group] && <span className="sidebar-group-label">{groupLabels[item.group]}</span>}
        <div className="sidebar-module-row">{parentControl}{sectionId && !collapsed && <button className="sidebar-section-toggle" type="button" data-module-id={item.id} aria-label={`${expanded ? "ยุบ" : "ขยาย"}เมนู${item.name}`} aria-expanded={expanded} aria-controls={sectionId} onClick={() => toggleSection(item.id)}><WorkspaceIcon name="chevron" size={18}/></button>}</div>
        {hasChildren && sectionId && <div className={`sidebar-subnav-panel ${expanded ? "is-open" : ""}`} id={sectionId} aria-hidden={!expanded} inert={!expanded}>
          <div className="sidebar-subnav" aria-label={`เมนู${item.name}`}>
          {item.id === "work" && workNavigation.map((child) => {
            const childActive = child.href === currentWorkHref;
            const visuallyHidden = child.href === "/work/mine";
            return <Link className={`sidebar-child-link ${childActive ? "active" : ""}`} href={child.href} key={child.href} aria-current={childActive ? "page" : undefined} aria-label={visuallyHidden || collapsed ? child.label : undefined} title={visuallyHidden ? undefined : collapsed ? child.label : undefined} onClick={onNavigate}><WorkspaceIcon name={child.icon as IconName} size={18}/>{visuallyHidden ? null : <span className="sidebar-link-label">{child.label}</span>}</Link>;
          })}
          {item.id !== "work" && navItems?.map((child) => {
            const childActive = child.href === currentChildHref;
            return <Link className={`sidebar-child-link ${childActive ? "active" : ""}`} href={child.href} key={child.href} aria-current={childActive ? "page" : undefined} aria-label={collapsed ? child.label : undefined} title={collapsed ? child.label : undefined} onClick={onNavigate}><WorkspaceIcon name={child.icon as IconName} size={18}/><span className="sidebar-link-label">{child.label}</span></Link>;
          })}
          </div>
        </div>}
      </div>;
    })}
    {canAdmin && <Link className={`sidebar-link ${(pathname === "/admin" || pathname.startsWith("/admin/")) ? "active" : ""}`} href="/admin" aria-current={(pathname === "/admin" || pathname.startsWith("/admin/")) ? "page" : undefined} aria-label={collapsed ? "ผู้ดูแลระบบ" : undefined} title={collapsed ? "ผู้ดูแลระบบ" : undefined} onClick={onNavigate}><WorkspaceIcon name="settings" size={21}/><span className="sidebar-link-label">ผู้ดูแลระบบ</span></Link>}
  </nav>;
}
