"use client";
import { copy } from "@/lib/copy";

import Link from "next/link";
import type { DashboardSnapshot } from "@/lib/dashboard";
import { modules, type ModuleId } from "@/lib/module-registry";
import { WorkspaceQueue } from "@/components/workspace-queue";
import { PreviewNotice, RefreshButton, SourceDetails } from "@/components/workspace-feedback";
import { WorkspaceIcon } from "@/components/workspace-icon";
import { TruncatedText } from "@/components/ui/truncated-text";
import { PageHeader } from "@/components/ui/page-header";
import { formatWorkspaceDate } from "@/lib/workspace-view";

export function DashboardOverview({ displayName, userId, allowedModuleIds, developmentMode, preview, snapshot }: {
  displayName: string; userId: string; allowedModuleIds: ModuleId[]; developmentMode: boolean; preview: boolean; snapshot: DashboardSnapshot;
}) {
  const hasLiveData = snapshot.sources.some((source) => source.status === "ready");
  return <div className="operational-home">
    <PreviewNotice developmentMode={developmentMode} preview={preview}/>
    <PageHeader className="page-enter" eyebrow="ภาพรวมการทำงาน" title="วันนี้ต้องจัดการอะไรบ้าง" description={`สวัสดี ${displayName} · รวมงานและรายการสำคัญที่คุณต้องติดตาม`} actions={<><RefreshButton/><span className="updated-at">{hasLiveData ? `ข้อมูล ณ ${formatWorkspaceDate(snapshot.generatedAt, true)}` : copy.feedback.dataPreparing}</span></>}/>
    {allowedModuleIds.length ? <WorkspaceQueue snapshot={snapshot} userId={userId} preview={preview} showMetrics/> : <div className="queue-empty"><WorkspaceIcon name="guarantees" size={32}/><h2>ยังไม่มีพื้นที่ทำงานที่เข้าถึงได้</h2><p>กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์ตามหน้าที่ของคุณ</p></div>}
    {allowedModuleIds.length > 0 && <div className="module-directory-heading"><h2>ทำงานต่อในพื้นที่ของคุณ</h2><p>เปิดโมดูลที่คุณมีสิทธิ์ใช้งาน</p></div>}
    <section className="module-directory work-card-stagger" aria-label="เปิดพื้นที่ทำงาน">{modules.filter((module) => allowedModuleIds.includes(module.id)).map((module) => <Link href={`${module.href}${preview ? "?preview=1" : ""}`} key={module.id}>
       <span className="module-mark"><WorkspaceIcon name={module.icon} size={24}/></span><span className="module-directory-copy"><TruncatedText text={module.name} lines={1}/><TruncatedText text={module.purpose} lines={2}/></span><WorkspaceIcon name="arrow" size={18}/>
    </Link>)}</section>
    {allowedModuleIds.length > 0 && <SourceDetails snapshot={snapshot} preview={preview}/>}
  </div>;
}
