"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { WorkspaceIcon } from "@/components/workspace-icon";
import { logoutAction } from "@/app/login/actions";

export function AccountControl({ displayName }: { displayName: string }) {
  const [open, setOpen] = useState(false);
  const popoverId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, []);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="account-control" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape" && open) { event.stopPropagation(); setOpen(false); triggerRef.current?.focus(); } }}>
      <button
        ref={triggerRef}
        className="account-trigger"
        aria-label={`บัญชีผู้ใช้ ${displayName}`}
        aria-controls={popoverId}
        aria-expanded={open}
        onClick={toggle}
        type="button"
      >
        <span className="avatar-circle" aria-hidden="true">
          {initials}
        </span>
        <span className="avatar-name">{displayName}</span>
        <WorkspaceIcon name="chevron" size={16} />
      </button>
      <div
        ref={popoverRef}
        className={`account-popover${open ? " open" : ""}`}
        id={popoverId}
        role="region"
        aria-label="บัญชีผู้ใช้"
        hidden={!open}
      >
        <strong>{displayName}</strong>
        <p>แสดงข้อมูลตามสิทธิ์ของบัญชีคุณ</p>
        <form action={logoutAction}>
          <button className="btn-logout" type="submit">
            ออกจากระบบ
          </button>
        </form>
      </div>
    </div>
  );
}
