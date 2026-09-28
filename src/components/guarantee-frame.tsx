"use client";

import { useEffect, useRef, useState } from "react";
import type { Role } from "@/lib/authorization";

export function GuaranteeFrame({ email, displayName, role }: { email: string; displayName: string; role: Role }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const syncSession = () => frame.contentWindow?.postMessage({ type: "SUPER_APP_SESSION", session: { email, display_name: displayName, role } }, window.location.origin);
    const receive = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.source === frame.contentWindow && event.data?.type === "GUARANTEE_APP_READY") {
        setReady(true);
        syncSession();
      }
    };
    frame.addEventListener("load", syncSession);
    window.addEventListener("message", receive);
    return () => { frame.removeEventListener("load", syncSession); window.removeEventListener("message", receive); };
  }, [displayName, email, role]);

  return <section className="module-frame-page guarantee-frame-page" aria-busy={!ready}>
    {!ready && <div className="module-frame-status" role="status"><span className="module-frame-status-mark">G</span><div><strong>คืนเงินประกัน</strong><small>กำลังโหลดรายการและสถานะเอกสาร…</small></div></div>}
    <iframe ref={frameRef} className={`module-frame ${ready ? "is-ready" : "is-loading"}`} src="/legacy/guarantee?embedded=super-app" title="ระบบขอคืนเงินประกันอาคาร" loading="eager" referrerPolicy="same-origin" sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals" />
  </section>;
}
