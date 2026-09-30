export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export function StatusBadge({ label, tone = "neutral", description }: { label: string; tone?: StatusTone; description?: string }) {
  return <span className={`ui-status ui-status-${tone}`} title={description}>{tone === "success" && <svg className="ui-status-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>}{label}</span>;
}
