"use client";
import { sessionFetch } from "@/lib/session-fetch";
import { copy } from "@/lib/copy";


import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import "./delete-building.css";

const errors: Record<string, string> = {
  forbidden: "บัญชีนี้ไม่มีสิทธิ์ลบอาคาร กรุณาตรวจสิทธิ์กับผู้ดูแลระบบ",
  authentication_required: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง",
  not_found: "ไม่พบอาคารนี้ อาจถูกลบไปแล้ว กรุณากลับไปหน้ารายการ",
  building_changed: "ข้อมูลอาคารเปลี่ยนไปแล้ว กรุณาโหลดหน้าใหม่ก่อนลบ",
  confirmation_mismatch: "ชื่ออาคารที่ยืนยันไม่ตรงกับข้อมูลปัจจุบัน",
  building_has_dependencies: "ลบไม่ได้ เนื่องจากอาคารยังเชื่อมกับงาน โครงการ เงินประกัน ใบเสนอราคา หรือเอกสาร กรุณาจัดการรายการที่เกี่ยวข้องก่อน",
};

export function DeleteBuilding({ id, name, version }: { id: string; name: string; version: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const pendingRef = useRef(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pendingRef.current || confirmation.trim() !== name) return;
    pendingRef.current = true;
    setPending(true); setMessage("");
    try {
      const response = await sessionFetch(`/api/buildings/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationName: confirmation.trim(), version }) });
      const result = await response.json();
      if (!response.ok || result.deleted !== true) { setMessage(errors[result.error] ?? "ลบอาคารไม่สำเร็จ ข้อมูลยังไม่ถูกลบ กรุณาลองอีกครั้ง"); return; }
      setOpen(false);
      router.replace("/buildings");
      router.refresh();
    } catch { setMessage("เชื่อมต่อระบบไม่ได้ กรุณาตรวจสถานะอาคารก่อนลองอีกครั้ง"); }
    finally { pendingRef.current = false; setPending(false); }
  }

  return <>
    <button ref={trigger} type="button" className="building-delete-trigger" onClick={() => { setConfirmation(""); setMessage(""); setOpen(true); }}>ลบอาคาร</button>
    <Dialog open={open} onOpenChange={setOpen} busy={pending} beforeClose={() => !pendingRef.current} returnFocusRef={trigger} className="building-delete-dialog" title="ยืนยันลบอาคาร" description={copy.feedback.deleteBuildingWarning}>
      <form onSubmit={submit}>
        <strong className="building-delete-name">{name}</strong>
        <label>พิมพ์ชื่ออาคารให้ตรงเพื่อยืนยัน<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" disabled={pending} required /></label>
        {message && <p className="building-delete-error" role="alert">{message}</p>}
        <div className="building-delete-actions"><button type="button" disabled={pending} onClick={() => setOpen(false)}>ยกเลิก</button><button type="submit" className="building-delete-confirm" disabled={pending || confirmation.trim() !== name}>{pending ? "กำลังลบ…" : "ยืนยันลบอาคารถาวร"}</button></div>
      </form>
    </Dialog>
  </>;
}
