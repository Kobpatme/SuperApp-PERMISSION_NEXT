"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { transitionDepositWorkItem, type DepositActionState } from "@/app/(platform)/guarantees/actions";
import { DepositEvidenceUpload } from "@/components/deposit-evidence-upload";
import { getWorkflowStatusKey, workflowLabels, type DepositItem } from "@/lib/deposit-v2-domain";
import { TruncatedText } from "@/components/ui/truncated-text";

const initial: DepositActionState = { ok: false, message: "" };
export function DepositTlWorkspace({ item }: { item: DepositItem & { id: string; version: number } }) {
  const [state, action, pending] = useActionState(transitionDepositWorkItem, initial);
  const router = useRouter();
  useEffect(() => { if (state.ok) router.refresh(); }, [state, router]);
  const targets = item.status === "tl" ? [["On Process", "รับงาน"], ["att", "ส่งกลับก่อนรับ"]] : item.status === "On Process" ? [["ret", "ส่งงานให้ตรวจรับ"]] : [];
  return <div className="deposit-detail"><div className="deposit-detail-head"><div><p className="eyebrow">เงินประกันอาคาร / งานทีมติดตั้งที่ได้รับมอบหมาย</p><h1><TruncatedText text={item.place || "ไม่ระบุอาคาร"} lines={2}/></h1><TruncatedText className="sub" text={workflowLabels[getWorkflowStatusKey(item)]} lines={2}/></div><Link href="/guarantees">← กลับรายการ</Link></div>
    <div className="deposit-detail-grid"><section className="deposit-panel"><h2>หลักฐานงานทีมติดตั้ง</h2><p className="sub">ทีมติดตั้งแก้ไขได้เฉพาะหลักฐานงานและขั้นตอนของรายการที่ได้รับมอบหมาย</p>
      <DepositEvidenceUpload id={item.id} version={item.version} kind="pdf_tl_work" exists={Boolean(item.pdf_tl_work)} canUpload={["tl", "On Process"].includes(item.status || "")} />
      <DepositEvidenceUpload id={item.id} version={item.version} kind="pdf_tl_extra" exists={Boolean(item.pdf_tl_extra)} canUpload={["tl", "On Process"].includes(item.status || "")} />
      <h2>ขั้นตอนงาน</h2><form action={action} className="deposit-transition"><input type="hidden" name="id" value={item.id}/><input type="hidden" name="version" value={item.version}/>
        <textarea name="reason" aria-label="เหตุผล" placeholder="ระบุเหตุผลเมื่อส่งกลับ" />
        {targets.map(([status, label]) => <button type="submit" name="to" value={status} disabled={pending} key={status}>{label}</button>)}
        {!targets.length && <p>ไม่มีขั้นตอนของทีมติดตั้งที่ต้องดำเนินการ</p>}{state.message && <p role="status">{state.message}</p>}</form></section>
      <aside className="deposit-panel"><h2>ข้อมูลงาน</h2><dl className="deposit-readonly"><div><dt>CID</dt><dd><TruncatedText text={item.cid || "—"} lines={2}/></dd></div><div><dt>พื้นที่</dt><dd><TruncatedText text={item.area || "—"} lines={1}/></dd></div><div><dt>ทีมติดตั้ง</dt><dd><TruncatedText text={item.tl_team || "—"} lines={2}/></dd></div><div><dt>ครบกำหนดทีมติดตั้ง</dt><dd><TruncatedText text={item.tl_due_date || item.dateDue || "—"} lines={1}/></dd></div></dl></aside></div></div>;
}
