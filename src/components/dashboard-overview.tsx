"use client";
import { copy } from "@/lib/copy";

import Link from "next/link";
import type { DashboardSnapshot } from "@/lib/dashboard";
import { modules, type ModuleId } from "@/lib/module-registry";
import { WorkspaceQueue } from "@/components/workspace-queue";
import { PreviewNotice, RefreshButton, SourceDetails } from "@/components/workspace-feedback";
import { WorkspaceIcon } from "@/components/workspace-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { TruncatedText } from "@/components/ui/truncated-text";
import { PageHeader } from "@/components/ui/page-header";
import { formatWorkspaceDate } from "@/lib/workspace-view";

export function DashboardOverview({ displayName, userId, allowedModuleIds, developmentMode, preview, snapshot }: {
  displayName: string; userId: string; allowedModuleIds: ModuleId[]; developmentMode: boolean; preview: boolean; snapshot: DashboardSnapshot;
}) {
  const hasLiveData = snapshot.sources.some((source) => source.status === "ready");
  return <div className="work-native overview-screen" data-ui-screen="overview">
    <PreviewNotice developmentMode={developmentMode} preview={preview}/>
    <PageHeader className="page-enter" eyebrow="ภาพรวมการทำงาน" title="วันนี้ต้องจัดการอะไรบ้าง" description={`สวัสดี ${displayName} · รวมงานและรายการสำคัญที่คุณต้องติดตาม`} actions={<><RefreshButton/><span className="updated-at whitespace-nowrap text-xs text-[var(--color-text-muted)]">{hasLiveData ? `ข้อมูล ณ ${formatWorkspaceDate(snapshot.generatedAt, true)}` : copy.feedback.dataPreparing}</span></>}/>
    {allowedModuleIds.length ? <WorkspaceQueue snapshot={snapshot} userId={userId} preview={preview} showMetrics/> : <EmptyState className="overview-empty rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm" title="ยังไม่มีพื้นที่ทำงานที่เข้าถึงได้" description="กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์ตามหน้าที่ของคุณ" badge={<WorkspaceIcon name="guarantees" size={32}/>} />}
    {allowedModuleIds.length > 0 && <div className="module-directory-heading mb-4 mt-8"><h2 className="text-xl font-bold text-[var(--color-text)]">ทำงานต่อในพื้นที่ของคุณ</h2><p className="mt-1 text-sm text-[var(--color-text-muted)]">เปิดโมดูลที่คุณมีสิทธิ์ใช้งาน</p></div>}
    <section className="module-directory work-card-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="เปิดพื้นที่ทำงาน">{modules.filter((module) => allowedModuleIds.includes(module.id)).map((module) => <Link className="group flex min-h-28 items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm transition-colors duration-150 hover:border-[var(--color-brand)] hover:bg-[var(--color-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2" href={`${module.href}${preview ? "?preview=1" : ""}`} key={module.id}>
       <span className="module-mark grid size-12 shrink-0 place-items-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)] transition-transform duration-150 group-hover:scale-105"><WorkspaceIcon name={module.icon} size={24}/></span><span className="module-directory-copy min-w-0 flex-1"><TruncatedText className="font-bold text-[var(--color-text)]" text={module.name} lines={1}/><TruncatedText className="mt-1 text-sm text-[var(--color-text-muted)]" text={module.purpose} lines={2}/></span><WorkspaceIcon name="arrow" size={18}/>
    </Link>)}</section>
    {allowedModuleIds.length > 0 && <SourceDetails snapshot={snapshot} preview={preview}/>}
  </div>;
}
