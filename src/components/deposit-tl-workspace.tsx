"use client";

import Link from "next/link";
import { DepositTransitionForm } from "@/components/deposit-transition-form";
import { DepositEvidenceUpload } from "@/components/deposit-evidence-upload";
import { getWorkflowStatusKey, workflowLabels, type DepositItem } from "@/lib/deposit-v2-domain";
import { TruncatedText } from "@/components/ui/truncated-text";

export function DepositTlWorkspace({ item }: { item: DepositItem & { id: string; version: number } }) {
  const targets = item.status === "tl" ? [["On Process", "รับงาน"], ["att", "ส่งกลับก่อนรับ"]] : item.status === "On Process" ? [["ret", "ส่งงานให้ตรวจรับ"]] : [];
  return <div className="deposit-detail deposit-module-page deposit-tl-page"><div className="deposit-detail-head"><div><p className="eyebrow">เงินประกันอาคาร / งานทีมติดตั้งที่ได้รับมอบหมาย</p><h1><TruncatedText text={item.place || "ไม่ระบุอาคาร"} lines={2}/></h1><TruncatedText className="sub" text={workflowLabels[getWorkflowStatusKey(item)]} lines={2}/></div><Link href="/guarantees">← กลับรายการ</Link></div>
    <div className="deposit-detail-grid"><section className="deposit-panel"><h2>หลักฐานงานทีมติดตั้ง</h2><p className="sub">ทีมติดตั้งแก้ไขได้เฉพาะหลักฐานงานและขั้นตอนของรายการที่ได้รับมอบหมาย</p>
      <DepositEvidenceUpload id={item.id} version={item.version} kind="pdf_tl_work" exists={Boolean(item.pdf_tl_work)} canUpload={["tl", "On Process"].includes(item.status || "")} />
      <DepositEvidenceUpload id={item.id} version={item.version} kind="pdf_tl_extra" exists={Boolean(item.pdf_tl_extra)} canUpload={["tl", "On Process"].includes(item.status || "")} />
      <h2>ขั้นตอนงาน</h2><DepositTransitionForm id={item.id} version={item.version} targets={targets.map(([status, label]) => [status, label])}/></section>
      <aside className="deposit-panel"><h2>ข้อมูลงาน</h2><dl className="deposit-readonly"><div><dt>CID</dt><dd><TruncatedText text={item.cid || "—"} lines={2}/></dd></div><div><dt>พื้นที่</dt><dd><TruncatedText text={item.area || "—"} lines={1}/></dd></div><div><dt>ทีมติดตั้ง</dt><dd><TruncatedText text={item.tl_team || "—"} lines={2}/></dd></div><div><dt>ครบกำหนดทีมติดตั้ง</dt><dd><TruncatedText text={item.tl_due_date || item.dateDue || "—"} lines={1}/></dd></div></dl></aside></div></div>;
}
