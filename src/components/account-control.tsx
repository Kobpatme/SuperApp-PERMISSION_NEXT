"use client";

import { useEffect, useRef, useState } from "react";
import { WorkspaceIcon } from "@/components/workspace-icon";
import { logoutAction } from "@/app/login/actions";

export function AccountControl({ displayName }: { displayName: string }) {
  const rootRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) rootRef.current.open = false;
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, []);

  return <details className="account-control" ref={rootRef} onKeyDown={(event) => {
    if (event.key === "Escape" && rootRef.current) { rootRef.current.open = false; summaryRef.current?.focus(); }
  }}>
    <summary ref={summaryRef} className="account-trigger" aria-label={`บัญชีผู้ใช้ ${displayName}`}>
      <span className="avatar-circle" aria-hidden="true">{displayName.slice(0, 2).toUpperCase()}</span>
      <span className="avatar-name">{displayName}</span><WorkspaceIcon name="chevron" size={16}/>
    </summary>
    <div className="account-popover">
      <strong>{displayName}</strong><p>แสดงข้อมูลตามสิทธิ์ของบัญชีคุณ</p>
      <form action={logoutAction}><button className="secondary-action" type="submit">ออกจากระบบ</button></form>
    </div>
  </details>;
}
