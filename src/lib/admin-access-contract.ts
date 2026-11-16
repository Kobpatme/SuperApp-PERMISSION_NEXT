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

export type OwnRoleLockoutInput = {
  isPlatformAdmin: boolean;
  actingOnOwnActiveAssignment: boolean;
  nextCapabilityCodes: readonly string[];
  otherActiveRoleGrantsRoleManage: boolean;
};

/**
 * An administrator must not be able to remove role management from the only place
 * they hold it: without another administrator the screen that could restore the
 * permission is exactly the one they can no longer reach.
 * Platform administrators bypass capability checks, so nothing is blocked for them.
 */
export function ownRoleLockoutMessage(input: OwnRoleLockoutInput): string | null {
  if (input.isPlatformAdmin || !input.actingOnOwnActiveAssignment) return null;
  if (input.nextCapabilityCodes.includes("core.role.manage") || input.otherActiveRoleGrantsRoleManage) return null;
  return "ถอดสิทธิ์จัดการบทบาทของตนเองไม่ได้ เพราะจะไม่เหลือทางจัดการสิทธิ์อีก ต้องให้ผู้ดูแลระบบอีกคนยืนยัน";
}

export type CapabilityScopeOverride = { permissionCode: string; scopeType: DataScopeType };

/**
 * Per-capability data scopes. The engine accepts grants keyed by permission code,
 * so an administrator can read across every team yet edit only their own rows.
 * Every override must stay inside the scopes the capability declares, which the
 * manifest already pins (for example guarantee.tl.work is own-rows only).
 */
export function parseCapabilityScopeOverrides(
  entries: ReadonlyArray<{ code: string; scope: string }>,
  grantedCodes: readonly string[],
): CapabilityScopeOverride[] {
  const granted = new Set(grantedCodes);
  const seen = new Set<string>();
  const overrides: CapabilityScopeOverride[] = [];
  for (const entry of entries) {
    if (seen.has(entry.code) || !granted.has(entry.code) || !entry.scope || entry.scope === "DEFAULT") continue;
    const capability = adminCapabilityCatalog.find((item) => item.code === entry.code);
    if (!capability) throw new Error("UNKNOWN_CAPABILITY");
    if (!["OWN", "TEAM", "SELECTED_TEAMS", "ALL"].includes(entry.scope)) throw new Error("INVALID_SCOPE");
    if (!capability.allowedScopes.includes(entry.scope as DataScopeType)) throw new Error("SCOPE_NOT_ALLOWED");
    seen.add(entry.code);
    overrides.push({ permissionCode: entry.code, scopeType: entry.scope as DataScopeType });
  }
  return overrides;
}
