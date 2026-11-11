"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildGuaranteeManagementReport, buildGuaranteeReportCsv } from "@/lib/guarantee-view-model";
import type { DepositItem } from "@/lib/deposit-v2-domain";
import "./guarantee-executive-dashboard.css";

const amount = (value: number) => value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (value: number) => `฿${amount(value)}`;

export function GuaranteeExecutiveDashboard({ items, generatedAt, truncated, ready, preview }: {
  items: DepositItem[]; generatedAt: string; truncated: boolean; ready: boolean; preview: boolean;
}) {
  const [area, setArea] = useState("");
  const [owner, setOwner] = useState("");
  const [monthIndex, setMonthIndex] = useState(11);
  const areas = useMemo(() => [...new Set(items.map((item) => item.area?.trim()).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "th")), [items]);
  const owners = useMemo(() => [...new Set(items.map((item) => item.owner?.trim()).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "th")), [items]);
  const scoped = useMemo(() => items.filter((item) => (!area || item.area?.trim() === area) && (!owner || item.owner?.trim() === owner)), [items, area, owner]);
  const report = useMemo(() => buildGuaranteeManagementReport(scoped, generatedAt), [scoped, generatedAt]);
  const monthlyMax = Math.max(...report.months.flatMap((month) => [month.deposit, month.fee]), 0);
  const selectedMonth = report.months[monthIndex];
  const due = report.operational.accuracy;
  const dueDatesMissing = due.openCount > 0 && due.dueDateCount === 0 && report.operational.overdueCount === 0;
  const timestamp = new Date(generatedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" });
  const latestRecordUpdate = useMemo(() => items.map((item) => item.updatedAt ? new Date(item.updatedAt) : null).filter((date): date is Date => date instanceof Date && !Number.isNaN(date.getTime())).sort((a, b) => b.getTime() - a.getTime())[0], [items]);
  const recordTimestamp = latestRecordUpdate ? latestRecordUpdate.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }) : "ไม่พบเวลาอัปเดตของรายการ";
  const scopeLabel = "สูงสุด 500 รายการล่าสุดที่ผ่านสิทธิ์";
  const downloadCsv = () => {
    const blob = new Blob([buildGuaranteeReportCsv(scoped, generatedAt, { area, owner, preview })], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url; link.download = "guarantee-report.csv"; link.click(); URL.revokeObjectURL(url);
  };

  return <section className="guarantee-report" aria-label="รายงานเงินประกันสำหรับผู้บริหาร">
    <header className="gr-heading"><div className="gr-report-summary"><p className="gr-eyebrow">รายงานเพื่อการบริหาร</p><p>สถานะเงินทุนคงค้าง การคืนเงิน และประเด็นที่ต้องติดตาม</p></div><div className="gr-report-meta"><span>รายงานสร้างเมื่อ {timestamp}</span><span>ข้อมูลรายการอัปเดตล่าสุด {recordTimestamp}</span><button className="gr-action gr-action-secondary" type="button" onClick={() => window.print()} disabled={!ready}>พิมพ์ / บันทึก PDF</button><button className="gr-action gr-action-primary" type="button" onClick={downloadCsv} disabled={!ready}>ส่งออก CSV รายงานปัจจุบัน</button></div></header>
    <div className="gr-filterbar"><label>พื้นที่<select className="ui-building-field" value={area} onChange={(event) => setArea(event.target.value)}><option value="">ทุกพื้นที่</option>{areas.map((value) => <option key={value}>{value}</option>)}</select></label><label>เจ้าของงาน<select className="ui-building-field" value={owner} onChange={(event) => setOwner(event.target.value)}><option value="">เจ้าของงานทั้งหมด</option>{owners.map((value) => <option key={value}>{value}</option>)}</select></label>{(area || owner) && <button className="gr-filter-clear" type="button" onClick={() => { setArea(""); setOwner(""); }}>ล้างตัวกรอง</button>}<p aria-live="polite"><strong>{scoped.length.toLocaleString("th-TH")}</strong> รายการในขอบเขตรายงาน <span>· {area || "ทุกพื้นที่"} · {owner || "เจ้าของงานทั้งหมด"}</span></p></div>
    <div className="gr-scope-banner" role="status"><strong>ขอบเขตที่ได้รับอนุญาต: {scopeLabel}</strong><span>แสดงจริง {scoped.length.toLocaleString("th-TH")} รายการ · สร้างรายงาน {timestamp} · {preview ? "ข้อมูลตัวอย่าง" : "ข้อมูลระบบจริง"}</span></div>
    {(!ready || preview || truncated) && <p className="gr-scope-note" role="status">{!ready ? "ข้อมูลยังไม่พร้อมสำหรับสรุปรายงาน กรุณาโหลดข้อมูลใหม่" : preview ? "รายงานนี้ใช้ข้อมูลตัวอย่าง ไม่ใช่ยอดเงินจริง" : "รายงานครอบคลุมเฉพาะ 500 รายการล่าสุดตามสิทธิ์ ไม่ใช่ยอดรวมทั้งองค์กร"}</p>}
    {ready && !scoped.length ? <div className="gr-empty"><h3>ไม่มีข้อมูลในขอบเขตที่เลือก</h3><p>ลองเปลี่ยนพื้นที่หรือเจ้าของงานเพื่อดูรายงาน</p></div> : ready && <>
      <div className="gr-kpis">
        <article className="gr-kpi-primary"><span>เงินประกันคงค้าง</span><strong>{money(report.finance.totalOutstandingAmount)}</strong><small>{report.outstandingCount.toLocaleString("th-TH")} รายการ · ติดตั้งและรื้อถอน · <Link href="#gr-contributors">ดูรายการที่รวมยอด</Link></small></article>
        <article><span>ได้รับคืนแล้ว</span><strong>{money(report.refunded)}</strong><small>ตามสถานะคืนเงินในระบบ · {scoped.length.toLocaleString("th-TH")} รายการในขอบเขต</small></article>
        <article><span>สัดส่วนเงินที่คืนแล้ว</span><strong>{report.refundPct === null ? "—" : `${report.refundPct.toFixed(1)}%`}</strong><small>เทียบเงินประกันทั้งหมด {money(report.total)} · สร้างรายงาน {timestamp}</small></article>
        <article className="gr-kpi-risk"><span>ยอดคงค้างในงานเกินกำหนด</span><strong>{dueDatesMissing ? "ยังประเมินไม่ได้" : money(report.operational.overdueRiskAmount)}</strong><small>{dueDatesMissing ? `${due.openCount} งานเปิดยังไม่มีวันครบกำหนด` : `${report.operational.overdueCount} รายการที่ระบุวันครบกำหนด`} · {preview ? "ตัวอย่าง" : "ข้อมูลระบบจริง"}</small></article>
      </div>
      <div className="gr-brief"><div><h3>ประเด็นสำหรับผู้บริหาร</h3><p>{dueDatesMissing ? `ควรให้ผู้รับผิดชอบระบุวันครบกำหนดของ ${due.openCount} งานเปิด เพื่อประเมินความเสี่ยงและติดตามการคืนเงิน` : report.operational.overdueCount ? `มี ${report.operational.overdueCount} รายการเกินกำหนด ควรติดตามผู้รับผิดชอบและแผนคืนเงิน` : "ไม่พบรายการเกินกำหนดจากข้อมูลวันครบกำหนดที่บันทึกไว้"}</p></div><div><span>เงิน On Service ตามปกติ</span><strong>{money(report.removal.onServiceAmount)}</strong><small>{report.removal.onServiceCount} รายการ · ไม่ใช่คิวติดตาม Off Service</small></div><div><span>เงินรอติดตาม Off Service</span><strong>{money(report.removal.offServicePendingAmount)}</strong><small>{report.removal.offServicePendingCount} รายการ · ต้องดำเนินการตามงาน</small></div></div>
      <div className="gr-columns">
        <section className="gr-panel gr-lifecycle" tabIndex={0} aria-label="สถานะเงินประกันแต่ละประเภท เลื่อนแนวนอนได้"><header><h3>สถานะเงินประกันแต่ละประเภท</h3><p>ยอดรวม = ได้รับคืนแล้ว + คงค้าง</p></header><table><thead><tr><th>ประเภท</th><th>ยอดทั้งหมด</th><th>ได้รับคืนแล้ว</th><th>คงค้าง</th></tr></thead><tbody>{[["ประกันติดตั้ง", report.installation], ["ประกันรื้อถอน", report.removal]].map(([label, metrics]) => { const row = metrics as typeof report.installation; return <tr key={String(label)}><th>{String(label)}</th><td>{money(row.totalAmount)}</td><td>{money(row.refundedAmount)}</td><td><strong>{money(row.outstandingAmount)}</strong><small>{row.outstandingCount} รายการ</small></td></tr>; })}</tbody></table></section>
        <section className="gr-panel gr-quality"><header><h3>ความครบถ้วนของข้อมูล</h3><p>ใช้ประกอบการตีความความเสี่ยง</p></header><strong>{due.openCount ? `${due.dueDateCoveragePct.toFixed(0)}%` : "—"}</strong><p>งานเปิดที่ระบุวันครบกำหนด {due.dueDateCount} / {due.openCount} รายการ</p><div className="gr-track" aria-hidden="true"><span style={{ width: `${due.openCount ? due.dueDateCoveragePct : 0}%` }} /></div><p className="gr-muted">รายการที่ไม่มีวันครบกำหนดไม่ถูกนับเป็นงานเกินกำหนด</p></section>
      </div>
      <div className="gr-columns gr-chart-columns">
        <section className="gr-panel"><header><h3>ยอดตั้งเบิกย้อนหลัง 12 เดือน</h3><p>ตามวันที่ตั้งเบิก · ไม่ใช่เงินรับจ่ายจริง</p></header><div className="gr-chart-legend"><span><i/>เงินประกัน</span><span><i className="gr-fee-dot"/>ค่าธรรมเนียมและอื่น ๆ</span><small>สูงสุด {money(monthlyMax)}</small></div><div className="gr-month-chart">{report.months.map((month, index) => <button className="gr-month-button" type="button" key={`${month.year}-${month.month}`} aria-pressed={monthIndex === index} aria-label={`${month.label} เงินประกัน ${money(month.deposit)} ค่าธรรมเนียม ${money(month.fee)}`} onClick={() => setMonthIndex(index)}><div><i style={{ height: `${month.deposit / (monthlyMax || 1) * 100}%` }}/><i className="gr-fee-bar" style={{ height: `${month.fee / (monthlyMax || 1) * 100}%` }}/></div><span>{month.label}</span></button>)}</div><div className="gr-month-detail" aria-live="polite"><strong>{selectedMonth.label}</strong><span>เงินประกัน {money(selectedMonth.deposit)}</span><span>ค่าธรรมเนียมและอื่น ๆ {money(selectedMonth.fee)}</span></div><details className="gr-month-data" tabIndex={0}><summary>ดูตัวเลขรายเดือนทั้งหมด</summary><table><thead><tr><th>เดือน</th><th>เงินประกัน</th><th>ค่าธรรมเนียม / อื่น ๆ</th></tr></thead><tbody>{report.months.map((month) => <tr key={month.label}><th>{month.label}</th><td>{money(month.deposit)}</td><td>{money(month.fee)}</td></tr>)}</tbody></table></details></section>
        <section className="gr-panel"><header><h3>คงค้างตามขั้นตอนงาน</h3><p>รวมเงินประกันติดตั้งและรื้อถอน · ลิงก์เปิดรายการที่รวมยอด</p></header><RankedBars rows={report.statuses} preview={preview}/></section>
      </div>
      <section className="gr-panel"><header><h3>เงินประกันคงค้างตามพื้นที่</h3><p>เรียงตามยอดเงินที่ต้องติดตาม · ลิงก์เปิดรายการที่รวมยอด</p></header><RankedBars rows={report.areas} preview={preview}/></section>
      <section className="gr-panel gr-actions"><header><h3>คิวที่ต้องดำเนินการ</h3><p>คอขวด หลักฐานที่ขาด และรายการไม่มีวันครบกำหนด · ไม่รวม On Service ตามปกติ</p></header>{report.actionItems.length ? <ul>{report.actionItems.slice(0, 8).map((entry) => <li key={entry.item.id || entry.item.id_firestore || entry.workflowKey}><div><strong>{entry.item.place || "ไม่ระบุอาคาร"}</strong><span>{entry.reasons.slice(0, 2).join(" · ") || "ควรติดตาม"}</span>{entry.missingDocuments.length > 0 && <small>หลักฐานที่ขาด: {entry.missingDocuments.join(", ")}</small>}</div>{entry.item.id && !preview && <Link href={`/guarantees/${entry.item.id}`}>เปิดรายละเอียด →</Link>}</li>)}</ul> : <p className="gr-empty">ไม่พบคิวที่ต้องดำเนินการในขอบเขตนี้</p>}</section>
      <section className="gr-panel gr-top" id="gr-contributors"><header><h3>5 รายการที่มียอดคงค้างสูงสุด</h3><p>รวม On Service · เปิดรายการเพื่อตรวจรายละเอียด</p></header>{!report.topOutstanding.length ? <p className="gr-empty">ไม่มียอดเงินประกันคงค้าง</p> : <div className="gr-table-scroll" role="region" aria-label="รายการยอดคงค้างสูงสุด เลื่อนแนวนอนได้" tabIndex={0}><table><thead><tr><th>อาคาร / รายการ</th><th>พื้นที่</th><th>ผู้รับผิดชอบ</th><th>ยอดคงค้าง</th><th><span className="sr-only">รายละเอียด</span></th></tr></thead><tbody>{report.topOutstanding.map(({ item, amount: value }, index) => <tr key={item.id || item.id_firestore || index}><td><strong>{item.place || "ไม่ระบุอาคาร"}</strong><small>{item.cid || item.no || "ไม่ระบุเลขอ้างอิง"}</small></td><td>{item.area || "ไม่ระบุพื้นที่"}</td><td>{item.owner || "ไม่ระบุผู้รับผิดชอบ"}</td><td><strong>{money(value)}</strong></td><td>{item.id && !preview && <Link href={`/guarantees/${item.id}`} aria-label={`เปิดรายละเอียด ${item.place || "รายการเงินประกัน"}`}>รายละเอียด →</Link>}</td></tr>)}</tbody></table></div>}</section>
      <footer className="gr-footnote"><strong>ขอบเขตและวิธีอ่านรายงาน</strong><p>รายงานสร้างเมื่อ {timestamp} · ตัดรายการยกเลิก {report.excludedCount} รายการออกจากยอดเงิน · ค่าธรรมเนียมและค่าใช้จ่ายอื่น {money(report.costs.totalAmount)} แยกจากเงินประกันที่ขอคืนได้</p><p>การคืนประกันติดตั้งอิงสถานะเสร็จแล้ว การคืนประกันรื้อถอนอิงเครื่องหมายคืนเงินของรายการ ตามกฎเดิมของโมดูล ตัวเลขนี้เป็นสถานะเงินประกันในระบบ ไม่ใช่งบกระแสเงินสดหรือยอดจากบัญชีธนาคาร</p></footer>
    </>}
  </section>;
}

function RankedBars({ rows, preview }: { rows: Array<{ key: string; label: string; count: number; amount: number; contributorIds?: string[] }>; preview: boolean }) {
  const max = Math.max(...rows.map((row) => row.amount), 1);
  return rows.length ? <ul className="gr-ranked-bars">{rows.map((row) => <li key={row.key}><div><strong>{row.label}</strong><span>{row.count} รายการ · {row.contributorIds?.length ? row.contributorIds.map((id) => !preview && <Link key={id} href={`/guarantees/${id}`}>#{id.slice(0, 8)}</Link>) : "ไม่มีรหัสรายการ"}</span></div><div className="gr-track" aria-hidden="true"><span style={{ width: `${row.amount / max * 100}%` }}/></div><b>{money(row.amount)}</b></li>)}</ul> : <p className="gr-empty">ไม่มียอดคงค้างในขอบเขตนี้</p>;
}
