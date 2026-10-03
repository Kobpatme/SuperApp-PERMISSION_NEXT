"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { DashboardItem, DashboardSnapshot } from "@/lib/dashboard";
import { getModule, type ModuleId } from "@/lib/module-registry";
import { filterQueue, formatWorkspaceDate, isDueToday, kindLabels, priorityLabels, readViewSettings, recordKey, type QueueView, type ViewSettings } from "@/lib/workspace-view";
import { WorkspaceIcon } from "@/components/workspace-icon";
import { RefreshButton } from "@/components/workspace-feedback";
import { TruncatedText } from "@/components/ui/truncated-text";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useDialogDismiss } from "@/components/ui/use-dialog-dismiss";

const viewLabels: Record<QueueView, string> = { all: "ทั้งหมด", urgent: "เร่งด่วน", today: "ครบกำหนดวันนี้", mine: "งานของฉัน" };

function DetailPanel({ item, preview, onClose, opener }: { item: DashboardItem; preview: boolean; onClose: () => void; opener: RefObject<HTMLElement | null> }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState("");
  const {closing,dismiss}=useDialogDismiss(ref,onClose);
  useEffect(() => {
    const dialog = ref.current;
    const focused = opener.current ?? (document.activeElement as HTMLElement | null);
    dialog?.showModal();
    return () => { dialog?.close(); focused?.focus(); };
  }, [opener]);
  const moduleInfo = getModule(item.moduleId)!;
  return <dialog className={`detail-panel ${closing ? "is-closing" : ""}`} ref={ref} aria-labelledby="detail-title" onCancel={(event) => { event.preventDefault(); dismiss(); }} onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dismiss(); } }}>
    <div className="detail-inner">
      <div className="detail-top"><span><WorkspaceIcon name={getModule(item.moduleId)!.icon}/>{moduleInfo.name}</span><button type="button" className="round-btn" aria-label="ปิดรายละเอียด" onClick={dismiss} autoFocus><WorkspaceIcon name="close"/></button></div>
      <p className="eyebrow">{item.code || item.id}</p>
       <h2 id="detail-title"><TruncatedText text={item.moduleId === "buildings" && item.buildingName ? item.buildingName : item.title} lines={2}/></h2>
      <div className="detail-badges"><span className={`status-badge ${item.priority}`}>{priorityLabels[item.priority]}</span><span className="status-badge neutral">{item.statusLabel}</span></div>
      {preview && <p className="preview-caption">ข้อมูลตัวอย่าง · ไม่มีผลต่อข้อมูลจริง</p>}
      <dl className="detail-fields">
         <div><dt>อาคาร</dt><dd><TruncatedText text={item.buildingName || "ยังไม่ระบุ"} lines={2}/></dd></div>
         <div><dt>ผู้รับผิดชอบ</dt><dd><TruncatedText text={item.ownerName || "ยังไม่ระบุ"} lines={2}/></dd></div>
        <div><dt>กำหนดดำเนินการ</dt><dd>{formatWorkspaceDate(item.dueAt, true)}</dd></div>
        <div><dt>ประเภท</dt><dd>{kindLabels[item.kind]}</dd></div>
        {item.updatedAt && <div><dt>แก้ไขล่าสุด</dt><dd>{formatWorkspaceDate(item.updatedAt, true)}</dd></div>}
      </dl>
       <section className="detail-section"><h3>รายละเอียด</h3><TruncatedText text={item.description || "ยังไม่มีรายละเอียดเพิ่มเติมจากระบบต้นทาง"} lines={3}/></section>
       <section className="next-step"><WorkspaceIcon name="arrow"/><div><h3>ขั้นตอนถัดไป</h3><TruncatedText text={item.nextAction || "ตรวจสอบข้อมูลกับผู้รับผิดชอบก่อนดำเนินการต่อ"} lines={3}/></div></section>
      <div className="detail-actions">
        {!preview && item.href !== moduleInfo.href && <Link className="primary" href={item.href} onClick={onClose}>เปิดรายการต้นทาง<WorkspaceIcon name="arrow" size={17}/></Link>}
        <button className="secondary-action" type="button" onClick={async () => { try { await navigator.clipboard.writeText(item.code || item.id); setMessage("คัดลอกรหัสรายการแล้ว"); } catch { setMessage("คัดลอกไม่สำเร็จ กรุณาเลือกรหัสแล้วคัดลอกด้วยตนเอง"); } }}><WorkspaceIcon name="copy" size={17}/>คัดลอกรหัส</button>
      </div>
      <p role="status" className="inline-feedback">{message}</p>
      <p className="detail-footnote">รายละเอียดจากรายการติดตาม · กด Esc เพื่อกลับไปยังรายการเดิม</p>
    </div>
  </dialog>;
}

