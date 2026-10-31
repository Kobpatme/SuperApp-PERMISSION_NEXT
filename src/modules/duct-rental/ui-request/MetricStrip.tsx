"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { announce } from "@/modules/duct-rental/ui-shared/accessibility";
import styles from "./ui-request.module.css";

export type MetricStripItem = {
  id?: string;
  label: string;
  value: ReactNode;
  detail?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

export function MetricStrip({ metrics, label = "สรุปจำนวนคำขอ", className }: { metrics: MetricStripItem[]; label?: string; className?: string }) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const move = (index: number, direction: 1 | -1) => {
    const enabled = metrics.map((metric, itemIndex) => ({ metric, itemIndex })).filter(({ metric }) => !metric.disabled);
    const current = enabled.findIndex(({ itemIndex }) => itemIndex === index);
    if (current < 0 || enabled.length === 0) return;
    const next = enabled[(current + direction + enabled.length) % enabled.length].itemIndex;
    buttonRefs.current[next]?.focus();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); move(index, 1); }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); move(index, -1); }
  };
  return <section className={[styles.metricStrip, className].filter(Boolean).join(" ")} aria-label={label}>
    <div className={styles.metricGrid}>
      {metrics.map((metric, index) => <button
        key={metric.id ?? metric.label}
        ref={node => { buttonRefs.current[index] = node; }}
        type="button"
        className={[styles.metric, metric.active && styles.metricActive].filter(Boolean).join(" ")}
        aria-pressed={metric.active === true}
        aria-label={`${metric.label}: ${metric.value}`}
        disabled={metric.disabled}
        onKeyDown={event => onKeyDown(event, index)}
        onClick={() => { metric.onClick?.(); announce(`${metric.label}: ${metric.value}`); }}
      ><span>{metric.label}</span><strong>{metric.value}</strong>{metric.detail && <small>{metric.detail}</small>}</button>)}
    </div>
  </section>;
}
