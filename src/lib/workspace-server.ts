import "server-only";
import { cache } from "react";
import { getAccessContext, type AccessContext } from "@/lib/access";
import { buildDashboardSnapshot } from "@/lib/dashboard-server";
import { modules, type ModuleId } from "@/lib/module-registry";

export const getWorkspaceData = cache(async function getWorkspaceData(previewRequested = false) {
  const access = await Promise.all(modules.map((module) => getAccessContext(module.id)));
  const allowedModuleIds = modules.filter((_, index) => access[index].allowed).map((module) => module.id);
  const identity = access.find((item) => item.userId) || access[0];
  const developmentMode = process.env.NODE_ENV === "development" && Boolean(identity?.isDevelopmentSession);
  const preview = developmentMode && previewRequested;
  const accessByModule = Object.fromEntries(modules.map((module, index) => [module.id, access[index]])) as Record<ModuleId, AccessContext>;
  const snapshot = preview
    ? (await import("@/lib/workspace-preview")).buildPreviewSnapshot(allowedModuleIds, identity.userId)
    : await buildDashboardSnapshot(accessByModule);
  return { snapshot: { ...snapshot, items: snapshot.items.filter((item) => allowedModuleIds.includes(item.moduleId)), sources: snapshot.sources.filter((source) => allowedModuleIds.includes(source.moduleId)) }, identity, allowedModuleIds, accessByModule, developmentMode, preview };
});
