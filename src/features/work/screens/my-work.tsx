"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { AuthorizationSubject } from "@/lib/authorization";
import type { WorkReadModel } from "@/lib/work-read-model";
import { personalWorkOverview } from "@/lib/work-overview";
import { Button } from "@/components/ui/button";
import { WorkEmpty, WorkMetricStrip, WorkScreenShell, WorkUnavailable } from "@/features/work/components/work-screen-shell";
import { WorkTaskDetail, WorkTaskTable } from "@/features/work/components/task-table";
import { WorkCreateForm } from "@/components/work-create-form";

export function MyWorkDashboard({ model, subject, userId, detailId, canCreate }: { model: WorkReadModel; subject?: AuthorizationSubject; userId: string; detailId?: string; canCreate?: boolean }) {
  const [createOpen, setCreateOpen] = useState(false);
  const createDialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  useEffect(() => {
    const dialog = createDialogRef.current;
    if (createOpen && dialog && !dialog.open) dialog.showModal();
  }, [createOpen]);
  if (model.source.status !== "ready") return <WorkScreenShell title="ภาพรวมงานของฉัน" description="เห็นงานที่ต้องทำและความคืบหน้าในขอบเขตของคุณ" appearance="workspace"><WorkUnavailable message="ยังโหลดข้อมูลส่วนตัวไม่ได้" detail={model.source.message} /></WorkScreenShell>;
  const overview = personalWorkOverview(model, userId);
  const mine = overview.tasks;
  const detail = detailId ? mine.find((task) => task.id === detailId) : undefined;
  return (
    <WorkScreenShell
      title="ภาพรวมงานของฉัน"
      description="จัดลำดับงานที่ต้องทำ เห็นกำหนด และไปต่อจากจุดที่ค้างอยู่"
      action={canCreate ? <Button variant="primary" onClick={() => setCreateOpen(true)}>เพิ่มงาน</Button> : undefined}
      appearance="workspace"
    >
      <WorkMetricStrip metrics={[{ label: "งานทั้งหมด", value: mine.length, detail: "ในขอบเขตของฉัน" }, { label: "รอเริ่ม", value: overview.queued, detail: "รอรับหรือเริ่มงาน", tone: "info" }, { label: "ควรเร่ง", value: overview.overdue, detail: "เกินกำหนด", tone: "danger" }, { label: "ความคืบหน้า", value: overview.completion === null ? "—" : `${overview.completion}%`, detail: "ถ่วงน้ำหนักตามงาน", tone: "success" }]} />
      {mine.length === 500 && <p role="status">แสดง 500 งานล่าสุดของคุณ ความคืบหน้าคำนวณจากรายการที่แสดง ใช้ตัวกรองในรายการทั้งหมดเพื่อดูช่วงที่ต้องการ</p>}
      {detail ? <WorkTaskDetail task={detail} subject={subject} /> : mine.length ? <section className="work-panel work-premium-card"><div className="work-section-head"><div><h2>งานที่ต้องทำ</h2><p>เลือกงานเพื่อเปิดรายละเอียดและคำสั่งที่ทำได้</p></div><Link className="btn-secondary" href="/work/mine">ดูรายการทั้งหมด</Link></div><WorkTaskTable tasks={mine.slice(0, 8)} subject={subject} showNotes appearance="workspace"/></section> : <WorkEmpty title="ยังไม่มีงานที่ได้รับมอบหมาย" detail="งานใหม่ที่อยู่ในขอบเขตของคุณจะแสดงที่นี่ เมื่อมีงานแล้วคุณจะรับงานและอัปเดตสถานะได้จากรายการนี้." />}
      {model.activities.length > 0 && <section className="work-panel work-card-stagger"><div className="work-section-head"><div><h2>กิจกรรมล่าสุด</h2><p>การเปลี่ยนแปลงที่เกี่ยวข้องกับงานในขอบเขตของคุณ</p></div><Link className="text-btn" href="/work?view=activity">ดูทั้งหมด</Link></div><ol className="work-activity-list">{model.activities.slice(0, 6).map((event) => <li key={event.id}><span className="work-activity-dot" aria-hidden="true" /><div><strong>{event.eventLabel}</strong><span>{event.ownerName} · {new Date(event.occurredAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</span></div></li>)}</ol></section>}
      {createOpen && (
        <dialog ref={createDialogRef} className="work-create-dialog" aria-labelledby="work-create-title" onClose={() => { setCreateOpen(false); router.refresh(); }} onCancel={(event) => { event.preventDefault(); createDialogRef.current?.close(); }}>
          <div className="dialog-header">
            <h3 id="work-create-title">เพิ่มงานใหม่</h3>
            <button className="text-btn" type="button" onClick={() => createDialogRef.current?.close()}>ปิด</button>
          </div>
          <WorkCreateForm model={model} userId={userId} />
        </dialog>
      )}
    </WorkScreenShell>
  );
}

export function MyTasksScreen({ model, subject, userId, canCreate }: { model: WorkReadModel; subject?: AuthorizationSubject; userId: string; canCreate?: boolean }) {
  if (model.source.status !== "ready") return <WorkScreenShell title="งานของฉัน" description="รายการงานส่วนตัวและงานที่ได้รับมอบหมาย" appearance="workspace"><WorkUnavailable message="ยังโหลดรายการงานไม่ได้" detail={model.source.message} /></WorkScreenShell>;
  const mine = model.tasks.filter((task) => task.ownerId === userId);
  return <WorkScreenShell title="งานของฉัน" description="รายการงานส่วนตัวและงานที่ได้รับมอบหมาย พร้อมสถานะที่อัปเดตได้ตามสิทธิ์" parent={{ label: "งานและ KPI", href: "/work" }} appearance="workspace">{mine.length ? <WorkTaskTable tasks={mine} subject={subject} showNotes appearance="workspace" /> : <WorkEmpty title="ยังไม่มีงานในรายการของคุณ" detail="ลองเพิ่มงาน หรือรอหัวหน้ามอบหมายงานใหม่ให้คุณ" action={canCreate ? <Link className="secondary-action" href="/work/new">เพิ่มงาน</Link> : undefined} />}</WorkScreenShell>;
}
