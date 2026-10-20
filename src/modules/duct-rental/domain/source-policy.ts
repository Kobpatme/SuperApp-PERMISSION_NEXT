// Pure source behavior: METRIX f87220b, lib/utils.ts, processTracking.ts and phase/list handlers.
// Authorization belongs to Core. These functions never grant access or mutate a record.
export const requestPhases = ["DESIGN", "DRAFTSMAN", "PERMISSION_1", "INSTALL", "DRAFTSMAN_2", "PERMISSION_2", "3RD_PARTY_1", "PERMISSION_3", "3RD_PARTY_2", "COMPLETE"] as const;
export type RequestPhase = typeof requestPhases[number];
export type PhaseStatus = "pending" | "accepted" | "done";
export type DocumentGate = { currentPhase: string; missingDocs?: string; files?: { name?: string; fileType?: string }[] };

export function isMemoMissing(request: DocumentGate) {
  if (request.currentPhase === "DESIGN") return false;
  return !(request.files || []).some(file => file.fileType === "memo" || (file.name?.toLowerCase() || "").includes("memo"));
}
export function hasIncompleteRequiredDocuments(request: DocumentGate) {
  return Boolean(request.missingDocs?.trim()) || isMemoMissing(request);
}
export function listDocumentsIncomplete(request: DocumentGate) {
  // METRIX-BUG: list treats whitespace notes as incomplete while completion trims them (DQ04).
  return Boolean(request.missingDocs) || isMemoMissing(request);
}
export function draftsmanNextPhase(owner?: string | null): RequestPhase {
  const normalized = (owner ?? "").trim().toUpperCase();
  return normalized.length > 0 && normalized !== "NT" ? "3RD_PARTY_1" : "PERMISSION_1";
}
export function workflowStatus(request: { currentPhase: string; cancelledAt?: string; phaseStatuses?: Record<string, string> }) {
  if (request.cancelledAt) return "CANCELLED";
  if (request.currentPhase === "COMPLETE") return "ACTIVE";
  return (request.phaseStatuses?.[request.currentPhase] || "pending").toUpperCase();
}
export function normalizeCancellationStatus(status: string) {
  return status === "pending" ? "cancel_initiated" : status === "approved" ? "completed" : status;
}
export function getRenewOwner(status: string) {
  if (["sent_to_3rdparty", "provider_confirmed", "approved"].includes(status)) return "3rd Party";
  if (status === "memo_preparing") return "Team Permission";
  if (status === "contracted") return "Completed";
  return "Team Design";
}
export function getCancelOwner(status: string) {
  if (status === "completed" || status === "approved") return "Completed";
  if (status === "rejected") return "Team Design";
  return "Team Permission";
}
export const processSlaDays = { Renew: 7, Cancel: 5 } as const;
export function addDays(dateText: string, days: number) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return "";
  // Bangkok has no DST. UTC date arithmetic preserves the source result independently of host TZ.
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}
export function getSlaStatus(start: string, days: number, completedAt?: string | null, now = new Date()) {
  if (completedAt) return "Completed";
  const due = new Date(addDays(start, days));
  if (Number.isNaN(due.getTime())) return "On Track";
  // METRIX-BUG: <24h late is ceil(-fraction) === -0 and remains Near Due. Preserve pending DQ04.
  const left = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
  return left < 0 ? "Overdue" : left <= 1 ? "Near Due" : "On Track";
}
export function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "2-digit", month: "short", year: "numeric" });
}
