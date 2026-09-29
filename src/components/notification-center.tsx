"use client";
import { useActionState, useRef } from "react";
import Link from "next/link";
import { markNotificationsRead } from "@/app/(platform)/notification-actions";
import type { NotificationInbox } from "@/lib/notification-inbox";
import { StatusBadge } from "@/components/ui/status-badge";

export function NotificationCenter({ inbox }: { inbox: NotificationInbox }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [state, action, pending] = useActionState(markNotificationsRead, { message: "" });
  if (inbox.state === "denied") return null;
  return <>
    <button ref={trigger} className="round-btn" type="button" aria-haspopup="dialog" aria-label={`การแจ้งเตือน ยังไม่อ่าน ${inbox.unread} รายการ`} onClick={() => dialog.current?.showModal()}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M9 21h6"/></svg>
      {inbox.unread > 0 && <span className="notification-count">{inbox.unread > 99 ? "99+" : inbox.unread}</span>}
    </button>
    <dialog ref={dialog} className="notification-dialog" aria-labelledby="notification-title" onClose={() => trigger.current?.focus()} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
      <header className="ui-toolbar"><h2 id="notification-title">การแจ้งเตือน</h2><button type="button" className="secondary-action" onClick={() => dialog.current?.close()}>ปิด</button></header>
      <p role="status">{state.message}</p>
      {inbox.state === "unavailable" ? <p role="alert">โหลดการแจ้งเตือนไม่สำเร็จ กรุณารีเฟรชหน้าเพื่อลองอีกครั้ง</p> : <>
        {inbox.canUpdate && inbox.unread > 0 && <form action={action}><input type="hidden" name="id" value="all"/><button className="secondary-action" disabled={pending}>อ่านทั้งหมด</button></form>}
        {!inbox.items.length && <p>ยังไม่มีการแจ้งเตือน</p>}
        <ul className="notification-list">{inbox.items.map(item => <li key={item.id}>
          <StatusBadge label={item.readAt ? "อ่านแล้ว" : "ยังไม่อ่าน"} tone={item.readAt ? "neutral" : "info"}/>
          {["high", "urgent"].includes(item.priority) && <StatusBadge label="ต้องให้ความสนใจ" tone="warning"/>}
          <h3>{item.href ? <Link href={item.href} onClick={() => dialog.current?.close()}>{item.title}</Link> : item.title}</h3>
          {item.body && <p>{item.body}</p>}<time dateTime={item.createdAt}>{new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(item.createdAt))}</time>
          {!item.readAt && inbox.canUpdate && <form action={action}><input type="hidden" name="id" value={item.id}/><button className="text-btn" disabled={pending}>ทำเครื่องหมายว่าอ่านแล้ว</button></form>}
        </li>)}</ul><p className="sub">แสดง 30 รายการล่าสุด</p>
      </>}
    </dialog>
  </>;
}
