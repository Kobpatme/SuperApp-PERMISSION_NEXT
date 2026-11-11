"use client";

import { copy } from "@/lib/copy";

import Link from "next/link";
import { useDepositPage } from "./use-deposit-page";
import { sessionFetch } from "@/lib/session-fetch";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getActionNotifications, getListPageKpiMetrics, getSidebarFinancialMetrics,
  daysBetween, getLastActivityDate, getMissingDocumentLabels, getRemovalDepositMetrics, getSmartWorkQueue, getWorkflowStatusKey, parseDateValue, parseMoney, selectPersonalDepositItems, sortCompletedLast,
  workflowLabels, type DepositItem,
} from "@/lib/deposit-v2-domain";
import { GuaranteeExecutiveDashboard } from "@/components/guarantee-executive-dashboard";
import { TruncatedText } from "@/components/ui/truncated-text";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableRegion } from "@/components/ui/table-region";

const money = (value: number) => `฿${value.toLocaleString("th-TH", { maximumFractionDigits: 2 })}`;
const pageSize = 20;
const statusOptions = ["new", "fin", "att", "tl_wait", "tl_process", "ret", "clo", "refund_process", "on_service", "off_service_pending", "done", "cancel"];
type WorkspaceView = "dashboard" | "list" | "on_service" | "done" | "queue" | "analytics";
const itemTotal = (item: DepositItem) => parseMoney(item.deposit) + parseMoney(item.demolish) + parseMoney(item.fee) + parseMoney(item.other);
const normalized = (value: unknown) => String(value ?? "").trim().toLocaleLowerCase("th-TH");
function formatDate(value: unknown) {
  const date = parseDateValue(value);
  return date ? date.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
}

