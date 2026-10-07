"use client";
import { useEffect,useId,useRef } from "react";
export function CarBookingDialog({title,children,busy,onClose}:{title:string;children:React.ReactNode;busy:boolean;onClose:()=>void}) {
 const ref=useRef<HTMLDialogElement>(null),titleId=useId();
 useEffect(()=>{const dialog=ref.current,previous=document.activeElement as HTMLElement|null;dialog?.showModal();return()=>{dialog?.close();if(previous?.isConnected)previous.focus();};},[]);
 return <dialog ref={ref} className="cb-dialog" aria-labelledby={titleId} onCancel={event=>{event.preventDefault();if(!busy)onClose();}}><div className="cb-section-head"><h2 id={titleId}>{title}</h2><button type="button" disabled={busy} onClick={onClose} aria-label="ปิดหน้าต่าง">ปิด</button></div>{children}</dialog>;
}
