import type { RequestPhase } from "./source-policy";
export function submissionDocumentsReady(phase: RequestPhase, files: readonly { fileType: string; phase?: string }[], signed = false) {
  const has = (kind: string, stage?: string) => files.some(file => file.fileType === kind && (!stage || file.phase === stage));
  if (phase === "DRAFTSMAN" || phase === "DRAFTSMAN_2") return has("drawing", phase);
  if (phase === "INSTALL") return has("confirmation_form", phase);
  if (phase === "PERMISSION_1") return has("nt_form") && signed && has("permission_letter") && has("confirmation_form");
  if (phase === "3RD_PARTY_1") return has("rate_notice") && has("invoice");
  if (phase === "3RD_PARTY_2") return has("contract") && has("receipt");
  return true;
}
