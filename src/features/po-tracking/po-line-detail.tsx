import { Panel } from "@/components/ui/panel";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { TableRegion } from "@/components/ui/table-region";
import { EmptyState } from "@/components/ui/empty-state";
import {
  formatAmount, formatIsoDate, formatQty, poDeliveryLabels, poOriginLabels, poStatusLabels, poUnitLabels,
  type PoDeliveryState, type PoLineView, type PoReceiptView,
} from "@/modules/po-tracking/domain";
import { LineControlForm, ManualLineForm, ReceiptCorrectionForm, ReceiptForm } from "./po-forms";

const deliveryTone: Record<PoDeliveryState, StatusTone> = { incomplete: "neutral", pending: "info", partial: "warning", received: "success" };

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt>{label}</dt><dd>{children || "—"}</dd></div>;
}

export function PoLineDetail({ line, receipts, importRun, priceVisible, canRecord, canCorrect, canManage }: {
  line: PoLineView & { importSnapshot: string | null };
  receipts: PoReceiptView[];
  importRun: { snapshot: string; finishedAt: string | null; sourceCount: number; importedCount: number } | null;
  priceVisible: boolean;
  canRecord: boolean;
  canCorrect: boolean;
  canManage: boolean;
}) {
  const activeReceipts = receipts.filter((receipt) => !receipt.voidedAt);
  const manual = line.origin === "manual";
  return <div className="po-workspace po-detail">
    <Panel title="สรุปรายการ" className="po-detail-summary">
      <div className="po-detail-head">
        <div>
          <p className="po-eyebrow">PO {line.poNumber}</p>
          <h2>{line.materialCode}</h2>
          <p className="po-description">{line.description}</p>
        </div>
        <div className="po-badges">
          <StatusBadge label={poOriginLabels[line.origin]} tone={manual ? "info" : "neutral"} />
          <StatusBadge label={poDeliveryLabels[line.totals.delivery]} tone={deliveryTone[line.totals.delivery]} />
          <StatusBadge label={poStatusLabels[line.status]} tone={line.status === "closed" ? "neutral" : line.status === "on_hold" ? "warning" : "info"} />
          {line.totals.overReceived && <StatusBadge label="ยอดรับเกินกว่าสั่ง" tone="danger" />}
        </div>
      </div>
      <dl className="po-facts">
        <Info label="จำนวนสั่ง">{line.orderedQty === null ? <span className="po-warning">ข้อมูลไม่ครบ</span> : `${formatQty(line.orderedQty)} ${line.unit}`}</Info>
        <Info label={manual ? "รับก่อนเริ่มติดตาม" : "รับนำเข้าจากไฟล์"}>{line.initialReceivedQty === null ? <span className="po-warning">ข้อมูลไม่ครบ</span> : `${formatQty(line.initialReceivedQty)} ${line.unit}`}</Info>
        <Info label="รับของใหม่ (รายการ)">{formatQty(line.receiptQty)} {line.unit} · {line.receiptCount} รายการ</Info>
        <Info label="รับรวม">{line.totals.received === null ? <span className="po-warning">คำนวณไม่ได้</span> : `${formatQty(line.totals.received)} ${line.unit}`}</Info>
        <Info label="คงค้าง">{line.totals.outstanding === null ? <span className="po-warning">คำนวณไม่ได้</span> : <strong className={line.totals.outstanding.gt(0) ? "po-outstanding" : undefined}>{formatQty(line.totals.outstanding)} {line.unit}</strong>}</Info>
        <Info label="หน่วยนับ">{line.unit} · {poUnitLabels[line.unit]}</Info>
        <Info label="ETA">{line.etaDate ? formatIsoDate(line.etaDate) : line.etaText || null}</Info>
        <Info label="Project code">{line.orderCode}</Info>
        <Info label="ผู้ขาย">{line.vendorName}{line.vendorCode ? ` (${line.vendorCode})` : ""}</Info>
        <Info label="PO Release">{formatIsoDate(line.poReleaseDate)}</Info>
        <Info label="GR ล่าสุด">{formatIsoDate(line.lastGrDate)}</Info>
        {priceVisible && <Info label="ราคาต่อหน่วย">{line.unitPrice === null ? "ยังไม่ทราบราคา" : formatAmount(line.unitPrice)}</Info>}
        {priceVisible && <Info label="มูลค่า PO">{formatAmount(line.poAmount)}</Info>}
        <Info label="หมายเหตุ">{line.note}</Info>
      </dl>
      {!priceVisible && <p className="po-hint">ราคาและมูลค่าถูกซ่อนตามสิทธิ์ <code>po_tracking.price.read</code></p>}
    </Panel>

    <div className="po-detail-grid">
      <Panel title="บันทึกการรับของ" description="บันทึกได้หลายครั้ง แยกวันที่ จำนวน และเลขอ้างอิงของแต่ละครั้ง">
        <ReceiptForm line={line} disabled={!canRecord} />
      </Panel>
      <Panel title="ติดตามสถานะ" description={manual ? "แก้ไขข้อมูลหลักของ PO ที่สร้างในระบบ พร้อมเก็บประวัติการเปลี่ยนแปลง" : "แก้ไขสถานะ ETA และหมายเหตุ โดยเก็บประวัติการเปลี่ยนแปลง"}>
        {canManage
          ? (manual && priceVisible ? <ManualLineForm line={line} /> : <LineControlForm line={line} />)
          : <p className="po-note">ไม่มีสิทธิ์แก้ไขข้อมูล PO</p>}
      </Panel>
    </div>

    <Panel title="ประวัติการรับของ" description={`${activeReceipts.length} รายการที่ยังมีผล · ${receipts.length - activeReceipts.length} รายการถูกยกเลิก`}>
      {receipts.length === 0 ? <EmptyState title="ยังไม่มีการรับของ" description="บันทึกครั้งแรกจากแบบฟอร์มด้านบนเมื่อของมาถึง" /> :
        <TableRegion label="ตารางประวัติการรับของ">
          <table className="ui-table po-table">
            <thead><tr><th scope="col">วันที่</th><th scope="col" className="po-num">จำนวน</th><th scope="col">เลขอ้างอิง</th><th scope="col">ผู้บันทึก</th><th scope="col">สถานะ</th><th scope="col">หมายเหตุ</th><th scope="col"><span className="po-sr-only">จัดการ</span></th></tr></thead>
            <tbody>{receipts.map((receipt) => <tr key={receipt.id} className={receipt.voidedAt ? "po-voided" : undefined}>
              <td>{formatIsoDate(receipt.receivedOn)}</td>
              <td className="po-num">{formatQty(receipt.quantity)} {line.unit}</td>
              <td>{receipt.reference}{receipt.replacesReceiptId && <small className="po-sub">แทนรายการก่อนหน้า</small>}</td>
              <td>{receipt.recordedByName}</td>
              <td>{receipt.voidedAt ? <><StatusBadge label="ยกเลิกแล้ว" tone="neutral" /><small className="po-sub">{receipt.voidReason} · {receipt.voidedByName}</small></> : <StatusBadge label="มีผล" tone="success" />}</td>
              <td>{receipt.note || <span className="po-muted">—</span>}</td>
              <td>{!receipt.voidedAt && canCorrect && <ReceiptCorrectionForm receiptId={receipt.id} lineId={line.id}
                receivedOn={receipt.receivedOn} quantity={receipt.quantity} reference={receipt.reference} note={receipt.note} />}</td>
            </tr>)}</tbody>
          </table>
        </TableRegion>}
      <p className="po-hint">ระบบไม่ลบรายการรับของ: การแก้ไขจะยกเลิกรายการเดิมและบันทึกใหม่พร้อมเหตุผลและผู้ดำเนินการ</p>
    </Panel>

    <Panel title="ที่มาของข้อมูล">
      {manual ? <dl className="po-facts po-lineage">
        <Info label="แหล่งที่มา">{poOriginLabels.manual}</Info>
        <Info label="เลขที่ PO">{line.poNumber}</Info>
        <Info label="สร้างเมื่อ">{formatIsoDate(line.poReleaseDate)}</Info>
        <Info label="ข้อมูลต้นทางไฟล์">ไม่มี — รายการนี้ไม่ได้มาจากการนำเข้า และไม่กระทบ lineage ของไฟล์นำเข้า</Info>
      </dl> : <dl className="po-facts po-lineage">
        <Info label="แถวต้นทาง">{line.sourceId}</Info>
        <Info label="ชุดข้อมูลนำเข้า">{importRun ? `${importRun.snapshot.slice(0, 16)}…` : null}</Info>
        <Info label="นำเข้าเมื่อ">{importRun?.finishedAt ? new Date(importRun.finishedAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }) : null}</Info>
        <Info label="แถว/นำเข้า">{importRun ? `${importRun.sourceCount.toLocaleString("th-TH")} / ${importRun.importedCount.toLocaleString("th-TH")}` : null}</Info>
      </dl>}
    </Panel>
  </div>;
}
