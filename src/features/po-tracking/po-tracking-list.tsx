import Link from "next/link";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { MetricGrid } from "@/components/ui/metric-grid";
import { Panel } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { TableRegion } from "@/components/ui/table-region";
import { FilterBar, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  formatAmount, formatIsoDate, formatQty, poDeliveryLabels, poOriginLabels, poStatusLabels, poUnitLabels,
  type PoDeliveryState, type PoLineView, type PoListQuery, type PoStatus, type PoSummary, type PoUnit,
} from "@/modules/po-tracking/domain";
import type { PoReport } from "@/modules/po-tracking/service";

const deliveryTone: Record<PoDeliveryState, StatusTone> = { incomplete: "neutral", pending: "info", partial: "warning", received: "success" };
const statusTone: Record<PoStatus, StatusTone> = { open: "info", on_hold: "warning", closed: "neutral" };

function pageHref(query: PoListQuery, page: number) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.unit) params.set("unit", query.unit);
  if (query.status) params.set("status", query.status);
  if (query.delivery) params.set("delivery", query.delivery);
  if (query.order) params.set("order", query.order);
  if (page > 1) params.set("page", String(page));
  return `/po-tracking${params.size ? `?${params.toString()}` : ""}`;
}

export function PoTrackingList({ data, report, today, canManage }: {
  data: { rows: PoLineView[]; total: number; page: number; pageSize: number; priceVisible: boolean; query: PoListQuery; orders: string[] };
  report: PoReport | null;
  today: string;
  canManage?: boolean;
}) {
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  return <div className="po-workspace">
    <nav className="po-tabs" aria-label="มุมมองติดตาม PO">
      <Link href="/po-tracking" aria-current="page">รายการ PO</Link>
      <Link href="/po-tracking?view=report">รายงานและกระทบยอด</Link>
    </nav>

    {report && <section aria-label="สรุปภาพรวม PO" className="po-summary">
      <MetricGrid label="สรุปภาพรวม PO" metrics={[
        { label: "รายการทั้งหมด", value: report.counts.lines, detail: `${report.counts.receivedLines} รับครบ · ${report.counts.partialLines} รับบางส่วน` },
        { label: "คงค้าง", value: report.counts.pendingLines + report.counts.partialLines, detail: `ยังไม่รับ ${report.counts.pendingLines} รายการ` },
        { label: "เลย ETA", value: report.counts.overdueLines, tone: report.counts.overdueLines > 0 ? "danger" : "neutral", detail: "นับเฉพาะรายการที่ยังมียอดคงค้าง" },
        { label: "ข้อมูลจำนวนไม่ครบ", value: report.counts.incompleteLines, tone: report.counts.incompleteLines > 0 ? "warning" : "neutral", detail: "ไม่ตีความเป็นศูนย์" },
      ]} />
    </section>}

    <FilterBar method="get" action="/po-tracking" className="po-filter">
      <FormField label="ค้นหา" controlId="po-q">
        <input className="ui-field-control" id="po-q" name="q" defaultValue={data.query.q} placeholder="PO / วัสดุ / รายละเอียด / ผู้ขาย / HAM026" />
      </FormField>
      <FormField label="หน่วย" controlId="po-unit">
        <select className="ui-field-control" id="po-unit" name="unit" defaultValue={data.query.unit}>
          <option value="">ทุกหน่วย</option>
          {Object.entries(poUnitLabels).map(([value, label]) => <option key={value} value={value}>{value} · {label}</option>)}
        </select>
      </FormField>
      <FormField label="สถานะติดตาม" controlId="po-status">
        <select className="ui-field-control" id="po-status" name="status" defaultValue={data.query.status}>
          <option value="">ทุกสถานะ</option>
          {(Object.keys(poStatusLabels) as PoStatus[]).map((value) => <option key={value} value={value}>{poStatusLabels[value]}</option>)}
        </select>
      </FormField>
      <FormField label="การรับของ" controlId="po-delivery">
        <select className="ui-field-control" id="po-delivery" name="delivery" defaultValue={data.query.delivery}>
          <option value="">ทั้งหมด</option>
          {(Object.keys(poDeliveryLabels) as PoDeliveryState[]).map((value) => <option key={value} value={value}>{poDeliveryLabels[value]}</option>)}
        </select>
      </FormField>
      <FormField label="Order" controlId="po-order">
        <select className="ui-field-control" id="po-order" name="order" defaultValue={data.query.order}>
          <option value="">ทุก Order</option>
          {data.orders.map((order) => <option key={order} value={order}>{order}</option>)}
        </select>
      </FormField>
      <div className="po-filter-actions">
        <Button type="submit" variant="primary">ค้นหา</Button>
        <Link className="po-link" href="/po-tracking">ล้างตัวกรอง</Link>
      </div>
    </FilterBar>

    <section className="po-results" aria-label="รายการ PO">
      <div className="po-results-head">
        <h2>รายการ PO</h2>
        <p>{data.total.toLocaleString("th-TH")} รายการ · หน้า {data.page} / {pages}</p>
        {canManage && <Link className="po-link po-create-link" href="/po-tracking/new">สร้าง PO ใหม่</Link>}
      </div>
      {data.rows.length === 0 ? <EmptyState title="ไม่พบรายการ PO" description="ลองปรับคำค้นหาหรือตัวกรอง แล้วค้นหาอีกครั้ง" /> :
        <TableRegion label="ตารางรายการ PO">
          <table className="ui-table po-table">
            <caption className="po-sr-only">รายการใบสั่งซื้อ พร้อมจำนวนสั่ง รับแล้ว ยอดคงค้าง และสถานะติดตาม</caption>
            <thead><tr>
              <th scope="col">PO</th>
              <th scope="col">วัสดุ</th>
              <th scope="col">หน่วย</th>
              <th scope="col" className="po-num">สั่ง</th>
              <th scope="col" className="po-num">รับแล้ว</th>
              <th scope="col" className="po-num">คงค้าง</th>
              <th scope="col">ETA</th>
              <th scope="col">สถานะ</th>
              <th scope="col">Order</th>
              {data.priceVisible && <th scope="col" className="po-num">มูลค่า PO</th>}
              <th scope="col"><span className="po-sr-only">เปิดรายละเอียด</span></th>
            </tr></thead>
            <tbody>
              {data.rows.map((line) => {
                const overdue = Boolean(line.etaDate && line.etaDate < today && line.totals.outstanding && line.totals.outstanding.gt(0));
                return <tr key={line.id}>
                  <td><Link className="po-link po-mono" href={`/po-tracking/${line.id}`}>{line.poNumber}</Link><small className="po-sub">{line.origin === "manual" ? poOriginLabels.manual : `แถวต้นทาง ${line.sourceId?.split("!").at(-1) ?? "—"}`}</small></td>
                  <td className="po-material"><strong>{line.materialCode}</strong><span>{line.description}</span></td>
                  <td><span className="po-unit">{line.unit}</span></td>
                  <td className="po-num">{formatQty(line.orderedQty)}</td>
                  <td className="po-num">{formatQty(line.totals.received)}{line.receiptCount > 0 && <small className="po-sub">นำเข้า {formatQty(line.initialReceivedQty)} + รับใหม่ {formatQty(line.receiptQty)}</small>}</td>
                  <td className="po-num">{line.totals.outstanding ? <strong className={line.totals.outstanding.gt(0) ? "po-outstanding" : undefined}>{formatQty(line.totals.outstanding)}</strong> : <span className="po-muted">ไม่ทราบ</span>}</td>
                  <td>{line.etaDate ? <>{formatIsoDate(line.etaDate)}{overdue && <StatusBadge label="เลย ETA" tone="danger" />}</> : line.etaText || <span className="po-muted">—</span>}</td>
                  <td><StatusBadge label={poDeliveryLabels[line.totals.delivery]} tone={deliveryTone[line.totals.delivery]} />{line.status !== "open" && <small className="po-sub">{poStatusLabels[line.status]}</small>}</td>
                  <td>{line.orderCode || <span className="po-muted">—</span>}</td>
                  {data.priceVisible && <td className="po-num">{formatAmount(line.poAmount)}</td>}
                  <td><Link className="po-link" href={`/po-tracking/${line.id}`} aria-label={`เปิดรายละเอียด ${line.poNumber} ${line.materialCode}`}>เปิด</Link></td>
                </tr>;
              })}
            </tbody>
          </table>
        </TableRegion>}
      {pages > 1 && <nav className="po-pagination" aria-label="หน้ารายการ PO">
        {data.page > 1 && <Link href={pageHref(data.query, data.page - 1)}>ก่อนหน้า</Link>}
        <span>หน้า {data.page} จาก {pages}</span>
        {data.page < pages && <Link href={pageHref(data.query, data.page + 1)}>ถัดไป</Link>}
      </nav>}
      {!data.priceVisible && <p className="po-hint">ราคาและมูลค่า PO ถูกซ่อนตามสิทธิ์ <code>po_tracking.price.read</code></p>}
    </section>
  </div>;
}

