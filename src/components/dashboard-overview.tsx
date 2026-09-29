"use client";

import Link from "next/link";
import type { DashboardSnapshot } from "@/lib/dashboard";
import { modules, type ModuleId } from "@/lib/module-registry";
import { WorkspaceQueue } from "@/components/workspace-queue";
import { PreviewNotice, RefreshButton, SourceDetails } from "@/components/workspace-feedback";
import { WorkspaceIcon } from "@/components/workspace-icon";
import { formatWorkspaceDate } from "@/lib/workspace-view";

export function DashboardOverview({ displayName, userId, allowedModuleIds, developmentMode, preview, snapshot }: {
  displayName: string; userId: string; allowedModuleIds: ModuleId[]; developmentMode: boolean; preview: boolean; snapshot: DashboardSnapshot;
}) {
  const hasLiveData = snapshot.sources.some((source) => source.status === "ready");
  return <div className="operational-home">
    <PreviewNotice developmentMode={developmentMode} preview={preview}/>
    <header className="page-heading">
      <div><p className="eyebrow">ภาพรวมการทำงาน</p><h1>วันนี้ต้องจัดการอะไรบ้าง</h1><p className="sub">สวัสดี {displayName} · รวมงานและรายการสำคัญที่คุณต้องติดตาม</p></div>
      <div className="heading-actions"><RefreshButton/><span className="updated-at">{hasLiveData ? `ข้อมูล ณ ${formatWorkspaceDate(snapshot.generatedAt, true)}` : "รอเชื่อมข้อมูลจากระบบต้นทาง"}</span></div>
    </header>
    {allowedModuleIds.length ? <WorkspaceQueue snapshot={snapshot} userId={userId} preview={preview} showMetrics/> : <div className="queue-empty"><WorkspaceIcon name="guarantees" size={32}/><h2>ยังไม่มีพื้นที่ทำงานที่เข้าถึงได้</h2><p>กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์ตามหน้าที่ของคุณ</p></div>}
    <section className="module-directory" aria-label="เปิดพื้นที่ทำงาน">{modules.filter((module) => allowedModuleIds.includes(module.id)).map((module) => <Link href={`${module.href}${preview ? "?preview=1" : ""}`} key={module.id}>
      <span className="module-mark"><WorkspaceIcon name={module.icon} size={23}/></span><span><strong>{module.name}</strong><small>{module.purpose}</small></span><WorkspaceIcon name="arrow" size={18}/>
    </Link>)}</section>
    {allowedModuleIds.length > 0 && <SourceDetails snapshot={snapshot} preview={preview}/>}
  </div>;
}
