"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createLiveRefreshLoop, liveRefreshTiming } from "@/lib/live-refresh";
import { workMutationEvent } from "@/lib/work-mutation-signal";
import { RefreshButton } from "@/components/workspace-feedback";

export function WorkLiveRefresh({ initialUpdatedAt }: { initialUpdatedAt: string }) {
  const router = useRouter(), pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const completion = useRef<{ resolve: () => void; reject: () => void } | null>(null);
  const transitionPending = useRef(false);
  const coordinator = useRef<ReturnType<typeof createLiveRefreshLoop> | null>(null);
  const enabled = ["/work", "/work/mine", "/work/team", "/work/assign", "/work/people", "/work/tracker", "/work/kpi", "/work/reports"].includes(pathname);
  useEffect(() => {
    transitionPending.current = pending;
    if (!pending && completion.current) {
      if (document.querySelector(".work-state-unavailable")) completion.current.reject();
      else completion.current.resolve();
      completion.current = null;
    }
  }, [pending]);
  useEffect(() => {
    if (!enabled) return;
    const dirty = new Set<HTMLFormElement>();
    const ready = () => {
      for (const form of dirty) if (!form.isConnected) dirty.delete(form);
      return !transitionPending.current && document.visibilityState === "visible" && navigator.onLine && !dirty.size && !document.querySelector('dialog[open], [aria-modal="true"], [data-live-refresh-pause], form[aria-busy="true"]');
    };
    const loop = createLiveRefreshLoop({ ready, refresh: async () => {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => { completion.current = null; reject(new Error("REFRESH_TIMEOUT")); }, liveRefreshTiming.requestTimeout);
        completion.current = { resolve: () => { clearTimeout(timeout); resolve(); }, reject: () => { clearTimeout(timeout); reject(new Error("REFRESH_FAILED")); } };
        startTransition(() => router.refresh());
      });
      setUpdatedAt(new Date().toISOString());
    } });
    coordinator.current = loop;
    const input = (event: Event) => { const target = event.target; if (target instanceof HTMLElement) { const form = target.closest("form"); if (form) dirty.add(form); } };
    const reset = (event: Event) => { if (event.target instanceof HTMLFormElement) { dirty.delete(event.target); loop.resume(); } };
    const resume = () => loop.resume();
    const mutation = () => loop.request();
    const closed = (event: Event) => { if (event.target instanceof HTMLDialogElement) for (const form of event.target.querySelectorAll("form")) dirty.delete(form); loop.resume(); };
    const broadcast = (event: MessageEvent) => { if (event.data === "changed") loop.request(); };
    let channel: BroadcastChannel | undefined;
    try { if (typeof BroadcastChannel === "function") { channel = new BroadcastChannel("pn-work"); channel.addEventListener("message", broadcast); } } catch { /* poll fallback */ }
    document.addEventListener("input", input); document.addEventListener("change", input);
    document.addEventListener("reset", reset); document.addEventListener("close", closed, true);
    document.addEventListener("visibilitychange", resume); window.addEventListener("online", resume);
    window.addEventListener(workMutationEvent, mutation);
    return () => { loop.stop(); coordinator.current = null; completion.current?.reject(); completion.current = null; channel?.close();
      document.removeEventListener("input", input); document.removeEventListener("change", input); document.removeEventListener("reset", reset);
      document.removeEventListener("close", closed, true); document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume); window.removeEventListener(workMutationEvent, mutation); };
  }, [enabled, pathname, router]);
  if (!enabled) return null;
  const latestUpdatedAt = initialUpdatedAt > updatedAt ? initialUpdatedAt : updatedAt;
  return <div className="work-live-refresh"><small>อัปเดตล่าสุด <time dateTime={latestUpdatedAt}>{new Date(latestUpdatedAt).toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" })}</time></small><RefreshButton onRefresh={() => coordinator.current?.request()} refreshPending={pending} /></div>;
}
