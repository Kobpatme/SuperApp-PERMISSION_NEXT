"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { EvidenceKind } from "@/lib/guarantee-evidence";

const labels: Record<EvidenceKind, string> = {
  pdf_payment: "หลักฐานการจ่าย", pdf_layout: "แบบ Drawing", pdf_additional: "หลักฐานเพิ่มเติม", pdf_tl_work: "หลักฐานงานทีมติดตั้ง", pdf_tl_extra: "เอกสารทีมติดตั้งเพิ่มเติม",
  pdf_user_final: "หลักฐานปิดงาน", pdf_demo_off: "หลักฐาน Off Service",
};

export function DepositEvidenceUpload({ id, version, kind, exists, canUpload = true }: {
  id: string; version: number; kind: EvidenceKind; exists: boolean; canUpload?: boolean;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function upload() {
    if (!file) return;
    setPending(true); setMessage("");
    const form = new FormData(); form.set("file", file); form.set("version", String(version));
    try {
      const response = await fetch(`/api/guarantees/${id}/documents/${kind}`, { method: "POST", body: form });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "อัปโหลดไม่สำเร็จ");
      setFile(null); setMessage("อัปโหลดแล้ว"); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "อัปโหลดไม่สำเร็จ"); }
    finally { setPending(false); }
  }
  return <div className="deposit-evidence"><div><strong>{labels[kind]}</strong><small>{exists ? "มีไฟล์แล้ว" : "ยังไม่มีไฟล์"}</small></div>
    {exists && <a href={`/api/guarantees/${id}/documents/${kind}`} target="_blank" rel="noreferrer">เปิดไฟล์</a>}
    {canUpload && <><input type="file" accept="application/pdf,image/jpeg,image/png" aria-label={`เลือก${labels[kind]}`} onChange={(event) => setFile(event.target.files?.[0] || null)}/>
      <button type="button" disabled={!file || pending} onClick={upload}>{pending ? "กำลังอัปโหลด…" : "อัปโหลด"}</button></>}
    {message && <small role="status">{message}</small>}
  </div>;
}
