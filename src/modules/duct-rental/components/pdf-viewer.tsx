"use client";
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentLoadingTask, RenderTask } from "pdfjs-dist";
import { Notice } from "./common";
import styles from "./workspace.module.css";
export function PdfViewer({ url, blob, name = "เอกสาร PDF", initialPage = 1 }: { url: string; blob?: Blob; name?: string; initialPage?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState(initialPage), [total, setTotal] = useState(0), [zoom, setZoom] = useState(1), [rotation, setRotation] = useState(0), [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false, loading: PDFDocumentLoadingTask | undefined, render: RenderTask | undefined;
    void (async () => {
      try {
        const pdfjs = await import("pdfjs-dist"); if (cancelled) return;
        pdfjs.GlobalWorkerOptions.workerSrc = "/duct-rental/pdf.worker.min.mjs";
        const source = blob ? { data: new Uint8Array(await blob.arrayBuffer()) } : { url };
        if (cancelled) return;
        loading = pdfjs.getDocument({ ...source, standardFontDataUrl: "/duct-rental/pdf/standard_fonts/", isEvalSupported: false });
        const document = await loading.promise; if (cancelled) return;
        setTotal(document.numPages); const pdfPage = await document.getPage(Math.min(page, document.numPages));
        const viewport = pdfPage.getViewport({ scale: zoom * 1.35, rotation: (pdfPage.rotate + rotation + 360) % 360 });
        const element = canvas.current; if (!element || cancelled) return;
        const ratio = window.devicePixelRatio || 1; element.width = Math.ceil(viewport.width * ratio); element.height = Math.ceil(viewport.height * ratio);
        element.style.width = `${viewport.width}px`; element.style.height = "auto";
        render = pdfPage.render({ canvas: element, viewport, transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0] });
        await render.promise; if (!cancelled) setError("");
      } catch { if (!cancelled) setError("แสดงตัวอย่าง PDF ไม่สำเร็จ เปิดหรือดาวน์โหลดเอกสารเพื่อตรวจสอบได้"); }
    })();
    return () => { cancelled = true; render?.cancel(); void loading?.destroy(); };
  }, [url, blob, page, zoom, rotation]);
  return <div className={styles.workspace}>
    <div className={styles.actions}><button className={styles.button} type="button" disabled={page <= 1} onClick={() => setPage(previous => previous - 1)}>หน้าก่อน</button><span className={styles.muted}>หน้า {page} / {total || "…"}</span><button className={styles.button} type="button" disabled={page >= total} onClick={() => setPage(previous => previous + 1)}>หน้าถัดไป</button><label className={styles.actions}>ขยาย <select aria-label="ระดับขยาย PDF" value={zoom} onChange={event => setZoom(Number(event.target.value))}>{[0.5, 0.75, 1, 1.25, 1.5, 2].map(value => <option key={value} value={value}>{value * 100}%</option>)}</select></label><button className={styles.button} type="button" onClick={() => setRotation(previous => (previous + 90) % 360)}>หมุนหน้า</button><a className={styles.button} href={url} target="_blank" rel="noopener noreferrer">เปิด PDF / พิมพ์</a></div>
    <Notice text={error} error />
    <div className={styles.preview} tabIndex={0} role="region" aria-label={`เลื่อนดู ${name}`}><canvas ref={canvas} role="img" aria-label={`${name} หน้า ${page}`} /></div>
  </div>;
}
