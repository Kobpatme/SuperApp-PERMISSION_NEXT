export const accessRequestStatuses = ["pending", "approved", "rejected"] as const;
export type AccessRequestStatus = (typeof accessRequestStatuses)[number];

export function accessRequestStatusLabel(status: string) {
  if (status === "approved") return "อนุมัติแล้ว";
  if (status === "rejected") return "ปฏิเสธ";
  return "รอดำเนินการ";
}

export function dataScopeLabel(scopeType: string) {
  if (scopeType === "OWN") return "เฉพาะงานของตนเอง";
  if (scopeType === "TEAM") return "ข้อมูลของทีม";
  if (scopeType === "SELECTED_TEAMS") return "ข้อมูลของทีมที่เลือก";
  if (scopeType === "ALL") return "ข้อมูลทั้งหมด";
  return scopeType;
}

export type AccessDecisionNotice = { type: string; title: string; body: string; href: string };

/**
 * The decision must reach the requester even though approval revokes their
 * sessions: without a notification they would be logged out with no explanation.
 */
export function accessDecisionNotification(input: {
  decision: "approved" | "rejected";
  moduleName: string;
  roleName?: string | null;
  scopeLabel?: string | null;
  note?: string | null;
}): AccessDecisionNotice {
  if (input.decision === "approved") {
    const details = [input.roleName ? `บทบาท ${input.roleName}` : null, input.scopeLabel ? `ขอบเขต ${input.scopeLabel}` : null]
      .filter(Boolean).join(" · ");
    return {
      type: "access.request.approved",
      title: `ได้รับสิทธิ์ใช้งาน ${input.moduleName} แล้ว`,
      body: `${details || "ผู้ดูแลระบบได้มอบสิทธิ์ให้"} · กรุณาเข้าสู่ระบบใหม่เพื่อเริ่มใช้งาน`,
      href: "/",
    };
  }
  return {
    type: "access.request.rejected",
    title: `คำขอใช้ ${input.moduleName} ไม่ได้รับอนุมัติ`,
    body: input.note ? `เหตุผล: ${input.note}` : "ผู้ดูแลระบบไม่ได้ระบุเหตุผล",
    href: "/",
  };
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
