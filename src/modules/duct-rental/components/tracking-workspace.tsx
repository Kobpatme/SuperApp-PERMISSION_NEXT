"use client";
import Link from "next/link";
import { useState } from "react";
import { TrackingShell } from "../ui-process";
import { announce, DuctModuleNav, DuctSyncUtility } from "../ui-shared";
const SyncUtility = DuctSyncUtility;
import { PageHeader } from "@/components/ui/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { TableRegion } from "@/components/ui/table-region";
import { StatusBadge } from "@/components/ui/status-badge";
import { FormField } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricGrid } from "@/components/ui/metric-grid";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { formatDate } from "../domain/source-policy";
import type { readTracking } from "../server/tracking";
import { Notice } from "./common";
const TrackingNav = DuctModuleNav;
import { useResource } from "./use-resource";
import styles from "../ui-shared/ui-shared.module.css";
type Tracking = Awaited<ReturnType<typeof readTracking>>;
export const owners: Record<string,string> = { "Team Design": "ทีมออกแบบ", "3rd Party": "ผู้ให้บริการ", "Team Permission": "ทีมขออนุญาต", Completed: "เสร็จแล้ว" };
const statusLabels: Record<string,string> = { draft:"ตรวจเส้นทาง", sent_to_3rdparty:"แจ้งผู้ให้บริการ", memo_preparing:"จัดทำ Memo", provider_confirmed:"ผู้ให้บริการยืนยัน", contracted:"ลงนามสัญญาแล้ว", cancel_initiated:"เริ่มขอยกเลิก", in_progress:"ดำเนินการยกเลิก", tracking:"ติดตามผู้ให้บริการ", completed:"ยกเลิกเสร็จสมบูรณ์", rejected:"ปฏิเสธคำขอ" };
const slaLabels: Record<string,string> = { "On Track": "อยู่ในกำหนด", "Near Due": "ใกล้ครบกำหนด", Overdue: "เกินกำหนด", Completed: "เสร็จแล้ว" };
export function TrackingWorkspace({ initialSla = "" }: { initialSla?: string } = {}) {
  const [filters,setFilters] = useState({query:"",kind:"",owner:"",sla:initialSla}), [offset,setOffset] = useState(0), model = useResource<Tracking>(`tracking?${new URLSearchParams({...filters,offset:String(offset)})}`);
  const filter = (key:keyof typeof filters,value:string) => { setFilters(previous=>({...previous,[key]:value})); setOffset(0); announce(`กรองติดตามงานด้วย ${key}: ${value || "ทั้งหมด"}`); };
  return (
    <div className={`${styles.workspace} ${styles.ductSurface}`} data-ui-screen="duct-rental-tracking">
      <PageHeader title="ติดตามงานต่อสัญญาและยกเลิก" description="คิวรวม ผู้รับผิดชอบ และกำหนด SLA" parent={{label:"เช่าท่อร้อยสาย",href:"/duct-rental"}} />
      <TrackingNav current="requests" />
      <TrackingShell>
      <SyncUtility {...model} refresh={model.refresh} />
      <Notice text={model.error} error />
      <MetricGrid label="สรุปจำนวนรายการตามตัวกรอง" metrics={[
        { label: "รายการที่ตรงตัวกรอง", value: model.data?.counts.total ?? 0, tone: "neutral" },
        { label: "เสร็จแล้ว", value: model.data?.counts.completed ?? 0, tone: "success" },
        { label: "ใกล้ครบกำหนด", value: model.data?.counts.nearDue ?? 0, tone: "info" },
        { label: "เกินกำหนด", value: model.data?.counts.overdue ?? 0, tone: "warning" },
      ]} />
      <section className={styles.ductFilterToolbar} aria-label="ค้นหาและกรองรายการติดตาม" role="search">
        <form className="ui-filter" onSubmit={event => { event.preventDefault(); setOffset(0); }}>
          <FormField label="ค้นหาอ้างอิง / โครงการ" className={styles.ductFilterSearch}>
            <input className={styles.input} value={filters.query} maxLength={200} onChange={event=>filter("query",event.target.value)}/>
          </FormField>
          <FormField label="ประเภทกระบวนการ" className={styles.ductFilterSelect}>
            <select className={styles.input} value={filters.kind} onChange={event=>filter("kind",event.target.value)}>
              <option value="">ทุกประเภท</option><option value="Renew">ต่อสัญญารายปี</option><option value="Cancel">ยกเลิกการใช้ท่อ</option>
            </select>
          </FormField>
          <FormField label="ผู้รับผิดชอบ" className={styles.ductFilterSelect}>
            <select className={styles.input} value={filters.owner} onChange={event=>filter("owner",event.target.value)}>
              <option value="">ทุกผู้รับผิดชอบ</option>
              {Object.entries(owners).map(([key,label])=><option key={key} value={key}>{label}</option>)}
            </select>
          </FormField>
          <FormField label="สถานะ SLA" className={styles.ductFilterSelect}>
            <select className={styles.input} value={filters.sla} onChange={event=>filter("sla",event.target.value)}>
              <option value="">ทุกสถานะ SLA</option>
              {Object.entries(slaLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}
            </select>
          </FormField>
          <Button variant="primary" type="submit">ค้นหา</Button>
          <Button variant="ghost" type="button" onClick={() => { setFilters({query:"",kind:"",owner:"",sla:""}); setOffset(0); }}>รีเซ็ต</Button>
        </form>
      </section>
      {model.loading ? (
        <PageSkeleton shape="table" />
      ) : (
        <>
          <TableRegion label="ตารางติดตามงานต่อสัญญาและยกเลิก เลื่อนแนวนอนได้" className={styles.tableWrap}>
            <table className={styles.table}>
              <caption className="sr-only">รายการติดตามงานต่อสัญญาและยกเลิกตามตัวกรองปัจจุบัน</caption>
              <thead>
                <tr><th scope="col">อ้างอิง / โครงการ</th><th scope="col">กระบวนการ / ผู้รับผิดชอบ</th><th scope="col">เริ่ม / กำหนดเสร็จ</th><th scope="col">SLA</th><th scope="col">ดำเนินการ</th></tr>
              </thead>
              <tbody>
                {model.data?.rows.map(row=><tr key={row.id}>
                  <td>{row.routeId}<div>{row.reference}</div><div>{row.title}</div></td>
                  <td>{row.kind==="Renew"?"ต่อสัญญารายปี":"ยกเลิกการใช้ท่อ"}<div>{statusLabels[row.status] ?? row.status}</div><div className={styles.muted}>{owners[row.owner]}</div></td>
                  <td>{formatDate(String(row.start))} ถึง {formatDate(String(row.due))}{row.completed&&<div>เสร็จ {formatDate(String(row.completed))}</div>}</td>
                  <td><StatusBadge label={slaLabels[row.sla]} tone={row.sla === "Overdue" ? "warning" : row.sla === "Completed" ? "success" : "neutral"} /></td>
                  <td><ButtonLink variant="ghost" href={`/duct-rental/${row.kind==="Renew" ? "renewal" : "cancellation"}/${row.id}`}>เปิดงาน</ButtonLink></td>
                </tr>)}</tbody>
            </table>
          </TableRegion>
          {!model.data?.rows.length && <EmptyState title="ไม่พบรายการตามเงื่อนไข" description="ปรับตัวกรองค้นหา หรือเลือกรอบรายการอื่น แล้วลองอีกครั้ง" />}
        </>
      )}
      <div className={styles.pagination}>
        <span>แสดงครั้งละ 50 รายการ</span>
        <div className={styles.actions}>
          <Button variant="secondary" type="button" disabled={!offset} onClick={()=>setOffset(previous=>Math.max(0,previous-50))}>ก่อนหน้า</Button>
          <Button variant="secondary" type="button" disabled={model.data?.nextOffset==null} onClick={()=>setOffset(model.data!.nextOffset!)}>ถัดไป</Button>
        </div>
      </div>
      </TrackingShell>
    </div>
  );
}
export function TrackingSummary({ canView = false }: { canView?: boolean }) {
  const model = useResource<Tracking>(canView ? "tracking?limit=1" : null, !canView);
  if (!canView) return null;
  return (
    <div className={styles.actions}>
      <ButtonLink variant="ghost" href="/duct-rental/tracking">ติดตามทั้งหมด {model.data?.counts.total ?? "—"}</ButtonLink>
      <ButtonLink variant="ghost" href="/duct-rental/tracking?sla=Completed">เสร็จแล้ว {model.data?.counts.completed ?? "—"}</ButtonLink>
      <ButtonLink variant="ghost" href="/duct-rental/tracking?sla=Near%20Due">ใกล้ครบกำหนด {model.data?.counts.nearDue ?? "—"}</ButtonLink>
      <ButtonLink variant="ghost" href="/duct-rental/tracking?sla=Overdue">เกินกำหนด {model.data?.counts.overdue ?? "—"}</ButtonLink>
    </div>
  );
}
