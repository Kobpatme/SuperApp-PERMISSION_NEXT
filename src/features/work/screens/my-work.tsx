"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import type { AuthorizationSubject } from "@/lib/authorization";
import type { WorkReadModel } from "@/lib/work-read-model";
import { personalWorkOverview } from "@/lib/work-overview";
import { Button, ButtonLink } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import type { WorkCreateFormStatus } from "@/components/work-create-form";
import { WorkEmpty, WorkMetricStrip, WorkScreenShell, WorkUnavailable } from "@/features/work/components/work-screen-shell";
import { WorkTaskDetail, WorkTaskTable } from "@/features/work/components/task-table";
import { WorkCreateForm } from "@/components/work-create-form";

export function MyWorkDashboard({ model, subject, userId, detailId, canCreate }: { model: WorkReadModel; subject?: AuthorizationSubject; userId: string; detailId?: string; canCreate?: boolean }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [formStatus, setFormStatus] = useState<WorkCreateFormStatus>({ pending: false, dirty: false });
  const discardResolver = useRef<((discard: boolean) => void) | null>(null);
  const router = useRouter();
  const handleFormStatus = useCallback((status: WorkCreateFormStatus) => setFormStatus(status), []);
  const confirmDiscard = useCallback(() => new Promise<boolean>((resolve) => { discardResolver.current = resolve; setDiscardOpen(true); }), []);
  const finishDiscard = useCallback((discard: boolean) => { setDiscardOpen(false); discardResolver.current?.(discard); discardResolver.current = null; }, []);
  const closeCreate = useCallback((next: boolean) => { setCreateOpen(next); if (!next) { setFormStatus({ pending: false, dirty: false }); router.refresh(); } }, [router]);
  const handleCreateSuccess = useCallback(() => closeCreate(false), [closeCreate]);
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
      {detail ? <WorkTaskDetail task={detail} subject={subject} /> : mine.length ? <section className="work-panel work-premium-card"><div className="work-section-head"><div><h2>งานที่ต้องทำ</h2><p>เลือกงานเพื่อเปิดรายละเอียดและคำสั่งที่ทำได้</p></div><ButtonLink variant="secondary" href="/work/mine">ดูรายการทั้งหมด</ButtonLink></div><WorkTaskTable tasks={mine.slice(0, 8)} subject={subject} showNotes appearance="workspace"/></section> : <WorkEmpty title="ยังไม่มีงานที่ได้รับมอบหมาย" detail="งานใหม่ที่อยู่ในขอบเขตของคุณจะแสดงที่นี่ เมื่อมีงานแล้วคุณจะรับงานและอัปเดตสถานะได้จากรายการนี้." />}
      {model.activities.length > 0 && <section className="work-panel work-card-stagger"><div className="work-section-head"><div><h2>กิจกรรมล่าสุด</h2><p>การเปลี่ยนแปลงที่เกี่ยวข้องกับงานในขอบเขตของคุณ</p></div><ButtonLink variant="ghost" href="/work?view=activity">ดูทั้งหมด</ButtonLink></div><ol className="work-activity-list">{model.activities.slice(0, 6).map((event) => <li key={event.id}><span className="work-activity-dot" aria-hidden="true" /><div><strong>{event.eventLabel}</strong><span>{event.ownerName} · {new Date(event.occurredAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</span></div></li>)}</ol></section>}
      <Dialog open={createOpen} title="เพิ่มงานใหม่" description="กรอกข้อมูลที่จำเป็นเพื่อสร้างงานในขอบเขตสิทธิ์ของคุณ" busy={formStatus.pending} beforeClose={() => formStatus.dirty ? confirmDiscard() : true} onOpenChange={closeCreate} className="work-create-dialog">
        <WorkCreateForm key={createOpen ? "open" : "closed"} model={model} userId={userId} inDialog onStatus={handleFormStatus} onSuccess={handleCreateSuccess} />
      </Dialog>
      <ConfirmDialog open={discardOpen} title="ทิ้งข้อมูลที่กรอกไว้หรือไม่" consequence="ข้อมูลที่ยังไม่ได้บันทึกจะหายไป" confirmLabel="ทิ้งข้อมูล" onCancel={() => finishDiscard(false)} onConfirm={() => finishDiscard(true)} />
    </WorkScreenShell>
  );
}

export function MyTasksScreen({ model, subject, userId, canCreate }: { model: WorkReadModel; subject?: AuthorizationSubject; userId: string; canCreate?: boolean }) {
  if (model.source.status !== "ready") return <WorkScreenShell title="งานของฉัน" description="รายการงานส่วนตัวและงานที่ได้รับมอบหมาย" appearance="workspace"><WorkUnavailable message="ยังโหลดรายการงานไม่ได้" detail={model.source.message} /></WorkScreenShell>;
  const mine = model.tasks.filter((task) => task.ownerId === userId);
  return <WorkScreenShell title="งานของฉัน" description="รายการงานส่วนตัวและงานที่ได้รับมอบหมาย พร้อมสถานะที่อัปเดตได้ตามสิทธิ์" parent={{ label: "งานและ KPI", href: "/work" }} appearance="workspace">{mine.length ? <WorkTaskTable tasks={mine} subject={subject} showNotes appearance="workspace" /> : <WorkEmpty title="ยังไม่มีงานในรายการของคุณ" detail="ลองเพิ่มงาน หรือรอหัวหน้ามอบหมายงานใหม่ให้คุณ" action={canCreate ? <ButtonLink variant="secondary" href="/work/new">เพิ่มงาน</ButtonLink> : undefined} />}</WorkScreenShell>;
}
