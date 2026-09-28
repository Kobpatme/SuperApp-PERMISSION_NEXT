"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { modules, overviewDestination, type ModuleId } from "@/lib/module-registry";
import { WorkspaceIcon } from "@/components/workspace-icon";

type SearchResult = { id: string; title: string; description: string; href: string; moduleId?: ModuleId };
type SearchResponse = { results: SearchResult[]; ready: boolean; partial: boolean };

export function WorkspaceSearch({ allowedModuleIds }: { allowedModuleIds: ModuleId[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const preview = params.get("preview") === "1";
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [remote, setRemote] = useState<{ query: string; data?: SearchResponse; error?: boolean }>({ query: "" });
  const [retry, setRetry] = useState(0);
  const needle = query.trim();

  const destinations = useMemo(() => [overviewDestination, ...modules.filter((module) => allowedModuleIds.includes(module.id))]
    .filter((item) => `${item.name} ${item.description} ${item.searchTerms.join(" ")}`.toLowerCase().includes(needle.toLowerCase()))
    .map((item): SearchResult => ({ id: item.id, title: item.name, description: "เปิดพื้นที่ทำงาน", href: `${item.href}${preview ? "?preview=1" : ""}` })), [allowedModuleIds, needle, preview]);

  useEffect(() => {
    const controller = new AbortController();
    if (!open || needle.length < 2) return;
    const timer = window.setTimeout(async () => {
      try {
        const search = new URLSearchParams({ q: needle, ...(preview ? { preview: "1" } : {}) });
        const response = await fetch(`/api/workspace/search?${search}`, { signal: controller.signal });
        if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error("Search unavailable");
        const data: SearchResponse = await response.json();
        if (!controller.signal.aborted) setRemote({ query: needle, data });
      } catch { if (!controller.signal.aborted) setRemote({ query: needle, error: true }); }
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [open, needle, preview, retry]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      const editing = (event.target as HTMLElement | null)?.matches("input, textarea, select, [contenteditable='true']");
      if (((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") || (event.key === "/" && !editing)) {
        event.preventDefault(); inputRef.current?.focus(); setOpen(true);
      }
    };
    const outside = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    window.addEventListener("keydown", shortcut); window.addEventListener("pointerdown", outside);
    return () => { window.removeEventListener("keydown", shortcut); window.removeEventListener("pointerdown", outside); };
  }, []);

  const data = needle.length >= 2 && remote.query === needle ? remote.data : undefined;
  const error = needle.length >= 2 && remote.query === needle && remote.error;
  const results = [...destinations, ...(data?.results || [])];
  const active = Math.min(activeIndex, Math.max(0, results.length - 1));
  const loading = needle.length >= 2 && !data && !error;
  function goTo(href: string) { setOpen(false); setQuery(""); inputRef.current?.blur(); router.push(href); }

  return <div className="workspace-search" ref={rootRef} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }}>
    <label className="search" htmlFor="workspace-search-input"><WorkspaceIcon name="search" size={19}/>
      <input ref={inputRef} id="workspace-search-input" value={query} maxLength={200} placeholder="ค้นหาเมนูและรายการติดตาม…" aria-label="ค้นหาเมนูและรายการติดตาม" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={open ? listboxId : undefined} aria-activedescendant={open && results[active] ? `${listboxId}-${active}` : undefined} autoComplete="off"
        onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); setOpen(true); }} onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
          if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActiveIndex(Math.min(active + 1, Math.max(0, results.length - 1))); }
          if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex(Math.max(0, active - 1)); }
          if (event.key === "Enter" && open && results[active]) { event.preventDefault(); goTo(results[active].href); }
        }}/><kbd>Ctrl K</kbd>
    </label>
    {open && <div className="workspace-search-popover">
      <p className="workspace-search-heading">{needle ? "ผลการค้นหาตามสิทธิ์ของคุณ" : "ไปยังพื้นที่ทำงาน"}</p>
      <div id={listboxId} role="listbox" aria-label="ผลการค้นหา" className="workspace-search-results">
        {results.map((result, index) => <div key={result.id} id={`${listboxId}-${index}`} role="option" aria-selected={active === index} className={`workspace-search-result ${active === index ? "active" : ""}`} onMouseEnter={() => setActiveIndex(index)} onMouseDown={(event) => event.preventDefault()} onClick={() => goTo(result.href)}>
          <WorkspaceIcon name={result.moduleId || "arrow"}/><span><strong>{result.title}</strong><small>{result.description}</small></span><WorkspaceIcon name="arrow" size={16}/>
        </div>)}
      </div>
      <div className="search-feedback" role="status">
        {loading ? "กำลังค้นหารายการ…" : error ? "ค้นหารายการไม่สำเร็จ" : needle.length === 1 ? "พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหารายการ" : data && !data.ready ? "ยังไม่ได้เชื่อมข้อมูลรายการ คุณยังค้นหาเมนูได้" : !results.length ? "ไม่พบข้อมูล ลองค้นหาด้วยชื่ออาคารหรือรหัสรายการ" : data?.partial ? "แสดงเฉพาะข้อมูลจากระบบที่เชื่อมต่อได้" : ""}
      </div>
      {error && <button className="text-btn" type="button" onClick={() => { setRemote({ query: "" }); setRetry((value) => value + 1); }}>ลองค้นหาอีกครั้ง</button>}
      <div className="workspace-search-footer"><span>↑ ↓ เลือก · Enter เปิด · Esc ปิด</span><span>ค้นหาในรายการติดตามที่เชื่อมต่อแล้ว</span></div>
    </div>}
  </div>;
}
