"use client";
import { useState } from "react";
import { WorkspaceIcon } from "@/components/workspace-icon";
import { Button, ButtonLink } from "@/components/ui/button";
import { MetricStrip, PhaseTabs, RequestShell, RequestStatusBadge, RequestTabs } from "@/modules/duct-rental/ui-request";
import { announce } from "@/modules/duct-rental/ui-shared";
import { TableRegion } from "@/components/ui/table-region";
import { FormField } from "@/components/ui/form";

import { PageSkeleton } from "@/components/ui/page-skeleton";
import { SERVICE_CENTER_OPTIONS, REQUEST_TYPE_OPTIONS } from "../schemas/design";
import { requestPhases, workflowStatus, formatDate } from "../domain/source-policy";
import type { RequestList } from "./api-client";
import { useResource } from "./use-resource";
import { ModuleNav, RefreshBar, phaseLabels, Modal } from "./common";
import { RequestWorkspace } from "./request-workspace";
import { TrackingSummary } from "./tracking-workspace";
import styles from "../ui-shared/ui-shared.module.css";

const emptyFilters = { query: "", phase: "", serviceCenter: "", requestType: "", workflow: "", documents: "" };
const workflowLabels: Record<string, string> = { PENDING: "รอรับงาน", ACCEPTED: "กำลังดำเนินการ", ACTIVE: "ใช้งานอยู่", CANCELLED: "ยกเลิกแล้ว" };
export function RequestListWorkspace({ permissions, userId }: { permissions: string[]; userId: string }) {
  const [filters, setFilters] = useState(emptyFilters), [query, setQuery] = useState(""), [offset, setOffset] = useState(0), [advancedOpen, setAdvancedOpen] = useState(false);
  const model = useResource<RequestList>(`requests?${new URLSearchParams({ ...filters, offset: String(offset), limit: "50" })}`);
  const [detail, setDetail] = useState<string | null>(null);
  const filter = (name: keyof typeof filters, value: string) => {
    setFilters(previous => ({ ...previous, [name]: value }));
    setOffset(0);
    announce(value ? `กรองตาม${name === "phase" ? "ขั้นตอน" : name === "workflow" ? "สถานะงาน" : name === "documents" ? "เอกสาร" : name}: ${value}` : `ล้างตัวกรอง ${name}`);
  };
  const rows = model.data?.rows ?? [];
  const activeFilters = (Object.keys(filters) as (keyof typeof filters)[]).filter(key => filters[key] !== "");
  const activeCount = activeFilters.length;
  const hasActiveFilters = activeCount > 0 || query.trim() !== "";
  const clearFilters = () => { setFilters(emptyFilters); setQuery(""); setOffset(0); announce("ล้างตัวกรองทั้งหมด"); };
  const panel = <section className={styles.requestPanel} aria-labelledby="request-list-title">
      <header className={styles.requestPanelHeader}>
              <div className={styles.panelTitle}><h2 id="request-list-title">รายการคำขอ</h2><span className={styles.countBadge}>{model.data?.counts.total ?? "—"}</span></div>
              <div className={styles.trackingSummary} aria-label="สรุปการติดตามงาน"><TrackingSummary canView={permissions.includes("duct_rental.module.view")} /></div>
            </header>
            {permissions.includes("duct_rental.request.create") && (
                <div className={styles.requestPanelActions}>
                    <ButtonLink className={styles.requestAddButton} variant="primary" href="/duct-rental/new">＋ เพิ่มรายการ</ButtonLink>
                </div>
            )}
            <MetricStrip className={styles.ductMetricStrip} label="สรุปจำนวนคำขอตามตัวกรอง" metrics={[
                    { id: "filtered", label: "รายการที่ตรงตัวกรอง", value: model.data?.counts.total ?? "—" },
                    { id: "waiting", label: "คิวรอรับงาน", value: model.data?.queues.waiting ?? "—", onClick: () => { setFilters({ ...emptyFilters, workflow: "PENDING" }); setOffset(0); }, active: filters.workflow === "PENDING" },
                    { id: "missing", label: "เอกสารค้าง", value: model.data?.queues.missing ?? "—", onClick: () => { setFilters({ ...emptyFilters, documents: "incomplete" }); setOffset(0); }, active: filters.documents === "incomplete" },
                    { id: "active", label: "ใช้งานอยู่ในตัวกรอง", value: model.data?.counts.active ?? "—" },
                  ]} />
      <details className={styles.workflowDisclosure}>
        <summary><WorkspaceIcon name="chevron" size={16} /><strong>ขั้นตอนงาน · 10 ขั้นตอน</strong>{filters.phase && <span>เลือก: {phaseLabels[filters.phase as keyof typeof phaseLabels]}</span>}</summary>
        <PhaseTabs
          phase={(filters.phase || "DESIGN") as keyof typeof phaseLabels}
          tabs={requestPhases.map(phase => ({ phase, label: phaseLabels[phase], status: String(model.data?.pipeline.find(item => item.phase === phase)?.count ?? 0) }))}
          onChange={phase => filter("phase", phase)}
          label="กรองตามขั้นตอนคำขอ"
        />
      </details>
      <section className={styles.filterSection} aria-label="ค้นหาและกรองคำขอ" role="search">
        <form className={`ui-filter ${styles.searchRow}`} onSubmit={event => { event.preventDefault(); filter("query", query); }}>
          <FormField label="ค้นหาคำขอ / โครงการ / เส้นทาง" className={styles.ductFilterSearch}>
            <input className={styles.input} name="query" value={query} onChange={event => setQuery(event.target.value)} maxLength={200} placeholder="รหัส โครงการ เจ้าของท่อ จังหวัด หรือศูนย์บริการ" />
          </FormField>
          <Button variant="primary" type="submit">ค้นหา</Button>
          <Button variant="ghost" type="button" aria-expanded={advancedOpen} aria-controls="duct-advanced-filters" onClick={() => setAdvancedOpen(open => !open)}>ตัวกรองขั้นสูง · {activeCount}</Button>
          <Button variant="ghost" type="button" disabled={!hasActiveFilters} onClick={clearFilters}>ล้างตัวกรองทั้งหมด</Button>
        </form>
        {advancedOpen && <div id="duct-advanced-filters" className={styles.requestFilters}>
          <FormField label="ขั้นตอน"><select className={styles.input} value={filters.phase} onChange={event => filter("phase", event.target.value)}><option value="">ทุกขั้นตอน</option>{requestPhases.map(phase => <option key={phase} value={phase}>{phaseLabels[phase]}</option>)}</select></FormField>
          <FormField label="ประเภทคำขอ"><select className={styles.input} value={filters.requestType} onChange={event => filter("requestType", event.target.value)}><option value="">ทุกประเภท</option>{REQUEST_TYPE_OPTIONS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></FormField>
          <FormField label="ศูนย์บริการ"><select className={styles.input} value={filters.serviceCenter} onChange={event => filter("serviceCenter", event.target.value)}><option value="">ทุกศูนย์บริการ</option>{SERVICE_CENTER_OPTIONS.map(center => <option key={center}>{center}</option>)}</select></FormField>
          <FormField label="เอกสาร"><select className={styles.input} value={filters.documents} onChange={event => filter("documents", event.target.value)}><option value="">ทุกสถานะเอกสาร</option><option value="complete">เอกสารครบ</option><option value="incomplete">เอกสารค้าง</option></select></FormField>
          <FormField label="สถานะงาน"><select className={styles.input} value={filters.workflow} onChange={event => filter("workflow", event.target.value)}><option value="">ทุกสถานะงาน</option>{Object.entries(workflowLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></FormField>
          {activeFilters.map(key => <button className={styles.filterChip} key={key} type="button" aria-label={`ล้างตัวกรอง ${key}`} onClick={() => { if (key === "query") setQuery(""); filter(key, ""); }}>{key === "query" ? filters.query : key === "phase" ? phaseLabels[filters.phase as keyof typeof phaseLabels] : filters[key]} ×</button>)}
        </div>}
      </section>
      {model.loading ? <PageSkeleton shape="table" /> : <>
        <TableRegion label="ตารางคำขอเช่าท่อร้อยสาย เลื่อนแนวนอนได้" className={styles.ductTableWrap}>
          {rows.length ? <table className={`ui-table ${styles.table}`}>
            <caption className="sr-only">คำขอเช่าท่อร้อยสาย</caption>
            <thead><tr><th scope="col">คำขอ / โครงการ</th><th scope="col">เส้นทาง / เจ้าของท่อ</th><th scope="col">ศูนย์บริการ</th><th scope="col">ขั้นตอน / สถานะ</th><th scope="col">เอกสาร</th><th scope="col">อัปเดต</th><th scope="col">ดำเนินการ</th></tr></thead>
            <tbody>{rows.map(row => <tr key={row.id}>
              <td><button className={styles.recordLink} type="button" onClick={() => setDetail(row.id)} aria-label={`ดูรายละเอียด ${row.code}`}>{row.code}</button><div>{row.projectName || "ร่างคำขอ"}</div></td>
              <td>{row.routeName || "—"}<div className={styles.muted}>{row.ownerDuct || "—"} · {row.province || "—"}</div></td>
              <td>{row.serviceCenter || "—"}</td>
              <td>{phaseLabels[row.phase]}<div><RequestStatusBadge label={workflowLabels[workflowStatus({ currentPhase: row.phase, cancelledAt: row.cancelledAt ?? undefined, phaseStatuses: row.phaseStatuses })] ?? "กำลังดำเนินการ"} tone="neutral" /></div></td>
              <td><RequestStatusBadge label={row.documentsIncomplete ? "เอกสารค้าง" : "เอกสารครบ"} tone={row.documentsIncomplete ? "warning" : "success"} /></td>
              <td>{formatDate(row.updatedAt)}</td><td><ButtonLink variant="ghost" href={`/duct-rental/${row.id}`}>เปิดงาน</ButtonLink></td>
            </tr>)}</tbody>
          </table> : <div className={styles.embeddedEmpty} role={model.error ? "alert" : "status"}>
            <WorkspaceIcon name="search" size={28} />
            <h3>{model.error ? "ยังโหลดคำขอไม่ได้" : activeCount ? "ไม่พบคำขอที่ตรงกับเงื่อนไข" : "ยังไม่มีคำขอเช่าท่อ"}</h3>
            <p>{model.error ? "ตรวจสอบการเชื่อมต่อแล้วลองอัปเดตข้อมูลอีกครั้ง" : activeCount ? "ปรับตัวกรองหรือค้นหาอีกครั้ง" : "เริ่มต้นด้วยการสร้างคำขอเช่าท่อ"}</p>
            <div className={styles.emptyActions}>{model.error ? <Button variant="secondary" onClick={() => model.refresh()}>อัปเดตข้อมูลอีกครั้ง</Button> : activeCount ? <Button variant="ghost" onClick={clearFilters}>ล้างตัวกรอง</Button> : null}{permissions.includes("duct_rental.request.create") && <ButtonLink variant="secondary" href="/duct-rental/new">สร้างคำขอ</ButtonLink>}</div>
          </div>}
        </TableRegion>
        <footer className={styles.requestPagination}><span className={styles.muted}>{model.data?.counts.total ? `แสดง ${offset + 1}–${offset + rows.length} จาก ${model.data.counts.total} รายการ` : `${rows.length} รายการในหน้านี้ · เริ่มที่ ${offset + 1}${model.data?.nextOffset == null ? " · ไม่มีหน้าถัดไป" : " · มีหน้าถัดไป"}`}</span><div className={styles.actions}><Button variant="ghost" type="button" disabled={offset === 0} onClick={() => setOffset(previous => Math.max(0, previous - 50))}>ก่อนหน้า</Button><span>เริ่มที่ {offset + 1}</span><Button variant="ghost" type="button" disabled={model.data?.nextOffset == null} onClick={() => setOffset(model.data!.nextOffset!)}>ถัดไป</Button></div></footer>
      </>}
    </section>;
  return (
    <div data-ui-screen="duct-rental-request-list">
      <RequestShell
        className={styles.ductList}
        title="เช่าท่อร้อยสาย"
        description="สร้างคำขอ ติดตามการอนุญาตและติดตั้ง และดูเส้นทางเช่าท่อที่ใช้งานอยู่"
        actions={(
          <>
            {permissions.includes("duct_rental.settings.manage") && (
              <ButtonLink variant="secondary" href="/duct-rental/settings">ตั้งค่าผู้ประสานงาน</ButtonLink>
            )}
            {permissions.includes("duct_rental.request.create") && (
              <ButtonLink variant="primary" href="/duct-rental/new">สร้างคำขอ</ButtonLink>
            )}
            {permissions.includes("duct_rental.module.view") && (
              <ButtonLink variant="secondary" href="/duct-rental/renewal">ต่อสัญญารายปี</ButtonLink>
            )}
            {permissions.includes("duct_rental.module.view") && (
                          <ButtonLink variant="secondary" href="/duct-rental/cancellation">ขอยกเลิกการใช้ท่อ</ButtonLink>
                        )}
            {permissions.includes("duct_rental.module.view") && (
              <ButtonLink variant="ghost" href="/duct-rental/tracking">ติดตามงานต่อสัญญาและยกเลิก</ButtonLink>
            )}
          </>
        )}
      >
        <RefreshBar {...model} busy={model.loading} refresh={() => model.refresh()} />
        <RequestTabs
          value="requests"
          label="มุมมองรายการคำขอ"
          tabs={[{ id: "requests", label: "รายการคำขอ", content: panel }]}
        />
        {detail && <Modal title="รายละเอียดคำขอเช่าท่อ" close={() => setDetail(null)}><RequestWorkspace id={detail} userId={userId} compact /></Modal>}
      </RequestShell>
    </div>
  );
}
