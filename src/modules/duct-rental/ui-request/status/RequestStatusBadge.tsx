import type { StatusTone } from "@/components/ui/status-badge";
import styles from "../ui-request.module.css";

const icons: Record<StatusTone, string> = { neutral: "•", info: "ⓘ", success: "✓", warning: "!", danger: "×" };

export function RequestStatusBadge({ label, tone = "neutral", description }: { label: string; tone?: StatusTone; description?: string }) {
  return <span className={[styles.requestStatusBadge, styles[`status${tone[0].toUpperCase()}${tone.slice(1)}`]].join(" ")}>
    <span aria-hidden="true" className={styles.statusIcon}>{icons[tone]}</span>
    <span>{label}</span>
    {description && <span className={styles.statusDescription}> · {description}</span>}
  </span>;
}
