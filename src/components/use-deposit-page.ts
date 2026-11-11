"use client";
import { useEffect, useState } from "react";
import { sessionFetch } from "@/lib/session-fetch";
import type { DepositListPage } from "@/lib/deposit-list-server";
export function useDepositPage(params: string, enabled: boolean) {
  const [result, setResult] = useState<{ key: string; data?: DepositListPage; error?: string }>();
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await sessionFetch(`/api/guarantees/list?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error("โหลดรายการทั้งหมดไม่สำเร็จ กรุณาลองค้นหาอีกครั้ง");
        const data: DepositListPage = await response.json();
        if (!controller.signal.aborted) setResult({ key: params, data });
      } catch { if (!controller.signal.aborted) setResult({ key: params, error: "โหลดรายการทั้งหมดไม่สำเร็จ กรุณาลองค้นหาอีกครั้ง" }); }
    }, 180);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [params, enabled]);
  return { data: enabled && result?.key === params ? result.data : undefined, loading: enabled && result?.key !== params, error: enabled && result?.key === params ? result.error : undefined };
}
