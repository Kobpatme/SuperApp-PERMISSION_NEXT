import type { StatusTone } from "./status-badge";

export type MetricItem = { label: string; value: React.ReactNode; detail?: string; tone?: StatusTone };

export function MetricGrid({ label, metrics, className }: { label: string; metrics: MetricItem[]; className?: string }) {
  return <section className={["ui-metric-grid", className].filter(Boolean).join(" ")} aria-label={label}>
    {metrics.map(metric => <article key={metric.label} className={`ui-metric ui-metric-${metric.tone ?? "neutral"}`}>
      <span>{metric.label}</span>
      <strong>{typeof metric.value === "number" ? metric.value.toLocaleString("th-TH") : metric.value}</strong>
      {metric.detail && <small>{metric.detail}</small>}
    </article>)}
  </section>;
}
