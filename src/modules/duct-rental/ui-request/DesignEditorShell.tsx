import type { ReactNode } from "react";
import styles from "./ui-request.module.css";

export function DesignEditorShell({ children, canvas, toolbar, propertyPanel, className }: { children?: ReactNode; canvas?: ReactNode; toolbar?: ReactNode; propertyPanel?: ReactNode; className?: string }) {
  return <section className={[styles.designEditorShell, className].filter(Boolean).join(" ")}>
    {toolbar && <div className={styles.editorToolbar} role="toolbar" aria-label="เครื่องมือแก้ไขแบบ">{toolbar}</div>}
    <div className={styles.editorLayout}>
      <div className={styles.editorCanvas} aria-label="พื้นที่แก้ไขแบบ">{canvas ?? children}</div>
      {propertyPanel && <aside className={styles.propertyPanel} aria-label="คุณสมบัติ">{propertyPanel}</aside>}
    </div>
  </section>;
}
