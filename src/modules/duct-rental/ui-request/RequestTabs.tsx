"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { announce } from "@/modules/duct-rental/ui-shared/accessibility";
import styles from "./ui-request.module.css";

export type RequestTab = { id: string; label: string; disabled?: boolean; content?: ReactNode };

const defaultTabs: RequestTab[] = ["overview", "design", "documents", "permission", "install", "tracking", "activity", "files", "signing", "summary"].map(id => ({ id, label: id }));

export function RequestTabs({ tabs = defaultTabs, activeTab, value, onChange, label = "มุมมองคำขอ" }: { tabs?: RequestTab[]; activeTab?: string; value?: string; onChange?: (id: string) => void; label?: string }) {
  const active = value ?? activeTab ?? tabs[0]?.id;
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const select = (tab: RequestTab) => { if (!tab.disabled) { onChange?.(tab.id); announce(`เปิดมุมมอง ${tab.label}`); } };
  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const enabled = tabs.map((tab, itemIndex) => ({ tab, itemIndex })).filter(({ tab }) => !tab.disabled);
    const current = enabled.findIndex(({ itemIndex }) => itemIndex === index);
    if (current < 0) return;
    const next = event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : (current + (event.key === "ArrowLeft" ? -1 : 1) + enabled.length) % enabled.length;
    const target = enabled[next]; refs.current[target.itemIndex]?.focus(); select(target.tab);
  };
  return <div className={styles.requestTabs}>
    <div className={styles.requestTabList} role="tablist" aria-label={label}>
      {tabs.map((tab, index) => <button key={tab.id} ref={node => { refs.current[index] = node; }} type="button" role="tab" id={`request-tab-${tab.id}`} aria-selected={active === tab.id} aria-controls={`request-panel-${tab.id}`} aria-disabled={tab.disabled || undefined} tabIndex={active === tab.id ? 0 : -1} disabled={tab.disabled} className={[styles.requestTab, active === tab.id && styles.requestTabActive].filter(Boolean).join(" ")} onKeyDown={event => move(event, index)} onClick={() => select(tab)}>{tab.label}</button>)}
    </div>
    {tabs.map(tab => tab.content !== undefined && tab.id === active ? <div key={tab.id} id={`request-panel-${tab.id}`} role="tabpanel" aria-labelledby={`request-tab-${tab.id}`} className={styles.requestTabPanel}>{tab.content}</div> : null)}
  </div>;
}
