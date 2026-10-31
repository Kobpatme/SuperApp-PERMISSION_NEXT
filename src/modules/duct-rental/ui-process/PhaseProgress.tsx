import { useRef, type KeyboardEvent } from "react";
import { announce } from "@/modules/duct-rental/ui-shared/accessibility";
import styles from "./ui-process.module.css";

export type PhaseProgressItem = { id: string; label: string; description?: string; disabled?: boolean };

export function PhaseProgress({ items, value, onChange, label = "ขั้นตอนกระบวนการ" }: { items: PhaseProgressItem[]; value: string; onChange?: (id: string) => void; label?: string }) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabled = items.map((item, index) => ({ item, index })).filter(({ item }) => !item.disabled);
  const select = (item: PhaseProgressItem) => { if (!item.disabled) { onChange?.(item.id); announce(`ขั้นตอน ${item.label}`); } };
  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = enabled.findIndex(entry => entry.index === index);
    if (current < 0) return;
    const next = event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : (current + (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1) + enabled.length) % enabled.length;
    const target = enabled[next];
    refs.current[target.index]?.focus();
    select(target.item);
  };
  return <div className={styles.phaseProgress} role="radiogroup" aria-label={label}>
    {items.map((item, index) => <button key={item.id} ref={node => { refs.current[index] = node; }} type="button" role="radio" aria-checked={item.id === value} aria-disabled={item.disabled || undefined} tabIndex={item.id === value ? 0 : -1} disabled={item.disabled} className={[styles.phaseStep, item.id === value && styles.phaseStepActive].filter(Boolean).join(" ")} onClick={() => select(item)} onKeyDown={event => move(event, index)}>
      <span className={styles.phaseMarker} aria-hidden="true">{index + 1}</span><span>{item.label}</span>{item.description && <small>{item.description}</small>}
    </button>)}
  </div>;
}