type SavedView = { id: string; name: string; settings: ViewSettings };

function SavedViews({ storageKey, settings, apply }: { storageKey: string; settings: ViewSettings; apply: (settings: ViewSettings) => void }) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const ref = useRef<HTMLDetailsElement>(null);
  function loadViews() {
    try {
      const raw: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
      setViews(Array.isArray(raw) ? raw.filter((item): item is SavedView => Boolean(item && typeof item.id === "string" && typeof item.name === "string" && item.settings && typeof item.settings.query === "string" && typeof item.settings.status === "string" && ["all", "mine", "urgent", "today"].includes(item.settings.view) && ["priority", "due", "title"].includes(item.settings.sort))).slice(0, 8) : []);
    } catch { setMessage("อ่านมุมมองที่บันทึกไว้ไม่สำเร็จ"); }
  }
  function save(next: SavedView[], feedback: string) {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setViews(next); setMessage(feedback); return true; }
    catch { setMessage("บันทึกไม่สำเร็จ โปรดตรวจสอบการอนุญาตพื้นที่จัดเก็บของเบราว์เซอร์"); return false; }
  }
  return <details className="saved-views" ref={ref} onToggle={(event) => { if (event.currentTarget.open) loadViews(); }} onKeyDown={(event) => { if (event.key === "Escape" && ref.current) { ref.current.open = false; ref.current.querySelector("summary")?.focus(); } }}>
    <summary className="secondary-action"><WorkspaceIcon name="save" size={17}/>มุมมองที่บันทึกไว้<WorkspaceIcon name="chevron" size={16}/></summary>
    <div className="saved-views-popover">
      <strong>มุมมองของฉัน</strong><p>เก็บตัวกรองและการเรียงลำดับในเบราว์เซอร์นี้</p>
       {views.length ? <ul>{views.map((view) => <li key={view.id}><button type="button" className="saved-view-link" onClick={() => { apply(view.settings); if (ref.current) ref.current.open = false; }}><TruncatedText text={view.name} lines={1}/></button><button type="button" className="round-btn" aria-label={`ลบมุมมอง ${view.name}`} onClick={() => save(views.filter((item) => item.id !== view.id), "ลบมุมมองแล้ว")}><WorkspaceIcon name="close" size={16}/></button></li>)}</ul> : <p className="muted">ยังไม่มีมุมมองที่บันทึกไว้</p>}
      <form onSubmit={(event) => { event.preventDefault(); if (!name.trim() || views.length >= 8) return; if (save([...views, { id: crypto.randomUUID(), name: name.trim(), settings }], "บันทึกมุมมองแล้ว")) setName(""); }}>
        <label htmlFor="saved-view-name">ชื่อมุมมอง</label><input id="saved-view-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="เช่น งานเร่งด่วนของฉัน" required/>
        <button className="primary" type="submit" disabled={views.length >= 8}>บันทึกมุมมองปัจจุบัน</button>{views.length >= 8 && <p>บันทึกได้สูงสุด 8 มุมมอง</p>}
      </form><p role="status" className="inline-feedback">{message}</p>
    </div>
  </details>;
}