export function PoTrackingReport({ report }: { report: PoReport }) {
  const { counts, units } = report;
  return <div className="po-workspace">
    <nav className="po-tabs" aria-label="มุมมองติดตาม PO">
      <Link href="/po-tracking">รายการ PO</Link>
      <Link href="/po-tracking?view=report" aria-current="page">รายงานและกระทบยอด</Link>
    </nav>
    <MetricGrid label="สรุปสถานะ PO" metrics={[
      { label: "รายการทั้งหมด", value: counts.lines },
      { label: "รับครบแล้ว", value: counts.receivedLines, tone: "success" },
      { label: "รับบางส่วน", value: counts.partialLines, tone: "warning" },
      { label: "ยังไม่รับ", value: counts.pendingLines, tone: "info" },
      { label: "เลย ETA", value: counts.overdueLines, tone: counts.overdueLines ? "danger" : "neutral" },
      { label: "จำนวนไม่ครบ", value: counts.incompleteLines, tone: "neutral" },
    ]} />
    <Panel title="ยอดตามหน่วยนับ" description="แยกยอดตามหน่วย เพราะการรวมข้ามหน่วย (M / PC / SET / EA) ไม่มีความหมาย">
      <TableRegion label="ตารางยอด PO ตามหน่วยนับ">
        <table className="ui-table po-table">
          <thead><tr><th scope="col">หน่วย</th><th scope="col" className="po-num">รายการ</th><th scope="col" className="po-num">จำนวนไม่ครบ</th><th scope="col" className="po-num">สั่ง</th><th scope="col" className="po-num">รับนำเข้า</th><th scope="col" className="po-num">รับใหม่</th><th scope="col" className="po-num">คงค้าง</th>{report.priceVisible && <th scope="col" className="po-num">มูลค่า PO</th>}</tr></thead>
          <tbody>{units.map((unit: PoSummary) => <tr key={unit.unit}>
            <td><strong>{unit.unit}</strong> <small className="po-sub">{poUnitLabels[unit.unit as PoUnit]}</small></td>
            <td className="po-num">{unit.lines}</td>
            <td className="po-num">{unit.incompleteLines}</td>
            <td className="po-num">{formatQty(unit.ordered)}</td>
            <td className="po-num">{formatQty(unit.initialReceived)}</td>
            <td className="po-num">{formatQty(unit.receiptQty)}</td>
            <td className="po-num">{formatQty(unit.outstanding)}</td>
            {report.priceVisible && <td className="po-num">{formatAmount(unit.amount)}</td>}
          </tr>)}</tbody>
        </table>
      </TableRegion>
      <p className="po-hint">ยอดรวมคำนวณจากรายการที่มีจำนวนสั่งและรับนำเข้าครบเท่านั้น รายการที่ข้อมูลไม่ครบถูกนับแยกและไม่ถูกตีความเป็นศูนย์</p>
    </Panel>
    {report.canViewImport && <Panel title="สถานะการนำเข้า" description={report.importRun ? `ชุดข้อมูล ${report.importRun.snapshot.slice(0, 12)}…` : "ยังไม่มีประวัติการนำเข้า"}>
      {report.importRun ? <dl className="po-import">
        <div><dt>สถานะ</dt><dd>{report.importRun.status}</dd></div>
        <div><dt>แถวต้นทาง</dt><dd>{report.importRun.sourceCount.toLocaleString("th-TH")}</dd></div>
        <div><dt>นำเข้าแล้ว</dt><dd>{report.importRun.importedCount.toLocaleString("th-TH")}</dd></div>
        <div><dt>ข้อสังเกต</dt><dd>{report.importRun.anomalyCount.toLocaleString("th-TH")}</dd></div>
        <div><dt>เสร็จเมื่อ</dt><dd>{report.importRun.finishedAt ? new Date(report.importRun.finishedAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }) : "—"}</dd></div>
      </dl> : <EmptyState title="ยังไม่มีข้อมูลนำเข้า" description="นำเข้าไฟล์ PO Pending เพื่อเริ่มติดตาม" />}
      <p className="po-hint">ยอดคงค้างคำนวณสดจาก จำนวนสั่ง − (ยอดรับนำเข้า + รายการรับของที่ยังไม่ถูกยกเลิก)</p>
    </Panel>}
  </div>;
}
