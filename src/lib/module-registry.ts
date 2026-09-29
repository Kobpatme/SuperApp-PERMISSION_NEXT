import { defineModuleRegistry, capabilityCatalog } from "@/lib/module-contract";
import { buildingCapabilities, coreCapabilities, guaranteeCapabilities, workCapabilities } from "@/lib/capabilities";

export const modules = defineModuleRegistry([
  {
    id: "work",
    version: "1.0.0", owner: "Operations", icon: "work", group: "work", order: 10,
    lifecycle: "active", enabledByDefault: true, capabilities: workCapabilities,
    entryPermissions: ["work.task.read"], dashboardProvider: "work", searchProvider: "work",
    number: 1,
    href: "/work",
    name: "งานและ KPI",
    shortLabel: "งาน",
    description: "จัดการงาน ติดตามผล และตรวจสอบความคืบหน้าของทีม",
    purpose: "งานและผลการดำเนินงาน",
    repository: "Kobpatme/maxiwa_KPI",
    accent: "violet",
    searchTerms: ["maxiwa", "kpi", "งาน", "sla", "performance"],
  },
  {
    id: "buildings",
    version: "1.0.0", owner: "Operations", icon: "buildings", group: "operations", order: 20,
    lifecycle: "active", enabledByDefault: true, capabilities: buildingCapabilities,
    entryPermissions: ["building.record.read"], dashboardProvider: "buildings", searchProvider: "buildings",
    number: 2,
    href: "/buildings",
    name: "อาคารและค่าใช้จ่าย",
    shortLabel: "อาคาร",
    description: "ค้นหาข้อมูลอาคาร ค่าใช้จ่าย ใบเสนอราคา และเอกสารภายใน",
    purpose: "อาคารและเอกสาร",
    repository: "Kobpatme/Permission_Next",
    accent: "blue",
    searchTerms: ["permission", "อาคาร", "ค่าใช้จ่าย", "เอกสาร", "nas", "drawing"],
  },
  {
    id: "guarantees",
    version: "1.0.0", owner: "Operations", icon: "guarantees", group: "operations", order: 30,
    lifecycle: "active", enabledByDefault: true, capabilities: guaranteeCapabilities,
    entryPermissions: ["guarantee.case.read", "guarantee.tl.work"], dashboardProvider: "guarantees", searchProvider: "guarantees",
    number: 3,
    href: "/guarantees",
    name: "เงินประกัน",
    shortLabel: "เงินประกัน",
    description: "ติดตามเอกสาร ขั้นตอน และสถานะการขอคืนเงินประกัน",
    purpose: "เงินประกันและการติดตาม",
    repository: "Kobpatme/maxiwa",
    accent: "amber",
    searchTerms: ["คืนเงิน", "ประกัน", "อาคาร", "ติดตาม", "เอกสาร"],
  },
]);

export const capabilities = [...coreCapabilities.map(capability => ({ ...capability, moduleId: "core", moduleName: "ระบบกลาง" })), ...capabilityCatalog(modules)];

export const overviewDestination = {
  id: "overview",
  href: "/",
  name: "ภาพรวม",
  shortLabel: "HOME",
  description: "งานเร่งด่วนและรายการที่ต้องติดตามจากทุกระบบ",
  searchTerms: ["home", "หน้าหลัก", "ภาพรวม", "workspace"],
} as const;

export type ModuleId = (typeof modules)[number]["id"];

export function getModule(id: string) {
  return modules.find((module) => module.id === id);
}

export function getModuleIcon(id: string) {
  return getModule(id)?.icon ?? "work";
}

export function isModuleId(value: string): value is ModuleId {
  return modules.some((module) => module.id === value);
}
