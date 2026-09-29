import { z } from "zod";

export const capabilitySchema = z.object({
  code: z.string().regex(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/),
  labelTh: z.string().min(1), descriptionTh: z.string().default(""),
  allowedScopes: z.array(z.enum(["OWN", "TEAM", "SELECTED_TEAMS", "ALL"])).min(1),
  risk: z.enum(["normal", "sensitive", "administrative"]).default("normal"),
});
export type ModuleCapability = z.infer<typeof capabilitySchema>;
export const moduleManifestSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/), version: z.string().regex(/^\d+\.\d+\.\d+$/),
  number: z.number().int().positive(), href: z.string().regex(/^\/[a-z][a-z0-9/-]*$/),
  name: z.string().min(1), shortLabel: z.string().min(1), description: z.string(), purpose: z.string(),
  repository: z.string(), owner: z.string().min(1),
  accent: z.enum(["violet", "blue", "amber"]), searchTerms: z.array(z.string()),
  icon: z.enum(["work", "buildings", "guarantees", "team", "settings"]),
  group: z.enum(["work", "operations", "finance", "reports", "management"]), order: z.number().int(),
  lifecycle: z.enum(["development", "pilot", "active", "maintenance", "disabled", "retired"]),
  enabledByDefault: z.boolean(), capabilities: z.array(capabilitySchema).min(1),
  entryPermissions: z.array(z.string()).min(1),
  dashboardProvider: z.string().optional(), searchProvider: z.string().optional(),
});
export type ModuleManifest = z.infer<typeof moduleManifestSchema>;

/** Reject invalid contracts before any consumer can use them. */
export function defineModuleRegistry(input: unknown): ModuleManifest[] {
  const manifests = z.array(moduleManifestSchema).parse(input);
  for (const field of ["id", "href"] as const) {
    if (new Set(manifests.map(module => module[field])).size !== manifests.length) throw new Error(`Duplicate module ${field}`);
  }
  const codes = manifests.flatMap(module => module.capabilities.map(capability => capability.code));
  if (new Set(codes).size !== codes.length) throw new Error("Duplicate capability code");
  for (const manifest of manifests) {
    if (!manifest.entryPermissions.every(code => manifest.capabilities.some(capability => capability.code === code))) throw new Error("Module entry permission must be declared");
  }
  return manifests.sort((a, b) => a.order - b.order);
}

export function isModuleEnabled(module: ModuleManifest) {
  return module.enabledByDefault && module.lifecycle === "active";
}

export function visibleModules(registry: readonly ModuleManifest[], granted: readonly string[]) {
  return registry.filter(module => isModuleEnabled(module) && module.entryPermissions.some(code => granted.includes(code)));
}

export function capabilityCatalog(registry: readonly ModuleManifest[]) {
  return registry.flatMap(module => module.capabilities.map(capability => ({ ...capability, moduleId: module.id, moduleName: module.name })));
}
