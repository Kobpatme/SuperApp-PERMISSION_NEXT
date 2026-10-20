import { capabilities } from "@/lib/module-registry";
import type { DataScopeType } from "@/lib/authorization";

export const adminCapabilityCatalog = capabilities;
export const adminCapabilityCodes = new Set(adminCapabilityCatalog.map((item) => item.code));

export function parseCatalogCapabilities(values: FormDataEntryValue[]) {
  const unique = [...new Set(values.map(String))];
  if (unique.some((code) => !adminCapabilityCodes.has(code))) throw new Error("UNKNOWN_CAPABILITY");
  return unique;
}

export function parseAssignmentScope(scopeValue: FormDataEntryValue | null, selectedValues: FormDataEntryValue[]) {
  const scopeType = String(scopeValue || "OWN") as DataScopeType;
  if (!(["OWN", "TEAM", "SELECTED_TEAMS", "ALL"] as const).includes(scopeType)) throw new Error("INVALID_SCOPE");
  const selectedTeamIds = [...new Set(selectedValues.map(String).filter((id) => /^[0-9a-f-]{36}$/i.test(id)))];
  if (scopeType === "SELECTED_TEAMS" && selectedTeamIds.length === 0) throw new Error("SELECTED_TEAMS_REQUIRED");
  return { scopeType, selectedTeamIds: scopeType === "SELECTED_TEAMS" ? selectedTeamIds : [] };
}

export function effectiveCapabilityGroups(codes: readonly string[]) {
  const granted = new Set(codes);
  return adminCapabilityCatalog.reduce<Record<string, { moduleName: string; capabilities: typeof adminCapabilityCatalog }>>((groups, item) => {
    if (!granted.has(item.code)) return groups;
    const group = groups[item.moduleId] ?? { moduleName: item.moduleName, capabilities: [] };
    group.capabilities.push(item);
    groups[item.moduleId] = group;
    return groups;
  }, {});
}
