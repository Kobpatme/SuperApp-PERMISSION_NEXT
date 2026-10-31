import type { ReactNode } from "react";
import styles from "./ui-process.module.css";

export function ProcessShell({ list, detail, toolbar, children, className }: { list?: ReactNode; detail?: ReactNode; toolbar?: ReactNode; children?: ReactNode; className?: string }) {
  return <section className={[styles.processShell, className].filter(Boolean).join(" ")}>
    {toolbar && <div className={styles.processToolbar}>{toolbar}</div>}
    {(list || detail) ? <div className={styles.processLayout}>
      <div className={styles.processListPane} aria-label="รายการกระบวนการ">{list}</div>
      {detail && <aside className={styles.processDetailPane} aria-label="รายละเอียดกระบวนการ">{detail}</aside>}
    </div> : children}
  </section>;
}
