"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DepositEvidenceUpload } from "@/components/deposit-evidence-upload";
import { saveDepositWorkItem, type DepositActionState } from "@/app/(platform)/guarantees/actions";
import { DepositTransitionForm } from "@/components/deposit-transition-form";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmDialog } from "@/components/ui/dialog";
import { getOutstandingAmount, getWorkflowStatusKey, parseMoney, workflowLabels, type DepositItem } from "@/lib/deposit-v2-domain";
import { availableDepositTransitions, depositStatusSchema } from "@/lib/deposit-v2-workflow";
import { TruncatedText } from "@/components/ui/truncated-text";

const initial: DepositActionState = { ok: false, message: "" };
const installationAreas = ["BKK 1", "BKK 2", "BKK 3", "BKK 4", "CBI", "CMI", "PKT", "SNI"];
const money = (value: number) => `฿${value.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`;
function TextField({ name, label, value, type = "text", required = false, full = false }: { name: string; label: string; value?: string | number; type?: string; required?: boolean; full?: boolean }) {
  const [draft, setDraft] = useState(String(value ?? ""));
  return <label className={full ? "full" : ""}>{label}<input name={name} type={type} value={draft} onChange={event => setDraft(event.target.value)} required={required} min={type === "number" ? 0 : undefined} step={type === "number" ? ".01" : undefined}/></label>;
}

