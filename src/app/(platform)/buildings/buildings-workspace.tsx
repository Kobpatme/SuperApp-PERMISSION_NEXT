"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type { PermissionBuildingRow } from "@/lib/permission-building-server";
import { BuildingMap } from "./building-map";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { TruncatedText } from "@/components/ui/truncated-text";

type FilterKey = "status" | "group" | "type" | "installType" | "surveyType" | "area";
type Filters = Record<FilterKey, string>;
const emptyFilters: Filters = { status: "", group: "", type: "", installType: "", surveyType: "", area: "" };
const statuses = ["Permission Confirmed", "MOU", "Check Permission", "อาคารปิดถาวร"];
const number = (value: number) => new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(value);
const fieldLabels: Record<FilterKey, string> = { status: "สถานะ", group: "กลุ่ม", type: "ประเภท", installType: "รูปแบบ", surveyType: "การสำรวจ", area: "พื้นที่" };
const feeGroups = [
  { title: "ค่าใช้จ่ายครั้งแรก", type: "CAPEX" }, { title: "ค่าใช้จ่ายรายเดือน", type: "OPEX_MONTHLY" },
  { title: "ค่าใช้จ่ายรายปี", type: "OPEX_ANNUAL" }, { title: "เงินประกัน / เงินมัดจำ", type: "DEPOSIT" },
  { title: "รายการอื่นที่ต้องตรวจสอบ", type: "UNCLASSIFIED" },
];
type DocumentFile = { name: string; category: "dwg" | "pdf" | "image"; extension: string; size: number; modifiedAt: string; href: string };
type DocumentState = { key: string; status: "loading" | "ready" | "empty" | "error"; files: DocumentFile[]; message: string };
const categoryLabels: Record<DocumentFile["category"], string> = { dwg: "แบบ DWG", pdf: "เอกสาร PDF", image: "รูปภาพ" };
const formatBytes = (size: number) => size < 1024 ? `${number(size)} B` : size < 1024 ** 2 ? `${number(size / 1024)} KB` : `${number(size / 1024 ** 2)} MB`;
const formatDate = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("th-TH"); };

