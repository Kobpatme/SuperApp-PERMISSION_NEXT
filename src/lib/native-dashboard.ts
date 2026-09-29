import "server-only";
import type { AccessContext } from "@/lib/access";
import type { DashboardItem, DashboardSource } from "@/lib/dashboard";
import { getSmartWorkQueue, workflowLabels } from "@/lib/deposit-v2-domain";
import { listDepositWorkItems, type DepositRecord } from "@/lib/deposit-v2-server";
import { getWorkReadModel } from "@/lib/work-read-model";

export async function loadNativeDashboardSource(moduleId: string, access: AccessContext): Promise<{ source: DashboardSource; items: DashboardItem[] }> {
  if (!access.allowed) return { source: { moduleId, status: "not_configured", itemCount: 0, message: "บัญชีนี้ไม่มีสิทธิ์เข้าถึง" }, items: [] };
  if (moduleId === "work") {
    const model = await getWorkReadModel(access);
    return { source: model.source, items: model.items };
  }
  if (moduleId === "guarantees") {
    const result = await listDepositWorkItems(250);
    const queue = getSmartWorkQueue(result.items).slice(0, 100);
    const items: DashboardItem[] = queue.map(({ item: rawItem, priority, workflowKey, reasons, dueDate }) => {
      const item = rawItem as DepositRecord;
      return {
      id: item.id, moduleId: "guarantees", kind: "guarantee", title: item.place || item.cid || "รายการเงินประกัน",
      code: item.cid || item.no, description: reasons.join(" · "), href: `/guarantees/${item.id}`,
      statusLabel: workflowLabels[workflowKey] ?? workflowKey, priority: priority === "high" ? "urgent" : priority === "medium" ? "attention" : "normal",
      dueAt: dueDate?.toISOString(), updatedAt: item.updatedAt, ownerId: item.ownerId, ownerName: item.owner || undefined,
      buildingName: item.place || undefined, nextAction: reasons[0] ?? "ตรวจสอบขั้นตอนเงินประกัน" };
    });
    const status = result.state === "ready" ? "ready" : result.state;
    return { source: { moduleId, status, itemCount: items.length, message: status === "ready" ? "ข้อมูลภายในพร้อมใช้งาน" : "โหลดข้อมูลเงินประกันไม่สำเร็จ" }, items };
  }
  return { source: { moduleId, status: "ready", itemCount: 0, message: "ไม่มีรายการที่ต้องดำเนินการ" }, items: [] };
}
