"use client";

import Link from "next/link";
import { useRef, type KeyboardEvent } from "react";
import { requestPhases, type RequestPhase } from "@/modules/duct-rental/domain/source-policy";
import { announce } from "@/modules/duct-rental/ui-shared/accessibility";
import styles from "./ui-request.module.css";

export type PhaseTab = { phase: RequestPhase; label: string; href?: string; disabled?: boolean; status?: string };

const defaultLabels: Record<RequestPhase, string> = { DESIGN: "ออกแบบ", DRAFTSMAN: "เขียนแบบ", PERMISSION_1: "ขออนุญาต 1", INSTALL: "ติดตั้ง", DRAFTSMAN_2: "แบบหลังติดตั้ง", PERMISSION_2: "ขออนุญาต 2", "3RD_PARTY_1": "แจ้งอัตรา", PERMISSION_3: "ชำระเงิน", "3RD_PARTY_2": "สัญญา", COMPLETE: "เสร็จสมบูรณ์" };
const phaseViews: Record<RequestPhase, string> = { DESIGN: "design", DRAFTSMAN: "draftsman", PERMISSION_1: "permission", INSTALL: "install", DRAFTSMAN_2: "draftsman2", PERMISSION_2: "permission2", "3RD_PARTY_1": "3rdparty", PERMISSION_3: "permission3", "3RD_PARTY_2": "contract", COMPLETE: "design" };

export function PhaseTabs({ phase, id, statuses = {}, disabledPhases = [], tabs, onChange, label = "ขั้นตอนคำขอ" }: { phase: RequestPhase; id?: string; statuses?: Record<string, string>; disabledPhases?: RequestPhase[]; tabs?: PhaseTab[]; onChange?: (phase: RequestPhase) => void; label?: string }) {
  const items = tabs ?? requestPhases.map(item => ({ phase: item, label: defaultLabels[item], disabled: disabledPhases.includes(item), href: id ? `/duct-rental/${id}/${phaseViews[item]}` : undefined, status: statuses[item] }));
  const refs = useRef<Array<HTMLAnchorElement | HTMLButtonElement | null>>([]);
  const enabled = items.map((item, index) => ({ item, index })).filter(({ item }) => !item.disabled);
  const select = (item: PhaseTab) => { if (!item.disabled) { onChange?.(item.phase); announce(`ขั้นตอน ${item.label}`); } };
  const onKeyDown = (event: KeyboardEvent<HTMLAnchorElement | HTMLButtonElement>, index: number) => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const current = enabled.findIndex(({ index: itemIndex }) => itemIndex === index);
    if (current < 0) return;
    const next = event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : (current + (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1) + enabled.length) % enabled.length;
    const target = enabled[next];
    refs.current[target.index]?.focus();
    select(target.item);
  };
  return <div className={styles.phaseTabs} role="radiogroup" aria-label={label}>
    {items.map((item, index) => { const selected = item.phase === phase; const props = { ref: (node: HTMLAnchorElement | HTMLButtonElement | null) => { refs.current[index] = node; }, role: "radio" as const, "aria-checked": selected, "aria-disabled": item.disabled || undefined, tabIndex: selected ? 0 : -1, onKeyDown: (event: KeyboardEvent<HTMLAnchorElement | HTMLButtonElement>) => onKeyDown(event, index), onClick: () => select(item), className: [styles.phaseTab, selected && styles.phaseTabActive].filter(Boolean).join(" ") }; return item.href && !item.disabled ? <Link key={item.phase} {...props} href={item.href}>{item.label}{item.status ? <small>{item.status}</small> : null}</Link> : <button key={item.phase} {...props} type="button" disabled={item.disabled}>{item.label}{item.status ? <small>{item.status}</small> : null}</button>; })}
  </div>;
}
