import styles from "./ui-process.module.css";

export type StatusTone = "pending" | "in-progress" | "action-required" | "complete" | "blocked";
const icons: Record<StatusTone, string> = { pending: "○", "in-progress": "◐", "action-required": "!", complete: "✓", blocked: "×" };

export function StatusBadge({ label, tone = "pending", description }: { label: string; tone?: StatusTone; description?: string }) {
  return <span className={[styles.statusBadge, styles[`status${tone.replace(/(^|-)([a-z])/g, (_, __, letter: string) => letter.toUpperCase())}`]].join(" ")}>
    <span className={styles.statusIcon} aria-hidden="true">{icons[tone]}</span>
    <span>{label}</span>
    {description && <span className={styles.statusDescription}>{description}</span>}
  </span>;
}
