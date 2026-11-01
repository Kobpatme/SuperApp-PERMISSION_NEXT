"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProcessShell, PhaseProgress, StatusBadge as ProcessStatusBadge } from "../ui-process";
import { DuctModuleNav, announce } from "../ui-shared";
import { PageHeader } from "@/components/ui/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { TableRegion } from "@/components/ui/table-region";
import { FormField } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { cancellationTransitions, renewalTransitions } from "../domain/workflow";
import { addDays, formatDate, getCancelOwner, getRenewOwner, getSlaStatus } from "../domain/source-policy";
import { apiPost, documentUrl, errorText, type Cancellation, type Processes, type Renewal, type RequestDetail, type RequestList } from "./api-client";
import { AttachmentPicker } from "./attachment-picker";
import { Modal, Notice, RefreshBar } from "./common";
const ModuleNav = DuctModuleNav;
import { PdfViewer } from "./pdf-viewer";
import { useResource } from "./use-resource";
import styles from "../ui-shared/ui-shared.module.css";
const renewalLabels: Record<string, string> = { draft: "ทีมออกแบบตรวจเส้นทาง", sent_to_3rdparty: "แจ้งผู้ให้บริการ", memo_preparing: "จัดทำ Memo", provider_confirmed: "ผู้ให้บริการยืนยันแล้ว", contracted: "ลงนามสัญญาแล้ว" };
const cancelLabels: Record<string, string> = { cancel_initiated: "เริ่มขอยกเลิก", in_progress: "ดำเนินการยกเลิก", tracking: "ติดตามผู้ให้บริการ", completed: "ยกเลิกเสร็จสมบูรณ์", rejected: "ปฏิเสธคำขอ" };
const ownerLabels: Record<string, string> = { "Team Design": "ทีมออกแบบ", "3rd Party": "ผู้ให้บริการ", "Team Permission": "ทีมขออนุญาต", Completed: "เสร็จแล้ว" };
const slaLabels: Record<string, string> = { "On Track": "อยู่ในกำหนด", "Near Due": "ใกล้ครบกำหนด", Overdue: "เกินกำหนด", Completed: "เสร็จแล้ว" };
function ProcessInfo({ start, days, completed }: { start: string; days: number; completed?: string | null }) {
  const status = getSlaStatus(start, days, completed);
  return (
    <div className={styles.actions}>
      <ProcessStatusBadge label={slaLabels[status]} tone={status === "Overdue" ? "action-required" : status === "Completed" ? "complete" : "pending"} />
      <span className={styles.muted}>ครบกำหนด {formatDate(addDays(start, days))} · {days} วัน</span>
    </div>
  );
}
export function ProcessList({ kind, permissions }: { kind: "renewal" | "cancellation"; permissions: string[] }) {
  const [offset, setOffset] = useState(0), [query, setQuery] = useState(""), [status, setStatus] = useState(""), [year, setYear] = useState(new Date().getFullYear() + 1), [create, setCreate] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const model = useResource<Processes>(`processes?offset=${offset}&query=${encodeURIComponent(query)}&status=${encodeURIComponent(status)}`), router = useRouter(), labels = kind === "renewal" ? renewalLabels : cancelLabels;
  const rows = kind === "renewal" ? model.data?.renewals ?? [] : model.data?.cancellations ?? [];
  async function createYear() {
    setBusy(true); setError("");
    try {
      const result = await apiPost("renewals", { year });
      router.push(`/duct-rental/renewal/${result.id}`);
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={`${styles.workspace} ${styles.ductSurface} ${styles.ductList}`} data-ui-screen={`duct-rental-${kind}-list`}>
      <PageHeader
        title={kind === "renewal" ? "ต่อสัญญาเช่าท่อรายปี" : "ยกเลิกการใช้ท่อ"}
        description="ติดตามสถานะ ผู้รับผิดชอบ และกำหนดดำเนินการ"
        parent={{ label: "เช่าท่อร้อยสาย", href: "/duct-rental" }}
        actions={permissions.includes(`duct_rental.${kind}.create`)
          ? kind === "renewal"
            ? <Button variant="primary" type="button" onClick={() => setCreate(true)}>สร้างงานต่อสัญญารายปี</Button>
            : <ButtonLink variant="primary" href="/duct-rental/cancellation/new">ขอยกเลิกการใช้ท่อ</ButtonLink>
          : undefined}
      />
      <ModuleNav current="requests" />
      <ProcessShell>
        <RefreshBar {...model} refresh={model.refresh} />
        <Notice text={error || model.error} error />
        <section className={styles.ductFilterToolbar} aria-label="ค้นหาและกรองรายการ" role="search">
        <form className="ui-filter" onSubmit={event => { event.preventDefault(); setOffset(0); }}>
          <FormField
            label={kind === "renewal" ? "ค้นหาปีสัญญา (ค.ศ.)" : "ค้นหาคำขอ / โครงการ / เส้นทาง"}
            className={styles.ductFilterSearch}
          >
            <input className={styles.input} value={query} onChange={event => { setQuery(event.target.value); setOffset(0); }} />
          </FormField>
          <FormField label="สถานะ">
            <select className={styles.input} value={status} onChange={event => { setStatus(event.target.value); setOffset(0); }}>
              <option value="">ทุกสถานะ</option>
              {Object.entries(labels).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </FormField>
          <button className={styles.button} type="submit">ค้นหา</button>
          <button className={styles.button} type="button" onClick={() => { setQuery(""); setStatus(""); setOffset(0); }}>รีเซ็ต</button>
        </form>
        </section>
      </ProcessShell>
      {model.loading ? (
        <PageSkeleton shape="table" />
      ) : (
        <>
          <TableRegion label={`ตารางรายการ ${kind === "renewal" ? "ต่อสัญญา" : "ยกเลิกการใช้ท่อ"} เลื่อนแนวนอนได้`} className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">รายการ</th><th scope="col">สถานะ / ผู้รับผิดชอบ</th><th scope="col">ค่าเช่า</th><th scope="col">กำหนดดำเนินการ</th><th scope="col">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {rows.filter(row => (!status || row.status === status) && ("year" in row ? String(row.year) : Object.values(row.snapshot).join(" ")).toLocaleLowerCase().includes(query.toLocaleLowerCase())).map(row => (
                  <tr key={row.id}>
                    <td>{"year" in row ? `ปี ${row.year + 543} (${row.year})` : <>{row.snapshot.code}<div>{row.snapshot.projectName}</div></>}</td>
                    <td><ProcessStatusBadge label={labels[row.status]} tone={row.status === "rejected" ? "blocked" : ["completed", "contracted"].includes(row.status) ? "complete" : "in-progress"} /><div className={styles.muted}>{ownerLabels["year" in row ? getRenewOwner(row.status) : getCancelOwner(row.status)]}</div></td>
                    <td>{"year" in row ? `${row.totalYearlyCost} บาท/ปี` : <>{row.yearlyFee} บาท/ปี<div className={styles.muted}>{row.monthlyFee} บาท/เดือน</div></>}</td>
                    <td><ProcessInfo start={row.createdAt} days={kind === "renewal" ? 7 : 5} completed={"year" in row ? row.contractedAt ?? (row.status === "contracted" ? row.updatedAt : null) : row.completedAt ?? row.rejectedAt ?? (row.status === "rejected" ? row.updatedAt : null)} /></td>
                    <td><ButtonLink variant="secondary" href={`/duct-rental/${kind}/${row.id}`}>เปิดงาน</ButtonLink></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableRegion>
          {!rows.length && <EmptyState title="ยังไม่มีรายการ" description={`ยังไม่มีงาน${kind === "renewal" ? "ต่อสัญญา" : "ยกเลิกการใช้ท่อ"} ที่ตรงกับตัวกรองที่เลือก`} />}
        </>
      )}
      <div className={styles.pagination}>
        <span>แสดงครั้งละ 100 รายการ · รวม {kind === "renewal" ? model.data?.renewalCount ?? "—" : model.data?.cancellationCount ?? "—"} รายการ</span>
        <div className={styles.actions}>
          <Button variant="secondary" type="button" disabled={!offset} onClick={() => setOffset(previous => Math.max(0, previous - 100))}>ก่อนหน้า</Button>
          <Button variant="secondary" type="button" disabled={rows.length < 100} onClick={() => setOffset(previous => previous + 100)}>ถัดไป</Button>
        </div>
      </div>
      {create && (
        <Modal busy={busy} title="สร้างงานต่อสัญญารายปี" close={() => setCreate(false)}><Notice text={error} error />
          <p>ระบบจะเก็บรายการเส้นทางที่ใช้งานอยู่เป็น snapshot และให้ตรวจทุกเส้นทางก่อนส่งต่อ</p>
          <FormField label="ปีสัญญา (ค.ศ.)">
            <input className={styles.input} type="number" min={2000} max={9999} value={year} onChange={event => setYear(Number(event.target.value))} />
          </FormField>
          <div className={styles.actions}>
            <Button variant="secondary" type="button" disabled={busy} onClick={() => setCreate(false)}>กลับ</Button>
            <Button variant="primary" type="button" disabled={busy} onClick={() => void createYear()}>ยืนยันสร้างงาน</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function RenewalWorkspace({ id }: { id: string }) {
  const [paused, setPaused] = useState(false), model = useResource<Renewal>(`renewals/${id}`, paused);
  return (
    <div className={`${styles.workspace} ${styles.ductSurface} ${styles.ductDetail}`} data-ui-screen="duct-rental-renewal-detail">
      <Notice text={model.error} error />
      {model.data
        ? <RenewalPane key={`${id}:${model.data.version}`} row={model.data} model={model} paused={paused} pause={setPaused} reload={async () => { setPaused(false); await model.refresh(); }} />
        : <PageSkeleton shape="detail" />}
    </div>
  );
}
function RenewalPane({ row, model, paused, pause, reload }: { row: Renewal; model: any; paused: boolean; pause: (value: boolean) => void; reload: () => Promise<void> }) {
  const [query, setQuery] = useState(""), [filter, setFilter] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState(""), [review, setReview] = useState<{ id: string; status: "keep" | "drop"; notes: string } | null>(null), [confirm, setConfirm] = useState<"advance" | "archive" | null>(null), [contract, setContract] = useState<File | null>(null), [documentId, setDocumentId] = useState(row.contractDocumentId || row.documents[0]?.id || ""), [contractNumber, setContractNumber] = useState(row.contractNumber || ""), [notes, setNotes] = useState(row.thirdPartyNotes || ""), [preview, setPreview] = useState<string | null>(null), [limit, setLimit] = useState(50);
  const transition = renewalTransitions[row.status as keyof typeof renewalTransitions], canReview = row.status === "draft" && !row.archivedAt && row.capabilities.includes("duct_rental.renewal.review"), pending = row.routes.filter(route => route.reviewStatus === "pending").length;
  const filtered = row.routes.filter(route => (!filter || route.reviewStatus === filter) && Object.values(route.snapshot).join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  const edited = () => pause(true);
  async function saveReview() {
    if (!review) return;
    setBusy(true); setError("");
    try {
      await apiPost(`renewals/${row.id}/review`, { version: row.version, routeId: review.id, reviewStatus: review.status, notes: review.notes });
      setReview(null); announce("บันทึกผลการตรวจแล้ว"); await reload();
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  }
  async function advance(action: "advance" | "archive") {
    setBusy(true); setError("");
    try {
      let selected = documentId;
      if (action === "advance" && contract) {
        const form = new FormData(); form.set("version", String(row.version)); form.set("file", contract);
        const result = await apiPost(`renewals/${row.id}/documents`, form);
        selected = result.id; setDocumentId(selected); setContract(null);
      }
      await apiPost(`renewals/${row.id}/${action}`, { version: row.version, ...(action === "advance" && row.status === "provider_confirmed" ? { contractNumber, thirdPartyNotes: notes, ...(selected ? { contractDocumentId: selected } : {}) } : {}) });
      await reload();
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader title={`ต่อสัญญาปี ${row.year + 543} (${row.year})`} description={renewalLabels[row.status]} parent={{ label: "ต่อสัญญารายปี", href: "/duct-rental/renewal" }} />
      <ModuleNav current="requests" />
      <RefreshBar {...model} paused={paused} refresh={model.refresh} />
      <Notice text={error} error />
      {row.archivedAt && <Notice text="งานนี้เก็บเข้าประวัติแล้ว" />}
      <div className={styles.toolbar}>
        <ProcessInfo start={row.createdAt} days={7} completed={row.contractedAt ?? (row.status === "contracted" ? row.updatedAt : null)} />
        <strong>ค่าเช่ารวมที่คงไว้ {row.totalYearlyCost} บาท/ปี · รอตรวจ {pending} เส้นทาง</strong>
      </div>
      <PhaseProgress
        value={row.status}
        items={Object.entries(renewalLabels).map(([id, label]) => ({ id, label, description: id === row.status ? "สถานะปัจจุบัน" : undefined }))}
        onChange={id => announce(`สถานะกระบวนการ ${renewalLabels[id]}`)}
        label="ความคืบหน้าการต่อสัญญา"
      />
      <div className={styles.toolbar}>
        <FormField label="ค้นหาเส้นทาง"><input className={styles.input} value={query} onChange={event => { setQuery(event.target.value); setLimit(50); }} /></FormField>
        <FormField label="ผลการตรวจ"><select className={styles.input} value={filter} onChange={event => { setFilter(event.target.value); setLimit(50); }}>
          <option value="">ทุกผลการตรวจ</option><option value="pending">รอตรวจ</option><option value="keep">คงไว้</option><option value="drop">ตัดออก</option>
        </select></FormField>
      </div>
      <TableRegion label="ตารางเส้นทางต่อสัญญารายปี เลื่อนแนวนอนได้" className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr><th>เส้นทาง / โครงการ</th><th>ค่าเช่า</th><th>ระยะสัญญา</th><th>ผลการตรวจ / หมายเหตุ</th><th>ดำเนินการ</th></tr>
          </thead>
          <tbody>
            {filtered.slice(0, limit).map(route => (
              <tr key={route.id}>
                <td>
                  <Link href={`/duct-rental/${route.requestId}`}>{route.snapshot.code}</Link><div>{route.snapshot.projectName}</div>
                  <details><summary>รายละเอียดเส้นทาง</summary>
                    <dl className={styles.details}>
                      {Object.entries(route.snapshot).map(([key, value]) => (
                        <div key={key}>
                          <dt>{{ routeName: "เส้นทาง", ownerDuct: "เจ้าของท่อ", serviceCenter: "ศูนย์บริการ", province: "จังหวัด", district: "อำเภอ", code: "รหัสคำขอ", projectName: "โครงการ" }[key] || "ข้อมูลเส้นทาง"}</dt>
                          <dd>{value || "—"}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                </td>
                <td>{route.yearlyFee} บาท/ปี<div className={styles.muted}>{route.monthlyFee} บาท/เดือน</div></td>
                <td>{formatDate(route.contractStart)} ถึง {formatDate(route.contractEnd)}</td>
                <td>{route.reviewStatus === "keep" ? "คงไว้" : route.reviewStatus === "drop" ? "ตัดออก" : "รอตรวจ"}<div>{route.reviewNotes || "—"}</div></td>
                <td>{canReview && (
                  <div className={styles.actions}>
                    <Button variant="secondary" type="button" disabled={busy} onClick={() => { setReview({ id: route.id, status: "keep", notes: route.reviewNotes }); edited(); }}>คงไว้</Button>
                    <Button variant="secondary" type="button" disabled={busy} onClick={() => { setReview({ id: route.id, status: "drop", notes: route.reviewNotes }); edited(); }}>ตัดออก</Button>
                  </div>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableRegion>
      {!filtered.length && <EmptyState title="ไม่มีเส้นทางที่ตรงเงื่อนไข" description="ปรับตัวกรองค้นหาหรือผลการตรวจ แล้วลองอีกครั้ง" />}
      {filtered.length > limit && <Button variant="secondary" type="button" onClick={() => setLimit(previous => previous + 50)}>แสดงอีก 50 เส้นทาง</Button>}
      {["provider_confirmed", "contracted"].includes(row.status) && (
        <section className={styles.panel}>
          <h2>เอกสารสัญญารายปี</h2>
          <div className={styles.grid}>
            <FormField label="เลขที่สัญญา (ถ้ามี)">
              <input className={styles.input} value={contractNumber} readOnly={row.status === "contracted" || !row.capabilities.includes("duct_rental.renewal.contract")} onChange={event => { setContractNumber(event.target.value); edited(); }} />
            </FormField>
            <FormField label="หมายเหตุผู้ให้บริการ (ถ้ามี)">
              <textarea className={styles.input} value={notes} readOnly={row.status === "contracted" || !row.capabilities.includes("duct_rental.renewal.contract")} onChange={event => { setNotes(event.target.value); edited(); }} />
            </FormField>
            {row.status === "provider_confirmed" && <AttachmentPicker label="สัญญารายปี (PDF)" file={contract} disabled={busy || !row.capabilities.includes("duct_rental.renewal.contract") || !row.capabilities.includes("duct_rental.document.upload")} change={file => { setContract(file); edited(); }} />}
          </div>
          {row.documents.map(doc => (
            <div className={styles.fileRow} key={doc.id}>
              <span>{doc.name}</span>
              <div className={styles.actions}>
                <Button variant="secondary" type="button" onClick={() => setPreview(doc.id)}>ดูเอกสาร</Button>
                {row.capabilities.includes("duct_rental.document.export") && <ButtonLink variant="secondary" href={documentUrl(doc.id, true)}>ดาวน์โหลด</ButtonLink>}
              </div>
            </div>
          ))}
        </section>
      )}
      <div className={styles.actions}>
        {transition && !row.archivedAt && row.capabilities.includes(transition.permission) && (
          <Button variant="primary" type="button" disabled={busy || row.status === "draft" && !!pending || row.status === "provider_confirmed" && !contract && !documentId} onClick={() => setConfirm("advance")}>
            {row.status === "draft" ? "ตรวจครบ / ส่งผู้ให้บริการ" : row.status === "sent_to_3rdparty" ? "เริ่มจัดทำ Memo" : row.status === "memo_preparing" ? "ยืนยันจากผู้ให้บริการ" : "บันทึกสัญญา / จบงาน"}
          </Button>
        )}
        {!row.archivedAt && row.capabilities.includes("duct_rental.renewal.archive") && (
          <Button variant="danger" type="button" disabled={busy} onClick={() => setConfirm("archive")}>เก็บเข้าประวัติ</Button>
        )}
        <ButtonLink variant="secondary" href="/duct-rental/renewal">กลับรายการ</ButtonLink>
      </div>
      {review && (
        <Modal busy={busy} title={review.status === "keep" ? "ยืนยันคงเส้นทางไว้" : "ยืนยันตัดเส้นทางออก"} close={() => { setReview(null); pause(false); }}><Notice text={error} error />
          <FormField label="หมายเหตุผลการตรวจ">
            <textarea className={styles.input} value={review.notes} maxLength={10000} onChange={event => setReview(previous => previous ? { ...previous, notes: event.target.value } : null)} />
          </FormField>
          <Button variant="primary" type="button" disabled={busy} onClick={() => void saveReview()}>บันทึกผลการตรวจ</Button>
        </Modal>
      )}
      {confirm && (
        <Modal busy={busy} title={confirm === "archive" ? "ยืนยันเก็บเข้าประวัติ" : "ยืนยันเปลี่ยนสถานะ"} close={() => setConfirm(null)}>
          <p>ระบบจะบันทึกสถานะและประวัติผู้ดำเนินการ</p>
          <Button variant="primary" type="button" disabled={busy} onClick={() => { const action = confirm; setConfirm(null); void advance(action); }}>ยืนยัน</Button>
        </Modal>
      )}
      {preview && (
        <Modal busy={busy} title="สัญญารายปี" close={() => setPreview(null)}>
          <PdfViewer url={documentUrl(preview)} name="สัญญารายปี" />
        </Modal>
      )}
    </>
  );
}
export function CancellationForm({ selected }: { selected?: string }) {
  const [query, setQuery] = useState(""), [requestId, setRequestId] = useState(selected || ""), [date, setDate] = useState(""), [reason, setReason] = useState(""), [notes, setNotes] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState(""), [confirm, setConfirm] = useState(false);
  const list = useResource<RequestList>(`requests?workflow=ACTIVE&query=${encodeURIComponent(query)}`), request = useResource<RequestDetail>(requestId ? `requests/${requestId}` : null), router = useRouter(), row = requestId ? request.data : undefined;
  async function create() {
    if (!row) return;
    setBusy(true); setError("");
    try {
      const result = await apiPost("cancellations", { requestId, version: row.version, effectiveDate: date, reason, notes });
      router.push(`/duct-rental/cancellation/${result.id}`);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={`${styles.workspace} ${styles.ductSurface} ${styles.ductForm}`} data-ui-screen="duct-rental-cancellation-new">
      <PageHeader title="ขอยกเลิกการใช้ท่อ" parent={{ label: "ยกเลิกการใช้ท่อ", href: "/duct-rental/cancellation" }} />
      <ModuleNav current="requests" />
      <Notice text={error || list.error || request.error} error />
      <section className={styles.panel}>
        <div className={styles.grid}>
          <FormField label="ค้นหาเส้นทางที่ใช้งานอยู่"><input className={styles.input} value={query} onChange={event => setQuery(event.target.value)} /></FormField>
          <FormField label="เส้นทางที่ขอยกเลิก">
            <select className={styles.input} value={requestId} disabled={busy} onChange={event => setRequestId(event.target.value)}>
              <option value="">เลือกเส้นทาง</option>
              {row && !list.data?.rows.some(item => item.id === row.id) && <option value={row.id}>{row.code} · {row.projectName}</option>}
              {list.data?.rows.map(item => <option key={item.id} value={item.id}>{item.code} · {item.projectName} · {item.routeName}</option>)}
            </select>
          </FormField>
        </div>
        {row && (
          <dl className={styles.details}>
            <div><dt>โครงการ / เส้นทาง</dt><dd>{row.projectName} · {row.routeName}</dd></div>
            <div><dt>เจ้าของท่อ / ศูนย์บริการ</dt><dd>{row.ownerDuct} · {row.serviceCenter}</dd></div>
            <div><dt>ค่าเช่าปัจจุบัน</dt><dd>{row.rate ? `${row.rate.monthlyFee} บาท/เดือน · ${row.rate.yearlyFee} บาท/ปี` : "ไม่มีสิทธิ์ดูค่าเช่า"}</dd></div>
          </dl>
        )}
      </section>
      <form noValidate className={styles.panel} onSubmit={event => { event.preventDefault(); setConfirm(true); }}>
        <div className={styles.grid}>
          <FormField label="วันที่มีผลยกเลิก"><input className={styles.input} type="date" value={date} disabled={busy} onChange={event => setDate(event.target.value)} /></FormField>
          <FormField label="เหตุผลการยกเลิก"><textarea className={styles.input} value={reason} maxLength={10000} disabled={busy} onChange={event => setReason(event.target.value)} /></FormField>
          <FormField label="หมายเหตุเพิ่มเติม (ถ้ามี)"><textarea className={styles.input} value={notes} maxLength={10000} disabled={busy} onChange={event => setNotes(event.target.value)} /></FormField>
        </div>
        <Button variant="primary" type="submit" disabled={busy || !row || !date || !reason || !row.capabilities.includes("duct_rental.cancellation.create")}>ขอยกเลิกการใช้ท่อ</Button>
      </form>
      {confirm && (
        <Modal busy={busy} title="ยืนยันคำขอยกเลิก" close={() => setConfirm(false)}>
          <p>เส้นทางยังใช้งานอยู่จนกว่างานยกเลิกจะเสร็จสมบูรณ์ โดยใช้วันที่มีผลตามที่กรอก</p>
          <div className={styles.actions}>
            <Button variant="secondary" type="button" disabled={busy} onClick={() => setConfirm(false)}>ยกเลิก</Button>
            <Button variant="primary" type="button" disabled={busy} onClick={() => { setConfirm(false); void create(); }}>ยืนยันสร้างคำขอ</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function CancellationWorkspace({ id }: { id: string }) {
  const [paused, setPaused] = useState(false), model = useResource<Cancellation>(`cancellations/${id}`, paused);
  return (
    <div className={`${styles.workspace} ${styles.ductSurface} ${styles.ductDetail}`} data-ui-screen="duct-rental-cancellation-detail">
      <Notice text={model.error} error />
      {model.data
        ? <CancellationPane key={`${id}:${model.data.version}`} row={model.data} model={model} paused={paused} pause={setPaused} reload={async () => { setPaused(false); await model.refresh(); }} />
        : <PageSkeleton shape="detail" />}
    </div>
  );
}
function CancellationPane({ row, model, paused, pause, reload }: { row: Cancellation; model: any; paused: boolean; pause: (value: boolean) => void; reload: () => Promise<void> }) {
  const [notes, setNotes] = useState(row.notes), [confirm, setConfirm] = useState<"advance" | "reject" | "archive" | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const closed = !!row.archivedAt || ["completed", "rejected"].includes(row.status);
  async function run(action: "advance" | "reject" | "archive") {
    setBusy(true); setError("");
    try {
      await apiPost(`cancellations/${row.id}/${action}`, { version: row.version, notes });
      await reload();
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader title={`ยกเลิกการใช้ท่อ ${row.snapshot.code}`} description={row.snapshot.projectName} parent={{ label: "ยกเลิกการใช้ท่อ", href: "/duct-rental/cancellation" }} />
      <ModuleNav current="requests" />
      <RefreshBar {...model} paused={paused} refresh={model.refresh} />
      <Notice text={error} error />
      <div className={styles.toolbar}>
        <strong>{cancelLabels[row.status]}</strong>
        <ProcessInfo start={row.createdAt} days={5} completed={row.completedAt ?? row.rejectedAt ?? (row.status === "rejected" ? row.updatedAt : null)} />
      </div>
      <section className={styles.panel}>
        <h2>ข้อมูลคำขอและสัญญาขณะเริ่มยกเลิก</h2>
        <dl className={styles.details}>
          <div><dt>เส้นทาง</dt><dd>{row.snapshot.routeName}</dd></div>
          <div><dt>เจ้าของท่อ</dt><dd>{row.snapshot.ownerDuct}</dd></div>
          <div><dt>ค่าเช่า</dt><dd>{row.monthlyFee} บาท/เดือน · {row.yearlyFee} บาท/ปี</dd></div>
          <div><dt>ระยะสัญญา</dt><dd>{formatDate(row.contractStart)} ถึง {formatDate(row.contractEnd)}</dd></div>
          <div><dt>วันที่มีผลยกเลิก</dt><dd>{formatDate(row.effectiveDate)}</dd></div>
          <div><dt>เหตุผล</dt><dd>{row.reason}</dd></div>
        </dl>
        <ButtonLink variant="secondary" href={`/duct-rental/${row.requestId}`}>เปิดเส้นทางต้นฉบับ</ButtonLink>
      </section>
      <FormField label="หมายเหตุการดำเนินการ">
        <textarea className={styles.input} value={notes} maxLength={10000} disabled={busy} readOnly={closed || !row.capabilities.some(code => ["duct_rental.cancellation.advance", "duct_rental.cancellation.reject"].includes(code))} onChange={event => { setNotes(event.target.value); pause(true); }} />
      </FormField>
      <div className={styles.actions}>
        {!closed && row.capabilities.includes("duct_rental.cancellation.advance") && (
          <Button variant="primary" type="button" disabled={busy} onClick={() => setConfirm("advance")}>
            {cancellationTransitions[row.status as keyof typeof cancellationTransitions] === "completed" ? "ยกเลิกเสร็จสมบูรณ์" : "ส่งต่อขั้นถัดไป"}
          </Button>
        )}
        {!closed && row.capabilities.includes("duct_rental.cancellation.reject") && (
          <Button variant="danger" type="button" disabled={busy} onClick={() => setConfirm("reject")}>ปฏิเสธคำขอ</Button>
        )}
        {!row.archivedAt && row.capabilities.includes("duct_rental.cancellation.archive") && (
          <Button variant="secondary" type="button" disabled={busy} onClick={() => setConfirm("archive")}>เก็บเข้าประวัติ</Button>
        )}
        <ButtonLink variant="secondary" href="/duct-rental/cancellation">กลับรายการ</ButtonLink>
      </div>
      {confirm && (
        <Modal busy={busy} title={confirm === "reject" ? "ยืนยันปฏิเสธคำขอ" : confirm === "archive" ? "ยืนยันเก็บเข้าประวัติ" : "ยืนยันเปลี่ยนสถานะยกเลิก"} close={() => setConfirm(null)}>
          <p>{confirm === "advance" && row.status === "tracking" ? "เมื่อยืนยัน ระบบจะบันทึกงานและเปลี่ยนเส้นทางเป็นยกเลิกโดยใช้วันที่มีผลตามคำขอ" : "ระบบจะเก็บสถานะ หมายเหตุ และประวัติผู้ดำเนินการ"}</p>
          <div className={styles.actions}>
            <Button variant="secondary" type="button" disabled={busy} onClick={() => setConfirm(null)}>ยกเลิก</Button>
            <Button variant="primary" type="button" disabled={busy} onClick={() => { const action = confirm; setConfirm(null); void run(action); }}>ยืนยัน</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
