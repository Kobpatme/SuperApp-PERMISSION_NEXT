import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

export function WorkScreenShell({ title, description, parent, action, children }: { title: string; description: string; parent?: { label: string; href: string }; action?: React.ReactNode; children: React.ReactNode }) {
  return <div className="work-native"><PageHeader title={title} description={description} parent={parent ?? { label: "ภาพรวม", href: "/" }} actions={action} />{children}</div>;
}

export function WorkUnavailable({ message, detail }: { message: string; detail: string }) {
  return <section className="work-state work-state-unavailable" role="status"><StatusBadge label="ยังไม่พร้อมใช้งาน" tone="warning" /><h2>{message}</h2><p>{detail}</p></section>;
}

export function WorkEmpty({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return <section className="work-state work-state-empty"><StatusBadge label="ยังไม่มีข้อมูล" tone="neutral" /><h2>{title}</h2><p>{detail}</p>{action}</section>;
}

export function WorkMetricStrip({ metrics }: { metrics: Array<{ label: string; value: string | number; detail: string; tone?: "neutral" | "info" | "success" | "warning" | "danger" }> }) {
  return <section className="work-metric-strip" aria-label="สรุปงาน">{metrics.map((metric) => <article key={metric.label} className={`work-metric work-metric-${metric.tone ?? "neutral"}`}><span>{metric.label}</span><strong>{typeof metric.value === "number" ? metric.value.toLocaleString("th-TH") : metric.value}</strong><small>{metric.detail}</small></article>)}</section>;
}
