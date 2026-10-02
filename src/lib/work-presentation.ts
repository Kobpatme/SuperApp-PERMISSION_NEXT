export const workStatusPresentation: Record<string, { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger"; nextAction: string }> = {
  queued: { label: "รอเริ่ม", tone: "neutral", nextAction: "เริ่มดำเนินงาน" },
  in_progress: { label: "กำลังดำเนินการ", tone: "info", nextAction: "อัปเดตความคืบหน้า" },
  blocked: { label: "ติดขัด", tone: "warning", nextAction: "ระบุสิ่งที่ต้องช่วยแก้" },
  completed: { label: "เสร็จสิ้น", tone: "success", nextAction: "ตรวจสอบหลักฐานผลลัพธ์" },
  cancelled: { label: "ยกเลิก", tone: "danger", nextAction: "ตรวจสอบเหตุผลการยกเลิก" },
};

export function presentWorkStatus(status: string) {
  return workStatusPresentation[status] ?? { label: "สถานะยังไม่ระบุ", tone: "neutral" as const, nextAction: "ตรวจสอบรายการ" };
}

const activityLabels: Record<string, string> = {
  "work.task.created.v1": "เพิ่มงาน",
  "work.task.completed.v1": "ปิดงาน",
  "work.task.status_changed.v1": "เปลี่ยนสถานะงาน",
  "work.task.note_added.v1": "เพิ่มบันทึกงาน",
  "work.task.assigned.v1": "มอบหมายงาน",
};

export function presentWorkActivity(eventType: string) {
  return activityLabels[eventType] ?? "อัปเดตงาน";
}
