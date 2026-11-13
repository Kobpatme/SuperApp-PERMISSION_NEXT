import "server-only";
import { randomUUID } from "node:crypto";
import type { AccessContext } from "@/lib/access";
import type { DashboardItem, DashboardSource, DashboardSourceStatus } from "@/lib/dashboard";
import { bookingStatus } from "@/lib/car-booking-display";
import { readCarOpenBookings, type CarBookingContext } from "@/lib/car-booking-service";
import { getSmartWorkQueue, workflowLabels } from "@/lib/deposit-v2-domain";
import { listDepositWorkItems, type DepositRecord } from "@/lib/deposit-v2-server";
import { readWorkQueue } from "@/lib/work-queue-server";
import { listPermissionBuildings } from "@/lib/permission-building-server";
import type { BuildingQuery } from "@/lib/building-query";
import { listProjects as listRouteProjects,listSites } from "@/modules/permission-out/service";

export async function loadNativeDashboardSource(moduleId: string, access: AccessContext): Promise<{ source: DashboardSource; items: DashboardItem[] }> {
  if (!access.allowed) return { source: { moduleId, status: "not_configured", itemCount: 0, message: "บัญชีนี้ไม่มีสิทธิ์เข้าถึง" }, items: [] };
  if(moduleId==="site-facility"){
    try{const result=await listSites({userId:access.userId});const items:DashboardItem[]=result.rows.slice(0,10).map(row=>({id:`${row.datasetId}:${row.key}`,moduleId,kind:"document",priority:"normal",title:row.data.name||row.key,href:`/site-facility?q=${encodeURIComponent(row.key)}`,statusLabel:"ข้อมูลไซต์"}));return {source:{moduleId,status:"ready",itemCount:items.length,message:`${result.total} ไซต์ในขอบเขตสิทธิ์`},items};}
    catch{return {source:{moduleId,status:"unavailable",itemCount:0,message:"โหลดข้อมูลไซต์ไม่สำเร็จ"},items:[]};}
  }
  if (moduleId === "permission-out") {
    try {
      const rows = await listRouteProjects({ userId: access.userId });
      const items: DashboardItem[] = rows.slice(0,10).map(row => ({ id: row.id, moduleId, kind: "document", priority: "normal", title: row.title, href: `/permission-out?project=${row.id}`, statusLabel: "ผลวิเคราะห์ที่บันทึก", updatedAt: row.createdAt }));
      return { source: { moduleId, status: "ready", itemCount: items.length, message: "โครงการวิเคราะห์ล่าสุด" }, items };
    } catch { return { source: { moduleId, status: "unavailable", itemCount: 0, message: "โหลดข้อมูลวิเคราะห์เส้นทางไม่สำเร็จ" }, items: [] }; }
  }
  if (moduleId === "work") {
    try { const items = await readWorkQueue(access); return { source: { moduleId, status: "ready", itemCount: items.length, message: "ข้อมูลพร้อมใช้งาน" }, items }; }
    catch { return { source: { moduleId, status: "unavailable", itemCount: 0, message: "โหลดข้อมูลงานไม่สำเร็จ" }, items: [] }; }
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
  if (moduleId === "buildings") return loadBuildingsDashboard();
  if (moduleId === "car-booking") return loadCarBookingDashboard(access);
  return { source: { moduleId, status: "ready", itemCount: 0, message: "ไม่มีรายการที่ต้องดำเนินการ" }, items: [] };
}

async function loadBuildingsDashboard(): Promise<{ source: DashboardSource; items: DashboardItem[] }> {
  const query: BuildingQuery = {
    query: "", buildingId: "", page: 1, limit: 20, after: "", before: "",
    status: "", group: "", type: "", installType: "", surveyType: "", area: "",
  };
  const result = await listPermissionBuildings(query);
  const items: DashboardItem[] = result.items
    .filter((item) => item.status !== "Permission Confirmed")
    .slice(0, 20)
    .map((item) => ({
      id: item.id,
      moduleId: "buildings",
      kind: "building",
      priority: "normal",
      title: item.nameTh || item.code || "อาคารไม่ทราบชื่อ",
      description: [item.address, item.province].filter(Boolean).join(" · ") || undefined,
      href: `/buildings/${item.id}`,
      statusLabel: item.status || "ไม่ระบุสถานะ",
      code: item.code || undefined,
      updatedAt: item.updateDate || undefined,
    }));
  const status: DashboardSourceStatus = result.state;
  return {
    source: { moduleId: "buildings", status, itemCount: items.length,
      message: status === "ready" ? (items.length ? "มีอาคารที่ต้องดำเนินการ" : "ไม่มีอาคารค้างดำเนินการ") : "โหลดข้อมูลอาคารไม่สำเร็จ" },
    items,
  };
}

async function loadCarBookingDashboard(access: AccessContext): Promise<{ source: DashboardSource; items: DashboardItem[] }> {
  let items: DashboardItem[] = [];
  let status: DashboardSourceStatus = "ready";
  let message = "ไม่มีรายการจองรถค้างอยู่";
  try {
    const context: CarBookingContext = { actorId: access.userId, displayName: access.displayName, requestId: randomUUID() };
    const rows = await readCarOpenBookings(context, 0);
    items = rows.slice(0, 20).map((booking) => ({
      id: booking.id,
      moduleId: "car-booking",
      kind: "task",
      priority: "normal",
      title: booking.destination || "การจองรถ",
      description: booking.employeeName ? `จองโดย ${booking.employeeName}` : undefined,
      href: "/car-booking",
      statusLabel: bookingStatus(booking.status, booking.startTime.toISOString(), Date.now()),
      code: booking.id,
      ownerId: booking.userId,
      ownerName: booking.employeeName || undefined,
      dueAt: booking.startTime.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
    }));
    message = items.length ? `${items.length} รายการรถที่ยังไม่คืน` : "ไม่มีรายการจองรถค้างอยู่";
  } catch (error) {
    console.error("Unable to load open car bookings", error);
    status = "unavailable";
    message = "โหลดรายการจองรถไม่สำเร็จ";
  }
  return { source: { moduleId: "car-booking", status, itemCount: items.length, message }, items };
}
