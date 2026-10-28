"use client";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { SERVICE_CENTER_OPTIONS, REQUEST_TYPE_OPTIONS } from "../schemas/design";
import { requestPhases, workflowStatus, formatDate } from "../domain/source-policy";
import type { RequestList } from "./api-client";
import { useResource } from "./use-resource";
import { ModuleNav, Field, Notice, RefreshBar, phaseLabels, Modal } from "./common";
import { RequestWorkspace } from "./request-workspace";
import { TrackingSummary } from "./tracking-workspace";
import styles from "./workspace.module.css";

const emptyFilters = { query: "", phase: "", serviceCenter: "", requestType: "", workflow: "", documents: "" };
const workflowLabels: Record<string, string> = { PENDING: "รอรับงาน", ACCEPTED: "กำลังดำเนินการ", ACTIVE: "ใช้งานอยู่", CANCELLED: "ยกเลิกแล้ว" };
export function RequestListWorkspace({ permissions, userId }: { permissions: string[]; userId: string }) {
  const [filters, setFilters] = useState(emptyFilters), [query, setQuery] = useState(""), [offset, setOffset] = useState(0), [advancedOpen, setAdvancedOpen] = useState(false);
  const model = useResource<RequestList>(`requests?${new URLSearchParams({ ...filters, offset: String(offset), limit: "50" })}`);
  const [detail, setDetail] = useState<string | null>(null);
  const filter = (name: keyof typeof filters, value: string) => { setFilters(previous => ({ ...previous, [name]: value })); setOffset(0); };
  return <div className={`${styles.workspace} ${styles.listSurface}`} data-ui-screen="duct-rental">
    <PageHeader title="เช่าท่อร้อยสาย" description="สร้างคำขอ ติดตามการอนุญาตและติดตั้ง และดูเส้นทางเช่าท่อที่ใช้งานอยู่" actions={permissions.includes("duct_rental.request.create") ? <Link className={styles.primary} href="/duct-rental/new">สร้างคำขอ</Link> : undefined} />
    <div className={styles.moduleHeaderActions}><ModuleNav />{permissions.includes("duct_rental.settings.manage") && <div className={styles.actions}><Link className={styles.button} href="/duct-rental/settings">ตั้งค่าผู้ประสานงาน</Link></div>}</div>
    <RefreshBar {...model} refresh={() => model.refresh()} />
    <Notice text={model.error} error />
    <div className={styles.statusOverview}>
      <div className={styles.metrics}>
      <div className={styles.metric}><span>รายการที่ตรงตัวกรอง</span><strong>{model.data?.counts.total ?? "—"}</strong></div>
      <button type="button" className={styles.metric} onClick={() => { setFilters({ ...emptyFilters, workflow: "PENDING" }); setOffset(0); }}><span>คิวรอรับงาน</span><strong>{model.data?.queues.waiting ?? "—"}</strong></button>
      <button type="button" className={styles.metric} onClick={() => { setFilters({ ...emptyFilters, documents: "incomplete" }); setOffset(0); }}><span>เอกสารค้าง</span><strong>{model.data?.queues.missing ?? "—"}</strong></button>
      <div className={styles.metric}><span>ใช้งานอยู่ในตัวกรอง</span><strong>{model.data?.counts.active ?? "—"}</strong></div>
      </div>
      <details className={styles.workflowDisclosure}>
        <summary>ดู 10 ขั้นตอนงาน <span>{filters.phase ? `เลือก: ${phaseLabels[filters.phase as keyof typeof phaseLabels]}` : "แสดงเมื่อเปิด"}</span></summary>
        <div className={styles.steps}>{requestPhases.map(phase => <button key={phase} type="button" className={`${styles.step} ${filters.phase === phase ? styles.current : ""}`} onClick={() => filter("phase", phase)}>{phaseLabels[phase]} <strong>{model.data?.pipeline.find(item => item.phase === phase)?.count ?? 0}</strong></button>)}</div>
      </details>
      <div className={styles.trackingSummary} aria-label="สรุปการติดตามงาน"><TrackingSummary /></div>
    </div>
    <section className={`${styles.panel} ${styles.filterToolbar}`} aria-label="ค้นหาและกรองคำขอ" role="search">
      <div className={styles.searchBar}>
        <Field label="ค้นหาคำขอ / โครงการ / เส้นทาง">
          <input name="query" value={query} onChange={event => setQuery(event.target.value)} maxLength={200} placeholder="รหัส โครงการ เจ้าของท่อ จังหวัด หรือศูนย์บริการ" />
        </Field>
        <button className={styles.primary} type="button" onClick={() => { filter("query", query); }}>ค้นหา</button>
        <button className={styles.button} type="button" onClick={() => { setFilters(emptyFilters); setQuery(""); setOffset(0); }}>ล้างตัวกรองทั้งหมด</button>
        <button className={styles.button} type="button" aria-expanded={advancedOpen} aria-controls="duct-advanced-filters" onClick={() => setAdvancedOpen(open => !open)}>ตัวกรองขั้นสูง {advancedOpen ? "⌃" : "⌄"}</button>
      </div>
      {advancedOpen && <div id="duct-advanced-filters" className={styles.filters}>
        <Field label="ขั้นตอน"><select value={filters.phase} onChange={event => filter("phase", event.target.value)}><option value="">ทุกขั้นตอน</option>{requestPhases.map(phase => <option key={phase} value={phase}>{phaseLabels[phase]}</option>)}</select></Field>
        <Field label="ประเภทคำขอ"><select value={filters.requestType} onChange={event => filter("requestType", event.target.value)}><option value="">ทุกประเภท</option>{REQUEST_TYPE_OPTIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
        <Field label="ศูนย์บริการ"><select value={filters.serviceCenter} onChange={event => filter("serviceCenter", event.target.value)}><option value="">ทุกศูนย์บริการ</option>{SERVICE_CENTER_OPTIONS.map(center => <option key={center}>{center}</option>)}</select></Field>
        <Field label="เอกสาร"><select value={filters.documents} onChange={event => filter("documents", event.target.value)}><option value="">ทุกสถานะเอกสาร</option><option value="complete">เอกสารครบ</option><option value="incomplete">เอกสารค้าง</option></select></Field>
        <Field label="สถานะงาน"><select value={filters.workflow} onChange={event => filter("workflow", event.target.value)}><option value="">ทุกสถานะงาน</option>{Object.entries(workflowLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        </div>}
    </section>
    <div className={styles.tableWrap}><table className={styles.table}><caption>คำขอเช่าท่อร้อยสาย</caption><thead><tr><th scope="col">คำขอ / โครงการ</th><th scope="col">เส้นทาง / เจ้าของท่อ</th><th scope="col">ศูนย์บริการ</th><th scope="col">ขั้นตอน / สถานะ</th><th scope="col">เอกสาร</th><th scope="col">อัปเดต</th><th scope="col">ดำเนินการ</th></tr></thead><tbody>{model.data?.rows.map(row => <tr key={row.id}>
      <td><button className={styles.button} type="button" onClick={() => setDetail(row.id)} aria-label={`ดูรายละเอียด ${row.code}`}>{row.code}</button><div>{row.projectName || "ร่างคำขอ"}</div></td><td>{row.routeName || "—"}<div className={styles.muted}>{row.ownerDuct || "—"} · {row.province || "—"}</div></td><td>{row.serviceCenter || "—"}</td><td>{phaseLabels[row.phase]}<div><span className={styles.badge}>{workflowLabels[workflowStatus({ currentPhase: row.phase, cancelledAt: row.cancelledAt ?? undefined, phaseStatuses: row.phaseStatuses })] ?? "กำลังดำเนินการ"}</span></div></td><td><span className={`${styles.badge} ${row.documentsIncomplete ? styles.warning : styles.success}`}>{row.documentsIncomplete ? "เอกสารค้าง" : "เอกสารครบ"}</span></td><td>{formatDate(row.updatedAt)}</td><td><Link className={styles.button} href={`/duct-rental/${row.id}`}>เปิดงาน</Link></td>
    </tr>)}</tbody></table>{!model.data?.rows.length && <div className={styles.empty} role="status"><div className={styles.emptyIcon} role="img" aria-hidden="true">📭</div><p>{model.loading ? "กำลังโหลดคำขอ…" : model.error ? "ยังโหลดคำขอไม่ได้" : "ไม่พบคำขอที่ตรงเงื่อนไข"}</p><div className={styles.emptyActions}><button className={styles.button} type="button" onClick={() => { setFilters(emptyFilters); setQuery(""); setOffset(0); }}>ล้างตัวกรองทั้งหมด</button>{permissions.includes("duct_rental.request.create") && <Link className={styles.primary} href="/duct-rental/new">สร้างคำขอใหม่</Link>}</div></div>}</div>
    <div className={styles.pagination}><span className={styles.muted}>{model.data?.rows.length ? `${offset + 1}–${offset + model.data.rows.length} จาก ${model.data.counts.total} รายการ` : "0 รายการ"}</span><div className={styles.actions}><button className={styles.button} type="button" disabled={offset === 0} onClick={() => setOffset(previous => Math.max(0, previous - 50))}>ก่อนหน้า</button><button className={styles.button} type="button" disabled={model.data?.nextOffset == null} onClick={() => setOffset(model.data!.nextOffset!)}>ถัดไป</button></div></div>
    {detail && <Modal title="รายละเอียดคำขอเช่าท่อ" close={() => setDetail(null)}><RequestWorkspace id={detail} userId={userId} compact /></Modal>}
  </div>;
}
