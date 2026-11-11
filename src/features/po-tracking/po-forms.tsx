"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  correctReceiptAction, createManualPoAction, recordReceiptAction, updateLineAction, updateManualLineAction,
  type PoActionState,
} from "@/app/(platform)/po-tracking/actions";
import { Button } from "@/components/ui/button";
import { FormActions, FormField, FormGrid, mapFieldErrors } from "@/components/ui/form";
import {
  formatQty, poStatusLabels, poUnitLabels, type PoLineView, type PoUnit,
} from "@/modules/po-tracking/domain";

const initial: PoActionState = { ok: false, message: "" };

function today() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function ReceiptForm({ line, disabled }: { line: PoLineView; disabled: boolean }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(async (previous: PoActionState, data: FormData) => {
    const result = await recordReceiptAction(previous, data);
    if (result.ok) formRef.current?.reset();
    return result;
  }, initial);
  useEffect(() => { if (state.ok) router.refresh(); }, [state, router]);
  const remaining = line.totals.outstanding;
  if (disabled) return <p className="po-note">ไม่มีสิทธิ์บันทึกการรับของในรายการนี้</p>;
  if (line.totals.delivery === "incomplete") return <p className="po-note">รายการนี้ไม่มีจำนวนสั่งที่สมบูรณ์ จึงยังบันทึกการรับของไม่ได้</p>;
  return <form ref={formRef} action={action} className="po-form" aria-describedby="po-receipt-help">
    <input type="hidden" name="lineId" value={line.id} />
    <p id="po-receipt-help" className="po-hint">ยอดคงค้างปัจจุบัน {formatQty(remaining)} {line.unit} · ระบบจะปฏิเสธยอดที่ทำให้รับเกินจำนวนสั่ง</p>
    <FormGrid>
      <FormField label="วันที่รับของ" required controlId="po-received-on" error={mapFieldErrors(state.fieldErrors, "receivedOn")}>
        <input className="ui-field-control" id="po-received-on" name="receivedOn" type="date" defaultValue={today()} max={today()} required disabled={pending} />
      </FormField>
      <FormField label={`จำนวนที่รับ (${line.unit})`} required controlId="po-received-qty" error={mapFieldErrors(state.fieldErrors, "quantity")}>
        <input className="ui-field-control" id="po-received-qty" name="quantity" inputMode="decimal" required disabled={pending} placeholder="เช่น 100" />
      </FormField>
      <FormField label="เลขอ้างอิงใบรับ / เลขที่เอกสาร" required controlId="po-received-ref" error={mapFieldErrors(state.fieldErrors, "reference")}>
        <input className="ui-field-control" id="po-received-ref" name="reference" maxLength={120} required disabled={pending} placeholder="เช่น GR-2026-0012" />
      </FormField>
      <FormField label="หมายเหตุ" controlId="po-received-note" error={mapFieldErrors(state.fieldErrors, "note")}>
        <input className="ui-field-control" id="po-received-note" name="note" maxLength={1000} disabled={pending} />
      </FormField>
    </FormGrid>
    {state.message && <p role={state.ok ? "status" : "alert"} className={state.ok ? "po-success" : "po-error"}>{state.message}</p>}
    <FormActions><Button type="submit" variant="primary" pending={pending} pendingLabel="กำลังบันทึก…">บันทึกการรับของ</Button></FormActions>
  </form>;
}