export function DepositWorkspace({ items, preview, state, truncated, generatedAt, canCreate, installationTeamView = false, canPreview, personalUserId = "", canViewTlWorkspace = false, requestedTeamId }: {
  items: DepositItem[]; preview: boolean; state: "ready" | "not_configured" | "unavailable"; truncated: boolean; generatedAt: string; canCreate: boolean; installationTeamView?: boolean; canPreview: boolean;
  personalUserId?: string; canViewTlWorkspace?: boolean;
  requestedTeamId?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [view, setView] = useState<WorkspaceView>(installationTeamView ? "queue" : "dashboard");
  const [returnView, setReturnView] = useState<WorkspaceView>(installationTeamView ? "queue" : "list");
  const [page, setPage] = useState(1);
  const [sortNo, setSortNo] = useState<"default" | "asc" | "desc">("default");
  const [exportMonth, setExportMonth] = useState("");
  const [exportYear, setExportYear] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [exportPending, setExportPending] = useState(false), [exportError, setExportError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((event.target as HTMLElement).tagName)) { event.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const localOwners = useMemo(() => [...new Set(items.map((item) => item.owner?.trim()).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "th")), [items]);
  const localAreas = useMemo(() => [...new Set(items.map((item) => item.area?.trim()).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "th")), [items]);
  const localYears = useMemo(() => [...new Set(items.map((item) => parseDateValue(item.dateReq)?.getFullYear()).filter((year): year is number => Boolean(year)))].sort((a, b) => b - a), [items]);
  const baseItems = useMemo(() => {
    if (view === "on_service") return items.filter((item) => ["on_service", "off_service_pending"].includes(getWorkflowStatusKey(item)));
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
  const serverParams = new URLSearchParams({ q: query, status: statusFilter, owner: ownerFilter, area: areaFilter, view, sort: sortNo, page: String(page), installation: installationTeamView ? "1" : "0", ...(requestedTeamId ? { team: requestedTeamId } : {}) });
  const serverEnabled = !preview && ["list", "on_service", "done"].includes(view);
  const remotePage = useDepositPage(serverParams.toString(), serverEnabled);
  const filteredCount = serverEnabled ? remotePage.data?.total ?? 0 : filtered.length;
  const pageCount = Math.max(1, Math.ceil(filteredCount / pageSize));
  const safePage = serverEnabled ? remotePage.data?.page ?? 1 : Math.min(page, pageCount);
  const pageItems = serverEnabled ? remotePage.data?.items ?? [] : filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const localKpis = useMemo(() => getListPageKpiMetrics(filtered), [filtered]);
  const localFinance = useMemo(() => getSidebarFinancialMetrics(filtered), [filtered]);
  const kpis = remotePage.data?.kpis ?? localKpis, finance = remotePage.data?.finance ?? localFinance;
  const owners = remotePage.data?.owners ?? localOwners, areas = remotePage.data?.areas ?? localAreas, years = remotePage.data?.years ?? localYears;
  const queue = useMemo(() => getSmartWorkQueue(items), [items]);
  const notifications = useMemo(() => getActionNotifications(items), [items]);


  const personalItems = useMemo(() => selectPersonalDepositItems(items as Array<DepositItem & { ownerId?: string; tlAssigneeId?: string | null }>, personalUserId), [items, personalUserId]);
  const personalQueue = useMemo(() => getSmartWorkQueue(personalItems, new Date(generatedAt)), [personalItems, generatedAt]);
  const personalFinance = useMemo(() => getSidebarFinancialMetrics(personalItems), [personalItems]);
  const personalNotifications = useMemo(() => getActionNotifications(personalItems, new Date(generatedAt)), [personalItems, generatedAt]);
  const personalDueSoon = personalQueue.filter((entry) => entry.overdueDays > 0 || entry.dueInDays !== null && entry.dueInDays <= 3);
  const personalMissingDocuments = personalItems.filter((item) => getMissingDocumentLabels(item, getWorkflowStatusKey(item)).length > 0);
  const personalAwaitingTl = personalItems.filter((item) => ["tl_wait", "tl_process"].includes(getWorkflowStatusKey(item)));
  const personalRefundPending = personalItems.filter((item) => getWorkflowStatusKey(item) === "refund_process");
  const personalOnService = personalItems.filter((item) => getWorkflowStatusKey(item) === "on_service");
  const personalCompleted = personalItems.filter((item) => getWorkflowStatusKey(item) === "done")
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))).slice(0, 5);
  const personalRecentActivity = [...personalItems].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))).slice(0, 5);
  const processCount = filtered.filter((item) => getWorkflowStatusKey(item) === "refund_process").length;
  const lastUpdated = useMemo(() => items.map((item) => parseDateValue(item.updatedAt)).filter((date): date is Date => Boolean(date)).sort((a, b) => b.getTime() - a.getTime())[0], [items]);
  const createUnavailableReason = preview ? "ข้อมูลตัวอย่างสร้างรายการจริงไม่ได้" : state === "not_configured" ? copy.feedback.unavailable : state === "unavailable" ? copy.feedback.unavailable : canPreview ? copy.feedback.readOnly : !canCreate ? "บัญชีนี้ไม่มีสิทธิ์สร้างรายการ" : "";
  const isAnalytics = view === "analytics";

  function setWorkspaceView(next: WorkspaceView) { setView(next); setStatusFilter(""); setQuery(""); setOwnerFilter(""); setAreaFilter(""); setPage(1); }
  function openAnalytics() { setReturnView(view === "analytics" ? "list" : view); setView("analytics"); }
  function returnFromAnalytics() { setView(returnView === "analytics" ? "list" : returnView); }
  async function copyCid(cid: string) {
    if (!cid) return;
    try { await navigator.clipboard.writeText(cid); setCopyMessage(`คัดลอก CID ${cid} แล้ว`); }
    catch { setCopyMessage("คัดลอกไม่สำเร็จ กรุณาเลือกและคัดลอก CID อีกครั้ง"); }
    window.setTimeout(() => setCopyMessage(""), 1800);
  }
  async function exportCsv() {
    if (!preview) {
      if (exportPending) return;
      setExportPending(true); setExportError("");
      try {
        const params = new URLSearchParams(serverParams); params.set("year", exportYear); params.set("month", exportMonth);
        const response = await sessionFetch(`/api/guarantees/export?${params}`);
        if (!response.ok || !response.headers.get("content-type")?.includes("text/csv")) throw new Error("EXPORT_UNAVAILABLE");
        const url = URL.createObjectURL(await response.blob()), link = document.createElement("a");
        link.href = url; link.download = `deposit-report-${exportYear || "all"}-${exportMonth === "" ? "all" : Number(exportMonth) + 1}.csv`; link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch { setExportError("ส่งออกข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง"); }
      finally { setExportPending(false); }
      return;
    }
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
    ? [["queue", "งานที่ทีมติดตั้งต้องดำเนินการ", queue.length], ["list", "งานค้างทั้งหมด", preview ? items.length : undefined]]
    : [["dashboard", "ภาพรวมของฉัน"], ["queue", "งานที่ต้องติดตาม", queue.length], ["list", "รายการเงินประกัน", preview ? items.length : undefined],
      ["on_service", "มีประกันรื้อถอน (On Service)", items.filter((item) => ["on_service", "off_service_pending"].includes(getWorkflowStatusKey(item))).length],
      ["done", "งานสำเร็จ", items.filter((item) => getWorkflowStatusKey(item) === "done").length]];

  return <div className="deposit-workspace legacy-deposit-workspace">
    <header className="deposit-head legacy-deposit-head">
      <PageHeader parent={{ label: "ภาพรวม", href: "/" }} eyebrow={installationTeamView ? "เงินประกันอาคาร / งานทีมติดตั้ง" : isAnalytics ? "เงินประกันอาคาร / รายงานวิเคราะห์" : "เงินประกันอาคาร / งานดำเนินการ"} title={isAnalytics ? "ภาพรวมเงินประกันอาคาร" : installationTeamView ? "งานที่ทีมติดตั้งต้องดำเนินการ" : "รายการขอคืนเงินประกันอาคาร"} description={isAnalytics ? "รายงานหลักสำหรับติดตามเงินประกัน การคืนเงิน และประเด็นที่ต้องดำเนินการ" : `ติดตามเอกสาร ขั้นตอน และสถานะการขอคืนเงินประกัน · อัปเดตล่าสุด ${lastUpdated ? lastUpdated.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : "—"}`} actions={<div className="legacy-head-actions">{isAnalytics ? <button type="button" className="analytics-back-button" aria-label="กลับรายการเงินประกัน" onClick={returnFromAnalytics}>← กลับรายการเงินประกัน</button> : <>
        <button type="button" className="executive-nav-button" onClick={openAnalytics}>วิเคราะห์ข้อมูล</button>
        <select className="ui-building-field" aria-label="เดือนสำหรับส่งออก" value={exportMonth} onChange={(event) => setExportMonth(event.target.value)}><option value="">ทุกเดือน</option>{[{ value: "0", label: "ม.ค." }, { value: "1", label: "ก.พ." }, { value: "2", label: "มี.ค." }, { value: "3", label: "เม.ย." }, { value: "4", label: "พ.ค." }, { value: "5", label: "มิ.ย." }, { value: "6", label: "ก.ค." }, { value: "7", label: "ส.ค." }, { value: "8", label: "ก.ย." }, { value: "9", label: "ต.ค." }, { value: "10", label: "พ.ย." }, { value: "11", label: "ธ.ค." }].map((month) => <option value={month.value} key={month.value}>{month.label}</option>)}</select>
        <select className="ui-building-field" aria-label="ปีสำหรับส่งออก" value={exportYear} onChange={(event) => setExportYear(event.target.value)}><option value="">ทุกปี</option>{years.map((year) => <option value={year} key={year}>{year}</option>)}</select>
        <button type="button" className="deposit-export" onClick={exportCsv} disabled={!filteredCount || exportPending}>{exportPending ? "กำลังส่งออก…" : "⇩ Export CSV"}</button>
        {!installationTeamView && (createUnavailableReason ? <span className="deposit-create-action"><button className="primary" type="button" disabled title={createUnavailableReason}>＋ เพิ่มรายการใหม่</button><small>{createUnavailableReason}</small></span> : <Link className="primary" href="/guarantees/new">＋ เพิ่มรายการใหม่</Link>)}
      </>}</div>} />
</header>
    {installationTeamView && <div className="deposit-banner">มุมมองนี้แสดงเฉพาะงานสถานะ “รอทีมติดตั้งรับงาน”, “ทีมติดตั้งดำเนินการ” และ “รอดำเนินการ Off Service”</div>}
    {preview && <div className="deposit-banner">ข้อมูลตัวอย่างจาก workflow V2 · ไม่มีการบันทึก <Link href={installationTeamView ? "/guarantees?view=installation-team" : "/guarantees"}>กลับข้อมูลจริง</Link></div>}
    {!preview && state !== "ready" && <div className="deposit-banner">{state === "not_configured" ? copy.feedback.unavailable : "โหลดข้อมูลเงินประกันไม่สำเร็จ"} {canPreview && <Link href={`/guarantees?preview=1${installationTeamView ? "&view=installation-team" : ""}`}>ดูข้อมูลตัวอย่าง</Link>}</div>}
    {truncated && !serverEnabled && <div className="deposit-banner">ภาพรวมนี้แสดง 500 รายการล่าสุด · ค้นหาและส่งออกข้อมูลครบทั้งหมดได้ในรายการเงินประกัน</div>}
    {remotePage.loading && <p role="status">กำลังค้นหาข้อมูลทั้งหมด…</p>}
    {remotePage.error && <p role="alert">{remotePage.error}</p>}
    {exportError && <p role="alert">{exportError}</p>}
    {copyMessage && <div className="deposit-toast" role="status">{copyMessage}</div>}

    <nav className="legacy-module-nav" aria-label="มุมมองเงินประกัน">{tabs.map(([key, label, count]) => <button key={key} type="button" aria-pressed={view === key} className={view === key ? "active" : ""} onClick={() => setWorkspaceView(key)}>{label}{typeof count === "number" && <span>{count}</span>}</button>)}</nav>

    {(["list", "done"] as WorkspaceView[]).includes(view) && <>
      <section className="legacy-kpis" aria-label="สรุปเงินประกัน">
        <div className="tone-blue"><span>รายการทั้งหมด</span><strong><AnimatedNumber value={filteredCount}/></strong><small>ตามตัวกรองปัจจุบัน</small></div>
        <div className="tone-orange"><span>อยู่ระหว่างขอคืนเงิน</span><strong><AnimatedNumber value={processCount}/></strong><small>รายการที่กำลังดำเนินการ</small></div>
        <div className="tone-green"><span>เสร็จสิ้นแล้ว</span><strong><AnimatedNumber value={kpis.completedCount}/></strong><small>รวม On Service</small></div>
        <div className="tone-violet"><span>ค่าใช้จ่ายสุทธิ</span><strong><AnimatedNumber value={kpis.nonRefundableCostAmount} format={money}/></strong><small>ค่าธรรมเนียมและค่าใช้จ่ายอื่น</small></div>
        <div className="tone-blue"><span>ประกันติดตั้ง</span><strong><AnimatedNumber value={kpis.installationDepositAmount} format={money}/></strong><small>Refundable</small></div>
        <div className="tone-red"><span>ยอดประกันคงค้าง</span><strong><AnimatedNumber value={finance.totalOutstandingAmount} format={money}/></strong><small>ติดตั้งและรื้อถอน</small></div>
      </section>
      <div className="legacy-filter-bar"><label className="deposit-search"><span className="sr-only">ค้นหารายการ</span><input className="ui-building-field" ref={searchRef} type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="ค้นหาอาคาร, ลูกค้า, เจ้าของงาน, CID หรือ PR...  /" /></label>
        <select className="ui-building-field" aria-label="กรองสถานะ" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}><option value="">สถานะงานทั้งหมด</option>{statusOptions.map((key) => <option key={key} value={key}>{workflowLabels[key]}</option>)}</select>
        <select className="ui-building-field" aria-label="กรองเจ้าของงาน" value={ownerFilter} onChange={(event) => { setOwnerFilter(event.target.value); setPage(1); }}><option value="">เจ้าของงานทั้งหมด</option>{owners.map((owner) => <option key={owner}>{owner}</option>)}</select>
        <select className="ui-building-field" aria-label="กรองพื้นที่" value={areaFilter} onChange={(event) => { setAreaFilter(event.target.value); setPage(1); }}><option value="">พื้นที่ทั้งหมด</option>{areas.map((area) => <option key={area}>{area}</option>)}</select>
        {(query || statusFilter || ownerFilter || areaFilter) && <button type="button" className="legacy-clear" onClick={() => { setQuery(""); setStatusFilter(""); setOwnerFilter(""); setAreaFilter(""); setPage(1); }}>ล้างตัวกรอง</button>}
      </div>
      <section className="legacy-table-card"><header><strong>รายการทั้งหมด</strong><span>{filteredCount.toLocaleString("th-TH")} รายการ</span></header><TableRegion label="รายการเงินประกัน เลื่อนแนวนอนได้" className="deposit-table-wrap"><table className="deposit-table legacy-deposit-table"><caption className="sr-only">รายการเงินประกันตามตัวกรองในขอบเขตสิทธิ์ของคุณ</caption><thead><tr><th scope="col">CID</th><th scope="col" aria-sort={sortNo === "asc" ? "ascending" : sortNo === "desc" ? "descending" : "none"}><button type="button" onClick={() => { setSortNo(sortNo === "asc" ? "desc" : "asc"); setPage(1); }}>NO. {sortNo === "asc" ? "↑" : sortNo === "desc" ? "↓" : "↕"}</button></th><th scope="col">สถานะ</th><th scope="col">อาคาร / ลูกค้า</th><th scope="col">เจ้าของงาน</th><th scope="col">PR NO.</th><th scope="col">วันที่ตั้งเบิก</th><th scope="col">ยอดรวม</th><th scope="col">เงินประกันติดตั้ง</th><th scope="col">พื้นที่</th><th scope="col">ขั้นตอน</th><th scope="col">การดำเนินการ</th></tr></thead><tbody>
        {pageItems.map((item) => <tr key={item.id || item.id_firestore} tabIndex={0} onClick={() => !preview && item.id && router.push(`/guarantees/${item.id}`)} onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (!preview && item.id && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); router.push(`/guarantees/${item.id}`); } }}>
          <td><button type="button" className="copy-cid" title="คัดลอก CID" onClick={(event) => { event.stopPropagation(); void copyCid(item.cid || ""); }}>{item.cid || "—"}</button></td><td>{item.no || "—"}</td><td><StatusBadge label={workflowLabels[getWorkflowStatusKey(item)] || item.status || ""} tone={depositStatusTone(getWorkflowStatusKey(item))} /></td>
          <td><TruncatedText text={item.place || "ไม่ระบุอาคาร"} lines={2}/><TruncatedText text={item.customer || "—"} lines={1}/></td><td><span className="owner-badge"><TruncatedText text={item.owner || "—"} lines={1}/></span></td><td><TruncatedText text={item.pr || "—"} lines={1}/></td><td>{formatDate(item.dateReq)}</td><td className="deposit-money">{money(itemTotal(item))}</td><td className="deposit-money">{parseMoney(item.deposit) ? money(parseMoney(item.deposit)) : "—"}</td><td><span className="area-badge"><TruncatedText text={item.area || "—"} lines={1}/></span></td><td><TruncatedText text={workflowLabels[getWorkflowStatusKey(item)]} lines={1}/></td><td>{preview ? <button type="button" className="deposit-link">ดูรายละเอียด</button> : <Link href={`/guarantees/${item.id}`} onClick={(event) => event.stopPropagation()}>ดู / อัปเดต →</Link>}</td>
        </tr>)}</tbody></table>{!pageItems.length && <div className="deposit-empty">ไม่พบรายการที่ตรงกับเงื่อนไข</div>}</TableRegion>
        {filteredCount > pageSize && <footer className="legacy-pagination"><span>แสดง {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filteredCount)} จาก {filteredCount}</span><div><button type="button" disabled={safePage <= 1} onClick={() => setPage((value) => value - 1)}>← ก่อนหน้า</button><strong>หน้า {safePage} / {pageCount}</strong><button type="button" disabled={safePage >= pageCount} onClick={() => setPage((value) => value + 1)}>ถัดไป →</button></div></footer>}
      </section>
    </>}

    {view === "on_service" && <section className="deposit-on-service" aria-label="ติดตามเงินประกันรื้อถอน On Service">
      <header><div><h2>ติดตามเงินประกันรื้อถอน On Service</h2><p>แยกรายการที่ยังมีเงินประกันรื้อถอนคงค้างและขั้นตอน Off Service</p></div><button type="button" onClick={() => setWorkspaceView("list")}>ดูรายการเงินประกันทั้งหมด</button></header>
      <div className="deposit-on-service-metrics"><article><span>On Service</span><strong>{getRemovalDepositMetrics(items).onServiceCount.toLocaleString("th-TH")}</strong><small>รายการที่ยังอยู่ระหว่างให้บริการ</small></article><article><span>เงินรื้อถอนคงค้าง</span><strong>{money(getRemovalDepositMetrics(items).onServiceAmount)}</strong><small>ยอดของรายการ On Service</small></article><article><span>รอ Off Service</span><strong>{getRemovalDepositMetrics(items).offServicePendingCount.toLocaleString("th-TH")}</strong><small>{money(getRemovalDepositMetrics(items).offServicePendingAmount)} ที่ต้องติดตาม</small></article></div>
      <div className="deposit-on-service-list"><div className="deposit-on-service-list-head"><strong>รายการที่ตรงกับตัวกรอง</strong><span>{filteredCount.toLocaleString("th-TH")} รายการ</span></div>
        {filtered.map((item) => { const status = getWorkflowStatusKey(item); const age = daysBetween(getLastActivityDate(item) || item.dateReq || item.createdAt, new Date(generatedAt)); return <article key={item.id}>
          <div><strong>{item.place || "ไม่ระบุอาคาร"}</strong><small>{item.customer || "ไม่ระบุลูกค้า"} · {workflowLabels[status]}</small></div>
          <div><span>เจ้าของงาน</span><strong>{item.owner || "ไม่ระบุ"}</strong></div>
          <div><span>เงินประกันรื้อถอน</span><strong className="deposit-money">{money(parseMoney(item.demolish))}</strong></div>
          <div><span>ความเคลื่อนไหว</span><strong>{age === null ? "ไม่ระบุอายุ" : `${age} วัน`}</strong></div>
          <div><span>ขั้นตอนถัดไป</span><strong>{status === "off_service_pending" ? "ดำเนินการ Off Service" : "ติดตามกำหนด Off Service"}</strong></div>
          <Link href={`/guarantees/${item.id}`}>เปิดรายการ →</Link>
        </article>; })}
        {!filteredCount && <p className="deposit-empty">ไม่พบรายการ On Service ตามคำค้นหาและตัวกรอง</p>}
      </div>
    </section>}
    {view === "dashboard" && <section className="deposit-personal-dashboard" aria-label="ภาพรวมงานเงินประกันของฉัน">
      <header><div><h2>วันนี้ฉันต้องทำอะไร?</h2><p>แสดงเฉพาะรายการที่เป็นเจ้าของหรือมอบหมายให้บัญชีนี้ ตามขอบเขตที่ระบบอนุญาต</p></div>{canViewTlWorkspace && <Link href="/guarantees?view=installation-team">งานทีมติดตั้ง</Link>}</header>
      {!personalUserId && <div className="deposit-banner">ไม่พบข้อมูลผู้ใช้สำหรับสร้างภาพรวมส่วนบุคคล</div>}
      <div className="deposit-personal-metrics">
        <article><span>งานของฉัน</span><strong>{personalItems.length.toLocaleString("th-TH")}</strong><small>รายการที่รับผิดชอบหรือมอบหมายให้ฉัน</small></article>
        <article><span>งานที่ควรเร่ง</span><strong>{personalDueSoon.length.toLocaleString("th-TH")}</strong><small>เกินกำหนดหรือครบกำหนดภายใน 3 วัน</small></article>
        <article><span>รอเอกสาร</span><strong>{personalMissingDocuments.length.toLocaleString("th-TH")}</strong><small>ต้องเติมหลักฐานตามขั้นตอน</small></article>
        <article><span>รอทีมติดตั้ง / TL</span><strong>{personalAwaitingTl.length.toLocaleString("th-TH")}</strong><small>สถานะรับงานหรือกำลังดำเนินการ</small></article>
        <article><span>กำลังคืนเงิน</span><strong>{personalRefundPending.length.toLocaleString("th-TH")}</strong><small>อยู่ในขั้นตอนดำเนินการคืนเงิน</small></article>
        <article><span>On Service</span><strong>{personalOnService.length.toLocaleString("th-TH")}</strong><small>มีเงินประกันรื้อถอนคงค้าง</small></article>
        <article className="financial"><span>ยอดประกันคงค้าง</span><strong>{money(personalFinance.totalOutstandingAmount)}</strong><small>ตามรายการในขอบเขตของฉัน</small></article>
      </div>
      <div className="deposit-personal-columns">
        <section className="deposit-personal-list"><h3>รายการที่ต้องติดตาม</h3>{personalQueue.slice(0, 8).map((entry) => <Link key={entry.item.id} href={`/guarantees/${entry.item.id}`}>
          <StatusBadge label={entry.priority === "high" ? "เร่งด่วน" : entry.priority === "medium" ? "ติดตาม" : "ทั่วไป"} tone={depositPriorityTone(entry.priority)} />
          <span><strong>{entry.item.place || "ไม่ระบุอาคาร"}</strong><small>{workflowLabels[entry.workflowKey]} · {entry.reasons.join(" · ")}</small><small>ผู้รับผิดชอบ {entry.item.owner || "ไม่ระบุ"}</small></span>
          <b className="deposit-money">{money(entry.outstandingAmount)}</b>
        </Link>)}{!personalQueue.length && <p className="deposit-empty">ไม่มีรายการเร่งด่วนในรายการที่มอบหมายให้คุณ</p>}</section>
        <section className="deposit-personal-list"><h3>แจ้งเตือนที่ทำต่อได้</h3>{personalNotifications.slice(0, 6).map((notice) => <Link key={notice.id} href={`/guarantees/${notice.taskId}`}><strong>{notice.title}</strong><small>{notice.detail}</small></Link>)}{!personalNotifications.length && <p className="deposit-empty">ไม่มีการแจ้งเตือนที่ต้องดำเนินการ</p>}
          <h3>งานเสร็จล่าสุด</h3>{personalCompleted.map((item) => <Link key={item.id} href={`/guarantees/${item.id}`}><strong>{item.place || "ไม่ระบุอาคาร"}</strong><small>เสร็จสิ้น · {formatDate(item.updatedAt)}</small></Link>)}{!personalCompleted.length && <p className="deposit-empty">ยังไม่มีรายการที่เสร็จสิ้น</p>}
          <h3>ความเคลื่อนไหวล่าสุด</h3>{personalRecentActivity.map((item) => <Link key={`activity-${item.id}`} href={`/guarantees/${item.id}`}><strong>{item.place || "ไม่ระบุอาคาร"}</strong><small>{workflowLabels[getWorkflowStatusKey(item)]} · อัปเดต {formatDate(item.updatedAt)}</small></Link>)}{!personalRecentActivity.length && <p className="deposit-empty">ยังไม่มีความเคลื่อนไหว</p>}
        </section>
      </div>
    </section>}
    {view === "queue" && <div className="deposit-queue">{queue.map((entry) => <article key={entry.item.id || entry.item.id_firestore} className="deposit-queue-row"><StatusBadge label={entry.priority === "high" ? "เร่งด่วน" : entry.priority === "medium" ? "ติดตาม" : "ทั่วไป"} tone={depositPriorityTone(entry.priority)} /><div><TruncatedText text={entry.item.place || "ไม่ระบุอาคาร"} lines={2}/><TruncatedText text={`${workflowLabels[entry.workflowKey]} · ${entry.reasons.join(" · ")}`} lines={2}/></div><b className="deposit-money">{money(entry.outstandingAmount)}</b><Link href={`/guarantees/${entry.item.id}`}>เปิด →</Link></article>)}{!queue.length && <div className="deposit-empty">ไม่มีรายการที่ต้องติดตาม</div>}</div>}
    {view === "analytics" && <GuaranteeExecutiveDashboard items={items} generatedAt={generatedAt} truncated={truncated} ready={state === "ready"} preview={preview} />}
  </div>;
}

function depositStatusTone(key: string) { return key === "done" ? "success" : key === "cancel" ? "danger" : key === "refund_process" || key === "on_service" || key === "off_service_pending" ? "warning" : "neutral"; }
function depositPriorityTone(priority: string) { return priority === "high" ? "danger" : priority === "medium" ? "warning" : "neutral"; }