function optionsFor(buildings: PermissionBuildingRow[], key: FilterKey) {
  return [...new Set(buildings.map((item) => item[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "th"));
}

function matchesBuildingQuery(text: string, query: string) {
  return query.split(/\s+/).filter(Boolean).every((token) => text.includes(token));
}

export function BuildingsWorkspace({ buildings, total, initialQuery = "", initialFilters = emptyFilters }: { buildings: PermissionBuildingRow[]; total: number; initialQuery?: string; initialFilters?: Filters }) {
  const router = useRouter(), pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);
  const [previousInitialQuery, setPreviousInitialQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<Filters>({
    status: initialFilters.status ?? "",
    group: initialFilters.group ?? "",
    type: initialFilters.type ?? "",
    installType: initialFilters.installType ?? "",
    surveyType: initialFilters.surveyType ?? "",
    area: initialFilters.area ?? "",
  });
  const initialFilterSignature = [initialFilters.status, initialFilters.group, initialFilters.type, initialFilters.installType, initialFilters.surveyType, initialFilters.area].join("\u0000");
  const [previousInitialFilterSignature, setPreviousInitialFilterSignature] = useState(initialFilterSignature);
  if (initialQuery !== previousInitialQuery) {
    setPreviousInitialQuery(initialQuery);
    if (query !== initialQuery) setQuery(initialQuery);
  }
  if (initialFilterSignature !== previousInitialFilterSignature) {
    setPreviousInitialFilterSignature(initialFilterSignature);
    setFilters({ status: initialFilters.status ?? "", group: initialFilters.group ?? "", type: initialFilters.type ?? "",
      installType: initialFilters.installType ?? "", surveyType: initialFilters.surveyType ?? "", area: initialFilters.area ?? "" });
  }
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"general" | "contact" | "fee" | "documents">("general");
  const [documentState, setDocumentState] = useState<DocumentState | null>(null);
  const [documentReload, setDocumentReload] = useState(0);
  const [copyMessage, setCopyMessage] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const selected = buildings.find((item) => item.id === selectedId) ?? null;
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().normalize("NFC").toLocaleLowerCase("th-TH");
  const withoutStatus = useMemo(() => buildings.filter((item) => {
    const text = [item.nameTh, item.nameEn, item.location, item.code]
      .filter(Boolean).join(" ").normalize("NFC").toLocaleLowerCase("th-TH");
    return matchesBuildingQuery(text, normalizedQuery) &&
      (Object.keys(filters) as FilterKey[]).every((key) => key === "status" || !filters[key] || item[key] === filters[key]);
  }), [buildings, filters, normalizedQuery]);
  const visible = useMemo(() => withoutStatus.filter((item) => !filters.status || item.status === filters.status), [withoutStatus, filters.status]);
  const suggestions = normalizedQuery ? buildings.filter((item) => {
    const text = [item.nameTh, item.nameEn, item.code, item.location].filter(Boolean).join(" ").normalize("NFC").toLocaleLowerCase("th-TH");
    return matchesBuildingQuery(text, normalizedQuery);
  }).slice(0, 10) : [];
  const activeFilterCount = (Object.keys(filters) as FilterKey[]).filter((key) => filters[key]).length;
  const selectedDetailFilters = (Object.keys(filters) as FilterKey[]).filter((key) => key !== "status" && filters[key]);
  const mappedCount = visible.filter((item) => item.lat !== null && item.lng !== null).length;
  const unmappedCount = visible.length - mappedCount;
  const durationDays = selected && /^\d+(?:\.\d+)?$/.test(selected.duration) ? `${selected.duration} วัน` : "";
  const horizontalMeters = selected && /^\d+(?:\.\d+)?$/.test(selected.maxHorizontal) ? `${selected.maxHorizontal} เมตร` : "";
  const invalidDuration = Boolean(selected?.duration && !durationDays);
  const invalidHorizontal = Boolean(selected?.maxHorizontal && !horizontalMeters);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      (Object.keys(filters) as FilterKey[]).forEach(key => { if (filters[key]) params.set(key, filters[key]); });
      router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [filters, pathname, query, router]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (selected && dialog && !dialog.open) dialog.showModal();
    if (!selected && dialog?.open) dialog.close();
  }, [selected]);

  useEffect(() => {
    if (tab !== "documents" || !selected) return;
    const building = selected;
    const controller = new AbortController();
    let timedOut = false;
    const timer = window.setTimeout(() => { timedOut = true; controller.abort(); }, 60000);
    const params = new URLSearchParams({ nameTh: building.nameTh, nameEng: building.nameEn || "", area: building.area });
    fetch(`/api/nas/building-documents?${params}`, { signal: controller.signal, cache: "no-store" }).then(async (response) => {
      if (response.status === 404) { setDocumentState({ key: building.id, status: "empty", files: [], message: "ไม่พบโฟลเดอร์เอกสารของอาคารนี้ใน NAS" }); return; }
      if (!response.ok) throw new Error(response.status === 403 ? "บัญชีนี้ไม่มีสิทธิ์ดูเอกสาร" : "ยังเชื่อมคลังเอกสาร NAS ไม่ได้");
      const raw: unknown = await response.json();
      const source = raw && typeof raw === "object" && "files" in raw && Array.isArray(raw.files) ? raw.files : [];
      const files: DocumentFile[] = source.flatMap((entry: unknown) => {
        if (!entry || typeof entry !== "object") return [];
        const file = entry as Record<string, unknown>;
        const category = String(file.category || "");
        const href = String(file.download_url || "");
        if (!Object.hasOwn(categoryLabels, category) || !String(file.name || "") || !href.startsWith("/api/nas/download?token=")) return [];
        return [{ name: String(file.name), category: category as DocumentFile["category"], extension: String(file.extension || ""),
          size: Number(file.size) || 0, modifiedAt: String(file.modified_at || ""), href }];
      });
      setDocumentState({ key: building.id, status: files.length ? "ready" : "empty", files, message: files.length ? "" : "พบโฟลเดอร์แล้ว แต่ยังไม่มีเอกสารที่ระบบรองรับ" });
    }).catch((error: unknown) => { if (timedOut || !controller.signal.aborted) setDocumentState({ key: building.id, status: "error", files: [], message: timedOut ? "ค้นหาเอกสารนานเกิน 60 วินาที" : error instanceof Error ? error.message : "ค้นหาเอกสารไม่สำเร็จ" });
    }).finally(() => window.clearTimeout(timer));
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [selected, tab, documentReload]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && !selected && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLSelectElement)) {
        event.preventDefault(); searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  function openBuilding(item: PermissionBuildingRow) { setSelectedId(item.id); setTab("general"); setDocumentState(null); setFocused(false); }
  function selectTab(next: typeof tab) {
    if (next === "documents" && selected) setDocumentState({ key: selected.id, status: "loading", files: [], message: "กำลังค้นหาเอกสารใน NAS…" });
    setTab(next);
  }
  function retryDocuments() {
    if (selected) setDocumentState({ key: selected.id, status: "loading", files: [], message: "กำลังค้นหาเอกสารใน NAS…" });
    setDocumentReload((current) => current + 1);
  }
  async function copyValue(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(`คัดลอก${label}แล้ว`);
    } catch {
      setCopyMessage(`คัดลอก${label}ไม่ได้ กรุณาตรวจสิทธิ์การใช้คลิปบอร์ด`);
    }
    window.setTimeout(() => setCopyMessage(""), 2500);
  }
  function searchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && suggestions.length) { event.preventDefault(); setSuggestionIndex((current) => Math.min(current + 1, suggestions.length - 1)); }
    if (event.key === "ArrowUp" && suggestions.length) { event.preventDefault(); setSuggestionIndex((current) => Math.max(current - 1, 0)); }
    if (event.key === "Enter" && suggestions.length) { event.preventDefault(); const item = suggestions[suggestionIndex >= 0 ? suggestionIndex : 0]; setQuery(item.nameTh); openBuilding(item); }
    if (event.key === "Escape") { setFocused(false); setSuggestionIndex(-1); searchRef.current?.blur(); }
  }
  function setFilter(key: FilterKey, value: string) { setFilters((current) => ({ ...current, [key]: value })); }
  function reset() { setQuery(""); setFilters(emptyFilters); setFocused(false); searchRef.current?.focus(); }
  const mapUrl = selected?.lat !== null && selected?.lng !== null && selected ? `https://www.openstreetmap.org/?mlat=${selected.lat}&mlon=${selected.lng}#map=17/${selected.lat}/${selected.lng}` : null;

  return <section className="permission-workspace" aria-label="ข้อมูลอาคารและค่าใช้จ่าย">
    <header className="permission-toolbar">
      <div className="permission-toolbar-title"><h1>อาคารและค่าใช้จ่าย</h1><span>ค้นหาและตรวจสอบข้อมูลอาคาร</span></div>
      <div className="permission-search" role="search">
        <span aria-hidden="true">⌕</span>
        <input ref={searchRef} value={query} onChange={(event) => { setQuery(event.target.value); setSuggestionIndex(-1); }} onFocus={() => setFocused(true)} onKeyDown={searchKeyDown}
          onBlur={() => window.setTimeout(() => setFocused(false), 130)} placeholder="ค้นหาอาคาร... ภาษาไทย หรือ English" aria-label="ค้นหาอาคาร" autoComplete="off" />
        {query && <button type="button" className="permission-search-clear" onClick={() => { setQuery(""); searchRef.current?.focus(); }} aria-label="ล้างการค้นหา">×</button>}
        {focused && normalizedQuery && <div className="permission-autocomplete" role="listbox" aria-label="ผลการค้นหาอาคาร">
          {suggestions.length ? suggestions.map((item, index) => <button type="button" role="option" aria-selected={suggestionIndex === index} key={item.id}
            onMouseDown={(event) => event.preventDefault()} onClick={() => { setQuery(item.nameTh); openBuilding(item); }}>
             <i className={`permission-status-dot ${statusClass(item.status)}`} /><span className="permission-autocomplete-copy"><TruncatedText text={item.nameTh} lines={1}/><TruncatedText text={[item.nameEn, item.area, item.status].filter(Boolean).join(" · ")} lines={1}/></span>
          </button>) : <p>ไม่พบอาคารที่ตรงกับคำค้นหา</p>}
        </div>}
      </div>
      <div className="permission-quick-status" aria-label="กรองตามสถานะอาคาร">
        {statuses.map((status) => <button type="button" key={status} className={filters.status === status ? "active" : ""} aria-pressed={filters.status === status}
          onClick={() => setFilter("status", filters.status === status ? "" : status)}>
          <strong>{number(withoutStatus.filter((item) => item.status === status).length)}</strong><span>{statusLabel(status)}</span>
        </button>)}
      </div>
      <button type="button" className="permission-filter-toggle" aria-expanded={filtersOpen} aria-controls="permission-filters" onClick={() => setFiltersOpen((open) => !open)}>
        ตัวกรอง{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}<span aria-hidden="true">{filtersOpen ? "⌃" : "⌄"}</span>
      </button>
      <div className="permission-toolbar-metrics">
        <span className="permission-result-count" aria-live="polite"><strong>{number(visible.length)}</strong><span>{query || activeFilterCount ? `จาก ${number(total)} อาคาร` : "อาคารทั้งหมด"}</span></span>
        <span className="permission-map-count"><strong>{number(mappedCount)}</strong> มีพิกัด{unmappedCount > 0 ? ` · ${number(unmappedCount)} ไม่มีพิกัด` : ""}</span>
      </div>
    </header>

    {filtersOpen && <div id="permission-filters" className="permission-filterbar">
      {(Object.keys(fieldLabels) as FilterKey[]).map((key) => <label key={key}>
        <span className="permission-filter-label">{fieldLabels[key]}</span>
        <select value={filters[key]} onChange={(event) => setFilter(key, event.target.value)} aria-label={`กรองตาม${fieldLabels[key]}`}>
          <option value="">ทั้งหมด</option>
          {(key === "status" ? statuses : optionsFor(buildings, key)).map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>)}
      <button type="button" className="permission-reset" onClick={reset} disabled={!query && activeFilterCount === 0}>รีเซ็ต</button>
    </div>}
    {selectedDetailFilters.length > 0 && <div className="permission-filter-chips" aria-label="ตัวกรองที่เลือก">
       {selectedDetailFilters.map((key) => <button type="button" key={key} onClick={() => setFilter(key, "")}>{fieldLabels[key]}: <TruncatedText text={filters[key]} lines={1}/> ×</button>)}
    </div>}
    {copyMessage && <div className="permission-copy-status" role="status">{copyMessage}</div>}

    <div className="permission-main">
      <div className="permission-map-area">
        <BuildingMap buildings={visible} selectedId={selectedId} onOpenDetails={(id) => { const item = buildings.find((entry) => entry.id === id); if (item) openBuilding(item); }} />
        {visible.length === 0 && <div className="permission-map-empty" role="status"><strong>ไม่พบอาคารที่ตรงกับเงื่อนไข</strong><span>ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง</span><button type="button" onClick={reset}>ล้างการค้นหาและตัวกรอง</button></div>}
      </div>
      <aside className="permission-list" aria-label="รายการอาคารที่ค้นพบ">
        <header className="permission-list-head"><div><small>ผลการค้นหา</small><h2>รายการอาคาร</h2></div><span>{number(visible.length)} รายการ</span></header>
        <div className="permission-list-scroll" role="listbox" aria-label="เลือกอาคารเพื่อดูรายละเอียด">
          {visible.length ? visible.map((item) => <button type="button" role="option" aria-selected={selectedId === item.id} key={item.id}
            className={`permission-list-item${selectedId === item.id ? " selected" : ""}`} onClick={() => openBuilding(item)}>
            <strong><TruncatedText text={item.nameTh || item.code} lines={2}/></strong>
            <small><TruncatedText text={[item.nameEn, item.area, item.province].filter(Boolean).join(" · ") || "ไม่มีข้อมูลพื้นที่"} lines={1}/></small>
            <span className="permission-list-tags"><em className={statusClass(item.status)}>{statusLabel(item.status)}</em>{item.group && <em>{item.group}</em>}</span>
          </button>) : <div className="permission-empty"><strong>ไม่พบอาคาร</strong><span>ลองแก้คำค้นหาหรือตัวกรองเพื่อดูรายการ</span><button type="button" onClick={reset}>ล้างตัวกรอง</button></div>}
        </div>
      </aside>
    </div>

    <dialog ref={dialogRef} className="permission-drawer" aria-label={selected ? `รายละเอียด ${selected.nameTh}` : "รายละเอียดอาคาร"} onClose={() => setSelectedId(null)}>
       {selected && <><div className="permission-drawer-head"><div><small>รายละเอียดอาคาร</small><h2><TruncatedText text={selected.nameTh} lines={2}/></h2><TruncatedText className="permission-drawer-name-en" text={selected.nameEn || "ไม่มีชื่อภาษาอังกฤษ"} lines={2}/><div className="permission-list-tags">{[selected.group, selected.surveyType, selected.type, selected.installType].filter(Boolean).map((tag) => <em key={tag}><TruncatedText text={tag as string} lines={1}/></em>)}</div><Link className="secondary-action" href={`/buildings/${selected.id}`}>เปิด Building 360</Link></div><button type="button" onClick={() => dialogRef.current?.close()} aria-label="ปิดรายละเอียด">×</button></div>
         <div className="permission-drawer-summary"><div><span>สถานะ Permission</span><strong className={statusClass(selected.status)}><TruncatedText text={selected.status || "—"} lines={1}/></strong></div><div><span>พื้นที่ / จังหวัด</span><TruncatedText text={[selected.area, selected.province].filter(Boolean).join(" · ") || "—"} lines={2}/></div><div><span>ข้อมูลล่าสุด</span><TruncatedText text={selected.updateDate || "ไม่ระบุวันที่"} lines={1}/></div></div>
        {(!selected.wmPoint || selected.feeReviewRequired || invalidDuration || invalidHorizontal) && <div className="permission-drawer-alert" role="status"><strong>ข้อมูลที่ควรตรวจสอบ</strong>{!selected.wmPoint && <span>ยังไม่มีข้อมูลจุดเชื่อมต่อ WM</span>}{invalidDuration && <span>ระยะดำเนินการไม่ใช่จำนวนวัน</span>}{invalidHorizontal && <span>ระยะสายแนวนอนไม่ใช่จำนวนเมตร</span>}{selected.feeReviewRequired && <span>ค่าใช้จ่ายจาก CSV รอตรวจสอบ</span>}</div>}
        <div className="permission-drawer-tabs" role="tablist" aria-label="รายละเอียดอาคาร">
          {([ ["general", "ภาพรวม"], ["contact", "ผู้ติดต่อ"], ["fee", "ค่าใช้จ่าย"], ["documents", "เอกสาร"] ] as const).map(([key, label]) => <button type="button" role="tab" aria-selected={tab === key} key={key} onClick={() => selectTab(key)}>{label}{key === "documents" && documentState?.key === selected.id && documentState.status === "ready" ? ` (${documentState.files.length})` : ""}</button>)}
        </div>
        <div className="permission-drawer-content" role="tabpanel">
          {tab === "general" && <><h3>ข้อมูลการติดตั้ง</h3><dl className="permission-info-grid">
            <Info label="ทำเล / โซน" value={selected.location}/><Info label="ระยะดำเนินการ Permission" value={durationDays}/>
           <Info label="จุดเชื่อมต่อ (WM)" value={selected.wmPoint}/><Info label="ตู้เชื่อมต่อ" value={selected.enclosure}/>
            <Info label="ระยะสายแนวนอนสูงสุด" value={horizontalMeters}/><Info label="ที่อยู่" value={selected.address}/>
           </dl>{selected.lat !== null && selected.lng !== null && <div className="permission-coordinate"><span>พิกัด</span><code>{selected.lat}, {selected.lng}</code><button type="button" onClick={() => void copyValue("พิกัด", `${selected.lat}, ${selected.lng}`)}>คัดลอกพิกัด</button></div>}{selected.remark && <details className="permission-remark"><summary>หมายเหตุจากข้อมูลเดิม</summary><TruncatedText text={selected.remark} lines={3}/></details>}
          {!selected.location && !durationDays && !selected.wmPoint && !selected.enclosure && !horizontalMeters && !selected.address && !selected.remark && <p className="permission-empty-inline">ยังไม่มีข้อมูลการติดตั้งเพิ่มเติม</p>}</>}
          {tab === "contact" && <><h3>ผู้ติดต่อ</h3><div className="permission-contact">
             {splitValues(selected.contact, /[,/]/).length > 0 && <div className="permission-contact-name"><span>ชื่อผู้ติดต่อ</span><TruncatedText text={splitValues(selected.contact, /[,/]/).join(" / ")} lines={2}/></div>}
             {[...splitValues(selected.phone, /[,/]/), ...splitValues(selected.mobile, /[,/]/)].map((value, index) => <div key={`${value}-${index}`}><TruncatedText text={value} lines={1}/><span className="permission-contact-actions"><a href={`tel:${value.replace(/[^+\d]/g, "")}`}>โทร</a><button type="button" onClick={() => void copyValue("หมายเลขโทรศัพท์", value)}>คัดลอก</button></span></div>)}
             {splitValues(selected.email, /[,;]/).map((value) => <div key={value}><TruncatedText className="text-safe" text={value} lines={2}/><span className="permission-contact-actions"><a href={`mailto:${value}`}>ส่งอีเมล</a><button type="button" onClick={() => void copyValue("อีเมล", value)}>คัดลอก</button></span></div>)}
            {!selected.contact && !selected.phone && !selected.mobile && !selected.email && <p className="permission-empty-inline">ยังไม่มีข้อมูลผู้ติดต่อ</p>}
          </div></>}
          {tab === "fee" && <><h3>ค่าใช้จ่ายของอาคาร</h3>{selected.feeReviewRequired && <p className="permission-data-warning">มีค่าดิบจากต้นทางบางรายการที่ยังตรวจสอบรูปแบบไม่ผ่าน จึงแสดงแยกไว้ด้านล่าง และไม่นำรายการเหล่านั้นไปคำนวณรวมเป็นยอด</p>}
            {selected.boq?.fees.some((fee) => fee.calculation_type === "revenue_share" ? fee.rate : fee.amount) ? <>
               {feeGroups.map((group) => { const fees = selected.boq?.fees.filter((fee) => feeInGroup(fee, group.type) && (fee.calculation_type === "revenue_share" ? fee.rate : fee.amount)) ?? []; return fees.length ? <section key={group.type} className="permission-fee-group"><h4><TruncatedText text={group.title} lines={1}/><span>{fees.length} รายการ</span></h4><div>{fees.map((fee) => <div key={fee.key}><span><TruncatedText text={fee.label} lines={2}/><small>{fee.calculation_type === "revenue_share" ? `ส่วนแบ่งรายได้${fee.revenue_period === "annual" ? "รายปี" : "รายเดือน"}` : fee.unit !== "ครั้ง" ? `อัตราต่อ${fee.unit}` : fee.cost_type}</small></span><strong><TruncatedText text={fee.calculation_type === "revenue_share" ? `${number(fee.rate ?? 0)}%` : `${number(fee.amount ?? 0)} บาท`} lines={1}/></strong></div>)}</div></section> : null; })}
              <p className="permission-fee-note">ยอดมีรอบการชำระและหน่วยต่างกัน จึงไม่รวมเป็นยอดเดียว</p>
            </> : !selected.feeReviewRequired && <p className="permission-empty-inline">ยังไม่มีข้อมูลค่าใช้จ่าย</p>}
             {selected.feeReviewRequired && selected.feeReviewValues.length > 0 && <section className="permission-fee-group permission-fee-review"><h4>รายการรอตรวจสอบ<span>{selected.feeReviewValues.length} รายการ</span></h4><div>{selected.feeReviewValues.map((fee) => <div key={fee.sourceField}><span><TruncatedText text={fee.label} lines={2}/><small>ค่าจากต้นทาง</small></span><TruncatedText className="text-safe" text={fee.rawValue} lines={2}/></div>)}</div></section>}
          </>}
          {tab === "documents" && <><div className="permission-doc-heading"><h3>เอกสารอาคารจาก NAS</h3><button type="button" onClick={retryDocuments} disabled={documentState?.status === "loading"}>ค้นหาใหม่</button></div>
            {documentState?.key !== selected.id || documentState.status !== "ready" ? <div className={`permission-doc-state ${documentState?.status === "error" ? "error" : ""}`} role="status"><strong>{documentState?.key === selected.id ? documentState.message : "กำลังค้นหาเอกสาร…"}</strong>{documentState?.status === "error" && <button type="button" onClick={retryDocuments}>ลองอีกครั้ง</button>}</div> :
               (["dwg", "pdf", "image"] as const).map((category) => { const files = documentState.files.filter((file) => file.category === category); return files.length ? <section key={category} className="permission-doc-group"><h4>{categoryLabels[category]} <span>{files.length}</span></h4>{files.map((file, index) => <div key={`${file.name}-${index}`} className="permission-doc-row"><span className="permission-doc-ext">{file.extension.toUpperCase()}</span><div><TruncatedText className="text-safe" text={file.name} lines={2}/><small>{formatBytes(file.size)} · {formatDate(file.modifiedAt)}</small></div><a href={file.href} download={file.name}>ดาวน์โหลด</a></div>)}</section> : null; })}
          </>}
        </div>
        <div className="permission-drawer-actions"><span>ข้อมูลจาก PostgreSQL กลาง · อ่านอย่างเดียว</span><div>{mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer">เปิดในแผนที่</a>}<button type="button" onClick={() => dialogRef.current?.close()}>ปิด</button></div></div>
      </>}
    </dialog>
  </section>;
}

function Info({ label, value }: { label: string; value: string }) { return value ? <div><dt>{label}</dt><dd><TruncatedText text={value} lines={3}/></dd></div> : null; }
function splitValues(value: string, separator: RegExp) { return value.split(separator).map((item) => item.trim()).filter(Boolean); }
function feeInGroup(fee: NonNullable<PermissionBuildingRow["boq"]>["fees"][number], group: string) {
  if (group === "OPEX_ANNUAL") return fee.cost_type === "OPEX" && (fee.source_field === "annual_fee" || fee.revenue_period === "annual");
  if (group === "OPEX_MONTHLY") return fee.cost_type === "OPEX" && fee.source_field !== "annual_fee" && fee.revenue_period !== "annual";
  return fee.cost_type === group;
}
function statusLabel(status: string) { return status === "Permission Confirmed" ? "ยืนยันแล้ว" : status === "MOU" ? "MOU" : status === "Check Permission" ? "รอตรวจสอบ" : "ปิดถาวร"; }
function statusClass(status: string) { return status === "Permission Confirmed" ? "status-confirmed" : status === "MOU" ? "status-mou" : status === "อาคารปิดถาวร" ? "status-closed" : "status-check"; }