export function ReceiptCorrectionForm({ receiptId, lineId, receivedOn, quantity, reference, note }: {
  receiptId: string; lineId: string; receivedOn: string; quantity: string; reference: string; note: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [withReplacement, setWithReplacement] = useState(false);
  const [state, action, pending] = useActionState(async (previous: PoActionState, data: FormData) => {
    const result = await correctReceiptAction(previous, data);
    if (result.ok) { setOpen(false); setWithReplacement(false); }
    return result;
  }, initial);
  useEffect(() => { if (state.ok) router.refresh(); }, [state, router]);
  if (!open) return <Button type="button" variant="ghost" onClick={() => setOpen(true)}>แก้ไข / ยกเลิก</Button>;
  return <form action={action} className="po-form po-correction">
    <input type="hidden" name="receiptId" value={receiptId} />
    <input type="hidden" name="lineId" value={lineId} />
    <p className="po-hint">ระบบไม่ลบรายการเดิม: จะบันทึกการยกเลิกพร้อมเหตุผล และเก็บประวัติผู้ทำรายการไว้</p>
    <FormField label="เหตุผลที่แก้ไข" required controlId={`po-reason-${receiptId}`} error={mapFieldErrors(state.fieldErrors, "reason")}>
      <textarea className="ui-field-control" id={`po-reason-${receiptId}`} name="reason" rows={2} maxLength={500} required disabled={pending} />
    </FormField>
    <label className="po-check">
      <input type="checkbox" name="withReplacement" value="1" checked={withReplacement} onChange={(event) => setWithReplacement(event.target.checked)} disabled={pending} />
      ออกใบรับใหม่แทนรายการนี้
    </label>
    {withReplacement && <FormGrid>
      <FormField label="วันที่รับใหม่" required controlId={`po-replace-date-${receiptId}`}>
        <input className="ui-field-control" id={`po-replace-date-${receiptId}`} name="replacementDate" type="date" defaultValue={receivedOn} max={today()} required disabled={pending} />
      </FormField>
      <FormField label="จำนวนใหม่" required controlId={`po-replace-qty-${receiptId}`}>
        <input className="ui-field-control" id={`po-replace-qty-${receiptId}`} name="replacementQuantity" defaultValue={quantity} inputMode="decimal" required disabled={pending} />
      </FormField>
      <FormField label="เลขอ้างอิงใหม่" required controlId={`po-replace-ref-${receiptId}`}>
        <input className="ui-field-control" id={`po-replace-ref-${receiptId}`} name="replacementReference" defaultValue={reference} maxLength={120} required disabled={pending} />
      </FormField>
      <FormField label="หมายเหตุใหม่" controlId={`po-replace-note-${receiptId}`}>
        <input className="ui-field-control" id={`po-replace-note-${receiptId}`} name="replacementNote" defaultValue={note} maxLength={1000} disabled={pending} />
      </FormField>
    </FormGrid>}
    {state.message && <p role={state.ok ? "status" : "alert"} className={state.ok ? "po-success" : "po-error"}>{state.message}</p>}
    <FormActions variant="inline">
      <Button type="submit" variant="danger" pending={pending} pendingLabel="กำลังบันทึก…">ยืนยันการแก้ไข</Button>
      <Button type="button" variant="ghost" onClick={() => { setOpen(false); setWithReplacement(false); }} disabled={pending}>ปิด</Button>
    </FormActions>
  </form>;
}

export function ManualPoForm() {
  const router = useRouter();
  const [lines, setLines] = useState<number[]>([0]);
  const nextKey = useRef(1);
  const [state, action, pending] = useActionState(createManualPoAction, initial);
  useEffect(() => { if (state.ok && state.redirectTo) router.push(state.redirectTo); }, [state, router]);
  const addLine = () => { setLines((current) => [...current, nextKey.current++]); };
  const removeLine = (key: number) => { setLines((current) => current.length > 1 ? current.filter((item) => item !== key) : current); };
  return <form action={action} className="po-form po-manual">
    <input type="hidden" name="lineCount" value={lines.length} />
    <p className="po-hint">สร้าง PO ได้หลายรายการในครั้งเดียว ระบบแยกยอดตามหน่วยนับและไม่รวมข้ามหน่วย (M / PC / SET / EA)</p>
    <FormGrid>
      <FormField label="เลขที่ PO" required controlId="po-new-number" error={mapFieldErrors(state.fieldErrors, "poNumber")}>
        <input className="ui-field-control" id="po-new-number" name="poNumber" maxLength={40} required disabled={pending} placeholder="เช่น PO-2026-001" />
      </FormField>
      <FormField label="Order" controlId="po-new-order" error={mapFieldErrors(state.fieldErrors, "orderCode")}>
        <input className="ui-field-control" id="po-new-order" name="orderCode" maxLength={60} disabled={pending} placeholder="เช่น HAM026" />
      </FormField>
      <FormField label="รหัสผู้ขาย" controlId="po-new-vendor-code" error={mapFieldErrors(state.fieldErrors, "vendorCode")}>
        <input className="ui-field-control" id="po-new-vendor-code" name="vendorCode" maxLength={60} disabled={pending} placeholder="คงเลขศูนย์นำหน้าไว้ตามจริง" />
      </FormField>
      <FormField label="ชื่อผู้ขาย" controlId="po-new-vendor-name" error={mapFieldErrors(state.fieldErrors, "vendorName")}>
        <input className="ui-field-control" id="po-new-vendor-name" name="vendorName" maxLength={300} disabled={pending} />
      </FormField>
      <FormField label="หมายเหตุใบสั่งซื้อ" controlId="po-new-note" error={mapFieldErrors(state.fieldErrors, "note")}>
        <input className="ui-field-control" id="po-new-note" name="note" maxLength={2000} disabled={pending} />
      </FormField>
    </FormGrid>

    <div className="po-manual-lines">
      {lines.map((key, index) => <fieldset key={key} className="po-line-card">
        <legend>รายการที่ {index + 1}</legend>
        <FormGrid>
          <FormField label="รหัสวัสดุ" required controlId={`line-${index}-material`}>
            <input className="ui-field-control" id={`line-${index}-material`} name={`line-${index}-materialCode`} maxLength={80} required disabled={pending} />
          </FormField>
          <FormField label="รายละเอียด" required controlId={`line-${index}-desc`}>
            <input className="ui-field-control" id={`line-${index}-desc`} name={`line-${index}-description`} maxLength={500} required disabled={pending} />
          </FormField>
          <FormField label="หน่วยนับ" required controlId={`line-${index}-unit`}>
            <select className="ui-field-control" id={`line-${index}-unit`} name={`line-${index}-unit`} defaultValue="PC" disabled={pending}>
              {(Object.keys(poUnitLabels) as PoUnit[]).map((unit) => <option key={unit} value={unit}>{unit} · {poUnitLabels[unit]}</option>)}
            </select>
          </FormField>
          <FormField label="จำนวนสั่ง" required controlId={`line-${index}-qty`}>
            <input className="ui-field-control" id={`line-${index}-qty`} name={`line-${index}-orderedQty`} inputMode="decimal" required disabled={pending} placeholder="เช่น 100" />
          </FormField>
          <FormField label="ราคาต่อหน่วย" required controlId={`line-${index}-price`}>
            <input className="ui-field-control" id={`line-${index}-price`} name={`line-${index}-unitPrice`} inputMode="decimal" required disabled={pending} placeholder="เช่น 35.98" />
          </FormField>
          <FormField label="วันที่ออก PO" required controlId={`line-${index}-release`}>
            <input className="ui-field-control" id={`line-${index}-release`} name={`line-${index}-poReleaseDate`} type="date" defaultValue={today()} required disabled={pending} />
          </FormField>
          <FormField label="วันที่คาดว่าจะมาถึง (ETA)" controlId={`line-${index}-eta-date`} hint="ใช้ได้อย่างใดอย่างหนึ่งกับข้อความ ETA">
            <input className="ui-field-control" id={`line-${index}-eta-date`} name={`line-${index}-etaDate`} type="date" disabled={pending} />
          </FormField>
          <FormField label="ข้อความ ETA / สถานะจากผู้ขาย" controlId={`line-${index}-eta-text`}>
            <input className="ui-field-control" id={`line-${index}-eta-text`} name={`line-${index}-etaText`} maxLength={200} disabled={pending} placeholder="เช่น พร้อมส่ง" />
          </FormField>
        </FormGrid>
        {lines.length > 1 && <FormActions variant="inline">
          <Button type="button" variant="ghost" onClick={() => removeLine(key)} disabled={pending}>ลบรายการนี้</Button>
        </FormActions>}
      </fieldset>)}
    </div>

    {state.message && <p role={state.ok ? "status" : "alert"} className={state.ok ? "po-success" : "po-error"}>{state.message}</p>}
    <FormActions variant="inline">
      <Button type="button" variant="ghost" onClick={addLine} disabled={pending || lines.length >= 50}>เพิ่มอีกรายการ</Button>
      <Button type="submit" variant="primary" pending={pending} pendingLabel="กำลังสร้าง…">สร้าง PO</Button>
    </FormActions>
  </form>;
}

/** Full master-data editor for a line created in the app (imported lines use LineControlForm). */
export function ManualLineForm({ line }: { line: PoLineView }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateManualLineAction, initial);
  useEffect(() => { if (state.ok) router.refresh(); }, [state, router]);
  return <form action={action} className="po-form">
    <input type="hidden" name="lineId" value={line.id} />
    <input type="hidden" name="version" value={line.version} />
    <FormGrid>
      <FormField label="เลขที่ PO" required controlId="po-edit-number"><input className="ui-field-control" id="po-edit-number" name="poNumber" defaultValue={line.poNumber} maxLength={40} required disabled={pending} /></FormField>
      <FormField label="รหัสวัสดุ" required controlId="po-edit-material"><input className="ui-field-control" id="po-edit-material" name="materialCode" defaultValue={line.materialCode} maxLength={80} required disabled={pending} /></FormField>
      <FormField label="รายละเอียด" required controlId="po-edit-desc"><input className="ui-field-control" id="po-edit-desc" name="description" defaultValue={line.description} maxLength={500} required disabled={pending} /></FormField>
      <FormField label="หน่วยนับ" controlId="po-edit-unit">
        <select className="ui-field-control" id="po-edit-unit" name="unit" defaultValue={line.unit} disabled={pending}>
          {(Object.keys(poUnitLabels) as PoUnit[]).map((unit) => <option key={unit} value={unit}>{unit} · {poUnitLabels[unit]}</option>)}
        </select>
      </FormField>
      <FormField label="จำนวนสั่ง" required controlId="po-edit-qty"><input className="ui-field-control" id="po-edit-qty" name="orderedQty" defaultValue={line.orderedQty ?? ""} inputMode="decimal" required disabled={pending} /></FormField>
      <FormField label="ยอดรับก่อนเริ่มติดตาม" controlId="po-edit-initial" hint="ต้องไม่ทำให้ยอดรับรวมเกินจำนวนสั่ง">
        <input className="ui-field-control" id="po-edit-initial" name="initialReceivedQty" defaultValue={line.initialReceivedQty ?? "0"} inputMode="decimal" disabled={pending} />
      </FormField>
      <FormField label="ราคาต่อหน่วย" required controlId="po-edit-price"><input className="ui-field-control" id="po-edit-price" name="unitPrice" defaultValue={line.unitPrice ?? ""} inputMode="decimal" required disabled={pending} /></FormField>
      <FormField label="วันที่ออก PO" required controlId="po-edit-release"><input className="ui-field-control" id="po-edit-release" name="poReleaseDate" type="date" defaultValue={line.poReleaseDate.slice(0, 10)} required disabled={pending} /></FormField>
      <FormField label="GR ล่าสุด" controlId="po-edit-gr"><input className="ui-field-control" id="po-edit-gr" name="lastGrDate" type="date" defaultValue={line.lastGrDate?.slice(0, 10) ?? ""} disabled={pending} /></FormField>
      <FormField label="วันที่คาดว่าจะมาถึง (ETA)" controlId="po-edit-eta-date"><input className="ui-field-control" id="po-edit-eta-date" name="etaDate" type="date" defaultValue={line.etaDate?.slice(0, 10) ?? ""} disabled={pending} /></FormField>
      <FormField label="ข้อความ ETA" controlId="po-edit-eta-text"><input className="ui-field-control" id="po-edit-eta-text" name="etaText" defaultValue={line.etaText ?? ""} maxLength={200} disabled={pending} /></FormField>
      <FormField label="สถานะติดตาม" controlId="po-edit-status">
        <select className="ui-field-control" id="po-edit-status" name="status" defaultValue={line.status} disabled={pending}>
          {Object.entries(poStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </FormField>
      <FormField label="Order" controlId="po-edit-order"><input className="ui-field-control" id="po-edit-order" name="orderCode" defaultValue={line.orderCode ?? ""} maxLength={60} disabled={pending} /></FormField>
      <FormField label="รหัสผู้ขาย" controlId="po-edit-vendor-code"><input className="ui-field-control" id="po-edit-vendor-code" name="vendorCode" defaultValue={line.vendorCode ?? ""} maxLength={60} disabled={pending} /></FormField>
      <FormField label="ชื่อผู้ขาย" controlId="po-edit-vendor-name"><input className="ui-field-control" id="po-edit-vendor-name" name="vendorName" defaultValue={line.vendorName ?? ""} maxLength={300} disabled={pending} /></FormField>
      <FormField label="หมายเหตุ" controlId="po-edit-note"><textarea className="ui-field-control" id="po-edit-note" name="note" defaultValue={line.note} rows={2} maxLength={2000} disabled={pending} /></FormField>
    </FormGrid>
    <p className="po-hint">มูลค่า PO คำนวณจากจำนวนสั่ง × ราคาต่อหน่วย ระบบจะไม่แก้ข้อมูลต้นทางของรายการที่นำเข้าจากไฟล์</p>
    {state.message && <p role={state.ok ? "status" : "alert"} className={state.ok ? "po-success" : "po-error"}>{state.message}</p>}
    <FormActions variant="inline"><Button type="submit" variant="primary" pending={pending} pendingLabel="กำลังบันทึก…">บันทึกข้อมูล PO</Button></FormActions>
  </form>;
}

export function LineControlForm({ line }: { line: PoLineView }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(async (previous: PoActionState, data: FormData) => updateLineAction(previous, data), initial);
  useEffect(() => { if (state.ok) router.refresh(); }, [state, router]);
  return <form action={action} className="po-form">
    <input type="hidden" name="lineId" value={line.id} />
    <input type="hidden" name="version" value={line.version} />
    <FormGrid>
      <FormField label="สถานะติดตาม" controlId="po-line-status">
        <select className="ui-field-control" id="po-line-status" name="status" defaultValue={line.status} disabled={pending}>
          {Object.entries(poStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </FormField>
      <FormField label="วันที่คาดว่าจะมาถึง (ETA)" controlId="po-line-eta-date" hint="ใช้ได้อย่างใดอย่างหนึ่งกับข้อความ ETA">
        <input className="ui-field-control" id="po-line-eta-date" name="etaDate" type="date" defaultValue={line.etaDate ?? ""} disabled={pending} />
      </FormField>
      <FormField label="ข้อความ ETA / สถานะจากผู้ขาย" controlId="po-line-eta-text" error={mapFieldErrors(state.fieldErrors, "etaDate")}>
        <input className="ui-field-control" id="po-line-eta-text" name="etaText" defaultValue={line.etaText ?? ""} maxLength={200} disabled={pending} placeholder="เช่น พร้อมส่ง" />
      </FormField>
      <FormField label="หมายเหตุติดตาม" controlId="po-line-note">
        <textarea className="ui-field-control" id="po-line-note" name="note" defaultValue={line.note} rows={2} maxLength={2000} disabled={pending} />
      </FormField>
    </FormGrid>
    {state.message && <p role={state.ok ? "status" : "alert"} className={state.ok ? "po-success" : "po-error"}>{state.message}</p>}
    <FormActions variant="inline"><Button type="submit" variant="primary" pending={pending} pendingLabel="กำลังบันทึก…">บันทึกการติดตาม</Button></FormActions>
  </form>;
}
