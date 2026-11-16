import { adminCapabilityCatalog } from "@/lib/admin-access-contract";
import type { DataScopeType } from "@/lib/authorization";

export type GrantOverride = { permissionCode: string; scopeType: DataScopeType };

export type GrantValue = { permissionCode: string | null; scopeType: string; selectedTeamId?: string };

export type GrantPlanInput = {
  capabilityCodes: readonly string[];
  defaultScope: { scopeType: DataScopeType; selectedTeamIds: readonly string[] };
  overrides: readonly GrantOverride[];
};

/**
 * The engine reads a grant row without a permission code as "applies to the whole
 * assignment". Only when an administrator narrows a capability does the plan need
 * one row per capability, and SELECTED_TEAMS then expands per team.
 */
export function buildGrantValues(input: GrantPlanInput): GrantValue[] {
  if (!input.overrides.length) {
    return input.defaultScope.scopeType === "SELECTED_TEAMS"
      ? input.defaultScope.selectedTeamIds.map((selectedTeamId) => ({ permissionCode: null, scopeType: "SELECTED_TEAMS", selectedTeamId }))
      : [{ permissionCode: null, scopeType: input.defaultScope.scopeType }];
  }
  const overrideByCode = new Map(input.overrides.map((item) => [item.permissionCode, item.scopeType]));
  return input.capabilityCodes.flatMap((code): GrantValue[] => {
    const scopeType = overrideByCode.get(code) ?? input.defaultScope.scopeType;
    return scopeType === "SELECTED_TEAMS"
      ? input.defaultScope.selectedTeamIds.map((selectedTeamId) => ({ permissionCode: code, scopeType, selectedTeamId }))
      : [{ permissionCode: code, scopeType }];
  });
}

/**
 * When any capability is overridden the fallback scope must still be valid for
 * every other capability; otherwise the grant set would be impossible to express.
 */
export function unsupportedFallbackScope(
  capabilityCodes: readonly string[],
  defaultScope: DataScopeType,
  overrides: readonly GrantOverride[],
): { code: string; label: string } | null {
  if (!overrides.length) return null;
  const overridden = new Set(overrides.map((item) => item.permissionCode));
  for (const code of capabilityCodes) {
    if (overridden.has(code)) continue;
    const capability = adminCapabilityCatalog.find((item) => item.code === code);
    if (capability && !capability.allowedScopes.includes(defaultScope)) return { code, label: capability.labelTh };
  }
  return null;
}
