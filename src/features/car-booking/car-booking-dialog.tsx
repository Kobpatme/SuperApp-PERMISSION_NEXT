"use client";

import { useRef, useState } from "react";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";

/** Domain adapter: shared focus/pending ownership, plus explicit draft disposal. */
export function CarBookingDialog({ title, children, busy, onClose, protectDraft = false }: {
  title: string; children: React.ReactNode; busy: boolean; onClose: () => void; protectDraft?: boolean;
}) {
  const dirty = useRef(false);
  const [discard, setDiscard] = useState(false);
  return <>
    <Dialog open title={title} className="cb-dialog" busy={busy}
      beforeClose={() => { if (protectDraft && dirty.current) { setDiscard(true); return false; } return true; }}
      onOpenChange={open => { if (!open) onClose(); }}>
      <div onChangeCapture={() => { dirty.current = true; }}>
        <fieldset className="cb-pending-fields" disabled={busy} aria-busy={busy || undefined}>{children}</fieldset>
      </div>
    </Dialog>
    <ConfirmDialog open={discard} title="ทิ้งข้อมูลที่กรอกไว้หรือไม่" consequence="ข้อมูลที่ยังไม่ได้บันทึกจะถูกทิ้ง การจองเดิมจะไม่เปลี่ยนแปลง" confirmLabel="ทิ้งข้อมูล"
      onCancel={() => setDiscard(false)} onConfirm={() => { setDiscard(false); onClose(); }} />
  </>;
}
