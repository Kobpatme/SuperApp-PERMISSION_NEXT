"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { DashboardSnapshot } from "@/lib/dashboard";
import { getModule } from "@/lib/module-registry";
import { WorkspaceIcon } from "@/components/workspace-icon";

export function PreviewNotice({ preview, developmentMode }: { preview: boolean; developmentMode: boolean }) {
  const pathname = usePathname();
  if (!developmentMode) return null;
  return <div className={`environment-banner ${preview ? "is-preview" : ""}`} role="status">
    <WorkspaceIcon name="info" size={18}/><span><strong>{preview ? "กำลังแสดงข้อมูลตัวอย่าง" : "โหมดพัฒนา"}</strong> {preview ? "รายการทั้งหมดเป็นข้อมูลสมมติสำหรับทดลองใช้งาน" : "ข้อมูลจริงจะแสดงเมื่อเชื่อมต่อระบบต้นทาง"}</span>
    <Link href={preview ? pathname : `${pathname}?preview=1`}>{preview ? "ออกจากตัวอย่าง" : "ลองด้วยข้อมูลตัวอย่าง"}<WorkspaceIcon name="arrow" size={16}/></Link>
  </div>;
}

export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" className="secondary-action" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
    <WorkspaceIcon name="refresh" size={17}/><span>{pending ? "กำลังอัปเดต…" : "อัปเดตข้อมูล"}</span>
  </button>;
}

export function SourceDetails({ snapshot, preview }: { snapshot: DashboardSnapshot; preview: boolean }) {
  const params = useSearchParams();
  const ready = snapshot.sources.filter((source) => source.status === "ready").length;
  return <details className="source-details">
    <summary><WorkspaceIcon name="info" size={17}/><span>{preview ? "แหล่งข้อมูล: ตัวอย่างการใช้งาน" : `สถานะข้อมูล · เชื่อมต่อ ${ready} จาก ${snapshot.sources.length} ระบบ`}</span><span className="source-details-hint">ดูรายละเอียด</span></summary>
    <div className="source-readiness-list">{snapshot.sources.map((source) => <div className="source-readiness-row" key={source.moduleId}>
      <WorkspaceIcon name={getModule(source.moduleId)!.icon}/><span><strong>{getModule(source.moduleId)?.name}</strong><small>{preview ? "ข้อมูลสมมติ ไม่มีผลต่อข้อมูลจริง" : source.status === "ready" ? "เชื่อมต่อแล้ว" : source.status === "unavailable" ? "เชื่อมต่อไม่สำเร็จ ลองอัปเดตข้อมูลอีกครั้ง" : "อยู่ระหว่างเตรียมข้อมูล กรุณาติดต่อผู้ดูแลระบบ"}</small></span>
      <Link href={`${getModule(source.moduleId)!.href}${params.get("preview") === "1" ? "?preview=1" : ""}`}>เปิดรายการ<WorkspaceIcon name="arrow" size={16}/></Link>
    </div>)}</div>
    <p>แสดงรายการติดตามจากระบบที่เชื่อมต่อแล้วตามสิทธิ์ของคุณ ข้อมูลสรุปอาจไม่ครอบคลุมทะเบียนทั้งหมด</p>
  </details>;
}
