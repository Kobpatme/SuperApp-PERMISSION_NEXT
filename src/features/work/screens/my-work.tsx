import Link from "next/link";
import type { AuthorizationSubject } from "@/lib/authorization";
import type { WorkReadModel } from "@/lib/work-read-model";
import { personalWorkOverview } from "@/lib/work-overview";
import { WorkEmpty, WorkMetricStrip, WorkScreenShell, WorkUnavailable } from "@/features/work/components/work-screen-shell";
import { WorkTaskDetail, WorkTaskTable } from "@/features/work/components/task-table";

export function MyWorkDashboard({ model, subject, userId, detailId, canCreate }: { model: WorkReadModel; subject?: AuthorizationSubject; userId: string; detailId?: string; canCreate?: boolean }) {
  if (model.source.status !== "ready") return <WorkScreenShell title="ภาพรวมงานของฉัน" description="เห็นงานที่ต้องทำและความคืบหน้าในขอบเขตของคุณ"><WorkUnavailable message="ยังโหลดข้อมูลส่วนตัวไม่ได้" detail={model.source.message} /></WorkScreenShell>;
  const overview = personalWorkOverview(model, userId);
  const mine = overview.tasks;
  const detail = detailId ? mine.find((task) => task.id === detailId) : undefined;
  return <WorkScreenShell title="ภาพรวมงานของฉัน" description="จัดลำดับงานที่ต้องทำ เห็นกำหนด และไปต่อจากจุดที่ค้างอยู่" action={canCreate ? <Link className="primary" href="/work/new">เพิ่มงาน</Link> : undefined}>
    <WorkMetricStrip metrics={[{ label: "งานทั้งหมด", value: mine.length, detail: "ในขอบเขตของฉัน" }, { label: "รอเริ่ม", value: overview.queued, detail: "รอรับหรือเริ่มงาน", tone: "info" }, { label: "ควรเร่ง", value: overview.overdue, detail: "เกินกำหนด", tone: "danger" }, { label: "ความคืบหน้า", value: overview.completion === null ? "—" : `${overview.completion}%`, detail: "ถ่วงน้ำหนักตามงาน", tone: "success" }]} />
    {mine.length === 500 && <p role="status">แสดง 500 งานล่าสุดของคุณ ความคืบหน้าคำนวณจากรายการที่แสดง ใช้ตัวกรองในรายการทั้งหมดเพื่อดูช่วงที่ต้องการ</p>}
    {detail ? <WorkTaskDetail task={detail} subject={subject} /> : mine.length ? <section className="work-panel"><div className="work-section-head"><div><h2>งานที่ต้องทำ</h2><p>เลือกงานเพื่อเปิดรายละเอียดและคำสั่งที่ทำได้</p></div><Link className="secondary-action" href="/work/mine">ดูรายการทั้งหมด</Link></div><WorkTaskTable tasks={mine.slice(0, 8)} subject={subject} showNotes /></section> : <WorkEmpty title="ยังไม่มีงานที่ได้รับมอบหมาย" detail="งานใหม่ที่อยู่ในขอบเขตของคุณจะแสดงที่นี่ เมื่อมีงานแล้วคุณจะรับงานและอัปเดตสถานะได้จากรายการนี้." action={canCreate ? <Link className="secondary-action" href="/work/new">เพิ่มงาน</Link> : undefined} />}
    {model.activities.length > 0 && <section className="work-panel"><div className="work-section-head"><div><h2>กิจกรรมล่าสุด</h2><p>การเปลี่ยนแปลงที่เกี่ยวข้องกับงานในขอบเขตของคุณ</p></div><Link className="text-btn" href="/work?view=activity">ดูทั้งหมด</Link></div><ol className="work-activity-list">{model.activities.slice(0, 6).map((event) => <li key={event.id}><span className="work-activity-dot" aria-hidden="true"/><div><strong>{event.eventLabel}</strong><span>{event.ownerName} · {new Date(event.occurredAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</span></div></li>)}</ol></section>}
  </WorkScreenShell>;
}

export function MyTasksScreen({ model, subject, userId, canCreate }: { model: WorkReadModel; subject?: AuthorizationSubject; userId: string; canCreate?: boolean }) {
  if (model.source.status !== "ready") return <WorkScreenShell title="งานของฉัน" description="รายการงานส่วนตัวและงานที่ได้รับมอบหมาย"><WorkUnavailable message="ยังโหลดรายการงานไม่ได้" detail={model.source.message} /></WorkScreenShell>;
  const mine = model.tasks.filter((task) => task.ownerId === userId);
  return <WorkScreenShell title="งานของฉัน" description="รายการงานส่วนตัวและงานที่ได้รับมอบหมาย พร้อมสถานะที่อัปเดตได้ตามสิทธิ์" parent={{ label: "งานและ KPI", href: "/work" }}>{mine.length ? <WorkTaskTable tasks={mine} subject={subject} showNotes /> : <WorkEmpty title="ยังไม่มีงานในรายการของคุณ" detail="ลองเพิ่มงาน หรือรอหัวหน้ามอบหมายงานใหม่ให้คุณ" action={canCreate ? <Link className="secondary-action" href="/work/new">เพิ่มงาน</Link> : undefined} />}</WorkScreenShell>;
}
