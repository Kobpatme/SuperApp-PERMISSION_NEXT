"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  getActionNotifications, getListPageKpiMetrics, getOperationalAnalytics, getSidebarFinancialMetrics,
  getSmartWorkQueue, getWorkflowStatusKey, parseDateValue, parseMoney, sortCompletedLast,
  workflowLabels, type DepositItem,
} from "@/lib/deposit-v2-domain";
import { buildGuaranteeExecutiveView } from "@/lib/guarantee-view-model";

const money = (value: number) => `฿${value.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`;
const pageSize = 20;
const statusOptions = ["new", "fin", "att", "tl_wait", "tl_process", "ret", "clo", "refund_process", "on_service", "off_service_pending", "done", "cancel"];
type WorkspaceView = "list" | "on_service" | "done" | "queue" | "analytics";
const itemTotal = (item: DepositItem) => parseMoney(item.deposit) + parseMoney(item.demolish) + parseMoney(item.fee) + parseMoney(item.other);
const normalized = (value: unknown) => String(value ?? "").trim().toLocaleLowerCase("th-TH");
function formatDate(value: unknown) {
  const date = parseDateValue(value);
  return date ? date.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
}

export function DepositWorkspace({ items, preview, state, truncated, generatedAt, canCreate, installationTeamView = false, canPreview }: {
  items: DepositItem[]; preview: boolean; state: "ready" | "not_configured" | "unavailable"; truncated: boolean; generatedAt: string; canCreate: boolean; installationTeamView?: boolean; canPreview: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [view, setView] = useState<WorkspaceView>("queue");
  const [page, setPage] = useState(1);
  const [sortNo, setSortNo] = useState<"default" | "asc" | "desc">("default");
  const [exportMonth, setExportMonth] = useState("");
  const [exportYear, setExportYear] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((event.target as HTMLElement).tagName)) { event.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const owners = useMemo(() => [...new Set(items.map((item) => item.owner?.trim()).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "th")), [items]);
  const areas = useMemo(() => [...new Set(items.map((item) => item.area?.trim()).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "th")), [items]);
  const years = useMemo(() => [...new Set(items.map((item) => parseDateValue(item.dateReq)?.getFullYear()).filter((year): year is number => Boolean(year)))].sort((a, b) => b - a), [items]);
  const baseItems = useMemo(() => {
    if (view === "on_service") return items.filter((item) => getWorkflowStatusKey(item) === "on_service");
    if (view === "done") return items.filter((item) => getWorkflowStatusKey(item) === "done");
    return items;
  }, [items, view]);
  const filtered = useMemo(() => {
    const rows = baseItems.filter((item) => {
      if (statusFilter && getWorkflowStatusKey(item) !== statusFilter) return false;
      if (ownerFilter && item.owner !== ownerFilter) return false;
      if (areaFilter && item.area !== areaFilter) return false;
      return [item.cid, item.no, item.place, item.customer, item.owner, item.pr, item.area].map(normalized).join(" ").includes(normalized(query));
    });
    const sorted = sortCompletedLast(rows, (a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
    if (sortNo === "default") return sorted;
    return [...sorted].sort((a, b) => String(a.no || "").localeCompare(String(b.no || ""), "th", { numeric: true }) * (sortNo === "asc" ? 1 : -1));
  }, [baseItems, statusFilter, ownerFilter, areaFilter, query, sortNo]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const kpis = useMemo(() => getListPageKpiMetrics(filtered), [filtered]);
  const finance = useMemo(() => getSidebarFinancialMetrics(filtered), [filtered]);
  const queue = useMemo(() => getSmartWorkQueue(items), [items]);
  const notifications = useMemo(() => getActionNotifications(items), [items]);
  const analytics = useMemo(() => getOperationalAnalytics(items), [items]);
  const executive = useMemo(() => buildGuaranteeExecutiveView(items, generatedAt), [items, generatedAt]);
  const processCount = filtered.filter((item) => getWorkflowStatusKey(item) === "refund_process").length;
  const lastUpdated = useMemo(() => items.map((item) => parseDateValue(item.updatedAt)).filter((date): date is Date => Boolean(date)).sort((a, b) => b.getTime() - a.getTime())[0], [items]);
  const createUnavailableReason = preview ? "ข้อมูลตัวอย่างสร้างรายการจริงไม่ได้" : state === "not_configured" ? "ต้องเชื่อมฐานข้อมูลกลางก่อนสร้างรายการ" : state === "unavailable" ? "ฐานข้อมูลไม่พร้อม กรุณาลองใหม่" : canPreview ? "บัญชี Developer เป็นโหมดอ่านอย่างเดียว" : !canCreate ? "บัญชีนี้ไม่มีสิทธิ์สร้างรายการ" : "";

  function setWorkspaceView(next: WorkspaceView) { setView(next); setStatusFilter(""); setQuery(""); setOwnerFilter(""); setAreaFilter(""); setPage(1); }
  async function copyCid(cid: string) {
    if (!cid) return;
    await navigator.clipboard.writeText(cid); setCopyMessage(`คัดลอก CID ${cid} แล้ว`); window.setTimeout(() => setCopyMessage(""), 1800);
  }
  function exportCsv() {
    const exportRows = filtered.filter((item) => { const date = parseDateValue(item.dateReq); return (!exportYear || date?.getFullYear() === Number(exportYear)) && (!exportMonth || date?.getMonth() === Number(exportMonth)); });
    const cell = (value: unknown) => { const raw = String(value ?? ""); const safe = /^[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw; return `"${safe.replace(/"/g, '""')}"`; };
    const headers = ["CID", "NO.", "สถานะ", "อาคาร", "ลูกค้า", "เจ้าของงาน", "PR No.", "วันตั้งเบิก", "ยอดรวม", "ประกันติดตั้ง", "ประกันรื้อถอน", "ค่าธรรมเนียม", "ค่าใช้จ่ายอื่น", "พื้นที่"];
    const rows = exportRows.map((item) => [item.cid, item.no, workflowLabels[getWorkflowStatusKey(item)], item.place, item.customer, item.owner, item.pr, item.dateReq, itemTotal(item), item.deposit, item.demolish, item.fee, item.other, item.area]);
    const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `deposit-report-${exportYear || "all"}-${exportMonth === "" ? "all" : Number(exportMonth) + 1}.csv`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const tabs: Array<[WorkspaceView, string, number?]> = installationTeamView
    ? [["queue", "งานที่ทีมติดตั้งต้องดำเนินการ", queue.length], ["list", "งานค้างทั้งหมด", items.length]]
    : [["queue", "งานที่ต้องทำ", queue.length], ["list", "รายการทั้งหมด", items.length],
      ["on_service", "มีประกันรื้อถอน (On Service)", items.filter((item) => getWorkflowStatusKey(item) === "on_service").length],
      ["done", "งานสำเร็จ", items.filter((item) => getWorkflowStatusKey(item) === "done").length]];

  return <div className="deposit-workspace legacy-deposit-workspace">
    <header className="deposit-head legacy-deposit-head"><div><p className="eyebrow">{installationTeamView ? "เงินประกันอาคาร / งานทีมติดตั้ง" : "เงินประกันอาคาร / งานดำเนินการ"}</p><h1>{installationTeamView ? "งานที่ทีมติดตั้งต้องดำเนินการ" : "รายการขอคืนเงินประกันอาคาร"}</h1><p className="sub">{installationTeamView ? "แสดงเฉพาะงานค้างในขั้นตอนของทีมติดตั้ง" : `ข้อมูลทั้งหมด · ${exportYear || "ทุกปี"}`} · อัปเดตล่าสุด {lastUpdated ? lastUpdated.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : "—"}</p></div>
      <div className="legacy-head-actions"><button type="button" className={`executive-nav-button${view === "analytics" ? " active" : ""}`} aria-pressed={view === "analytics"} onClick={() => setWorkspaceView("analytics")}>วิเคราะห์ข้อมูล</button>
        <select aria-label="เดือนสำหรับส่งออก" value={exportMonth} onChange={(event) => setExportMonth(event.target.value)}><option value="">ทุกเดือน</option>{["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."].map((month, index) => <option value={index} key={month}>{month}</option>)}</select>
        <select aria-label="ปีสำหรับส่งออก" value={exportYear} onChange={(event) => setExportYear(event.target.value)}><option value="">ทุกปี</option>{years.map((year) => <option value={year} key={year}>{year}</option>)}</select>
        <button type="button" className="deposit-export" onClick={exportCsv} disabled={!filtered.length}>⇩ Export CSV</button>
        {!installationTeamView && (createUnavailableReason ? <button className="primary" type="button" disabled title={createUnavailableReason}>＋ เพิ่มรายการใหม่</button> : <Link className="primary" href="/guarantees/new">＋ เพิ่มรายการใหม่</Link>)}
      </div></header>
    {installationTeamView && <div className="deposit-banner">มุมมองนี้แสดงเฉพาะงานสถานะ “รอทีมติดตั้งรับงาน”, “ทีมติดตั้งดำเนินการ” และ “รอดำเนินการ Off Service”</div>}
    {preview && <div className="deposit-banner">ข้อมูลตัวอย่างจาก workflow V2 · ไม่มีการบันทึก <Link href={installationTeamView ? "/guarantees?view=installation-team" : "/guarantees"}>กลับข้อมูลจริง</Link></div>}
    {!preview && state !== "ready" && <div className="deposit-banner">{state === "not_configured" ? "ยังไม่ได้ตั้งค่าฐานข้อมูลกลาง" : "โหลดข้อมูลเงินประกันไม่สำเร็จ"} {canPreview && <Link href={`/guarantees?preview=1${installationTeamView ? "&view=installation-team" : ""}`}>ดูข้อมูลตัวอย่าง</Link>}</div>}
    {truncated && <div className="deposit-banner">แสดง 500 รายการที่อัปเดตล่าสุดเท่านั้น</div>}
    {copyMessage && <div className="deposit-toast" role="status">{copyMessage}</div>}

    <nav className="legacy-module-nav" aria-label="มุมมองเงินประกัน">{tabs.map(([key, label, count]) => <button key={key} type="button" className={view === key ? "active" : ""} onClick={() => setWorkspaceView(key)}>{label}{typeof count === "number" && <span>{count}</span>}</button>)}</nav>

    {view !== "queue" && view !== "analytics" && <>
      <section className="legacy-kpis" aria-label="สรุปเงินประกัน">
        <div className="tone-blue"><span>รายการทั้งหมด</span><strong>{filtered.length.toLocaleString("th-TH")}</strong><small>ตามตัวกรองปัจจุบัน</small></div>
        <div className="tone-orange"><span>อยู่ระหว่างขอคืนเงิน</span><strong>{processCount}</strong><small>รายการที่กำลังดำเนินการ</small></div>
        <div className="tone-green"><span>เสร็จสิ้นแล้ว</span><strong>{kpis.completedCount}</strong><small>รวม On Service</small></div>
        <div className="tone-violet"><span>ค่าใช้จ่ายสุทธิ</span><strong>{money(kpis.nonRefundableCostAmount)}</strong><small>ค่าธรรมเนียมและค่าใช้จ่ายอื่น</small></div>
        <div className="tone-blue"><span>ประกันติดตั้ง</span><strong>{money(kpis.installationDepositAmount)}</strong><small>Refundable</small></div>
        <div className="tone-red"><span>ยอดประกันคงค้าง</span><strong>{money(finance.totalOutstandingAmount)}</strong><small>ติดตั้งและรื้อถอน</small></div>
      </section>
      <div className="legacy-filter-bar"><label className="deposit-search"><span className="sr-only">ค้นหารายการ</span><input ref={searchRef} type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="ค้นหาอาคาร, ลูกค้า, เจ้าของงาน, CID หรือ PR...  /" /></label>
        <select aria-label="กรองสถานะ" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option value="">สถานะงานทั้งหมด</option>{statusOptions.map((key) => <option key={key} value={key}>{workflowLabels[key]}</option>)}</select>
        <select aria-label="กรองเจ้าของงาน" value={ownerFilter} onChange={(event) => { setOwnerFilter(event.target.value); setPage(1); }}><option value="">เจ้าของงานทั้งหมด</option>{owners.map((owner) => <option key={owner}>{owner}</option>)}</select>
        <select aria-label="กรองพื้นที่" value={areaFilter} onChange={(event) => { setAreaFilter(event.target.value); setPage(1); }}><option value="">พื้นที่ทั้งหมด</option>{areas.map((area) => <option key={area}>{area}</option>)}</select>
        {(query || statusFilter || ownerFilter || areaFilter) && <button type="button" className="legacy-clear" onClick={() => { setQuery(""); setStatusFilter(""); setOwnerFilter(""); setAreaFilter(""); setPage(1); }}>ล้างตัวกรอง</button>}
      </div>
      <section className="legacy-table-card"><header><strong>รายการทั้งหมด</strong><span>{filtered.length.toLocaleString("th-TH")} รายการ</span></header><div className="deposit-table-wrap"><table className="deposit-table legacy-deposit-table"><thead><tr><th>CID</th><th><button type="button" onClick={() => { setSortNo(sortNo === "asc" ? "desc" : "asc"); setPage(1); }}>NO. {sortNo === "asc" ? "↑" : sortNo === "desc" ? "↓" : "↕"}</button></th><th>สถานะ</th><th>อาคาร / ลูกค้า</th><th>เจ้าของงาน</th><th>PR NO.</th><th>วันที่ตั้งเบิก</th><th>ยอดรวม</th><th>เงินประกันติดตั้ง</th><th>พื้นที่</th><th>ขั้นตอน</th><th>การดำเนินการ</th></tr></thead><tbody>
        {pageItems.map((item) => <tr key={item.id || item.id_firestore} tabIndex={0} onClick={() => !preview && item.id && router.push(`/guarantees/${item.id}`)} onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (!preview && item.id && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); router.push(`/guarantees/${item.id}`); } }}>
          <td><button type="button" className="copy-cid" title="คัดลอก CID" onClick={(event) => { event.stopPropagation(); void copyCid(item.cid || ""); }}>{item.cid || "—"}</button></td><td>{item.no || "—"}</td><td><span className={`deposit-status status-${getWorkflowStatusKey(item)}`}>{workflowLabels[getWorkflowStatusKey(item)] || item.status}</span></td>
          <td><strong>{item.place || "ไม่ระบุอาคาร"}</strong><small>{item.customer || "—"}</small></td><td><span className="owner-badge">{item.owner || "—"}</span></td><td>{item.pr || "—"}</td><td>{formatDate(item.dateReq)}</td><td className="deposit-money">{money(itemTotal(item))}</td><td className="deposit-money">{parseMoney(item.deposit) ? money(parseMoney(item.deposit)) : "—"}</td><td><span className="area-badge">{item.area || "—"}</span></td><td>{workflowLabels[getWorkflowStatusKey(item)]}</td><td>{preview ? <button type="button" className="deposit-link">ดูรายละเอียด</button> : <Link href={`/guarantees/${item.id}`} onClick={(event) => event.stopPropagation()}>ดู / อัปเดต →</Link>}</td>
        </tr>)}</tbody></table>{!pageItems.length && <div className="deposit-empty">ไม่พบรายการที่ตรงกับเงื่อนไข</div>}</div>
        {filtered.length > pageSize && <footer className="legacy-pagination"><span>แสดง {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} จาก {filtered.length}</span><div><button type="button" disabled={safePage <= 1} onClick={() => setPage((value) => value - 1)}>← ก่อนหน้า</button><strong>หน้า {safePage} / {pageCount}</strong><button type="button" disabled={safePage >= pageCount} onClick={() => setPage((value) => value + 1)}>ถัดไป →</button></div></footer>}
      </section>
    </>}

    {view === "queue" && <div className="deposit-queue">{queue.map((entry) => <article key={entry.item.id || entry.item.id_firestore} className="deposit-queue-row"><span className={`deposit-priority priority-${entry.priority}`}>{entry.priority === "high" ? "เร่งด่วน" : entry.priority === "medium" ? "ติดตาม" : "ทั่วไป"}</span><div><strong>{entry.item.place || "ไม่ระบุอาคาร"}</strong><small>{workflowLabels[entry.workflowKey]} · {entry.reasons.join(" · ")}</small></div><b>{money(entry.outstandingAmount)}</b><Link href={`/guarantees/${entry.item.id}`}>เปิด →</Link></article>)}{!queue.length && <div className="deposit-empty">ไม่มีรายการที่ต้องติดตาม</div>}</div>}
    {view === "analytics" && <div className="executive-dashboard">
      <section className="executive-hero"><div><span>Total Project Valuation</span><strong>{money(executive.totalInsurance)}</strong></div><div className="executive-rate"><strong>{executive.successPct.toFixed(2)}%</strong><span>Refund Success Rate</span></div></section>
      <section className="executive-lifecycle"><article className="install"><h2>◈ การขอคืนเงินประกันติดตั้ง</h2><div><p><span>เงินประกันติดตั้ง</span><strong>{money(executive.totalInstall)}</strong></p><p><span>ได้รับคืนแล้ว</span><strong>{money(executive.installRefunded)}</strong></p><p><span>ยอดคงค้าง</span><strong>{money(executive.installPending)}</strong><small>{executive.installPendingCount} งาน</small></p></div></article>
        <article className="removal"><h2>◇ เงินประกันรื้อถอน</h2><div><p><span>ยอดทั้งหมด</span><strong>{money(executive.totalDemo)}</strong></p><p><span>ได้คืนแล้ว</span><strong>{money(executive.demoRefunded)}</strong></p><p><span>คงค้าง</span><strong>{money(executive.demoPending)}</strong><small>{executive.demoPendingCount} งาน</small></p></div></article></section>
      <section className="executive-card executive-pending"><header><h2>รายละเอียดยอดคงค้างประกันติดตั้งตามสถานะ</h2><span>{executive.installPendingCount} งาน</span></header>{executive.pendingByStatus.map((row) => <div key={row.key}><strong>{row.label}</strong><span>{row.count} งาน</span><b>{money(row.amount)}</b></div>)}{!executive.pendingByStatus.length && <p className="deposit-empty">ไม่มียอดคงค้างประกันติดตั้ง</p>}</section>
      <div className="executive-grid"><section className="executive-card"><h2>แนวโน้มกระแสเงินสดรายเดือน</h2><div className="monthly-chart" aria-label="แนวโน้มรายเดือน">{executive.months.map((month) => { const max = Math.max(...executive.months.map((entry) => entry.deposit), 1); return <div key={`${month.year}-${month.month}`} title={`${month.label}: ${money(month.deposit)}`}><i style={{ height: `${Math.max(3, month.deposit / max * 100)}%` }}/><span>{month.label}</span></div>; })}</div><div className="chart-legend"><span><i className="deposit-dot"/>เงินประกันอาคาร</span><span>ค่าธรรมเนียม/อื่น {money(executive.months.reduce((sum, month) => sum + month.fee, 0))}</span></div></section>
        <section className="executive-card"><h2>สัดส่วนการจัดสรรงบประมาณ</h2><div className="allocation-chart" style={{ "--install-share": `${executive.totalInsurance ? executive.totalInstall / executive.totalInsurance * 100 : 0}%` } as CSSProperties}><div><strong>{executive.totalInsurance ? (executive.totalInstall / executive.totalInsurance * 100).toFixed(1) : "0"}%</strong><span>ประกันติดตั้ง</span></div></div><div className="allocation-legend"><p><i className="install-dot"/>ประกันติดตั้ง <strong>{money(executive.totalInstall)}</strong></p><p><i className="removal-dot"/>ประกันรื้อถอน <strong>{money(executive.totalDemo)}</strong></p></div></section>
        <section className="executive-card executive-area"><h2>ยอดเงินประกันคงค้างแยกตามพื้นที่ (Area)</h2><div>{executive.areas.map((area) => { const max = Math.max(...executive.areas.map((entry) => entry.amount), 1); return <p key={area.label}><span>{area.label}</span><i><b style={{ width: `${area.amount / max * 100}%` }}/></i><strong>{money(area.amount)}</strong></p>; })}</div></section>
        <section className="executive-card executive-top"><header><h2>5 อันดับอาคารที่มียอดเงินประกันคงค้างสูงสุด</h2><span>Action Required</span></header><div className="deposit-table-wrap"><table><thead><tr><th>ชื่ออาคาร / สถานที่</th><th>พื้นที่</th><th>เจ้าของงาน</th><th>ประกันติดตั้ง</th><th>ประกันรื้อถอน</th><th>ยอดคงค้างสุทธิ</th></tr></thead><tbody>{executive.topOutstanding.map(({ item, amount }) => <tr key={item.id || item.id_firestore}><td><strong>{item.place}</strong><small>{item.customer || "—"}</small></td><td><span className="area-badge">{item.area || "—"}</span></td><td><span className="owner-badge">{item.owner || "—"}</span></td><td>{money(parseMoney(item.deposit))}</td><td>{money(parseMoney(item.demolish))}</td><td><b>{money(amount)}</b></td></tr>)}</tbody></table></div></section>
      </div>
      <footer className="executive-footnote">ข้อมูลตามสิทธิ์ที่ได้รับ · รายการที่ต้องติดตาม {notifications.length} · ความครอบคลุมวันครบกำหนด {analytics.accuracy.dueDateCoveragePct.toFixed(0)}%</footer>
    </div>}
  </div>;
}
