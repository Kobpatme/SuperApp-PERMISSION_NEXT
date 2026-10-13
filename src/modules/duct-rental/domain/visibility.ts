import { requestPhases } from "./source-policy";
type Request = { currentPhase: string; phaseStatuses?: Record<string, string> };
// Inputs are derived from verified Core capabilities. Legacy role names never grant access.
export function visibleForPhases(owned: readonly string[], request: Request, globalReader = false) {
  return globalReader || owned.some(phase => request.currentPhase === phase || (request.phaseStatuses?.[phase] !== undefined && request.phaseStatuses[phase] !== "pending"));
}
export function preferredPhase(owned: readonly string[], request: Request, globalReader = false) {
  if (globalReader) return request.currentPhase;
  return [...owned].filter(phase => request.currentPhase === phase || (request.phaseStatuses?.[phase] !== undefined && request.phaseStatuses[phase] !== "pending"))
    .sort((a, b) => requestPhases.indexOf(b as typeof requestPhases[number]) - requestPhases.indexOf(a as typeof requestPhases[number]))[0] ?? request.currentPhase;
}
export function visibleFile(groups: readonly string[], phase: string, kind?: string) {
  return groups.some(group => group === "global" || group === "permission" || group === "thirdparty"
    || (group === "design" && kind !== "invoice") || (group === "draftsman" && kind !== "invoice" && kind !== "memo")
    || (group === "install" && ["DRAFTSMAN", "PERMISSION_1", "INSTALL"].includes(phase) && (!kind || ["drawing", "permission_letter", "confirmation_form"].includes(kind))));
}
