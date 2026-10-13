import type { ModuleCapability, ModuleManifest } from "./module-contract";

export const moduleLifecycleCapability: ModuleCapability = { code: "core.module.manage", labelTh: "เปิดหรือปิดโมดูล", descriptionTh: "เปิดหรือปิดการใช้งานโมดูลโดยคงสิทธิ์และประวัติข้อมูล", risk: "administrative", allowedScopes: ["ALL"] };
export function effectiveModuleEnabled(module: ModuleManifest, override?: boolean) {
  return module.lifecycle === "active" && (override ?? module.enabledByDefault);
}
