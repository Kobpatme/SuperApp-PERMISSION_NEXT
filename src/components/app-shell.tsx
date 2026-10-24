"use client";

import { useEffect, useRef, useState } from "react";
import { ModuleNav, type WorkNavItem } from "@/components/module-nav";
import { WorkspaceThemeToggle } from "@/components/workspace-theme-toggle";
import { AccountControl } from "@/components/account-control";
import { WorkspaceSearch } from "@/components/workspace-search";
import type { ModuleId } from "@/lib/module-registry";
import { WorkspaceIcon } from "@/components/workspace-icon";
import Link from "next/link";
import styles from "@/styles/app-shell.module.css";

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

  return <div className={`app ${styles.shell} ${collapsed ? styles.collapsed : ""}`} data-app-shell>
    <a className="skip-link" href="#workspace-content">ข้ามไปยังเนื้อหาหลัก</a>
    <div className={styles.header} data-shell-header>
      <header className={styles.topbar}>
        <button className={styles.mobileToggle} type="button" aria-label="เปิดเมนูพื้นที่ทำงาน" aria-haspopup="dialog" aria-controls="mobile-workspace-menu" onClick={() => mobileDialog.current?.showModal()}><span className="sidebar-menu-icon" aria-hidden="true"><span/><span/><span/></span></button>
        <Link className={styles.brand} href="/" aria-label="Permission Next — ภาพรวม"><span className={styles.brandMark} aria-hidden="true">PN</span><span className={styles.brandText}><strong>Permission Next</strong><small>พื้นที่ทำงานของทีม</small></span></Link>
        <div className={styles.search}><WorkspaceSearch allowedModuleIds={allowedModuleIds} contained/></div>
        <div className={styles.actions}>
          {notificationCenter}
          <WorkspaceThemeToggle defaultTheme="light"/>
          <div className={styles.account}>
            <AccountControl displayName={displayName} />
          </div>
        </div>
      </header>
    </div>
    <aside className={styles.sidebar} data-shell-sidebar aria-label="เมนูหลัก">
      <div className={styles.sidebarHeading}><span className="sidebar-heading-label">พื้นที่ทำงาน</span>
        <button className={styles.collapse} type="button" aria-label={collapsed ? "ขยายเมนูด้านข้าง" : "ยุบเมนูด้านข้าง"} aria-expanded={!collapsed} onClick={toggleCollapsed} title={collapsed ? "ขยายเมนู" : "ยุบเมนู"}>
          <WorkspaceIcon name="chevron" size={20}/>
        </button>
      </div>
      <ModuleNav allowedModuleIds={allowedModuleIds} collapsed={collapsed} canAdmin={canAdmin} workNavigation={workNavigation} />
      {!collapsed && scopeLabel && <p className="sidebar-scope">คุณเห็นข้อมูลของ:<br/>{scopeLabel}</p>}
    </aside>
    <dialog className={styles.drawer} id="mobile-workspace-menu" ref={mobileDialog} aria-label="เมนูพื้นที่ทำงาน" onClick={(event) => { if (event.target === mobileDialog.current) mobileDialog.current?.close(); }}>
      <div>
        <div className={styles.drawerHeading}><strong>พื้นที่ทำงาน</strong><button className="round-btn" type="button" aria-label="ปิดเมนูพื้นที่ทำงาน" onClick={() => mobileDialog.current?.close()}><WorkspaceIcon name="close" size={20}/></button></div>
        <ModuleNav idPrefix="mobile-sidebar-section" allowedModuleIds={allowedModuleIds} canAdmin={canAdmin} workNavigation={workNavigation} onNavigate={() => mobileDialog.current?.close()} />
      </div>
    </dialog>
    <main className={styles.main} data-shell-main id="workspace-content" tabIndex={-1}>{children}</main>
  </div>;
}
