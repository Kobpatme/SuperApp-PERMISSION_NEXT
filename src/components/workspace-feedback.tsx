"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import type { DashboardSnapshot } from "@/lib/dashboard";
import { WorkspaceIcon } from "@/components/workspace-icon";
import { copy } from "@/lib/copy";

export function PreviewNotice({ preview, developmentMode }: { preview: boolean; developmentMode: boolean }) {
  const pathname = usePathname();
  if (!developmentMode) return null;
  return <div className={`environment-banner ${preview ? "is-preview" : ""}`} role="status">
    <WorkspaceIcon name="info" size={18}/><span><strong>{preview ? "กำลังแสดงข้อมูลตัวอย่าง" : "โหมดพัฒนา"}</strong> {preview ? "รายการทั้งหมดเป็นข้อมูลสมมติสำหรับทดลองใช้งาน" : "ข้อมูลจริงจะแสดงเมื่อเชื่อมต่อระบบต้นทาง"}</span>
    <Link href={preview ? pathname : `${pathname}?preview=1`}>{preview ? "ออกจากตัวอย่าง" : "ลองด้วยข้อมูลตัวอย่าง"}<WorkspaceIcon name="arrow" size={16}/></Link>
  </div>;
}

export function RefreshButton({ onRefresh, refreshPending = false }: { onRefresh?: () => void; refreshPending?: boolean } = {}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const busy = pending || refreshPending;
  return <button type="button" className="secondary-action" disabled={busy} onClick={() => onRefresh ? onRefresh() : startTransition(() => router.refresh())}>
    <WorkspaceIcon name="refresh" size={17}/><span>{busy ? "กำลังอัปเดต…" : "อัปเดตข้อมูล"}</span>
  </button>;
}

export function SourceDetails({ snapshot, preview }: { snapshot: DashboardSnapshot; preview: boolean }) {
  if (preview || snapshot.sources.every(source => source.status === "ready")) return null;
  return <div className="source-details" role="status"><p>{copy.feedback.partial}</p><RefreshButton/></div>;
}