export function DepositEditor({ item, assignees = [], events = [] }: { item?: DepositItem & { id: string; version: number; tlAssigneeId?: string | null }; assignees?: Array<{ id: string; displayName: string | null }>; events?: Array<{ id: string; action: string; fromStatus: string | null; toStatus: string | null; reason: string | null; occurredAt: string }> }) {
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [saveState, saveAction, savePending] = useActionState(async (previous: DepositActionState, data: FormData) => {
    const result = await saveDepositWorkItem(previous, data);
    if (result.ok) setDirty(false);
    return result;
  }, initial);
  const [area, setArea] = useState(item?.area || "");
  const [assignee, setAssignee] = useState(item?.tlAssigneeId || "");
  const [inspector, setInspector] = useState(item?.inspected_by || "");
  const [depositReturn, setDepositReturn] = useState(item?.depReturn || "No");
  const [demolitionReturn, setDemolitionReturn] = useState(item?.demoReturn || "No");
  useEffect(() => { if (saveState.ok && saveState.id && !item) router.push(`/guarantees/${saveState.id}`); }, [saveState, item, router]);
  useEffect(() => { if (saveState.ok && item) router.refresh(); }, [saveState, item, router]);
  const status = item ? depositStatusSchema.safeParse(item.status) : null;
  const targets = status?.success ? availableDepositTransitions(status.data) : [];
  return <div className="deposit-detail deposit-module-page">
     <div className="deposit-detail-head"><PageHeader parent={{ label: "เงินประกัน", href: "/guarantees" }} eyebrow={item ? "รายละเอียด / แก้ไขรายการ" : "สร้างรายการ"} title={item?.place || "สร้างรายการเงินประกัน"} description={item ? workflowLabels[getWorkflowStatusKey(item)] : "ระบุข้อมูลอาคาร จำนวนเงิน และกำหนดการ ก่อนดำเนินงานตามขั้นตอน"} actions={<Link href="/guarantees" aria-disabled={savePending || undefined} onClick={event => { if (savePending || dirty) { event.preventDefault(); if (!savePending) setLeaveOpen(true); } }}>← กลับรายการ</Link>}/></div>
    <div className="deposit-detail-grid"><section className="deposit-panel"><h2>ข้อมูลรายการ</h2><p className="deposit-section-help">ข้อมูลอาคารและผู้ประสานงาน · ช่อง * จำเป็นต้องระบุ</p><form className="deposit-form" onChange={() => setDirty(true)} onSubmit={event => { event.preventDefault(); if (savePending) return; const data = new FormData(event.currentTarget); startTransition(() => saveAction(data)); }}><fieldset className="deposit-fields" disabled={savePending}><legend className="sr-only">ข้อมูลรายการเงินประกัน</legend>
      {item && <><input type="hidden" name="id" value={item.id}/><input type="hidden" name="version" value={item.version}/></>}
      <TextField name="place" label="อาคาร *" value={item?.place} required/><label>พื้นที่ / ทีมติดตั้ง<select name="area" value={area} onChange={(event) => setArea(event.target.value)} required><option value="">เลือกพื้นที่</option>{installationAreas.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <TextField name="customer" label="ลูกค้า" value={item?.customer}/><TextField name="cid" label="CID" value={item?.cid}/>
      <TextField name="pr" label="PR" value={item?.pr}/><label>ทีมติดตั้ง<input name="tl_team" value={area ? `ทีมติดตั้ง ${area}` : ""} readOnly/></label>
      <TextField name="project" label="โครงการ" value={item?.project}/><TextField name="deal" label="Deal" value={item?.deal}/>
      <TextField name="no" label="เลขที่รายการ" value={item?.no}/><TextField name="contact" label="ผู้ประสานงาน" value={item?.contact}/>
      <TextField name="tel" label="โทรศัพท์" value={item?.tel}/><TextField name="mobile" label="มือถือ" value={item?.mobile}/>
      <TextField name="payTo" label="ผู้รับเงิน" value={item?.payTo}/><TextField name="payType" label="วิธีชำระ" value={item?.payType}/>
      <TextField name="detail" label="รายละเอียดงาน" value={item?.detail} full/><TextField name="note" label="หมายเหตุ" value={item?.note} full/>
      <label className="full">มอบหมายผู้รับผิดชอบทีมติดตั้ง<select name="tlAssigneeId" value={assignee} onChange={event => setAssignee(event.target.value)}><option value="">ยังไม่มอบหมาย</option>{assignees.map((person) => <option key={person.id} value={person.id}>{person.displayName || person.id}</option>)}</select></label>
      <fieldset><legend>จำนวนเงิน (บาท)</legend>
        <TextField name="deposit" label="ประกันติดตั้ง" type="number" value={item?.deposit ?? 0}/><TextField name="demolish" label="ประกันรื้อถอน" type="number" value={item?.demolish ?? 0}/>
        <TextField name="fee" label="ค่าธรรมเนียม" type="number" value={item?.fee ?? 0}/><TextField name="other" label="ค่าใช้จ่ายอื่น" type="number" value={item?.other ?? 0}/>
        <TextField name="other_desc" label="รายละเอียดค่าใช้จ่ายอื่น" value={item?.other_desc} full/>
      </fieldset>
      <fieldset><legend>กำหนดและผลการคืน</legend>
        <TextField name="dateReq" label="วันที่ขอ" type="date" value={item?.dateReq}/><TextField name="dateDue" label="ครบกำหนด" type="date" value={item?.dateDue}/>
        <TextField name="dateCheck" label="วันที่ตรวจสอบ" type="date" value={item?.dateCheck}/><TextField name="dateAcc" label="วันที่บัญชีรับเรื่อง" type="date" value={item?.dateAcc}/>
        <TextField name="install_date" label="วันที่ติดตั้ง" type="date" value={item?.install_date}/>
        <TextField name="tl_due_date" label="ครบกำหนดทีมติดตั้ง" type="date" value={item?.tl_due_date}/><TextField name="date_return" label="วันที่คืนเงิน" type="date" value={item?.date_return}/>
        <TextField name="service_cancel_date" label="วันที่ขอ Off Service" type="date" value={item?.service_cancel_date}/>
        <label>ผู้ตรวจรับ<select name="inspected_by" value={inspector} onChange={event => setInspector(event.target.value)}><option value="">ยังไม่ระบุ</option><option value="TL">ทีมติดตั้ง</option><option value="Building Dept">Building Dept</option></select></label>
        <label>คืนประกันติดตั้ง<select name="depReturn" value={depositReturn} onChange={event => setDepositReturn(event.target.value)}><option>No</option><option>Yes</option></select></label>
        <label>คืนประกันรื้อถอน<select name="demoReturn" value={demolitionReturn} onChange={event => setDemolitionReturn(event.target.value)}><option>No</option><option>Yes</option></select></label>
      </fieldset>
      </fieldset><div className="deposit-savebar"><span className="sub">ตรวจสอบข้อมูลก่อนบันทึก</span><Button type="submit" variant="primary" disabled={savePending} aria-busy={savePending || undefined}>{savePending ? "กำลังบันทึก…" : item ? "บันทึกการแก้ไข" : "สร้างรายการ"}</Button></div>
      {saveState.message && (!saveState.ok || !dirty) && <p role={saveState.ok ? "status" : "alert"} className={`deposit-form-message ${saveState.ok ? "" : "error"}`}>{saveState.message}</p>}
    </form></section>
    {item && <aside className="deposit-side"><section className="deposit-panel"><h2>สถานะการเงิน</h2><dl><div><dt>ประกันติดตั้ง</dt><dd>{money(parseMoney(item.deposit))}</dd></div><div><dt>ประกันรื้อถอน</dt><dd>{money(parseMoney(item.demolish))}</dd></div><div><dt>คงค้าง</dt><dd>{money(getOutstandingAmount(item))}</dd></div></dl></section>
      <section className="deposit-panel"><h2>หลักฐาน (private)</h2><div className="deposit-evidence-list">
        <DepositEvidenceUpload id={item.id} version={item.version} kind="pdf_payment" exists={Boolean(item.pdf_payment)}/>
        <DepositEvidenceUpload id={item.id} version={item.version} kind="pdf_layout" exists={Boolean(item.pdf_layout)}/>
        <DepositEvidenceUpload id={item.id} version={item.version} kind="pdf_additional" exists={Boolean(item.pdf_additional)}/>
        <DepositEvidenceUpload id={item.id} version={item.version} kind="pdf_tl_work" exists={Boolean(item.pdf_tl_work)}/>
        <DepositEvidenceUpload id={item.id} version={item.version} kind="pdf_tl_extra" exists={Boolean(item.pdf_tl_extra)}/>
        <DepositEvidenceUpload id={item.id} version={item.version} kind="pdf_user_final" exists={Boolean(item.pdf_user_final)}/>
        <DepositEvidenceUpload id={item.id} version={item.version} kind="pdf_demo_off" exists={Boolean(item.pdf_demo_off)}/>
      </div><p className="sub">รองรับ PDF, JPG, PNG สูงสุด 20 MB ต่อไฟล์</p></section>
      <section className="deposit-panel"><h2>ขั้นตอนถัดไป</h2><DepositTransitionForm id={item.id} version={item.version} targets={targets.map(target => [target, target === "Cancel" ? "ยกเลิกรายการ" : `ไปขั้นตอน ${workflowLabels[target] || target}`])}/></section>
      <section className="deposit-panel deposit-history"><h2>ประวัติการทำงาน</h2>{events.map((event) => <TruncatedText key={event.id} text={`${new Date(event.occurredAt).toLocaleString("th-TH")} · ${event.action === "transition" ? `${event.fromStatus} → ${event.toStatus}` : event.action}${event.reason ? ` · ${event.reason}` : ""}`} lines={3}/>) }{!events.length && <p>ยังไม่มีประวัติ</p>}</section>
      <p className="sub">บันทึกการเปลี่ยนแปลงและประวัติให้คุณทุกครั้ง</p></aside>}
    </div>
    <ConfirmDialog open={leaveOpen} title="ทิ้งข้อมูลที่กรอกไว้หรือไม่" consequence="ข้อมูลที่ยังไม่บันทึกจะไม่ถูกเก็บ คุณสามารถยกเลิกเพื่อแก้ไขต่อได้" confirmLabel="ทิ้งข้อมูล" onCancel={() => setLeaveOpen(false)} onConfirm={() => { setLeaveOpen(false); router.push("/guarantees"); }} />
  </div>;
}
