"use client";
import { useActionState } from "react";
import { setModuleEnabledAction } from "@/app/(platform)/admin/module-actions";
type Item = { id: string; name: string; enabled: boolean; version: number; ready: boolean };
function ModuleForm({ item }: { item: Item }) {
  const [state, action, pending] = useActionState(setModuleEnabledAction, { ok: false, message: "" });
  return <form action={action} className="admin-panel"><h3>{item.name}</h3><p>{item.enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}{!item.ready && " · กำลังพัฒนา"}</p>
    <input type="hidden" name="moduleId" value={item.id}/><input type="hidden" name="version" value={item.version}/><input type="hidden" name="enabled" value={String(!item.enabled)}/>
    <button className="secondary-action" disabled={pending || !item.ready}>{pending ? "กำลังบันทึก…" : item.enabled ? "ปิดโมดูล" : "เปิดโมดูล"}</button><p role="status">{state.message}</p>
  </form>;
}
export function AdminModuleSettings({ items, available }: { items: Item[]; available: boolean }) {
  if (!available) return <p role="status">ยังไม่ได้ติดตั้งข้อมูลตั้งค่าโมดูล กรุณาติดต่อผู้ดูแลระบบ</p>;
  return <>{items.map(item => <ModuleForm key={`${item.id}:${item.version}`} item={item}/>)}</>;
}
