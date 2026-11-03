"use client";

import { useEffect, useState } from "react";
import { ModuleNav, type WorkNavItem } from "@/components/module-nav";
import { WorkspaceThemeToggle } from "@/components/workspace-theme-toggle";
import { AccountControl } from "@/components/account-control";
import { WorkspaceSearch } from "@/components/workspace-search";
import type { ModuleId } from "@/lib/module-registry";
import { WorkspaceIcon } from "@/components/workspace-icon";

import Link from "next/link";
import Image from "next/image";
import styles from "@/styles/app-shell.module.css";
import { Dialog } from "@/components/ui/dialog";

export function AppShell({ children, displayName = "ผู้ใช้งาน", allowedModuleIds, canAdmin = false, workNavigation = [], notificationCenter, scopeLabel }: { children: React.ReactNode; displayName?: string; allowedModuleIds: ModuleId[]; canAdmin?: boolean; workNavigation?: WorkNavItem[]; notificationCenter?: React.ReactNode; scopeLabel?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  return <div className={`app ${styles.shell} ${collapsed ? styles.collapsed : ""} bg-[var(--color-bg)] text-[var(--color-text)]`} data-app-shell>
    <a className="skip-link" href="#workspace-content">ข้ามไปยังเนื้อหาหลัก</a>
    <div className={`${styles.header} border-b border-[var(--color-border)] bg-[var(--color-surface)]`} data-shell-header>
      <header className={`${styles.topbar} flex items-center gap-4`}>
        <button className={`${styles.mobileToggle} transition-colors hover:border-[var(--color-brand)] hover:bg-[var(--color-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]`} type="button" aria-label="เปิดเมนูนำทาง" aria-haspopup="dialog" onClick={() => setMobileOpen(true)}><span className="sidebar-menu-icon" aria-hidden="true"><span/><span/><span/></span></button>
        <Link className={`${styles.brand} transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2`} href="/" aria-label="Permission Next — ภาพรวม"><span className={`${styles.brandMark} shadow-sm`} aria-hidden="true"><Image src="/logo.png" alt="" width={40} height={40} priority style={{ objectFit: "contain" }}/></span><span className={styles.brandText}><strong>Permission Next</strong></span></Link>
        <div className={`${styles.search} min-w-0 flex-1`}><WorkspaceSearch allowedModuleIds={allowedModuleIds} contained/></div>
        <div className={`${styles.actions} flex items-center gap-2`}>
          {notificationCenter}
          <WorkspaceThemeToggle defaultTheme="light"/>
          <div className={styles.account}>
            <AccountControl displayName={displayName} />
          </div>
        </div>
      </header>
    </div>
    <aside className={`${styles.sidebar} border-r border-[var(--color-nav-border)] shadow-sm`} data-shell-sidebar aria-label="เมนูหลัก">
      <div className={styles.sidebarHeading}>
        <button className={`${styles.collapse} transition-colors hover:border-[var(--color-nav-accent)] hover:text-[var(--color-nav-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-nav-focus)]`} type="button" aria-label={collapsed ? "ขยายเมนูด้านข้าง" : "ยุบเมนูด้านข้าง"} aria-expanded={!collapsed} onClick={toggleCollapsed} title={collapsed ? "ขยายเมนู" : "ยุบเมนู"}>
          <WorkspaceIcon name="chevron" size={20}/>
        </button>
      </div>
      <ModuleNav allowedModuleIds={allowedModuleIds} collapsed={collapsed} canAdmin={canAdmin} workNavigation={workNavigation} />
      {!collapsed && scopeLabel && <p className="sidebar-scope text-xs leading-5 text-[var(--color-nav-muted)]">คุณเห็นข้อมูลของ:<br/>{scopeLabel}</p>}
    </aside>
    <Dialog open={mobileOpen} title="Permission Next" className={styles.drawer} onOpenChange={setMobileOpen}>
      <ModuleNav idPrefix="mobile-sidebar-section" allowedModuleIds={allowedModuleIds} canAdmin={canAdmin} workNavigation={workNavigation} onNavigate={() => setMobileOpen(false)} />
    </Dialog>
    <main className={`${styles.main} min-w-0`} data-shell-main id="workspace-content" tabIndex={-1}>{children}</main>
  </div>;
}
