"use client";
import { useActionState, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormActions, FormField, FormSection } from "@/components/ui/form";
import { confirmExcelAction, previewExcelAction, type ExcelActionState } from "@/app/(platform)/po-tracking/excel-actions";
import { excelFieldLabels, excelHeaders, type ExcelDecision } from "@/modules/po-tracking/excel-domain";
import type { ExcelPreview } from "@/modules/po-tracking/excel-service";
import { ManualPoForm } from "./po-forms";

const initial: ExcelActionState = { ok: false, message: "" };
const labels: Record<ExcelDecision["kind"], string> = { new: "เพิ่มใหม่", update: "อัปเดต", unchanged: "ข้อมูลเดิม", conflict: "ข้อมูลขัดแย้ง", ambiguous: "จับคู่ไม่ชัดเจน", duplicate: "ซ้ำในไฟล์" };

export function PoExcelForm() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ExcelPreview | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [fileError, setFileError] = useState("");
  const [finished, setFinished] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [state, previewAction, inspecting] = useActionState(async (previous: ExcelActionState, form: FormData) => {
    setShowResult(false);
    if (!file) return { ok: false, message: "กรุณาเลือกไฟล์ Excel" };
    form.set("file", file);
    const result = await previewExcelAction(previous, form);
    setPreview(result.preview ?? null);
    setSelected(result.preview?.decisions.filter(d => d.kind === "new").map(d => d.row.row) ?? []);
    return result;
  }, initial);
  const [result, confirmAction, saving] = useActionState(async (previous: ExcelActionState, form: FormData) => {
    if (!file || !preview) return { ok: false, message: "กรุณาตรวจสอบไฟล์ก่อนบันทึก" };
    form.set("file", file);
    form.set("digest", preview.digest);
    const response = await confirmExcelAction(previous, form);
    setShowResult(true);
    if (response.completed) { setFinished(true); setPreview(null); setSelected([]); }
    return response;
  }, initial);
  const busy = inspecting || saving;
  const eligible = preview?.decisions.filter(d => ["new", "update"].includes(d.kind)) ?? [];
  return <section className="po-form po-excel" aria-label="นำเข้า PO จาก Excel" aria-busy={busy}>
    {!finished && <form action={previewAction} className="po-form" onReset={event => event.preventDefault()}>
      <FormSection legend="เลือกไฟล์ Excel" help="รองรับ .xlsx ไม่เกิน 512 KB และ 1,000 แถว ใช้ชีตแรก สลับคอลัมน์ได้ ระบบค้นหาหัวตารางภายใน 20 แถวแรก">
        <FormField label="ไฟล์ PO" required controlId="po-excel-file" error={fileError || undefined}>
          <input id="po-excel-file" name="file" type="file" accept=".xlsx" required disabled={busy} onChange={e => {
            const next = e.target.files?.[0] ?? null;
            const invalid = next && (!next.name.toLowerCase().endsWith(".xlsx") || next.size > 512 * 1024);
            setFileError(invalid ? "เลือกไฟล์ .xlsx ขนาดไม่เกิน 512 KB" : "");
            setFile(invalid ? null : next); setPreview(null); setSelected([]); setShowResult(false);
          }} />
        </FormField>
        <details className="po-excel-help"><summary>หัวตารางที่รองรับ</summary><p>{excelHeaders.join(", ")}</p><p>เพิ่มคอลัมน์ Note หรือ หมายเหตุ ได้ หากไม่มีค่านี้ ระบบจะรักษาหมายเหตุเดิมไว้ รหัสวัสดุ เลข PO และรหัสผู้ขายควรเป็นข้อความเพื่อคงเลขศูนย์นำหน้า</p></details>
        <p className="po-hint">รายการเดิมอัปเดตได้เฉพาะ ETA และหมายเหตุ จำนวน ราคา และยอดรับที่ต่างกันจะแจ้งให้ตรวจสอบ โดยไม่ทับข้อมูลเดิม</p>
      </FormSection>
      <FormActions variant="inline"><Button type="submit" pending={inspecting} pendingLabel="กำลังตรวจไฟล์…" disabled={!file || busy}>ตรวจสอบไฟล์และข้อมูลซ้ำ</Button></FormActions>
    </form>}
    {state.message && !finished && (preview || !state.ok) && <p role={state.ok ? "status" : "alert"} className={state.ok ? "po-hint" : "po-error"}>{state.message}</p>}
    {preview && <form action={confirmAction} className="po-form">
      <div className="po-results-head"><h2>ผลตรวจไฟล์</h2><p>ชีต {preview.sheet} · {preview.total} แถว · เลือก {selected.length} รายการ</p></div>
      <p className="po-hint">จับคู่ด้วยเลข PO และรหัสวัสดุ รายการที่ซ้ำหลายแถวต้องตรวจสอบเอง รายการอัปเดตจะไม่ถูกเลือกให้อัตโนมัติ</p>
      <div className="po-badges">{Object.entries(labels).map(([kind, label]) => <span className="po-unit" key={kind}>{label} {preview.decisions.filter(d => d.kind === kind).length}</span>)}<span className="po-unit">ข้อมูลไม่ถูกต้อง {preview.errors.length}</span></div>
      {preview.errors.length > 0 && <div className="po-error" role="alert"><p>แถวต่อไปนี้จะไม่ถูกบันทึก</p><ul>{preview.errors.map(e => <li key={e.row}>แถว {e.row}: {e.message}</li>)}</ul></div>}
      <label className="po-check"><input type="checkbox" disabled={busy || !eligible.length} checked={!!eligible.length && selected.length === eligible.length} onChange={e => setSelected(e.target.checked ? eligible.map(d => d.row.row) : [])} />เลือก / ยกเลิกทุกรายการที่บันทึกได้</label>
      <div className="po-excel-table-wrap" role="region" aria-label="ผลตรวจรายการ PO เลื่อนแนวนอนได้" tabIndex={0}>
        <table className="ui-table po-excel-table"><caption>ตรวจรายการใหม่ รายการซ้ำ และข้อมูลที่จะเปลี่ยนก่อนยืนยัน</caption><thead><tr><th scope="col">เลือก</th><th scope="col">แถว</th><th scope="col">PO / วัสดุ</th><th scope="col">ผลตรวจ</th><th scope="col">รายละเอียด</th></tr></thead>
          <tbody>{preview.decisions.map(d => <tr key={d.row.row}>
            <td><input aria-label={`เลือกแถว ${d.row.row} PO ${d.row.poNumber}`} type="checkbox" name="selectedRow" value={d.row.row} disabled={busy || !["new", "update"].includes(d.kind)} checked={selected.includes(d.row.row)} onChange={e => setSelected(old => e.target.checked ? [...old, d.row.row] : old.filter(n => n !== d.row.row))} /></td>
            <td>{d.row.row}</td><td><strong>{d.row.poNumber}</strong><span className="po-sub">{d.row.materialCode} · {d.row.unit}</span><span className="po-sub">{d.row.description}</span></td>
            <td><strong className={d.kind === "conflict" || d.kind === "ambiguous" || d.kind === "duplicate" ? "po-warning" : undefined}>{labels[d.kind]}</strong></td>
            <td><p>{d.message}</p>{d.kind === "new" && <p>จำนวน {d.row.orderedQty ?? "ไม่ระบุ"} · ราคา {d.row.unitPrice ?? "ยังไม่ทราบ"} · ETA {d.row.etaDate ?? d.row.etaText ?? "ไม่ระบุ"}</p>}
              {d.changes.length > 0 && <ul>{d.changes.map(c => <li key={c.field}>{excelFieldLabels[c.field]}: <del>{c.before ?? "ไม่ระบุ"}</del> → <ins>{c.after ?? "ไม่ระบุ"}</ins></li>)}</ul>}
            </td>
          </tr>)}</tbody></table>
      </div>
      <label className="po-check"><input type="checkbox" name="confirmed" value="yes" required disabled={busy} />ตรวจสอบรายการที่เลือกและความแตกต่างแล้ว ยืนยันบันทึก</label>
      <FormActions><span className="po-hint">บันทึกเฉพาะ {selected.length} รายการที่เลือก</span><Button type="submit" variant="primary" pending={saving} pendingLabel="กำลังบันทึก…" disabled={busy || !selected.length}>ยืนยันนำเข้า PO</Button></FormActions>
    </form>}
    {result.message && showResult && <p role={result.ok ? "status" : "alert"} className={result.ok ? "po-success" : "po-error"}>{result.message}</p>}
    {finished && <FormActions variant="inline"><ButtonLink href="/po-tracking" variant="primary">ดูรายการ PO</ButtonLink><Button type="button" onClick={() => { setFinished(false); setFile(null); setShowResult(false); }}>นำเข้าไฟล์อื่น</Button></FormActions>}
  </section>;
}

export function PoCreateWorkspace({ canImport }: { canImport: boolean }) {
  const [mode, setMode] = useState<"manual" | "excel">("manual");
  return <div className="po-workspace">
    {canImport && <div className="po-create-modes" role="group" aria-label="วิธีสร้าง PO">
      <Button type="button" variant={mode === "manual" ? "primary" : "secondary"} aria-pressed={mode === "manual"} onClick={() => setMode("manual")}>กรอกข้อมูลเอง</Button>
      <Button type="button" variant={mode === "excel" ? "primary" : "secondary"} aria-pressed={mode === "excel"} onClick={() => setMode("excel")}>เพิ่มจาก Excel</Button>
    </div>}
    <div hidden={mode !== "manual"}><ManualPoForm /></div>
    {canImport && <div hidden={mode !== "excel"}><PoExcelForm /></div>}
  </div>;
}
