"use client";

import { useEffect, useRef, useState } from "react";
import { ModuleNav, type WorkNavItem } from "@/components/module-nav";
import { WorkspaceThemeToggle } from "@/components/workspace-theme-toggle";
import { AccountControl } from "@/components/account-control";
import { WorkspaceSearch } from "@/components/workspace-search";
import type { ModuleId } from "@/lib/module-registry";
import { WorkspaceIcon } from "@/components/workspace-icon";
import Link from "next/link";

export function AppShell({ children, displayName = "ผู้ใช้งาน", allowedModuleIds, canAdmin = false, workNavigation = [], notificationCenter, scopeLabel }: { children: React.ReactNode; displayName?: string; allowedModuleIds: ModuleId[]; canAdmin?: boolean; workNavigation?: WorkNavItem[]; notificationCenter?: React.ReactNode; scopeLabel?: string }) {
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

  return <div className={`app workspace-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
    <a className="skip-link" href="#workspace-content">ข้ามไปยังเนื้อหาหลัก</a>
    <div className="shell-header">
      <header className="topbar">
        <button className="round-btn sidebar-mobile-toggle" type="button" aria-label="เปิดเมนูพื้นที่ทำงาน" aria-haspopup="dialog" aria-controls="mobile-workspace-menu" onClick={() => mobileDialog.current?.showModal()}><span className="sidebar-menu-icon" aria-hidden="true"><span/><span/><span/></span></button>
        <Link className="top-brand" href="/" aria-label="Permission Next — ภาพรวม"><span className="top-brand-mark" aria-hidden="true">PN</span><span className="top-brand-copy"><strong>Permission Next</strong><small>พื้นที่ทำงานของทีม</small></span></Link>
        <WorkspaceSearch allowedModuleIds={allowedModuleIds} />
        <div className="top-actions">
          {notificationCenter}
          <WorkspaceThemeToggle />
          <AccountControl displayName={displayName} />
        </div>
      </header>
    </div>
    <aside className="workspace-sidebar" aria-label="เมนูหลัก">
      <div className="sidebar-heading"><span className="sidebar-heading-label">พื้นที่ทำงาน</span><span className="sidebar-heading-rule"/>
        <button className="sidebar-collapse-button" type="button" aria-label={collapsed ? "ขยายเมนูด้านข้าง" : "ยุบเมนูด้านข้าง"} aria-expanded={!collapsed} onClick={toggleCollapsed} title={collapsed ? "ขยายเมนู" : "ยุบเมนู"}>
          <WorkspaceIcon name="chevron" size={20}/>
        </button>
      </div>
      <ModuleNav allowedModuleIds={allowedModuleIds} collapsed={collapsed} canAdmin={canAdmin} workNavigation={workNavigation} />
      {!collapsed && scopeLabel && <p className="sidebar-scope">คุณเห็นข้อมูลของ:<br/>{scopeLabel}</p>}
    </aside>
    <dialog className="workspace-mobile-dialog" id="mobile-workspace-menu" ref={mobileDialog} aria-label="เมนูพื้นที่ทำงาน" onClick={(event) => { if (event.target === mobileDialog.current) mobileDialog.current?.close(); }}>
      <div className="mobile-sidebar-content">
        <div className="mobile-sidebar-heading"><strong>พื้นที่ทำงาน</strong><button className="round-btn" type="button" aria-label="ปิดเมนูพื้นที่ทำงาน" onClick={() => mobileDialog.current?.close()}><WorkspaceIcon name="close" size={20}/></button></div>
        <ModuleNav allowedModuleIds={allowedModuleIds} canAdmin={canAdmin} workNavigation={workNavigation} onNavigate={() => mobileDialog.current?.close()} />
      </div>
    </dialog>
    <main className="main" id="workspace-content" tabIndex={-1}>{children}</main>
  </div>;
}
