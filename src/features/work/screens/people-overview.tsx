import Link from "next/link";
import type { WorkReadModel } from "@/lib/work-read-model";
import type { AuthorizationSubject } from "@/lib/authorization";
import { WorkEmpty, WorkMetricStrip, WorkScreenShell, WorkUnavailable } from "@/features/work/components/work-screen-shell";

export function PeopleOverviewScreen({ model, subject }: { model: WorkReadModel; subject?: AuthorizationSubject }) {
  if (model.source.status !== "ready") return <WorkScreenShell title="บุคลากร" description="ดูภาระงานและผลการทำงานตามขอบเขตสิทธิ์"><WorkUnavailable message="ยังโหลดข้อมูลบุคลากรไม่ได้" detail={model.source.message} /></WorkScreenShell>;
  const people = model.people;
  return <WorkScreenShell title="บุคลากร" description="ดูทีม ภาระงาน สถานะ และผลการทำงาน โดยไม่เกินขอบเขตสิทธิ์ของคุณ" parent={{ label: "งานของทีม", href: "/work/team" }}>
    <WorkMetricStrip metrics={[{ label: "บุคลากร", value: people.length, detail: "ที่อยู่ในขอบเขตการดู" }, { label: "กำลังทำงาน", value: people.reduce((sum, person) => sum + person.inProgress, 0), detail: "งานที่กำลังดำเนินการ", tone: "info" }, { label: "ติดขัด", value: people.reduce((sum, person) => sum + person.onHold, 0), detail: "งานที่ต้องช่วยแก้", tone: "warning" }, { label: "เกินกำหนด", value: people.reduce((sum, person) => sum + person.overdue, 0), detail: "งานที่ควรติดตาม", tone: "danger" }]} />
    {people.length ? <section className="work-panel"><div className="work-section-head"><div><h2>ภาพรวมรายบุคคล</h2><p>เลือก Job Tracker เพื่อดูงานย่อยและกิจกรรมที่เกี่ยวข้อง</p></div><Link className="text-btn" href="/work/tracker">เปิด Job Tracker</Link></div><div className="work-people-grid">{people.map((person) => <article className="work-person-card" key={person.id}><div className="work-person-head"><div><h3>{person.name}</h3><p>{person.positionName} · {person.teamName}</p></div><strong>{person.weightedPerformance === null ? "—" : `${person.weightedPerformance}%`}</strong></div><dl><div><dt>งานทั้งหมด</dt><dd>{person.total}</dd></div><div><dt>รอเริ่ม</dt><dd>{person.pending}</dd></div><div><dt>กำลังทำ</dt><dd>{person.inProgress}</dd></div><div><dt>พักงาน</dt><dd>{person.onHold}</dd></div><div><dt>เสร็จสิ้น</dt><dd>{person.completed}</dd></div><div><dt>เกินกำหนด</dt><dd className={person.overdue ? "work-danger-text" : ""}>{person.overdue}</dd></div></dl><Link className="secondary-action" href={`/work/tracker?owner=${person.id}`}>ดูงานของคนนี้</Link></article>)}</div></section> : <WorkEmpty title="ยังไม่มีข้อมูลบุคลากร" detail="ข้อมูลจะแสดงเมื่อมีงานหรือผู้ใช้ที่อยู่ในขอบเขตทีมของคุณ" />}
  </WorkScreenShell>;
}
