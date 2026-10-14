import { draftsmanNextPhase, type RequestPhase, type PhaseStatus } from "./source-policy";

export const phaseResource: Record<Exclude<RequestPhase, "COMPLETE">, string> = {
  DESIGN: "design", DRAFTSMAN: "draftsman", PERMISSION_1: "permission1", INSTALL: "install",
  DRAFTSMAN_2: "draftsman2", PERMISSION_2: "permission2", "3RD_PARTY_1": "thirdparty1",
  PERMISSION_3: "permission3", "3RD_PARTY_2": "thirdparty2",
};
export function phasePermission(phase: RequestPhase, action: "accept" | "submit") {
  if (phase === "COMPLETE") throw new Error("งานเสร็จสมบูรณ์แล้ว");
  return `duct_rental.${phaseResource[phase]}.${action}`;
}
export function nextPhase(phase: RequestPhase, ownerDuct: string): RequestPhase {
  if (phase === "DRAFTSMAN") return draftsmanNextPhase(ownerDuct);
  const next: Partial<Record<RequestPhase, RequestPhase>> = {
    DESIGN: "DRAFTSMAN", PERMISSION_1: "INSTALL", INSTALL: "DRAFTSMAN_2", DRAFTSMAN_2: "PERMISSION_2",
    PERMISSION_2: "3RD_PARTY_1", "3RD_PARTY_1": "PERMISSION_3", PERMISSION_3: "3RD_PARTY_2", "3RD_PARTY_2": "COMPLETE",
  };
  if (!next[phase]) throw new Error("ไม่มีขั้นตอนถัดไป");
  return next[phase]!;
}
export function assertPhaseAction(status: PhaseStatus, action: "accept" | "submit", phase?: RequestPhase) {
  if (phase === "DESIGN" && action === "submit" && status === "pending") return;
  if (status !== (action === "accept" ? "pending" : "accepted")) throw new Error("สถานะงานไม่ตรงกับคำสั่ง กรุณาโหลดข้อมูลใหม่");
}
export const renewalTransitions = {
  draft: { next: "sent_to_3rdparty", permission: "duct_rental.renewal.review" },
  sent_to_3rdparty: { next: "memo_preparing", permission: "duct_rental.renewal.memo" },
  memo_preparing: { next: "provider_confirmed", permission: "duct_rental.renewal.confirm" },
  provider_confirmed: { next: "contracted", permission: "duct_rental.renewal.contract" },
} as const;
export const cancellationTransitions = { cancel_initiated: "in_progress", in_progress: "tracking", tracking: "completed" } as const;
