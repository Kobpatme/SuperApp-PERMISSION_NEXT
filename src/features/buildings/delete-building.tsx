"use client";
import { sessionFetch } from "@/lib/session-fetch";
import { copy } from "@/lib/copy";


import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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
  const dialog = useRef<HTMLDialogElement>(null);
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
      dialog.current?.close();
      router.replace("/buildings");
      router.refresh();
    } catch { setMessage("เชื่อมต่อระบบไม่ได้ กรุณาตรวจสถานะอาคารก่อนลองอีกครั้ง"); }
    finally { pendingRef.current = false; setPending(false); }
  }

  return <>
    <button type="button" className="building-delete-trigger" onClick={() => { setConfirmation(""); setMessage(""); dialog.current?.showModal(); }}>ลบอาคาร</button>
    <dialog ref={dialog} className="building-delete-dialog" aria-labelledby="building-delete-title" aria-describedby="building-delete-description" onCancel={(event) => { if (pendingRef.current) event.preventDefault(); }}>
      <form onSubmit={submit}>
        <h2 id="building-delete-title">ยืนยันลบอาคาร</h2>
        <p id="building-delete-description">{copy.feedback.deleteBuildingWarning}</p>
        <strong className="building-delete-name">{name}</strong>
        <label>พิมพ์ชื่ออาคารให้ตรงเพื่อยืนยัน<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" disabled={pending} required /></label>
        {message && <p className="building-delete-error" role="alert">{message}</p>}
        <div className="building-delete-actions"><button type="button" disabled={pending} onClick={() => dialog.current?.close()}>ยกเลิก</button><button type="submit" className="building-delete-confirm" disabled={pending || confirmation.trim() !== name}>{pending ? "กำลังลบ…" : "ยืนยันลบอาคารถาวร"}</button></div>
      </form>
    </dialog>
  </>;
}
