"use client";
import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { Modal, Notice } from "./common";
import { PdfViewer } from "./pdf-viewer";
import styles from "./workspace.module.css";
export function AttachmentPicker({ label, accept = ".pdf", file, change, disabled = false }: { label: string; accept?: string; file?: File | null; change: (file: File | null) => void; disabled?: boolean }) {
  const id = useId(), [preview, setPreview] = useState<File | null>(null), [url, setUrl] = useState(""), [error, setError] = useState("");
  useEffect(() => { if (!preview) return; const objectUrl = URL.createObjectURL(preview); Promise.resolve().then(() => setUrl(objectUrl)); return () => URL.revokeObjectURL(objectUrl); }, [preview]);
  const select = (selected?: File) => {
    if (!selected || disabled) return;
    if (selected.size > 25 * 1024 * 1024 || selected.size === 0) { setError("ไฟล์ต้องมีขนาดไม่เกิน 25 MB และไม่ว่าง"); return; }
    setError("");
    if (selected.name.toLowerCase().endsWith(".pdf") || selected.type.startsWith("image/")) setPreview(selected); else change(selected);
  };
  return <div className={styles.workspace}><div className={styles.drop} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); select(event.dataTransfer.files[0]); }}><label htmlFor={id}>{label} · ไม่เกิน 25 MB</label><input id={id} type="file" accept={accept} disabled={disabled} onChange={event => { select(event.target.files?.[0]); event.target.value = ""; }} />{file && <div className={styles.actions}><span>{file.name} · {(file.size / 1024).toFixed(0)} KB</span><button className={styles.button} type="button" disabled={disabled} onClick={() => change(null)}>ยกเลิกไฟล์ที่เลือก</button></div>}</div><Notice text={error} error />
    {preview && <Modal title="ตรวจเอกสารก่อนแนบ" close={() => setPreview(null)}>{url && (preview.name.toLowerCase().endsWith(".pdf") ? <PdfViewer key={url} url={url} blob={preview} name={preview.name} /> : <Image unoptimized src={url} alt={preview.name} width={700} height={500} style={{ maxWidth: "100%", height: "auto", objectFit: "contain" }} />)}<div className={styles.actions}><button className={styles.button} type="button" onClick={() => setPreview(null)}>ยกเลิก</button><button className={styles.primary} type="button" onClick={() => { change(preview); setPreview(null); }}>ยืนยันไฟล์แนบ</button></div></Modal>}
  </div>;
}
