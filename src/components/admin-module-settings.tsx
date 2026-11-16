"use client";
import Link from "next/link";
import { AdminActionForm } from "@/components/admin-action-form";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useActionState } from "react";
import { setModuleEnabledAction } from "@/app/(platform)/admin/module-actions";

type Item = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  version: number;
  ready: boolean;
  lifecycle: string;
  entryPermissions: string[];
  visibleRoleCount?: number;
};

function lifecycleLabel(lifecycle: string) {
  const labels: Record<string, string> = {
    development: "กำลังพัฒนา",
    pilot: "ทดลองใช้",
    active: "ใช้งานจริง",
    maintenance: "กำลังบำรุงรักษา",
    disabled: "ปิดใช้งาน",
    retired: "เลิกใช้แล้ว",
  };
  return labels[lifecycle] || lifecycle;
}

function ModuleCard({ item }: { item: Item }) {
  const [state, action, pending] = useActionState(setModuleEnabledAction, { ok: false, message: "" });
  return (
    <AdminActionForm action={action} className="admin-module-card">
      <div className="admin-module-card-head">
        <div className="admin-module-card-info">
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <span className="admin-module-card-lifecycle">{lifecycleLabel(item.lifecycle)}</span>
        </div>
        <div className="admin-module-card-actions">
          <span className={`admin-status-badge ${item.enabled ? "admin-status-neutral" : ""}`}>
            {item.enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
          </span>
          {item.visibleRoleCount !== undefined && <Link className="admin-module-card-roles" href="/admin?section=roles">บทบาทที่เห็น {item.visibleRoleCount}</Link>}
        </div>
      </div>
      <input type="hidden" name="moduleId" value={item.id} />
      <input type="hidden" name="version" value={item.version} />
      <input type="hidden" name="enabled" value={String(!item.enabled)} />
      <Button
        type="submit"
        variant={item.enabled ? "danger" : "secondary"}
        disabled={pending || !item.ready}
      >
        {pending ? "กำลังบันทึก…" : item.enabled ? "ปิดโมดูล" : "เปิดโมดูล"}
      </Button>
      <p role="status">{state.message}</p>
    </AdminActionForm>
  );
}

export function AdminModuleSettings({ items, available }: { items: Item[]; available: boolean }) {
  if (!available) {
    return <p role="status">ยังไม่ได้ติดตั้งข้อมูลตั้งค่าโมดูล กรุณาติดต่อผู้ดูแลระบบ</p>;
  }
  return (
    <Panel
      className="admin-module-settings"
      title="การเปิดใช้งานโมดูล"
      description="เปิดหรือปิดแต่ละโมดูล โดยไม่เปลี่ยนสิทธิ์หรือข้อมูลเดิม ผู้ใช้จะมองเห็นโมดูลก็ต่อเมื่อโมดูลนั้นเปิดใช้งาน และบทบาทของผู้ใช้มีสิทธิ์เข้าถึงโมดูลนั้น"
    >
      <div className="admin-module-list">
        {items.map((item) => (
          <ModuleCard key={`${item.id}:${item.version}`} item={item} />
        ))}
      </div>
    </Panel>
  );
}
