"use client";

import { useEffect, useRef, useState } from "react";

type FrameState = "loading" | "ready" | "error";

export function MaxiwaFrame() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<FrameState>("loading");
  const [message, setMessage] = useState("กำลังเชื่อมต่อ MAXIWA KPI…");

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === "MAXIWA_APP_READY") setState("ready");
      if (event.data?.type === "MAXIWA_BOOT_ERROR") {
        setState("error");
        setMessage(event.data.message || "ไม่สามารถเชื่อมต่อ MAXIWA KPI ได้");
      }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);

  return (
    <section className="module-frame-page maxiwa-frame-page">
      {state !== "ready" && (
        <div className={`module-frame-status ${state === "error" ? "is-error" : ""}`} role="status">
          <span className="module-frame-status-mark">M</span>
          <div><strong>{state === "error" ? "เชื่อมต่อ MOD 1 ไม่สำเร็จ" : "MAXIWA KPI"}</strong><small>{message}</small></div>
        </div>
      )}
      <iframe ref={frameRef} className={`module-frame ${state === "ready" ? "is-ready" : ""}`} src="/legacy/maxiwa?embedded=super-app" title="MAXIWA KPI" loading="eager" referrerPolicy="same-origin" sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals" />
    </section>
  );
}
