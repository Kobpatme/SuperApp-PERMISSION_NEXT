import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { announce } from "@/modules/duct-rental/ui-shared/accessibility";
import styles from "./ui-process.module.css";

export function SignatureShell({ preview, controls, canvas, assets, children, className }: { preview?: ReactNode; controls?: ReactNode; canvas?: ReactNode; assets?: ReactNode; children?: ReactNode; className?: string }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const onCanvasKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Enter") announce("เปิดพื้นที่วาดลายเซ็น");
    else announce(`ตำแหน่งลายเซ็น ${event.key.replace("Arrow", "")}`);
  };
  return <section className={[styles.signatureShell, className].filter(Boolean).join(" ")}>
    {(preview || controls) && <div className={styles.signatureLayout}>
      <div className={styles.signaturePreview}>{preview}</div>
      <aside className={styles.signatureControls}>{controls}</aside>
    </div>}
    {canvas && <div className={styles.signatureCanvas} ref={canvasRef} tabIndex={0} role="application" aria-label="พื้นที่วาดลายเซ็น ใช้ปุ่มลูกศรเพื่อปรับตำแหน่ง หรือกด Enter เพื่อเริ่มวาด" onKeyDown={onCanvasKeyDown}>{canvas}</div>}
    {assets && <div className={styles.signatureAssets} aria-label="ลายเซ็นที่บันทึกไว้">{assets}</div>}
    {children}
  </section>;
}
