import "server-only";

import { cache } from "react";
import { dashboardSourcePayloadSchema, orderDashboardItems, type DashboardItem, type DashboardSnapshot, type DashboardSource } from "@/lib/dashboard";
import type { AccessContext } from "@/lib/access";
import { modules, type ModuleId } from "@/lib/module-registry";
import { isModuleEnabled } from "@/lib/module-contract";

const sourceConfig: Record<ModuleId, { env: string; defaultHref: string; label: string }> = {
  work: { env: "DASHBOARD_WORK_SOURCE_URL", defaultHref: "/work", label: "MAXIWA KPI" },
  buildings: { env: "DASHBOARD_BUILDINGS_SOURCE_URL", defaultHref: "/buildings", label: "ค่าใช้จ่ายอาคาร" },
  guarantees: { env: "DASHBOARD_GUARANTEES_SOURCE_URL", defaultHref: "/guarantees", label: "คืนเงินประกันอาคาร" },
};

function configuredUrl(moduleId: ModuleId) {
  const value = process.env[sourceConfig[moduleId].env]?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

async function loadSource(moduleId: ModuleId, access: AccessContext): Promise<{ source: DashboardSource; items: DashboardItem[] }> {
  const config = sourceConfig[moduleId];
  if (!config) return { source: { moduleId, status: "not_configured", itemCount: 0, message: "ยังไม่มีแหล่งข้อมูลสำหรับโมดูลนี้" }, items: [] };
  if (!access.allowed) return { source: { moduleId, status: "not_configured", itemCount: 0, message: "บัญชีนี้ไม่มีสิทธิ์เข้าถึง" }, items: [] };
  const url = configuredUrl(moduleId);
  if (!url) return { source: { moduleId, status: "not_configured", itemCount: 0, message: "รอเชื่อม API สรุปจากระบบต้นทาง" }, items: [] };

  const headers = new Headers({
    accept: "application/json",
    "x-permission-user-id": access.userId,
    "x-permission-user-email": access.email,
  });
  const secret = process.env.DASHBOARD_INTEGRATION_SECRET;
  if (secret) headers.set("x-permission-integration-secret", secret);

  try {
    const response = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(4_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = dashboardSourcePayloadSchema.parse(await response.json());
    const items = payload.items.map((item) => ({
      ...item,
      moduleId,
      href: item.href || config.defaultHref,
    }));
    return { source: { moduleId, status: "ready", itemCount: items.length, message: items.length ? "เชื่อมต่อแล้ว" : "ไม่มีรายการที่ต้องติดตาม" }, items };
  } catch (error) {
    console.error(`Dashboard source ${moduleId} is unavailable`, error);
    return { source: { moduleId, status: "unavailable", itemCount: 0, message: "เชื่อมต่อข้อมูลไม่สำเร็จ" }, items: [] };
  }
}

export const buildDashboardSnapshot = cache(async function buildDashboardSnapshot(accessByModule: Record<ModuleId, AccessContext>): Promise<DashboardSnapshot> {
  const moduleIds = modules.filter(module => isModuleEnabled(module) && accessByModule[module.id]?.allowed).map(module => module.id);
  const results = await Promise.all(moduleIds.map((moduleId) => loadSource(moduleId, accessByModule[moduleId])));
  return {
    generatedAt: new Date().toISOString(),
    items: orderDashboardItems(results.flatMap((result) => result.items)),
    sources: results.map((result) => result.source),
  };
});
