"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cloneElement, isValidElement, useEffect, useId, useRef, type ReactNode } from "react";
import { requestPhases, type RequestPhase } from "../domain/source-policy";
import styles from "../ui-shared/ui-shared.module.css";
export const phaseLabels: Record<RequestPhase, string> = { DESIGN: "ออกแบบ", DRAFTSMAN: "เขียนแบบ", PERMISSION_1: "ขออนุญาต 1", INSTALL: "ติดตั้ง", DRAFTSMAN_2: "แบบหลังติดตั้ง", PERMISSION_2: "ขออนุญาต 2", "3RD_PARTY_1": "แจ้งอัตรา", PERMISSION_3: "ชำระเงิน", "3RD_PARTY_2": "สัญญา", COMPLETE: "เสร็จสมบูรณ์" };
export const phaseViews: Record<RequestPhase, string> = { DESIGN: "design", DRAFTSMAN: "draftsman", PERMISSION_1: "permission", INSTALL: "install", DRAFTSMAN_2: "draftsman2", PERMISSION_2: "permission2", "3RD_PARTY_1": "3rdparty", PERMISSION_3: "permission3", "3RD_PARTY_2": "contract", COMPLETE: "design" };

export { DuctModuleNav, DuctModuleNav as ModuleNav } from "../ui-shared";

/**
 * DuctSyncUtility — compact inline utility row: freshness status + refresh action,
 * always left-aligned (never space-between). Status + button stay together.
 *
 * - aria-busy="true" on the container while refreshing
 * - single aria-live="polite" status region; time not re-announced when unchanged
 * - refresh button: secondary, compact, min-height 44px, disabled while loading/paused
 */
export function DuctSyncUtility({
  online,
  error,
  at,
  refresh,
  paused = false,
  changed = false,
  realtime,
  busy = false,
}: {
  online: boolean;
  error: string;
  at?: string;
  refresh: () => unknown;
  paused?: boolean;
  changed?: boolean;
  realtime?: string;
  busy?: boolean;
}) {
  const announcedAtRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (online && !error && !paused && at && at !== announcedAtRef.current) {
      announcedAtRef.current = at;
    }
  }, [online, error, paused, at]);

  const statusText = !online
    ? "ออฟไลน์ — ข้อมูลอาจยังไม่ล่าสุด"
    : error
      ? "เชื่อมต่อข้อมูลไม่สำเร็จ"
      : paused
        ? "พักการอัปเดตระหว่างแก้ไข"
        : at
          ? `อัปเดตล่าสุด ${new Date(at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}`
          : "กำลังโหลดข้อมูล…";
  const liveSuffix = online && !error && realtime === "connected" ? " · เชื่อมต่อสดแล้ว" : online && !error && realtime ? " · กำลังเชื่อมต่อสดใหม่" : "";
  const changedSuffix = changed ? " · มีข้อมูลใหม่" : "";

  const isBusy = busy || paused;
  return (
    <div className={styles.ductSyncUtility} aria-busy={isBusy} role="status" aria-live="polite">
      <span className={styles.ductSyncStatus}>{statusText}{liveSuffix}{changedSuffix}</span>
      <Button variant="ghost" type="button"
        disabled={isBusy || !online}
        onClick={() => void refresh()}
        aria-busy={isBusy || false}
      >
        {isBusy ? "กำลังอัปเดต…" : "↻ อัปเดตข้อมูล"}
      </Button>
    </div>
  );
}

/** RefreshBar kept as a dedicated component alias (business/workflow change preserved).
 *  Delegates to DuctSyncUtility so there is one implementation of the utility row. */
export function RefreshBar({
  online,
  error,
  at,
  refresh,
  paused = false,
  changed = false,
  realtime,
  busy = false,
}: {
  online: boolean;
  error: string;
  at?: string;
  refresh: () => unknown;
  paused?: boolean;
  changed?: boolean;
  realtime?: string;
  busy?: boolean;
}) {
  return <DuctSyncUtility online={online} error={error} at={at} refresh={refresh} paused={paused} changed={changed} realtime={realtime} busy={busy || paused} />;
}

export function Field({ label, children, error, full }: { label: string; children: ReactNode; error?: string; full?: boolean }) {
  const id = useId(), controlId = `${id}-control`;
  const control = isValidElement<Record<string, unknown>>(children) ? cloneElement(children, { id: controlId, "aria-invalid": !!error, "aria-describedby": error ? id : undefined }) : children;
  return <div className={`${styles.field} ${full ? styles.full : ""}`}><label htmlFor={controlId}>{label}</label>{control}{error && <small id={id} className={styles.error}>{error}</small>}</div>;
}
export function Notice({ text, error = false }: { text?: string; error?: boolean }) { return text ? <div className={`${styles.notice} ${error ? styles.alert : ""}`} role={error ? "alert" : "status"}>{text}</div> : null; }
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

/**
 * DuctTaskToolbar — single bordered task surface for NT Form / process pages.
 * Desktop: sync utility | vertical divider | search (minmax 280–520) | manager action.
 * justify-content: flex-start; never space-between.
 */
export function DuctTaskToolbar({ sync, search, actions }: { sync: ReactNode; search: ReactNode; actions?: ReactNode }) {
  return (
    <section className={styles.ductTaskToolbar}>
      <div className={styles.ductTaskSync}>{sync}</div>
      <span className={styles.ductTaskDivider} aria-hidden="true" />
      <div className={styles.ductTaskSearch}>{search}</div>
      {actions && <div className={styles.ductTaskActions}>{actions}</div>}
    </section>
  );
}
