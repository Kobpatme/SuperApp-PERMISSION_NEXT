export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export function StatusBadge({ label, tone = "neutral", description }: { label: string; tone?: StatusTone; description?: string }) {
  return <span className={`ui-status ui-status-${tone}`} title={description}>{label}</span>;
}
