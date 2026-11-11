"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { transitionDepositWorkItem, type DepositActionState } from "@/app/(platform)/guarantees/actions";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const initial: DepositActionState = { ok: false, message: "" };
/** Presentation-only confirmation; allowed targets and validation remain server-owned. */
export function DepositTransitionForm({ id, version, targets }: {
  id: string; version: number; targets: Array<readonly [string, string]>;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [selected, setSelected] = useState<readonly [string, string] | null>(null);
  const [state, action, pending] = useActionState(async (previous: DepositActionState, data: FormData) => {
    const result = await transitionDepositWorkItem(previous, data);
    if (result.ok) { setSelected(null); setReason(""); }
    return result;
  }, initial);
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);
  function confirm() {
    if (!selected || pending) return;
    const data = new FormData();
    data.set("id", id); data.set("version", String(version));
    data.set("reason", reason); data.set("to", selected[0]);
    startTransition(() => action(data));
  }
  return <div className="deposit-transition">
    <label>เหตุผล<textarea className="ui-building-field" name="reason" value={reason} disabled={pending} onChange={event => setReason(event.target.value)} placeholder="เหตุผล (จำเป็นเมื่อส่งกลับหรือยกเลิก)" /></label>
    {targets.map(target => <Button key={target[0]} type="button" disabled={pending} variant={target[0] === "Cancel" ? "danger" : "secondary"} onClick={() => setSelected(target)}>{target[1]}</Button>)}
    {!targets.length && <p>ไม่มีขั้นตอนที่ต้องดำเนินการ</p>}
    {!selected && state.message && <p role={state.ok ? "status" : "alert"}>{state.message}</p>}
    <ConfirmDialog size="compact" open={Boolean(selected)} title="ยืนยันขั้นตอนเงินประกัน" consequence={selected ? `${selected[1]} · ระบบจะตรวจสอบสิทธิ์ เอกสาร และข้อมูลล่าสุดก่อนบันทึก` : undefined} confirmLabel="ยืนยันขั้นตอน" intent={selected?.[0] === "Cancel" ? "danger" : "primary"} pending={pending} onCancel={() => setSelected(null)} onConfirm={confirm}>
      <p className="deposit-confirm-reason">เหตุผล: {reason || "ไม่ได้ระบุ"}</p>
      {state.message && !state.ok && <p role="alert">{state.message}</p>}
    </ConfirmDialog>
  </div>;
}
