"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiRead, errorText } from "./api-client";
import { subscribeChanges } from "./change-signals";
export function useResource<T>(path: string | null, paused = false) {
  const [state, setState] = useState<{ data?: T; path?: string | null; error: string; loading: boolean; at?: string }>({ error: "", loading: true });
  const [online, setOnline] = useState(true);
  const [changed, setChanged] = useState(false);
  const [realtime, setRealtime] = useState("connecting");
  const request = useRef<AbortController | null>(null), latest = useRef<T | undefined>(undefined), pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  const refresh = useCallback(async (automatic = false) => {
    if (!path || !navigator.onLine || document.visibilityState === "hidden") return;
    // Preserve the foreground load when a concurrent change hint arrives.
    if (automatic && request.current && !request.current.signal.aborted) return;
    if (automatic && pausedRef.current && latest.current !== undefined) { setChanged(true); return; }
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    try {
      const data = await apiRead<T>(path, controller.signal);
      if (!controller.signal.aborted) {
        if (automatic && pausedRef.current && latest.current !== undefined) { setChanged(JSON.stringify(data) !== JSON.stringify(latest.current)); return; }
        latest.current = data; setChanged(false); setState({ data, path, error: "", loading: false, at: new Date().toISOString() });
      }
    } catch (error) { if (!controller.signal.aborted) setState(previous => ({ ...previous, data: previous.path === path ? previous.data : undefined, path, error: errorText(error), loading: false })); }
    finally { if (request.current === controller) request.current = null; }
  }, [path]);
  useEffect(() => subscribeChanges((invalidate, status) => { setRealtime(status); if (invalidate) void refresh(true); }), [refresh]);
  useEffect(() => {
    latest.current = undefined;
    void refresh(); const interval = setInterval(() => void refresh(true), 15000);
    const connect = () => { setOnline(navigator.onLine); if (navigator.onLine) void refresh(true); };
    Promise.resolve().then(connect);
    window.addEventListener("online", connect); window.addEventListener("offline", connect); document.addEventListener("visibilitychange", connect);
    return () => { clearInterval(interval); request.current?.abort(); window.removeEventListener("online", connect); window.removeEventListener("offline", connect); document.removeEventListener("visibilitychange", connect); };
  }, [refresh]);
  return { ...state, data: path && state.path === path ? state.data : undefined, error: path ? state.error : "", loading: !!path && (state.path !== path || state.loading), online, changed, realtime, refresh };
}
