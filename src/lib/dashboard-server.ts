import "server-only";

import { cache } from "react";
import { orderDashboardItems, type DashboardSnapshot } from "@/lib/dashboard";
import type { AccessContext } from "@/lib/access";
import { modules, type ModuleId } from "@/lib/module-registry";
import { isModuleEnabled } from "@/lib/module-contract";
import { loadNativeDashboardSource } from "@/lib/native-dashboard";

export const buildDashboardSnapshot = cache(async function buildDashboardSnapshot(accessByModule: Record<ModuleId, AccessContext>): Promise<DashboardSnapshot> {
  const moduleIds = modules.filter(module => isModuleEnabled(module) && accessByModule[module.id]?.allowed).map(module => module.id);
  const results = await Promise.all(moduleIds.map((moduleId) => loadNativeDashboardSource(moduleId, accessByModule[moduleId])));
  return {
    generatedAt: new Date().toISOString(),
    items: orderDashboardItems(results.flatMap((result) => result.items)),
    sources: results.map((result) => result.source),
  };
});
