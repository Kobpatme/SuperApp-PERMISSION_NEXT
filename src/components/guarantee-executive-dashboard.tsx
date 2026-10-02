"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildGuaranteeManagementReport } from "@/lib/guarantee-view-model";
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

  return <section className="guarantee-report" aria-label="รายงานเงินประกันสำหรับผู้บริหาร">
    <header className="gr-heading"><div><p className="gr-eyebrow">รายงานเพื่อการบริหาร</p><h2>ภาพรวมเงินประกันอาคาร</h2><p>สถานะเงินทุนคงค้าง การคืนเงิน และประเด็นที่ต้องติดตาม</p></div><div className="gr-report-meta"><span>ข้อมูล ณ {timestamp}</span><button type="button" onClick={() => window.print()} disabled={!ready}>พิมพ์ / บันทึก PDF</button></div></header>
    <div className="gr-filterbar"><label>พื้นที่<select value={area} onChange={(event) => setArea(event.target.value)}><option value="">ทุกพื้นที่</option>{areas.map((value) => <option key={value}>{value}</option>)}</select></label><label>เจ้าของงาน<select value={owner} onChange={(event) => setOwner(event.target.value)}><option value="">เจ้าของงานทั้งหมด</option>{owners.map((value) => <option key={value}>{value}</option>)}</select></label>{(area || owner) && <button type="button" onClick={() => { setArea(""); setOwner(""); }}>ล้างตัวกรอง</button>}<p aria-live="polite"><strong>{scoped.length.toLocaleString("th-TH")}</strong> รายการในขอบเขตรายงาน <span>· {area || "ทุกพื้นที่"} · {owner || "เจ้าของงานทั้งหมด"}</span></p></div>
    {(!ready || preview || truncated) && <p className="gr-scope-note" role="status">{!ready ? "ข้อมูลยังไม่พร้อมสำหรับสรุปรายงาน กรุณาโหลดข้อมูลใหม่" : preview ? "รายงานนี้ใช้ข้อมูลตัวอย่าง ไม่ใช่ยอดเงินจริง" : "รายงานครอบคลุมเฉพาะ 500 รายการล่าสุดตามสิทธิ์ ไม่ใช่ยอดรวมทั้งองค์กร"}</p>}
    {ready && !scoped.length ? <div className="gr-empty"><h3>ไม่มีข้อมูลในขอบเขตที่เลือก</h3><p>ลองเปลี่ยนพื้นที่หรือเจ้าของงานเพื่อดูรายงาน</p></div> : ready && <>
      <div className="gr-kpis">
        <article className="gr-kpi-primary"><span>เงินประกันคงค้าง</span><strong>{money(report.finance.totalOutstandingAmount)}</strong><small>{report.outstandingCount.toLocaleString("th-TH")} รายการ · ติดตั้งและรื้อถอน</small></article>
        <article><span>ได้รับคืนแล้ว</span><strong>{money(report.refunded)}</strong><small>ตามสถานะคืนเงินในระบบ</small></article>
        <article><span>สัดส่วนเงินที่คืนแล้ว</span><strong>{report.refundPct === null ? "—" : `${report.refundPct.toFixed(1)}%`}</strong><small>เทียบเงินประกันทั้งหมด {money(report.total)}</small></article>
        <article className="gr-kpi-risk"><span>ยอดคงค้างในงานเกินกำหนด</span><strong>{dueDatesMissing ? "ยังประเมินไม่ได้" : money(report.operational.overdueRiskAmount)}</strong><small>{dueDatesMissing ? `${due.openCount} งานเปิดยังไม่มีวันครบกำหนด` : `${report.operational.overdueCount} รายการที่ระบุวันครบกำหนด`}</small></article>
      </div>
      <div className="gr-brief"><div><h3>ประเด็นสำหรับผู้บริหาร</h3><p>{dueDatesMissing ? `ควรให้ผู้รับผิดชอบระบุวันครบกำหนดของ ${due.openCount} งานเปิด เพื่อประเมินความเสี่ยงและติดตามการคืนเงิน` : report.operational.overdueCount ? `มี ${report.operational.overdueCount} รายการเกินกำหนด ควรติดตามผู้รับผิดชอบและแผนคืนเงิน` : "ไม่พบรายการเกินกำหนดจากข้อมูลวันครบกำหนดที่บันทึกไว้"}</p></div><div><span>ประกันรื้อถอนระหว่างให้บริการ</span><strong>{money(report.removal.onServiceAmount)}</strong><small>{report.removal.onServiceCount} รายการ On Service</small></div><div><span>รอดำเนินการ Off Service</span><strong>{money(report.removal.offServicePendingAmount)}</strong><small>{report.removal.offServicePendingCount} รายการ</small></div></div>
      <div className="gr-columns">
        <section className="gr-panel gr-lifecycle"><header><h3>สถานะเงินประกันแต่ละประเภท</h3><p>ยอดรวม = ได้รับคืนแล้ว + คงค้าง</p></header><table><thead><tr><th>ประเภท</th><th>ยอดทั้งหมด</th><th>ได้รับคืนแล้ว</th><th>คงค้าง</th></tr></thead><tbody>{[["ประกันติดตั้ง", report.installation], ["ประกันรื้อถอน", report.removal]].map(([label, metrics]) => { const row = metrics as typeof report.installation; return <tr key={String(label)}><th>{String(label)}</th><td>{money(row.totalAmount)}</td><td>{money(row.refundedAmount)}</td><td><strong>{money(row.outstandingAmount)}</strong><small>{row.outstandingCount} รายการ</small></td></tr>; })}</tbody></table></section>
        <section className="gr-panel gr-quality"><header><h3>ความครบถ้วนของข้อมูล</h3><p>ใช้ประกอบการตีความความเสี่ยง</p></header><strong>{due.openCount ? `${due.dueDateCoveragePct.toFixed(0)}%` : "—"}</strong><p>งานเปิดที่ระบุวันครบกำหนด {due.dueDateCount} / {due.openCount} รายการ</p><div className="gr-track" aria-hidden="true"><span style={{ width: `${due.openCount ? due.dueDateCoveragePct : 0}%` }} /></div><p className="gr-muted">รายการที่ไม่มีวันครบกำหนดไม่ถูกนับเป็นงานเกินกำหนด</p></section>
      </div>
      <div className="gr-columns gr-chart-columns">
        <section className="gr-panel"><header><h3>ยอดตั้งเบิกย้อนหลัง 12 เดือน</h3><p>ตามวันที่ตั้งเบิก · ไม่ใช่เงินรับจ่ายจริง</p></header><div className="gr-chart-legend"><span><i/>เงินประกัน</span><span><i className="gr-fee-dot"/>ค่าธรรมเนียมและอื่น ๆ</span><small>สูงสุด {money(monthlyMax)}</small></div><div className="gr-month-chart">{report.months.map((month, index) => <button type="button" key={`${month.year}-${month.month}`} aria-pressed={monthIndex === index} aria-label={`${month.label} เงินประกัน ${money(month.deposit)} ค่าธรรมเนียม ${money(month.fee)}`} onClick={() => setMonthIndex(index)}><div><i style={{ height: `${month.deposit / (monthlyMax || 1) * 100}%` }}/><i className="gr-fee-bar" style={{ height: `${month.fee / (monthlyMax || 1) * 100}%` }}/></div><span>{month.label}</span></button>)}</div><div className="gr-month-detail" aria-live="polite"><strong>{selectedMonth.label}</strong><span>เงินประกัน {money(selectedMonth.deposit)}</span><span>ค่าธรรมเนียมและอื่น ๆ {money(selectedMonth.fee)}</span></div><details className="gr-month-data"><summary>ดูตัวเลขรายเดือนทั้งหมด</summary><table><thead><tr><th>เดือน</th><th>เงินประกัน</th><th>ค่าธรรมเนียม / อื่น ๆ</th></tr></thead><tbody>{report.months.map((month) => <tr key={month.label}><th>{month.label}</th><td>{money(month.deposit)}</td><td>{money(month.fee)}</td></tr>)}</tbody></table></details></section>
        <section className="gr-panel"><header><h3>คงค้างตามขั้นตอนงาน</h3><p>รวมเงินประกันติดตั้งและรื้อถอน</p></header><RankedBars rows={report.statuses}/></section>
      </div>
      <section className="gr-panel"><header><h3>เงินประกันคงค้างตามพื้นที่</h3><p>เรียงตามยอดเงินที่ต้องติดตาม</p></header><RankedBars rows={report.areas}/></section>
      <section className="gr-panel gr-top"><header><h3>5 รายการที่มียอดคงค้างสูงสุด</h3><p>รวม On Service · เปิดรายการเพื่อตรวจรายละเอียด</p></header>{!report.topOutstanding.length ? <p className="gr-empty">ไม่มียอดเงินประกันคงค้าง</p> : <div className="gr-table-scroll"><table><thead><tr><th>อาคาร / รายการ</th><th>พื้นที่</th><th>ผู้รับผิดชอบ</th><th>ยอดคงค้าง</th><th><span className="sr-only">รายละเอียด</span></th></tr></thead><tbody>{report.topOutstanding.map(({ item, amount: value }, index) => <tr key={item.id || item.id_firestore || index}><td><strong>{item.place || "ไม่ระบุอาคาร"}</strong><small>{item.cid || item.no || "ไม่ระบุเลขอ้างอิง"}</small></td><td>{item.area || "ไม่ระบุพื้นที่"}</td><td>{item.owner || "ไม่ระบุผู้รับผิดชอบ"}</td><td><strong>{money(value)}</strong></td><td>{item.id && !preview && <Link href={`/guarantees/${item.id}`} aria-label={`เปิดรายละเอียด ${item.place || "รายการเงินประกัน"}`}>รายละเอียด →</Link>}</td></tr>)}</tbody></table></div>}</section>
      <footer className="gr-footnote"><strong>ขอบเขตและวิธีอ่านรายงาน</strong><p>ข้อมูลตามสิทธิ์ผู้ใช้งาน ณ {timestamp} · ตัดรายการยกเลิก {report.excludedCount} รายการออกจากยอดเงิน · ค่าธรรมเนียมและค่าใช้จ่ายอื่น {money(report.costs.totalAmount)} แยกจากเงินประกันที่ขอคืนได้</p><p>การคืนประกันติดตั้งอิงสถานะเสร็จแล้ว การคืนประกันรื้อถอนอิงเครื่องหมายคืนเงินของรายการ ตามกฎเดิมของโมดูล ตัวเลขนี้เป็นสถานะเงินประกันในระบบ ไม่ใช่งบกระแสเงินสดหรือยอดจากบัญชีธนาคาร</p></footer>
    </>}
  </section>;
}

function RankedBars({ rows }: { rows: Array<{ key: string; label: string; count: number; amount: number }> }) {
  const max = Math.max(...rows.map((row) => row.amount), 1);
  return rows.length ? <ul className="gr-ranked-bars">{rows.map((row) => <li key={row.key}><div><strong>{row.label}</strong><span>{row.count} รายการ</span></div><div className="gr-track" aria-hidden="true"><span style={{ width: `${row.amount / max * 100}%` }}/></div><b>{money(row.amount)}</b></li>)}</ul> : <p className="gr-empty">ไม่มียอดคงค้างในขอบเขตนี้</p>;
}
