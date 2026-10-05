import Link from "next/link";
import type { AuthorizationSubject } from "@/lib/authorization";
import type { WorkReadModel } from "@/lib/work-read-model";
import { WorkEmpty, WorkMetricStrip, WorkScreenShell, WorkUnavailable } from "@/features/work/components/work-screen-shell";
import { WorkTaskTable } from "@/features/work/components/task-table";

export function TeamCommandScreen({ model, subject }: { model: WorkReadModel; subject?: AuthorizationSubject }) {
  if (model.source.status !== "ready") return <WorkScreenShell title="ภาพรวมทีม" description="ติดตามภาระงานและความเสี่ยงของทีม"><WorkUnavailable message="ยังโหลดข้อมูลทีมไม่ได้" detail={model.source.message} /></WorkScreenShell>;
  const teamTasks = model.tasks;
  const now = Date.parse(model.generatedAt);
  return <WorkScreenShell title="ภาพรวมทีม" description="ดูภาระงาน กำหนด และจุดที่ต้องช่วยแก้ของทีม" action={<Link className="primary" href="/work/assign">มอบหมายงาน</Link>}>
    <WorkMetricStrip metrics={[{ label: "งานทีม", value: teamTasks.length, detail: "รายการในทีมที่เข้าถึงได้" }, { label: "รอเริ่ม", value: teamTasks.filter((task) => task.status === "queued").length, detail: "รอรับงาน", tone: "info" }, { label: "พักงาน", value: teamTasks.filter((task) => task.status === "blocked").length, detail: "ต้องติดตาม", tone: "warning" }, { label: "เกินกำหนด", value: teamTasks.filter((task) => task.dueAt && Date.parse(task.dueAt) < now && !["completed", "cancelled"].includes(task.status)).length, detail: "ควรเร่งดำเนินการ", tone: "danger" }]} />
    {teamTasks.length ? <section className="work-panel"><div className="work-section-head"><div><h2>งานที่ทีมต้องติดตาม</h2><p>ใช้ตัวกรอง People และ Job Tracker เพื่อเจาะรายละเอียด</p></div><div className="work-inline-links"><Link className="text-btn" href="/work/people">ดูบุคลากร</Link><Link className="text-btn" href="/work/tracker">ดู Job Tracker</Link></div></div><WorkTaskTable tasks={teamTasks} subject={subject} showNotes /></section> : <WorkEmpty title="ยังไม่มีงานในทีมที่เข้าถึงได้" detail="เมื่อมีงานที่อยู่ในขอบเขตทีม รายการและภาระงานจะแสดงที่นี่" />}
  </WorkScreenShell>;
}

