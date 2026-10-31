import type { ReactNode } from "react";
import styles from "./ui-process.module.css";

export type TrackingMetric = { label: string; value: ReactNode; detail?: ReactNode };

export function TrackingShell({ toolbar, metrics, table, cards, className }: { toolbar?: ReactNode; metrics: TrackingMetric[]; table?: ReactNode; cards?: ReactNode; className?: string }) {
  return <section className={[styles.trackingShell, className].filter(Boolean).join(" ")}>
    {toolbar && <div className={styles.trackingToolbar} role="search">{toolbar}</div>}
    <div className={styles.trackingMetrics} aria-label="สรุปจำนวนรายการ">
      {metrics.slice(0, 4).map(metric => <div className={styles.trackingMetric} key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong>{metric.detail && <small>{metric.detail}</small>}</div>)}
    </div>
    {table && <div className={styles.trackingTable}>{table}</div>}
    {cards && <div className={styles.trackingCards}>{cards}</div>}
  </section>;
}
