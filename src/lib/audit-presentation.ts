export type AuditJson = Record<string, unknown> | null | undefined;

const actionLabels: Record<string, string> = {
  "user.create": "เพิ่มผู้ใช้",
  "user.access.update": "ปรับสิทธิ์ผู้ใช้",
  "user.password.reset": "รีเซ็ตรหัสผ่าน",
  "user.sessions.revoke": "ยกเลิกเซสชัน",
  "role.create": "สร้างบทบาท",
  "role.delete": "ลบบทบาท",
  "role.permissions.update": "แก้สิทธิ์บทบาท",
  "position.create": "เพิ่มตำแหน่ง",
  "position.update": "แก้ตำแหน่ง",
  "team.create": "เพิ่มทีม",
  "team.update": "แก้ทีม",
  "team.deactivate": "ปิดใช้งานทีม",
  "module.enabled.changed": "เปลี่ยนสถานะโมดูล",
  "auth.session.superseded": "แทนที่เซสชันเดิม",
};

const fieldLabels: Record<string, string> = {
  displayName: "ชื่อที่แสดง", email: "อีเมล", employeeCode: "รหัสพนักงาน", status: "สถานะบัญชี",
  positionId: "ตำแหน่ง", teamId: "ทีมหลัก", scopeType: "ขอบเขตข้อมูล", selectedTeamIds: "ทีมที่เลือก",
  roleId: "บทบาท", code: "รหัส", name: "ชื่อ", description: "คำอธิบาย",
  capabilityCodes: "สิทธิ์ที่กำหนด", capabilityScopeOverrides: "ขอบเขตเฉพาะสิทธิ์",
  moduleId: "โมดูล", enabled: "เปิดใช้งาน", version: "เวอร์ชัน",
};

export function auditActionLabel(action: string) {
  return actionLabels[action] ?? action;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length ? `${value.length} รายการ` : "ไม่มี";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Field-level changes, already labelled in Thai, for the expandable audit detail. */
export function auditDiff(entry: { before?: AuditJson; after?: AuditJson }) {
  const before = entry.before ?? {};
  const after = entry.after ?? {};
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((key) => formatValue(before[key]) !== formatValue(after[key]))
    .map((key) => ({ field: key, label: fieldLabels[key] ?? key, before: formatValue(before[key]), after: formatValue(after[key]) }));
}

/** One Thai sentence an administrator can read without knowing action codes. */
export function summarizeAudit(entry: { action: string; before?: AuditJson; after?: AuditJson }): string {
  const before = entry.before ?? {};
  const after = entry.after ?? {};
  if (entry.action === "role.permissions.update") {
    const name = String(after.name ?? before.name ?? "บทบาท");
    const added = strings(after.capabilityCodes).filter((code) => !strings(before.capabilityCodes).includes(code));
    const removed = strings(before.capabilityCodes).filter((code) => !strings(after.capabilityCodes).includes(code));
    return `${auditActionLabel(entry.action)} "${name}" · เพิ่ม ${added.length} · ถอด ${removed.length}`;
  }
  if (entry.action === "module.enabled.changed") {
    const moduleId = String(after.moduleId ?? before.moduleId ?? "");
    return `${auditActionLabel(entry.action)} "${moduleId}" เป็น ${after.enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}`;
  }
  const changes = auditDiff(entry);
  return changes.length ? `${auditActionLabel(entry.action)} · เปลี่ยน ${changes.length} รายการ` : auditActionLabel(entry.action);
}
