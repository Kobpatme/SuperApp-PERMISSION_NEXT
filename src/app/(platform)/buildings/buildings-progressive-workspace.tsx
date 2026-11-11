"use client";
import { useEffect, useState, type ComponentProps } from "react";
import { sessionFetch } from "@/lib/session-fetch";
import { BuildingsWorkspace } from "./buildings-workspace";
import type { listPermissionBuildings } from "@/lib/permission-building-server";
type Page = Awaited<ReturnType<typeof listPermissionBuildings>>;
type Props = ComponentProps<typeof BuildingsWorkspace> & { nextCursor: string | null; queryParams: string };
/** Render the first usable batch immediately; hydrate the remaining map scope after paint. */
export function BuildingsProgressiveWorkspace({ nextCursor, queryParams, ...props }: Props) {
  const [loaded, setLoaded] = useState({ items: props.buildings, remaining: nextCursor, error: false });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (props.initialView !== "map" || !nextCursor) return;
    const controller = new AbortController(); let cursor = nextCursor, count = props.buildings.length;
    const read = async () => {
      try {
        while (cursor && count < 10000) {
          const params = new URLSearchParams(queryParams); params.delete("before"); params.set("after", cursor); params.set("limit", String(Math.max(20, Math.min(500, 10000 - count))));
          const response = await sessionFetch(`/api/buildings/list?${params}`, { signal: controller.signal });
          if (!response.ok) throw new Error("MAP_UNAVAILABLE");
          const page: Page = await response.json();
          if (controller.signal.aborted) return;
          if (page.state !== "ready" || page.nextCursor === cursor) throw new Error("MAP_UNAVAILABLE");
          count += page.items.length; cursor = page.nextCursor ?? "";
          setLoaded(previous => ({ items: [...new Map([...previous.items, ...page.items].map(item => [item.id, item])).values()].slice(0, 10000), remaining: page.nextCursor, error: false }));
        }
      } catch { if (!controller.signal.aborted) setLoaded(previous => ({ ...previous, error: true })); }
    };
    void read(); return () => controller.abort();
  }, [nextCursor, queryParams, props.buildings, props.initialView, retry]);
  return <>
    {loaded.remaining && <p role="status">{loaded.error ? "โหลดอาคารเพิ่มเติมไม่สำเร็จ ข้อมูลที่แสดงยังไม่ครบ" : loaded.items.length >= 10000 ? "แสดงสูงสุด 10,000 อาคาร กรุณาใช้ตัวกรองเพื่อลดขอบเขต" : `กำลังโหลดข้อมูลแผนที่เพิ่มเติม · ${loaded.items.length.toLocaleString("th-TH")} อาคาร`}{loaded.error && <button type="button" onClick={() => setRetry(value => value + 1)}>ลองโหลดเพิ่มเติม</button>}</p>}
    <BuildingsWorkspace {...props} buildings={loaded.items} loadedCount={loaded.items.length} truncated={!!loaded.remaining} />
  </>;
}
