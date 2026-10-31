import type { StatusTone } from "./status-badge";

export type MetricItem = {
  label: string;
  value: React.ReactNode;
  detail?: string;
  tone?: StatusTone;
  /** When set the whole metric renders as a single interactive button (shared
   *  pattern mirrored from workspace-queue view chips): label + value stay inside
   *  the button root, `aria-pressed` exposes the active state, and no nested
   *  interactive HTML is introduced. */
  onClick?: () => void;
  pressed?: boolean;
  variant?: "request-list";
};

export function MetricGrid({ label, metrics, className }: { label: string; metrics: MetricItem[]; className?: string }) {
  return <section className={["ui-metric-grid", className].filter(Boolean).join(" ")} aria-label={label}>
    {metrics.map(metric => {
      const base = `ui-metric ui-metric-${metric.tone ?? "neutral"}`;
      const interactive = metric.onClick != null;
      const metricClass = [base, metric.variant && `ui-metric--${metric.variant}`, interactive && metric.pressed && "is-active"].filter(Boolean).join(" ");
      if (interactive) {
        return <button key={metric.label} type="button" aria-pressed={metric.pressed === true} onClick={metric.onClick} className={metricClass}>
          <span>{metric.label}</span>
          <strong>{typeof metric.value === "number" ? metric.value.toLocaleString("th-TH") : metric.value}</strong>
        </button>;
      }
      return <article key={metric.label} className={metricClass}>
        <span>{metric.label}</span>
        <strong>{typeof metric.value === "number" ? metric.value.toLocaleString("th-TH") : metric.value}</strong>
        {metric.detail && <small>{metric.detail}</small>}
      </article>;
    })}
  </section>;
}
