"use client";
import { copy } from "@/lib/copy";

import Link from "next/link";
import type { DashboardSnapshot } from "@/lib/dashboard";
import { modules, type ModuleId } from "@/lib/module-registry";
import { WorkspaceQueue } from "@/components/workspace-queue";
import { PreviewNotice, RefreshButton, SourceDetails } from "@/components/workspace-feedback";
import { WorkspaceIcon } from "@/components/workspace-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import styles from "./overview.module.css";
import { PageHeader } from "@/components/ui/page-header";
import { formatWorkspaceDate } from "@/lib/workspace-view";

export function DashboardOverview({ displayName, userId, allowedModuleIds, developmentMode, preview, snapshot }: {
  displayName: string; userId: string; allowedModuleIds: ModuleId[]; developmentMode: boolean; preview: boolean; snapshot: DashboardSnapshot;
}) {
  const hasLiveData = snapshot.sources.some((source) => source.status === "ready");
  const allowedModules = modules.filter((module) => allowedModuleIds.includes(module.id));
  return <div className={`work-native overview-screen ${styles.screen}`} data-ui-screen="overview">
    <PreviewNotice developmentMode={developmentMode} preview={preview}/>
    <PageHeader eyebrow="ภาพรวมการทำงาน" title="วันนี้ต้องจัดการอะไรบ้าง" description={`สวัสดี ${displayName} · รวมงานและรายการสำคัญที่คุณต้องติดตาม`} actions={<div className={styles.freshness}><RefreshButton/><span className="updated-at">{hasLiveData ? `ข้อมูล ณ ${formatWorkspaceDate(snapshot.generatedAt, true)}` : copy.feedback.dataPreparing}</span></div>}/>
    {allowedModuleIds.length ? <WorkspaceQueue snapshot={snapshot} userId={userId} preview={preview} showMetrics appearance="overview"/> : <EmptyState className={`overview-empty ${styles.empty}`} title="ยังไม่มีพื้นที่ทำงานที่เข้าถึงได้" description="กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์ตามหน้าที่ของคุณ" badge={<WorkspaceIcon name="guarantees" size={32}/>} />}
    {allowedModuleIds.length > 0 && <Panel className={styles.directory} title="ทำงานต่อในพื้นที่ของคุณ" description="เปิดโมดูลที่คุณมีสิทธิ์ใช้งาน" actions={<span className={styles.directoryCount}>{allowedModules.length} พื้นที่ทำงาน</span>}>
      <nav className={styles.moduleList} aria-label="เปิดพื้นที่ทำงาน">{allowedModules.map((module) => <Link className={styles.moduleLink} href={`${module.href}${preview ? "?preview=1" : ""}`} key={module.id}>
        <span className={styles.moduleMark}><WorkspaceIcon name={module.icon} size={22}/></span><span className={styles.moduleCopy}><strong>{module.name}</strong><span>{module.purpose}</span></span><WorkspaceIcon name="arrow" size={18}/>
      </Link>)}</nav>
    </Panel>}
    {allowedModuleIds.length > 0 && <SourceDetails snapshot={snapshot} preview={preview}/>}
  </div>;
}
