"use client";

import { useEffect, useRef, useState } from "react";
import { ModuleNav, type WorkNavItem } from "@/components/module-nav";
import { WorkspaceThemeToggle } from "@/components/workspace-theme-toggle";
import { AccountControl } from "@/components/account-control";
import { WorkspaceSearch } from "@/components/workspace-search";
import type { ModuleId } from "@/lib/module-registry";
import { WorkspaceIcon } from "@/components/workspace-icon";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import rolloutStyles from "@/styles/work-rollout-shell.module.css";

export function AppShell({ children, displayName = "ผู้ใช้งาน", allowedModuleIds, canAdmin = false, workNavigation = [], notificationCenter, scopeLabel }: { children: React.ReactNode; displayName?: string; allowedModuleIds: ModuleId[]; canAdmin?: boolean; workNavigation?: WorkNavItem[]; notificationCenter?: React.ReactNode; scopeLabel?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const workHome = pathname === "/work" && !searchParams.get("view");
  const rollout = workHome || ["/work/mine", "/work/kpi", "/work/team", "/work/assign", "/work/people", "/work/tracker", "/work/reports", "/work/new"].includes(pathname);
  const [collapsed, setCollapsed] = useState(false);
  const mobileDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try { setCollapsed(window.localStorage.getItem("permission-next-sidebar-collapsed") === "1"); }
      catch { /* Storage may be unavailable; the expanded sidebar remains usable. */ }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    try { window.localStorage.setItem("permission-next-sidebar-collapsed", next ? "1" : "0"); }
    catch { /* The preference is optional. */ }
  }

  return <div className={`app ${rollout ? rolloutStyles.shell : "workspace-shell"} ${collapsed ? (rollout ? rolloutStyles.collapsed : "sidebar-collapsed") : ""}`} data-work-rollout-shell={rollout ? "" : undefined}>
    <a className="skip-link" href="#workspace-content">ข้ามไปยังเนื้อหาหลัก</a>
    <div className={rollout ? rolloutStyles.header : "shell-header"}>
      <header className={rollout ? rolloutStyles.topbar : "topbar"}>
        <button className={rollout ? rolloutStyles.mobileToggle : "round-btn sidebar-mobile-toggle"} type="button" aria-label="เปิดเมนูพื้นที่ทำงาน" aria-haspopup="dialog" aria-controls="mobile-workspace-menu" onClick={() => mobileDialog.current?.showModal()}><span className="sidebar-menu-icon" aria-hidden="true"><span/><span/><span/></span></button>
        <Link className={rollout ? rolloutStyles.brand : "top-brand"} href="/" aria-label="Permission Next — ภาพรวม"><span className={rollout ? rolloutStyles.brandMark : "top-brand-mark"} aria-hidden="true">PN</span><span className={rollout ? rolloutStyles.brandText : "top-brand-copy"}><strong>Permission Next</strong><small>พื้นที่ทำงานของทีม</small></span></Link>
        {rollout ? <div className={rolloutStyles.search}><WorkspaceSearch allowedModuleIds={allowedModuleIds} contained/></div> : <WorkspaceSearch allowedModuleIds={allowedModuleIds}/>}
        <div className={rollout ? rolloutStyles.actions : "top-actions"}>
          {notificationCenter}
          <WorkspaceThemeToggle defaultTheme={rollout ? "light" : undefined}/>
          <div className={rollout ? rolloutStyles.account : "top-account"}>
            <AccountControl displayName={displayName} />
          </div>
        </div>
      </header>
    </div>
    <aside className={rollout ? rolloutStyles.sidebar : `workspace-sidebar ${collapsed ? "sidebar-collapsed" : ""}`} aria-label="เมนูหลัก">
      <div className={rollout ? rolloutStyles.sidebarHeading : "sidebar-heading"}><span className="sidebar-heading-label">พื้นที่ทำงาน</span>{!rollout && <span className="sidebar-heading-rule"/>}
        <button className={rollout ? rolloutStyles.collapse : "sidebar-collapse-button"} type="button" aria-label={collapsed ? "ขยายเมนูด้านข้าง" : "ยุบเมนูด้านข้าง"} aria-expanded={!collapsed} onClick={toggleCollapsed} title={collapsed ? "ขยายเมนู" : "ยุบเมนู"}>
          <WorkspaceIcon name="chevron" size={20}/>
        </button>
      </div>
      <ModuleNav allowedModuleIds={allowedModuleIds} collapsed={collapsed} canAdmin={canAdmin} workNavigation={workNavigation} />
      {!collapsed && scopeLabel && <p className="sidebar-scope">คุณเห็นข้อมูลของ:<br/>{scopeLabel}</p>}
    </aside>
    <dialog className={rollout ? rolloutStyles.drawer : "workspace-mobile-dialog"} id="mobile-workspace-menu" ref={mobileDialog} aria-label="เมนูพื้นที่ทำงาน" onClick={(event) => { if (event.target === mobileDialog.current) mobileDialog.current?.close(); }}>
      <div className={rollout ? undefined : "mobile-sidebar-content"}>
        <div className={rollout ? rolloutStyles.drawerHeading : "mobile-sidebar-heading"}><strong>พื้นที่ทำงาน</strong><button className="round-btn" type="button" aria-label="ปิดเมนูพื้นที่ทำงาน" onClick={() => mobileDialog.current?.close()}><WorkspaceIcon name="close" size={20}/></button></div>
        <ModuleNav allowedModuleIds={allowedModuleIds} canAdmin={canAdmin} workNavigation={workNavigation} onNavigate={() => mobileDialog.current?.close()} />
      </div>
    </dialog>
    <main className={rollout ? rolloutStyles.main : "main"} id="workspace-content" tabIndex={-1}>{children}</main>
  </div>;
}
