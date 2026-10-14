"use client";
import Link from "next/link";
import { cloneElement, isValidElement, useEffect, useId, useRef, type ReactNode } from "react";
import { requestPhases, type RequestPhase } from "../domain/source-policy";
import styles from "./workspace.module.css";
export const phaseLabels: Record<RequestPhase, string> = { DESIGN: "ออกแบบ", DRAFTSMAN: "เขียนแบบ", PERMISSION_1: "ขออนุญาต 1", INSTALL: "ติดตั้ง", DRAFTSMAN_2: "แบบหลังติดตั้ง", PERMISSION_2: "ขออนุญาต 2", "3RD_PARTY_1": "แจ้งอัตรา", PERMISSION_3: "ชำระเงิน", "3RD_PARTY_2": "สัญญา", COMPLETE: "เสร็จสมบูรณ์" };
export const phaseViews: Record<RequestPhase, string> = { DESIGN: "design", DRAFTSMAN: "draftsman", PERMISSION_1: "permission", INSTALL: "install", DRAFTSMAN_2: "draftsman2", PERMISSION_2: "permission2", "3RD_PARTY_1": "3rdparty", PERMISSION_3: "permission3", "3RD_PARTY_2": "contract", COMPLETE: "design" };
export function ModuleNav({ current = "requests" }: { current?: string }) {
  return <nav className={styles.actions} aria-label="งานเช่าท่อ"><Link className={styles.button} href="/duct-rental" aria-current={current === "requests" ? "page" : undefined}>คำขอเช่าท่อ</Link><Link className={styles.button} href="/duct-rental/renewal" aria-current={current === "renewal" ? "page" : undefined}>ต่อสัญญารายปี</Link><Link className={styles.button} href="/duct-rental/cancellation" aria-current={current === "cancellation" ? "page" : undefined}>ยกเลิกการใช้ท่อ</Link><Link className={styles.button} href="/duct-rental/tasks" aria-current={current === "tasks" ? "page" : undefined}>งานลงนามและลายเซ็น</Link></nav>;
}
export function Field({ label, children, error, full }: { label: string; children: ReactNode; error?: string; full?: boolean }) {
  const id = useId(), controlId = `${id}-control`;
  const control = isValidElement<Record<string, unknown>>(children) ? cloneElement(children, { id: controlId, "aria-invalid": !!error, "aria-describedby": error ? id : undefined }) : children;
  return <div className={`${styles.field} ${full ? styles.full : ""}`}><label htmlFor={controlId}>{label}</label>{control}{error && <small id={id} className={styles.error}>{error}</small>}</div>;
}
export function Notice({ text, error = false }: { text?: string; error?: boolean }) { return text ? <div className={`${styles.notice} ${error ? styles.alert : ""}`} role={error ? "alert" : "status"}>{text}</div> : null; }
export function RefreshBar({ online, error, at, refresh, paused = false, changed = false, realtime }: { online: boolean; error: string; at?: string; refresh: () => unknown; paused?: boolean; changed?: boolean; realtime?: string }) {
  return <div className={styles.toolbar}><span className={styles.muted} role="status">{!online ? "ออฟไลน์ — ข้อมูลอาจยังไม่ล่าสุด" : error ? "เชื่อมต่อข้อมูลไม่สำเร็จ" : paused ? "พักการอัปเดตระหว่างแก้ไข" : at ? `อัปเดตล่าสุด ${new Date(at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}` : "กำลังโหลดข้อมูล…"}{online && !error && realtime ? realtime === "connected" ? " · เชื่อมต่อสดแล้ว" : " · กำลังเชื่อมต่อสดใหม่" : ""}{changed ? " · มีข้อมูลใหม่" : ""}</span><button className={styles.button} type="button" disabled={!online || paused} onClick={() => void refresh()}>อัปเดตข้อมูล</button></div>;
}
export function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null), titleId = useId();
  useEffect(() => {
    const dialog = ref.current, trigger = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      queueMicrotask(() => { if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true }); });
    };
  }, []);
  return <dialog ref={ref} className={styles.modal} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); close(); }}><div className={styles.toolbar}><h2 id={titleId}>{title}</h2><button className={styles.button} type="button" onClick={close}>ปิด</button></div><div className={styles.modalBody}>{children}</div></dialog>;
}
export function PhaseTabs({ id, phase, statuses }: { id: string; phase: RequestPhase; statuses: Record<string, string> }) {
  return <nav className={styles.steps} aria-label="ขั้นตอนคำขอ">{requestPhases.filter(item => item !== "COMPLETE").map(item => <Link key={item} className={`${styles.step} ${phase === item ? styles.current : ""}`} href={`/duct-rental/${id}/${phaseViews[item]}`} aria-current={phase === item ? "page" : undefined}>{phaseLabels[item]} · {statuses[item] === "done" ? "เสร็จ" : statuses[item] === "accepted" ? "รับแล้ว" : "รอรับ"}</Link>)}</nav>;
}
