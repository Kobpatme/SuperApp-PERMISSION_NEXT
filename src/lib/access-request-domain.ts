export const accessRequestStatuses = ["pending", "approved", "rejected"] as const;
export type AccessRequestStatus = (typeof accessRequestStatuses)[number];

export function accessRequestStatusLabel(status: string) {
  if (status === "approved") return "อนุมัติแล้ว";
  if (status === "rejected") return "ปฏิเสธ";
  return "รอดำเนินการ";
}

/** Requester-facing text rules, kept pure so both the action and tests share them. */
export function validateAccessReason(value: unknown): { ok: true; reason: string } | { ok: false; message: string } {
  const reason = String(value ?? "").replace(/\s+/g, " ").trim();
  if (reason.length < 10) return { ok: false, message: "กรุณาระบุเหตุผลอย่างน้อย 10 ตัวอักษร" };
  if (reason.length > 500) return { ok: false, message: "เหตุผลต้องไม่เกิน 500 ตัวอักษร" };
  return { ok: true, reason };
}

/** A rejection must say why, otherwise the requester cannot act on it. */
export function validateAccessDecision(decision: string, note: unknown): { ok: true; note: string | null } | { ok: false; message: string } {
  if (decision !== "approve" && decision !== "reject") return { ok: false, message: "การตัดสินใจไม่ถูกต้อง" };
  const text = String(note ?? "").replace(/\s+/g, " ").trim();
  if (decision === "reject" && text.length < 5) return { ok: false, message: "การปฏิเสธต้องระบุเหตุผลอย่างน้อย 5 ตัวอักษร" };
  if (text.length > 300) return { ok: false, message: "หมายเหตุต้องไม่เกิน 300 ตัวอักษร" };
  return { ok: true, note: text || null };
}
