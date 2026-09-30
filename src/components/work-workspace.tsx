import type { DashboardSnapshot } from "@/lib/dashboard";
import type { getWorkReadModel } from "@/lib/work-read-model";
import { WorkspaceQueue } from "@/components/workspace-queue";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { TruncatedText } from "@/components/ui/truncated-text";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { formatWorkspaceDate } from "@/lib/workspace-view";
import Link from "next/link";

type Model = Awaited<ReturnType<typeof getWorkReadModel>>;
const views = [
  ["mine", "งานของฉัน"], ["team", "งานของทีม"], ["due", "ครบกำหนด/เกินกำหนด"],
  ["activity", "กิจกรรม"], ["kpi", "KPI"], ["reports", "รายงาน"],
] as const;

export function WorkWorkspace({ model, userId, view, canCreate }: { model: Model; userId: string; view: string; canCreate: boolean }) {
  const active = views.some(([id]) => id === view) ? view : "mine";
  const now = Date.parse(model.generatedAt);
  const items = active === "mine" ? model.items.filter(item => item.ownerId === userId)
    : active === "due" ? model.items.filter(item => item.dueAt && Date.parse(item.dueAt) <= now + 86_400_000)
    : model.items;
  const snapshot: DashboardSnapshot = { generatedAt: model.generatedAt, items, sources: [model.source] };
  const counts = model.items.reduce<Record<string, number>>((result, item) => ({ ...result, [item.statusLabel]: (result[item.statusLabel] ?? 0) + 1 }), {});
  return <div className="work-native">
    <PageHeader title="งานและ KPI" description="จัดลำดับงาน ติดตามกิจกรรม และตรวจสอบที่มาของ KPI ในพื้นที่เดียว" parent={{ label: "ภาพรวม", href: "/" }} actions={canCreate ? <Link className="primary" href="/work/new">สร้างงาน</Link> : undefined}/>
    <nav className="ui-tabs" aria-label="มุมมองงาน">{views.map(([id, label]) => <Link key={id} href={`/work?view=${id}`} aria-current={active === id ? "page" : undefined}>{label}</Link>)}</nav>
    {(active === "mine" || active === "team" || active === "due") && <WorkspaceQueue snapshot={snapshot} userId={userId} moduleId="work" preview={false} showMetrics/>}
    {active === "activity" && <section className="ui-panel"><h2>กิจกรรมล่าสุด</h2>
      {!model.activities.length && <p>ยังไม่มีกิจกรรมในขอบเขตสิทธิ์ของคุณ</p>}
       <ol className="work-timeline">{model.activities.map(event => <li key={event.id}><time dateTime={event.occurredAt}>{formatWorkspaceDate(event.occurredAt, true)}</time><TruncatedText text={event.eventType} lines={2}/><TruncatedText text={`รายการ ${event.entityId}`} lines={2}/></li>)}</ol>
    </section>}
    {active === "kpi" && <div className="work-kpi-grid"><section className="ui-panel"><h2>คะแนนล่าสุด</h2>
      {!model.scores.length && <p>ยังไม่มีผลคำนวณ KPI ที่เผยแพร่สำหรับบัญชีนี้</p>}
       <div className="work-kpi-scores">{model.scores.map(score => <article key={score.id}><TruncatedText text={score.metric} lines={2}/><strong className="text-safe"><AnimatedNumber value={Number.parseFloat(score.score)} format={(value) => `${value.toLocaleString("th-TH", { maximumFractionDigits: 1 })} ${score.unit}`}/></strong><TruncatedText text={`${score.factCount} ข้อเท็จจริง · คำนวณ ${formatWorkspaceDate(score.calculatedAt, true)}`} lines={2}/></article>)}</div>
    </section><section className="ui-panel"><h2>คำอธิบายและที่มา</h2><p className="sub">แต่ละรายการเชื่อมกลับไปยัง activity fact, rule version และ calculation version ที่ใช้จริง</p>
       <div className="ui-table-scroll"><table className="ui-table"><thead><tr><th>เวลา</th><th>ตัวชี้วัด</th><th>ค่า</th><th>หลักฐาน</th></tr></thead><tbody>{model.facts.map(fact => <tr key={fact.id}><td>{formatWorkspaceDate(fact.occurredAt, true)}</td><td><TruncatedText text={fact.metric} lines={2}/><br/><StatusBadge label={fact.status === "applied" ? "นำไปคำนวณ" : "กลับรายการ"} tone={fact.status === "applied" ? "success" : "warning"}/></td><td><TruncatedText text={String(fact.value)} lines={1}/></td><td><details><summary>รายละเอียดทางเทคนิค</summary><code className="text-safe">activity: {fact.activityEventId}<br/>rule: {fact.ruleVersionId}<br/>calculation: v{fact.calculationVersion}</code></details></td></tr>)}</tbody></table></div>
    </section></div>}
     {active === "reports" && <section className="ui-panel"><h2>สรุปงานตามสถานะ</h2><div className="work-report-grid">{Object.entries(counts).map(([label, count]) => <article key={label}><TruncatedText text={label} lines={2}/><strong><AnimatedNumber value={count}/></strong><small>รายการในขอบเขตสิทธิ์</small></article>)}<article><TruncatedText text="Completion weighted" lines={2}/><strong>{model.weightedReport.completion === null ? "—" : <AnimatedNumber value={model.weightedReport.completion} format={(value) => `${value}%`}/>}</strong><small>ไม่นับงานที่ยกเลิก</small></article><article><TruncatedText text="SLA weighted" lines={2}/><strong>{model.weightedReport.sla === null ? "—" : <AnimatedNumber value={model.weightedReport.sla} format={(value) => `${value}%`}/>}</strong><small>จากงานที่เสร็จสิ้นตามกำหนด</small></article></div></section>}
  </div>;
}
