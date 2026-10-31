import type { ReactNode } from "react";
import styles from "./ui-request.module.css";

export function RequestFormShell({ children, form, coordinatorPanel, autoCoordinator, className }: { children?: ReactNode; form?: ReactNode; coordinatorPanel?: ReactNode; autoCoordinator?: ReactNode; className?: string }) {
  return <section className={[styles.requestFormShell, className].filter(Boolean).join(" ")}>
    <div className={styles.requestFormMain}>{form ?? children}</div>
    {(coordinatorPanel ?? autoCoordinator) && <aside className={styles.coordinatorPanel} aria-label="ผู้ประสานงานอัตโนมัติ">{coordinatorPanel ?? autoCoordinator}</aside>}
  </section>;
}
