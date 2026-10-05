import type { ModuleCapability } from "@/lib/module-contract";

const scopes = ["OWN", "TEAM", "SELECTED_TEAMS", "ALL"] as const;
function capability(code: string, labelTh: string, risk: ModuleCapability["risk"] = "normal", allowedScopes: ModuleCapability["allowedScopes"] = [...scopes]): ModuleCapability {
  return { code, labelTh, descriptionTh: labelTh, risk, allowedScopes };
}
export const workCapabilities = [
  capability("work.task.read", "ดูงาน"), capability("work.task.manage", "จัดการงาน", "sensitive"),
  capability("work.task.create", "เพิ่มงาน"), capability("work.task.update", "แก้ไขงาน"),
  capability("work.task.assign", "มอบหมายงาน", "sensitive"), capability("work.task.delete", "ลบและกู้คืนงาน", "sensitive"), capability("work.note.create", "เพิ่มบันทึกงาน"),
  capability("work.manual_entry.create", "บันทึกงานนอกระบบ"), capability("work.report.read", "ดูรายงานงาน"),
  capability("kpi.score.read", "ดูคะแนนและที่มาของ KPI"), capability("kpi.team.read", "ดู KPI ทีม"),
  capability("kpi.rule.manage", "จัดการกฎ KPI", "administrative"),
  capability("kpi.adjustment.request", "ขอปรับปรุง KPI", "sensitive"), capability("kpi.adjustment.approve", "อนุมัติการปรับปรุง KPI", "sensitive"),
];
export const buildingCapabilities = [
  capability("building.record.read", "ดูข้อมูลอาคาร", "normal", ["TEAM", "SELECTED_TEAMS", "ALL"]),
  capability("building.record.create", "เพิ่มอาคาร"), capability("building.record.update", "แก้ไขข้อมูลอาคาร"),
  capability("building.attachment.read", "ดูเอกสารอาคาร"), capability("building.attachment.upload", "อัปโหลดเอกสารอาคาร", "sensitive"),
  capability("pricing.estimate.read", "ดูใบเสนอราคา"), capability("pricing.estimate.create", "สร้างใบเสนอราคา"),
  capability("pricing.estimate.update", "แก้ไขใบเสนอราคา"), capability("pricing.estimate.submit", "ส่งตรวจใบเสนอราคา"),
  capability("pricing.estimate.approve", "อนุมัติใบเสนอราคา", "sensitive"),
];
export const guaranteeCapabilities = [
  capability("guarantee.case.read", "ดูเงินประกัน"), capability("guarantee.case.manage", "จัดการเวิร์กโฟลว์เงินประกัน", "sensitive"),
  capability("guarantee.case.create", "สร้างรายการเงินประกัน"), capability("guarantee.case.update", "แก้ไขรายการเงินประกัน", "sensitive"),
  capability("guarantee.refund.request", "ขอคืนเงินประกัน", "sensitive"), capability("guarantee.refund.approve", "อนุมัติคืนเงินประกัน", "sensitive"),
  capability("guarantee.refund.record", "บันทึกการคืนเงิน", "sensitive"), capability("guarantee.tl.work", "ดำเนินงานที่ได้รับมอบหมาย (TL)", "sensitive", ["OWN"]),
];
export const coreCapabilities = [
  capability("core.profile.read", "ดูผู้ใช้", "administrative", ["ALL"]), capability("core.profile.update", "แก้ไขโปรไฟล์", "administrative", ["ALL"]),
  capability("core.user.manage", "จัดการบัญชีและความปลอดภัย", "administrative", ["ALL"]),
  capability("core.position.manage", "จัดการตำแหน่ง", "administrative", ["ALL"]),
  capability("core.team.read", "ดูทีม", "administrative", ["ALL"]), capability("core.team.manage", "จัดการทีม", "administrative", ["ALL"]),
  capability("core.role.manage", "จัดการบทบาทและสิทธิ์", "administrative", ["ALL"]), capability("core.audit.read", "ดูประวัติการตรวจสอบ", "administrative", ["ALL"]),
  capability("activity.event.read", "ดูกิจกรรม"), capability("activity.event.correct", "แก้ไขกิจกรรมด้วยรายการปรับปรุง", "sensitive"),
  capability("notification.inbox.read", "ดูการแจ้งเตือนของตนเอง", "normal", ["OWN", "ALL"]), capability("notification.inbox.update", "อ่านการแจ้งเตือนของตนเอง", "normal", ["OWN", "ALL"]),
];