export function WorkspaceQueue({ snapshot, userId, moduleId, preview, showMetrics = false }: {
  snapshot: DashboardSnapshot; userId: string; moduleId?: ModuleId; preview: boolean; showMetrics?: boolean;
}) {
  const openerRef = useRef<HTMLElement | null>(null);
  const params = useSearchParams();
  const pathname = usePathname();
  const settings = readViewSettings(params);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [selectionScope, setSelectionScope] = useState("");
  const [message, setMessage] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(Boolean(settings.status));
  const selectAllRef = useRef<HTMLInputElement>(null);
  const sources = snapshot.sources.filter((source) => !moduleId || source.moduleId === moduleId);
  const items = snapshot.items.filter((item) => !moduleId || item.moduleId === moduleId);
  const hasData = sources.some((source) => source.status === "ready");
  const unavailable = sources.some((source) => source.status === "unavailable");
  const partial = hasData && sources.some((source) => source.status !== "ready");
  const rows = filterQueue(items, settings, userId, snapshot.generatedAt);
  const size = moduleId ? 20 : 8;
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const requestedPage = Number(params.get("page") || 1);
  const page = Math.min(pageCount, Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1);
  const visible = rows.slice((page - 1) * size, page * size);
  const scope = JSON.stringify([settings, page, preview, moduleId]);
  const selected = selectionScope === scope ? visible.filter((item) => selection.has(recordKey(item))) : [];
  const selectedKeys = new Set(selected.map(recordKey));
  const activeRecord = items.find((item) => item.id === params.get("record") && (!params.get("module") || item.moduleId === params.get("module")));
  const statuses = [...new Set(items.map((item) => item.statusLabel))].sort((a, b) => a.localeCompare(b, "th"));
  const counts: Record<QueueView, number> = { all: items.length, urgent: items.filter((item) => item.priority === "urgent").length, today: items.filter((item) => isDueToday(item, snapshot.generatedAt)).length, mine: items.filter((item) => item.ownerId === userId).length };

  useEffect(() => { if (selectAllRef.current) selectAllRef.current.indeterminate = selected.length > 0 && selected.length < visible.length; }, [selected.length, visible.length]);

  function update(values: Record<string, string | null>, push = false) {
    const next = new URLSearchParams(params.toString());
    Object.entries(values).forEach(([key, value]) => { if (value) next.set(key, value); else next.delete(key); });
    const href = `${pathname}${next.size ? `?${next}` : ""}`;
    if (push) window.history.pushState(null, "", href); else window.history.replaceState(null, "", href);
  }
  function changeSettings(values: Partial<ViewSettings>) {
    const next = { ...settings, ...values };
    update({ q: next.query, view: next.view === "all" ? null : next.view, status: next.status, sort: next.sort === "priority" ? null : next.sort, page: null, record: null, module: null });
    setMessage("");
  }
  function toggleItem(item: DashboardItem) {
    const next = new Set(selectedKeys); const key = recordKey(item);
    if (next.has(key)) next.delete(key); else next.add(key);
    setSelection(next); setSelectionScope(scope); setMessage("");
  }

  return <>
    {showMetrics && <section className="attention-strip" aria-label="เลือกกลุ่มงานที่ต้องติดตาม">{(Object.keys(viewLabels) as QueueView[]).map((view) => <button type="button" key={view} className={`attention-item ${settings.view === view ? "active" : ""} ${view}`} aria-pressed={settings.view === view} onClick={() => changeSettings({ view })}>
      <span>{view === "all" ? "รายการที่ต้องติดตาม" : viewLabels[view]}</span><strong>{hasData ? <AnimatedNumber value={counts[view]}/> : "—"}</strong><small>{hasData ? partial ? "รายการ · ข้อมูลบางส่วน" : "รายการ" : "รอข้อมูล"}<WorkspaceIcon name="arrow" size={16}/></small>
    </button>)}</section>}
    <section className="queue-section" aria-labelledby="queue-heading">
      <div className="section-heading-row"><div><h2 id="queue-heading">รายการที่ต้องติดตาม</h2><p>{moduleId ? "ค้นหาและเปิดรายละเอียด โดยเก็บมุมมองการทำงานไว้" : "เลือกงานที่ต้องทำต่อจากทุกระบบในที่เดียว"}</p></div><span className="queue-total">{hasData ? `${items.length.toLocaleString("th-TH")} รายการ${preview ? "ตัวอย่าง" : ""}` : "รอเชื่อมข้อมูล"}</span></div>
      {!showMetrics && <div className="queue-views" aria-label="มุมมองรายการ">{(Object.keys(viewLabels) as QueueView[]).map((view) => <button type="button" key={view} className={settings.view === view ? "active" : ""} aria-pressed={settings.view === view} onClick={() => changeSettings({ view })}>{viewLabels[view]}<span>{hasData ? counts[view] : "—"}</span></button>)}</div>}
      <div className="queue-toolbar">
        <label className="queue-search"><WorkspaceIcon name="search" size={18}/><input type="search" aria-label="ค้นหาในรายการ" placeholder="ค้นหาชื่ออาคาร รหัส หรือผู้รับผิดชอบ…" maxLength={200} value={settings.query} onChange={(event) => changeSettings({ query: event.target.value })}/></label>
        <button type="button" className={`secondary-action ${filtersOpen ? "is-active" : ""}`} aria-expanded={filtersOpen} aria-controls="queue-filters" onClick={() => setFiltersOpen(!filtersOpen)}><WorkspaceIcon name="filter" size={18}/>ตัวกรอง{settings.status && <span className="filter-count">1</span>}</button>
        <SavedViews storageKey={`permission-next:views:${userId}:${moduleId || "overview"}:${preview ? "preview" : "live"}`} settings={settings} apply={changeSettings}/>
      </div>
      {filtersOpen && <div className="queue-filters" id="queue-filters"><label>สถานะ<select value={settings.status} onChange={(event) => changeSettings({ status: event.target.value })}><option value="">ทุกสถานะ</option>{statuses.map((status) => <option key={status}>{status}</option>)}{settings.status && !statuses.includes(settings.status) && <option>{settings.status}</option>}</select></label><label>เรียงตาม<select value={settings.sort} onChange={(event) => changeSettings({ sort: event.target.value as ViewSettings["sort"] })}><option value="priority">ความเร่งด่วน</option><option value="due">กำหนดใกล้ที่สุด</option><option value="title">ชื่อรายการ ก–ฮ</option></select></label><button type="button" className="text-btn" onClick={() => changeSettings({ query: "", status: "", sort: "priority", view: "all" })}>ล้างตัวกรองทั้งหมด</button></div>}
      {partial && <div className="queue-notice" role="status"><WorkspaceIcon name="info" size={17}/>แสดงข้อมูลบางส่วน บางระบบยังเชื่อมต่อไม่ได้ ดูสถานะข้อมูลด้านล่าง</div>}
      {sources.some((source) => source.itemCount >= 500) && <p className="queue-notice">แสดงรายการติดตามสูงสุด 500 รายการต่อระบบ ตรวจสอบรายการทั้งหมดในระบบต้นทาง</p>}
      {selected.length > 0 && <div className="batch-toolbar"><strong>เลือก {selected.length} รายการในหน้านี้</strong><button type="button" className="secondary-action" onClick={async () => {
        try { await navigator.clipboard.writeText(selected.map((item) => item.code || item.id).join("\n")); setMessage(`คัดลอกรหัส ${selected.length} รายการแล้ว`); }
        catch { setMessage("คัดลอกไม่สำเร็จ กรุณาลองอีกครั้ง"); }
      }}><WorkspaceIcon name="copy" size={17}/>คัดลอกรหัสที่เลือก</button><button type="button" className="text-btn" onClick={() => setSelection(new Set())}>ยกเลิกการเลือก</button></div>}
      <p role="status" className="inline-feedback">{message}</p>
      <div className="table-scroll" role="region" aria-label="ตารางรายการติดตาม เลื่อนแนวนอนได้" tabIndex={0}>
        <table className="workspace-table"><caption className="sr-only">รายการติดตามที่คุณมีสิทธิ์ดู เปิดรายละเอียดด้วยปุ่มชื่อรายการ</caption><thead><tr>
          <th className="selection-cell"><input type="checkbox" ref={selectAllRef} aria-label="เลือกทุกรายการในหน้านี้" checked={visible.length > 0 && selected.length === visible.length} disabled={!visible.length} onChange={(event) => { setSelection(event.target.checked ? new Set(visible.map(recordKey)) : new Set()); setSelectionScope(scope); }}/></th>
          <th scope="col" aria-sort={settings.sort === "title" ? "ascending" : "none"}><button type="button" onClick={() => changeSettings({ sort: "title" })}>{moduleId === "buildings" ? "อาคาร / รายการติดตาม" : "รายการ / อาคาร"}{settings.sort === "title" && " ↑"}</button></th>
          <th scope="col">ผู้รับผิดชอบ</th><th scope="col" aria-sort={settings.sort === "due" ? "ascending" : "none"}><button type="button" onClick={() => changeSettings({ sort: "due" })}>กำหนด{settings.sort === "due" && " ↑"}</button></th><th scope="col">สถานะ</th>
        </tr></thead><tbody>
          {visible.map((item) => <tr key={recordKey(item)} className={selectedKeys.has(recordKey(item)) ? "selected" : ""}>
            <td className="selection-cell"><input type="checkbox" aria-label={`เลือก ${item.code || item.title}`} checked={selectedKeys.has(recordKey(item))} onChange={() => toggleItem(item)}/></td>
             <td className="record-cell"><button className="record-title" type="button" onClick={event => { openerRef.current=event.currentTarget; update({ record: item.id, module: item.moduleId }, true); }}><TruncatedText text={moduleId === "buildings" && item.buildingName ? item.buildingName : item.title} lines={1}/><WorkspaceIcon name="arrow" size={16}/></button><div className="record-subtitle"><span className="record-code">{item.code || kindLabels[item.kind]}</span><TruncatedText text={moduleId === "buildings" ? item.title : item.buildingName || getModule(item.moduleId)?.name || ""} lines={1}/>{!moduleId && <TruncatedText className="record-source" text={getModule(item.moduleId)?.name || ""} lines={1}/>}</div></td>
             <td className="owner-cell"><span className="owner-dot" aria-hidden="true">{(item.ownerName || "—").slice(0, 1)}</span><TruncatedText text={item.ownerName || "ยังไม่ระบุ"} lines={1}/></td>
            <td><span className="due-date">{formatWorkspaceDate(item.dueAt)}</span><span className={`priority-label ${item.priority}`}>{priorityLabels[item.priority]}</span></td>
             <td><span className="status-badge neutral"><TruncatedText text={item.statusLabel} lines={1}/></span></td>
          </tr>)}
          {!visible.length && <tr><td colSpan={5}><div className="queue-empty"><span className="empty-icon"><WorkspaceIcon name={hasData ? "search" : unavailable ? "refresh" : (getModule(moduleId ?? "")?.icon ?? "work")} size={28}/></span><h3>{hasData ? items.length ? "ไม่พบรายการที่ตรงกับตัวกรอง" : "ไม่มีรายการที่ต้องติดตาม" : unavailable ? "เชื่อมต่อข้อมูลไม่สำเร็จ" : "อยู่ระหว่างเตรียมข้อมูล"}</h3><p>{hasData ? items.length ? "ลองเปลี่ยนคำค้นหรือเลือกมุมมองทั้งหมด" : "ยังไม่มีรายการติดตามส่งมาจากระบบต้นทาง" : unavailable ? "ข้อมูลอาจไม่พร้อมใช้งานชั่วคราว ลองอัปเดตอีกครั้ง" : "รายการจะแสดงที่นี่เมื่อเชื่อมต่อระบบต้นทางแล้ว หากต้องใช้งาน กรุณาติดต่อผู้ดูแลระบบ"}</p>{hasData && items.length > 0 ? <button className="secondary-action" type="button" onClick={() => changeSettings({ query: "", status: "", view: "all" })}>แสดงรายการทั้งหมด</button> : unavailable ? <RefreshButton/> : null}</div></td></tr>}
        </tbody></table>
      </div>
      <footer className="queue-footer"><span role="status">{hasData ? rows.length ? `แสดง ${(page - 1) * size + 1}–${Math.min(page * size, rows.length)} จาก ${rows.length} รายการ` : "0 รายการ" : "ยังไม่มีข้อมูลพร้อมแสดง"}</span><div className="pagination"><button className="secondary-action" type="button" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>ก่อนหน้า</button><span>หน้า {page} / {pageCount}</span><button className="secondary-action" type="button" disabled={page >= pageCount} onClick={() => update({ page: String(page + 1) })}>ถัดไป</button></div></footer>
    </section>
    {activeRecord && <DetailPanel key={recordKey(activeRecord)} item={activeRecord} preview={preview} opener={openerRef} onClose={() => update({ record: null, module: null })}/>}
    {params.get("record") && !activeRecord && <div className="queue-notice" role="status">รายการนี้ไม่อยู่ในข้อมูลติดตามที่เข้าถึงได้ในขณะนี้<button type="button" className="text-btn" onClick={() => update({ record: null, module: null })}>ปิดข้อความ</button></div>}
  </>;
}
