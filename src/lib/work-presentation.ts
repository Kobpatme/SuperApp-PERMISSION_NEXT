export const workStatusPresentation: Record<string, { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger"; nextAction: string }> = {
  queued: { label: "รอเริ่ม", tone: "neutral", nextAction: "เริ่มดำเนินงาน" },
  in_progress: { label: "กำลังดำเนินการ", tone: "info", nextAction: "อัปเดตความคืบหน้า" },
  blocked: { label: "ติดขัด", tone: "warning", nextAction: "ระบุสิ่งที่ต้องช่วยแก้" },
  completed: { label: "เสร็จสิ้น", tone: "success", nextAction: "ตรวจสอบหลักฐานผลลัพธ์" },
  cancelled: { label: "ยกเลิก", tone: "danger", nextAction: "ตรวจสอบเหตุผลการยกเลิก" },
};

export function presentWorkStatus(status: string) {
  return workStatusPresentation[status] ?? { label: status, tone: "neutral" as const, nextAction: "ตรวจสอบรายการ" };
}
